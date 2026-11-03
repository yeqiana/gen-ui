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

## Interactive demo

Open [demo/index.html](demo/index.html) in a browser. Drag the slider and inspect the read-only metrics. Paste [the example JSON](examples/thread-pool.ui.json) into the editor to test the safe Renderer. No server, API key, network access, or build is required.

This demo uses its **own illustrative protocol** (`gen-ui-demo/v1`). It is not interchangeable with OpenUI, A2UI, or DIL. Read [the contract](references/renderer-contract.md) and [integration notes](docs/integration.md).

## Checks

~~~powershell
# Windows PowerShell 5.1+
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/test-skill.ps1

# PowerShell 7, Windows/macOS/Linux
pwsh -NoProfile -File scripts/test-skill.ps1
~~~

CI runs the same checks on pushes and pull requests. Static checks and Node tests do not prove the Skill is followed by every model or that a real browser has been manually tested. See [manual evaluation](evals/manual-evaluation.md).

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