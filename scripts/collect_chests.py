"""读取公开游戏物件接口，核对神庙内宝箱事实与三语物品名。"""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
import hashlib
import json
import urllib.parse
from collect_sources import get

ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/'data/sources'

def collect(shrine):
    ident=shrine['id']
    query=urllib.parse.urlencode({'q':'actor:^"TBox_"','withMapNames':'false','limit':'-1'})
    url=f'https://radar.zeldamods.org/objs/CDungeon/{ident}?{query}'
    try:
        raw=get(url,BASE/'chests'/f'{ident}.json')
        data=json.loads(raw)
        if not isinstance(data,list): raise ValueError('expected object list')
        return {'id':ident,'url':url,'ok':True,'sha256':hashlib.sha256(raw).hexdigest(),'objects':data}
    except Exception as error:
        return {'id':ident,'url':url,'ok':False,'error':str(error)}

def main():
    (BASE/'chests').mkdir(exist_ok=True)
    shrines=json.loads((BASE/'shrines-seed.json').read_text())
    result=[]
    with ThreadPoolExecutor(max_workers=4) as pool:
        for future in as_completed([pool.submit(collect,s) for s in shrines]):
            value=future.result(); result.append(value)
            print(value['id'],'ok' if value['ok'] else value['error'],flush=True)
    result.sort(key=lambda v:v['id'])
    (BASE/'chests-research.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
    print('Chest sources',sum(v['ok'] for v in result),'/',len(result),flush=True)

if __name__=='__main__': main()
