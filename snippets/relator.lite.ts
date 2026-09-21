/**
 * AUTO-GENERATED — do not edit by hand.
 * Source: src/relator.ts
 * Regenerate: pnpm run snippets:generate
 *
 * Lite copy-paste relator. Same core behavior as the package
 * export; robust-only diagnostics and extras are stripped.
 * Standalone: imports @playwright/test only (no other sugar helpers).
 */
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

  return result;
}
