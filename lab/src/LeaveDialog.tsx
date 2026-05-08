import { useEffect, useRef } from 'react';

interface Props {
  onLeave: () => void;
  onStay: () => void;
}

export default function LeaveDialog({ onLeave, onStay }: Props) {
  const stayRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    stayRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onStay();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onStay]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="leave-dialog-title"
      aria-describedby="leave-dialog-desc"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '8px',
          padding: '24px',
          width: '360px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        }}
      >
        <h2 id="leave-dialog-title" style={{ marginBottom: '8px', fontSize: '18px' }}>
          Leave?
        </h2>
        <p id="leave-dialog-desc" style={{ color: '#666', marginBottom: '24px' }}>
          You have unsaved changes. If you leave, they will be lost.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button
            ref={stayRef}
            onClick={onStay}
            style={{
              padding: '8px 16px',
              background: 'none',
              border: '1px solid #ccc',
              borderRadius: '6px',
              fontSize: '14px',
            }}
          >
            Stay
          </button>
          <button
            onClick={onLeave}
            style={{
              padding: '8px 16px',
              background: '#dc2626',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
            }}
          >
            Leave
          </button>
        </div>
      </div>
    </div>
  );
}
