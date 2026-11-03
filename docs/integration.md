# Integrating Gen UI with Coding Agents and Host Renderers

Gen UI has two separable paths: **prompt-side presentation guidance**, which works with Markdown-capable agents today, and **host-side interactive rendering**, which requires integration.

## 1. Markdown-first (default)

```text
Coding agent → read SKILL.md → compose Markdown → CLI / GitHub / IDE viewer
```

This path needs no special UI runtime or network service. When host capabilities are unknown, use it unconditionally.

## 2. Interactive host (opt-in, not bundled)

```text
Agent produces Markdown fallback + declarative JSON
                           ↓
              Host routes message parts
                           ↓
                  Schema validator
                           ↓
              Trusted component renderer
                           ↓
                Local state updates
```

The included browser demo implements an **illustrative** `gen-ui-demo/v1` protocol. Details: [renderer contract](../references/renderer-contract.md). It does **not** implement OpenUI, A2UI, or DIL.

## 3. Separation of responsibility

| Layer | Owns | Must not |
| --- | --- | --- |
| Skill | Readable structure, fallback and evidence rules | Pretend a CLI renders interactive widgets |
| Model | Markdown and optional declared JSON | Inject arbitrary event scripts or network destinations |
| Transport | Message framing and integrity | Execute streaming JSON fragments |
| Validator | Schema, limits, safe references | Accept invented fields or permissions |
| Renderer | Allowlisted UI components and local state | Evaluate AI-supplied JS or HTML |
| Business host | Permissions, user confirmation and audit | Let the model choose unsafe side-effect actions |

## 4. WebCodex integration status

**Not implemented.** A future WebCodex integration may introduce a separate UI message type and an optional frontend renderer without changing local Runner scheduling. A Markdown source view must remain accessible if UI parsing fails. All privileged operations must continue through existing authorization and review flows.

## 5. Acceptance criteria

- A terminal-only user receives all essential information in Markdown.
- Invalid UI data is rejected and no model-generated script executes.
- Adjusting a slider updates local metrics but triggers no model request.
- Unauthorized filesystem, API, deployment, and deletion operations are impossible through this illustrative schema.
- The browser demo works without internet access.

This package is intentionally **not** a general-purpose production UI framework.