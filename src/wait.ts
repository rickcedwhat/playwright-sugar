import type { Frame, Page } from '@playwright/test';

export interface WaitOptions {
  /** Custom message shown in the overlay. Default: `'Waiting'` */
  message?: string;
  /** Set to `false` to skip the visual overlay (plain waitForTimeout). Default: `true` */
  overlay?: boolean;
}

/** Attribute that marks the overlay element; its value is the per-call token. */
const MARKER = 'data-pw-sugar-wait';
/** Extra time the browser-side safety net waits before self-removing the overlay. */
const SAFETY_GRACE_MS = 5000;

let seq = 0;
/** Latest wait per page — lets an abandoned (orphaned) call notice it was superseded. */
const active = new WeakMap<Page, number>();

/**
 * Pauses execution for a specified duration with an optional visual countdown
 * overlay. Useful during headed-mode debugging to see when and why a test is
 * deliberately waiting.
 *
 * Guarantees:
 * - The overlay is cosmetic: overlay/DOM errors never fail or extend the wait.
 *   The only error this throws is the one `page.waitForTimeout` throws
 *   (e.g. the page is closed mid-wait).
 * - The overlay survives navigations — it is re-injected into the new
 *   document with the remaining time.
 * - A call abandoned mid-wait (e.g. `expect(...).toPass({ timeout })` gave up,
 *   test timeout) keeps running until its own deadline, then removes only its
 *   own overlay; a newer `wait()` on the same page is never affected. If the
 *   Node process dies, a browser-side timer removes the overlay on its own.
 * - `ms <= 0` or non-finite `ms` is a plain `waitForTimeout(ms)`, no overlay.
 */
export async function wait(
  page: Page,
  ms: number,
  options?: WaitOptions,
): Promise<void> {
  const { message = 'Waiting', overlay = true } = options ?? {};

  if (!overlay || !Number.isFinite(ms) || ms <= 0) {
    await page.waitForTimeout(ms);
    return;
  }

  const token = ++seq;
  active.set(page, token);

  // Inject (or re-inject after navigation) the overlay showing `remainingMs`.
  // Never throws — the overlay must not be able to fail the wait.
  const render = (remainingMs: number) =>
    page
      .evaluate(
        ({ marker, token, message, remainingMs, grace }) => {
          // One overlay per page: drop any leftover from a previous call
          document.querySelectorAll(`[${marker}]`).forEach((el) => el.remove());

          const container = document.createElement('div');
          container.setAttribute(marker, String(token));
          container.setAttribute('aria-hidden', 'true');
          Object.assign(container.style, {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            maxWidth: '80vw',
            width: 'max-content',
            padding: '24px 40px',
            background: 'rgba(0,0,0,0.75)',
            color: '#fff',
            fontFamily: 'sans-serif',
            textAlign: 'center',
            borderRadius: '10px',
            boxSizing: 'border-box',
            zIndex: '2147483647',
            pointerEvents: 'none',
            userSelect: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            alignItems: 'center',
          });

          // Small caption explaining why this overlay exists
          const captionEl = document.createElement('div');
          captionEl.textContent = 'page.waitForTimeout()';
          Object.assign(captionEl.style, {
            fontSize: '13px',
            fontFamily: 'monospace',
            color: 'rgba(255,255,255,0.6)',
            letterSpacing: '0.5px',
          });

          const messageEl = document.createElement('div');
          messageEl.textContent = message;
          Object.assign(messageEl.style, {
            fontSize: '48px',
            fontWeight: 'bold',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
          });

          const countdownEl = document.createElement('div');
          Object.assign(countdownEl.style, {
            fontSize: '30px',
            fontWeight: 'normal',
            fontFamily: 'monospace',
            color: '#7dd3fc',
            letterSpacing: '1px',
          });

          function formatCountdown(remaining: number): string {
            if (remaining < 1000) return '< 1 sec';
            const totalSeconds = Math.ceil(remaining / 1000);
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            if (minutes > 0) return `${minutes} min ${seconds} sec`;
            return `${seconds} sec`;
          }

          countdownEl.textContent = formatCountdown(remainingMs);

          container.appendChild(captionEl);
          container.appendChild(messageEl);
          container.appendChild(countdownEl);
          // documentElement, not body: body may be null while the page is
          // still loading, and frameworks may replace <body> wholesale
          document.documentElement.appendChild(container);

          // Browser-side countdown; computes from a deadline so it never drifts
          const deadline = Date.now() + remainingMs;
          const interval = setInterval(() => {
            const remaining = Math.max(0, deadline - Date.now());
            countdownEl.textContent = formatCountdown(remaining);
            if (remaining <= 0 || !container.isConnected) clearInterval(interval);
          }, 1000);

          // Safety net: auto-remove if the Node process dies mid-wait. Scoped to
          // THIS element so it can never remove a later call's overlay.
          setTimeout(() => {
            clearInterval(interval);
            container.remove();
          }, remainingMs + grace);
        },
        { marker: MARKER, token, message, remainingMs, grace: SAFETY_GRACE_MS },
      )
      .catch(() => {});

  let deadline = Date.now() + ms;
  const onNavigated = (frame: Frame) => {
    // Only the main frame matters; a superseded orphan stays quiet
    if (frame !== page.mainFrame() || active.get(page) !== token) return;
    const remaining = deadline - Date.now();
    if (remaining > 0) void render(remaining);
  };
  page.on('framenavigated', onNavigated);

  try {
    await render(ms);
    deadline = Date.now() + ms;
    await page.waitForTimeout(ms);
  } finally {
    page.off('framenavigated', onNavigated);
    if (active.get(page) === token) active.delete(page);
    if (!page.isClosed()) {
      // Remove only our own overlay — a newer wait may already own the page
      await page
        .evaluate(
          ({ marker, token }) => {
            document
              .querySelectorAll(`[${marker}="${token}"]`)
              .forEach((el) => el.remove());
          },
          { marker: MARKER, token },
        )
        .catch(() => {});
    }
  }
}
