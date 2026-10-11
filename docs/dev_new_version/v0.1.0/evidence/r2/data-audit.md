# r2 独立数据复核

实测时间：2026-10-11T03:10:46.387217+00:00。本子代理未参加实现；只读生产代码与数据。

命令：`python3 tests/r2/qa_data.py`；最终退出码 **0**。未运行构建或启动服务。

数据版本：`v0.1.0-20261011-r2`。SHA256：`4938b62b72cbeed84e85b4d7ae7e37a60e6bd729de17debd2f6f8892c37b3fde`，与主 QA 指定候选一致。

## 结果

- 136 座神庙 = 120 本体 + 16 DLC；15 座 Tower 独立存在，ID 为 Tower01..Tower15；塔未进入神庙数据目录及 205 个宝箱。
- 15 塔三语名从原始 localization-static.html 的同 ID 行读取，保留 ruby 正文字、删除 rt/rp 注音；逐项比对通过。
- 15 塔 XYZ 逐轴对照 static.json markers.Tower，差值均为 0。独立 winding 算法对 tower-regions.json 测试，逐塔唯一落入同编号分区。
- 136 神庙三语名称/试炼、XYZ、DLC 分类、分区全量回归；205 宝箱从逐座原始 JSON 的 drop actor ID 与原始 ActorType HTML 译名比对，全部一致。
- Schema 当前数据通过；缺少 towers、14/16 塔、Tower00/16、空名、缺日语、无穷坐标、缺 y、塔新增 dlc、缺地区证据共 11 个异常样本均被拒绝。
- 执行真实 isShrineId、validateBackup、readProgress：15 塔均不是 Shrine ID；含任一塔的备份整体拒绝为 importUnknown，保留原 Dungeon000 进度且存储写入 0 次；持久记录含 Tower01 时判为 corrupt。
- 277 个本地源快照哈希重新计算一致：4 个公共原始源 + 136 Wiki + 136 宝箱 + 1 敌人表。生产 sources 共 307 条；另外 30 条补充引用不升格为此次缓存核验。
- 当前错误、声明的待核实字段、safe 奖励关键词候选均为空；不能据此断言介绍、依赖、攻略每句话都已独立证明。

## 15 座塔逐项记录

| ID | 中文 | English | 日本語 | region | X / Y / Z | 独立多边形编号 |
| --- | --- | --- | --- | --- | --- | --- |
| Tower01 | 海布拉之塔 | Hebra Tower | ヘブラの塔 | hebra | -2173.0 / 550.0 / -2034.0 | 0 |
| Tower02 | 塔邦挞之塔 | Tabantha Tower | タバンタの塔 | tabantha | -3613.748291015625 / 465.8552551269531 / -990.1647338867188 | 1 |
| Tower03 | 格鲁德之塔 | Gerudo Tower | ゲルドの塔 | gerudo | -3666.0 / 490.1874084472656 / 1828.5999755859375 | 2 |
| Tower04 | 荒野之塔 | Wasteland Tower | 荒野の塔 | wasteland | -2306.8359375 / 551.0 / 2437.3203125 | 3 |
| Tower05 | 森林之塔 | Woodland Tower | 森林の塔 | woodland | 883.88427734375 / 371.03424072265625 / -1605.710205078125 | 4 |
| Tower06 | 平原之塔 | Central Tower | 平原の塔 | central | -788.6449584960938 / 218.46099853515625 / 442.03057861328125 | 5 |
| Tower07 | 初始之塔 | Great Plateau Tower | 始まりの塔 | great-plateau | -560.03515625 / 267.239990234375 / 1694.86328125 | 6 |
| Tower08 | 双子山之塔 | Dueling Peaks Tower | 双子山の塔 | dueling-peaks | 1016.77734375 / 204.82568359375 / 1714.08203125 | 7 |
| Tower09 | 湖之塔 | Lake Tower | 湖の塔 | lake | -31.8155517578125 / 301.29864501953125 / 2961.600830078125 | 8 |
| Tower10 | 奥尔汀之塔 | Eldin Tower | オルディンの塔 | eldin | 2174.1513671875 / 529.5474243164062 / -1556.7811279296875 | 9 |
| Tower11 | 阿卡莱之塔 | Akkala Tower | アッカレの塔 | akkala | 3308.0 / 614.6000366210938 / -1500.0999755859375 | 10 |
| Tower12 | 拉聂尔之塔 | Lanayru Tower | ラネールの塔 | lanayru | 2258.0 / 331.73541259765625 / -108.99996948242188 | 11 |
| Tower13 | 哈特诺之塔 | Hateno Tower | ハテノ塔 | hateno | 2735.5 / 357.0 / 2133.5 | 12 |
| Tower14 | 费罗尼之塔 | Faron Tower | フィローネの塔 | faron | 1331.203125 / 290.75 / 3273.72265625 | 13 |
| Tower15 | 丘陵之塔 | Ridgeland Tower | 丘陵の塔 | ridgeland | -1755.300048828125 / 349.4000244140625 / -774.300048828125 | 14 |

## 构建产物读回

直接读现有 dist 与 public 文件字节；未重新构建。

| 文件 | public / dist 相同 SHA256 | 字节一致 |
| --- | --- | --- |
| data/shrines.json | `4938b62b72cbeed84e85b4d7ae7e37a60e6bd729de17debd2f6f8892c37b3fde` | 是 |
| assets/hyrule-base.webp | `5847a9e5f5d4ed44bc20b61d2b5c24999c33b796d8a42354946f42c631b4ec10` | 是 |
| THIRD_PARTY_NOTICES.txt | `5cd96ec0a64a180e02eb5f36c03a303218492418ee4533ea1293369a231aca33` | 是 |

## 既有来源差异

Dungeon017 原始对象 objid25353 的 drop 为 Weapon_Lsword_041，原始三语文本为戒心长刀 / Eightfold Longblade / 残心の太刀；原始 Wiki HTML 列 Edge of Duality，对应 Weapon_Lsword_055。两份事实源仍不同。

生产物资维持基础 drop，supplies.status=conflict，关联宝箱、游戏文本及 Wiki 双方来源，并有非空三语 displayNote。这里只验证差异仍公开记录；展开/折叠及 safe 可见性交父 QA 浏览器测试。不能推断差异源于版本、缩放或 DLC。

## QA 脚本修订

首次运行有两个检查器问题：原始 HTML 的 120 座本体名称存在重复同值行；TypeScript 内存转译未指定 target，默认旧语法降低了 Set 展开的语义。此两项不能当作生产缺陷。

已逐份比较重复行，只拒绝同 ID 异值；转译改用 ES2022 保留 Set 语义。随后完成宝箱物品同 ID 异值检查、补齐代码哈希留档并最终重跑，退出码 0。没有改动实现。

## 覆盖边界

- verification 旗标仅检查引用与缺口，不作为事实证据。
- 三语名称、试炼、原始 XYZ、分区与宝箱 drop 全量比对；介绍、前置和攻略仅检查结构、来源身份及缺口，未逐句证明语义。
- 不覆盖真实浏览器图层、阈值、图标、点击、手机、折叠和可见 DOM；由父 QA 单独验证。
- Dungeon017 的双源差异保持明示；未证明版本、缩放或 DLC 是原因。
- 源哈希证明本地快照与记录一致，不证明远端当前内容或游戏实际通关。
- 没有运行 build、启动服务、修改生产数据/状态或覆盖 r1 证据。

完整机器证据：`data-results.json` 包括 15 塔/136 神庙逐项记录、277 源哈希、11 Schema 异常样本、真实完成 ID 检查及所读实现文件哈希。脚本：`tests/r2/qa_data.py`。

本次写入仅三个文件：`tests/r2/qa_data.py`、`docs/dev_new_version/v0.1.0/evidence/r2/data-results.json`、`docs/dev_new_version/v0.1.0/evidence/r2/data-audit.md`。
