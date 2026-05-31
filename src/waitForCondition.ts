import type { Page } from '@playwright/test';

/**
 * Polls `predicate` every 100 ms until it returns `true` or `timeout` ms elapses.
 * Returns `true` if the condition was met, `false` if it timed out.
 */
export async function waitForCondition(
  predicate: () => Promise<boolean>,
  timeout: number,
  page: Page,
): Promise<boolean> {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await predicate()) return true;
    await page.waitForTimeout(100).catch(() => new Promise<void>(r => setTimeout(r, 100)));
  }
  return false;
}
