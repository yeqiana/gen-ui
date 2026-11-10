---
name: gen-ui
description: Use when AI responses become hard to understand, too long, or difficult to navigate. Turn complex technical explanations, reviews, plans, comparisons, and test evidence into clear, accurate, readable information. Use Markdown by default and interactive HTML only when requested and supported.
---

# Gen UI — Information Design Skill for AI Responses

## Purpose and priority

Gen UI reduces **walls of text, comprehension effort, and reading friction** in AI-generated answers by reorganizing information around reader questions. It is an information-design contract, not merely a UI makeover, tool runner, code-review replacement, or official ChatGPT UI/DIL runtime.

**The goal is understanding, not decoration:** preserve facts, caveats, evidence, decisions, and next actions while using the simplest structure that makes them easier to follow. A beautiful page with missing information or fake interaction is a failure.

Follow the user's language unless explicitly requested otherwise. The normative rules in this file are in English; Chinese answers and examples remain supported.

**Authority:** user instructions and project-specific safety, coding, review, and test requirements take precedence over this presentation Skill. Never conceal failures, skip verification, or invent tool results to make an answer look polished.

## Robust offline diagrams, copy controls, and images

- **Navigation is mandatory for HTML documents:** default to a visible left-side navigation or TOC; narrow screens may collapse it into a compact accessible menu. Never replace the main content with navigation or leave a long HTML report unnavigable.
- **Use the current M-shaped personal IP favicon** (`assets/icons/gen-ui-mark.svg`) consistently in every standalone browser tab and portal shell; keep the local relative path correct.
- **Choose diagram types from the document's informational purpose:** sequence diagrams for call order; mind maps for conceptual grouping; deployment/topology for runtime nodes; ER for persisted entity relationships; activity diagrams for decision flow; swimlanes for cross-role responsibilities; component diagrams for module dependencies. Do not add every type by default to every document, and provide a text explanation and accessible `<title>`/`<desc>`.
- **Diagram invariants:** at most one fullscreen transition may be in progress. Fullscreen enter/exit, Escape, browser-driven exits, fallback overlay, fit, zoom and panning are idempotent and preserve a consistent view. Use local SVG line icons inspired by familiar zoom-in/zoom-out, fit-to-view and expand/shrink conventions, with `aria-label`, title and focus affordance. Never replace a button's icon with text on state changes.
- **Avoid occlusion:** place labels with adequate node spacing, route connectors behind nodes, and leave enough space for captions. Optional node dragging requires an explicit double-click or keyboard activation, pointer ownership, movement bounds, overlap prevention and connector updates. Document and test these rules.
- **Code copy is icon-only:** use a Copy icon at rest, Check icon after a confirmed successful copy, Error icon after failure; revert to Copy after **1,000 ms**, including repeated clicks and older timer cancellation. No visible copied/clipboard status phrases. Preserve an accessible changing name and genuine offline fallback.
- **Quoted callouts:** the final nonempty content line should end the colored quote region, without an extra blank quoted line. Remove trailing empty nodes, cancel trailing paragraph margins, and preserve the semantic colors for warnings/confirmation.
- **Images:** meaningful report images gain a magnifier button to open a same-page fullscreen-style overlay, then zoom in/out, fit, pan, Escape/close, and return focus to the opener. Decorative images and branding must not receive an image viewer; controls must work offline.
- **Verify real browser behavior:** include repeated fullscreen toggle/ESC/re-entry, native API rejection fallback, zoom/pan before and after fullscreen, copy reset after one second, image overlay closure and focus return, node movement/edge tracking and layout overflow at mobile/tablet/desktop widths.

## 1. Detect host capabilities before choosing a format

| Host | Safe assumption | Preferred output |
| --- | --- | --- |
| Plain terminal, Codex CLI, Claude Code CLI, logs | Text and limited Markdown | Structured Markdown / plain text |
| GitHub, IDE Markdown preview | GFM; Mermaid only when available | Markdown, accessible fallback for diagrams |
| Explicitly configured Web or Webview Renderer | Only components declared by host | Validated UI data **plus** complete Markdown fallback |
| Unknown | Markdown only | Never emit pretend interactive controls |

**Decision:** If the host has not explicitly declared a trusted renderer and its accepted schema, do not output UI protocol JSON as the primary answer. Do not assume that a Skill, a prompt, or a Markdown viewer can activate functional sliders, charts, forms, or buttons.

**HTML deliverables:** When HTML is explicitly required or selected, follow the mandatory [HTML Report Contract](references/html-report-contract.md). Choose compact field-appropriate filters, provide column visibility for wide tables, style only absolute HTTP(S) URLs as external links, place cited public sources at the bottom, keep modal fields nonwrapping, stamp report generation time to seconds, and include the GEN-UI personal mark as the local favicon. Do not force interactive controls into long-form documents that do not need them.

## Reader-first transformation procedure

1. **Identify the reader's question:** what needs to be understood, compared, decided, verified, or done?
2. **Extract the information hierarchy:** conclusion, evidence, assumptions, risks, decisions, and next actions. Do not silently delete important details.
3. **Choose the smallest effective structure:** prose for a short answer; tables for comparison; numbered steps for procedures; timelines or diagrams for relationships; evidence matrices for verification.
4. **Separate facts from plans:** mark simulated inputs, unexecuted checks, unconfirmed assumptions, and observed results distinctly.
5. **Progressive disclosure:** put the conclusion first and details near the relevant section. Avoid decorative cards, unsupported charts, redundant headings, and unnecessary controls.
6. **Validate readability and accuracy:** the output must still make sense as plain Markdown; diagrams, colors, and interactive HTML must have accessible text equivalents.
7. **Localize examples completely:** Chinese documentation uses Chinese prose, labels and screenshots; English documentation uses English prose, labels and screenshots. Preserve original code identifiers and technical terms.

## 2. Choose layouts by information needs

- **Summary and conclusion:** start with the answer and the most important limitation.
- **Comparisons:** use a short table (ideally five columns or fewer); avoid wide, nested tables.
- **Procedures:** use numbered steps, with clear inputs and expected outcomes.
- **Progress / acceptance:** distinguish planned, implemented, validated, failed, and unverified states accurately. For implementation-task states, use the task-state emoji tokens defined below instead of repeating textual state labels.
- **Numbered headings:** for Chinese structured documents, number section headings with either Chinese numerals (一、二、三) or a consistent decimal hierarchy (1., 1.1, 1.2, 2., 2.1); do not mix the two schemes in one document.
- **Task-state markers:** use ✅ completed/verified, ❌ failed, ⏸️ paused/blocked, ⏳ pending/to execute, 🔄 in progress, ❓ needs confirmation, and ⚠️ attention/risk. In task lists and status columns, the icon replaces repeated state words; retain the task description and provide accessible text when the host supports it.
- **Architecture / flow:** use a compact sequence, code block, or Mermaid if supported; provide an equivalent text explanation.
- **Code:** use language-tagged fenced blocks and runnable commands when appropriate.
- **Important content:** selectively bold key conclusions, decisions, thresholds, impact and action points; do not bold whole paragraphs.
- **Pending / attention / confirmation:** apply restrained semantic color to the callout body or quotation background/border, with a clear textual explanation. Never rely on color alone, and never recolor headings for status.
- **Blockquotes:** when a quote contains a pending confirmation, risk or important caveat, style the quote itself as the corresponding semantic callout; do not leave it as an unmarked gray quote. Avoid decorative card overload.
- **Accessibility:** use descriptive links, meaningful labels, alt text for images, and text explanations of charts.

Use headings sparingly. Prefer a concise, scannable answer over maximizing component count.

## 3. Evidence contract for coding work

Never confuse an intended action with one that was actually executed. An example result is not a measured result.

For implementation or review work, include only fields useful to the task:

- **Goal:** what was requested
- **Changed files / scope:** actual paths or explicitly "none"
- **Validation:** exact commands/tests run and their observed outcomes; "not run" when applicable
- **Risks:** up to three meaningful caveats
- **Manual acceptance:** up to five reproducible checks
- **Conclusion:** verified / needs follow-up / unverified

For code review, prioritize severity, affected location, evidence, and corrective action. Do not claim "merge-ready" without required project tests and evidence. Keep implementation facts separate from sample output.

## 4. Optional interactive UI contract

Only generate the example protocol when the **host specifically confirms** support for `gen-ui-demo/v1` and a trusted renderer.

Read [references/renderer-contract.md](references/renderer-contract.md) before producing demo JSON.

- Model output is **data**, never executable HTML, CSS, JavaScript, or arbitrary event handlers.
- The host validates the schema, allowed components, field lengths, references, and numeric bounds.
- All interactive state lives in the host renderer; the demo may only update local slider-driven metrics.
- The model cannot authorize network calls, file writes, deployments, deletes, or other side effects.
- Always accompany the UI data with an equivalent Markdown fallback containing default values and formula meaning.
- If validation fails, fall back to Markdown with a clear error; never silently execute an unrecognized component.

**Protocol scope:** `gen-ui-demo/v1` is an illustrative repository-local format, **not** OpenUI Lang, Google A2UI, or OpenAI DIL. Integrations require their actual schemas and adapters.

## 5. When the requested output is HTML

Whenever the final deliverable is HTML (explicitly requested or established by task context), follow [HTML report contract](references/html-report-contract.md). Do not change ordinary Markdown/CLI output into HTML without an HTML deliverable requirement:

If the generated deliverable is HTML, apply these additional nonnegotiable rules:
- **Audience-language page**: visible UI copy follows the requested language (Chinese for Chinese examples and English for English examples). Retain technical identifiers, JSON keys and source names where necessary.
- **Emphasis and numbered headings**: selectively bold important content; use Chinese section numbering (一、二、三) by default for Chinese reports, or a consistent decimal hierarchy (1., 1.1, 1.2, 2., 2.1). Do not mix numbering systems within one document.
- **Semantic callouts**: visually mark important content, pending confirmation and attention/risk notes using distinct soft background + left-border treatments on the content body or blockquote. Keep H1–H6 colors unchanged; status color belongs to the callout surface/border, not the title.
- **Task-state iconization**: use ✅ completed/verified, ❌ failed, ⏸️ paused/blocked, ⏳ pending/to execute, 🔄 in progress, ❓ needs confirmation, and ⚠️ attention/risk. In task lists and task-status columns, show the icon instead of a repeated textual status label; keep the task/action description and add aria-label and title for accessibility.
- **Unified HTML theme**: use #FFFFFF for the page background, #1A1C1F for foreground text and #3A83F7 as the single primary accent. Use the system UI font stack, 14px body text and 12px code. Do not load remote fonts.
- **Markdown-style code blocks**: show multi-line code only in fenced-Markdown-style <pre><code class="language-..."> blocks, never as unformatted paragraphs. Every block needs a visible one-click Copy control, an accessible live result, the Clipboard API with an execCommand("copy") fallback, and offline behavior. Do not load remote syntax-highlighting libraries.
- **No source/export/print chrome**: do not add buttons for downloading the original Markdown, printing the current page/content, exporting source text or similar document actions unless explicitly requested. Do not add a dedicated original-Markdown/source directory or table of contents. Do not display wording about opening a new browser tab; keep any necessary external link descriptively labelled and unobtrusive.
- **Nonwrapping table**: both `th` and `td` use `white-space: nowrap`; long cells use `text-overflow: ellipsis` with a hover/focus **floating full-text tooltip** that closes on leave/blur/scroll. Use a horizontally scrollable table with a **sticky first column** when helpful. Only actually truncated cells should become Tab stops; recompute when resized.
- **Column-aware filtering**: provide conditions for the actual key fields (e.g. record ID search, module/status/batch selects, duration threshold). Filter, metrics, charts, and paging from one coherent dataset. Never use filter sentinels that collide with valid data (e.g. a module named `all`).
- **Minimal navigation actions**: use semantic internal tabs only when they improve the page. Do not add a separate browser-tab action, source-download action or print action unless the user asks for it. External references, when genuinely needed, use their descriptive link text without extra navigation wording.
- **Readable dashboard, richer interactions**: use a small number of compact, clearly labelled metric cards in the overview when they improve scanning; avoid stacking decorative cards. Use forms, modal dialogs, side drawers, tabs and linked controls when useful; do not limit HTML to list pages. Repeated row actions need a unique record-specific accessible name.
- **GEN-UI monochrome icon system**: use original [SVG assets](assets/icons/README.md) in a restrained one-color style. The personal mark is a single double-peak cat-ear stroke (one path only), with no full head, facial features, frame or ornament; keep its silhouette clear at 16/20/24px. Functional icons should use at most 1–2 geometric primitives, consistent visual weight and recognizable meaning. Do not simplify away semantics. Avoid gradients, colorful mascots, multiple accent colors and excessive decoration.



- **Directory-to-portal mode**: when given a directory, recursively discover every eligible HTML file under nested subdirectories and preserve the original pages and local resources. Generate a thin `index.html` **iframe shell**: clicking a page title opens that real HTML file in the main embedded iframe; useful H2 anchors from that HTML page may be nested beneath it. Do not create a synthetic page or navigation group for the original Markdown/source text. The index must not replace, flatten or omit the other HTML pages. Use [scripts/build-html-portal.mjs](scripts/build-html-portal.mjs) at build time; offline browsers cannot list directories themselves.
- **Minimal collapsible navigation**: multi-page output uses a monochrome left rail with a mobile open/close control; the iframe sandbox must not pair script execution with same-origin access. Avoid gradients, stacked cards, thick dividers and gratuitous H3 headings. Standalone HTML reports may keep concise internal anchors and interactive controls, without nesting another iframe.
- **Collapsed navigation is an icon rail, never a hidden sidebar**: collapsing a left sidebar must leave a narrow vertical rail with one icon per primary destination. Keep the expand/collapse control inside that rail in both states. Hide labels and secondary navigation only; never set the entire sidebar to `display:none`, zero width, or move its toggle into the page header. Every icon-only destination and toggle needs an accessible Chinese name plus a hover/focus tooltip.
- **Selective icon buttons**: iconify a small number of familiar, low-ambiguity actions (for example close, collapse, reset, open details). Keep text for primary, destructive, or unfamiliar actions. Icon-only controls require an accessible name and a visible hover/focus hint; never make users guess an icon's meaning.
- **Main-heading hierarchy**: use one clear H1 and do not place a small subtitle directly beneath it. Put source/context metadata above the H1 or integrate it into the first content section. Combine related explanations, metrics and actions into a few meaningful groups; remove repeated micro-headings and isolated sections that merely restate nearby content.
- **Image-and-text first when visuals are supported**: pair important explanations with a meaningful diagram, screenshot, chart, map or illustration, placing concise Chinese explanation beside or directly below it. Prefer authored, source-grounded visuals over decorative stock imagery. If the host cannot display images or no useful visual exists, use a clear text/table/Mermaid fallback; never add an image merely to fill space. Every informative image needs alt text and a textual takeaway.
- **Prefer SVG icons over emoji** for navigation, section decoration and general actions: use consistent local line icons. **Task-state exception:** implementation and acceptance tasks use the emoji state tokens below as the visible state marker instead of repeated words such as “待执行/已完成/失败/暂停”; keep the task description readable and provide aria-label plus title on the icon. Do not use emoji as a substitute for general action icons.
- **ChatGPT-inspired restraint**: aim for a calm, generous, readable interface with neutral surfaces, clear hierarchy, restrained accent color and subtle separators. Avoid stacked cards, heavy borders, oversized shadows, gradients, excessive small headings and dense decorative chrome. Take inspiration from the clarity of ChatGPT's UI without copying proprietary assets or exact layouts.
- Data tables offer relevant filters when they help; long tables are paginated **10 rows per page by default**, optionally 20/50. The final page can contain fewer than 10 remaining records. Use compact numbered pagination with previous/next, a current-page indication and optional page jumping. Recompute page counts after filtering.
- Highlight high-priority **success figures in bright green** and **failure figures in bright red** near the top. A restrained metric card grid is appropriate for the overview; use softly tinted semantic status tags where it improves scanning. Label every figure in text, and keep adequate text contrast.
- Add pie/bar/line charts only when appropriate to composition/comparison/ordered trends. Use distinct coordinated category colors, clear legends, rounded bars, restrained grid lines and readable labels rather than a single color across every series. Charts and summary values must agree with displayed data and have accessible text equivalents.
- **Offline SVG flowcharts**: when a flow diagram is useful in an HTML deliverable, embed a real inline SVG with local controls for fullscreen, zoom in/out, fit-to-window and pointer dragging. Escape must exit fullscreen. Keep controls keyboard accessible, use no CDN, and provide a textual description.
- Standalone HTML can include reviewed client-side JS for local **filters, controls, forms, sliders, charts and navigation**; untrusted JSON remains data under a strict allowlist. No executable AI-supplied HTML/JS, no invented API actions, and no fake test data.
- Default terminal/Markdown output remains Markdown. An HTML file does not grant arbitrary UI capability inside the user's chat host.

See the [offline multi-page iframe portal](demo/portal-pages/index.html), [recursive directory builder](scripts/build-html-portal.mjs), and the standalone [HTML report example](demo/report.html) with [its renderer logic](demo/report.js). This is a **separate** illustrative data format (`gen-ui-html-report/v1`), not a breaking change to the existing `gen-ui-demo/v1` demo.

## 6. Quick routing examples

**Prompt:** "Review this Java concurrency change. The client is a terminal."

**Response strategy:** findings by severity, files/lines, evidence, remaining risks, and concise Markdown. No simulated GUI controls. See [examples/code-review.md](examples/code-review.md).

**Prompt:** "Write an implementation and test acceptance plan. No tests have been run."

**Response strategy:** an actionable checklist and explicit `Not run` status. Do not invent passing tests. See [examples/acceptance-plan.md](examples/acceptance-plan.md).

**Prompt:** "Explain Java thread pool sizing using a Markdown-only client."

**Response strategy:** static comparison table, formula and limits, with no slider. See [examples/thread-pool.md](examples/thread-pool.md).

**Prompt:** "Show a thread-count slider; my Webview supports the Gen UI demo schema."

**Response strategy:** validated JSON using [examples/thread-pool.ui.json](examples/thread-pool.ui.json), plus equivalent Markdown and clear note that the formula is educational.

## 7. Final self-check

1. Is the answer useful without any special renderer?
2. Is the chosen format supported by the actual host, with a complete fallback?
3. Are claims of implementation, testing, pushing, or deployment supported by observed evidence?
4. Are the important technical facts and limitations easy to find?
5. Would any output execute untrusted model-provided code or imply unauthorized side effects? If yes, remove it.

## Further reading

- [README](README.md) · [中文说明](README.zh-CN.md)
- [Renderer contract](references/renderer-contract.md)
- [HTML report contract](references/html-report-contract.md)
- [Host integration guidance](docs/integration.md)
- [Manual behavior evaluation](evals/manual-evaluation.md)
- [Visual design acceptance checklist](evals/visual-design-acceptance-2026-11-06.md)
- [Real-Agent prompt matrix and offline output checker](evals/agent-evaluation.md)
- [Local validation script](scripts/test-skill.ps1)

Gen UI governs **presentation only**. Preserve existing engineering and verification requirements.