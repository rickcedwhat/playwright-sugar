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

    try {
      await Promise.race([
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Global timeout exceeded')), remaining)),
        (async () => {
          await trigger.click({ timeout: attemptTimeout });
          await page.waitForURL(expectedUrl, { timeout: attemptTimeout, waitUntil: 'commit' });
        })(),
      ]);
      return; // Success
    } catch (e) {
      if (Date.now() - startTime > timeout) {
        throw new Error(`clickToURL timed out after ${timeout}ms. Never navigated to expected URL.`);
      }
      
      if (i === maxRetries) {
        throw new Error(`clickToURL failed after ${maxRetries} retries. Error: ${e instanceof Error ? e.message : String(e)}`);
      }
      
      console.log(`clickToURL: Navigation not detected after click (attempt ${i + 1}). Error: ${e instanceof Error ? e.message : String(e)}. Retrying in 100ms...`);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}
