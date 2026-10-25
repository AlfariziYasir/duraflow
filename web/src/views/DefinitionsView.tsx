import React, { useState, useEffect } from 'react';
import { FileCode, Calendar, Layers, RefreshCw } from 'lucide-react';
import { api } from '../api/client';
import type { WorkflowDefinition } from '../api/types';

export const DefinitionsView: React.FC = () => {
  const [definitions, setDefinitions] = useState<WorkflowDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDefinitions = async () => {
    setLoading(true);
    try {
      const data = await api.getDefinitions();
      setDefinitions(data || []);
    } catch {
      // Mock fallback
      setDefinitions([
        {
          workflow_id: 'order_processing',
          version: 2,
          name: 'Order Processing Pipeline',
          description: 'Validates inventory, charges payment via SSRF-safe HTTP, delays fraud check, dispatches order.',
          dag_schema: {
            nodes: [
              { id: 'start', name: 'OrderReceived', type: 'workflow_start' },
              { id: 'inv', name: 'ValidateInventory', type: 'activity', activity_type: 'http_call' },
              { id: 'timer', name: 'FraudDelay', type: 'timer', timer_duration_seconds: 300 },
              { id: 'pay', name: 'ChargePayment', type: 'activity', activity_type: 'http_call' },
              { id: 'ship', name: 'FulfillOrder', type: 'activity', activity_type: 'http_call' },
            ],
            edges: [
              { from: 'start', to: 'inv' },
              { from: 'start', to: 'timer' },
              { from: 'inv', to: 'pay' },
              { from: 'timer', to: 'ship' },
              { from: 'pay', to: 'ship' },
            ],
          },
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDefinitions();
  }, []);

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto text-xs">
      <div className="p-3 bg-surface border border-border rounded-lg flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-fg">Workflow Definitions Catalog</h2>
          <p className="text-muted text-[11px] mt-0.5">
            Immutable, versioned DAG schemas stored in PostgreSQL table <code className="font-mono text-accent">workflow_definitions</code>.
          </p>
        </div>
        <button
          onClick={loadDefinitions}
          className="p-1.5 text-muted hover:text-fg rounded border border-border hover:bg-surface-hover"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {definitions.map((def) => (
          <div key={`${def.workflow_id}-v${def.version}`} className="p-3.5 bg-surface border border-border rounded-lg space-y-2.5">
            <div className="flex items-center justify-between border-b border-border/60 pb-2">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-accent" />
                <span className="font-semibold text-fg font-mono">{def.workflow_id}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded border border-border font-mono text-muted">
                  v{def.version}
                </span>
              </div>
              <span className="text-muted text-[11px] flex items-center gap-1">
                <Layers className="w-3 h-3" />
                {def.dag_schema.nodes.length} nodes
              </span>
            </div>

            <p className="text-muted text-[11px] leading-relaxed">
              {def.description || 'No description provided.'}
            </p>

            <div className="p-2 rounded bg-surface-card border border-border font-mono text-[10px] text-muted max-h-32 overflow-auto">
              <pre>{JSON.stringify(def.dag_schema, null, 2)}</pre>
            </div>

            <div className="text-[10px] text-muted flex items-center justify-between pt-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Registered: {new Date(def.created_at).toLocaleDateString()}
              </span>
              <span className="text-accent hover:underline cursor-pointer">View DAG Graph →</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
