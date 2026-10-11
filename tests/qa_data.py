#!/usr/bin/env python3
"""独立读取原始快照复核；不调用生产构建函数，不把核实旗标当事实。"""
import hashlib, json, math, re
from pathlib import Path
from html.parser import HTMLParser
from collections import Counter
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs/dev_new_version/v0.1.0/evidence'
OUT.mkdir(parents=True,exist_ok=True)
read=lambda p:json.loads((ROOT/p).read_text())
data=read('public/data/shrines.json')
schema=read('data/schema/shrines.schema.json')
errors=[]
def check(value,rule,where='$'):
    if '$ref' in rule:
        r=schema
        for part in rule['$ref'][2:].split('/'):r=r[part]
        return check(value,r,where)
    t=rule.get('type')
    types={'object':lambda x:isinstance(x,dict),'array':lambda x:isinstance(x,list),'string':lambda x:isinstance(x,str),'number':lambda x:type(x) in (float,int) and math.isfinite(x),'boolean':lambda x:type(x) is bool}
    if t and not types[t](value): errors.append(where+': type');return
    if 'const' in rule and value!=rule['const']:errors.append(where+': const')
    if 'enum' in rule and value not in rule['enum']:errors.append(where+': enum')
    if t=='object':
        for k in rule.get('required',[]):
            if k not in value:errors.append(where+'.'+k+': missing')
        for k,v in value.items():
            if k in rule.get('properties',{}):check(v,rule['properties'][k],where+'.'+k)
            elif rule.get('additionalProperties') is False:errors.append(where+'.'+k+': extra')
    if t=='array':
        if len(value)<rule.get('minItems',0) or len(value)>rule.get('maxItems',float('inf')):errors.append(where+': size')
        for i,v in enumerate(value):check(v,rule.get('items',{}),where+f'[{i}]')
    if t=='string':
        if len(value)<rule.get('minLength',0):errors.append(where+': length')
        if 'pattern' in rule and not re.search(rule['pattern'],value):errors.append(where+': pattern')
check(data,schema)
class Rows(HTMLParser):
    def __init__(self):super().__init__();self.rows={};self.cells=[];self.incell=False;self.s='';self.ruby=False
    def handle_starttag(self,tag,attrs):
        if tag=='tr':self.cells=[]
        if tag=='td':self.incell=True;self.s=''
        if tag=='rt':self.ruby=True
    def handle_endtag(self,tag):
        if tag=='rt':self.ruby=False
        if tag=='td':self.cells.append(re.sub(r'\s+','',self.s));self.incell=False
        if tag=='tr' and len(self.cells)==5:self.rows[self.cells[0]]={'zh':self.cells[1],'ja':self.cells[2],'en':self.cells[4]}
    def handle_data(self,text):
        if self.incell and not self.ruby:self.s+=text
def labels(file):
    p=Rows();p.feed((ROOT/file).read_text());return p.rows
texts=labels('data/sources/localization-static.html')
actors=labels('data/sources/localization-actors.html')
original={s['MessageID']:s for s in read('data/sources/static.json')['markers']['Dungeon'] if re.fullmatch(r'Dungeon\d{3}',s.get('MessageID',''))}
polygons=read('data/sources/tower-regions.json')
regions=['hebra','tabantha','gerudo','wasteland','woodland','central','great-plateau','dueling-peaks','lake','eldin','akkala','lanayru','hateno','faron','ridgeland']
def winding(point,ring):
    x,z=point;n=0
    for a,b in zip(ring,ring[1:]+ring[:1]):
        side=(b[0]-a[0])*(z-a[1])-(x-a[0])*(b[1]-a[1])
        if a[1]<=z<b[1] and side>0:n+=1
        if b[1]<=z<a[1] and side<0:n-=1
    return n!=0
def polygon(point,p):return winding(point,p['coordinates'][0]) and not any(winding(point,r) for r in p['coordinates'][1:])
chests={s['id']:s for s in read('data/sources/chests-research.json')}
wikis={s['id']:s for s in read('data/sources/wiki-research.json')}
sources={s['id']:s for s in data['sources']}
all_ids=[f'Dungeon{i:03d}' for i in range(136)]
if sorted(s['id'] for s in data['shrines'])!=all_ids:errors.append('目录ID差异')
if set(original)!=set(all_ids):errors.append('原始ID差异')
safe_candidates=[];gaps=[];conflicts=[];rows=[];projection=[]
for s in data['shrines']:
    sid=s['id'];p=s['position'];raw=original[sid]['Translate']
    for k in ['x','y','z']:
        if abs(p[k]-raw[k.upper()])>1e-6:errors.append(sid+'.position.'+k)
    for key,label in [('name',sid),('trial',sid+'_sub')]:
        for locale in ['zh','en','ja']:
            if re.sub(r'\s+','',s[key][locale])!=texts[label][locale]:errors.append(sid+'.'+key+'.'+locale)
    if s['dlc']!=(int(sid[7:])>=120):errors.append(sid+'.dlc')
    member=[int(k) for k,ps in polygons.items() if any(polygon((p['x'],p['z']),poly) for poly in ps)]
    if len(member)!=1 or s['regionId']!=regions[member[0]]:errors.append(sid+'.region '+str(member))
    u=(p['x']+6000)/4;v=(p['z']+5000)/4
    if not 0<=u<=3000 or not 0<=v<=2500:errors.append(sid+'.projection range')
    projection.append({'id':sid,'u':u,'v':v,'lat':-v,'lng':u,'regionId':s['regionId']})
    for field,e in s['verification'].items():
        if e['status']=='unverified':gaps.append(sid+'.'+field+': '+e['status'])
        if e['status']=='conflict':conflicts.append({'id':sid,'field':field,'note':e.get('note'),'displayNote':e.get('displayNote'),'sourceIds':e['sourceIds']})
        if any(k not in sources for k in e['sourceIds']):errors.append(sid+'.'+field+' unknown source')
        if e['status']=='verified' and not e['sourceIds']:errors.append(sid+'.'+field+' no source')
    if sid not in wikis or s['name']['en'].lower() not in wikis[sid]['text'].lower():errors.append(sid+'.wiki identity')
    expected=[{l:('宝箱：' if l=='zh' else 'Chest: ' if l=='en' else '宝箱：')+actors[o['drop'][1]+'_Name'][l] for l in ['zh','en','ja']} for o in chests[sid]['objects']]
    normalize=lambda values:[{l:re.sub(r'\s+','',v[l]) for l in ['zh','en','ja']} for v in values]
    if normalize(expected)!=normalize(s['detail']['supplies']):errors.append(sid+'.supplies source mapping')
    for loc in ['zh','en','ja']:
        for f in ['summary','prerequisite']:
            text=s['safe'][f][loc];rows.append('\t'.join([sid,loc,f,text]))
            if re.search(r'宝箱|chest|reward|Spirit Orb|スピリットオーブ|宝珠|精灵之球|奖[励赏]',text,re.I):safe_candidates.append({'id':sid,'locale':loc,'field':f,'text':text})
            if re.search(r'待核实|awaiting verification|未確認',text,re.I):gaps.append(sid+'.safe.'+f+'.'+loc)
    for f in ['prerequisites','supplies','walkthrough']:
        if not s['detail'][f]:gaps.append(sid+'.'+f+' empty')
    if len(s['detail']['walkthrough'])<2:errors.append(sid+'.walkthrough <2')
summary={
    'datasetVersion':data['dataVersion'],'generatedAt':data['generatedAt'],
    'sha256':hashlib.sha256((ROOT/'public/data/shrines.json').read_bytes()).hexdigest(),
    'count':len(data['shrines']),'base':sum(not s['dlc'] for s in data['shrines']),
    'dlc':sum(s['dlc'] for s in data['shrines']),
    'chests':sum(len(s['detail']['supplies']) for s in data['shrines']),
    'sources':len(sources),'regions':dict(Counter(s['regionId'] for s in data['shrines'])),
    'errors':errors,'unverifiedFields':gaps,'sourceConflicts':conflicts,'safeCandidates':safe_candidates,
    'uniqueIntroByLanguage':{l:len(set(s['detail']['intro'][l] for s in data['shrines'])) for l in ['zh','en','ja']},
    'uniqueWalkthroughByLanguage':{l:len(set('|'.join(a[l] for a in s['detail']['walkthrough']) for s in data['shrines'])) for l in ['zh','en','ja']},
    'boundary':('结构、原始游戏文本/点位/分区和宝箱drop全量比对；verification仅列报，未作为事实通过依据。'
                '攻略语义另做人工源对照。已明示且保留来源的017物资差异单列，不伪装消除。')
}
(OUT/'data-results.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
(OUT/'safe-texts.tsv').write_text('id\tlocale\tfield\ttext\n'+'\n'.join(rows)+'\n')
(OUT/'projection.json').write_text(json.dumps(projection,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(summary,ensure_ascii=False))
raise SystemExit(bool(errors or gaps or safe_candidates))
