import React from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { NodeData } from './compiler';

const nodeStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.85)',
  border: '1px solid rgba(229, 231, 235, 0.5)',
  borderRadius: '12px',
  boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.08)',
  backdropFilter: 'blur(16px)',
  width: '260px',
  fontFamily: 'inherit',
  color: '#1f2937',
  overflow: 'hidden',
  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
};

const headerStyle = (bgColor: string): React.CSSProperties => ({
  background: bgColor,
  color: '#ffffff',
  padding: '8px 12px',
  fontWeight: 600,
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
});

const bodyStyle: React.CSSProperties = {
  padding: '12px',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const labelInputStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid #e5e7eb',
  borderRadius: '6px',
  padding: '6px 8px',
  fontSize: '13px',
  outline: 'none',
  background: '#f9fafb',
};

const handleLabelStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#4b5563',
  background: '#f3f4f6',
  padding: '2px 6px',
  borderRadius: '4px',
  border: '1px solid #e5e7eb',
  pointerEvents: 'none',
};

// ── Custom Nodes ─────────────────────────────────────────────────────────────

// 1. Navigation Node (Purple)
export function NavNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as NodeData;
  return (
    <div style={{ ...nodeStyle, ...(selected && { border: '1px solid #8b5cf6', boxShadow: '0 8px 32px 0 rgba(139, 92, 246, 0.15)' }) }}>
      <Handle type="target" position={Position.Top} style={{ background: '#8b5cf6', width: '8px', height: '8px' }} />
      <div style={headerStyle('#8b5cf6')}>
        <span>Navigation</span>
        <span style={{ fontSize: '9px', opacity: 0.85 }}>.nav()</span>
      </div>
      <div style={bodyStyle}>
        <div style={{ fontSize: '12px', fontWeight: 500, color: '#374151' }}>Step Label / Name</div>
        <div style={{ fontSize: '13px', color: '#6b7280', fontStyle: 'italic' }}>
          "{nodeData.name || 'Anonymous'}"
        </div>
        <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '4px' }}>
          {nodeData.code ? '✓ Script configured' : '⚠ Click to add script'}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} style={{ background: '#8b5cf6', width: '8px', height: '8px' }} />
    </div>
  );
}

// 2. Detect Node (Green)
export function DetectNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as NodeData;
  return (
    <div style={{ ...nodeStyle, ...(selected && { border: '1px solid #10b981', boxShadow: '0 8px 32px 0 rgba(16, 185, 129, 0.15)' }) }}>
      <Handle type="target" position={Position.Top} style={{ background: '#10b981', width: '8px', height: '8px' }} />
      <div style={headerStyle('#10b981')}>
        <span>State Detection</span>
        <span style={{ fontSize: '9px', opacity: 0.85 }}>.detect()</span>
      </div>
      <div style={bodyStyle}>
        <div style={{ fontSize: '12px', fontWeight: 500, color: '#374151' }}>Step Name (optional)</div>
        <div style={{ fontSize: '13px', color: '#6b7280', fontStyle: 'italic' }}>
          {nodeData.name ? `"${nodeData.name}"` : 'None (flat outcome)'}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} style={{ background: '#10b981', width: '8px', height: '8px' }} />
    </div>
  );
}

// 3. Attempt Node (Blue)
export function AttemptNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as NodeData;
  return (
    <div style={{ ...nodeStyle, ...(selected && { border: '1px solid #3b82f6', boxShadow: '0 8px 32px 0 rgba(59, 130, 246, 0.15)' }) }}>
      <Handle type="target" position={Position.Top} style={{ background: '#3b82f6', width: '8px', height: '8px' }} />
      <div style={headerStyle('#3b82f6')}>
        <span>Action Attempt</span>
        <span style={{ fontSize: '9px', opacity: 0.85 }}>.attempt()</span>
      </div>
      <div style={bodyStyle}>
        <div style={{ fontSize: '12px', fontWeight: 500, color: '#374151' }}>Action Name</div>
        <div style={{ fontSize: '13px', color: '#6b7280', fontStyle: 'italic' }}>
          "{nodeData.name || 'Anonymous'}"
        </div>
        <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '4px' }}>
          {nodeData.code ? '✓ Script configured' : '⚠ Click to add script'}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} style={{ background: '#3b82f6', width: '8px', height: '8px' }} />
    </div>
  );
}

// 4. Prep Node (Teal)
export function PrepNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as NodeData;
  const kind = nodeData.kind || 'prep';
  const color = kind === 'prep' ? '#0d9488' : '#0284c7';
  return (
    <div style={{ ...nodeStyle, ...(selected && { border: `1px solid ${color}`, boxShadow: `0 8px 32px 0 ${color}24` }) }}>
      <Handle type="target" position={Position.Top} style={{ background: color, width: '8px', height: '8px' }} />
      <div style={headerStyle(color)}>
        <span>{kind === 'prep' ? 'Preparation' : 'Action'}</span>
        <span style={{ fontSize: '9px', opacity: 0.85 }}>.{kind}()</span>
      </div>
      <div style={bodyStyle}>
        <div style={{ fontSize: '12px', fontWeight: 500, color: '#374151' }}>Step Label / Name</div>
        <div style={{ fontSize: '13px', color: '#6b7280', fontStyle: 'italic' }}>
          "{nodeData.name || 'Anonymous'}"
        </div>
        <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '4px' }}>
          {nodeData.code ? '✓ Script configured' : '⚠ Click to add script'}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} style={{ background: color, width: '8px', height: '8px' }} />
    </div>
  );
}

// 5. Cleanup Node (Orange)
export function CleanupNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as NodeData;
  return (
    <div style={{ ...nodeStyle, ...(selected && { border: '1px solid #ea580c', boxShadow: '0 8px 32px 0 rgba(234, 88, 12, 0.15)' }) }}>
      <Handle type="target" position={Position.Top} style={{ background: '#ea580c', width: '8px', height: '8px' }} />
      <div style={headerStyle('#ea580c')}>
        <span>Cleanup / Revert</span>
        <span style={{ fontSize: '9px', opacity: 0.85 }}>.cleanup()</span>
      </div>
      <div style={bodyStyle}>
        <div style={{ fontSize: '12px', fontWeight: 500, color: '#374151' }}>Cleanup Label</div>
        <div style={{ fontSize: '13px', color: '#6b7280', fontStyle: 'italic' }}>
          "{nodeData.name || 'Anonymous'}"
        </div>
        <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '4px' }}>
          {nodeData.code ? '✓ Script configured' : '⚠ Click to add script'}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} style={{ background: '#ea580c', width: '8px', height: '8px' }} />
    </div>
  );
}

// 6. Outcome/Terminal Node (Green/Red)
export function OutcomeNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as { name: string; isSuccess: boolean; selector?: string; isTimeout?: boolean; timeoutMs?: number };
  const isSuccess = nodeData.isSuccess;
  const bgColor = isSuccess ? '#ecfdf5' : '#fef2f2';
  const borderColor = isSuccess ? '#10b981' : '#ef4444';
  const textColor = isSuccess ? '#065f46' : '#991b1b';

  const hasSelector = nodeData.selector && 
                      nodeData.selector !== 'page.locator("")' && 
                      nodeData.selector !== 'p.locator("")' &&
                      nodeData.selector !== 'page.locator(\'\')' &&
                      nodeData.selector !== 'p.locator(\'\')';

  return (
    <div
      style={{
        background: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: '8px',
        padding: '6px 12px',
        minWidth: '140px',
        maxWidth: '280px',
        fontFamily: 'inherit',
        color: textColor,
        boxShadow: selected ? `0 0 0 2px ${borderColor}40` : '0 2px 8px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: borderColor, width: '6px', height: '6px' }} />
      
      {nodeData.isTimeout ? (
        <div style={{ fontSize: '11px', fontWeight: 600 }}>
          timeout ({nodeData.timeoutMs}ms)
        </div>
      ) : hasSelector ? (
        <div style={{
          fontSize: '10px',
          color: isSuccess ? '#047857' : '#b91c1c',
          fontFamily: 'monospace',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
          textAlign: 'center',
          maxWidth: '100%',
        }} title={nodeData.selector}>
          {nodeData.selector}
        </div>
      ) : (
        <div style={{ fontSize: '11px', fontWeight: 600 }}>
          {nodeData.name}
        </div>
      )}
      
      <Handle type="source" position={Position.Bottom} style={{ background: borderColor, width: '6px', height: '6px' }} />
    </div>
  );
}


export const nodeTypes = {
  nav: NavNode,
  detect: DetectNode,
  attempt: AttemptNode,
  prep: PrepNode,
  cleanup: CleanupNode,
  outcome: OutcomeNode,
};
