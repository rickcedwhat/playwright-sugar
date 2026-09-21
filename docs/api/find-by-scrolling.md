# findByScrolling

Scrolls (or steps) until a target element matches — for virtualized lists and infinite-scroll UIs where the row isn’t in the DOM until you move.

Returns the `Locator` when found, or `null` if the end strategy fires first.

## Signature

```ts
findByScrolling(
  target: Locator,
  options?: FindByScrollingOptions
): Promise<Locator | null>
```

```ts
interface FindByScrollingOptions {
  container?: Locator;
  maxAttempts?: number;      // default: 50
  waitAfterStep?: number;    // default: 200 ms
  scrollStrategy?: ScrollStrategy;
  endStrategy?: EndStrategy;
  matchStrategy?: MatchStrategy;
  stepAmount?: number;       // default: 600 — shorthand for ScrollStrategies.wheel
  stepAction?: () => Promise<void>; // custom step shorthand
}
```

Defaults: wheel scroll, `EndStrategies.stuck()`, `MatchStrategies.visible()`.

## Basic example

```ts
import { findByScrolling } from '@rickcedwhat/playwright-sugar';

const row = await findByScrolling(page.getByText('Item #500'), {
  container: page.locator('.virtual-list'),
  stepAmount: 400,
});

expect(row).not.toBeNull();
await row!.click();
```

## Strategy-based example

```ts
import {
  findByScrolling,
  ScrollStrategies,
  EndStrategies,
  MatchStrategies,
} from '@rickcedwhat/playwright-sugar';

const row = await findByScrolling(page.getByText('Item #500'), {
  container: page.locator('.virtual-list'),
  scrollStrategy: ScrollStrategies.wheel(300),
  endStrategy: EndStrategies.max(100),
  matchStrategy: MatchStrategies.visible(),
  waitAfterStep: 150,
});
```

Load-more button instead of wheel:

```ts
await findByScrolling(page.getByText('Older post'), {
  scrollStrategy: ScrollStrategies.click(page.getByRole('button', { name: 'Load more' })),
  endStrategy: EndStrategies.max(20),
});
```

See also [`strategies`](./strategies) for the factory reference.
