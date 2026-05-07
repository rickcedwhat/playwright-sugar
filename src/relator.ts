import type { Locator, Page } from '@playwright/test';

/**
 * Semantic Relative Locator
 * Finds a target locator that is semantically related to an anchor locator.
 * 
 * @param anchor - The unique reference element (e.g. text for a specific row)
 * @param target - The element you want to find (e.g. a generic button)
 * @param container - Optional: A selector or locator to limit the search (e.g. 'tr' or '.card')
 */
export function relator(
  anchor: Locator,
  target: Locator,
  container?: string | Locator
): Locator {
  const page = anchor.page();

  if (container) {
    const containerLocator = typeof container === 'string' 
      ? page.locator(container) 
      : container;

    return containerLocator
      .filter({ has: anchor })
      .last()
      .locator(target);
  }

  // Automatic mode: Finds the innermost element containing BOTH
  return page.locator('*')
    .filter({ has: anchor })
    .filter({ has: target })
    .last()
    .locator(target);
}
