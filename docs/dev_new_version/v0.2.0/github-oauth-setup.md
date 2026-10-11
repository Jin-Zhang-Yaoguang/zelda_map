# GitHub 登录配置已撤销

2026-10-11，用户要求：「如果需要这么麻烦就撤回github登录的配置，只支持邮箱就可以。」

此任务已取消，无需注册 OAuth App、生成 Client secret 或开启 provider。最新公开 Auth 设置确认 GitHub provider 关闭，见 `evidence/r3/auth-public-settings.json`。主代理此前只填注册表单，未提交注册或生成密钥；没有擅自删除用户可能另行创建的资源。

当前以 [邮箱密码说明](supabase_setup.md) 为准。原 r2 清单留在 `revisions/r2/github-oauth-setup.md`，不是待办。
