# Module 06: Transient & Speculative Execution (Write Elimination)

## 1. Overview & The Write-Amplification Problem

In high-throughput workflow engines, write amplification is the primary source of database exhaustion:
1. **History Explosion from Retries:** If an activity fails 20 times before succeeding (e.g. downstream service outage), a naive event store writes 20 `ActivityTaskFailed` and 20 `ActivityTaskScheduled` events (40 database rows).
2. **Pollution from Rejected Updates & Queries:** If an external system queries a workflow or sends an update that is rejected by business validation, writing audit records to disk wastes IOPS on operations that never changed state.

Temporal invented **Transient Tasks** and **Speculative Execution** to solve these two problems. DuraFlow implements both mechanisms.

---

## 2. Transient Tasks: Retry Write-Elimination

When an activity execution fails with a retryable error:
- **First Attempt (Attempt 1):** The failure is recorded in `MutableState.ActivityStates[nodeID]`.
- **Subsequent Attempts (Attempt > 1):**
  - DuraFlow **DOES NOT write `ActivityTaskFailed` to PostgreSQL**.
  - The attempt count (`ms.ActivityStates[nodeID].Attempt++`) and next retry fire time are updated purely in RAM within `MutableState`.
  - A transient timer is added to the in-memory timer queue.

```
Worker Fails (Attempt 1) ──> Record failure in RAM ──> Schedule in-memory Timer
Worker Fails (Attempt 2) ──> Increment Attempt in RAM ──> Zero DB writes!
Worker Fails (Attempt 3) ──> Increment Attempt in RAM ──> Zero DB writes!
Worker Succeeds (Attempt 4) ──> 1x Atomic pgx.Batch writes ActivityTaskCompleted!
```

### Terminal Failure Guarantee:
If `Attempt >= MaxAttempts`, the task is marked permanently failed, and the engine writes a single `ActivityTaskFailed` event marking the terminal error.

**Benefit:** Eliminates up to 90% of database write load during downstream service outages.

---

## 3. Speculative Execution: Zero-Write Reads & Updates

When an API client issues a synchronous Workflow Update (`POST /api/v1/workflows/{id}/update`):
1. DuraFlow initiates a **Speculative Task**:
   - The task is scheduled directly in RAM without writing to `history_events` or `task_queue_backlog`.
2. The workflow logic evaluates the update validator:
   - **If Rejected:** The update is discarded from RAM. An error is returned directly to the HTTP client. **Total PostgreSQL writes = ZERO**.
   - **If Accepted:** The state mutation is buffered in `MutableState.uncommittedEvents`. It commits in the next normal atomic `pgx.Batch` turn along with `WorkflowExecutionUpdateAccepted` and `WorkflowExecutionUpdateCompleted`.

---

## 4. Speculative In-Memory Timers

Because speculative tasks are never written to the database, they cannot rely on database checkpoints:
- A speculative task that is dispatched to a worker has an in-memory `ScheduleToStart` timeout (default: 5 seconds).
- If the worker does not respond within 5 seconds, the speculative task is converted into a standard durable task and committed to PostgreSQL.
