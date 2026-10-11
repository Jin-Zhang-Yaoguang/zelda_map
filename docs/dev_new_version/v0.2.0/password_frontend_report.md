# v0.2.0 r2 邮箱密码前端交接

角色：frontend_engineer；日期：2026-10-11（Asia/Taipei）。分支 `dev/v0.2.0`，主代理指定基线 `2686aa1`。本次仅修改 `AccountPanel.tsx`、`SyncStatus.tsx`、`i18n.ts`、`styles.css` 及本文；保留已有 WIP。依据 01 r2 真人需求、02 §3.2、03 §11、04 r2、05 r2、四份 password 交接、前端角色记忆及 r1 frontend_report 的 U06 契约。

## 实现范围

- OTP 表单替换为默认「登录」与显式「注册」两模式；注册多确认密码。GitHub、继续访客及既有账户操作保留，三语不再出现验证码、重发或邮件找回入口。
- 邮箱提交 trim，输入 `type=email`、`name=username`、`autocomplete=username`（遵主代理明确要求）。密码原字符提交；登录只要求非空，注册本机暂用 8 字符建议并要求确认匹配。登录 `current-password`，注册两字段 `new-password`。所有字段有 label、无效字段聚焦及错误关联；Enter 只提交当前表单。
- `busyRef` 同步防重入；提交中禁用字段、模式、提交、GitHub与访客操作，不自动重试。成功、切模式、UID/失效切换与卸载清两项密码及旧错误；失败仅保当前组件内存供修改。请求 epoch 与 mounted 检查阻止迟到任务重设表单错误。无密码持久化或日志代码。
- 按安全 code 映射凭据错误、weakPassword、明确 accountExists、429、网络未完成、明确邮箱未确认及未知未建会话。无 session 不显示注册成功、不猜测邮箱确认原因、不出现邮件已发送。身份和保存状态继续读 controller snapshot；账户初读未完成仍为只读。
- guest 的「继续使用访客模式」清表单后回地图；expired 仍持有 UID 时先经既有 signOut 成功才回访客，失败保持原身份并提示退出未完成。
- 迁移仍在异步发起前捕获 `event.currentTarget`，恢复入口 `AccountBackups` 保留原实现。未修改 App、AccountDialog、ImportDialog、返回焦点 helper 或取消任务规则；未改 cloud/sync/backend/SQL/package/env/独立 QA 测试。

## 实际自查

`npm run typecheck` 与 `npm run build` 均通过，Vite 98 模块；主 JS 约 695kB / gzip 203kB，沿用大文件提示，未借此改构建或拆包。

隔离自查脚本：`/private/tmp/zelda_password_frontend_smoke.mjs`。使用当前真实 `AccountPanel`、i18n、样式和 Chromium 1228；公开 controller 接口为明确替身，未加载 Supabase 或应用持久层。临时 Vite `5194`、`configFile:false`、`envFile:false`，最终缓存独立在 `/private/tmp/zelda-password-vite-cache`。进程及隔离 context 在 finally 关闭，不停止 5173，不接触用户 Edge 进度。

结果：`/private/tmp/zelda-password-frontend-results.json`，10 组通过，`pageerrors=[]`：

1. 默认登录、字段语义、Enter 一次提交、登录仅非空及原字符密码。
2. 切模式清两密码/旧错误；注册长度/不匹配零请求；首个无效字段聚焦。
3. 请求期间禁全部认证控件，连续 `requestSubmit` 不重复。
4. weakPassword/accountExists/rateLimited/networkFailure/sessionNotEstablished/emailConfirmationRequired 六类提示；凭据失败另在登录检查；失败可继续修改密码。
5. 卸载重进清密码；local/session storage 不含合成密码。
6. 失效和 UID 切换清密码/旧错误。
7. 替身有效身份后仍显示初读；回 guest 不恢复密码。
8. 实际卸载后的迟到失败不恢复旧错误。
9. 390/360px × 中英日三语无横向溢出，所有认证按钮至少44px；确认密码label关联和正常页面滚动。
10. 实际 Tab 顺序，以及 guest/expired 的继续访客清理。

六张无密码截图在 `/private/tmp/zelda-password-form-{360,390}-{zh,en,ja}.png`。已查看 360px 日语实图，长说明和纵排按钮完整。

自查曾发现组件重新挂载可能显示旧 snapshot 错误：原 ref 在 effect 内改值但不触发重新渲染；现用局部 ignoredError state，并以当前错误初始化，修后通过。临时 harness 首轮 JSX/React 装载错误和一轮未等待 React 实际卸载的脚本时序已修；这些不是产品运行故障。初轮临时 Vite 使用默认 `.vite` 缓存，后改独立临时缓存；未改配置或5173进程。

## 边界与 QA 交接

以上为真实浏览器＋组件的受控自查，不能替代独立 QA、真实 Supabase Auth、完整应用存储扫描或本人验收。注册8字符仍为产品建议，后台实际最低长度/字符规则由主代理待读回；更严格时需对齐本文、表单和 QA 输入后重新冻结。仅验证 autocomplete 属性及普通键盘输入，没有声称真实密码管理器或系统剪贴板服务通过。

Confirm email 尚未关闭，GitHub 尚未接入；未操作后台、未注册真用户、未发送邮件、未生成真实 JWT、未验证跨设备或发布。未知无 session 和明确邮箱确认失败均实现安全文案；真实配置读回及本人当场开关授权由主代理完成。

独立 QA 应使用自己的端口/context验证 SDK、全持久层、A/B身份与原U06旁路，不复用这份组件替身为真实云证据。报告及截图不含真实密码、token、用户进度。实现现按下表冻结；如实际策略或 QA 缺陷需要修改，由主代理重新分配后复测受影响项。

## 当前冻结 SHA256

| 文件 | SHA256 |
| --- | --- |
| src/components/AccountPanel.tsx | 20eb312d2bdfc6c7e192e095f7cd655fb725c2c6b34fcfe854b1e7211d44331a |
| src/components/SyncStatus.tsx | 61f8e995fab5472a9dee6ede701202898084b888c86192472f4768f7a8d78480 |
| src/i18n.ts | 9ba98bc0f617a60016a10bbadfa60c1fff78ad09966f9faf81e3c89fec0f238c |
| src/styles.css | f5e5142ad12291f3701de310f375ba23403a37ed1caecbcaead9a2a2da5e7dc3 |

## 专业记忆候选

候选：邮箱密码失败可保当前组件内存，切模式/成功/卸载/UID或失效切换清敏感字段及旧错误；忽略旧错误应绑定局部可渲染状态，单改 ref 无法保证重新挂载首次错误消失。来源为本次实现与隔离自查，仅适用于 r2 当前前端，不代表真实 Auth/云同步验证。由主代理核对后合入正式记忆，保留 r1 历史。

## Watchdog P3 定向修订：编辑清旧认证提示

主代理转交独立 watchdog 的 03 §11 对齐项后，仅局部调整 `AccountPanel` 三字段 onChange 与清理 helper。旧候选 AccountPanel SHA256 为 `73149c7473a198ab1e2539b875d0af66b1d070d6dee4ed726cccf2a880692c2e`，现冻结为上表 `20eb312d…`；其余三文件无变化。

编辑任一输入可清旧全局认证提示与 aria-invalid；字段校验只清对应字段错误，密码不匹配同时关联密码/确认字段。旧 snapshot 只在 `operation=auth` 且属于表单错误时忽略，不修改 snapshot、expired、UID、云同步或 storage 状态。下一次请求仍产生正常错误；密码原字符、8字符策略、持久化边界、焦点与其他逻辑未变。

`npm run typecheck` 与 `npm run build` 通过（98模块，主JS约696kB，沿用体积提示）。定向脚本 `/private/tmp/zelda_password_edit_error_smoke.mjs`、结果 `/private/tmp/zelda-password-edit-error-results.json`：隔离当前 AccountPanel/SyncStatus＋Chromium＋controller 替身，5组通过，pageerrors=[]。验证登录分别编辑邮箱/密码、注册确认字段、密码不匹配修正、新请求再次失败、身份条及保存状态继续显示真实失效、storage/sync快照错误不被编辑清除。脚本首轮以邮箱末尾空格触发编辑，但浏览器 email 输入会清理空格、值未变；改为实际变更邮箱后通过，不改产品校验。临时服务/context仍finally关闭，未动5173或用户浏览器。

本增量为源码与表单定向验证，真实 Auth/配置读回及独立 QA/本人验收结论仍由对应角色补齐。
