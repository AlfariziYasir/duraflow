import React, { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Activity, Clock, Play, CheckCircle, Radio } from 'lucide-react';
import type { DAGSchema } from '../../api/types';

interface WorkflowDAGProps {
  schema?: DAGSchema;
  activeNodeId?: string | null;
  nodeStatuses?: Record<string, 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'WAITING'>;
  onSelectNode?: (nodeId: string) => void;
}

interface CustomNodeData {
  label: string;
  type: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'WAITING';
  isSelected?: boolean;
  subtext?: string;
  attempt?: number;
}

const CustomDAGNode = ({ data }: { data: CustomNodeData }) => {
  const isSelected = data.isSelected;
  const status = data.status || 'PENDING';

  const borderColor = {
    PENDING: 'border-border text-muted',
    RUNNING: 'border-accent text-accent animate-pulse shadow-[0_0_12px_rgba(56,189,248,0.2)]',
    COMPLETED: 'border-success text-success',
    FAILED: 'border-error text-error',
    WAITING: 'border-warning text-warning',
  }[status as 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'WAITING'] || 'border-border text-muted';

  return (
    <div
      className={`px-3 py-2 rounded-md bg-surface-card border ${borderColor} min-w-[160px] text-left transition-all ${
        isSelected ? 'ring-2 ring-accent ring-offset-2 ring-offset-background' : ''
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-border" />
      
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-[9px] font-mono uppercase tracking-wider font-bold opacity-80 flex items-center gap-1">
          {data.type === 'activity' && <Activity className="w-2.5 h-2.5" />}
          {data.type === 'timer' && <Clock className="w-2.5 h-2.5" />}
          {data.type === 'signal_wait' && <Radio className="w-2.5 h-2.5" />}
          {data.type === 'workflow_start' && <Play className="w-2.5 h-2.5" />}
          {data.type === 'workflow_end' && <CheckCircle className="w-2.5 h-2.5" />}
          {data.type}
        </span>
        {data.attempt && data.attempt > 1 && (
          <span className="text-[8px] font-mono px-1 rounded bg-purple-500/20 text-purple-300">
            Att {data.attempt} (RAM)
          </span>
        )}
      </div>

      <div className="text-xs font-semibold text-fg truncate">
        {data.label}
      </div>

      {data.subtext && (
        <div className="text-[10px] text-muted truncate mt-0.5">
          {data.subtext}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-border" />
    </div>
  );
};

const nodeTypes = {
  custom: CustomDAGNode,
};

export const WorkflowDAG: React.FC<WorkflowDAGProps> = ({
  schema,
  activeNodeId,
  nodeStatuses = {},
  onSelectNode,
}) => {
  const { nodes, edges } = useMemo(() => {
    if (!schema || !schema.nodes.length) {
      return { nodes: [], edges: [] };
    }

    const calculatedNodes: Node[] = schema.nodes.map((n, idx) => ({
      id: n.id,
      type: 'custom',
      position: { x: (idx % 3) * 220 + 40, y: Math.floor(idx / 3) * 120 + 40 },
      data: {
        label: n.name,
        type: n.type,
        status: nodeStatuses[n.id] || 'PENDING',
        isSelected: activeNodeId === n.id,
        subtext: n.timer_duration_seconds ? `${n.timer_duration_seconds}s timer` : n.activity_type,
      },
    }));

    const calculatedEdges: Edge[] = schema.edges.map((e, idx) => ({
      id: `e-${idx}`,
      source: e.from,
      target: e.to,
      animated: nodeStatuses[e.from] === 'RUNNING' || nodeStatuses[e.to] === 'RUNNING',
      style: { stroke: nodeStatuses[e.from] === 'COMPLETED' ? '#10b981' : '#334155', strokeWidth: 1.5 },
    }));

    return { nodes: calculatedNodes, edges: calculatedEdges };
  }, [schema, activeNodeId, nodeStatuses]);

  return (
    <div className="w-full h-full min-h-[360px] bg-background/50 rounded border border-border relative overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={(_, node) => onSelectNode?.(node.id)}
        fitView
      >
        <Background color="#1e293b" gap={16} size={1} />
        <Controls className="!bg-surface !border-border !fill-fg" />
      </ReactFlow>
    </div>
  );
};
