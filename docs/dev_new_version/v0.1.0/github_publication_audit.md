# v0.1.0 GitHub公开仓库发布前审计

日期：2026-10-11。独立watchdog只读审计。目标：公开仓库`Jin-Zhang-Yaoguang/zelda_map`，仅创建仓库与普通推送；不含PR、合并、Pages、Release或删除。用户本轮已明确授权公开GitHub，前次本机范围的历史限制不替代本次授权。

## 结论

**未发现拟公开源码中的凭据或新增工程阻断；排除下列10份独立浏览器备份/恢复记录后，其余按已验收项目暂存。** 这10份是隔离QA产生的进度/恢复材料，未发现真实用户存储被测试读取的证据；仍建议留本地、不随源码公开，避免把浏览器记录当必要发布资产。

root负责显式暂存清单、gitleaks暂存diff检查、构建、提交和GitHub回执。本角色不改Git状态或忽略规则，不执行发布。

## 主代理暂存与检查补充

主代理已显式暂存357文件，将下列10份本地记录加入`.git/info/exclude`；文件仍保留本地，不进入公开暂存内容。主代理实际gitleaks staged扫描约6.48MB文本，未发现泄漏。本角色没有冒称自行执行gitleaks；最终提交若追加发布文档，检查范围由主代理按实际暂存内容收口。

`git diff --check`例外仅为`public/THIRD_PARTY_NOTICES.txt`的第三方许可原文，主代理记录314项尾空格/空行；其余自有源码、数据、测试和文档通过。保留许可原文件及已验收SHA256，不为格式检查改写第三方原文、生产内容或归档包。此为已知原文格式例外，不是凭据泄漏、应用漂移或未关闭业务阻断。

## 留本地、不公开的具体路径

前缀均为`docs/dev_new_version/v0.1.0/`：

| 相对路径 | 类型与处理 |
| --- | --- |
| evidence/before-session-restore.json | `zelda-map-progress`进度备份，留本地 |
| evidence/corrupt-session-backup.json | 同上，留本地 |
| evidence/data-error-backup.json | 同上，留本地 |
| evidence/disabled-session-backup.json | 同上，留本地 |
| evidence/hidden-dlc-backup.json | 同上，留本地 |
| evidence/normal-backup.json | 同上，留本地 |
| evidence/r2/corrupt-tower-session-export.json | 同上，留本地 |
| evidence/r2/progress-hidden-dlc.json | 同上，留本地 |
| evidence/r2/r1-state-r2-export.json | 同上，留本地 |
| evidence/repaired-original-storage.json | `zelda-map-original-storage`原浏览器存储恢复记录，含原progress/settings字符串，留本地 |

不删除上述文件。测试源码已有受控fixture生成逻辑，公开这些导出副本不是复现必需。普通browser-results中的隔离测试断言、计数及模拟ID不等于用户个人进度文件，无须一并剔除全部证据。

现有ignore范围继续留本地：node_modules、dist、原始Wiki HTML、`*-research.json`、localization原HTML、日志/测试临时目录、Python缓存与`.runtime/`。这些缓存有本机复算用途，未因公开操作删除。

## 检查范围与结果

- 对`git ls-files --others --exclude-standard -z`得到的367份候选做检查，总约54.91MiB；这是本次初筛快照，不计后续新增发布文档。
- 敏感文件名初筛（.env、私钥/证书、credentials、数据库等）无命中；UTF-8文本的私钥、AWS ID、常见服务token、凭据赋值模式无命中。只报告路径/类别，不回显任何疑似值；二进制不作文本密钥识别，root另用gitleaks核对实际暂存diff。
- 9份进度备份与1份原存储恢复记录通过JSON顶层格式识别，没有从名称猜测其内容，也未把模拟QA材料称为真实用户隐私泄露。
- 未发现范围外工具配置、账号资料、个人数据库或意外源码目录。源码、公开事实数据、内容分片、Schema、生成脚本、测试与被文档引用的截图/报告有实际运行或审计用途，不建议为缩小仓库删除它们。
- 最大单文件为`data/sources/tower-regions.json`，约1.841MiB；较大截图约1.585MiB，归档ZIP约1.395MiB，底图约1.149MiB。没有本次发现的巨大单文件；仓库体积主要来自真实QA截图。这里只报告实际大小，不宣称已验证GitHub平台限制。
- `release/hyrule-shrine-map-v0.1.0.zip`独立读取目录为6个静态文件，内容与dist逐字一致，无备份或研究缓存混入。该归档有已授权版本归档用途；不是GitHub Release创建。

## 已验收候选与产物

r3的38项candidate-manifest重新核对，漂移为空。应用未改变，数据、进度、阈值、18px/44px合同保持；没有重跑测试或重建。

| 产物 | 当前哈希/一致性 |
| --- | --- |
| 生产JSON | public/dist逐字一致，`4938b62b72cbeed84e85b4d7ae7e37a60e6bd729de17debd2f6f8892c37b3fde` |
| 底图 | public/dist逐字一致，`5847a9e5f5d4ed44bc20b61d2b5c24999c33b796d8a42354946f42c631b4ec10` |
| NOTICE | public/dist逐字一致，`5cd96ec0a64a180e02eb5f36c03a303218492418ee4533ea1293369a231aca33` |
| JS index-BN0TqlsP.js | `db5af850044e51347b46fe59690e099aec8ad7fe2bdd602f9818f92ac6de6e0b` |
| CSS index-B7CQyL1l.css | `f0e26335b6d4302f4e22852fedd7f7243468ccbb262560716d3949952afaa7c0` |

未发现需重开WD-R3-01或重新验收应用行为的变化。既存资料冲突、设备覆盖及第三方归属说明保留；本次敏感文件审计不把NOTICE视为额外授权证明，也不重新裁定游戏资料事实。

本角色只写本报告，未改源码、忽略规则、验收文档、Git状态或PID40178。公开仓库是否实际创建和推送成功，以root的GitHub回执及读回为准。
