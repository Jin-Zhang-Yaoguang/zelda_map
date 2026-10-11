# 独立资料对照记录

日期：2026-10-11。QA未参与内容编写。验证的是源记录与本站整理的对应，不是实际游戏通关。最终数据见data-results.json及candidate-manifest.json。

## 全量检查

- 从原始static.json读取136座Dungeon记录，逐轴比对生产position，容差1e-6；ID精确000..135、120本体+16DLC。
- 独立HTMLParser读取原始StaticMsg/ActorType表，移除日文ruby注音后核对三语名称/试炼与205宝箱drop译名，不复用生产构建解析函数。
- 用独立winding算法复核15分区归属；浏览器按每区至少一座及5个补充地标比对地图标记与底图像素，实际误差小于2px。原始游戏坐标来源与前端投影是两种证据。
- 全量Schema、必需字段、来源引用及三语结构检查。136座中文safe逐条阅读，三语扫描奖励/机关操作候选，未见外层解法。浏览器实际打开408次safe预览，detail物资/攻略未进入外层DOM。

## 代表性语义对照

| ID | 对照重点 | 独立结论与来源 |
| --- | --- | --- |
| Dungeon000 | 火焰清除藤蔓/木箱，入口任务可选 | 三语步骤与wiki-research中该座入口/机关符合；不是重复泛化攻略 |
| Dungeon038 | 主线磁力符文、地板/墙/桥/金属门 | 本站三语机制与Oman Au专属快照相符；四神庙顺序可选在源中明确 |
| Dungeon017/044 | 双子山南北两座初态互换 | 入口方位与跨座球布局依赖一致；没有在safe透露球位。017物资冲突另列 |
| Dungeon070 | 初阶战斗、剑盾Scout II | 与Soh Kofi快照敌人/栅门机制一致 |
| Dungeon078 | 血月卸甲入口，中阶剑盾Scout III | 解锁仅详情；Wiki后段Scout II笔误与前段/敌人表矛盾，游戏对象/文本补证为III；本站未照抄错误 |
| Dungeon081 | 中阶斧盾Scout III | Muwo Jeem专属快照与本站三语匹配，区别于070/082 |
| Dungeon082 | 高阶斧剑枪Scout IV、海岛入口 | Chaas Qeta快照和游戏宝箱drop匹配 |
| Dungeon093 | 神兽前置、报名与竞速、台座入口 | 独立读[Zelda Dungeon指南](https://www.zeldadungeon.net/breath-of-the-wild-walkthrough/shrine-locations/raqa-zunzo-shrine-guide/)的Walkthrough，确认主线前置、50卢比、90秒、全门及胜利球入台座；三语整理符合 |
| Dungeon107 | 白天取冰、阴影运送、遗迹交付 | 独立读[Carry the Ice!](https://zeldawiki.wiki/wiki/Carry_the_Ice!)的Location and Rules，与专属快照、本站三语对应 |
| Dungeon112 | 三项任务依赖、夜晚跟随、依盖战斗 | 专属Wiki笼统说全部支线，独立读[The Stolen Heirloom](https://www.zeldadungeon.net/wiki/The_Stolen_Heirloom)确认仅列三项前置；本站按补证而非笼统说法整理 |
| Dungeon120 | DLC台地营地、小球/金属碗 | Yowaka Ita快照对应；DLC共用前置另读[EX The Champions' Ballad](https://www.zeldawiki.wiki/wiki/EX_The_Champions%27_Ballad)确认四神兽、台地试炼与后续石碑阶段 |
| Dungeon127 | 四靶入口、转柱四处开关 | 专属快照加[Noe Rajee Shrine](https://www.zeldadungeon.net/wiki/Noe_Rajee_Shrine)的Requirements/The Four Winds，确认裂石、金属栅栏、柱底和风扇门四类开关；三语内容符合 |
| Dungeon134 | DLC时限沙海象环、金属导轨通电 | Takama Shiri快照对应；先通行后接电的建议有源支持，三语未混入其他神庙机制 |
| Dungeon135 | DLC首战、地下钥匙、最后四敌 | Ruvo Korbah快照对应，最后重生条件、三项宝箱与游戏drop一致 |

15座样本还在浏览器检查45个三语完整详情视图，介绍与依赖/物资/攻略都按同ID渲染。样本覆盖常规机关、主线、双子、三种战斗、隐藏入口、祝福和DLC；不升格为其余121座每句话都独立实机核实。

## Dungeon017已明示来源冲突

原始对象缓存chests/Dungeon017.json中objid25353：drop为Weapon_Lsword_041，游戏文本为戒心长刀/Eightfold Longblade/残心の太刀。Wiki快照写Edge of Duality，对应游戏文本另一物品Weapon_Lsword_055。对象的sharp_weapon_judge_type、one_hit_mode、spawns_with_lotm都为0；这些值不足以证明版本或缩放导致差异。

本站保留游戏基础drop，但supplies.status为conflict，双方来源均列出，三语displayNote说明差异原因未确认。QA实际验证：说明只在详情物资展开后出现，折叠及地图safe均不出现；三语截图见conflict-Dungeon017-zh/en/ja.png。冲突原因仍未解决，不能写成全部资料无差异。

## 边界

全量结构/原始游戏数据映射已查；攻略语义为代表性源对照。没有在游戏中逐座通关，也未由日语母语玩家逐句校审。公开网页可能更新，本轮使用已留哈希的快照及2026-10-11实际读到的补充指南。转载整页、外部来源可访问和flag=verified均未被用作完整通过的替代证据。
