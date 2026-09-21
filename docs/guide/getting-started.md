# Getting Started

## Installation

```bash
npm install -D @rickcedwhat/playwright-sugar
# or
pnpm add -D @rickcedwhat/playwright-sugar
```

Peer dependency: `@playwright/test`.

Prefer not to add a dependency yet? Copy a **lite** helper from [`snippets/`](https://github.com/rickcedwhat/playwright-sugar/tree/main/snippets). See [Lite vs robust](/guide/helper-forms).

## Quick start

### Branching outcomes with `attemptAction`

Use `attemptAction` when an action can produce multiple outcomes — success, failure toast, or a missing button — and you want to branch on the result rather than let Playwright throw.

```ts
import { attemptAction, Outcomes } from '@rickcedwhat/playwright-sugar';

const result = await attemptAction(
  async () => {
    await page.getByRole('button', { name: 'Delete' }).click();
  },
  [
    Outcomes.success(page.getByText('Deleted successfully')),
    Outcomes.failure(page.getByText('Permission denied')),
    Outcomes.timeout('no-feedback'),
  ],
  { timeout: 5000 },
);

if (result.isSuccess) {
  // item was deleted
}
```

### Stable locators with `relator`

Use `relator` to find an element relative to a unique anchor — avoids fragile nth-child selectors.

```ts
import { relator } from '@rickcedwhat/playwright-sugar';

const editBtn = relator(
  page.getByRole('button', { name: 'Edit' }),
  page.getByText('Invoice #42'),
);
await editBtn.click();
```

### Verified fills

```ts
import { verifiedFill } from '@rickcedwhat/playwright-sugar';

await verifiedFill(page.getByLabel('Email'), 'qa@example.com');
```

## Deprecated playbook framework

`Play`, `Playbook`, and `Director` are no longer exported from the package. Sources remain in the repo under `deprecated/playbook/` for a possible future package.

## Try the Sugar Lab

The [Sugar Lab](/guide/sugar-lab) playground exercises helpers against a sample UI (and still includes an experimental playbook builder for the deprecated API).
