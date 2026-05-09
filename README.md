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

## Core API

### 1. `attemptAction` & `detectPageState`
The crown jewel of the library. It races multiple outcomes against each other and handles action failures gracefully.

```typescript
import { attemptAction, Outcomes } from '@rickcedwhat/playwright-sugar';

const { isSuccess, outcome } = await attemptAction(
  async () => { await page.getByRole('button', { name: 'Run' }).click(); },
  [
    Outcomes.success('Started', page.getByText('Job Started Successfully')),
    Outcomes.failure('Blocked', page.getByText('You do not have permission')),
    Outcomes.actionError('RBAC: Button Missing') // Fallback if click fails
  ]
);
```

**Features:**
- **Soft Triggers**: If the `action` fails, it doesn't crash the test. It proceeds to check outcomes.
- **Strict Mode Detection**: Automatically logs a rich ASCII warning if a locator matches multiple elements.
- **Outcome DSL**: Use `Outcomes.success()`, `Outcomes.failure()`, etc., for clean, readable code.

---

### 2. `relator`
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

### 3. `verifiedFill`
Fills a field and verifies that the value actually stuck. Essential for modern SPAs with state-management lag.

```typescript
import { verifiedFill } from '@rickcedwhat/playwright-sugar';

await verifiedFill(page.locator('#email'), 'user@example.com');
```

---

### 4. `findByScrolling`
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

### 5. `clickToOpen`
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
