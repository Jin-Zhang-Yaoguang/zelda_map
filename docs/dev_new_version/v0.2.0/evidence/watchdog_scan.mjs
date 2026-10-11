import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
// 只输出匹配数和路径，不打印私密配置、密码内容或其哈希。
const root=process.cwd(), build=path.join(root,'.runtime/watchdog-dist');
const digest=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const files=execFileSync('git',['ls-files','-c','-o','--exclude-standard','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
const privateEnv=fs.readFileSync('.env.local','utf8');
const secret=privateEnv.match(/^SUPABASE_DB_PASSWORD=(.*)$/m)?.[1]?.trim();
if(!secret)throw Error('Missing local secret: content will not be reported');
const databasePasswordUsesVitePrefix=privateEnv.split('\n').some(line=>/^VITE_[^=]+=/.test(line)&&line.slice(line.indexOf('=')+1).trim()===secret);
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
const leaks=[];let sourceCount=0,buildCount=0;
for(const file of files){if(!fs.existsSync(file)||!fs.statSync(file).isFile())continue;sourceCount++;if(fs.readFileSync(file).includes(Buffer.from(secret)))leaks.push({scope:'prospectiveGitFiles',file});}
for(const file of walk(build)){buildCount++;if(fs.readFileSync(file).includes(Buffer.from(secret)))leaks.push({scope:'build',file:path.relative(root,file)});}
const ignored=execFileSync('git',['check-ignore','.env.local'],{encoding:'utf8'}).trim()==='.env.local';
const envMode=(fs.statSync('.env.local').mode & 0o777).toString(8);
const notice=fs.readFileSync('public/THIRD_PARTY_NOTICES.txt','utf8').replace(/\r\n/g,'\n');
const packages=['@supabase/supabase-js','@supabase/auth-js','@supabase/postgrest-js','@supabase/functions-js','@supabase/realtime-js','@supabase/storage-js','@supabase/phoenix','iceberg-js','tslib','vite'];
const licenseChecks=packages.map(name=>{const pkg=JSON.parse(fs.readFileSync(path.join('node_modules',name,'package.json'),'utf8'));const dir=path.join('node_modules',name);const lf=fs.readdirSync(dir).find(f=>/^licen[cs]e(?:\.|$)/i.test(f));return {name,version:pkg.version,license:pkg.license,noticeHasVersion:notice.toLowerCase().includes(`${name} ${pkg.version}`.toLowerCase()),licenseFile:lf??null,exactLicenseIncluded:lf?notice.includes(fs.readFileSync(path.join(dir,lf),'utf8').replace(/\r\n/g,'\n').trim()):false};});
const scoped=files.filter(f=>/^(src\/|supabase\/migrations\/|package(?:-lock)?\.json$|\.github\/workflows\/pages\.yml$|\.gitignore$|\.env\.example$|public\/THIRD_PARTY_NOTICES\.txt$|README\.md$)/.test(f));
const candidate=Object.fromEntries(scoped.map(f=>[f,digest(fs.readFileSync(f))]));
const result={checkedAt:new Date().toISOString(),branch:execFileSync('git',['branch','--show-current'],{encoding:'utf8'}).trim(),baseCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),privateConfiguration:{ignored,mode:envMode,databasePasswordUsesVitePrefix,prospectiveGitFilesScanned:sourceCount,buildFilesScanned:buildCount,exactSecretMatches:leaks.length,leaks},licenseChecks,candidateHashes:candidate,buildHashes:Object.fromEntries(walk(build).map(f=>[path.relative(build,f),digest(fs.readFileSync(f))]))};
fs.writeFileSync('docs/dev_new_version/v0.2.0/evidence/watchdog-results.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({ignored,envMode,exactSecretMatches:leaks.length,sourceCount,buildCount,licenseChecks},null,2));
if(!ignored||envMode!=='600'||databasePasswordUsesVitePrefix||leaks.length||licenseChecks.some(p=>!p.noticeHasVersion||!p.exactLicenseIncluded))process.exitCode=1;
