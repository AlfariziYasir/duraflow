import React, { useState, useEffect, useRef } from 'react';
import { DAGNode } from '../../types';
import { INITIAL_DAG_NODES } from '../../data/mockData';

interface ExecutionGraphViewProps {
  onWorkflowComplete?: () => void;
  onShowToast: (title: string, description?: string, variant?: 'info' | 'success' | 'warning' | 'error') => void;
}

export const ExecutionGraphView: React.FC<ExecutionGraphViewProps> = ({
  onShowToast,
}) => {
  const [nodes, setNodes] = useState<DAGNode[]>(INITIAL_DAG_NODES);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('node-5');
  const [activeTab, setActiveTab] = useState<'graph' | 'timeline' | 'json'>('graph');
  const [scale, setScale] = useState<number>(0.92);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: -180, y: 10 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [autoPan, setAutoPan] = useState<boolean>(true);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([
    '[14:22:04.220] worker daemon spawned thread PID: 94102',
    "[14:22:04.301] acquired lock on resource 'rack_c14_nv'",
    '[14:22:05.109] scanning barcode serials for SKU-GPU-H100-SXM5...',
    '[14:22:07.412] items reserved: [SN-88402, SN-88403, SN-88404, SN-88405]',
    '[14:22:15.890] scanning 16x optic transceivers in bin E-02...',
    '[14:22:46.012] awaiting hardware verification ACK from scanner gateway...',
  ]);

  const canvasRef = useRef<HTMLDivElement>(null);
  const logTerminalRef = useRef<HTMLDivElement>(null);

  // Auto append real-time telemetry log messages
  useEffect(() => {
    if (isPaused) return;
    const additionalMessages = [
      '[14:22:48.431] warehouse sensor handshake acknowledged (node #w-88)',
      '[14:22:51.109] physical barcode match: SN-OPT-44192',
      '[14:22:54.004] reserving lock on staging conveyor lane #04',
      '[14:22:56.219] optimistic concurrency fence checked (epoch seq #189,403)',
      '[14:22:58.784] committing intermediate saga state to persistent store',
      '[14:23:01.112] verification checksum validated (SHA256: 9f8a...c021)',
      '[14:23:03.490] releasing optimistic staging mutex to downstream workers',
    ];

    let index = 0;
    const interval = setInterval(() => {
      if (index < additionalMessages.length) {
        setLogs((prev) => [...prev, additionalMessages[index]]);
        index++;
        if (logTerminalRef.current) {
          logTerminalRef.current.scrollTop = logTerminalRef.current.scrollHeight;
        }
      }
    }, 4500);

    return () => clearInterval(interval);
  }, [isPaused]);

  // Mouse pan handling
  const handleMouseDown = (e: React.MouseEvent) => {
    // If clicking directly on a node card, don't drag canvas
    if ((e.target as HTMLElement).closest('.dag-node-card')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.05 : 0.95;
    setScale((prev) => Math.min(Math.max(0.4, prev * zoomFactor), 2.2));
  };

  // Zoom controls
  const zoomIn = () => setScale((prev) => Math.min(prev * 1.15, 2.2));
  const zoomOut = () => setScale((prev) => Math.max(prev * 0.85, 0.4));
  const zoomFit = () => {
    setScale(0.85);
    setPan({ x: -260, y: 10 });
    onShowToast('Canvas centered and aligned to active viewport', 'fit_screen');
  };

  // Current selected node
  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || nodes[4];

  // Actions
  const handleStepOver = () => {
    onShowToast('Step Over dispatched', 'Stepping into next sub-routine turn (#189,403)');
  };

  const handleRetryStep = () => {
    onShowToast('Step Retry Armed', 'Invalidating step cache and resetting lease', 'warning');
  };

  const handleTogglePause = () => {
    setIsPaused(!isPaused);
    onShowToast(
      isPaused ? 'Workflow Resumed' : 'Workflow Paused',
      isPaused ? 'Active turns dispatching normally' : 'Deterministic turns frozen on current epoch',
      isPaused ? 'info' : 'warning'
    );
  };

  const handleForceComplete = () => {
    setNodes((prev) =>
      prev.map((node) => {
        if (node.id === 'node-5') {
          return {
            ...node,
            status: 'completed',
            type: 'COMPLETED',
            durationText: '48s (Done)',
            detail: 'Committed',
          };
        }
        if (node.id === 'node-6') {
          return {
            ...node,
            status: 'running',
            type: 'IN PROGRESS',
            durationText: '0s elapsed',
            detail: 'Dispatching...',
          };
        }
        return node;
      })
    );
    setSelectedNodeId('node-6');
    onShowToast('InventoryReservation Completed', 'Step 5 atomic commit succeeded. Step 6 queued.', 'success');
  };

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(JSON.stringify(selectedNode.payload || {}, null, 2));
    onShowToast('Payload Copied', 'JSON copied to system clipboard', 'info');
  };

  return (
    <div className="flex flex-col w-full h-[calc(100vh-56px)] overflow-hidden bg-[#0a0e17]">
      {/* Dynamic Overhead Sub-Header: Context & Operational Telemetry */}
      <div className="w-full bg-[#0a0e17] px-6 py-2.5 flex flex-wrap items-center justify-between gap-4 border-b border-[#1e293b] shadow-sm z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#1c1f29] border border-[#1e293b] flex items-center justify-center text-[#38bdf8] shadow-inner">
            <span className="material-symbols-outlined text-[20px]">account_tree</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-['Geist'] text-[16px] font-bold text-[#dfe2ef] tracking-tight">
                order-fulfillment-saga-v3
              </span>
              <span className="px-1.5 py-0.5 rounded bg-[#1c1f29] text-[#8ed5ff] text-[11px] font-mono border border-[#3e484f]/30">
                #run-89f412-a7e
              </span>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#38bdf8]/15 text-[#38bdf8] text-[11px] font-mono font-semibold">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#38bdf8] animate-ping"></span>
                RUNNING (Step 5 of 7)
              </span>
            </div>
            <div className="flex items-center gap-2 text-[#87929a] text-[11px] font-mono">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px] text-[#38bdf8]">bolt</span>
                Triggered via webhook • 14:22:04.188 UTC
              </span>
              <span className="text-[#31353f]">•</span>
              <span>Initiator: service-gateway-ingress</span>
              <span className="text-[#31353f]">•</span>
              <span className="text-[#8ed5ff]">Epoch: #189,402</span>
            </div>
          </div>
        </div>

        {/* Cluster Diagnostics Inline Ticker */}
        <div className="flex items-center gap-4 bg-[#181b25] px-3.5 py-1.5 rounded-xl border border-[#1e293b] shadow-inner">
          <div className="flex flex-col">
            <span className="text-[9px] font-mono text-[#87929a] uppercase tracking-wider">
              Turn Duration
            </span>
            <span className="text-[14px] font-mono font-bold text-[#dfe2ef] tabular-nums">
              1.48s
            </span>
          </div>
          <div className="w-px h-6 bg-[#262a34]"></div>
          <div className="flex flex-col">
            <span className="text-[9px] font-mono text-[#87929a] uppercase tracking-wider">
              Sync Quorum
            </span>
            <span className="text-[11px] font-mono text-[#c0c1ff] font-semibold">
              3 / 3 ACK
            </span>
          </div>
          <div className="w-px h-6 bg-[#262a34]"></div>
          <div className="flex flex-col">
            <span className="text-[9px] font-mono text-[#87929a] uppercase tracking-wider">
              Worker Slot
            </span>
            <span className="text-[11px] font-mono text-[#38bdf8]">
              worker-us-east-88a
            </span>
          </div>
        </div>
      </div>

      {/* Command & Control Canvas Action Toolbar */}
      <div className="w-full bg-[#181b25]/80 px-6 py-1.5 flex items-center justify-between gap-4 border-b border-[#1e293b] shadow-sm z-20">
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center bg-[#0a0e17] p-0.5 rounded-lg border border-[#1e293b] shadow-inner">
            <button
              onClick={zoomIn}
              className="w-7 h-7 rounded flex items-center justify-center text-[#bdc8d1] hover:text-[#dfe2ef] hover:bg-[#1c1f29] transition-colors cursor-pointer"
              title="Zoom In"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
            </button>
            <button
              onClick={zoomOut}
              className="w-7 h-7 rounded flex items-center justify-center text-[#bdc8d1] hover:text-[#dfe2ef] hover:bg-[#1c1f29] transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <span className="material-symbols-outlined text-[16px]">remove</span>
            </button>
            <button
              onClick={zoomFit}
              className="px-2 h-7 rounded flex items-center gap-1 text-[#bdc8d1] hover:text-[#dfe2ef] hover:bg-[#1c1f29] text-[11px] font-mono transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">fit_screen</span>
              <span>Zoom to Fit</span>
            </button>
          </div>

          {/* Autopan toggle */}
          <button
            onClick={() => {
              setAutoPan(!autoPan);
              onShowToast(autoPan ? 'Auto-pan Disabled' : 'Auto-pan Enabled', 'Camera tracking active execution node', 'info');
            }}
            className={`flex items-center gap-1.5 px-3 h-7 rounded-lg border text-[11px] font-mono transition-all cursor-pointer ${
              autoPan
                ? 'bg-[#1c1f29] text-[#38bdf8] border-[#38bdf8]/40 shadow-sm'
                : 'bg-[#181b25] text-[#87929a] border-[#1e293b]'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                autoPan ? 'bg-[#38bdf8] animate-pulse' : 'bg-[#87929a]'
              }`}
            ></span>
            <span>Live Auto-pan: {autoPan ? 'ON' : 'OFF'}</span>
          </button>

          <div className="h-4 w-px bg-[#262a34]"></div>

          {/* Execution Navigation Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleStepOver}
              className="flex items-center gap-1 px-2.5 h-7 rounded bg-[#262a34] hover:bg-[#31353f] text-[#dfe2ef] text-[11px] font-mono transition-colors border border-[#3e484f] shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px] text-[#38bdf8]">redo</span>
              <span>Step Over</span>
            </button>
            <button
              onClick={handleRetryStep}
              className="flex items-center gap-1 px-2.5 h-7 rounded bg-[#262a34] hover:bg-[#31353f] text-[#dfe2ef] text-[11px] font-mono transition-colors border border-[#3e484f] shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px] text-[#ffc174]">replay</span>
              <span>Retry Step</span>
            </button>
            <button
              onClick={handleTogglePause}
              className={`flex items-center gap-1 px-2.5 h-7 rounded text-[11px] font-mono transition-colors border shadow-sm cursor-pointer ${
                isPaused
                  ? 'bg-[#f59e0b]/20 text-[#ffc174] border-[#f59e0b]/40'
                  : 'bg-[#262a34] hover:bg-[#93000a] hover:text-[#ffdad6] text-[#dfe2ef] border-[#3e484f]'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">
                {isPaused ? 'play_circle' : 'pause_circle'}
              </span>
              <span>{isPaused ? 'Resume Workflow' : 'Pause Workflow'}</span>
            </button>
          </div>
        </div>

        {/* Right view switcher */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onShowToast('Snapshot Exported', 'WAL checkpoint saved to dura_snapshot_89f412.json', 'success')}
            className="flex items-center gap-1.5 px-3 h-7 rounded bg-[#0a0e17] hover:bg-[#1c1f29] text-[#bdc8d1] hover:text-[#dfe2ef] text-[11px] font-mono transition-colors border border-[#1e293b] shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[15px]">data_object</span>
            <span>Download Snapshot</span>
          </button>

          <div className="flex items-center bg-[#0a0e17] p-0.5 rounded-lg border border-[#1e293b] shadow-inner">
            <button
              onClick={() => setActiveTab('graph')}
              className={`px-2.5 h-6 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                activeTab === 'graph'
                  ? 'bg-[#262a34] text-[#38bdf8] font-bold shadow-sm'
                  : 'text-[#bdc8d1] hover:text-[#dfe2ef]'
              }`}
            >
              Graph View
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-2.5 h-6 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                activeTab === 'timeline'
                  ? 'bg-[#262a34] text-[#38bdf8] font-bold shadow-sm'
                  : 'text-[#bdc8d1] hover:text-[#dfe2ef]'
              }`}
            >
              Timeline
            </button>
            <button
              onClick={() => setActiveTab('json')}
              className={`px-2.5 h-6 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                activeTab === 'json'
                  ? 'bg-[#262a34] text-[#38bdf8] font-bold shadow-sm'
                  : 'text-[#bdc8d1] hover:text-[#dfe2ef]'
              }`}
            >
              JSON Tree
            </button>
          </div>
        </div>
      </div>

      {/* Primary Workspace: Split Canvas & Inspector Sidebar */}
      <div className="relative w-full flex-1 flex overflow-hidden">
        {/* Canvas or alternate tab view */}
        {activeTab === 'graph' ? (
          <div
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel}
            className="relative flex-1 h-full overflow-hidden bg-[#070a10] select-none cursor-grab active:cursor-grabbing"
          >
            {/* Blueprint grid visuals */}
            <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(#1f293d_1px,transparent_1px)] [background-size:24px_24px]"></div>
            <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-[#38bdf8]/5 blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-20 left-1/3 w-80 h-80 rounded-full bg-[#3131c0]/10 blur-3xl pointer-events-none"></div>

            {/* Floating Coordinate Badge */}
            <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 px-3 py-1 rounded bg-[#0a0e17]/80 backdrop-blur-md border border-[#1e293b] shadow-md text-[#87929a] text-[11px] font-mono">
              <span>
                Offset: (X: {Math.round(pan.x)}, Y: {Math.round(pan.y)})
              </span>
              <span className="text-[#31353f]">|</span>
              <span className="text-[#38bdf8]">Zoom: {Math.round(scale * 100)}%</span>
              <span className="text-[#31353f]">|</span>
              <span>Engine: WebGL-Accelerated</span>
            </div>

            {/* Minimap Mini HUD */}
            <div className="absolute top-4 right-4 z-20 w-44 h-28 bg-[#0a0e17]/90 backdrop-blur-lg rounded-xl p-2.5 border border-[#1e293b] shadow-xl flex flex-col justify-between">
              <div className="flex items-center justify-between text-[#87929a] text-[10px] font-mono">
                <span>DAG OVERVIEW</span>
                <span className="text-[#38bdf8]">7 NODES</span>
              </div>
              <div className="relative w-full h-16 bg-[#181b25] rounded overflow-hidden border border-[#1e293b]">
                <div className="absolute top-3 left-2 w-3 h-1.5 bg-[#10b981] rounded-xs"></div>
                <div className="absolute top-5 left-8 w-3 h-1.5 bg-[#10b981] rounded-xs"></div>
                <div className="absolute top-2 left-16 w-3 h-1.5 bg-[#10b981] rounded-xs"></div>
                <div className="absolute top-8 left-16 w-3 h-1.5 bg-[#10b981] rounded-xs"></div>
                <div className="absolute top-5 left-24 w-3 h-1.5 bg-[#10b981] rounded-xs"></div>
                <div className="absolute top-5 left-32 w-3.5 h-2 bg-[#38bdf8] animate-pulse rounded-xs"></div>
                <div className="absolute top-5 left-38 w-3 h-1.5 bg-[#3e484f] rounded-xs"></div>
                {/* Viewport rectangle tracker */}
                <div className="absolute top-2 left-20 w-16 h-12 border border-[#38bdf8] bg-[#38bdf8]/20 rounded shadow-sm"></div>
              </div>
              <div className="flex justify-between items-center text-[#87929a] text-[10px] font-mono">
                <span className="text-[#10b981]">5 Complete</span>
                <span className="text-[#38bdf8]">1 Active</span>
              </div>
            </div>

            {/* Transform Layer for Pan & Zoom */}
            <div
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
                transformOrigin: 'top left',
                transition: isDragging ? 'none' : 'transform 75ms ease-out',
              }}
              className="absolute inset-0 w-full h-full flex items-center"
            >
              {/* Connecting SVG Dynamic Flow Lines */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ minWidth: '2200px', minHeight: '800px' }}
              >
                <defs>
                  <linearGradient id="glow-complete" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.9"></stop>
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.9"></stop>
                  </linearGradient>
                  <linearGradient id="glow-running" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981"></stop>
                    <stop offset="100%" stopColor="#38bdf8"></stop>
                  </linearGradient>
                  <filter id="cyan-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur"></feGaussianBlur>
                    <feComposite in="SourceGraphic" in2="blur" operator="over"></feComposite>
                  </filter>
                </defs>

                {/* Node 1 -> Node 2 */}
                <path
                  d="M 230 350 L 320 350"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                ></path>

                {/* Node 2 -> Node 3A (Upward branch) */}
                <path
                  d="M 520 350 C 570 350, 560 230, 620 230"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                ></path>

                {/* Node 2 -> Node 3B (Downward branch) */}
                <path
                  d="M 520 350 C 570 350, 560 470, 620 470"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                ></path>

                {/* Node 3A -> Node 4 (Converge from top) */}
                <path
                  d="M 820 230 C 870 230, 860 350, 920 350"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                ></path>

                {/* Node 3B -> Node 4 (Converge from bottom) */}
                <path
                  d="M 820 470 C 870 470, 860 350, 920 350"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                ></path>

                {/* Node 4 -> Node 5 (Payment to Active Running Inventory Node) */}
                <path
                  id="path-active-edge"
                  d="M 1120 350 L 1220 350"
                  fill="none"
                  stroke="url(#glow-running)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  filter="url(#cyan-glow)"
                ></path>

                {/* Animated flow particle */}
                <circle r="4" fill="#38bdf8" filter="url(#cyan-glow)">
                  <animateMotion
                    dur="1.2s"
                    repeatCount="indefinite"
                    path="M 1120 350 L 1220 350"
                  ></animateMotion>
                </circle>

                {/* Node 5 -> Node 6 (Active to Pending Step 6) */}
                <path
                  d="M 1440 350 L 1530 350"
                  fill="none"
                  stroke="#31353f"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  strokeLinecap="round"
                ></path>

                {/* Node 6 -> Node 7 (Pending Step 6 to Step 7) */}
                <path
                  d="M 1730 350 L 1830 350"
                  fill="none"
                  stroke="#31353f"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  strokeLinecap="round"
                ></path>
              </svg>

              {/* Render Nodes */}
              {nodes.map((node) => {
                const isSelected = selectedNodeId === node.id;
                const isRunning = node.status === 'running';
                const isCompleted = node.status === 'completed';
                const isQueued = node.status === 'queued';

                return (
                  <div
                    key={node.id}
                    onClick={() => setSelectedNodeId(node.id)}
                    style={{
                      left: `${node.x}px`,
                      top: `${node.y}px`,
                      width: `${node.width}px`,
                    }}
                    className={`dag-node-card absolute rounded-xl p-3.5 transition-all cursor-pointer select-none group border ${
                      isSelected
                        ? 'border-[#38bdf8] ring-2 ring-[#38bdf8]/40 shadow-[0_0_28px_rgba(56,189,248,0.35)]'
                        : isRunning
                        ? 'bg-[#1c1f29] border-[#38bdf8]/50 shadow-[0_0_24px_rgba(56,189,248,0.2)]'
                        : isCompleted
                        ? 'bg-[#181b25] border-[#1e293b] shadow-md hover:border-[#10b981]/50'
                        : 'bg-[#181b25]/60 border-[#1e293b] opacity-60 hover:opacity-100'
                    }`}
                  >
                    {/* Active pulse left stripe */}
                    {isRunning && (
                      <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-[#38bdf8] rounded-l-xl animate-pulse"></div>
                    )}
                    {isCompleted && (
                      <div className="absolute top-0 left-0 bottom-0 w-1 bg-[#10b981] rounded-l-xl"></div>
                    )}

                    <div className="flex items-center justify-between mb-1 pl-1">
                      <span
                        className="flex items-center gap-1 text-[11px] font-mono font-bold"
                        style={{ color: node.typeColor }}
                      >
                        {isRunning && (
                          <span className="material-symbols-outlined text-[15px] animate-spin">
                            sync
                          </span>
                        )}
                        {isCompleted && (
                          <span className="material-symbols-outlined text-[15px]">
                            {node.id === 'node-1'
                              ? 'input'
                              : node.id === 'node-2'
                              ? 'verified_user'
                              : node.id === 'node-3a'
                              ? 'credit_score'
                              : node.id === 'node-3b'
                              ? 'psychology'
                              : 'payments'}
                          </span>
                        )}
                        {isQueued && (
                          <span className="material-symbols-outlined text-[15px]">
                            {node.id === 'node-6' ? 'warehouse' : 'mark_email_read'}
                          </span>
                        )}
                        <span>{node.type}</span>
                      </span>

                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold ${
                          isRunning
                            ? 'bg-[#38bdf8]/20 text-[#38bdf8]'
                            : isCompleted
                            ? 'bg-[#10b981]/15 text-[#10b981]'
                            : 'bg-[#1c1f29] text-[#87929a]'
                        }`}
                      >
                        {node.durationText}
                      </span>
                    </div>

                    <div className="pl-1 font-['Geist'] text-[13px] font-semibold text-[#dfe2ef] truncate">
                      {node.title}
                    </div>

                    <div className="pl-1 mt-2 flex items-center justify-between text-[#87929a] text-[11px] font-mono">
                      <span>{node.seqText}</span>
                      <span
                        className={`flex items-center gap-1 ${
                          isCompleted
                            ? 'text-[#10b981]'
                            : isRunning
                            ? 'text-[#38bdf8]'
                            : 'text-[#87929a]'
                        }`}
                      >
                        {isCompleted && (
                          <span className="material-symbols-outlined text-[13px]">
                            check_circle
                          </span>
                        )}
                        <span>{node.detail}</span>
                      </span>
                    </div>

                    {/* Running node progress bar */}
                    {isRunning && (
                      <div className="w-full bg-[#31353f] h-1 rounded-full overflow-hidden mt-2 ml-1">
                        <div className="bg-[#38bdf8] h-full w-3/4 animate-pulse"></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : activeTab === 'timeline' ? (
          <div className="flex-1 p-6 overflow-y-auto bg-[#070a10]">
            <h3 className="text-[16px] font-['Geist'] font-bold text-[#dfe2ef] mb-4">
              Deterministic Step Execution Timeline
            </h3>
            <div className="relative border-l border-[#1e293b] ml-4 pl-6 space-y-6">
              {nodes.map((node, i) => (
                <div
                  key={node.id}
                  onClick={() => setSelectedNodeId(node.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    selectedNodeId === node.id
                      ? 'bg-[#1c1f29] border-[#38bdf8]'
                      : 'bg-[#181b25] border-[#1e293b]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[14px] font-['Geist'] font-bold text-[#dfe2ef]">
                      Step {i + 1}: {node.title}
                    </span>
                    <span
                      className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${
                        node.status === 'completed'
                          ? 'bg-[#10b981]/20 text-[#10b981]'
                          : node.status === 'running'
                          ? 'bg-[#38bdf8]/20 text-[#38bdf8]'
                          : 'bg-[#1c1f29] text-[#87929a]'
                      }`}
                    >
                      {node.status.toUpperCase()} ({node.durationText})
                    </span>
                  </div>
                  <div className="text-[12px] font-mono text-[#87929a]">
                    Assigned Worker Node: {node.workerNode || 'unassigned'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 p-6 overflow-y-auto bg-[#070a10] font-mono text-[12px]">
            <h3 className="text-[16px] font-['Geist'] font-bold text-[#dfe2ef] mb-2">
              Saga Orchestration State Tree (DAG JSON)
            </h3>
            <pre className="p-4 bg-[#0a0e17] rounded-xl border border-[#1e293b] text-[#8ed5ff] overflow-x-auto leading-relaxed">
              {JSON.stringify(
                {
                  workflowId: 'order-fulfillment-saga-v3',
                  runEpoch: '#189,402',
                  status: 'RUNNING',
                  nodes: nodes.map((n) => ({
                    id: n.id,
                    title: n.title,
                    status: n.status,
                    worker: n.workerNode,
                    payload: n.payload,
                  })),
                },
                null,
                2
              )}
            </pre>
          </div>
        )}

        {/* Right-Docked High Density Step Inspector Panel */}
        <div className="w-[430px] h-full bg-[#0a0e17] border-l border-[#1e293b] shadow-2xl flex flex-col z-30 overflow-hidden">
          {/* Inspector Header */}
          <div className="p-4 bg-[#181b25]/80 border-b border-[#1e293b] flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#38bdf8]/20 text-[#38bdf8] flex items-center justify-center border border-[#38bdf8]/30">
                <span className="material-symbols-outlined text-[18px]">tune</span>
              </div>
              <div className="flex flex-col truncate">
                <span className="text-[10px] font-mono text-[#87929a] uppercase tracking-wider font-semibold">
                  Step Inspector (Selected)
                </span>
                <span className="font-['Geist'] text-[15px] font-bold text-[#dfe2ef] truncate">
                  {selectedNode.title}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onShowToast('Step Reloaded', 'Latest raft memory cache pulled', 'info')}
                className="w-7 h-7 rounded flex items-center justify-center text-[#87929a] hover:text-[#dfe2ef] hover:bg-[#1c1f29] transition-colors cursor-pointer"
                title="Refresh step"
              >
                <span className="material-symbols-outlined text-[16px]">refresh</span>
              </button>
            </div>
          </div>

          {/* Inspector Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 font-mono">
            {/* Configuration Meta Grid */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-lg bg-[#181b25] border border-[#1e293b] shadow-sm">
                <span className="text-[10px] text-[#87929a] block uppercase">Node ID</span>
                <span className="text-[11px] text-[#38bdf8] font-bold">
                  task_{selectedNode.id.replace('-', '_')}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#181b25] border border-[#1e293b] shadow-sm">
                <span className="text-[10px] text-[#87929a] block uppercase">Lease Expiry</span>
                <span className="text-[11px] text-[#ffc174] font-semibold">
                  18s remaining (60s total)
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#181b25] border border-[#1e293b] shadow-sm col-span-2">
                <span className="text-[10px] text-[#87929a] block uppercase">Retry Strategy</span>
                <span className="text-[11px] text-[#dfe2ef]">
                  ExponentialBackoff (max=5, factor=2.0, jitter=0.1)
                </span>
              </div>
            </div>

            {/* Live Worker Node Telemetry */}
            <div className="p-3.5 rounded-xl bg-[#181b25] border border-[#1e293b] shadow-md">
              <div className="flex items-center justify-between mb-2">
                <span className="font-['Geist'] text-[13px] text-[#dfe2ef] font-semibold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-[#38bdf8]">dns</span>
                  <span>Worker Node Telemetry</span>
                </span>
                <span className="px-1.5 py-0.5 rounded bg-[#1c1f29] text-[#38bdf8] text-[10px] border border-[#1e293b]">
                  10.24.12.92
                </span>
              </div>

              <div className="space-y-2">
                <div>
                  <div className="flex items-center justify-between text-[#87929a] text-[11px]">
                    <span>CPU Core Utilization</span>
                    <span className="text-[#dfe2ef] font-semibold">34.8%</span>
                  </div>
                  <div className="w-full bg-[#31353f] h-1 rounded-full overflow-hidden mt-1">
                    <div className="bg-[#38bdf8] h-full w-[35%]"></div>
                  </div>
                </div>

                <div className="pt-1">
                  <div className="flex items-center justify-between text-[#87929a] text-[11px]">
                    <span>Memory Footprint</span>
                    <span className="text-[#dfe2ef] font-semibold">214 MB / 1024 MB</span>
                  </div>
                  <div className="w-full bg-[#31353f] h-1 rounded-full overflow-hidden mt-1">
                    <div className="bg-[#c0c1ff] h-full w-[21%]"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Input Payload Section */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="font-['Geist'] text-[13px] text-[#dfe2ef] font-semibold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-[#c0c1ff]">
                    input
                  </span>
                  <span>Live Input Payload</span>
                </span>
                <button
                  onClick={handleCopyPayload}
                  className="text-[11px] text-[#38bdf8] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[13px]">content_copy</span>
                  <span>Copy</span>
                </button>
              </div>

              <div className="bg-[#070a10] border border-[#1e293b] rounded-xl p-3 shadow-inner overflow-x-auto max-h-48">
                <pre className="text-[11px] text-[#dfe2ef] leading-relaxed">
                  <code>{JSON.stringify(selectedNode.payload || {}, null, 2)}</code>
                </pre>
              </div>
            </div>

            {/* Live Worker Output Log Stream with Animated Ticker */}
            <div className="flex flex-col gap-1 flex-1">
              <div className="flex items-center justify-between">
                <span className="font-['Geist'] text-[13px] text-[#dfe2ef] font-semibold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-[#ffc174]">
                    terminal
                  </span>
                  <span>Worker Output Stream</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] animate-ping"></span>
                  <span className="text-[10px] text-[#38bdf8] uppercase font-bold">
                    Live Stream
                  </span>
                </div>
              </div>

              <div
                ref={logTerminalRef}
                className="bg-[#070a10] border border-[#1e293b] rounded-xl p-3 h-44 overflow-y-auto text-[11px] flex flex-col gap-1 shadow-inner"
              >
                {logs.map((log, idx) => {
                  const isSuccess = log.includes('reserved') || log.includes('acknowledged');
                  const isHighlight = log.includes('awaiting') || log.includes('committing');
                  return (
                    <div
                      key={idx}
                      className={
                        isSuccess
                          ? 'text-[#10b981]'
                          : isHighlight
                          ? 'text-[#38bdf8] animate-pulse'
                          : 'text-[#87929a]'
                      }
                    >
                      {log}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Inspector Footer Actions */}
          <div className="p-4 bg-[#181b25]/80 border-t border-[#1e293b] flex items-center justify-between">
            <button
              onClick={() => onShowToast('State Dumped', 'Memory dump exported to log journal', 'info')}
              className="px-3.5 py-1.5 rounded-lg bg-[#262a34] hover:bg-[#31353f] text-[#dfe2ef] font-['Geist'] text-[13px] transition-colors border border-[#3e484f] shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">file_download</span>
              <span>Dump State</span>
            </button>
            <button
              onClick={handleForceComplete}
              className="px-4 py-1.5 rounded-lg bg-[#38bdf8] text-[#001e2c] font-['Geist'] text-[13px] font-bold shadow-md hover:bg-[#7bd0ff] transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">fast_forward</span>
              <span>Force Complete</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
