# Module 01: Invariants, Principles & Dependency Injection

## 1. The 5 Iron Invariants of DuraFlow

1. **Zero External Message Brokers:**
   - DuraFlow strictly relies on pure Go concurrency primitives (`chan`, `sync.Mutex`, `atomic`, `container/heap`) and PostgreSQL as the single external dependency.
   - NEVER introduce Redis, Kafka, RabbitMQ, or NATS. All inter-service and task queue coordination happens in-memory with PostgreSQL cold-start backup.

2. **Strict Single-Turn Atomic Database Commits:**
   - Every state transition turn (Start, Task Completed, Timer Fired, Signal Received) commits in exactly **one atomic PostgreSQL network roundtrip** using `pgx.Batch`.
   - Never perform sequential roundtrips per step.

3. **Deterministic Append-Only Event Sourcing:**
   - Workflow execution state is modeled as an append-only stream in `history_events`. Events are immutable once committed.
   - Any execution state can be deterministically replayed from genesis.

4. **Idiomatic Go Subsystem Architecture (De-Javafication):**
   - Package by subsystem (`history`, `matching`, `activity`, `workflow`, `api`, `platform`), never by technical layer (`handler`, `usecase`, `repository`, `dto`).
   - Eliminate 1:1 pass-through interfaces and mock proliferation. Return concrete structs; accept interfaces only at consumption boundaries.

5. **Manual Constructor Dependency Injection & Minimalist Footprint:**
   - Strictly NO `go.uber.org/fx`, `dig`, or reflection-based DI frameworks.
   - All services, stores, and engines are explicitly wired via standard constructors (`New...`) in `cmd/server/main.go` and `cmd/worker/main.go`.
   - Maximize standard library usage (`net/http.ServeMux` Go 1.22+, `log/slog`, `container/heap`).

---

## 2. The Ponytail Ladder Applied to DuraFlow

Before introducing any abstraction or library, the solution must pass through the Ponytail Ladder:

```
1. Does this need to exist at all? (YAGNI)
   ↳ Example: No dedicated worker pool framework; Go's native goroutines and bounded worker loops suffice.
2. Already in this codebase?
   ↳ Reuse existing buffer pools and safe execution helpers.
3. Stdlib does it?
   ↳ Use Go 1.22+ net/http ServeMux for routing; use container/heap for timer priority queues; use log/slog for structured logging.
4. Native PostgreSQL feature covers it?
   ↳ Use PostgreSQL JSONB for flexible payloads; use primary key constraints and pgx.Batch for atomic transaction fencing.
5. Already-installed dependency solves it?
   ↳ Use jackc/pgx/v5 for all database interactions.
6. Can it be one line?
   ↳ Prefer clear, direct one-line checks.
7. Only then: write the minimum code that works.
```

---

## 3. Dependency Injection: Manual Wiring vs Uber-FX

Temporal Server relies heavily on `go.uber.org/fx` across all service boundaries (`service/history/fx.go`, `service/matching/fx.go`, `service/frontend/fx.go`). While suited for massive monorepos with dozens of optional plugins, `fx` incurs:
- Reflection overhead on startup.
- Runtime panics when wiring dependencies fail, bypassing the Go compiler's type checks.
- Cluttered test setups requiring synthetic fx containers.

### DuraFlow Manual Constructor Injection Pattern
DuraFlow wires all subsystems cleanly in `cmd/server/main.go` and `cmd/worker/main.go`:

```go
// cmd/server/main.go
func main() {
    ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
    defer cancel()

    cfg := config.Load()
    logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: cfg.LogLevel}))

    // 1. Storage Pool
    pool, err := postgres.NewPool(ctx, cfg.DatabaseURL)
    if err != nil {
        logger.Error("failed to connect to database", "err", err)
        os.Exit(1)
    }
    defer pool.Close()

    // 2. Subsystems
    histStore := history.NewStore(pool, logger)
    matchHub := matching.NewHub(pool, logger)
    histEngine := history.NewEngine(histStore, matchHub, logger)
    apiHandler := api.NewRouter(histEngine, matchHub, logger)

    // 3. Server Ingress
    srv := &http.Server{
        Addr:    cfg.HTTPPort,
        Handler: apiHandler,
    }

    go func() {
        if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
            logger.Error("server stopped with error", "err", err)
        }
    }()

    <-ctx.Done()
    srv.Shutdown(context.Background())
    histEngine.Close()
    matchHub.Close()
}
```

### Dependency Audit Matrix

| Domain | Third-Party Solution (Avoided) | DuraFlow Stdlib / Minimal Solution |
| :--- | :--- | :--- |
| **DI Container** | `go.uber.org/fx`, `uber-go/dig` | **Manual Constructor Injection** |
| **HTTP Routing** | `gin-gonic/gin`, `labstack/echo` | **Go 1.22+ `net/http.ServeMux`** |
| **Logging** | `uber-go/zap`, `sirupsen/logrus` | **Standard Library `log/slog`** |
| **Timer Priority Queue** | `hibiken/asynq`, Redis ZSET | **Standard Library `container/heap`** |
| **Database Adapter** | `jmoiron/sqlx`, GORM, Ent | **`github.com/jackc/pgx/v5`** |
| **ID Generation** | Hand-rolled strings | **`github.com/google/uuid`** |
| **Testing** | Custom suites | **Standard `testing` + `stretchr/testify`** |
