export type NavigationPath = 
  | 'workflows'
  | 'execution-graph'
  | 'nodes-workers'
  | 'event-logs'
  | 'settings';

export interface WorkflowItem {
  id: string;
  codeId: string;
  name: string;
  stepFlow: string;
  stepCurrent: number;
  stepTotal: number;
  state: 'RUNNING' | 'COMPLETED' | 'RETRYING' | 'SCHEDULED' | 'FAILED' | 'PAUSED';
  stateDetail?: string;
  duration: string;
  age: string;
  initiator: string;
  telemetry: string;
  fencingToken?: string;
  cronExpr?: string;
  errorDetail?: string;
}

export interface WorkerNode {
  id: string;
  name: string;
  role: 'Primary Leader' | 'Worker' | 'Decommissioning';
  ip: string;
  zone: string;
  region: 'us-east' | 'us-west' | 'eu-central';
  poolType: 'compute-intensive' | 'memory-buffered' | 'io-optimized';
  health: 'healthy' | 'busy' | 'draining' | 'idle';
  workersActive: number;
  workerSlots: number;
  activeTasks: number;
  cpuUtilization: number;
  memoryBufferUsed: number;
  memoryBufferTotal: number;
  rendezvousPing: string;
  drainRemaining?: string;
  drainReason?: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  module: string;
  message: string;
  seq: number;
  highlightWords?: string[];
  tags?: { label: string; value: string; variant?: 'default' | 'error' | 'primary' | 'warning' }[];
  traceId?: string;
}

export interface TraceSpan {
  id: string;
  name: string;
  durationMs: number;
  startOffsetMs: number;
  percentage: number;
  status: 'ok' | 'error' | 'aborted';
  detail?: string;
  service: string;
}

export interface DAGNode {
  id: string;
  title: string;
  type: string;
  typeColor: string;
  durationText: string;
  status: 'completed' | 'running' | 'queued' | 'failed';
  seqText: string;
  detail: string;
  x: number;
  y: number;
  width: number;
  workerNode?: string;
  payload?: Record<string, unknown>;
  logs?: string[];
}
