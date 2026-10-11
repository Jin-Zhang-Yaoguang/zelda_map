# v0.2.0 r2 邮箱密码技术交接

角色：technical_expert。日期：2026-10-11。仅修改本文与 `04_技术方案.md`，未改代码、测试报告、记忆或云配置。输入：r2 需求/PRD/产品交接、UI03§11、当前 auth/types/controller/errors/AccountPanel、官方资料及已安装 SDK 2.117.3。主代理已确认统一 API 与下述错误分类，最终文件归属由主代理分配；不代表 r2 运行通过。

## 统一 API

```ts
// src/lib/cloud/auth.ts；成功必须来自有效 data.session
signUpEmailPassword(email: string, password: string): Promise<AccountIdentity>;
signInEmailPassword(email: string, password: string): Promise<AccountIdentity>;
// src/lib/sync/types.ts AccountProgressController
signUpEmailPassword(email: string, password: string): Promise<void>;
signInEmailPassword(email: string, password: string): Promise<void>;
```

Auth 分别调用 `client.auth.signUp({email,password})` 与 `signInWithPassword({email,password})`；邮箱 trim/基本格式，密码原样、不 trim。注册最低8是本机建议，后台最低/字符策略待读；登录只要求非空。确认密码仅前端，不增加持久 credentials/snapshot 字段。controller 复用 authCall 互斥→switchIdentity；首次云读/可信同 UID 缓存屏障不变。移除两层 sendEmailOtp/verifyEmailOtp 和 AuthPhase.otpSent，r2无发送邮件旁路；GitHub/signOut不改。

先检查SDK error，再检查 session.user.id 和 access_token；只从 session 构造身份。注册/登录error=null但无有效session抛sessionNotEstablished，混淆user不算创建/登录成功；仅服务端明确email_not_confirmed才emailConfirmationRequired，不据本次无session猜未确认，不新增后台配置查询/Admin client。无session不迁移/写云/假提示查收。拿到session只是认证成功，cloudSynced仍需原同步条件。[signUp](https://supabase.com/docs/reference/javascript/auth-signup)、[密码登录](https://supabase.com/docs/reference/javascript/auth-signinwithpassword)

## 必须一起落地的保护

- code先于status：invalid_credentials→invalidCredentials；email_not_confirmed→emailConfirmationRequired；weak_password→weakPassword；user_already_exists/email_exists→accountExists；validation_failed→authValidationFailed，不再映射OTP。重复只认明确code，原始错误不展示/保存。
- 429→rateLimited，503/其它5xx/fetch失败→networkFailure，403/42501→permissionDenied。Auth裸401→authFailed；凭据401/403不能expired。只有明确session/refresh code或sync/transfer 401/PGRST301才sessionExpired。[官方错误码](https://supabase.com/docs/guides/auth/debugging/error-codes)
- controller report再防护：guest+null错误保持guest；已有UID的真实过期保留该UID只读、停sender。expired A错密码仍是A；成功B才换B。保留原epoch/旧响应/队列隔离，不重构同步。
- 密码仅当前表单及调用参数，关闭/卸载/模式切换/成功清除；不进入snapshot、envelope、job、backup、JSON、env、视图context、local/session storage、IDB或日志。SDK可按原设定持久化session，不额外保存密码。应用不自动重试注册/登录；结果不明由用户主动选择登录/重试。无SMTP不提供reset邮件。
- 保留GitHub的PKCE、hash与根/Pages回调、15分钟受控视图、焦点取消任务与E09重新选择保护。官方autoconfirm不走邮箱PKCE确认流程；当前SDK全局pkce的signUp仍生成challenge，立即session真实联调需确认，不擅改全局implicit/双client。

## 实际云配置与身份边界

主代理已GUI核实两私有表RLS/no directDML、两RPCdefiner空path/仅authenticated；尚非真实A/B JWT/跨设备通过。Auth URLs正在配置，GitHub未接，Confirm email仍开，密码规则待读。主代理完成可审查候选后按浏览器规则取得真人当场确认才可关确认并读回。本角色未批准/执行开关。邮箱不证明归属；不显示verified，不降低密码规则。

同邮箱新OAuth会尝试自动链接已有用户；OAuth-only后同邮箱signUp可返回混淆user，不能自动添加密码。添加密码的官方途径是已认证updateUser({password})，本版不扩范围。所有进度以实际session.user.id为准，不能承诺provider隔离，不自建alias、按邮箱合并、手动link或密码库；真实同邮箱结果待GitHub配置后验证。[官方身份链接](https://supabase.com/docs/guides/auth/auth-identity-linking)

## 分工与测试交接

建议后端独占auth/errors/types/controller及password_backend_handoff/supabase_setup；前端独占AccountPanel/SyncStatus/i18n和必要styles，App/AccountDialog仅主代理明确追加后修改；技术独占本文/04；QA独占测试与05/07。client/repository/storage/SQL只在实证需要并重新分配时改。package/env/状态/验收/正式记忆由主代理维护。

后端/QA定向更新qa_adapters与qa_errors：原样密码、注册session/无session/混淆user、弱密码、明确重复、401凭据/403权限/429/503分流。qa_engine增补guest错误可编辑、expired A失败保A、成功B隔离和同UID刷新。浏览器验证登录/注册/三语/粘贴/键盘、零请求校验、并发锁、密码清理与持久层无密码；回归原加载屏障、迁移备份、离线刷新、PKCE root/Pages、视图/focus与E09。跑typecheck/build；独立QA将r2新结果与r1证据分开，不改原07历史事实来制造通过。

真实联调在当场确认开关后执行注册→退出→登录→刷新→A/B RPC与跨设备；只记录脱敏邮箱/UID/状态，不记录密码/token。GitHub未配置的真实链路单列待验证。云开关确认不是整版验收。回退停账户入口/恢复未配置访客候选，保留UID缓存/队列/表/备份；不开OTP，不删除账号。恢复Confirm email另有授权与读回，可能影响未确认账号；前端回退不能撤销服务器身份链接。

## 核对证据

当前源码：`src/lib/cloud/auth.ts` AccountAuth/identityFromSession；`src/lib/cloud/errors.ts` normalizeError；`src/lib/sync/types.ts` AuthPhase/AccountProgressController；`src/lib/sync/controller.ts` report/authCall/switchIdentity；`src/components/AccountPanel.tsx` r1 OTP表单。SDK本机：`node_modules/@supabase/auth-js/package.json` 2.117.3，`src/GoTrueClient.ts` signUp/signInWithPassword，`src/lib/error-codes.ts`。完整契约见04；后台策略、真实认证、r2验收及发布仍未完成。
