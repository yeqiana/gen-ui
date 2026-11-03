# Gen UI discoverability / GEO foundation (v1.1)

This file documents **truthful discoverability work**, not a promise of AI recommendations or search ranking. GEO = Generative Engine Optimization; its practical foundation here is findable, accessible, verifiable technical content.

## Canonical product definition

**Name:** Gen UI

**Category:** Markdown-first AI coding agent presentation Skill, with an optional standalone interactive UI demo.

**Audience:** Developers using Codex, Claude Code, DeepSeek-backed agents, IDE AI assistants, and custom coding agents.

**Problem:** Coding agents produce unreadable reports, misleading completion claims, overly wide tables, and UI syntax that the actual host cannot render.

**Solution:** Detect host capability; prefer useful, evidence-based Markdown; only opt in to explicitly supported, validated UI data with a Markdown fallback.

**Not:** a replacement for ChatGPT's renderer, an implementation of OpenUI/A2UI, an agent orchestration system, or a production UI framework.

## Suggested GitHub About metadata (manual application required)

The files in this repository **do not automatically configure GitHub About**.

**Description:**

> Markdown-first Gen UI Skill for AI coding agents, with evidence-based reports and safe interactive UI fallbacks.

**Topics (select only those currently accurate):**

`generative-ui`, `agent-skills`, `coding-agents`, `ai-coding`, `markdown`, `developer-tools`, `codex`, `claude-code`, `interactive-ui`

**Website:** leave empty until a real, publicly accessible docs site is deployed; do not invent a GitHub Pages address.

**Repository:** https://github.com/yeqiana/gen-ui

To set metadata, open the repository, click the gear icon next to **About**, enter Description and Topics, and save. This step must be recorded as **not applied** unless verified via GitHub.

## Search intent and truthful landing pages

| Real user question | Relevant page | Verifiable answer |
| --- | --- | --- |
| How can I make Codex responses more readable? | [README](../README.md), [Skill](../SKILL.md) | Markdown structure guidance |
| Can I get ChatGPT-like UI in Claude Code? | [FAQ](faq.md) | Only with a capable host and separate renderer |
| Can a Coding Agent output a tested acceptance plan? | [Acceptance sample](../examples/acceptance-plan.md) | Evidence vs unverified separation |
| How to present a Java code review? | [Review sample](../examples/code-review.md) | Short, severity-first review format |
| How to make a safe JSON-driven slider? | [Demo](../demo/index.html), [Contract](../references/renderer-contract.md) | Offline demo and validation rules |

Maintain unique helpful content and avoid stuffing synonyms into every paragraph.

## Technical discoverability

- Keep the English README as the default GitHub landing page with a clear language switch.
- Keep canonical descriptions consistent in README, SKILL.md, agent metadata and FAQ.
- Maintain working relative links and accessible example files; automated link tests are required.
- Publish a separate website **only after** a host and deployment workflow are configured; a repository directory is not a live site.
- Don't claim website indexing, AI citation, GitHub rank, or search performance without independent measurement.
- `llms.txt` is not included by default: it is not required for Google Search/AI features.

## Measuring outcomes (manual baseline required)

Use [the discovery baseline checklist](../evals/discovery-baseline.md). Record query, engine, region, date, search results, evidence links, and whether Gen UI is cited **as observed**, not as a made-up "GEO score".

Suggested signals: repository discoverability through GitHub search, external references from independent contributors, docs link clicks where data exists, organic stars and issues, actual AI citations captured in dated reproducible tests.

The initial baseline is **not measured**. Regularly repeat the exact prompts and preserve screenshots or URLs when permitted; results can vary by personalization, indexing, region, model and time.

## Source guidance and limits

Google's official documentation emphasizes fundamental search quality and original, helpful content. It does **not** require special AI text files, content chunking, or "GEO hacks":

- https://developers.google.com/search/docs/appearance/ai-features
- https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/classifying-your-repository-with-topics

No optimization guarantees inclusion in an AI answer or a particular search position.