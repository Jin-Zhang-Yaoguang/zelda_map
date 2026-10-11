#!/usr/bin/env python3
"""r2 独立数据复核：读取原始缓存，不调用生产构建函数，不覆盖 r1 证据。"""
import copy
import hashlib
import json
import math
import re
import subprocess
from collections import Counter
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/dev_new_version/v0.1.0/evidence/r2'
EXPECTED_SHA = '4938b62b72cbeed84e85b4d7ae7e37a60e6bd729de17debd2f6f8892c37b3fde'
LOCALES = ('zh', 'en', 'ja')
SHRINE_IDS = [f'Dungeon{i:03d}' for i in range(136)]
TOWER_IDS = [f'Tower{i:02d}' for i in range(1, 16)]
# 分区编号来自 MapTower 原始缓存；塔名另从原始 HTML 核对。
REGION_IDS = ['hebra', 'tabantha', 'gerudo', 'wasteland', 'woodland',
              'central', 'great-plateau', 'dueling-peaks', 'lake', 'eldin',
              'akkala', 'lanayru', 'hateno', 'faron', 'ridgeland']
ENGLISH_TOWERS = ['Hebra Tower', 'Tabantha Tower', 'Gerudo Tower', 'Wasteland Tower',
                  'Woodland Tower', 'Central Tower', 'Great Plateau Tower',
                  'Dueling Peaks Tower', 'Lake Tower', 'Eldin Tower', 'Akkala Tower',
                  'Lanayru Tower', 'Hateno Tower', 'Faron Tower', 'Ridgeland Tower']
errors = []
gaps = []
safe_candidates = []
source_conflicts = []


def read(path):
    return json.loads((ROOT / path).read_text())


def digest(path):
    return hashlib.sha256((ROOT / path).read_bytes()).hexdigest()


def expect(condition, message):
    if not condition:
        errors.append(message)


data = read('public/data/shrines.json')
schema = read('data/schema/shrines.schema.json')


def check_schema(value, rule, where='$'):
    """覆盖本项目 Schema 使用的 type/ref/const/enum/required/size/pattern 等约束。"""
    issues = []
    if '$ref' in rule:
        target = schema
        for part in rule['$ref'][2:].split('/'):
            target = target[part]
        return check_schema(value, target, where)
    typ = rule.get('type')
    predicates = {'object': lambda x: isinstance(x, dict),
                  'array': lambda x: isinstance(x, list),
                  'string': lambda x: isinstance(x, str),
                  'number': lambda x: type(x) in (float, int) and math.isfinite(x),
                  'boolean': lambda x: type(x) is bool}
    if typ and not predicates[typ](value):
        return [where + ': type']
    if 'const' in rule and (value != rule['const'] or type(value) is not type(rule['const'])):
        issues.append(where + ': const')
    if 'enum' in rule and value not in rule['enum']:
        issues.append(where + ': enum')
    if typ == 'object':
        issues.extend(where + '.' + key + ': missing' for key in rule.get('required', []) if key not in value)
        for key, val in value.items():
            if key in rule.get('properties', {}):
                issues.extend(check_schema(val, rule['properties'][key], where + '.' + key))
            elif rule.get('additionalProperties') is False:
                issues.append(where + '.' + key + ': extra')
    elif typ == 'array':
        if not rule.get('minItems', 0) <= len(value) <= rule.get('maxItems', math.inf):
            issues.append(where + ': size')
        for index, val in enumerate(value):
            issues.extend(check_schema(val, rule.get('items', {}), where + f'[{index}]'))
    elif typ == 'string':
        if len(value) < rule.get('minLength', 0):
            issues.append(where + ': length')
        if 'pattern' in rule and not re.search(rule['pattern'], value):
            issues.append(where + ': pattern')
    return issues


errors.extend(check_schema(data, schema))
expect('towers' in schema['required'], 'Schema 根未必需 towers')
expect(schema['properties']['towers']['minItems'] == schema['properties']['towers']['maxItems'] == 15,
       'Schema 塔数量约束不是 15')
expect(set(schema['$defs']['tower']['required']) == {'id', 'name', 'position', 'regionId', 'sourceId', 'verification'},
       'Schema 塔必需字段不符')
expect(set(schema['$defs']['tower']['properties']['verification']['required']) == {'name', 'position', 'region'},
       'Schema 塔证据必需字段不符')
schema_negative_tests = []
mutations = [
    ('缺少 towers 根字段', lambda v: v.pop('towers')),
    ('只有 14 座塔', lambda v: v['towers'].pop()),
    ('存在第 16 座塔', lambda v: v['towers'].append(copy.deepcopy(v['towers'][0]))),
    ('Tower00 ID', lambda v: v['towers'][0].update(id='Tower00')),
    ('Tower16 ID', lambda v: v['towers'][0].update(id='Tower16')),
    ('塔三语值为空', lambda v: v['towers'][0]['name'].update(zh='')),
    ('塔缺少日语名', lambda v: v['towers'][0]['name'].pop('ja')),
    ('塔 XYZ 非有限值', lambda v: v['towers'][0]['position'].update(x=math.inf)),
    ('塔缺少高度 y', lambda v: v['towers'][0]['position'].pop('y')),
    ('塔意外新增 dlc 字段', lambda v: v['towers'][0].update(dlc=False)),
    ('塔缺少 region 证据', lambda v: v['towers'][0]['verification'].pop('region')),
]
for title, mutate in mutations:
    candidate = copy.deepcopy(data)
    mutate(candidate)
    rejected = bool(check_schema(candidate, schema))
    schema_negative_tests.append({'case': title, 'rejected': rejected})
    expect(rejected, 'Schema 未拒绝：' + title)


class GameTextTable(HTMLParser):
    """逐行读取原始游戏文本表，保留 ruby 正文字，去掉 rt/rp 注音。"""
    def __init__(self):
        super().__init__()
        self.rows = {}
        self.cells = []
        self.incell = False
        self.parts = []
        self.ruby_annotation_depth = 0
        self.duplicates = []
        self.row_variants = {}

    def handle_starttag(self, tag, attrs):
        if tag == 'tr':
            self.cells = []
        if tag == 'td':
            self.incell = True
            self.parts = []
        if tag in ('rt', 'rp'):
            self.ruby_annotation_depth += 1

    def handle_endtag(self, tag):
        if tag in ('rt', 'rp'):
            self.ruby_annotation_depth = max(0, self.ruby_annotation_depth - 1)
        if tag == 'td':
            self.cells.append(re.sub(r'\s+', ' ', ''.join(self.parts)).strip())
            self.incell = False
        if tag == 'tr' and len(self.cells) == 5:
            ident = self.cells[0]
            if ident in self.rows:
                self.duplicates.append(ident)
            self.rows[ident] = {'zh': self.cells[1], 'ja': self.cells[2], 'en': self.cells[4]}
            self.row_variants.setdefault(ident, []).append(self.rows[ident])

    def handle_data(self, value):
        if self.incell and self.ruby_annotation_depth == 0:
            self.parts.append(value)


def table(path):
    parsed = GameTextTable()
    parsed.feed((ROOT / path).read_text())
    return parsed


static_texts = table('data/sources/localization-static.html')
actor_texts = table('data/sources/localization-actors.html')
texts, actors = static_texts.rows, actor_texts.rows
relevant_labels = SHRINE_IDS + TOWER_IDS + [ident + '_sub' for ident in SHRINE_IDS]
label_conflicts = [ident for ident in relevant_labels if
                  len({tuple(re.sub(r'\s+', '', row[locale]) for locale in LOCALES)
                       for row in static_texts.row_variants.get(ident, [])}) > 1]
expect(not label_conflicts, '原始名称表同 ID 存在异值：' + str(label_conflicts))
raw_static = read('data/sources/static.json')['markers']
raw_shrines = {s['MessageID']: s for s in raw_static['Dungeon'] if re.fullmatch(r'Dungeon\d{3}', s.get('MessageID', ''))}
raw_towers = {s['MessageID']: s for s in raw_static['Tower']}
polygons = read('data/sources/tower-regions.json')
expect(sorted(raw_shrines) == SHRINE_IDS, '原始神庙 ID 不等于 000..135')
expect(sorted(raw_towers) == TOWER_IDS and len(raw_static['Tower']) == 15, '原始塔 ID 不等于 01..15')
expect(sorted(t['id'] for t in data['towers']) == TOWER_IDS, '生产塔 ID 不等于唯一 01..15')
expect(sorted(s['id'] for s in data['shrines']) == SHRINE_IDS, '生产神庙 ID 不等于唯一 000..135')
expect(set(t['id'] for t in data['towers']).isdisjoint(s['id'] for s in data['shrines']), '塔污染神庙 ID')
sources = {s['id']: s for s in data['sources']}
regions = {r['id']: r for r in data['regions']}
expect(len(sources) == len(data['sources']), '来源 ID 重复')
expect(len(regions) == 15 and set(regions) == set(REGION_IDS), '地区 ID 差异')


def winding(point, ring):
    x, z = point
    number = 0
    for a, b in zip(ring, ring[1:] + ring[:1]):
        cross = (b[0] - a[0]) * (z - a[1]) - (x - a[0]) * (b[1] - a[1])
        if a[1] <= z < b[1] and cross > 0:
            number += 1
        if b[1] <= z < a[1] and cross < 0:
            number -= 1
    return number != 0


def member_indices(position):
    point = position['x'], position['z']
    return [int(key) for key, group in polygons.items()
            if any(winding(point, poly['coordinates'][0]) and
                   not any(winding(point, hole) for hole in poly['coordinates'][1:]) for poly in group)]


def normalize(value):
    return re.sub(r'\s+', '', value)


def audit_position(record, original):
    ident, position = record['id'], record['position']
    delta = {axis: abs(position[axis] - original['Translate'][axis.upper()]) for axis in ('x', 'y', 'z')}
    expect(all(value <= 1e-6 for value in delta.values()), ident + '.XYZ 映射差异')
    members = member_indices(position)
    expect(len(members) == 1 and record['regionId'] == REGION_IDS[members[0]], ident + '.region 映射差异 ' + str(members))
    u, v = (position['x'] + 6000) / 4, (position['z'] + 5000) / 4
    expect(0 <= u <= 3000 and 0 <= v <= 2500, ident + '.projection 越界')
    expect(abs((u * 4 - 6000) - position['x']) <= 1e-6 and abs((v * 4 - 5000) - position['z']) <= 1e-6,
           ident + '.projection 逆变换差异')
    return {'id': ident, 'position': position, 'axisDelta': delta, 'polygonIndices': members,
            'regionId': record['regionId'], 'projection': {'u': u, 'v': v, 'lat': -v, 'lng': u}}


def audit_evidence(record):
    ident = record['id']
    expect(record['sourceId'] in sources, ident + '.sourceId 未知')
    expect(record['regionId'] in regions, ident + '.regionId 未知')
    for field, evidence in record['verification'].items():
        if evidence['status'] == 'unverified':
            gaps.append(ident + '.' + field)
        if evidence['status'] == 'conflict':
            source_conflicts.append({'id': ident, 'field': field, **evidence})
        expect(all(source in sources for source in evidence['sourceIds']), ident + '.' + field + ' 未知证据来源')
        expect(bool(evidence['sourceIds']), ident + '.' + field + ' 缺少证据来源')


tower_results = []
for tower in data['towers']:
    ident = tower['id']
    result = audit_position(tower, raw_towers[ident])
    index = int(ident[5:]) - 1
    expect(normalize(texts[ident]['en']) == normalize(ENGLISH_TOWERS[index]), ident + ' 原始名称与编号对应差异')
    expect(tower['regionId'] == REGION_IDS[index], ident + ' 塔编号与地区差异')
    for locale in LOCALES:
        expect(normalize(tower['name'][locale]) == normalize(texts[ident][locale]), ident + '.name.' + locale)
    audit_evidence(tower)
    expect(tower['verification']['name']['sourceIds'] == ['game-labels'], ident + ' 名称来源不符')
    expect(tower['verification']['position']['sourceIds'] == ['map-static'], ident + ' 坐标来源不符')
    expect('tower-regions' in tower['verification']['region']['sourceIds'], ident + ' 分区来源缺失')
    result.update(name=tower['name'], rawHtmlName=texts[ident], sourceId=tower['sourceId'])
    tower_results.append(result)


chests = {record['id']: record for record in read('data/sources/chests-research.json')}
wikis = {record['id']: record for record in read('data/sources/wiki-research.json')}
expect(sorted(chests) == SHRINE_IDS, '宝箱来源目录 ID 差异')
expect(sorted(wikis) == SHRINE_IDS, 'Wiki 来源目录 ID 差异')
shrine_results = []
raw_chest_count = 0
for shrine in data['shrines']:
    ident = shrine['id']
    result = audit_position(shrine, raw_shrines[ident])
    for field, label in [('name', ident), ('trial', ident + '_sub')]:
        for locale in LOCALES:
            expect(normalize(shrine[field][locale]) == normalize(texts[label][locale]), ident + '.' + field + '.' + locale)
    expect(shrine['dlc'] == (int(ident[7:]) >= 120), ident + '.DLC 分类错误')
    audit_evidence(shrine)
    wiki_html = (ROOT / f'data/sources/wiki/{ident}.html').read_text()
    expect(shrine['name']['en'].lower() in wikis[ident]['text'].lower(), ident + ' Wiki 摘录身份不符')
    expect(shrine['name']['en'].lower() in wiki_html.lower(), ident + ' 原始 Wiki 身份不符')
    raw_objects = read(f'data/sources/chests/{ident}.json')
    expect(raw_objects == chests[ident]['objects'], ident + ' 宝箱研究表与原始缓存不一致')
    expected_supplies = []
    for obj in raw_objects:
        expect(obj['map_name'] == ident and obj['map_type'] == 'CDungeon' and obj['name'].startswith('TBox_'),
               ident + ' 宝箱所属地图/类型差异')
        actor = obj['drop'][1] + '_Name'
        expect(actor in actors, ident + ' 缺少原始宝箱物品名 ' + actor)
        actor_variants = {tuple(normalize(row[locale]) for locale in LOCALES)
                          for row in actor_texts.row_variants.get(actor, [])}
        expect(len(actor_variants) == 1, ident + ' 宝箱物品原始标签存在同 ID 异值 ' + actor)
        expected_supplies.append({locale: ('Chest: ' if locale == 'en' else '宝箱：') + actors[actor][locale] for locale in LOCALES})
    raw_chest_count += len(raw_objects)
    compact = lambda items: [{locale: normalize(item[locale]) for locale in LOCALES} for item in items]
    expect(compact(expected_supplies) == compact(shrine['detail']['supplies']), ident + ' 原始宝箱 drop 三语映射不符')
    for locale in LOCALES:
        for field in ('summary', 'prerequisite'):
            text = shrine['safe'][field][locale]
            if re.search(r'宝箱|chest|reward|Spirit Orb|スピリットオーブ|宝珠|精灵之球|奖[励赏]', text, re.I):
                safe_candidates.append({'id': ident, 'locale': locale, 'field': field, 'text': text})
            if re.search(r'待核实|awaiting verification|未確認', text, re.I):
                gaps.append(ident + '.safe.' + field + '.' + locale)
    for field in ('prerequisites', 'supplies', 'walkthrough'):
        if not shrine['detail'][field]:
            gaps.append(ident + '.' + field + ' empty')
    expect(len(shrine['detail']['walkthrough']) >= 2, ident + ' 详细攻略少于两步')
    result['chests'] = len(raw_objects)
    shrine_results.append(result)


# 明示既有事实差异；其原因仍未解决。验证旗标只核对是否正确暴露差异。
conflict_shrine = next(s for s in data['shrines'] if s['id'] == 'Dungeon017')
conflict_object = read('data/sources/chests/Dungeon017.json')[0]
expect(conflict_object['drop'][1] == 'Weapon_Lsword_041', '017 原始基础掉落变动')
expect('Edge of Duality' in (ROOT / 'data/sources/wiki/Dungeon017.html').read_text(), '017 Wiki 原始差异证据缺失')
expect(actors['Weapon_Lsword_041_Name']['en'] != actors['Weapon_Lsword_055_Name']['en'], '017 两物品游戏文本未区分')
conflict_evidence = conflict_shrine['verification']['supplies']
expect(conflict_evidence['status'] == 'conflict', '017 既有源冲突未明示')
expect({'chests-Dungeon017', 'actor-labels', 'wiki-Dungeon017'} <= set(conflict_evidence['sourceIds']), '017 未关联双方来源')
expect(all(conflict_evidence.get('displayNote', {}).get(locale, '').strip() for locale in LOCALES), '017 三语冲突说明缺失')


# 按原始文件字节重算哈希，同时检查生产来源 hash，不复用 r1 结果。
cache_hashes = []
for record in read('data/sources/manifest.json')['sources']:
    source_id = {'static.json': 'map-static', 'localization-static.html': 'game-labels',
                 'localization-actors.html': 'actor-labels', 'tower-regions.json': 'tower-regions'}[record['file']]
    path = 'data/sources/' + record['file']
    actual = digest(path)
    matches = actual == record['sha256'] == sources[source_id]['hash']
    cache_hashes.append({'path': path, 'sourceId': source_id, 'sha256': actual, 'matches': matches})
    expect(matches, path + ' 原始缓存/manifest/生产来源 hash 差异')
for ident in SHRINE_IDS:
    for kind, research in [('wiki', wikis), ('chests', chests)]:
        source_id = kind + '-' + ident
        path = f'data/sources/{kind}/{ident}.' + ('html' if kind == 'wiki' else 'json')
        actual = digest(path)
        matches = actual == research[ident]['sha256'] == sources[source_id]['hash']
        cache_hashes.append({'path': path, 'sourceId': source_id, 'sha256': actual, 'matches': matches})
        expect(matches, path + ' 原始缓存/研究表/生产来源 hash 差异')
enemy_path = 'data/sources/enemies-Dungeon078.json'
enemy_hash = digest(enemy_path)
enemy_matches = enemy_hash == sources['enemies-Dungeon078']['hash']
cache_hashes.append({'path': enemy_path, 'sourceId': 'enemies-Dungeon078', 'sha256': enemy_hash, 'matches': enemy_matches})
expect(enemy_matches, enemy_path + ' 来源 hash 差异')


package_readback = []
for path in ['data/shrines.json', 'assets/hyrule-base.webp', 'THIRD_PARTY_NOTICES.txt']:
    public_hash, dist_hash = digest('public/' + path), digest('dist/' + path)
    same = (ROOT / ('public/' + path)).read_bytes() == (ROOT / ('dist/' + path)).read_bytes()
    package_readback.append({'path': path, 'public': public_hash, 'dist': dist_hash, 'same': same})
    expect(same, 'dist 与 public 字节不同：' + path)


# 不写临时文件，在内存中转译、执行真实纯函数，确认塔不能作为持久完成 ID。
node_code = r'''
const fs = require('fs');
const ts = require('typescript');
function load(path, dependency) {
  const code = ts.transpileModule(fs.readFileSync(path, 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022}}).outputText;
  const module = {exports: {}};
  new Function('require', 'exports', 'module', code)(name => dependency[name], module.exports, module);
  return module.exports;
}
const dataset = JSON.parse(fs.readFileSync('public/data/shrines.json', 'utf8'));
const data = load('src/lib/data.ts', {});
const progress = load('src/lib/progress.ts', {'./data': data});
const known = new Set(dataset.shrines.map(s => s.id));
let writes = 0;
const current = JSON.stringify({schemaVersion: 1, game: 'botw', dataVersion: dataset.dataVersion, completedIds: ['Dungeon000'], updatedAt: '2026-10-11T00:00:00Z'});
let stored = current;
global.localStorage = {getItem: () => stored, setItem: () => writes++};
const results = dataset.towers.map(tower => {
  const backup = {format: 'zelda-map-progress', schemaVersion: 1, game: 'botw', dataVersion: dataset.dataVersion, exportedAt: '2026-10-11T00:00:00Z', completedIds: ['Dungeon000', tower.id]};
  const result = progress.validateBackup(JSON.stringify(backup), known, dataset.dataVersion);
  return {id: tower.id, isShrineId: data.isShrineId(tower.id), rejected: !result.ok && result.reason === 'importUnknown' && result.unknownIds.includes(tower.id)};
});
const importPreserved = stored === current && writes === 0 && [...progress.readProgress().ids].join() === 'Dungeon000';
stored = JSON.stringify({schemaVersion: 1, game: 'botw', dataVersion: dataset.dataVersion, completedIds: ['Dungeon000', 'Tower01'], updatedAt: '2026-10-11T00:00:00Z'});
const corrupt = progress.readProgress();
const invalidStoredTowerRejected = corrupt.status === 'corrupt' && corrupt.ids.size === 0 && writes === 0;
console.log(JSON.stringify({results, importPreserved, invalidStoredTowerRejected, writes}));
'''
node = subprocess.run(['node', '-e', node_code], cwd=ROOT, text=True, capture_output=True)
expect(node.returncode == 0, '完成 ID 真实函数检查执行失败：' + node.stderr)
completion_checks = json.loads(node.stdout) if node.returncode == 0 else {'executionError': node.stderr}
if node.returncode == 0:
    expect(all(not row['isShrineId'] and row['rejected'] for row in completion_checks['results']), 'Tower 备份 ID 未整体拒绝')
    expect(completion_checks['importPreserved'], '拒绝 Tower 备份改变原进度')
    expect(completion_checks['invalidStoredTowerRejected'], '持久存储 Tower ID 未判损坏')


sha = digest('public/data/shrines.json')
expect(sha == EXPECTED_SHA, '当前 dataset SHA256 与指定 r2 候选不同')
expect(len(data['shrines']) == 136 and sum(s['dlc'] for s in data['shrines']) == 16, '神庙总数/DLC 数量错误')
expect(raw_chest_count == sum(len(s['detail']['supplies']) for s in data['shrines']) == 205, '宝箱总数不是 205')
expect(len(cache_hashes) == 277, '源快照 hash 复核数量不是 277')
expect(len(source_conflicts) == 1 and source_conflicts[0]['id'] == 'Dungeon017' and source_conflicts[0]['field'] == 'supplies',
       '来源冲突集合与既有 017 物资差异不同')
summary = {
    'testedAt': datetime.now(timezone.utc).isoformat(),
    'command': 'python3 tests/r2/qa_data.py',
    'datasetVersion': data['dataVersion'], 'generatedAt': data['generatedAt'], 'sha256': sha,
    'expectedSha256': EXPECTED_SHA,
    'count': len(data['shrines']), 'base': sum(not s['dlc'] for s in data['shrines']),
    'dlc': sum(s['dlc'] for s in data['shrines']), 'towers': len(data['towers']),
    'chests': raw_chest_count, 'sources': len(sources),
    'regions': dict(Counter(s['regionId'] for s in data['shrines'])),
    'errors': errors, 'unverifiedFields': gaps, 'safeCandidates': safe_candidates,
    'sourceConflicts': source_conflicts,
    'schemaNegativeTests': schema_negative_tests,
    'checkedImplementationHashes': {path: digest(path) for path in
                                    ['src/types.ts', 'src/lib/data.ts', 'src/lib/progress.ts',
                                     'data/schema/shrines.schema.json', 'tests/r2/qa_data.py']},
    'rawNameTableDuplicates': {'ids': sorted(set(relevant_labels).intersection(static_texts.duplicates)),
                               'conflictingIds': label_conflicts,
                               'note': '原始 HTML 的 120 座本体名称存在重复同值行；逐份比对后合并，不把重复同值当映射失败。'},
    'towerSourceReadback': tower_results, 'shrineSourceReadback': shrine_results,
    'sourceCacheHashes': {'count': len(cache_hashes), 'errors': [r['path'] for r in cache_hashes if not r['matches']], 'records': cache_hashes},
    'packageReadback': package_readback,
    'completionIdChecks': completion_checks,
    'uniqueIntroByLanguage': {locale: len(set(s['detail']['intro'][locale] for s in data['shrines'])) for locale in LOCALES},
    'uniqueWalkthroughByLanguage': {locale: len(set('|'.join(row[locale] for row in s['detail']['walkthrough']) for s in data['shrines'])) for locale in LOCALES},
    'boundaries': [
        'verification 旗标仅检查引用与缺口，不作为事实证据。',
        '三语名称、试炼、原始 XYZ、分区与宝箱 drop 全量比对；介绍、前置和攻略仅检查结构、来源身份及缺口，未逐句证明语义。',
        '不覆盖真实浏览器图层、阈值、图标、点击、手机、折叠和可见 DOM；由父 QA 单独验证。',
        'Dungeon017 的双源差异保持明示；未证明版本、缩放或 DLC 是原因。',
        '源哈希证明本地快照与记录一致，不证明远端当前内容或游戏实际通关。',
        '没有运行 build、启动服务、修改生产数据/状态或覆盖 r1 证据。'
    ]
}
OUT.mkdir(parents=True, exist_ok=True)
(OUT / 'data-results.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({key: summary[key] for key in ['datasetVersion', 'sha256', 'count', 'base', 'dlc', 'towers', 'chests', 'errors', 'unverifiedFields', 'safeCandidates']}, ensure_ascii=False))
print(json.dumps({'cacheHashes': len(cache_hashes), 'schemaNegativeCases': len(schema_negative_tests),
                  'packageMatches': all(row['same'] for row in package_readback),
                  'towerBackupIdsRejected': node.returncode == 0 and all(row['rejected'] for row in completion_checks['results']),
                  'existingProgressPreserved': completion_checks.get('importPreserved')}, ensure_ascii=False))
raise SystemExit(bool(errors or gaps or safe_candidates))
