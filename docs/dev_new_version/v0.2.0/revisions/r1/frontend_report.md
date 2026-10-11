# v0.2.0 前端实现与交接

2026-10-11，frontend_engineer。基线dev/v0.2.0、2686aa1。按01—04和交接实现；主代理正在实际配置Supabase。本角色没有做真实邮件、GitHub认证、RLS或跨设备云联调，账号界面自查的适配器证据明确为模拟。未发布、未改5173服务、未改后端/同步库、progress.ts、package或工作流。

## 实现

- App数据加载后建立固定createAccountProgressController({knownIds,dataVersion})，通过useSyncExternalStore读稳定snapshot，effect start/dispose。只有身份对应的账号snapshot用于账户进度，v1 guest Set/原JSON/设置独立保留；退出成功后显示原guest。未加载/会话失效禁完成、导入和迁移，地图与详情可浏览；未加载数量用“—”而非空云0。
- 44px身份/保存条和设置账户节。未配置正常guest且不提供假登录；邮箱验证码/GitHub两入口、独立发送/验证/错误、可粘贴验证码不硬编码长度。认证身份仅取controller返回，长身份可读。身份、缓存未确认、本机持久失败、队列、离线、冲突、云确认分开呈现；不编造缓存时间。
- 访客只有saveVerified成功才显示本机已保存；失败保留会话值并持续提示未保存。显示偏好异常与进度分开。guest storage事件同步原v1进度、偏好和上次备份；账号操作不写guest key。身份/失效切换清旧撤销、预览和冲突窗口，迟到的前端操作按发起UID保护反馈。
- 迁移、账号JSON导入、同UID快照恢复复用controller preview/apply。合并/替换radio不预选，按hasChanges禁无差异确认；逐座安全差异、重合/新增/取消/全136范围、隐藏DLC及明确目标。pending/conflict/unsaved先处理；确认时由controller原子保存快照与批次，不以额外下载替代持久备份，无账号会话绕过。guest源确认前再读v1原文校验变化；原记录不被迁移删除。
- 操作前账户备份与源记录分别经makeBackup导出合法v1JSON，不把TransferBackup混合对象当v1。导出仅称发起下载。账号快照恢复先重新预览；guest导入/原上次备份沿用v1路径，初始化/过期不会回退写guest。
- 逐座冲突不预选，展示safe名称/地区/ID、local/remote两值。requestId/revision/remote bool变化清该座旧radio，其他未变化选择保留；conflict_changed保留窗口并要求重选，不报告完成。真实云结果始终按snapshot，不把setComplete/apply Promise当云确认。
- 新模态有标题初焦点、Tab围栏、Esc收起、背景inert和返回焦点；收起不撤回已经开始的任务。新增完整中英日文案和响应式样式。

写入：App、Settings、SafePreview/ShrineDetails禁用修订，新AccountPanel/SyncStatus/AccountDialog/TransferDialog/ConflictDialog、i18n/styles，本报告。MapCanvas初始视角和03补充由主代理额外明确授权；其他角色WIP保留。

## OAuth视图完整性补充

真实OAuth整页重载会丢原内存视图。按主代理批准，App在公开signInGithub调用前保存临时sessionStorage视图，只有query/地区/完成筛选/selectedId/panelOpen/center/zoom/returnFocus以及schema/时间；无进度、UID、令牌。schema1/15分钟TTL、有限坐标/zoom、合法DOM焦点ID、已知地区与神庙校验；回调读取即清key，无效安全忽略。MapCanvas可选initialView只首次有效恢复；不重新以selectedId聚焦覆盖center。隐藏地图的onView不会污染最后可见相机；auth原hash/PKCE清理契约不变。03已追加这一确认的实施说明。

## 实际验证

- 最终npm run build类型检查及Vite7.3.7构建通过，98模块。新增SDK使主JS约688kB（gzip约201kB），构建有体积提示，未借此改配置或扩拆包范围。
- 缓存Chromium1228，隔离浏览器1440×960/390×844，固定origin。真实当前服务guest标记/取消、刷新、跨tab同步通过；真实QuotaExceededError注入后未提示保存成功，原v1字符串不变，导出包含本次会话的3个ID及隐藏DLC。没有触碰用户原浏览器/真实进度。
- 临时浏览器模块适配器严格沿公开controller接口，位于/private/tmp并仅拦截测试上下文，不进生产源码。通过账号首次读取全部136完成按钮及详情禁写、账号编辑不写guest、迁移模式未选时禁确认、备份失败保持原数据、账号操作前导出v1不混UID、逐座冲突/二次修订清radio、会话失效只读、退出恢复原guest；OTP错误恢复及非固定8位验证流程；390px无横向溢出；pageerror=[]。
- OAuth视图模拟整页重载通过：query/region/filter/selected52/zoom0恢复，marker BBox前后同为{x:766,y:519,width:44,height:44}，原guest字串不变、临时key被清；过期视图安全忽略。该证据只证明视图恢复，不代表真实PKCE/GoTrue成功。独立QA正在用SDK回调适配器与Pages候选复核。
- 初次自查“稍后处理”定位到背景和dialog两个元素属于脚本范围问题；迁移暂缓文案按设计细化为“暂不迁移”。OAuth隐藏地图相机更新已局部修复并定向重测。

临时脚本：/private/tmp/zelda_v020_frontend_smoke.cjs、zelda_v020_frontend_edge.cjs、zelda_v020_controller_fixture.js。截图：zelda-v020-real-guest.png、zelda-v020-real-quota.png、zelda-v020-mock-account-mobile.png、zelda-v020-mock-oauth-restored.png。后两张为模拟账号UI，不能当真实云成功截图。正式测试文件/结论由独立QA维护。

## 冻结与待验

前端源码已通知QA冻结，仅本报告继续写。App SHA256：847a28fda2de844c19b17ba1f35e26202b90ad44096292545c23eff5de31cbe8；MapCanvas：f8c0812b2f3cfab0e3e90c25b00e3965059f637d83055843c214723197000504；ConflictDialog：a23f0e17be21766bf20e4d2c37427248981062d845e9f6379464198af1a7a083。

独立QA的真实SDK root/Pages回调、OAuth图像边界等待复核；实际Supabase邮件、GitHub OAuth和两设备同步以主代理后续证据为准。UI自查不替代后端事务/RLS测试、独立QA或用户验收。未宣称版本完成/通过验收。

## 独立QA A03修复

独立测试真实SDK验证端点返回503后，controller已给networkFailure，前端verify catch却固定提示无效/过期码。已仅修改AccountPanel该catch，通过controller.getSnapshot().error调用统一accountErrorMessage，网络/限流/无效码分开提示并保留输入。证据由QA维护于browser-otp-network-before-fix.json与otp-verification-network-error.png；OAuth视图和E09均已独立通过，不再改其逻辑。此为冻结后的必要P1修复，重建后交QA定向回归。

A03修复后npm run build通过；AccountPanel SHA256：6f02955ab49f363c1f47298a4d2491db34f563ca3e503ce82193b3621fd02dc0

## A03后最终前端冻结清单

SHA256: 66a7f0d92ae36fc368ccabfaa04f529dd4e7bf0e5d908da75d45c2caae79a55f

| 文件 | SHA256 |
| --- | --- |
| src/App.tsx | 847a28fda2de844c19b17ba1f35e26202b90ad44096292545c23eff5de31cbe8 |
| src/components/AccountDialog.tsx | 7f9f0b0cf850e3f9db104170f5c77d52a55027b10dd45f0c5e94d416c2cbc386 |
| src/components/AccountPanel.tsx | 6f02955ab49f363c1f47298a4d2491db34f563ca3e503ce82193b3621fd02dc0 |
| src/components/ConflictDialog.tsx | a23f0e17be21766bf20e4d2c37427248981062d845e9f6379464198af1a7a083 |
| src/components/ImportDialog.tsx | 18b5db961f32de1504a0040fe7560222665cf537f194e383904b12e184376155 |
| src/components/MapCanvas.tsx | f8c0812b2f3cfab0e3e90c25b00e3965059f637d83055843c214723197000504 |
| src/components/SafePreview.tsx | 470d61bcc115533d1cc383770db7be4187def067ac5789a341470be78d1b9030 |
| src/components/Settings.tsx | 162eda7c5221407ea8bf2351a6e3e8108aed4ce6328e8c8f201865a5160274c6 |
| src/components/ShrineDetails.tsx | 0945785ea0253ddfee7676b25c1e2cc0886ccf2e421496a69d4331a3b49698e7 |
| src/components/SyncStatus.tsx | 0e9d1d39ab2229ba730f762905d5ab7a597e0e07f197d78d3a6d640a73783d6f |
| src/components/TransferDialog.tsx | 9df04525dea7f18cd5deb142d6859069f70477c43fcb3cbc6f4f2f9b47a0a472 |
| src/i18n.ts | a3d848bd547f6236a32c17f2dc229b878569d1514a654fb08dedd80eab69c1d6 |
| src/styles.css | fa0108abc9869d62b123554f0149c84e05f2733fd797c9e7230592e4a68da8da |

## U06

SHA256: 46bba1a9ecefb5582c7a9f356891a4b0bcb0b18fc12c8d997f0c62533dc99d29

| 文件 | SHA256 |
| --- | --- |
| src/App.tsx | 449037022fdb14ab6b90fdfac595b7caee70dbc4f81a46e7d01543f985e295a9 |
| src/components/AccountDialog.tsx | 87b6dd05402d36b9f0fb58637944e6ef4c64a65b6dbccd193d185d3fc040081b |
| src/components/AccountPanel.tsx | ab7e37848ec4ae592f184ecb600cdd821859da4addd700e238dc9e76f5fbdff4 |
| src/components/ConflictDialog.tsx | abc0d2a79ce3a9cb36159149d3c3883901330c70859f4c118a8364924b93f88e |
| src/components/ImportDialog.tsx | 70b7fcc5ea42edf04deb355fd28db0b00cb274c04e84b6356666c02236fef8a7 |
| src/components/Settings.tsx | 8a0b4484c78b54899ac1de63a177902d232e6411160bcaaf487e580ea4232948 |
| src/components/TransferDialog.tsx | a93249a9adbcb6d4a61e6ee9074cbdf020ba9be22330f16fad6eced9b3737a46 |

U06依据QA实际证据browser-keyboard-dialog-results.json/keyboard-return-focus.png修复：异步预览按钮被disabled后浏览器焦点已到BODY，挂载时捕获activeElement不足。迁移、导入、账户/guest快照恢复及冲突入口现在于打开前显式保留真实控件和当前身份焦点周期；AccountDialog与旧ImportDialog接该返回目标。关闭或预览失败后仅在原控件connected、可见、非inert且enabled时恢复；短暂busy最多等待500ms，失效则进入账户状态/设置等安全入口，不聚焦确认按钮。新dialog挂载会取消旧返回任务，preview.id重挂不抢新标题；身份变化使旧来源无效，用户已经移走焦点也不强抢。

本次只涉及上表7个focus相关文件，不改Auth/sync、迁移数据逻辑、样式或地图。npm run build通过；仅/private/tmp/zelda_v020_focus_smoke.cjs定向自查异步80ms预览→Esc后250ms回migration-trigger、header解除inert，以及重新预览重挂标题/再次关闭回原入口，两项通过。该自查是隔离UI适配器，不替代独立QA的SDK受控U06。源码现冻结，交QA和watchdog受影响回归，不全套重跑；root服务未动。
