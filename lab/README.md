# Sugar Lab

A Vite + React playground app for testing `@rickcedwhat/playwright-sugar` helpers against real-world UI patterns. It is a test fixture — not a product.

The visual **Playbook builder** targets the deprecated `Play` / `Playbook` / `Director` API (see `/deprecated/playbook`). Ambient types in the builder still describe that API for local experimentation; it is not part of the published npm package.

## Running the lab

```bash
cd lab
pnpm install
pnpm dev        # starts on http://localhost:5173
```

## Permission mode

Append `?role=viewer` to any URL to switch to viewer mode. In viewer mode, clicking Create / Rename / Delete fires a `"Failed to…"` toast instead of performing the action. Omit the param (or use `?role=admin`) for full access.

```text
http://localhost:5173/?role=viewer
```

## URL presets (deep links)

These run **before** the first render so scripted navigation and deterministic state are reproducible:

| Param | Effect |
|-------|--------|
| `clear=1` | Remove persisted datasets (`sugar-lab-datasets`) so the list starts empty. |
| `seed=<name>` | Append one dataset row (combine with `clear=1` for a single known row). |
| `gotoDetail=first` | Jump to the detail view for the first row in storage (used by docs explorer). |
| `demoToast=fail-create` | Viewer-only: fire the “Failed to create dataset” toast once for outcome demos. |
| `view=settings` | Open the Settings view instead of Datasets. |

Example: `/?clear=1&seed=Demo&role=viewer`

## Scenarios

### Datasets page

| Route | URL |
|---|---|
| Datasets list | `http://localhost:5173/` |

| State | How to reach it |
|---|---|
| **Empty state** — "No datasets" + "Empty dataset" button | Clear `localStorage` key `sugar-lab-datasets` and reload |
| **Table state** — header, rows, "Dataset" button | Create at least one dataset |

**Key selectors:**

| Element | Selector |
|---|---|
| Empty state text | `page.getByText('No datasets')` |
| Empty state create button | `page.getByRole('button', { name: 'Empty dataset' })` |
| Table state indicator | `page.locator('[data-component="TableHeadersComponent"]')` |
| Table create button | `page.getByRole('button', { name: 'Dataset', exact: true })` |
| Dataset detail success | `page.getByText('This dataset is empty')` |
| Row by name | `page.locator('tr:has-text("My Dataset")')` |
| Failure toast | `page.locator('li[data-sonner-toast]').filter({ hasText: /Failed to|Could not/i })` |

**Leave dialog:** Open the rename form, then click a sidebar link. Escape / "Stay" keeps the form; "Leave" navigates away.

### Settings page

A static placeholder page. Exists as a second navigation destination for Leave-dialog tests.

## State persistence

All data is stored in `localStorage` under the key `sugar-lab-datasets`. No backend is required.
