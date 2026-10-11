# Supabase 接入步骤

v0.2.0 r2邮箱密码实现已准备；本文不是实云验收记录。前端使用官方SDK 2.117.3，代码和测试均不包含管理密钥。r1 OTP方案与历史证据保存在 `revisions/r1/`，当前不再发送验证码。

1. 使用本项目专属的Supabase项目。只把Project URL和`sb_publishable_*`放入`VITE_SUPABASE_URL`、`VITE_SUPABASE_PUBLISHABLE_KEY`；service_role、sb_secret、数据库密码、SMTP密码和GitHub client secret不得放入VITE或仓库。未配置时正常访客模式，部分/非法配置明确报错。
2. 审核并执行[supabase/migrations/202610110001_account_progress.sql](../../../supabase/migrations/202610110001_account_progress.sql)。SQL Editor手工执行时用事务包裹整份迁移。`private`不加入Exposed schemas；公开API仅两个public RPC，不给予authenticated或anon直接表读写权限。
3. Email开启邮箱密码登录并核实允许注册、实际最低长度与字符策略。用户要求暂停邮箱服务：不配置SMTP/邮件模板，不提供验证码或邮件找回。直接注册使用需关闭Confirm email；由主代理准备可审查候选后，按浏览器操作规则取得本人当场确认，保存并读回。本文不授权关闭保护，不为表单降低密码策略。注册调用`signUp({email,password})`，登录调用`signInWithPassword({email,password})`，只认返回session的非空UID和access_token；仅user或无有效session均不宣称创建/登录成功。[官方密码认证](https://supabase.com/docs/guides/auth/passwords)。
4. GitHub创建对应OAuth App：其callback填`https://<project-ref>.supabase.co/auth/v1/callback`；client ID/secret只填Supabase后台。Supabase的Site URL及redirect allow list填应用根地址，本机`http://127.0.0.1:5173/`、`http://localhost:5173/`，Pages候选`https://jin-zhang-yaoguang.github.io/zelda_map/`。两层callback不能互换；当前未授权部署新版本。
5. SDK采用PKCE、`detectSessionInUrl:false`，启动手动兑换根URL的`?code=`一次，清除认证参数后恢复受控hash。缺verifier、过期、跨浏览器或OAuth错误需重新登录，不补造会话。[官方PKCE说明](https://supabase.com/docs/guides/auth/sessions/pkce-flow)。

接入后必须实际验证：确认开关与密码规则读回、注册→退出→密码登录→刷新恢复、无会话/凭据/强度/明确重复/限流错误，anon拒绝、真实A/B身份隔离、GitHub、会话过期、Pages子路径返回、两设备同座冲突、不同座并发、取消完成、响应丢失重试、访客迁移及备份恢复。PGlite与受控适配器测试只证明相应本机逻辑，不含GoTrue/PostgREST、真实用户或GitHub授权。

邮箱trim、密码原样提交。注册当前本机建议最低8字符，登录只要求非空；实际后台策略仍待主代理读回，并在候选冻结前统一前端提示与wrapper。密码只在当前表单和认证参数中，不进snapshot、UID缓存、队列、备份、导出、视图context、环境变量、持久存储或日志。不根据同邮箱合并进度，不替OAuth-only用户设密码，不增加updateUser/alias/密码表。邮箱只是登录标识，不证明归属；当前没有邮件找回途径。

回退保留private表、receipts和备份，不删云数据；先停sender或撤销RPC执行权限。旧v0.1.0继续读取原访客v1键，账号进度不会自动写成访客数据。

## r1真实接入历史（2026-10-11；不代表r2认证通过）

项目zelda-map，ref `tvbpcfsjcwoelfkfjxaw`，Free / Seoul；URL `https://tvbpcfsjcwoelfkfjxaw.supabase.co`。已通过Edge SQL Editor执行当前迁移，界面显示Success. No rows returned；独立API请求确认匿名无EXECUTE权限（HTTP401/42501）。表/函数元数据GUI读回及真实用户JWT读写隔离仍待补。

本机URL/publishable已接入，数据库密码仅非VITE本机私有变量，.env.local为600且被Git忽略。Pages仓库URL与publishable两个构建变量已设置并API读回匹配；未发布v0.2.0。

实际Auth settings回读email=true/github=false；GitHub provider尚未接OAuth App。对应GitHub回调地址为 `https://tvbpcfsjcwoelfkfjxaw.supabase.co/auth/v1/callback`。Supabase应用重定向地址另配本机根与Pages根，不能把GitHub回调当网页地址。

邮箱模板与SMTP尚待配置；默认邮件服务只发送到团队邮箱，不能作为公开用户验证码交付。两种登录、跨设备、真实会话/同步/迁移均未报告通过。电脑UI因锁屏暂停，需用户手动解锁；独立本机检查继续。

最终匿名基础检查已补两个RPC：get与空操作apply均HTTP401/42501拒绝，无用户session/无进度修改。仍待实际metadata与认证账户补证。

## r2准备状态（2026-10-11）

后端已替换OTP接口，注册/登录无有效session统一`sessionNotEstablished`；只有明确`email_not_confirmed`提示确认尚未完成。当前Confirm email仍开启的状态来自主代理交接，本角色未操作后台或读取`.env.local`；实际开关和密码策略的最新读回由主代理补证。GitHub仍待接入，真实Auth/A/B/JWT/跨设备测试均未由本角色执行。后端定向自测见 `password_backend_report.md`；受控测试不能替代真实认证。

回退优先停账户入口或使用未配置访客候选，保留原UID缓存、队列和云数据，不自动恢复OTP。确认开关回退需另外授权并读回；重新开启可能影响未确认账号。v0.1.0生产、5173用户服务与真实浏览器进度均不因这份接入说明而修改。
