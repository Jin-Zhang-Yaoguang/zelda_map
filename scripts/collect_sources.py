"""提取公开神庙事实来源；不绕过鉴权或访问限制。"""
from pathlib import Path
import concurrent.futures
import hashlib
import json
import re
import subprocess
import time
import urllib.parse
import urllib.request
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
SOURCES = ROOT / 'data' / 'sources'
SOURCES.mkdir(parents=True, exist_ok=True)

def get(url, path):
    if path.exists():
        return path.read_bytes()
    result = subprocess.run(['curl','--fail','-L','--max-time','45','-sS',url],capture_output=True,check=True)
    content = result.stdout
    path.write_bytes(content)
    return content

def extract_localizations(html):
    soup = BeautifulSoup(html, 'html.parser')
    result = {}
    for caption in soup.find_all('caption'):
        table = caption.parent
        for annotation in table.select('rt,rp'):
            annotation.decompose()
        rows = table.find_all('tr')
        if not rows:
            continue
        header = [c.get_text(strip=True) for c in rows[0].find_all(['td','th'])]
        if header != ['label','CNzh','JPja','TWzh','USen']:
            continue
        for row in rows[1:]:
            cells = row.find_all(['td','th'])
            if len(cells) != 5:
                continue
            text = [''.join(c.stripped_strings) if i != 4 else c.get_text(' ',strip=True) for i,c in enumerate(cells)]
            result[text[0]] = {'zh':text[1], 'ja':text[2], 'en':text[4]}
    return result

def collect_wiki(shrine):
    url = 'https://zeldawiki.wiki/wiki/' + urllib.parse.quote(shrine['name']['en'].replace(' ','_'), safe="_'()")
    cache = SOURCES / 'wiki' / (shrine['id']+'.html')
    try:
        raw = get(url, cache)
        soup = BeautifulSoup(raw, 'html.parser')
        candidates = soup.select('.mw-parser-output')
        article = max(candidates,key=lambda node:len(node.get_text()),default=None)
        if article is None:
            raise ValueError('No article content')
        for selector in ['.toc','#toc','.reference','script','style','.navbox','.infobox','.mw-editsection','.portable-infobox']:
            for element in article.select(selector):
                element.decompose()
        # 缓存研究文本仅供原创摘要校对，不直接当作产品文案发布。
        chunks=[]
        for child in article.children:
            heading = child if getattr(child,'name',None)=='h2' else child.find('h2',recursive=False) if getattr(child,'name',None) else None
            if heading and heading.get_text(' ',strip=True) in ['Trivia','Nomenclature','Gallery','See Also','References']:
                break
            if hasattr(child,'get_text'):
                chunks.append(child.get_text(' ',strip=True))
        text = ' '.join(chunks)
        if len(text)<250 or 'Shrine' not in text:
            raise ValueError('Article body failed content validation')
        return {'id':shrine['id'],'url':url,'title':soup.title.get_text() if soup.title else '',
                'text':text[:24000],'sha256':hashlib.sha256(raw).hexdigest(),'ok':True}
    except Exception as error:
        return {'id':shrine['id'],'url':url,'ok':False,'error':str(error)}

def main():
    imports = [
        ('https://objmap.zeldamods.org/game_files/map_summary/MainField/static.json','static.json'),
        ('https://sh0wer1ee.github.io/BotwText/page/StaticMsg.html','localization-static.html'),
        ('https://sh0wer1ee.github.io/BotwText/page/ActorType.html','localization-actors.html'),
        ('https://objmap.zeldamods.org/game_files/ecosystem/MapTower.json','tower-regions.json'),
    ]
    for url,filename in imports:
        get(url,SOURCES/filename)
    translations = extract_localizations((SOURCES/'localization-static.html').read_text())
    actors = extract_localizations((SOURCES/'localization-actors.html').read_text())
    (SOURCES/'localizations.json').write_text(json.dumps(translations,ensure_ascii=False,indent=2))
    (SOURCES/'actor-localizations.json').write_text(json.dumps(actors,ensure_ascii=False,indent=2))
    raw = json.loads((SOURCES/'static.json').read_text())
    shrines = []
    for item in raw['markers']['Dungeon']:
        ident=item['MessageID']
        assert re.fullmatch(r'Dungeon\d{3}',ident)
        shrines.append({'id':ident,'name':translations[ident], 'trial':translations[ident+'_sub'],
                        'position':item['Translate'],'dlc':int(ident[-3:])>=120})
    shrines.sort(key=lambda row:row['id'])
    assert len(shrines)==136
    (SOURCES/'shrines-seed.json').write_text(json.dumps(shrines,ensure_ascii=False,indent=2))
    (SOURCES/'wiki').mkdir(exist_ok=True)
    collected=[]
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        futures=[pool.submit(collect_wiki,shrine) for shrine in shrines]
        for future in concurrent.futures.as_completed(futures):
            result=future.result(); collected.append(result)
            print(result['id'], 'ok' if result['ok'] else result['error'],flush=True)
            draft=SOURCES/'wiki-research.json.tmp'
            draft.write_text(json.dumps(sorted(collected,key=lambda x:x['id']),ensure_ascii=False,indent=2))
            draft.replace(SOURCES/'wiki-research.json')
    manifest={'retrieved':'2026-10-11','sources':[{'url':url,'file':filename,'sha256':hashlib.sha256((SOURCES/filename).read_bytes()).hexdigest()} for url,filename in imports],
              'wikiOk':sum(x['ok'] for x in collected),'wikiTotal':len(collected)}
    (SOURCES/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
    print('Collected',manifest['wikiOk'],'/',manifest['wikiTotal'],flush=True)

if __name__=='__main__':
    main()
