# v0.2.0 r3 邮箱唯一登录实现交接

日期：2026-10-11（Asia/Taipei）；角色：frontend_engineer。分支 `dev/v0.2.0`。依据主代理转交真人原话「如果需要这么麻烦就撤回github登录的配置，只支持邮箱就可以。」按 dev-new-version 实施最小删除；已读 AGENTS、前端角色指南和角色记忆。r2 文档与证据由主代理归档到 `revisions/r2`，本次不改历史事实、编号设计文档或正式记忆。

## 实际修改

| 文件 | r3 变更 | 相对本次 r2 输入的行差异 |
| --- | --- | --- |
| src/components/AccountPanel.tsx | 删除 GitHub 按钮和 onGithub prop；保留邮箱登录/注册、访客、编辑清旧认证错误及密码边界 | -2 / +2 |
| src/App.tsx | 删除 OAuth view/schema/TTL/读写、跳转调用和恢复；completionFilter 改独立联合类型，初始筛选/选中/面板按普通入口初始化；删除 GitHub prop 接线 | -20 / +4 |
| src/lib/cloud/auth.ts | 删除 signInGithub、OAuth 互斥、专属 code 兑换、return-hash 与应用根回调 helper；start 保留监听及 getSession 恢复 | -30 / +1 |
| src/lib/sync/types.ts | 控制器接口删除 signInGithub，保留 signOut | -1 / +1 |
| src/lib/sync/controller.ts | 仅删除 signInGithub 的一行调用 | -1 / +0 |
| src/i18n.ts | 删除中英日 githubLogin / githubRedirecting 共六条无用文案 | -6 / +0 |

MapCanvas 的 `onView` 当前是必需 prop，App 传空回调以保留现有组件 API；不记录 OAuth 状态、不传 OAuth initialView，未改 MapCanvas。地图仍保持挂载，普通路线切换、筛选、神庙详情与返回焦点沿用原逻辑。

代码核对：controller 除 GitHub 一行外与本次 r2 输入逐字一致；auth 两个邮箱方法逐字一致；App UID/焦点周期、账号加载屏障、完成操作，以及 rememberOrigin 到迁移/导入/恢复逻辑逐字一致。未改 CAS、队列、SQL、存储、session 隔离、密码字符或8字符策略。`src/lib/cloud/client.ts` SHA256 仍为 `73bd1004ffe1da25036a8052df4113effad9a9dfaaf5ad3af4ac7c119584462e`，PKCE/persistSession/autoRefreshToken/detectSessionInUrl 设置不变。

`src` 中专属 signInGithub/githubLogin/githubRedirecting/signInWithOAuth/exchangeCodeForSession/oauth-view/return-hash/OAuthViewContext/oauthFailed 已无引用。SDK 通用能力未重构；会话身份仍以真实 UID/session 为准，不按邮箱或 provider 人为合并、删除或变更既有账号。

## 实际验证

- `npm run typecheck` 通过。
- `npm run build` 通过：98模块，主JS约692kB / gzip202kB；沿用体积提示，不扩展拆包或依赖变更。
- `/private/tmp/zelda_email_only_smoke.mjs` 定向自查，结果 `/private/tmp/zelda-email-only-results.json`，SHA256 `79ccba9622b76f60cfbc1206f46c46a5586a756a22ce85fa1218b5ce8744cefd`。隔离 Chromium＋当前真实 App/Supabase SDK，临时 Auth 响应明确为替身。5组通过、pageerrors=[]：只显示邮箱登录/注册/访客；旧 code/OAuth视图不触发兑换或恢复；密码凭据失败不切身份、编辑清旧错误；注册确认/8字符校验和模式清理；390/360三语无GitHub入口或横向溢出；访客标记、返回地图和刷新保留进度。

自查只使用临时 `5194`、`configFile:false` / `envFile:false`、合成公开配置、自有浏览器context、临时 `.vite` 缓存；Auth唯一一条请求为替身凭据失败，不连接真实 Supabase、不读用户 Edge 或真实进度。finally 关闭服务/context，未动5173；未注册/删除用户或OAuth App、未改后台、未push。

最初 typecheck 发现删掉 App onView 后不满足 MapCanvas 必需prop，已改空回调，未改组件接口。没有额外扩大或重复自查；独立 QA 负责 r3 正式受测输入与浏览器结果。

## 云配置证据与边界

主代理只读公共设置证据 `evidence/r3/auth-public-settings.json`（2026-10-11T11:23:40Z）：email_enabled=true、github_enabled=false、mailer_autoconfirm=true、disable_signup=false。本角色已核对该证据，未操作或重复修改后台；不能把该公共读回当作本角色真实注册/登录或云同步验证。

本报告为必要代码删除与定向自查交接。真实认证、A/B权限、跨设备及整版验收结论由主代理与独立QA按各自证据补齐。用户只撤回社交登录，本次保留访客模式及既有账户数据，不自动删除旧临时storage key或账户。

## 当前冻结 SHA256

| 文件 | SHA256 |
| --- | --- |
| src/App.tsx | ca244580681203cdc8ecc689f04b41281099ef5cafff3d1bab0a3145eedf1042 |
| src/components/AccountPanel.tsx | 2ede9dd9fe625524c4ddcec5e107c90621020d2c5ed8d96d26f088d41621461b |
| src/lib/cloud/auth.ts | f6d32427e79bd3c6dfed9274b5443ab93f244d0f59f5e3c3748cf4e9ffaf6cbd |
| src/lib/sync/types.ts | 7964b2aa488d243b6b5328cc959823867268b87892fd013b46a3aa03c18f7df3 |
| src/lib/sync/controller.ts | c73e76d6077a2661dca154c98e49e75222f3fd78484d717d8f324540c0bbe268 |
| src/i18n.ts | adc2e7757bd103568bbfe553b236c34ea1610c15a47e2b68dcd86d247193853c |

本次 r2 输入副本/哈希在 `/private/tmp/zelda-email-only-r2-baseline/`，只含六源码和临时diff，不含凭据。正式历史沿用主代理归档。六源码现冻结，交独立QA与watchdog；若修复再分配，不用旧r2通过替代r3通过。
