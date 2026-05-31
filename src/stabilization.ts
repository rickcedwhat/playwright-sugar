import type { Locator, Page } from '@playwright/test';

/**
 * A StabilizationStrategy wraps an async action and returns `true` when the DOM
 * has settled in the expected way, or `false` on timeout.
 *
 * @param rows - Locator for the repeating items to observe (table rows, list items, etc.)
 * @param page - Playwright Page (for `waitForTimeout` polling)
 * @param action - The interaction to perform (click, scroll, etc.)
 */
export type StabilizationStrategy = (
  rows: Locator,
  page: Page,
  action: () => Promise<void>,
) => Promise<boolean>;

export const StabilizationStrategies = {
  /**
   * Waits for the visible text of the observed rows to change.
   *
   * @param options.scope `'all'` compares all rows; `'first'` only compares the first row
   *   (faster for large lists where only the first row changing signals a page turn).
   * @param options.timeout Poll window in ms (default 5000).
   */
  contentChanged(options: { scope?: 'all' | 'first'; timeout?: number } = {}): StabilizationStrategy {
    return async (rows, page, action) => {
      const { scope = 'all', timeout = 5000 } = options;
      const getFingerprint = () =>
        scope === 'first'
          ? rows.first().innerText().catch(() => '')
          : rows.allInnerTexts().then(t => t.join('|'));

      const before = await getFingerprint();
      await action();

      const deadline = Date.now() + timeout;
      while (Date.now() < deadline) {
        if ((await getFingerprint()) !== before) return true;
        await page.waitForTimeout(100);
      }
      return false;
    };
  },

  /**
   * Waits for the row count to strictly increase — best for append-only / infinite-scroll lists.
   *
   * @param options.timeout Poll window in ms (default 5000).
   */
  rowCountIncreased(options: { timeout?: number } = {}): StabilizationStrategy {
    return async (rows, page, action) => {
      const { timeout = 5000 } = options;
      const before = await rows.count();
      await action();

      const deadline = Date.now() + timeout;
      while (Date.now() < deadline) {
        if ((await rows.count()) > before) return true;
        await page.waitForTimeout(100);
      }
      return false;
    };
  },

  /**
   * Waits for a spinner/overlay to disappear after the action.
   * Falls back to a 500 ms pause when no `spinnerSelector` is given.
   *
   * @param options.spinnerSelector CSS selector for the loading indicator.
   * @param options.timeout Timeout for waiting the spinner to detach (default 5000).
   */
  networkIdle(options: { spinnerSelector?: string; timeout?: number } = {}): StabilizationStrategy {
    return async (rows, page, action) => {
      const { timeout = 5000 } = options;

      if (options.spinnerSelector) {
        const spinner = rows.page().locator(options.spinnerSelector).first();
        const existedBefore = (await spinner.count()) > 0;
        await action();

        if (!existedBefore) {
          const appearDeadline = Date.now() + 500;
          while (Date.now() < appearDeadline && (await spinner.count()) === 0) {
            await page.waitForTimeout(50);
          }
          if ((await spinner.count()) === 0) return true;
        }

        try {
          await spinner.waitFor({ state: 'detached', timeout });
          return true;
        } catch {
          return false;
        }
      }

      await action();
      await page.waitForTimeout(500);
      return true;
    };
  },
};
