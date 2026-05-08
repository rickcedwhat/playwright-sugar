# Play

An immutable, chainable builder that describes a test scenario as a sequence of named steps. Each method returns a new `Play` — the original is unchanged.

## Constructor

```ts
new Play()
```

## Step builders

All builders accept an optional `ActOptions` as their last argument: `{ skip?: boolean }`.

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

### .attempt(config, opts?)  /  .attempt(name, config, opts?)

Performs an action and waits for an outcome.

```ts
new Play().attempt({
  trigger: async (page, ctx) => {
    const btn = ctx['state']?.name === 'empty' ? 'Empty item' : 'Item';
    await page.getByRole('button', { name: btn }).click();
    await page.getByPlaceholder('Name').fill('My Item');
    await page.getByRole('button', { name: 'Create' }).click();
  },
  outcomes: [
    Outcomes.success(p => p.getByText('Item created')),
    Outcomes.failure(p => p.getByText('Permission denied')),
    Outcomes.timeout(8000),
  ],
})
```

`ctx.result` is set to `{ isSuccess, outcome, data }` after the attempt.

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
