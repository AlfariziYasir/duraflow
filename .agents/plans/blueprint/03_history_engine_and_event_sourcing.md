# Module 03: History Engine & Event Sourcing

## 1. Overview

The History Engine (`internal/history`) is the deterministic state machine coordinator of DuraFlow. It adopts Temporal's event sourcing model:
- The persistent state of an execution is an append-only sequence of immutable `HistoryEvent` records.
- Active executions maintain an in-memory representation called `MutableState`.
- State transitions (turns) take input triggers, advance the DAG in RAM, append events to a staging buffer, and commit everything in one atomic `pgx.Batch`.

---

## 2. Comprehensive Event Type Catalog

Every significant lifecycle occurrence is captured as a distinct, typed event:

| Event Type | Producer | Description |
| :--- | :--- | :--- |
| `WorkflowExecutionStarted` | Engine | Workflow execution initiated with initial arguments and configuration. |
| `ActivityTaskScheduled` | Engine | A step/activity node is ready; task dispatched to matching queue. |
| `ActivityTaskStarted` | Matching/Worker | Activity claimed by a worker; execution timer begins. |
| `ActivityTaskCompleted` | Worker | Activity finished successfully; output payload recorded. |
| `ActivityTaskFailed` | Worker | Activity failed; failure error and retry count recorded. |
| `ActivityTaskTimedOut` | Timer Queue | Schedule-to-start or start-to-close timeout breached. |
| `ActivityTaskCanceled` | Engine | In-flight activity canceled via worker command. |
| `TimerStarted` | Engine | Non-blocking durable timer/sleep registered with target fire timestamp. |
| `TimerFired` | Timer Queue | Delay expired; unblocks downstream dependent nodes. |
| `TimerCanceled` | Engine | Pending timer aborted prior to expiration. |
| `WorkflowExecutionSignaled` | API / External | Asynchronous external payload injected into workflow state. |
| `WorkflowExecutionUpdateAccepted` | Engine | Synchronous update accepted by workflow logic. |
| `WorkflowExecutionUpdateCompleted` | Engine | Synchronous update evaluated and returned result. |
| `WorkflowExecutionCompleted` | Engine | Terminal state: all terminal DAG nodes completed successfully. |
| `WorkflowExecutionFailed` | Engine | Terminal state: fatal node failure or uncaught error. |
| `WorkflowExecutionCanceled` | API / External | Workflow canceled by user/admin request. |
| `WorkflowExecutionTerminated` | API / External | Workflow forcefully terminated without graceful drain. |

---

## 3. In-Memory `MutableState` Structure

`MutableState` encapsulates the living state of a workflow run during execution:

```go
type MutableState struct {
    RunID           uuid.UUID
    WorkflowID      string
    Version         int
    Status          WorkflowStatus
    LastEventID     int64
    Variables       map[string]any // Workflow variable scope
    
    // In-flight components
    ActivityStates  map[string]*ActivityState // nodeID -> state
    PendingTimers   map[string]time.Time      // timerID -> fireTime
    
    // Outbox tasks generated during this turn
    PendingTransferTasks []TransferTask
    
    // Staging buffer for uncommitted events in the current turn
    uncommittedEvents []HistoryEvent
    previousEventID   int64
}

type ActivityState struct {
    NodeID        string
    ActivityType  string
    Status        ActivityStatus // SCHEDULED, STARTED, COMPLETED, FAILED
    Attempt       int
    StartedAt     *time.Time
    LastHeartbeat time.Time
}
```

---

## 4. The Turn Execution Cycle

Every trigger (Start, Task Complete, Timer Fire, Signal) executes through a standardized turn pipeline:

```
[Trigger Input]
       │
       ▼
1. Acquire In-Memory Run Lock (Keyed Mutex by RunID)
       │
       ▼
2. Load MutableState (Memory Cache Hit or Replay from PostgreSQL)
       │
       ▼
3. Evaluate DAG Transition in RAM:
   ├── Validate precondition
   ├── Generate new HistoryEvent(s)
   ├── Buffer into ms.uncommittedEvents
   ├── Stage Outbox TransferTask(s) for Matching
   └── Advance ms.LastEventID
       │
       ▼
4. 1x Atomic Database Flush via pgx.Batch:
   ├── INSERT INTO history_events (all uncommitted events)
   └── UPDATE workflow_executions WHERE run_id = $id AND last_event_id = $prev
       │
       ▼
5. OCC Check:
   ├── If RowsAffected == 1: SUCCESS -> Dispatch Outbox Tasks to Matching
   └── If RowsAffected == 0: OCC COLLISION -> Discard buffer, Reload & Retry
       │
       ▼
6. Release Run Lock
```

---

## 5. Deterministic History Replay

To ensure crash resilience without storing large relational snapshots, DuraFlow includes a deterministic replay engine:

```go
func Replay(definition *WorkflowDefinition, events []HistoryEvent) (*MutableState, error) {
    if len(events) == 0 {
        return nil, errors.New("empty history stream")
    }

    ms := NewMutableState(events[0].RunID, definition)
    
    for _, event := range events {
        if err := ms.ApplyEvent(event); err != nil {
            return nil, fmt.Errorf("replay failed at event %d (%s): %w", event.EventID, event.Type, err)
        }
    }
    
    ms.uncommittedEvents = nil
    return ms, nil
}
```
If a server crashes while processing a workflow, the next turn loader reads all events for `run_id` sorted by `event_id ASC`, calls `Replay()`, and restores the exact in-memory state in microseconds.
