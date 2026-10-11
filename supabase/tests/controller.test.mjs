import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { IDBFactory } from 'fake-indexeddb';
import { randomUUID } from 'node:crypto';
const output='/private/tmp/zelda-v020-controller-test.mjs';
await build({entryPoints:['src/lib/sync/controller.ts'],outfile:output,bundle:true,platform:'node',format:'esm'});
const {createAccountProgressController}=await import(output+'?'+Date.now());
const storageOutput='/private/tmp/zelda-v020-storage-test.mjs';
await build({entryPoints:['src/lib/sync/storage.ts'],outfile:storageOutput,bundle:true,platform:'node',format:'esm'});
const {createAccountStorage}=await import(storageOutput+'?'+Date.now());
const knownIds=new Set(Array.from({length:136},(_,i)=>`Dungeon${String(i).padStart(3,'0')}`));
const config={status:'configured',url:'https://test.supabase.co',key:'sb_publishable_test',projectRef:'https://test.supabase.co'};
const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222';
const identity=uid=>({uid,email:uid+'@example.test',provider:'github',displayName:uid});
const wait=async(check,label)=>{for(let i=0;i<150;i++){if(check())return;await new Promise(r=>setTimeout(r,20));}throw new Error('timeout '+label);};
function fixture(){
  const idb=new IDBFactory(),storage=createAccountStorage(config.projectRef,'test',knownIds,idb),accounts=new Map(),receipts=new Map(),calls=[];
  let user=A,offline=false,lost=false,delay=null;
  const rows=()=>{if(!accounts.has(user))accounts.set(user,new Map());return accounts.get(user);};
  const repo={get:async()=>{if(offline)throw new TypeError('offline');return structuredClone([...rows().values()]);},apply:async(requestId,mutations)=>{
    const uid=user;calls.push({uid,requestId,mutations:structuredClone(mutations)});if(offline)throw new TypeError('offline');
    if(delay){const d=delay;delay=null;await d;}
    if(!accounts.has(uid))accounts.set(uid,new Map());const records=accounts.get(uid),key=uid+requestId;
    if(receipts.has(key))return structuredClone(receipts.get(key));
    const conflicts=mutations.filter(m=>(records.get(m.shrineId)?.revision??0)!==m.expectedRevision).map(m=>({shrineId:m.shrineId,expectedRevision:m.expectedRevision,current:records.get(m.shrineId)??{shrineId:m.shrineId,revision:0,completed:false,updatedAt:''}}));
    let result;
    if(conflicts.length)result={status:'conflict',requestId,conflicts};else{const ack=mutations.map(m=>({shrineId:m.shrineId,completed:m.completed,revision:m.expectedRevision+1,updatedAt:new Date().toISOString()}));for(const r of ack)records.set(r.shrineId,r);result={status:'applied',requestId,rows:ack};}
    receipts.set(key,structuredClone(result));if(lost){lost=false;throw new TypeError('response lost');}return structuredClone(result);
  }};
  function controller(customStorage=storage){let listener;const auth={start:async(fn)=>{listener=fn;return identity(user);},stop:()=>{},sendEmailOtp:async()=>{},verifyEmailOtp:async()=>identity(user),signInGithub:async()=>{},signOut:async()=>{listener?.(null,'SIGNED_OUT');}};
    const c=createAccountProgressController({knownIds,dataVersion:'test'},{config,auth,repository:repo,storage:customStorage,uuid:randomUUID,online:()=>!offline});return {c,switch:uid=>{user=uid;listener(identity(uid),'SIGNED_IN');}};
  }
  return {storage,repo,accounts,calls,controller,setOffline:v=>offline=v,setLost:()=>lost=true,setDelay:p=>delay=p};
}
const controllers=[];try{
  const f=fixture();let {c}=f.controller();controllers.push(c);await c.start();assert(c.getSnapshot().ready);await c.setComplete('Dungeon000',true);await wait(()=>c.getSnapshot().saveState==='cloudSynced','first save');
  c.dispose();f.setOffline(true);({c}=f.controller());controllers.push(c);await c.start();assert(c.getSnapshot().ready);assert(c.getSnapshot().completedIds.includes('Dungeon000'));await c.setComplete('Dungeon000',false);await wait(()=>c.getSnapshot().saveState==='offlineQueued','offline queue');c.dispose();
  f.setOffline(false);({c}=f.controller());controllers.push(c);await c.start();await wait(()=>c.getSnapshot().saveState==='cloudSynced','restart resend');assert(!c.getSnapshot().completedIds.includes('Dungeon000'));assert.equal(f.accounts.get(A).get('Dungeon000').completed,false);
  let release;f.setDelay(new Promise(r=>release=r));await c.setComplete('Dungeon001',true);await wait(()=>c.getSnapshot().saveState==='syncing','inflight');await c.setComplete('Dungeon001',false);release();await wait(()=>c.getSnapshot().saveState==='cloudSynced','rapid true false');assert.equal(f.accounts.get(A).get('Dungeon001').completed,false);
  f.setLost();await c.setComplete('Dungeon002',true);await wait(()=>c.getSnapshot().saveState==='offlineQueued','lost response');c.dispose();({c}=f.controller());controllers.push(c);await c.start();await wait(()=>c.getSnapshot().saveState==='cloudSynced','receipt replay');assert.equal(f.accounts.get(A).get('Dungeon002').revision,1);
  const replays=f.calls.filter(x=>x.mutations.some(m=>m.shrineId==='Dungeon002'));assert(replays.length>=2);assert.equal(replays[0].requestId,replays[1].requestId);
  const count=f.calls.length;const noChange=await c.previewTransfer({kind:'guest',completedIds:[...c.getSnapshot().completedIds],raw:'original guest'});assert.equal(noChange.hasChanges.replace,false);await assert.rejects(()=>c.applyTransfer(noChange.id,'replace'));assert.equal(f.calls.length,count);await c.retry();
  const transfer=await c.previewTransfer({kind:'guest',completedIds:['Dungeon135'],raw:'untouched v1 guest'});await c.applyTransfer(transfer.id,'replace');await wait(()=>c.getSnapshot().saveState==='cloudSynced','136 transfer');assert.equal(f.calls.at(-1).mutations.length,136);assert.deepEqual(c.getSnapshot().completedIds,['Dungeon135']);assert.equal(c.getSnapshot().backups.at(-1).sourceRaw,'untouched v1 guest');
  const before=c.getSnapshot().backups.at(-1);const restore=await c.previewRestore(before.id);await c.applyTransfer(restore.id,'replace');await wait(()=>c.getSnapshot().saveState==='cloudSynced','restore');assert(c.getSnapshot().completedIds.includes('Dungeon002'));
  const bad={load:uid=>f.storage.load(uid),update:async()=>{throw new DOMException('quota','QuotaExceededError');}};c.dispose();({c}=f.controller(bad));controllers.push(c);await c.start();assert.equal(c.getSnapshot().saveState,'unsaved');
  const virgin=fixture();virgin.setOffline(true);const v=virgin.controller().c;controllers.push(v);await v.start();assert.equal(v.getSnapshot().ready,false);await assert.rejects(()=>v.setComplete('Dungeon003',true));virgin.setOffline(false);await v.retry();assert.equal(v.getSnapshot().ready,true);
  const isolation=fixture();const active=isolation.controller();controllers.push(active.c);await active.c.start();let finishOld;isolation.setDelay(new Promise(r=>finishOld=r));await active.c.setComplete('Dungeon010',true);await wait(()=>active.c.getSnapshot().saveState==='syncing','old UID in flight');active.switch(B);await wait(()=>active.c.getSnapshot().identity?.uid===B&&active.c.getSnapshot().ready,'switch B');await active.c.setComplete('Dungeon011',true);finishOld();await wait(()=>active.c.getSnapshot().saveState==='cloudSynced','B save after old ack');assert.deepEqual(active.c.getSnapshot().completedIds,['Dungeon011']);assert(isolation.accounts.get(A).get('Dungeon010').completed);
  const tabs=fixture(),t1=tabs.controller().c,t2=tabs.controller().c;controllers.push(t1,t2);await t1.start();await t2.start();let unlock;tabs.setDelay(new Promise(r=>unlock=r));await t1.setComplete('Dungeon020',true);await wait(()=>t1.getSnapshot().saveState==='syncing'||t2.getSnapshot().saveState==='syncing','tab lease');await t2.setComplete('Dungeon020',false);unlock();await wait(()=>tabs.accounts.get(A)?.get('Dungeon020')?.completed===false&&tabs.accounts.get(A)?.get('Dungeon020')?.revision===2,'cross tab ordered edits');
  const cas=fixture(),cc=cas.controller().c;controllers.push(cc);await cc.start();cas.accounts.get(A).set('Dungeon030',{shrineId:'Dungeon030',completed:false,revision:1,updatedAt:new Date().toISOString()});await cc.setComplete('Dungeon030',true);await wait(()=>cc.getSnapshot().saveState==='conflict','CAS conflict');assert.equal(cc.getSnapshot().conflicts[0].localCompleted,true);await cc.resolveConflict('Dungeon030','cloud');await wait(()=>cc.getSnapshot().saveState==='cloudSynced','choose cloud');assert(!cc.getSnapshot().completedIds.includes('Dungeon030'));
  const stale=await cc.previewTransfer({kind:'guest',completedIds:['Dungeon031'],raw:'guest kept'});cas.accounts.get(A).set('Dungeon030',{shrineId:'Dungeon030',completed:false,revision:2,updatedAt:new Date().toISOString()});const writes=cas.calls.length;await assert.rejects(()=>cc.applyTransfer(stale.id,'replace'));assert.equal(cas.calls.length,writes);assert.equal((await cas.storage.load(A)).jobs.length,0);
  console.log('fake-indexeddb+受控RPC：离线重启/false取消/快速点击/receipt重放/迁移136批次/无差异零写/恢复/存储故障/首次屏障/跨tab租约/迟到响应换UID/冲突选择/预览失效通过；非实云。');
}finally{for(const c of controllers)c.dispose();}
