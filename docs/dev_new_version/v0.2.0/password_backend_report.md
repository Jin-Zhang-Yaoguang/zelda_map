# v0.2.0 r2 密码认证后端报告

日期：2026-10-11（Asia/Taipei）。角色：backend_engineer。项目根 `/Users/a1-6/Desktop/PycharmProjects/zelda_map`，分支 `dev/v0.2.0`，基线2686aa1。本报告记录后端定向实现/自测，不代替独立QA、真人验收或真实Auth验证。

## 实现范围

- `src/lib/cloud/auth.ts`：AccountAuth改为`signUpEmailPassword(email,password)`、`signInEmailPassword(email,password)`；分别只调用官方SDK的signUp/signInWithPassword。邮箱trim和基本格式校验；注册本机建议至少8，登录只非空；密码不trim。两者先检查error，只从具有非空session.user.id及access_token的session构造身份，user-only/空或无效session为`sessionNotEstablished`。移除当前OTP接口。
- `src/lib/cloud/errors.ts`：明确认证code优先于通用HTTP；凭据、未确认、弱密码、明确重复、校验错误使用安全类别。Auth裸401为authFailed；同步/迁移401、PGRST301及明确session/refresh错误才sessionExpired。429/5xx/网络/权限语义保留，不回显原错误或凭据。
- `src/lib/sync/types.ts`：Controller使用同名Promise<void>接口，移除otpSent，不新增credentials或snapshot字段。
- `src/lib/sync/controller.ts`：新接口复用authCall和switchIdentity；互斥和首次加载屏障不变。report仅在已有UID时进入expired；访客失败保持guest。密码认证响应绑定lifecycle/epoch，迟到结果不覆盖先到的其他UID或重挂载后的状态；同UIDAuth事件与Promise交错仍走原加载流程。旧请求失败不污染新身份。
- `supabase_setup.md`：当前接入步骤改为密码认证，旧接入事实明确标为r1历史；无SMTP、无找回、确认开关待真人确认和真实验证边界明确。

未改client、repository、storage、SQL、package、App/UI或QA自有测试。未读写`.env.local`，未操作后台确认开关、真实用户账户、5173服务或真实浏览器进度。原r1历史文件和证据未覆盖。

## 定向自测

以下均为本机受控测试；合成密码运行时在内存生成，不写入测试输出或持久数据。测试仅记录安全分类与结果。

| 命令 | 结果 | 覆盖 |
| --- | --- | --- |
| `node supabase/tests/r2-auth-adapter.test.mjs` | exit0 | 对应SDK参数、密码字符保留、注册最低8/登录只非空、校验零请求、有效session与user-only/坏session、明确错误code、成功session附弱密码警告、PKCE一次兑换/Pages根/参数清理、异步Auth事件、GitHub/local退出 |
| `node supabase/tests/r2-auth-errors.test.mjs` | exit0 | 明确code先于401/403、裸Auth401、session/refresh/PGRST301、sync/transfer401、42501、429、503、fetch/abort、未知错误与安全错误详情 |
| `node supabase/tests/r2-auth-controller.test.mjs` | exit0 | guest错误不expired/零云写、认证互斥、首次读取禁写、expired A凭据失败保A/原队列、成功B隔离、失败退出保身份、成功退出guest、迟到Promise/错误与重挂载、同UID事件先到、sync401停写、snapshot/缓存无密码 |
| `npm run typecheck` | exit0 | 四个接口文件与并行前端当前候选类型一致 |

controller存储使用fake-indexeddb，RPC与Auth是受控依赖；适配器使用受控SDK对象。没有执行真实GoTrue/PostgREST、真实注册/登录、两账号JWT/RLS或跨设备。未变SQL/核心同步路径不重复跑全量SQL与engine；独立QA按冻结差异补受影响回归。

## 待补与交接

1. 注册最低8是本机建议，实际密码策略由主代理读回；若后台更严格须冻结前统一wrapper/表单/提示/QA。不能降低后台保护。
2. Confirm email尚未由本角色关闭；无session不猜确认原因，仅明确email_not_confirmed使用确认提示。关闭需本人当场授权，之后实际注册→退出→登录→刷新及A/B/跨设备单列证据。
3. GitHub真实配置、同邮箱身份链接与Pages实OAuth仍待验证。进度只按实际UID归属；不承诺OAuth/email隔离或按邮箱合并。
4. 独立QA检查r2表单清理、无密码持久化、三语/键盘、E02/E07/E08、迁移备份、136单批、E09及U06；本报告不把受控自测当独立验收。

源码与自测文件SHA256由交接消息附给主代理；后续改动需重新固定哈希。
