import React, { useState, useRef, useEffect } from 'react';
import { AuditEvent, TraceSpan } from '../../types';
import { INITIAL_AUDIT_EVENTS, TRACE_SPANS } from '../../data/mockData';

interface EventLogViewProps {
  onShowToast: (title: string, description?: string, variant?: 'info' | 'success' | 'warning' | 'error') => void;
}

export const EventLogView: React.FC<EventLogViewProps> = ({ onShowToast }) => {
  const [events, setEvents] = useState<AuditEvent[]>(INITIAL_AUDIT_EVENTS);
  const [selectedEventId, setSelectedEventId] = useState<string>('EVT-90410');
  const [timeRange, setTimeRange] = useState<'15m' | '1h' | '6h' | '24h'>('15m');
  const [levelFilter, setLevelFilter] = useState<'ALL' | 'INFO' | 'WARN' | 'ERROR' | 'DEBUG'>('ALL');
  const [query, setQuery] = useState('service: order-fulfillment AND level: >=WARN');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);

  const eventListRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when new items arrive if autoScroll is enabled
  useEffect(() => {
    if (autoScroll && eventListRef.current) {
      eventListRef.current.scrollTop = 0;
    }
  }, [events, autoScroll]);

  // Simulate incoming live telemetry stream
  useEffect(() => {
    const liveStreamMessages = [
      {
        id: 'EVT-90413',
        timestamp: '14:24:12.809',
        level: 'INFO' as const,
        module: 'mesh::raft_heartbeat',
        message: 'Heartbeat acknowledged across 12 nodes (quorum: 12/12, latency=0.22ms).',
        seq: 90413,
      },
      {
        id: 'EVT-90414',
        timestamp: '14:24:16.140',
        level: 'DEBUG' as const,
        module: 'wal::commit_log',
        message: 'Synchronous fsync committed epoch #189,403 to nvme_raid0 ring buffer.',
        seq: 90414,
      },
    ];

    let timerIdx = 0;
    const interval = setInterval(() => {
      if (timerIdx < liveStreamMessages.length) {
        setEvents((prev) => [liveStreamMessages[timerIdx], ...prev]);
        timerIdx++;
      }
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  // Filter events
  const filteredEvents = events.filter((ev) => {
    if (levelFilter !== 'ALL' && ev.level !== levelFilter) return false;
    return true;
  });

  const handleCopyTraceJson = () => {
    const traceJson = {
      traceId: '8f9a2b10c9e8471a',
      spanId: '4d720fbc338a9012',
      callerIp: '10.240.18.94',
      clusterZone: 'us-east-2a',
      isolationTier: 'Strict Serializable',
      idempotencyKey: 'idem_99214_ff3a',
      spans: TRACE_SPANS,
    };
    navigator.clipboard.writeText(JSON.stringify(traceJson, null, 2));
    onShowToast('Trace JSON Copied', 'Distributed trace span copied to clipboard', 'info');
  };

  const handleExportLogs = () => {
    onShowToast(
      'Export Started',
      'Compressing 50,000 cached records into duraflow_audit_log.zst',
      'info'
    );
  };

  const handleCreateAlert = () => {
    onShowToast(
      'Alert Rule Created',
      'Alert triggered when Error Ratio exceeds 0.05% over 5m window.',
      'success'
    );
  };

  return (
    <div className="flex flex-col w-full min-h-[calc(100vh-56px)] bg-[#0f131c]">
      {/* Command Header & Telemetry Stat Strip */}
      <header className="w-full bg-[#0a0e17] px-6 py-4 flex flex-col gap-3 border-b border-[#1e293b] shadow-md relative z-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Title & Live Pulsing Indicator */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#1c1f29] border border-[#1e293b] flex items-center justify-center text-[#38bdf8] shadow-sm">
              <span className="material-symbols-outlined text-[20px]">receipt_long</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-['Geist'] text-[18px] font-bold text-[#dfe2ef]">
                  Telemetry, Event Streams &amp; Audit Logs
                </span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#38bdf8]/10 text-[#38bdf8] text-[10px] font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] animate-ping"></span>
                  Streaming (1,240 events/sec)
                </span>
                <span className="px-2 py-0.5 rounded bg-[#262a34] text-[#bdc8d1] text-[10px] font-mono">
                  Live Ticker ON
                </span>
              </div>
              <p className="text-[11px] font-mono text-[#87929a]">
                Deterministic append-only raft cluster events &amp; distributed OpenTelemetry spans
              </p>
            </div>
          </div>

          {/* Quick Action Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportLogs}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1c1f29] hover:bg-[#262a34] text-[#dfe2ef] border border-[#1e293b] text-[11px] font-mono shadow-sm transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-[#38bdf8]">download</span>
              <span>Export Log Dump (.zst)</span>
            </button>
            <button
              onClick={handleCreateAlert}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#38bdf8] text-[#001e2c] font-['Geist'] text-[12px] font-bold shadow-sm hover:bg-[#7bd0ff] transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">notification_add</span>
              <span>Create Alert Rule</span>
            </button>
          </div>
        </div>

        {/* Telemetry Histogram Sparkline Strip */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-1">
          {/* Ingress Rate */}
          <div className="bg-[#181b25] p-3 rounded-xl border border-[#1e293b] flex items-center justify-between shadow-sm">
            <div>
              <div className="text-[11px] font-mono text-[#87929a]">Ingress Rate</div>
              <div className="text-[22px] font-mono font-bold text-[#dfe2ef]">
                1.24k<span className="text-[11px] text-[#38bdf8]"> /s</span>
              </div>
            </div>
            <svg className="w-24 h-8 text-[#38bdf8]" fill="none" stroke="currentColor" viewBox="0 0 100 30">
              <path
                d="M0 25 L10 22 L20 24 L30 18 L40 19 L50 12 L60 16 L70 8 L80 14 L90 5 L100 9"
                strokeLinecap="round"
                strokeWidth="2"
              ></path>
              <path
                d="M0 25 L10 22 L20 24 L30 18 L40 19 L50 12 L60 16 L70 8 L80 14 L90 5 L100 9 V 30 H 0 Z"
                fill="currentColor"
                fillOpacity="0.12"
              ></path>
            </svg>
          </div>

          {/* Error Ratio */}
          <div className="bg-[#181b25] p-3 rounded-xl border border-[#1e293b] flex items-center justify-between shadow-sm">
            <div>
              <div className="text-[11px] font-mono text-[#87929a]">Error Ratio</div>
              <div className="text-[22px] font-mono font-bold text-[#ffb4ab]">0.08%</div>
            </div>
            <div className="flex items-end gap-1 h-8">
              <span className="w-2 h-2 rounded-xs bg-[#31353f]"></span>
              <span className="w-2 h-3 rounded-xs bg-[#31353f]"></span>
              <span className="w-2 h-5 rounded-xs bg-[#31353f]"></span>
              <span className="w-2 h-8 rounded-xs bg-[#ffb4ab]"></span>
              <span className="w-2 h-3 rounded-xs bg-[#31353f]"></span>
              <span className="w-2 h-2 rounded-xs bg-[#31353f]"></span>
            </div>
          </div>

          {/* P99 Ack Commit */}
          <div className="bg-[#181b25] p-3 rounded-xl border border-[#1e293b] flex items-center justify-between shadow-sm">
            <div>
              <div className="text-[11px] font-mono text-[#87929a]">P99 Ack Commit</div>
              <div className="text-[22px] font-mono font-bold text-[#38bdf8]">
                1.84<span className="text-[11px] text-[#87929a]"> ms</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-mono text-[#bdc8d1]">
              <span className="material-symbols-outlined text-[16px] text-[#38bdf8]">bolt</span>
              <span>In-memory sync</span>
            </div>
          </div>

          {/* Log Ring Buffer */}
          <div className="bg-[#181b25] p-3 rounded-xl border border-[#1e293b] flex items-center justify-between shadow-sm">
            <div>
              <div className="text-[11px] font-mono text-[#87929a]">Log Ring Buffer</div>
              <div className="text-[22px] font-mono font-bold text-[#dfe2ef]">
                64.2<span className="text-[11px] text-[#87929a]"> %</span>
              </div>
            </div>
            <div className="w-20 bg-[#262a34] rounded-full h-2 overflow-hidden">
              <div className="bg-[#f59e0b] h-2 rounded-full" style={{ width: '64.2%' }}></div>
            </div>
          </div>
        </div>
      </header>

      {/* Query & Filter Toolbar */}
      <div className="w-full bg-[#181b25] px-6 py-2.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border-b border-[#1e293b] shadow-inner">
        {/* Time Range Selector */}
        <div className="flex items-center gap-1 bg-[#1c1f29] rounded-lg p-1 border border-[#1e293b] text-[#dfe2ef]">
          {(['15m', '1h', '6h', '24h'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-2.5 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                timeRange === r
                  ? 'bg-[#38bdf8] text-[#001e2c] font-bold shadow-sm'
                  : 'text-[#bdc8d1] hover:bg-[#262a34]'
              }`}
            >
              {r}
            </button>
          ))}
          <span className="w-px h-3 bg-[#31353f]"></span>
          <button
            onClick={() => onShowToast('Custom Range', 'Select historical epoch or timestamp', 'info')}
            className="px-2 py-0.5 rounded hover:bg-[#262a34] text-[#87929a] hover:text-[#dfe2ef] flex items-center gap-1 text-[11px] font-mono cursor-pointer"
          >
            <span className="material-symbols-outlined text-[14px]">calendar_today</span>
            Custom
          </button>
        </div>

        {/* Log Level Filters */}
        <div className="flex items-center gap-1 bg-[#1c1f29] rounded-lg p-1 border border-[#1e293b]">
          <button
            onClick={() => setLevelFilter('ALL')}
            className={`px-2.5 py-0.5 rounded text-[10px] font-mono uppercase cursor-pointer ${
              levelFilter === 'ALL' ? 'bg-[#31353f] text-[#dfe2ef] font-bold' : 'text-[#87929a]'
            }`}
          >
            ALL
          </button>
          <button
            onClick={() => setLevelFilter('INFO')}
            className={`px-2.5 py-0.5 rounded text-[10px] font-mono uppercase flex items-center gap-1 transition-colors cursor-pointer ${
              levelFilter === 'INFO'
                ? 'bg-[#38bdf8]/30 text-[#38bdf8] font-bold'
                : 'text-[#38bdf8] hover:bg-[#38bdf8]/10'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]"></span>INFO
          </button>
          <button
            onClick={() => setLevelFilter('WARN')}
            className={`px-2.5 py-0.5 rounded text-[10px] font-mono uppercase flex items-center gap-1 transition-colors cursor-pointer ${
              levelFilter === 'WARN'
                ? 'bg-[#f59e0b]/30 text-[#ffc174] font-bold'
                : 'text-[#ffc174] hover:bg-[#f59e0b]/10'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#ffc174]"></span>WARN
          </button>
          <button
            onClick={() => setLevelFilter('ERROR')}
            className={`px-2.5 py-0.5 rounded text-[10px] font-mono uppercase flex items-center gap-1 transition-colors cursor-pointer ${
              levelFilter === 'ERROR'
                ? 'bg-[#93000a] text-[#ffdad6] font-bold'
                : 'text-[#ffb4ab] hover:bg-[#93000a]/20'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#ffb4ab]"></span>ERROR
          </button>
          <button
            onClick={() => setLevelFilter('DEBUG')}
            className={`px-2.5 py-0.5 rounded text-[10px] font-mono uppercase flex items-center gap-1 transition-colors cursor-pointer ${
              levelFilter === 'DEBUG'
                ? 'bg-[#31353f] text-[#dfe2ef] font-bold'
                : 'text-[#87929a] hover:bg-[#262a34]'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#87929a]"></span>DEBUG
          </button>
        </div>

        {/* Syntax Highlighted Query Bar */}
        <div className="flex-1 max-w-xl bg-[#0a0e17] rounded-lg px-3 py-1.5 flex items-center gap-2 border border-[#1e293b] shadow-inner font-mono text-[11px]">
          <span className="material-symbols-outlined text-[18px] text-[#38bdf8]">terminal</span>
          <div className="flex-1 flex items-center flex-wrap gap-1">
            <span className="text-[#38bdf8] font-bold">service:</span>
            <span className="text-[#ffc174]">order-fulfillment</span>
            <span className="text-[#c0c1ff] font-bold">AND</span>
            <span className="text-[#38bdf8] font-bold">level:</span>
            <span className="text-[#ffb4ab] font-bold">&gt;=WARN</span>
          </div>
          <button
            onClick={() => setQuery('')}
            className="text-[#87929a] hover:text-[#dfe2ef] transition-colors cursor-pointer"
            title="Clear filter"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
          <button
            onClick={() => onShowToast('Filter Applied', 'Stream matching live query', 'info')}
            className="bg-[#38bdf8]/20 text-[#38bdf8] hover:bg-[#38bdf8] hover:text-[#001e2c] rounded px-2 py-0.5 text-[10px] font-bold transition-colors cursor-pointer"
          >
            RUN
          </button>
        </div>
      </div>

      {/* Main Split Interface: Event Table & Waterfall Flamegraph Drawer */}
      <div className="w-full flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-210px)] bg-[#070a10]">
        {/* LEFT / CENTER: Chronological High-Density Terminal Event Log (7 Cols) */}
        <section className="lg:col-span-7 flex flex-col bg-[#0a0e17] border-r border-[#1e293b] overflow-hidden">
          {/* Table Column Headers */}
          <div className="h-9 bg-[#181b25] px-4 flex items-center gap-4 text-[10px] font-mono text-[#87929a] uppercase tracking-wider select-none border-b border-[#1e293b]">
            <span className="w-20">Timestamp</span>
            <span className="w-14 text-center">Level</span>
            <span className="w-36">Module / Scope</span>
            <span className="flex-1">Message Payload &amp; Structured Context</span>
            <span className="w-16 text-right">Sequence</span>
          </div>

          {/* Scrollable Event Stream */}
          <div
            ref={eventListRef}
            className="flex-1 overflow-y-auto divide-y divide-[#1e293b]/50 text-[#dfe2ef] text-[12px] font-mono"
          >
            {filteredEvents.map((ev) => {
              const isSelected = selectedEventId === ev.id;
              const isError = ev.level === 'ERROR';
              const isWarn = ev.level === 'WARN';
              const isInfo = ev.level === 'INFO';
              const isDebug = ev.level === 'DEBUG';

              return (
                <div
                  key={ev.id}
                  onClick={() => setSelectedEventId(ev.id)}
                  className={`flex items-start gap-4 px-4 py-2.5 transition-colors group cursor-pointer relative ${
                    isSelected
                      ? 'bg-[#181b25] border-l-2 border-[#38bdf8]'
                      : isError
                      ? 'bg-[#93000a]/15 hover:bg-[#93000a]/25'
                      : isWarn
                      ? 'bg-[#181b25]/40 hover:bg-[#181b25]'
                      : 'hover:bg-[#181b25]/70'
                  }`}
                >
                  {isError && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#ffb4ab]"></div>
                  )}

                  {/* Timestamp */}
                  <span
                    className={`w-20 text-[11px] pt-0.5 ${
                      isError ? 'text-[#ffb4ab] font-bold' : 'text-[#87929a]'
                    }`}
                  >
                    {ev.timestamp}
                  </span>

                  {/* Level Pill */}
                  <span className="w-14 flex justify-center">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        isError
                          ? 'bg-[#93000a] text-[#ffdad6]'
                          : isWarn
                          ? 'bg-[#f59e0b]/20 text-[#ffc174]'
                          : isInfo
                          ? 'bg-[#38bdf8]/10 text-[#38bdf8]'
                          : 'bg-[#262a34] text-[#87929a]'
                      }`}
                    >
                      {ev.level}
                    </span>
                  </span>

                  {/* Module Scope */}
                  <span
                    className={`w-36 text-[11px] truncate pt-0.5 ${
                      isError
                        ? 'text-[#ffb4ab] font-semibold'
                        : isWarn
                        ? 'text-[#ffc174]'
                        : isInfo
                        ? 'text-[#c0c1ff]'
                        : 'text-[#87929a]'
                    }`}
                  >
                    {ev.module}
                  </span>

                  {/* Message Payload */}
                  <div className="flex-1 min-w-0 text-[11px] text-[#dfe2ef] leading-relaxed">
                    <span>{ev.message}</span>
                    {ev.tags && ev.tags.length > 0 && (
                      <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                        {ev.tags.map((tag, tIdx) => (
                          <span
                            key={tIdx}
                            className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                              tag.variant === 'error'
                                ? 'bg-[#93000a]/30 text-[#ffb4ab] border border-[#93000a]/60'
                                : 'bg-[#1c1f29] text-[#87929a] border border-[#1e293b]'
                            }`}
                          >
                            {tag.label}:{tag.value}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Sequence */}
                  <span
                    className={`w-16 text-right text-[11px] ${
                      isError ? 'text-[#ffb4ab] font-bold' : 'text-[#87929a]'
                    }`}
                  >
                    #{ev.seq}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Live Terminal Footer Status */}
          <div className="h-8 bg-[#181b25] px-4 flex items-center justify-between text-[#87929a] text-[11px] font-mono border-t border-[#1e293b] shadow-sm">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#38bdf8] animate-pulse"></span>
                Tail Socket Connected
              </span>
              <span>Buffer: 5,000 / 50,000 cached</span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  setAutoScroll(!autoScroll);
                  onShowToast(
                    autoScroll ? 'Auto-Scroll Disabled' : 'Auto-Scroll Enabled',
                    'Terminal follow mode',
                    'info'
                  );
                }}
                className={`flex items-center gap-1 cursor-pointer ${
                  autoScroll ? 'text-[#38bdf8]' : 'text-[#87929a]'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">
                  vertical_align_bottom
                </span>
                <span>Auto-Scroll: {autoScroll ? 'ON' : 'OFF'}</span>
              </button>
            </div>
          </div>
        </section>

        {/* RIGHT: Trace Span Waterfall & Flamegraph Preview (5 Cols) */}
        <section className="lg:col-span-5 bg-[#0f131c] flex flex-col p-4 gap-4 overflow-y-auto">
          {/* Trace Header Card */}
          <div className="bg-[#181b25] rounded-xl p-4 flex flex-col gap-3 border border-[#1e293b] shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#38bdf8] text-[20px]">hub</span>
                <span className="font-['Geist'] text-[15px] font-bold text-[#dfe2ef]">
                  Trace Waterfall Inspector
                </span>
              </div>
              <span className="px-2 py-0.5 rounded bg-[#93000a] text-[#ffdad6] text-[10px] font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ffb4ab]"></span>
                Failed Span Attached
              </span>
            </div>

            <div className="bg-[#0a0e17] rounded-lg p-3 border border-[#1e293b] flex flex-col gap-1 font-mono">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#87929a] uppercase">Root Span</span>
                <span className="text-[12px] text-[#38bdf8] font-bold">
                  order-fulfillment-saga-v3
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#87929a] uppercase">Total Duration</span>
                <span className="text-[18px] text-[#ffc174] font-bold">840 ms</span>
              </div>
            </div>
          </div>

          {/* Waterfall Timeline Canvas */}
          <div className="bg-[#181b25] rounded-xl p-4 flex flex-col gap-3 border border-[#1e293b] shadow-md">
            <div className="flex items-center justify-between text-[#87929a] text-[10px] font-mono">
              <span>SPANS &amp; EXECUTION PATH</span>
              <span>LATENCY METRICS (0ms - 840ms)</span>
            </div>

            {/* Scale Rulers */}
            <div className="relative w-full h-4 bg-[#0a0e17] rounded flex justify-between px-2 text-[10px] font-mono text-[#87929a] border border-[#1e293b]">
              <span>0ms</span>
              <span>210ms</span>
              <span>420ms</span>
              <span>630ms</span>
              <span>840ms</span>
            </div>

            {/* Span Waterfall Rows */}
            <div className="flex flex-col gap-2.5 pt-1 font-mono">
              {TRACE_SPANS.map((span) => {
                const isError = span.status === 'error';
                const isAborted = span.status === 'aborted';
                const isRoot = span.id === 'span-root';

                let barColor = 'bg-[#38bdf8]/40 text-[#38bdf8]';
                if (isError) barColor = 'bg-[#93000a] text-[#ffdad6]';
                else if (isAborted) barColor = 'bg-[#31353f] text-[#87929a]';
                else if (span.name.includes('payment')) barColor = 'bg-[#f59e0b] text-[#001e2c]';
                else if (span.name.includes('db')) barColor = 'bg-[#38bdf8] text-[#001e2c]';
                else if (span.name.includes('auth')) barColor = 'bg-[#c0c1ff] text-[#001e2c]';

                return (
                  <div key={span.id} className={`flex flex-col gap-1 ${!isRoot ? 'pl-3' : ''}`}>
                    <div className="flex items-center justify-between text-[11px]">
                      <span
                        className={`flex items-center gap-1 font-medium ${
                          isError
                            ? 'text-[#ffb4ab] font-bold'
                            : isRoot
                            ? 'text-[#dfe2ef] font-bold'
                            : span.name.includes('payment')
                            ? 'text-[#ffc174] font-bold'
                            : 'text-[#bdc8d1]'
                        }`}
                      >
                        {!isRoot && (
                          <span
                            className={`material-symbols-outlined text-[13px] ${
                              isError ? 'text-[#ffb4ab]' : 'text-[#87929a]'
                            }`}
                          >
                            {isError ? 'error' : 'subdirectory_arrow_right'}
                          </span>
                        )}
                        <span>{span.name}</span>
                      </span>
                      <span
                        className={
                          isError
                            ? 'text-[#ffb4ab] font-bold'
                            : span.name.includes('payment')
                            ? 'text-[#ffc174] font-bold'
                            : 'text-[#87929a]'
                        }
                      >
                        {span.detail || `${span.durationMs}ms`}
                      </span>
                    </div>

                    <div className="w-full bg-[#0a0e17] h-3.5 rounded relative border border-[#1e293b]/50 overflow-hidden">
                      <div
                        className={`absolute top-0 bottom-0 rounded flex items-center px-1 text-[9px] font-bold ${barColor}`}
                        style={{
                          left: `${(span.startOffsetMs / 840) * 100}%`,
                          width: `${Math.max(span.percentage, 4)}%`,
                        }}
                      >
                        {isRoot && <span className="truncate">Root Dispatch</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Metadata Key-Value Inspection Box */}
          <div className="bg-[#181b25] rounded-xl p-4 flex flex-col gap-3 border border-[#1e293b] shadow-md font-mono">
            <div className="flex items-center justify-between">
              <span className="font-['Geist'] text-[14px] font-bold text-[#dfe2ef]">
                Span Context &amp; Metadata
              </span>
              <button
                onClick={handleCopyTraceJson}
                className="text-[#38bdf8] hover:underline text-[11px] flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px]">content_copy</span>
                Copy JSON
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="bg-[#0a0e17] p-2 rounded-lg border border-[#1e293b] flex flex-col">
                <span className="text-[#87929a] text-[9px] uppercase">Trace ID</span>
                <span className="text-[#38bdf8] truncate font-bold">8f9a2b10c9e8471a</span>
              </div>
              <div className="bg-[#0a0e17] p-2 rounded-lg border border-[#1e293b] flex flex-col">
                <span className="text-[#87929a] text-[9px] uppercase">Span ID</span>
                <span className="text-[#dfe2ef] truncate">4d720fbc338a9012</span>
              </div>
              <div className="bg-[#0a0e17] p-2 rounded-lg border border-[#1e293b] flex flex-col">
                <span className="text-[#87929a] text-[9px] uppercase">Caller IP</span>
                <span className="text-[#dfe2ef]">10.240.18.94</span>
              </div>
              <div className="bg-[#0a0e17] p-2 rounded-lg border border-[#1e293b] flex flex-col">
                <span className="text-[#87929a] text-[9px] uppercase">Cluster Zone</span>
                <span className="text-[#c0c1ff]">us-east-2a</span>
              </div>
              <div className="bg-[#0a0e17] p-2 rounded-lg border border-[#1e293b] flex flex-col">
                <span className="text-[#87929a] text-[9px] uppercase">Isolation Tier</span>
                <span className="text-[#dfe2ef]">Strict Serializable</span>
              </div>
              <div className="bg-[#0a0e17] p-2 rounded-lg border border-[#1e293b] flex flex-col">
                <span className="text-[#87929a] text-[9px] uppercase">Idempotency Key</span>
                <span className="text-[#ffc174] truncate">idem_99214_ff3a</span>
              </div>
            </div>

            {/* Error Stack Trace Mini-Terminal */}
            <div className="bg-[#0a0e17] rounded-lg p-3 border border-[#93000a]/40 flex flex-col gap-1 mt-1">
              <div className="flex items-center justify-between text-[#ffb4ab] text-[10px]">
                <span className="flex items-center gap-1 font-bold">
                  <span className="material-symbols-outlined text-[14px]">warning</span>
                  Stack Backtrace
                </span>
                <span className="text-[#87929a]">libcore/sync.rs:319</span>
              </div>
              <pre className="text-[11px] text-[#bdc8d1] overflow-x-auto whitespace-pre leading-relaxed pt-1">
{`0: runtime::inv_reservation::lock_sku
   at /src/saga/inventory.rs:184:13
1: tokio::time::timeout::Timeout::poll
   at /cargo/tokio-1.28/src/time/timeout.rs:88:9
2: duraflow_worker::dispatch_task
   at /src/worker/executor.rs:412:5`}
              </pre>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
