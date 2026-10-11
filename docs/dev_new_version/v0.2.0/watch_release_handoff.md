# v0.2.0 正式发布巡检交接

2026-10-11，独立watchdog，未承担本版实现，不执行commit/push/后台设置或生成用户approval。

真人已向主代理明确验收通过并授权收尾、GitHub推送、现有Pages更新；对应原话与目标见evidence/release/user-acceptance.json。授权覆盖本版accepted r4，不意味着部署结果已完成，发布回执/线上读回由主代理与独立QA各自记录。

已完成正式上线前增量漂移检查：44个候选输入、36个构建源输入实际SHA一致，原瓦片manifest和9945链未变；当前9945路径/尺寸字节/mtime守护无变化，复用上一完整CRC/hash/secret证据而未重读250MB。结果evidence/release/watchdog-pre-release-drift.json。本轮代码不变，无新测试或构建要求。

实际开发分支dev/v0.2.0，HEAD2686aa1；origin配置github.com/Jin-Zhang-Yaoguang/zelda_map.git，无URL内嵌凭据；本机cached origin/main仍2686aa1。cached ref不代表最新远端查询，主代理发布前须fresh核对并普通FF到main，不force、不绕过保护。不要用任务包中dev/v020简写替代实际ref。

待主代理指定实际暂存范围后，本角色仅增量核对index/收尾文档与秘密：env/runtime/用户真实进度不入库；全量瓦片不再次读取；测试和历史来源按已有用途保留；QA-only map-harness不作为产品发布包。新源/资产如实际变动则对应已验收绑定失效，不能沿用本交接。

当前没有由本角色发现的源码阻断；最终index与文档核验尚未完成，不提前给出提交/上线批准。新原瓦片的署名/来源与Nintendo衍生边界保留，本站和用户发布授权都不宣称新的官方游戏素材许可。
