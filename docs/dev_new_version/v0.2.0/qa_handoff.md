# v0.2.0 QA交接

日期：2026-10-11。独立qa_engineer，未参与实现。设计见05，实际范围和41项覆盖/未覆盖见07。当前本机已受测范围通过，四项已确认工程缺陷均修复复验，无未关闭已确认P0/P1；不称整版实云验收通过。

## 已运行证据

- SQL8组：生产权限、非owner RLS正反例、RPC A/B隔离、false取消、CAS/receipt/136原子及rollback。PGlite真实PostgreSQL18.3，但Auth claims模拟。
- 引擎14个唯一组：首轮11通过/E09失败后，两分支修后通过；另含无BC/无WebLocks租约到期接管和项目缓存分区。fake-indexeddb/受控Auth加实际SQL，不是Supabase实云。
- wrapper6组及独立错误映射27/27；后者修前真实bundle27中3个Auth403已知code误权限，修后原sync403/42501及401保持正确。
- 浏览器15个唯一组最终均通过：主要登录/保存/迁移/队列/根与子路径OAuth视图、错误三分流、四宽度和焦点。SDK/IndexedDB/DOM真实，GoTrue/GitHub/邮箱替身。
- U06修后两组：原迁移Esc250ms回入口；guest/account导入取消、预览网络失败、刷新预览550ms标题不被旧任务抢、恢复取消、冲突关闭六旁路通过。
- 三个隔离构建root/pages/guest exit0，数据/底图7检查通过，资料SHA4938b62b…保持v1。完整受测版本、命令及哈希见evidence/build-manifest.json和candidate-manifest.json。

## 关闭项及证据边界

E09二次云变更拒旧选择并清radio；A03网络错误不再冒无效码；Auth已知OTP code优先于403通用错误；异步modal关闭回发起控件。修前原始结果保留，详见07缺陷表。

测试自身的异步渲染等待、文案选择器、坏context导航中frame.evaluate、Auth API版本头/CORS暴露头修正单列；不冒称实现修复。早期403浏览器替身不含完整协议，不单独证明已知code缺陷，确证来自实际旧bundle矩阵；最终SDK三分流已通过。

RLS必须分开看生产grant拒绝、隔离库临时grant后的行策略正反例、postgres definer内部UID过滤；没有临时开放真实云直表。Root真实匿名settings/RPC回执已审阅，但只证明API可用及匿名执行拒绝，不证明真JWT A/B隔离。

## 未覆盖和下一阶段

真邮箱/OTP模板有效期、GitHub provider、认证JWT/伪造JWT、跨设备CAS/迁移/恢复均待实际项目配置与用户条件；L4未完成。Root回执email=true/GitHub=false，SMTP/解锁待条件，不等待外部而冒本版完成。其他未跑条件逐条列于07的41矩阵，包括真实多tab、400%/软键盘/Safari、全部新增英日DOM及未重跑的v1异常组合。

本次只改05/07/qa_handoff、tests/v020和QA证据；未读.env.local/用户Edge进度，未改实现、状态、角色正式记忆或生产。所有QA临时5174服务/Chromium/PGlite已随脚本结束关闭，5173保留。后续实云补测另增报告revision；QA不代签用户验收或上线。
