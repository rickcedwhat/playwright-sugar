import React, { useCallback } from 'react';

interface NodePaletteProps {
  onInsert?: (type: string) => void;
}

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

const blocks = [
  { type: 'nav',     color: '#8b5cf6', title: 'Navigation',      badge: '.nav()',     desc: 'Route navigation action. Navigate to page/tab target.' },
  { type: 'detect',  color: '#10b981', title: 'State Detection',  badge: '.detect()',  desc: 'List potential page states. Branches execution flow.' },
  { type: 'attempt', color: '#3b82f6', title: 'Action Attempt',   badge: '.attempt()', desc: 'Perform action and match against expected toast/modal outcomes.' },
  { type: 'prep',    color: '#0d9488', title: 'Prep / Act',       badge: '.prep()',    desc: 'Preparation or standard linear action callback.' },
  { type: 'cleanup', color: '#ea580c', title: 'Cleanup / Revert', badge: '.cleanup()', desc: 'Teardown script. Reverts mutations if test fails/succeeds.' },
] as const;

export default function NodePalette({ onInsert }: NodePaletteProps) {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleKeyDown = useCallback((event: React.KeyboardEvent, nodeType: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onInsert?.(nodeType);
    }
  }, [onInsert]);

  return (
    <div style={paletteContainerStyle}>
      <div>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>Step Palette</div>
        <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
          Drag or click steps to add them to the canvas.
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {blocks.map(({ type, color, title, badge, desc }) => (
          <div
            key={type}
            role="button"
            tabIndex={0}
            style={{ ...blockStyle(color), outline: 'none' }}
            draggable
            onDragStart={(event) => onDragStart(event, type)}
            onClick={() => onInsert?.(type)}
            onKeyDown={(event) => handleKeyDown(event, type)}
          >
            <div style={blockTitleStyle}>
              <span>{title}</span>
              <span style={{ fontSize: '9px', color }}>{badge}</span>
            </div>
            <div style={blockDescStyle}>{desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
