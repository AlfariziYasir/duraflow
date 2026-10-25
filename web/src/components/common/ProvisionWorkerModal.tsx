import React, { useState } from 'react';
import { WorkerNode } from '../../types';

interface ProvisionWorkerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProvisionNode: (node: Partial<WorkerNode>) => void;
}

export const ProvisionWorkerModal: React.FC<ProvisionWorkerModalProps> = ({
  isOpen,
  onClose,
  onProvisionNode,
}) => {
  const [nodeName, setNodeName] = useState('worker-us-east-04');
  const [region, setRegion] = useState<'us-east' | 'us-west' | 'eu-central'>('us-east');
  const [poolType, setPoolType] = useState<'compute-intensive' | 'memory-buffered' | 'io-optimized'>('compute-intensive');
  const [slots, setSlots] = useState(64);

  if (!isOpen) return null;

  const handleProvision = (e: React.FormEvent) => {
    e.preventDefault();
    onProvisionNode({
      name: nodeName.trim() || 'worker-dynamic',
      role: 'Worker',
      ip: `10.240.${Math.floor(Math.random() * 5 + 1)}.${Math.floor(Math.random() * 80 + 20)}`,
      zone: `${region}-1a`,
      region,
      poolType,
      health: 'healthy',
      workersActive: slots,
      workerSlots: slots,
      activeTasks: 0,
      cpuUtilization: 14,
      memoryBufferUsed: 12.4,
      memoryBufferTotal: poolType === 'memory-buffered' ? 128 : 64,
      rendezvousPing: region === 'us-east' ? '1.5ms' : region === 'us-west' ? '18ms' : '76ms',
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
              <span className="material-symbols-outlined text-[18px]">dns</span>
            </div>
            <div>
              <h3 className="font-['Geist'] text-[15px] font-bold text-[#dfe2ef]">
                Provision Worker Pool Node
              </h3>
              <p className="text-[11px] font-mono text-[#87929a]">
                Commission bare-metal or cloud instance into deterministic Raft quorum
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
        <form onSubmit={handleProvision} className="p-5 flex flex-col gap-4 font-mono text-[12px]">
          <div>
            <label className="block text-[11px] text-[#87929a] mb-1 font-semibold">
              Host / Instance Identifier
            </label>
            <input
              type="text"
              required
              value={nodeName}
              onChange={(e) => setNodeName(e.target.value)}
              className="w-full bg-[#070a10] border border-[#334155] rounded-lg px-3 py-2 text-[#dfe2ef] focus:border-[#38bdf8] outline-none"
              placeholder="worker-us-east-04"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-[#87929a] mb-1 font-semibold">
                Deployment Region
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value as WorkerNode['region'])}
                className="w-full bg-[#070a10] border border-[#334155] rounded-lg px-3 py-2 text-[#dfe2ef] focus:border-[#38bdf8] outline-none"
              >
                <option value="us-east">us-east (Virginia)</option>
                <option value="us-west">us-west (Oregon)</option>
                <option value="eu-central">eu-central (Frankfurt)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-[#87929a] mb-1 font-semibold">
                Pool Workload Spec
              </label>
              <select
                value={poolType}
                onChange={(e) => setPoolType(e.target.value as WorkerNode['poolType'])}
                className="w-full bg-[#070a10] border border-[#334155] rounded-lg px-3 py-2 text-[#dfe2ef] focus:border-[#38bdf8] outline-none"
              >
                <option value="compute-intensive">Compute-Intensive (C6i)</option>
                <option value="memory-buffered">Memory-Buffered (R6g)</option>
                <option value="io-optimized">IO-Optimized (I3en)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-[#87929a] mb-1 font-semibold">
              Execution Thread Slots ({slots} slots)
            </label>
            <input
              type="range"
              min="16"
              max="128"
              step="16"
              value={slots}
              onChange={(e) => setSlots(Number(e.target.value))}
              className="w-full accent-[#38bdf8] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#87929a]">
              <span>16 slots</span>
              <span>64 slots (Standard)</span>
              <span>128 slots</span>
            </div>
          </div>

          <div className="p-3 bg-[#0c121e] border border-[#1e293b] rounded-lg text-[11px] text-[#87929a] flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-[#38bdf8]">
              bolt
            </span>
            <span>Allocates direct SR-IOV ring buffer with zero-copy socket bridge.</span>
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
              <span className="material-symbols-outlined text-[16px]">add_circle</span>
              <span>Commission Worker</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
