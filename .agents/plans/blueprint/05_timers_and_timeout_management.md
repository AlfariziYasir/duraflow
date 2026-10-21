# Module 05: Durable Timers & Timeout Management

## 1. Overview & Architectural Problem

Workflow engines need precise timing for:
- User-specified delays (`workflow.sleep(30m)`).
- **Schedule-to-Start Timeout:** Detecting when a task was enqueued but no worker picked it up.
- **Start-to-Close Timeout:** Detecting when an assigned worker crashed mid-execution.
- **Heartbeat Timeout:** Detecting stalled long-running activities.
- **Workflow Run Timeout:** Terminating stuck executions.

### The Anti-Pattern (FlowForge / Sweeper Loops):
Running periodic cron jobs that execute heavy SQL scans every 1–5 seconds:
`SELECT * FROM step_runs WHERE status = 'WAITING' AND fire_at <= NOW()`
This causes constant database IOPS waste, lock contention, and high jitter (delays up to the sweep interval).

### The Temporal / DuraFlow Pattern:
An **In-Memory Priority Queue Min-Heap** (`container/heap` from Go stdlib):
- The head of the heap is the earliest upcoming timer across all executions.
- The thread sleeps until exactly that timestamp using a single `time.Timer`.
- Zero database scanning during normal execution!

---

## 2. In-Memory Priority Queue Specification

```go
type TimerItem struct {
    RunID       uuid.UUID
    TimerID     string // e.g. "timer:step-3" or "activity-timeout:node-5"
    FireAt      time.Time
    TimerType   TimerType // SLEEP, SCHEDULE_TO_START, START_TO_CLOSE, HEARTBEAT
    Payload     map[string]any
    index       int // Internal index for container/heap
}

type TimerHeap []*TimerItem

func (h TimerHeap) Len() int           { return len(h) }
func (h TimerHeap) Less(i, j int) bool { return h[i].FireAt.Before(h[j].FireAt) }
func (h TimerHeap) Swap(i, j int)      { h[i], h[j] = h[j], h[i]; h[i].index = i; h[j].index = j }
func (h *TimerHeap) Push(x any)        { ... }
func (h *TimerHeap) Pop() any          { ... }
```

---

## 3. Precision Wake-Up Loop

```go
func (tq *TimerQueue) Loop(ctx context.Context) {
    var timer *time.Timer
    for {
        tq.mu.Lock()
        if len(tq.heap) == 0 {
            tq.mu.Unlock()
            // Wait for new timer insertion notification
            select {
            case <-tq.notifyCh:
                continue
            case <-ctx.Done():
                return
            }
        }

        next := tq.heap[0]
        now := time.Now()
        
        if next.FireAt.After(now) {
            waitDuration := next.FireAt.Sub(now)
            tq.mu.Unlock()

            if timer == nil {
                timer = time.NewTimer(waitDuration)
            } else {
                timer.Reset(waitDuration)
            }

            select {
            case <-timer.C:
                continue
            case <-tq.notifyCh: // Reset if an earlier timer arrived
                if !timer.Stop() {
                    <-timer.C
                }
                continue
            case <-ctx.Done():
                return
            }
        }

        // Timer is ready! Pop from heap
        item := heap.Pop(&tq.heap).(*TimerItem)
        tq.mu.Unlock()

        // Asynchronously dispatch fire turn to History Engine
        go tq.engine.FireTimer(context.Background(), item)
    }
}
```

---

## 4. Cold Startup Recovery & Checkpointing

During each turn commit that introduces or clears a timer:
- The earliest pending timer is written to `workflow_executions.next_timer_at`.

When the DuraFlow server boots or crashes and recovers:
1. It queries the active timer index in PostgreSQL:
   ```sql
   SELECT run_id, next_timer_at 
   FROM workflow_executions 
   WHERE status = 'RUNNING' AND next_timer_at IS NOT NULL 
   ORDER BY next_timer_at ASC;
   ```
2. For each active execution, it hydrates the next timer directly into the in-memory min-heap.
3. If any timer expired while the server was down, it fires immediately upon startup.
