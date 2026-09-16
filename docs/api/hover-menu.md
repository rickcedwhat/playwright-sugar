# hoverMenu

Walks a chain of hover-triggered menu items and (by default) clicks the last one. Moves the mouse in an L-shape so nested menus don’t close when the cursor cuts across empty space.

## Signature

```ts
hoverMenu(
  chain: Locator[],
  options?: {
    click?: boolean;       // click the last item — default true
    stepTimeout?: number;  // wait for next item visible — default 5000
    stepDelay?: number;    // pause after each hover — default 100
    retries?: number;      // re-hover attempts per step — default 2
  },
): Promise<Locator>  // the last locator in the chain
```

## Example

```ts
import { hoverMenu } from '@rickcedwhat/playwright-sugar';

await hoverMenu([
  page.getByRole('menuitem', { name: 'File' }),
  page.getByRole('menuitem', { name: 'Export' }),
  page.getByRole('menuitem', { name: 'CSV' }),
]);

// Open the path but leave the last item for a custom action
const csv = await hoverMenu(
  [
    page.getByRole('menuitem', { name: 'File' }),
    page.getByRole('menuitem', { name: 'Export' }),
    page.getByRole('menuitem', { name: 'CSV' }),
  ],
  { click: false },
);
await csv.press('Enter');
```

## When to use

Use when nested menus open on **hover** (not click) and flake under diagonal pointer moves.

Skip it for click-only menus — prefer [`clickToOpen`](./click-to-open) or plain clicks.
