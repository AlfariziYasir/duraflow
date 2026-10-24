import React, { useState } from 'react';
import { X, Zap, Loader2, CheckCircle2, AlertOctagon } from 'lucide-react';
import { api } from '../../api/client';
import type { UpdateResponse } from '../../api/types';

interface UpdateModalProps {
  runId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({ runId, isOpen, onClose, onSuccess }) => {
  const [updateName, setUpdateName] = useState('');
  const [argsStr, setArgsStr] = useState('{\n  "amount": 100\n}');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<UpdateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResponse(null);

    let parsedArgs: Record<string, unknown>;
    try {
      parsedArgs = JSON.parse(argsStr) as Record<string, unknown>;
    } catch {
      setError('Arguments must be valid JSON');
      return;
    }

    setLoading(true);
    try {
      const res = await api.sendUpdate(runId, {
        update_name: updateName,
        args: parsedArgs,
      });
      setResponse(res);
      if (res.status === 'ACCEPTED') {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-surface-card border border-border rounded-lg shadow-xl overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-semibold text-fg">Send Workflow Update</h3>
          </div>
          <button onClick={onClose} className="text-muted hover:text-fg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleUpdate} className="p-4 space-y-4 text-xs">
          <p className="text-muted leading-relaxed">
            Synchronous mutation evaluated by in-memory validators.
            Rejected updates produce <strong>zero database writes</strong>.
          </p>

          {error && (
            <div className="p-2 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400">
              {error}
            </div>
          )}

          <div>
            <label className="block text-muted font-medium mb-1">Update Name</label>
            <input
              type="text"
              required
              placeholder="e.g. adjust_inventory"
              value={updateName}
              onChange={(e) => setUpdateName(e.target.value)}
              className="w-full px-3 py-1.5 rounded bg-background border border-border text-fg font-mono focus:outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-muted font-medium mb-1">Arguments (JSON)</label>
            <textarea
              rows={4}
              required
              value={argsStr}
              onChange={(e) => setArgsStr(e.target.value)}
              className="w-full p-2.5 rounded bg-background border border-border text-fg font-mono focus:outline-none focus:border-accent"
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
              Send Update
            </button>
          </div>

          {response && (
            <div
              className={`mt-4 p-3 rounded border ${
                response.status === 'ACCEPTED'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
              }`}
            >
              <div className="flex items-center gap-2 font-semibold">
                {response.status === 'ACCEPTED' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>ACCEPTED (Committed via pgx.Batch)</span>
                  </>
                ) : (
                  <>
                    <AlertOctagon className="w-4 h-4 text-rose-400" />
                    <span>REJECTED (Zero DB writes)</span>
                  </>
                )}
              </div>
              {response.rejection_reason && (
                <div className="mt-1 text-xs opacity-90">{response.rejection_reason}</div>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
