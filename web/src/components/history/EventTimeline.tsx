import React, { useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Clock,
  Activity,
  Radio,
  CheckCircle,
  XCircle,
  AlertOctagon,
  RefreshCw,
  Zap,
} from 'lucide-react';
import type { HistoryEvent, HistoryEventType } from '../../api/types';

interface EventTimelineProps {
  events: HistoryEvent[];
  selectedEventId?: number | null;
  onSelectEvent?: (eventId: number) => void;
  isStreaming?: boolean;
}

const eventTypeConfig: Record<
  HistoryEventType,
  { label: string; icon: React.ElementType; color: string }
> = {
  WorkflowExecutionStarted: { label: 'Workflow Started', icon: Zap, color: 'text-accent' },
  ActivityTaskScheduled: { label: 'Activity Scheduled', icon: Activity, color: 'text-muted' },
  ActivityTaskStarted: { label: 'Activity Started', icon: Activity, color: 'text-sky-400' },
  ActivityTaskCompleted: { label: 'Activity Completed', icon: CheckCircle, color: 'text-success' },
  ActivityTaskFailed: { label: 'Activity Failed', icon: AlertOctagon, color: 'text-error' },
  ActivityTaskTimedOut: { label: 'Activity Timed Out', icon: Clock, color: 'text-warning' },
  ActivityTaskCanceled: { label: 'Activity Canceled', icon: XCircle, color: 'text-muted' },
  TimerStarted: { label: 'Timer Started', icon: Clock, color: 'text-warning' },
  TimerFired: { label: 'Timer Fired', icon: Clock, color: 'text-success' },
  TimerCanceled: { label: 'Timer Canceled', icon: Clock, color: 'text-muted' },
  WorkflowExecutionSignaled: { label: 'Signaled', icon: Radio, color: 'text-warning' },
  WorkflowExecutionUpdateAccepted: { label: 'Update Accepted', icon: Zap, color: 'text-accent' },
  WorkflowExecutionUpdateCompleted: { label: 'Update Completed', icon: Zap, color: 'text-success' },
  WorkflowExecutionCompleted: { label: 'Workflow Completed', icon: CheckCircle, color: 'text-success' },
  WorkflowExecutionFailed: { label: 'Workflow Failed', icon: AlertOctagon, color: 'text-error' },
  WorkflowExecutionCanceled: { label: 'Workflow Canceled', icon: XCircle, color: 'text-muted' },
  WorkflowExecutionTerminated: { label: 'Workflow Terminated', icon: XCircle, color: 'text-error' },
};

export const EventTimeline: React.FC<EventTimelineProps> = ({
  events,
  selectedEventId,
  onSelectEvent,
  isStreaming = false,
}) => {
  const [expandedEvents, setExpandedEvents] = useState<Record<number, boolean>>({});

  const toggleExpand = (eventId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedEvents((prev) => ({
      ...prev,
      [eventId]: !prev[eventId],
    }));
  };

  return (
    <div className="flex flex-col h-full bg-surface-card rounded border border-border overflow-hidden">
      <div className="p-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-fg">History Event Stream</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-surface border border-border text-muted">
            {events.length} events
          </span>
        </div>
        {isStreaming && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live SSE
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-border/50 text-xs">
        {events.length === 0 ? (
          <div className="p-8 text-center text-muted">No history events recorded yet.</div>
        ) : (
          events.map((event) => {
            const config = eventTypeConfig[event.event_type] || {
              label: event.event_type,
              icon: Activity,
              color: 'text-muted',
            };
            const Icon = config.icon;
            const isSelected = selectedEventId === event.event_id;
            const isExpanded = !!expandedEvents[event.event_id];

            return (
              <div
                key={event.event_id}
                onClick={() => onSelectEvent?.(event.event_id)}
                className={`p-2.5 transition-colors cursor-pointer ${
                  isSelected ? 'bg-surface-hover/80 border-l-2 border-l-accent' : 'hover:bg-surface-hover/40'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      onClick={(e) => toggleExpand(event.event_id, e)}
                      className="text-muted hover:text-fg p-0.5"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <span className="font-mono text-[11px] font-bold text-muted w-8">
                      #{event.event_id}
                    </span>
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${config.color}`} />
                    <span className="font-semibold text-fg truncate">{event.event_type}</span>
                  </div>

                  <span className="font-mono text-[10px] text-muted shrink-0">
                    {event.timestamp.split('T')[1]?.slice(0, 12) || event.timestamp}
                  </span>
                </div>

                {event.node_id && (
                  <div className="ml-14 text-[11px] text-muted mt-0.5">
                    node_id: <span className="font-mono text-fg">{event.node_id}</span>
                  </div>
                )}

                {isExpanded && (
                  <div className="mt-2 ml-6 p-2 rounded bg-background border border-border font-mono text-[11px] text-muted overflow-x-auto">
                    <pre>{JSON.stringify(event.payload, null, 2)}</pre>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="p-2.5 border-t border-border bg-surface text-[11px] text-muted flex items-center justify-between">
        <span className="flex items-center gap-1">
          <RefreshCw className="w-3 h-3 text-success" />
          Strict 1x <strong className="text-fg font-mono">pgx.Batch</strong> per turn
        </span>
        <span className="font-mono">OCC fencing: active</span>
      </div>
    </div>
  );
};
