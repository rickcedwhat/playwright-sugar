# Play

An immutable, chainable builder that describes a test scenario as a sequence of named steps. Each method returns a new `Play` — the original is unchanged.

## Constructor

```ts
new Play()
```

## Step builders

All builders except `.attempt()` accept an optional `ActOptions` as their last argument: `{ skip?: boolean }`.

### .nav(fn, opts?)

Navigation step — click a sidebar link, go to a URL. Logged as `nav`.

```ts
new Play().nav(async page => {
  await page.getByRole('link', { name: 'Datasets' }).click();
})
```

### .prep(fn, opts?)

Setup step that runs before the attempt — open a menu, select a row. Logged as `prep`.

### .reload(reloadOpts?, opts?)

Reloads the page. Accepts the same options as Playwright's `page.reload()`.

```ts
new Play().reload({ waitUntil: 'domcontentloaded' }, { skip: !withReload })
```

### .detect(fn, opts?)

Waits for one of several locators to appear and records the winner in `ctx.state`. Used for branching (e.g. determine whether a table is empty or populated).

```ts
new Play().detect(page => [
  { name: 'empty',    isSuccess: true,  locator: page.getByText('No items') },
  { name: 'hasItems', isSuccess: true,  locator: page.locator('tbody tr') },
], { timeout: 8000 })
```

`ctx.state` is set to `{ name, isSuccess, data }` after detect runs.

### .attempt(trigger, outcomes, timeout?)  /  .attempt(name, trigger, outcomes, timeout?)

Performs an action and waits for an outcome.

**Unnamed attempt** (logged as `attempt`):

```ts
new Play().attempt(
  async (page, ctx) => {
    const btn = ctx['state']?.name === 'empty' ? 'Empty item' : 'Item';
    await page.getByRole('button', { name: btn }).click();
    await page.getByPlaceholder('Name').fill('My Item');
    await page.getByRole('button', { name: 'Create' }).click();
  },
  [
    Outcomes.success(p => p.getByText('Item created')),
    Outcomes.failure(p => p.getByText('Permission denied')),
    Outcomes.timeout(8000),
  ],
)
```

**Named attempt** (logged under the given name, e.g. for clearer errors):

```ts
new Play().attempt(
  'submit',
  async page => {
    await page.getByRole('button', { name: 'Save' }).click();
  },
  [
    Outcomes.success(page => page.getByText('Saved')),
    Outcomes.failure(page => page.getByText('Validation failed')),
    Outcomes.timeout(5000),
  ],
)
```

`ctx.result` is set to `{ isSuccess, outcome, data }` after the attempt.

#### Timeout semantics

Timeouts are resolved in this order:

1. **Positional `timeout`** (third argument on the unnamed overload, fourth on the named overload): passed through to `attemptAction` as the polling budget. If no locator outcome wins before this limit **and** there is **no** `Outcomes.timeout()` outcome in the list, `attemptAction` throws (hard timeout).

2. **`Outcomes.timeout(after)`** (soft timeout outcome): supplies an `after` value used as the polling budget **when** no explicit positional timeout is provided. If the timer expires without another locator winning, the winner is the timeout **outcome** — resolution completes normally and `ctx.result` reflects that outcome (typically `isSuccess: false`), rather than throwing.

3. **Default** (30 seconds): used when neither a positional timeout nor a timeout outcome with an `after` value applies.

Whether expiry throws or returns a named outcome depends on your outcome list: include `Outcomes.timeout(...)` when you want a soft, named timeout path; rely on positional timeout alone when unmatched states should fail the step with an error.

### .cleanup(fn, opts?)

Runs after a successful attempt — typically reverts state so the test is idempotent. Skipped if the attempt was never reached or if a prior step threw.

```ts
new Play().cleanup(async (page, ctx) => {
  if ((ctx.result as any)?.isSuccess) {
    // revert the change
  } else {
    await page.keyboard.press('Escape');
  }
})
```

## Execution

### .run(label, ctx)

```ts
play.run(label: string, ctx: PlayCtx): Promise<PlayCtx>
```

Executes all steps in order. Calls `page.bringToFront()` automatically. Logs each step with ✅ / ❌ / ⏭ and timing. Normally called by `Director` rather than directly.

## Step context (PlayCtx)

```ts
type PlayCtx = {
  page: Page;
  state: { name: string; isSuccess: boolean; data?: unknown } | null;
  result: { isSuccess: boolean; outcome: string; data?: unknown } | null;
  [key: string]: unknown; // extra keys from Playbook.withCtx()
}
```
