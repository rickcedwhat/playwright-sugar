# API helpers

Quick tour of every helper exported from `@rickcedwhat/playwright-sugar`. Skim the **When it helps** line — if that never matches your suite, you probably don’t need it.

| Helper | When it helps | Docs |
|--------|---------------|------|
| [`attemptAction`](./attempt-action) | One click can lead to several UIs (success toast *or* permission error *or* nothing) | Branching after an action |
| [`detectState`](./attempt-action#detectstate) | Same branching, but you’re only observing the page | Poll without clicking |
| [`Outcomes`](./outcomes) | Building the branches for the two above | DSL |
| [`relator`](./relator) | “The Edit button in *this* row” without nth-child | Scope by nearby text |
| [`verifiedFill`](./verified-fill) | Controlled inputs that clear or revert after `fill` | Fill + assert value stuck |
| [`clickToOpen`](./click-to-open) | Click sometimes doesn’t open the panel/menu | Retry until target visible |
| [`clickToURL`](./click-to-url) | Click sometimes doesn’t navigate | Retry until URL matches |
| [`findByScrolling`](./find-by-scrolling) | Target only exists after scroll / load-more | Scroll until found |
| [`ScrollStrategies` / friends](./strategies) | Customize how `findByScrolling` steps and stops | Strategy factories |
| [`hoverMenu`](./hover-menu) | Nested hover menus that close on diagonal mouse moves | L-shaped hover chain |
| [`watchFor`](./watch-for) | Toast / banner that can appear anytime — dismiss it in the background | Background poller |
| [`pageTag`](./page-tag) | Multi-tab headed runs — tell tabs apart visually | Chip / bar overlay |

## One-liners

```ts
import {
  attemptAction,
  Outcomes,
  relator,
  verifiedFill,
  clickToOpen,
  clickToURL,
  findByScrolling,
  hoverMenu,
  watchFor,
  pageTag,
} from '@rickcedwhat/playwright-sugar';

// Branching submit
const result = await attemptAction(
  () => page.getByRole('button', { name: 'Save' }).click(),
  [
    Outcomes.success(page.getByText('Saved')),
    Outcomes.failure(page.getByText('Permission denied')),
    Outcomes.timeout('no-feedback'),
  ],
  { timeout: 10_000 },
);

// Row-scoped control (target first)
await relator(
  page.getByRole('button', { name: 'Edit' }),
  page.getByText('Invoice #42'),
).click();

// SPA fill that must stick
await verifiedFill(page.getByLabel('Email'), 'qa@example.com');

// Open a flaky panel
await clickToOpen(
  page.getByRole('button', { name: 'Filters' }),
  page.getByRole('dialog', { name: 'Filters' }),
);

// Navigate despite swallowed clicks
await clickToURL(page, page.getByRole('link', { name: 'Profile' }), '**/profile');

// Virtualized list
await findByScrolling(page.getByText('Row 500'), {
  container: page.locator('.ag-body-viewport'),
});

// Nested hover menu
await hoverMenu([
  page.getByRole('menuitem', { name: 'File' }),
  page.getByRole('menuitem', { name: 'Export' }),
  page.getByRole('menuitem', { name: 'CSV' }),
]);

// Auto-dismiss a known toast while the test runs
const stop = watchFor(page.getByText('Session restored'), async (el) => {
  await el.getByRole('button', { name: 'Dismiss' }).click();
});
// …test body…
stop();

// Label a headed page for traces / screenshots
const tag = await pageTag(page, { type: 'bar', label: 'Admin' });
await tag.hideDuring(() => expect(page).toHaveScreenshot());
```

Lite (copy-paste) variants of some helpers live under [`snippets/`](https://github.com/rickcedwhat/playwright-sugar/tree/main/snippets) — see [Lite vs robust](/guide/helper-forms).
