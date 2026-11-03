# Example: feature implementation and acceptance handoff

> **Illustrative planning exercise**, not an implemented feature. No commands were run.

## Request

"Add a CSV export action to the existing user-list page. Do not change backend APIs or unrelated UI. Provide manual test and acceptance steps."

## Example response

**Scope:** Add a visible export action by reusing an existing export capability, **if** one exists. If no compatible capability exists, report that dependency instead of silently adding an endpoint.

| Surface | Intended impact |
| --- | --- |
| Existing user-list page | Add the export action in the current toolbar |
| Existing export API | Reuse after checking its current contract |
| Routes and database | No planned changes |
| Tests | Focus on entry, disabled state, file content, and error handling |

### Implementation steps (planned)

1. Inspect the list page, existing export interactions, permissions and API contract.
2. Implement the smallest UI change that uses the supported export path.
3. Preserve current filters, permission checks and page behavior.
4. Add or update a focused UI test where the repository's test harness supports it.

### P0 manual acceptance (not run)

- [ ] User with export permission sees an action in the existing toolbar.
- [ ] Export request follows the currently selected filters and receives a correctly formatted file.
- [ ] User without permission cannot trigger the export.
- [ ] Empty result and failing request produce clear feedback.
- [ ] Existing page routing, search and pagination remain unchanged.

### Handoff

- **Goal:** User-list CSV export
- **Modified files:** None (planning example)
- **Validation:** Not run; this is an example plan only
- **Risks:** Existing API capability and export permission semantics are unknown
- **Conclusion:** Ready for repository inspection, **not** ready for merge

## Why this is Gen UI output

Planned and verified states are never conflated. A CLI, IDE preview, or GitHub viewer can render the same Markdown without custom components.