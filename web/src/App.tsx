import { useState, useEffect, useCallback } from 'react';
import { NavigationPath, WorkflowItem, WorkerNode } from './types';
import { INITIAL_WORKFLOWS, INITIAL_WORKER_NODES } from './data/mockData';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { WorkflowsView } from './components/views/WorkflowsView';
import { ExecutionGraphView } from './components/views/ExecutionGraphView';
import { NodesWorkersView } from './components/views/NodesWorkersView';
import { EventLogView } from './components/views/EventLogView';
import { SettingsView } from './components/views/SettingsView';
import { Toast, ToastMessage } from './components/common/Toast';
import { CommandPalette } from './components/common/CommandPalette';
import { NewWorkflowModal } from './components/common/NewWorkflowModal';
import { ProvisionWorkerModal } from './components/common/ProvisionWorkerModal';

export default function App() {
  const [currentPath, setCurrentPath] = useState<NavigationPath>('workflows');
  const [workflows, setWorkflows] = useState<WorkflowItem[]>(INITIAL_WORKFLOWS);
  const [nodes, setNodes] = useState<WorkerNode[]>(INITIAL_WORKER_NODES);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isNewWorkflowOpen, setIsNewWorkflowOpen] = useState(false);
  const [isProvisionWorkerOpen, setIsProvisionWorkerOpen] = useState(false);
  const [brokerSeq, setBrokerSeq] = useState(891204);
  const [clusterName, setClusterName] = useState('us-east-cluster-primary');

  // Helper to trigger toasts
  const addToast = useCallback(
    (
      title: string,
      description?: string,
      variant: 'info' | 'success' | 'warning' | 'error' = 'info',
      icon?: string
    ) => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, title, description, variant, icon }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4200);
    },
    []
  );

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Global hotkeys (e.g. ⌘K, ⌘L)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        setCurrentPath('event-logs');
        addToast('Switched to Event Logs (⌘L)', 'Viewing high-density audit traces', 'info');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [addToast]);

  // Live ticking monotonic sequence
  useEffect(() => {
    const timer = setInterval(() => {
      setBrokerSeq((prev) => prev + Math.floor(Math.random() * 3 + 1));
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Handlers for workflows
  const handleInspectWorkflow = (workflowId: string) => {
    setCurrentPath('execution-graph');
    addToast(
      'Inspecting DAG Visualizer',
      `Focused on active execution trace for ${workflowId}`,
      'info',
      'account_tree'
    );
  };

  const handleCreateWorkflow = (wfData: Partial<WorkflowItem>) => {
    const newWf: WorkflowItem = {
      id: `wf_${Math.floor(89410 + Math.random() * 100)}`,
      codeId: `#wf_${Math.floor(89410 + Math.random() * 100)}`,
      name: wfData.name || 'custom-pipeline',
      stepFlow: wfData.stepFlow || 'Step 1: Initializing → MutexLease',
      stepCurrent: 1,
      stepTotal: wfData.stepTotal || 5,
      state: 'RUNNING',
      stateDetail: wfData.stateDetail || 'Fenced Monotonic #891,205',
      duration: '0s elapsed',
      age: 'Started just now',
      initiator: wfData.initiator || 'manual-trigger',
      telemetry: 'Retries: 0 • SyncAck',
    };
    setWorkflows([newWf, ...workflows]);
    addToast(
      'Workflow Launched',
      `Orchestration ${newWf.name} scheduled on worker mesh.`,
      'success',
      'play_arrow'
    );
  };

  const handleTogglePause = (id: string) => {
    setWorkflows((prev) =>
      prev.map((w) =>
        w.id === id
          ? {
              ...w,
              state: w.state === 'PAUSED' ? 'RUNNING' : 'PAUSED',
              stateDetail: w.state === 'PAUSED' ? 'Resumed execution' : 'Turn frozen on epoch',
            }
          : w
      )
    );
    addToast('Workflow State Toggled', `Workflow ${id} execution paused/resumed`, 'warning');
  };

  const handleTerminate = (id: string) => {
    setWorkflows((prev) => prev.filter((w) => w.id !== id));
    addToast('Workflow Terminated', `Fencing token revoked for ${id}.`, 'error', 'stop');
  };

  const handleReplay = (id: string) => {
    addToast('Workflow Replayed', `Deterministic replay initiated for ${id}.`, 'info', 'receipt_long');
  };

  const handleDebug = (id: string) => {
    setCurrentPath('event-logs');
    addToast('Audit Trace Opened', `Inspecting timeout exception for ${id}`, 'warning', 'bug_report');
  };

  // Handlers for nodes
  const handleProvisionNode = (nodeData: Partial<WorkerNode>) => {
    const newNode: WorkerNode = {
      id: nodeData.name || `worker-dyn-${Math.floor(Math.random() * 100)}`,
      name: nodeData.name || 'worker-dyn-node',
      role: 'Worker',
      ip: nodeData.ip || '10.240.2.14',
      zone: nodeData.zone || 'us-east-1a',
      region: nodeData.region || 'us-east',
      poolType: nodeData.poolType || 'compute-intensive',
      health: 'healthy',
      workersActive: nodeData.workersActive || 64,
      workerSlots: nodeData.workerSlots || 64,
      activeTasks: 0,
      cpuUtilization: 12,
      memoryBufferUsed: 14.2,
      memoryBufferTotal: 64,
      rendezvousPing: nodeData.rendezvousPing || '1.5ms',
    };
    setNodes([...nodes, newNode]);
    addToast(
      'Worker Node Provisioned',
      `Node ${newNode.name} commissioned with ${newNode.workerSlots} slots.`,
      'success',
      'dns'
    );
  };

  const handleTerminateNode = (nodeId: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== nodeId));
    addToast('Worker Node Decommissioned', `Node ${nodeId} removed from Raft quorum.`, 'error', 'delete_forever');
  };

  const handleInspectNode = (nodeId: string) => {
    addToast('Worker Telemetry Pulled', `Inspecting real-time metrics for ${nodeId}`, 'info', 'analytics');
  };

  return (
    <div className="min-h-screen bg-[#0f131c] text-[#dfe2ef] flex">
      {/* Fixed Left Navigation Sidebar */}
      <Sidebar
        currentPath={currentPath}
        onNavigate={setCurrentPath}
        brokerSeq={brokerSeq}
        ackLatency="0.42 ms"
      />

      {/* Main Container with 64 (256px) left margin */}
      <div className="pl-64 flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <Header
          clusterName={clusterName}
          onClusterChange={(c) => {
            setClusterName(c);
            addToast('Cluster Context Switched', `Active control plane pointed to ${c}`, 'info');
          }}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenNotifications={() => {
            setCurrentPath('event-logs');
            addToast('Alert Stream', 'Displaying current active warning and error triggers', 'warning');
          }}
        />

        {/* View Content Area with 14 (56px) top padding */}
        <main className="pt-14 flex-1 flex flex-col">
          {currentPath === 'workflows' && (
            <WorkflowsView
              workflows={workflows}
              onInspectWorkflow={handleInspectWorkflow}
              onNewWorkflow={() => setIsNewWorkflowOpen(true)}
              onTriggerManual={() => setIsNewWorkflowOpen(true)}
              onExportMetrics={() =>
                addToast('Metrics Exported', 'Telemetry snapshot written to duraflow_metrics.parquet', 'success')
              }
              onFilterByTag={() =>
                addToast('Tag Filter', 'Filtering by tag: [prod, deterministic, high-priority]', 'info')
              }
              onOpenAuditTrace={() => {
                setCurrentPath('event-logs');
                addToast('Switched to Event Logs (⌘L)', 'Viewing high-density audit traces', 'info');
              }}
              onTogglePauseWorkflow={handleTogglePause}
              onTerminateWorkflow={handleTerminate}
              onReplayWorkflow={handleReplay}
              onDebugWorkflow={handleDebug}
            />
          )}

          {currentPath === 'execution-graph' && (
            <ExecutionGraphView onShowToast={addToast} />
          )}

          {currentPath === 'nodes-workers' && (
            <NodesWorkersView
              nodes={nodes}
              onOpenProvisionModal={() => setIsProvisionWorkerOpen(true)}
              onShowToast={addToast}
              onInspectNode={handleInspectNode}
              onTerminateNode={handleTerminateNode}
            />
          )}

          {currentPath === 'event-logs' && (
            <EventLogView onShowToast={addToast} />
          )}

          {currentPath === 'settings' && (
            <SettingsView onShowToast={addToast} />
          )}
        </main>
      </div>

      {/* Modals & Overlays */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={setCurrentPath}
        onTriggerAction={(action) => {
          if (action === 'trigger-manual') setIsNewWorkflowOpen(true);
          else if (action === 'rebalance') {
            addToast('Cluster Rebalance Initiated', 'Zero-downtime shard migration scheduled.', 'info');
          } else if (action === 'export-logs') {
            addToast('Export Started', 'Archiving events to duraflow_audit_log.zst', 'info');
          }
        }}
      />

      <NewWorkflowModal
        isOpen={isNewWorkflowOpen}
        onClose={() => setIsNewWorkflowOpen(false)}
        onCreateWorkflow={handleCreateWorkflow}
      />

      <ProvisionWorkerModal
        isOpen={isProvisionWorkerOpen}
        onClose={() => setIsProvisionWorkerOpen(false)}
        onProvisionNode={handleProvisionNode}
      />

      {/* Toast Notification Container */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
