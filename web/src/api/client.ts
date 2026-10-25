import type {
  WorkflowExecution,
  HistoryEvent,
  WorkflowDefinition,
  TaskQueueStats,
  SignalRequest,
  QueryRequest,
  QueryResponse,
  UpdateRequest,
  UpdateResponse,
  CancelRequest,
} from './types';

const BASE_URL = '/api/v1';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(errorBody.message || `HTTP ${res.status}: ${res.statusText}`);
  }

  return res.json();
}

export const api = {
  // Workflow Executions
  getWorkflows: (params?: { status?: string; search?: string; limit?: number; offset?: number }) => {
    const query = new URLSearchParams();
    if (params?.status && params.status !== 'ALL') query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.offset) query.set('offset', params.offset.toString());
    const qs = query.toString();
    return request<{ items: WorkflowExecution[]; total: number }>(`/workflows${qs ? `?${qs}` : ''}`);
  },

  getWorkflow: (runId: string) => {
    return request<WorkflowExecution>(`/workflows/${runId}`);
  },

  getHistoryEvents: (runId: string) => {
    return request<HistoryEvent[]>(`/workflows/${runId}/history`);
  },

  // Definitions
  getDefinitions: () => {
    return request<WorkflowDefinition[]>('/definitions');
  },

  getWorkflowDefinition: (workflowId: string, version?: number) => {
    const qs = version ? `?version=${version}` : '';
    return request<WorkflowDefinition>(`/definitions/${workflowId}${qs}`);
  },

  // Task Queues
  getQueueStats: () => {
    return request<TaskQueueStats[]>('/queues');
  },

  // Interactive Operations (Signals, Queries, Updates)
  sendSignal: (runId: string, req: SignalRequest) => {
    return request<{ status: string }>(`/workflows/${runId}/signal`, {
      method: 'POST',
      body: JSON.stringify(req),
    });
  },

  runQuery: (runId: string, req: QueryRequest) => {
    return request<QueryResponse>(`/workflows/${runId}/query`, {
      method: 'POST',
      body: JSON.stringify(req),
    });
  },

  sendUpdate: (runId: string, req: UpdateRequest) => {
    return request<UpdateResponse>(`/workflows/${runId}/update`, {
      method: 'POST',
      body: JSON.stringify(req),
    });
  },

  cancelWorkflow: (runId: string, req: CancelRequest) => {
    return request<{ status: string }>(`/workflows/${runId}/cancel`, {
      method: 'POST',
      body: JSON.stringify(req),
    });
  },

  terminateWorkflow: (runId: string, req: CancelRequest) => {
    return request<{ status: string }>(`/workflows/${runId}/terminate`, {
      method: 'POST',
      body: JSON.stringify(req),
    });
  },
};
