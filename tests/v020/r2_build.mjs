import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { build as viteBuild } from 'vite';
import { build as esbuild } from 'esbuild';

// 冻结通知后执行；禁用所有本机env文件，只使用合成公开配置。
const out='docs/dev_new_version/v0.2.0/evidence/r2';
fs.mkdirSync(out,{recursive:true});fs.mkdirSync('.runtime/qa-v020-r2',{recursive:true});
const name=process.env.QA_R2_MANIFEST||'build-manifest.json';assert(!fs.existsSync(out+'/'+name),'禁止覆盖已有证据');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(x=>x.isDirectory()?walk(path.join(d,x.name)):[path.join(d,x.name)]);
const sources=['package.json','package-lock.json',...walk('src'),...walk('supabase/migrations'),'public/data/shrines.json','public/assets/hyrule-base.webp'];
const evidence={startedAt:new Date().toISOString(),node:process.version,config:'envFile:false，仅合成配置；未读取.env.local',sourceHashes:Object.fromEntries(sources.map(f=>[f,hash(fs.readFileSync(f))])),builds:[]};
const env=Object.fromEntries(Object.entries(process.env).filter(([k])=>!k.startsWith('VITE_')));
const typecheck=spawnSync('npm',['run','typecheck'],{env,encoding:'utf8'});fs.writeFileSync(out+'/typecheck-'+name+'.log',typecheck.stdout+typecheck.stderr);evidence.typecheckExit=typecheck.status;if(typecheck.status!==0)process.exitCode=1;
for(const [name,base] of [['root','/'],['pages','/zelda_map/'],['guest','/guest/']]){
 for(const k of Object.keys(process.env))if(k.startsWith('VITE_'))delete process.env[k];
 process.env.VITE_SUPABASE_URL=name==='guest'?'':'https://qa-v020.supabase.invalid';process.env.VITE_SUPABASE_PUBLISHABLE_KEY=name==='guest'?'':'sb_publishable_qa_v020';
 const destination='.runtime/qa-v020-r2/'+name;
 try{await viteBuild({envFile:false,base,build:{outDir:destination,emptyOutDir:true},logLevel:'warn'});const artifacts=Object.fromEntries(walk(destination).map(f=>[path.relative(destination,f),hash(fs.readFileSync(f))]));evidence.builds.push({name,base,command:'Vite build API envFile:false',exitCode:0,artifacts});console.log(name,'build pass');}catch(e){evidence.builds.push({name,base,exitCode:1,error:e.message});process.exitCode=1;}
}
await esbuild({stdin:{contents:"export {createAccountProgressController} from './src/lib/sync/controller';export {createAccountStorage} from './src/lib/sync/storage';export {createAccountAuth,identityFromSession,applicationRoot,controlledHash} from './src/lib/cloud/auth';export {normalizeError,failure} from './src/lib/cloud/errors';",resolveDir:process.cwd()},outfile:'.runtime/qa-v020-r2/engine.mjs',bundle:true,platform:'node',format:'esm',logLevel:'silent'});
evidence.engineHash=hash(fs.readFileSync('.runtime/qa-v020-r2/engine.mjs'));evidence.unchangedDuringBuild=sources.every(f=>hash(fs.readFileSync(f))===evidence.sourceHashes[f]);if(!evidence.unchangedDuringBuild)process.exitCode=1;evidence.completedAt=new Date().toISOString();fs.writeFileSync(out+'/'+name,JSON.stringify(evidence,null,2));
