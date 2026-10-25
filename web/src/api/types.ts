// DuraFlow Core Domain Types
// Strictly mirrors PostgreSQL schema & History Engine models from .agents/plans/blueprint/

export type WorkflowStatus =
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'TERMINATED'
  | 'TIMED_OUT'
  | 'WAITING';

export type ActivityStatus =
  | 'SCHEDULED'
  | 'STARTED'
  | 'COMPLETED'
  | 'FAILED'
  | 'TIMED_OUT'
  | 'CANCELED';

// All 17 Event Types defined in Module 03 (History Engine & Event Sourcing)
export type HistoryEventType =
  | 'WorkflowExecutionStarted'
  | 'ActivityTaskScheduled'
  | 'ActivityTaskStarted'
  | 'ActivityTaskCompleted'
  | 'ActivityTaskFailed'
  | 'ActivityTaskTimedOut'
  | 'ActivityTaskCanceled'
  | 'TimerStarted'
  | 'TimerFired'
  | 'TimerCanceled'
  | 'WorkflowExecutionSignaled'
  | 'WorkflowExecutionUpdateAccepted'
  | 'WorkflowExecutionUpdateCompleted'
  | 'WorkflowExecutionCompleted'
  | 'WorkflowExecutionFailed'
  | 'WorkflowExecutionCanceled'
  | 'WorkflowExecutionTerminated';

export interface HistoryEvent {
  run_id: string;
  event_id: number;
  event_type: HistoryEventType;
  node_id: string | null;
  payload: Record<string, unknown>;
  timestamp: string;
}

export interface WorkflowExecution {
  run_id: string;
  workflow_id: string;
  workflow_version: number;
  status: WorkflowStatus;
  current_state: Record<string, unknown>;
  last_event_id: number;
  next_timer_at: string | null;
  start_time: string;
  close_time: string | null;
  updated_at: string;
}

export interface DAGNode {
  id: string;
  name: string;
  type: 'activity' | 'timer' | 'condition' | 'signal_wait' | 'workflow_start' | 'workflow_end';
  activity_type?: string;
  retry_policy?: {
    initial_interval_seconds: number;
    backoff_coefficient: number;
    maximum_attempts: number;
    non_retryable_errors?: string[];
  };
  timeouts?: {
    schedule_to_start_seconds?: number;
    start_to_close_seconds?: number;
    heartbeat_seconds?: number;
  };
  timer_duration_seconds?: number;
  signal_name?: string;
}

export interface DAGEdge {
  from: string;
  to: string;
  condition?: string;
}

export interface DAGSchema {
  nodes: DAGNode[];
  edges: DAGEdge[];
}

export interface WorkflowDefinition {
  workflow_id: string;
  version: number;
  name: string;
  description: string | null;
  dag_schema: DAGSchema;
  created_at: string;
}

export interface TaskQueueBacklog {
  task_id: string;
  queue_name: string;
  run_id: string;
  node_id: string;
  activity_type: string;
  input_payload: Record<string, unknown>;
  attempt: number;
  scheduled_at: string;
  visible_at: string;
}

export interface TaskQueueStats {
  queue_name: string;
  active_pollers: number;
  in_memory_depth: number;
  db_backlog_depth: number;
  sync_match_rate: number;
}

// API Payloads
export interface SignalRequest {
  signal_name: string;
  payload: Record<string, unknown>;
}

export interface QueryRequest {
  query_type: string;
  args?: Record<string, unknown>;
}

export interface QueryResponse {
  query_type: string;
  result: unknown;
}

export interface UpdateRequest {
  update_name: string;
  args: Record<string, unknown>;
}

export interface UpdateResponse {
  status: 'ACCEPTED' | 'REJECTED';
  result?: unknown;
  rejection_reason?: string;
}

export interface CancelRequest {
  reason?: string;
}
