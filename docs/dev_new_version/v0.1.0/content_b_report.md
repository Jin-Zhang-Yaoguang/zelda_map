# v0.1.0 内容作者 B 核对报告

日期：2026-10-11。范围：Dungeon068–Dungeon135，共 68 座；本体 52 座，DLC 16 座。

已完成独占分片 `data/content/Dungeon068-135.json`。未改动其他代码、生产数据、物资文件。每座包含中文、英语、日语的安全介绍、入口类别、详细介绍、前置与至少两步攻略；物资交由后台的公开对象数据生成。

本报告区分“来源正文已阅读核对”和“实机验证”：本轮逐座读了 Wiki 的入口、内部机关或 Features 正文；没有运行游戏验证路线，也没有代替浏览器 UI 验收。

## 已执行检查

- 连续 068–135 共 68 个唯一 ID，sourceId 均为 wiki-DungeonNNN。
- 每座各文本对象恰含 zh/en/ja，值非空，没有整段英文回退。
- 每座攻略至少 2 步；复杂机关为 3 步。分片不含 supplies 字段。
- safe 独立编写，未写解锁操作、谜题答案、宝箱与奖励。
- 地名及人物名按 localizations.json/actor-localizations.json 的英文名字精确匹配中日文本。已纠正达尔布尔桥、乌洛克海角、贝利尔雪原、夏利巴山、摩尔迦娜山、马秋兹半岛、库库甲谷、阿克伦岛、奇克伦岛等，以及柳奈、桃虹、夏本努、阿兹基、果戈等人物名。
- 所有中文/日文正文经过拉丁长词扫描，无残留未翻译地点段落。DLC 缩写保留。
- 不把线索任务视作一律必需：087/100/102/119 的人物提供线索；101 无需先解放露塔；098 需要启动任务，但完整任务结算不是入口硬门槛。

## 来源差异与补证

- 068 英文首版炸弹顺序有歧义，已改为“圆形炸弹先爆，再引爆升空的方形炸弹”，与中日操作顺序一致。
- 078 Wiki 入口/主题段与敌人列表为 Guardian Scout III，后段写 II。主代理用游戏对象 Enemy_Guardian_Mini_Middle 与官方名称映射复核为 III；内容保留 III。后台维护游戏对象补证来源，本分片不重复定义。
- 093 原神庙正文未交代比赛主线门槛；追加 Zelda Dungeon 来源，写清先完成娜波力斯、50 卢比报名、90 秒内过全部门。
- 112 原神庙正文写“所有村内支线”，范围过宽；追加失窃任务来源，改为 Find the Fairy Fountain、Flown the Coop、By Firefly’s Light 三项。
- 107 补充白天取冰与沿阴影搬运；126/127/128/133 补充完整机关操作顺序；105/116 补充迷宫导航。
- DLC 16 座均加上安装 DLC、四神兽解放的公共前置；台地 4 座说明复苏神庙启动一击阶段，其余 12 座说明完成台地四庙并调查英杰石碑。
- 29 个补充来源引用已随受影响记录写入 additionalSources/evidenceOverrides，生成器可直接合并。

## 内容边界与交接给 QA

- 103 的正文提供迷宫中心、绕怨念与两火把下行入口；未编造完整逐转弯路线。它仍是本分片导航精细度最低的一座，独立 QA 应审查是否满足“可执行攻略”的验收要求。
- 116 使用追加公开作者的东行外环、逆时针寻找西北怨念眼、北角向南灯廊再东行梯子的路线；没有进行实机走线。
- 战斗神庙按真实对手装备和入口区分，基本战斗操作可共用。中文正文中的难度概述是本站译述，官方 trial 标题始终由种子提供；独立 QA 可检查两者并列时是否需要统一措辞。
- 隐藏入口时刻、血月、日出光环、117 的现有鳞片替代路径及 DLC 体感操作均基于正文或补证，不声称已做实机验证。
- 本轮未核对 supplies，未产生最终生产 JSON 的通过结论，未做公开发布或用户验收。

## 实际追加来源

- extra-Dungeon093-1: [Zelda Dungeon：Raqa Zunzo Shrine Guide](https://www.zeldadungeon.net/breath-of-the-wild-walkthrough/shrine-locations/raqa-zunzo-shrine-guide/) — Location/Walkthrough：娜波力斯前置、50卢比报名、90秒内通过所有门
- extra-Dungeon103-1: [Zelda Dungeon：The Desert Labyrinth](https://www.zeldadungeon.net/wiki/The_Desert_Labyrinth) — Guide/Gallery：迷宫中央、攀墙绕怨念、黄色火把导航
- extra-Dungeon103-2: [GamesRadar：Wasteland Tower shrine solutions](https://www.gamesradar.com/legend-of-zelda-breath-of-the-wild-shrine-locations-solutions-guide/6/) — #7 Dila Maag：两火把旁台阶下行到神庙
- extra-Dungeon105-1: [Zelda Dungeon：Tu Ka’loh Shrine](https://www.zeldadungeon.net/wiki/Tu_Ka%27loh_Shrine) — Trial of the Labyrinth：入口广场西北通道、北方金属块、右转梯子与上行楼梯
- extra-Dungeon105-2: [Player Assist：Tu Ka’loh Shrine Guide](https://playerassist.com/legend-zelda-breath-wild-tu-kaloh-shrine-guide/) — Trial of the Labyrinth：梯子、盘旋楼梯、蝙蝠走廊
- extra-Dungeon107-1: [Zelda Wiki：Carry the Ice!](https://zeldawiki.wiki/wiki/Carry_the_Ice%21) — Location and Rules：白天取冰、阴影搬运、交付到遗迹入口
- extra-Dungeon112-1: [Zelda Dungeon：The Stolen Heirloom](https://www.zeldadungeon.net/wiki/The_Stolen_Heirloom) — Requirements：Find the Fairy Fountain/Flown the Coop/By Firefly’s Light，非全部村内支线
- extra-Dungeon116-1: [Zelda Dungeon：Trial on the Cliff](https://www.zeldadungeon.net/wiki/Trial_on_the_Cliff) — Guide/Gallery：北侧怨念眼球、攀墙捷径、两灯间梯子
- extra-Dungeon116-2: [NightlyGamingBinge：Trial on the Cliff walkthrough](https://nightlygamingbinge.com/trial-on-the-cliff-shrine-quest-breath-of-the-wild/) — How to Complete：东行中央外环、西南支路逆时针、射西北怨念眼、折回北角向南灯廊再东行梯子
- extra-Dungeon120-dlc: [Zelda Wiki: EX The Champions' Ballad](https://www.zeldawiki.wiki/wiki/EX_The_Champions%27_Ballad) — Overview: four Divine Beasts; Resurrection terminal and One-Hit Obliterator; four Plateau shrines then Champion monuments
- extra-Dungeon121-dlc: [Zelda Wiki: EX The Champions' Ballad](https://www.zeldawiki.wiki/wiki/EX_The_Champions%27_Ballad) — Overview: four Divine Beasts; Resurrection terminal and One-Hit Obliterator; four Plateau shrines then Champion monuments
- extra-Dungeon122-dlc: [Zelda Wiki: EX The Champions' Ballad](https://www.zeldawiki.wiki/wiki/EX_The_Champions%27_Ballad) — Overview: four Divine Beasts; Resurrection terminal and One-Hit Obliterator; four Plateau shrines then Champion monuments
- extra-Dungeon123-dlc: [Zelda Wiki: EX The Champions' Ballad](https://www.zeldawiki.wiki/wiki/EX_The_Champions%27_Ballad) — Overview: four Divine Beasts; Resurrection terminal and One-Hit Obliterator; four Plateau shrines then Champion monuments
- extra-Dungeon124-dlc: [Zelda Wiki: EX The Champions' Ballad](https://www.zeldawiki.wiki/wiki/EX_The_Champions%27_Ballad) — Overview: four Divine Beasts; Resurrection terminal and One-Hit Obliterator; four Plateau shrines then Champion monuments
- extra-Dungeon125-dlc: [Zelda Wiki: EX The Champions' Ballad](https://www.zeldawiki.wiki/wiki/EX_The_Champions%27_Ballad) — Overview: four Divine Beasts; Resurrection terminal and One-Hit Obliterator; four Plateau shrines then Champion monuments
- extra-Dungeon126-1: [Zelda Dungeon：The Champions’ Ballad walkthrough](https://www.zeldadungeon.net/breath-of-the-wild-walkthrough/the-champions-ballad/) — Mah Eliya Shrine：中央冰柱、右块三层支撑、小块移向左侧、抬左块
- extra-Dungeon126-dlc: [Zelda Wiki: EX The Champions' Ballad](https://www.zeldawiki.wiki/wiki/EX_The_Champions%27_Ballad) — Overview: four Divine Beasts; Resurrection terminal and One-Hit Obliterator; four Plateau shrines then Champion monuments
- extra-Dungeon127-1: [Zelda Dungeon：Noe Rajee Shrine](https://www.zeldadungeon.net/wiki/Noe_Rajee_Shrine) — The Four Winds：入口开关、柱底、裂石墙、金属栅栏、迎风开门四处开关
- extra-Dungeon127-dlc: [Zelda Wiki: EX The Champions' Ballad](https://www.zeldawiki.wiki/wiki/EX_The_Champions%27_Ballad) — Overview: four Divine Beasts; Resurrection terminal and One-Hit Obliterator; four Plateau shrines then Champion monuments
- extra-Dungeon128-1: [Zelda Dungeon：The Champions’ Ballad walkthrough](https://www.zeldadungeon.net/breath-of-the-wild-walkthrough/the-champions-ballad/) — Kiah Toza Shrine：盾滑光环断崖气流、金属轨道、冰柱、改轨开关、静止跷跷板、弹射开关
- extra-Dungeon128-dlc: [Zelda Wiki: EX The Champions' Ballad](https://www.zeldawiki.wiki/wiki/EX_The_Champions%27_Ballad) — Overview: four Divine Beasts; Resurrection terminal and One-Hit Obliterator; four Plateau shrines then Champion monuments
- extra-Dungeon129-dlc: [Zelda Wiki: EX The Champions' Ballad](https://www.zeldawiki.wiki/wiki/EX_The_Champions%27_Ballad) — Overview: four Divine Beasts; Resurrection terminal and One-Hit Obliterator; four Plateau shrines then Champion monuments
- extra-Dungeon130-dlc: [Zelda Wiki: EX The Champions' Ballad](https://www.zeldawiki.wiki/wiki/EX_The_Champions%27_Ballad) — Overview: four Divine Beasts; Resurrection terminal and One-Hit Obliterator; four Plateau shrines then Champion monuments
- extra-Dungeon131-dlc: [Zelda Wiki: EX The Champions' Ballad](https://www.zeldawiki.wiki/wiki/EX_The_Champions%27_Ballad) — Overview: four Divine Beasts; Resurrection terminal and One-Hit Obliterator; four Plateau shrines then Champion monuments
- extra-Dungeon132-dlc: [Zelda Wiki: EX The Champions' Ballad](https://www.zeldawiki.wiki/wiki/EX_The_Champions%27_Ballad) — Overview: four Divine Beasts; Resurrection terminal and One-Hit Obliterator; four Plateau shrines then Champion monuments
- extra-Dungeon133-1: [Zelda Dungeon：Keive Tala Shrine](https://www.zeldadungeon.net/wiki/Keive_Tala_Shrine) — Shrine Guide：水中小块、供电平台、小块复用、链挂横杆、制冰托大块
- extra-Dungeon133-dlc: [Zelda Wiki: EX The Champions' Ballad](https://www.zeldawiki.wiki/wiki/EX_The_Champions%27_Ballad) — Overview: four Divine Beasts; Resurrection terminal and One-Hit Obliterator; four Plateau shrines then Champion monuments
- extra-Dungeon134-dlc: [Zelda Wiki: EX The Champions' Ballad](https://www.zeldawiki.wiki/wiki/EX_The_Champions%27_Ballad) — Overview: four Divine Beasts; Resurrection terminal and One-Hit Obliterator; four Plateau shrines then Champion monuments
- extra-Dungeon135-dlc: [Zelda Wiki: EX The Champions' Ballad](https://www.zeldawiki.wiki/wiki/EX_The_Champions%27_Ballad) — Overview: four Divine Beasts; Resurrection terminal and One-Hit Obliterator; four Plateau shrines then Champion monuments

## 逐座正文核对记录

以下为实际已读来源与内容核对主题。sha256 为采集台账已有的源快照哈希，本轮未重新下载页面；“已读核对”不代表实机或 UI 验证。

| ID | 神庙 | 核对主题 | 原始入口/内部来源 | 快照 SHA 前12位 | 状态 |
| --- | --- | --- | --- | --- | --- |
| Dungeon068 | 亚·纳迦神庙 | 石块沿导轨升起，试炼围绕爆破天花板展开。 | [Wiki](https://zeldawiki.wiki/wiki/Ya_Naga_Shrine) | cd0ddd029a17 | 已读核对 |
| Dungeon069 | 伊奥·索奥神庙 | 移动平台上的激光可反复触发水晶，改变阶梯。 | [Wiki](https://zeldawiki.wiki/wiki/Ishto_Soh_Shrine) | 707d562c9ea9 | 已读核对 |
| Dungeon070 | 萨奥·科席神庙 | 初阶战斗试炼，对手使用守护者剑与盾。 | [Wiki](https://zeldawiki.wiki/wiki/Soh_Kofi_Shrine) | ea6a462bb7d5 | 已读核对 |
| Dungeon071 | 普玛·尼特神庙 | 初阶战斗试炼，对手持剑与盾。 | [Wiki](https://zeldawiki.wiki/wiki/Pumaag_Nitae_Shrine) | 38921022c1c3 | 已读核对 |
| Dungeon072 | 达·卡索神庙 | 桥下神庙是持枪守护者的初阶战斗试炼。 | [Wiki](https://zeldawiki.wiki/wiki/Dah_Kaso_Shrine) | 9f8a196bf38f | 已读核对 |
| Dungeon073 | 卡塔·丘基神庙 | 初阶战斗试炼，对手为持枪守护者Ⅱ。 | [Wiki](https://zeldawiki.wiki/wiki/Katah_Chuki_Shrine) | a6e58e72f148 | 已读核对 |
| Dungeon074 | 尼阿·奈阿神庙 | 隐藏洞穴内设持斧守护者的初阶试炼。 | [Wiki](https://zeldawiki.wiki/wiki/Noya_Neha_Shrine) | 75828b9f7f80 | 已读核对 |
| Dungeon075 | 达席·希诺神庙 | 初阶试炼，对手持斧，场地有可破坏石柱。 | [Wiki](https://zeldawiki.wiki/wiki/Dah_Hesho_Shrine) | aa3598f913e9 | 已读核对 |
| Dungeon076 | 萨萨·卡伊神庙 | 入口与塔影有关，庙内是中阶战斗试炼。 | [Wiki](https://zeldawiki.wiki/wiki/Sasa_Kai_Shrine) | 06227b43318a | 已读核对 |
| Dungeon077 | 科尼·希卡神庙 | 岩壁后的洞穴设有中阶战斗试炼。 | [Wiki](https://zeldawiki.wiki/wiki/Ke'nai_Shakah_Shrine) | b278ffc70e7a | 已读核对 |
| Dungeon078 | 米达·罗基神庙 | 血月入口试炼后，还要完成中阶战斗。 | [Wiki](https://zeldawiki.wiki/wiki/Mijah_Rokee_Shrine) | 0eff9eb33304 | 已读核对 |
| Dungeon079 | 纳米卡·奥兹神庙 | 大树桩内的中阶试炼，对手持斧与枪。 | [Wiki](https://zeldawiki.wiki/wiki/Namika_Ozz_Shrine) | e3550d1c2ed5 | 已读核对 |
| Dungeon080 | 希·塔塔恩科神庙 | 拍摄入口试炼后，庙内是中阶战斗。 | [Wiki](https://zeldawiki.wiki/wiki/Shoqa_Tatone_Shrine) | 9d3aca7f90af | 已读核对 |
| Dungeon081 | 姆奥·吉姆神庙 | 中阶战斗试炼，对手持斧与盾。 | [Wiki](https://zeldawiki.wiki/wiki/Muwo_Jeem_Shrine) | 11c83d85f77d | 已读核对 |
| Dungeon082 | 洽斯·科塔神庙 | 高阶战斗试炼，对手同时持斧、剑与枪。 | [Wiki](https://zeldawiki.wiki/wiki/Chaas_Qeta_Shrine) | 49dea8691bd8 | 已读核对 |
| Dungeon083 | 提纳·裘扎神庙 | 高阶试炼，矩形场地布有多排可破坏石柱。 | [Wiki](https://zeldawiki.wiki/wiki/Tena_Ko'sah_Shrine) | 473adfc55c77 | 已读核对 |
| Dungeon084 | 茨茨阿·尼玛神庙 | 泉后入口通向浅水中的高阶战斗试炼。 | [Wiki](https://zeldawiki.wiki/wiki/Tutsuwa_Nima_Shrine) | 098fbaba8768 | 已读核对 |
| Dungeon085 | 基玛·科萨萨神庙 | 高阶战斗试炼，场地覆盖浅水。 | [Wiki](https://zeldawiki.wiki/wiki/Kema_Kosassa_Shrine) | 0752866ef5b8 | 已读核对 |
| Dungeon086 | 迦奥玛·阿萨神庙 | 浅水战斗场地可制冰，对手为守护者Ⅳ。 | [Wiki](https://zeldawiki.wiki/wiki/Goma_Asaagh_Shrine) | 4a48b5c0c6bf | 已读核对 |
| Dungeon087 | 妙斯·希诺神庙 | 隐蔽洞穴内是带可移动金属块的高阶战斗试炼。 | [Wiki](https://zeldawiki.wiki/wiki/Mozo_Shenno_Shrine) | 9533786dc5d4 | 已读核对 |
| Dungeon088 | 席亚·米乌神庙 | 高阶战斗场地没有普通石柱，可用金属块防守。 | [Wiki](https://zeldawiki.wiki/wiki/Hia_Miu_Shrine) | ca15ab9efc45 | 已读核对 |
| Dungeon089 | 萨斯·科萨神庙 | 船坞里的隐藏神庙设有无石柱的高阶试炼。 | [Wiki](https://zeldawiki.wiki/wiki/Saas_Ko'sah_Shrine) | 926d2483f989 | 已读核对 |
| Dungeon090 | 斯玛·萨玛神庙 | 入口试炼利用冰冷物体的影子，庙内为祝福。 | [Wiki](https://zeldawiki.wiki/wiki/Suma_Sahma_Shrine) | 27ad76a3dc03 | 已读核对 |
| Dungeon091 | 古·阿齐托神庙 | 入口由鼓隆族看守，庙内没有机关或敌人。 | [Wiki](https://zeldawiki.wiki/wiki/Gorae_Torr_Shrine) | f8a8d1807195 | 已读核对 |
| Dungeon092 | 玛·诺拉神庙 | 破岩后的洞穴中是没有内部谜题的祝福神庙。 | [Wiki](https://zeldawiki.wiki/wiki/Maag_No'rah_Shrine) | 8f0ed643fd02 | 已读核对 |
| Dungeon093 | 拉丘·乌罗神庙 | 沙海象竞速胜利会开启这座祝福神庙。 | [Wiki](https://zeldawiki.wiki/wiki/Raqa_Zunzo_Shrine) | c6668e22666c | 已读核对 |
| Dungeon094 | 托·卡尤神庙 | 沙丘火把决定神庙出现，庙内为祝福。 | [Wiki](https://zeldawiki.wiki/wiki/Tho_Kayu_Shrine) | aa8d2b8bd9ee | 已读核对 |
| Dungeon095 | 库恩·希达吉神庙 | 入口试炼用磁力观察树木，并归还遗失的箱子。 | [Wiki](https://zeldawiki.wiki/wiki/Kuhn_Sidajj_Shrine) | ca1b6cd89b0e | 已读核对 |
| Dungeon096 | 丘卡·纳塔神庙 | 雷暴中的石丘包住神庙，庙内无额外试炼。 | [Wiki](https://zeldawiki.wiki/wiki/Qukah_Nata_Shrine) | 6953b6023682 | 已读核对 |
| Dungeon097 | 库古·齐德神庙 | 登岛后装备暂时收走，需用岛上资源完成三球试炼。 | [Wiki](https://zeldawiki.wiki/wiki/Korgu_Chideh_Shrine) | d75a6df47c40 | 已读核对 |
| Dungeon098 | 达·乔卡席神庙 | 入口试炼要求不被小克洛格发现地跟随。 | [Wiki](https://zeldawiki.wiki/wiki/Daag_Chokah_Shrine) | 3cf62f102fea | 已读核对 |
| Dungeon099 | 塔罗·尼席神庙 | 教学试炼按次序练习闪避突击、防反和蓄力攻击。 | [Wiki](https://zeldawiki.wiki/wiki/Ta'loh_Naeg_Shrine) | 3f974a3515c0 | 已读核对 |
| Dungeon100 | 基哈·乌神庙 | 岩壁上的闪电壁画是入口线索，庙内为祝福。 | [Wiki](https://zeldawiki.wiki/wiki/Keeha_Yoog_Shrine) | 4950267cad69 | 已读核对 |
| Dungeon101 | 达·基基神庙 | 空中下刺激活瀑布旁台座，内部为祝福。 | [Wiki](https://zeldawiki.wiki/wiki/Dagah_Keek_Shrine) | 833eb44797c2 | 已读核对 |
| Dungeon102 | 兹纳·卡伊神庙 | 抵达骷髅左眼的石柱顶即为试炼，庙内为祝福。 | [Wiki](https://zeldawiki.wiki/wiki/Zuna_Kai_Shrine) | 59220967cf16 | 已读核对 |
| Dungeon103 | 迪拉·玛神庙 | 迷宫路线本身是试炼，神庙内没有额外谜题。 | [Wiki](https://zeldawiki.wiki/wiki/Dila_Maag_Shrine) | 6f223d7f85a4 | 已读核对 |
| Dungeon104 | 拉诺·库席神庙 | 河道中抵达入口就是试炼，庙内是祝福。 | [Wiki](https://zeldawiki.wiki/wiki/Lanno_Kooh_Shrine) | 1cb91ae402a7 | 已读核对 |
| Dungeon105 | 图·卡罗神庙 | 迷宫通向高处房间，庙内为祝福。 | [Wiki](https://zeldawiki.wiki/wiki/Tu_Ka'loh_Shrine) | 777c595932b0 | 已读核对 |
| Dungeon106 | 玛姆·拉诺神庙 | 外部路线要求保护整套克洛格装备，庙内为祝福。 | [Wiki](https://zeldawiki.wiki/wiki/Maag_Halan_Shrine) | a6a30db1de7c | 已读核对 |
| Dungeon107 | 密·苏神庙 | 倒在终端旁的格鲁德人挡住入口，庙内为祝福。 | [Wiki](https://zeldawiki.wiki/wiki/Misae_Suma_Shrine) | a55dbb29f0d1 | 已读核对 |
| Dungeon108 | 基托·瓦瓦伊神庙 | 黑暗遗迹中要找到球与台座，庙内为祝福。 | [Wiki](https://zeldawiki.wiki/wiki/Ketoh_Wawai_Shrine) | f88cf10f5fdf | 已读核对 |
| Dungeon109 | 利塔·兹摩神庙 | 入口试炼需要从半岛根部搬球到中心，庙内为祝福。 | [Wiki](https://zeldawiki.wiki/wiki/Ritaag_Zumo_Shrine) | ed593a92c6ac | 已读核对 |
| Dungeon110 | 裘希·奥神庙 | 七颗金属球的符号要与女英雄雕像配对。 | [Wiki](https://zeldawiki.wiki/wiki/Korsh_O'hu_Shrine) | 4ff707ca14a3 | 已读核对 |
| Dungeon111 | 塔瓦·吉努神庙 | 三座台座需要巨人三兄弟携带的球，庙内为祝福。 | [Wiki](https://zeldawiki.wiki/wiki/Tawa_Jinn_Shrine) | 6aedba71c5ea | 已读核对 |
| Dungeon112 | 拉纳·罗基神庙 | 传家宝失窃事件通向台座，庙内是祝福。 | [Wiki](https://zeldawiki.wiki/wiki/Lakna_Rokee_Shrine) | 39a86103db79 | 已读核对 |
| Dungeon113 | 希·库乔夫神庙 | 向勇气之泉献鳞片开启入口，内部为祝福。 | [Wiki](https://zeldawiki.wiki/wiki/Shae_Katha_Shrine) | ec04ac233e0c | 已读核对 |
| Dungeon114 | 希·尤塔神庙 | 破岩恢复风道，再滑翔落到台座上开启神庙。 | [Wiki](https://zeldawiki.wiki/wiki/Shai_Yota_Shrine) | aab657f77e83 | 已读核对 |
| Dungeon115 | 罗纳·卡塔神庙 | 神殿内守护者构成抵达试炼，庙内为祝福。 | [Wiki](https://zeldawiki.wiki/wiki/Rona_Kachta_Shrine) | 212b5aa595e3 | 已读核对 |
| Dungeon116 | 卡扎·托基神庙 | 神庙被栅栏围住，需要由上方通道进入。 | [Wiki](https://zeldawiki.wiki/wiki/Qaza_Tokki_Shrine) | a60871d682ca | 已读核对 |
| Dungeon117 | 吉塔·萨米神庙 | 向泉献上聂尔龙鳞片可开门，通常需先净化龙。 | [Wiki](https://zeldawiki.wiki/wiki/Jitan_Sa'mi_Shrine) | d28c9861540a | 已读核对 |
| Dungeon118 | 托·库摩神庙 | 海布拉大化石下的祝福神庙由雪球开门。 | [Wiki](https://zeldawiki.wiki/wiki/To_Quomo_Shrine) | 730e2363888d | 已读核对 |
| Dungeon119 | 塔诺·阿神庙 | 三棵杉树指向隐藏洞穴，内部为祝福神庙。 | [Wiki](https://zeldawiki.wiki/wiki/Tahno_O'ah_Shrine) | 257d42105b8f | 已读核对 |
| Dungeon120 | 耀瓦卡·伊尔塔神庙 | 用磁力控制金属碗，在滚落杂物中捞取试炼球。 | [Wiki](https://zeldawiki.wiki/wiki/Yowaka_Ita_Shrine) | c265f4ee6190 | 已读核对 |
| Dungeon121 | 基希罗特·摩神庙 | 观察转动箱内的彩球数量，以数字凹槽回答。 | [Wiki](https://zeldawiki.wiki/wiki/Kihiro_Moh_Shrine) | c2a77ab9a197 | 已读核对 |
| Dungeon122 | 艾茨·科力玛神庙 | 黑暗中依靠亮光，穿过激光、转动尖刺和火焰。 | [Wiki](https://zeldawiki.wiki/wiki/Etsu_Korima_Shrine) | 8254581ed1a5 | 已读核对 |
| Dungeon123 | 罗希塔·奇古神庙 | 一击状态下穿越地刺、传送带、摆球与追赶墙。 | [Wiki](https://zeldawiki.wiki/wiki/Rohta_Chigah_Shrine) | cbad4bc1d31c | 已读核对 |
| Dungeon124 | 萨塔·卡达神庙 | 用制冰支撑滚落的大球，导向末端发射机关。 | [Wiki](https://zeldawiki.wiki/wiki/Sato_Koda_Shrine) | 478156e7fa9e | 已读核对 |
| Dungeon125 | 基奥·达夫纳神庙 | 逐步融小冰块，搭出可攀爬的台阶。 | [Wiki](https://zeldawiki.wiki/wiki/Kee_Dafunia_Shrine) | 2577faefdb47 | 已读核对 |
| Dungeon126 | 玛乌·艾鲁亚神庙 | 制冰与磁力支撑导轨金属块，拼出上升路径。 | [Wiki](https://zeldawiki.wiki/wiki/Mah_Eliya_Shrine) | 58c6552c625e | 已读核对 |
| Dungeon127 | 诺伊艾·罗吉神庙 | 绕旋转柱打开四个风口，用连续上升气流升高。 | [Wiki](https://zeldawiki.wiki/wiki/Noe_Rajee_Shrine) | d2533408a296 | 已读核对 |
| Dungeon128 | 基哈·托乌萨神庙 | 调整金属轨道、冰柱与机关时机，完成长距离滚球路线。 | [Wiki](https://zeldawiki.wiki/wiki/Kiah_Toza_Shrine) | b940fb18ec44 | 已读核对 |
| Dungeon129 | 希利特·古奥玛神庙 | 风扇运送炸弹并支撑滑翔，最后需控制闸门时机。 | [Wiki](https://zeldawiki.wiki/wiki/Shira_Gomar_Shrine) | 54d6b7c3dc9f | 已读核对 |
| Dungeon130 | 卡米拉·奥姆纳神庙 | 用炮弹击中靶子，体感装置调整后段障碍。 | [Wiki](https://zeldawiki.wiki/wiki/Kamia_Omuna_Shrine) | 95f549e97e96 | 已读核对 |
| Dungeon131 | 利诺·希米卡神庙 | 金属块遮挡火焰，末端体感平台帮助越过火流。 | [Wiki](https://zeldawiki.wiki/wiki/Rinu_Honika_Shrine) | cb8b5fc63fd2 | 已读核对 |
| Dungeon132 | 夏德·罗恩神庙 | 骑乘空中传送带悬挂块，利用侧面避开障碍。 | [Wiki](https://zeldawiki.wiki/wiki/Sharo_Lun_Shrine) | d67967faad45 | 已读核对 |
| Dungeon133 | 克贝·塔瓦神庙 | 用大小金属块与悬挂球接通四段电路。 | [Wiki](https://zeldawiki.wiki/wiki/Keive_Tala_Shrine) | 84f31b0761e5 | 已读核对 |
| Dungeon134 | 塔塔卡玛·希米利神庙 | 滑动导轨金属块，分别搭路与接通电路。 | [Wiki](https://zeldawiki.wiki/wiki/Takama_Shiri_Shrine) | cfcc2541ba79 | 已读核对 |
| Dungeon135 | 露奈·科力巴神庙 | 高阶战斗后还有地下通道、钥匙和最终混合战斗。 | [Wiki](https://zeldawiki.wiki/wiki/Ruvo_Korbah_Shrine) | bae19ef5225e | 已读核对 |
