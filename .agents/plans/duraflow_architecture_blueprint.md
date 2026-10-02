# FlowForge — Temporal-Inspired Architecture Blueprint (Idiomatic Go)

**Tanggal:** 2026-10-02  
**Status:** Architectural Design Proposal & Transition Blueprint  
**Tujuan:** Mengadopsi prinsip enterprise terbukti dari **Temporal** (Event History, In-Memory Mutable State, Task Queue Decoupling) dan membongkar *over-layering / Java-esque paradigm* menjadi **Idiomatic, High-Throughput Go**.

---

## 1. Problem Statement: Dekonstruksi Paradigma Java di Codebase Saat Ini

Struktur FlowForge saat ini meniru pola klasik dari ekosistem Java / Spring Boot:
```
[HTTP Request]
       │
       ▼
[Handler] ──> konversi ke Command/DTO
       │
       ▼
[UseCase Interface] ──> (hanya memiliki 1 implementasi konkret)
       │
       ▼
[UseCase Implementation] ──> orkestrator tipis
       │
       ▼
[Repository Interface] ──> (hanya memiliki 1 implementasi konkret)
       │
       ▼
[Repository Implementation] ──> adapter database
       │
       ▼
[BaseRepository[T]] ──> abstraksi generik pembungkus SQL
       │
       ▼
[PostgreSQL Database]
```

### Konsekuensi Negatif dari Pola Ini:
1. **Chatty Database I/O (Bottleneck Kritis):**
   Untuk mengeksekusi **satu step alur kerja saja**, FlowForge saat ini melakukan 6–8 network roundtrip ke PostgreSQL:
   - `SELECT ... FOR UPDATE SKIP LOCKED` (Claim step)
   - `UPDATE step_runs SET status = 'running'` (Tandai running)
   - Eksekusi step (HTTP / Evaluasi)
   - `UPDATE step_runs SET status = 'succeeded', output_payload = ...` (Simpan hasil)
   - `SELECT ... FROM step_runs WHERE run_id = ...` (Cek readiness turunan)
   - `UPDATE workflow_runs SET status = ...` (Update run status)
   - `INSERT INTO execution_logs ...` (Append log)
   - `PUBLISH redis/nats` (Real-time monitoring event)
2. **Interface Proliferation & Mockery Bloat:**
   Setiap package mengekspor interface di tingkat produsen (misal `type AuthUseCase interface`, `type WorkflowUseCase interface`), kemudian di-mock secara kaku oleh Mockery. Ini melanggar idiom Go: *"Accept interfaces, return structs"* dan *"Define interfaces where you consume them"*.
3. **Penyebaran State Antar-Tabel yang Rawan Anomali:**
   Status eksekusi tersebar di tabel `workflow_runs`, `step_runs`, `step_wait_tokens`, dan `execution_logs`. Jika worker crash di tengah jalan, database berada dalam status inkonsisten yang membutuhkan *sweeper/reaper loop* konstan.

---

## 2. Empat Pilar Arsitektur Temporal yang Diadopsi

Temporal membuktikan skalabilitas ratusan ribu workflow concurrent dengan empat pilar utama:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            TEMPORAL-STYLE CORE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  1. EVENT SOURCING (History Log)                                            │
│     State alur kerja adalah stream event append-only yang tidak pernah      │
│     di-update secara in-place. Cepat, zero-lock contention, deterministik.  │
│                                                                             │
│  2. IN-MEMORY MUTABLE STATE & SINGLE-FLUSH COMMIT                           │
│     Transisi DAG terjadi di memori (RAM). Hasil eksekusi step diakumulasi   │
│     dalam buffer transaksi, lalu di-flush ke Postgres dalam 1x SQL Batch.   │
│                                                                             │
│  3. PEMISAHAN PERAN SUBSYSTEM: HISTORY vs MATCHING vs ACTIVITY              │
│     - History Service: Mesin status alur kerja (otak DAG).                  │
│     - Matching Service: Antrean tugas terarah (task dispatch & polling).    │
│     - Activity Worker: Eksekutor stateless I/O (HTTP, AI, script).          │
│                                                                             │
│  4. SHARDED CONCURRENCY (WorkflowID Hashing)                                │
│     Setiap workflow run memiliki shard pemilik tertentu, mengeliminasi      │
│     race condition tanpa table-level locking.                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Komparasi Struktur: Current vs Target Blueprint

### Struktur Saat Ini (Java-Style Technical Layers)
```
internal/
├── auth/           # handler, usecase, repository, mocks, actions
├── tenant/         # handler, usecase, repository, mocks
├── workflow/       # handler, usecase, repository, mocks
├── execution/      # coordinator, usecase, handler, repository, sweeper
│   └── executor/   # http, condition, transform, delay, event_wait
├── engine/         # dag, evaluator, readiness, scope, state
├── platform/       # ai, audit, config, eventbus, eventstream, httpmw, postgres, queue, safehttp, ...
```

### Struktur Baru (Idiomatic Go Subsystems / Components)
```
cmd/
├── server/         # Entrypoint tunggal modular monolith (API + History + Matching)
└── worker/         # Entrypoint worker mandiri (Activity & Task Pollers)

internal/
├── api/            # HTTP/gRPC ingress, routing, auth middleware, request binders
│
├── workflow/       # Definisi alur kerja (CRUD, Draft, Publishing, DAG Validation)
│                   # (Gabungan model, storage, dan service tanpa interface buatan)
│
├── history/        # ENGINE INTI (Mengadopsi Temporal History Service)
│   ├── engine.go       # Workflow state machine & orchestrator
│   ├── mutablestate.go # In-memory run state & uncommitted event buffer
│   ├── events.go       # Event definitions (WorkflowStarted, StepScheduled, dll)
│   └── store.go        # Append-only Postgres Event Store (Batch write)
│
├── matching/       # TASK QUEUE SUBSYSTEM (Mengadopsi Temporal Matching)
│   ├── taskqueue.go    # Push-pull queue abstraction (in-memory ringbuffer / Redis stream)
│   └── dispatcher.go   # Task dispatching dengan backpressure & timeout management
│
├── activity/       # STEP EXECUTORS (Stateless Worker Handlers)
│   ├── activity.go     # Registry & runner interface
│   ├── http.go         # Outbound HTTP dengan SSRF SafeHTTP
│   ├── expr.go         # Sandboxed condition & transform (expr-lang)
│   ├── ai.go           # AI failure analysis
│   └── sleep.go        # Non-blocking durable timers
│
└── platform/       # Low-level primitives murni
    ├── config/         # 12-factor env config
    ├── dbtx/           # pgxpool connection & atomic transaction runner
    ├── safehttp/       # DNS pin & SSRF validator
    └── telemetry/      # Structured logging (slog), metrics (Prometheus), audit
```

---

## 4. Anatomi Siklus Eksekusi Baru (End-to-End Workflow Run)

### Alur Eksekusi Step (Sekarang vs Baru)

| Langkah | Alur Saat Ini (FlowForge CRUD) | Alur Baru (Temporal Style) |
| :--- | :--- | :--- |
| **1. Trigger Run** | `INSERT workflow_runs` + `INSERT step_runs` (banyak baris) + `Asynq Enqueue`. | Append 1 event: `WorkflowExecutionStarted` ke History Store + Enqueue initial ready tasks ke Matching. |
| **2. Worker Pickup** | Polling Asynq -> Ambil lock DB `SKIP LOCKED` pada baris step -> Update `status='running'`. | Activity Worker melakukan Long-Poll ke Task Queue -> Task diterima langsung dari memori / Redis stream. |
| **3. Eksekusi** | Eksekutor menjalankan HTTP / Script. | Activity Worker menjalankan activity function secara stateless. |
| **4. Penyelesaian** | 4-5 SQL terpisah (`step_runs UPDATE`, cek DAG, `workflow_runs UPDATE`, `logs INSERT`). | Worker mengirim `ActivityCompleted(output)`. History Engine me-load MutableState, mengevaluasi node berikutnya di RAM, lalu melakukan **1x ATOMIC SQL BATCH**: <br>• Append `[ActivityCompleted, NextActivitiesScheduled]` ke `history_events`<br>• Update checkpoint versi di `workflow_executions`. |

---

## 5. Skema Database: Migrasi dari Relasional Update ke Append-Only History

### Tabel 1: `workflow_executions` (Header State Ringkas)
Menyimpan pointer snapshot status terakhir. Tidak ada perulangan update per kolom status step.
```sql
CREATE TABLE workflow_executions (
    tenant_id          UUID NOT NULL,
    run_id             UUID NOT NULL,
    workflow_id        UUID NOT NULL,
    version_id         UUID NOT NULL,
    current_state      VARCHAR(32) NOT NULL, -- 'RUNNING', 'COMPLETED', 'FAILED', 'WAITING'
    last_event_id      BIGINT NOT NULL DEFAULT 0,
    state_payload      JSONB NOT NULL DEFAULT '{}', -- Akumulasi output variabel workflow
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (tenant_id, run_id)
);
```

### Tabel 2: `history_events` (Append-Only Event Store)
Menyimpan riwayat tidak terubah (*immutable audit trail*) dengan urutan monolitik `event_id`.
```sql
CREATE TABLE history_events (
    tenant_id          UUID NOT NULL,
    run_id             UUID NOT NULL,
    event_id           BIGINT NOT NULL, -- Monotonically increasing sequence per run (1, 2, 3...)
    event_type         VARCHAR(64) NOT NULL, -- 'WorkflowStarted', 'ActivityScheduled', 'ActivityCompleted', dll.
    node_key           VARCHAR(128),
    payload            JSONB NOT NULL DEFAULT '{}',
    timestamp          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (tenant_id, run_id, event_id)
);

CREATE INDEX idx_history_events_lookup ON history_events (tenant_id, run_id, event_id ASC);
```

---

## 6. Prinsip Penulisan Go (De-Javafication Guidelines)

1. **Hapus Usecase Pass-Through:**
   - *Pola Lama:* `WorkflowHandler -> WorkflowUseCase -> WorkflowRepository -> Database`.
   - *Pola Baru:* `workflow.Service` langsung menangani logika bisnis dan query database terkait workflow definitions. Jika satu fungsi hanya berupa delegasi `return s.repo.Find()`, hapus lapisan tersebut!
2. **Definisikan Interface di Titik Konsumsi (Consumer-Driven Interfaces):**
   - Bukan: Paket `history` mengekspor `type HistoryService interface`.
   - Melainkan: Paket `api` mendefinisikan interface kecil yang dibutuhkannya:
     ```go
     // Di dalam package api
     type RunStarter interface {
         StartWorkflow(ctx context.Context, tenantID, workflowID uuid.UUID, input []byte) (uuid.UUID, error)
     }
     ```
3. **Manfaatkan Konkurensi Channel & Primitif Sinkronisasi Standar:**
   - Gunakan `context.Context` untuk deadline & cancellation propagation.
   - Gunakan `sync.Pool` untuk buffer JSON / event serialization guna mencapai *zero-allocation state transitions*.
   - Gunakan `pgx.Batch` untuk flush banyak event dalam 1 kali roundtrip database.

---

## 7. Rencana Transisi Bertahap (Phased Roadmap)

```
Fase A: Penyehatan Inti & Stabilitas (Immediate)
├── Perbaiki BUG-01 (dbPool nil pada worker)
├── Perbaiki CONC-01 (Thread-safe PRNG pada retry backoff)
├── Perbaiki DES-01 (Isolasi task type pada Asynq)
└── Target test Makefile mencakup ./cmd/...

Fase B: Prototipe History Engine (Temporal Pattern)
├── Implementasikan `internal/history/mutablestate.go` & `store.go`
├── Buat migrasi SQL `history_events` dan `workflow_executions`
└── Validasi performa dan determinisme dengan replay test

Fase C: Refactoring Lapisan Arsitektur (De-Javafication)
├── Konsolidasi paket `workflow` dan `auth` menjadi service konkret
├── Hapus use case interface 1-to-1 yang redundan
└── Ganti polling SQL per step menjadi batch event flushing
```
