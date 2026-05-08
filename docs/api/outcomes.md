# Outcomes

DSL for building outcome specs used by [`attemptAction`](/api/attempt-action) and [`Play.attempt()`](/api/play).

## Outcomes.success

```ts
Outcomes.success(locator: LocatorArg): OutcomeSpec
Outcomes.success(name: string, locator: LocatorArg, opts?: { onOutcome? }): OutcomeSpec
```

Marks an outcome as successful. `locator` can be a pre-bound `Locator` or a `(page, ctx) => Locator` function.

```ts
Outcomes.success(page.getByText('Saved'))
Outcomes.success('created', page.getByText('Saved'))
Outcomes.success(p => p.getByText('Saved'))
Outcomes.success('created', (p, ctx) => p.getByText(ctx['expectedText'] as string))
```

## Outcomes.failure

```ts
Outcomes.failure(locator: LocatorArg): OutcomeSpec
Outcomes.failure(name: string, locator: LocatorArg, opts?: { onOutcome? }): OutcomeSpec
```

Marks an outcome as a failure. Same locator forms as `success`.

```ts
Outcomes.failure(page.getByText('Permission denied'))
Outcomes.failure('blocked', p => p.locator('[data-toast]').filter({ hasText: /failed/i }))
```

## Outcomes.timeout

```ts
Outcomes.timeout(): OutcomeSpec
Outcomes.timeout(after: number): OutcomeSpec
Outcomes.timeout(name: string, after?: number): OutcomeSpec
```

Resolves when no other outcome is detected within the allotted time. The `after` value (ms) is passed to `attemptAction` as the timeout.

```ts
Outcomes.timeout()               // default name 'timeout'
Outcomes.timeout(8000)           // 8 s timeout
Outcomes.timeout('rbac-missing', 5000)
```

## Outcomes.actionError

```ts
Outcomes.actionError(name?: string): OutcomeSpec
```

Resolves when the `action` function throws (e.g. a button was missing). Useful to distinguish a missing trigger from a true timeout.

```ts
Outcomes.actionError()
Outcomes.actionError('button-missing')
```

## Locator arg

All locator-bearing outcomes accept:

| Form | When to use |
|---|---|
| `page.getByText('Done')` | Page is in scope (direct `attemptAction` usage) |
| `p => p.getByText('Done')` | Inside `Play.attempt()` — page resolved at run time |
| `(p, ctx) => p.getByText(ctx['label'] as string)` | Need Playbook context values |
