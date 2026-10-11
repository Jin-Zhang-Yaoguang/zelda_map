# frontend_engineer 项目记忆

ID：BOTW-frontend_engineer-R2。状态：confirmed（工程事实或用户要求），适用：zelda_map v0.1.0 r2，最近核对：2026-10-11。

地图实例保留挂载恢复视角；小数zoomSnap、无动画全图拟合避免快速定位被未结束动画吞掉。高塔点击先onTowerLocate清App旧选再focus。来源MapCanvas/frontend_report/r2真实回归。

本人尚未再次验收；工程验证不等于游戏逐座实机通关或公开上线。

## v0.2.0 当前阶段补充（2026-10-11）

ID：BOTW-frontend_engineer-V020。状态：confirmed为范围/已核实工程事实，尚非本人验收/真实云整体验证。此前r2未验收表述为历史，v0.1.0 r3本人通过与Pages发布见版本索引。

账号Set不能写guest v1，身份变化清旧撤销/预览；保存提示按真实snapshot，不把setComplete Promise当云确认。OAuth整页跳转存有限校验UI上下文，隐藏地图相机不可污染保存视图。A03网络提示已定向通过，U06回焦点必要修复中。出处v0.2.0/frontend_report、06。

真实项目DDL和匿名RPC拒绝已核实；OAuth/SMTP、真实JWT与跨设备、本版验收仍待完成。

U06后续结果：最终显式发起控件修复的独立浏览器两组及六旁路通过，候选输入无漂移；上文“待修复/复测”为此前阶段。依据v0.2.0/06、07、evidence/browser-focus-final.json；真实云仍待配置与验证。

## r2 邮箱密码修订（2026-10-11）

r2替OTP为密码表单，App/focus不改，保留U06触发点。密码仅组件与调用内存，失败可修改，模式/身份/卸载清理；只忽略对应旧Auth表单error，snapshot/status/存储/云error不变。最后AccountPanel20eb312d...独立定向通过，其他3前端文件不变，依据password_frontend_report/07/evidence/r2。

后台真实password/GitHub、JWT A/B和跨设备、本版本人验收尚未完成。用户没有同意关闭Confirm email，不以开发授权或等待时间代答。

- BOTW-r3-EMAILONLY，confirmed为2026-10-11最新本人范围：仅邮箱注册/密码登录+访客，取消GitHub/OAuth接入；旧角色r1/r2 GitHub/SMTP待条件已被替代。Confirm OFF与最低8已核验，有限实云10组保留原范围。当前六源码删除、测试及巡检见版本04/07/09和email_only_report；该记录不宣称本角色参与新的设计或代签本人验收，未发布。

- BOTW-r4-MAP，2026-10-11，本人当前范围：所有zoom神庙开关（DLC上方）、36px/44命中，原生24k×20k分级PNG和滚轮响应修复，旧far-only-shrine规则被替代。原Auth/云/数据不变；实际实现、源hash、验证与未覆盖见04/06/07/09及map_fix_report。专业记录不代签本人复验，不宣称本角色额外参与实施。
