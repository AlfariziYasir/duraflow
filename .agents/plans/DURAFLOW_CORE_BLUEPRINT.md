# DuraFlow Core Architecture Blueprint
**Version:** 1.0.0-PROD  
**Author:** Moh Yasir Alfarizi & Assistant  
**Date:** 2026-10-02  
**Status:** Under Review (Pre-Implementation)  
**Target Repository:** `/home/mohyasiralfarizi/Golang/duraflow`

---

## 1. Executive Summary & Design Invariants

DuraFlow is a lightweight, high-throughput, enterprise-grade distributed workflow orchestration engine written in pure Go. It adopts the battle-tested architectural pillars of **Temporal Server** (Append-Only Event Sourcing, In-Memory MutableState, and Rendezvous Task Matching) while drastically eliminating operational overhead:

### The 5 Iron Invariants:
1. **Zero External Message Brokers:** No Redis, Kafka, RabbitMQ, or NATS. All coordination occurs via pure Go concurrency primitives (`sync`, `atomic`, `chan`, `container/heap`) backed by PostgreSQL as the sole persistence layer.
2. **Strict Single-Turn Database Commits:** Every state change (turn) must flush in exactly **one atomic PostgreSQL roundtrip** using `pgx.Batch` (Insert new history events + Update execution snapshot + Enqueue outbox tasks). No chatty multi-query step lifecycle.
3. **Deterministic Event Sourcing:** Execution state can be completely reconstructed from genesis at any point by sequentially replaying `history_events`. The state is immutable once written.
4. **Subsystem-Based Packaging (De-Javafication):** Code is partitioned by subsystem domain (`history`, `matching`, `activity`, `workflow`, `api`), strictly avoiding Java-style technical tiers (`handler -> usecase -> repo -> entity`). Zero 1:1 pass-through interfaces. Concrete structs returned; interfaces defined only at consumption boundaries.
5. **Manual Constructor Dependency Injection & Minimalist Dependencies:** Strictly NO `uber-go/fx`, `dig`, or reflection-based DI frameworks. All services, stores, and engines are explicitly wired via standard constructors (`New...`) in `cmd/server/main.go` and `cmd/worker/main.go`. Third-party libraries are minimized to essential primitives (`pgx/v5`, `google/uuid`); standard library (`net/http`, `log/slog`, `sync`, `container/heap`) is utilized for routing, logging, scheduling, and timers.
---

## 2. Comparative Analysis: Current FlowForge vs DuraFlow

| Architectural Dimension | FlowForge (Current State) | DuraFlow (Target State) |
| :--- | :--- | :--- |
| **State Storage Model** | Relational In-Place Updates (`step_runs`, `workflow_runs`, `logs` tables updated independently). | **Append-Only History Events** (`history_events` log + single compact `workflow_executions` pointer). |
| **Database IOPS per Step** | 6–8 network roundtrips per node (Select For Update -> Update Running -> Update Succeeded -> Select Children -> Insert Logs). | **1 Atomic Roundtrip per Turn** via `pgx.Batch` (Append events + Update version pointer). |
| **Task Queue & Broker** | External Redis instance running `hibiken/asynq`. | **In-Memory Go Matching Service** with synchronous worker rendezvous + PG persistent fallback buffer. Zero Redis. |
| **Layering & Abstraction** | Java Spring Boot mimicry (`Handler -> UseCase Interface -> UseCase Impl -> Repo Interface -> Repo Impl -> BaseRepo`). | **Idiomatic Go Subsystems** (`api` -> `history.Engine` -> `history.Store`). Concrete types, zero mock bloat. |
| **Timer / Sleep System** | Polling sweepers running periodic `SELECT ... FOR UPDATE` scans across DB. | **In-Memory Priority Queue** (`container/heap`) hydrated from PostgreSQL timer checkpoints. Exact firing, zero poll hammering. |
| **Concurrency Guard** | Row-level locking (`SELECT FOR UPDATE SKIP LOCKED`). | **Sharded In-Memory Keyed Mutex** per Workflow Run + DB **Optimistic Concurrency Control** (`last_event_id`). |

---

## 3. Storage Architecture & PostgreSQL Schema

The persistence layer requires only 3 core tables in PostgreSQL.

```
┌────────────────────────────────────────────────────────┐
│                  POSTGRESQL STORAGE                    │
├──────────────────────────┬─────────────────────────────┤
│ Table                    │ Purpose                     │
├──────────────────────────┼─────────────────────────────┤
│ 1. workflow_definitions  │ Immutable versioned DAGs    │
│ 2. workflow_executions   │ Compact execution snapshot  │
│ 3. history_events        │ Append-only event store     │
│ 4. task_queue_backlog    │ Cold overflow buffer        │
└──────────────────────────┴─────────────────────────────┘
```

### 3.1. DDL Specification

```sql
-- 1. Workflow Definitions (Templates / DAGs)
CREATE TABLE workflow_definitions (
    workflow_id     VARCHAR(128) NOT NULL,
    version         INTEGER NOT NULL DEFAULT 1,
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    dag_schema      JSONB NOT NULL, -- Nodes, Edges, RetryPolicies, Timeouts
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (workflow_id, version)
);

-- 2. Workflow Executions (Current Running State Snapshot)
CREATE TABLE workflow_executions (
    run_id             UUID PRIMARY KEY,
    workflow_id        VARCHAR(128) NOT NULL,
    workflow_version   INTEGER NOT NULL,
    status             VARCHAR(32) NOT NULL, -- 'RUNNING', 'COMPLETED', 'FAILED', 'TERMINATED', 'TIMED_OUT'
    current_state      JSONB NOT NULL DEFAULT '{}', -- Aggregated workflow variables/state
    last_event_id      BIGINT NOT NULL DEFAULT 0,   -- Optimistic lock fencing token
    next_timer_at      TIMESTAMPTZ,                 -- Earliest pending timer for cold recovery
    start_time         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    close_time         TIMESTAMPTZ,
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_executions_active_timers 
ON workflow_executions (next_timer_at) 
WHERE status = 'RUNNING' AND next_timer_at IS NOT NULL;

-- 3. History Events (Immutable Append-Only Event Stream)
CREATE TABLE history_events (
    run_id       UUID NOT NULL,
    event_id     BIGINT NOT NULL, -- Monotonic per run (1, 2, 3...)
    event_type   VARCHAR(64) NOT NULL,
    node_id      VARCHAR(128),    -- Corresponding step/node in DAG (if applicable)
    payload      JSONB NOT NULL DEFAULT '{}',
    timestamp    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (run_id, event_id),
    CONSTRAINT fk_history_execution FOREIGN KEY (run_id) REFERENCES workflow_executions(run_id) ON DELETE CASCADE
);

CREATE INDEX idx_history_events_stream 
ON history_events (run_id, event_id ASC);

-- 4. Task Queue Backlog (Persistent fallback when in-memory queue overflows or worker cold-start)
CREATE TABLE task_queue_backlog (
    task_id         UUID PRIMARY KEY,
    queue_name      VARCHAR(128) NOT NULL,
    run_id          UUID NOT NULL,
    node_id         VARCHAR(128) NOT NULL,
    activity_type   VARCHAR(128) NOT NULL,
    input_payload   JSONB NOT NULL DEFAULT '{}',
    attempt         INTEGER NOT NULL DEFAULT 1,
    scheduled_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    visible_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_task_backlog_polling 
ON task_queue_backlog (queue_name, visible_at ASC);
```

---

## 4. History Subsystem & State Transition Engine (`internal/history`)

The History Engine is the brain of DuraFlow. It manages active execution lifecycles in RAM using `MutableState` and enforces transactional event generation.

```
       Incoming Turn (Start / Task Completed / Timer Fired)
                           │
                           ▼
              ┌──────────────────────────┐
              │ Sharded Execution Lock   │ (Keyed Mutex by run_id)
              └────────────┬─────────────┘
                           │
                           ▼
              ┌──────────────────────────┐
              │    Load MutableState     │ (RAM Cache or Replay from DB)
              └────────────┬─────────────┘
                           │
                           ▼
              ┌──────────────────────────┐
              │  Evaluate DAG Transition │ (RAM only, pure logic)
              │  - Append New Events     │
              │  - Generate Outbox Tasks │
              │  - Update Node Statuses  │
              └────────────┬─────────────┘
                           │
                           ▼
              ┌──────────────────────────┐
              │  1x pgx.Batch Commit     │
              │  - INSERT history_events │
              │  - UPDATE executions     │
              │    WHERE last_event_id=N │
              └────────────┬─────────────┘
                           │
                           ▼
              ┌──────────────────────────┐
              │ Dispatch to Matching     │ (In-memory channel / Sync-Match)
              └──────────────────────────┘
```

### 4.1. Core History Event Types
- `WorkflowExecutionStarted`: Trigger payload, run initialization.
- `ActivityTaskScheduled`: Node marked for execution, dispatched to task queue.
- `ActivityTaskStarted`: Worker claimed task, start-to-close timer begun.
- `ActivityTaskCompleted`: Worker returned success with output payload.
- `ActivityTaskFailed`: Worker returned error; evaluation determines retry vs workflow failure.
- `ActivityTaskTimedOut`: Schedule-to-start or start-to-close timeout breached.
- `TimerStarted`: Durable delay node initialized with target fire timestamp.
- `TimerFired`: Delay expired, downstream DAG nodes unblocked.
- `WorkflowExecutionCompleted`: All leaf DAG nodes succeeded; final output recorded.
- `WorkflowExecutionFailed`: Unhandled error or terminal step failure.

### 4.2. MutableState Structure
```go
type MutableState struct {
    RunID           uuid.UUID
    WorkflowID      string
    Version         int
    Status          WorkflowStatus
    LastEventID     int64
    Variables       map[string]any
    
    // In-memory tracking of active execution components
    NodeStates      map[string]NodeExecutionState
    PendingTimers   map[string]time.Time
    PendingTasks    []TransferTask
    
    // Staging buffer for the current turn
    uncommittedEvents []HistoryEvent
}
```

### 4.3. Single-Turn Atomic Flush (`pgx.Batch`)
During a state transition, the turn evaluator appends 1 or more events to `uncommittedEvents`. The commit phase executes via a single atomic batch:
```go
batch := &pgx.Batch{}
for _, event := range ms.uncommittedEvents {
    batch.Queue(insertEventSQL, event.RunID, event.EventID, event.Type, event.NodeID, event.Payload, event.Timestamp)
}
batch.Queue(updateExecutionSnapshotSQL, ms.Status, ms.Variables, ms.LastEventID, ms.NextTimerAt, ms.RunID, previousEventID)

br := db.SendBatch(ctx, batch)
// Enforces that if previousEventID != DB.last_event_id, batch fails (Optimistic Lock OCC)
```

---

## 5. Matching Subsystem (`internal/matching`)

Temporal's Matching Service decouples workflow execution from worker polling. In DuraFlow, we achieve this without external brokers using a high-performance **In-Memory Channel Rendezvous** system.

```
       Transfer Task (from History)
                   │
                   ▼
       ┌────────────────────────┐
       │   Matching Queue Hub   │
       │ (Keyed by Queue Name)  │
       └───────────┬────────────┘
                   │
         Has Waiting Worker?
         ┌─────────┴─────────┐
      YES│                   │NO
         ▼                   ▼
┌─────────────────┐ ┌──────────────────┐
│ Synchronous     │ │ Buffered Channel │
│ Match (Direct   │ │ (RAM Queue)      │
│ Channel Handoff)│ └────────┬─────────┘
└─────────────────┘          │ Buffer Full?
                             ▼
                    ┌──────────────────┐
                    │ Write to PG      │
                    │ task_backlog     │
                    └──────────────────┘
```

### 5.1. Matching Engine Mechanics
1. **TaskQueue Struct:** Contains an unbuffered channel for immediate synchronous handoff, a buffered priority ring for bursts, and a wait-list of worker pollers.
2. **Sync-Match Rendezvous:** If an activity worker is actively long-polling the queue when History yields a task, the task is handed off directly through the channel in RAM (zero database roundtrips, sub-millisecond dispatch).
3. **Graceful Overflow:** If no worker is polling and the in-memory buffer exceeds its threshold (e.g., 5,000 tasks), tasks spill to `task_queue_backlog` in PostgreSQL. As workers poll, an internal feeder goroutine drains the backlog into RAM.

---

## 6. Activity Execution Subsystem (`internal/activity`)

Stateless workers execute I/O-bound tasks. The worker communicates with Matching via long-polling HTTP or gRPC.

### 6.1. Built-in Activity Executors
1. **HTTP Activity:** Outbound HTTP request execution wrapped with SSRF protection (`safehttp` DNS pin, private IP block, redirect sanitization).
2. **Expression / Transform Activity:** Sandboxed data mapping and JSON transformation using standard Go expression evaluation.
3. **AI / Analysis Activity:** Optional LLM/evaluator hook for automatic error triage.
4. **Sleep / Durable Timer:** Handled directly by History's Timer Queue (does not consume an activity thread).

### 6.2. Reliability & Retry Invariant
- Retry backoff calculation uses thread-safe PRNG (`crypto/rand` or dedicated `sync.Mutex` around `math/rand/v2`).
- Activity executions send heartbeat tokens for long-running jobs.
- Workers are completely decoupled: if a worker process crashes, the History timer detects `StartToCloseTimeout` and reschedules the activity task.

---

## 7. Package Layout & Idiomatic Go Boundaries

Eliminating Java-like technical tiers yields a clean, high-cohesion, low-coupling directory tree:

```
duraflow/
├── cmd/
│   ├── server/               # Single binary monolith (API + History + Matching)
│   │   └── main.go
│   └── worker/               # Standalone worker binary (for separate scaling)
│       └── main.go
│
├── internal/
│   ├── api/                  # Ingress: HTTP handlers, request decoders, worker poll endpoints
│   │   ├── router.go
│   │   ├── workflow_handler.go
│   │   └── poll_handler.go
│   │
│   ├── workflow/             # DAG definitions, JSON schema validation, topological cycle check
│   │   ├── definition.go
│   │   └── parser.go
│   │
│   ├── history/              # CORE: State machine & event sourcing
│   │   ├── engine.go         # Coordinator of turns & executions
│   │   ├── mutable_state.go  # In-memory execution state & event buffer
│   │   ├── events.go         # Event type constants and structs
│   │   ├── store.go          # pgx.Batch database persistence
│   │   └── timer_queue.go    # In-memory timer priority queue (heap)
│   │
│   ├── matching/             # TASK QUEUE: Dispatcher & poller matching
│   │   ├── hub.go            # Map of active TaskQueues
│   │   ├── task_queue.go     # Sync match rendezvous & channel buffer
│   │   └── poller.go         # Long-polling lifecycle & timeout manager
│   │
│   ├── activity/             # STATELESS EXECUTORS: Worker handlers
│   │   ├── registry.go       # Map of activity implementations
│   │   ├── http.go           # SSRF-safe HTTP execution
│   │   └── expr.go           # Safe expression & transform runner
│   │
│   └── platform/             # Low-level infrastructure only
│       ├── config/           # 12-factor environment loader
│       ├── postgres/         # pgxpool connection & migration runner
│       ├── safehttp/         # SSRF-safe client & DNS resolver
│       └── telemetry/        # Structured logging (slog) & metrics
│
├── migrations/
│   └── 000001_init_duraflow.up.sql
├── Makefile
├── go.mod
└── docker-compose.yml        # PostgreSQL 16 only (Zero Redis)
```

---

## 8. Dependency Strategy & Manual Constructor Injection

### 8.1. Eliminating Reflection DI (Temporal Uber-FX vs DuraFlow Manual Wiring)
Temporal uses `go.uber.org/fx` across all service boundaries (`service/history/fx.go`, `service/matching/fx.go`, etc.). While suitable for massive enterprise codebases with dynamic plugins, `fx` introduces reflection overhead, invisible runtime wiring errors, slower test initialization, and deep dependency graphs.

DuraFlow replaces all DI frameworks with **Explicit Manual Constructor Injection** at the composition root (`cmd/server/main.go` and `cmd/worker/main.go`):

```go
// Composition Root: cmd/server/main.go
func main() {
    ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
    defer cancel()

    cfg := config.LoadFromEnv()
    logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: cfg.LogLevel}))

    // 1. Platform Infrastructure
    pool, err := postgres.NewPool(ctx, cfg.DatabaseURL)
    if err != nil {
        logger.Error("failed to connect to postgres", "error", err)
        os.Exit(1)
    }
    defer pool.Close()

    // 2. Subsystem Stores & Hubs
    historyStore := history.NewStore(pool, logger)
    matchingHub := matching.NewHub(pool, logger)
    
    // 3. Subsystem Core Engines
    historyEngine := history.NewEngine(historyStore, matchingHub, logger)
    
    // 4. Ingress Routing (Standard Library net/http ServeMux)
    apiRouter := api.NewRouter(historyEngine, matchingHub, logger)

    server := &http.Server{
        Addr:    cfg.HTTPPort,
        Handler: apiRouter,
    }

    // 5. Graceful Lifecycle
    go func() {
        if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
            logger.Error("server error", "error", err)
        }
    }()

    <-ctx.Done()
    // Clean shutdown sequence
    server.Shutdown(context.Background())
    historyEngine.Close()
    matchingHub.Close()
}
```

### 8.2. Minimalist Dependency Footprint (Standard Library First)

| Capability | Third-Party Solution (Avoided) | DuraFlow Solution (Adopted) | Rationale |
| :--- | :--- | :--- | :--- |
| **Dependency Injection** | `go.uber.org/fx`, `uber-go/dig` | **Manual Constructor Injection** | Zero reflection, compile-time safety, transparent test mocking. |
| **HTTP Router & Multiplexer**| `gin-gonic/gin`, `labstack/echo` | **Go 1.22+ `net/http.ServeMux`** | Built-in path wildcards (`/workflows/{id}`) & method routing. Zero external dependency. |
| **Structured Logging** | `uber-go/zap`, `sirupsen/logrus` | **Standard Library `log/slog`** | Built-in high-performance structured JSON/Text logging. |
| **Durable Timer Queue** | Redis ZSET, Quartz | **Standard Library `container/heap`** | High-performance in-memory min-heap synced with Postgres checkpoints. |
| **Database Access** | GORM, Ent, SQLBoiler | **`github.com/jackc/pgx/v5`** | Direct raw SQL queries with `pgx.Batch` single-turn atomic flushes. |
| **UUID Generation** | Hand-rolled strings | **`github.com/google/uuid`** | RFC 4122 compliant UUIDv4/UUIDv7 generation. |
| **Test Assertions** | Custom test helpers | **`github.com/stretchr/testify`** | Standard readable table-driven test assertions (`require`, `assert`). |

---

## 9. Implementation Roadmap (Phases 1 to 6)
```
Phase 1: Foundations & Database Schema
├── 1.1: Docker & PostgreSQL environment setup (zero Redis)
├── 1.2: SQL migrations (workflow_definitions, workflow_executions, history_events, task_backlog)
└── 1.3: platform/postgres pool setup with pgx/v5

Phase 2: Core History State Machine & Event Store
├── 2.1: history/events.go (Event definitions and payloads)
├── 2.2: history/mutable_state.go (RAM state tracking & uncommitted buffer)
├── 2.3: history/store.go (Single-turn pgx.Batch atomic flush & history replay loader)
└── 2.4: Deterministic replay & turn commit unit tests

Phase 3: In-Memory Matching & Task Dispatcher
├── 3.1: matching/task_queue.go (Channel-based sync match rendezvous)
├── 3.2: matching/hub.go (Queue manager & graceful spillover to PG)
└── 3.3: High-concurrency matching stress tests

Phase 4: History Coordinator, Durable Timers & DAG Advancement
├── 4.1: history/timer_queue.go (Priority queue min-heap for durable sleeps)
├── 4.2: history/engine.go (Execution coordinator, sharded keyed mutex, DAG step unblocking)
└── 4.3: End-to-end execution of multi-step branching DAG in memory

Phase 5: Activity Worker & Platform Integrations
├── 5.1: activity/registry.go & worker polling client
├── 5.2: activity/http.go (SSRF-safe HTTP client integration)
└── 5.3: activity/expr.go (Expression evaluation)

Phase 6: Ingress API, Worker CLI & Full Verification
├── 6.1: internal/api (StartWorkflow, GetWorkflowHistory, PollTaskQueue, CompleteTask)
├── 6.2: cmd/server and cmd/worker entrypoints
└── 6.3: High-load verification: Execute 1,000 concurrent workflows without external broker
```

---

## 9. Verification & Acceptance Criteria
1. **Zero External Broker:** Application runs and completes workflows using only PostgreSQL and standard Go binaries.
2. **IOPS Verification:** Step completion incurs strictly 1 batch commit to PostgreSQL.
3. **Crash Recovery & Determinism:** Killing a worker or restarting the server mid-workflow restores exact `MutableState` via history replay and timer heap hydration without data corruption or orphan locks.
4. **High Throughput:** Clean execution of ≥ 1,000 workflows with zero race conditions (`go test -race ./...` passes clean).
