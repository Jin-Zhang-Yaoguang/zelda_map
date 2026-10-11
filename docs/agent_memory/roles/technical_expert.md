# technical_expert 项目记忆

ID：BOTW-technical_expert-R2。状态：confirmed（工程事实或用户要求），适用：zelda_map v0.1.0 r2，最近核对：2026-10-11。

底图3000×2500，u=(x+6000)/4、v=(z+5000)/4，Leaflet[-v,u]；统一阈值-1、近景定位-.5。TowerRecord独立于ShrineRecord，进度仅Dungeon IDs。来源04/src/lib/map.ts/07。

本人尚未再次验收；工程验证不等于游戏逐座实机通关或公开上线。

## v0.2.0 当前阶段补充（2026-10-11）

ID：BOTW-technical_expert-V020。状态：confirmed为范围/已核实工程事实，尚非本人验收/真实云整体验证。此前r2未验收表述为历史，v0.1.0 r3本人通过与Pages发布见版本索引。

Supabase SDK2.117.3、private表/RPC内部auth.uid、CAS false记录+UUID收据、project/UID/game的IDB事务队列/备份；PGlite角色claims模拟与真实JWT分开。PKCE根/Pages回调恢复受控视图。出处v0.2.0/04、09。

真实项目DDL和匿名RPC拒绝已核实；OAuth/SMTP、真实JWT与跨设备、本版验收仍待完成。

## r2 邮箱密码修订（2026-10-11）

r2统一signUpEmailPassword/signInEmailPassword：Auth返回Identity/Controller void。session须user.id+token；无session用sessionNotEstablished，只有明确email_not_confirmed才邮箱确认错误。保留单client PKCE和实际UID身份链接，不新增alias或OAuth-only设密码。401凭据错不使guest expired，sync过期仍停写保UID，依据04/password_tech_handoff。

后台真实password/GitHub、JWT A/B和跨设备、本版本人验收尚未完成。用户没有同意关闭Confirm email，不以开发授权或等待时间代答。

- BOTW-r3-EMAILONLY，confirmed为2026-10-11最新本人范围：仅邮箱注册/密码登录+访客，取消GitHub/OAuth接入；旧角色r1/r2 GitHub/SMTP待条件已被替代。Confirm OFF与最低8已核验，有限实云10组保留原范围。当前六源码删除、测试及巡检见版本04/07/09和email_only_report；该记录不宣称本角色参与新的设计或代签本人验收，未发布。

- BOTW-r4-MAP，2026-10-11，本人当前范围：所有zoom神庙开关（DLC上方）、36px/44命中，原生24k×20k分级PNG和滚轮响应修复，旧far-only-shrine规则被替代。原Auth/云/数据不变；实际实现、源hash、验证与未覆盖见04/06/07/09及map_fix_report。专业记录不代签本人复验，不宣称本角色额外参与实施。
