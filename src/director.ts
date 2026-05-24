import type { Page } from '@playwright/test';
import type { Playbook } from './playbook.js';
export type RecheckStrategy = {
  maxRetries: number;
  shouldReload?: boolean; // If true, reloads the page before retrying
};

export type DirectorConfig = {
  ensureExists?: {
    recheckBeforeCreate?: RecheckStrategy;
    shouldReloadSync?: boolean; // Default behavior when syncTo is provided
  };
};

export type EnsureExistsOptions = {
  syncTo?: Page | Playbook;
  shouldReloadSync?: boolean;
  recheckBeforeCreate?: RecheckStrategy;
};

export type PlayResult = {
  isSuccess: boolean;
  outcome: string;
  /** From the winning detect/attempt branch’s `onOutcome`, if any. */
  payload?: unknown;
};



export class Director {
  constructor(private config?: DirectorConfig) {}

  /**
   * Runs a play and asserts that it resulted in a **success** outcome.
   * Throws if the play produced no detect/attempt outcome or a failure outcome.
   */
  async assertCan(
    playbook: Playbook,
    playName: string,
    params: unknown
  ): Promise<PlayResult> {
    const scopeStr = playbook.logScope() ? ` ${playbook.logScope()}` : '';
    console.log(`Assert:${scopeStr} can ${playName} ${playbook.name}`);
    const result = await this._runPlay(playbook, playName, params, { indent: 1 });
    console.log('');
    if (!result.isSuccess) {
      throw new Error(
        `[${playbook.runLabel(playName)}] assertCan: expected success but got "${result.outcome}"`
      );
    }
    return result;
  }

  /**
   * Runs a play and asserts that it resulted in a **failure** outcome.
   * Throws if the play produced a success outcome.
   */
  async assertCannot(
    playbook: Playbook,
    playName: string,
    params: unknown
  ): Promise<PlayResult> {
    const scopeStr = playbook.logScope() ? ` ${playbook.logScope()}` : '';
    console.log(`Assert:${scopeStr} cannot ${playName} ${playbook.name}`);
    const result = await this._runPlay(playbook, playName, params, { indent: 1 });
    console.log('');
    if (result.isSuccess) {
      throw new Error(
        `[${playbook.runLabel(playName)}] assertCannot: expected failure but got success`
      );
    }
    return result;
  }

  /**
   * Runs a play and returns the outcome without asserting.
   * Use with `assertCan` / `assertCannot` when you need to aggregate results (e.g. permission matrices).
   */
  async run(playbook: Playbook, playName: string, params: unknown): Promise<PlayResult> {
    const scopeStr = playbook.logScope() ? ` ${playbook.logScope()}` : '';
    console.log(`Run:${scopeStr} ${playName} ${playbook.name}`);
    const result = await this._runPlay(playbook, playName, params, { indent: 1 });
    console.log('');
    return result;
  }

  /**
   * Ensures a resource exists, creating it if needed.
   *
   * If `syncTo` is provided, syncs state to that page (default: bringToFront + reload)
   * then retries the `exists` play there until it passes or times out.
   *
   * Requires the Playbook to have `exists` and `create` plays.
   */
  async ensureExists(
    playbook: Playbook,
    params: unknown,
    opts?: EnsureExistsOptions
  ): Promise<void> {
    const scopeStr = playbook.logScope() ? ` ${playbook.logScope()}` : '';
    console.log(`Ensure:${scopeStr} ${playbook.name} exists`);

    let existsResult = await this._runPlay(playbook, 'exists', params, { indent: 1 });

    const recheckConfig = opts?.recheckBeforeCreate ?? this.config?.ensureExists?.recheckBeforeCreate;
    let attempts = 0;

    while (!existsResult.isSuccess && recheckConfig && attempts < recheckConfig.maxRetries) {
      if (recheckConfig.shouldReload) {
        const page = playbook.getPage();
        const startT = Date.now();
        await page.reload({ waitUntil: 'domcontentloaded' });
        console.log(`    ↻  page reloaded  (${Date.now() - startT}ms)`);
      }
      existsResult = await this._runPlay(playbook, 'exists', params, { 
        indent: 1, 
        labelSuffix: `(attempt ${attempts + 2})` 
      });
      attempts++;
    }

    if (!existsResult.isSuccess) {
      const createResult = await this._runPlay(playbook, 'create', params, { indent: 1 });
      if (!createResult.isSuccess) {
        throw new Error(
          `[${playbook.runLabel('create')}] ensureExists: create play did not succeed (outcome: "${createResult.outcome}")`
        );
      }
    }

    if (opts?.syncTo) {
      const shouldReload = opts.shouldReloadSync ?? this.config?.ensureExists?.shouldReloadSync ?? false;
      const isPlaybook = 'withCtx' in opts.syncTo;
      const targetPage = isPlaybook ? (opts.syncTo as Playbook).getPage() : (opts.syncTo as Page);

      if (shouldReload && targetPage) {
        const startT = Date.now();
        await targetPage.reload({ waitUntil: 'domcontentloaded' });
        console.log(`    ↻  page reloaded  (${Date.now() - startT}ms)`);
      }

      const targetPlaybook = isPlaybook
        ? (opts.syncTo as Playbook)
        : (() => {
            const scope = playbook.logScope();
            return scope !== undefined
              ? playbook.withCtx(scope, { page: targetPage })
              : playbook.withCtx({ page: targetPage });
          })();
      
      console.log(`  ↻ Syncing ${targetPlaybook.runLabel('exists')}`);
      const syncResult = await this._runPlay(targetPlaybook, 'exists', params, { 
        indent: 1, 
        labelSuffix: '(sync check)' 
      });

      if (!syncResult.isSuccess) {
        throw new Error(
          `[${targetPlaybook.runLabel('exists')}] ensureExists: resource not found on sync target`
        );
      }
    }

    console.log('');
  }

  // ── Internal ─────────────────────────────────────────────────────────────────

  private async _runPlay(
    playbook: Playbook,
    playName: string,
    params: unknown,
    opts?: { indent?: number; labelSuffix?: string }
  ): Promise<PlayResult> {
    const factory = playbook.getPlay(playName);
    const play = factory(params);
    const ctx = playbook.buildCtx();
    const label = playbook.runLabel(playName);

    const { lastOutcome } = await play.run(label, ctx, opts);

    if (lastOutcome) {
      const r: PlayResult = {
        isSuccess: lastOutcome.isSuccess,
        outcome: lastOutcome.name,
      };
      if (lastOutcome.payload !== undefined) r.payload = lastOutcome.payload;
      return r;
    }

    return { isSuccess: false, outcome: 'no-attempt' };
  }


}
