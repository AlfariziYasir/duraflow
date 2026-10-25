import React, { useState } from 'react';
import { WorkerNode } from '../../types';

interface NodesWorkersViewProps {
  nodes: WorkerNode[];
  onOpenProvisionModal: () => void;
  onShowToast: (title: string, description?: string, variant?: 'info' | 'success' | 'warning' | 'error') => void;
  onInspectNode: (nodeId: string) => void;
  onTerminateNode: (nodeId: string) => void;
}

export const NodesWorkersView: React.FC<NodesWorkersViewProps> = ({
  nodes,
  onOpenProvisionModal,
  onShowToast,
  onInspectNode,
  onTerminateNode,
}) => {
  const [regionFilter, setRegionFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [healthFilter, setHealthFilter] = useState<'all' | 'healthy' | 'busy' | 'draining'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Sliders state
  const [backpressure, setBackpressure] = useState(85);
  const [cooldown, setCooldown] = useState(45);
  const [maxNodes, setMaxNodes] = useState(24);

  // Policy toggles
  const [brokerless, setBrokerless] = useState(true);
  const [concurrencyFence, setConcurrencyFence] = useState(true);
  const [aggressiveDrain, setAggressiveDrain] = useState(false);

  // Maintenance mode
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);

  const toggleMaintenance = () => {
    setIsMaintenanceMode(!isMaintenanceMode);
    onShowToast(
      isMaintenanceMode ? 'Maintenance Mode CLEARED' : 'Maintenance Mode ENGAGED',
      isMaintenanceMode
        ? 'Normal cluster orchestrations resumed.'
        : 'New orchestrations paused. In-flight turns finishing gracefully.',
      isMaintenanceMode ? 'success' : 'warning'
    );
  };

  const handleRebalance = () => {
    onShowToast(
      'Cluster Rebalancing Initiated',
      'Zero-downtime shard rebalancing across 12 nodes scheduled.',
      'info'
    );
  };

  const handleApplyPolicy = () => {
    onShowToast(
      'Cluster Policy Applied',
      `Backpressure: ${backpressure}%, Cooldown: ${cooldown}s, Max: ${maxNodes} nodes. Raft committed.`,
      'success'
    );
  };

  const handleRevertDefaults = () => {
    setBackpressure(85);
    setCooldown(45);
    setMaxNodes(24);
    setBrokerless(true);
    setConcurrencyFence(true);
    setAggressiveDrain(false);
    onShowToast('Policy Defaults Restored', 'Worker pool parameters reset to defaults.', 'info');
  };

  // Filter nodes
  const filteredNodes = nodes.filter((node) => {
    if (regionFilter !== 'all' && node.region !== regionFilter) return false;
    if (typeFilter !== 'all' && node.poolType !== typeFilter) return false;
    if (healthFilter !== 'all' && node.health !== healthFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        node.name.toLowerCase().includes(q) ||
        node.ip.includes(q) ||
        node.zone.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="flex flex-col w-full pb-16">
      {/* Dynamic Atmospheric Glow & Page Header */}
      <div className="relative w-full overflow-hidden px-8 py-6 flex flex-col gap-6">
        <div className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 bg-[#38bdf8]/10 rounded-full blur-3xl"></div>
        <div className="pointer-events-none absolute top-48 right-12 w-80 h-80 bg-[#3131c0]/15 rounded-full blur-3xl"></div>

        {/* Page Header & Action Bar */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-['Geist'] text-[24px] font-bold text-[#dfe2ef] tracking-tight">
                Cluster Infrastructure &amp; Worker Pools
              </h1>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1c1f29] border border-[#1e293b]">
                <span className="w-2 h-2 rounded-full bg-[#38bdf8] animate-pulse"></span>
                <span className="text-[11px] font-mono text-[#8ed5ff]">
                  12 Nodes Online • 640/720 Workers Active
                </span>
              </div>
            </div>
            <p className="text-[12px] font-mono text-[#87929a]">
              Multi-region deterministic execution runtime. Monotonic consensus fence:{' '}
              <span className="text-[#dfe2ef] font-semibold">term_epoch_v4#82910</span>
            </p>
          </div>

          {/* Action Cluster */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={toggleMaintenance}
              className={`px-3.5 py-1.5 rounded-lg border text-[13px] font-['Geist'] font-medium transition-all flex items-center gap-2 cursor-pointer shadow-sm ${
                isMaintenanceMode
                  ? 'bg-[#f59e0b] text-[#001e2c] border-[#f59e0b]'
                  : 'bg-[#262a34] text-[#dfe2ef] hover:bg-[#31353f] border-[#3e484f]'
              }`}
            >
              <span
                className={`material-symbols-outlined text-[16px] ${
                  isMaintenanceMode ? 'text-[#001e2c]' : 'text-[#ffc174]'
                }`}
              >
                pause_circle
              </span>
              <span>{isMaintenanceMode ? 'Exit Maintenance' : 'Maintenance Mode'}</span>
            </button>

            <button
              onClick={handleRebalance}
              className="px-3.5 py-1.5 rounded-lg bg-[#262a34] text-[#dfe2ef] hover:bg-[#31353f] border border-[#3e484f] font-['Geist'] text-[13px] font-medium shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-[#38bdf8]">sync_alt</span>
              <span>Rebalance Cluster</span>
            </button>

            <button
              onClick={onOpenProvisionModal}
              className="px-4 py-1.5 rounded-lg bg-[#38bdf8] text-[#001e2c] font-['Geist'] text-[13px] font-bold shadow-md hover:bg-[#7bd0ff] transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add_circle</span>
              <span>+ Provision Worker Pool</span>
            </button>
          </div>
        </header>

        {/* Global Fleet Telemetry Metrics Bento */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
          {/* CPU Metric */}
          <div className="p-4 rounded-xl bg-[#181b25] border border-[#1e293b] shadow-sm flex flex-col justify-between relative overflow-hidden group">
            <div className="flex items-center justify-between text-[#87929a]">
              <span className="text-[11px] font-mono uppercase tracking-wider">
                Aggregate CPU Load
              </span>
              <span className="material-symbols-outlined text-[18px] text-[#38bdf8]">memory</span>
            </div>
            <div className="my-2 flex items-baseline gap-1.5">
              <span className="text-[28px] font-mono font-bold text-[#dfe2ef]">64.2%</span>
              <span className="text-[11px] font-mono text-[#87929a]">/ 96 Cores</span>
            </div>
            <div>
              <div className="w-full h-1.5 bg-[#31353f] rounded-full overflow-hidden">
                <div className="h-full bg-[#38bdf8] rounded-full" style={{ width: '64.2%' }}></div>
              </div>
              <div className="mt-1.5 flex justify-between text-[#87929a] text-[10px] font-mono">
                <span>Dynamic throttle: 85%</span>
                <span className="text-[#38bdf8]">Nominal</span>
              </div>
            </div>
          </div>

          {/* Memory Metric */}
          <div className="p-4 rounded-xl bg-[#181b25] border border-[#1e293b] shadow-sm flex flex-col justify-between relative overflow-hidden group">
            <div className="flex items-center justify-between text-[#87929a]">
              <span className="text-[11px] font-mono uppercase tracking-wider">
                Aggregate Memory
              </span>
              <span className="material-symbols-outlined text-[18px] text-[#c0c1ff]">storage</span>
            </div>
            <div className="my-2 flex items-baseline gap-1.5">
              <span className="text-[28px] font-mono font-bold text-[#dfe2ef]">182.4 GB</span>
              <span className="text-[11px] font-mono text-[#87929a]">/ 256 GB (71%)</span>
            </div>
            <div>
              <div className="w-full h-1.5 bg-[#31353f] rounded-full overflow-hidden">
                <div className="h-full bg-[#c0c1ff] rounded-full" style={{ width: '71.25%' }}></div>
              </div>
              <div className="mt-1.5 flex justify-between text-[#87929a] text-[10px] font-mono">
                <span>Free buffer: 73.6 GB</span>
                <span className="text-[#c0c1ff]">Slab Cache OK</span>
              </div>
            </div>
          </div>

          {/* Network I/O Metric */}
          <div className="p-4 rounded-xl bg-[#181b25] border border-[#1e293b] shadow-sm flex flex-col justify-between relative overflow-hidden group">
            <div className="flex items-center justify-between text-[#87929a]">
              <span className="text-[11px] font-mono uppercase tracking-wider">
                Network Throughput
              </span>
              <span className="material-symbols-outlined text-[18px] text-[#38bdf8]">
                swap_vert
              </span>
            </div>
            <div className="my-2 flex items-baseline justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-mono text-[#87929a]">Ingress ↓</span>
                <span className="text-[22px] font-mono font-bold text-[#dfe2ef]">
                  4.8 <span className="text-[11px] text-[#87929a] font-normal">Gbps</span>
                </span>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-[10px] font-mono text-[#87929a]">Egress ↑</span>
                <span className="text-[22px] font-mono font-bold text-[#7bd0ff]">
                  3.2 <span className="text-[11px] text-[#87929a] font-normal">Gbps</span>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[#87929a] text-[10px] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]"></span>
              <span>SR-IOV Direct Ring Buffer active</span>
            </div>
          </div>

          {/* Distributed Locks / Mutexes */}
          <div className="p-4 rounded-xl bg-[#181b25] border border-[#1e293b] shadow-sm flex flex-col justify-between relative overflow-hidden group">
            <div className="flex items-center justify-between text-[#87929a]">
              <span className="text-[11px] font-mono uppercase tracking-wider">
                Consensus Leases
              </span>
              <span className="material-symbols-outlined text-[18px] text-[#ffc174]">lock</span>
            </div>
            <div className="my-2 flex items-baseline gap-1.5">
              <span className="text-[28px] font-mono font-bold text-[#dfe2ef]">1,842</span>
              <span className="text-[11px] font-mono text-[#ffc174]">Distributed Mutexes</span>
            </div>
            <div className="flex items-center justify-between text-[#87929a] text-[10px] font-mono">
              <span className="text-[#dfe2ef]">Raft Quorum: 5/5 synced</span>
              <span className="text-[#ffc174]">0 Stale Fences</span>
            </div>
          </div>
        </section>

        {/* Interactive Filter & Grouping Control Bar */}
        <section className="p-2.5 bg-[#181b25] rounded-xl border border-[#1e293b] shadow-sm flex flex-wrap items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Region Dropdown */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1c1f29] border border-[#1e293b] text-[#dfe2ef] text-[11px] font-mono">
              <span className="material-symbols-outlined text-[15px] text-[#87929a]">public</span>
              <span className="text-[#87929a]">Region:</span>
              <select
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                className="bg-transparent text-[#dfe2ef] border-none outline-none cursor-pointer"
              >
                <option value="all" className="bg-[#1c1f29] text-[#dfe2ef]">
                  All Regions (3)
                </option>
                <option value="us-east" className="bg-[#1c1f29] text-[#dfe2ef]">
                  us-east (Virginia)
                </option>
                <option value="us-west" className="bg-[#1c1f29] text-[#dfe2ef]">
                  us-west (Oregon)
                </option>
                <option value="eu-central" className="bg-[#1c1f29] text-[#dfe2ef]">
                  eu-central (Frankfurt)
                </option>
              </select>
            </div>

            {/* Worker Pool Type */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1c1f29] border border-[#1e293b] text-[#dfe2ef] text-[11px] font-mono">
              <span className="material-symbols-outlined text-[15px] text-[#87929a]">tune</span>
              <span className="text-[#87929a]">Pool Type:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-transparent text-[#dfe2ef] border-none outline-none cursor-pointer"
              >
                <option value="all" className="bg-[#1c1f29] text-[#dfe2ef]">
                  All Pool Types
                </option>
                <option value="compute-intensive" className="bg-[#1c1f29] text-[#dfe2ef]">
                  Compute-Intensive (C6i)
                </option>
                <option value="memory-buffered" className="bg-[#1c1f29] text-[#dfe2ef]">
                  Memory-Buffered (R6g)
                </option>
                <option value="io-optimized" className="bg-[#1c1f29] text-[#dfe2ef]">
                  IO-Optimized (I3en)
                </option>
              </select>
            </div>

            {/* Health State Tabs */}
            <div className="flex items-center gap-1 bg-[#0a0e17] p-1 rounded-lg border border-[#1e293b]">
              <button
                onClick={() => setHealthFilter('all')}
                className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                  healthFilter === 'all'
                    ? 'bg-[#262a34] text-[#38bdf8] font-bold'
                    : 'text-[#bdc8d1] hover:text-[#dfe2ef]'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setHealthFilter('healthy')}
                className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                  healthFilter === 'healthy'
                    ? 'bg-[#262a34] text-[#10b981] font-bold'
                    : 'text-[#bdc8d1] hover:text-[#dfe2ef]'
                }`}
              >
                Healthy (4)
              </button>
              <button
                onClick={() => setHealthFilter('busy')}
                className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                  healthFilter === 'busy'
                    ? 'bg-[#262a34] text-[#ffc174] font-bold'
                    : 'text-[#bdc8d1] hover:text-[#dfe2ef]'
                }`}
              >
                High Load (1)
              </button>
              <button
                onClick={() => setHealthFilter('draining')}
                className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                  healthFilter === 'draining'
                    ? 'bg-[#262a34] text-[#ffb4ab] font-bold'
                    : 'text-[#bdc8d1] hover:text-[#dfe2ef]'
                }`}
              >
                Draining (1)
              </button>
            </div>
          </div>

          {/* Quick Node Search & View Mode */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0a0e17] border border-[#1e293b] text-[#87929a]">
              <span className="material-symbols-outlined text-[15px]">filter_list</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter node ID, IP..."
                className="bg-transparent text-[#dfe2ef] placeholder:text-[#87929a] text-[11px] font-mono outline-none w-36"
              />
            </div>

            <div className="flex items-center rounded-lg bg-[#0a0e17] p-0.5 border border-[#1e293b]">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-2 py-1 rounded text-[11px] font-mono cursor-pointer ${
                  viewMode === 'grid' ? 'bg-[#262a34] text-[#38bdf8]' : 'text-[#87929a]'
                }`}
                title="Grid View"
              >
                <span className="material-symbols-outlined text-[16px]">grid_view</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-2 py-1 rounded text-[11px] font-mono cursor-pointer ${
                  viewMode === 'list' ? 'bg-[#262a34] text-[#38bdf8]' : 'text-[#87929a]'
                }`}
                title="List View"
              >
                <span className="material-symbols-outlined text-[16px]">view_agenda</span>
              </button>
            </div>
          </div>
        </section>

        {/* Worker Node Telemetry Grid Cards */}
        <section
          className={`relative z-10 ${
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
              : 'flex flex-col gap-3'
          }`}
        >
          {filteredNodes.length === 0 ? (
            <div className="col-span-3 p-12 text-center text-[#87929a] font-mono text-[13px] bg-[#181b25] rounded-xl border border-[#1e293b]">
              No worker nodes match the selected filters.
            </div>
          ) : (
            filteredNodes.map((node) => {
              const isHealthy = node.health === 'healthy';
              const isBusy = node.health === 'busy';
              const isIdle = node.health === 'idle';
              const isDraining = node.health === 'draining';

              return (
                <article
                  key={node.id}
                  className={`p-4 rounded-xl border shadow-sm flex flex-col justify-between transition-all hover:border-[#38bdf8]/40 ${
                    isDraining
                      ? 'bg-[#181b25]/70 border-[#1e293b] opacity-80 hover:opacity-100'
                      : isBusy
                      ? 'bg-[#181b25] border-[#f59e0b]/40 hover:bg-[#1c1f29]'
                      : 'bg-[#181b25] border-[#1e293b] hover:bg-[#1c1f29]'
                  }`}
                >
                  <div className="flex flex-col gap-2.5">
                    {/* Header: Name, Role, IP, Health pill */}
                    <div className="flex items-start justify-between">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-['Geist'] text-[14px] font-bold ${
                              isDraining ? 'text-[#bdc8d1] line-through' : 'text-[#dfe2ef]'
                            }`}
                          >
                            {node.name}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                              node.role === 'Primary Leader'
                                ? 'bg-[#38bdf8]/20 text-[#38bdf8] font-bold border border-[#38bdf8]/30'
                                : node.role === 'Decommissioning'
                                ? 'bg-[#93000a] text-[#ffdad6]'
                                : 'bg-[#262a34] text-[#87929a]'
                            }`}
                          >
                            {node.role}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-[#87929a]">
                          {node.ip} • {node.zone}
                        </span>
                      </div>

                      {/* Status pill */}
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#262a34] border border-[#1e293b]">
                        {isHealthy && (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>
                            <span className="text-[10px] font-mono text-[#10b981]">Healthy</span>
                          </>
                        )}
                        {isBusy && (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-[#ffc174] animate-ping"></span>
                            <span className="text-[10px] font-mono text-[#ffc174] font-bold">
                              High Load
                            </span>
                          </>
                        )}
                        {isIdle && (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]"></span>
                            <span className="text-[10px] font-mono text-[#38bdf8]">Idle</span>
                          </>
                        )}
                        {isDraining && (
                          <>
                            <span className="material-symbols-outlined text-[13px] text-[#ffc174]">
                              hourglass_empty
                            </span>
                            <span className="text-[10px] font-mono text-[#ffc174]">Draining</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Specs Matrix */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="flex flex-col p-2 rounded bg-[#0a0e17] border border-[#1e293b]">
                        <span className="text-[9px] font-mono text-[#87929a] uppercase">
                          Workers Active
                        </span>
                        <span className="text-[12px] font-mono font-bold text-[#dfe2ef]">
                          {node.workersActive}{' '}
                          <span className="text-[#87929a] font-normal">
                            / {node.workerSlots} slots
                          </span>
                        </span>
                      </div>
                      <div className="flex flex-col p-2 rounded bg-[#0a0e17] border border-[#1e293b]">
                        <span className="text-[9px] font-mono text-[#87929a] uppercase">
                          Active Tasks
                        </span>
                        <span
                          className={`text-[12px] font-mono font-bold ${
                            isBusy ? 'text-[#ffc174]' : isDraining ? 'text-[#87929a]' : 'text-[#38bdf8]'
                          }`}
                        >
                          {node.activeTasks} running
                        </span>
                      </div>
                    </div>

                    {/* Progress Bars */}
                    <div className="flex flex-col gap-2 pt-1 font-mono text-[10px]">
                      <div>
                        <div className="flex justify-between items-center">
                          <span className="text-[#87929a]">
                            CPU Utilization {isBusy && '(Saturated)'}
                          </span>
                          <span
                            className={
                              isBusy ? 'text-[#ffc174] font-bold' : 'text-[#dfe2ef]'
                            }
                          >
                            {node.cpuUtilization}%
                          </span>
                        </div>
                        <div className="w-full h-1 bg-[#31353f] rounded-full overflow-hidden mt-1">
                          <div
                            className={`h-full rounded-full ${
                              isBusy
                                ? 'bg-[#ffc174]'
                                : isDraining
                                ? 'bg-[#ffc174]'
                                : 'bg-[#38bdf8]'
                            }`}
                            style={{ width: `${node.cpuUtilization}%` }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center">
                          <span className="text-[#87929a]">
                            {isDraining ? 'Graceful Drain Window' : 'Memory Buffer'}
                          </span>
                          <span className={isDraining ? 'text-[#ffc174]' : 'text-[#dfe2ef]'}>
                            {isDraining
                              ? node.drainRemaining
                              : `${node.memoryBufferUsed} GB / ${node.memoryBufferTotal} GB`}
                          </span>
                        </div>
                        <div className="w-full h-1 bg-[#31353f] rounded-full overflow-hidden mt-1">
                          <div
                            className={`h-full rounded-full ${
                              isDraining ? 'bg-[#ffc174]' : 'bg-[#c0c1ff]'
                            }`}
                            style={{
                              width: isDraining
                                ? '75%'
                                : `${(node.memoryBufferUsed / node.memoryBufferTotal) * 100}%`,
                            }}
                          ></div>
                        </div>
                        {isDraining && node.drainReason && (
                          <span className="text-[#87929a] text-[10px] block mt-1">
                            Reason: {node.drainReason}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Footer Ping & Quick Action */}
                  <div className="mt-4 pt-2.5 border-t border-[#1e293b] flex items-center justify-between text-[#87929a] text-[10px] font-mono">
                    <div className="flex items-center gap-1">
                      <span
                        className={`material-symbols-outlined text-[13px] ${
                          isBusy
                            ? 'text-[#ffc174]'
                            : isDraining
                            ? 'text-[#ffb4ab]'
                            : 'text-[#38bdf8]'
                        }`}
                      >
                        {isDraining ? 'block' : 'bolt'}
                      </span>
                      <span>
                        {isDraining ? (
                          'No new tasks dispatched'
                        ) : (
                          <>
                            Rendezvous Ping:{' '}
                            <strong className="text-[#dfe2ef] font-normal">
                              {node.rendezvousPing}
                            </strong>
                          </>
                        )}
                      </span>
                    </div>

                    {isDraining ? (
                      <button
                        onClick={() => onTerminateNode(node.id)}
                        className="text-[#ffb4ab] hover:underline text-[11px] flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>Force Terminate</span>
                        <span className="material-symbols-outlined text-[12px]">
                          delete_forever
                        </span>
                      </button>
                    ) : isBusy ? (
                      <button
                        onClick={() => {
                          onShowToast('Queue Re-routed', `Draining burst queue from ${node.name} to worker-east-02`, 'warning');
                        }}
                        className="text-[#38bdf8] hover:underline text-[11px] flex items-center gap-0.5 cursor-pointer font-bold"
                      >
                        <span>Re-route Queue</span>
                        <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onInspectNode(node.id)}
                        className="text-[#38bdf8] hover:underline text-[11px] flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>Inspect</span>
                        <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                      </button>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </section>

        {/* Bottom Panel: Worker Pool Configuration & Auto-scaling Policy Drawer */}
        <section className="p-6 rounded-xl bg-[#181b25] border border-[#1e293b] shadow-sm flex flex-col gap-6 relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#38bdf8] text-[20px]">
                  auto_mode
                </span>
                <span className="font-['Geist'] text-[18px] font-bold text-[#dfe2ef]">
                  Worker Pool Auto-Scaling &amp; Backpressure Policy
                </span>
              </div>
              <p className="text-[11px] font-mono text-[#87929a]">
                Configure dynamic worker allocation, backpressure dampeners, and min-heap timer leases for sub-millisecond execution dispatch.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRevertDefaults}
                className="px-3.5 py-1.5 rounded-lg bg-[#262a34] text-[#dfe2ef] hover:bg-[#31353f] border border-[#3e484f] text-[11px] font-mono cursor-pointer"
              >
                Revert Defaults
              </button>
              <button
                onClick={handleApplyPolicy}
                className="px-4 py-1.5 rounded-lg bg-[#38bdf8] text-[#001e2c] hover:bg-[#7bd0ff] text-[12px] font-['Geist'] font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px]">save</span>
                <span>Apply Cluster Policy</span>
              </button>
            </div>
          </div>

          {/* Settings Grid & Sliders */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-mono">
            {/* Setting 1: Backpressure Saturation Trigger */}
            <div className="p-4 rounded-xl bg-[#1c1f29] border border-[#1e293b] flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-['Geist'] text-[13px] font-semibold text-[#dfe2ef]">
                  Queue Backpressure Saturation
                </span>
                <span className="text-[12px] text-[#38bdf8] font-bold">{backpressure}%</span>
              </div>
              <p className="text-[10px] text-[#87929a]">
                Spills incoming tasks to secondary raft partitions when worker mailbox exceeds watermark.
              </p>
              <input
                type="range"
                min="50"
                max="98"
                value={backpressure}
                onChange={(e) => setBackpressure(Number(e.target.value))}
                className="w-full accent-[#38bdf8] cursor-pointer mt-1"
              />
              <div className="flex justify-between text-[10px] text-[#87929a]">
                <span>50% (Conservative)</span>
                <span>98% (Aggressive)</span>
              </div>
            </div>

            {/* Setting 2: Scale-Out Velocity Threshold */}
            <div className="p-4 rounded-xl bg-[#1c1f29] border border-[#1e293b] flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-['Geist'] text-[13px] font-semibold text-[#dfe2ef]">
                  Scale-Out Cooldown Delay
                </span>
                <span className="text-[12px] text-[#c0c1ff] font-bold">{cooldown}s</span>
              </div>
              <p className="text-[10px] text-[#87929a]">
                Dampens node provisioning oscillations during bursty burst orchestrations.
              </p>
              <input
                type="range"
                min="10"
                max="180"
                step="5"
                value={cooldown}
                onChange={(e) => setCooldown(Number(e.target.value))}
                className="w-full accent-[#c0c1ff] cursor-pointer mt-1"
              />
              <div className="flex justify-between text-[10px] text-[#87929a]">
                <span>10s</span>
                <span>180s</span>
              </div>
            </div>

            {/* Setting 3: Max Worker Nodes Ceiling */}
            <div className="p-4 rounded-xl bg-[#1c1f29] border border-[#1e293b] flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-['Geist'] text-[13px] font-semibold text-[#dfe2ef]">
                  Fleet Maximum Ceiling
                </span>
                <span className="text-[12px] text-[#ffc174] font-bold">{maxNodes} Nodes</span>
              </div>
              <p className="text-[10px] text-[#87929a]">
                Strict consensus boundary on dynamic worker auto-scale horizontally.
              </p>
              <input
                type="range"
                min="12"
                max="64"
                value={maxNodes}
                onChange={(e) => setMaxNodes(Number(e.target.value))}
                className="w-full accent-[#ffc174] cursor-pointer mt-1"
              />
              <div className="flex justify-between text-[10px] text-[#87929a]">
                <span>12 (Current floor)</span>
                <span>64 (Max capacity)</span>
              </div>
            </div>
          </div>

          {/* Policy Toggles Row */}
          <div className="p-3 bg-[#1c1f29] border border-[#1e293b] rounded-xl flex flex-wrap items-center justify-between gap-4 font-mono">
            <div className="flex items-center gap-6 flex-wrap">
              {/* Toggle 1 */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={brokerless}
                  onChange={(e) => setBrokerless(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#38bdf8] cursor-pointer"
                />
                <div className="flex flex-col">
                  <span className="text-[12px] text-[#dfe2ef]">Brokerless Rendezvous Matching</span>
                  <span className="text-[10px] text-[#87929a]">
                    Bypasses message broker for local socket dispatch
                  </span>
                </div>
              </label>

              {/* Toggle 2 */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={concurrencyFence}
                  onChange={(e) => setConcurrencyFence(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#38bdf8] cursor-pointer"
                />
                <div className="flex flex-col">
                  <span className="text-[12px] text-[#dfe2ef]">Optimistic Concurrency Fence</span>
                  <span className="text-[10px] text-[#87929a]">
                    Aborts conflicting workflow turns instantly
                  </span>
                </div>
              </label>

              {/* Toggle 3 */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={aggressiveDrain}
                  onChange={(e) => setAggressiveDrain(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#38bdf8] cursor-pointer"
                />
                <div className="flex flex-col">
                  <span className="text-[12px] text-[#dfe2ef]">Aggressive Drain Eviction</span>
                  <span className="text-[10px] text-[#87929a]">
                    Instantly terminate in-flight workflows on drain
                  </span>
                </div>
              </label>
            </div>

            <div className="flex items-center gap-1.5 text-[#87929a] text-[11px]">
              <span className="material-symbols-outlined text-[16px] text-[#10b981]">
                verified_user
              </span>
              <span>Verified Raft state commit #77312</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
