# watchFor

Starts a background poller: whenever `locator` is visible, runs your callback. Returns a `stop()` function. Useful for dismissible toasts, “session restored” banners, or other chrome that can appear mid-test.

## Signature

```ts
watchFor(
  locator: Locator,
  callback: (el: Locator) => Promise<void>,
  opts?: { interval?: number },  // default 500 ms
): () => void
```

The callback owns its own error handling. Transient errors (element detaches between visibility check and click) are swallowed so polling continues.

## Example

```ts
import { watchFor } from '@rickcedwhat/playwright-sugar';

const stop = watchFor(page.getByRole('alert', { name: /cookie/i }), async (banner) => {
  await banner.getByRole('button', { name: 'Accept' }).click();
});

try {
  await page.goto('/app');
  await page.getByRole('button', { name: 'Create' }).click();
  // …
} finally {
  stop();
}
```

## When to use

Good for known, harmless interruptions you don’t want to assert on every step.

Avoid for assertions you care about — those belong in the main test flow (`expect`, `attemptAction`, etc.). Always call `stop()` when finished so the poller doesn’t outlive the test.
