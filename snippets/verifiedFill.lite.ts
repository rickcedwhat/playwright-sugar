/**
 * Lite `verifiedFill` — copy into your repo.
 * Fill + blur + assert value; one silent retry. Package export adds clearer retry logs.
 */
import type { Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export async function verifiedFill(
  locator: Locator,
  value: string,
  params: { validate?: boolean; timeout?: number } = {}
): Promise<void> {
  const { validate = true, timeout = 5_000 } = params;
  await locator.fill(value);
  await locator.blur();
  if (!validate) return;

  try {
    await expect(locator).toHaveValue(value, { timeout });
  } catch {
    await locator.fill(value);
    await locator.blur();
    await expect(locator).toHaveValue(value, { timeout });
  }
}
