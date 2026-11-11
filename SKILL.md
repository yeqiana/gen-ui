---
name: gen-ui
description: Use when AI responses become hard to understand, too long, or difficult to navigate. Reorganize technical analysis, design proposals, implementation plans, reviews, and test evidence for clear reading. Markdown by default; offline HTML and diagrams only when genuinely needed.
---

# Gen UI — Information Design Skill for AI Responses

## Purpose

Gen UI reduces **walls of text, comprehension effort, and reading friction**. It is an **Information Design Skill**, not a general UI framework or a replacement for coding, review, testing, or deployment tools.

**Goal:** make conclusions, evidence, limits, and next actions clear without losing facts. Follow the user's language. Never invent results or sources.

## Progressive capability routing

Choose the **least complex supported output**. Never load advanced assets by default.

| Request / host | Use | Open only when needed |
| --- | --- | --- |
| Everyday explanation, analysis, code review, plan | Short Markdown | This file |
| Explicit standalone HTML deliverable | Offline HTML report | [HTML report contract](references/html-report-contract.md) |
| Semantic SVG, topology, interaction, custom business model | HTML plus diagram support | [Semantic diagram model](references/semantic-diagram-model.md) and [HTML report contract](references/html-report-contract.md) |
| Host explicitly supports `gen-ui-demo/v1` | Validated UI data and complete Markdown fallback | [Renderer contract](references/renderer-contract.md) |
| Directory of multiple HTML documents | Thin offline navigation shell | [HTML report contract](references/html-report-contract.md) and `scripts/build-html-portal.mjs` |

Never assume Markdown can execute UI controls. If a trusted renderer is not declared, use Markdown. Whenever the final deliverable is HTML, follow its contract. **Do not change ordinary Markdown responses into HTML** without an HTML request.

## Reader-first transformation procedure

1. **Identify the reader's decision:** what must be understood, compared, chosen, verified, or done?
2. **Lead with the answer:** then give the minimum evidence, limits, risks, and next action.
3. **Choose the smallest effective structure:** short prose for simple points; comparison tables for alternatives; ordered steps for workflows; risk/acceptance matrices for engineering evidence; diagrams only if relationships are otherwise difficult to understand.
4. **Preserve factual boundaries:** distinguish observed facts, user input, proposals, examples, estimates, unrun tests, and unverified assumptions.
5. **Progressive detail:** essentials first; remove repetitive headings, decorative cards, and invented controls.
6. **Validate comprehension:** answer, rationale, uncertainty, next step.

## Default formatting

- Prefer concise prose to dashboards; use small comparison tables, clear procedures, and severity-ordered review findings.
- Distinguish **planned / in progress / completed / tested / failed**; do not claim unrun tests succeeded.
- Bold only key conclusions. Use consistent section numbering, meaningful links, and chart descriptions.
- Keep source numbers consistent with tables; label estimates and fictional demos.

## HTML and diagrams: on-demand, not core

For HTML output only, read the **HTML report contract** covering local assets, navigation, tables, code, links, accessibility, and favicon.

For relationships, read the **semantic diagram model** on demand. Semantic interactions, collision-safe labels, full text, and controls belong in the linked contract and renderer.

The host must not execute untrusted model text as HTML/JS. Do not fetch remote code or perform network/file side effects without explicit permission. The diagram renderer is optional, not a dependency of everyday answers.

## Evidence and checks

For coding work include only helpful fields: **goal, changed files, exact tests run/results, unresolved risks, and acceptance status**. Do not claim merge readiness based on illustrative examples or static screenshots. If work was not executed, label it clearly.

For HTML, check local links, mobile layout, keyboard access, and actual interactions. Run `scripts/test-skill.ps1` when changing the GEN-UI repository, not for ordinary Q&A.



Further reading: [English README](README.md) · [中文说明](README.zh-CN.md).
