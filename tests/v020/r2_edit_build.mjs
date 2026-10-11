import fs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';
import {build as viteBuild} from 'vite';import {build as esbuild} from 'esbuild';
const out='docs/dev_new_version/v0.2.0/evidence/r2/edit-build-manifest.json';assert(!fs.existsSync(out),'禁止覆盖证据');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const old=JSON.parse(fs.readFileSync('docs/dev_new_version/v0.2.0/evidence/r2/build-manifest.json'));
const sources=Object.fromEntries(Object.keys(old.sourceHashes).map(f=>[f,hash(fs.readFileSync(f))]));
assert.equal(sources['src/components/AccountPanel.tsx'],'20eb312d2bdfc6c7e192e095f7cd655fb725c2c6b34fcfe854b1e7211d44331a');
assert.deepEqual(Object.keys(sources).filter(f=>sources[f]!==old.sourceHashes[f]),['src/components/AccountPanel.tsx']);
for(const k of Object.keys(process.env))if(k.startsWith('VITE_'))delete process.env[k];
process.env.VITE_SUPABASE_URL='https://qa-v020.supabase.invalid';process.env.VITE_SUPABASE_PUBLISHABLE_KEY='sb_publishable_qa_v020';
const dest='.runtime/qa-v020-r2-edit/root';await viteBuild({envFile:false,base:'/',build:{outDir:dest,emptyOutDir:true},logLevel:'warn'});
// 非Auth状态保护单独用实际组件和明确snapshot替身；不增加生产setter。
const fixture=`import React,{useState} from 'react';import {createRoot} from 'react-dom/client';import AccountPanel from './src/components/AccountPanel';import SyncStatus from './src/components/SyncStatus';
let external;const initial={authPhase:'expired',identity:{uid:'aaa00000-0000-4000-8000-000000000001',email:'qa@fixture.invalid',provider:'email',displayName:null},ready:false,completedIds:[],saveState:'error',pendingCount:0,conflicts:[],error:null,backups:[]};
function Fixture(){const [snapshot,set]=useState(initial);external=snapshot;window.__qaInjectError=(operation,code)=>set({...snapshot,error:{operation,code,retryable:false}});window.__qaReadSnapshot=()=>external;const controller={getSnapshot:()=>snapshot};return <><SyncStatus snapshot={snapshot} guestStatus='ready' locale='zh' onOpen={()=>{}}/><AccountPanel snapshot={snapshot} controller={controller} locale='zh' guestCount={0} guestUsable={true} onMigration={async()=>{}} onConflicts={()=>{}} onGithub={async()=>{}}/></>;}
createRoot(document.getElementById('root')).render(<Fixture/>);`;
await esbuild({stdin:{contents:fixture,resolveDir:process.cwd(),loader:'jsx'},bundle:true,format:'iife',platform:'browser',jsx:'automatic',outfile:dest+'/prompt-harness.js',define:{'process.env.NODE_ENV':'"production"'},logLevel:'silent'});
fs.writeFileSync(dest+'/prompt-harness.html','<!doctype html><html lang="zh"><meta charset="utf-8"><div id="root"></div><script src="/prompt-harness.js"></script></html>');
const stable=Object.keys(sources).every(f=>sources[f]===hash(fs.readFileSync(f)));assert(stable);
const artifacts=Object.fromEntries(fs.readdirSync(dest+'/assets').map(f=>['assets/'+f,hash(fs.readFileSync(dest+'/assets/'+f))]));
fs.writeFileSync(out,JSON.stringify({createdAt:new Date().toISOString(),scope:'仅编辑清错补丁根路径构建，非全套重跑',envFile:false,sourceHashes:sources,sourceStable:stable,artifacts,harnessHash:hash(fs.readFileSync(dest+'/prompt-harness.js')),base:'/'},null,2));
