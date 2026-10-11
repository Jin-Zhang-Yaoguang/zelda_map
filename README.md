# 海拉鲁神庙地图

《塞尔达传说：旷野之息》个人神庙地图，首版 v0.1.0。

## 本机运行

需要 Node.js 20.19+ 或 22.12+。

```sh
npm install
npm run dev
```

在浏览器打开 `http://127.0.0.1:5173/`。开发服务固定端口，完成记录保存在这个浏览器和网址下。

```sh
npm run build
npm run preview
```

本版包含本体 120 座、DLC 16 座神庙。默认中文，可切换 English 与日本語；设置页的 DLC 开关与地图快筛同步，隐藏 DLC 不删除完成记录。地图只展示基础入口信息，物资与谜题攻略位于独立详情页的折叠区。设置页可导出和导入进度备份。

地图采用远近两档显示：远景只显示15座高塔，放大后逐座显示神庙，神庙不会聚合。点击高塔或从列表选择神庙可直接进入近景；高塔仅用于定位，不计入神庙完成记录。

## 数据与维护

- `scripts/collect_sources.py`：采集公开坐标、三语名称与神庙事实参考，缓存原始研究资料。
- `scripts/collect_chests.py`：采集公开游戏物件中的神庙宝箱事实。
- `scripts/build_data.py`：核对并合并逐座原创三语说明，生成生产数据。
- `data/content/`：原创说明与通关要点。公开参考原文仅作研究缓存，不作为页面正文发布。
- `public/data/shrines.json`：实际页面使用的版本数据与字段来源。
- `docs/dev_new_version/v0.1.0/`：需求、设计、开发与验收记录。

更新源数据需要联网，运行页面使用本地底图与已经生成的数据。名称采用公开游戏文本中的官方名称；说明和攻略为本站整理与译述，不能混同官方指南。

资料采集需要 Python 3.9+、curl 和 BeautifulSoup（本轮使用版本4.15.0）：`python3 -m pip install -r requirements-data.txt`。离线生成器只使用 Python 标准库。QA浏览器脚本记录了本机 Codex runtime/Chromium 路径，异机运行需调整环境；完整验证命令见版本测试报告。

## 来源

主要交互参考：[Zelda Dungeon BOTW 互动地图](https://www.zeldadungeon.net/breath-of-the-wild-interactive-map/)。

神庙点位、地区边界与底图来自 [ZeldaMods Object Map](https://objmap.zeldamods.org/)，物资来自 [ZeldaMods Radar](https://radar.zeldamods.org/)，名称与物品译名来自 [BotwText](https://sh0wer1ee.github.io/BotwText/)，逐座事实参考为 [Zelda Wiki](https://zeldawiki.wiki/)。各字段在生产数据中关联到具体来源与采集哈希。

这是非官方个人工具。游戏图像与游戏文本属于各自权利人；来源说明见 [数据说明](docs/data_sources.md)。

第三方运行依赖的许可文本随产物保存在 [THIRD_PARTY_NOTICES.txt](public/THIRD_PARTY_NOTICES.txt)。公开发布尚未执行，需按具体发布资产另核对归属与授权。
