# v0.1.0 技术交接

日期：2026-10-11。主代理已确认合同。主文档：[04_技术方案.md](04_技术方案.md)。仅方案与资料检查完成，无运行/用户验收结论。

## 锁定接口

- Vite+React+TS+Leaflet1.9.4静态SPA，Python离线数据；无业务后端。hash `#/`、`#/shrine/:id`、`#/settings`。预览固定127.0.0.1:5173并strictPort。
- JSON根对象：`schemaVersion:1,dataVersion,game:'botw',generatedAt,regions,sources,shrines,towers`。towers为r2新增15座定位塔；精确TypeScript合同见04第2节。
- 每座：`id/sourceId/name/trial/regionId/dlc/position/safe/detail/verification`。稳定Dungeon000..135；三语对象`{zh,en,ja}`；position小写`{x,y,z}`。
- safe：`summary/prerequisite`；detail：`intro/prerequisites[]/supplies[]/walkthrough[]`。数组每项三语。外层不接收detail，trial仅详情，搜索只名称和地区。
- verification按name/position/region/safe/intro/prerequisites/supplies/walkthrough记录`status/sourceIds/note`，status为verified/unverified/conflict。sources为`id/title/url/retrievedAt/hash?/locator?`。
- 空数组要有“确无额外内容”的来源；待核实不等于没有。ok不自动升verified，三语译述不冒充官方文字。

## 地图及状态

- root更正底图为hyrule-base.webp，3000×2500。u=(x+6000)/4，v=(z+5000)/4；Leaflet[-v,u]；CRS.Simple bounds=[[-2500,0],[0,3000]]；y不进平面位置。
- 数据136/DLC16及ID连续已结构实查；区域与地标投影仍需核查。地区异常点留表，不最近高塔静默补齐。
- App/store统一状态；MapContext保留中心/缩放/搜索/地区/完成筛选/选择，返回恢复并重验所选ID可见性。
- DLC仅过滤显示和范围分母，不删除进度。当前DLC预览清除，已开的DLC详情保留并提示隐藏。范围与筛选结果计数分开。
- 语言切换保留详情展开区；进入/退出详情或换ID重新折叠敏感区。r2密集神庙仍按原坐标单独显示，不聚合/移位，列表提供等效选择。
- 03已与hash/safe/DLC/MapContext对齐。正文纯文本，禁innerHTML/dangerouslySetInnerHTML/动态字符串bindPopup，外链限http/https且noopener noreferrer。

## 存储和导入

- 键：`zelda-map:botw:v1:progress`、`:settings`、`:pre-import`，数据版本变更不换键。progress存schemaVersion/game/dataVersion/completedIds/updatedAt，settings存schemaVersion/locale/showDlc。
- 读取前不自动保存默认值；损坏不覆盖旧串，失败保留会话并提示未保存。恢复损坏存储先备份原记录，导出始终可用。
- 导出：`format:'zelda-map-progress',schemaVersion:1,game:'botw',dataVersion,exportedAt,completedIds`，含隐藏DLC；导入只改进度，限1MiB。
- 校验后预览再确认，未知ID整体拒绝并列具体ID，取消/失败不改旧集合。同schema数据版本差异提示，重复去重说明。
- 恢复前保存/读回pre-import；失败先下载旧备份才能会话恢复且显示未保存。正常新进度写入/读回成功后才提示成功，失败保留原有效集合。

## 文件归属与未决项

| 负责人 | 独占 |
| --- | --- |
| 前端 | App/components/styles/i18n/main、store/纯工具、包/锁、Vite/TS配置 |
| 数据worker | types、schema、build_data.py、生产JSON、内容目录；再分作者0..67/68..135 |
| QA | tests、05/07、真实验证证据 |
| root | collect_sources.py、源缓存、底图、README/来源说明、状态/汇总 |

旧采集提示块已由root修正并报告136/136真实正文；事实/译述仍逐座核查。root另采集radar宝箱drop actorID，通过actor-localizations.json `${actorID}_Name`匹配三语，关联supplies来源；缺失/冲突不编造。源坐标与投影数值容差1e-6，视觉地标另验。

内容缺口或模板不能算完整通过。先类型/样例让程序员接线，生产必须读真实136座。待验证内容/来源、边界和投影、存储异常、手机/键盘；本版无发布动作。

## r2 立即实施合同

- 用户反馈退回r2，r1测试不沿用为新版本通过。两档暂按连续缩放阈值；root若收到固定两级回复再调整。
- TowerRecord：`id:'Tower01'..'Tower15',name:{zh,en,ja},position:{x,y,z},regionId,sourceId,verification:{name,position,region}`；证据复用FieldEvidence/sourceIds。backend从static.json markers.Tower及localizations同ID标签追加15塔，更新types/schema/build_data/生产JSON和dataVersion。
- Tower只是定位层，不进shrines/completedIds/导入ID集合/120或136分母，不加完成或详情。三语/地区/来源及有限坐标由前端validateDataset验证；少塔或错结构整体数据错误，不静默降级。
- root已确认唯一`SHRINE_ZOOM_THRESHOLD=-1`。zoom<-1只15塔，>=-1只筛选后的独立神庙；神庙搜索/DLC/完成/地区筛选不减少远景塔。删除全部bin/cluster/count/onNearby路径，不动态合并或偏移点位。
- `NEAR_FOCUS_ZOOM=-0.5`，由threshold+0.5派生：点Tower居中并到近景；列表定位神庙强制近景并选中ID，现有神庙过滤与进度保留。返回/复位按实际zoom切换层。
- 神庙视觉18px，透明hitbox44px，中心锚点一致；完成/选中以描边颜色表达。叠点用更高缩放/列表选择，禁止聚合展开。
- 缩远只隐藏神庙标记，保留selectedId和safe预览；点Tower应经App回调清旧神庙选择和预览，不清筛选。手机允许相机pan至面板上方可见区中心，真实标记坐标不变。
- frontend只改其MapCanvas/校验/图标/常量；backend只改其类型/数据区。QA定向阈值下/等于/上、15塔/136独立神庙、无聚合、塔/列表到近景、小图标手机点击、三语/DLC/进度不污染、Tower导入拒绝和返回档位。
