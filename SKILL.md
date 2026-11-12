---
name: gen-ui
description: Use when AI responses become hard to understand, too long, or difficult to navigate. Reorganize technical analysis, design proposals, implementation plans, reviews, and test evidence for clear reading. Markdown by default; offline HTML and diagrams only when genuinely needed.
---

# Gen UI — Information Design Skill for AI Responses

## Design invariants

**Lightweight entry, full capability, no regression.** Load contracts, assets and scripts only when needed; progressively enhance Markdown to offline HTML to semantic interaction. See [Skill principles](docs/skill-principles.md).

For standalone HTML delivery, run `node scripts/validate-html-report.mjs <report.html>` before acceptance; see the HTML report contract.

## Purpose

Gen UI reduces **walls of text and reading friction**. It is an **Information Design Skill**, not a UI framework or a replacement for coding, review, testing, or deployment tools.

**Goal:** make conclusions, evidence, limits, and next actions clear without losing facts. Follow the user's language; never invent results or sources.

## Progressive capability routing

Choose the **least complex supported output**. Never load advanced assets by default.

| Request / host | Use | Open only when needed |
| --- | --- | --- |
| Everyday explanation, analysis, code review, plan | Short Markdown | This file |
| Explicit standalone HTML deliverable | Offline HTML report | [HTML report contract](references/html-report-contract.md) |
| Semantic SVG, topology, interaction, custom business model | HTML plus diagram support | [Semantic diagram model](references/semantic-diagram-model.md) and [HTML report contract](references/html-report-contract.md) |
| Business, product, system, data, technology, application, function or information architecture | Layered, stacked or nested containers; connect only true relationships | [Architecture patterns](references/architecture-patterns.md) |
| Host explicitly supports `gen-ui-demo/v1` | Validated UI data and complete Markdown fallback | [Renderer contract](references/renderer-contract.md) |
| Directory of multiple HTML documents | Thin offline navigation shell | [HTML report contract](references/html-report-contract.md) and `scripts/build-html-portal.mjs` |

Markdown cannot execute UI controls. Without a declared trusted renderer, use Markdown. For HTML deliverables, follow its contract; never upgrade ordinary answers to HTML without a request.

## Reader-first transformation procedure

1. **Identify the reader's decision:** what must be understood, compared, chosen, verified, or done?
2. **Lead with the answer:** then give the minimum evidence, limits, risks, and next action.
3. **Choose the smallest effective structure:** short prose for simple points; comparison tables for alternatives; ordered steps for workflows; risk/acceptance matrices for engineering evidence; diagrams only if relationships are otherwise difficult to understand.
4. **Preserve factual boundaries:** distinguish observed facts, user input, proposals, examples, estimates, unrun tests, and unverified assumptions.
5. **Progressive detail:** essentials first; remove filler and repetition, not facts, evidence, constraints, or required steps. Expand when asked or when brevity obscures meaning.
6. **Validate comprehension:** answer, rationale, uncertainty, next step.

For complex or ambiguous format choices, consult [Information design decision](references/information-design-decision.md) only when needed.

## Default formatting

- Be concise, not terse. Keep code, commands, paths, numbers, errors, and technical terms exact; use tables and diagrams only when they clarify real differences or relationships.
- Distinguish **planned / in progress / completed / tested / failed**; do not claim unrun tests succeeded.
- Bold only key conclusions. Use consistent section numbering, meaningful links, and chart descriptions.
- Keep source numbers consistent with tables; label estimates and fictional demos.
- 🎯 insight; 💡 idea; ❌ proven error; ⚠️ risk/uncertainty. Place beside key sentences; no routine decoration or unsupported ❌.

## HTML and diagrams: on-demand, not core

For HTML only, read the [HTML report contract](references/html-report-contract.md).

For relationships, read the [semantic diagram model](references/semantic-diagram-model.md) on demand; SVG and interaction details stay there.

The host must not execute untrusted model text as HTML/JS. Do not fetch remote code or perform network/file side effects without explicit permission. The diagram renderer is optional, not a dependency of everyday answers.

## Evidence and checks

For coding work report **goal, changed files, exact tests/results, unresolved risks, and acceptance**. Never infer readiness from examples or screenshots; label unrun work.

For HTML, check local links, mobile layout, keyboard access, and actual interactions. Run `scripts/test-skill.ps1` when changing the GEN-UI repository, not for ordinary Q&A.



Further reading: [English README](README.md) · [中文说明](README.zh-CN.md).
