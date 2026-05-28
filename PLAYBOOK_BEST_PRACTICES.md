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

## 2. Limit `.detect()` to True Branching
Only use `.detect()` when there is branching logic—i.e., when there are two or more valid expected states that require different actions (such as `alreadySelected` vs `notSelected`).

If the page state is guaranteed or expected to be in a single configuration after navigation, skip `.detect()` entirely and query the element directly in the next `.prep()` or `.attempt()` step.

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

## 3. Override Destination URLs with `expectedUrl`
When a sidebar button or link redirects to a sub-route (e.g., clicking a link with href `/configuration` immediately redirects to `/configuration/general`), provide the `expectedUrl` option to `clickTab`.

This prevents `clickTab` from timing out or incorrectly resolving whether the page is already on the target tab:

```typescript
await clickTab(page, 'Settings', { expectedUrl: 'configuration/general' });
```

---

## 4. Share Locators using Context (`ctx`)
If you locate an element during `.detect()` or `.prep()` that needs to be referenced or cleaned up later, store it in the mutable `ctx` object. This avoids duplicating selector logic and prevents race conditions if the UI structure changes during the play execution.

```typescript
// GOOD
.prep('fill project name', async (page, ctx) => {
  const inputField = page.getByRole('textbox', { name: 'Project name' });
  ctx['inputField'] = inputField; // Save to context
  await inputField.fill(newName);
})
.cleanup('revert project name', async (page, ctx, afterAttempt) => {
  if (afterAttempt?.name === 'updated') {
    const inputField = ctx['inputField'] as Locator;
    if (inputField) {
      await inputField.clear();
      await inputField.fill(originalName);
      await page.getByRole('button', { name: 'Save' }).click();
    }
  }
})
```

---

## 5. Clean Up After State Mutation
Every play that mutates state (such as updating, deleting, or failing to create due to permission blocks) should implement a `.cleanup()` step. This ensures that:
- Cleanups are executed even if the test fails or times out.
- The project is left in a clean, stateless condition for subsequent test suites.
- Any dirty unsaved states (like open editors or modals) are dismissed (e.g. pressing `Escape` or clicking `Leave`).
