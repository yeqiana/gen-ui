# Changelog

All changes are documented in this file. Versions describe repository content, not a published package or live service.

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