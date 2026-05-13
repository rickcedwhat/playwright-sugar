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

## .withCtx(ctx) / .withCtx(name, ctx)

Returns a new Playbook with merged context. The original is unchanged. Must be called with at least `{ page }` before using `Director`.

**One argument** — bind the page and any keys you need inside acts (`ctx['table']`, etc.):

```ts
const pb = datasetPb.withCtx({ page });
const pbWithTable = datasetPb.withCtx({ page, table: braintrustTable });
```

**Two arguments** — same as above, plus a **log-only** first segment for {@link Playbook.runLabel} (this `name` is **not** {@link Playbook.name}; the registry id still comes from `new Playbook('DatasetPlaybook', …)`):

```ts
datasetPb.withCtx('User', { page: userPage, table: braintrustTable });
```

Extra keys (other than the log label) are available in every act function via `ctx`:

```ts
.nav(async (page, ctx) => {
  const table = ctx['table'] as BraintrustTable;
  // ...
})
```

## `bindPlaybooks(ctx, catalog, opts?)`

Binds **every** playbook in a plain object to the **same** context (same as calling `.withCtx(ctx)` on each). Use this when you maintain one catalog of playbooks and two (or more) roles/pages — for example `user` and `admin` — so tests do not repeat `.withCtx({ page: … })` per resource.

```ts
import { bindPlaybooks, Director } from '@rickcedwhat/playwright-sugar';

const director = new Director();

const catalog = { dataset: datasetPb, logs: logsPb };
const user = bindPlaybooks({ page: userPage }, catalog, { name: 'User' });
const admin = bindPlaybooks({ page: adminPage }, catalog, { name: 'Admin' });

await director.ensureExists(admin.dataset, { name: 'x' });
await director.assertCan(user.logs, 'access', {});
```

`ctx` is a `Partial<PlaybookCtx>`: pass `{ page }` or `{ page, table, ... }` like `.withCtx()`. Return type preserves each playbook’s play typings (`BoundPlaybookCatalog`). Optional third argument `{ name: 'User' }` is shorthand for two-argument `withCtx('User', { ...ctx })` on every catalog entry. The snippet assumes `datasetPb`, `logsPb`, `userPage`, and `adminPage` are already in scope (for example from your test or page-object setup).

## .runLabel(playName)

Returns the string passed to `Play.run` and used in `Director` errors: **`scope > playbookName > playName`** when `playbookLogScope` / `bindPlaybooks`’s `name` is set, otherwise **`playbookName > playName`**.

## .getPlay(name)

Returns the play factory for the given name. Throws if the play doesn't exist.

## .getPage()

Returns the bound page. Throws if `.withCtx({ page })` has not been called.

## .buildCtx()

Returns an initial `PlayCtx` from the bound context with `state` and `result` initialised to `null`. Strips **`playbookLogScope`** so act callbacks do not see log metadata. Called internally by `Director`.
