# DuraFlow Action History & Architectural Log

## 2026-10-02: Initial Ingestion of Temporal Architecture Docs & Design Alignment
- **Temporal Documentation Ingested:**
  - `docs/architecture/README.md` & `workflow-lifecycle.md`: Core workflow execution sequence, event-driven transitions, decoupled services.
  - `docs/architecture/history-service.md`: Shards, `MutableState`, atomic state transitions, `Transfer Tasks` (outbox pattern), `Timer Tasks`.
  - `docs/architecture/matching-service.md`: Task queues, partition handling, long-poll dispatching from worker to matching.
  - `docs/architecture/retry.md`: Backoff policies, non-retryable errors, server vs client retries.
  - `docs/architecture/in-memory-queue.md` & `speculative-workflow-task.md`: Transient/speculative tasks to eliminate persistence write amplification.
- **Architectural Principles Formulated for DuraFlow:**
  1. **Zero External Broker:** Pure Go in-memory primitives + PostgreSQL persistence (single external dependency). No Redis, no Kafka, no NATS.
  2. **Temporal Event Sourcing & In-Memory State:** Append-only `history_events` log + `MutableState` transitions committed in a single atomic SQL batch per turn via `pgx.Batch`.
  3. **Transactional Outbox for Task Dispatching:** State transition generates transfer tasks; in-memory dispatcher moves them to worker pollers.
  4. **Subsystem Organization (Anti-Javafication):** Structure into `history`, `matching`, `activity`, `workflow`, `api`, `platform`. Eliminate 1-to-1 pass-through interfaces and artificial `usecase -> repo` chains.
  5. **Ponytail Ladder Applied:** Keep code minimal, stdlib-first, single-binary capable, and high-performance.

## 2026-10-02: Comprehensive Architectural Blueprint Drafted
- **Blueprint Created:** Saved at `.agents/plans/DURAFLOW_CORE_BLUEPRINT.md`.
- **Key Specs Defined:**
  - Storage: 4 tables (`workflow_definitions`, `workflow_executions`, `history_events`, `task_queue_backlog`).
  - Turn Commit: Single `pgx.Batch` per turn combining event appends and snapshot updates with OCC fencing token (`last_event_id`).
  - Matching: In-memory channel rendezvous for sync matches, queue buffer for bursts, PG spillover fallback for cold runs.
  - Layout: Subsystems `internal/history`, `internal/matching`, `internal/activity`, `internal/workflow`, `internal/api`, `internal/platform`.
  - 6-Phase Implementation Roadmap.
  - Dependency Policy: Manual Constructor Injection (Zero Uber-FX, Zero Dig). Standard library first (`net/http` router, `log/slog`, `container/heap`), keeping external dependencies strictly limited to `pgx/v5`, `google/uuid`, and `testify`.

## 2026-10-02: Modular Blueprint Decomposition & Full Temporal Integration
- **Action Taken:** Removed obsolete draft (`duraflow_architecture_blueprint.md`).
- **Decomposition Created:** Split blueprint into 10 modular documents under `.agents/plans/blueprint/`:
  - `00_index_and_overview.md`: Index & cross-system comparison.
  - `01_invariants_and_di.md`: The 5 Iron Invariants, Ponytail ladder, Manual DI matrix.
  - `02_storage_and_schema.md`: 4 PostgreSQL tables DDL, indexes, OCC fencing.
  - `03_history_engine_and_event_sourcing.md`: 17 Event types, `MutableState`, atomic `pgx.Batch`, replay.
  - `04_matching_and_task_queues.md`: Brokerless Sync-Match rendezvous, long-polling, PG spillover.
  - `05_timers_and_timeout_management.md`: In-memory `container/heap` min-heap, precision wake-up, cold startup recovery.
  - `06_transient_and_speculative_execution.md`: Transient tasks (retry write elimination), Speculative execution (zero writes).
  - `07_worker_commands_cancellation_and_activities.md`: Stateless runners, SSRF-safe HTTP, Worker Commands control queue.
  - `08_signals_queries_and_updates.md`: Async Signals, read-only Queries, synchronous atomic Updates.
  - `09_implementation_roadmap_and_verification.md`: 6 execution phases, deterministic replay and IOPS acceptance tests.
  - `10_performance_tuning_and_zero_alloc.md`: Zero-allocation `sync.Pool` JSON buffer, `MutableState` LRU cache eviction, `pgxpool` tuning, admission control semaphore, `ContinueAsNew`, and partial unique business deduplication index.

## 2026-10-02: Phase 1 Initiated (Manual Coding by User)
- **Temporal Reference Mapping Defined:**
  - Schema & DDL: `schema/postgresql/v12/temporal/schema.sql`
  - Driver & PGX Configuration: `common/persistence/sql/sqlplugin/postgresql/driver/pgx.go`
  - SQL Operations: `common/persistence/sql/sqlplugin/postgresql/execution.go` & `events.go`
  - History Store Operations: `common/persistence/sql/history_store.go`
- **Phase 1 Deliverables:**
  - `migrations/000001_init_duraflow.up.sql` (4 core tables + indexes).
  - `go.mod` setup with `pgx/v5`, `google/uuid`, and `testify`.
  - `internal/platform/db/pool.go` with high-performance `pgxpool.Config`.

## 2026-10-21: Frontend Project Structure Initialized (Single-Binary Embedded SPA)
- **Design Alignment:**
  - Implemented high-density console architecture reflecting the 4 PostgreSQL tables and 17 History Event types.
  - Preserved single-binary deployment model via Go `//go:embed dist/*` in `web/embed.go`.
- **Frontend Stack Configured:**
  - Setup `web/` using React 18, `@xyflow/react` (interactive DAG visualizer), Tailwind CSS, Lucide icons, and Vite.
  - Added domain types in `web/src/api/types.ts`, REST client in `web/src/api/client.ts`, and SSE hook in `web/src/api/sse.ts`.
  - Scaffolded views: `ExecutionsView` (fleet explorer), `ExecutionDetailView` (cockpit split pane with DAG, timeline, scrubber, and modals for Signals/Queries/Updates), `QueuesView` (task queues & poller telemetry), and `DefinitionsView` (DAG schemas).
  - Verified compilation: `bun run build` and `go build ./web` both pass cleanly with 0 errors.
  - Plan documented at `.agents/plans/FRONTEND_ARCHITECTURE_AND_STRUCTURE.md`.

## 2026-10-21: Full Command Center Design Template Integrated
- **Action Taken:**
  - Extracted user's temporary design from `/home/mohyasiralfarizi/Downloads/duraflow-distributed-orchestration-command.zip`.
  - Integrated into `web/`: 5 full views (`WorkflowsView`, `ExecutionGraphView`, `NodesWorkersView`, `EventLogView`, `SettingsView`), layout components (`Sidebar`, `Header`), modals (`CommandPalette`, `NewWorkflowModal`, `ProvisionWorkerModal`, `Toast`), and design tokens (`index.css`).
  - Modernized dependencies to React 19, Tailwind CSS v4 (`@tailwindcss/vite`), and Motion (`motion`). Stripped unneeded packages (`express`, `@google/genai`, `dotenv`).
  - Eliminated all `: any` and `as any` instances to comply with strict TypeScript rules.
  - Verified build: `bun run build` completed in 1.91s (`web/dist` generated); `go build ./web` compiled cleanly via `embed.FS`.
