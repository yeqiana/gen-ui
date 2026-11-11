# GEN-UI · HTML Report Contract (v1.5)

This contract applies **whenever HTML is the chosen or required final deliverable**, whether the user explicitly says "HTML" or the task establishes a web page or HTML artifact. Do not silently change an ordinary Markdown/CLI answer into HTML: Markdown remains the default when no HTML deliverable has been established. These rules govern **user-facing HTML**, not the normative language of this document.

## 1. Audience-language interface and semantic hierarchy

- Render all nonessential user-facing text in **Simplified Chinese** by default: page headings, section titles, tables, form labels, filters, buttons, navigation, empty states, validation messages, chart captions and tooltips.
- Retain English only when technically necessary (e.g. JSON, API names, code, product/brand names such as GEN-UI). Preserve actual user-provided identifiers, names and source data rather than fabricating translations.
- Use `<html lang="zh-CN">` and one meaningful H1 per content page. H2 appears only when it improves navigation; H3 is optional, not an ornament.
- Directory or multi-page output defaults to a **collapsible light left rail and a real iframe main display**. Each page title maps to an actual HTML file; its existing identified H2 headings may appear below it. Mobile navigation must be closable.
- **Collapsed means icon rail, not disappearance**: retain a narrow vertical sidebar (about 56–72px) with one icon per primary destination. Hide text labels and secondary links only. The expand/collapse control must remain inside the sidebar in both expanded and collapsed states; never hide the whole sidebar, set it to zero width, or place its toggle in the page header. Give icon-only controls accessible Chinese names and hover/focus tooltips.
- Iconify a few familiar actions such as close, collapse, reset and open details. Keep text on important, destructive or unfamiliar actions; icon-only buttons need `aria-label` and a visible tooltip.
- Use one clear H1. **Do not put a small subtitle immediately below the main H1**; move metadata above it or combine context with the first content group. Aggregate related metrics, explanations and actions into a few meaningful sections instead of scattering them into tiny panels or repeated micro-headings.
- When the host supports visuals, prefer an **image + concise Chinese explanation** for important concepts: meaningful diagrams, screenshots, maps, charts or annotated illustrations. Use source-grounded/authored visuals, meaningful alt text and a textual takeaway. If image display is unsupported or no useful visual exists, use a concise text/table/Mermaid fallback; do not add decorative filler images.
- Prefer consistent local SVG section icons to emoji for navigation, section decoration and general actions. For implementation-task states only, use the task-state emoji tokens defined below as the visible state marker; keep the task description and accessible name. Keep Chinese interface copy.
- Use the fixed visual tokens: page background #FFFFFF, foreground #1A1C1F, primary accent #3A83F7; use the system UI font stack, 14px body text and 12px code. Keep the base page white and do not load remote fonts. For the overview, a small grid of labelled metric cards improves scanning; avoid excessive decorative card layers, heavy shadows, gradients and clutter.

### Content emphasis, heading numbering and task-state markers

- **Bold selectively**: emphasize key conclusions, decisions, risk impact, thresholds and required actions. Do not bold entire paragraphs or use bold as a substitute for hierarchy.
- **Number section headings consistently**: Chinese reports default to 一、/二、/三; engineering reports may instead use a decimal hierarchy such as 1. / 1.1 / 1.2 / 2. / 2.1. Choose one scheme per document and keep parent/child levels consistent. The main H1 may remain unnumbered.
- **Use semantic callouts** for important conclusions, pending confirmation and attention/risk notes. Apply the semantic color to the callout surface and left border, not to H1–H6 text. The same rule applies to blockquote: a quote carrying a warning or pending confirmation must receive the appropriate callout class rather than remaining an unmarked quote.
- Suggested semantic classes: .callout--important (soft blue #EFF6FF, border #3A83F7), .callout--confirm (soft amber #FFF8E8, border #E6A23C), .callout--attention (soft red #FFF1F0, border #F56C6C), and .callout--neutral (soft gray #F5F7FA, border #98A2B3). Keep body text at the normal foreground color; do not change heading colors. Add a short label/explanation so meaning is not color-only.
- **Task-state emoji mapping**: ✅ completed/verified; ❌ failed; ⏸️ paused/blocked; ⏳ pending/to execute; 🔄 in progress; ❓ needs confirmation; ⚠️ attention/risk. In implementation plans, acceptance checklists and task-status columns, show the emoji as the visible state instead of repeating textual state labels. Keep the task description readable and add aria-label and title to each status marker. Do not replace navigation/action SVG icons with emoji.

## Directory / multi-page portal contract

When a directory is specified, **do not generate only a standalone index that ignores the other HTML files**. Run `node scripts/build-html-portal.mjs --dir <directory>` to recursively discover eligible HTML in nested folders. The generated `index.html` is a thin shell that preserves every original page file and relative asset.

- Every primary page title opens its corresponding HTML document in the **main embedded iframe**. Meaningful H2 subsections from that HTML page may become subordinate navigation items (frame URL fragments). Directory folders form collapsible groups; avoid empty nested headings. Never create a synthetic source/Markdown page or a dedicated original-text directory or table of contents.
- Default to a minimal monochrome left navigation that folds to a **persistent vertical icon rail** on desktop and can open/close on mobile. In the collapsed state, show one icon per primary page, hide labels and subordinate links, and keep the expand control inside the rail. Never hide the whole sidebar. Every icon-only link has an accessible Chinese name and hover/focus hint. Navigation stays within the main iframe; do not add a separate open-current-page action.
- Browsers cannot recursively scan arbitrary file directories at runtime. Discover files **before** opening the portal, and rerun the builder after adding new files. A preexisting hand-authored index must not be overwritten; use `--output <directory>/portal.html` instead.
- Skip symlink, hidden, dependency and generated build paths; do not inject executable content into original HTML. **Two safe modes:** the direct `file://` portal uses `sandbox="allow-same-origin"` with scripts disabled so local stylesheets render; running the built-in loopback HTTP preview (`node scripts/serve-html-portal.mjs --dir <directory>`) switches to `sandbox="allow-scripts allow-forms"` without same-origin permission so JavaScript/forms work in an isolated frame. Never combine `allow-scripts` and `allow-same-origin`, and never remove the iframe sandbox as an implicit shortcut. Files can have their own security-sensitive behavior; review their source before interactive execution.
- Single-page reports remain independent HTML documents; only the **multi-page shell** must use an iframe. Never nest iframe shells merely because a content page already has its own headings.

## 2. Nonwrapping, horizontally scrollable data tables

- Table headers and cells never wrap. Use nowrap, hidden overflow and ellipsis for long cell values.
- Show a plain-text overflow tooltip on hover and keyboard focus only when the cell is actually truncated; hide it on pointer leave, blur or table scroll.
- When a table is wider than the viewport, enable horizontal scrolling. Prefer a sticky identity column with a solid background and correct stacking.
- If a table has many columns (normally 7 or more) or optional/detail columns, provide a compact column-visibility control. Keep the record identity column visible; readers can hide secondary columns independently. Preserve header/body alignment and announce visibility changes accessibly.
- Keep the table-scroll region keyboard-focusable. Only truly truncated cells enter the Tab order; recompute focusability after filtering, column changes, render and responsive layout changes.

## 3. Filters mapped to real column fields; pagination

- Select filters from real key fields and column definitions. Choose the control by field semantics: text search for identifiers; a cascader for hierarchical relationships; radio or segmented controls for mutually exclusive choices; checkboxes or a compact multi-select popover for multiple values; date/range controls for time or numeric fields; a slider only for a meaningful continuous threshold.
- Use more than dropdowns when the data model supports it, but never invent a hierarchy or filter field. Derive options from available data and refresh dependent options when an upstream cascader value changes.
- Never use a sentinel that can collide with real data. Represent “all” separately from actual field values.
- Keep filters compact: desktop controls normally 30–32px high, with concise labels and consistent gaps. Use slightly larger touch targets only where needed on mobile.
- Filtering, KPI counts, charts and pagination derive from the same dataset and refresh together. Changing an upstream filter or page size resets or clamps the current page. Multi-select must show its selected count and define zero-selection behavior.
- For long tables, default to 10 rows per page with optional 20 and 50. Use a compact numbered pager with previous/next, current page and optional jump-to-page control. Do not pad results; provide accurate counts and an empty state.

## 4. Minimal actions and internal navigation

- Do not add source-Markdown download, original-text export, current-page print or similar document-operation buttons unless explicitly requested. Avoid redundant toolbar actions.
- Every absolute http:// or https:// URL must look like an external link (theme-colored and underlined or equivalent), with target="_blank" and rel="noopener noreferrer". Use concise descriptive link text; never add visible explanatory copy about which tab or window will open.
- Relative paths, root-relative paths, fragment anchors and local files are internal links: never apply the external-link class or external-link icon, and never force them to target="_blank". In iframe portals, internal links remain inside the portal's main frame.
- Internal switches use semantic tabs with role="tablist", role="tab", role="tabpanel", aria-controls and aria-selected; concise tab labels are sufficient. The UI should never silently navigate away.
- Do not make a report only a list of tabs. Use real navigation, forms, dialogs, panels and drawers based on information needs.
- Code examples are not toolbar exports: render multi-line code in Markdown-style <pre><code class="language-..."> blocks with an icon-only Copy control in the upper-right corner and accessible copy feedback. Never display visible copied-status text.

## 5. Components beyond list pages and unnecessary cards

- Use forms for data entry, a modal dialog for discrete creation/confirmation, and a **right or left side drawer** for record details or data editing when it avoids destroying page context. Choose layout on usefulness, not ornamentation. Repeated action buttons must have **record-specific accessible names** (e.g. “查看任务 T-001 的详情”) rather than identical labels.
- Keep operations local for this offline example. Real side effects require the host's explicit authentication, permissions, review and confirmation.
- Keep semantic H1/H2/H3 structure independent of the chosen tab or panel state; restore logical focus on close.
- Form labels and single-line field values must stay on one line. Use min-width:0, white-space:nowrap, overflow:hidden and text-overflow:ellipsis; never wrap labels or input/select values. If a label or value exceeds 15 characters, expose the full plain-text value on hover and keyboard focus (for example, native title or an accessible tooltip). Keep the full value available to assistive technology.
- When a form has many fields (normally 5 or more), use a two-column desktop grid with consistent row and column gaps; collapse to one column on narrow mobile screens.
- Keep compact, clearly labelled metric cards together in a visual overview. Avoid duplicate KPI blocks, excessive card nesting, oversized shadows and decorative whitespace. Prefer compact controls around 30–34px tall unless touch accessibility requires larger targets.
- Add subtle dividers selectively between metadata groups, filter clusters, major sections or dense form groups when they improve scanning. Do not put a divider between every field or turn the page into a grid of boxes.

## 6. Charts, metrics, controlled JSON and safety

- At the top, meaningful **success** counts may use a fresh green and **failure** counts a friendly red; ordinary figures remain neutral. Where a status appears in a table, use a softly tinted text tag with a readable label and sufficient contrast. Always include labels and units. No fabricated counts or tests.
- Choose pie for composition, bar for categories and line for ordered sequence/trends. Use a coordinated multi-color series palette, clear legends, readable axes, restrained grid lines and category-specific colors. Add them only if useful. Include chart descriptions and a clear no-data state; charts should follow the table's current filter when meaningful.
- **Offline flow diagrams:** embed inline SVG when a flowchart materially helps. Provide controls for fullscreen, zoom, fit-to-window and **canvas-background** drag/pan in the diagram top-right toolbar. Clickable nodes and edges must select and reveal details; node dragging is optional, never the only interaction. Prefer compact icon-only buttons for zoom/fullscreen/fit; each needs a Chinese aria-label, hover/focus tooltip and visible focus styling. Keep the zoom percentage visible. Support Escape to exit fullscreen, keyboard access, a text description and no network requests.
- Trusted static author-written JavaScript may implement real controls, slider updates, tabs, pagination, modal windows and drawers. Model-supplied **JSON is data**, strictly validated against an allowlist, bounds and size limits.
- Never execute AI-supplied JavaScript, HTML, CSS, `eval`, `innerHTML`, event handlers or arbitrary remote URLs. No unsupported database/API/deployment action is implied by being in a browser.
- A self-contained HTML file can inline **reviewed trusted code/assets** if the request explicitly requires a single file. Otherwise local CSS/JS/SVG assets are encouraged for maintenance.
- The HTML demo is **not** an implementation of DIL, OpenUI or A2UI; interactive rendering requires the actual browser or compatible host.

## 7. Markdown-style code blocks and fixed theme

- Render every multi-line code example as <pre><code class="language-...">...</code></pre> with preserved whitespace, horizontal overflow when needed, and a restrained light surface. Use a system monospace font at 12px; surrounding body text remains 14px.
- Provide one **icon-only Copy button** for every code block. Show a check SVG on real success, an error SVG on failure, and revert to the Copy SVG after 1000ms. No visible success phrases. Copy the code element's textContent, not the wrapper's text. Prefer navigator.clipboard.writeText; if unavailable or rejected, use a temporary selected textarea with document.execCommand("copy"). Keep an accessible button label, and never report success before the clipboard operation completes.
- Inline identifiers may remain inline code; do not wrap ordinary prose in a block merely to add a Copy control.

## Fixed theme tokens

- Background: #FFFFFF; foreground: #1A1C1F; primary accent: #3A83F7.
- Font: system UI font stack, no remote font downloads. Body: 14px. Code: 12px.
- Use the accent consistently for focus, primary actions, active navigation and links. Semantic success/failure colors may remain distinct from the primary accent, but must not replace the global theme tokens.

## 8. Report metadata, external references and favicon

- A generated report shows its generation timestamp near the top, accurate to seconds and including its timezone/offset (YYYY-MM-DD HH:mm:ss ±HH:mm). Stamp the time when the artifact/report is generated; do not use a date-only label or update it on every filter interaction.
- If analysis or design cites external public material, consolidate those citations in a clearly titled 参考资料 / References section at the very bottom of the report, after findings and before the final brand footer. Use descriptive source titles and absolute HTTPS URLs.
- Every standalone HTML page and directory index includes the local GEN-UI personal-mark favicon. Use the correct relative path to assets/icons/gen-ui-mark.svg; a generated portal shell may embed the same trusted SVG as a data URI. Never substitute an emoji, remote favicon or unrelated icon.
- The report timestamp, external references and favicon are part of the HTML artifact contract, not optional decoration.

### Interaction reliability and diagram selection

**Navigation:** Standalone HTML pages and documentation indexes must present a usable left-side navigation by default. On mobile it can collapse into a simple accessible menu. Generated iframe children can rely on their parent portal navigation, but the portal shell itself always provides a left rail. The page/tab favicon is the repository's newest local **M-shaped** `gen-ui-mark.svg` mark.

**Diagram selection and semantics:** Use sequence diagrams with lifelines, activation bars and labeled messages; mind maps with expandable hierarchy; deployment topology with runtime zones and protocol-labeled dependencies; ER diagrams with entity tables, fields, PK/FK and cardinalities; activity diagrams with start/end, actions, decision diamonds and labeled branches; swimlanes with role boundaries and handoffs; component diagrams with boundaries, ports and interfaces. Every diagram is inline SVG and local/offline, with `title`, `desc`, a caption, and a text equivalent. Do not render seven generic box-and-line diagrams.

**Diagram interaction:** A click selects an element and updates a nearby inspector; edges, messages and fields are selectable too. Add diagram-specific controls: sequence step-through; mind-map expand/collapse; deployment-zone collapse; ER non-key-field visibility; activity path filters; swimlane collapse; component-port visibility. Canvas pan/zoom/fit/fullscreen are common navigation only. Node dragging is optional and cannot replace semantic interaction.

**Connector labels:** Place text in a dedicated label lane with an opaque background; route the edge around nodes. Validate actual SVG bounding boxes so connector labels never overlap node shapes or other labels.

**Control placement:** The image fullscreen control is positioned inside the image frame at its upper-right corner. The icon-only code-copy button is absolutely positioned at the code block upper-right corner; preserve enough top padding so it never covers the first line.

**Fullscreen state machine:** Fullscreen enter/exit is serialized and idempotent. Handle rapid repeated clicks, browser Escape, `fullscreenchange`, `fullscreenerror`, denied native API (local overlay fallback), and return to normal layout. Preserve zoom and pan while changing modes. All toolbar icons retain visible SVG markup and update only their SVG state and accessible name. The top-right toolbar uses compact recognizable zoom magnifier, fit-brackets, and expand/shrink icons, inspired by a consistent 24px line icon vocabulary.

**Copy icon:** Every multi-line code block has an icon-only button showing Copy, Check on success, and Error on failure. After **1000ms**, the icon returns to Copy; cancel older timeouts to avoid stale feedback. Clipboard API and offline `execCommand` fallback remain supported. Do not emit visible success/failure copy messages or extra blank status lines; use accessible labels and nonvisual status when appropriate.

**Quote termination:** Strip trailing blank quoted lines and empty trailing paragraph nodes; enforce zero bottom margin on the final actual quote element.

**Images:** Content images may have a magnifying-glass button that opens an in-page fullscreen-style preview. Show zoom percentage and icon-only zoom in/out, fit, close; allow dragging, Esc, and focus restoration. Never attach it to logos, icons or decorative assets. All operations must work without network access.

**Regression gates:** Explicitly assert the above through Chrome at 375/768/1440px including three or more fullscreen cycles, denied native fullscreen, SVG node drag and connector updates, image zoom and Esc closure, one-second copy reset, and no body horizontal overflow.

### Data-driven, collision-verified diagram input

Read `references/semantic-diagram-model.md` before generating custom semantic SVG input. Prefer embedded, bounded `type="application/json"` models; this is a **document structure contract**, not a license to invent business data. The renderer can inspect the `[data-semantic-diagram]` host's direct-child JSON model, validates unique IDs, references, field structure and bounded coordinates, and uses fixed offline assets.

Place edge-label chips in a dedicated topmost SVG layer. Reposition using the **rendered viewport coordinate space** including parent transforms; labels must never overlap nodes or other labels. Test both zh/en at 375/768/1440px. Branch collapse must remove all child connectors and preserve focus; ER field hiding must shrink entity bounding geometry. Mobile rendering offers fit-to-view and focused reading.

Do not advertise automatic node layout: complex diagrams currently require explicit initial positions/routes. See the standalone `demo/custom-diagram-model.html` showing two **nonbuilt-in** business models.

## 9. GEN-UI personal IP icon set

- Use the [GEN-UI monochrome SVG set](../assets/icons/README.md). The personal mark must be one double-peak cat-ear stroke (one path only), without a full head, face details, frame or ornament; keep it legible at 16/20/24px. Functional icons should use at most 1–2 geometric primitives while preserving clear meaning and consistent visual weight. Avoid gradients, colorful mascots, coral accents and decorative icon overload.
- Use icons selectively in the **sidebar, page header, toolbar or footer**, not in dense body paragraphs. Pair functional icons with clear Chinese text; use `alt=""` when icons are decorative.
- Keep SVG assets local and reusable, do not embed untrusted external SVG. Avoid a large decorative brand watermark over the table or report findings.

## 10. Executable example and validation

Open the [recursive iframe portal](../demo/portal-pages/index.html) or the standalone [Chinese HTML report](../demo/report.html) alongside its [CSS](../demo/report.css), [JavaScript](../demo/report.js) and local SVG icons. The sample deliberately contains **67 fictional records** and is **not** an observed engineering test result.

The report accepts a separate data-only protocol (`gen-ui-html-report/v1`), not `gen-ui-demo/v1`:

```json
{
  "version": "gen-ui-html-report/v1",
  "title": "工程质量分析 · 模拟数据",
  "rows": [
    {"id": "T-001", "module": "网关服务", "status": "success", "durationMs": 250, "batch": 1}
  ]
}
```

Validation: at most 1000 rows, unique identifiers, bounded strings, status `success/failure/pending`, finite `durationMs` within [0,1000000], batch 1–12, no unknown fields, input size up to 750000 characters, including worst-case escaped string content in the pretty-printed editor export. A rejected import leaves the prior valid report unchanged.

Run the whole regression suite (including DOM event simulation):

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/test-skill.ps1
```

The Node tests cover logic, schema, DOM event behavior and structural/static accessibility checks; **real Chrome visual and accessibility verification must still be performed separately**. Do not claim that a mocked DOM is a full browser acceptance test. The [Agent output evaluation matrix](../evals/agent-evaluation.md) supplies repeatable prompts and a static gate; it **does not claim** that Codex, Claude or any model was executed or complied.
