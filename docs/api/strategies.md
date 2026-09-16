# Strategies

Factories used by [`findByScrolling`](./find-by-scrolling) to control how the helper scrolls, when it stops, and when the target counts as found.

## ScrollStrategies

```ts
import { ScrollStrategies } from '@rickcedwhat/playwright-sugar';

ScrollStrategies.wheel(amount?: number)  // mouse wheel — default 600px; good for virtualized lists
ScrollStrategies.click(button: Locator)  // click "Load more" / "Next"
```

## EndStrategies

```ts
import { EndStrategies } from '@rickcedwhat/playwright-sugar';

EndStrategies.stuck()       // stop when container.scrollTop stops changing
EndStrategies.max(limit)    // stop after `limit` attempts
```

## MatchStrategies

```ts
import { MatchStrategies } from '@rickcedwhat/playwright-sugar';

MatchStrategies.visible()   // target.isVisible()
```

## Custom strategies

Any object matching the interfaces works:

```ts
await findByScrolling(page.getByText('Done'), {
  scrollStrategy: {
    name: 'PageDown',
    perform: async (page) => {
      await page.keyboard.press('PageDown');
    },
  },
  endStrategy: EndStrategies.max(20),
  matchStrategy: MatchStrategies.visible(),
});
```
