# attemptAction

Runs a **required** action, then waits for one of several named outcomes to appear. Returns the winning outcome rather than throwing in common cases, making it practical to branch on RBAC failures, toast messages, or missing UI elements.

## Signature

```ts
import type { AttemptActionOptions, AttemptResolution } from '@rickcedwhat/playwright-sugar';

attemptAction(
  action: () => Promise<void>,
  outcomes: Outcome[],
  opts?: AttemptActionOptions
): Promise<AttemptResolution>
```

`AttemptActionOptions` is an object so you can add future fields (poll tuning, debug flags) without changing the positional shape.

| Field | Type | Description |
|-------|------|-------------|
| `timeout` | `number` | Polling budget in ms. Default **30000**. Does not replace soft timeout outcomes — see below. |

## Return value (`AttemptResolution`)

| Field | Type | Description |
|-------|------|-------------|
| `isSuccess` | `boolean` | `true` if the winning outcome was created with `Outcomes.success`. |
| `outcome` | `string` | The name of the winning outcome. |
| `payload` | `unknown` | Present only when the winning branch’s `onOutcome` returned a defined value. |
| `locator?` | `Locator` | Present only when a **locator-based** outcome won (omitted on soft timeout / action-error paths). |

`onOutcome` runs only when an outcome becomes the visible winner with a real `Locator`. **Soft timeout** and **action-error** resolutions do not call `onOutcome` — there is no winning element.

## Examples

### Success / failure branch

```ts
const result = await attemptAction(
  async () => {
    await page.getByRole('button', { name: 'Submit' }).click();
  },
  [
    Outcomes.success(page.getByText('Saved')),
    Outcomes.failure(page.getByText('Permission denied')),
    Outcomes.timeout(5000),
  ],
);

expect(result.isSuccess).toBe(true);
```

### Explicit hard timeout

```ts
const result = await attemptAction(
  async () => page.getByRole('button', { name: 'Save' }).click(),
  [Outcomes.success(page.getByText('OK')), Outcomes.failure(page.getByText('Error'))],
  { timeout: 10_000 },
);
```

### Detect-only (no meaningful action)

Use a no-op action when you only want to poll for a state:

```ts
const result = await attemptAction(
  async () => {},
  [
    Outcomes.success(page.getByText('Welcome')),
    Outcomes.failure(page.getByText('Session expired')),
  ],
  { timeout: 5000 },
);
```

Prefer **`detectPageState`** (below) for this pattern — it wraps the same engine with a clearer name.

### Action error vs timeout

```ts
const result = await attemptAction(
  async () => {
    await page.locator('#missing-btn').click({ timeout: 500 });
  },
  [
    Outcomes.success(page.getByText('Done')),
    Outcomes.actionError('button-missing'),
    Outcomes.timeout(3000),
  ],
);
// result.outcome === 'button-missing' when the click throws
```

## `detectPageState`

For “wait until one of these locators wins” without running an action, use `detectPageState` (implemented with a no-op `attemptAction`):

```ts
const result = await detectPageState({
  outcomes: [/* ... */],
  timeout: 5000,
});
```
