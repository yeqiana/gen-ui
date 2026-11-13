# GEN-UI · Four practical usage scenarios

> These are illustrative prompts and expected information forms, not verified model outputs or evidence of acceptance.

## 1. Everyday explanation — Markdown first

**Prompt:** Explain why Java thread pools need bounded queues, including queue buildup, rejection policies, and latency risk. No chart or HTML.

**Output:** Answer first, then explain the trade-offs. Do not invent benchmarks, source changes, or a fixed engineering delivery template.

## 2. Technology comparison — common criteria

**Prompt:** Compare RabbitMQ and Kafka across messaging models, consumption, ordering, throughput assumptions, operational cost, and fit. Avoid invented benchmark numbers.

**Output:** A compact criteria-by-criteria table and a conditional recommendation. Kafka partition ordering is not global ordering; RabbitMQ queues and streams should not be conflated.

## 3. Architecture review — facts and proposed controls

**Prompt:** Review StoryOS: STORY → STORYBOARD → PRODUCTION → QUALITY REVIEW → RELEASE. A batch of 20 images has 12 successes, 5 running and 3 failures. MySQL persists state, Redis supports heartbeat/scheduling, Outbox enables reliable delivery. Describe how fencing prevents a recovered old worker from overwriting a successor.

**Output:** Workflow, accurate progress, concurrency risks and acceptance suggestions. Do not assert a stage-transition gate unless provided; label missing execution evidence as unverified.

## 4. Static HTML — readable document, no fake controls

**Prompt:** Make a repository-local, offline Chinese HTML report with a working chapter navigation, risk table, acceptance checklist and mobile layout. No filtering, pagination, modal, or dashboard is required.

**Output:** Use [static HTML essentials](../references/html-report-essentials.md), real local assets and links. For standalone single-file delivery, advanced interactions, semantic diagrams or a portal, switch to the [full HTML contract](../references/html-report-contract.md).

## Boundaries

- The requested deliverable, not words like architecture or report, determines the output route.
- Example details are input fixtures, not audited production evidence.
- No models, browsers or automated tests were run for the 2026-11-13 documentation changes.
