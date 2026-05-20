import type { Locator } from '@playwright/test';

export type WatchForOptions = {
  interval?: number;
};

/**
 * Polls a locator and calls `callback` each time it's visible.
 * Returns a stop function that halts polling after the current iteration completes.
 *
 * The callback is responsible for its own error handling.
 */
export function watchFor(
  locator: Locator,
  callback: (el: Locator) => Promise<void>,
  opts?: WatchForOptions
): () => void {
  let active = true;
  const raw = opts?.interval;
  const interval = (Number.isFinite(raw) && raw! > 0) ? raw! : 500;

  const poll = async () => {
    while (active) {
      try {
        if (await locator.isVisible()) {
          await callback(locator);
        }
      } catch {
        // transient errors (e.g. element detached between isVisible and callback) don't stop polling
      }
      await new Promise<void>(resolve => setTimeout(resolve, interval));
    }
  };

  poll();

  return () => { active = false; };
}
