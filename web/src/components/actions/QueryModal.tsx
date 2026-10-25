import React, { useState } from 'react';
import { X, HelpCircle, Loader2 } from 'lucide-react';
import { api } from '../../api/client';

interface QueryModalProps {
  runId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const QueryModal: React.FC<QueryModalProps> = ({ runId, isOpen, onClose }) => {
  const [queryType, setQueryType] = useState('get_state');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<unknown | null>(null);

  if (!isOpen) return null;

  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const res = await api.runQuery(runId, { query_type: queryType });
      setResult(res.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Query evaluation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-surface-card border border-border rounded-lg shadow-xl overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-semibold text-fg">Execute Synchronous Query</h3>
          </div>
          <button onClick={onClose} className="text-muted hover:text-fg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleQuery} className="p-4 space-y-4 text-xs">
          <p className="text-muted leading-relaxed">
            Queries inspect the in-memory <code className="text-fg font-mono">MutableState</code> directly in RAM.
            Zero database events are generated.
          </p>

          {error && (
            <div className="p-2 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400">
              {error}
            </div>
          )}

          <div>
            <label className="block text-muted font-medium mb-1">Query Type</label>
            <input
              type="text"
              required
              placeholder="e.g. get_state or get_total"
              value={queryType}
              onChange={(e) => setQueryType(e.target.value)}
              className="w-full px-3 py-1.5 rounded bg-background border border-border text-fg font-mono focus:outline-none focus:border-accent"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded border border-border text-muted hover:text-fg"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 rounded bg-accent text-slate-900 font-bold hover:bg-accent-hover flex items-center gap-1.5"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Execute Query
            </button>
          </div>

          {result !== null && (
            <div className="mt-4 pt-4 border-t border-border">
              <label className="block text-muted font-medium mb-1">Query Result (In-Memory State):</label>
              <pre className="p-2.5 rounded bg-background border border-border font-mono text-[11px] text-fg overflow-x-auto max-h-48">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
