# 数据来源与核对口径

采集日期：2026-10-11。来源采集成功与内容校对通过分别记录，不将 HTTP 200 当作内容正确。

| 内容 | 公开来源 | 本地证据 |
| --- | --- | --- |
| 神庙名单与数量 | Zelda Dungeon 神庙位置列表 | 120 本体 + 16 DLC；本版排除复苏神庙及其他传送点 |
| 神庙坐标 | https://objmap.zeldamods.org/game_files/map_summary/MainField/static.json | `data/sources/static.json`，136 个 Dungeon 标记 |
| 地区边界 | https://objmap.zeldamods.org/game_files/ecosystem/MapTower.json | `data/sources/tower-regions.json`；按区域多边形匹配 X、Z |
| 真实底图 | https://objmap.zeldamods.org/game_files/maptex/base.png | `public/assets/hyrule-base.webp`；源扩展名为 png，实际像素格式 WEBP、3000×2500 |
| 神庙名称与试炼名称 | https://sh0wer1ee.github.io/BotwText/page/StaticMsg.html | `data/sources/localizations.json`，按 Dungeon ID 匹配中英日文本，日语去除 ruby 注音 |
| 物资名称 | https://sh0wer1ee.github.io/BotwText/page/ActorType.html | `data/sources/actor-localizations.json`，按物件 ID 匹配三语名称 |
| 神庙宝箱内容 | `https://radar.zeldamods.org/objs/CDungeon/DungeonNNN?q=actor:^"TBox_"` | `data/sources/chests/*.json`；drop 类型 1 为具体物件 |
| 入口与解题事实 | Zelda Wiki 各神庙专属条目 | `data/sources/wiki-research.json` 与逐页缓存；生产内容为原创简短摘要与译述，保留具体条目 URL、哈希和字段关联 |

## 地图投影

游戏 X 轴由西向东，Z 轴由北向南。底图跨度为 X=[-6000,6000]、Z=[-5000,5000]。图片像素 `u=(X+6000)/4`、`v=(Z+5000)/4`。Leaflet CRS.Simple 使用 `[lat,lng]=[-v,u]`，底图边界 `[[-2500,0],[0,3000]]`。Y 轴是高度，不直接用于平面投影。

## 内容边界

- 三语官方名称来自公开游戏文本；本文介绍、依赖和攻略为本项目原创整理。
- 外层只展示 `safe.summary` 和 `safe.prerequisite` 等白名单字段。试炼标题、详细解锁操作、物资和攻略只在详情视图显示。
- 任务与神庙访问条件分别判断。可选任务不写成硬性依赖。
- 宝箱数据列出神庙内部具体物品，不把周围世界宝箱混入；没有核实数量的物品不编造数量。
- 详情外链通向外部资料，链接前注明可能包含剧透。

Zelda Dungeon 地图直读遇站点访问限制，本项目没有绕过验证或复制其受限接口。以它作为用户指定的交互参考，点位和原创详情采用上述可读取资料。

## 归属与使用范围

游戏底图、名称与游戏物件事实由 Nintendo 相关游戏资产衍生；本版为本机个人预览，不宣称获得官方授权。ZeldaMods 网站的开源前端代码未复制进本项目，使用了其公开数据并独立实现地图。Zelda Wiki 条目的具体授权与归属沿原条目保留；本站不批量转载文章、截图或视频。若后续公开发布，再按实际发布资产核对许可和署名。
