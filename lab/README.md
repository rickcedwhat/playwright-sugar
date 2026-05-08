# Sugar Lab

A Vite + React playground app for testing `@rickcedwhat/playwright-sugar` helpers against real-world UI patterns. It is a test fixture — not a product.

## Running the lab

```bash
cd lab
pnpm install
pnpm dev        # starts on http://localhost:5173
```

## Permission mode

Append `?role=viewer` to any URL to switch to viewer mode. In viewer mode, clicking Create / Rename / Delete fires a `"Failed to…"` toast instead of performing the action. Omit the param (or use `?role=admin`) for full access.

```
http://localhost:5173/?role=viewer
```

## Scenarios

### Datasets page — Issue #10 (Playbook / Director)

| Route | URL |
|---|---|
| Datasets list | `http://localhost:5173/` |

| State | How to reach it |
|---|---|
| **Empty state** — "No datasets" + "Empty dataset" button | Clear `localStorage` key `sugar-lab-datasets` and reload |
| **Table state** — header, rows, "Dataset" button | Create at least one dataset |

**Key selectors used by Issue #10 plays:**

| Element | Selector |
|---|---|
| Empty state text | `page.getByText('No datasets')` |
| Empty state create button | `page.getByRole('button', { name: 'Empty dataset' })` |
| Table state indicator | `page.locator('[data-component="TableHeadersComponent"]')` |
| Table create button | `page.getByRole('button', { name: 'Dataset', exact: true })` |
| Dataset detail success | `page.getByText('This dataset is empty')` |
| Row by name | `page.locator('tr:has-text("My Dataset")')` |
| Row ellipsis menu | `page.locator('.lucide-ellipsis')` |
| Rename menu item | `page.getByRole('menuitem', { name: 'Rename' })` |
| Rename input | `page.getByRole('textbox')` |
| Save button | `page.getByRole('button', { name: 'Save' })` |
| Update success toast | `page.getByText('Updated dataset')` |
| Failure toast | `page.locator('li[data-sonner-toast]').filter({ hasText: /Failed to\|Could not/i })` |

**Leave dialog:** Open the rename form, then click a sidebar link. A "Leave?" dialog intercepts the navigation. Pressing `Escape` or clicking "Stay" keeps the rename form open; "Leave" navigates away and discards changes.

**Two-role simulation:** Both browser contexts must start from the same `localStorage` state for `director.ensureExists` tests. Copy storage state from the admin context when creating the viewer context:

```typescript
const adminStorageState = await adminPage.context().storageState();
const viewerContext = await browser.newContext({ storageState: adminStorageState });
```

### Settings page

A static placeholder page. Exists as a second navigation destination for Leave-dialog tests.

## State persistence

All data is stored in `localStorage` under the key `sugar-lab-datasets`. No backend is required. To reset: open DevTools → Application → Local Storage → delete `sugar-lab-datasets`.

## Planned scenarios

Additional UI scenarios will be added alongside their respective feature issues:

- **Issue #7** — withCleaner / CleanerStrategy (toasts, cookie banners, overlays)
- **Issue #8** — waitForStable / StabilityStrategy (animated modals, layout shift)
- **Issue #9** — clickToURL (link navigation, redirects)
