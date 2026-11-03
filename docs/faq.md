# Gen UI FAQ: Generative UI for Coding Agents

## What is Gen UI?

**Gen UI is a Markdown-first presentation Skill for AI coding agents**, with an optional, safe, repository-local demonstration of declarative interactive UI rendering. It helps organize code reviews, implementation plans, testing and acceptance reports.

## Is Gen UI the same as ChatGPT Intelligent UI?

No. Gen UI is an independent open-source Skill, not OpenAI's private UI runtime, official DIL implementation, or feature replacement. It focuses on portable output and an opt-in demo renderer.

## Can Codex CLI or Claude Code display interactive sliders just by installing it?

No. A terminal's UI capabilities are determined by the host. Installing Gen UI can improve text/Markdown organization; functional controls require a host renderer or Webview that supports the selected component schema.

## How is Gen UI different from a Markdown renderer?

A Markdown renderer displays text and standard markup. Gen UI is guidance for how agents should **choose and structure output** based on the host and evidence available. The included demo separately shows how a limited JSON protocol could be rendered in a browser.

## How does Gen UI compare with OpenUI, A2UI and other generative UI frameworks?

The goal is different. OpenUI and A2UI focus on generation and transport/rendering of UI descriptions in their respective ecosystems. Gen UI is a presentation Skill with a small educational `gen-ui-demo/v1` contract. It is **not wire-compatible** with those frameworks. Integrations require separate, tested adapters.

## Does Gen UI work with DeepSeek and local LLMs?

Agents that can follow provided instructions can use the Markdown rules, including via system prompts where Skill discovery is unavailable. Actual compliance depends on the model and host; there is no guarantee of identical output across models.

## Is the demo secure enough for production?

No. It is a deliberately constrained offline example with allowlisted sliders and computed metrics. Production environments need stronger schema validation, message boundaries, authentication, authorization, auditing, sandboxing and UI lifecycle management.

## Does it require a model API key or an online service?

No for the Markdown Skill and the offline browser demo. Host integrations may require their own model services but those are outside this repository.

## Does Gen UI execute code changes or verify tests?

No. Gen UI improves how an agent **reports** actions and evidence. The actual coding, verification and release workflow belongs to the user's other tools and project rules.

## Where should I start?

Read [the English README](../README.md) or [中文说明](../README.zh-CN.md), install the Skill, try [the acceptance-plan example](../examples/acceptance-plan.md), and view [the offline demo](../demo/index.html).

For implementation specifics, see [the renderer contract](../references/renderer-contract.md) and [host integration guide](integration.md).