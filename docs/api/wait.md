# wait

Pauses execution for a specified duration with an optional visual countdown overlay. Useful during headed-mode debugging to see when and why a test is deliberately waiting.

## Signature

```ts
wait(
  page: Page,
  ms: number,
  options?: WaitOptions
): Promise<void>
```

| Option | Default | Description |
|---|---|---|
| `message` | `'Waiting'` | Custom text shown in the overlay. |
| `overlay` | `true` | Set to `false` to wait without the visual overlay. |

## Example

```ts
import { wait } from '@rickcedwhat/playwright-sugar';

// 3-second wait with a countdown overlay
await wait(page, 3000);

// Custom message
await wait(page, 5000, { message: 'Waiting for webhook…' });

// Silent wait (no overlay)
await wait(page, 2000, { overlay: false });
```

## Behavior

The overlay is purely cosmetic — it can never fail, extend, or interfere with the wait:

- **Navigation mid-wait** (e.g. a click that triggers a page load): the overlay is re-injected into the new document with the remaining time.
- **Overlay errors** (execution context destroyed, DOM not ready) are swallowed. The only error `wait` throws is the one `page.waitForTimeout` throws — e.g. the page being closed mid-wait rejects exactly like the native call.
- **Abandoned calls** (an `expect(...).toPass({ timeout })` that gave up, a test timeout): the call keeps running until its own deadline, then removes only its own overlay. A newer `wait()` on the same page is never affected. If the Node process dies, a browser-side timer removes the overlay on its own about 5 s after the deadline.
- **`ms <= 0` or non-finite `ms`**: plain `page.waitForTimeout(ms)`, no overlay.
- The overlay is `aria-hidden` and `pointer-events: none`, so it does not intercept clicks or show up in role-based locators. It **does** appear in screenshots and traces taken during the wait — by design.

## When to use

`page.waitForTimeout(ms)` is sufficient for most waits. Use `wait` when:

- You are running tests in headed mode and want to see *why* a pause is happening.
- You are debugging timing issues and need a visual indicator of how long a wait has remaining.
- You want a centralized wait utility that can be toggled between visible and silent.
