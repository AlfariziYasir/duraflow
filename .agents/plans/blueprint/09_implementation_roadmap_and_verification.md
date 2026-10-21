# Module 09: Implementation Roadmap & Verification Strategy

## 1. 6-Phase Implementation Roadmap

```
Phase 1: Foundations & PostgreSQL Schema (Zero Redis)
├── 1.1: Docker Compose with PostgreSQL 16 (Zero broker)
├── 1.2: SQL migrations (workflow_definitions, workflow_executions, history_events, task_queue_backlog)
└── 1.3: platform/postgres pool setup with pgx/v5

Phase 2: Core History Engine & Event Store
├── 2.1: internal/history/events.go (All 17 Event types)
├── 2.2: internal/history/mutable_state.go (In-memory state & uncommitted staging)
├── 2.3: internal/history/store.go (Single-turn pgx.Batch flusher & replay loader)
└── 2.4: Deterministic replay & turn commit unit tests

Phase 3: In-Memory Matching Engine (Brokerless Dispatch)
├── 3.1: internal/matching/task_queue.go (Sync-match rendezvous channel)
├── 3.2: internal/matching/hub.go (Queue manager & PG backlog spillover)
└── 3.3: High-concurrency worker rendezvous stress tests

Phase 4: Durable Timers & DAG Execution Engine
├── 4.1: internal/history/timer_queue.go (Min-heap priority queue)
├── 4.2: internal/history/engine.go (Turn coordinator, DAG unblocking, transient retry)
└── 4.3: End-to-end multi-step branching DAG execution in memory

Phase 5: Activity Workers, SSRF Protection & Worker Commands
├── 5.1: internal/activity/registry.go & worker poller client
├── 5.2: internal/activity/http.go (SSRF-safe DNS pin & dialer)
├── 5.3: internal/activity/expr.go (Expression evaluator)
└── 5.4: Worker control queue & in-flight activity cancellation

Phase 6: Ingress API, Manual DI Wiring & Load Verification
├── 6.1: internal/api/router.go (Go 1.22+ net/http.ServeMux: Start, Poll, Complete, Query, Update)
├── 6.2: cmd/server/main.go & cmd/worker/main.go (Manual constructor wiring)
└── 6.3: High-throughput benchmark: 1,000 concurrent workflows without external broker
```

---

## 2. Verification & Acceptance Criteria

Every phase leaves behind concrete, runnable verification checks:

1. **Deterministic Replay Test:**
   - Feed arbitrary history event streams into `Replay()` and verify that the recomputed `MutableState` identically matches the committed snapshot.

2. **Strict Turn IOPS Audit:**
   - Execute a 5-step sequential workflow.
   - Assert via PostgreSQL query logs that the total database operations equal exactly 5 atomic batch flushes (zero extraneous queries).

3. **Crash Recovery & Timer Hydration:**
   - Start 100 workflows with 10-second timers.
   - Kill the server process mid-flight.
   - Restart the server; verify that `timer_queue` rehydrates all active timers from `workflow_executions.next_timer_at` and all 100 workflows complete normally.

4. **Zero Data Race Guarantee:**
   - Run the entire test suite under race detection:
     `go test -race ./...`
   - Must pass with 0 data races.
