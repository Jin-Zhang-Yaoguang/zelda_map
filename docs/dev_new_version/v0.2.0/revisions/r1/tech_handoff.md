# v0.2.0 技术交接

日期：2026-10-11。technical_expert。已对齐02_PRD和03_UIUX，主代理确认IDB、缓存屏障、迁移前处理pending与最小RPC。具体接口与SQL见04_技术方案，开发可以据此开始。未改源码或实际云配置。

## 固定入口与归属

- `src/lib/sync/types.ts`唯一公开类型；`src/lib/sync/controller.ts`导出createAccountProgressController({knownIds,dataVersion})。
- 后端独占cloud/*、sync/*、supabase/migrations/tests、supabase_setup.md、backend_handoff.md。
- 前端独占App/Settings/新账号迁移冲突组件/i18n/styles；前端不写账号cache/outbox或直调Supabase。
- package/lock/env/Pages/vite-env/progress.ts由主代理统一处理，避免并写。

## 后端实现要点

1. 先落types并通知前端：AccountSnapshot身份/ready/completedIds/saveState/pending/conflicts/error/backups；controller认证、setComplete、retry、resolveConflict、previewTransfer/apply/dismiss、previewRestore。
2. private表progress/receipts，public get_shrine_progress/apply_shrine_progress。RPC内部auth.uid、search_path固定、所有查询owner约束、execute只authenticated，客户端无UID或DML；RLS表策略与RPC内部权限分别验证。
3. 136项单批迁移CAS，冲突零进度写入；requestId+payload相等重放，不等拒绝；false行保留，receipt不自动过期。
4. IDB项目/UID/game单事务envelope；同座有序，in-flight immutable，后续target不被旧ack覆盖；跨tab租约，epoch阻止旧结果污染新账号。
5. 真正加载过同UID缓存允许离线编辑；cache miss或初读失败只读；pending/conflict先处理再迁移；备份与迁移job同事务。
6. PKCE显式根URL?code兑换再恢复hash，OTP shouldCreateUser=true且发送成功不算登录。退出local scope，保留guest和旧UIDqueue；过期账号只读并重登。
7. 真实云缺少配置，测试结果必须标清PGlite/fake-IDB/适配器与真实Supabase边界。

## 前端接线

- 数据加载成功后建立controller，useSyncExternalStore订阅稳定snapshot；StrictMode start/dispose可重复。
- guest原Set/导入/备份保留。identity存在时用账号snapshot；ready=false保护编辑。signOut成功才回guest。
- setComplete Promise只说明本机commit，云状态看snapshot。旧completeSaved toast必须按真实write结果显示。
- 迁移/JSON账号导入给previewTransfer({kind,completedIds,raw})，预览source/cloud/overlap/result/new/cancel；confirm只传previewId+mode。pending/conflict非空显示先处理，不直接重写。
- backup列表允许导出及previewRestore(id)，目标只当前UID；恢复仍merge/replace预览+CAS。preview.backup可在确认前导出，但apply才持久化，不以下载代替本机快照。
- 操作前账号备份导出以accountCompletedIds调用makeBackup形成可再导入的v1文件，源记录分别导出，文件名/界面标清归属；不要直接下载TransferBackup混合对象并称v1。完整元数据保留IDB用于同UID恢复。
- 冲突safe名称/ID+local/remote true/false，明确选择local/cloud。新增状态/错误完整三语，键盘和focus trap沿用ImportDialog。

## 外部接入与测试

需要Project URL、sb_publishable key、审核SQL、自定义SMTP与OTP模板、GitHub OAuth App。GitHub callback是Supabase `/auth/v1/callback`；Supabase redirect allow list是应用开发及Pages根路径。禁止service_role/secret/SMTP/OAuth secret进入VITE或bundle。

独立测试重点：A/B/guest隔离、false取消不复活、CAS/receipt/迁移原子回滚、多tab/离线重启、迟到响应、存储失败、预览过期、备份恢复和v1原数据保留。SQL RLS测试用非超级用户角色；PGlite不代表GoTrue/PostgREST/Auth联调成功。

本版仅本机候选；v0.1.0生产继续运行，未授权创建付费资源、推main/部署、删除云表或guest。
