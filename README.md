# DuraFlow ⚡

**DuraFlow** adalah platform orkestrasi alur kerja (*durable workflow engine*) berbasis Go dan PostgreSQL murni. Mengadopsi prinsip enterprise terbukti dari **Temporal** (Event History, In-Memory Mutable State, dan Task Queue Matching), DuraFlow dirancang tanpa dependensi eksternal tambahan seperti Redis atau message broker (NATS/Kafka).

---

## 🏛️ Filosofi Arsitektur

1. **Zero-Broker Dependency:**
   - Tidak membutuhkan Redis atau broker antrean luar.
   - Task dispatching menggunakan Go in-memory channels/buffers dengan backup ketahanan (*durability*) langsung di PostgreSQL.
2. **Event Sourcing (Append-Only History):**
   - Transisi alur kerja dicatat sebagai deretan event yang tidak pernah di-update secara *in-place*.
   - Tidak ada *lock contention* dan jejak audit bersifat deterministik.
3. **In-Memory Mutable State & Single-Flush Commit:**
   - State alur kerja dievaluasi di RAM selama aktif.
   - Hasil step dieksekusi dan di-commit ke PostgreSQL dalam **1 kali atomic SQL batch write** (`pgx.Batch`), memangkas latensi dari ~30ms menjadi < 2ms per langkah.
4. **Idiomatic Go (Subsystem-Oriented):**
   - Bebas dari *over-layering* bergaya Java (tanpa rantai panjang: `handler -> usecase interface -> usecase impl -> repo interface -> repo impl`).
   - Setiap subsistem (`workflow`, `history`, `matching`, `activity`) adalah komponen mandiri yang kohesif.

---

## 📁 Struktur Direktori

```
duraflow/
├── cmd/
│   ├── server/             # Entrypoint modular monolith (API + History + Matching)
│   └── worker/             # Activity worker mandiri (opsional)
├── internal/
│   ├── api/                # HTTP/REST ingress, middleware auth, routing
│   ├── workflow/           # Definisi workflow, DAG validation, versioning
│   ├── history/            # [Core Engine] State machine, MutableState, Event Store
│   ├── matching/           # Task queue in-memory & task dispatcher
│   ├── activity/           # Stateless step executors (HTTP, Sandboxed Expr, AI, Timer)
│   └── platform/           # Config, PostgreSQL (pgxpool), Telemetry
├── migrations/             # PostgreSQL schema (workflow_executions, history_events)
├── docker-compose.yml      # Hanya PostgreSQL
└── Makefile
```

---

## 🚀 Quick Start

### 1. Jalankan Database
```bash
make up
```

### 2. Jalankan Server
```bash
go run ./cmd/server
```

### 3. Jalankan Pengujian
```bash
make test
```
