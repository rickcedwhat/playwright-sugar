# attemptAction

Runs an optional action and waits for one of several named outcomes to appear. Returns the winning outcome rather than throwing, making it safe to branch on RBAC failures, toast messages, or missing UI elements.

## Signature

```ts
attemptAction(params: {
  action?: () => Promise<void>;
  outcomes: Outcome[];
  timeout?: number;
}): Promise<{ isSuccess: boolean; outcome: string; data?: unknown }>
```

| Parameter | Type | Description |
|---|---|---|
| `action` | `() => Promise<void>` | Optional. The interaction to perform before waiting for outcomes. |
| `outcomes` | `Outcome[]` | At least one outcome to watch for. Use the [`Outcomes`](/api/outcomes) DSL to build them. |
| `timeout` | `number` | Overall timeout in ms. Overridden by a `Outcomes.timeout(after)` if present. |

## Return value

| Field | Type | Description |
|---|---|---|
| `isSuccess` | `boolean` | `true` if the winning outcome was created with `Outcomes.success`. |
| `outcome` | `string` | The name of the winning outcome. |
| `data` | `unknown` | Optional data returned by the outcome's `onOutcome` callback. |

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

### Action error vs timeout

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
```

### No action (detect-only)

```ts
const result = await attemptAction({
  outcomes: [
    Outcomes.success(page.getByText('Welcome')),
    Outcomes.failure(page.getByText('Session expired')),
  ],
});
```
