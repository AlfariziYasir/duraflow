# Project Rules & Customizations for DuraFlow

## 1. Zero External Broker Architecture
- DuraFlow relies SOLELY on pure Go in-memory primitives and PostgreSQL.
- NEVER introduce Redis, Kafka, NATS, or other message brokers.
- Task dispatching is handled in-memory via `internal/matching/` backed by PostgreSQL persistence.

## 2. Temporal-Inspired Event Sourcing & In-Memory State
- Workflow execution state is modeled as an append-only event stream in `internal/history/`.
- During active execution, state transitions occur in RAM (`MutableState`).
- Database writes MUST be batched into a single atomic flush per step/turn via `pgx.Batch`.

## 3. Idiomatic Go Subsystem Architecture (No Java-Style Over-Layering)
- Package by Subsystem (`api`, `workflow`, `history`, `matching`, `activity`, `platform`), NEVER by technical layer (`handler`, `usecase`, `repository`, `dto`).
- Do NOT create 1-to-1 pass-through interfaces (e.g. `WorkflowUseCase` with only one `workflowUseCase` implementation).
- Accept interfaces at consumer boundaries, return concrete structs.
- Keep domain models and business logic close together without artificial abstraction layers.

## 4. Implementation Plans & Memory Tracking
- Whenever an implementation plan is created or updated, save a copy into `.agents/plans/`.
- Log recent actions and architectural decisions in `.agents/memory/action_history.md`.
