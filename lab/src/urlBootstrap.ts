/**
 * Applies URL query overrides before React reads localStorage (iframe-friendly demos).
 *
 * Supported params:
 * - `clear=1` — wipe persisted datasets
 * - `seed=<name>` — append one dataset row (after optional clear)
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
      const rows: { id: string; name: string }[] = raw ? JSON.parse(raw) : [];
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
  const v = new URLSearchParams(window.location.search).get('view');
  if (v === 'settings') return { view: 'settings' };
  return { view: 'datasets' };
}
