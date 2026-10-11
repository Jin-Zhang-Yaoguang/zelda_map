import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

// 私密配置只供本机精确匹配；输出中不含值、密码hash或原始匹配片段。
const root=process.cwd(), out='docs/dev_new_version/v0.2.0/evidence/r2', build='.runtime/r2-watchdog-dist';
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const files=execFileSync('git',['ls-files','-c','-o','--exclude-standard','-z'],{encoding:'utf8'}).split('\0').filter(f=>f&&fs.existsSync(f)&&fs.statSync(f).isFile());
const env=fs.readFileSync('.env.local','utf8');
let password=env.match(/^SUPABASE_DB_PASSWORD=(.*)$/m)?.[1]?.trim();
if(!password)throw Error('Missing private scan input; no value reported');
if((password.startsWith('"')&&password.endsWith('"'))||(password.startsWith("'")&&password.endsWith("'")))password=password.slice(1,-1);
const exactMatches=[];
for(const file of files)if(fs.readFileSync(file).includes(Buffer.from(password)))exactMatches.push({scope:'prospectiveGit',path:file});
const buildFiles=walk(build);
for(const file of buildFiles)if(fs.readFileSync(file).includes(Buffer.from(password)))exactMatches.push({scope:'isolatedBuild',path:file});
const patterns=[['supabase_secret',/sb_secret_[A-Za-z0-9_-]+/g],['private_key',/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],['github_token',/\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}\b/g],['aws_access_key',/\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g]];
const tokenMatches=[];
for(const file of files){const data=fs.readFileSync(file);if(data.includes(0))continue;const lines=data.toString('utf8').split('\n');for(let i=0;i<lines.length;i++)for(const [category,re]of patterns){re.lastIndex=0;if(re.test(lines[i]))tokenMatches.push({path:file,line:i+1,category});}}
const qa=JSON.parse(fs.readFileSync(path.join(out,'build-manifest.json'),'utf8'));
const sourceHashes=Object.fromEntries(Object.keys(qa.sourceHashes).map(f=>[f,digest(fs.readFileSync(f))]));
const r1=JSON.parse(fs.readFileSync('docs/dev_new_version/v0.2.0/revisions/r1/candidate-manifest.json','utf8'));
const changes=Object.entries(sourceHashes).filter(([f,h])=>r1.inputHashes[f]!==h).map(([f])=>f);
const archiveChecks=Object.entries(r1.inputHashes).filter(([f])=>fs.existsSync('docs/dev_new_version/v0.2.0/revisions/r1/source/'+f)).map(([f,h])=>({path:f,match:digest(fs.readFileSync('docs/dev_new_version/v0.2.0/revisions/r1/source/'+f))===h}));
const extra=['.env.example','.github/workflows/pages.yml','.gitignore','README.md','public/THIRD_PARTY_NOTICES.txt'];
const manifest={...sourceHashes,...Object.fromEntries(extra.map(f=>[f,digest(fs.readFileSync(f))]))};
const result={checkedAt:new Date().toISOString(),node:process.version,branch:execFileSync('git',['branch','--show-current'],{encoding:'utf8'}).trim(),head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),scope:'r2定向预巡检，非实云/本人验收/部署',build:{command:'node node_modules/vite/bin/vite.js build --outDir .runtime/r2-watchdog-dist --base=/zelda_map/',exitCode:0,modules:98,jsKilobytes:696.02,gzipKilobytes:202.95,warning:'原有单包超过500kB体积提示'},privateConfiguration:{ignored:execFileSync('git',['check-ignore','.env.local'],{encoding:'utf8'}).trim()==='.env.local',mode:(fs.statSync('.env.local').mode&0o777).toString(8),databasePasswordUsesVitePrefix:env.split('\n').some(s=>/^VITE_[^=]+=/.test(s)&&s.slice(s.indexOf('=')+1).trim()===password),prospectiveFilesScanned:files.length,buildFilesScanned:buildFiles.length,exactSecretMatchCount:exactMatches.length,exactMatches},tokenScan:{matches:tokenMatches,scope:'拟入库文件，仅记录脱敏定位；合成值需人工判断'},sourceHashes,manifestHash:digest(JSON.stringify(manifest)),sourceMatchesQABuild:Object.entries(sourceHashes).every(([f,h])=>qa.sourceHashes[f]===h),changedFromR1:changes,r1Archive:{filesChecked:archiveChecks.length,checks:archiveChecks,allMatch:archiveChecks.every(c=>c.match)},dependenciesUnchanged:['package.json','package-lock.json'].every(f=>r1.inputHashes[f]===digest(fs.readFileSync(f))),buildHashes:Object.fromEntries(buildFiles.map(f=>[path.relative(build,f),digest(fs.readFileSync(f))]))};
fs.writeFileSync(path.join(out,'watchdog-results.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({privateConfiguration:result.privateConfiguration,tokenScan:result.tokenScan,manifestHash:result.manifestHash,sourceMatchesQABuild:result.sourceMatchesQABuild,changedFromR1:changes,r1ArchiveFiles:archiveChecks.length,r1ArchiveAllMatch:result.r1Archive.allMatch,dependenciesUnchanged:result.dependenciesUnchanged},null,2));
if(exactMatches.length||!result.privateConfiguration.ignored||result.privateConfiguration.mode!=='600'||result.privateConfiguration.databasePasswordUsesVitePrefix||!result.sourceMatchesQABuild||!result.r1Archive.allMatch)process.exitCode=1;
