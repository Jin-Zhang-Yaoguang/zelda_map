#!/usr/bin/env python3
"""r3 独立静态/包读回复核；不构建、不启动服务、不读远端、不覆盖旧证据。"""
import hashlib
import json
import re
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/dev_new_version/v0.1.0/evidence/r3'
EXPECTED_SHA = '4938b62b72cbeed84e85b4d7ae7e37a60e6bd729de17debd2f6f8892c37b3fde'
COMMAND = 'python3 tests/r3/qa_static.py'
errors = []
checks = []


def read(path):
    return (ROOT / path).read_text(encoding='utf-8')


def hash_file(path):
    data = (ROOT / path).read_bytes()
    return {'path': path, 'sha256': hashlib.sha256(data).hexdigest(), 'size': len(data)}


def check(name, condition, evidence):
    checks.append({'name': name, 'passed': bool(condition), 'evidence': evidence})
    if not condition:
        errors.append(name)


def block(text, start, end):
    return text.split(start, 1)[1].split(end, 1)[0]


def css_rule(text, selector):
    match = re.search(re.escape(selector) + r'\s*\{([^}]+)\}', text)
    return match.group(1) if match else ''


def declaration(text, property_name):
    match = re.search(r'(?:^|;)\s*' + re.escape(property_name) + r'\s*:\s*([^;]+)', text)
    return match.group(1) if match else None


source = read('src/components/MapCanvas.tsx')
styles = read('src/styles.css')
map_constants = read('src/lib/map.ts')
tooltip = block(source, 'function tooltipContent(', 'function positionTooltip(')
describer = block(source, 'function describeMarker(', 'export default function MapCanvas')
marker_layers = block(source, '    group.clearLayers();', '  }, [props.shrines')
tooltip_rules = {selector: css_rule(styles, selector) for selector in [
    '.map-tooltip', '.map-tooltip-content', '.map-tooltip-title',
    '.map-tooltip-region', '.map-tooltip-badges', '.map-tooltip-badge',
    '.shrine-hit,.tower-hit', '.shrine-symbol', '.shrine-symbol svg', ':root']}

check('结构化提示节点', all(name in tooltip for name in [
    'map-tooltip-content', 'map-tooltip-title', 'map-tooltip-region',
    'map-tooltip-badges', 'map-tooltip-badge', 'card.append(title, region, badges)']),
    'MapCanvas.tsx:70–88；分别创建 div/strong/span/badges。')
check('动态提示均为纯文本', all(text in tooltip for text in [
    'title.textContent = description.name', 'region.textContent = description.region',
    'badge.textContent = item.text']), 'MapCanvas.tsx:75、78、84。')
check('不拼动态 HTML', 'innerHTML' not in source and 'dangerouslySetInnerHTML' not in source,
    'MapCanvas.tsx 全文件；divIcon html 仅取三个固定 SVG 常量。')
check('不读取敏感字段', not re.search(r'\.\s*(?:detail|trial|supplies|walkthrough|prerequisites|reward|rewards)\b', source),
    'MapCanvas.tsx 全文件；未读取试炼、详情、前置过程、物资、奖励或攻略。')
check('神庙输入为安全字段 Pick', "Pick<ShrineRecord, 'id' | 'name' | 'position' | 'regionId' | 'dlc'>" in source,
    'MapCanvas.tsx:10；id/name/position/regionId/dlc。')
check('神庙完整 ARIA 基础字段', all(text in marker_layers for text in [
    "const label = `${localize(shrine.name, props.locale)} · ${props.regionName(shrine.regionId)}",
    "shrine.dlc ? 'dlc' : 'base'", "complete ? 'completed' : 'incomplete'", 'label\n']),
    'MapCanvas.tsx:228–233；ARIA 不复用被 ellipsis 截断的可见节点。')
check('高塔只名称地区定位', all(text in marker_layers for text in [
    "const purpose = translate(props.locale, 'towerLocate')", 'badges: [{ text: purpose }]',
    'label: `${name} · ${region} · ${purpose}`']), 'MapCanvas.tsx:211–214。')
check('ARIA 使用属性文本', "element.setAttribute('aria-label', description.label)" in describer,
    'MapCanvas.tsx:141；不使用 HTML sink。')
check('整卡不拦截指针', declaration(tooltip_rules['.map-tooltip'], 'pointer-events') == 'none!important'
    and declaration(tooltip_rules['.map-tooltip-content'], 'pointer-events') == 'none'
    and 'interactive: false' in describer, 'styles.css map-tooltip/content；Leaflet bindTooltip interactive:false。')
check('显式卡宽与动态上限', declaration(tooltip_rules['.map-tooltip'], 'width') == '220px!important'
    and declaration(tooltip_rules['.map-tooltip'], 'max-width') == 'var(--tooltip-max-width,240px)!important'
    and 'viewport.width - inset * 2' in source and "element.style.setProperty('--tooltip-max-width'" in source,
    'styles.css + MapCanvas.tsx:98、107–108；静态声明有效性，最终宽度由父 QA 实测。')
check('字体拆分有效声明', all(declaration(tooltip_rules['.map-tooltip'], prop) for prop in ['font-family', 'font-size', 'line-height'])
    and declaration(tooltip_rules['.map-tooltip'], 'font') is None
    and all(term in tooltip_rules[':root'] for term in ['-apple-system', 'PingFang SC', 'Hiragino Sans GB', 'sans-serif']),
    'styles.css :root 与 map-tooltip；无 font 简写。')
check('名称地区单行省略', all(declaration(tooltip_rules[selector], 'white-space') == 'nowrap'
    and declaration(tooltip_rules[selector], 'overflow') == 'hidden'
    and declaration(tooltip_rules[selector], 'text-overflow') == 'ellipsis'
    for selector in ['.map-tooltip-title', '.map-tooltip-region']), 'styles.css title/region。')
check('18px 主图形', all(declaration(tooltip_rules[selector], dimension) == '18px'
    for selector in ['.shrine-symbol', '.shrine-symbol svg'] for dimension in ['width', 'height']),
    'styles.css shrine-symbol 与 svg。')
check('44px 透明命中区', source.count('iconSize: [44, 44]') == 2
    and source.count('iconAnchor: [22, 22]') == 2
    and declaration(tooltip_rules['.shrine-hit,.tower-hit'], 'background') == 'none',
    'MapCanvas.tsx:204、224；styles.css shrine-hit/tower-hit。')
check('-1 连续缩放阈值保持', 'SHRINE_ZOOM_THRESHOLD = -1;' in map_constants
    and 'NEAR_FOCUS_ZOOM = SHRINE_ZOOM_THRESHOLD + 0.5;' in map_constants
    and 'const near = zoom >= SHRINE_ZOOM_THRESHOLD;' in source
    and "instance.on('moveend zoomend', handler)" in source
    and 'zoomSnap: 0.1, zoomDelta: 0.5' in source, 'lib/map.ts + MapCanvas.tsx:157、162、176。')
check('互斥塔神庙且无聚合', 'if (!near)' in marker_layers
    and 'for (const tower of props.towers)' in marker_layers
    and '} else {' in marker_layers
    and 'for (const shrine of props.shrines)' in marker_layers
    and not re.search(r'cluster|nearby', source, re.I), 'MapCanvas.tsx:200–235；无聚合实现。')
check('原点点击定位路径保持', 'current.current.onTowerLocate();' in marker_layers
    and 'focusPosition(instance, target);' in marker_layers
    and 'current.current.onSelect(closestMarker(' in marker_layers,
    'MapCanvas.tsx:206–209、227；未静态改动选择回调。')

baseline = json.loads(read('docs/dev_new_version/v0.1.0/evidence/r2/candidate-manifest.json'))
baseline_comparison = []
for previous in baseline['files']:
    actual = hash_file(previous['path'])
    actual['r2Sha256'] = previous['sha256']
    actual['sameAsR2'] = actual['sha256'] == previous['sha256']
    baseline_comparison.append(actual)
production_prefixes = ('src/', 'public/', 'data/schema/')
production_root_files = {'index.html', 'package.json', 'package-lock.json', 'requirements-data.txt',
    'tsconfig.app.json', 'tsconfig.json', 'tsconfig.node.json', 'vite.config.ts'}
allowed_source_changes = {'src/components/MapCanvas.tsx', 'src/styles.css'}
unexpected_product_changes = [item['path'] for item in baseline_comparison
    if not item['sameAsR2'] and (item['path'].startswith(production_prefixes)
        or item['path'] in production_root_files) and item['path'] not in allowed_source_changes]
check('r2 产品合同未超范围修改', not unexpected_product_changes, unexpected_product_changes)

package = []
for path in ['data/shrines.json', 'assets/hyrule-base.webp', 'THIRD_PARTY_NOTICES.txt']:
    public = hash_file('public/' + path)
    dist = hash_file('dist/' + path)
    same = (ROOT / public['path']).read_bytes() == (ROOT / dist['path']).read_bytes()
    package.append({'path': path, 'public': public, 'dist': dist, 'byteIdentical': same})
    check('包逐字读回 ' + path, same, {'public': public['sha256'], 'dist': dist['sha256']})
data = json.loads(read('public/data/shrines.json'))
check('数据 SHA 保持指定 r2 候选', package[0]['public']['sha256'] == EXPECTED_SHA, EXPECTED_SHA)
check('根范围 136+15', len(data['shrines']) == 136 and len(data['towers']) == 15
    and sorted(s['id'] for s in data['shrines']) == [f'Dungeon{i:03d}' for i in range(136)]
    and sorted(t['id'] for t in data['towers']) == [f'Tower{i:02d}' for i in range(1, 16)]
    and sum(s['dlc'] for s in data['shrines']) == 16,
    {'shrines': len(data['shrines']), 'towers': len(data['towers']), 'dlc': sum(s['dlc'] for s in data['shrines'])})
supplies_count = sum(len(s['detail']['supplies']) for s in data['shrines'])
check('205 宝箱仅结构数量', supplies_count == 205, '只读取生产 detail.supplies 条目；未重读宝箱缓存或证明物品语义。')
conflicts = [{'id': s['id'], 'field': field, 'status': evidence['status'],
    'sourceIds': evidence['sourceIds'], 'displayNoteLocales': sorted(evidence.get('displayNote', {}))}
    for s in data['shrines'] for field, evidence in s['verification'].items() if evidence['status'] == 'conflict']
check('017 conflict 仅结构保持', len(conflicts) == 1 and conflicts[0]['id'] == 'Dungeon017'
    and conflicts[0]['field'] == 'supplies' and conflicts[0]['displayNoteLocales'] == ['en', 'ja', 'zh']
    and {'chests-Dungeon017', 'actor-labels', 'wiki-Dungeon017'} <= set(conflicts[0]['sourceIds']), conflicts)

dist_assets = sorted(p for p in (ROOT / 'dist/assets').iterdir() if p.suffix in ('.css', '.js'))
dist_text = {p.suffix: p.read_text(encoding='utf-8') for p in dist_assets}
tokens = ['map-tooltip-content', 'map-tooltip-title', 'map-tooltip-region', 'map-tooltip-badges', '--tooltip-max-width']
bundle_tokens = {suffix: {token: content.count(token) for token in tokens} for suffix, content in dist_text.items()}
check('现有 dist 含 r3 提示结构与宽度', all(count for token_counts in bundle_tokens.values() for count in token_counts.values())
    and set(bundle_tokens) == {'.js', '.css'}, bundle_tokens)

geometry_observations = [
    {'id': 'G1', 'status': 'pending_browser', 'source': 'src/components/MapCanvas.tsx:92–128',
     'contract': '03_UIUX设计.md:204、206',
     'finding': '当前只夹紧卡片位置，未判断 anchor 在可见地图外或手机面板后，也未显式关闭 tooltip。需父 QA 验证点位移出可见区的现有 Leaflet 行为。'},
    {'id': 'G2', 'status': 'pending_browser', 'source': 'src/components/MapCanvas.tsx:135–137、177–178',
     'contract': '03_UIUX设计.md:204、206',
     'finding': '仅监听 move/zoom/resize，ResizeObserver 仅观察 map-canvas；底面板高度变化且地图容器大小不变时没有专门重算触发。需父 QA 验证打开提示后展开/收起面板。'}]
limits = [
    '这是一份源码静态与现有包读回报告，未运行 build、浏览器或本机服务。',
    'CSS 声明与 DOM 文本路径已核对；有效像素尺寸、边界夹紧、鼠标离开、触控和当前浏览器 computed style 由父 QA 实测。',
    'G1/G2 是静态合同缺口；运行结果尚未确认，不能据此宣称浏览器通过或失败。',
    '136 神庙、15 高塔、205 条物资及 017 conflict 仅结构核对；没有重做 277 缓存核验、136 攻略语义或游戏实机核实。',
    '哈希和逐字一致证明本地文件未变，不证明远端来源、事实准确性或正式发布。',
    '只写 tests/r3/qa_static.py 与 r3/static-package-audit.json、.md；不覆盖 baseline、r1 或 r2。']
inputs = ['AGENTS.md', 'docs/dev_new_version/v0.1.0/03_UIUX设计.md',
    'docs/dev_new_version/v0.1.0/04_技术方案.md', 'docs/dev_new_version/v0.1.0/evidence/r2/candidate-manifest.json',
    'src/components/MapCanvas.tsx', 'src/styles.css', 'src/lib/map.ts', 'src/types.ts',
    'tests/r3/qa_static.py', 'dist/index.html']
result = {'revision': 'r3', 'testedAt': datetime.now(timezone.utc).isoformat(), 'command': COMMAND,
    'staticStatus': 'PASS' if not errors else 'FAIL', 'errors': errors, 'checks': checks,
    'expectedDatasetSha256': EXPECTED_SHA, 'inputHashes': [hash_file(p) for p in inputs],
    'r2Comparison': baseline_comparison, 'unexpectedProductChanges': unexpected_product_changes,
    'packageReadback': package, 'bundleFiles': [hash_file(str(p.relative_to(ROOT))) for p in dist_assets],
    'bundleTokenCounts': bundle_tokens, 'dataStructure': {'datasetVersion': data['dataVersion'],
        'shrines': len(data['shrines']), 'base': sum(not s['dlc'] for s in data['shrines']),
        'dlc': sum(s['dlc'] for s in data['shrines']), 'towers': len(data['towers']),
        'suppliesEntries': supplies_count, 'conflicts': conflicts},
    'cssDeclarations': {selector: {prop: declaration(rule, prop) for prop in [
        'width', 'max-width', 'font-family', 'font-size', 'font-weight', 'line-height',
        'white-space', 'text-overflow', 'pointer-events']}
        for selector, rule in tooltip_rules.items() if selector.startswith('.map-tooltip')},
    'pendingGeometryObservations': geometry_observations, 'limits': limits}
OUT.mkdir(parents=True, exist_ok=True)
(OUT / 'static-package-audit.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
lines = ['# r3 独立静态与包读回复核', '', f"时间：{result['testedAt']}。命令：`{COMMAND}`。", '',
    f"静态断言：{result['staticStatus']}，{len(checks)} 项，失败 {len(errors)} 项。运行几何结果待父 QA。", '',
    '- 神庙/高塔提示已拆为名称、地区、标签节点，动态内容用 `textContent`；完整 ARIA 只取基础字段。',
    '- `.map-tooltip` 显式 220px 宽、动态最大宽度、有效字体长属性，名称/地区单行省略；pointer-events:none。',
    '- r2 的 18px 图形、44px 透明命中、-1 连续缩放阈值、互斥塔/神庙图层与无聚合路径保持。',
    '- 除 MapCanvas/styles 外，r2 清单中产品源码、数据、Schema、配置均未改变。',
    '', '## 逐字读回', '', '| 文件 | public SHA256 | dist SHA256 | 字节相同 |', '| --- | --- | --- | --- |']
for item in package:
    lines.append(f"| {item['path']} | `{item['public']['sha256']}` | `{item['dist']['sha256']}` | {item['byteIdentical']} |")
lines += ['', f"数据结构：136 神庙（120 本体+16 DLC）、15 高塔、{supplies_count} 条物资。仅 `Dungeon017.supplies` 保留 conflict 与三语差异说明。", '',
    '## 待实测合同点', '']
for item in geometry_observations:
    lines.append(f"- {item['id']}（{item['source']}；合同 {item['contract']}）：{item['finding']}")
lines += ['', '## 结论边界', ''] + ['- ' + item for item in limits]
lines += ['', '实际输入/包哈希、每项断言、CSS声明及与 r2 的对照均见 `static-package-audit.json`。', '']
(OUT / 'static-package-audit.md').write_text('\n'.join(lines), encoding='utf-8')
print(json.dumps({'staticStatus': result['staticStatus'], 'checks': len(checks), 'errors': errors,
    'sha256': package[0]['public']['sha256'], 'packageByteIdentical': all(item['byteIdentical'] for item in package),
    'unexpectedProductChanges': unexpected_product_changes, 'pendingGeometryObservations': [item['id'] for item in geometry_observations]}, ensure_ascii=False))
raise SystemExit(bool(errors))
