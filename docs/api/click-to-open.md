# clickToOpen

Clicks a trigger element and retries until a target element becomes visible. Use when a single click is not always sufficient — for example, a button that opens a panel only after its data has loaded.

## Signature

```ts
clickToOpen(
  trigger: Locator,
  target: Locator,
  options?: {
    maxRetries?: number;
    timeout?: number;
    subTimeout?: number;
  }
): Promise<void>
```

| Option | Default | Description |
|---|---|---|
| `maxRetries` | `3` | Maximum number of click attempts. |
| `timeout` | `30000` | Overall timeout in ms. |
| `subTimeout` | `2000` | How long to wait for the target after each click. |

Throws if the target never appears within `timeout` ms or after `maxRetries` attempts.

## Example

```ts
import { clickToOpen } from '@rickcedwhat/playwright-sugar';

await clickToOpen(
  page.getByRole('button', { name: 'Open panel' }),
  page.getByRole('dialog'),
  { subTimeout: 1000, maxRetries: 3 }
);

await expect(page.getByRole('dialog')).toBeVisible();
```
