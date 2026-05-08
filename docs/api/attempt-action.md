# attemptAction

Runs an action and waits for one of several named outcomes to appear. Returns the winning outcome rather than throwing, making it safe to branch on RBAC failures, toast messages, or missing UI elements.

## Signature

```ts
attemptAction(params: {
  action: () => Promise<void>;
  outcomes: Outcome[];
  timeout?: number;
}): Promise<{ isSuccess: boolean; outcome: string; data?: unknown }>
```

| Parameter | Type | Description |
|---|---|---|
| `action` | `() => Promise<void>` | The interaction to perform before waiting for outcomes. |
| `outcomes` | `Outcome[]` | At least one outcome to watch for. Use the [`Outcomes`](/api/outcomes) helpers to build them. |
| `timeout` | `number` | Overall timeout in ms (default 30 000). Overridden by an `Outcomes.timeout(after)` if present. |

## Return value

| Field | Type | Description |
|---|---|---|
| `isSuccess` | `boolean` | `true` if the winning outcome was created with `Outcomes.success`. |
| `outcome` | `string` | The name of the winning outcome. |
| `data` | `unknown` | Optional data returned by the outcome's `onOutcome` callback. |

## Timeout and error behaviour

### `timeout` param vs `Outcomes.timeout`

These two are related but distinct:

- **`timeout` param** — how long to poll before giving up. If no `Outcomes.timeout` is defined and the clock expires, `attemptAction` **throws** an `Error` with a debug summary of every outcome it checked.
- **`Outcomes.timeout(after)`** — captures the timeout as a *named outcome*. When defined, expiry resolves normally with `{ isSuccess: false, outcome: 'timeout' }` instead of throwing. The `after` value also sets the polling window, overriding the `timeout` param.

The same distinction applies to action errors:

- If the `action` throws and no `Outcomes.actionError` is defined, the error is swallowed and polling continues until the clock expires (then throws or resolves via `Outcomes.timeout`).
- **`Outcomes.actionError(name?)`** — captures the throw as a named outcome so you can distinguish "button was missing" from "nothing happened in time."

### One of each, many success/failures

You can define at most one `Outcomes.timeout` and one `Outcomes.actionError`. Having multiple would be ambiguous — there is only one clock and one action. You *can* define as many `Outcomes.success` and `Outcomes.failure` outcomes as needed.

```ts
outcomes: [
  Outcomes.success(page.getByText('Created')),
  Outcomes.success(page.getByText('Already exists')),   // ✅ two successes fine
  Outcomes.failure(page.getByText('Permission denied')),
  Outcomes.failure(page.getByText('Quota exceeded')),   // ✅ two failures fine
  Outcomes.actionError('trigger-missing'),               // ✅ one action error
  Outcomes.timeout(5000),                               // ✅ one timeout
]
```

## Examples

### Success / failure branch

```ts
const result = await attemptAction({
  action: async () => {
    await page.getByRole('button', { name: 'Submit' }).click();
  },
  outcomes: [
    Outcomes.success(page.getByText('Saved')),
    Outcomes.failure(page.getByText('Permission denied')),
    Outcomes.timeout(5000),
  ],
});

expect(result.isSuccess).toBe(true);
```

### Distinguishing action error from timeout

```ts
const result = await attemptAction({
  action: async () => {
    await page.locator('#missing-btn').click({ timeout: 500 });
  },
  outcomes: [
    Outcomes.success(page.getByText('Done')),
    Outcomes.actionError('button-missing'),
    Outcomes.timeout(3000),
  ],
});
// result.outcome === 'button-missing' when the click throws
// result.outcome === 'timeout'        when the page just never shows 'Done'
```
