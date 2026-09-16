# clickToURL

Clicks a trigger and waits until the page URL matches what you expect. Retries the click when navigation never starts (common with React hydration or overlapping click handlers).

## Signature

```ts
clickToURL(
  page: Page,
  trigger: Locator,
  expectedUrl: string | RegExp | ((url: URL) => boolean),
  opts?: {
    timeout?: number;      // overall budget — default 15000
    subTimeout?: number;   // per-attempt click + waitForURL — default 2000
    maxRetries?: number;   // default 5
  },
): Promise<void>
```

`expectedUrl` is passed straight to Playwright’s `page.waitForURL`.

## Example

```ts
import { clickToURL } from '@rickcedwhat/playwright-sugar';

await clickToURL(
  page,
  page.getByRole('link', { name: 'Profile' }),
  /\/user\/profile/,
);

await expect(page).toHaveURL(/\/user\/profile/);
```

Glob / predicate forms work too:

```ts
await clickToURL(page, page.getByRole('button', { name: 'Continue' }), '**/checkout');
await clickToURL(page, page.getByText('Docs'), (url) => url.pathname.startsWith('/docs'));
```

## When to use

Prefer plain `click` + `expect(page).toHaveURL(...)` when navigation is reliable.

Use `clickToURL` when:

- The first click is occasionally swallowed (loading spinner, hydration).
- You want retries baked in instead of wrapping `expect().toPass()`.
