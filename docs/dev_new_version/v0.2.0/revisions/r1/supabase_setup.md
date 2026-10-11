# Supabase 接入步骤

v0.2.0实现已准备；本文不是实云验收记录。前端使用官方SDK 2.117.3，代码和测试均不包含管理密钥。

1. 使用本项目专属的Supabase项目。只把Project URL和`sb_publishable_*`放入`VITE_SUPABASE_URL`、`VITE_SUPABASE_PUBLISHABLE_KEY`；service_role、sb_secret、数据库密码、SMTP密码和GitHub client secret不得放入VITE或仓库。未配置时正常访客模式，部分/非法配置明确报错。
2. 审核并执行[supabase/migrations/202610110001_account_progress.sql](../../../supabase/migrations/202610110001_account_progress.sql)。SQL Editor手工执行时用事务包裹整份迁移。`private`不加入Exposed schemas；公开API仅两个public RPC，不给予authenticated或anon直接表读写权限。
3. Email开启邮箱登录，邮件模板使用`{{ .Token }}`发送验证码。首次注册通过`shouldCreateUser:true`；请求成功只是发送请求成功。普通邮箱正式验证需自定义SMTP，默认服务限制以项目实际配置为准，不保证邮件已投递。[官方邮箱验证码说明](https://supabase.com/docs/guides/auth/auth-email-passwordless)。
4. GitHub创建对应OAuth App：其callback填`https://<project-ref>.supabase.co/auth/v1/callback`；client ID/secret只填Supabase后台。Supabase的Site URL及redirect allow list填应用根地址，本机`http://127.0.0.1:5173/`、`http://localhost:5173/`，Pages候选`https://jin-zhang-yaoguang.github.io/zelda_map/`。两层callback不能互换；当前未授权部署新版本。
5. SDK采用PKCE、`detectSessionInUrl:false`，启动手动兑换根URL的`?code=`一次，清除认证参数后恢复受控hash。缺verifier、过期、跨浏览器或OAuth错误需重新登录，不补造会话。[官方PKCE说明](https://supabase.com/docs/guides/auth/sessions/pkce-flow)。

接入后必须实际验证：anon拒绝、真实A/B身份隔离、两种登录、邮件错误与限流、会话过期、Pages子路径返回、两设备同座冲突、不同座并发、取消完成、响应丢失重试、访客迁移及备份恢复。PGlite与受控适配器测试只证明相应本机逻辑，不含GoTrue/PostgREST、真实用户、邮件或GitHub授权。

回退保留private表、receipts和备份，不删云数据；先停sender或撤销RPC执行权限。旧v0.1.0继续读取原访客v1键，账号进度不会自动写成访客数据。

## 本轮真实接入状态（2026-10-11）

项目zelda-map，ref `tvbpcfsjcwoelfkfjxaw`，Free / Seoul；URL `https://tvbpcfsjcwoelfkfjxaw.supabase.co`。已通过Edge SQL Editor执行当前迁移，界面显示Success. No rows returned；独立API请求确认匿名无EXECUTE权限（HTTP401/42501）。表/函数元数据GUI读回及真实用户JWT读写隔离仍待补。

本机URL/publishable已接入，数据库密码仅非VITE本机私有变量，.env.local为600且被Git忽略。Pages仓库URL与publishable两个构建变量已设置并API读回匹配；未发布v0.2.0。

实际Auth settings回读email=true/github=false；GitHub provider尚未接OAuth App。对应GitHub回调地址为 `https://tvbpcfsjcwoelfkfjxaw.supabase.co/auth/v1/callback`。Supabase应用重定向地址另配本机根与Pages根，不能把GitHub回调当网页地址。

邮箱模板与SMTP尚待配置；默认邮件服务只发送到团队邮箱，不能作为公开用户验证码交付。两种登录、跨设备、真实会话/同步/迁移均未报告通过。电脑UI因锁屏暂停，需用户手动解锁；独立本机检查继续。

最终匿名基础检查已补两个RPC：get与空操作apply均HTTP401/42501拒绝，无用户session/无进度修改。仍待实际metadata与认证账户补证。
