# Module 07: Worker Commands, Cancellation & Activity Execution

## 1. Overview

Activity Workers in DuraFlow are stateless execution units that pull tasks from Matching queues and return outputs. To support resilient cancellation without waiting for activity timeouts, DuraFlow adopts Temporal's **Worker Commands Protocol**.

---

## 2. Worker Commands & In-Flight Cancellation

### The Problem in Legacy Engines:
When a user cancels a running workflow, any long-running HTTP request or processing step continues executing on the worker until its hard timeout expires, wasting CPU, memory, and external API quotas.

### The Temporal / DuraFlow Solution:
1. Every worker process registers an internal **Control Queue** alongside its normal task queues:
   `control_queue:<worker_id>`
2. When an activity is started, `ActivityState` records the assigned `worker_id`.
3. When a cancellation request arrives:
   - History Engine generates an outbound `CancelActivityTaskCommand`.
   - Matching dispatches the command to `control_queue:<worker_id>`.
   - The worker receives the command and immediately cancels the Go `context.Context` running the local activity.
   - The activity aborts instantly, releasing network sockets and threads.

---

## 3. Built-in Stateless Activity Executors

DuraFlow ships with production-ready built-in activity runners in `internal/activity`:

### 3.1. SSRF-Safe HTTP Executor (`internal/activity/http.go`)
- **DNS Resolution Pinning:** Resolves target hostname once, validates that the IP does NOT belong to RFC 1918 (private IP, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16), loopback (127.0.0.1/8), link-local (169.254.0.0/16), or cloud metadata services (169.254.169.254).
- **Socket Dialing by Pinned IP:** Re-dials strictly using the validated IP to defeat DNS Rebinding attacks.
- **Redirect Sanitization:** Inspects `Location` headers on 3xx redirects and re-validates against the private IP blacklist.

### 3.2. Expression & Transform Executor (`internal/activity/expr.go`)
- Evaluates JSON input mappings and boolean conditional branches.
- Sandboxed execution with strict memory limits and recursion bounds.

---

## 4. Activity Heartbeats & Liveness Detection

For long-running tasks (> 30 seconds), workers send periodic heartbeat signals:
`POST /api/v1/tasks/{task_id}/heartbeat`

- The History Engine updates `ActivityState.LastHeartbeat = time.Now()`.
- If `time.Since(LastHeartbeat) > HeartbeatTimeout`, the Engine marks the activity timed out and schedules a retry attempt.
- The heartbeat response carries any pending worker commands (such as an immediate cancellation flag).
