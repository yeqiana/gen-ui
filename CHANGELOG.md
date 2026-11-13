# Changelog

## Unreleased — 图片预览与折叠导航体验收口（2026-11-13）

- 复用本地图片查看器：正文图片及图片链接在当前页面遮罩打开，支持滚轮缩放、拖动、Esc 关闭和独立全屏，不跳转裸图片地址；不接管导航和品牌装饰图标。
- 左侧导航只让目录 `nav` 滚动，消除侧栏和子目录的双滚动条；去除折叠按钮边框，折叠后文档和报告主体保持居中阅读。
- 折叠状态隐藏独立展开按钮且不留占位，M 标识悬停 / 键盘聚焦切换为展开箭头，单击或 Enter / Space 展开；展开状态保留正常折叠按钮。
- 对应交付规则、Chrome 报告/技术文档/Typograpy 回归及真实浏览器截图已更新；技术文档 15 份/45 个视口场景、Typography 66 场景、报告页及键盘展开验证通过。未重新进行模型盲测，历史单文件内联样式需按需重新生成。


## Unreleased — 中文 HTML 正文断行优化（2026-11-13）

- 修复将英文 `72ch` 直接套用于中文叙述造成的窄列与短尾行：按 `html lang=zh-*` 使用 `46ic` 阅读宽度，在短段落中使用原生 `text-wrap: balance` 和严格中文断行；英文仍为 `72ch`。
- 修订按需 Typography 说明、双语 README 和浏览器测量门禁。表格、代码、图表不套用正文宽度，也不新增脚本或运行时依赖。
- 用现有三类模型生成 HTML 与中英文固定样例进行针对性 Chrome 回归：375 / 768 / 1440px 及目录两态，共 **30/30** 通过；Typography 单元测试 **4/4** 通过。未重新调用模型生成；对其他来源的任意 HTML 不做泛化承诺。
- 已生成的真正独立单文件 HTML 若把 CSS 内联，需更新其内联规则才会获得修复；引用仓库 `assets/typography.css` 的页面可直接受益。


## Unreleased — 阅读层次与多轮评审续接（2026-11-13，未测试）

- 增加按需加载的 `references/reading-layers.md`：简单问题直接回答，复杂内容先展示当前判断、关键依据与限制，详细信息保留可追溯入口，不以折叠代替完整性。
- 为多轮评审提供最小的决策台账与增量表达规则，明确功能覆盖、缺陷处理、验收证据和非致命风险的知情接受条件；只组织信息，不替代实际评审或测试。
- 在核心 Skill 中仅增加条件加载入口，保持 `SKILL.md` 小于 5 KiB；复用现有 Markdown、HTML 与图表能力，零新增运行时依赖。
- 更新中英文入口和多轮评审使用示例；保留工作区其他并行修改及历史评测产物。
- **按用户要求，本轮未运行模型、浏览器或自动化测试；以上为规则与文档落地，不是模型行为验收结果。**


## Unreleased — 轻量 Typography、离线 HTML 导航合约与生成验收（2026-11-13）

- 新增按需使用的 `assets/typography.css`、`references/typography.md`，统一正文阅读行宽、行高与标题节奏；代码、表格、SVG 保持独立宽内容区域，不增加第三方依赖。
- 明确静态 HTML 文档必须使用 `doc-layout` + `doc-toc` + `doc-main` 的真实导航宿主，并提供移动端目录；补齐八类架构案例的移动端目录。
- 升级离线 HTML 静态交付门禁与 Chrome Typography 专项，支持 `.table-wrap` / `.table-scroll`、导航两态和表格自身滚动；集成既有 CI 与本地脚本。
- 保留原生 Codex 三类生成案例的失败原因、对照过程与验收边界。收口后所选三份报告静态检查 3/3、Chrome 18/18；此前仓库 Node.js 测试 144/144、Typography 示例浏览器 66/66、技术文档浏览器 45/45 均通过。
- 由于本机 Codex 工具读取受到执行策略限制，模型输入通过 Runner 只读传递原始 Skill 文件；该结果不等于任意模型、任意输入或自动 Skill 发现的普遍合规认证。
- 本条为仓库改动记录，不代表已经创建 Git Tag、GitHub Release 或发布安装包。


## Unreleased — vNext 能力路由与规范收口（2026-11-13，未测试）

- 细化 Markdown、静态 HTML、复杂 HTML 与专业语义图的按需加载边界，继续限制核心 Skill 的常驻体积。
- 增补四类典型任务的使用示例及中英文入口，强调事实、建议与未验证状态的区分。
- 历史评测和并行工作区文件分类记录独立保存，不删除已有证据，也不触碰其他槽位改动。
- **本轮遵照要求没有运行模型、浏览器或自动化测试；该记录不代表正式验收或发布。**


## Unreleased — 屏幕坐标避让、交互状态一致性和 JSON 图表输入（2026-11-11）

- 修正部署/活动等 SVG 连线标签遮挡，分离标签层并根据实际文字与最终浏览器坐标自动避让。
- 修复思维导图折叠后孤立连线与焦点恢复、ER 隐藏字段后实体外框留白。
- 新增移动端概览/聚焦阅读、全屏退出异常兜底和浏览器事件恢复。
- 增加七类语义图表离线 JSON 输入契约与校验，提供独立的订单 ER / 时序图案例。
- Chrome 回归覆盖中文和英文、375/768/1440px、动态折叠与筛选、真实碰撞、无效模型及全屏故障。


## Unreleased — semantic SVG diagrams and control placement (2026-11-10)

- Replace seven generic node-and-edge examples with diagram-specific semantic SVG models: sequence, mind map, deployment topology, ER, activity, swimlane, and component.
- Add type-specific interactions: sequence stepping, branch expand/collapse, deployment-zone collapse, ER field visibility, activity path filters, swimlane collapse, and component-port visibility; every selectable element updates an inspector.
- Give connector labels opaque backgrounds and dedicated routes; add geometry checks that labels do not overlap nodes.
- Anchor image fullscreen controls to the image upper-right and code-copy icons to the code block upper-right.
- Add Chrome coverage for all seven graph grammars and interactions, connector-label clearance, image/code control placement, and bilingual document rendering.


## Unreleased — SVG, media interaction and navigation reliability (2026-11-10)

- Add one shared offline SVG viewer for report and technical documents with serialized native/fallback fullscreen, zoom/pan, repeatable Escape handling, and consistent line icons.
- Add context-driven sequence, mind-map, deployment, ER, activity, swimlane and component diagrams, with optional double-click node movement and connector tracking.
- Replace visible clipboard messages with Copy/Check/Error SVG icon states that reset after one second; share the renderer across bilingual HTML examples.
- Add a same-page magnifier image viewer with zoom, pan, focus return and Escape; remove trailing blank quote spacing; ensure left-side navigation and local M favicon.
- Expand Chrome regression coverage for repeated fullscreen, fallback, diagram-node movement and image viewer behavior.


All changes are documented in this file. Versions describe repository content, not a published package or live service.

## Unreleased — reader-first information design and bilingual examples (2026-11-10)

- Reframe the Skill around reducing AI answer walls of text, comprehension difficulty, and reading effort; explicitly prefer structure and evidence over decoration.
- Extend `demo/report.html` with ten practical use-case sections and a feature-to-reading-purpose matrix while preserving charts, SVG flow, filters, pagination, code copy, dialogs, drawers, and offline behavior.
- Rewrite Chinese and English READMEs with concise before/after examples, native-language links, and screenshots generated from their corresponding HTML pages.
- Add four standalone English technical-document examples and an English ten-case gallery, plus localized Chinese Markdown examples.
- Remove discoverability/GEO promotion from README prose while retaining the repository's separate research materials; add browser and content-localization regression coverage.
- Keep all illustrative examples clearly distinct from verified code audits, executed tests, or production deployments.

## Unreleased — technical-document HTML examples and README correction (2026-11-09)

- Replace the unrelated business-UI mockups with four substantial technical documents: project analysis, architecture design, implementation plan, and test/acceptance plan.
- Add a consistent article layout with real section navigation, long-form tables, inline SVG architecture/sequence diagrams, code examples, copy controls, responsive reading and print styles.
- Add fixed Chrome and structural tests for all four documents; explicitly label the scenario as sanitized and all unexecuted tests as pending.
- Update bilingual READMEs and Demo navigation so the primary examples demonstrate engineering-document output rather than product UI mockups.

## Unreleased — v1.4.0 readiness work (2026-11-06)

- Record the distinction between GPT-6 + WebCodex saved Agent samples and a **not-yet-completed** native Codex blind run; protect model quota and preserve honest evidence.
- Harden the local HTML server and iframe host boundary with reproducible security regression cases.
- Extend the existing GitHub Actions workflow to execute real Chrome browser regressions, not just JavaScript syntax and Node unit tests; remote CI outcome requires separate verification.
- Publish a bilingual release-readiness checklist, without claiming a Git Tag or Release was created.
- Strengthen the visual contract: collapsed navigation remains a one-column icon rail with an in-rail toggle; simplify heading hierarchy and group related content.
- Prefer meaningful image-and-text explanations, use a restrained number of emoji, and refresh the HTML example to demonstrate the intended ChatGPT-inspired minimal style.

## Unreleased — interactive-user Codex verification evidence (2026-11-05)

- Confirm native Codex CLI authentication from a separate ordinary-permission Windows desktop-user session, correcting the misleading SYSTEM Runner login result.
- Record a real HTML04 model attempt blocked by `exec_command` / Windows `CreateProcess` policy before local file generation; **do not** report a passing Agent benchmark.
- Preserve sanitized machine-readable outcome and safe remediation guidance; leave original WebCodex/StoryOS services intact and unregister the temporary execution task.

## Unreleased — reproducible browser QA and evaluation guardrails (2026-11-05)

- Add a dependency-free, real Chrome smoke suite for the trusted HTML demo at 375/768/1440px, including accessibility focus, module sentinel, tooltips and create feedback.
- Strengthen the offline Agent artifact checker to require table-specific nowrap and first-column sticky declarations, reducing false positives from unrelated CSS; block arbitrary inline event attributes.
- Add negative/positive unit tests for these CSS and script checks.
- Record the actual environment limitation (SYSTEM Runner without Codex auth or a local model), leaving all real-Agent prompt results explicitly unexecuted and preserving quota.
- Save the trusted-demo Chrome result as standalone machine-readable JSON evidence, without misrepresenting it as Agent-produced output.

## Unreleased — targeted accessibility and Agent evaluation fixes (2026-11-05)

- Remove redundant Tab stops from untruncated table text and recompute after rendering or viewport resize.
- Separate the "全部模块" filter sentinel from legitimate module name `all`.
- Add per-record accessible names to repeated detail buttons.
- Add five reusable real-Agent prompt cases and a safe offline output-quality checker, with pass/fail tests and explicit no-model-run provenance.
- Keep original Markdown and HTML output contracts and verify existing functionality.

## Unreleased — reviewed HTML interaction fixes (2026-11-05)

- Position long-text tooltips within actual mobile viewport bounds, measuring the rendered popup dimensions.
- After appending a record, show its destination page, move focus to the new record, and announce success outside the closing dialog.
- Expand the JSON import/export limit to 750000 characters so even a valid 1000-row report with escaped strings can be re-imported after pretty printing.
- Apply HTML rules whenever HTML is the selected artifact, not only when the user names HTML explicitly; retain Markdown as default.
- Complete tab keyboard interactions with Arrow, Home, End and prevented default scrolling, backed by regression tests.

## Unreleased — Chinese HTML experience and GEN-UI branding (2026-11-05)

- Enforce nowrap table headers and cells, sticky first column, horizontal scrolling and overflow-only hover/focus tooltips.
- Bind filters to actual columns (identifier, module, status, batch and duration), with pagination and charts recalculated from one dataset.
- Distinguish internal-page tabs from safe new-browser-tab links using visible Chinese labels.
- Make the report Chinese-first, remove decorative cards, and add accessible local forms, modal and right-side drawers.
- Create eight original GEN-UI SVG icons and a restrained, recurring inspiration-cat signature in navigation/header areas.
- Extend test coverage for filtering, dialogs, tooltips, tab state, icon paths, strict data validation and accessibility structure.

## Unreleased — HTML report enhancements (2026-11-05)

- Define HTML report requirements for semantic left/top navigation, relevant table filters and pagination with 20/50/100-row page sizes.
- Reserve green/red emphasis for top-level success/failure KPI figures and provide accessible text labels.
- Add a separate offline HTML report example with optional pie, bar and line SVG charts, a threshold slider, and validated local JSON data.
- Add regression tests covering pagination, filtering, report validation and DOM interaction; keep the original Markdown and demo protocol intact.

## Unreleased — v1.1 preparation (2026-11-03)

- Switch the normative `SKILL.md` and renderer/integration contracts to English while keeping Chinese responses supported.
- Add realistic Markdown examples for code review, feature acceptance and Java thread-pool education.
- Add a searchable FAQ, GEO discoverability foundation, Chinese GEO summary and **unmeasured** baseline.
- Extend repository tests for consistent English-first behavior, local links, examples and discoverability documentation.
- Preserve the offline demo's illustrative protocol and existing security limits.

## v1.0 (2026-11-03)

- Introduce Markdown-first Gen UI Skill and the local `gen-ui-demo/v1` browser demonstration.
- Add bilingual READMEs, agent metadata, GitHub Actions, protocol constraints and Node.js tests.