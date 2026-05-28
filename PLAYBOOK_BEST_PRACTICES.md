# Playbook Best Practices

This document outlines structural guidelines and best practices for writing clean, robust, and maintainable `Play` and `Playbook` tests using the Playwright Sugar framework.

---

## 1. Segregate Navigation (`.nav`)
The `.nav()` step should be strictly dedicated to navigating to the required section or page (e.g., sidebar tab clicks). Do not bundle pre-navigation checks, selections, or input interactions within `.nav()`.

```typescript
// GOOD
.nav('navigate to Settings', async (page) => {
  await clickTab(page, 'Settings');
})

// BAD
.nav('select project and click Settings', async (page) => {
  await selectProject(page, name); // Selection should be in prep
  await clickTab(page, 'Settings');
})
```

---

## 2. Limit `.detect()` and `.attempt()` to True Branching
Only use `.detect()` and `.attempt()` when there is branching logic—i.e., when there are two or more valid expected states or outcomes that require different assertions or paths (such as `success` vs `backendRejected`).

If only one outcome is expected or you do not need to branch the test outcome logic, avoid unnecessary `.detect()` steps and intermediate assertions.

```typescript
// GOOD - Expect only one state, query directly in prep
.nav('navigate to Settings', async (page) => {
  await clickTab(page, 'Settings');
})
.prep('fill details', async (page) => {
  await page.getByRole('textbox', { name: 'Name' }).fill('New Name');
})

// BAD - Unnecessary detect for a single expected state
.nav('navigate to Settings', async (page) => {
  await clickTab(page, 'Settings');
})
.detect((page) => [
  { name: 'found', isSuccess: true, locator: page.getByRole('textbox', { name: 'Name' }) }
])
.prep('fill details', async (page, ctx, lastOutcome) => {
  await (lastOutcome.locator).fill('New Name');
})
```

---

## 3. Keep `.attempt()` Focused and Minimal
The `.attempt()` callback should execute as little as possible—ideally just a single final action (like clicking the "Save" or "Delete" button). Any preceding setup (like filling out forms, checking boxes, or typing input) should be performed beforehand inside `.prep()`.

```typescript
// GOOD
.prep('fill details', async (page) => {
  await page.getByPlaceholder('Name').fill(name);
})
.attempt(
  'save',
  async (page) => {
    await page.getByRole('button', { name: 'Save' }).click();
  },
  [
    Outcomes.success(page => page.getByText('Saved successfully')),
    Outcomes.failure(page => page.getByText('Failed to save')),
  ]
)

// BAD
.attempt(
  'save',
  async (page) => {
    await page.getByPlaceholder('Name').fill(name); // Input entry should be in prep
    await page.getByRole('button', { name: 'Save' }).click();
  },
  [
    Outcomes.success(page => page.getByText('Saved successfully')),
    Outcomes.failure(page => page.getByText('Failed to save')),
  ]
)
```

---

## 4. Override Destination URLs with `expectedUrl`
When a sidebar button or link redirects to a sub-route (e.g., clicking a link with href `/configuration` immediately redirects to `/configuration/general`), provide the `expectedUrl` option to `clickTab`.

This prevents `clickTab` from timing out or incorrectly resolving whether the page is already on the target tab:

```typescript
await clickTab(page, 'Settings', { expectedUrl: 'configuration/general' });
```

---

## 5. Share Locators using the Step Outcomes
When an element is located in a `.detect()` step and is immediately needed in the subsequent `.prep()`, `.attempt()`, or `.act()` step, retrieve it via the third parameter of the callback (`lastOutcome.locator`) instead of re-querying it.

For non-adjacent steps (like `.cleanup()`), simply re-query the locator locally rather than storing it in the global context (`ctx`).

```typescript
// GOOD
.detect((page) => [
  { name: 'found', isSuccess: true, locator: page.getByRole('textbox', { name: 'Name' }) }
])
.prep('interact with textbox', async (page, ctx, lastOutcome) => {
  if (lastOutcome?.name === 'found') {
    const input = lastOutcome.locator as Locator;
    await input.fill('value');
  }
})
```

---

## 6. Clean Up After State Mutation
Every play that mutates state (such as updating, deleting, or failing to create due to permission blocks) should implement a `.cleanup()` step. This ensures that:
- Cleanups are executed even if the test fails or times out.
- The project is left in a clean, stateless condition for subsequent test suites.
- Any dirty unsaved states (like open editors or modals) are dismissed (e.g. pressing `Escape` or clicking `Leave`).
