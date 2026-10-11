# v0.2.0 正式发布巡检交接

2026-10-11，独立watchdog，未承担本版实现，不执行commit/push/后台设置或生成用户approval。

真人已向主代理明确验收通过并授权收尾、GitHub推送、现有Pages更新；对应原话与目标见evidence/release/user-acceptance.json。授权覆盖本版accepted r4，不意味着部署结果已完成，发布回执/线上读回由主代理与独立QA各自记录。

已完成正式上线前增量漂移检查：44个候选输入、36个构建源输入实际SHA一致，原瓦片manifest和9945链未变；当前9945路径/尺寸字节/mtime守护无变化，复用上一完整CRC/hash/secret证据而未重读250MB。结果evidence/release/watchdog-pre-release-drift.json。本轮代码不变，无新测试或构建要求。

实际开发分支dev/v0.2.0，HEAD2686aa1；origin配置github.com/Jin-Zhang-Yaoguang/zelda_map.git，无URL内嵌凭据；本机cached origin/main仍2686aa1。cached ref不代表最新远端查询，主代理发布前须fresh核对并普通FF到main，不force、不绕过保护。不要用任务包中dev/v020简写替代实际ref。

主代理指定的实际index已核对通过，evidence/release/watchdog-stage-review.json：10311文件与声明范围一致，44工作区/index候选和36源index SHA匹配，7验收文档及10182个接受code条目匹配。9945片复用完整链/CRC+本次metadata，未逐image gitshow；366非瓦片stage及历史gzip解压内容精确密码匹配0，env/runtime/node_modules/dist均未暂存。两个通用secret模式均是既有合成拒绝测试。QA-only map-harness不作为产品发布包。

无损gzip已实际核验：stage168621B/hash符合声明，gunzip900326B/hash与本机原始mjs逐字一致，原文件保留且ignored、不indexed。未删除或改写payload，公共历史证据有恢复指令。验收绑定21d6d43d…与同一原真人quote/actions/receipt相符，新增两只读发布验证脚本的重绑注明没有新的真人决定。workflow的human_source_verified=false仅表示工具不认证作者，真实来源由Root基于当前直接消息核实，本角色未代生成approval。

正式上线前增量巡检通过，无已确认仓库阻断。Root最后只需重stage本报告/09/巡检证据的纯文本增补，再执行已授权普通commit/FF推送与Pages发布；这些增补不改01—07、44候选或已验收产品代码。本角色没有执行提交/发布，也不将授权当上线成功，真实回执和线上验证由Root/独立QA完成。新原瓦片署名/来源与Nintendo衍生边界保留，不宣称新增官方游戏素材许可。
