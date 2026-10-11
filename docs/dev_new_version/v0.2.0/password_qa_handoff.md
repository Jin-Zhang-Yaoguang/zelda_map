# v0.2.0 r2 邮箱密码QA交接

日期：2026-10-11。角色：独立qa_engineer，未参与实现。已获主代理授权提前写独立r2脚本，冻结前不执行候选；当前已完成r2独立测试并修订07；未改实现、后台配置、正式记忆或发布资料。初期准备状态与失败证据保留。

## 输入与范围

已读01/02、password_product_handoff、原05/07/qa_handoff、QA角色指南及项目QA/shared相关记忆；检查原qa_browser/qa_adapters的fixture、实际SDK、PGlite RPC和错误分流证据结构。r1原件已归档revisions/r1；原evidence和失败结果保留，旧OTP通过不代表r2。

用户最新变更为邮箱注册/密码登录，暂停邮件服务；GitHub、访客与R1/R3—R8不变。05现保留原权限/CAS/队列/迁移/焦点矩阵，替换A02/A03/U02并新增P01—P10。03 §11与password_ui_handoff已核对：失败保当前内存、模式/成功/unmount/UID变化清理、字段自动填充、44px/360和显式异步返回焦点均进入方案。04/技术交接现已按主代理决定对齐：未知无有效session→sessionNotEstablished；明确email_not_confirmed→emailConfirmationRequired，不查前端管理配置；Auth返回Identity/controller void。实际后台密码策略仍待读回。

## 实现冻结后的计划

1. 主代理通知冻结，提供最终03/04、代码范围及实际密码策略；QA固定源码、SQL、lockfile、三个隔离构建和数据哈希。只写tests/v020/r2_*、新增evidence/r2*、07及本交接，不改实现。
2. 认证wrapper/错误矩阵：signUp仅session＋UID才登录，user无session诚实失败；原字符提交、不隐式注册；invalid_credentials401不是guest session过期，未确认/weak_password/duplicate/429/503保持安全真实分类。sync401/42501继续按原语义。
3. 实际SDK/浏览器：登录注册校验、确认密码、并发锁、内存密码清理及存储/日志无泄露；真实DOM/autocomplete/键盘/三语/360；首次云读取屏障、guest raw保留、A/B与GitHub UID不串、退出/刷新、队列/迁移/U06受影响回归。
4. 按冻结diff执行受影响验证。SQL及核心engine若未变只核hash并引用r1事实；不把引用写成r2重跑。失败与修后产物分别新增，不覆盖旧证据；07逐项列通过/失败/未运行/受限及L0—L4。

## fixture及外部条件

复用真实Chromium、SDK、IndexedDB和PGlite实际RPC；GoTrue/Auth/OAuth为明确替身。跨源现代error code必须响应X-Supabase-Api-Version与CORS Expose-Headers，并处理实际CORS请求，避免r1协议失真。测试密码每次内存生成，仅送Auth；不记录body、密码、JWT、OAuth code，不进截图/产物。

使用QA自有临时端口/context，不读取.env.local或用户Edge真实进度，不停止5173 PID40178。构建显式合成env并屏蔽自动加载本机env。临时服务、浏览器及数据库finally清理并保留实际退出结果。

主代理已核实真实项目metadata、RLS/grant/definer及匿名get/apply401/42501；QA只审阅这些主代理回执，不冒称独立真实认证证据。Confirm email尚未关闭，需代码/表单准备后真人当场确认；注册8字符是产品建议，实际后台规则待读回。GitHub尚未接入。真实密码Auth/JWT、真A/B、跨设备CAS/迁移/恢复均为L4外部待条件。无邮件找回是当前产品边界，不等待SMTP来完成r2实现。

QA结论不能代替本人验收或发布。下一次回报应给r2受测哈希、命令、结果文件及未闭缺陷；本阶段不提前生成通过结果。

## 测试准备进展（设计阶段历史）

已新增r2_build.mjs、r2_auth.mjs、r2_browser.cjs，分别准备envFile:false隔离构建/manifest、认证wrapper与错误/controller矩阵、实际SDK＋Chromium＋IndexedDB＋PGliteRPC。使用QA端口5176，证据目录evidence/r2，新结果存在时拒绝覆盖。仅node --check语法检查与git diff --check通过，不计业务用例通过。等待冻结和实际密码策略后再运行。

## 冻结后的实际结果

07现为r2报告，r1原报告留revisions/r1。独立认证/身份7个唯一组、浏览器19个唯一组最终均有通过证据；typecheck及root/pages/guest隔离构建通过，冻结源码与构建输入一致。未确认需修改实现的P0/P1。源码相对r1仅8文件有变，SQL/storage/repository/client/App/数据/底图不变，未全重跑SQL与engine。

首轮controller两ID白名单、sandbox监听拒绝、共享PGlite状态污染及把signup user-only条件用于signin导致文案预期不适用，均保留原失败。修正只在QA脚本/fixture，未冒业务修复。官方SDK合法signup无session诚实提示，signin user-only另作为SDK协议拒绝的零账号/零RPC旁证。Auth Promise三种竞态（其他UID先到/同UID事件先到/重挂）通过；新密码存储/清理、三语360390、原U06六旁路、root/pages OAuth及迁移/离线队列受影响回归通过。

结果在evidence/r2/auth-second-results.json、auth-additional-results.json、browser-second/results.json、browser-targeted/results.json、browser-signin-protocol/results.json；source-comparison/build/candidate manifest固定输入与产物。临时5176/Chromium/PGlite已关闭，5173和用户Edge不操作。

实云schema metadata仅审阅主代理回执；真密码Auth/JWT/A/B/GitHub/跨设备仍L4未测。后台minimum8的最终保存读回等待主代理，Confirm email仍ON、需当场真人授权后再安排实云测试。OTP/SMTP/邮件找回已取消，不作为待实现功能。用户验收与发布由主代理/真人决定，QA不代签。

## Watchdog P3 最终定向复核

仅AccountPanel20eb312d...修订；root隔离重建+2个定向浏览器组通过，零pageerror/资源错。实际SDK凭据错误后邮箱/密码/确认编辑清提示/aria，重试错误再出现；非Auth快照保护使用独立真实组件明确snapshot harness，storage/sync/network与expired保留、不改快照。证据browser-edit-error/results.json和edit-build-manifest.json；原19组/SQL/engine未重复，旧候选manifest另存candidate-before-edit-manifest.json。07§6及最终candidate-manifest已绑定最新源码。后台最低8最终读回仍未知，Confirm仍ON/未获当场答复，不创建真用户/发邮件。

## 有限L4 API已补证（当前）

真人当场授权关闭确认后，QA按主代理分配执行r2_live_api.mjs。10组全通过，sourceStable=true，实际只创建两个合成QA UID。PKCE注册立即session、7字符弱密码拒绝、local退出/重登/错密无session、真实A/A2/B独立客户端、完成→取消false、UUID重放/CAS、账户与同UUID收据隔离、篡改自己JWT401/PGRST301、当前controller合成guest完整136迁移与独立云读回均已实测。结果live-api-results.json不含邮箱/密码/token/实际UID；SDK/controller已dispose，Auth用户和合成记录保留，未删除。

真实RPC/JWT/API证据与前述L2/L3分开；controller备份仍fakeIDB、非实体跨设备/浏览器磁盘；真GitHub/同邮箱链接、整浏览器实云/恢复及本人验收未完成。07§7已更新当前结论；§5/6的Confirm ON/真实API未测是历史。每次signup前独立核autoconfirm=true，真实后台最低8已有主代理GUI读回并以7字符真实weak_password旁证，未发送OTP/reset邮件。
