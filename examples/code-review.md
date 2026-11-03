# Example: Java code review rendered for a CLI

> **Illustrative review case**. The code and file paths below are fictional. No repository was scanned and no tests were executed for this sample.

## Input scenario

A developer changes how a background job obtains a distributed lock before updating a database. The reviewer is asked to identify correctness risks without redesigning unrelated services. The host is a plain terminal.

## Example response

**Conclusion: needs a focused fix.** The lock has a fixed lease and the worker can continue after expiry.

| Severity | Location (illustrative) | Finding | Action |
| --- | --- | --- | --- |
| High | `JobWorker.java:88` | Work continues after lock expiry and a second worker may acquire the same key | Add ownership fencing and a conditional database write |
| Medium | `JobWorker.java:121` | Exception path does not distinguish lost ownership from transient work failure | Track attempts and return explicit retry state |

**Evidence:** In this simulated snippet, worker A obtains lock `job:42` for 30 seconds; processing lasts 45 seconds. Worker B can take the expired lock before A finishes. A lock alone does not prevent both writes.

**Proposed verification (not yet run):**

1. Simulate a job longer than the lease and confirm only the latest fenced owner updates final state.
2. Replay duplicate messages and verify idempotent results.
3. Restart a worker between lock acquisition and persistence; verify recovery.
4. Review only the touched worker and storage paths.

**Status:** Proposed review findings only; no code was modified and no tests were executed.

## Why this is Gen UI output

The answer is usable in a terminal: severity is stated in text, the table is bounded, and claims are attributed to the fictional scenario rather than a tool run. No fake buttons, charts or pass badges are emitted.