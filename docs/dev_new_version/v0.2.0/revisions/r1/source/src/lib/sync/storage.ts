import type { CloudRow, SyncConflict, TransferBackup } from './types';
import type { Mutation } from '../cloud/repository';
import { failure, normalizeError } from '../cloud/errors';
export interface QueuedJob {
  schemaVersion: 1; uid: string; game: 'botw'; requestId: string;
  mutations: Mutation[]; sequences: Record<string, number>; createdAt: string;
  source: 'edit' | 'transfer'; attemptCount: number; state: 'ready' | 'sent' | 'conflict';
}
export interface AccountEnvelope {
  schemaVersion: 1; projectRef: string; uid: string; game: 'botw'; dataVersion: string; loaded: boolean;
  rows: Record<string,CloudRow>; overlay: Record<string,{completed:boolean;sequence:number}>;
  sequence: number; serial: number; jobs: QueuedJob[]; conflicts: SyncConflict[]; backups: TransferBackup[];
  lease: { owner: string; expiresAt: number } | null;
}
export interface AccountStorage {
  load(uid: string): Promise<AccountEnvelope>;
  update(uid: string, change: (value: AccountEnvelope) => void): Promise<AccountEnvelope>;
}
export function emptyEnvelope(projectRef:string,uid:string,dataVersion:string): AccountEnvelope {
  return {schemaVersion:1,projectRef,uid,game:'botw',dataVersion,loaded:false,rows:{},overlay:{},sequence:0,serial:0,jobs:[],conflicts:[],backups:[],lease:null};
}
export function validateEnvelope(value: unknown, projectRef:string,uid:string,known:ReadonlySet<string>): asserts value is AccountEnvelope {
  const v=value as AccountEnvelope;
  const validDate=(s:unknown)=>typeof s==='string'&&Number.isFinite(Date.parse(s));
  const integer=(n:unknown)=>Number.isInteger(n)&&Number(n)>=0;
  if(!v||v.schemaVersion!==1||v.projectRef!==projectRef||v.uid!==uid||v.game!=='botw'||typeof v.loaded!=='boolean'||typeof v.dataVersion!=='string'||!v.rows||!v.overlay||Array.isArray(v.rows)||Array.isArray(v.overlay)||!integer(v.sequence)||!integer(v.serial)||!Array.isArray(v.jobs)||!Array.isArray(v.conflicts)||!Array.isArray(v.backups))throw failure('storage','corruptCache');
  for(const [id,r] of Object.entries(v.rows))if(!known.has(id)||r.shrineId!==id||typeof r.completed!=='boolean'||!integer(r.revision)||r.revision<1||r.revision>2147483647||!validDate(r.updatedAt))throw failure('storage','corruptCache');
  for(const [id,o] of Object.entries(v.overlay))if(!known.has(id)||typeof o.completed!=='boolean'||!integer(o.sequence)||o.sequence>v.sequence)throw failure('storage','corruptCache');
  const requests=new Set<string>();
  for(const job of v.jobs){
    if(job.schemaVersion!==1||job.uid!==uid||job.game!=='botw'||!/^[-0-9a-f]{36}$/i.test(job.requestId)||requests.has(job.requestId)||!validDate(job.createdAt)||!integer(job.attemptCount)||!['edit','transfer'].includes(job.source)||!['ready','sent','conflict'].includes(job.state)||!Array.isArray(job.mutations)||job.mutations.length<1||job.mutations.length>136||!job.sequences)throw failure('storage','corruptCache');
    requests.add(job.requestId);const ids=new Set<string>();
    for(const m of job.mutations){if(!known.has(m.shrineId)||ids.has(m.shrineId)||typeof m.completed!=='boolean'||!integer(m.expectedRevision)||m.expectedRevision>2147483647||!integer(job.sequences[m.shrineId]))throw failure('storage','corruptCache');ids.add(m.shrineId);}
  }
  for(const c of v.conflicts)if(!known.has(c.shrineId)||typeof c.localCompleted!=='boolean'||c.remote.shrineId!==c.shrineId||typeof c.remote.completed!=='boolean'||!integer(c.remote.revision)||!integer(c.baseRevision)||typeof c.requestId!=='string')throw failure('storage','corruptCache');
  for(const b of v.backups)if(b.uid!==uid||b.game!=='botw'||typeof b.id!=='string'||!validDate(b.createdAt)||!Array.isArray(b.accountCompletedIds)||!Array.isArray(b.sourceCompletedIds)||![...b.accountCompletedIds,...b.sourceCompletedIds].every(id=>known.has(id))||!(typeof b.sourceRaw==='string'||b.sourceRaw===null))throw failure('storage','corruptCache');
  if(v.lease!==null&&(!v.lease||typeof v.lease.owner!=='string'||!Number.isFinite(v.lease.expiresAt)))throw failure('storage','corruptCache');
}
export function createAccountStorage(projectRef:string,dataVersion:string,known:ReadonlySet<string>,factory:IDBFactory=indexedDB):AccountStorage {
  let opening:Promise<IDBDatabase>|null=null;
  function open():Promise<IDBDatabase>{
    opening??=new Promise((resolve,reject)=>{const r=factory.open('zelda-map:account:v1',1);r.onupgradeneeded=()=>r.result.createObjectStore('envelopes');r.onsuccess=()=>{r.result.onversionchange=()=>{r.result.close();opening=null;};resolve(r.result);};r.onerror=()=>{opening=null;reject(normalizeError(r.error,'storage'));};r.onblocked=()=>{opening=null;reject(failure('storage','storageUnavailable',true));};});return opening;
  }
  async function transact(uid:string,change?: (value:AccountEnvelope)=>void):Promise<AccountEnvelope>{
    const db=await open();return new Promise((resolve,reject)=>{
      const key=JSON.stringify([projectRef,uid,'botw']);const tx=db.transaction('envelopes',change?'readwrite':'readonly');const store=tx.objectStore('envelopes');const get=store.get(key);let result:AccountEnvelope;let validationError:unknown;
      get.onsuccess=()=>{try{const raw=get.result;result=raw===undefined?emptyEnvelope(projectRef,uid,dataVersion):raw;validateEnvelope(result,projectRef,uid,known);if(change){change(result);result.serial++;validateEnvelope(result,projectRef,uid,known);store.put(result,key);}}catch(e){validationError=e;tx.abort();}};
      tx.oncomplete=()=>resolve(structuredClone(result));tx.onabort=()=>reject(normalizeError(validationError??tx.error,'storage'));tx.onerror=()=>{ /* onabort是最终失败；未成功提交不得发布本机保存。 */ };
    });
  }
  return {load:uid=>transact(uid),update:(uid,change)=>transact(uid,change)};
}
