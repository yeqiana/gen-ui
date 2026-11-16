# Changelog

## Unreleased — 信息设计 Skill 与对照组稳定性评测（2026-11-16）

- 固定 `6676adec`、4 个原始提示词和原生 `claude-sonnet-5`，4 槽并发完成 Skill / 非 Skill 各 12 次对照；24/24 正常退出。
- 新增零依赖离线评分脚本与 5 项回归单测；初筛 11/12 对 9/12，预设证据词项两组均 60/60，Skill 实际触发仅 3/12。
- 人工复核发现 R2 缺证据被误写成“未实现”、QR01 的 SHA 来源推断越界，以及正文冗余并无一致改善。**不据此宣布 GEN-UI 显著优于对照，也不修改核心 Skill。** 详见 [完整评测](evals/review-continuity-stability-2026-11-16.md)。


## Unreleased — 信息分层与多轮评审连续性（2026-11-16）

- 精简核心 `SKILL.md` 至 **5,099 B**，继续保持 Markdown 默认；多轮续评及风险/收口判断才按需加载阅读分层参考，不引入新框架。
- 补齐「缺验收证据 ≠ 未实现」「风险接受有范围与期限」「生产放行条件和结论必须一致」；按议题 ID 续接本轮变化、旧证据与未决项。
- 新增 4 个隔离评测案例和轻量合约测试；真实模型抽检发现两类错误并专项复测纠正，保留真实失败过程，不宣称同一最终版本模型 4/4 全量通过。详见 [专项验收](evals/reading-continuity-2026-11-16.md)。


## Stable baseline — 三主题独立生成与离线资源交付（2026-11-16）

- 增加零第三方依赖的 `scripts/prepare-html-assets.mjs`，一次性准备 7 个离线公共资源，幂等且拒绝覆盖不同内容；Skill 先交付 HTML，再补 SVG，避免模型耗尽回合但没有报告。
- 修复完整 HTML 规范中残留的 72ch 正文硬限宽表述；修复 `.doc-summary strong` 误把正文加粗词变成块导致过早换行。
- Typography 验收检查真实段落及父容器宽度，覆盖没有特定 class 的实际中文正文。三主题在本地 Runner 预置标准资源后独立生成 3/3，Chrome/内容 179/179、Typography 18/18，原有文档 45/45。
- 单独验证 1 例未点名 Skill 的自动发现成功。明确区分模型生成与 Runner 资源交接，详情参阅 [阶段报告](evals/independent-html-stability-2026-11-16.md) 和 [稳定基线](docs/stable-baseline-2026-11-16.md)。


## Unreleased — 折叠侧栏 CSS 去重（2026-11-16）

- 移除重复的 40px/36px 按钮定义、旧 M 图路径和已覆盖的 hover/目录间距规则；保留单一默认 M、悬停展开箭头及淡蓝背景。
- 删除文档正文已无作用的局部宽度 Token 覆盖，避免继续叠加“后面再写一条”的修复模式。
- 运行 Chrome 折叠阅读正反例、Typography 66 场景、技术文档 45 场景、报告页与 4 项合约单测均通过。[审计记录](evals/css-consolidation-2026-11-16.md)。
- 补齐页面初始折叠的 Chrome 门禁：先验证默认 M 可见，再统一展开/折叠测试，避免错误的点击状态造成虚假失败；新增初始折叠夹具，真实 StoryOS 原始生成报告重新验收 62/62、Typography 6/6，其他 2 个独立生成案例仍未交付。


## Unreleased — 折叠后正文与 M 品牌图标回归修复（2026-11-16）

- 移除部分叙述性段落、blockquote、callout 和图/表紧邻正文残留的 62ic/72ch 硬限宽；修正旧 CSS 选择器优先级导致的修复失效，段落回归章节真实行宽。引用保留小幅内边距，不叠加默认 40px 左外边距。
- 修复折叠品牌同时渲染 CSS M 伪元素和 HTML 内置 img 导致两个图标上下挤占甚至裁切：默认只显示一个可见 M，悬停同位置切换箭头。
- HTML 交付门禁增加正文、引用、图表前后段落的真实行宽/缩进以及 M 默认可见性/重复检查；新增自动正反例 Chrome 测试和截图。StoryOS CSS 适配预览 58/58、原有技术文档 45/45、Typography 66/66、单元测试 4/4 通过。详情参阅 [回归报告](evals/folded-reading-regression-2026-11-16.md)。


## Unreleased — HTML 标题自然换行与验收漏检修复（2026-11-16）

- GEN-UI 生成 HTML 的 H1–H4 标题改为优先利用所在章节的可用宽度，自然换行；禁止模型滥用均衡换行、狭窄 `max-width` 或人为 `<br>` 造成尚未到边界便断行。
- 扩展 HTML 交付门禁和 Typography Chrome 检查，实测标题元素、父内容区、首行宽度与换行类型；新增零第三方依赖的正反例回归 `node tests/chrome-heading-wrap-regression.mjs`。
- 1440px 长标题正例：首行 1045/1051px；负例：首行仅 680/1051px。旧门禁错误地两者均 46/46 PASS；新门禁正例 51/51 PASS、负例 375/768/1440px 及折叠态均按预期 FAIL。
- 原生 Codex 已生成的 StoryOS 原件不修改；生成报告验收 55/55、Typography 66/66、技术文档 45/45、合约单测 4/4 通过。详情见 [2026-11-16 标题排版回归](evals/heading-natural-wrap-2026-11-16.md)。


## Stable baseline — 原生 Codex 独立生成验收与功能冻结（2026-11-14）

- Windows 桌面用户原生 Codex 的全新会话首次实现真正独立生成 StoryOS HTML；不注入旧报告或 Skill 正文，HTML 静态 PASS、交互 46/46、Typography 6/6。
- 新增可选 `--require-text TERM` 内容相关性门禁；成功样本 50/50 PASS，之前跑题的 HTML 由 39 项页面 PASS 转为内容项 FAIL；不把关键词命中等同于完整语义审核。
- 归档模型原样输出的离线 HTML 与本地静态资源及 SHA-256 清单，不公开桌面账户凭据、原始事件日志和私有路径。
- 基线功能冻结，后续仅处理有明确证据的缺陷及安全修补。详情参阅 [冻结记录](docs/release-freeze-2026-11-14.md)。


## Unreleased — 修复中文正文过早断行（2026-11-14）

- 根因：此前为中文正文统一启用 `text-wrap: balance`，它会主动缩短长段落各行；叠加 `46ic` 限宽，真实 StoryOS 报告 1440px 下章节宽 755px，但正文首行仅约 504px，空余约 251px。
- 将中文正文调整为 `text-wrap: wrap` 自然换行，中文超宽阅读上限放宽到 `62ic`；普通技术文档的中文段落同步更新，英文仍保留 72ch。章节布局、表格、代码和导航不强制使用相同限宽。
- 浏览器门禁增加正文实际可用内容宽度与首行填充度检查，避免再次仅以“未溢出/发生换行”判通过；离线报告与截图已同步重测，历史均衡换行规则留作既往记录。


## Unreleased — 折叠导航紧凑对齐与交付门禁接线（2026-11-14）

- 将技术文档和报告的折叠侧栏统一为桌面约 58px（报告窄屏 56px），技术文档折叠后左侧页面留白由 42px 收窄至 14px；M、展开箭头和目录图标统一一条中心线，点击区域 36px、图标 18px，悬停底色使用 `rgba(58,131,247,.04)`。
- HTML 交付门禁增加真实像素坐标、侧栏宽度、悬停背景透明度断言；旧的“只检查外层 main”以及图标显示检查不能替代实际布局验收。
- 在 `SKILL.md`、HTML Essentials 与 `scripts/test-skill.ps1` 中按需接入交互验收入口：默认仍只走轻量静态门禁，用户要求交互验收时才调用本地 Chrome；不新增第三方依赖。
- 本轮 StoryOS 实际文件复测 43/43 通过，报告页及技术文档浏览器回归通过。保留历史模型生成来源边界；尚未重新调用模型或进行通用自动发现盲测。


## Unreleased — StoryOS 真实 HTML 交付一致性验收（2026-11-14）

- 新增零第三方依赖的 `scripts/accept-html-delivery.mjs`，检查实际阅读区居中、导航/图片交互、离线资源与响应式布局，保存 Chrome 截图和 JSON。
- 通过历史原生 Codex 生成的 StoryOS 报告发现旧门禁的假阳性：外层 `main` 居中，真正的阅读块仍偏左；先复现失败，再修复折叠后章节内容的对齐。
- 适配版和离线交付包均为 39/39 通过；原有技术文档 45 场景、StoryOS Typography 6 场景通过；无图片与查看器脚本缺失的负例按预期失败。
- 本轮仅适配历史模型内容，**未重新调用模型生成**，不能据此声明模型自动发现 Skill 或独立遵守新规则；无新增运行时依赖。


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