# Gen UI · Make AI answers easier to read and understand

[简体中文](README.zh-CN.md) | **English**

> Transform dense AI output into clear conclusions, structured evidence, meaningful comparisons, and actionable next steps. **Information design, not UI decoration.**

[![Validate Skill](https://github.com/yeqiana/gen-ui/actions/workflows/validate.yml/badge.svg)](https://github.com/yeqiana/gen-ui/actions/workflows/validate.yml)

**Gen UI is an information-design Skill for AI coding assistants.** It makes technical explanations, code reviews, architecture decisions, implementation plans, and test evidence easier to follow. Markdown is the default; trusted offline HTML and validated interactive data are used only when the task and host support them.

## Why Gen UI?

| Reading problem | Gen UI approach |
| --- | --- |
| A wall of text hides the conclusion | Answer first; follow with evidence, limitations, and next steps |
| Several options are difficult to compare | Show criteria, trade-offs, and conditional recommendations |
| Dependencies and workflows are hard to picture | Numbered procedures, diagrams, and accessible descriptions |
| Planned work looks like completed work | Explicit statuses, test evidence, and verification boundaries |
| Large datasets hide important records | Relevant filters, pagination, focused columns, and charts |
| The same answer must work across hosts | Host-aware Markdown, diagrams, or trusted offline HTML |

**What matters:** Preserve facts and nuance. Never fabricate tests, code changes, or deployment outcomes. Do not add decorative widgets without a reading purpose.

## Before and after: a technical answer

**Dense answer:** “Thread-pool size depends on CPU, blocking I/O, pool settings, queue capacity, rejection policies, service latency, and various environmental factors, and you should measure and tune it...”

**Gen UI response:** **Conclusion:** Start with a bounded queue and an explicit rejection policy; size the pool using workload measurements. **Evidence:** CPU-bound and blocking tasks have different bottlenecks. **Next:** Measure queue wait, P95/P99 latency, and CPU utilization before tuning.

This is an example of information structure, not production sizing advice.

## Four complete English HTML examples

The following examples are **English content with English page previews**, not links to Chinese articles. They use one fictional asynchronous AI workflow to demonstrate four distinct reading tasks. These are design examples, not verified audit or benchmark results.

### 01 · Project analysis report

[![English project analysis report preview](demo/documents/assets/en-project-analysis-preview.png)](demo/documents/en/project-analysis.html)

Context, module responsibilities, workflow boundaries, risks, and recommendations. [Read the project analysis](demo/documents/en/project-analysis.html).

### 02 · System architecture design

[![English system architecture design preview](demo/documents/assets/en-architecture-design-preview.png)](demo/documents/en/architecture-design.html)

Task states, component responsibilities, fenced execution, transactional delivery, and recovery. [Read the architecture design](demo/documents/en/architecture-design.html).

### 03 · Technical implementation plan

[![English implementation plan preview](demo/documents/assets/en-implementation-plan-preview.png)](demo/documents/en/implementation-plan.html)

Phases, dependencies, database migration, rollout, rollback, and evidence-based exit criteria. [Read the implementation plan](demo/documents/en/implementation-plan.html).

### 04 · Test and acceptance plan

[![English test and acceptance plan preview](demo/documents/assets/en-test-acceptance-preview.png)](demo/documents/en/test-acceptance.html)

Risk-based test cases, fault injection, performance evaluation, and acceptance gates. [Read the test plan](demo/documents/en/test-acceptance.html).

[**Browse the English document gallery**](demo/documents/en/index.html).

### Ten English information-design examples

[![English information-design case gallery](demo/documents/assets/en-report-preview.png)](demo/report.en.html)

[Explore ten English reading scenarios](demo/report.en.html): answer-first summaries, decision tables, procedures, reviews, task statuses, acceptance evidence, troubleshooting, host adaptation, long documents, and purposeful interaction. The [complete interactive Chinese report](demo/report.html) separately demonstrates the full offline HTML control set.

## Robust diagrams, icon-only copy, and image inspection

The offline HTML examples now include a **shared SVG viewer** with familiar zoom-magnifier, fit-to-view, expand, and collapse icons. The state machine serializes fullscreen transitions, preserves pan/zoom across entry and exit, supports native Escape and browser fullscreen events, and falls back to a local overlay if the browser rejects fullscreen.

Use **one or more of seven diagram types only when the information calls for it**: sequence, mind map, deployment/topology, ER, activity, swimlane, and component diagrams. Nodes can be armed with a double click and repositioned without overlapping other labels; connectors follow them. Full text descriptions remain available when graphics are unsupported.

Code blocks use an icon-only Copy → Check/Error → Copy cycle (1-second reset, no visible success text). Content images can open a same-page fullscreen-style zoom viewer. Quoted callouts end cleanly at their final nonempty line, and standalone documents default to a left navigation and the local M-shaped favicon.

## Install

Windows PowerShell, Codex:

~~~powershell
git clone https://github.com/yeqiana/gen-ui.git "$HOME\.codex\skills\gen-ui"
~~~

Example agent prompt:

~~~text
Use $gen-ui to explain the asynchronous job system in this repository.
Begin with the conclusion and its evidence. Then show risks and next actions.
Avoid dense text walls; use a comparison table, steps, or a diagram only where useful.
Separate verified findings from assumptions and work that has not been executed.
The current host supports Markdown, not interactive controls.
~~~

Claude Code can load a project-level `.claude/skills/gen-ui/` directory. Installing a Skill does not grant tool access or turn a terminal into an interactive renderer.

## Supported output formats

| Host | Recommended output | Boundary |
| --- | --- | --- |
| Terminal / coding CLI | Structured Markdown | No pretend controls |
| GitHub / IDE | Markdown and supported diagrams | Accessible text fallback |
| Explicit offline HTML request | Trusted local HTML/CSS/JS | Interaction serves reading tasks |
| Configured Webview Renderer | Validated declarative data + Markdown | Host must declare its schema |

Additional **English Markdown examples**: [Java code review](examples/code-review.md), [implementation and acceptance plan](examples/acceptance-plan.md), and [thread-pool explanation](examples/thread-pool.md). You can also explore the [offline portal](demo/portal-pages/index.html) and the [renderer contract](references/renderer-contract.md).

## Verify the examples

~~~powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/test-skill.ps1
node tests/chrome-report-smoke.mjs
node tests/chrome-documents-smoke.mjs
~~~

These checks validate fixed, trusted repository examples; they do not establish general model compliance or results from a real project. See [SKILL.md](SKILL.md), [integration](docs/integration.md), and [FAQ](docs/faq.md) for capability and safety boundaries.

MIT License · [LICENSE](LICENSE).
