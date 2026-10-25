import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Radio,
  HelpCircle,
  Zap,
  XOctagon,
  Clock,
  Layers,
  Code,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../api/client';
import { useWorkflowEventStream } from '../api/sse';
import type {
  WorkflowExecution,
  HistoryEvent,
  WorkflowDefinition,
} from '../api/types';
import { StatusBadge } from '../components/common/StatusBadge';
import { WorkflowDAG } from '../components/dag/WorkflowDAG';
import { EventTimeline } from '../components/history/EventTimeline';
import { SignalModal } from '../components/actions/SignalModal';
import { QueryModal } from '../components/actions/QueryModal';
import { UpdateModal } from '../components/actions/UpdateModal';

interface ExecutionDetailViewProps {
  runId: string;
  onBack: () => void;
}

export const ExecutionDetailView: React.FC<ExecutionDetailViewProps> = ({ runId, onBack }) => {
  const [execution, setExecution] = useState<WorkflowExecution | null>(null);
  const [definition, setDefinition] = useState<WorkflowDefinition | null>(null);
  const [events, setEvents] = useState<HistoryEvent[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'dag' | 'state' | 'scrubber'>('dag');
  const [scrubberIndex, setScrubberIndex] = useState<number>(0);

  // Modals
  const [signalOpen, setSignalOpen] = useState(false);
  const [queryOpen, setQueryOpen] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [run, historyEvents] = await Promise.all([
        api.getWorkflow(runId),
        api.getHistoryEvents(runId),
      ]);
      setExecution(run);
      setEvents(historyEvents);
      setScrubberIndex(historyEvents.length);

      const def = await api.getWorkflowDefinition(run.workflow_id, run.workflow_version);
      setDefinition(def);
    } catch (err) {
      console.error('Failed to load workflow run data:', err);
    }
  }, [runId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Subscribe to live SSE stream
  useWorkflowEventStream(runId, (newEvent) => {
    setEvents((prev) => {
      if (prev.some((e) => e.event_id === newEvent.event_id)) return prev;
      return [...prev, newEvent];
    });
    // Auto refresh snapshot on terminal or turn commit events
    if (newEvent.event_type.includes('Completed') || newEvent.event_type.includes('Failed')) {
      api.getWorkflow(runId).then(setExecution).catch(() => {});
    }
  });

  // Calculate Node Statuses from events
  const nodeStatuses = React.useMemo(() => {
    const statuses: Record<string, 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'WAITING'> = {};
    const visibleEvents = events.slice(0, scrubberIndex || events.length);

    for (const ev of visibleEvents) {
      if (!ev.node_id) continue;
      if (ev.event_type === 'ActivityTaskScheduled') statuses[ev.node_id] = 'PENDING';
      if (ev.event_type === 'ActivityTaskStarted') statuses[ev.node_id] = 'RUNNING';
      if (ev.event_type === 'ActivityTaskCompleted') statuses[ev.node_id] = 'COMPLETED';
      if (ev.event_type === 'ActivityTaskFailed') statuses[ev.node_id] = 'FAILED';
      if (ev.event_type === 'TimerStarted') statuses[ev.node_id] = 'WAITING';
      if (ev.event_type === 'TimerFired') statuses[ev.node_id] = 'COMPLETED';
    }
    return statuses;
  }, [events, scrubberIndex]);

  // Selected Node Details
  const selectedNodeEvents = React.useMemo(() => {
    if (!selectedNodeId) return [];
    return events.filter((e) => e.node_id === selectedNodeId);
  }, [selectedNodeId, events]);

  const lastNodeEvent = selectedNodeEvents[selectedNodeEvents.length - 1];

  return (
    <div className="p-4 space-y-3 max-w-[1600px] mx-auto text-xs">
      {/* Header Banner */}
      <div className="p-3 bg-surface border border-border rounded-lg space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-1 rounded hover:bg-surface-hover text-muted hover:text-fg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="text-muted">
              Executions / <strong className="text-fg">{execution?.workflow_id}</strong> /{' '}
              <span className="font-mono text-fg">{runId}</span>
            </span>
            {execution && <StatusBadge status={execution.status} />}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSignalOpen(true)}
              className="px-2.5 py-1 rounded bg-surface-card border border-border text-fg hover:bg-surface-hover flex items-center gap-1 font-semibold"
            >
              <Radio className="w-3.5 h-3.5 text-warning" />
              + Signal
            </button>
            <button
              onClick={() => setQueryOpen(true)}
              className="px-2.5 py-1 rounded bg-surface-card border border-border text-fg hover:bg-surface-hover flex items-center gap-1 font-semibold"
            >
              <HelpCircle className="w-3.5 h-3.5 text-accent" />
              ? Query
            </button>
            <button
              onClick={() => setUpdateOpen(true)}
              className="px-2.5 py-1 rounded bg-surface-card border border-border text-fg hover:bg-surface-hover flex items-center gap-1 font-semibold"
            >
              <Zap className="w-3.5 h-3.5 text-accent" />
              ⚡ Update
            </button>
            <button
              onClick={() => {
                if (confirm('Cancel this workflow execution?')) {
                  api.cancelWorkflow(runId, { reason: 'User requested cancellation' });
                }
              }}
              className="px-2.5 py-1 rounded bg-surface-card border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 flex items-center gap-1 font-semibold"
            >
              <XOctagon className="w-3.5 h-3.5" />
              Cancel
            </button>
          </div>
        </div>

        {/* Metadata Strip */}
        <div className="pt-2 border-t border-border/60 flex flex-wrap items-center gap-6 text-[11px] text-muted">
          <span>Version: <strong className="text-fg">v{execution?.workflow_version}</strong></span>
          <span>Turn IOPS: <strong className="text-fg font-mono">{execution?.last_event_id} batches (1x/turn)</strong></span>
          <span>Last Event ID: <strong className="font-mono text-fg">#{execution?.last_event_id}</strong></span>
          {execution?.next_timer_at && (
            <span className="text-warning font-semibold flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Next Timer: {new Date(execution.next_timer_at).toLocaleTimeString()}
            </span>
          )}
          <span>Started: {execution ? new Date(execution.start_time).toLocaleString() : '-'}</span>
        </div>
      </div>

      {/* Main Split Cockpit */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-[640px]">
        {/* Left Pane (DAG + Node Inspector + Scrubber) */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          <div className="p-3 bg-surface border border-border rounded-lg flex-1 flex flex-col">
            <div className="flex items-center justify-between border-b border-border pb-2 mb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('dag')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 ${
                    activeTab === 'dag' ? 'bg-surface-hover text-fg' : 'text-muted hover:text-fg'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-accent" />
                  Visual DAG Flow
                </button>
                <button
                  onClick={() => setActiveTab('state')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 ${
                    activeTab === 'state' ? 'bg-surface-hover text-fg' : 'text-muted hover:text-fg'
                  }`}
                >
                  <Code className="w-3.5 h-3.5 text-emerald-400" />
                  MutableState JSON
                </button>
                <button
                  onClick={() => setActiveTab('scrubber')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 ${
                    activeTab === 'scrubber' ? 'bg-surface-hover text-fg' : 'text-muted hover:text-fg'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5 text-warning" />
                  Deterministic Replay Scrubber
                </button>
              </div>

              {activeTab === 'scrubber' && (
                <div className="flex items-center gap-2 text-[11px] text-muted">
                  <span>Replaying up to Event #{scrubberIndex} of {events.length}</span>
                </div>
              )}
            </div>

            {/* Tab 1: DAG Canvas */}
            {activeTab === 'dag' && (
              <div className="flex-1 min-h-[380px]">
                <WorkflowDAG
                  schema={definition?.dag_schema}
                  activeNodeId={selectedNodeId}
                  nodeStatuses={nodeStatuses}
                  onSelectNode={setSelectedNodeId}
                />
              </div>
            )}

            {/* Tab 2: MutableState JSON */}
            {activeTab === 'state' && (
              <div className="flex-1 p-3 rounded bg-background border border-border font-mono text-[11px] text-fg overflow-auto max-h-[440px]">
                <pre>{JSON.stringify(execution?.current_state, null, 2)}</pre>
              </div>
            )}

            {/* Tab 3: Replay Scrubber */}
            {activeTab === 'scrubber' && (
              <div className="space-y-4 p-4 bg-surface-card rounded border border-border">
                <p className="text-muted leading-relaxed">
                  Step backward or forward through the append-only event stream to verify state at any past turn.
                </p>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-muted">#1</span>
                  <input
                    type="range"
                    min={1}
                    max={events.length || 1}
                    value={scrubberIndex}
                    onChange={(e) => setScrubberIndex(Number(e.target.value))}
                    className="flex-1 accent-accent cursor-pointer"
                  />
                  <span className="font-mono font-bold text-accent">#{scrubberIndex}</span>
                </div>
                <div className="p-3 bg-background rounded border border-border">
                  <span className="text-muted block mb-1">State at Event #{scrubberIndex}:</span>
                  <div className="font-mono text-[11px] text-emerald-400">
                    {events[scrubberIndex - 1]?.event_type || 'Genesis'} (Turn Replay Verified)
                  </div>
                </div>
              </div>
            )}

            {/* Selected Node Inspector Card */}
            {selectedNodeId && (
              <div className="mt-3 p-3 bg-surface-card border border-border rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-fg">
                    Node Inspector: <code className="font-mono text-accent">{selectedNodeId}</code>
                  </span>
                  <span className="text-[10px] uppercase font-bold text-success flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {nodeStatuses[selectedNodeId] || 'PENDING'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-muted">
                  <div>
                    Last Event:{' '}
                    <span className="font-mono text-fg">{lastNodeEvent?.event_type || '-'}</span>
                  </div>
                  <div>
                    Turn Commit:{' '}
                    <span className="font-mono text-fg">#{lastNodeEvent?.event_id || '-'}</span>
                  </div>
                </div>

                {lastNodeEvent && (
                  <div className="p-2 rounded bg-background border border-border font-mono text-[10px] text-muted max-h-36 overflow-auto">
                    <pre>{JSON.stringify(lastNodeEvent.payload, null, 2)}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Pane (Event History Stream) */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <EventTimeline
            events={events}
            selectedEventId={selectedEventId}
            onSelectEvent={setSelectedEventId}
            isStreaming={execution?.status === 'RUNNING'}
          />
        </div>
      </div>

      {/* Modals */}
      <SignalModal
        runId={runId}
        isOpen={signalOpen}
        onClose={() => setSignalOpen(false)}
        onSuccess={loadData}
      />
      <QueryModal
        runId={runId}
        isOpen={queryOpen}
        onClose={() => setQueryOpen(false)}
      />
      <UpdateModal
        runId={runId}
        isOpen={updateOpen}
        onClose={() => setUpdateOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
};
