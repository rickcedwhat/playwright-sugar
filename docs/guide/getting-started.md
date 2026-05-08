# Getting Started

## Installation

```bash
npm install -D @rickcedwhat/playwright-sugar
# or
pnpm add -D @rickcedwhat/playwright-sugar
```

## Quick start

### Handling RBAC and toast outcomes

Use `attemptAction` when an action can produce multiple outcomes — success, failure toast, or a missing button — and you want to branch on the result rather than let Playwright throw.

```ts
import { attemptAction, Outcomes } from '@rickcedwhat/playwright-sugar';

const result = await attemptAction({
  action: async () => {
    await page.getByRole('button', { name: 'Delete' }).click();
  },
  outcomes: [
    Outcomes.success(page.getByText('Deleted successfully')),
    Outcomes.failure(page.getByText('Permission denied')),
    Outcomes.timeout(5000),
  ],
});

if (result.isSuccess) {
  // item was deleted
}
```

### Structured test scenarios with Play and Director

`Play` lets you describe a test scenario as a sequence of named steps. `Director` runs plays and makes assertions about whether they succeeded or failed — useful for RBAC testing.

```ts
import { test } from '@playwright/test';
import { Play, Playbook, Director, Outcomes } from '@rickcedwhat/playwright-sugar';

const itemPb = new Playbook('ItemPlaybook', {
  exists: ({ name }) => new Play()
    .nav(async page => { await page.getByRole('link', { name: 'Items' }).click(); })
    .detect(page => [
      { name: 'found',    isSuccess: true,  locator: page.locator(`tr:has-text("${name}")`) },
      { name: 'notFound', isSuccess: false, locator: page.getByText('No items') },
    ]),

  create: ({ name }) => new Play()
    .nav(async page => { await page.getByRole('link', { name: 'Items' }).click(); })
    .attempt(
      async page => {
        await page.getByRole('button', { name: 'New item' }).click();
        await page.getByPlaceholder('Name').fill(name);
        await page.getByRole('button', { name: 'Create' }).click();
      },
      [
        Outcomes.success(page => page.getByText('Item created')),
        Outcomes.failure(page => page.getByText('Permission denied')),
        Outcomes.timeout(8000),
      ],
    ),
});

test('admin can create item', async ({ page }) => {
  const director = new Director();
  const pb = itemPb.withCtx({ page });

  await director.assertCan(pb, 'create', { name: 'My Item' });
});

test('viewer cannot create item', async ({ page }) => {
  await page.goto('/?role=viewer');
  const director = new Director();
  const pb = itemPb.withCtx({ page });

  await director.assertCannot(pb, 'create', { name: 'Blocked Item' });
});
```

### Stable locators with relator

Use `relator` to find an element relative to a unique anchor — avoids fragile nth-child selectors.

```ts
import { relator } from '@rickcedwhat/playwright-sugar';

// Click the "Edit" button in the row that contains "Invoice #42"
const editBtn = relator(
  page.getByText('Invoice #42'),
  page.getByRole('button', { name: 'Edit' }),
  'tr'
);
await editBtn.click();
```
