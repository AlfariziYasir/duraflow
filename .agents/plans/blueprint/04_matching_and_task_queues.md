# Module 04: Matching Service & Task Queues (Zero-Broker Architecture)

## 1. Overview & Architectural Problem

Traditional systems rely on heavy external message brokers (Redis with Asynq, RabbitMQ, or Kafka) to distribute tasks from orchestrator to workers. This introduces:
- Extra infrastructure dependencies to operate, monitor, and failover.
- Serialization and network latency penalties for every single step.
- Split-brain failure modes when the broker and database fall out of sync.

Temporal solves this via an internal **Matching Service**. DuraFlow adopts this model in pure Go:
- **Brokerless Dispatch:** Coordination uses Go channels and bounded ringbuffers in RAM.
- **Synchronous Match (Rendezvous):** When workers are polling, tasks transfer directly in-memory in under 1 millisecond without touching disk.
- **Graceful PostgreSQL Spillover:** If workers are offline or the in-memory queue fills up, tasks safely buffer into the `task_queue_backlog` table.

---

## 2. In-Memory Task Queue Architecture

```
                  TransferTask (from History Engine)
                                │
                                ▼
                    ┌───────────────────────┐
                    │      Matching Hub     │
                    │ (Keyed by Queue Name) │
                    └───────────┬───────────┘
                                │
                      Are Workers Polling?
                      ┌─────────┴─────────┐
                   YES│                   │NO
                      ▼                   ▼
             ┌─────────────────┐ ┌──────────────────┐
             │ Synchronous     │ │ In-Memory Buffer │
             │ Match (Channel  │ │ (Slice/Channel)  │
             │ Handoff in RAM) │ └────────┬─────────┘
             └─────────────────┘          │ Buffer Full (> 5,000)?
                                          ▼
                                 ┌──────────────────┐
                                 │ Spillover to PG  │
                                 │ task_backlog     │
                                 └──────────────────┘
```

---

## 3. Synchronous Match (Rendezvous Point)

When an Activity Worker requests work, it issues a long-poll HTTP request (`POST /api/v1/tasks/poll`).

### The TaskQueue Component:
```go
type TaskQueue struct {
    name          string
    taskCh        chan Task           // Burst buffer
    pollerCh      chan chan Task      // Waiting worker channels
    mu            sync.Mutex
    backlogCount  atomic.Int64
}
```

### Dispatch Logic (Sync Match Priority):
```go
func (q *TaskQueue) Dispatch(ctx context.Context, task Task) error {
    q.mu.Lock()
    
    // Check if there is an idle poller waiting
    select {
    case pollerCh := <-q.pollerCh:
        q.mu.Unlock()
        // Synchronous match! Hand off directly in RAM
        select {
        case pollerCh <- task:
            return nil
        case <-ctx.Done():
            return ctx.Err()
        }
    default:
        // No waiting poller; push to in-memory channel buffer
        select {
        case q.taskCh <- task:
            q.mu.Unlock()
            return nil
        default:
            // Buffer full! Graceful spillover to PostgreSQL
            q.mu.Unlock()
            return q.spilloverToDB(ctx, task)
        }
    }
}
```

---

## 4. Worker Long-Polling Lifecycle

```go
func (q *TaskQueue) Poll(ctx context.Context) (Task, error) {
    // 1. Immediate check on in-memory burst channel
    select {
    case task := <-q.taskCh:
        return task, nil
    default:
    }

    // 2. Register as a waiting poller
    rendezvous := make(chan Task, 1)
    
    q.mu.Lock()
    q.pollerCh <- rendezvous
    q.mu.Unlock()

    // 3. Wait for direct handoff or context timeout (e.g., 30s)
    select {
    case task := <-rendezvous:
        return task, nil
    case <-ctx.Done():
        return Task{}, ErrPollTimeout
    }
}
```

---

## 5. Backlog Feeder & Cold Hydration

If tasks spill into `task_queue_backlog` (e.g. workers were temporarily paused):
1. A background **Backlog Feeder** runs within the Matching Hub.
2. When `q.backlogCount > 0` and the in-memory buffer has capacity:
   ```sql
   DELETE FROM task_queue_backlog 
   WHERE task_id IN (
       SELECT task_id FROM task_queue_backlog 
       WHERE queue_name = $1 AND visible_at <= NOW() 
       ORDER BY visible_at ASC 
       LIMIT 100 
       FOR UPDATE SKIP LOCKED
   ) 
   RETURNING task_id, run_id, node_id, activity_type, input_payload;
   ```
3. The pulled tasks are fed directly into `q.taskCh`, draining the cold backlog into RAM.
