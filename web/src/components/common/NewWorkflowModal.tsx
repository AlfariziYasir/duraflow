import React, { useState } from 'react';
import { WorkflowItem } from '../../types';

interface NewWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateWorkflow: (wf: Partial<WorkflowItem>) => void;
}

export const NewWorkflowModal: React.FC<NewWorkflowModalProps> = ({
  isOpen,
  onClose,
  onCreateWorkflow,
}) => {
  const [name, setName] = useState('inventory-sync-orchestration');
  const [initiator, setInitiator] = useState('api-gateway');
  const [fencingToken, setFencingToken] = useState('strict-serializable-wal');
  const [steps, setSteps] = useState(5);
  const [executionMode, setExecutionMode] = useState('deterministic-atomic');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateWorkflow({
      name: name.trim() || 'custom-pipeline',
      initiator: initiator.trim() || 'manual-trigger',
      stepTotal: Number(steps) || 5,
      stepCurrent: 1,
      state: 'RUNNING',
      stateDetail: `Fencing: ${fencingToken}`,
      duration: '0s elapsed',
      age: 'Started just now',
      stepFlow: `Step 1/${steps}: Initializing → MutexLease`,
      telemetry: 'Retries: 0 • SyncAck',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-[#111827] border border-[#334155] rounded-xl shadow-[0_24px_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 bg-[#0c121e] border-b border-[#1e293b] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#38bdf8]/10 text-[#38bdf8] flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">add_task</span>
            </div>
            <div>
              <h3 className="font-['Geist'] text-[15px] font-bold text-[#dfe2ef]">
                Trigger New Workflow Orchestration
              </h3>
              <p className="text-[11px] font-mono text-[#87929a]">
                Provision deterministic DAG execution across worker fleet
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#87929a] hover:text-[#dfe2ef] p-1 rounded cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Body form */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4 font-mono text-[12px]">
          <div>
            <label className="block text-[11px] text-[#87929a] mb-1 font-semibold">
              Workflow Identifier / Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#070a10] border border-[#334155] rounded-lg px-3 py-2 text-[#dfe2ef] focus:border-[#38bdf8] outline-none"
              placeholder="e.g. order-fulfillment-saga-v3"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-[#87929a] mb-1 font-semibold">
                Initiator / Trigger Source
              </label>
              <select
                value={initiator}
                onChange={(e) => setInitiator(e.target.value)}
                className="w-full bg-[#070a10] border border-[#334155] rounded-lg px-3 py-2 text-[#dfe2ef] focus:border-[#38bdf8] outline-none"
              >
                <option value="api-gateway">api-gateway (REST)</option>
                <option value="kafka-cdc-bridge">kafka-cdc-bridge</option>
                <option value="scheduler-daemon">scheduler-daemon (Cron)</option>
                <option value="onboarding-flow">onboarding-flow</option>
                <option value="manual-operator">manual-operator</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-[#87929a] mb-1 font-semibold">
                Estimated Step Count
              </label>
              <input
                type="number"
                min="1"
                max="24"
                value={steps}
                onChange={(e) => setSteps(Number(e.target.value))}
                className="w-full bg-[#070a10] border border-[#334155] rounded-lg px-3 py-2 text-[#dfe2ef] focus:border-[#38bdf8] outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-[#87929a] mb-1 font-semibold">
                Concurrency Isolation
              </label>
              <select
                value={fencingToken}
                onChange={(e) => setFencingToken(e.target.value)}
                className="w-full bg-[#070a10] border border-[#334155] rounded-lg px-3 py-2 text-[#dfe2ef] focus:border-[#38bdf8] outline-none"
              >
                <option value="strict-serializable-wal">Strict Serializable (OCC)</option>
                <option value="snapshot-isolation">Snapshot Isolation</option>
                <option value="read-committed-mutex">Read Committed Mutex</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-[#87929a] mb-1 font-semibold">
                Execution Model
              </label>
              <select
                value={executionMode}
                onChange={(e) => setExecutionMode(e.target.value)}
                className="w-full bg-[#070a10] border border-[#334155] rounded-lg px-3 py-2 text-[#dfe2ef] focus:border-[#38bdf8] outline-none"
              >
                <option value="deterministic-atomic">Deterministic Atomic Pass</option>
                <option value="speculative-fastpath">Speculative Fastpath</option>
                <option value="distributed-saga">Distributed Saga 2PC</option>
              </select>
            </div>
          </div>

          <div className="p-3 bg-[#0c121e] border border-[#1e293b] rounded-lg text-[11px] text-[#87929a] flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-[#10b981]">
              verified_user
            </span>
            <span>Allocates monotonic epoch ID & acquires broker sync ack quorum.</span>
          </div>

          {/* Footer buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#1e293b]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[#181b25] text-[#bdc8d1] hover:bg-[#262a34] font-mono cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#38bdf8] text-[#001e2c] font-bold hover:bg-[#7bd0ff] font-['Geist'] flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">play_arrow</span>
              <span>Launch Execution</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
