# backend_engineer 项目记忆

ID：BOTW-backend_engineer-R2。状态：confirmed（工程事实或用户要求），适用：zelda_map v0.1.0 r2，最近核对：2026-10-11。

名称/物品/地名按游戏ID及StaticMsg/ActorType映射，不直接音译英文或按内部Middle推等级。基础物资和Wiki差异在017明确conflict；Tower15原值匹配游戏源。来源backend_report/07。

本人尚未再次验收；工程验证不等于游戏逐座实机通关或公开上线。

## v0.2.0 当前阶段补充（2026-10-11）

ID：BOTW-backend_engineer-V020。状态：confirmed为范围/已核实工程事实，尚非本人验收/真实云整体验证。此前r2未验收表述为历史，v0.1.0 r3本人通过与Pages发布见版本索引。

读取云成功的loaded缓存才可离线编辑，初读失败只读；每RPC前session UID核对并绑定当次Bearer。E09远端二次变化拒旧选择不新发写；A03Auth错误语义先于通用401/403，同步权限分类保持。出处v0.2.0/backend_report、06、evidence/error-normalization-report.md。

真实项目DDL和匿名RPC拒绝已核实；OAuth/SMTP、真实JWT与跨设备、本版验收仍待完成。

## r2 邮箱密码修订（2026-10-11）

r2密码不持久化、不trim，按实际session而非user建立身份，Code优先错误分类；Auth Promise补lifecycle/epoch和SDK同UID事件交错保护，迟到结果不切回其他UID。controller/cache/storage/RPC主链复用，未知响应不归邮箱确认。后端3自测和独立Auth7组为受控，不是真Auth，依据password_backend_report/07。

后台真实password/GitHub、JWT A/B和跨设备、本版本人验收尚未完成。用户没有同意关闭Confirm email，不以开发授权或等待时间代答。

- BOTW-r3-EMAILONLY，confirmed为2026-10-11最新本人范围：仅邮箱注册/密码登录+访客，取消GitHub/OAuth接入；旧角色r1/r2 GitHub/SMTP待条件已被替代。Confirm OFF与最低8已核验，有限实云10组保留原范围。当前六源码删除、测试及巡检见版本04/07/09和email_only_report；该记录不宣称本角色参与新的设计或代签本人验收，未发布。

- BOTW-r4-MAP，2026-10-11，本人当前范围：所有zoom神庙开关（DLC上方）、36px/44命中，原生24k×20k分级PNG和滚轮响应修复，旧far-only-shrine规则被替代。原Auth/云/数据不变；实际实现、源hash、验证与未覆盖见04/06/07/09及map_fix_report。专业记录不代签本人复验，不宣称本角色额外参与实施。

- BOTW-v020-PUBLISHED，2026-10-11：本人r4通过并授权现有repo/Pages发布，产品0673e7c/run38145129220成功；独立8资源/4类页面验证完成，最新生产v0.2.0。首native超时保留，定向加载通过但未定位全部时序原因；不扩为新真人Auth/GPU/云写证据。正式状态以00/10/online_test_report为准，本角色记忆不新增或代签授权。
