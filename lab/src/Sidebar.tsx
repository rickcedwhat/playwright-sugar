type View = 'datasets' | 'dataset-detail' | 'settings';

interface Props {
  currentView: View;
  onNavigate: (route: { view: 'datasets' } | { view: 'settings' }) => void;
}

const linkStyle = (active: boolean): React.CSSProperties => ({
  display: 'block',
  padding: '8px 12px',
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
});

export default function Sidebar({ currentView, onNavigate }: Props) {
  return (
    <nav
      style={{
        width: '200px',
        borderRight: '1px solid #e5e5e5',
        padding: '24px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        flexShrink: 0,
      }}
    >
      <div style={{ fontWeight: 700, fontSize: '13px', color: '#999', padding: '0 12px 8px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        Sugar Lab
      </div>
      <button
        style={linkStyle(currentView === 'datasets' || currentView === 'dataset-detail')}
        onClick={() => onNavigate({ view: 'datasets' })}
      >
        Datasets
      </button>
      <button
        style={linkStyle(currentView === 'settings')}
        onClick={() => onNavigate({ view: 'settings' })}
      >
        Settings
      </button>
    </nav>
  );
}
