# Gen UI

[简体中文](README.zh-CN.md) | **English**

> Markdown-first presentation for coding agents, with professional offline HTML technical documents.

[![Validate Skill](https://github.com/yeqiana/gen-ui/actions/workflows/validate.yml/badge.svg)](https://github.com/yeqiana/gen-ui/actions/workflows/validate.yml)

**Gen UI** is a reusable presentation Skill for Codex, Claude Code, DeepSeek-based agents, and other coding assistants. It structures reviews, plans, technical analysis, test results and acceptance reports into readable, evidence-aware output.

It is **not** OpenAI's ChatGPT UI runtime or an official DIL implementation. A terminal does not become interactive merely by installing a Skill. The host must provide and authorize a renderer.

## Four technical-document HTML examples

These are **engineering documents generated for Coding Agent workflows**, not product dashboards or business-application mockups. The four documents share one sanitized AI content-production scenario and cover analysis, architecture, implementation, and testing.

### 01 · Project analysis report

[![Project analysis HTML preview](demo/documents/assets/project-analysis-preview.png)](demo/documents/project-analysis.html)

A structured project analysis covering business goals, module boundaries, architecture, execution flow, domain model, risks, and recommendations.

[Open project analysis](demo/documents/project-analysis.html)

### 02 · System architecture design

[![Architecture design HTML preview](demo/documents/assets/architecture-design-preview.png)](demo/documents/architecture-design.html)

A detailed design with component responsibilities, task state machine, sequence diagrams, data model, concurrency control, transactional outbox, fencing tokens, and recovery.

[Open architecture design](demo/documents/architecture-design.html)

### 03 · Technical implementation plan

[![Implementation plan HTML preview](demo/documents/assets/implementation-plan-preview.png)](demo/documents/implementation-plan.html)

An actionable engineering plan with scope, phases, dependencies, migration, rollout, rollback, risks, and acceptance gates.

[Open implementation plan](demo/documents/implementation-plan.html)

### 04 · Test and acceptance plan

[![Test and acceptance HTML preview](demo/documents/assets/test-acceptance-preview.png)](demo/documents/test-acceptance.html)

A test matrix, reproducible scenarios, fault injection, performance test stages, security checks, and evidence-based acceptance criteria. All test cases are explicitly marked as not yet executed.

[**Browse all four technical documents**](demo/documents/index.html) · [Document scope and provenance](docs/html-document-examples.md) · [Demo directory guide](demo/README.md)

## Install

### Codex on Windows

~~~powershell
git clone https://github.com/yeqiana/gen-ui.git "$HOME\.codex\skills\gen-ui"
~~~

Then ask:

~~~text
Use $gen-ui to produce an implementation, testing and acceptance plan
for this repository. Separate planned work from verified results.
The current host supports Markdown, not interactive widgets.
~~~

For Claude Code, place the files under a project-level `.claude/skills/gen-ui/` (or the supported Skills directory). Other agents can read `SKILL.md` and `references/` as instructions. Installing the Skill does not grant tool access or add a UI renderer.

## Output modes

| Host | Default presentation | Requirement |
| --- | --- | --- |
| Terminal / Coding Agent CLI | Markdown, concise tables, code and evidence | Skill instructions |
| GitHub / IDE preview | GFM, optional diagrams with text fallback | Markdown preview |
| Requested offline HTML artifact | Local styles, filters, charts and navigation | Trusted authored HTML resources |
| Explicitly integrated Webview | Validated declarative UI data + Markdown fallback | Trusted host Renderer |

The bundled `gen-ui-demo/v1` JSON contract is educational; it is not interoperable with DIL, OpenUI or A2UI. Arbitrary model-provided HTML/JS must never be executed as trusted application code.

## Demos and tools

| Entry | Purpose |
| --- | --- |
| [Technical document examples](demo/documents/index.html) | Four project analysis, architecture, implementation, and test documents |
| [Quality report](demo/report.html) | Filtering, pagination, charts and drawers |
| [Multi-page portal](demo/portal-pages/index.html) | Recursive HTML directory with sandboxed iframe |
| [Declarative UI demo](demo/index.html) | Safe educational slider / JSON example |
| [Portal generator](scripts/build-html-portal.mjs) | Build a portal from existing HTML files |

~~~powershell
node scripts/build-html-portal.mjs --dir "D:\reports" --title "Engineering report"
# Keep an existing hand-authored index.html intact:
node scripts/build-html-portal.mjs --dir "D:\reports" --output "D:\reports\portal.html"
# Safe loopback preview for trusted scripts and forms:
node scripts/serve-html-portal.mjs --dir "D:\reports"
~~~

Double-click `file://` portal preview disables child scripts; the loopback HTTP preview permits scripts/forms while withholding same-origin iframe permission. See the [HTML contract](references/html-report-contract.md) and [integration guide](docs/integration.md).

## Markdown examples

The existing [Java code review](examples/code-review.md), [implementation acceptance plan](examples/acceptance-plan.md) and [Java thread pool](examples/thread-pool.md) remain available for CLI and IDE Markdown workflows. They are illustrative examples, not claims of executed tests.

## Verify

~~~powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/test-skill.ps1
node tests/chrome-report-smoke.mjs
node tests/chrome-portal-smoke.mjs
node tests/chrome-documents-smoke.mjs
~~~

These checks validate **trusted repository examples**, not general model compliance or production behavior. Native Codex blind-test and release readiness require separate evidence. See [Agent evaluation](evals/webcodex-agent-matrix-2026-11-06.md) and [release gate](docs/release-readiness-v1.4.0.md).

## Repository layout

~~~text
SKILL.md                 Skill presentation rules
references/              HTML report and renderer contracts
demo/documents/           Four professional technical-document HTML examples
demo/                    Quality report, directory portal and protocol demo
examples/                Markdown/JSON review and implementation examples
docs/                    HTML document examples, integration, FAQ and discoverability
tests/                   Node and real-browser regression suites
evals/                   Browser and real-Agent evidence
scripts/                 Validation and preview utilities
~~~

**Boundaries:** Gen UI governs presentation, not execution. Never claim code was deployed, a test passed or a task was pushed without evidence. See the [FAQ](docs/faq.md) and [GEO notes](docs/geo.md).

MIT licensed · [LICENSE](LICENSE).
