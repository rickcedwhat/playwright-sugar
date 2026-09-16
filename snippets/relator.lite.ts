/**
 * Lite `relator` — copy into your repo.
 * Find `target` under the smallest shared parent with `anchor`.
 * Package export warns when the result matches zero elements (common scoping footgun).
 */
import type { Locator } from '@playwright/test';

export function relator(
  anchor: Locator,
  target: Locator,
  container?: Locator
): Locator {
  if (container) {
    return container.filter({ has: anchor }).last().locator(target);
  }
  return anchor
    .page()
    .locator('*')
    .filter({ has: anchor })
    .filter({ has: target })
    .last()
    .locator(target);
}
