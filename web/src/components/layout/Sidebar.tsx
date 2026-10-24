import React from 'react';
import { NavigationPath } from '../../types';

interface SidebarProps {
  currentPath: NavigationPath;
  onNavigate: (path: NavigationPath) => void;
  brokerSeq?: number;
  ackLatency?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPath,
  onNavigate,
  brokerSeq = 891204,
  ackLatency = '0.42 ms',
}) => {
  const navItems: { path: NavigationPath; label: string; icon: string }[] = [
    {
      path: 'workflows',
      label: 'Workflows & Pipelines',
      icon: 'schema',
    },
    {
      path: 'execution-graph',
      label: 'Execution Graph',
      icon: 'account_tree',
    },
    {
      path: 'nodes-workers',
      label: 'Nodes & Workers',
      icon: 'dns',
    },
    {
      path: 'event-logs',
      label: 'Event Log & Traces',
      icon: 'timeline',
    },
    {
      path: 'settings',
      label: 'Settings & Cluster',
      icon: 'tune',
    },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[#0a0e17] z-50 flex flex-col justify-between shadow-[0_1px_8px_rgba(0,0,0,0.3)] border-r border-[#1e293b]">
      <div className="flex flex-col">
        {/* Brand Header */}
        <div className="h-14 px-4 flex items-center gap-2 bg-[#181b25]/60 border-b border-[#1e293b]">
          <img
            alt="DuraFlow Logo"
            className="h-7 w-auto object-contain"
            src="https://lh3.googleusercontent.com/aida/AEtjO1WLbZRiVYw8jzKQ0nmxcuxsEyYbMq8mtUfOP6t239dX9PQomPNXVcCMmxutYUjwQOpy80uIH7F3Ev-ENK1l4-Vy1ZB2TJ7P48Md15AzByY4VwL90CFfhkI5DFprRZ-pZrB-UCxCKhYtvja5XZ0BAtf7PJxxY7Sab_LQNAVzJXJnfMYQr_0kPVGpra83XPn-pLOaQ-hsw-9qElKGCxkNVdCnLPoH7mhnkLonW9qP3IcGXEYhpEROz7wf0DLm"
          />
          <span className="font-['Geist'] text-[15px] font-bold tracking-tight text-[#dfe2ef]">
            DuraFlow
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 bg-[#262a34] text-[#8ed5ff] rounded border border-[#3e484f]/40 ml-auto">
            v1.4-prod
          </span>
        </div>

        {/* Section Label */}
        <div className="px-4 pt-3 pb-1">
          <span className="text-[10px] font-mono text-[#87929a] uppercase tracking-wider font-semibold">
            Control Plane
          </span>
        </div>

        {/* Navigation List */}
        <nav className="flex flex-col gap-0.5 px-2">
          {navItems.map((item) => {
            const isActive = currentPath === item.path;
            return (
              <button
                key={item.path}
                onClick={() => onNavigate(item.path)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all text-[13px] font-mono cursor-pointer ${
                  isActive
                    ? 'bg-[#262a34] text-[#8ed5ff] font-semibold border-l-2 border-[#38bdf8] shadow-sm'
                    : 'text-[#bdc8d1] hover:bg-[#181b25] hover:text-[#dfe2ef]'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[18px] ${
                    isActive ? 'text-[#38bdf8]' : 'text-[#87929a]'
                  }`}
                >
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Broker Sync State Widget */}
      <div className="p-3 m-3 rounded-lg bg-[#181b25]/80 border border-[#1e293b] flex flex-col gap-1.5 shadow-sm">
        <div className="flex items-center justify-between text-[#87929a]">
          <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-[#bdc8d1]">
            Broker Sync State
          </span>
          <span className="inline-block w-2 h-2 rounded-full bg-[#38bdf8] animate-pulse"></span>
        </div>
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-[#87929a]">Ack Latency</span>
          <span className="text-[#8ed5ff] font-medium">{ackLatency}</span>
        </div>
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-[#87929a]">Committed Seq</span>
          <span className="text-[#dfe2ef]">#{brokerSeq.toLocaleString()}</span>
        </div>
      </div>
    </aside>
  );
};
