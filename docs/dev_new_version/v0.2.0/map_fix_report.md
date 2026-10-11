# v0.2.0 r4 地图修订前端交接

日期：2026-10-11（Asia/Taipei）。角色：frontend_engineer。本人反馈：缩放动画不跟手、底图放大不清晰；后续补充任何zoom均显示神庙、增加“显示神庙”开关、地图神庙符号18→36px。主代理负责需求、App/Preferences/Settings/i18n与真实瓦片来源/资产/配置；本角色仅修改MapCanvas、新增smoothWheelZoom、极小styles及本文。未改App/auth/sync/SQL/用户数据或5173，未push/deploy。

已读AGENTS、dev-new-version前端指南与角色记忆。输入MapCanvas SHA256 `f8c0812b2f3cfab0e3e90c25b00e3965059f637d83055843c214723197000504`，与 `revisions/r3/source/src/components/MapCanvas.tsx` 逐字相同；原panelHeight、fitMap、focusPosition、closestMarker函数保持一致，坐标bounds `[[-2500,0],[0,3000]]`、min/max `-4/2`、阈值数值不变。神庙显示规则按新增本人反馈修订，历史r3远景仅塔不再是当前规则。

## 实现

- **滚轮响应**：关闭Leaflet原scrollWheelZoom和250ms zoomAnimation，`attachSmoothWheelZoom`按rAF累计输入，以最后指针锚点调用 `setZoomAround(...,{animate:false})`。原getWheelDelta保留设备/line/page归一，120归一像素对应1级；不设等待定时器。保留细滚轮残余，先按Leaflet实际zoomSnap取整，未跨步长不触发无缩放平移，min/max夹紧；按钮即时缩放。
- **输入与销毁**：ctrl/meta路径、控件、水平零量不截获，touchZoom/keyboard原handler保留。外部移动/缩放、触摸或卸载取消待应用帧；解绑所有自有监听。visible延后invalidateSize帧亦在切换/卸载时取消。
- **标记池**：塔/神庙按ID保存marker，筛选只增删对应ID；选择/完成只改相关icon，locale/说明只更新纯文本tooltip与aria。保留44px透明命中、role/aria-label、data-shrine/tower-id与data-marker-id，不清空图层、不聚合。
- **显示与尺寸**：神庙所有zoom按showShrines显隐，塔仍far显示/near隐藏。关闭任意pane收起其hover。四种legend/data-layer分别为神庙+塔、神庙、塔、全部隐藏。地图神庙symbol/svg36px、选中圈40px；塔22×26px和列表20px不变。开关偏好及侧栏/设置由主代理接入；本组件不自动改偏好或列表。
- **同屏点击**：两类型click统一在“当前显示的神庙＋far塔”候选中调用原closestMarker，再分发原onSelect或onTowerLocate→focusPosition。按真实中心距离，同中心优先实际命中类型，隐藏类型不参与；不移动点位。
- **hover**：open/resize/move/zoom定位按rAF合并；close/remove/dispose取消帧、监听及ResizeObserver。说明更新不重复绑定事件；compact图片提示也进入避障列表。

## 高清与回退

调用主代理 `createMapTiles(pixelRatio?:number):L.TileLayer`，本地原生z2..7 PNG、不重采样。高清overlayPane/zIndex2覆盖概览zIndex0；DPR1 tile256/offset4，DPR>1 tile128/offset5，逻辑坐标及mapmax2不变。原概览仍在底层，加载/缺片不清底图。

高清成功/失败按tile坐标集合追踪；失败隐藏对应img避免broken-image图标盖住概览，成功恢复visibility；不使用透明errorTileUrl冒充tileload。失败只显示compact `mapDetailError`/status＋`retryMap`，不影响进度或阻断地图。移出视野或对应片重新成功时移除旧失败。重试重新建高清请求，并先加载替代概览；替代图成功才移除旧图，失败保留旧可用概览。卸载先解绑tile事件再remove，避免销毁时tileunload更新组件状态。

主代理StableMapTiles通过公开getEvents去除viewprereset的全量销毁，保留zoom/viewreset/moveend；本角色未修改该模块。连续缩放时tile DOM实际复用、画质、缺片回退及重试仍由独立浏览器QA验证。

主代理已完成9945 PNG的尺寸/CRC校验与原字节镜像，计252130058字节，真实源24000×20000，原概览保留。本角色核对 `data/sources/map-tiles-manifest.json` 元数据与SHA256 `df8f0449311c3809adcb79f3180ea44a78ce572ad43cb93e5a23837a57cf5356`；不冒称独立重跑下载/CRC。来源、坐标映射与逐片证据由该manifest及主代理资产记录提供。

## 实际验证

- 接入主代理showShrines/四legend与高清模块后，`npm run typecheck`通过。
- 完整资产到位后执行 `npm run build`通过，100模块；主JS约700kB/gzip204kB，CSS49.62kB。沿用大文件提示，未扩展拆包或依赖修改。
- `git diff --check`通过。
- helper定向自查 `/private/tmp/zelda_smooth_wheel_check.mjs`，结果 `/private/tmp/zelda-smooth-wheel-results.json`，5组通过：16输入一帧合并与最后锚点、细滚轮残余/未跨snap零调用、边界和反向、UI/ctrl路径、外部移动与destroy监听/帧清理。使用当前helper＋可控事件/地图替身，非浏览器FPS或跟手体验证据。

实施中ID Set字面量推断交叉类型已显式Set<string>修正；主代理新模块可选getEvents类型问题由主代理修正，随后整体类型检查通过。补正Leaflet setZoomAround先算中心后snap可能产生细微平移：现在先按public Browser.any3d/zoomSnap取整，保留原目标残余。没有修改独立QA预期、旧证据或用户验收结论。

本角色未新增浏览器全测。主代理旧zoom-probe仅为修前基线：16wheel只产生2次zoomend、约280ms延迟，无>32ms帧；不能写成修后通过。当前候选交独立QA检查连续输入/锚点/边界、tile DOM复用、DPR/Pages/高清404与回退、marker池局部更新、36px/44px/20px、跨类型同中心/近邻、开关持久化/旧schema1以及三语hover/触屏/键盘，最终体验由本人验收。

## 冻结输入

| 文件 | SHA256 |
| --- | --- |
| src/components/MapCanvas.tsx | 8f912e57fe534261d1bdf9d59c875f35f86a72d2170e39434766ceb6d80aa61c |
| src/lib/smoothWheelZoom.ts | 7f9d093715eb690edb84e046b722e39f2bb7e4fc814218d8e1c0ee7127e521cc |
| src/styles.css | 8774d8c73fd96be000df7bf0915a81fdf88d91e273b02726dd734bb37ab0fe82 |
| src/lib/mapTiles.ts（主代理） | 24d463c90103db4ed631b75f6932461f6eec415893f0093ea92ca2203d63723a |
| data/sources/map-tiles-manifest.json（主代理） | df8f0449311c3809adcb79f3180ea44a78ce572ad43cb93e5a23837a57cf5356 |

完整资产后的源码现冻结。正式QA将结合主代理其他输入清单固定整个候选；若发现缺陷，重新分配后仅修受影响区域并重新核hash。本文不代替独立测试、本人验收或发布授权。
