# @rickcedwhat/playwright-sugar 🍬

A lightweight utility library to eliminate flakiness, reduce boilerplate, and handle complex branching logic in Playwright tests.

Part of the **@rickcedwhat** suite of smart Playwright tools.

## Why Playwright Sugar?

Standard Playwright is powerful, but real-world testing often involves:
- **Branching Logic**: "If a modal appears, close it; if the page loads, continue."
- **RBAC Complexity**: "Some users see the button, others don't, others get an error toast."
- **Flaky Interactions**: Clicks that happen before an element is truly "ready" or stable.
- **Scoping Issues**: Finding the right button inside the *correct* card or row without brittle selectors.

**Playwright Sugar** provides a "DX-first" layer to handle these patterns gracefully.

## Installation

```bash
npm install @rickcedwhat/playwright-sugar
```

## Documentation

Published docs (API signatures, timeout semantics, Sugar Lab):

- [Getting started](https://rickcedwhat.github.io/playwright-sugar/guide/getting-started) — `attemptAction`, `Play`, `Director`
- [`attemptAction`](https://rickcedwhat.github.io/playwright-sugar/api/attempt-action) — full signature and `AttemptActionOptions`
- [`Play.attempt`](https://rickcedwhat.github.io/playwright-sugar/api/play) — `.attempt(action, outcomes, opts?)`

Optional: **`pnpm docs:dev:live`** runs `lab` + docs together while you touch `lab/` or the Play explorer markup.

## Core API

### 1. `attemptAction` & `detectPageState`

Runs a **required** `action`, then waits for one of several named outcomes. Returns `{ isSuccess, outcome, data? }` so you can branch on RBAC, toasts, or missing UI instead of a raw Playwright throw.

**Signature** (positional only — no single-object form):

```ts
attemptAction(
  action: () => Promise<void>,
  outcomes: Outcome[],
  opts?: AttemptActionOptions
): Promise<{ isSuccess: boolean; outcome: string; data?: unknown }>
```

`opts` is [`AttemptActionOptions`](https://rickcedwhat.github.io/playwright-sugar/api/attempt-action) — today mostly `{ timeout }` (polling budget in ms; default **30000**).

```typescript
import { attemptAction, Outcomes } from '@rickcedwhat/playwright-sugar';

const result = await attemptAction(
  async () => {
    await page.getByRole('button', { name: 'Delete' }).click();
  },
  [
    Outcomes.success(page.getByText('Deleted successfully')),
    Outcomes.failure(page.getByText('Permission denied')),
    Outcomes.timeout(5000),
  ],
);

// Optional hard cap on the poll budget (see docs for soft vs hard timeout):
await attemptAction(
  async () => page.getByRole('button', { name: 'Save' }).click(),
  [Outcomes.success(page.getByText('OK')), Outcomes.failure(page.getByText('Error'))],
  { timeout: 10_000 },
);
```

**Behavior:**
- **Action errors**: If the `action` callback throws, you can still resolve via `Outcomes.actionError(...)` instead of failing the whole call immediately.
- **Strict detection**: Warns when a locator matches multiple elements.
- **Poll-only**: For “wait until one of these locators wins” without a meaningful action, use **`detectPageState`** (or a no-op `action`) — see the [docs](https://rickcedwhat.github.io/playwright-sugar/api/attempt-action).

---

### 2. `Play`, `Playbook` & `Director`

Immutable step builder for scenarios: `.nav`, `.prep`, `.reload`, `.detect`, `.attempt`, `.cleanup`. **`Play.attempt(action, outcomes, opts?)`** uses the same outcome engine as `attemptAction`; optional `opts` is `AttemptActionOptions` (e.g. `{ timeout }`), not a bare number.

```typescript
import { Play, Outcomes } from '@rickcedwhat/playwright-sugar';

new Play().attempt(
  async page => {
    await page.getByRole('button', { name: 'Create' }).click();
  },
  [
    Outcomes.success(p => p.getByText('Item created')),
    Outcomes.failure(p => p.getByText('Permission denied')),
    Outcomes.timeout(8000),
  ],
  { timeout: 15_000 },
);
```

`Playbook` registers named plays; **`Director`** runs them with `assertCan` / `assertCannot` / `ensureExists` (RBAC-style tests). Details: [Play](https://rickcedwhat.github.io/playwright-sugar/api/play), [Getting started](https://rickcedwhat.github.io/playwright-sugar/guide/getting-started).

---

### 3. `relator`

A semantic relative locator that finds the **Lowest Common Ancestor (LCA)** automatically.

```typescript
import { relator } from '@rickcedwhat/playwright-sugar';

// Finds the "Buy" button inside the SAME card as the "Pro Plan" text.
await relator(
  page.getByText('Pro Plan'),
  page.getByRole('button', { name: 'Buy' })
).click();
```

---

### 4. `verifiedFill`

Fills a field and verifies that the value actually stuck. Essential for modern SPAs with state-management lag.

```typescript
import { verifiedFill } from '@rickcedwhat/playwright-sugar';

await verifiedFill(page.locator('#email'), 'user@example.com');
```

---

### 5. `findByScrolling`

Finds elements in virtualized or infinite-scroll lists by automatically scrolling and checking for visibility.

```typescript
import { findByScrolling } from '@rickcedwhat/playwright-sugar';

// Finds a row that is deep in an infinite scroll list
const row = await findByScrolling(page.getByText('ID #999'), {
  container: page.locator('.scroll-area'),
  maxAttempts: 20
});

if (row) await row.click();
```

---

### 6. `clickToOpen`

A robust wrapper for clicks that *must* result in a specific element appearing.

```typescript
import { clickToOpen } from '@rickcedwhat/playwright-sugar';

await clickToOpen(
  page.getByRole('button', { name: 'Open Settings' }),
  page.locator('#settings-modal')
);
```

---

## The @rickcedwhat Suite

This library is designed to work alongside:
- [**playwright-smart-library**](https://github.com/rickcedwhat/playwright-smart-library): LLM-powered element resolution.
- [**playwright-smart-table**](https://github.com/rickcedwhat/playwright-smart-table): Advanced column-aware table interactions.

## License
MIT
