# Module 02: Storage Architecture & PostgreSQL Schema

## 1. Overview & Principles

DuraFlow eliminates table fragmentation and distributed state synchronization by relying strictly on **4 core tables** in PostgreSQL:
1. `workflow_definitions`: Immutable versioned workflow DAG schemas.
2. `workflow_executions`: Compact, indexed execution snapshot with an OCC fencing token.
3. `history_events`: Monotonically sequenced, append-only history stream.
4. `task_queue_backlog`: Cold overflow buffer and crash-recovery task store.

---

## 2. Complete DDL Specification

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
    current_state      JSONB NOT NULL DEFAULT '{}', -- Accumulated workflow variable outputs
    last_event_id      BIGINT NOT NULL DEFAULT 0,   -- Optimistic lock fencing token
    next_timer_at      TIMESTAMPTZ,                 -- Earliest pending timer for cold recovery
    start_time         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    close_time         TIMESTAMPTZ,
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Partial index for fast cold timer recovery upon engine startup
CREATE INDEX idx_executions_active_timers 
ON workflow_executions (next_timer_at) 
WHERE status = 'RUNNING' AND next_timer_at IS NOT NULL;

-- Business Deduplication: Guarantees only 1 active running execution per business workflow_id
CREATE UNIQUE INDEX idx_unique_active_workflow 
ON workflow_executions (workflow_id) 
WHERE status = 'RUNNING';

-- 3. History Events (Immutable Append-Only Event Stream)
CREATE TABLE history_events (
    run_id       UUID NOT NULL,
    event_id     BIGINT NOT NULL, -- Monotonically increasing sequence per run (1, 2, 3...)
    event_type   VARCHAR(64) NOT NULL,
    node_id      VARCHAR(128),    -- Corresponding step/node in DAG (nullable)
    payload      JSONB NOT NULL DEFAULT '{}',
    timestamp    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (run_id, event_id),
    CONSTRAINT fk_history_execution FOREIGN KEY (run_id) REFERENCES workflow_executions(run_id) ON DELETE CASCADE
);

CREATE INDEX idx_history_events_stream 
ON history_events (run_id, event_id ASC);

-- 4. Task Queue Backlog (Persistent fallback for overflow / cold recovery)
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

## 3. Optimistic Concurrency Control (OCC) & Fencing Tokens

To guarantee that concurrent requests (e.g. an Activity Completion arriving simultaneously with a Timer Fire or external Signal) never produce split-brain execution state, DuraFlow uses the `last_event_id` field as a cryptographic fencing token:

```sql
UPDATE workflow_executions 
SET status = $1, 
    current_state = $2, 
    last_event_id = $3, 
    next_timer_at = $4, 
    updated_at = NOW()
WHERE run_id = $5 AND last_event_id = $6; -- $6 is expected_last_event_id
```

If another turn evaluator committed a turn first, `RowsAffected()` returns `0`. The engine detects the collision, discards the uncommitted dirty state, reloads `MutableState` from PostgreSQL, and re-evaluates the turn.

---

## 4. Single-Turn Atomic Transaction via `pgx.Batch`

Unlike standard ORM transactions that incur sequential roundtrips:
1. `BEGIN` (Roundtrip 1)
2. `INSERT events` (Roundtrips 2..N)
3. `UPDATE executions` (Roundtrip N+1)
4. `COMMIT` (Roundtrip N+2)

DuraFlow queues all operations into a single `pgx.Batch` pipelined over a single network connection:
```go
batch := &pgx.Batch{}
for _, event := range ms.uncommittedEvents {
    batch.Queue(`
        INSERT INTO history_events (run_id, event_id, event_type, node_id, payload, timestamp) 
        VALUES ($1, $2, $3, $4, $5, $6)
    `, event.RunID, event.EventID, event.Type, event.NodeID, event.Payload, event.Timestamp)
}

batch.Queue(`
    UPDATE workflow_executions 
    SET status = $1, current_state = $2, last_event_id = $3, next_timer_at = $4, updated_at = NOW() 
    WHERE run_id = $5 AND last_event_id = $6
`, ms.Status, ms.Variables, ms.LastEventID, ms.NextTimerAt, ms.RunID, previousEventID)

br := tx.SendBatch(ctx, batch)
defer br.Close()
```
Total roundtrip cost = **1 network turn**.
