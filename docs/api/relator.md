# relator

Finds a target element that is semantically related to one or more unique anchor elements. Solves the problem of selecting "the Edit button in *this* row" without relying on fragile nth-child or data-testid selectors.

## Signature

```ts
relator(
  target: Locator,
  anchor: Locator | Locator[],
  container?: Locator
): Locator
```

| Parameter | Description |
|---|---|
| `target` | The element you want to interact with (e.g. a button, an input). |
| `anchor` | A unique element (or list of elements) that identifies the context (e.g. row text, card heading). Multiple anchors are AND-combined to find the nearest shared parent. |
| `container` | Optional. A Locator for the shared parent. If omitted, `relator` finds the innermost element containing the anchors and target. |

Returns a standard Playwright `Locator` — all Playwright methods work on it.

## Examples

### With an explicit container

```ts
import { relator } from '@rickcedwhat/playwright-sugar';

// Click "Edit" only in the row containing "Invoice #42"
const editBtn = relator(
  page.getByRole('button', { name: 'Edit' }),
  page.getByText('Invoice #42'),
  page.locator('tr'),
);
await editBtn.click();
```

### Automatic mode (no container)

`relator` walks the DOM to find the innermost element that contains both the anchor and the target.

```ts
// Click "Buy" only in the "Pro Plan" card
const buyBtn = relator(
  page.getByRole('button', { name: 'Buy' }),
  page.getByText('Pro Plan'),
);
await buyBtn.click();
```

### Multiple anchors

When neither anchor alone is unique, pass an array — the nearest common ancestor of all anchors (and the target) is used.

```ts
const editBtn = relator(
  page.getByRole('button', { name: 'Edit' }),
  [page.getByText('Alice', { exact: true }), page.getByText('Viewer', { exact: true })],
);
await editBtn.click();
```

### Filling a scoped input

```ts
const statusInput = relator(
  page.locator('input.status'),
  page.getByText('User #2'),
  page.locator('div.row'),
);
await statusInput.fill('Active');
```
