import React, { useState, useEffect } from 'react';
import { Search, Plus, RefreshCw, AlertCircle } from 'lucide-react';
import { api } from '../api/client';
import type { WorkflowExecution } from '../api/types';
import { StatusBadge } from '../components/common/StatusBadge';

interface ExecutionsViewProps {
  onSelectRun: (runId: string) => void;
}

export const ExecutionsView: React.FC<ExecutionsViewProps> = ({ onSelectRun }) => {
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const loadExecutions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getWorkflows({ status: statusFilter, search });
      setExecutions(res.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch executions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExecutions();
  }, [statusFilter]);

  const filterTabs = [
    { key: 'ALL', label: 'All' },
    { key: 'RUNNING', label: 'Running' },
    { key: 'COMPLETED', label: 'Completed' },
    { key: 'FAILED', label: 'Failed' },
    { key: 'TIMED_OUT', label: 'Timed Out' },
  ];

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto">
      {/* Search & Filter Bar */}
      <div className="p-3 bg-surface border border-border rounded-lg flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by Workflow ID, Run ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadExecutions()}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded bg-background border border-border text-fg placeholder:text-muted focus:outline-none focus:border-accent"
            />
          </div>

          <div className="flex items-center gap-1 bg-surface-card p-0.5 rounded border border-border text-xs">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  statusFilter === tab.key
                    ? 'bg-accent/10 text-accent font-semibold'
                    : 'text-muted hover:text-fg'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadExecutions}
            className="p-1.5 text-muted hover:text-fg rounded border border-border hover:bg-surface-hover"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => alert('Trigger run modal')}
            className="px-3 py-1.5 rounded bg-accent text-slate-900 text-xs font-bold hover:bg-accent-hover flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Trigger Run
          </button>
        </div>
      </div>

      {/* Executions Table */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        {error && (
          <div className="p-4 bg-rose-500/10 border-b border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-card text-muted uppercase font-bold text-[10px] tracking-wider border-b border-border">
              <tr>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Workflow ID</th>
                <th className="px-4 py-3">Run ID</th>
                <th className="px-4 py-3">Next Timer / Step</th>
                <th className="px-4 py-3">Turn IOPS</th>
                <th className="px-4 py-3">Started</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {executions.length === 0 && !loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted">
                    No workflow executions found.
                  </td>
                </tr>
              ) : (
                executions.map((run) => (
                  <tr
                    key={run.run_id}
                    onClick={() => onSelectRun(run.run_id)}
                    className="hover:bg-surface-hover/60 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <StatusBadge status={run.status} />
                    </td>
                    <td className="px-4 py-3 font-semibold text-fg">
                      {run.workflow_id} <span className="text-muted font-normal text-[10px]">v{run.workflow_version}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-accent">
                      {run.run_id.slice(0, 8)}...
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {run.next_timer_at ? (
                        <span className="text-warning font-semibold">
                          Timer: {new Date(run.next_timer_at).toLocaleTimeString()}
                        </span>
                      ) : (
                        <span>Last Event #{run.last_event_id}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-fg">
                      {run.last_event_id} batches
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {new Date(run.start_time).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-accent hover:underline text-[11px]">Inspect →</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 border-t border-border bg-surface-card flex items-center justify-between text-[11px] text-muted">
          <span>
            Showing <strong className="text-fg">{executions.length}</strong> executions • Single-turn atomic commits
          </span>
          <span>Brokerless (Go In-Memory + PostgreSQL)</span>
        </div>
      </div>
    </div>
  );
};
