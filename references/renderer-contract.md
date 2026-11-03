# Gen UI Renderer Contract — illustrative v1

> The format documented here is **only** the local demo protocol in this repository. It is not an official schema for OpenAI DIL, OpenUI Lang, Google A2UI, or another vendor.

## Responsibilities

1. **Agent:** writes a Markdown fallback and, only when explicitly supported, a declarative JSON document.
2. **Transport:** carries JSON as untrusted data (optionally over SSE); never evaluates partial streaming fragments.
3. **Validator:** checks version, allowed fields, lengths, uniqueness, finite numeric bounds, and references.
4. **Renderer:** maps allowlisted data fields to fixed DOM components and uses `textContent` for model text.
5. **State:** updates the local in-memory slider and derived metrics. No persistent state or model-defined tool action.

## Example

```json
{
  "version": "gen-ui-demo/v1",
  "title": "Thread-pool configuration demo",
  "description": "Educational rule: maximum threads = core threads × 2. Not production guidance.",
  "controls": [
    {"id": "core", "type": "slider", "label": "Core threads", "min": 1, "max": 16, "step": 1, "value": 4}
  ],
  "metrics": [
    {"label": "Maximum threads (example)", "source": "core", "multiplier": 2, "suffix": " threads"}
  ],
  "note": "Actual configuration depends on workload, queueing, rejection policy, and load testing."
}
```

| Field | Constraint |
| --- | --- |
| `version` | Must equal `gen-ui-demo/v1` |
| `title`, `description`, `note` | Plain-text strings, length-bounded |
| `controls` | 1–8 components, all `slider` |
| `id` | Unique identifier, restricted to safe characters |
| `min`, `max`, `step`, `value` | Finite numbers; min < max; step > 0; default within bounds and aligned to step |
| `metrics` | At most 12, each `source` references a known slider |
| `multiplier` | Finite bounded number; metric = source × multiplier |
| `suffix`, `label` | Plain text, never event code |
| Unknown properties | Reject; do not interpret or execute |

The demo accepts only this limited contract. It **cannot** perform external tool calls, API requests, database updates, deletions, or deployments.

## Failure behavior

- Unknown version, component, fields, invalid values or references: **reject** with a descriptive error.
- No trusted Renderer: render the equivalent static Markdown from [the thread-pool example](../examples/thread-pool.md).
- Unsupported Mermaid or chart: describe the same information in text.
- Side effects: remain outside this protocol and require host-controlled authorization, audit, and user confirmation.

## Integrating a real UI framework

Integrations to OpenUI, A2UI, or other production frameworks need an adapter targeting the **actual upstream schema and renderer version**. Renaming fields or the version does **not** confer compatibility.

Read [integration guidance](../docs/integration.md) before enabling custom hosts, and [the Node.js tests](../tests/renderer.test.mjs) for the demo's tested behavior.