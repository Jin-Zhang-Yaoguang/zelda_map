# r3 独立静态与包读回复核

时间：2026-10-11T03:53:45.730561+00:00。命令：`python3 tests/r3/qa_static.py`。

静态断言：PASS，26 项，失败 0 项。运行几何结果待父 QA。

- 神庙/高塔提示已拆为名称、地区、标签节点，动态内容用 `textContent`；完整 ARIA 只取基础字段。
- `.map-tooltip` 显式 220px 宽、动态最大宽度、有效字体长属性，名称/地区单行省略；pointer-events:none。
- r2 的 18px 图形、44px 透明命中、-1 连续缩放阈值、互斥塔/神庙图层与无聚合路径保持。
- 除 MapCanvas/styles 外，r2 清单中产品源码、数据、Schema、配置均未改变。

## 逐字读回

| 文件 | public SHA256 | dist SHA256 | 字节相同 |
| --- | --- | --- | --- |
| data/shrines.json | `4938b62b72cbeed84e85b4d7ae7e37a60e6bd729de17debd2f6f8892c37b3fde` | `4938b62b72cbeed84e85b4d7ae7e37a60e6bd729de17debd2f6f8892c37b3fde` | True |
| assets/hyrule-base.webp | `5847a9e5f5d4ed44bc20b61d2b5c24999c33b796d8a42354946f42c631b4ec10` | `5847a9e5f5d4ed44bc20b61d2b5c24999c33b796d8a42354946f42c631b4ec10` | True |
| THIRD_PARTY_NOTICES.txt | `5cd96ec0a64a180e02eb5f36c03a303218492418ee4533ea1293369a231aca33` | `5cd96ec0a64a180e02eb5f36c03a303218492418ee4533ea1293369a231aca33` | True |

数据结构：136 神庙（120 本体+16 DLC）、15 高塔、205 条物资。仅 `Dungeon017.supplies` 保留 conflict 与三语差异说明。

## 修后源码配对复核

- `MapCanvas.tsx:97–108`：零尺寸、无可见高度、anchor超出可见地图四边时，关闭提示并返回；手机底界扣除实际sidebar。
- `MapCanvas.tsx:147–155`：打开先清理/重算，确认提示仍打开才注册map事件及map/sidebar ResizeObserver。
- `MapCanvas.tsx:142–157`：关闭与移除均调用同一cleanup，配对map.off、observer.disconnect并清空引用。三项人工静态复核通过。
- G1修前失败由父QA实测确认；修后关闭路径已补齐，浏览器几何等待父QA复测，本报告不代签。
- G2旧版Chromium键盘展开面板会自然关闭提示，父QA实测通过，不记业务失败；新增observer作为保障。

## 结论边界

- 这是一份源码静态与现有包读回报告，未运行 build、浏览器或本机服务。
- CSS 声明与 DOM 文本路径已核对；有效像素尺寸、边界夹紧、鼠标离开、触控和当前浏览器 computed style 由父 QA 实测。
- G1修前失败由父QA报告，当前静态关闭路径已补齐；修后几何待父QA复测。G2旧版父QA实测通过，新observer仅增加保障。
- 136 神庙、15 高塔、205 条物资及 017 conflict 仅结构核对；没有重做 277 缓存核验、136 攻略语义或游戏实机核实。
- 哈希和逐字一致证明本地文件未变，不证明远端来源、事实准确性或正式发布。
- 只写 tests/r3/qa_static.py 与 r3/static-package-audit.json、.md；不覆盖 baseline、r1 或 r2。

实际输入/包哈希、每项断言、CSS声明及与 r2 的对照均见 `static-package-audit.json`。
