import React, { useState } from 'react';

interface HeaderProps {
  onOpenCommandPalette: () => void;
  onOpenNotifications: () => void;
  clusterName?: string;
  onClusterChange?: (cluster: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCommandPalette,
  onOpenNotifications,
  clusterName = 'us-east-cluster-primary',
  onClusterChange,
}) => {
  const [isClusterDropdownOpen, setIsClusterDropdownOpen] = useState(false);
  const clusters = [
    'us-east-cluster-primary',
    'us-west-cluster-backup',
    'eu-central-cluster-geo',
  ];

  return (
    <header className="fixed top-0 left-64 right-0 h-14 bg-[#0a0e17]/95 backdrop-blur-xl z-40 flex items-center justify-between px-6 border-b border-[#1e293b] shadow-[0_1px_8px_rgba(0,0,0,0.2)]">
      {/* Left: Cluster selection & System health */}
      <div className="flex items-center gap-4">
        {/* Cluster dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsClusterDropdownOpen(!isClusterDropdownOpen)}
            className="flex items-center gap-2 px-2.5 py-1 rounded bg-[#181b25] text-[#bdc8d1] hover:text-[#dfe2ef] border border-[#1e293b] text-[11px] font-mono cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[16px] text-[#38bdf8]">
              cloud_queue
            </span>
            <span className="text-[#dfe2ef] font-medium">{clusterName}</span>
            <span className="text-[10px] text-[#38bdf8] bg-[#38bdf8]/10 px-1 py-0.5 rounded font-semibold">
              Active
            </span>
            <span className="material-symbols-outlined text-[14px] text-[#87929a]">
              unfold_more
            </span>
          </button>

          {isClusterDropdownOpen && (
            <div className="absolute left-0 mt-1.5 w-60 bg-[#111827] border border-[#334155] rounded-lg shadow-2xl py-1 z-50">
              <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-[#87929a] font-mono">
                Select Active Cluster
              </div>
              {clusters.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    onClusterChange?.(c);
                    setIsClusterDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-[12px] font-mono flex items-center justify-between hover:bg-[#1b2438] ${
                    c === clusterName ? 'text-[#38bdf8] bg-[#1b2438]/50' : 'text-[#dfe2ef]'
                  }`}
                >
                  <span className="truncate">{c}</span>
                  {c === clusterName && (
                    <span className="material-symbols-outlined text-[14px] text-[#38bdf8]">
                      check
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Health status */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-[#181b25]/60 border border-[#1e293b]/60">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse"></span>
          <span className="text-[11px] font-mono text-[#bdc8d1]">
            Healthy • 99.98% uptime
          </span>
        </div>
      </div>

      {/* Right: Search, Docs, Alerts, Profile */}
      <div className="flex items-center gap-4">
        {/* Search Bar / Command Palette trigger */}
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#181b25] text-[#87929a] hover:text-[#dfe2ef] hover:border-[#38bdf8]/40 border border-[#1e293b] w-64 text-left transition-all cursor-pointer group"
        >
          <span className="material-symbols-outlined text-[16px] text-[#87929a] group-hover:text-[#38bdf8] transition-colors">
            search
          </span>
          <span className="text-[11px] font-mono text-[#87929a] flex-1">
            Find event, pipeline, node...
          </span>
          <kbd className="text-[10px] font-mono px-1.5 py-0.5 bg-[#1c1f29] text-[#bdc8d1] rounded border border-[#3e484f]/40">
            ⌘K
          </kbd>
        </button>

        {/* Quick icon actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => window.open('https://cloud.google.com', '_blank')}
            className="w-8 h-8 rounded flex items-center justify-center text-[#bdc8d1] hover:text-[#dfe2ef] hover:bg-[#262a34] transition-colors cursor-pointer"
            title="Documentation"
          >
            <span className="material-symbols-outlined text-[18px]">menu_book</span>
          </button>
          <button
            onClick={onOpenNotifications}
            className="relative w-8 h-8 rounded flex items-center justify-center text-[#bdc8d1] hover:text-[#dfe2ef] hover:bg-[#262a34] transition-colors cursor-pointer"
            title="Alerts (1 active)"
          >
            <span className="material-symbols-outlined text-[18px]">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#93000a] ring-2 ring-[#0a0e17]"></span>
          </button>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-[#1e293b]"></div>

        {/* Profile */}
        <div className="flex items-center gap-2.5 pl-1">
          <div className="flex flex-col text-right">
            <span className="font-['Geist'] text-[13px] font-semibold text-[#dfe2ef] leading-tight">
              Alex Chen
            </span>
            <span className="text-[10px] font-mono text-[#87929a]">
              Platform Architect
            </span>
          </div>
          <img
            alt="Profile"
            className="w-8 h-8 rounded-full object-cover ring-1 ring-[#3e484f]/60 shadow-sm"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCvIkbLWUQDnXGCjJp3WrBss40dpr-MeX5xDSypLITLjDVi4HysMCsrmG_bPCPT2ioPr8oATKZ9x2qrDwhwqnLadUuqQFe3YRxp7ZEb9ytHrrSX1F7IFlEG-tDUQHP7UymFhU1K3U-fmZiK4ldnrvbTVSPHlsenIE1CkPXsOovZQw_vKU1joZ2TQZuyVVXzfz4rM5LhyhEcFY2ZA8zNBaCHBc3QEiXNrySeZC0bvKWVlsadZOctrBHIJQ"
          />
        </div>
      </div>
    </header>
  );
};
