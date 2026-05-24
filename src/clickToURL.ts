import type { Page, Locator } from '@playwright/test';

/**
 * Atomic Navigation Helper
 * Clicks a trigger and waits for the page to navigate to the expected URL.
 * Retries the click if the navigation doesn't happen (e.g. click was swallowed by React hydration).
 */
export async function clickToURL(
  page: Page,
  trigger: Locator,
  expectedUrl: string | RegExp | ((url: URL) => boolean),
  opts: { timeout?: number; subTimeout?: number; maxRetries?: number } = {}
): Promise<void> {
  const timeout = Math.max(1, opts.timeout ?? 15000);
  const subTimeout = opts.subTimeout ?? 2000;
  const maxRetries = Math.max(0, opts.maxRetries ?? 5);
  const startTime = Date.now();

  for (let i = 0; i <= maxRetries; i++) {
    const remaining = timeout - (Date.now() - startTime);
    if (remaining <= 0) {
      throw new Error(`clickToURL timed out after ${timeout}ms. Never navigated to expected URL.`);
    }

    const attemptTimeout = Math.min(subTimeout, remaining);
    const controller = new AbortController();
    const { signal } = controller;
    let globalTimerId: ReturnType<typeof setTimeout> | undefined;

    try {
      await Promise.race([
        new Promise<never>((_, reject) => {
          globalTimerId = setTimeout(() => {
            controller.abort();
            reject(new Error('__global_timeout__'));
          }, remaining);
        }),
        (async () => {
          await trigger.click({ timeout: attemptTimeout });
          if (signal.aborted) return;
          await page.waitForURL(expectedUrl, { timeout: attemptTimeout, waitUntil: 'commit' });
        })(),
      ]);
      clearTimeout(globalTimerId);
      controller.abort(); // cancel any still-running inner branch
      return; // Success
    } catch (e) {
      clearTimeout(globalTimerId);
      const msg = e instanceof Error ? e.message : String(e);
      const isGlobalTimeout = msg === '__global_timeout__' || signal.aborted;

      if (isGlobalTimeout || Date.now() - startTime > timeout) {
        throw new Error(`clickToURL timed out after ${timeout}ms. Never navigated to expected URL.`);
      }

      if (i === maxRetries) {
        throw new Error(`clickToURL failed after ${maxRetries} retries. Error: ${msg}`);
      }

      console.log(`clickToURL: Navigation not detected after click (attempt ${i + 1}). Error: ${msg}. Retrying in 100ms...`);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}
