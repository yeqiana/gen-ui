# 生成 HTML 的轻量排版层（按需）

仅在交付离线 HTML/网页报告时启用；Markdown、JSON Renderer 与普通答复无需加载样式。参考 *The Elements of Typographic Style* 的阅读节奏，不宣称书籍提供网页合规认证。

## 使用方式

- 多文件 HTML：以正确的本地相对路径引用仓库 `assets/typography.css`；用户要求真正独立单文件时，将该 CSS 的少量规则内联，不添加远程资源，也不额外引入依赖。
- 正文主容器加 `class="genui-typography"`（例：`<main class="doc-main genui-typography">`），叙述性的段落、列表、引用加 `class="genui-prose"`；或用 `<div class="genui-prose-group">` 包围只含叙述内容的正文。**不要**给包含 table、pre、SVG、Canvas、figure 或交互控件的容器加 `genui-prose`。
- **默认按章节自然宽度排版。** 宽幅报告与技术文档的标题、正文、列表外框及宽图表共享章节左侧基线；段落默认 `max-width:100%`、`margin-inline:0`、`text-indent:0`、`text-wrap:wrap`，不得只把正文缩窄居中。容器宽度由导航和视口决定。正文 14px、行高约 1.65、段落间距 `.85em`、小标题上距 `1.25em`；技术文档已有 1.85 倍行高可保留。表格、代码和图表在自己的容器内横向滚动。
- **只有显式纯文章模式才能使用窄阅读栏。** 将文章标题和正文一起放入 `<div class="genui-article-reading">...</div>`，整体以建议的中文 `62ic` / 英文 `72ch` 作为行宽上限并居中，而不是分别给段落、列表或引用加居中限制；宽图、表格和代码留在文章阅读容器外。`ch` 不是汉字数；引用、callout 可保留语义内边距，列表仅保留项目符号的必要缩进。
- **自然换行及标题层级：** H1–H4 保持语义和原有编号，正文与标题默认 `text-wrap:wrap`、`word-break:normal`、`overflow-wrap:break-word`，禁止全局 `balance/pretty`、人为 `<br>`、额外首行缩进及窄标题。小屏发生自然短末行可以记录为阅读风险，但不能通过强迫标题提前换行掩饰。不得靠加粗模拟层级。
- **导航和长代码兜底：** 标准静态文档是 `div.doc-layout > aside.doc-toc + main.doc-main.genui-typography`，正确加载 `demo/documents/assets/document.css`、`assets/heading-nav.css/js` 和 `assets/typography.css`。375px 隐藏侧栏时 `main` 顶部必须有 `<details class="mobile-toc">`；701～900px 改用可展开目录，不再压窄章节。`pre` 限定在画布内自身横向滚动。

## 验收

1. 首先执行 `node scripts/validate-html-report.mjs <report.html>`，确认导航、离线资源与基础交付合约。
2. 对使用排版层的生成 HTML 执行 `node tests/chrome-typography-smoke.mjs --generated <report.html>`；检查 375/768/1024/1440px、展开/折叠侧栏、真实行框及标题/正文/表格起始 X 坐标、列宽、裁切。默认正文不以 `48ic/72ch` 上限作为通过条件。
3. 原有 Demo 仍执行 `node tests/chrome-typography-smoke.mjs`。浏览器缺失、模型未真实生成或案例未经跑测时，不宣称其已经通过。测试夹具验证机制，不能代替实际模型生成实验。
