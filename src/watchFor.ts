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
  const interval = opts?.interval ?? 500;

  const poll = async () => {
    while (active) {
      if (await locator.isVisible()) {
        await callback(locator);
      }
      await new Promise<void>(resolve => setTimeout(resolve, interval));
    }
  };

  poll();

  return () => { active = false; };
}
