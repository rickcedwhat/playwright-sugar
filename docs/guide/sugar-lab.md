---
outline: false
aside: false
pageClass: play-explorer-page
---

# Sugar Lab

Sugar Lab is a **Vite + React fixture** in **`lab/`** — localStorage-backed UI exercised by **`tests/director.spec.ts`**. Explore the branching **`datasetPb.create`** walkthrough below (schematic stays in sync with modal choices); static excerpts duplicate the canonical test file further down.

<PlayExplorer />

::: tip Hacking on the real app
`<PlayExplorer />` is illustrative. For **`lab/`** source hot-reload beside the docs shell, **`pnpm docs:dev:live`** still runs both dev servers together.
:::

## Create — detect + attempt (same text as specs)

<details>
<summary>Expand reference snippets</summary>

`create` first **detects** whether the list is empty (**“Empty dataset”**) or already shows table headers:

```typescript
detect(page => [
  { name: 'empty', isSuccess: true, locator: page.getByRole('button', { name: 'Empty dataset' }) },
  { name: 'table', isSuccess: true, locator: page.locator('[data-component="TableHeadersComponent"]') },
], { timeout: 8000 })
```

Then an **attempt** swaps the launcher (`Empty dataset` vs `Dataset`), fills the modal, and resolves outcomes:

```typescript
attempt(
  async (page, ctx) => {
    const state = ctx['state'] as { name: string } | null;
    const btnName = state?.name === 'empty' ? 'Empty dataset' : 'Dataset';
    await page.getByRole('button', { name: btnName, exact: true }).click();
    await page.getByPlaceholder('Name').fill(name, { timeout: 3000 });
    await page.getByRole('button', { name: 'Create' }).click();
  },
  [
    Outcomes.success(page => page.getByText('This dataset is empty')),
    Outcomes.failure(page => page.locator('li[data-sonner-toast]').filter({ hasText: /Failed to/i })),
    Outcomes.timeout(10_000),
  ],
)
```

Director wiring:

```typescript
await director.assertCan(pb, 'create', { name: 'My Dataset' });
```

Viewer RBAC excerpt:

```typescript
await page.goto('/?role=viewer');
const result = await director.assertCannot(pb, 'create', { name: 'Blocked Dataset' });
```

</details>

## Where to go next

- Full playbook (`exists`, `update`, `delete`, …): **`tests/director.spec.ts`**
- Running the SPA + documented query params (**`gotoDetail`**, **`demoToast`**, …): **`lab/README.md`**

<details>
<summary><strong>Maintainers: bundled lab artifact</strong></summary>

`pnpm docs:build` still outputs **`lab/`** into **`docs/public/lab`**; Pages serves it under **`/playwright-sugar/lab/`** (matching VitePress `base`).

</details>
