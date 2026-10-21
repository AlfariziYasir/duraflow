# DuraFlow Architectural Blueprint — Master Index

**Version:** 1.0.0-PROD  
**Target Architecture:** Temporal-Inspired, Pure Go + PostgreSQL (Zero Broker)  
**Target Repository:** `/home/mohyasiralfarizi/Golang/duraflow`

---

## Blueprint Navigation

To facilitate modular, in-depth architectural reviews, the DuraFlow specification is decomposed into 10 focused documents:

| # | Blueprint Module | Key Architectural Focus |
| :- | :--- | :--- |
| **01** | [`01_invariants_and_di.md`](./01_invariants_and_di.md) | The 5 Iron Invariants, Ponytail ladder, Manual Constructor DI vs Uber-FX, Minimalist dependency matrix. |
| **02** | [`02_storage_and_schema.md`](./02_storage_and_schema.md) | PostgreSQL DDL (4 tables), indexing, Transactional Outbox, and Optimistic Concurrency Control (OCC). |
| **03** | [`03_history_engine_and_event_sourcing.md`](./03_history_engine_and_event_sourcing.md) | Event sourcing model, complete EventType catalog, in-memory `MutableState`, atomic single-turn `pgx.Batch` commit, and replay. |
| **04** | [`04_matching_and_task_queues.md`](./04_matching_and_task_queues.md) | Brokerless Task Queues, synchronous worker rendezvous (Sync Match), long-polling, and PG backlog spillover. |
| **05** | [`05_timers_and_timeout_management.md`](./05_timers_and_timeout_management.md) | Scheduled timer queue, min-heap priority queue, Schedule-to-Start, Start-to-Close, Heartbeat, and Sleep timers. |
| **09** | [`09_implementation_roadmap_and_verification.md`](./09_implementation_roadmap_and_verification.md) | 6-phase engineering roadmap, acceptance testing, crash recovery verification, and high-concurrency benchmarks. |
| **10** | [`10_performance_tuning_and_zero_alloc.md`](./10_performance_tuning_and_zero_alloc.md) | Zero-allocation `sync.Pool` buffers, `MutableState` LRU cache eviction, connection pool tuning, admission control, and `ContinueAsNew`. |

---

## Architectural Comparison Matrix

| Capability | FlowForge (Current State) | Temporal Server (Reference) | DuraFlow (Target State) |
| :--- | :--- | :--- | :--- |
| **Persistence Model** | Relational In-Place Updates (`step_runs`, `workflow_runs`, `logs`) | Append-Only Event History + MutableState | **Append-Only `history_events` + Snapshot `workflow_executions`** |
| **Turn IOPS** | 6–8 network roundtrips per step | 1 Batch RPC / Tx per turn | **Strictly 1x `pgx.Batch` per turn** |
| **Task Queue Broker**| External Redis + Asynq | Matching Service (Cassandra / Postgres) | **In-Memory Go Channels + PG Spillover (Zero Redis)** |
| **Dependency Injection** | Java-style 1:1 Interface Mockery | `go.uber.org/fx` (Runtime Reflection) | **Manual Constructor Injection (Compile-time Type Safe)** |
| **Timer Handling** | Periodic Polling Sweepers (DB scan) | Scheduled Timer Queue | **In-Memory Min-Heap Priority Queue synced with DB** |
| **Failure Persistence**| Writes every failure to DB | Transient Tasks (attempts tracked in RAM) | **Transient Task write elimination on retries** |
| **Activity Cancel** | Not supported / Polling only | Server-Initiated Worker Commands | **Worker Command Control Queue** |
