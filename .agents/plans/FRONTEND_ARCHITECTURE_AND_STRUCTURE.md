# DuraFlow Frontend Architecture & Project Structure

**Date:** 2026-10-21  
**Status:** Full Command Center Template Integrated & Verified  
**Target Directory:** `/home/mohyasiralfarizi/Golang/duraflow/web`

---

## 1. Architectural Philosophy

1. **Single-Binary Delivery (Ponytail Ladder):**
   - The compiled SPA output is located at `web/dist/`.
   - Embedded directly into Go via `web/embed.go` using standard library `embed.FS`.
   - Zero Node.js, Python, or Nginx runtime dependencies in production.
2. **Strict Domain Alignment:**
   - Incorporates DuraFlow's brokerless synchronization semantics (`#a855f7` Sync-Match), optimistic concurrency fencing tokens (`last_event_id`), and durable min-heap timers.
   - Dual-mode data readiness: rich local dataset (`mockData.ts`) for offline design iterations, coupled with `src/api/` for Go REST endpoints and live Server-Sent Events (SSE).
3. **High-Density Industrial Console:**
   - Typographic hierarchy: Geist for structural navigation + JetBrains Mono (with `font-variant-numeric: tabular-nums`) for jitter-free real-time streaming telemetry.
   - Dark-mode bedrock obsidian (`#070a10` / `#0f131c`) with hairline steel borders (`#1e293b`).

---

## 2. Directory Structure

```
web/
├── embed.go                    # Go embed bridge (DistFS & Handler)
├── package.json                # React 19, Tailwind v4 (@tailwindcss/vite), Motion, Lucide
├── tsconfig.json               # Strict TypeScript configuration (zero 'any')
├── vite.config.ts              # Output to dist/, dev proxy to :8080
├── index.html                  # Root template with Geist, JetBrains Mono, Material Symbols
└── src/
    ├── main.tsx                # React DOM entrypoint
    ├── App.tsx                 # Command center state, global shortcuts (⌘K, ⌘L), notifications
    ├── index.css               # Tailwind v4 @theme design tokens & custom scrollbars
    ├── types/
    │   └── index.ts            # High-density UI contracts (DAGNode, WorkerNode, AuditEvent, TraceSpan)
    ├── data/
    │   └── mockData.ts         # Realistic distributed orchestration dataset & telemetry
    ├── api/
    │   ├── types.ts            # PostgreSQL 4-table schema & 17 event types
    │   ├── client.ts           # Fetch API client for Go backend endpoints
    │   └── sse.ts              # EventSource hook for live history streaming
    ├── components/
    │   ├── layout/
    │   │   ├── Header.tsx      # Cluster selector, global search (⌘K), quick actions
    │   │   └── Sidebar.tsx     # Navigation bar, brand logo, latency & brokerless seq monitor
    │   ├── common/
    │   │   ├── CommandPalette.tsx     # Global ⌘K modal for search and navigation
    │   │   ├── Toast.tsx              # Reactive toast alert manager
    │   │   ├── NewWorkflowModal.tsx   # Workflow trigger / definition modal
    │   │   └── ProvisionWorkerModal.tsx # Worker fleet provisioner modal
    │   └── views/
    │       ├── WorkflowsView.tsx      # Fleet pipeline table, filter tabs, OCC fencing verification
    │       ├── ExecutionGraphView.tsx # Interactive DAG canvas, pan/zoom, step inspector, terminal log
    │       ├── NodesWorkersView.tsx   # Worker nodes, health status, CPU/RAM telemetry, maintenance mode
    │       ├── EventLogView.tsx       # Audit event stream & latency waterfall trace spans
    │       └── SettingsView.tsx       # Cluster consensus, WAL sync mode, snapshot interval
```

---

## 3. Development & Build Commands

- `make web-dev`: Runs Vite development server on `http://localhost:3000` with API proxy to `http://localhost:8080`.
- `make web-build`: Runs `tsc` and `vite build` to output production bundle to `web/dist`.
- `make build`: Standard Go build incorporating embedded assets via `embed.FS`.
