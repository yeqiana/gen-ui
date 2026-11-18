# 生成 HTML 的轻量排版层（按需）

仅在交付离线 HTML/网页报告时启用；Markdown、JSON Renderer 与普通答复无需加载样式。参考 *The Elements of Typographic Style* 的阅读节奏，不宣称书籍提供网页合规认证。

## 使用方式

- 多文件 HTML：以正确的本地相对路径引用仓库 `assets/typography.css`；用户要求真正独立单文件时，将该 CSS 的少量规则内联，不添加远程资源，也不额外引入依赖。
- 正文主容器加 `class="genui-typography"`（例：`<main class="doc-main genui-typography">`），叙述性的段落、列表、引用加 `class="genui-prose"`；或用 `<div class="genui-prose-group">` 包围只含叙述内容的正文。**不要**给包含 table、pre、SVG、Canvas、figure 或交互控件的容器加 `genui-prose`。
- **默认宽幅报告和技术文档**：正文、H1–H4、列表和 callout 的**外框**与所属章节左边缘对齐，按章节实际宽度自然换行；不得对单独段落设置居中窄栏。图表、代码、SVG 和架构图保留宽容器与必要的内部滚动。系统字体正文 14px，代码 12px；普通行高 1.65、相邻段落间距 `.85em`、小标题上间距 `1.25em`；已有技术文档可继续使用 1.85 倍行高。
- **仅显式纯文章模式**可启用有界阅读列：将同一章节的标题、段落、列表一起放入 `.genui-article-column`，中文建议约 `62ic`、英文约 `72ch`，实际按浏览器检查调整；不得给每段文字单独施加阅读宽度。
- **侧栏宽度不影响正文阅读列：** 在同一视口下，侧栏展开、折叠后 `main` 内容区域及其段落、标题宽度保持一致；宽屏使用原折叠态阅读宽度上限，空间不足时两状态共同按展开侧栏所需空间缩小。导航宽度可调时亦须保持此不变量。勿用折叠状态单独放大 `main`；移动端的原生目录切换不改变正文区域。
- 正文与 H1–H4 均使用 `text-wrap:wrap`、`word-break:normal`；禁止全局 `balance/pretty`、人为 `<br>`、多余的 `max-width` 和非必要 `text-indent`。列表仅保留项目符号缩进（约 24px），引用块可以有约 14px 的**内部**间距，但外框必须与章节起点对齐；引用后正文不继承内缩。标题的自然短尾不能通过缩窄整个标题来掩盖。701–900px 若固定目录会挤压内容，则改为可展开目录；表格、代码、图表自身独立滚动。
- 标题沿用语义化 H1–H4 与原有编号规则；不要靠加粗文字模拟层级，也不要为了填满画布添加装饰性内容。
- **导航和长代码兜底：** 标准静态文档结构为 `div.doc-layout > aside.doc-toc + main.doc-main.genui-typography`；同时加载实际可访问的 `demo/documents/assets/document.css`、`assets/heading-nav.css`、`assets/heading-nav.js` 和 `assets/typography.css`，不能仅引用 JS 而缺乏布局或父容器。375px 下侧栏隐藏时，`main` 顶部必须另有 `<details class="mobile-toc">` 及有效静态锚点。`pre` 即使不位于 `.doc-section` 内，也必须限定为画布宽度并在自身横向滚动，禁止撑大整页；Typography CSS 已提供兜底。

## 验收

1. 首先执行 `node scripts/validate-html-report.mjs <report.html>`，确认导航、离线资源与基础交付合约。
2. 对使用此排版层、含真实导航的生成 HTML，执行 `node tests/chrome-typography-smoke.mjs --generated <report.html>`：检查 375/768/1024/1440px、桌面导航展开/折叠与平板目录，正文/标题起点一致、自然文字行框、无裁切、没有非文章模式下的提前限宽；错误的窄栏与标题均衡必须由反例验收拦截。
3. 原有 Demo 仍执行 `node tests/chrome-typography-smoke.mjs`。浏览器缺失、模型未真实生成或案例未经跑测时，不宣称其已经通过。测试夹具验证机制，不能代替实际模型生成实验。
