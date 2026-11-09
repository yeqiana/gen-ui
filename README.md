# Gen UI

[简体中文](README.zh-CN.md) | **English**

> Markdown-first presentation for coding agents, with practical, offline HTML examples.

[![Validate Skill](https://github.com/yeqiana/gen-ui/actions/workflows/validate.yml/badge.svg)](https://github.com/yeqiana/gen-ui/actions/workflows/validate.yml)

**Gen UI** is a reusable presentation Skill for Codex, Claude Code, DeepSeek-based agents, and other coding assistants. It structures reviews, plans, technical analysis, test results and acceptance reports into readable, evidence-aware output.

It is **not** OpenAI's ChatGPT UI runtime or an official DIL implementation. A terminal does not become interactive merely by installing a Skill. The host must provide and authorize a renderer.

## Five offline HTML showcases

These are real HTML files in this repository, with browser-rendered previews. All publicly shown business names, messages, media and metrics are synthetic or redrawn. Source inspiration does **not** imply a current source-code audit or a production deployment.

### 01 · StoryOS — AI production workbench

[![StoryOS example screenshot](demo/cases/assets/story-workbench-preview.png)](demo/cases/story-workbench.html)

An editorial production workbench inspired by verified StoryOS console design notes. Covers creative entry points, work status, approved-media concepts and evidence-aware workflow presentation. Actual project media and story names are not included.

[Open HTML](demo/cases/story-workbench.html)

### 02 · Messaging architecture — authorization and delivery

[![Messaging architecture example](demo/cases/assets/im-message-flow-preview.png)](demo/cases/im-message-flow.html)

Redrawn from historical messaging-system design materials: send authorization snapshots, transactional outbox, message queues, ACKs, retries and idempotency. No internal brand, endpoints, accounts or user messages.

[Open HTML](demo/cases/im-message-flow.html)

### 03 · Hot/cold data — message archiving and search

[![Archive architecture example](demo/cases/assets/cold-archive-preview.png)](demo/cases/cold-archive.html)

Hot storage, cold archive, reconciliation watermarks, idempotent replay, and search-index lookup followed by authoritative record retrieval. **A proposal example, not a claim of deployed behavior.**

[Open HTML](demo/cases/cold-archive.html)

### 04 · Android 4.2 TV — legacy launcher refresh

[![TV launcher HTML concept](demo/cases/assets/tv-launcher-preview.png)](demo/cases/tv-launcher.html)

A self-contained HTML design concept for remote-control focus, app entry points, clock and wallpaper on an Android 4.2.1 / API 17 class television. **This is not a device screenshot.**

[Open HTML](demo/cases/tv-launcher.html)

### 05 · QR Audit — offline scan evidence

[![QR audit report example](demo/cases/assets/qr-audit-report-preview.png)](demo/cases/qr-audit-report.html)

An evidence-oriented report for QR recognition strategies, pair-level metrics, run fingerprints and traceable failures. All displayed success rates are illustrative.

[Open HTML](demo/cases/qr-audit-report.html)

[**Browse all five showcases**](demo/cases/index.html) · [Case provenance and redaction notes](docs/cases.md) · [Demo directory guide](demo/README.md)

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
| [Business showcase gallery](demo/cases/index.html) | Five redacted offline HTML pages |
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
node tests/chrome-cases-smoke.mjs
~~~

These checks validate **trusted repository examples**, not general model compliance or production behavior. Native Codex blind-test and release readiness require separate evidence. See [Agent evaluation](evals/webcodex-agent-matrix-2026-11-06.md) and [release gate](docs/release-readiness-v1.4.0.md).

## Repository layout

~~~text
SKILL.md                 Skill presentation rules
references/              HTML report and renderer contracts
demo/cases/              Five public-safe business showcases and previews
demo/                    Quality report, directory portal and protocol demo
examples/                Markdown/JSON review and implementation examples
docs/                    Case provenance, integration, FAQ and discoverability
tests/                   Node and real-browser regression suites
evals/                   Browser and real-Agent evidence
scripts/                 Validation and preview utilities
~~~

**Boundaries:** Gen UI governs presentation, not execution. Never claim code was deployed, a test passed or a task was pushed without evidence. See the [FAQ](docs/faq.md) and [GEO notes](docs/geo.md).

MIT licensed · [LICENSE](LICENSE).
