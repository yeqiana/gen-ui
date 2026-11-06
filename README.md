# Gen UI

[简体中文](README.zh-CN.md) | **English**

> Readable AI coding output by default. Interactive UI only when the host can safely render it.

[![Validate Skill](https://github.com/yeqiana/gen-ui/actions/workflows/validate.yml/badge.svg)](https://github.com/yeqiana/gen-ui/actions/workflows/validate.yml)

**Gen UI** is a reusable Skill for Codex, Claude Code, DeepSeek-based agents, and other coding assistants. It organizes technical plans, code reviews, testing and acceptance reports into clear, evidence-based answers.

**Not a ChatGPT runtime:** This Skill does not ship an official DIL renderer or grant terminal applications interactive controls. Real interactivity requires a separately installed and trusted host Renderer.

## Capabilities

| Host | Output | Required |
| --- | --- | --- |
| CLI / terminal | Markdown, checklists, code and short tables | Agent instructions |
| GitHub / IDE Markdown | Readable GFM, optional diagrams with text fallback | Markdown preview |
| Web / IDE Webview | Declarative UI JSON and full Markdown fallback | Explicitly integrated Renderer |

The flow is **detect host capabilities → choose compact layouts → preserve verification evidence → fall back to Markdown**.

## Quick start

### Codex on Windows

~~~powershell
git clone https://github.com/yeqiana/gen-ui.git "$HOME\.codex\skills\gen-ui"
~~~

Then ask:

~~~text
Use $gen-ui. Write a Java thread-pool implementation, test, and acceptance plan.
The current host supports Markdown only.
~~~

### Claude Code / other agents

Put the Skill under your project's `.claude/skills/gen-ui/` or your agent's documented Skills location. For systems without Skill discovery, provide `SKILL.md` as an instruction and reference files when appropriate. A Skill improves content organization; it does not install a visual runtime.

## Multi-page directory portal (offline iframe shell)

When the deliverable names a **directory**, Gen UI recursively discovers all eligible `.html` / `.htm` files in nested folders, preserves every original page and relative assets, and builds a lightweight entry with a **real iframe as the main content**. Page titles select independent documents; existing identified H2 headings can appear below each page as child links. The monochrome rail collapses to a persistent single-column icon rail (never disappears); its expand/collapse control stays inside the rail in both states. No giant concatenated HTML output or decorative gradient sidebar.

~~~powershell
node scripts/build-html-portal.mjs --dir "D:\\reports" --title "Project acceptance"
# Keep an existing hand-authored index.html untouched:
node scripts/build-html-portal.mjs --dir "D:\\reports" --output "D:\\reports\\portal.html"
~~~

Try the [four-page offline portal](demo/portal-pages/index.html), inspect the [generator](scripts/build-html-portal.mjs) and read the [HTML contract](references/html-report-contract.md). Re-run after adding or removing source files; browsers cannot recursively scan directories at runtime.

**Safe preview modes:** double-clicking the generated portal (`file://`) displays local CSS with scripts disabled inside the iframe. To exercise existing page JavaScript and forms, run `node scripts/serve-html-portal.mjs --dir "D:\\reports"` and visit `http://127.0.0.1:8765/`. The loopback HTTP shell automatically switches to `sandbox="allow-scripts allow-forms"` **without** same-origin permission. No unsandboxed opt-in is offered; external content is not silently trusted.

## HTML reports: filters, charts, and navigation

When HTML is the selected output, Gen UI applies a **Chinese-first interface** (except technical names and actual source data), nonwrapping headers/cells, horizontal scrolling with optional sticky first column, overflow tooltips on hover/focus, and column-specific filters. Internal tabs and new browser tabs are marked with different visible Chinese labels. Favor a lean report with forms, dialogs and drawers over decorative cards. Keep one clear H1 with no subtitle directly below it, group related content, and prefer meaningful image-and-text explanations when visuals are supported. Use only a few meaningful emoji per page; never rely on them instead of labels. A collapsed sidebar remains as a vertical icon rail, with its toggle inside the rail. The personal mark is reduced to a single double-peak cat-ear stroke with no full face or ornament; companion icons remain monochrome and semantically clear. See the [GEN-UI visual and HTML rules](references/html-report-contract.md), [visual acceptance checklist](evals/visual-design-acceptance-2026-11-06.md), and [SVG icon set](assets/icons/README.md).

Try the [offline Chinese HTML report](demo/report.html) with its [stylesheet](demo/report.css), [JavaScript](demo/report.js) and [local brand icons](assets/icons/README.md). It demonstrates a 67-row **fictional** dataset; all controls are local and no server is contacted automatically. See [HTML report contract](references/html-report-contract.md).



When **HTML is the selected final deliverable** (explicitly requested or established by the current task), Gen UI specifies practical report layouts: a collapsible monochrome left rail for multi-page iframe portals, optional in-page anchors for standalone reports, meaningful table filters, **20/50/100 rows per page**, success/failure KPI highlighting, appropriate pie/bar/line charts, and safe local forms/sliders. These features run in actual HTML, not in a plain terminal.

Open the [offline HTML report](demo/report.html) (keep [report.js](demo/report.js) beside it) to try the 67-row illustrative dataset. Read the [HTML report contract](references/html-report-contract.md) for accessibility, data validation, pagination, and security constraints. This report format is separate from the existing lightweight UI protocol.

## Interactive demo

Open [demo/index.html](demo/index.html) in a browser. Drag the slider and inspect the read-only metrics. Paste [the example JSON](examples/thread-pool.ui.json) into the editor to test the safe Renderer. No server, API key, network access, or build is required.

This demo uses its **own illustrative protocol** (`gen-ui-demo/v1`). It is not interchangeable with OpenUI, A2UI, or DIL. Read [the contract](references/renderer-contract.md) and [integration notes](docs/integration.md).

## Real-browser acceptance and actual Agent evaluation

Run a **real Chrome/Edge regression against the trusted repository demo** with Node.js (no model calls):

~~~powershell
node tests/chrome-report-smoke.mjs
~~~

The script checks three viewports, keyboard focus, table filtering, tooltips, and newly created records. It intentionally **does not accept arbitrary AI-generated HTML**. See the [local verification baseline](evals/real-agent-baseline-2026-11-05.md) and [saved Chrome evidence](evals/chrome-demo-baseline-2026-11-05.json) and [real-Agent evaluation instructions](evals/agent-evaluation.md). Updated real-Agent status: the desktop user's Codex CLI login was **verified**, but the actual HTML04 attempt was **blocked by a Windows exec_command policy rejection** before any files could be produced. No Agent compliance score is claimed; see the [attempt evidence](evals/codex-user-session-attempt-2026-11-05.md).

## Checks
Release note: no v1.4.0 Git Tag or GitHub Release has been created; see the [release readiness gate](docs/release-readiness-v1.4.0.md).


~~~powershell
# Windows PowerShell 5.1+
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/test-skill.ps1

# PowerShell 7, Windows/macOS/Linux
pwsh -NoProfile -File scripts/test-skill.ps1
~~~

The existing CI runs repository checks on pushes and pull requests; the browser CI job is now defined but still requires a verified remote GitHub Actions run. Static checks do not prove general model compliance. Five saved samples generated through ChatGPT GPT-6 + WebCodex across two Skill baselines have been tested, but the original Codex CLI independent blind test remains unverified. Read the [Agent evidence matrix](evals/webcodex-agent-matrix-2026-11-06.md), [Codex blind-test gate](evals/codex-blind-gate-2026-11-06.md), and [v1.4.0 release readiness checklist](docs/release-readiness-v1.4.0.md).

## Repository layout

~~~text
SKILL.md                    # Agent presentation rules
agents/openai.yaml          # Agent metadata
README.md / README.zh-CN.md # English / Chinese usage
references/                 # Illustrative JSON contract
examples/                   # Markdown and JSON outputs
demo/                       # Offline browser renderer
docs/                       # Integration guidance
evals/                      # Manual model behavior checks
tests/                      # Node tests
scripts/test-skill.ps1      # Validation entry point
.github/workflows/          # CI
~~~

## Realistic examples

These examples model practical coding-assistant tasks; they are **illustrative**, not claims that a real repository was inspected or tests were executed.

| Scenario | Output | What it demonstrates |
| --- | --- | --- |
| [Java code review](examples/code-review.md) | Severity-first findings, evidence, focused verification | No fake CI or merge-ready claims |
| [Feature acceptance plan](examples/acceptance-plan.md) | Bounded implementation and manual test steps | Clear separation of planned vs verified |
| [Java thread-pool explanation](examples/thread-pool.md) | Safe, readable Markdown fallback | Works in a terminal with no renderer |

For common questions about CLI widgets, model compatibility, security, and OpenUI/A2UI differences, read the [FAQ](docs/faq.md).

## Discovery and GEO

The canonical positioning is **a Markdown-first Generative UI Skill for AI coding agents**—not a general-purpose UI framework. [The GEO foundation](docs/geo.md) documents truthful GitHub About suggestions, searchable use cases, and measurement boundaries. [The observation checklist](evals/discovery-baseline.md) begins in **not measured** state, not an invented ranking score.

Adding README content does not automatically set repository Topics, launch a website, or guarantee search/AI citations. Repository metadata must be applied and verified separately. The project does not add an unnecessary `llms.txt` by default.
## Boundaries

- **Presentation, not execution:** Does not replace implementation plans, coding guardrails, or verification processes.
- **Capability-aware:** Unknown hosts get Markdown, never fake sliders.
- **Untrusted data:** Never execute model-generated HTML, JavaScript, CSS, events, or arbitrary network requests.
- **Evidence required:** Never claim tests passed or work was pushed without observing it.
- **Demo only:** The browser renderer is not integrated into WebCodex chat in this version.

MIT licensed. See [LICENSE](LICENSE).