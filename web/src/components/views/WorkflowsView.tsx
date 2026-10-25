import React, { useState } from 'react';
import { WorkflowItem } from '../../types';

interface WorkflowsViewProps {
  workflows: WorkflowItem[];
  onInspectWorkflow: (workflowId: string) => void;
  onNewWorkflow: () => void;
  onTriggerManual: () => void;
  onExportMetrics: () => void;
  onFilterByTag: () => void;
  onOpenAuditTrace: () => void;
  onTogglePauseWorkflow: (id: string) => void;
  onTerminateWorkflow: (id: string) => void;
  onReplayWorkflow: (id: string) => void;
  onDebugWorkflow: (id: string) => void;
}

export const WorkflowsView: React.FC<WorkflowsViewProps> = ({
  workflows,
  onInspectWorkflow,
  onNewWorkflow,
  onTriggerManual,
  onExportMetrics,
  onFilterByTag,
  onOpenAuditTrace,
  onTogglePauseWorkflow,
  onTerminateWorkflow,
  onReplayWorkflow,
  onDebugWorkflow,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'failed' | 'running' | 'scheduled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [frequencyFilter, setFrequencyFilter] = useState('ALL');
  const [durationFilter, setDurationFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  // Compute counts
  const countFailed = workflows.filter((w) => w.state === 'RETRYING' || w.state === 'FAILED').length;
  const countRunning = workflows.filter((w) => w.state === 'RUNNING').length;
  const countScheduled = workflows.filter((w) => w.state === 'SCHEDULED').length;

  // Filter workflows
  const filteredWorkflows = workflows.filter((w) => {
    // Tab filter
    if (activeTab === 'failed' && !(w.state === 'RETRYING' || w.state === 'FAILED')) return false;
    if (activeTab === 'running' && w.state !== 'RUNNING') return false;
    if (activeTab === 'scheduled' && w.state !== 'SCHEDULED') return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        w.name.toLowerCase().includes(q) ||
        w.id.toLowerCase().includes(q) ||
        w.initiator.toLowerCase().includes(q) ||
        w.stepFlow.toLowerCase().includes(q);
      if (!match) return false;
    }

    // Status filter dropdown
    if (statusFilter !== 'ALL' && w.state !== statusFilter) return false;

    return true;
  });

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setFrequencyFilter('ALL');
    setDurationFilter('ALL');
    setActiveTab('all');
  };

  return (
    <div className="flex flex-col w-full pb-12">
      {/* Command Header & Breadcrumb Bar */}
      <div className="px-6 py-4 bg-[#0a0e17] border-b border-[#1e293b] flex flex-col gap-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 text-[#bdc8d1] text-[11px] font-mono">
              <span>Clusters</span>
              <span className="material-symbols-outlined text-[13px] text-[#87929a]">
                chevron_right
              </span>
              <span className="text-[#8ed5ff]">us-east-primary</span>
              <span className="material-symbols-outlined text-[13px] text-[#87929a]">
                chevron_right
              </span>
              <span className="text-[#dfe2ef] font-semibold">Workflows</span>
            </div>
            <div className="flex items-baseline gap-3 mt-1">
              <h1 className="font-['Geist'] text-[24px] font-bold text-[#dfe2ef] tracking-tight">
                Workflows & Orchestrations
              </h1>
              <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 bg-[#1c1f29] text-[#8ed5ff] rounded border border-[#3e484f]/40">
                Cluster v1.4-durable
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onFilterByTag}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1c1f29] text-[#dfe2ef] hover:bg-[#262a34] border border-[#1e293b] transition-colors font-['Geist'] text-[13px] font-medium shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-[#8ed5ff]">
                filter_alt
              </span>
              <span>Filter by Tag</span>
            </button>
            <button
              onClick={onExportMetrics}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1c1f29] text-[#dfe2ef] hover:bg-[#262a34] border border-[#1e293b] transition-colors font-['Geist'] text-[13px] font-medium shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-[#87929a]">
                file_download
              </span>
              <span>Export Metrics</span>
            </button>
            <button
              onClick={onTriggerManual}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#262a34] text-[#dfe2ef] hover:bg-[#31353f] border border-[#3e484f] transition-colors font-['Geist'] text-[13px] font-medium shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-[#38bdf8]">
                play_arrow
              </span>
              <span>Trigger Manual Run</span>
            </button>
            <button
              onClick={onNewWorkflow}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#38bdf8] text-[#001e2c] hover:bg-[#7bd0ff] transition-all font-['Geist'] text-[13px] font-bold shadow-md cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>New Workflow</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cluster Vital Metrics Bar (4 Stat Cards) */}
      <div className="px-6 py-4 bg-[#0a0e17] border-b border-[#1e293b] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Active Executions */}
        <div className="p-4 rounded-xl bg-[#181b25] border border-[#1e293b] flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="font-['Geist'] text-[14px] text-[#bdc8d1] font-medium">
                Active Executions
              </span>
              <span className="text-[10px] font-mono text-[#87929a] uppercase">
                Fenced Monotonic IDs
              </span>
            </div>
            <span className="px-1.5 py-0.5 rounded bg-[#38bdf8]/10 text-[#38bdf8] text-[11px] font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] animate-pulse"></span>
              +12% peak
            </span>
          </div>
          <div className="flex items-end justify-between mt-3">
            <div className="flex flex-col">
              <span className="text-[28px] font-mono font-bold text-[#dfe2ef] tracking-tight leading-none">
                1,428
              </span>
              <span className="text-[11px] font-mono text-[#38bdf8] mt-1">
                In-flight deterministic turns
              </span>
            </div>
            {/* Sparkline Cyan */}
            <div className="w-24 h-9">
              <svg className="w-full h-full stroke-[#38bdf8] fill-none overflow-visible" viewBox="0 0 96 36">
                <defs>
                  <linearGradient id="cyanGlow" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3"></stop>
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="0"></stop>
                  </linearGradient>
                </defs>
                <path d="M0,28 L14,24 L28,30 L42,16 L56,20 L70,8 L84,12 L96,4" fill="url(#cyanGlow)" strokeWidth="0"></path>
                <path d="M0,28 L14,24 L28,30 L42,16 L56,20 L70,8 L84,12 L96,4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
            </div>
          </div>
        </div>

        {/* Stat 2: Failure Rate SLO */}
        <div className="p-4 rounded-xl bg-[#181b25] border border-[#1e293b] flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="font-['Geist'] text-[14px] text-[#bdc8d1] font-medium">
                Failure Rate (SLO)
              </span>
              <span className="text-[10px] font-mono text-[#87929a] uppercase">
                Rolling 24h Window
              </span>
            </div>
            <span className="px-1.5 py-0.5 rounded bg-[#10b981]/15 text-[#10b981] text-[11px] font-mono flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">verified</span>
              Target &lt; 0.05%
            </span>
          </div>
          <div className="flex items-end justify-between mt-3">
            <div className="flex flex-col">
              <span className="text-[28px] font-mono font-bold text-[#dfe2ef] tracking-tight leading-none">
                0.014%
              </span>
              <span className="text-[11px] font-mono text-[#10b981] mt-1">
                Healthy • 99.986% atomic pass
              </span>
            </div>
            <div className="w-20 flex flex-col gap-1 items-end">
              <span className="text-[10px] font-mono text-[#87929a]">SLO Burn: 0.02x</span>
              <div className="w-full bg-[#31353f] rounded-full h-1.5 overflow-hidden">
                <div className="bg-[#10b981] h-1.5 rounded-full" style={{ width: '14%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Stat 3: Avg Task Latency */}
        <div className="p-4 rounded-xl bg-[#181b25] border border-[#1e293b] flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="font-['Geist'] text-[14px] text-[#bdc8d1] font-medium">
                Avg Task Latency
              </span>
              <span className="text-[10px] font-mono text-[#87929a] uppercase">
                Dispatch-to-Ack
              </span>
            </div>
            <span className="px-1.5 py-0.5 rounded bg-[#262a34] text-[#bdc8d1] text-[11px] font-mono">
              p95 percentile
            </span>
          </div>
          <div className="flex items-end justify-between mt-3">
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1">
                <span className="text-[28px] font-mono font-bold text-[#dfe2ef] tracking-tight leading-none">
                  42
                </span>
                <span className="text-[13px] font-mono text-[#87929a]">ms</span>
              </div>
              <span className="text-[11px] font-mono text-[#bdc8d1] mt-1">
                Across 64 worker pools
              </span>
            </div>
            <div className="flex items-center gap-1 text-[#38bdf8]">
              <span className="material-symbols-outlined text-[16px]">speed</span>
              <span className="text-[11px] font-mono">Sub-50ms floor</span>
            </div>
          </div>
        </div>

        {/* Stat 4: Node Capacity */}
        <div className="p-4 rounded-xl bg-[#181b25] border border-[#1e293b] flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="font-['Geist'] text-[14px] text-[#bdc8d1] font-medium">
                Node Capacity
              </span>
              <span className="text-[10px] font-mono text-[#87929a] uppercase">
                Core Allocation
              </span>
            </div>
            <span className="px-1.5 py-0.5 rounded bg-[#262a34] text-[#dfe2ef] text-[11px] font-mono">
              512 / 680 cores
            </span>
          </div>
          <div className="flex items-end justify-between mt-3">
            <div className="flex flex-col">
              <span className="text-[28px] font-mono font-bold text-[#dfe2ef] tracking-tight leading-none">
                74%
              </span>
              <span className="text-[11px] font-mono text-[#bdc8d1] mt-1">
                Worker mesh headroom: 26%
              </span>
            </div>
            <div className="w-24 flex flex-col gap-1 items-end">
              <div className="w-full bg-[#31353f] rounded-full h-1.5 overflow-hidden">
                <div className="bg-[#38bdf8] h-1.5 rounded-full" style={{ width: '74%' }}></div>
              </div>
              <span className="text-[10px] font-mono text-[#38bdf8]">Optimistic Sync</span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Workspace: Split Layout (Main Table + Telemetry Drawer) */}
      <div className="p-6 flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Main Content Column */}
        <div className="flex-1 w-full flex flex-col gap-4 min-w-0">
          {/* Subnavigation Tabs */}
          <div className="flex items-center justify-between bg-[#0a0e17] p-1 rounded-xl border border-[#1e293b] shadow-sm">
            <div className="flex items-center gap-1 overflow-x-auto">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-lg font-mono text-[13px] flex items-center gap-2 transition-colors cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-[#262a34] text-[#38bdf8] font-semibold shadow-sm'
                    : 'text-[#bdc8d1] hover:text-[#dfe2ef] hover:bg-[#181b25]'
                }`}
              >
                <span>All Workflows</span>
                <span className="px-1.5 py-0.5 bg-[#38bdf8]/20 text-[#38bdf8] rounded-full text-[10px] font-bold">
                  {workflows.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('failed')}
                className={`px-3 py-1.5 rounded-lg font-mono text-[13px] flex items-center gap-2 transition-colors cursor-pointer ${
                  activeTab === 'failed'
                    ? 'bg-[#262a34] text-[#ffb4ab] font-semibold shadow-sm'
                    : 'text-[#bdc8d1] hover:text-[#dfe2ef] hover:bg-[#181b25]'
                }`}
              >
                <span>Failed / At Risk</span>
                <span className="px-1.5 py-0.5 bg-[#93000a] text-[#ffdad6] rounded-full text-[10px] font-bold">
                  {countFailed}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('running')}
                className={`px-3 py-1.5 rounded-lg font-mono text-[13px] flex items-center gap-2 transition-colors cursor-pointer ${
                  activeTab === 'running'
                    ? 'bg-[#262a34] text-[#38bdf8] font-semibold shadow-sm'
                    : 'text-[#bdc8d1] hover:text-[#dfe2ef] hover:bg-[#181b25]'
                }`}
              >
                <span>Running Now</span>
                <span className="px-1.5 py-0.5 bg-[#1c1f29] text-[#38bdf8] text-[10px] font-bold rounded-full">
                  {countRunning}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('scheduled')}
                className={`px-3 py-1.5 rounded-lg font-mono text-[13px] flex items-center gap-2 transition-colors cursor-pointer ${
                  activeTab === 'scheduled'
                    ? 'bg-[#262a34] text-[#dfe2ef] font-semibold shadow-sm'
                    : 'text-[#bdc8d1] hover:text-[#dfe2ef] hover:bg-[#181b25]'
                }`}
              >
                <span>Scheduled / Cron</span>
                <span className="px-1.5 py-0.5 bg-[#1c1f29] text-[#87929a] text-[10px] font-bold rounded-full">
                  {countScheduled}
                </span>
              </button>
            </div>
            <div className="flex items-center gap-1.5 text-[#87929a] text-[11px] font-mono px-3">
              <span className="material-symbols-outlined text-[15px] animate-spin text-[#38bdf8]">
                sync
              </span>
              <span>Live Polling: 1s</span>
            </div>
          </div>

          {/* Search & Multi-Filter Panel */}
          <div className="p-3 bg-[#181b25] rounded-xl border border-[#1e293b] shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-[#87929a] text-[18px]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by pipeline name, ID, or trigger..."
                className="w-full pl-9 pr-3 py-1.5 bg-[#0a0e17] text-[#dfe2ef] text-[12px] font-mono rounded-lg border border-[#1e293b] outline-none focus:border-[#38bdf8] transition-all placeholder:text-[#87929a]/70"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
              {/* Status filter */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none bg-[#1c1f29] border border-[#1e293b] text-[#dfe2ef] text-[11px] font-mono rounded px-3 py-1.5 pr-7 cursor-pointer hover:bg-[#262a34] outline-none"
                >
                  <option value="ALL">Status: Any Runtime State</option>
                  <option value="RUNNING">Status: RUNNING</option>
                  <option value="COMPLETED">Status: COMPLETED</option>
                  <option value="RETRYING">Status: RETRYING</option>
                  <option value="SCHEDULED">Status: SCHEDULED</option>
                </select>
                <span className="material-symbols-outlined text-[14px] text-[#87929a] absolute right-2 top-2 pointer-events-none">
                  arrow_drop_down
                </span>
              </div>

              {/* Frequency filter */}
              <div className="relative">
                <select
                  value={frequencyFilter}
                  onChange={(e) => setFrequencyFilter(e.target.value)}
                  className="appearance-none bg-[#1c1f29] border border-[#1e293b] text-[#dfe2ef] text-[11px] font-mono rounded px-3 py-1.5 pr-7 cursor-pointer hover:bg-[#262a34] outline-none"
                >
                  <option value="ALL">Frequency: Continuous / Realtime</option>
                  <option value="CRON">Frequency: Cron Scheduled</option>
                  <option value="EVENT">Frequency: Webhook Event Ingress</option>
                </select>
                <span className="material-symbols-outlined text-[14px] text-[#87929a] absolute right-2 top-2 pointer-events-none">
                  arrow_drop_down
                </span>
              </div>

              {/* Duration filter */}
              <div className="relative">
                <select
                  value={durationFilter}
                  onChange={(e) => setDurationFilter(e.target.value)}
                  className="appearance-none bg-[#1c1f29] border border-[#1e293b] text-[#dfe2ef] text-[11px] font-mono rounded px-3 py-1.5 pr-7 cursor-pointer hover:bg-[#262a34] outline-none"
                >
                  <option value="ALL">Duration: &gt; 1 minute</option>
                  <option value="SUB_MIN">Duration: &lt; 1 minute</option>
                  <option value="LONG">Duration: &gt; 5 minutes</option>
                </select>
                <span className="material-symbols-outlined text-[14px] text-[#87929a] absolute right-2 top-2 pointer-events-none">
                  arrow_drop_down
                </span>
              </div>

              <button
                onClick={clearFilters}
                className="p-1.5 rounded bg-[#1c1f29] hover:bg-[#262a34] text-[#87929a] hover:text-[#dfe2ef] border border-[#1e293b] transition-colors cursor-pointer"
                title="Clear Filters"
              >
                <span className="material-symbols-outlined text-[16px]">restart_alt</span>
              </button>
            </div>
          </div>

          {/* Pipelines Master Execution Table */}
          <div className="bg-[#181b25] rounded-xl border border-[#1e293b] shadow-md overflow-hidden flex flex-col">
            {/* Table Column Header */}
            <div className="grid grid-cols-12 px-4 py-2.5 bg-[#0a0e17] border-b border-[#1e293b] text-[#87929a] text-[10px] font-mono uppercase tracking-wider items-center">
              <div className="col-span-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[14px]">account_tree</span>
                <span>Workflow & Step Flow</span>
              </div>
              <div className="col-span-2">Execution State</div>
              <div className="col-span-2">Duration & Age</div>
              <div className="col-span-2">Initiator & Telemetry</div>
              <div className="col-span-2 text-right">DAG Actions</div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-[#1e293b]">
              {filteredWorkflows.length === 0 ? (
                <div className="p-8 text-center text-[#87929a] font-mono text-[12px]">
                  No active workflows match your filter criteria.
                </div>
              ) : (
                filteredWorkflows.map((wf) => {
                  const isRunning = wf.state === 'RUNNING';
                  const isCompleted = wf.state === 'COMPLETED';
                  const isRetrying = wf.state === 'RETRYING';
                  const isScheduled = wf.state === 'SCHEDULED';

                  return (
                    <div
                      key={wf.id}
                      className={`grid grid-cols-12 px-4 py-3 hover:bg-[#262a34]/60 transition-all items-center group relative ${
                        isRetrying ? 'bg-[#93000a]/10' : ''
                      }`}
                    >
                      {/* Left: Name and step flow */}
                      <div className="col-span-4 flex flex-col gap-0.5 min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isRunning
                                ? 'bg-[#38bdf8] animate-pulse'
                                : isCompleted
                                ? 'bg-[#10b981]'
                                : isRetrying
                                ? 'bg-[#f59e0b] animate-ping'
                                : 'bg-[#87929a]'
                            }`}
                          ></span>
                          <button
                            onClick={() => onInspectWorkflow(wf.id)}
                            className="font-['Geist'] text-[13px] font-bold text-[#dfe2ef] hover:text-[#38bdf8] transition-colors truncate text-left cursor-pointer"
                          >
                            {wf.name}
                          </button>
                          <span className="text-[11px] font-mono text-[#87929a] px-1 bg-[#1c1f29] rounded">
                            {wf.codeId}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[#bdc8d1] text-[11px] font-mono">
                          {isRunning && (
                            <>
                              <span className="material-symbols-outlined text-[14px] text-[#38bdf8]">
                                arrow_forward
                              </span>
                              <span className="text-[#38bdf8] font-medium">
                                Step {wf.stepCurrent}/{wf.stepTotal}:
                              </span>
                              <span className="truncate">{wf.stepFlow}</span>
                            </>
                          )}
                          {isCompleted && (
                            <>
                              <span className="material-symbols-outlined text-[14px] text-[#10b981]">
                                check_circle
                              </span>
                              <span className="text-[#dfe2ef] truncate">{wf.stepFlow}</span>
                            </>
                          )}
                          {isRetrying && (
                            <span className="text-[#ffb4ab] flex items-center gap-1 truncate font-medium">
                              <span className="material-symbols-outlined text-[14px]">
                                warning
                              </span>
                              {wf.stepFlow}
                            </span>
                          )}
                          {isScheduled && (
                            <>
                              <span className="material-symbols-outlined text-[14px] text-[#87929a]">
                                schedule
                              </span>
                              <span>{wf.stepFlow}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* State */}
                      <div className="col-span-2 flex flex-col gap-0.5">
                        {isRunning && (
                          <div className="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-[#38bdf8]/10 text-[#38bdf8] w-fit font-mono text-[10px] uppercase font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] animate-ping"></span>
                            RUNNING
                          </div>
                        )}
                        {isCompleted && (
                          <div className="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-[#10b981]/15 text-[#10b981] w-fit font-mono text-[10px] uppercase font-bold">
                            <span className="material-symbols-outlined text-[12px]">
                              done_all
                            </span>
                            COMPLETED
                          </div>
                        )}
                        {isRetrying && (
                          <div className="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-[#f59e0b]/20 text-[#ffc174] w-fit font-mono text-[10px] uppercase font-bold">
                            <span className="material-symbols-outlined text-[13px] animate-spin">
                              refresh
                            </span>
                            RETRYING ({wf.stepCurrent}/{wf.stepTotal})
                          </div>
                        )}
                        {isScheduled && (
                          <div className="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-[#262a34] text-[#bdc8d1] w-fit font-mono text-[10px] uppercase font-bold">
                            <span className="material-symbols-outlined text-[12px]">
                              alarm
                            </span>
                            SCHEDULED
                          </div>
                        )}
                        <span
                          className={`text-[11px] font-mono ${
                            isRetrying ? 'text-[#ffb4ab] font-medium' : 'text-[#87929a]'
                          }`}
                        >
                          {wf.stateDetail}
                        </span>
                      </div>

                      {/* Duration & Age */}
                      <div className="col-span-2 flex flex-col gap-0.5 font-mono">
                        <span className="text-[12px] text-[#dfe2ef] font-medium">
                          {wf.duration}
                        </span>
                        <span className="text-[11px] text-[#87929a]">{wf.age}</span>
                      </div>

                      {/* Initiator & Telemetry */}
                      <div className="col-span-2 flex flex-col gap-0.5 font-mono">
                        <span className="text-[12px] text-[#dfe2ef] truncate">{wf.initiator}</span>
                        <span
                          className={`text-[11px] truncate ${
                            isCompleted
                              ? 'text-[#10b981]'
                              : isRetrying
                              ? 'text-[#ffc174]'
                              : 'text-[#bdc8d1]'
                          }`}
                        >
                          {wf.telemetry}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="col-span-2 flex items-center justify-end gap-1.5">
                        {isRunning && (
                          <>
                            <button
                              onClick={() => onInspectWorkflow(wf.id)}
                              className="px-2.5 py-1 rounded bg-[#1c1f29] hover:bg-[#353943] text-[#38bdf8] text-[11px] font-mono flex items-center gap-1 transition-colors cursor-pointer"
                              title="Inspect DAG Visualizer"
                            >
                              <span className="material-symbols-outlined text-[14px]">
                                account_tree
                              </span>
                              <span>Inspect</span>
                            </button>
                            <button
                              onClick={() => onTogglePauseWorkflow(wf.id)}
                              className="p-1 rounded bg-[#1c1f29] hover:bg-[#353943] text-[#bdc8d1] transition-colors cursor-pointer"
                              title="Pause Execution"
                            >
                              <span className="material-symbols-outlined text-[16px]">pause</span>
                            </button>
                            <button
                              onClick={() => onTerminateWorkflow(wf.id)}
                              className="p-1 rounded bg-[#93000a]/20 hover:bg-[#93000a] text-[#ffb4ab] transition-colors cursor-pointer"
                              title="Terminate Turn"
                            >
                              <span className="material-symbols-outlined text-[16px]">stop</span>
                            </button>
                          </>
                        )}
                        {isCompleted && (
                          <>
                            <button
                              onClick={() => onReplayWorkflow(wf.id)}
                              className="px-2.5 py-1 rounded bg-[#0a0e17] hover:bg-[#353943] text-[#bdc8d1] text-[11px] font-mono flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[14px]">
                                receipt_long
                              </span>
                              <span>Replay</span>
                            </button>
                            <button
                              onClick={() => onInspectWorkflow(wf.id)}
                              className="p-1 rounded bg-[#0a0e17] hover:bg-[#353943] text-[#87929a] hover:text-[#dfe2ef] transition-colors cursor-pointer"
                              title="Inspect Visualizer"
                            >
                              <span className="material-symbols-outlined text-[16px]">
                                account_tree
                              </span>
                            </button>
                          </>
                        )}
                        {isRetrying && (
                          <>
                            <button
                              onClick={() => onDebugWorkflow(wf.id)}
                              className="px-2.5 py-1 rounded bg-[#f59e0b]/20 hover:bg-[#f59e0b]/40 text-[#ffc174] text-[11px] font-mono flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[14px]">
                                bug_report
                              </span>
                              <span>Debug</span>
                            </button>
                            <button
                              onClick={() => onTerminateWorkflow(wf.id)}
                              className="p-1 rounded bg-[#93000a]/20 hover:bg-[#93000a] text-[#ffb4ab] transition-colors cursor-pointer"
                              title="Force Abort"
                            >
                              <span className="material-symbols-outlined text-[16px]">cancel</span>
                            </button>
                          </>
                        )}
                        {isScheduled && (
                          <>
                            <button
                              onClick={() => onInspectWorkflow(wf.id)}
                              className="px-2.5 py-1 rounded bg-[#1c1f29] hover:bg-[#353943] text-[#dfe2ef] text-[11px] font-mono flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[14px]">
                                play_circle
                              </span>
                              <span>Run Now</span>
                            </button>
                            <button
                              onClick={() => onInspectWorkflow(wf.id)}
                              className="p-1 rounded bg-[#1c1f29] hover:bg-[#353943] text-[#87929a] hover:text-[#dfe2ef] transition-colors cursor-pointer"
                              title="Edit Schedule"
                            >
                              <span className="material-symbols-outlined text-[16px]">
                                edit_calendar
                              </span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between text-[11px] font-mono text-[#87929a] p-3 bg-[#0a0e17] border-t border-[#1e293b]">
              <div className="flex items-center gap-4">
                <span>Displaying {filteredWorkflows.length} of 48 active pipelines</span>
                <span className="px-1.5 py-0.5 bg-[#1c1f29] rounded text-[#dfe2ef]">
                  Page {currentPage} of 10
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-1 rounded bg-[#181b25] text-[#87929a] hover:text-[#dfe2ef] disabled:opacity-40 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                </button>
                <button
                  onClick={() => setCurrentPage(1)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                    currentPage === 1 ? 'bg-[#1c1f29] text-[#38bdf8] font-bold' : 'bg-[#181b25]'
                  }`}
                >
                  1
                </button>
                <button
                  onClick={() => setCurrentPage(2)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                    currentPage === 2 ? 'bg-[#1c1f29] text-[#38bdf8] font-bold' : 'bg-[#181b25]'
                  }`}
                >
                  2
                </button>
                <button
                  onClick={() => setCurrentPage(3)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                    currentPage === 3 ? 'bg-[#1c1f29] text-[#38bdf8] font-bold' : 'bg-[#181b25]'
                  }`}
                >
                  3
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="p-1 rounded bg-[#181b25] text-[#87929a] hover:text-[#dfe2ef] cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Telemetry Drawer: Real-time Operations Stream & Radial Gauge */}
        <div className="w-full lg:w-96 flex flex-col gap-4 flex-shrink-0">
          {/* System Worker Utilization Radial Card */}
          <div className="p-4 rounded-xl bg-[#181b25] border border-[#1e293b] flex flex-col gap-3 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#38bdf8] text-[18px]">
                  memory
                </span>
                <span className="font-['Geist'] text-[14px] text-[#dfe2ef] font-bold">
                  Worker Utilization
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#38bdf8] px-1.5 py-0.5 bg-[#38bdf8]/10 rounded">
                Live Telemetry
              </span>
            </div>

            <div className="flex items-center gap-4 p-3 bg-[#1c1f29] rounded-lg border border-[#1e293b]">
              {/* Radial Progress SVG */}
              <div className="relative w-20 h-20 flex items-center justify-center flex-shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-[#31353f] stroke-current"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    strokeWidth="3.5"
                  ></path>
                  <path
                    className="text-[#38bdf8] stroke-current"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    strokeDasharray="74, 100"
                    strokeLinecap="round"
                    strokeWidth="3.5"
                  ></path>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[16px] font-mono leading-tight text-[#dfe2ef] font-bold">
                    74%
                  </span>
                  <span className="text-[9px] font-mono text-[#87929a]">CAPACITY</span>
                </div>
              </div>
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex flex-col">
                  <span className="text-[13px] font-mono font-bold text-[#dfe2ef]">
                    512 Active Workers
                  </span>
                  <span className="text-[11px] font-mono text-[#87929a]">
                    680 Cores Commissioned
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[#c0c1ff] text-[11px] font-mono">
                  <span className="material-symbols-outlined text-[13px]">bolt</span>
                  <span>Sync latency: 0.38ms</span>
                </div>
              </div>
            </div>

            {/* Worker Health breakdown pills */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded bg-[#262a34] border border-[#1e293b] flex flex-col">
                <span className="text-[10px] font-mono text-[#87929a]">Idle</span>
                <span className="text-[13px] font-mono font-bold text-[#dfe2ef]">168</span>
              </div>
              <div className="p-2 rounded bg-[#262a34] border border-[#1e293b] flex flex-col">
                <span className="text-[10px] font-mono text-[#87929a]">Leased</span>
                <span className="text-[13px] font-mono font-bold text-[#38bdf8]">482</span>
              </div>
              <div className="p-2 rounded bg-[#262a34] border border-[#1e293b] flex flex-col">
                <span className="text-[10px] font-mono text-[#87929a]">Draining</span>
                <span className="text-[13px] font-mono font-bold text-[#ffc174]">30</span>
              </div>
            </div>
          </div>

          {/* Cluster Live Events Stream Panel */}
          <div className="p-4 rounded-xl bg-[#181b25] border border-[#1e293b] flex flex-col gap-3 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#38bdf8] text-[18px]">
                  terminal
                </span>
                <span className="font-['Geist'] text-[14px] text-[#dfe2ef] font-bold">
                  Cluster Live Events
                </span>
              </div>
              <span className="w-2 h-2 rounded-full bg-[#38bdf8] animate-ping"></span>
            </div>

            <div className="flex flex-col gap-2">
              {/* Event 1 */}
              <div
                onClick={onOpenAuditTrace}
                className="p-2.5 rounded-lg bg-[#1c1f29] hover:bg-[#262a34] transition-colors flex flex-col gap-1 border border-[#1e293b] cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#38bdf8] font-bold px-1.5 py-0.5 bg-[#38bdf8]/10 rounded">
                    #EVT-90412
                  </span>
                  <span className="text-[10px] font-mono text-[#87929a]">120ms ago</span>
                </div>
                <p className="text-[12px] font-mono text-[#dfe2ef]">
                  <span className="font-bold text-[#38bdf8]">order-fulfillment</span>: Lock Acquired
                  for <code className="text-[#bdc8d1] font-mono">order_sku_9921</code>
                </p>
                <div className="flex items-center gap-1.5 text-[#87929a] text-[10px] font-mono">
                  <span>Node: worker-edge-04a</span>
                  <span>•</span>
                  <span className="text-[#10b981]">Seq #891,205</span>
                </div>
              </div>

              {/* Event 2 */}
              <div
                onClick={onOpenAuditTrace}
                className="p-2.5 rounded-lg bg-[#1c1f29] hover:bg-[#262a34] transition-colors flex flex-col gap-1 border border-[#1e293b] cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#10b981] font-bold px-1.5 py-0.5 bg-[#10b981]/10 rounded">
                    #EVT-90411
                  </span>
                  <span className="text-[10px] font-mono text-[#87929a]">1.4s ago</span>
                </div>
                <p className="text-[12px] font-mono text-[#dfe2ef]">
                  <span className="font-bold text-[#10b981]">cdc-ingest</span>: Checkpointed
                  snapshot partition 04 (offset: 994012)
                </p>
                <div className="flex items-center gap-1.5 text-[#87929a] text-[10px] font-mono">
                  <span>Storage: pg-durable-wal</span>
                  <span>•</span>
                  <span className="text-[#10b981]">Seq #891,204</span>
                </div>
              </div>

              {/* Event 3 */}
              <div
                onClick={onOpenAuditTrace}
                className="p-2.5 rounded-lg bg-[#1c1f29] hover:bg-[#262a34] transition-colors flex flex-col gap-1 border border-[#1e293b] cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#ffc174] font-bold px-1.5 py-0.5 bg-[#f59e0b]/20 rounded">
                    #EVT-90410
                  </span>
                  <span className="text-[10px] font-mono text-[#87929a]">4.2s ago</span>
                </div>
                <p className="text-[12px] font-mono text-[#dfe2ef]">
                  <span className="font-bold text-[#ffc174]">kyc-identity</span>: Webhook socket
                  reset. Arming jitter retry backoff #2
                </p>
                <div className="flex items-center gap-1.5 text-[#87929a] text-[10px] font-mono">
                  <span>Node: worker-core-09c</span>
                  <span>•</span>
                  <span className="text-[#ffc174]">Seq #891,203</span>
                </div>
              </div>

              {/* Event 4 */}
              <div
                onClick={onOpenAuditTrace}
                className="p-2.5 rounded-lg bg-[#1c1f29] hover:bg-[#262a34] transition-colors flex flex-col gap-1 border border-[#1e293b] cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#c0c1ff] font-bold px-1.5 py-0.5 bg-[#3131c0]/20 rounded">
                    #EVT-90409
                  </span>
                  <span className="text-[10px] font-mono text-[#87929a]">9.8s ago</span>
                </div>
                <p className="text-[12px] font-mono text-[#dfe2ef]">
                  <span className="font-bold text-[#c0c1ff]">broker-sync</span>: Rendezvous match
                  complete for 12 waiting activity futures
                </p>
                <div className="flex items-center gap-1.5 text-[#87929a] text-[10px] font-mono">
                  <span>Channel: ephemeral-inmem</span>
                  <span>•</span>
                  <span className="text-[#10b981]">Seq #891,202</span>
                </div>
              </div>
            </div>

            <button
              onClick={onOpenAuditTrace}
              className="w-full py-1.5 rounded-lg bg-[#1c1f29] hover:bg-[#353943] text-[#38bdf8] text-[11px] font-mono text-center transition-colors border border-[#1e293b] cursor-pointer"
            >
              Open Full Audit Trace Stream (⌘L)
            </button>
          </div>

          {/* Quick Execution Shortcuts / Fencing Summary */}
          <div className="p-4 rounded-xl bg-[#181b25] border border-[#1e293b] flex flex-col gap-2 shadow-md">
            <span className="text-[10px] font-mono text-[#87929a] uppercase tracking-wider font-semibold">
              Concurrency Fencing & WAL
            </span>
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-[#bdc8d1]">PostgreSQL Snapshot LSN</span>
              <span className="text-[#38bdf8] font-bold">0/18A4F92</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-[#bdc8d1]">Active Min-Heap Timers</span>
              <span className="text-[#dfe2ef] font-bold">144 entries</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-[#bdc8d1]">Brokerless Sync Matches</span>
              <span className="text-[#10b981] font-bold">98.4% direct match</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
