# 问题记录

- BOTW-X01，confirmed，采集器，2026-10-11：Wiki多文章节点与章节封装容易选到提示块或末尾导航；已修复并对136份正文验证。[问题说明](../../problem_solution/2026-10-11-Wiki正文选择.md)。
- BOTW-X02，confirmed，本机地图，2026-10-11：默认整数zoomSnap可导致fitBounds全图明显过小，采用小数步进后实图验证；见frontend_report。
- BOTW-X03，confirmed，r2定位，2026-10-11：图层切换与新定位的状态语义不同，缩远保留safe，点击Tower需回调App清旧选；修前复现、修后用例13通过，见evidence/r2/browser-tower-before-fix.json与browser-postfix-results.json。

- BOTW-X04，confirmed，r3悬浮提示，2026-10-11：Leaflet提示父pane为0×0，仅max-width加正常换行会收缩成34px竖栏；字体简写`12px/1.5 inherit`无效。改显式卡宽和字体长属性，经四视口实际computed style确认。移动地图时只夹紧卡片会使离屏点位的提示滞留；应先核对实际可见anchor，关闭后清理监听。来源06、本轮07/09和evidence/r3/baseline-results.json、browser-retest-results.json。四边hover测试应先检查真实命中点位，控件覆盖或旧fade节点不能直接归为业务缺陷。

- BOTW-X05，confirmed为独立测试工程事实，v0.2.0，2026-10-11：E09旧冲突选择与A03验证码网络/403分类已局部修并定向复测，保留修前失败和替身协议修正。[问题说明](../../problem_solution/2026-10-11-账户同步冲突与验证码错误.md)。U06异步预览回焦点另待修复，不混入已通过结论。

- BOTW-X06，confirmed为独立受控浏览器工程结果，v0.2.0：异步预览使disabled触发按钮失焦，dialog挂载才捕获activeElement会得到BODY。改在发起前捕获真实控件与身份周期，关闭后检查有效/visible/connected/non-inert/enabled，短忙等待、新modal取消旧任务、安全fallback；独立原例及六旁路均通过。出处06/07/browser-focus-final.json，原失败保留，非实云验收。

- r4地图诊断：Leaflet1.9.4缩放动画中忽略新目标，原16轮只2完成更新；取消动画后TileLayer默认viewprereset会全清，局部公开getEvents去该事件后实测瓦片可复用。zoomSnap先量化目标才算中心，防细输入无缩放平移。独立DPR测试必须选实际tile img，不把layer容器当256px PNG；初失败保留，正确selector定向复测。证据07/r4、map_fix_report。
