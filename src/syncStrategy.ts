import type { Page } from '@playwright/test';

export class SyncStrategy {
  private readonly _syncFn: (page: Page) => Promise<void>;

  private constructor(syncFn: (page: Page) => Promise<void>) {
    this._syncFn = syncFn;
  }

  async sync(page: Page): Promise<void> {
    await this._syncFn(page);
  }

  /**
   * Default: no additional sync step. `bringToFront` is handled automatically
   * by `Play.run()`, and the `exists` play handles its own navigation.
   *
   * ```ts
   * director.ensureExists(adminPb, params, { syncTo: userPage });
   * // equivalent to:
   * director.ensureExists(adminPb, params, { syncTo: userPage, syncStrategy: SyncStrategy.default() });
   * ```
   */
  static default(): SyncStrategy {
    return new SyncStrategy(async () => {});
  }

  /**
   * Preset: full page reload before retrying exists.
   *
   * ```ts
   * director.ensureExists(adminPb, params, {
   *   syncTo: userPage,
   *   syncStrategy: SyncStrategy.withReload(),
   * });
   * ```
   */
  static withReload(): SyncStrategy {
    return new SyncStrategy(async p => {
      await p.reload({ waitUntil: 'domcontentloaded' });
    });
  }

  /**
   * Custom: user-defined sync logic.
   *
   * ```ts
   * director.ensureExists(adminPb, params, {
   *   syncTo: userPage,
   *   syncStrategy: SyncStrategy.custom(async page => {
   *     await page.bringToFront();
   *     await page.reload();
   *   }),
   * });
   * ```
   */
  static custom(fn: (page: Page) => Promise<void>): SyncStrategy {
    return new SyncStrategy(fn);
  }
}
