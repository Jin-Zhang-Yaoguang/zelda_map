# 海拉鲁神庙地图

《塞尔达传说：旷野之息》个人神庙地图，v0.2.0 已完成本机验收，支持邮箱注册、密码登录、云端进度同步和访客模式；正式网站由 GitHub Pages 发布。

## 在线访问

[打开海拉鲁神庙地图](https://jin-zhang-yaoguang.github.io/zelda_map/)

访客完成记录保存在当前浏览器和网址下；登录后按账号同步云端进度。迁移旧本机访客记录时，先在原页面导出备份，再在目标网页导入并预览合并或替换。

GitHub Pages由Actions自动构建和部署；main中的产品文件更新会触发发布，也可手动运行Deploy map to GitHub Pages。网站子路径由Pages元数据传给Vite，资料和底图跟随BASE_URL加载。

## 本机运行

需要 Node.js 22.12+（当前使用 Node.js 24）。

```sh
npm install
npm run dev
```

在浏览器打开 `http://127.0.0.1:5173/`。开发服务固定端口，完成记录保存在这个浏览器和网址下。

```sh
npm run build
npm run preview
```

本版包含本体 120 座、DLC 16 座神庙。默认中文，可切换 English 与日本語；设置页的 DLC 开关与地图快筛同步，隐藏 DLC 不删除完成记录。地图只展示基础入口信息，物资与谜题攻略位于独立详情页的折叠区。设置页可导出和导入进度备份。

神庙默认在所有缩放等级显示，不聚合；左侧“显示神庙”位于 DLC 开关上方，与设置页同步并在本机保存。关闭只隐藏地图标识，保留列表和完成记录。地图神庙符号 36px、点击区域 44px；15 座高塔仍在远景显示，点击可定位，高塔不计入神庙完成记录。

## v0.2.0 账号与接入

访客模式继续保存在当前浏览器。账号模式使用 Supabase，按登录用户隔离神庙完成记录；语言和 DLC 显示偏好仍保存在本机。跨网址的旧访客记录需要在原页面导出 JSON，再在目标页面导入，登录无法读取另一个网址的浏览器数据。

复制 `.env.example` 为 `.env.local`，填写项目 URL 和 publishable key。没有云配置时仍可使用访客模式。数据库密码、管理密钥和 SMTP 密码不能使用 `VITE_` 前缀，也不能提交到仓库。

接入与验证边界见 [Supabase 配置说明](docs/dev_new_version/v0.2.0/supabase_setup.md)。迁移位于 `supabase/migrations/`。GitHub Pages 构建读取仓库 Variables 中的 `VITE_SUPABASE_URL`、`VITE_SUPABASE_PUBLISHABLE_KEY`。当前仅邮箱注册/密码登录，保留访客，不接 GitHub 登录或邮件服务。Confirm email 已获本人许可关闭，注册至少 8 字符；邮箱不验证归属，没有邮件找回密码。密码由 Supabase Auth 处理，不进入进度备份。有限真实 API 联调已通过，完整边界见测试报告；v0.2.0 已获本人验收与 GitHub/Pages 发布授权，实际部署与线上验证记录见版本目录。

登录后须先读取该账户的云记录，再标记神庙。写入先保存在该账户的本机队列，服务器确认后才显示“云端已同步”；离线和失败时保留待同步记录。遇到同座神庙的并发修改，需要重新选择保留本机或云端结果。迁移支持合并或替换，先保存操作前备份，再以整批方式提交，保留原访客记录。

## 数据与维护

- `scripts/collect_sources.py`：采集公开坐标、三语名称与神庙事实参考，缓存原始研究资料。
- `scripts/collect_chests.py`：采集公开游戏物件中的神庙宝箱事实。
- `scripts/build_data.py`：核对并合并逐座原创三语说明，生成生产数据。
- `data/content/`：原创说明与通关要点。公开参考原文仅作研究缓存，不作为页面正文发布。
- `public/data/shrines.json`：实际页面使用的版本数据与字段来源。
- `docs/dev_new_version/`：各版本的需求、设计、测试与验收记录。

更新源数据需要联网，运行页面使用本地概览、分级高清瓦片与已经生成的数据。原生瓦片最高24000×20000，按视野加载，逻辑点位坐标不变。名称采用公开游戏文本中的官方名称；说明和攻略为本站整理与译述，不能混同官方指南。

资料采集需要 Python 3.9+、curl 和 BeautifulSoup（本轮使用版本4.15.0）：`python3 -m pip install -r requirements-data.txt`。离线生成器只使用 Python 标准库。QA浏览器脚本记录了本机 Codex runtime/Chromium 路径，异机运行需调整环境；完整验证命令见版本测试报告。

## 来源

主要交互参考：[Zelda Dungeon BOTW 互动地图](https://www.zeldadungeon.net/breath-of-the-wild-interactive-map/)。

神庙点位、地区边界与底图来自 [ZeldaMods Object Map](https://objmap.zeldamods.org/)，物资来自 [ZeldaMods Radar](https://radar.zeldamods.org/)，名称与物品译名来自 [BotwText](https://sh0wer1ee.github.io/BotwText/)，逐座事实参考为 [Zelda Wiki](https://zeldawiki.wiki/)。各字段在生产数据中关联到具体来源与采集哈希。

这是非官方个人工具。游戏图像与游戏文本属于各自权利人；来源说明见 [数据说明](docs/data_sources.md)。

第三方运行依赖的许可文本随产物保存在 [THIRD_PARTY_NOTICES.txt](public/THIRD_PARTY_NOTICES.txt)，在线页面也保留该文件与资料来源。非官方归属与素材使用边界见 [数据说明](docs/data_sources.md)。

地图修订：神庙默认在所有缩放等级显示，左侧“显示神庙”位于DLC开关上方；只控制地图标识，列表和进度保留。符号36px、命中44px；原偏好缺少新字段时默认开启。原PNG镜像工具 `python3 scripts/collect_map_tiles.py` 默认只预览，`--download` 可断点收集，已有完整资产时只核验哈希而不重复联网。所需Python库为Pillow，不参与网页运行。v0.2.0 已通过本人验收，发布状态与线上验证以版本10记录为准。
