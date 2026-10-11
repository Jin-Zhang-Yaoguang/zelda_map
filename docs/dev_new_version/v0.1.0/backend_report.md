# v0.1.0 后端与数据开发记录

日期：2026-10-11。角色：backend_engineer。仅离线数据和本机静态预览，无服务端或发布动作。

## 修改范围

- `src/types.ts`：实现已锁定的三语、神庙、分区、来源与逐字段核实类型。
- `data/schema/shrines.schema.json`：精确根对象与字段白名单；136座、15分区；三语对象、证据、来源URL和稳定ID格式。
- `scripts/build_data.py`：合并种子、游戏文本、地图边界、两份作者内容与宝箱对象，原子生成生产JSON。
- `data/content/Dungeon000-067.json`：68座逐篇核对入口与机关，原创简短中英日整理；每座至少两条可执行步骤，详情中文说明均不超过120字，全部英文字段最多76词。
- `public/data/shrines.json`：固定合同的生成数据。作者B负责068..135分片，后端仅合并，不修改该分片。

对应R1–R5、P01/P03/P04/P05/P09；持久化与DLC界面由前端负责。

## 数据与来源

名单与坐标来自ZeldaMods `markers.Dungeon`，136=120本体+16DLC，Dungeon000..135稳定ID。名字、试炼名和地名逐项匹配StaticMsg三语游戏文本，不直接音译英文地名。生产`sourceId`引用可解析的`wiki-DungeonXXX`，原始神庙ID仍为`id`。

地区用MapTower多边形的x/z平面ray-cast，包含外环并排除内环。每点必须恰好属于一个分区，未归属/多归属硬失败，不就近补齐。15区计数含DLC：Hebra14、Tabantha7、Gerudo6、Wasteland15、Woodland8、Central8、GreatPlateau8、DuelingPeaks9、Lake6、Eldin12、Akkala8、Lanayru12、Hateno7、Faron8、Ridgeland8，合计136。分区显示名由官方Tower01..15名称加“分区”生成，避免与更大地理地区混为一谈。

物资来自136座CDungeon公开对象数据，共205个TBox。每个宝箱的drop物品ID均有ActorType三语名称，一条展示项对应一个TBox。drop首值是类型，不能当物品堆叠数；不编造箭支数量。本栏只列神庙内部宝箱，不冒充地面武器或神庙外所有资源。

正文来自逐座Zelda Wiki入口与机关章节，本站自行整理及译述，保留页面URL、采集日期和原HTML哈希。safe只列位置和前置类别；点火、射击、摆放、宝箱或具体入口操作都在detail。画作、传闻等线索任务不自动写为硬前置。

Dungeon008的Wiki把歌谣任务与物理入口混在一起；[Zelda Dungeon实际指南](https://www.zeldadungeon.net/breath-of-the-wild-walkthrough/shrine-locations/bareeda-naag-shrine-guide/)明确任务需梅德、入口可在未接任务时揭示，并补充第一炮清木箱。A已追加来源并改三语说明，未把梅德误写为该座硬前置。

作者可挂`additionalSources`与`evidenceOverrides`补充实际公开来源。生成器验证来源ID唯一、http/https合法、字段名及来源引用；补证追加到实际受影响字段，保留原Wiki。Dungeon078的Wiki等级矛盾按游戏对象`Enemy_Guardian_Mini_Middle`与ActorType确认Guardian Scout III，intro/walkthrough追加对象与游戏文本证据。

## 构建与自检

```sh
python3 scripts/build_data.py
```

默认严格构建：缺少任何人工必需字段/宝箱资料即非零拒绝，保留现有生产JSON。开发骨架需明确使用`--allow-incomplete`，缺项显示三语“待核实”并记unverified，不能当完整交付。

生成器检查：136唯一ID和120/16归属；名称与试炼名逐值比对游戏文本；坐标逐值比对原始地图，容差1e-6；底图边界；15区唯一归属；Wiki正文与英语神庙身份；三语非空与两步攻略；宝箱对象唯一、同神庙、drop类型与全部物品译名；来源白名单和引用完整。

Python3.9.6编译检查已通过（缓存写到/tmp）。缺少最后作者条目时，默认构建确实非零拒绝生成；开发命令可生成包含明确缺项的136座骨架。系统Python未安装jsonschema；生成器结构检查不代替QA的独立Schema验证。

## 接力与边界

前端读取`public/data/shrines.json`，外层只消费safe，trial/detail仅在详情使用。投影保留04合同：u=(x+6000)/4、v=(z+5000)/4，Leaflet[-v,u]；高度y不参与平面地图。

本记录不代签地图视觉对齐、三语浏览器交互、进度保存、备份、移动端或用户验收。最终严格合并及补证元数据已齐备；完整数据构建成功仍不能代替独立事实与界面测试。


## 最终严格合并结果

`python3 scripts/build_data.py` 已成功，136条人工内容全部合并：136座=120本体+16DLC，15分区，205宝箱项，307来源，必需字段缺项0。每座攻略至少两步；1088个逐字段证据均有可解析来源，其中1087个verified、1个conflict。核实状态由实际作者核对材料后记录，不能替代独立QA结论。

除A的008补证外，B追加29项来源：093纳波力斯与沙海象比赛、107白天搬冰、112三项任务、103/105/116迷宫入口、126/127/128/133专属操作及16座DLC共同前置。字段级追加保留原来源，不把新事实归给旧Wiki。所有sourceId/sourceIds均可在根级sources解析。

r1生产JSON SHA256：`18eb8934cd4011798ebc9d9bb8e1a042073691ec189df7ca824ab1f34dbf7302`。已通知主代理和QA冻结此候选进行独立验证。无发布、部署、推送或用户验收签署。


## QA发现的物资冲突

Dungeon017 / Shee Vaneer：Wiki写Edge of Duality（游戏文本为静心大剑 / 無心の大剣，actor055），游戏对象的基础drop为Weapon_Lsword_041，即戒心长刀 / Eightfold Longblade / 残心の太刀。原始对象objid25353、map_static1；sharp_weapon_judge_type=0、one_hit_mode=0、spawns_with_lotm=0。缓存文件`data/sources/chests/Dungeon017.json`的SHA256为`10c48b0d81edb5a7156296b24382d9efdf98cab8db76a1ba2fd9bd7f114168af`，与采集台账一致。

尚无材料能证明差异由版本、缩放或DLC变化造成，不猜测机制。supplies按游戏对象显示基础物资，核实状态改为conflict，来源含游戏对象/ActorType/Wiki，并写入完整note交前端在物资区显示。结构缺项0不等于事实冲突0；本座物资差异仍待进一步证据解释。已通知主代理与独立QA，不把已知冲突藏在verified里。


根代理确认P09/V09内的兼容扩展：`FieldEvidence.displayNote?: LocalizedText`已加入类型与Schema。017物资含简明中英日冲突说明，原note保留研究细节；前端仅在详情已展开的物资区显示displayNote，地图外层不显示。再次严格构建与Python编译通过；最终JSON哈希以上述更新值为准。未改其他内容。


## r2 用户验收修订：15座高塔定位数据

根据03/04/tech_handoff的r2合同，新增`TowerId`、`TowerRecord`及根级必需`towers`，独立于神庙目录和完成进度。Schema限定15座Tower01..Tower15，名称、坐标、regionId与name/position/region逐字段证据；sourceId固定map-static。

生成器直接使用现有原始`static.json markers.Tower`的15条记录和StaticMsg同ID三语官方名称。X/Y/Z仅转为x/y/z并逐值保留。15塔均通过MapTower的x/z点内测试，唯一归属编号0..14，与Tower01..15编号对应，无就近补齐或位置偏移。来源复用现有game-labels/map-static/tower-regions，不新增或改写307条来源记录。

严格构建及Python编译通过：136神庙、15高塔、120本体+16DLC、205宝箱、必需字段缺项0；Dungeon017物资冲突保留。独立读取原始Tower与标签逐值比对名称/坐标；r1/r2对shrines、sources、regions深比较完全一致，所有136座三语正文、物资、证据和已有冲突说明均未改动。高塔ID与神庙ID集合无交集。

数据版本为`v0.1.0-20261011-r2`，根schemaVersion仍1。仅本版候选合同演进，未修改进度/备份Schema、存储键、稳定神庙ID或完成状态逻辑。未改采集源、作者内容、前端或QA文件；前端图层交互另验。

r2生产JSON SHA256：`4938b62b72cbeed84e85b4d7ae7e37a60e6bd729de17debd2f6f8892c37b3fde`。
