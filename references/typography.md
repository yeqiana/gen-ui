# 生成 HTML 的轻量排版层（按需）

仅在交付离线 HTML/网页报告时启用；Markdown、JSON Renderer 与普通答复无需加载样式。参考 *The Elements of Typographic Style* 的阅读节奏，不宣称书籍提供网页合规认证。

## 使用方式

- 多文件 HTML：以正确的本地相对路径引用仓库 `assets/typography.css`；用户要求真正独立单文件时，将该 CSS 的少量规则内联，不添加远程资源，也不额外引入依赖。
- 正文主容器加 `class="genui-typography"`（例：`<main class="doc-main genui-typography">`），叙述性的段落、列表、引用加 `class="genui-prose"`；或用 `<div class="genui-prose-group">` 包围只含叙述内容的正文。**不要**给包含 table、pre、SVG、Canvas、figure 或交互控件的容器加 `genui-prose`。
- 正文使用既有系统字体和 14px 字号，代码保持 12px。英文默认阅读宽度 `min(100%,72ch)`，中文页面 (`lang=zh-*`) 使用 `min(100%,46ic)`；行高 1.65、相邻段落间距 `.85em`、小标题上间距 `1.25em`。技术文档等已有 1.85 倍行高可局部覆写 `--genui-prose-leading`，不强制同一密度。
- **72ch 是英文字符宽度基准，不是 72 个汉字**；中文的 `46ic` 用全角字符宽度描述阅读列宽，并仍受手机/侧栏布局约束。中文短段落使用原生 `text-wrap: balance` 减少“只剩两三个字的尾行”，不支持该属性的浏览器自然降级为普通换行。只按自然语义分段，不用 `<br>` 或逐句单独一段强行凑行；保持技术术语、数字、代码、引用原意。折叠导航仅扩大内容画布，不使正文超过阅读宽度；表格、代码、流程图使用自己的横向空间或滚动容器，不受正文行宽约束。禁止把正文宽度限制加到所有 `main` 子元素。
- 标题沿用语义化 H1–H4 与原有编号规则；不要靠加粗文字模拟层级，也不要为了填满画布添加装饰性内容。
- **导航和长代码兜底：** 标准静态文档结构为 `div.doc-layout > aside.doc-toc + main.doc-main.genui-typography`；同时加载实际可访问的 `demo/documents/assets/document.css`、`assets/heading-nav.css`、`assets/heading-nav.js` 和 `assets/typography.css`，不能仅引用 JS 而缺乏布局或父容器。375px 下侧栏隐藏时，`main` 顶部必须另有 `<details class="mobile-toc">` 及有效静态锚点。`pre` 即使不位于 `.doc-section` 内，也必须限定为画布宽度并在自身横向滚动，禁止撑大整页；Typography CSS 已提供兜底。

## 验收

1. 首先执行 `node scripts/validate-html-report.mjs <report.html>`，确认导航、离线资源与基础交付合约。
2. 对使用此排版层、含真实左侧导航的生成 HTML，执行 `node tests/chrome-typography-smoke.mjs --generated <report.html>`：检查 375/768/1440px、展开/折叠、真实文本行框、裁切、横向溢出、标题及宽内容。
3. 原有 Demo 仍执行 `node tests/chrome-typography-smoke.mjs`。浏览器缺失、模型未真实生成或案例未经跑测时，不宣称其已经通过。测试夹具验证机制，不能代替实际模型生成实验。
