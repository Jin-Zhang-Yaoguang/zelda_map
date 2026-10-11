import type { AccountIdentity, AccountProgressController, AccountSnapshot, CloudRow, TransferBackup, TransferPreview, TransferSource } from './types';
import { createAccountStorage } from './storage';
import type { AccountEnvelope, AccountStorage, QueuedJob } from './storage';
import { readCloudConfiguration, getCloudClient } from '../cloud/client';
import type { CloudConfiguration } from '../cloud/client';
import { createAccountAuth } from '../cloud/auth';
import type { AccountAuth } from '../cloud/auth';
import { createAccountRepository } from '../cloud/repository';
import type { AccountRepository, Mutation } from '../cloud/repository';
import { failure, normalizeError } from '../cloud/errors';
import { STORAGE } from '../progress';

// 第二参数仅用于可控适配器自测；生产调用始终使用官方SDK和真实IndexedDB。
export interface ControllerDependencies { config?: CloudConfiguration; auth?: AccountAuth; repository?: AccountRepository; storage?: AccountStorage; online?:()=>boolean; uuid?:()=>string; now?:()=>number }
export function createAccountProgressController(options:{knownIds:ReadonlySet<string>;dataVersion:string}, dependencies:ControllerDependencies={}):AccountProgressController {
  const ids=[...options.knownIds].sort(); if(ids.length!==136||ids.some((id,i)=>id!==`Dungeon${String(i).padStart(3,'0')}`))throw failure('sync','invalidShrineCatalog');
  const known=new Set(ids), config=dependencies.config??readCloudConfiguration();
  const client=dependencies.auth?null:getCloudClient(config);
  const auth=dependencies.auth??(client?createAccountAuth(client):null);
  const repository=dependencies.repository??(client?createAccountRepository(client,known):null);
  let storage=dependencies.storage;
  const uuid=dependencies.uuid??(()=>crypto.randomUUID()), now=dependencies.now??(()=>Date.now());
  const online=dependencies.online??(()=>typeof navigator==='undefined'||navigator.onLine);
  const listeners=new Set<()=>void>(); const owner=uuid();
  let snapshot:AccountSnapshot={authPhase:config.status==='unconfigured'?'unconfigured':config.status==='invalid'?'error':'restoring',identity:null,ready:false,completedIds:[],saveState:'localSaved',pendingCount:0,conflicts:[],error:config.status==='invalid'?{operation:'auth',code:config.code,retryable:false}:null,backups:[]};
  let envelope:AccountEnvelope|null=null, epoch=0, lifecycle=0, started=false, startPromise:Promise<void>|null=null;
  let pumping=false, transferring=false, signingOut=false, authBusy=false, inFlight=false, confirmed=false, networkFailed=false, storageFailed=false;
  let timer:ReturnType<typeof setTimeout>|null=null, attempts=0, abort:AbortController|null=null;
  let channel:BroadcastChannel|null=null;
  let pumpSettled:Promise<void>=Promise.resolve();let settlePump:(()=>void)|null=null;
  const unsaved=new Map<string,boolean>();
  const previews=new Map<string,{view:TransferPreview;epoch:number;rows:Record<string,CloudRow>;source:readonly string[];raw:string|null}>();
  function publish(patch:Partial<AccountSnapshot>={}) {
    const next={...snapshot,...patch};
    if(envelope&&next.identity?.uid===envelope.uid){
      const completed=new Set(Object.values(envelope.rows).filter(r=>r.completed).map(r=>r.shrineId));
      for(const [id,o] of Object.entries(envelope.overlay))o.completed?completed.add(id):completed.delete(id);
      for(const [id,target] of unsaved)target?completed.add(id):completed.delete(id);
      next.completedIds=[...completed].sort(); next.ready=envelope.loaded&&next.authPhase!=='expired';
      next.pendingCount=Math.max(envelope.jobs.filter(j=>j.state!=='conflict').length,Object.keys(envelope.overlay).length);
      next.conflicts=envelope.conflicts;next.backups=envelope.backups;
      next.saveState=unsaved.size||storageFailed?'unsaved':envelope.conflicts.length?'conflict':next.error?'error':inFlight?'syncing':networkFailed&&next.pendingCount?'offlineQueued':confirmed&&envelope.loaded&&!next.pendingCount?'cloudSynced':'localSaved';
    }
    if(JSON.stringify(next)!==JSON.stringify(snapshot)){snapshot=next;for(const fn of listeners)fn();}
  }
  function store():AccountStorage { if(!storage){if(config.status!=='configured')throw failure('storage','unconfigured');try{storage=createAccountStorage(config.projectRef,options.dataVersion,known);}catch(e){throw normalizeError(e,'storage');}}return {load:uid=>storage!.load(uid).catch(e=>{throw normalizeError(e,'storage');}),update:(uid,change)=>storage!.update(uid,change).catch(e=>{throw normalizeError(e,'storage');})}; }
  function current(uid:string,e:number){return started&&snapshot.identity?.uid===uid&&epoch===e;}
  function adopt(value:AccountEnvelope,uid:string,e:number){if(current(uid,e)&&(!envelope||value.serial>=envelope.serial)){envelope=value;publish();}}
  function broadcast(){channel?.postMessage('reload');}
  function report(e:unknown,operation:'auth'|'sync'|'storage'|'transfer',uid?:string,version?:number){const err=normalizeError(e,operation);if(err.detail.operation==='storage')storageFailed=true;if(!uid||current(uid,version!)){if(err.detail.code==='sessionExpired'&&snapshot.identity){epoch++;abort?.abort();confirmed=false;publish({authPhase:'expired',ready:false,error:err.detail});}else publish({error:err.detail,saveState:operation==='storage'?'unsaved':'error'});}return err;}
  function pending(value:AccountEnvelope){return value.jobs.length>0||Object.keys(value.overlay).length>0||value.conflicts.length>0;}
  function addEdit(value:AccountEnvelope,id:string,target:boolean){
    value.sequence++;value.overlay[id]={completed:target,sequence:value.sequence};
    if(!value.jobs.some(j=>j.mutations.some(m=>m.shrineId===id))&&!value.conflicts.some(c=>c.shrineId===id))value.jobs.push(makeJob(value,[{shrineId:id,completed:target,expectedRevision:value.rows[id]?.revision??0}],'edit'));
  }
  function makeJob(value:AccountEnvelope,mutations:Mutation[],source:'edit'|'transfer'):QueuedJob{return {schemaVersion:1,uid:value.uid,game:'botw',requestId:uuid(),mutations:structuredClone(mutations),sequences:Object.fromEntries(mutations.map(m=>[m.shrineId,value.overlay[m.shrineId]?.sequence??value.sequence])),createdAt:new Date(now()).toISOString(),source,attemptCount:0,state:'ready'};}
  function materialize(value:AccountEnvelope){for(const [id,o] of Object.entries(value.overlay))if(!value.conflicts.some(c=>c.shrineId===id)&&!value.jobs.some(j=>j.mutations.some(m=>m.shrineId===id)))value.jobs.push(makeJob(value,[{shrineId:id,completed:o.completed,expectedRevision:value.rows[id]?.revision??0}],'edit'));}
  async function readRemote(uid:string){if(!repository)throw failure('sync','unconfigured');const signal=new AbortController();const deadline=setTimeout(()=>signal.abort(),15000);try{return await repository.get(signal.signal,uid);}finally{clearTimeout(deadline);}}
  async function refresh(uid:string,e:number){
    if(!repository||!current(uid,e))return;const rows=await readRemote(uid);if(!current(uid,e))return;
    const value=await store().update(uid,v=>{for(const r of rows)if((v.rows[r.shrineId]?.revision??0)<=r.revision)v.rows[r.shrineId]=r;v.loaded=true;});
    if(current(uid,e)){confirmed=true;networkFailed=false;if(!unsaved.size)storageFailed=false;adopt(value,uid,e);publish({error:null});broadcast();}
  }
  function schedule(delay=0){if(timer||!started)return;timer=setTimeout(()=>{timer=null;void pump();},delay);}
  async function switchIdentity(identity:AccountIdentity|null,event='SIGNED_IN'){
    if(!started)return;
    if(!identity){if(signingOut)return;if(snapshot.identity){epoch++;abort?.abort();confirmed=false;publish({authPhase:'expired',ready:false,error:{operation:'auth',code:'sessionExpired',retryable:false}});}else publish({authPhase:'guest',ready:false,error:null});return;}
    if(snapshot.identity?.uid===identity.uid&&snapshot.authPhase!=='expired'){publish({identity,authPhase:'account'});if(event==='TOKEN_REFRESHED')schedule();return;}
    epoch++;const e=epoch;abort?.abort();inFlight=false;envelope=null;unsaved.clear();previews.clear();confirmed=false;networkFailed=false;storageFailed=false;
    publish({identity,authPhase:'account',ready:false,completedIds:[],pendingCount:0,conflicts:[],backups:[],error:null,saveState:'localSaved'});
    try {const value=await store().load(identity.uid);adopt(value,identity.uid,e);await refresh(identity.uid,e);if(current(identity.uid,e))schedule();}
    catch(err){const normalized=normalizeError(err,'sync');if(current(identity.uid,e)){networkFailed=normalized.detail.code==='networkFailure';report(normalized,normalized.detail.operation,identity.uid,e);}}
  }
  async function pump(){
    if(pumping||transferring||signingOut||!started||!snapshot.identity||snapshot.authPhase!=='account'||!envelope?.loaded||unsaved.size||!repository)return;
    const uid=snapshot.identity.uid,e=epoch;pumping=true;pumpSettled=new Promise(resolve=>{settlePump=resolve;});let acquired=false;
    try {
      if(!online()){networkFailed=true;publish();return;}
      let chosen:QueuedJob|undefined;
      const leased=await store().update(uid,v=>{
        if(v.lease&&v.lease.owner!==owner&&v.lease.expiresAt>now())return;
        v.lease={owner,expiresAt:now()+30000};acquired=true;materialize(v);
        chosen=v.jobs.find(j=>j.state!=='conflict'&&!j.mutations.some(m=>v.conflicts.some(c=>c.shrineId===m.shrineId)));
        if(chosen){chosen.state='sent';chosen.attemptCount++;}
      });adopt(leased,uid,e);
      if(!acquired||!chosen||!current(uid,e))return;
      const job=structuredClone(chosen);abort=new AbortController();const timeout=setTimeout(()=>abort?.abort(),15000);inFlight=true;publish({error:null});
      let result;try{result=await repository.apply(job.requestId,job.mutations,abort.signal,uid);}finally{clearTimeout(timeout);inFlight=false;}
      // 即使退出，确认也只能写回旧UID；不得更新新身份画面。
      const value=await store().update(uid,v=>{
        const found=v.jobs.find(j=>j.requestId===job.requestId);if(!found)return;
        if(result.status==='applied'){
          for(const row of result.rows){if((v.rows[row.shrineId]?.revision??0)<=row.revision)v.rows[row.shrineId]=row; if(v.overlay[row.shrineId]?.sequence===job.sequences[row.shrineId])delete v.overlay[row.shrineId];}
          v.jobs=v.jobs.filter(j=>j.requestId!==job.requestId);materialize(v);
        }else{
          found.state='conflict';
          for(const c of result.conflicts){if((v.rows[c.shrineId]?.revision??0)<=c.current.revision){if(c.current.revision)v.rows[c.shrineId]=c.current;else delete v.rows[c.shrineId];}v.conflicts=v.conflicts.filter(x=>x.shrineId!==c.shrineId);v.conflicts.push({shrineId:c.shrineId,localCompleted:v.overlay[c.shrineId]?.completed??job.mutations.find(m=>m.shrineId===c.shrineId)!.completed,remote:c.current,baseRevision:c.expectedRevision,requestId:job.requestId});}
        }
      });if(current(uid,e)){confirmed=false;adopt(value,uid,e);await refresh(uid,e);attempts=0;publish({error:null});}broadcast();
    }catch(err){if(current(uid,e)){const normalized=normalizeError(err,'sync');networkFailed=normalized.detail.code==='networkFailure';if(networkFailed&&envelope?.loaded&&Object.keys(envelope.overlay).length)publish({error:null});else report(normalized,normalized.detail.operation,uid,e);if(normalized.detail.retryable){attempts++;schedule(Math.min(30000,1000*2**Math.min(attempts,5)));}}}
    finally{inFlight=false;if(acquired)try{const v=await store().update(uid,x=>{if(x.lease?.owner===owner)x.lease=null;});adopt(v,uid,e);}catch(err){if(current(uid,e))report(err,'storage',uid,e);}pumping=false;settlePump?.();settlePump=null;publish();if(started&&snapshot.authPhase==='account'&&envelope?.jobs.some(j=>j.state!=='conflict')&&!networkFailed&&!snapshot.error)schedule(current(uid,e)?250:0);}
  }
  async function authCall(action:()=>Promise<void>){if(!auth||config.status!=='configured')throw failure('auth',config.status==='invalid'?config.code:'unconfigured');if(authBusy)throw failure('auth','authBusy');const generation=lifecycle,e=epoch;authBusy=true;try{await action();}catch(error){throw started&&generation===lifecycle&&e===epoch?report(error,'auth'):normalizeError(error,'auth');}finally{authBusy=false;}}
  async function passwordIdentity(action:()=>Promise<AccountIdentity>){const generation=lifecycle,e=epoch;const identity=await action();if(!started||generation!==lifecycle||(e!==epoch&&snapshot.identity?.uid!==identity.uid))return;await switchIdentity(identity);}
  function requireAccount(){if(!snapshot.identity||snapshot.authPhase!=='account'||!envelope?.loaded)throw failure('sync',snapshot.authPhase==='expired'?'sessionExpired':'accountNotReady');return {uid:snapshot.identity.uid,e:epoch};}
  function eventRefresh(){if(started&&snapshot.identity&&snapshot.authPhase==='account')void controller.retry().catch(()=>{});}
  async function preview(source:TransferSource,kind:TransferBackup['sourceKind']=source.kind):Promise<TransferPreview>{
    const {uid,e}=requireAccount();if(transferring)throw failure('transfer','transferBusy');if(pending(envelope!))throw report(failure('transfer','pendingOperations'),'transfer');
    if(!source||!['guest','json'].includes(source.kind)||!Array.isArray(source.completedIds)||source.completedIds.length>136||(source.raw!==undefined&&(typeof source.raw!=='string'||source.raw.length>1048576))||source.completedIds.some(id=>!known.has(id))||new Set(source.completedIds).size!==source.completedIds.length)throw report(failure('transfer','invalidTransferSource'),'transfer');
    await refresh(uid,e);if(!current(uid,e)||!confirmed)throw failure('transfer','previewExpired');
    if(pending(envelope!))throw failure('transfer','pendingOperations');
    const sourceIds=[...source.completedIds].sort(),accountIds=Object.values(envelope!.rows).filter(r=>r.completed).map(r=>r.shrineId).sort();
    const accountSet=new Set(accountIds),sourceSet=new Set(sourceIds),added=sourceIds.filter(id=>!accountSet.has(id)),removed=accountIds.filter(id=>!sourceSet.has(id));
    const backup:TransferBackup={id:uuid(),uid,game:'botw',dataVersion:options.dataVersion,createdAt:new Date(now()).toISOString(),sourceKind:kind,sourceCompletedIds:sourceIds,sourceRaw:source.raw??null,accountCompletedIds:accountIds};
    const view:TransferPreview={id:uuid(),uid,sourceKind:kind,sourceCount:sourceIds.length,cloudCount:accountIds.length,overlapCount:sourceIds.filter(id=>accountSet.has(id)).length,mergeCount:accountIds.length+added.length,replaceCount:sourceIds.length,mergeAddedIds:added,replaceAddedIds:added,replaceRemovedIds:removed,backup,hasChanges:{merge:added.length>0,replace:added.length>0||removed.length>0}};
    previews.set(view.id,{view:structuredClone(view),epoch:e,rows:structuredClone(envelope!.rows),source:sourceIds,raw:source.raw??null});return structuredClone(view);
  }
  const controller:AccountProgressController={
    getSnapshot:()=>snapshot,subscribe(listener){listeners.add(listener);return()=>listeners.delete(listener);},
    start(){if(startPromise)return startPromise;started=true;const generation=++lifecycle;
      startPromise=(async()=>{if(config.status!=='configured'||!auth)return;
        if(typeof BroadcastChannel!=='undefined'){channel=new BroadcastChannel('zelda-map:accounts');channel.onmessage=()=>{if(snapshot.identity){const uid=snapshot.identity.uid,e=epoch;void store().load(uid).then(v=>adopt(v,uid,e)).catch(err=>report(err,'storage',uid,e));}};}
        if(typeof window!=='undefined'){window.addEventListener('online',eventRefresh);window.addEventListener('focus',eventRefresh);document.addEventListener('visibilitychange',eventRefresh);}
        try{const identity=await auth.start((id,event)=>{if(started&&lifecycle===generation)void switchIdentity(id,event);});if(started&&lifecycle===generation)await switchIdentity(identity,'RESTORED');}catch(e){if(started&&lifecycle===generation)report(e,'auth');}
      })();return startPromise;
    },
    dispose(){started=false;lifecycle++;epoch++;abort?.abort();auth?.stop();if(timer)clearTimeout(timer);timer=null;channel?.close();channel=null;startPromise=null;if(typeof window!=='undefined'){window.removeEventListener('online',eventRefresh);window.removeEventListener('focus',eventRefresh);document.removeEventListener('visibilitychange',eventRefresh);}},
    signUpEmailPassword(email,password){return authCall(()=>passwordIdentity(()=>auth!.signUpEmailPassword(email,password)));},
    signInEmailPassword(email,password){return authCall(()=>passwordIdentity(()=>auth!.signInEmailPassword(email,password)));},
    signInGithub(){return authCall(()=>auth!.signInGithub());},
    async signOut(){if(!auth)throw failure('auth','unconfigured');if(signingOut||authBusy)throw failure('auth','authBusy');signingOut=true;epoch++;abort?.abort();try{await auth.signOut();epoch++;envelope=null;unsaved.clear();previews.clear();confirmed=false;publish({identity:null,authPhase:'guest',ready:false,completedIds:[],pendingCount:0,conflicts:[],backups:[],error:null,saveState:'localSaved'});}catch(e){throw report(e,'auth');}finally{signingOut=false;if(snapshot.identity)schedule();}},
    async setComplete(id,target){if(!known.has(id)||typeof target!=='boolean')throw failure('sync','invalidShrineId');const {uid,e}=requireAccount();if(transferring)throw failure('transfer','transferBusy');try{const v=await store().update(uid,x=>{if(!x.loaded)throw failure('sync','accountNotReady');if((x.overlay[id]?.completed??x.rows[id]?.completed??false)!==target)addEdit(x,id,target);});if(current(uid,e)){unsaved.delete(id);if(!unsaved.size)storageFailed=false;adopt(v,uid,e);publish({error:null});schedule();}broadcast();}catch(err){if(current(uid,e)){unsaved.set(id,target);publish();}throw report(err,'storage',uid,e);}},
    async retry(){if(!snapshot.identity||snapshot.authPhase!=='account')throw failure('sync','accountNotReady');const uid=snapshot.identity.uid,e=epoch;try{if(unsaved.size){const intents=[...unsaved];const v=await store().update(uid,x=>{for(const [id,t]of intents)addEdit(x,id,t);});if(current(uid,e)){unsaved.clear();adopt(v,uid,e);}}
      await refresh(uid,e);if(current(uid,e)){networkFailed=false;publish({error:null});schedule();}
    }catch(err){throw report(err,'sync',uid,e);}},
    async resolveConflict(id,choice){const {uid,e}=requireAccount();if(!['local','cloud'].includes(choice))throw failure('sync','invalidConflictChoice');
      const displayed=envelope!.conflicts.find(c=>c.shrineId===id);if(!displayed)throw failure('sync','conflictMissing');
      const shown=structuredClone(displayed);let changed=false;
      try{await refresh(uid,e);if(!current(uid,e))throw failure('sync','conflict_changed');const v=await store().update(uid,x=>{
      if(!current(uid,e))throw failure('sync','conflict_changed');
      const conflict=x.conflicts.find(c=>c.shrineId===id);if(!conflict)throw failure('sync','conflictMissing');
      const latest=x.rows[id]??{shrineId:id,completed:false,revision:0,updatedAt:''};
      if(latest.revision!==shown.remote.revision||latest.completed!==shown.remote.completed||conflict.requestId!==shown.requestId){
        conflict.remote=structuredClone(latest);conflict.localCompleted=x.overlay[id]?.completed??conflict.localCompleted;changed=true;return;
      }
      const batch=x.jobs.find(j=>j.requestId===conflict.requestId&&j.source==='transfer');
      x.backups.push({id:uuid(),uid,game:'botw',dataVersion:options.dataVersion,createdAt:new Date(now()).toISOString(),sourceKind:'restore',sourceCompletedIds:Object.entries(x.overlay).filter(([,o])=>o.completed).map(([id])=>id),sourceRaw:null,accountCompletedIds:Object.values(x.rows).filter(r=>r.completed).map(r=>r.shrineId)});
      x.conflicts=x.conflicts.filter(c=>c.shrineId!==id);
      if(batch){
        if(choice==='cloud')delete x.overlay[id];
        if(!x.conflicts.some(c=>c.requestId===batch.requestId)){
          x.jobs=x.jobs.filter(j=>j.requestId!==batch.requestId);x.sequence++;
          const mutations=ids.map(sid=>({shrineId:sid,completed:x.overlay[sid]?.completed??x.rows[sid]?.completed??false,expectedRevision:x.rows[sid]?.revision??0}));
          for(const m of mutations)x.overlay[m.shrineId]={completed:m.completed,sequence:x.sequence};
          x.jobs.push(makeJob(x,mutations,'transfer'));
        }
      }else{
        x.jobs=x.jobs.filter(j=>!j.mutations.some(m=>m.shrineId===id));
        if(choice==='cloud')delete x.overlay[id];else{const target=x.overlay[id]?.completed??conflict.localCompleted;delete x.overlay[id];addEdit(x,id,target);}
      }
    });adopt(v,uid,e);broadcast();if(changed)throw failure('sync','conflict_changed');publish({error:null});schedule();}catch(err){throw report(err,'sync',uid,e);}},
    previewTransfer(source){return preview(source).catch(e=>{throw report(e,'transfer');});},
    async applyTransfer(previewId,mode){const {uid,e}=requireAccount();const p=previews.get(previewId);if(!p||p.epoch!==e||p.view.uid!==uid)throw report(failure('transfer','previewExpired'),'transfer');if(!['merge','replace'].includes(mode))throw failure('transfer','invalidTransferMode');if(!p.view.hasChanges[mode])throw report(failure('transfer','noChanges'),'transfer');if(transferring||pending(envelope!))throw report(failure('transfer','pendingOperations'),'transfer');
      transferring=true;try{await pumpSettled;if(!current(uid,e))throw failure('transfer','previewExpired');if(p.view.sourceKind==='guest'&&p.raw!==null&&typeof localStorage!=='undefined'&&localStorage.getItem(STORAGE.progress)!==p.raw)throw failure('transfer','sourceChanged');const latest=await readRemote(uid);if(!current(uid,e))throw failure('transfer','previewExpired');const latestRows=Object.fromEntries(latest.map(r=>[r.shrineId,r]));if(ids.some(id=>(latestRows[id]?.revision??0)!==(p.rows[id]?.revision??0)))throw failure('transfer','previewExpired');
        const target=new Set(p.source);if(mode==='merge')for(const r of Object.values(p.rows))if(r.completed)target.add(r.shrineId);
        const value=await store().update(uid,x=>{if(pending(x))throw failure('transfer','pendingOperations');x.backups.push(structuredClone(p.view.backup));x.sequence++;for(const id of ids)x.overlay[id]={completed:target.has(id),sequence:x.sequence};x.jobs.push(makeJob(x,ids.map(id=>({shrineId:id,completed:target.has(id),expectedRevision:p.rows[id]?.revision??0})),'transfer'));});adopt(value,uid,e);previews.delete(previewId);publish({error:null});broadcast();
      }catch(err){throw report(err,'transfer',uid,e);}finally{transferring=false;schedule();}},
    dismissTransfer(id){previews.delete(id);},
    async previewRestore(id){const {uid}=requireAccount();const value=await store().load(uid);const backup=value.backups.find(b=>b.id===id&&b.uid===uid);if(!backup)throw report(failure('transfer','backupMissing'),'transfer');return preview({kind:'json',completedIds:backup.accountCompletedIds,raw:JSON.stringify(backup)},'restore');},
  };return controller;
}
