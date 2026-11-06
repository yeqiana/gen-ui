# GEN-UI · HTML Report Contract (v1.3)

This contract applies **whenever HTML is the chosen or required final deliverable**, whether the user explicitly says "HTML" or the task establishes a web page or HTML artifact. Do not silently change an ordinary Markdown/CLI answer into HTML: Markdown remains the default when no HTML deliverable has been established. These rules govern **user-facing HTML**, not the normative language of this document.

## 1. Chinese-first interface and semantic hierarchy

- Render all nonessential user-facing text in **Simplified Chinese** by default: page headings, section titles, tables, form labels, filters, buttons, navigation, empty states, validation messages, chart captions and tooltips.
- Retain English only when technically necessary (e.g. JSON, API names, code, product/brand names such as GEN-UI). Preserve actual user-provided identifiers, names and source data rather than fabricating translations.
- Use `<html lang="zh-CN">` and one meaningful H1 per content page. H2 appears only when it improves navigation; H3 is optional, not an ornament.
- Directory or multi-page output defaults to a **collapsible light left rail and a real iframe main display**. Each page title maps to an actual HTML file; its existing identified H2 headings may appear below it. Mobile navigation must be closable.
- **Collapsed means icon rail, not disappearance**: retain a narrow vertical sidebar (about 56–72px) with one icon per primary destination. Hide text labels and secondary links only. The expand/collapse control must remain inside the sidebar in both expanded and collapsed states; never hide the whole sidebar, set it to zero width, or place its toggle in the page header. Give icon-only controls accessible Chinese names and hover/focus tooltips.
- Iconify a few familiar actions such as close, collapse, reset and open details. Keep text on important, destructive or unfamiliar actions; icon-only buttons need `aria-label` and a visible tooltip.
- Use one clear H1. **Do not put a small subtitle immediately below the main H1**; move metadata above it or combine context with the first content group. Aggregate related metrics, explanations and actions into a few meaningful sections instead of scattering them into tiny panels or repeated micro-headings.
- When the host supports visuals, prefer an **image + concise Chinese explanation** for important concepts: meaningful diagrams, screenshots, maps, charts or annotated illustrations. Use source-grounded/authored visuals, meaningful alt text and a textual takeaway. If image display is unsupported or no useful visual exists, use a concise text/table/Mermaid fallback; do not add decorative filler images.
- Prefer consistent local SVG section icons to emoji; use emoji only where genuinely helpful, never as the only status or action indication. Keep Chinese labels.
- Use clear hierarchy, compact controls, friendly accent colors, light borders and modest spacing. For the overview, a small grid of labelled metric cards improves scanning; avoid excessive decorative card layers, heavy shadows, gradients and clutter.

## Directory / multi-page portal contract

When a directory is specified, **do not generate only a standalone index that ignores the other HTML files**. Run `node scripts/build-html-portal.mjs --dir <directory>` to recursively discover eligible HTML in nested folders. The generated `index.html` is a thin shell that preserves every original page file and relative asset.

- Every primary page title opens its corresponding HTML document in the **main embedded iframe**. Existing named H2 subsections become optional subordinate navigation items (frame URL fragments). Directory folders form collapsible groups; avoid empty nested headings.
- Default to a minimal monochrome left navigation that folds to a **persistent vertical icon rail** on desktop and can open/close on mobile. In the collapsed state, show one icon per primary page, hide labels and subordinate links, and keep the expand control inside the rail. Never hide the whole sidebar. Every icon-only link has an accessible Chinese name and hover/focus hint. An action labelled “新标签页打开” opens the current page separately; the ordinary navigation stays within the iframe.
- Browsers cannot recursively scan arbitrary file directories at runtime. Discover files **before** opening the portal, and rerun the builder after adding new files. A preexisting hand-authored index must not be overwritten; use `--output <directory>/portal.html` instead.
- Skip symlink, hidden, dependency and generated build paths; do not inject executable content into original HTML. **Two safe modes:** the direct `file://` portal uses `sandbox="allow-same-origin"` with scripts disabled so local stylesheets render; running the built-in loopback HTTP preview (`node scripts/serve-html-portal.mjs --dir <directory>`) switches to `sandbox="allow-scripts allow-forms"` without same-origin permission so JavaScript/forms work in an isolated frame. Never combine `allow-scripts` and `allow-same-origin`, and never remove the iframe sandbox as an implicit shortcut. Files can have their own security-sensitive behavior; review their source before interactive execution.
- Single-page reports remain independent HTML documents; only the **multi-page shell** must use an iframe. Never nest iframe shells merely because a content page already has its own headings.

## 2. Nonwrapping, horizontally scrollable data tables

- **Table headers must never wrap**: use `white-space: nowrap` for each header, not only the table container.
- **Table cells must never wrap**; truncate overflowing long content via `overflow: hidden; text-overflow: ellipsis; white-space: nowrap`.
- Provide an **overflow tooltip that appears on pointer hover or keyboard focus and disappears on pointer leave or blur**. Only show it when the content is actually truncated (`scrollWidth > clientWidth`); use plain text, never model-provided HTML. Hide it when the table scrolls.
- When the table is wider than the viewport, enable horizontal scrolling. For record tables, prefer a **sticky first column** (`position: sticky; left: 0`) with a solid background and correct stacking against the header. Sticky columns must not obscure user content. Use fixed/declared column widths as needed for stable truncation.
- Do not sacrifice keyboard access: table-scroll region can be focused. **Only truly truncated cells** should enter the sequential Tab order; recompute focusability after render and responsive layout changes. Keep full text accessible and use plain-text hover/focus tooltips.

## 3. Filters mapped to real column fields; pagination

- Select relevant filters from the actual **key fields / column definitions**, not arbitrary global controls: text search for record identifier, selector for module / status / category, batch/date range for sequence/time columns, slider or numeric bounds for measured values.
- Where reasonable, derive selector options from available data and refresh when the dataset changes. Never invent absent fields, statuses or API endpoints. **Never use a sentinel value that can collide with actual field data**: e.g., an empty-string sentinel for nonempty module names; a real module called `all` must remain selectable.
- Filtering, KPI counts, charts and pagination must derive from the **same dataset** and refresh together. Changing a filter or page size resets/clamps the current page.
- For long tables, default to **10 rows per page** with optional 20 and 50. Use a compact numbered pager with previous/next, visible current page and optional jump-to-page control. The final page or filtered result can naturally have fewer than 10 rows. Do not pad results. Provide accurate row counts and an empty state.

## 4. Navigation intent: new browser tab versus current-page tab

- The distinction between **opening a new browser tab** and **switching an internal page tab** must be immediately visible in **Chinese text**, not solely in an icon.
- External target links use a label such as **“新标签页打开”**; where supported, `target="_blank"` plus `rel="noopener noreferrer"`. Do not claim a new tab will open from a plain button without implementing it.
- Internal switches use **“页内标签” / “当前页面内部切换”** labels and semantic tabs with `role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-controls` and `aria-selected`. The UI should never silently navigate away.
- Do not make a report **only** a list of tabs. Use real navigation, forms, dialogs, panels and drawers based on information needs.

## 5. Components beyond list pages and unnecessary cards

- Use forms for data entry, a modal dialog for discrete creation/confirmation, and a **right or left side drawer** for record details or data editing when it avoids destroying page context. Choose layout on usefulness, not ornamentation. Repeated action buttons must have **record-specific accessible names** (e.g. “查看任务 T-001 的详情”) rather than identical labels.
- Keep operations local for this offline example. Real side effects require the host's explicit authentication, permissions, review and confirmation.
- Keep the semantic H1/H2/H3 structure independent of the chosen tab or panel state; restore logical focus on close where the browser provides it.
- Keep compact, clearly labelled metric cards together in a visual overview, with bright but purposeful accents. Avoid duplicate KPI blocks, excessive card nesting, oversized shadows and decorative whitespace. Prefer compact controls around 30–34px tall unless touch accessibility requires larger targets.

## 6. Charts, metrics, controlled JSON and safety

- At the top, meaningful **success** counts may use a fresh green and **failure** counts a friendly red; ordinary figures remain neutral. Where a status appears in a table, use a softly tinted text tag with a readable label and sufficient contrast. Always include labels and units. No fabricated counts or tests.
- Choose pie for composition, bar for categories and line for ordered sequence/trends. Use a coordinated multi-color series palette, clear legends, readable axes, restrained grid lines and category-specific colors. Add them only if useful. Include chart descriptions and a clear no-data state; charts should follow the table's current filter when meaningful.
- **Offline flow diagrams:** embed inline SVG when a flowchart materially helps. Provide labelled controls for fullscreen, zoom, fit-to-window and pointer drag/pan. Support Escape to exit fullscreen, keyboard access, a text description and no network requests.
- Trusted static author-written JavaScript may implement real controls, slider updates, tabs, pagination, modal windows and drawers. Model-supplied **JSON is data**, strictly validated against an allowlist, bounds and size limits.
- Never execute AI-supplied JavaScript, HTML, CSS, `eval`, `innerHTML`, event handlers or arbitrary remote URLs. No unsupported database/API/deployment action is implied by being in a browser.
- A self-contained HTML file can inline **reviewed trusted code/assets** if the request explicitly requires a single file. Otherwise local CSS/JS/SVG assets are encouraged for maintenance.
- The HTML demo is **not** an implementation of DIL, OpenUI or A2UI; interactive rendering requires the actual browser or compatible host.

## 7. GEN-UI personal IP icon set

- Use the [GEN-UI monochrome SVG set](../assets/icons/README.md). The personal mark must be one double-peak cat-ear stroke (one path only), without a full head, face details, frame or ornament; keep it legible at 16/20/24px. Functional icons should use at most 1–2 geometric primitives while preserving clear meaning and consistent visual weight. Avoid gradients, colorful mascots, coral accents and decorative icon overload.
- Use icons selectively in the **sidebar, page header, toolbar or footer**, not in dense body paragraphs. Pair functional icons with clear Chinese text; use `alt=""` when icons are decorative.
- Keep SVG assets local and reusable, do not embed untrusted external SVG. Avoid a large decorative brand watermark over the table or report findings.

## 8. Executable example and validation

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
