import type { Locator } from '@playwright/test';

/**
 * Finds a target element based on its proximity to one or more anchor elements.
 * This is a prototype from @rickcedwhat/playwright-sugar that is in the works
 */
export function relator(
  target: Locator,
  anchor: Locator | Locator[],
  container?: Locator,
): Locator {
  const anchors = Array.isArray(anchor) ? anchor : [anchor];

  // Find the smallest shared parent using a global search.
  // This allows anchors and target to be pre-scoped locators (like dialog.getByText)
  // without triggering a "nested" search in the .filter({ has: ... }) call.
  const scope = container
    ? anchors.reduce((s, a) => s.filter({ has: a }), container)
    : anchors
        .reduce((s, a) => s.filter({ has: a }), target.page().locator('*'))
        .filter({ has: target });

  const result = scope.last().locator(target);

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
