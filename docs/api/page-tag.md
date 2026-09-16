# pageTag

Draws a non-interactive chip or bar on a headed Playwright page so you can tell tabs apart in traces and live debugging. Survives SPA navigations; use `hideDuring` around screenshots.

## Signature

```ts
pageTag(page: Page, options?: PageTagOptions): Promise<PageTagHandle>
```

Chip (default):

```ts
await pageTag(page, {
  type?: 'chip',                 // default
  placement?: ChipPlacement,     // default 'top-right'
  size?: 'sm' | 'md' | 'lg',
  label?: string,                // default 'Page N'
  color?: string,
  opacity?: number,
});
```

Bar:

```ts
await pageTag(page, {
  type: 'bar',
  placement?: 'top' | 'bottom' | 'left' | 'right',
  thickness?: number,
  label?: string,
  color?: string,
});
```

### Handle

| Method | Purpose |
|--------|---------|
| `moveTo(x, y)` | Absolute override (`null` snaps back to placement) |
| `hide()` / `show()` | Toggle visibility |
| `hideDuring(fn)` | Hide for the duration of `fn` (screenshots) |
| `remove()` | Tear down tag + listeners |

`PageTag.labelFor('Admin')` returns `{ next(), reset() }` for POM-friendly numbered labels. `PageTag.reset()` resets auto colors/labels between runs.

## Example

```ts
import { pageTag, PageTag } from '@rickcedwhat/playwright-sugar';

const tag = await pageTag(page, { type: 'bar', placement: 'left', label: 'Admin' });

await tag.hideDuring(() => expect(page).toHaveScreenshot('admin-home.png'));

await tag.remove();
```

POM-style labels:

```ts
class AdminPage {
  private static _label = PageTag.labelFor('Admin');

  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/admin');
    await pageTag(this.page, { type: 'bar', label: AdminPage._label.next() });
  }
}
```

## When to use

Headed multi-context / multi-tab debugging. Skip in headless CI unless you want overlays in traces on purpose.
