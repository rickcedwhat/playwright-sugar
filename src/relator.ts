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
  let result: Locator;

  if (container) {
    result = container.filter({ has: anchor }).last().locator(target);
  } else {
    // Find the smallest shared parent using a global search.
    // This allows anchor and target to be pre-scoped locators (like dialog.getByText)
    // without triggering a "nested" search in the .filter({ has: ... }) call.
    result = page
      .locator('*')
      .filter({ has: anchor })
      .filter({ has: target })
      .last()
      .locator(target);
  }

  void result.count().then(count => {
    if (count === 0) {
      console.warn(
        '[relator] No elements found. ' +
        'If `target` was created from a sub-element locator (e.g. row.locator(...)), ' +
        'try using page.locator() or page.getByRole() instead.'
      );
    }
  }).catch(() => {
    // ignore — locator may not be resolvable (page not yet navigated, etc.)
  });

  return result;
}
