# v0.2.0 r4 地图独立QA交接

日期2026-10-11，独立qa_engineer。主代理高res源/静态tiles，前端MapCanvas/smooth wheel/marker池/tooltip。只准备，等待源合同及冻结通知；不改实现、资产、状态、开发记录、验收或记忆。

已读主代理zoom-probe代码/results、当前MapCanvas及03/04约束。3000×2500、16轮→2个zoomend约280ms、帧无>32ms是主代理调查线索，不冒独立测量。准备r4_zoom_compare.cjs，在r3固定包5176与r4候选5177、新context相同输入重采；记录visual transform/zoom/native时间/帧/longtask/marker增删。只有语法检查通过，尚无候选运行。

05列W01—W04/M01—M04/T01—T04：锚点/边界/反向/按钮/键盘/overlay，任意zoom显示神庙/开关map-only/DLC独立/无聚合，节点身份/selected/complete，三语hover/narrow与安全内容，实际高res源/LOD/世界坐标，root/Pages/接缝/缺失恢复。放大旧图不算高清，data-zoom改变不单独算视觉跟手，微benchmark不证明用户GPU或主观满意。

真人增量已纳入：showShrines默认true、左侧在DLC上方、持久化但只影响地图；开时far神庙+15塔/near神庙，关时far15塔/near0；DLC独立120/136，列表/进度不删。神庙符号36px/命中44px，高塔不变，重叠最近点与hover需实测。旧far仅15塔与18px断言在当前r4失效。指标对比记录marker负载差别，不把旧15与新151的差异简单归因缩放算法。

待主代理给tile public目录/manifest、source尺寸/hash/world bounds、level/瓦片尺寸、fallback/retry合同及冻结时间。世界几何与代表性视觉对齐单列，fallback不冒高res。固定代码/图片/瓦片与新结果写evidence/r4，r3及失败保留。

不接Edge/5173/真实guest，不读.env.local，不重跑Auth/真账号/SQL/CAS，不发邮件。临时context/服务finally关闭；真人实际交互/视觉满意及本人验收仍待用户。

## r4实际完成（当前）

类型/root+Pages/9945PNG尺寸SHA/CRC网格与复制哈希通过；marker6+HD/input8共14唯一浏览器组最终通过，无已确认未关闭P0/P1。固定16轮对比新11旧2zoom更新、首visual49→7.5ms；实际终点/增益不同、far15→151、near p95新高于旧，不称FPS/GPU改善或本人满意。细输入未跨snap无平移、残余累计/模拟pinch通过。DPR2最高7和原生256→CSS128/world误差0、Pages/404保旧/重试实载、实际tile DOM复用通过。

HD first的DPR选择器容器/img误选保留；旧T03容器结果撤回tile意义，targeted真实img通过，未改源。07 current r4完整映射限制、同镜头native/overview代表图已查看；构建source36仍一致，candidate-manifest最终绑定。未重跑Auth/API/SQL、不触真实用户/5173；QA临时context/三端口已关闭。本人体验/验收与发布待主代理推进。
