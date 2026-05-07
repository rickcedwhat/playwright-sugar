import type { Locator } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Fills a field and verifies that the value actually stuck.
 * Handles cases where React/Vue state lag might cause values to revert.
 * 
 * @param locator - The field to fill
 * @param value - The value to enter
 * @param params.validate - Whether to verify the value after filling (default: true)
 * @param params.timeout - How long to wait for verification (default: 5000ms)
 */
export async function verifiedFill(
  locator: Locator,
  value: string,
  params: { validate?: boolean; timeout?: number } = {}
) {
  const { validate = true, timeout = 5000 } = params;

  await locator.fill(value);
  
  // Blur the field to trigger any 'change' or 'blur' events that might sync state
  await locator.blur();

  if (validate) {
    try {
      await expect(locator).toHaveValue(value, { timeout });
    } catch (e) {
      // Re-try once if it failed (sometimes a single retry handles the lag)
      await locator.fill(value);
      await locator.blur();
      await expect(locator).toHaveValue(value, { timeout });
    }
  }
}
