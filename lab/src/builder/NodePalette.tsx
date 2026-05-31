import React from 'react';

const paletteContainerStyle: React.CSSProperties = {
  width: '240px',
  borderRight: '1px solid #e5e7eb',
  background: '#f9fafb',
  padding: '20px 16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  flexShrink: 0,
  fontFamily: 'inherit',
};

const blockStyle = (color: string): React.CSSProperties => ({
  background: '#ffffff',
  border: `1px solid rgba(229, 231, 235, 0.8)`,
  borderLeft: `4px solid ${color}`,
  borderRadius: '8px',
  padding: '12px',
  cursor: 'grab',
  userSelect: 'none',
  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
  transition: 'transform 0.1s ease, box-shadow 0.1s ease',
});

const blockTitleStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 600,
  color: '#1f2937',
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: '4px',
};

const blockDescStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#6b7280',
  lineHeight: '1.4',
};

export default function NodePalette() {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div style={paletteContainerStyle}>
      <div>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>Step Palette</div>
        <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
          Drag steps onto the canvas to design your play.
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Navigation block */}
        <div
          style={blockStyle('#8b5cf6')}
          onDragStart={(event) => onDragStart(event, 'nav')}
          draggable
        >
          <div style={blockTitleStyle}>
            <span>Navigation</span>
            <span style={{ fontSize: '9px', color: '#8b5cf6' }}>.nav()</span>
          </div>
          <div style={blockDescStyle}>Route navigation action. Navigate to page/tab target.</div>
        </div>

        {/* State Detection block */}
        <div
          style={blockStyle('#10b981')}
          onDragStart={(event) => onDragStart(event, 'detect')}
          draggable
        >
          <div style={blockTitleStyle}>
            <span>State Detection</span>
            <span style={{ fontSize: '9px', color: '#10b981' }}>.detect()</span>
          </div>
          <div style={blockDescStyle}>List potential page states. Branches execution flow.</div>
        </div>

        {/* Action Attempt block */}
        <div
          style={blockStyle('#3b82f6')}
          onDragStart={(event) => onDragStart(event, 'attempt')}
          draggable
        >
          <div style={blockTitleStyle}>
            <span>Action Attempt</span>
            <span style={{ fontSize: '9px', color: '#3b82f6' }}>.attempt()</span>
          </div>
          <div style={blockDescStyle}>Perform action and match against expected toast/modal outcomes.</div>
        </div>

        {/* Prep / Act block */}
        <div
          style={blockStyle('#0d9488')}
          onDragStart={(event) => onDragStart(event, 'prep')}
          draggable
        >
          <div style={blockTitleStyle}>
            <span>Prep / Act</span>
            <span style={{ fontSize: '9px', color: '#0d9488' }}>.prep()</span>
          </div>
          <div style={blockDescStyle}>Preparation or standard linear action callback.</div>
        </div>

        {/* Cleanup block */}
        <div
          style={blockStyle('#ea580c')}
          onDragStart={(event) => onDragStart(event, 'cleanup')}
          draggable
        >
          <div style={blockTitleStyle}>
            <span>Cleanup / Revert</span>
            <span style={{ fontSize: '9px', color: '#ea580c' }}>.cleanup()</span>
          </div>
          <div style={blockDescStyle}>Teardown script. Reverts mutations if test fails/succeeds.</div>
        </div>
      </div>
    </div>
  );
}
