# Module 10: High-Performance Tuning & Zero-Allocation Patterns

## 1. Overview & Performance Goals

DuraFlow is designed to be a high-throughput, compact engine. To handle hundreds to thousands of concurrent workflows with sub-millisecond turn latency on a single machine, we enforce **6 strict performance patterns**:

1. **Zero-Allocation JSON Buffers (`sync.Pool`)** to eliminate Go Garbage Collection (GC) pauses.
2. **In-Memory `MutableState` Cache with LRU Eviction** to prevent unbounded RAM growth.
3. **Database Admission Control & Backpressure Semaphores** to protect PostgreSQL from connection exhaustion during traffic bursts.
4. **`ContinueAsNew` Rollover** to bound history stream length and keep replay latency under 1ms.
5. **PostgreSQL Partial Indexes & Connection Pool Optimization (`pgxpool`)**.
6. **Graceful Zero-Downtime Drain Sequence**.

---

## 2. Zero-Allocation Serialization (`sync.Pool`)

In high-concurrency event-sourcing engines, serializing and deserializing JSON payloads for every event creates severe heap allocation and GC pressure.

### The Solution:
DuraFlow uses `sync.Pool` for byte buffer reuse during `pgx.Batch` preparation:

```go
var bufferPool = sync.Pool{
    New: func() any {
        return bytes.NewBuffer(make([]byte, 0, 4096)) // 4KB warm slice
    },
}

func MarshalEventPayload(v any) ([]byte, error) {
    buf := bufferPool.Get().(*bytes.Buffer)
    buf.Reset()
    defer bufferPool.Put(buf)

    enc := json.NewEncoder(buf)
    if err := enc.Encode(v); err != nil {
        return nil, err
    }
    
    // Copy bytes out cleanly without retaining buffer reference
    result := make([]byte, buf.Len())
    copy(result, buf.Bytes())
    return result, nil
}
```

---

## 3. `MutableState` RAM Cache & Eviction (Bounded Memory)

Keeping every workflow in RAM forever causes memory leaks when thousands of workflows sleep or complete.

### Eviction Rules:
1. **Active Turns:** While processing turns, `MutableState` is pinned in RAM.
2. **Completed / Failed:** Immediately marked terminal; evicted from RAM after the commit turn flushes.
3. **Durable Sleep (> 5 minutes):** Evicted from RAM. When the timer fires, the engine transparently re-hydrates `MutableState` via `Replay()` from PostgreSQL.
4. **LRU Bounded Map:** Active cache size capped at e.g. 10,000 live runs using an in-memory sync.Map with access timestamps.

---

## 4. Database Connection Pool & Admission Control

### 4.1. `pgxpool.Config` Optimization
```go
func DefaultPoolConfig(connStr string) (*pgxpool.Config, error) {
    cfg, err := pgxpool.ParseConfig(connStr)
    if err != nil {
        return nil, err
    }

    // High-throughput tuning
    cfg.MaxConns = 50                  // Sized to PostgreSQL server CPU cores
    cfg.MinConns = 10                  // Warm standby connections
    cfg.MaxConnLifetime = 30 * time.Minute
    cfg.MaxConnIdleTime = 5 * time.Minute
    cfg.HealthCheckPeriod = 1 * time.Minute
    
    return cfg, nil
}
```

### 4.2. Ingress Admission Control (Backpressure Semaphore)
When 20,000 workflow triggers arrive simultaneously, flooding PostgreSQL causes connection timeouts. DuraFlow bounds concurrent active turns using a channel semaphore:

```go
type AdmissionController struct {
    sem chan struct{}
}

func NewAdmissionController(maxConcurrentTurns int) *AdmissionController {
    return &AdmissionController{
        sem: make(chan struct{}, maxConcurrentTurns), // e.g. 500 concurrent turns
    }
}

func (ac *AdmissionController) Acquire(ctx context.Context) error {
    select {
    case ac.sem <- struct{}{}:
        return nil
    case <-ctx.Done():
        return ctx.Err()
    }
}

func (ac *AdmissionController) Release() {
    <-ac.sem
}
```

---

## 5. `ContinueAsNew` (History Bounding)

In workflows with long lifecycles (e.g. infinite polling loops, daily subscription renewals), the event history can grow to tens of thousands of rows, slowing down `Replay()`.

### Bounding Rule:
- When `MutableState.LastEventID > 5,000`, the History Engine automatically triggers `ContinueAsNew`:
  1. Appends `WorkflowExecutionContinuedAsNew` with the latest accumulated state payload.
  2. Marks the current `run_id` as `COMPLETED`.
  3. Atomically starts a new `run_id` with genesis event initialized with the carryover state.
- **Guarantee:** History stream per execution remains strictly bounded, keeping replay duration under 1ms.

---

## 6. Business Deduplication via PostgreSQL Partial Index

To prevent duplicate active workflows with the same business ID (e.g. `order-1029` started twice):

```sql
CREATE UNIQUE INDEX idx_unique_active_workflow 
ON workflow_executions (workflow_id) 
WHERE status = 'RUNNING';
```
- If a client retries `StartWorkflow("order-1029")` while it is still running, PostgreSQL rejects the insert instantly via standard unique constraint violation (code `23505`), eliminating custom distributed lock code.

---

## 7. Graceful Drain & Shutdown

When receiving `SIGINT` or `SIGTERM`:
1. **Stop Polling:** Ingress HTTP server stops accepting new requests (`srv.Shutdown()`).
2. **Matching Drain:** TaskQueues stop dispensing new tasks to workers.
3. **Turn In-Flight Drain:** Active turns are given 10 seconds to finish and commit their atomic `pgx.Batch` to PostgreSQL.
4. **Close DB Pool:** `pool.Close()` executes cleanly without orphaned locks or corrupted transactions.
