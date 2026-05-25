/**
 * Applies URL query overrides before React reads localStorage (iframe-friendly demos).
 *
 * Supported params:
 * - `clear=1` — wipe persisted datasets
 * - `seed=<name>` — append one dataset row (after optional clear)
 * - `gotoDetail=first` — navigate to the detail view of the first row in persisted storage (used by docs demos)
 * - `view=settings` — consumed by `parseInitialRouteFromUrl` in App
 *
 * `role=viewer` is read live from the URL in `DatasetsPage` (no bootstrap needed).
 */
export function applySugarLabUrlOverrides(): void {
  if (typeof window === 'undefined') return;
  try {
    const p = new URLSearchParams(window.location.search);
    if (p.get('clear') === '1') {
      localStorage.removeItem('sugar-lab-datasets');
    }
    const seed = p.get('seed')?.trim();
    if (seed) {
      const raw = localStorage.getItem('sugar-lab-datasets');
      const parsed = raw ? JSON.parse(raw) : [];
      const rows: { id: string; name: string }[] = Array.isArray(parsed) ? parsed : [];
      rows.push({ id: crypto.randomUUID(), name: seed });
      localStorage.setItem('sugar-lab-datasets', JSON.stringify(rows));
    }
  } catch {
    // ignore malformed storage / JSON
  }
}

type InitialRoute =
  | { view: 'datasets' }
  | { view: 'dataset-detail'; id: string }
  | { view: 'settings' };

export function parseInitialRouteFromUrl(): InitialRoute {
  if (typeof window === 'undefined') return { view: 'datasets' };
  const params = new URLSearchParams(window.location.search);
  const v = params.get('view');
  if (v === 'settings') return { view: 'settings' };
  const gotoDetail = params.get('gotoDetail');
  if (gotoDetail === 'first') {
    try {
      const raw = localStorage.getItem('sugar-lab-datasets');
      const parsed = raw ? JSON.parse(raw) : [];
      const rows: { id?: string }[] = Array.isArray(parsed) ? parsed : [];
      const firstId = typeof rows[0]?.id === 'string' ? rows[0].id : null;
      if (firstId) return { view: 'dataset-detail', id: firstId };
    } catch {
      /* ignored */
    }
  }
  return { view: 'datasets' };
}
