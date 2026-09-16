# @rickcedwhat/playwright-sugar

Small Playwright helpers that make QA lives easier: less flakiness, less boilerplate, clearer failures.

Each helper aims for **two forms**:
- **Robust** — install the package for intelligent errors, logs, and shared fixes (`src/`)
- **Lite** — copy-paste from [`snippets/`](./snippets) (generated from `src/` so they cannot drift; `pnpm run snippets:generate`)

## Installation

```bash
npm install -D @rickcedwhat/playwright-sugar
# or
pnpm add -D @rickcedwhat/playwright-sugar
```

Requires `@playwright/test` as a peer dependency.

## Core helpers

### `attemptAction` & `detectState`

Race multiple UI outcomes after an action (or with no action). Soft-triggers: if the click fails, detection still runs.

```typescript
import { attemptAction, Outcomes } from '@rickcedwhat/playwright-sugar';

const { isSuccess, outcome } = await attemptAction(
  async () => { await page.getByRole('button', { name: 'Run' }).click(); },
  [
    Outcomes.success('Started', page.getByText('Job Started Successfully')),
    Outcomes.failure('Blocked', page.getByText('You do not have permission')),
    Outcomes.actionError('Button missing'),
  ]
);
```

Copy-paste lite version: [`snippets/attemptAction.lite.ts`](./snippets/attemptAction.lite.ts)

### `relator`

Find a control relative to a semantic anchor (shared parent / container).

```typescript
import { relator } from '@rickcedwhat/playwright-sugar';

await relator(
  page.getByText('Pro Plan'),
  page.getByRole('button', { name: 'Buy' })
).click();
```

### `verifiedFill`

Fill a field and confirm the value stuck (SPA state lag).

```typescript
import { verifiedFill } from '@rickcedwhat/playwright-sugar';

await verifiedFill(page.locator('#email'), 'user@example.com');
```

### Also included

`clickToOpen`, `clickToURL`, `findByScrolling`, `hoverMenu`, `watchFor`, `pageTag`, `Outcomes`, scroll/match strategies.

## Deprecated: Play / Playbook / Director

The RBAC-oriented playbook framework (`Play`, `Playbook`, `Director`) lives in [`deprecated/playbook/`](./deprecated/playbook) for a possible future package. It is **not** part of the published npm API.

## Docs

- [Getting started](./docs/guide/getting-started.md)
- [Lite vs robust helpers](./docs/guide/helper-forms.md)
- [Roadmap](./ROADMAP.md)

## License

MIT
