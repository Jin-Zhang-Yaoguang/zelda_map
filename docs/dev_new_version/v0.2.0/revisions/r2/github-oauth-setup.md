# GitHub OAuth 接入清单（v0.2.0 r2）

当前GitHub provider关闭，未创建或读取client secret。此清单是具体配置准备，不是已接入/验收结论。

## GitHub表单

打开[OAuth Apps设置](https://github.com/settings/developers)，先检查是否已有用于本地图且回调一致的应用；没有再[注册OAuth App](https://github.com/settings/applications/new)。

| 字段 | 本项目值 |
| --- | --- |
| Application name | Hyrule Shrine Map |
| Homepage URL | https://jin-zhang-yaoguang.github.io/zelda_map/ |
| Application description | 个人海拉鲁神庙地图，使用账号保存神庙完成进度。 |
| Authorization callback URL | https://tvbpcfsjcwoelfkfjxaw.supabase.co/auth/v1/callback |

注册及生成client secret属于创建认证凭据，由本人操作；如果触发GitHub登录、验证码或2FA，也由本人完成。不要把secret发到聊天或前端env。

## Supabase表单

打开[当前项目Providers](https://supabase.com/dashboard/project/tvbpcfsjcwoelfkfjxaw/auth/providers)，选择GitHub，由本人把对应Client ID和Client Secret填到服务端provider并保存。主代理只核对启用状态、回调与真实登录结果，不读取管理密钥或公开secret。

上表GitHub callback是Supabase接收GitHub响应的地址。网站登录返回地址另由Supabase URL Configuration控制：本机127.0.0.1:5173、localhost:5173以及Pages的/zelda_map/精确根地址，不能互换。

当前代码只需要身份登录，不要求仓库读写、组织管理或其他额外权限。实际GitHub授权页出现不同的权限/条款时，由本人查看确认；不能以配置准备代替授权。

## 同邮箱与密码模式

以Supabase返回的实际user.id作为进度归属，同邮箱的不同provider可能按平台身份规则关联。已有GitHub-only账号不自动拥有密码；本版不新增设置密码/updateUser或邮件找回。邮箱密码直接注册需后台取消邮箱确认，不能假称邮箱归属已验证。

## 还需真实验证

实际GitHub登录/取消、PKCE根与子路径返回、UID初读屏障、A/B权限、同账号独立客户端完成/取消、迁移/CAS/断网队列和退出。受控浏览器通过不能替代这些验证，当前不发布r2。
