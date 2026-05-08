# relator

Finds a target element that is semantically related to a unique anchor element. Solves the problem of selecting "the Edit button in *this* row" without relying on fragile nth-child or data-testid selectors.

## Signature

```ts
relator(
  anchor: Locator,
  target: Locator,
  container?: string | Locator
): Locator
```

| Parameter | Description |
|---|---|
| `anchor` | A unique element that identifies the context (e.g. row text, card heading). |
| `target` | The element you want to interact with (e.g. a button, an input). |
| `container` | Optional. A CSS selector or Locator for the shared parent. If omitted, `relator` finds the innermost element containing both. |

Returns a standard Playwright `Locator` — all Playwright methods work on it.

## Examples

### With an explicit container

```ts
import { relator } from '@rickcedwhat/playwright-sugar';

// Click "Edit" only in the row containing "Invoice #42"
const editBtn = relator(
  page.getByText('Invoice #42'),
  page.getByRole('button', { name: 'Edit' }),
  'tr'
);
await editBtn.click();
```

### Automatic mode (no container)

`relator` walks the DOM to find the innermost element that contains both the anchor and the target.

```ts
// Click "Buy" only in the "Pro Plan" card
const buyBtn = relator(
  page.getByText('Pro Plan'),
  page.getByRole('button', { name: 'Buy' })
);
await buyBtn.click();
```

### Filling a scoped input

```ts
const statusInput = relator(
  page.getByText('User #2'),
  page.locator('input.status'),
  'div.row'
);
await statusInput.fill('Active');
```
