# v0.1.0 r3 QA交接

日期：2026-10-11。独立QA未参与实现。r3已完成，正式结果见[07_测试报告.md](07_测试报告.md)，12个不同浏览器组全部有实际通过证据：96常规卡、24边缘布局、开启态关闭、出入/点击/安全与少量层级回归。r2报告与证据保留。

真实旧基线为1440×960中052宽34/高414，父pane0×0、font简写无效；不是从裁切图推viewport。修后为220×93.3横卡，名称/地区单行，底行独立标签，完整ARIA、纯DOM文字。

唯一修后真缺陷是开启tooltip后键盘pan把anchor移出仍未关闭，已修可见性close与open-only map/sidebar Observer、close/remove清理，实测通过。面板原版会自然关闭，不把静态线索当失败。边缘残余失败源于拖动/淡出时序与控件覆盖的测试目标，真实命中修正后通过；失败证据均留存。

数据SHA4938b62b72cbeed84e85b4d7ae7e37a60e6bd729de17debd2f6f8892c37b3fde未变；26静态断言/3监听配对、source-dist三文件和最终npm build通过。未重做277缓存/136资料或旧17组全套。

验收图：[450×240横卡局部](evidence/r3/hover-detail-Dungeon052-zh.png)、[桌面全图](evidence/r3/final-tooltip-1440-Dungeon052-zh.png)、[390日文](evidence/r3/tooltip-390-Dungeon052-ja.png)、[360中文](evidence/r3/tooltip-360-Dungeon052-zh.png)。全部来自实际浏览器，原生clip没有编辑上传图片。

root继续维持127.0.0.1:5173，QA未另起/停止服务。最终manifest在evidence/r3，包含冻结06及最终测试脚本；当前无工程阻断项。用户需再次验收审美，手机仅模拟鼠标样式，不宣称有hover；017源分歧、未实机Safari/母语/逐座通关等边界保留，发布未授权。
