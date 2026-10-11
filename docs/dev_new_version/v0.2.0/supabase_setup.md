# Supabase 接入说明（v0.2.0 r3）

当前只支持邮箱注册、密码登录及访客模式。用户取消 GitHub，原 OAuth 接入清单已撤销；r1/r2 历史方案与测试保留，不要求继续配置。

1. 前端只配置项目 URL 和 publishable key：`VITE_SUPABASE_URL`、`VITE_SUPABASE_PUBLISHABLE_KEY`。未配置仍可用访客。数据库密码、service_role、sb_secret 等管理凭据不能进 VITE 或仓库。
2. 执行 `supabase/migrations/202610110001_account_progress.sql`。当前项目已完成，不重复执行。private 不加入 exposed schemas；普通身份不能直接读写表，只通过有身份检查的两个 public RPC。
3. Email 开启、允许注册、Confirm email 关闭、最低密码 8 字符。关闭确认已获本人当场许可并保存；后台密码长度已重新打开读回，真实 7 字符注册被拒。无需 SMTP、验证码或确认邮件。GitHub provider 保持关闭，无须创建 OAuth App。
4. 本机已接公开连接配置；Pages 仓库 Variables 已设置并读回匹配，生产 v0.2.0 尚未部署。Site URL 和原精确本机/Pages 白名单保留为通用应用配置，不用于发起 OAuth。

注册调用 `signUp({email,password})`，登录调用 `signInWithPassword({email,password})`；只有有效 session 中的 UID/access_token 才建立身份，云初读完成前不能写入。刷新使用官方 SDK 恢复会话，不交换 OAuth code。SDK 持久会话设置保持；密码不进进度、队列、备份、环境变量或日志。[官方密码认证](https://supabase.com/docs/guides/auth/passwords)。

邮箱只作登录标识，不验证归属。没有邮件找回密码；本版未提供修改密码、账户删除或身份绑定。邮箱去除首尾空白，密码原样提交；注册至少 8 字符且两次一致，登录只要求非空。网页用户密码与本机数据库密码不同。

真实项目：zelda-map，ref `tvbpcfsjcwoelfkfjxaw`，Free / Seoul。最近公开设置见 `evidence/r3/auth-public-settings.json`：email=true、github=false、mailer_autoconfirm=true、disable_signup=false。RLS/表权限/RPC元数据与匿名拒绝已验证；两个合成 QA 账号的密码身份、真实 JWT/RPC 隔离、完成取消、重放/CAS、合成迁移见 r2 实云 API 结果。该验证不等于当前 r3 浏览器或实体跨设备验收。

原访客数据保持本地，登录不自动上传。迁移必须预览合并/替换，由用户确认，先持久备份再提交全部 136 项；127.0.0.1 和 Pages 间旧访客仍需 JSON 导出导入。回退保留 UID 缓存、队列、表、收据和备份，不删除数据。
