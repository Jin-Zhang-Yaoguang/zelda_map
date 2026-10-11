# v0.2.0 独立上线QA交接（脚本已准备并冻结）

当前仅准备；等待主代理成功Actions的实际artifact根目录、完整commit及run id后执行。没有声称线上更新成功。05/07和01..07验收输入未修改，测试脚本现在冻结；执行阶段若有验证工具修正，只用.runtime临时副本并记录其hash，不改正式tests/v020。

release_assets.mjs需要QA_RELEASE_ARTIFACT_DIR（含index.html的解压Actions真实产物）、QA_RELEASE_COMMIT（完整40位）、QA_RELEASE_RUN_ID。从产物HTML自动解析JS/CSS，线上HTML/JS/CSS/shrines/NOTICE以及3张原生7层PNG逐byte SHA匹配，PNG还与source manifest一致。不是将本机合成env包或HTTP200当新版证据。输出evidence/release/assets-results.json；重新验证用不同QA_RELEASE_ASSETS_OUTPUT，原失败保留。

release_browser.cjs在assets-results通过后启动：实际线上新版、独立DPR2 context/合成guest；anyzoom/36symbol44hit/开关刷新map-only，原生7层Pages路径和小wheel，三语hover/详情刷新折叠，以及配置邮箱登录/注册界面无GitHub。只切模式，不填账号/密码、不submitAuth，所有Supabase请求拦截，无真实云写。关闭自有context/browser，不操作Edge/5173/用户原guest。不重跑14本机/10实云组，不新建账号。

结果和上线结论只写独立online_test_report.md、qa_release_handoff与evidence/release；根版本状态/验收/发布记录由主代理维护。Actions失败或资源hash不一致分别如实记录，不因进程/HTTP完成冒新版发布验证通过。

冻结脚本SHA256：

- tests/v020/release_assets.mjs: 6b7fabcd600f79fb80637599fd18d14e71ef43244f5bf5eb1b2f64513c29f5a8
- tests/v020/release_browser.cjs: 639acc6dd96e39927b2a19bb109b818742f618566b233c7f30fb82d6a12678d5
