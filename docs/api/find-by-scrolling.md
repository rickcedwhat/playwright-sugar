# findByScrolling

Scrolls a container until a target element is found. Supports virtualized lists and infinite-scroll pages where elements are not in the DOM until scrolled into view.

## Signature

```ts
findByScrolling(
  target: Locator,
  options?: FindByScrollingOptions
): Promise<void>
```

```ts
interface FindByScrollingOptions {
  container?: Locator;
  maxAttempts?: number;      // default: 50
  waitAfterStep?: number;    // default: 200 ms
  scrollStrategy?: ScrollStrategy;
  endStrategy?: EndStrategy;
  matchStrategy?: MatchStrategy;
  stepAmount?: number;       // default: 600 px (simple shorthand)
  stepAction?: () => Promise<void>; // custom scroll action shorthand
}
```

## Basic example

```ts
import { findByScrolling } from '@rickcedwhat/playwright-sugar';

await findByScrolling(page.getByText('Item #500'), {
  container: page.locator('.virtual-list'),
  stepAmount: 400,
});

await expect(page.getByText('Item #500')).toBeVisible();
```

## Strategy-based example

Use the built-in strategy factories for fine-grained control.

```ts
import {
  findByScrolling,
  ScrollStrategies,
  EndStrategies,
  MatchStrategies,
} from '@rickcedwhat/playwright-sugar';

await findByScrolling(page.getByText('Item #500'), {
  container: page.locator('.virtual-list'),
  scrollStrategy: ScrollStrategies.byPixels(300),
  endStrategy: EndStrategies.noNewItems(),
  matchStrategy: MatchStrategies.isVisible(),
  maxAttempts: 100,
  waitAfterStep: 150,
});
```
