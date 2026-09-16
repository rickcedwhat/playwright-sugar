# Outcomes

DSL for building outcome specs used by [`attemptAction`](./attempt-action) / [`detectState`](./attempt-action#detectstate).

## Outcomes.success

```ts
Outcomes.success(locator: LocatorArg): OutcomeSpec
Outcomes.success(name: string, locator: LocatorArg, opts?: { onOutcome? }): OutcomeSpec
```

Marks an outcome as successful.

```ts
Outcomes.success(page.getByText('Saved'))
Outcomes.success('created', page.getByText('Saved'))
Outcomes.success('created', page.getByText('Saved'), {
  onOutcome: async (el) => el.getAttribute('data-id'),
})
```

## Outcomes.failure

```ts
Outcomes.failure(locator: LocatorArg): OutcomeSpec
Outcomes.failure(name: string, locator: LocatorArg, opts?: { onOutcome? }): OutcomeSpec
```

Same forms as `success`, with `isSuccess: false`.

```ts
Outcomes.failure(page.getByText('Permission denied'))
Outcomes.failure('blocked', page.locator('[data-toast]').filter({ hasText: /failed/i }))
```

## Outcomes.timeout

```ts
Outcomes.timeout(name?: string, opts?: { isSuccess?: boolean }): OutcomeSpec
```

Soft branch when **no locator outcome wins** before `attemptAction`’s `timeout` option elapses. The wait budget itself is **`AttemptActionOptions.timeout`**, not an argument here.

```ts
Outcomes.timeout()                          // name 'timeout', failure
Outcomes.timeout('no-feedback')             // named failure
Outcomes.timeout('still-closed', { isSuccess: true })  // timeout = success (e.g. modal never opened)
```

## Outcomes.actionError

```ts
Outcomes.actionError(name?: string): OutcomeSpec
```

Soft branch when the `action` callback **throws** (missing button, etc.) and nothing else wins.

```ts
Outcomes.actionError()
Outcomes.actionError('button-missing')
```

## Locator arg

| Form | When to use |
|---|---|
| `page.getByText('Done')` | Direct `attemptAction` / `detectState` usage |
| `(winner) => …` via `onOutcome` | Extract data from the winning locator |
