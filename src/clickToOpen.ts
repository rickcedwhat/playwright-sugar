import { expect } from '@playwright/test';
import type { Locator } from '@playwright/test';

/**
 * Guaranteed Side-Effect Click
 * Retries the click if the target element doesn't appear.
 */
export async function clickToOpen(
  trigger: Locator,
  target: Locator,
  options: { maxRetries?: number; timeout?: number; subTimeout?: number } = {}
): Promise<void> {
  const { maxRetries = 3, timeout = 30000, subTimeout = 2000 } = options;
  const startTime = Date.now();

  for (let i = 0; i <= maxRetries; i++) {
    try {
      await trigger.click();
      
      // Wait for target with a short sub-timeout
      await target.waitFor({ state: 'visible', timeout: subTimeout });
      return; // Success
    } catch (e) {
      if (Date.now() - startTime > timeout) {
        throw new Error(`clickToOpen timed out after ${timeout}ms. Target never appeared.`);
      }
      
      if (i === maxRetries) {
        throw new Error(`clickToOpen failed after ${maxRetries} retries. Target never appeared.`);
      }
      
      console.log(`clickToOpen: Target not visible after click (attempt ${i + 1}). Retrying in 100ms...`);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}
