import React from 'react';
import type { WorkflowStatus } from '../../api/types';

interface StatusBadgeProps {
  status: WorkflowStatus | 'TRANSIENT' | 'WAITING';
  className?: string;
}

const statusConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  RUNNING: {
    label: 'RUNNING',
    bg: 'bg-sky-500/10 border-sky-500/30',
    text: 'text-sky-400',
    dot: 'bg-sky-400',
  },
  COMPLETED: {
    label: 'COMPLETED',
    bg: 'bg-emerald-500/10 border-emerald-500/30',
    text: 'text-emerald-400',
    dot: 'bg-emerald-400',
  },
  FAILED: {
    label: 'FAILED',
    bg: 'bg-rose-500/10 border-rose-500/30',
    text: 'text-rose-400',
    dot: 'bg-rose-400',
  },
  TERMINATED: {
    label: 'TERMINATED',
    bg: 'bg-zinc-500/10 border-zinc-500/30',
    text: 'text-zinc-400',
    dot: 'bg-zinc-400',
  },
  TIMED_OUT: {
    label: 'TIMED OUT',
    bg: 'bg-amber-500/10 border-amber-500/30',
    text: 'text-amber-400',
    dot: 'bg-amber-400',
  },
  WAITING: {
    label: 'WAITING',
    bg: 'bg-yellow-500/10 border-yellow-500/30',
    text: 'text-yellow-400',
    dot: 'bg-yellow-400',
  },
  TRANSIENT: {
    label: 'TRANSIENT RETRY',
    bg: 'bg-purple-500/10 border-purple-500/30',
    text: 'text-purple-400',
    dot: 'bg-purple-400',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const config = statusConfig[status] || statusConfig.TERMINATED;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[10px] font-bold tracking-wide uppercase ${config.bg} ${config.text} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
};
