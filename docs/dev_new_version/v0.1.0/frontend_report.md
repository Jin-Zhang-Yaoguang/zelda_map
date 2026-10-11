# v0.1.0 前端实现记录

日期：2026-10-11。角色：frontend_engineer。实现与开发自查完成；独立QA、内容核实和用户验收尚未完成。本版只启动本机预览。

## 范围与运行

- 实现P01–P08、P10对应前端；P09展示字段级核实状态与来源，资料真实性由数据与QA核对。
- 文件：package.json/package-lock.json、index.html、Vite/TS配置、src/main.tsx、App.tsx、i18n.ts、styles.css、components/**、lib/**。
- 未改src/types.ts、生产资料、采集脚本、独立测试或其他角色文档。
- 固定入口：http://127.0.0.1:5173/。`npm run dev`、`npm run build`、`npm run preview`与README既定命令一致；dev/preview均strictPort。
- 依赖锁定React/ReactDOM19.1.1、Leaflet1.9.4、Vite7.1.9、TS5.9.3、React插件5.0.4。npm安装已成功；不修改全局npm。
- 本机dev仍运行，exec session 44647。未推送或部署。

## 实际行为

- 读取真实136座资料和本地3000×2500底图；校验数量、ID、地区与来源引用、三语字段、位置及详情结构。
- CRS.Simple与04投影一致。zoomSnap=.1、zoomDelta=.5；全图按容器拟合。手机拟合计入底面板，放宽地图平移边界，minZoom=-4支持小视口。
- 墨绿顶栏/侧栏、清晰底图、蓝色未完成/绿色勾选完成、选中外环。近点聚合成数字入口，点击给出附近神庙列表；始终可从完整列表选择同ID。
- 搜索只读取三语名称与地区；外层只读取safe介绍/简短前置、位置、名称/地区/范围、完成与核实状态，无trial/detail正文。
- hash地图/神庙详情/设置页；地图组件保持挂载，返回保留视角、查询、地区、完成筛选和有效选择。进入新页聚焦标题，返回尝试恢复发起控件，否则搜索。
- 详情三敏感区各自默认关闭；切语言保留展开，换座/退出重新折叠；来源外链只http/https且标可能剧透。
- 语言/DLC/完成共用App状态，稳定ID记录。设置和地图DLC开关同步，隐藏不删完成。当前DLC选择清除；已有DLC详情继续可用并提示隐藏。
- 手机56px底面板工具条，展开≤剩余高度60%，内部滚动；选择后滚到预览，完成与详情按钮可触达。桌面336px侧栏、72px顶栏。
- 完成/取消同步计数、标记与列表，提供9秒撤销；筛选排除选择时清预览并反馈。
- 读取损坏存储不自动覆盖；会话仍可使用。写入/读回失败提示未保存，可导出及重试；显式修复先下载原始串。
- 备份含隐藏DLC，格式/日期/游戏/schema/ID/1MiB校验，重复去重并说明，未知ID整体拒绝。有效备份预览后确认；取消不改进度。导入前保存并读回pre-import，失败先下载旧进度再显式会话恢复。正常恢复写入失败仍保留原有效内存集合。设置不被导入覆盖。
- 数据失败、地图失败与无结果分开显示，提供重试；数据失败仍可进入设置导出。纯文本React/DOM渲染，不用动态HTML展示资料。

## 开发自查

- `npm install --no-audit --no-fund --fetch-retries=0 --fetch-timeout=30000`：成功，71包；sandbox网络限制后经合理escalation运行。
- `npm run build`：类型检查和Vite构建成功。最后代码调整后再次构建，结果见本轮命令输出。
- Playwright1个隔离桌面context（1440×960）及1个手机context（390×844），缓存Chromium1228。真实浏览器访问固定origin；不接触用户原浏览器或进度。
- 实查：136列表；选择Dungeon000并进入同ID详情；3区初始折叠；标记完成后en/ja切换；设置DLC关闭120、地图开启136；导入Dungeon005+Dungeon120，pre-import可见，刷新完成数量2；手机无横向溢出；pageerror=[]。
- 桌面首次全图过小：由默认Leaflet整数zoomSnap造成，已改为.1并经截图核对。手机初始最大地图边界限制垂直偏移，已扩大边界并计入底面板padding；最低缩放放宽到-4。
- 临时自查脚本：`/private/tmp/zelda_frontend_smoke.cjs`。截图：`/private/tmp/zelda-desktop.png`、`zelda-mobile.png`、`zelda-mobile-selected.png`、`zelda-settings.png`。临时材料可由主代理/QA按归属转存；不是正式QA报告。

## 交接与限制

- 独立QA入口已通知主代理。语义按钮、select、详情accordion、文件输入与dialog可用于真实测试；存储键完全按04。
- 页面焦点返回具有40ms等待；自查脚本即时打印focus为空，尚未等稳定时机断言，须由QA实际验证。导入确认有Tab循环与Esc取消。
- 存储禁用/QuotaExceededError、坏JSON/未知ID导入拒绝、地图/资料失败重试、多手机视口与键盘全流程留给独立QA；未跑项不写通过。
- 资料生成与两组作者仍在补齐；unverified会直接显示“待核实”，空数组在unverified状态显示缺资料，不冒充完整内容。
- 不以构建、数量或界面可运行代表136座内容完整核实；前端没有编造游戏资料。

## 记忆候选

本项目Leaflet CRS.Simple底图需设置小数zoomSnap，否则fitBounds在固定侧栏后可能向下取整，首屏地图明显过小；来源为MapCanvas及实际1440×960/主代理1280×720截图。仅候选，由主代理核对后归并。

## 独立QA修复：QA-UX-01

2026-10-11：完成通知会暂时挡住设置页导入错误中的未知ID明细入口。修改`src/styles.css`：toast容器设`pointer-events:none`，内部按钮设`pointer-events:auto`，文字和空白区域不再拦截下层点击，撤销与关闭仍接收点击。手机样式只覆盖位置、尺寸和字号，不覆盖此点击规则，继承同一修复。

修改后执行`npm run build`；类型检查和生产构建通过。已通过的17组独立QA用例未重复运行；此问题交独立QA定向回归。没有提前扩展资料字段。

## 来源冲突说明展示

2026-10-11：按主代理确认的FieldEvidence可选三语`displayNote`扩展，在详情对应敏感区展开后，仅当字段状态为`conflict`且`displayNote`存在时，使用Localized组件显示冲突说明，紧邻该区内容。折叠状态、地图、列表与安全预览不显示说明，仍只呈现原冲突标签；语言切换直接读取当前语言，不渲染原中文`note`。没有硬编码神庙ID、游戏事实或资料文案。

修改范围仅ShrineDetails、styles.css与本记录；类型、schema和生产说明由后端维护。接线后`npm run build`通过（类型检查及Vite生产构建），定向核验交独立QA。

## r2：用户退回后的前端修订

当前候选为r2。依据01的R8–R10/A8及02/03/04修订：r1神庙图标偏大、缩放聚合不符合用户要求，用户退回后本轮改为连续缩放中的远近两档显示。前文聚合实现与r1测试仅是历史记录，不代表r2行为或测试结论；用户验收仍由主代理处理。

- `src/lib/map.ts`统一`SHRINE_ZOOM_THRESHOLD=-1`，`NEAR_FOCUS_ZOOM=threshold+0.5=-0.5`。小于阈值只显示15座Tower，高于或等于阈值只显示当前筛选后的独立神庙。图层互斥，Tower不受神庙搜索/地区/DLC/完成筛选影响。
- MapCanvas删除全部bin、cluster数字、分组与onNearby路径；App删除nearbyIds/附近列表状态，三语字典与样式删除对应废弃项。神庙保留原始坐标，不移位或抖动。透明命中区重叠时按点击到真实中心最近者选择。
- 神庙符号18×18px，完成勾同尺度，选中仅18px细环；透明命中区44×44px，不画旧大底盘。Tower有单独塔形与三语tooltip，仅定位不进入详情、不记录完成。
- 点击Tower及列表定位神庙均居中到`max(currentZoom,-0.5)`；手机只平移相机把目标放在底面板外可见区，标记坐标不变。缩回远景保留现有神庙选择/安全预览，只隐藏神庙标记。
- 全图复位按fitBounds并限制在远景；程序化复位关闭缩放动画，避免快速复位后列表定位被Leaflet旧动画吞掉。定位遇到尚未完成的远景缩放时，在zoomend后补定位。
- 地图小标签三语显示远景放大提示、Tower定位提示或近景神庙可见提示。只读`data-layer=towers|shrines`、`data-zoom`反映真实图层/缩放；标记DOM有稳定`data-marker-id`及分类型ID，不暴露测试setter或window.map。
- 浏览器validateDataset追加必需15Tower校验：唯一Tower01..15、三语名称、有限坐标、地区/来源/字段证据引用；少塔或结构错误整体报资料错误。Tower不进入神庙列表/导入白名单/备份/120或136分母。本地存储键保持。

实际自查：缓存Chromium1228，隔离1280×720桌面与390×844手机context，固定origin。远景zoom=-2.1显示15塔/0神庙，点Tower01后zoom=-0.5显示136神庙/0塔；18px符号与44px命中区计算样式正确；三语远景标签切换；关DLC近景120，复位远景仍15；空搜索只清空神庙列表；远景列表选Dungeon000升到-0.5，详情返回保持近景；完成保存只含Dungeon000。手机无横向溢出，所选点中心Y=214，面板顶Y=371.2，目标未被面板遮挡；pageerror=[]。未接触用户原浏览器或进度。

临时自查脚本`/private/tmp/zelda_frontend_r2_smoke.cjs`，截图`/private/tmp/zelda-r2-far.png`、`zelda-r2-near.png`、`zelda-r2-mobile.png`。初次自查暴露快速复位后定位被动画吞掉，修复后相同流程通过。阈值精确下/等于/上、真实源全量投影、Tower导入拒绝等交独立QA定向复核；r1测试不沿用为r2通过。

本轮修改MapCanvas、App、lib/map与lib/data、i18n、styles及本记录；不改types/schema/生产JSON。生产数据由后端提供`v0.1.0-20261011-r2`，136神庙+15塔。`npm run build`类型检查/生产构建通过，收口前再构建；root的既有本机服务继续运行，未另开或停止服务，未发布。

## r2 巡检修复：高塔新定位清除旧预览

2026-10-11：按02/04/tech最终定位流程，新增MapCanvas的`onTowerLocate`回调。点击确定的真实Tower后，在相机定位前通知App清除`selectedId`及其安全预览；仅缩回远景仍保留选择与预览。回调不写Tower神庙ID，不修改query、地区/完成筛选、DLC偏好或完成集合。预览服务未停或另起。

修改后`npm run build`类型检查/生产构建通过；定向回归交独立QA，覆盖选神庙→缩远保留safe→点Tower清safe及详情返回视角。未重复此前已经通过的用例。

## r3：修复hover竖排与边界展示

2026-10-11：用户确认按zoom阈值切显示内容，并退回悬浮提示的外观；仅确认显示模式，不构成候选版验收通过。先在真实隔离浏览器复现旧版：1440px提示34×414px，390px提示顶端为−216px，确有逐字竖排和越界。旧CSS使用auto宽、允许换行且字体简写无效；本轮明确卡宽与各级字体。

只修改MapCanvas、styles.css和本记录：提示卡优先220px宽，名称14px半粗单行ellipsis、地区12px单行、底部独立本体/DLC与完成badge，常规高约93px；Tower同样显示名称、地区和定位badge。文字全由DOM节点textContent写入，保留完整marker aria-label，不引入trial、宝箱或攻略字段。卡片pointer-events:none；定位按真实地图矩形和手机sidebar.top留12px，空间不足翻到点下方并clamp，避开地图按钮、图层提示和底部说明。没有改18px符号/44px命中、远近阈值、图层逻辑、资料、完成或备份；既有WIP及root服务保持。

定向自查：缓存Chromium1228，1440×900、390×844、320×844隔离视口；70个hover布局检查通过，覆盖Dungeon051、实际诺基·米席Dungeon052的中英日、最长英文名Dungeon077、真实稳定拖动后的四边及15座Tower在三种宽度。卡片220×93.3px、名称不拆字、四边不越可见图、不入手机底面板、pointer-events:none，pageerror=[]。生产名称051为卡玛·拉席/Maka Rah，052为诺基·米席/Gee Ha'rah，本轮两座都检查，未改映射。首次脚本遇到Leaflet淡出中的旧透明节点，等待220ms稳定后测；边缘拖动截图按真实停止后的状态保存。

临时证据：`/private/tmp/zelda_frontend_r3_before.cjs`、`zelda_frontend_r3_smoke.cjs`和`zelda-r3-results.json`；修复前`zelda-r3-before-1440.png`/`390.png`，修复后`zelda-r3-1440-Dungeon052-zh.png`、`zelda-r3-320-Dungeon052-en.png`、`zelda-r3-390-Dungeon052-ja.png`、`zelda-r3-edge-top.png`/`edge-right.png`及`zelda-r3-tower-1440.png`/`390.png`。仅hover范围开发自查，正式QA后续独立复核，未重跑无关功能。

r3收口：最终`npm run build`类型检查及Vite生产构建通过（44模块，2026-10-11本轮输出）。高塔桌面/390px截图已补齐；修改交主代理和独立QA，尚未取得r3用户验收。

## r3 QA边界修复：离屏点位关闭提示

2026-10-11：独立QA的browser-boundary-first.json/01与failure-01-open-tooltip-offscreen-keyboard.png已真实确认，键盘平移使点位离屏后提示仍悬空。局部修positionTooltip：先按真实可见地图界线（手机截到面板顶端，不用卡片12px留边）检查anchor；越界或地图不可见立即closeTooltip，不再仅clamp卡片。可见边缘点位继续按原卡片排版定位。

提示打开时才建立一个ResizeObserver观察map与sidebar；关闭/移除时解除地图事件并disconnect，重新打开先清理旧绑定。没有为全部神庙常驻建立observer，未改样式、阈值、数据或其他流程。构建后交独立QA复测01/02及受影响边缘，不重复无关功能；root预览服务未动。

此边界修复后`npm run build`类型检查与Vite生产构建通过，定向运行结论等待独立QA回报。
