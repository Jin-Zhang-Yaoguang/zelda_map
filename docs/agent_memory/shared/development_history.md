# 开发历史

- BOTW-H05，confirmed，v0.1.0 Pages部署，2026-10-11：用户明确要求Pages上线与直接链接。已部署https://jin-zhang-yaoguang.github.io/zelda_map/，代码b80b24a、Actions38115435077成功；六个公开文件HTTP200且与构建hash一致，独立线上9类检查通过。仅追加BASE_URL适配、三语存储页脚与官方SHA固定部署工作流；原UI验收保留历史，本次发布按部署授权/27输入快照留证，未伪重验。来源版本10、pages_test_report及evidence/pages。用户进度仍在浏览器，可导出/导入迁移。

- BOTW-H04，confirmed，v0.1.0，2026-10-11：本机验收收尾后用户另行明确授权创建公开GitHub仓库并推送。已创建Jin-Zhang-Yaoguang/zelda_map并普通推送main，代码提交62626cc，公开状态和远端一致性已读回。10份浏览器进度/恢复记录留本地；构建与gitleaks检查通过。依据版本10、github_publication_audit.md；网站未部署，无PR/合并/Release。下文“无远端发布”为此前历史状态。

- BOTW-H03，confirmed，v0.1.0 r3，2026-10-11：用户本人原话「这个 hover 效果可以了，v0.1.0 验收通过，继续收尾。」已记录accepted并绑定01..07与当前代码；验收后无漂移，独立看门狗阻断项0。本机收尾与构建ZIP归档完成，预览服务继续运行。来源：版本08/09/10/11、evidence/user-acceptance-20261011.json与release/manifest.json。授权范围为本机交付，未进行远端发布。以下r1/r2待验收表述为历史状态。

- BOTW-H01，confirmed，v0.1.0，2026-10-11：空目录建项目；实际产品/UI/技术/前端/数据/QA/看门狗参与。r1完成后用户退回地图图标/聚合/远景显示优化，r2按反馈修订。来源：版本01、06、08与07_r1，尚未验收通过。
- r2新增Tower定位层，保留136神庙/205宝箱/307来源与稳定进度ID，核对证据指向07、evidence/r2/data-results.json及backend_report；无remote、推送或公开部署。

- BOTW-H02，confirmed为工程结果，v0.1.0 r3，2026-10-11：用户确认按缩放阈值切换，随后退回hover竖栏；本次只改MapCanvas/styles完成220px横向卡片、三语层次、可见边缘调整与离屏关闭。真实独立QA和看门狗结果见本轮07/09及evidence/r3；尚待用户本人复验，本机服务继续使用40178，无远端发布。

- BOTW-H06，confirmed为本机工程/有限云接入结果，v0.2.0 r1，2026-10-11：按用户明确dev-new-version要求在dev/v0.2.0实现Supabase两种登录、UID隔离、CAS/receipt与持久队列、原访客迁移备份、真实保存提示。独立QA修复E09（远端二次变更拒旧选择）并保留失败证据；A03邮箱网络提示局部修复复测中。Free项目已由用户完成创建，迁移GUI成功且实际匿名RPC拒绝；GitHub/SMTP/真实JWT与跨设备仍待验证。旧Pages v0.1.0继续运行，v0.2.0未验收/推送/部署。依据版本06及evidence/live-anon-api.json、07最终报告；不包含凭据。

- BOTW-H06后续复测：A03错误分类27/27与浏览器三分支通过；U06显式回焦点的原例及六旁路独立通过，候选输入无漂移。真实Auth/跨设备仍待外部配置，本版未验收/部署。依据06/07、browser-otp-errors-final.json、browser-focus-final.json及local-candidate-inputs.json。

- BOTW-H07，confirmed为本机与有限云读回，v0.2.0 r2：新实际产品/UI/技术/前后端/独立QA/巡检完成邮箱密码修订。Auth7/browser19+编辑2组通过，r1证据保留、不变SQL/引擎未重跑。两表真实RLS/ACL/RPC元数据与anon两RPC拒绝已核，公开settings Confirm ON/GitHub OFF；最低8提交未最终读回，关确认问题未获答。尚未真Auth/JWT/AB/跨设备或本人验收/部署。依据06/07/09、evidence/r2与live-schema-metadata。

- 2026-10-11 v0.2.0 r3：本人取消GitHub，六源码删除入口及专属链路；独立QA/watch受影响检查，历史r2资料保留。当前源码/配置/验收状态以00与07/09为准；没有推送或部署。关Confirm许可不是版验收。

- 2026-10-11 v0.2.0 r4：本人地图反馈修订：逐帧滚轮、marker/tile复用，9945原PNG/24000×20000底图，showShrines开关与36px符号。受影响浏览器与双包验证见07/r4；失败输入/传输均留证。未经本人整版验收，不发布。
