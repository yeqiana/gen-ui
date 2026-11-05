# GEN-UI · HTML Report Contract (v1.2)

This contract applies **only to explicitly requested HTML reports or pages**. The default CLI / Markdown output remains Markdown. The rules below govern the generated **user-facing HTML**, not the source-language of this normative document.

## 1. Chinese-first interface and semantic hierarchy

- Render all nonessential user-facing text in **Simplified Chinese** by default: page headings, section titles, tables, form labels, filters, buttons, navigation, empty states, validation messages, chart captions and tooltips.
- Retain English only when technically necessary (e.g. JSON, API names, code, product/brand names such as GEN-UI). Preserve actual user-provided identifiers, names and source data rather than fabricating translations.
- Use `<html lang="zh-CN">`, **one H1**, logical **H2 major sections** and **H3 subsections**. Keep a semantic table of contents when multiple major sections exist.
- Left navigation is the default; top navigation is a supported deliberate option. Responsive screens must not make navigation unusable.
- Reduce decorative cards and large bordered boxes. Prefer clear typographic hierarchy, dividing rules, concise toolbars and readable data density. Small KPI strips and form dialogs are appropriate when useful.

## 2. Nonwrapping, horizontally scrollable data tables

- **Table headers must never wrap**: use `white-space: nowrap` for each header, not only the table container.
- **Table cells must never wrap**; truncate overflowing long content via `overflow: hidden; text-overflow: ellipsis; white-space: nowrap`.
- Provide an **overflow tooltip that appears on pointer hover or keyboard focus and disappears on pointer leave or blur**. Only show it when the content is actually truncated (`scrollWidth > clientWidth`); use plain text, never model-provided HTML. Hide it when the table scrolls.
- When the table is wider than the viewport, enable horizontal scrolling. For record tables, prefer a **sticky first column** (`position: sticky; left: 0`) with a solid background and correct stacking against the header. Sticky columns must not obscure user content. Use fixed/declared column widths as needed for stable truncation.
- Do not sacrifice keyboard access: table-scroll region can be focused, clipped text can receive focus and tooltip text remains accessible.

## 3. Filters mapped to real column fields; pagination

- Select relevant filters from the actual **key fields / column definitions**, not arbitrary global controls: text search for record identifier, selector for module / status / category, batch/date range for sequence/time columns, slider or numeric bounds for measured values.
- Where reasonable, derive selector options from available data and refresh when the dataset changes. Never invent absent fields, statuses or API endpoints.
- Filtering, KPI counts, charts and pagination must derive from the **same dataset** and refresh together. Changing a filter or page size resets/clamps the current page.
- For long tables, default to **20 rows per page** with optional 50 and 100; never configure a page size below 20. The last page or a filtered result set may naturally have fewer than 20 rows. Do not pad results. Provide accurate row counts and an empty state.

## 4. Navigation intent: new browser tab versus current-page tab

- The distinction between **opening a new browser tab** and **switching an internal page tab** must be immediately visible in **Chinese text**, not solely in an icon.
- External target links use a label such as **“新标签页打开”**; where supported, `target="_blank"` plus `rel="noopener noreferrer"`. Do not claim a new tab will open from a plain button without implementing it.
- Internal switches use **“页内标签” / “当前页面内部切换”** labels and semantic tabs with `role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-controls` and `aria-selected`. The UI should never silently navigate away.
- Do not make a report **only** a list of tabs. Use real navigation, forms, dialogs, panels and drawers based on information needs.

## 5. Components beyond list pages and unnecessary cards

- Use forms for data entry, a modal dialog for discrete creation/confirmation, and a **right or left side drawer** for record details or data editing when it avoids destroying page context. Choose layout on usefulness, not ornamentation.
- Keep operations local for this offline example. Real side effects require the host's explicit authentication, permissions, review and confirmation.
- Keep the semantic H1/H2/H3 structure independent of the chosen tab or panel state; restore logical focus on close where the browser provides it.
- Minimize needless cards, duplicate KPI blocks, oversized shadows and decorative whitespace; a readable data interface is more important than a showcase of every component.

## 6. Charts, metrics, controlled JSON and safety

- At the top, meaningful **success** counts may be green and **failure** counts red; ordinary figures should remain neutral. Always include labels and units. No fabricated counts or tests.
- Choose pie for composition, bar for categories and line for ordered sequence/trends. Add them only if useful. Include chart descriptions and a clear no-data state; charts should follow the table's current filter when meaningful.
- Trusted static author-written JavaScript may implement real controls, slider updates, tabs, pagination, modal windows and drawers. Model-supplied **JSON is data**, strictly validated against an allowlist, bounds and size limits.
- Never execute AI-supplied JavaScript, HTML, CSS, `eval`, `innerHTML`, event handlers or arbitrary remote URLs. No unsupported database/API/deployment action is implied by being in a browser.
- A self-contained HTML file can inline **reviewed trusted code/assets** if the request explicitly requires a single file. Otherwise local CSS/JS/SVG assets are encouraged for maintenance.
- The HTML demo is **not** an implementation of DIL, OpenUI or A2UI; interactive rendering requires the actual browser or compatible host.

## 7. GEN-UI personal IP icon set

- Use the cohesive GEN-UI icon system in [assets/icons/README.md](../assets/icons/README.md): a custom **inspiration-cat** logomark with indigo-purple geometry and restrained coral accents, plus icons for charts, tables, internal tabs, external tabs, forms and drawers.
- Use icons selectively in the **sidebar, page header, toolbar or footer**, not in dense body paragraphs. Pair functional icons with clear Chinese text; use `alt=""` when icons are decorative.
- Keep SVG assets local and reusable, do not embed untrusted external SVG. Avoid a large decorative brand watermark over the table or report findings.

## 8. Executable example and validation

Run the offline [Chinese HTML report](../demo/report.html) alongside its [CSS](../demo/report.css), [JavaScript](../demo/report.js) and local SVG icons. The sample deliberately contains **67 fictional records** and is **not** an observed engineering test result.

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

Validation: at most 1000 rows, unique identifiers, bounded strings, status `success/failure/pending`, finite `durationMs` within [0,1000000], batch 1–12, no unknown fields, input size up to 200000 characters. A rejected import leaves the prior valid report unchanged.

Run the whole regression suite (including DOM event simulation):

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/test-skill.ps1
```

The Node tests cover logic, schema, DOM event behavior and structural/static accessibility checks; **real Chrome visual and accessibility verification must still be performed separately**. Do not claim that a mocked DOM is a full browser acceptance test.
