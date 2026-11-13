---
name: gen-ui
description: Use when AI responses become hard to understand, too long, or difficult to navigate. Reorganize technical analysis, design proposals, implementation plans, reviews, and test evidence for clear reading. Markdown by default; offline HTML and diagrams only when genuinely needed.
---

# Gen UI — Information Design Skill for AI Responses

## Design invariants

**Lightweight entry, full capability, no regression.** Load assets and contracts only when needed; enhance Markdown progressively. See [Skill principles](docs/skill-principles.md).

For HTML, run `node scripts/validate-html-report.mjs <report.html>` unless testing is declined; apply [typography](references/typography.md) only to generated HTML prose.

## Purpose

Gen UI reduces walls of text and reading friction. It is an **Information Design Skill**, not a coding or testing replacement.

**Goal:** make conclusions, evidence, limits, and next actions clear without losing facts. Follow the user's language; never invent results or sources.

## Progressive capability routing

Route by **requested output**, not topic: "report" alone means Markdown. Load HTML or diagrams only when the deliverable requires them.

| Request / host | Use | Open only when needed |
| --- | --- | --- |
| Everyday explanation, analysis, code review, plan | Short Markdown | This file |
| Simple static HTML report (no data interaction) | Content-first offline document with real navigation | [HTML essentials](references/html-report-essentials.md) |
| Rich, interactive or single-file HTML; diagrams and portals | Feature-specific offline HTML | [HTML report contract](references/html-report-contract.md) |
| Semantic SVG, topology, interaction, custom business model | HTML plus diagram support | [Semantic diagram model](references/semantic-diagram-model.md) and [HTML report contract](references/html-report-contract.md) |
| Business, product, system, data, technology, application, function or information architecture | Layered, stacked or nested containers; connect only true relationships | [Architecture patterns](references/architecture-patterns.md) |
| Host explicitly supports `gen-ui-demo/v1` | Validated UI data and complete Markdown fallback | [Renderer contract](references/renderer-contract.md) |
| Directory of multiple HTML documents | Thin offline navigation shell | [HTML report contract](references/html-report-contract.md) and `scripts/build-html-portal.mjs` |

Without a trusted renderer, use Markdown. For HTML deliverables, follow its contract; never upgrade ordinary answers to HTML without a request.

## Reader-first transformation procedure

1. **Identify the reader's decision:** what must be understood, compared, chosen, verified, or done?
2. **Lead with the answer:** then give the minimum evidence, limits, risks, and next action.
3. **Choose the smallest effective structure:** prose, tables, steps, evidence matrices or diagrams only when needed.
4. **Preserve factual boundaries:** distinguish facts, proposals, unrun tests and unknown state-transition gates; state conditions, not assumed rules.
5. **Progressive detail:** remove filler and repetition, not facts, evidence, constraints, or required steps; expand when needed.
6. **Validate:** one summary only, if requested, required by another Skill, or useful in long docs.

For ambiguous formats, read [Information design](references/information-design-decision.md). For dense content or iterative reviews, read [Reading layers](references/reading-layers.md) only when needed.

## Default formatting

- Keep code, commands, paths, numbers, errors, and technical terms exact. Use visuals only for meaningful differences.
- Distinguish **planned / in progress / completed / tested / failed**; do not claim unrun tests succeeded.
- Bold only key conclusions. Use consistent section numbering, meaningful links, and chart descriptions.
- Keep source numbers consistent with tables; label estimates and fictional demos.
- 🎯 insight; 💡 idea; ❌ proven error; ⚠️ risk/uncertainty. Place beside key sentences; no routine decoration or unsupported ❌.

## HTML and diagrams: on-demand, not core

For simple static HTML, use [HTML essentials](references/html-report-essentials.md); for rich or single-file HTML, use the [HTML report contract](references/html-report-contract.md). Read the [diagram model](references/semantic-diagram-model.md) only when needed.

Never execute untrusted HTML/JS or fetch remote code; external side effects require permission.

## Evidence and checks

For engineering changes, report real file edits, executed checks, results and risks. For reviews, report findings, not invented edits or test results.

For HTML, verify offline links, mobile layout, keyboard access and requested interactions. Run `scripts/test-skill.ps1` for repository changes unless testing is declined; disclose skipped checks.



Further reading: [English README](README.md) · [中文说明](README.zh-CN.md).
