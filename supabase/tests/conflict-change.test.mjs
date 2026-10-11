import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {PGlite} from '@electric-sql/pglite';
import {IDBFactory} from 'fake-indexeddb';
import {randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
const output='/private/tmp/zelda-conflict-change-selftest.mjs';
await build({stdin:{contents:"export {createAccountProgressController} from './src/lib/sync/controller';export {createAccountStorage} from './src/lib/sync/storage';",resolveDir:process.cwd()},outfile:output,bundle:true,platform:'node',format:'esm'});
const {createAccountProgressController,createAccountStorage}=await import(output+'?'+Date.now());
const db=new PGlite();await db.exec("create role anon;create role authenticated;create schema auth;create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;");
await db.exec(await readFile(new URL('../migrations/202610110001_account_progress.sql',import.meta.url),'utf8'));
let lane=Promise.resolve();function pg(uid,fn){const next=lane.then(async()=>{await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[uid]);await db.exec('set role authenticated');return fn();});lane=next.catch(()=>{});return next;}
const row=r=>({shrineId:r.shrine_id,completed:r.completed,revision:r.revision,updatedAt:r.updated_at});
const get=uid=>pg(uid,async()=>(await db.query("select public.get_shrine_progress('botw') as value")).rows[0].value.rows.map(row));
const apply=(uid,request,mutations)=>pg(uid,async()=>{const v=(await db.query("select public.apply_shrine_progress('botw',$1::uuid,$2::jsonb) as value",[request,JSON.stringify(mutations.map(m=>({shrine_id:m.shrineId,completed:m.completed,expected_revision:m.expectedRevision})))])).rows[0].value;return v.status==='applied'?{status:v.status,requestId:v.request_id,rows:v.rows.map(row)}:{status:v.status,requestId:v.request_id,conflicts:v.conflicts.map(c=>({shrineId:c.shrine_id,expectedRevision:c.expected_revision,current:row(c.current)}))};});
const wait=async(fn)=>{for(let i=0;i<200;i++){if(fn())return;await new Promise(r=>setTimeout(r,10));}throw Error('等待同步状态超时');};
const knownIds=new Set(Array.from({length:136},(_,i)=>`Dungeon${String(i).padStart(3,'0')}`));
try{for(const choice of ['local','cloud']){
  const uid=randomUUID(),projectRef='conflict-selftest',storage=createAccountStorage(projectRef,'selftest',knownIds,new IDBFactory());let writes=0;
  const auth={start:async()=>({uid,email:null,provider:'github',displayName:'模拟身份'}),stop(){},sendEmailOtp:async()=>{},verifyEmailOtp:async()=>{throw Error();},signInGithub:async()=>{},signOut:async()=>{}};
  const repository={get:()=>get(uid),apply:(request,m)=>{writes++;return apply(uid,request,m);}};
  const c=createAccountProgressController({knownIds,dataVersion:'selftest'},{config:{status:'configured',url:'https://example.invalid',key:'sb_publishable_test',projectRef},auth,repository,storage,uuid:randomUUID,online:()=>true});
  try{
    await c.start();await apply(uid,randomUUID(),[{shrineId:'Dungeon052',completed:false,expectedRevision:0}]);
    await c.setComplete('Dungeon052',true);await wait(()=>c.getSnapshot().conflicts.length===1);
    const job=(await storage.load(uid)).jobs[0];assert.equal(c.getSnapshot().conflicts[0].remote.revision,1);
    await apply(uid,randomUUID(),[{shrineId:'Dungeon052',completed:true,expectedRevision:1}]);await apply(uid,randomUUID(),[{shrineId:'Dungeon052',completed:false,expectedRevision:2}]);
    const before=writes;await assert.rejects(()=>c.resolveConflict('Dungeon052',choice),e=>e.detail?.code==='conflict_changed');
    await new Promise(r=>setTimeout(r,250));assert.equal(writes,before);assert.equal((await get(uid))[0].revision,3);assert.equal((await get(uid))[0].completed,false);
    const conflict=c.getSnapshot().conflicts[0];assert.equal(conflict.remote.revision,3);assert.equal(conflict.localCompleted,true);assert.equal(conflict.requestId,job.requestId);assert.equal(c.getSnapshot().saveState,'conflict');
    const saved=await storage.load(uid);assert.deepEqual(saved.jobs[0].mutations,job.mutations);assert.equal(saved.backups.length,0);assert.equal(saved.overlay.Dungeon052.completed,true);
    // 基于新显示的revision3再次明确选择，才允许应用。
    await c.resolveConflict('Dungeon052',choice);await wait(()=>c.getSnapshot().saveState==='cloudSynced');
    const final=(await get(uid))[0];assert.equal(final.completed,choice==='local');assert.equal(final.revision,choice==='local'?4:3);
  }finally{c.dispose();}
}
console.log('E09后端自测：实际PGlite RPC + fake-IDB，local/cloud旧选择均拒绝；冲突更新到rev3、原job/意图保留、零新写；重新确认后可应用。auth为stub，非实云。');
}finally{await lane;await db.close();}
