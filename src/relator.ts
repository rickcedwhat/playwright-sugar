import type { Locator } from '@playwright/test';

/**
 * Finds a target element based on its proximity to an anchor element.
 * This is a prototype from @rickcedwhat/playwright-sugar that is in the works
 */
export function relator(
  anchor: Locator,
  target: Locator,
  container?: Locator,
): Locator {
  const page = anchor.page();

  if (container) {
    return container.filter({ has: anchor }).last().locator(target);
  }

  // Find the smallest shared parent using a global search.
  // This allows anchor and target to be pre-scoped locators (like dialog.getByText)
  // without triggering a "nested" search in the .filter({ has: ... }) call.
  return page
    .locator('*')
    .filter({ has: anchor })
    .filter({ has: target })
    .last()
    .locator(target);
}
