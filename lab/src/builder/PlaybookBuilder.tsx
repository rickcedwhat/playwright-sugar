import { useState, useEffect, useCallback, useRef } from 'react';
import { ReactFlowProvider, useNodesState, useEdgesState } from '@xyflow/react';
import type { Node, Edge } from '@xyflow/react';

import NodePalette from './NodePalette';
import BuilderCanvas from './BuilderCanvas';
import PropertiesPanel from './PropertiesPanel';
import CodePreview from './CodePreview';
import { compilePlaybook } from './compiler';
import type { NodeData } from './compiler';
import preloadedPlaybooks from './preloadedPlaybooks.json';

interface VisualPlay {
  playName: string;
  nodes: Node<NodeData>[];
  edges: Edge[];
}

interface SavedPlaybook {
  id: string;
  playbookName: string;
  plays: VisualPlay[];
}

const STORAGE_VER = 'v11';
const KEY_PLAYBOOKS = `sugar-lab-all-playbooks-${STORAGE_VER}`;
const KEY_ACTIVE_PB = `sugar-lab-active-playbook-id-${STORAGE_VER}`;
const KEY_ACTIVE_PLAY = `sugar-lab-active-play-name-${STORAGE_VER}`;

const loadSavedPlaybooks = (): SavedPlaybook[] => {
  try {
    const val = localStorage.getItem(KEY_PLAYBOOKS);
    if (val) {
      return JSON.parse(val);
    }
  } catch {}
  return preloadedPlaybooks as SavedPlaybook[];
};

function PlaybookBuilderContent() {
  const [savedPlaybooks, setSavedPlaybooks] = useState<SavedPlaybook[]>(() => loadSavedPlaybooks());
  
  const [activePlaybookId, setActivePlaybookId] = useState(() => {
    const lastActivePb = localStorage.getItem(KEY_ACTIVE_PB);
    const playbooks = loadSavedPlaybooks();
    if (lastActivePb && playbooks.some(p => p.id === lastActivePb)) {
      return lastActivePb;
    }
    return playbooks[0]?.id || 'dataset-pb';
  });

  const activePlaybook = savedPlaybooks.find(p => p.id === activePlaybookId) || savedPlaybooks[0];

  const [activePlayName, setActivePlayName] = useState(() => {
    const lastActivePlay = localStorage.getItem(KEY_ACTIVE_PLAY);
    const playbook = loadSavedPlaybooks().find(p => p.id === activePlaybookId) || loadSavedPlaybooks()[0];
    if (lastActivePlay && playbook?.plays.some(p => p.playName === lastActivePlay)) {
      return lastActivePlay;
    }
    return playbook?.plays[0]?.playName || 'access';
  });

  const activePlay = activePlaybook?.plays.find(p => p.playName === activePlayName) || activePlaybook?.plays[0];

  const [playbookName, setPlaybookName] = useState(activePlaybook?.playbookName || 'Dataset');
  const [playName, setPlayName] = useState(activePlay?.playName || 'access');

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<NodeData>>(activePlay?.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(activePlay?.edges || []);


  const [selectedNode, setSelectedNode] = useState<Node<NodeData> | null>(null);
  const [activeRightTab, setActiveRightTab] = useState<'properties' | 'code'>('code');
  const [generatedCode, setGeneratedCode] = useState('');

  // Resize right pane states
  const [paneWidth, setPaneWidth] = useState(480);
  const [isResizing, setIsResizing] = useState(false);

  const isSwitchingRef = useRef(false);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    const newWidth = window.innerWidth - e.clientX;
    if (newWidth > 320 && newWidth < window.innerWidth * 0.7) {
      setPaneWidth(newWidth);
    }
  }, [isResizing]);

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);

  // Auto-save active playbook modifications back to the list and localStorage
  useEffect(() => {
    if (isSwitchingRef.current) return;

    setSavedPlaybooks(prev => {
      const next = prev.map(pb => {
        if (pb.id === activePlaybookId) {
          const nextPlays = pb.plays.map(p => {
            if (p.playName === activePlayName) {
              return {
                ...p,
                playName: playName,
                nodes,
                edges,
              };
            }
            return p;
          });

          return {
            ...pb,
            playbookName,
            plays: nextPlays,
          };
        }
        return pb;
      });
      localStorage.setItem(KEY_PLAYBOOKS, JSON.stringify(next));
      return next;
    });
  }, [playbookName, playName, nodes, edges, activePlaybookId, activePlayName]);

  // Re-compile playbook TS code whenever nodes/edges/names change
  useEffect(() => {
    const tsCode = compilePlaybook(playbookName, playName, nodes, edges);
    setGeneratedCode(tsCode);
  }, [playbookName, playName, nodes, edges]);

  const handleSwitchPlaybook = (pbId: string) => {
    isSwitchingRef.current = true;

    // Sync current values first
    const updatedPlaybooks = savedPlaybooks.map(pb => {
      if (pb.id === activePlaybookId) {
        return {
          ...pb,
          playbookName,
          plays: pb.plays.map(p => {
            if (p.playName === activePlayName) {
              return { ...p, playName, nodes, edges };
            }
            return p;
          })
        };
      }
      return pb;
    });
    setSavedPlaybooks(updatedPlaybooks);
    localStorage.setItem(KEY_PLAYBOOKS, JSON.stringify(updatedPlaybooks));

    const targetPb = updatedPlaybooks.find(p => p.id === pbId);
    if (targetPb) {
      setActivePlaybookId(pbId);
      localStorage.setItem(KEY_ACTIVE_PB, pbId);

      const targetPlay = targetPb.plays[0] || { playName: 'access', nodes: [], edges: [] };
      setActivePlayName(targetPlay.playName);
      localStorage.setItem(KEY_ACTIVE_PLAY, targetPlay.playName);

      setPlaybookName(targetPb.playbookName);
      setPlayName(targetPlay.playName);
      setNodes(targetPlay.nodes);
      setEdges(targetPlay.edges);
      setSelectedNode(null);
      setActiveRightTab('code');
    }

    setTimeout(() => {
      isSwitchingRef.current = false;
    }, 50);
  };

  const handleSwitchPlay = (targetPlayName: string) => {
    isSwitchingRef.current = true;

    // Sync current values first
    const updatedPlaybooks = savedPlaybooks.map(pb => {
      if (pb.id === activePlaybookId) {
        return {
          ...pb,
          playbookName,
          plays: pb.plays.map(p => {
            if (p.playName === activePlayName) {
              return { ...p, playName, nodes, edges };
            }
            return p;
          })
        };
      }
      return pb;
    });
    setSavedPlaybooks(updatedPlaybooks);
    localStorage.setItem(KEY_PLAYBOOKS, JSON.stringify(updatedPlaybooks));

    const targetPb = updatedPlaybooks.find(p => p.id === activePlaybookId);
    const targetPlay = targetPb?.plays.find(p => p.playName === targetPlayName);
    if (targetPlay) {
      setActivePlayName(targetPlayName);
      localStorage.setItem(KEY_ACTIVE_PLAY, targetPlayName);

      setPlayName(targetPlay.playName);
      setNodes(targetPlay.nodes);
      setEdges(targetPlay.edges);
      setSelectedNode(null);
      setActiveRightTab('code');
    }

    setTimeout(() => {
      isSwitchingRef.current = false;
    }, 50);
  };

  const handleNewPlaybook = () => {
    const pbName = prompt('Playbook Name:', 'NewPlaybook') || 'NewPlaybook';
    const pName = prompt('First Play Name:', 'run') || 'run';

    const newId = 'pb-' + Date.now();
    const newPb: SavedPlaybook = {
      id: newId,
      playbookName: pbName,
      plays: [
        {
          playName: pName,
          nodes: [
            {
              id: 'nav_1',
              type: 'nav',
              position: { x: 250, y: 100 },
              data: {
                label: 'Navigation',
                name: 'start step',
                code: 'await page.goto("https://example.com");',
              },
            }
          ],
          edges: [],
        }
      ],
    };

    isSwitchingRef.current = true;
    const nextPlaybooks = [...savedPlaybooks, newPb];
    setSavedPlaybooks(nextPlaybooks);
    localStorage.setItem(KEY_PLAYBOOKS, JSON.stringify(nextPlaybooks));

    setActivePlaybookId(newId);
    localStorage.setItem(KEY_ACTIVE_PB, newId);
    setActivePlayName(pName);
    localStorage.setItem(KEY_ACTIVE_PLAY, pName);

    setPlaybookName(pbName);
    setPlayName(pName);
    setNodes(newPb.plays[0].nodes);
    setEdges(newPb.plays[0].edges);
    setSelectedNode(null);
    setActiveRightTab('code');

    setTimeout(() => {
      isSwitchingRef.current = false;
    }, 50);
  };

  const handleNewPlay = () => {
    const pName = prompt('Play Name:', 'newPlay') || 'newPlay';

    if (activePlaybook.plays.some(p => p.playName === pName)) {
      alert('A play with that name already exists in this playbook!');
      return;
    }

    const newPlay: VisualPlay = {
      playName: pName,
      nodes: [
        {
          id: 'nav_1',
          type: 'nav',
          position: { x: 250, y: 100 },
          data: {
            label: 'Navigation',
            name: 'start step',
            code: 'await page.goto("https://example.com");',
          },
        }
      ],
      edges: [],
    };

    isSwitchingRef.current = true;
    const nextPlaybooks = savedPlaybooks.map(pb => {
      if (pb.id === activePlaybookId) {
        return {
          ...pb,
          plays: [...pb.plays, newPlay]
        };
      }
      return pb;
    });
    setSavedPlaybooks(nextPlaybooks);
    localStorage.setItem(KEY_PLAYBOOKS, JSON.stringify(nextPlaybooks));

    setActivePlayName(pName);
    localStorage.setItem(KEY_ACTIVE_PLAY, pName);
    setPlayName(pName);
    setNodes(newPlay.nodes);
    setEdges(newPlay.edges);
    setSelectedNode(null);
    setActiveRightTab('code');

    setTimeout(() => {
      isSwitchingRef.current = false;
    }, 50);
  };

  const handleDeletePlaybook = () => {
    if (savedPlaybooks.length <= 1) {
      alert('You must keep at least one playbook!');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete the playbook "${playbookName}"?`)) {
      return;
    }

    isSwitchingRef.current = true;
    const nextPlaybooks = savedPlaybooks.filter(p => p.id !== activePlaybookId);
    setSavedPlaybooks(nextPlaybooks);
    localStorage.setItem(KEY_PLAYBOOKS, JSON.stringify(nextPlaybooks));

    const remainingPb = nextPlaybooks[0];
    setActivePlaybookId(remainingPb.id);
    localStorage.setItem(KEY_ACTIVE_PB, remainingPb.id);

    const remainingPlay = remainingPb.plays[0] || { playName: 'access', nodes: [], edges: [] };
    setActivePlayName(remainingPlay.playName);
    localStorage.setItem(KEY_ACTIVE_PLAY, remainingPlay.playName);

    setPlaybookName(remainingPb.playbookName);
    setPlayName(remainingPlay.playName);
    setNodes(remainingPlay.nodes);
    setEdges(remainingPlay.edges);
    setSelectedNode(null);
    setActiveRightTab('code');

    setTimeout(() => {
      isSwitchingRef.current = false;
    }, 50);
  };

  const handleDeletePlay = () => {
    if (activePlaybook.plays.length <= 1) {
      alert('You must keep at least one play under the playbook!');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete the play "${playName}"?`)) {
      return;
    }

    isSwitchingRef.current = true;
    const nextPlaybooks = savedPlaybooks.map(pb => {
      if (pb.id === activePlaybookId) {
        return {
          ...pb,
          plays: pb.plays.filter(p => p.playName !== activePlayName)
        };
      }
      return pb;
    });
    setSavedPlaybooks(nextPlaybooks);
    localStorage.setItem(KEY_PLAYBOOKS, JSON.stringify(nextPlaybooks));

    const targetPb = nextPlaybooks.find(p => p.id === activePlaybookId)!;
    const remainingPlay = targetPb.plays[0];
    setActivePlayName(remainingPlay.playName);
    localStorage.setItem(KEY_ACTIVE_PLAY, remainingPlay.playName);

    setPlayName(remainingPlay.playName);
    setNodes(remainingPlay.nodes);
    setEdges(remainingPlay.edges);
    setSelectedNode(null);
    setActiveRightTab('code');

    setTimeout(() => {
      isSwitchingRef.current = false;
    }, 50);
  };

  const handleNodeClick = useCallback((node: Node<NodeData>) => {
    setSelectedNode(node);
    setActiveRightTab('properties');
  }, []);

  const handleUpdateNode = useCallback((id: string, updatedFields: Partial<NodeData>) => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === id) {
          return { ...n, data: { ...n.data, ...updatedFields } };
        }
        return n;
      })
    );
    setSelectedNode((prev) => {
      if (prev?.id === id) {
        return { ...prev, data: { ...prev.data, ...updatedFields } };
      }
      return prev;
    });
  }, [setNodes, setSelectedNode]);

  const handleInsertNode = useCallback((type: string) => {
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
          label: 'State Detection', name,
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
          label: 'Action Attempt', name,
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
        initialData = { label: 'Preparation', name, kind: 'prep', code: "if (history.lastOutcome?.name === 'tableState') {\n  // Do something...\n}" };
        break;
      case 'cleanup':
        name = 'Revert changes';
        initialData = { label: 'Cleanup', name, code: "if (history.lastOutcome?.isSuccess) {\n  // Revert changes...\n}" };
        break;
    }
    const newNode: Node<NodeData> = {
      id: `${type}_${Date.now()}`,
      type,
      position: { x: 250, y: 100 + nodes.length * 180 },
      data: initialData,
    };
    setNodes((nds) => nds.concat(newNode));
  }, [nodes.length, setNodes]);

  const handleClearCanvas = () => {
    if (window.confirm('Are you sure you want to clear the canvas?')) {
      setNodes([]);
      setEdges([]);
      setSelectedNode(null);
      setActiveRightTab('code');
    }
  };

  const handleResetDemo = () => {
    if (window.confirm('Reset this active play back to its original PoC flow template?')) {
      const originalPb = preloadedPlaybooks.find(p => p.id === activePlaybookId);
      const originalPlay = originalPb?.plays.find(p => p.playName === activePlayName) || originalPb?.plays[0];

      if (originalPlay) {
        setNodes(originalPlay.nodes as any);
        setEdges(originalPlay.edges as any);
        setPlayName(originalPlay.playName);
        setSelectedNode(null);
        setActiveRightTab('code');
      } else {
        setNodes([
          {
            id: 'nav_1',
            type: 'nav',
            position: { x: 100, y: 150 },
            data: {
              label: 'Navigation',
              name: 'start step',
              code: 'await page.goto("https://example.com");',
            },
          }
        ]);
        setEdges([]);
        setSelectedNode(null);
        setActiveRightTab('code');
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', border: '1px solid #e5e7eb', borderRadius: '12px', background: '#fff', overflow: 'hidden' }}>
      {/* Top Controller Bar */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb', display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        {/* Dropdowns and Inputs Group */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Playbook Selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Playbook</label>
            <select
              value={activePlaybookId}
              onChange={(e) => handleSwitchPlaybook(e.target.value)}
              style={{ border: '1px solid #d1d5db', borderRadius: '6px', padding: '6px 10px', fontSize: '13px', minWidth: '160px', outline: 'none', background: '#fff', cursor: 'pointer' }}
            >
              {savedPlaybooks.map(pb => (
                <option key={pb.id} value={pb.id}>
                  {pb.playbookName}
                </option>
              ))}
            </select>
          </div>

          {/* Play Selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Play</label>
            <select
              value={activePlayName}
              onChange={(e) => handleSwitchPlay(e.target.value)}
              style={{ border: '1px solid #d1d5db', borderRadius: '6px', padding: '6px 10px', fontSize: '13px', minWidth: '140px', outline: 'none', background: '#fff', cursor: 'pointer' }}
            >
              {activePlaybook?.plays.map(p => (
                <option key={p.playName} value={p.playName}>
                  {p.playName}
                </option>
              ))}
            </select>
          </div>

          {/* Separator line */}
          <div style={{ width: '1px', height: '32px', background: '#e5e7eb', margin: '0 4px' }} />

          {/* Playbook Name Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Rename Playbook</label>
            <input
              type="text"
              value={playbookName}
              onChange={(e) => setPlaybookName(e.target.value)}
              style={{ border: '1px solid #d1d5db', borderRadius: '6px', padding: '6px 10px', fontSize: '13px', width: '140px', outline: 'none' }}
            />
          </div>

          {/* Play Name Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Rename Play</label>
            <input
              type="text"
              value={playName}
              onChange={(e) => setPlayName(e.target.value)}
              onBlur={(e) => {
                setActivePlayName(e.target.value);
                localStorage.setItem(KEY_ACTIVE_PLAY, e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
              }}
              style={{ border: '1px solid #d1d5db', borderRadius: '6px', padding: '6px 10px', fontSize: '13px', width: '120px', outline: 'none' }}
            />
          </div>
        </div>

        {/* Buttons Group */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 500, marginRight: '8px', padding: '2px 6px', background: '#f3f4f6', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
            Store: {STORAGE_VER}
          </span>
          <button
            onClick={handleNewPlaybook}
            style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 14px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
            title="Create a new Playbook"
          >
            + Playbook
          </button>
          <button
            onClick={handleNewPlay}
            style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 14px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
            title="Create a new Play in the current Playbook"
          >
            + Play
          </button>
          <button
            onClick={handleDeletePlaybook}
            style={{ background: '#fff', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '6px', padding: '8px 14px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
            title="Delete current Playbook"
          >
            Delete Playbook
          </button>
          <button
            onClick={handleDeletePlay}
            style={{ background: '#fff', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '6px', padding: '8px 14px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
            title="Delete current Play"
          >
            Delete Play
          </button>
          <button
            onClick={handleResetDemo}
            style={{ background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', padding: '8px 14px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
            title="Reset active play to default templates"
          >
            Reset Template
          </button>
          <button
            onClick={handleClearCanvas}
            style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 14px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
            title="Clear the active play canvas"
          >
            Clear Canvas
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
        {/* Left Palette */}
        <NodePalette onInsert={handleInsertNode} />

        {/* Center Canvas */}
        <BuilderCanvas
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          setNodes={setNodes}
          setEdges={setEdges}
          onNodeClick={handleNodeClick}
        />

        {/* Right Pane (Tabbed: Properties vs Code) */}
        <div style={{ display: 'flex', flexDirection: 'column', borderLeft: '1px solid #e5e7eb', flexShrink: 0, width: `${paneWidth}px`, position: 'relative' }}>
          {/* Vertical drag handle */}
          <div
            onMouseDown={startResizing}
            style={{
              position: 'absolute',
              left: '-4px',
              top: 0,
              bottom: 0,
              width: '8px',
              cursor: 'col-resize',
              zIndex: 100,
              background: isResizing ? '#3b82f6' : 'transparent',
              transition: 'background 0.2s',
            }}
            title="Drag to resize panel"
          />

          {/* Tabs */}
          <div style={{ display: 'flex', background: '#f3f4f6', padding: '4px', borderBottom: '1px solid #e5e7eb' }}>
            <button
              onClick={() => setActiveRightTab('properties')}
              disabled={!selectedNode}
              style={{
                flex: 1,
                border: 'none',
                background: activeRightTab === 'properties' ? '#fff' : 'transparent',
                color: !selectedNode ? '#9ca3af' : activeRightTab === 'properties' ? '#111827' : '#4b5563',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 500,
                borderRadius: '4px',
                boxShadow: activeRightTab === 'properties' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                cursor: !selectedNode ? 'not-allowed' : 'pointer',
              }}
            >
              Properties {selectedNode ? `(${selectedNode.type})` : ''}
            </button>
            <button
              onClick={() => setActiveRightTab('code')}
              style={{
                flex: 1,
                border: 'none',
                background: activeRightTab === 'code' ? '#fff' : 'transparent',
                color: activeRightTab === 'code' ? '#111827' : '#4b5563',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 500,
                borderRadius: '4px',
                boxShadow: activeRightTab === 'code' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              Code Preview
            </button>
          </div>

          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', width: '100%' }}>
            {activeRightTab === 'properties' && selectedNode ? (
              <PropertiesPanel
                node={selectedNode}
                onClose={() => {
                  setSelectedNode(null);
                  setActiveRightTab('code');
                }}
                onUpdateNode={handleUpdateNode}
              />
            ) : (
              <CodePreview code={generatedCode} playbookName={playbookName} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PlaybookBuilder() {
  return (
    <ReactFlowProvider>
      <PlaybookBuilderContent />
    </ReactFlowProvider>
  );
}
