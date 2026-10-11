# GitHub Pages 前端路径适配

基线：main `46e7d447c8f76685b5f50f5be3403ece4c0540ff`，修改前工作树干净。用户已授权部署；本角色只处理前端资源路径，不执行远端发布。

修改`src/App.tsx`资料fetch和`src/components/MapCanvas.tsx`底图URL，均以`import.meta.env.BASE_URL`拼接相对资源路径。新增`src/vite-env.d.ts`引入Vite客户端类型。默认base为`/`时保持原本机路径；Pages的`/zelda_map/`构建正确生成两个子路径。不改布局、资料、进度、package/config/README/workflow，也未重启或另启5173服务。

实际验证均通过：

- `npm run build`：类型检查和默认Vite生产构建通过，44模块。
- `npm run build -- --base=/zelda_map/ --outDir=.runtime/pages-dist`：类型检查和子路径构建通过，44模块。
- Pages JS包含`/zelda_map/data/shrines.json`与`/zelda_map/assets/hyrule-base.webp`；对应JSON与底图均已复制到输出目录。

这是构建与产物路径验证，线上资源读回与部署结果由主代理后续验证。

| 文件 | SHA256 |
| --- | --- |
| src/App.tsx | 74774e625ce97d2bc800020d75aa32bc915038ac2dc462e5eeb3cebb1eedc491 |
| src/components/MapCanvas.tsx | 16437fe5ad2dd1f0bffa670c4dd2dd5243749b7c0160278700fc0e13436afe29 |
| src/vite-env.d.ts | 65996936fbb042915f7b74a200fcdde7e410f32a669b1ab9597cfaa4b0faddb5 |
| dist/index.html | 8d601784ed415a9e0f6467ae01cd6aa7c26af885a52be54a52b19842e6134b92 |
| .runtime/pages-dist/index.html | 790d3421ce19926fe9a9e0f39264c3bb959fb962cb9d3260de8a106e2f2f905e |
| .runtime/pages-dist/assets/index-BFv0OzPl.js | 963b66d65b234bba34c7c52780f815c6e660b8b552e3d32182a4112e8c34cd39 |

## 公开部署页脚文案适配

按主代理确认，仅将i18n的localPreview三语改为浏览器保存说明：中文“进度保存在本浏览器”、英文“Progress saved in this browser”、日文“進捗はこのブラウザに保存”。键名和布局保持，公开页面不再显示本机预览文案。修改后重建Pages产物，最终hash见下方。

Pages构建：类型检查与Vite通过（44模块）。最终SHA256：

| 文件 | SHA256 |
| --- | --- |
| src/i18n.ts | 807d1fbd4e6c3b44ec703df2a7baddc867a424f2d66a99ab67961f6121e965a3 |
| .runtime/pages-dist/index.html | 57f8e16d35860887f6d759326f494287b36bd0b770f9c060e9768248d9b240fb |
| .runtime/pages-dist/assets/index-DXrBoT9O.js | 66a52de739fd044d267229550b4e7290e6d451521ea3d8651a3dd921348ed5f6 |
