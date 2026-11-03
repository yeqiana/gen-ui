# Example: Java thread-pool sizing in Markdown-only hosts

> **Illustrative output, not production sizing advice or a measured benchmark.** The fictional host is a terminal that supports Markdown but has no UI renderer.

## Conclusion

Use a **bounded queue and an explicit rejection strategy**. Determine thread counts from workload classification, service-level requirements, and load testing rather than a universal formula.

| Parameter | Demonstration default | Purpose |
| --- | ---: | --- |
| Core threads | 4 | Baseline active threads in this example |
| Maximum threads | 8 | Teaching-only calculation: 4 × 2 |
| Queue capacity | 100 | Illustrative bounded queue, not a recommended capacity |

The example rule `maxThreads = coreThreads × 2` is for explaining the UI demo only. Real queueing and pool behavior depends on the task, queue type, executor settings, and resource constraints.

## Validation checklist

- [ ] Characterize CPU-intensive versus blocking/IO-intensive work
- [ ] Observe request rate, duration, queue wait time, memory and CPU
- [ ] Choose and test a rejection policy with simulated overload
- [ ] Verify shutdown, cancellation and recovery paths
- [ ] Load-test P95/P99 latency and throughput on a representative environment

**Host fallback:** a terminal shows the static table and formula. In an explicitly configured browser demo Renderer, the slider changes the value of the teaching-only formula locally. Neither the table nor slider performs a backend operation.