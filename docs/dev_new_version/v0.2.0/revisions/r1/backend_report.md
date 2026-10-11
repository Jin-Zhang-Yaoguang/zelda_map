# v0.2.0 后端开发记录

基线2686aa1，分支dev/v0.2.0。修改仅cloud/sync、Supabase迁移/自测及本版后端交接文档。未动App、组件、i18n、样式、progress.ts、依赖、工作流或正式记忆；未触碰5173，未推送或部署。

实现：官方SDK配置校验和单例PKCE、邮箱OTP/GitHub/local signout；两个安全RPC；UID/project隔离IndexedDB；单事务缓存/outbox/immutable jobs/备份；跨tab租约、UID+epoch屏障、false取消、逐座CAS、receipt重放、136迁移原子批次；真实保存状态、加载屏障、冲突选择、迁移/恢复预览和无差异零写。类型先落盘给前端，hasChanges已由root确认分模式。

SQL：private两表RLS，直接权限撤销；public两RPC仅authenticated执行，SECURITY DEFINER固定空search_path，内部auth.uid且每条操作owner过滤。迁移/恢复整批CAS，任一冲突零进度写入，冲突receipt可保留；同request+payload重放，不同payload拒绝。取消保存false/revision递增，receipt不自动删除。

有效自测已实际运行：

- PGlite0.5.8：false保留、CAS、136批次、receipt重放/不同payload拒绝、A/B内部隔离、anon/null身份拒绝、非法ID/重复/格式、私有直表权限拒绝；在隔离库临时grant后SET ROLE authenticated验证真实RLS过滤和跨owner写拒绝，再撤销。auth.uid为测试stub，不含GoTrue/PostgREST。
- fake-indexeddb6.2.5+受控RPC：离线缓存重启与false取消、快速true→false旧ack保留后续意图、丢响应原request重放、136迁移、无差异零写、快照恢复、存储失败、首次加载屏障、跨tab租约、在途换UID迟到响应、云冲突选择及失效预览。
- TypeScript曾通过；集成构建实际使用Vite7.3.7构建成功。前端并行改动中的临时语法未代为修改；最终候选仍由root和独立QA固定验证。

目前未收到实际Project URL/publishable key，本角色没有执行真实Supabase迁移、用户认证、SMTP、GitHub授权或跨设备实测。root正在准备项目；这些结果需后续实际回执，不能用本机测试升级为实云通过。独立QA与用户验收尚待完成。


最终复验实际执行三条自测和`npm run build`全部通过。`adapters.test.mjs`使用受控SDK验证PKCE只兑换一次、Pages根URL及认证query清理、受控hash、认证回调异步调度、OTP注册参数、local signout、管理key拒绝、UID绑定和响应协议；不代表GoTrue/真实OAuth。最后构建JS约684.4kB，Vite给出体积提示；此提示不是构建失败。

RPC发起前读取当前会话并核对预期UID，将该会话Authorization显式绑定到请求，避免SDK随后切换会话时串发旧UID队列。读写均有15秒请求超时；迟到GET和receipt确认不倒退已知revision。迁移等待现有sender尾部完成后再进入互斥事务，无pending/conflicts才可执行；真实浏览器同时核对guest原raw未变化。SQL冲突时间改为ISO JSON，减少Safari日期解析歧义。


## 独立QA E09修复

原实现刷新远端后直接接受旧local/cloud选择，没有绑定用户已经看到的remote版本；独立QA实际SQL复现false/rev1→true/rev2→false/rev3后旧选择被应用。修前证据由QA保存，未修改其脚本或evidence。

resolveConflict现在先捕获已展示冲突，再真实重读；若revision、completed或冲突request变化，单事务更新remote和最新本机意图，保留原immutable job、队列与冲突，不生成备份或新的云写入，拒绝旧choice并返回`conflict_changed`。UID/epoch在读后和事务中再次核对，避免结果串入新账号。下一次明确选择才按新版本提交。

有效定向自测`node supabase/tests/conflict-change.test.mjs`已通过：PGlite实际RPC+fake-IDB分别测试local/cloud旧选择拒绝、rev3冲突刷新、原job/意图保留、零新增云写；重新确认后local写rev4、cloud保留rev3。auth为stub，非实云。TypeScript检查通过。已交独立QA定向复测E09，不以自测代签。


## 独立QA A03错误分类修复

原normalizeError先判通用HTTP403，覆盖Auth的otp_expired；[Supabase官方说明](https://supabase.com/docs/guides/troubleshooting/otp-verification-failures-token-has-expired-or-otp_expired-errors-5ee4d0)确认验证码无效/过期可返回403并带此code。已仅在auth阶段将已知验证码code提前到通用401/403前，映射invalidOtp；sync的403/42501权限拒绝、普通401会话过期、网络503和429限流保持。

`node supabase/tests/error-normalization.test.mjs`定向自测及TypeScript检查通过；测试使用受控错误对象，非实云。errors.ts已冻结SHA256：`7a34720ad47874cdcb10a6262c735c267329534db454c1543fbe9da6072bb3b3`。只改此错误分类与后端自测/记录，独立QA浏览器403 DOM复测另留回执，未改凭据日志或部署。
