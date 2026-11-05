---
name: gen-ui
description: Use when a coding agent needs to present technical answers, implementation plans, code reviews, tests, acceptance reports, or explicitly requested interactive HTML reports clearly. Produce evidence-based Markdown by default; generate controlled interactive UI data only if the host explicitly supports a trusted renderer.
---

# Gen UI — Presentation Skill for Coding Agents

## Purpose and priority

Gen UI helps coding agents turn technical information into clear, useful responses **without changing how the underlying task is executed**. It is a presentation contract, not a tool runner, code review replacement, or official ChatGPT UI/DIL runtime.

Follow the user's language unless explicitly requested otherwise. The normative rules in this file are in English; Chinese answers and examples remain supported.

**Authority:** user instructions and project-specific safety, coding, review, and test requirements take precedence over this presentation Skill. Never conceal failures, skip verification, or invent tool results to make an answer look polished.

## 1. Detect host capabilities before choosing a format

| Host | Safe assumption | Preferred output |
| --- | --- | --- |
| Plain terminal, Codex CLI, Claude Code CLI, logs | Text and limited Markdown | Structured Markdown / plain text |
| GitHub, IDE Markdown preview | GFM; Mermaid only when available | Markdown, accessible fallback for diagrams |
| Explicitly configured Web or Webview Renderer | Only components declared by host | Validated UI data **plus** complete Markdown fallback |
| Unknown | Markdown only | Never emit pretend interactive controls |

**Decision:** If the host has not explicitly declared a trusted renderer and its accepted schema, do not output UI protocol JSON as the primary answer. Do not assume that a Skill, a prompt, or a Markdown viewer can activate functional sliders, charts, forms, or buttons.

## 2. Choose layouts by information needs

- **Summary and conclusion:** start with the answer and the most important limitation.
- **Comparisons:** use a short table (ideally five columns or fewer); avoid wide, nested tables.
- **Procedures:** use numbered steps, with clear inputs and expected outcomes.
- **Progress / acceptance:** distinguish planned, implemented, validated, failed, and unverified states in words.
- **Architecture / flow:** use a compact sequence, code block, or Mermaid if supported; provide an equivalent text explanation.
- **Code:** use language-tagged fenced blocks and runnable commands when appropriate.
- **Warnings / emphasis:** use descriptive text, not emoji or color alone. Avoid decorative card overload.
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

If the user explicitly requests an HTML report/page, follow [HTML report contract](references/html-report-contract.md):

- Multi-section HTML uses a real table of contents with **left navigation by default** (top allowed when requested or on narrow screens), following an **h1 → h2 → h3** hierarchy.
- Data tables offer relevant filters when they help; long tables are paginated **20 rows per page by default**, optionally 50/100, with no page size below 20. The final page can contain fewer than 20 remaining records. Recompute page counts after filtering.
- Highlight high-priority **success figures in green** and **failure figures in red** near the top; label each metric in text and avoid coloring ordinary values just for decoration.
- Add pie/bar/line charts only when appropriate to composition/comparison/ordered trends. Charts and summary values must agree with displayed data and have accessible text equivalents.
- Standalone HTML can include reviewed client-side JS for local **filters, controls, forms, sliders, charts and navigation**; untrusted JSON remains data under a strict allowlist. No executable AI-supplied HTML/JS, no invented API actions, and no fake test data.
- Default terminal/Markdown output remains Markdown. An HTML file does not grant arbitrary UI capability inside the user's chat host.

See the offline [HTML report example](demo/report.html) and [its renderer logic](demo/report.js). This is a **separate** illustrative data format (`gen-ui-html-report/v1`), not a breaking change to the existing `gen-ui-demo/v1` demo.

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
- [Local validation script](scripts/test-skill.ps1)

Gen UI governs **presentation only**. Preserve existing engineering and verification requirements.