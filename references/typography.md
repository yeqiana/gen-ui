# 生成 HTML 的轻量排版层（按需）

仅在交付离线 HTML/网页报告时启用；Markdown、JSON Renderer 与普通答复无需加载样式。参考 *The Elements of Typographic Style* 的阅读节奏，不宣称书籍提供网页合规认证。

## 使用方式

- 多文件 HTML：以正确的本地相对路径引用仓库 `assets/typography.css`；用户要求真正独立单文件时，将该 CSS 的少量规则内联，不添加远程资源，也不额外引入依赖。
- 正文主容器加 `class="genui-typography"`（例：`<main class="doc-main genui-typography">`），叙述性的段落、列表、引用加 `class="genui-prose"`；或用 `<div class="genui-prose-group">` 包围只含叙述内容的正文。**不要**给包含 table、pre、SVG、Canvas、figure 或交互控件的容器加 `genui-prose`。
- 正文使用系统字体和 14px 字号，代码保持 12px。保留英文 `72ch`、中文 `62ic` 作为排版参考 Token，**不是普通正文、引用或图表相邻段落的硬性截断宽度**：这些内容在所属章节内 `max-width:100%` 自然填满。行高 1.65、相邻段落间距 `.85em`、小标题上间距 `1.25em`；技术文档可局部采用已有的 1.85 倍行高。
- **72ch 不是 72 个汉字**。普通中文段落、引用块中的段落、callout 文本，以及紧跟图、表、引用的段落均使用 `text-wrap:wrap` 和所属章节真实内容宽度；不要让旧 `72ch/62ic` 限制在折叠后留下大量右侧空白。段落正文不可使用 `balance/pretty`、额外首行缩进、异常水平 margin 或人为 `<br>`。引用块本身可以保留小幅（约 14px）内边距和左侧强调线，但不能重复叠加浏览器默认的 40px 左外边距。标题始终占满所属阅读列，使用 `text-wrap:balance` 仅均衡多行标题、避免末行孤字；禁止把标题 `max-width` 缩至阅读列的一部分，也不要人为 `<br>`；不改变代码、图表与宽表格的独立滚动。
- 标题沿用语义化 H1–H4 与原有编号规则；不要靠加粗文字模拟层级，也不要为了填满画布添加装饰性内容。
- **导航和长代码兜底：** 标准静态文档结构为 `div.doc-layout > aside.doc-toc + main.doc-main.genui-typography`；同时加载实际可访问的 `demo/documents/assets/document.css`、`assets/heading-nav.css`、`assets/heading-nav.js` 和 `assets/typography.css`，不能仅引用 JS 而缺乏布局或父容器。375px 下侧栏隐藏时，`main` 顶部必须另有 `<details class="mobile-toc">` 及有效静态锚点。`pre` 即使不位于 `.doc-section` 内，也必须限定为画布宽度并在自身横向滚动，禁止撑大整页；Typography CSS 已提供兜底。

## 验收

1. 首先执行 `node scripts/validate-html-report.mjs <report.html>`，确认导航、离线资源与基础交付合约。
2. 对使用此排版层、含真实左侧导航的生成 HTML，执行 `node tests/chrome-typography-smoke.mjs --generated <report.html>`：检查 375/768/1440px、展开/折叠、真实文本行框、裁切、横向溢出、标题及宽内容。
3. 原有 Demo 仍执行 `node tests/chrome-typography-smoke.mjs`。浏览器缺失、模型未真实生成或案例未经跑测时，不宣称其已经通过。测试夹具验证机制，不能代替实际模型生成实验。
