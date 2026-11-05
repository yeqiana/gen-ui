# Gen UI: HTML Report Output Contract

This contract applies **when a user explicitly requests an HTML report, HTML page, or HTML deliverable**. It does not silently upgrade CLI or Markdown-only responses to HTML. It also does not replace the existing optional `gen-ui-demo/v1` UI protocol.

## Layout and navigation

- The page must contain exactly one meaningful `h1` (report title) and coherent `h2` major sections / `h3` subsections, without skipping heading levels.
- Provide a navigation table of contents for multi-section reports. **Left sidebar is the default**; a top navigation is permitted when explicitly requested or more suitable for the viewport.
- Navigation anchors must reflect actual headings and sections. Use semantic `nav`, `main`, `section`, accessible labels, and visible keyboard focus.
- On narrow screens, a sidebar can become a horizontal/top navigation while preserving section links. Support reduced-motion preference when animating scrolling.
- Don't introduce navigation for a trivial single-section document.

## Tables, filtering, and pagination

- If a report includes a meaningful data table, add **relevant optional filters** (e.g., keyword, status, module, date) *only when the corresponding data exists*; don't add meaningless controls.
- For long tables, paginate the **filtered** dataset. Default to **20 rows per page**, with permitted options of 20/50/100 (never a page-size setting below 20).
- The last page, or filtered result sets smaller than 20, naturally may contain fewer than 20 rows. Do not pad or fabricate rows.
- Reset or clamp the current page on filter, dataset or page-size changes; keep the displayed row count and page count accurate. Provide Previous/Next states and a clear empty-result message.
- On narrow screens, allow horizontal table scrolling or another accessible responsive representation. Keep table headings readable and keyboard navigation usable.
- For large datasets, use server-backed pagination *only* if such APIs and authorization actually exist; do not invent data endpoints.

## Important metrics and color

- Place the highest-priority summary metrics close to the start, ahead of detailed tables.
- Reserve positive green emphasis for meaningful **success** counts/ratios and negative red emphasis for **failure** counts/ratios (especially at the top). Use neutral colors for ordinary values and warnings unless warranted.
- Always display visible text labels, units, and the data scope. **Color must not be the only carrier of status.**
- Do not invent totals, percentages, growth, performance improvements, or test outcomes. A sample dataset must be prominently labeled *illustrative*.

## Charts and local interactivity

- Choose **pie** for a small part-to-whole distribution, **bar** for category comparisons, and **line** for ordered time/sequence trends. Add them only if they improve understanding; don't include all three by default in every report.
- Link charts and KPI values to the same filtered dataset wherever practical, with a textual interpretation and accessible labels. Show no-data states rather than incorrect charts.
- Static HTML may contain **trusted, authored JavaScript** for local controls (search, pagination, sliders, forms, navigation). HTML capability does **not** authorize execution of untrusted model-generated HTML, JavaScript, CSS, event handlers, or remote URLs.
- If model-supplied structured data is accepted, it must be validated against a fixed schema with size/type/range/field limits. Set text using `textContent`, avoid unsafe `innerHTML`, `eval`, arbitrary script URLs and event code.
- Side effects (API calls, deletion, deployment, file changes) are **out of scope** for this example and require explicit host authorization, confirmation, and auditing.
- Prefer dependency-free, offline examples for small reports. If a single self-contained `.html` is explicitly required, inline only the reviewed, trusted assets; preserve validation and security controls.
- Don't claim that a generated HTML file automatically runs inside a CLI chat pane, or that any third-party schema is natively supported.

## This repository's executable example

Open [demo/report.html](../demo/report.html) **from this repository**, next to its local [report.js](../demo/report.js). It runs offline without installing a build system. The example uses 67 **illustrative** records to exercise pagination.

The demonstration accepts this **independent** data-only format (not the original slider demo schema):

```json
{
  "version": "gen-ui-html-report/v1",
  "title": "Engineering Verification Report",
  "rows": [
    {"id": "T-001", "module": "Gateway", "status": "success", "durationMs": 250, "batch": 1}
  ]
}
```

Validation: up to 1000 rows, unique IDs, bounded string fields, status limited to `success/failure/pending`, finite duration in [0, 1000000], integer batch in [1, 12], no unknown fields, input capped at 200,000 characters. Static script logic is the renderer; JSON cannot define markup, behavior or network calls.

**Safety fallback:** Invalid JSON leaves the previous valid report intact and shows an error. No extra rows are fabricated to meet the 20-row default.

## Verifying the example

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/test-skill.ps1
```

This checks the pagination/filtering/aggregation logic and browser-DOM event wiring in tests, but does not replace manually opening the page and verifying responsive layout, rendering, keyboard focus and accessible charts.
