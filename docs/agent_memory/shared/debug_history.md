# 问题记录

- BOTW-X01，confirmed，采集器，2026-10-11：Wiki多文章节点与章节封装容易选到提示块或末尾导航；已修复并对136份正文验证。[问题说明](../../problem_solution/2026-10-11-Wiki正文选择.md)。
- BOTW-X02，confirmed，本机地图，2026-10-11：默认整数zoomSnap可导致fitBounds全图明显过小，采用小数步进后实图验证；见frontend_report。
- BOTW-X03，confirmed，r2定位，2026-10-11：图层切换与新定位的状态语义不同，缩远保留safe，点击Tower需回调App清旧选；修前复现、修后用例13通过，见evidence/r2/browser-tower-before-fix.json与browser-postfix-results.json。

- BOTW-X04，confirmed，r3悬浮提示，2026-10-11：Leaflet提示父pane为0×0，仅max-width加正常换行会收缩成34px竖栏；字体简写`12px/1.5 inherit`无效。改显式卡宽和字体长属性，经四视口实际computed style确认。移动地图时只夹紧卡片会使离屏点位的提示滞留；应先核对实际可见anchor，关闭后清理监听。来源06、本轮07/09和evidence/r3/baseline-results.json、browser-retest-results.json。四边hover测试应先检查真实命中点位，控件覆盖或旧fade节点不能直接归为业务缺陷。
