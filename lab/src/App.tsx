import { useState } from 'react';
import { Toaster } from 'sonner';
import Sidebar from './Sidebar';
import DatasetsPage from './DatasetsPage';
import DatasetDetailPage from './DatasetDetailPage';
import SettingsPage from './SettingsPage';
import LeaveDialog from './LeaveDialog';
import { parseInitialRouteFromUrl } from './urlBootstrap';

export type Dataset = { id: string; name: string };

type Route =
  | { view: 'datasets' }
  | { view: 'dataset-detail'; id: string }
  | { view: 'settings' };

function loadDatasets(): Dataset[] {
  try {
    return JSON.parse(localStorage.getItem('sugar-lab-datasets') || '[]');
  } catch {
    return [];
  }
}

function saveDatasets(datasets: Dataset[]) {
  localStorage.setItem('sugar-lab-datasets', JSON.stringify(datasets));
}

export default function App() {
  const [datasets, setDatasets] = useState<Dataset[]>(loadDatasets);
  const [route, setRoute] = useState<Route>(() => parseInitialRouteFromUrl());
  // true when the rename form is open — blocks navigation
  const [dirty, setDirty] = useState(false);
  const [pendingRoute, setPendingRoute] = useState<Route | null>(null);

  function navigate(next: Route) {
    if (dirty) {
      setPendingRoute(next);
    } else {
      setRoute(next);
    }
  }

  function updateDatasets(next: Dataset[]) {
    setDatasets(next);
    saveDatasets(next);
  }

  function handleCreate(name: string) {
    const id = crypto.randomUUID();
    updateDatasets([...datasets, { id, name }]);
    navigate({ view: 'dataset-detail', id });
  }

  function handleUpdate(id: string, name: string) {
    updateDatasets(datasets.map(d => (d.id === id ? { ...d, name } : d)));
  }

  function handleDelete(id: string) {
    updateDatasets(datasets.filter(d => d.id !== id));
  }

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Sidebar currentView={route.view} onNavigate={navigate} />

      <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        {route.view === 'datasets' && (
          <DatasetsPage
            datasets={datasets}
            onCreate={handleCreate}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            setDirty={setDirty}
          />
        )}
        {route.view === 'dataset-detail' && (
          <DatasetDetailPage
            dataset={datasets.find(d => d.id === route.id) ?? null}
          />
        )}
        {route.view === 'settings' && <SettingsPage />}
      </main>

      {pendingRoute && (
        <LeaveDialog
          onLeave={() => {
            setDirty(false);
            setRoute(pendingRoute);
            setPendingRoute(null);
          }}
          onStay={() => setPendingRoute(null)}
        />
      )}

      <Toaster richColors />
    </div>
  );
}
