# v0.1.0 GitHub Pages工程巡检

日期：2026-10-11。独立watchdog只读检查；仅写本报告。目标为`Jin-Zhang-Yaoguang/zelda_map`的GitHub Pages。用户本轮已明确授权部署网页、取得直接链接及必要Actions自动部署，不另设确认门槛。

## 结论

**工作流与发布包的工程巡检通过，未发现需阻断已授权部署的权限、凭据或产物范围问题。** 可继续由root启用Pages、推送并运行Actions。当前结论是发布准备审核，不替代Actions成功回执、独立子路径/线上QA或实际网页读回。

原v0.1.0 UI已由用户本人验收，绑定指纹7500957122b6d533de64c165a18f26793455fb224956ec8bb3f06932caf946ee保留为历史。当前BASE_URL适配和新增workflow是本轮部署授权下的必要变更，需用部署源码/commit/QA另绑；不能写成r3源码无漂移，也不伪造用户重新接受新源码。

## 工作流

`.github/workflows/pages.yml` SHA256：`7b7f6371b34fa7cf5f500894e4fa5602903ceaa79539f85d5b53f3f30263c363`。

| 项目 | 核对结果 |
| --- | --- |
| 触发 | 仅main的产品输入push及workflow_dispatch；无pull_request部署。docs回执提交不重新部署，过滤项覆盖workflow、src/public、包锁与构建配置。 |
| 实际权限 | 顶层声明部署权限，但build显式覆盖为contents:read/pages:read，deploy仅pages:write/id-token:write；未赋contents写或其它仓库写权限。 |
| 操作范围 | checkout→Node24/npm缓存→configure-pages→npm ci→build→上传dist；deploy等待build，在github-pages环境部署并输出page_url。没有推送分支、PR、Release、任意脚本下载或用户数据处理。 |
| Action来源 | 5个actions均官方仓库并固定40位commit SHA；与root保存的GitHub API版本解析记录匹配，未使用浮动main/tag执行。 |
| base | build读取configure-pages的base_path，双引号传`npm run build -- --base="${PAGES_BASE_PATH}/"`；env内容不被重新求值为shell代码。目标项目路径为/zelda_map/。 |
| artifact | upload-pages-artifact的path仅dist；deploy使用needs:build，未上传工作区、docs/data研究目录或本地运行目录。 |
| 凭据 | 未见PAT、手写token、secrets输出或env打印。官方action使用的临时GitHub令牌/OIDC在runner执行，不作为Vite公开变量配置；页面构建无用户进度输入。 |

GitHub官方[自定义Pages工作流文档](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)要求部署job具有pages写/OIDC写权限、依赖构建并设置部署环境；当前流程相符。本角色检查的是已落盘源码与权限，启用Pages及运行结果由root记录。

## 前端与发布包

实际git diff中前端仅两处：App的资料fetch和MapCanvas的底图URL改为`import.meta.env.BASE_URL`拼接；另加Vite客户端类型声明。没有改版面、神庙正文、完成集合、存储/备份schema或阈值/18px/44px合同。默认base=/仍支持本机，项目子路径由Vite构建值提供。

已读前端构建记录，并独立查看`.runtime/pages-dist`：

- 仅index.html、一个JS、一个CSS、底图、生产JSON、THIRD_PARTY_NOTICES共6文件，无符号链接。
- HTML的JS/CSS引用均在/zelda_map/assets/；JS包含/zelda_map/data/shrines.json及/zelda_map/assets/hyrule-base.webp。
- 子路径包没有独立进度备份/原存储JSON、研究HTML/研究JSON、docs、.git、node_modules、.runtime或测试截图。
- 10份浏览器备份/恢复记录未被Git跟踪；CI从仓库checkout且只复制public/构建dist，不读取本机浏览器存储。访问者进度仍仅保存在其浏览器localStorage，不增加上传服务。

| 静态内容 | 子路径包/public字节一致的SHA256 |
| --- | --- |
| 生产JSON | 4938b62b72cbeed84e85b4d7ae7e37a60e6bd729de17debd2f6f8892c37b3fde |
| 底图 | 5847a9e5f5d4ed44bc20b61d2b5c24999c33b796d8a42354946f42c631b4ec10 |
| THIRD_PARTY_NOTICES | 5cd96ec0a64a180e02eb5f36c03a303218492418ee4533ea1293369a231aca33 |

子路径包JS文件名以当前构建为准，不沿用旧默认dist或前端初次构建的basename作为线上证明。root最终Actions产物及QA读回仍须绑定实际部署commit。

## 许可与状态边界

THIRD_PARTY_NOTICES随dist保留，含React/ReactDOM/Scheduler、Leaflet、Vite许可文本及Nintendo相关游戏资产的非官方归属声明；README/data_sources已有来源说明。没有复制研究Wiki整页到网页包。许可原文的已知格式例外保持原字节，不为部署删除署名。

用户部署授权解决本次外部操作范围，不替代第三方素材的权利来源；本工程巡检不宣称获得新的官方授权或重新裁定游戏资料事实。017物资来源分歧、资料/实机覆盖等已有披露继续有效。

root保存的Pages创建回执显示build_type=workflow、public=true及目标URL `https://jin-zhang-yaoguang.github.io/zelda_map/`；这只是配置记录，不能单独算网页上线。后续以Actions回执和实际HTML/JSON/底图及浏览器验证收口。

本角色未改源码、workflow、状态或01–07，未重跑测试/构建、未动5173/PID40178、未执行远端动作。无需追加部署确认；由root与独立QA完成实际发布与读回。
