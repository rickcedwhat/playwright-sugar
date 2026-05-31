import { useState } from 'react';
import { Database, Settings, Workflow, ChevronLeft, ChevronRight } from 'lucide-react';

type View = 'datasets' | 'dataset-detail' | 'settings' | 'builder';

interface Props {
  currentView: View;
  onNavigate: (route: { view: 'datasets' } | { view: 'settings' } | { view: 'builder' }) => void;
}

const linkStyle = (active: boolean, collapsed: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: collapsed ? 'center' : 'flex-start',
  gap: collapsed ? '0' : '10px',
  padding: collapsed ? '8px' : '8px 12px',
  borderRadius: '6px',
  background: active ? '#f0f0f0' : 'none',
  color: '#1a1a1a',
  fontWeight: active ? 600 : 400,
  textDecoration: 'none',
  cursor: 'pointer',
  border: 'none',
  width: '100%',
  textAlign: 'left',
  fontSize: '14px',
  transition: 'all 0.2s ease',
});

export default function Sidebar({ currentView, onNavigate }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <nav
      style={{
        width: collapsed ? '64px' : '200px',
        borderRight: '1px solid #e5e5e5',
        padding: collapsed ? '24px 8px' : '24px 12px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: collapsed ? 'center' : 'stretch',
        gap: '6px',
        flexShrink: 0,
        transition: 'width 0.2s ease, padding 0.2s ease',
        background: '#fff',
      }}
    >
      <div
        style={{
          fontWeight: 700,
          fontSize: collapsed ? '11px' : '13px',
          color: '#999',
          padding: collapsed ? '0 0 12px' : '0 12px 12px',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          textAlign: collapsed ? 'center' : 'left',
          borderBottom: '1px solid #f3f4f6',
          marginBottom: '8px',
          width: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
        title={collapsed ? "Lab" : "Sugar Lab"}
      >
        {collapsed ? 'SL' : 'Sugar Lab'}
      </div>

      <button
        style={linkStyle(currentView === 'datasets' || currentView === 'dataset-detail', collapsed)}
        onClick={() => onNavigate({ view: 'datasets' })}
        title="Datasets"
        aria-label="Datasets"
      >
        <Database size={18} />
        {!collapsed && <span>Datasets</span>}
      </button>

      <button
        style={linkStyle(currentView === 'settings', collapsed)}
        onClick={() => onNavigate({ view: 'settings' })}
        title="Settings"
        aria-label="Settings"
      >
        <Settings size={18} />
        {!collapsed && <span>Settings</span>}
      </button>

      <button
        style={linkStyle(currentView === 'builder', collapsed)}
        onClick={() => onNavigate({ view: 'builder' })}
        title="Playbook Builder"
        aria-label="Playbook Builder"
      >
        <Workflow size={18} />
        {!collapsed && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Playbook Builder</span>}
      </button>

      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          marginTop: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: collapsed ? '0' : '10px',
          padding: collapsed ? '8px' : '8px 12px',
          borderRadius: '6px',
          background: 'none',
          color: '#6b7280',
          cursor: 'pointer',
          border: 'none',
          width: '100%',
          fontSize: '13px',
          fontWeight: 500,
          transition: 'all 0.2s ease',
        }}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronRight size={18} />
        ) : (
          <>
            <ChevronLeft size={18} />
            <span>Collapse</span>
          </>
        )}
      </button>
    </nav>
  );
}
