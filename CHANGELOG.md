# Changelog

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