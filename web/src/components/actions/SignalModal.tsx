import React, { useState } from 'react';
import { X, Radio, Loader2 } from 'lucide-react';
import { api } from '../../api/client';

interface SignalModalProps {
  runId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const SignalModal: React.FC<SignalModalProps> = ({ runId, isOpen, onClose, onSuccess }) => {
  const [signalName, setSignalName] = useState('');
  const [payloadStr, setPayloadStr] = useState('{\n  "approved": true\n}');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let parsedPayload: Record<string, unknown>;
    try {
      parsedPayload = JSON.parse(payloadStr) as Record<string, unknown>;
    } catch {
      setError('Payload must be valid JSON');
      return;
    }

    setLoading(true);
    try {
      await api.sendSignal(runId, {
        signal_name: signalName,
        payload: parsedPayload,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send signal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-surface-card border border-border rounded-lg shadow-xl overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-warning" />
            <h3 className="text-sm font-semibold text-fg">Send Signal to Workflow</h3>
          </div>
          <button onClick={onClose} className="text-muted hover:text-fg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 text-xs">
          {error && (
            <div className="p-2 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400">
              {error}
            </div>
          )}

          <div>
            <label className="block text-muted font-medium mb-1">Signal Name</label>
            <input
              type="text"
              required
              placeholder="e.g. manager_approval"
              value={signalName}
              onChange={(e) => setSignalName(e.target.value)}
              className="w-full px-3 py-1.5 rounded bg-background border border-border text-fg font-mono focus:outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-muted font-medium mb-1">JSON Payload</label>
            <textarea
              rows={5}
              required
              value={payloadStr}
              onChange={(e) => setPayloadStr(e.target.value)}
              className="w-full p-2.5 rounded bg-background border border-border text-fg font-mono focus:outline-none focus:border-accent"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded border border-border text-muted hover:text-fg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 rounded bg-accent text-slate-900 font-bold hover:bg-accent-hover flex items-center gap-1.5"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Send Signal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
