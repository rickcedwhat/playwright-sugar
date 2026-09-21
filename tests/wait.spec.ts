import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { wait } from '../src/index.js';

// Real-browser coverage for the browser-side half of `wait()` — the timers
// and DOM behaviour the mocked unit tests in src/wait.test.ts cannot see.

const overlay = (page: Page) => page.locator('[data-pw-sugar-wait]');
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

test.beforeEach(async ({ page }) => {
  await page.setContent('<h1>Page A</h1>');
});

test('shows the overlay during the wait and removes it after', async ({ page }) => {
  const done = wait(page, 3000, { message: 'Hold on' });

  await expect(overlay(page)).toBeVisible();
  // Caption first, then message, then countdown
  await expect(overlay(page)).toHaveText(/^page\.waitForTimeout\(\)\s*Hold on\s*3 sec$/);
  // Countdown ticks down in the browser
  await expect(overlay(page)).toContainText('2 sec', { timeout: 2500 });

  await done;
  await expect(overlay(page)).toHaveCount(0);
});

test('re-injects the overlay after a navigation with the remaining time', async ({ page }) => {
  const done = wait(page, 4000, { message: 'Across nav' });
  await expect(overlay(page)).toBeVisible();

  await sleep(1000);
  // A real navigation (new document + execution context), like a form submit
  await page.goto('data:text/html,<h1>Page B</h1>');
  await expect(page.getByRole('heading', { name: 'Page B' })).toBeVisible();

  await expect(overlay(page)).toBeVisible();
  await expect(overlay(page)).toContainText('Across nav');
  // ~3s left, not restarted from 4
  await expect(overlay(page)).not.toContainText('4 sec');

  await done;
  await expect(overlay(page)).toHaveCount(0);
});

test('a previous wait\'s safety net never removes the next wait\'s overlay', async ({ page }) => {
  // First call's browser-side safety timer fires at 1000 + 5000 ms
  await wait(page, 1000);
  const done = wait(page, 7000, { message: 'Second' });

  await sleep(6500);
  await expect(overlay(page)).toBeVisible();
  await expect(overlay(page)).toContainText('Second');

  await done;
  await expect(overlay(page)).toHaveCount(0);
});

test('rejects promptly like waitForTimeout when the page closes mid-wait', async ({ page }) => {
  const started = Date.now();
  const pending = wait(page, 5000);
  await expect(overlay(page)).toBeVisible();

  await sleep(200);
  await page.close();

  await expect(pending).rejects.toThrow(/closed/);
  expect(Date.now() - started).toBeLessThan(2000);
});

test('a wait abandoned by expect.toPass does not disturb the next wait', async ({ page }) => {
  // toPass gives up at 500ms; the 3s wait inside keeps running as an orphan
  await expect(
    expect(async () => {
      await wait(page, 3000, { message: 'Orphan' });
      throw new Error('never reached in time');
    }).toPass({ timeout: 500, intervals: [100] }),
  ).rejects.toThrow();

  const done = wait(page, 4000, { message: 'Fresh' });
  await expect(overlay(page)).toContainText('Fresh');

  // Past the orphan's own deadline (~3s) — its cleanup must not touch ours
  await sleep(3300);
  await expect(overlay(page)).toHaveCount(1);
  await expect(overlay(page)).toContainText('Fresh');

  await done;
  await expect(overlay(page)).toHaveCount(0);
});

test.describe('overlay: false', () => {
  test('behaves exactly like a vanilla page.waitForTimeout', async ({ page }) => {
    // Snapshot the DOM and count listeners so we can prove nothing was touched
    const htmlBefore = await page.content();
    const listenersBefore = page.listenerCount('framenavigated');
    await page.evaluate(() => {
      (window as any).__mutations = 0;
      new MutationObserver((records) => {
        (window as any).__mutations += records.length;
      }).observe(document.documentElement, { childList: true, subtree: true, attributes: true });
    });

    // Same duration as the native call (within scheduling noise)
    const nativeStart = Date.now();
    await page.waitForTimeout(1000);
    const nativeElapsed = Date.now() - nativeStart;

    const sugarStart = Date.now();
    await wait(page, 1000, { overlay: false, message: 'ignored' });
    const sugarElapsed = Date.now() - sugarStart;

    expect(sugarElapsed).toBeGreaterThanOrEqual(1000);
    expect(Math.abs(sugarElapsed - nativeElapsed)).toBeLessThan(200);

    // No DOM injected, no mutations, no page listeners left behind
    await expect(overlay(page)).toHaveCount(0);
    expect(await page.evaluate(() => (window as any).__mutations)).toBe(0);
    expect(await page.content()).toBe(htmlBefore);
    expect(page.listenerCount('framenavigated')).toBe(listenersBefore);
  });

  test('rejects with the same error as the native call when the page closes', async ({ context }) => {
    // Two identical pages: one runs the native call, one runs wait()
    const nativePage = await context.newPage();
    const sugarPage = await context.newPage();

    // Capture rejections up front so the runner doesn't flag them as unhandled
    const settle = (p: Promise<void>) => p.then(() => null, (e: Error) => e);
    const native = settle(nativePage.waitForTimeout(5000));
    const sugar = settle(wait(sugarPage, 5000, { overlay: false }));
    await sleep(200);
    await Promise.all([nativePage.close(), sugarPage.close()]);

    const [nativeErr, sugarErr] = await Promise.all([native, sugar]);
    expect(nativeErr).toBeInstanceOf(Error);
    expect(sugarErr).toBeInstanceOf(Error);
    expect(sugarErr!.constructor.name).toBe(nativeErr!.constructor.name);
    // Strip the "page.waitForTimeout: " / call-site prefix and compare the cause
    const cause = (e: Error) => e.message.replace(/^[^:]+: /, '');
    expect(cause(sugarErr!)).toBe(cause(nativeErr!));
  });
});
