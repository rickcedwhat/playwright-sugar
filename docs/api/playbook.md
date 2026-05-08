# Playbook

A named registry of play factories. Bind a `page` (and any extra context) with `.withCtx()` before passing to `Director`.

## Constructor

```ts
new Playbook(name: string, plays: Record<string, (params: any) => Play>)
new Playbook(plays: Record<string, (params: any) => Play>)
```

```ts
const datasetPb = new Playbook('DatasetPlaybook', {
  exists: ({ name }) => new Play()
    .nav(async page => { await page.getByRole('button', { name: 'Datasets' }).click(); })
    .detect(page => [
      { name: 'found',    isSuccess: true,  locator: page.locator(`tr:has-text("${name}")`) },
      { name: 'notFound', isSuccess: false, locator: page.getByText('No datasets') },
    ]),

  create: ({ name }) => new Play()
    // ...
});
```

## .withCtx(ctx)

Returns a new Playbook with merged context. The original is unchanged. Must be called with at least `{ page }` before using `Director`.

```ts
const pb = datasetPb.withCtx({ page });
// with extra context
const pbWithTable = datasetPb.withCtx({ page, table: braintrustTable });
```

Extra keys are available in every act function via `ctx`:

```ts
.nav(async (page, ctx) => {
  const table = ctx['table'] as BraintrustTable;
  // ...
})
```

