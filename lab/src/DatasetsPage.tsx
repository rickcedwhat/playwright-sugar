import { useState, useEffect, useRef } from 'react';
import { Ellipsis } from 'lucide-react';
import { toast } from 'sonner';
import type { Dataset } from './App';

// Role is read from the URL so tests can switch it via ?role=viewer
function getRole(): 'admin' | 'viewer' {
  return new URLSearchParams(window.location.search).get('role') === 'viewer'
    ? 'viewer'
    : 'admin';
}

interface Props {
  datasets: Dataset[];
  onCreate: (name: string) => void;
  onUpdate: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  setDirty: (dirty: boolean) => void;
}

export default function DatasetsPage({
  datasets,
  onCreate,
  onUpdate,
  onDelete,
  setDirty,
}: Props) {
  const role = getRole();

  // Which row's dropdown is open
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  // Which row is being renamed (null = none)
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState('');

  const renameRef = useRef<HTMLInputElement>(null);
  const createRef = useRef<HTMLInputElement>(null);

  // Keep parent dirty state in sync with rename form
  useEffect(() => {
    setDirty(renamingId !== null);
  }, [renamingId, setDirty]);

  useEffect(() => {
    if (renamingId) renameRef.current?.focus();
  }, [renamingId]);

  useEffect(() => {
    if (showCreate) createRef.current?.focus();
  }, [showCreate]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!openMenuId) return;
    function close() { setOpenMenuId(null); }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [openMenuId]);

  // ── Create ────────────────────────────────────────────────────────────────

  function handleCreateClick() {
    if (role === 'viewer') {
      toast.error('Failed to create dataset');
      return;
    }
    setShowCreate(true);
    setCreateName('');
  }

  function submitCreate() {
    const name = createName.trim();
    if (!name) return;
    onCreate(name);
    setShowCreate(false);
    setCreateName('');
  }

  // ── Rename ────────────────────────────────────────────────────────────────

  function handleRenameClick(dataset: Dataset) {
    if (role === 'viewer') {
      toast.error('Failed to update dataset');
      setOpenMenuId(null);
      return;
    }
    setRenamingId(dataset.id);
    setRenameValue(dataset.name);
    setOpenMenuId(null);
  }

  function cancelRename() {
    setRenamingId(null);
    setRenameValue('');
  }

  function submitRename(id: string) {
    const name = renameValue.trim();
    if (name) {
      onUpdate(id, name);
      toast.success('Updated dataset');
    }
    setRenamingId(null);
    setRenameValue('');
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  function handleDeleteClick(id: string) {
    if (role === 'viewer') {
      toast.error('Failed to delete dataset');
      setOpenMenuId(null);
      return;
    }
    onDelete(id);
    setOpenMenuId(null);
    toast.success('Deleted dataset');
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const isEmpty = datasets.length === 0;

  return (
    <div>
      <h1>Datasets</h1>

      {/* ── Empty state ─────────────────────────────────────────── */}
      {isEmpty && (
        <div style={{ textAlign: 'center', paddingTop: '64px', color: '#666' }}>
          <p style={{ fontSize: '16px', marginBottom: '16px' }}>No datasets</p>
          <button
            onClick={handleCreateClick}
            style={btnPrimary}
          >
            Empty dataset
          </button>
        </div>
      )}

      {/* ── Table state ─────────────────────────────────────────── */}
      {!isEmpty && (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            {/*
              data-component="TableHeadersComponent" is used by Issue #10
              detect() to distinguish table state from empty state.
            */}
            <thead data-component="TableHeadersComponent">
              <tr>
                <th style={th}>Name</th>
                <th style={{ ...th, width: '52px' }} />
              </tr>
            </thead>
            <tbody>
              {datasets.map(dataset => (
                <tr key={dataset.id} style={{ borderBottom: '1px solid #f0f0f0' }}>

                  {/* Name cell — shows inline rename when active */}
                  <td style={td}>
                    {renamingId === dataset.id ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          ref={renameRef}
                          type="text"
                          value={renameValue}
                          onChange={e => setRenameValue(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Escape') cancelRename();
                            if (e.key === 'Enter') submitRename(dataset.id);
                          }}
                          style={textInput}
                        />
                        <button
                          onClick={() => submitRename(dataset.id)}
                          style={btnPrimary}
                        >
                          Save
                        </button>
                        <button onClick={cancelRename} style={btnSecondary}>
                          Cancel
                        </button>
                      </span>
                    ) : (
                      dataset.name
                    )}
                  </td>

                  {/* Actions cell — ellipsis + dropdown */}
                  <td style={{ ...td, position: 'relative', textAlign: 'right' }}>
                    {renamingId !== dataset.id && (
                      <>
                        <button
                          aria-label="Row actions"
                          onClick={e => {
                            e.stopPropagation();
                            setOpenMenuId(
                              openMenuId === dataset.id ? null : dataset.id
                            );
                          }}
                          style={iconBtn}
                        >
                          {/* Lucide renders: <svg class="lucide lucide-ellipsis"> */}
                          <Ellipsis size={16} />
                        </button>

                        {openMenuId === dataset.id && (
                          <div
                            role="menu"
                            onMouseDown={e => e.stopPropagation()}
                            style={dropdown}
                          >
                            <button
                              role="menuitem"
                              onClick={() => handleRenameClick(dataset)}
                              style={menuItem}
                            >
                              Rename
                            </button>
                            <button
                              role="menuitem"
                              onClick={() => handleDeleteClick(dataset.id)}
                              style={{ ...menuItem, color: '#dc2626' }}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Create button shown in table state — exact name "Dataset" */}
          <div style={{ marginTop: '16px' }}>
            <button onClick={handleCreateClick} style={btnPrimary}>
              Dataset
            </button>
          </div>
        </>
      )}

      {/* ── Create modal ────────────────────────────────────────── */}
      {showCreate && (
        <div
          style={overlay}
          onClick={() => setShowCreate(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-dataset-title"
            style={modal}
            onClick={e => e.stopPropagation()}
          >
            <h2 id="create-dataset-title" style={{ marginBottom: '16px', fontSize: '18px' }}>
              Create dataset
            </h2>
            <input
              ref={createRef}
              type="text"
              placeholder="Name"
              value={createName}
              onChange={e => setCreateName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') submitCreate();
                if (e.key === 'Escape') setShowCreate(false);
              }}
              style={{ ...textInput, width: '100%', marginBottom: '16px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button onClick={() => setShowCreate(false)} style={btnSecondary}>
                Cancel
              </button>
              <button onClick={submitCreate} style={btnPrimary}>
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Shared styles ─────────────────────────────────────────────────────────────

const btnPrimary: React.CSSProperties = {
  padding: '7px 14px',
  background: '#1a1a1a',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  fontSize: '13px',
  fontWeight: 500,
};

const btnSecondary: React.CSSProperties = {
  padding: '7px 14px',
  background: 'none',
  border: '1px solid #ccc',
  borderRadius: '6px',
  fontSize: '13px',
};

const textInput: React.CSSProperties = {
  padding: '6px 10px',
  fontSize: '14px',
  border: '1px solid #ccc',
  borderRadius: '6px',
};

const iconBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  padding: '4px',
  borderRadius: '4px',
  display: 'inline-flex',
  alignItems: 'center',
  color: '#666',
};

const th: React.CSSProperties = {
  textAlign: 'left',
  padding: '10px 12px',
  borderBottom: '2px solid #e5e5e5',
  fontWeight: 600,
  fontSize: '13px',
};

const td: React.CSSProperties = {
  padding: '10px 12px',
  verticalAlign: 'middle',
};

const dropdown: React.CSSProperties = {
  position: 'absolute',
  right: 8,
  top: '100%',
  zIndex: 50,
  background: '#fff',
  border: '1px solid #e5e5e5',
  borderRadius: '6px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  minWidth: '140px',
  overflow: 'hidden',
};

const menuItem: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '8px 16px',
  background: 'none',
  border: 'none',
  textAlign: 'left',
  fontSize: '14px',
  cursor: 'pointer',
};

const overlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 100,
};

const modal: React.CSSProperties = {
  background: '#fff',
  borderRadius: '8px',
  padding: '24px',
  width: '400px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
};
