# Module 08: External Interactions (Signals, Queries & Updates)

## 1. Overview & Primitives Matrix

Temporal defines three fundamental ways external actors interact with a running workflow. DuraFlow implements all three:

| Primitive | Nature | Can Mutate State? | Can Be Rejected? | Database Write? | Return Value |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Signal** | Asynchronous | Yes | No (Fire-and-forget) | Yes (`Signaled` event) | None |
| **Query** | Synchronous | No (Read-only) | No | **Zero writes** | Workflow variable state |
| **Update** | Synchronous | Yes | **Yes (Validation)** | **Zero if rejected**, 1x Batch if accepted | Output payload |

---

## 2. Asynchronous Signals (`POST /api/v1/workflows/{id}/signal`)

Signals allow external systems (webhooks, user clicks, third-party callbacks) to inject data into a running workflow:
1. Client sends signal name and payload.
2. History Engine acquires the run mutex.
3. Appends `WorkflowExecutionSignaled` event.
4. If any node in the DAG is waiting for this signal (e.g. an Approval node), that node is unblocked and scheduled as ready.
5. Flushes 1x atomic `pgx.Batch` to PostgreSQL.

---

## 3. Synchronous Queries (`POST /api/v1/workflows/{id}/query`)

Queries allow clients to inspect workflow state without side effects:
1. Client requests query (e.g., "get_current_total" or "get_status").
2. History Engine acquires a read lock on the in-memory `MutableState`.
3. If not cached in RAM, `MutableState` is hydrated via `Replay()` from PostgreSQL (read-only).
4. The requested variable or state slice is serialized and returned to the caller.
5. **No events are written to disk; zero database mutations.**

---

## 4. Synchronous Workflow Updates (`POST /api/v1/workflows/{id}/update`)

Workflow Update solves the limitation of Signals (which are fire-and-forget) and Queries (which cannot mutate state).

### Lifecycle:
```
Client: POST /api/v1/workflows/{id}/update
                     │
                     ▼
History Engine: Acquire Run Mutex
                     │
                     ▼
Evaluate Validator Function in RAM
                     │
        ┌────────────┴────────────┐
    REJECTED                   ACCEPTED
        │                         │
        ▼                         ▼
Discard from RAM          Apply mutation to MutableState
Return 400 Bad Request    Append [UpdateAccepted, UpdateCompleted]
Zero DB Writes!           1x Atomic pgx.Batch Commit
                          Return 200 OK + Result Payload
```

This guarantees atomic, validated mutations with immediate feedback to the caller without database write waste.
