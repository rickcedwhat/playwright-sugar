import { useCallback, useRef } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  useReactFlow,
  addEdge,
} from '@xyflow/react';
import type { Node, Edge, Connection } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { nodeTypes } from './customNodes';
import LabeledEdge from './LabeledEdge';
import type { NodeData } from './compiler';

const edgeTypes = {
  default: LabeledEdge,
  labeled: LabeledEdge,
};

interface Props {
  nodes: Node<NodeData>[];
  edges: Edge[];
  onNodesChange: any;
  onEdgesChange: any;
  setNodes: React.Dispatch<React.SetStateAction<Node<NodeData>[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  onNodeClick: (node: Node<NodeData>) => void;
}

export default function BuilderCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  setNodes,
  setEdges,
  onNodeClick,
}: Props) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge({ ...params, animated: true, style: { strokeWidth: 2 } }, eds));
    },
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current) return;

      const type = event.dataTransfer.getData('application/reactflow');

      // check if the dropped element is valid
      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      let name = '';
      let initialData: NodeData = { label: type, name: '' };

      switch (type) {
        case 'nav':
          name = 'Navigate to page';
          initialData = { label: 'Navigation', name, code: "await clickTab(page, 'Datasets');" };
          break;
        case 'detect':
          name = 'Check state';
          initialData = {
            label: 'State Detection',
            name,
            candidates: [
              { name: 'tableState', isSuccess: true, selector: '[data-component="TableHeadersComponent"]' },
              { name: 'emptyState', isSuccess: false, selector: 'page.getByText("No datasets")' },
            ],
            timeout: 5000,
          };
          break;
        case 'attempt':
          name = 'Perform action';
          initialData = {
            label: 'Action Attempt',
            name,
            code: "await page.getByRole('button', { name: 'Save' }).click();",
            outcomes: [
              { name: 'success', type: 'success', selector: 'page.getByText("Saved successfully")' },
              { name: 'failed', type: 'failure', selector: 'page.getByText("Could not save")' },
              { name: 'timeout', type: 'timeout', selector: '' },
            ],
            timeout: 5000,
          };
          break;
        case 'prep':
          name = 'Prepare action';
          initialData = {
            label: 'Preparation',
            name,
            kind: 'prep',
            code: "if (lastOutcome?.name === 'tableState') {\n  // Do something...\n}",
          };
          break;
        case 'cleanup':
          name = 'Revert changes';
          initialData = {
            label: 'Cleanup',
            name,
            code: "if (lastOutcome?.isSuccess) {\n  // Revert changes...\n}",
          };
          break;
      }

      const newNode: Node<NodeData> = {
        id: `${type}_${Date.now()}`,
        type,
        position,
        data: initialData,
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, setNodes]
  );

  return (
    <div ref={reactFlowWrapper} style={{ flex: 1, height: '100%', position: 'relative' }} onDragOver={onDragOver} onDrop={onDrop}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={(_, node) => onNodeClick(node as Node<NodeData>)}
        fitView
      >
        <Controls />
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#cbd5e1" />
      </ReactFlow>
    </div>
  );
}
