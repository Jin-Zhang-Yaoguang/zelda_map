"""镜像原始地图PNG瓦片；不缩放、插值或重绘游戏底图。"""
from pathlib import Path
import argparse
import hashlib
import json
import math
import subprocess
import time
from datetime import datetime, timezone
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = 'https://objmap.zeldamods.org/game_files/maptex'
REVISION = '9a937fa2888aaf4f0b40d021d2f8d87057f3c8d9'

def expected_tiles():
    for z in range(2, 8):
        width, height = 24000 // 2 ** (7-z), 20000 // 2 ** (7-z)
        for x in range(math.ceil(width/256)):
            for y in range(math.ceil(height/256)):
                yield z, x, y

def valid_png(path):
    try:
        with Image.open(path) as image:
            if image.format != 'PNG' or image.size != (256, 256):
                return False
            image.verify()
        return True
    except (OSError, ValueError, SyntaxError):
        return False

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--download', action='store_true', help='联网镜像原始PNG并校验；默认只预览')
    parser.add_argument('--parallel', type=int, default=6, choices=range(1, 13), help='最多12个连接；尊重curl的429/Retry-After重试')
    args = parser.parse_args()
    tiles = list(expected_tiles())
    print(json.dumps({'source': SOURCE, 'count': len(tiles), 'nativeSize': [24000, 20000], 'operation': 'copy original PNG bytes; no resampling'}, ensure_ascii=False), flush=True)
    if not args.download:
        return
    published = ROOT/'public/assets/map-tiles'
    if published.exists():
        manifest_path = ROOT/'data/sources/map-tiles-manifest.json'
        if not manifest_path.exists():
            raise SystemExit('Public tiles exist without source manifest; refuse network download or replacement')
        existing = json.loads(manifest_path.read_text())
        entries = existing.get('entries', [])
        expected = {f'public/assets/map-tiles/{z}/{x}/{y}.png' for z, x, y in tiles}
        if {entry.get('path') for entry in entries} != expected:
            raise SystemExit('Existing manifest does not match the expected tile set; no replacement performed')
        for entry in entries:
            path = ROOT/entry['path']
            if not valid_png(path) or hashlib.sha256(path.read_bytes()).hexdigest() != entry['sha256']:
                raise SystemExit(f"Existing tile invalid: {entry['path']}; no replacement performed")
        print('Existing public tiles and source hashes verified; no network requests', flush=True)
        return
    staging = ROOT / '.runtime' / 'map-tiles-staging'
    staging.mkdir(parents=True, exist_ok=True)
    config = ROOT / '.runtime' / 'map-tiles-download.cfg'
    missing = []
    for z, x, y in tiles:
        path = staging / str(z) / str(x) / f'{y}.png'
        if valid_png(path):
            continue
        path.parent.mkdir(parents=True, exist_ok=True)
        missing.append((f'{SOURCE}/{z}/{x}/{y}.png', path))
    config.write_text(''.join(f'url = "{url}"\noutput = "{path}"\n' for url, path in missing))
    if missing:
        log = ROOT / '.runtime' / 'map-tiles-download.log'
        with log.open('a') as output:
            process = subprocess.Popen(['curl', '--parallel', '--parallel-max', str(args.parallel), '--fail', '--silent', '--show-error', '--location', '--retry', '2', '--retry-delay', '1', '--max-time', '30', '--config', str(config)], stdout=output, stderr=output)
            (ROOT/'.runtime/map-tile-curl.pid').write_text(str(process.pid))
            while process.poll() is None:
                time.sleep(10)
                downloaded = sum(1 for p in staging.rglob('*.png') if p.stat().st_size > 0)
                print(f'downloaded files {downloaded}/{len(tiles)}', flush=True)
            print('curl exit', process.returncode, flush=True)
    invalid = [f'{z}/{x}/{y}.png' for z, x, y in tiles if not valid_png(staging/str(z)/str(x)/f'{y}.png')]
    if invalid:
        (ROOT/'.runtime/map-tiles-invalid.json').write_text(json.dumps(invalid, indent=2))
        raise SystemExit(f'{len(invalid)} tiles missing/invalid; staging retained, public assets not changed')
    target = ROOT/'public/assets/map-tiles'
    if target.exists():
        raise SystemExit('Public tiles already exist; refuse to replace them implicitly')
    # 完整校验后才把新资产原子移入public；没有修改任何PNG像素。
    staging.rename(target)
    entries = []
    for z, x, y in tiles:
        rel = f'{z}/{x}/{y}.png'
        content = (target/rel).read_bytes()
        entries.append({'path': f'public/assets/map-tiles/{rel}', 'sourceUrl': f'{SOURCE}/{rel}', 'size': len(content), 'sha256': hashlib.sha256(content).hexdigest()})
    manifest = {
        'schemaVersion': 1, 'retrievedAt': datetime.now(timezone.utc).isoformat(),
        'sourceUrlPattern': f'{SOURCE}/{{z}}/{{x}}/{{y}}.png',
        'sourceCode': f'https://github.com/zeldamods/objmap/blob/{REVISION}/src/MapBase.ts',
        'sourceDimensions': [24000, 20000], 'sourceLevels': [2, 3, 4, 5, 6, 7], 'tilePixels': 256,
        'logicalDimensions': [3000, 2500], 'leafletBounds': [[-2500, 0], [0, 3000]],
        'mapping': 'Source level z has scale 2^(z-4) relative to logical u=(X+6000)/4, v=(Z+5000)/4; PNG copied byte-for-byte, no resampling',
        'count': len(entries), 'bytes': sum(e['size'] for e in entries),
        'licenseBoundary': 'Nintendo game imagery via ZeldaMods; not covered by dependency licenses, no additional game-art license claimed',
        'entries': entries,
    }
    (ROOT/'data/sources/map-tiles-manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n')
    print(json.dumps({k: manifest[k] for k in ['count', 'bytes', 'sourceDimensions']}), flush=True)

if __name__ == '__main__':
    main()
