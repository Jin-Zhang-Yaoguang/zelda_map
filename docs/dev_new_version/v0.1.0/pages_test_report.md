# GitHub Pages 部署独立验证

日期：2026-10-11。独立QA未参加路径适配或部署实现。用户已授权Pages上线并索要直接链接。结论：本地子路径与最终包验证通过，正式公开地址的9项隔离浏览器冒烟全部通过，可以提供直接链接。

## 目标与环境

- 正式线上URL：[神庙地图](https://jin-zhang-yaoguang.github.io/zelda_map/)。已实际访问、渲染和交互验证。
- 本地静态构建：`.runtime/pages-dist`，临时静态根映射到 `http://127.0.0.1:5174/zelda_map/`，没有Vite开发路径回退。
- Node24.18.0、Playwright1.62.1、隔离Chromium149.0.7827.55，桌面1440×960。用户原浏览器进度未读取。
- 5174只在测试脚本内启动并自动关闭，未操作root现有5173服务。
- 源码和构建文件哈希见[evidence/pages/candidate-manifest.json](evidence/pages/candidate-manifest.json)。本轮只验证BASE_URL与部署页脚，不改01–07或公共状态。

## 本地实际检查

`node tests/pages/qa_browser.cjs`初轮7项通过，之后只补最终页脚/包：

`PAGES_FINAL_ONLY=1 PAGES_RESULT_FILE=local-final-results.json node tests/pages/qa_browser.cjs`

最终补核3项通过，其中加载检查与前次重合；累计9种不同检查，没有重复旧17组。

| 检查 | 实际结果 |
| --- | --- |
| 子路径资源 | HTML/JS/CSS/资料/底图正确从 `/zelda_map/` 读取；底图3000×2500，资料SHA4938b62b72cbeed84e85b4d7ae7e37a60e6bd729de17debd2f6f8892c37b3fde |
| 默认地图 | 136列表、15远景Tower、0神庙点位，加载错误消失 |
| 052近景/hover | 136独立点、052横卡220px宽且高度<120，无聚合 |
| hash路由 | `/zelda_map/#/shrine/Dungeon052` 直达后刷新成功，同ID详情、敏感区折叠 |
| 三语 | zh/en/ja同ID名称切换正确 |
| 完成保存 | 标记052，刷新后仍完成，当前隔离浏览器存储只含Dungeon052 |
| DLC | 设置关闭后120列表、刷新偏好保持；15塔不受影响，近景120，052完成仍保留 |
| 公开页脚 | 三语分别为“进度保存在本浏览器”“Progress saved in this browser”“進捗はこのブラウザに保存” |
| 最终JS/错误 | 实际读取index-DXrBoT9O.js，SHA66a52de739fd044d267229550b4e7290e6d451521ea3d8651a3dd921348ed5f6；pageerror、请求失败和必需资源HTTP错误为空 |

原始结果：[local-results.json](evidence/pages/local-results.json)、[local-final-results.json](evidence/pages/local-final-results.json)。真实截图：[地图](evidence/pages/local-map.png)、[052横卡](evidence/pages/local-tooltip-Dungeon052.png)、[DLC120](evidence/pages/local-dlc120.png)、[最终页脚](evidence/pages/local-final-footer.png)。

初轮核心验证使用BFv0OzPl子路径包；页脚改动后只补最新DXrBoT9O包的页脚/哈希。本地旧包与最终包分开记录，没有把前者说成最终完整包重验。线上阶段对最终DX包重新验证9项。

## 正式线上实际验证

root确认[Actions run38115435077](https://github.com/Jin-Zhang-Yaoguang/zelda_map/actions/runs/38115435077) completed/success后，QA执行：

`PAGES_URL=https://jin-zhang-yaoguang.github.io/zelda_map/ node tests/pages/qa_browser.cjs`

实际exit0，9项全部通过：

1. 公开HTML、资料、底图和资产成功加载；136列表、15远景Tower，底图3000×2500。
2. 三语浏览器保存页脚逐项匹配。
3. 线上实际JS为`/zelda_map/assets/index-DXrBoT9O.js`，SHA256 `66a52de739fd044d267229550b4e7290e6d451521ea3d8651a3dd921348ed5f6`，与本地最终包一致。
4. 052进入近景136单独点位，横卡220px、无聚合。
5. `#/shrine/Dungeon052`独立详情直达刷新成功，敏感区初始折叠。
6. 中英日切换同一稳定ID和正确名称。
7. 052完成标记刷新保留，隔离context只存测试ID。
8. DLC关闭后120且刷新偏好保持；15塔不受影响，完成状态保留。
9. 所有必需资源使用项目子路径，pageerror/requestFailed/必需HTTP错误为空。

线上数据SHA仍为`4938b62b72cbeed84e85b4d7ae7e37a60e6bd729de17debd2f6f8892c37b3fde`。部署提交`b80b24a0407484896e0b2aa92d0cb64359e20b9c`中的App/MapCanvas/vite-env/i18n四源文件经git对象独立读回，与当前工作树哈希一致；见[commit-source-readback.json](evidence/pages/commit-source-readback.json)。

原始线上记录：[online-results.json](evidence/pages/online-results.json)。线上截图：[地图](evidence/pages/online-map.png)、[052横卡](evidence/pages/online-tooltip-Dungeon052.png)、[DLC120](evidence/pages/online-dlc120.png)。全部来自真实公开地址的全新浏览器context，不由本机截图代替。

辅助网页抓取工具无法读取该SPA，未据此判站点失败；上述成功结论来自实际Chromium渲染、交互、资源响应与字节哈希，不是只看API html_url或Actions存在。

## 边界

没有重跑全部资料、旧hover全矩阵、实机Safari、账号同步或跨设备迁移。进度按当前浏览器及origin保存，公开地址的保存与本机地址分开；测试只在新context写入虚构测试进度。017已有源冲突和未逐座实机通关边界没有变化。远端推送与部署由root执行，QA只读线上验证。
