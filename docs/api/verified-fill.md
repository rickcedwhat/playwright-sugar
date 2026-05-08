# verifiedFill

Fills an input and verifies that the value actually stuck. Handles cases where React or Vue state lag causes the input to revert to its previous value after `fill`.

## Signature

```ts
verifiedFill(
  locator: Locator,
  value: string,
  params?: { validate?: boolean; timeout?: number }
): Promise<void>
```

| Parameter | Default | Description |
|---|---|---|
| `validate` | `true` | Whether to assert the input value after filling. |
| `timeout` | `5000` | How long to wait for the value to stabilise (ms). |

## Example

```ts
import { verifiedFill } from '@rickcedwhat/playwright-sugar';

await verifiedFill(page.getByLabel('Email'), 'user@example.com');
// throws if the input value is not 'user@example.com' after filling
```

## When to use

Standard `locator.fill()` is sufficient for most inputs. Use `verifiedFill` when:

- The field has a controlled React component that resets on every keystroke.
- An autocomplete or mask intercepts the input and transforms the value.
- A slow network request triggers a re-render that clears the field.
