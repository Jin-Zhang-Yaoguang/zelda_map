# v0.2.0 独立上线验证报告

日期2026-10-11，独立qa_engineer。目标[正式Pages](https://jin-zhang-yaoguang.github.io/zelda_map/)。本人已验收并授权推送/更新Pages，主代理负责实际Git/Actions部署；QA只做独立读取与隔离浏览器验证。**当前线上实际资源匹配发布产物，4个唯一界面组均有通过证据；首轮native7等待超时保留，根因未完全确认，不写作产品已修复。**

## 发布身份与资源证明

产品提交 `0673e7cb9ad12dc9771feefb89c81395958894c8`，成功Actions run `38145129220`。主代理已验证成功回执并下载实际github-pages tar，SHA256 `230888697607b5195aea6dac22b226a7593b750aa855354b982157e0c049af96`；解压9951产品文件、其中9945原生PNG，位于.runtime/v020-deployed-site。来源evidence/release/actions-success.json、deployed-artifact-context.json。这是实际CI部署产物，不是本机合成env构建。

`NODE_USE_ENV_PROXY=1`运行冻结release_assets.mjs，8项公开HTTP200且解码后bytes SHA逐项匹配实际artifact；最高层PNG同时匹配源manifest：

| 资源 | 当前线上实测 |
| --- | --- |
| index.html | 与Actions HTML hash一致 |
| assets/index-BV4XmBHR.js | 真实新版JS hash一致 |
| assets/index-D7t4FtHP.css | 真实新版CSS hash一致 |
| data/shrines.json | 发布数据hash一致 |
| THIRD_PARTY_NOTICES.txt | NOTICE hash一致 |
| assets/map-tiles/7/0/0.png | source/artifact/线上三方hash一致 |
| assets/map-tiles/7/46/39.png | source/artifact/线上三方hash一致 |
| assets/map-tiles/7/93/78.png | source/artifact/线上三方hash一致 |

完整64位期望/实际SHA、响应尺寸/MIME在assets-results.json。HTTP200或部署job成功单独不能替代上述版本证据。未逐片请求线上9945文件；完整数量/bytes来源实际artifact及本机原PNG审计，线上为代表样本。

## 实际浏览器范围

Chromium独立context，1440×900/DPR2，合成guest052/120只写该context本机storage；不使用用户浏览器或旧cookies。Supabase请求拦截，实际blockedCloudRequests=0，未填写/提交任何认证字段，无真实云写。

冻结release_browser.cjs首轮4组中3通过，native7 loadedTile.first等待20s超时。保留browser-first/results.json与日志，未修改冻结正式脚本或产品源码。仅用.runtime/release_browser_native_diagnose.cjs验证副本补实际DPR/zoom/tile loaded/natural/box及截图，定向重测原组通过；其hash及差异性质见发布manifest，不将临时工具当产品变更。

| 唯一组 | 实测与证据 |
| --- | --- |
| 地图/标记/开关刷新 | far136神庙+15塔、near136；符号36/命中44；关闭后列表保136，刷新false保留，合成guest raw未变；首轮pass |
| 小缩放/native7 Pages | 小wheel后zoom变化；定向实测DPR2、zoom2，viewport载入`/zelda_map/assets/map-tiles/7/28/21.png`，natural256×256/CSS宽128；定向pass |
| 三语hover/详情 | zh/en/ja标题与发布数据一致，卡宽220；Pages详情直达刷新、日语名称正确、敏感折叠未渲染；首轮pass |
| 邮箱唯一入口 | 配置后的邮箱登录/注册界面可见、current/new-password正确，无GitHub；仅切模式，无Auth submit，guest raw保留；首轮pass |

各次pageErrors/resourceErrors为空。线上截图online-native7.png、online-detail-ja.png、online-email-only-register.png均是QA合成context。native截图属于渐进瓦片加载期间，证明代表瓦片真实载入，不宣称整个viewport或全部线上瓦片已完全高清加载，更不作FPS/GPU结论。

首轮native等待超时原因没有完全确认；诊断开始时zoom2/DPR2、108个tile尚有pending，后来代表tile实际加载。不能据此断言一定是offscreen、网络或产品错误。没有源码修复，定向通过不是“已修产品”；原失败不覆盖。

## 边界与文件冻结

没有进行线上真实注册、登录、会话刷新认证、云进度写入或跨设备测试；邮箱服务端有限10组是此前本项目真实API证据，不能冒作此次上线浏览器认证通过。14组本机地图检查亦未重复。没有操作Edge、5173、用户原guest/真实账号，不创建或删除用户。

正式两脚本SHA仍与发布前冻结一致：release_assets `6b7fabcd600f79fb80637599fd18d14e71ef43244f5bf5eb1b2f64513c29f5a8`，release_browser `639acc6dd96e39927b2a19bb109b818742f618566b233c7f30fb82d6a12678d5`。36源码/资产输入仍与r4已验收构建一致，01..07未改。临时副本只验证，context/Chromium已关闭；发布记录/状态及最后文档提交由主代理收口。
