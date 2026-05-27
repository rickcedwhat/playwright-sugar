# Play

An immutable, chainable builder that describes a test scenario as a sequence of named steps. Each method returns a new `Play` — the original is unchanged.

## Constructor

```ts
new Play()
```

## Step builders

All builders except `.attempt()` accept an optional `ActOptions` as their last argument:

```ts
type ActOptions = {
  skip?: boolean | ((ctx: PlayCtx, lastOutcome?: PlayOutcome) => boolean);
};
```

Pass a plain boolean to skip statically, or a predicate to decide at runtime based on context or the previous act's outcome:

```ts
// Static skip
new Play().nav(async page => { /* ... */ }, { skip: !shouldNavigate })

// Predicate skip — skip the cleanup revert if we know the attempt already failed
new Play().cleanup(async (page, _ctx, outcome) => {
  // revert logic
}, { skip: (_ctx, lastOutcome) => lastOutcome?.isSuccess !== true })
```

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

Waits for one of several locators to appear and passes the winner as the **third argument** to every following act. Used for branching (e.g. determine whether a table is empty or populated). The same resolution is also exposed on **`Play.run()`’s return value** as `lastOutcome` (see below).

```ts
new Play().detect(page => [
  { name: 'empty',    isSuccess: true,  locator: page.getByText('No items') },
  { name: 'hasItems', isSuccess: true,  locator: page.locator('tbody tr') },
], { timeout: 8000 })
```

After detect runs, the next act’s third argument `outcome` is `{ name, isSuccess, locator?, payload? }`. `payload` comes from the winning branch’s `onOutcome`, if any. Nothing is written onto `ctx` for this — use `outcome` or the `lastOutcome` field from `.run()`’s result.

### .attempt(action, outcomes, opts?)  /  .attempt(name, action, outcomes, opts?)

Performs an action and waits for an outcome. The optional third/fourth argument is an [`AttemptActionOptions`](/api/attempt-action) object — same shape as `attemptAction(..., opts)` (e.g. `{ timeout }`), with room for future flags.

**Unnamed attempt** (logged as `attempt`):

```ts
new Play().attempt(
  async (page, _ctx, outcome) => {
    const btn = outcome?.name === 'empty' ? 'Empty item' : 'Item';
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

**With an explicit hard timeout budget:**

```ts
new Play().attempt(
  async page => { /* ... */ },
  [Outcomes.success(p => p.getByText('Done')), Outcomes.timeout(12_000)],
  { timeout: 15_000 },
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

After the attempt, the next act’s third argument `outcome` is the attempt resolution (`name` is the winning outcome’s name, `payload` from `onOutcome` if present). It is `undefined` before the first `.detect()` or `.attempt()`.

#### Timeout semantics

Timeouts are resolved in this order:

1. **`opts.timeout`**: passed through to `attemptAction` as the polling budget. If no locator outcome wins before this limit **and** there is **no** `Outcomes.timeout()` outcome in the list, `attemptAction` throws (hard timeout).

2. **`Outcomes.timeout(after)`** (soft timeout outcome): supplies an `after` value used as the polling budget **when** `opts.timeout` is not set. If the timer expires without another locator winning, the winner is the timeout **outcome** — resolution completes normally and the next act’s `outcome` argument (and `run()`’s `lastOutcome`) reflect that result (typically `isSuccess: false`), rather than throwing.

3. **Default** (30 seconds): used when neither `opts.timeout` nor a timeout outcome with an `after` value applies.

Whether expiry throws or returns a named outcome depends on your outcome list: include `Outcomes.timeout(...)` when you want a soft, named timeout path; rely on `opts.timeout` alone when unmatched states should fail the step with an error.

### .cleanup(fn, opts?)

Runs after an **attempt** step has finished (success or failure), unless a prior step threw — typically used to revert state or dismiss UI so the test stays idempotent. Skipped if the attempt was never reached or if a prior step threw.

```ts
new Play().cleanup(async (page, _ctx, outcome) => {
  if (outcome?.isSuccess) {
    // revert the change
  } else {
    await page.keyboard.press('Escape');
  }
})
```

## Execution

### .run(label, ctx)

```ts
play.run(label: string, ctx: PlayCtx): Promise<PlayRunResult>

type PlayRunResult = {
  ctx: PlayCtx;
  /** Final `.detect()` / `.attempt()` resolution in this run, if any. */
  lastOutcome?: PlayOutcome;
}
```

Executes all steps in order. Calls `page.bringToFront()` automatically. Logs each step with ✅ / ❌ / ⏭ and timing. Normally called by `Director` rather than directly. **`ctx` is not mutated with detect/attempt results** — read `lastOutcome` from the return value, or use the **third callback argument** inside each step.

## Step context (PlayCtx)

```ts
import type { Locator } from '@playwright/test';

type PlayOutcome = {
  name: string;
  isSuccess: boolean;
  locator?: Locator;
  payload?: unknown;
};

type PlayCtx = {
  page: Page;
  [key: string]: unknown; // extra keys from Playbook.withCtx()
}
```

Every act callback has the shape `(page, ctx, outcome)` where `outcome` is `undefined` until a prior step was `.detect()` or `.attempt()`.
