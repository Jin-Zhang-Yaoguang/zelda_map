# qa_engineer 项目记忆

ID：BOTW-qa_engineer-R2。状态：confirmed（工程事实或用户要求），适用：zelda_map v0.1.0 r2，最近核对：2026-10-11。

独立源核对不能以作者verified标志代替；r1与r2证据分目录保留，旧聚合断言不能用于新要求。测试时序/定位器修正与实际callback缺陷分开记录。来源07_r1/07/evidence。

本人尚未再次验收；工程验证不等于游戏逐座实机通关或公开上线。

## v0.2.0 当前阶段补充（2026-10-11）

ID：BOTW-qa_engineer-V020。状态：confirmed为范围/已核实工程事实，尚非本人验收/真实云整体验证。此前r2未验收表述为历史，v0.1.0 r3本人通过与Pages发布见版本索引。

SQL RPC权限、SECURITY DEFINER内部UID过滤与RLS行策略分证；保留E09/A03修前失败，官方SDK跨源替身需API版本头与CORS Expose-Headers，否则读legacy字段。27错误矩阵与浏览器三分支修后pass；实云双登录/跨设备仍未覆盖，U06独立失败待复测。出处v0.2.0/05、06及error-normalization-report.md。

真实项目DDL和匿名RPC拒绝已核实；OAuth/SMTP、真实JWT与跨设备、本版验收仍待完成。

U06后续结果：最终显式发起控件修复的独立浏览器两组及六旁路通过，候选输入无漂移；上文“待修复/复测”为此前阶段。依据v0.2.0/06、07、evidence/browser-focus-final.json；真实云仍待配置与验证。

## r2 邮箱密码修订（2026-10-11）

r2独立Auth7/browser19通过，另编辑清Auth提示2组通过只重建root；原Pages/guest包明确补丁前。共享PGlite数据污染和signin user-only非法SDK协议不是业务修复；合法signup无session才确认合同，非法signin仍guest/零RPC保护。原SQL/引擎未变引用不冒重跑。r2/evidence及07保留完整未测项。

后台真实password/GitHub、JWT A/B和跨设备、本版本人验收尚未完成。用户没有同意关闭Confirm email，不以开发授权或等待时间代答。

- BOTW-r3-EMAILONLY，confirmed为2026-10-11最新本人范围：仅邮箱注册/密码登录+访客，取消GitHub/OAuth接入；旧角色r1/r2 GitHub/SMTP待条件已被替代。Confirm OFF与最低8已核验，有限实云10组保留原范围。当前六源码删除、测试及巡检见版本04/07/09和email_only_report；该记录不宣称本角色参与新的设计或代签本人验收，未发布。

- BOTW-r4-MAP，2026-10-11，本人当前范围：所有zoom神庙开关（DLC上方）、36px/44命中，原生24k×20k分级PNG和滚轮响应修复，旧far-only-shrine规则被替代。原Auth/云/数据不变；实际实现、源hash、验证与未覆盖见04/06/07/09及map_fix_report。专业记录不代签本人复验，不宣称本角色额外参与实施。

- BOTW-v020-PUBLISHED，2026-10-11：本人r4通过并授权现有repo/Pages发布，产品0673e7c/run38145129220成功；独立8资源/4类页面验证完成，最新生产v0.2.0。首native超时保留，定向加载通过但未定位全部时序原因；不扩为新真人Auth/GPU/云写证据。正式状态以00/10/online_test_report为准，本角色记忆不新增或代签授权。
