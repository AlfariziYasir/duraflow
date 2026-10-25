import React, { useState, useEffect } from 'react';
import { NavigationPath } from '../../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: NavigationPath) => void;
  onTriggerAction: (actionName: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onTriggerAction,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          setQuery('');
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actions = [
    {
      id: 'nav-workflows',
      category: 'Navigation',
      label: 'Go to Workflows & Orchestrations',
      icon: 'schema',
      action: () => {
        onNavigate('workflows');
        onClose();
      },
    },
    {
      id: 'nav-graph',
      category: 'Navigation',
      label: 'Go to DAG Execution Visualizer',
      icon: 'account_tree',
      action: () => {
        onNavigate('execution-graph');
        onClose();
      },
    },
    {
      id: 'nav-nodes',
      category: 'Navigation',
      label: 'Go to Cluster Nodes & Worker Pools',
      icon: 'dns',
      action: () => {
        onNavigate('nodes-workers');
        onClose();
      },
    },
    {
      id: 'nav-logs',
      category: 'Navigation',
      label: 'Go to Telemetry & Event Streams (⌘L)',
      icon: 'timeline',
      action: () => {
        onNavigate('event-logs');
        onClose();
      },
    },
    {
      id: 'nav-settings',
      category: 'Navigation',
      label: 'Go to Settings & Cluster Configuration',
      icon: 'tune',
      action: () => {
        onNavigate('settings');
        onClose();
      },
    },
    {
      id: 'action-trigger-wf',
      category: 'Control Operations',
      label: 'Trigger Manual Workflow Run',
      icon: 'play_arrow',
      action: () => {
        onTriggerAction('trigger-manual');
        onClose();
      },
    },
    {
      id: 'action-rebalance',
      category: 'Control Operations',
      label: 'Rebalance Fleet Worker Shards',
      icon: 'sync_alt',
      action: () => {
        onTriggerAction('rebalance');
        onClose();
      },
    },
    {
      id: 'action-export-log',
      category: 'Control Operations',
      label: 'Export Zstandard Log Dump (.zst)',
      icon: 'file_download',
      action: () => {
        onTriggerAction('export-logs');
        onClose();
      },
    },
    {
      id: 'action-inspect-order',
      category: 'Workflows',
      label: 'Inspect order-fulfillment-saga-v3 (#wf_89410)',
      icon: 'visibility',
      action: () => {
        onNavigate('execution-graph');
        onClose();
      },
    },
  ];

  const filtered = actions.filter(
    (a) =>
      a.label.toLowerCase().includes(query.toLowerCase()) ||
      a.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl bg-[#111827] border border-[#334155] rounded-xl shadow-[0_24px_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Input box */}
        <div className="flex items-center px-4 py-3 border-b border-[#1e293b] gap-3 bg-[#0c121e]">
          <span className="material-symbols-outlined text-[20px] text-[#38bdf8]">
            search
          </span>
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, pipeline name, or node ID..."
            className="w-full bg-transparent text-[#dfe2ef] placeholder:text-[#87929a] font-mono text-[13px] outline-none"
          />
          <span className="text-[10px] font-mono text-[#87929a] px-1.5 py-0.5 rounded bg-[#1c1f29] border border-[#334155]">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-[#1e293b]/40">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-[#87929a] font-mono text-[12px]">
              No commands or pipelines match &quot;{query}&quot;
            </div>
          ) : (
            filtered.map((item) => (
              <button
                key={item.id}
                onClick={item.action}
                className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-[#1b2438] flex items-center justify-between group transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[18px] text-[#87929a] group-hover:text-[#38bdf8] transition-colors">
                    {item.icon}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-[12px] font-mono text-[#dfe2ef] group-hover:text-white">
                      {item.label}
                    </span>
                    <span className="text-[10px] font-mono text-[#87929a]">
                      {item.category}
                    </span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[14px] text-[#87929a] opacity-0 group-hover:opacity-100 transition-opacity">
                  arrow_forward
                </span>
              </button>
            ))
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 bg-[#0a0e17] border-t border-[#1e293b] flex items-center justify-between text-[10px] font-mono text-[#87929a]">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span className="text-[#38bdf8]">DuraFlow Command Hub</span>
        </div>
      </div>
    </div>
  );
};
