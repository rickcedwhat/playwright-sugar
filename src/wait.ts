import type { Page } from '@playwright/test';

export interface WaitOptions {
  /** Custom message shown in the overlay. Default: `'Waiting'` */
  message?: string;
  /** Set to `false` to skip the visual overlay (plain waitForTimeout). Default: `true` */
  overlay?: boolean;
}

const OVERLAY_ID = '__pw_sugar_wait_overlay__';

/**
 * Pauses execution for a specified duration with an optional visual countdown
 * overlay. Useful during headed-mode debugging to see when and why a test is
 * deliberately waiting.
 */
export async function wait(
  page: Page,
  ms: number,
  options?: WaitOptions,
): Promise<void> {
  const { message = 'Waiting', overlay = true } = options ?? {};

  if (!overlay) {
    await page.waitForTimeout(ms);
    return;
  }

  // Clear any leftover overlay from a previous interrupted call
  await page.evaluate((id: string) => {
    const el = document.getElementById(id);
    if (el) el.remove();
  }, OVERLAY_ID);

  try {
    // Inject the overlay with a browser-side countdown interval
    await page.evaluate(
      ({ id, message, totalMs }: { id: string; message: string; totalMs: number }) => {
        const container = document.createElement('div');
        container.id = id;
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

        function formatCountdown(remainingMs: number): string {
          if (remainingMs < 1000) return '< 1 sec';
          const totalSeconds = Math.ceil(remainingMs / 1000);
          const minutes = Math.floor(totalSeconds / 60);
          const seconds = totalSeconds % 60;
          if (minutes > 0) return `${minutes} min ${seconds} sec`;
          return `${seconds} sec`;
        }

        countdownEl.textContent = formatCountdown(totalMs);

        container.appendChild(messageEl);
        container.appendChild(countdownEl);
        document.body.appendChild(container);

        // Browser-side countdown interval
        const start = Date.now();
        const interval = setInterval(() => {
          const elapsed = Date.now() - start;
          const remaining = Math.max(0, totalMs - elapsed);
          countdownEl.textContent = formatCountdown(remaining);
          if (remaining <= 0) clearInterval(interval);
        }, 1000);

        // Safety net: auto-remove if Node process dies
        setTimeout(() => {
          clearInterval(interval);
          const el = document.getElementById(id);
          if (el) el.remove();
        }, totalMs + 5000);
      },
      { id: OVERLAY_ID, message, totalMs: ms },
    );

    await page.waitForTimeout(ms);
  } finally {
    await page.evaluate((id: string) => {
      const el = document.getElementById(id);
      if (el) el.remove();
    }, OVERLAY_ID).catch(() => {});
  }
}
