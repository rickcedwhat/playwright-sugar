/**
 * Lite `clickToOpen` — copy into your repo.
 * Click until a target becomes visible. Package export adds retry logging and clearer errors.
 */
import type { Locator } from '@playwright/test';

export async function clickToOpen(
  trigger: Locator,
  target: Locator,
  options: { maxRetries?: number; timeout?: number; subTimeout?: number } = {}
): Promise<void> {
  const { maxRetries = 3, timeout = 30_000, subTimeout = 2_000 } = options;
  const start = Date.now();

  for (let i = 0; i <= maxRetries; i++) {
    try {
      await trigger.click();
      await target.waitFor({ state: 'visible', timeout: subTimeout });
      return;
    } catch {
      if (Date.now() - start > timeout) {
        throw new Error(`clickToOpen timed out after ${timeout}ms`);
      }
      if (i === maxRetries) {
        throw new Error(`clickToOpen failed after ${maxRetries} retries`);
      }
      await new Promise((r) => setTimeout(r, 100));
    }
  }
}
