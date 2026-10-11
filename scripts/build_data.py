#!/usr/bin/env python3
"""离线合并可追溯来源与人工内容；默认拒绝缺项，--allow-incomplete仅供开发。"""
import argparse
import hashlib
import json
import math
import re
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
LOCALES = ('zh', 'en', 'ja')
FIELDS = ('name', 'position', 'region', 'safe', 'intro', 'prerequisites', 'supplies', 'walkthrough')
REGION_IDS = ('hebra', 'tabantha', 'gerudo', 'wasteland', 'woodland', 'central', 'great-plateau', 'dueling-peaks', 'lake', 'eldin', 'akkala', 'lanayru', 'hateno', 'faron', 'ridgeland')
MISSING = dict(zip(LOCALES, ('资料待核实', 'Content awaiting verification', '資料は未確認です')))

def read(name):
    return json.loads((ROOT / name).read_text(encoding='utf-8'))

def digest(name):
    return hashlib.sha256((ROOT / name).read_bytes()).hexdigest()

def localized(value, label):
    if not isinstance(value, dict) or set(value) != set(LOCALES) or any(not isinstance(value[k], str) or not value[k].strip() for k in LOCALES):
        raise ValueError('三语结构错误：' + label)

def source_ref(value):
    if not isinstance(value, dict) or not {'id','title','url','retrievedAt'} <= set(value) or set(value) - {'id','title','url','retrievedAt','hash','locator'}:
        raise ValueError('额外来源结构错误')
    if any(not isinstance(v, str) or not v.strip() for v in value.values()):
        raise ValueError('来源字段必须为非空字符串：'+str(value.get('id')))
    parsed = urlparse(value['url'])
    if parsed.scheme not in ('http','https') or not parsed.netloc or parsed.username or parsed.password:
        raise ValueError('来源URL非法：'+value['id'])
    if 'hash' in value and not re.fullmatch(r'[0-9a-f]{64}', value['hash']):
        raise ValueError('来源hash非法：'+value['id'])

def within_ring(x, z, ring):
    inside = False
    j = len(ring) - 1
    for i, (xi, zi) in enumerate(ring):
        xj, zj = ring[j]
        if ((zi > z) != (zj > z)) and x < (xj - xi) * (z - zi) / (zj - zi) + xi:
            inside = not inside
        j = i
    return inside

def within_polygon(x, z, polygon):
    rings = polygon['coordinates']
    return within_ring(x, z, rings[0]) and not any(within_ring(x, z, r) for r in rings[1:])

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--allow-incomplete', action='store_true')
    args = parser.parse_args()
    seed = read('data/sources/shrines-seed.json')
    regions_source = read('data/sources/tower-regions.json')
    labels = read('data/sources/localizations.json')
    actors = read('data/sources/actor-localizations.json')
    wiki = {d['id']: d for d in read('data/sources/wiki-research.json')}
    chest_path = ROOT / 'data/sources/chests-research.json'
    chests = {d['id']: d for d in read('data/sources/chests-research.json')} if chest_path.exists() else {}
    ids = [f'Dungeon{i:03d}' for i in range(136)]
    if sorted(d['id'] for d in seed) != ids or sum(d['dlc'] for d in seed) != 16:
        raise ValueError('源名单必须精确136座、120本体+16DLC')
    original_dungeons = {d['MessageID']: d for d in read('data/sources/static.json')['markers']['Dungeon'] if re.fullmatch(r'Dungeon\d{3}', d.get('MessageID', ''))}
    if set(original_dungeons) != set(ids):
        raise ValueError('原始地图神庙ID与目录不一致')
    for item in seed:
        sid = item['id']
        if type(item['dlc']) is not bool or item['dlc'] != (int(sid[7:]) >= 120):
            raise ValueError('DLC归属错误：'+sid)
        if item['name'] != labels[sid] or item['trial'] != labels[sid+'_sub']:
            raise ValueError('名称/试炼名不符合原游戏文本：'+sid)
        if any(abs(item['position'][k] - original_dungeons[sid]['Translate'][k]) > 1e-6 for k in ('X','Y','Z')):
            raise ValueError('种子坐标与原始地图不同：'+sid)
    # 高塔是独立定位层，不能进入神庙目录或完成ID集合。
    raw_towers = read('data/sources/static.json')['markers']['Tower']
    tower_ids = [f'Tower{i:02d}' for i in range(1, 16)]
    if len(raw_towers) != 15 or sorted(t['MessageID'] for t in raw_towers) != tower_ids:
        raise ValueError('原始高塔必须精确15个唯一ID：Tower01..15')
    towers = []
    for raw in sorted(raw_towers, key=lambda t: t['MessageID']):
        tid = raw['MessageID']
        name = labels[tid]
        localized(name, tid+'.name')
        original = raw['Translate']
        if set(original) != {'X','Y','Z'} or any(type(v) not in (int,float) or not math.isfinite(v) for v in original.values()):
            raise ValueError('原始高塔坐标错误：'+tid)
        position = {k.lower(): v for k,v in original.items()}
        if not (-6000 <= position['x'] <= 6000 and -5000 <= position['z'] <= 5000):
            raise ValueError('高塔超出底图范围：'+tid)
        index = int(tid[5:]) - 1
        membership = [int(k) for k,polys in regions_source.items() if any(within_polygon(position['x'],position['z'],poly) for poly in polys)]
        if membership != [index]:
            raise ValueError(f'高塔编号与几何分区不一致：{tid} / {membership}')
        towers.append(dict(id=tid, name=name, position=position, regionId=REGION_IDS[index], sourceId='map-static', verification={
            'name':dict(status='verified', sourceIds=['game-labels'], note='StaticMsg同ID的中英日游戏标签。'),
            'position':dict(status='verified', sourceIds=['map-static'], note='markers.Tower / '+tid+'.Translate；X/Y/Z逐值保留，只转换字段大小写。'),
            'region':dict(status='verified', sourceIds=['tower-regions','map-static','game-labels'], note='同编号Tower分区，并以x/z点内测试复核唯一归属。'),
        }))
    contents = {}
    for path in sorted((ROOT / 'data/content').glob('*.json')):
        records = json.loads(path.read_text(encoding='utf-8'))
        if not isinstance(records, list):
            raise ValueError('内容分片必须为数组：' + str(path))
        for record in records:
            sid = record['id']
            if sid not in ids or sid in contents:
                raise ValueError('内容ID额外或重复：' + sid)
            contents[sid] = record
    date = '2026-10-11'
    sources = [
        dict(id='map-static', title='ZeldaMods · BOTW地图静态点位', url='https://objmap.zeldamods.org/game_files/map_summary/MainField/static.json', retrievedAt=date, hash=digest('data/sources/static.json'), locator='markers.Dungeon / Dungeon000..135'),
        dict(id='game-labels', title='BOTW游戏文本 · StaticMsg', url='https://sh0wer1ee.github.io/BotwText/page/StaticMsg.html', retrievedAt=date, hash=digest('data/sources/localization-static.html'), locator='DungeonXXX / DungeonXXX_sub / Tower01..15 / geographical labels'),
        dict(id='tower-regions', title='ZeldaMods · BOTW高塔分区边界', url='https://objmap.zeldamods.org/game_files/ecosystem/MapTower.json', retrievedAt=date, hash=digest('data/sources/tower-regions.json'), locator='15 polygons; plane x,z'),
        dict(id='actor-labels', title='BOTW游戏文本 · ActorType', url='https://sh0wer1ee.github.io/BotwText/page/ActorType.html', retrievedAt=date, hash=digest('data/sources/localization-actors.html'), locator='${actorID}_Name'),
    ]
    enemy_path = ROOT / 'data/sources/enemies-Dungeon078.json'
    if enemy_path.exists():
        sources.append(dict(id='enemies-Dungeon078', title='ZeldaMods Object Map · Dungeon078敌人', url='https://radar.zeldamods.org/objs/CDungeon/Dungeon078?q=actor%3A%5E%22Enemy_%22&withMapNames=false&limit=-1', retrievedAt=date, hash=digest('data/sources/enemies-Dungeon078.json'), locator='Enemy_Guardian_Mini_Middle = Guardian Scout III'))
    for record in contents.values():
        additional = record.get('additionalSources', [])
        if not isinstance(additional, list):
            raise ValueError('additionalSources须为数组：'+record['id'])
        for source in additional:
            source_ref(source)
            sources.append(source)
    regions = []
    for n, rid in enumerate(REGION_IDS):
        label = labels[f'Tower{n+1:02d}']
        regions.append(dict(id=rid, name={'zh':label['zh']+'分区', 'en':label['en']+' region', 'ja':label['ja']+'エリア'}))
    result = []
    gaps = []
    for item in seed:
        sid = item['id']
        for field in ('name', 'trial'):
            localized(item[field], sid + '.' + field)
        p = {k.lower():v for k,v in item['position'].items()}
        if set(p) != {'x','y','z'} or any(not isinstance(v,(int,float)) or not math.isfinite(v) for v in p.values()):
            raise ValueError('坐标错误：' + sid)
        if not (-6000 <= p['x'] <= 6000 and -5000 <= p['z'] <= 5000):
            raise ValueError('点位超出底图边界：'+sid)
        membership = [int(k) for k, polys in regions_source.items() if any(within_polygon(p['x'], p['z'], poly) for poly in polys)]
        if len(membership) != 1:
            raise ValueError(f'地区归属异常 {sid}: {membership}; 不自动就近补齐')
        rid = REGION_IDS[membership[0]]
        evidence = {f: dict(status='verified', sourceIds=['game-labels'] if f=='name' else ['map-static'] if f=='position' else ['tower-regions','game-labels']) for f in ('name','position','region')}
        record = contents.get(sid)
        w = wiki.get(sid)
        if w and w.get('ok') and w.get('text'):
            if item['name']['en'].lower() not in w['text'].lower():
                raise ValueError('Wiki正文与当前神庙身份不匹配：'+sid)
            sources.append(dict(id='wiki-'+sid, title=w['title'], url=w['url'], retrievedAt=date, hash=w['sha256'], locator='Entrance to the Shrine / Themes and Navigation'))
        if record:
            if not w or not w.get('ok') or record.get('sourceId') != 'wiki-'+sid:
                raise ValueError('作者来源不匹配：'+sid)
            safe, detail = record['safe'], record['detail'].copy()
            for f in ('summary','prerequisite'):
                localized(safe[f], sid+'.safe.'+f)
            localized(detail['intro'], sid+'.detail.intro')
            for f in ('prerequisites','walkthrough'):
                if not isinstance(detail[f],list) or not detail[f]:
                    raise ValueError('人工内容数组为空：'+sid+'.'+f)
                for n,val in enumerate(detail[f]): localized(val, f'{sid}.{f}[{n}]')
            if len(detail['walkthrough']) < 2:
                raise ValueError('攻略至少两步：'+sid)
            for f in ('safe','intro','prerequisites','walkthrough'):
                evidence[f]=dict(status='verified', sourceIds=['wiki-'+sid], note=record.get('note','本站原创整理及三语译述；作者已核对入口和机关正文。'))
            if sid == 'Dungeon078' and enemy_path.exists():
                for f in ('intro', 'walkthrough'):
                    evidence[f]['sourceIds'] += ['enemies-Dungeon078', 'actor-labels']
                    evidence[f]['note'] += ' Wiki后段敌人等级存在矛盾；游戏对象Enemy_Guardian_Mini_Middle与三语文本确认Scout III，已按游戏源解决。'
            overrides = record.get('evidenceOverrides', {})
            if not isinstance(overrides, dict) or set(overrides) - set(FIELDS):
                raise ValueError('evidenceOverrides字段非法：'+sid)
            for field, source_ids in overrides.items():
                if not isinstance(source_ids, list) or any(not isinstance(v, str) or not v for v in source_ids):
                    raise ValueError('额外字段证据须为来源ID数组：'+sid+'.'+field)
        else:
            safe = dict(summary=MISSING.copy(), prerequisite=MISSING.copy())
            detail = dict(intro=MISSING.copy(), prerequisites=[MISSING.copy()], walkthrough=[MISSING.copy()])
            for f in ('safe','intro','prerequisites','walkthrough'):
                evidence[f]=dict(status='unverified',sourceIds=[],note='缺少逐座人工核实内容')
                gaps.append(sid+'.'+f)
        c = chests.get(sid)
        supplies = []
        missing_actors = []
        if c and c.get('ok'):
            sources.append(dict(id='chests-'+sid,title='ZeldaMods Object Map · '+sid+' 宝箱',url=c['url'],retrievedAt=date,hash=c['sha256'],locator='CDungeon / TBox_* / drop actorID'))
            seen_chests = set()
            for obj in c['objects']:
                if not obj.get('name','').startswith('TBox_') or obj.get('map_name') != sid or obj.get('objid') in seen_chests:
                    raise ValueError('宝箱对象额外/重复或跨神庙：'+sid)
                seen_chests.add(obj['objid'])
                drop = obj.get('drop')
                if not isinstance(drop,list) or len(drop)!=2 or drop[0]!=1 or not isinstance(drop[1],str):
                    missing_actors.append(str(obj.get('objid'))+': drop缺失'); continue
                actor = drop[1]
                name = actors.get(actor+'_Name')
                if not name:
                    missing_actors.append(actor); continue
                localized(name, sid+'.supply.'+actor)
                supplies.append({key: ('宝箱：' if key=='zh' else 'Chest: ' if key=='en' else '宝箱：')+name[key] for key in LOCALES})
            if missing_actors:
                evidence['supplies']=dict(status='unverified',sourceIds=['chests-'+sid,'actor-labels'],note='物资译名/drop缺失：'+', '.join(missing_actors))
                gaps.append(sid+'.supplies')
                supplies.append(MISSING.copy())
            else:
                evidence['supplies']=dict(status='verified',sourceIds=['chests-'+sid,'actor-labels'],note='每项对应源中一个TBox。drop首值不是堆叠数量，不虚构数量；本栏只列神庙内宝箱，不含神庙外宝箱或地面武器。')
        else:
            supplies=[MISSING.copy()]
            evidence['supplies']=dict(status='unverified',sourceIds=[],note='宝箱来源未采集成功')
            gaps.append(sid+'.supplies')
        if sid == 'Dungeon017' and c and c.get('ok'):
            evidence['supplies'] = dict(status='conflict', sourceIds=['chests-Dungeon017','actor-labels','wiki-Dungeon017'], note='宝箱来源有差异：游戏对象objid25353的drop=[1,Weapon_Lsword_041]，游戏三语文本为戒心长刀 / Eightfold Longblade / 残心の太刀；Wiki写静心大剑 / Edge of Duality / 無心の大剣（Weapon_Lsword_055）。展示保留游戏对象的基础物资。原对象sharp_weapon_judge_type=0、one_hit_mode=0、spawns_with_lotm=0；这些字段尚不能证明差异是版本、缩放或DLC变化，原因未确认。')
        if sid == 'Dungeon017' and evidence['supplies']['status'] == 'conflict':
            evidence['supplies']['displayNote'] = {'zh':'此处展示游戏基础物资“戒心长刀”，Wiki却列为“静心大剑”。差异原因尚未确认，不能据此推断版本或缩放变化。', 'en':'The game’s base drop shown here is Eightfold Longblade, while the Wiki lists Edge of Duality. The cause is unconfirmed; version or scaling changes cannot be inferred.', 'ja':'ここではゲームの基本ドロップ「残心の太刀」を表示していますが、Wikiは「無心の大剣」と記載。差異の原因は未確認で、バージョンや補正の変化とは断定できません。'}
        if record:
            for field, source_ids in overrides.items():
                evidence[field]['sourceIds'] = list(dict.fromkeys(evidence[field]['sourceIds'] + source_ids))
        detail['supplies']=supplies
        result.append(dict(id=sid,sourceId='wiki-'+sid,name=item['name'],trial=item['trial'],regionId=rid,dlc=item['dlc'],position=p,safe=safe,detail=detail,verification=evidence))
    all_source_ids = [s['id'] for s in sources]
    if len(all_source_ids) != len(set(all_source_ids)):
        raise ValueError('来源ID重复：'+', '.join(sorted(s for s in set(all_source_ids) if all_source_ids.count(s)>1)))
    known_sources = set(all_source_ids)
    for s in sources:
        source_ref(s)
    for shrine in result + towers:
        if shrine['sourceId'] not in known_sources:
            raise ValueError('主来源不存在：'+shrine['id'])
        for field, evidence in shrine['verification'].items():
            if set(evidence['sourceIds']) - known_sources:
                raise ValueError('字段来源引用不存在：'+shrine['id']+'.'+field)
            if evidence['status'] == 'verified' and not evidence['sourceIds']:
                raise ValueError('已核实字段缺少来源：'+shrine['id']+'.'+field)
    if gaps and not args.allow_incomplete:
        raise ValueError(f'{len(gaps)}个字段缺项；默认拒绝生成完整数据：'+', '.join(gaps[:20]))
    dataset = dict(schemaVersion=1,dataVersion='v0.1.0-20261011-r2',game='botw',generatedAt=datetime.now(timezone.utc).isoformat(),regions=regions,sources=sources,shrines=result,towers=towers)
    dest=ROOT/'public/data/shrines.json'; dest.parent.mkdir(parents=True,exist_ok=True)
    temp = dest.with_suffix('.json.tmp')
    temp.write_text(json.dumps(dataset,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    temp.replace(dest)
    conflicts = [s['id']+'.'+field for s in result for field,evidence in s['verification'].items() if evidence['status']=='conflict']
    print(json.dumps(dict(shrines=len(result),towers=len(towers),base=sum(not s['dlc'] for s in result),dlc=sum(s['dlc'] for s in result),authored=len(contents),missingFields=len(gaps),gaps=gaps,conflicts=conflicts),ensure_ascii=False))

if __name__ == '__main__':
    main()
