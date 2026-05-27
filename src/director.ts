import type { Page } from '@playwright/test';
import type { Playbook, PlaybookPlays } from './playbook.js';
import type { RunOptions } from './play.js';
export type RecheckStrategy = {
  maxRetries: number;
  shouldReload?: boolean; // If true, reloads the page before retrying
};

export type DirectorConfig = {
  collect?: boolean;
  ensureExists?: {
    recheckBeforeCreate?: RecheckStrategy;
    shouldReloadSync?: boolean; // Default behavior when syncTo is provided
  };
  ambiguityBufferMs?: number;
};

type CollectedResult = {
  play: string;
  expected: 'success' | 'failure';
  outcome: string;
  pass: boolean;
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
  private readonly _mode: 'fail-fast' | 'collect';
  private readonly _collected: CollectedResult[] = [];

  constructor(private config?: DirectorConfig) {
    this._mode = config?.collect ? 'collect' : 'fail-fast';
  }

  /**
   * Runs a play and asserts that it resulted in a **success** outcome.
   * Throws if the play produced no detect/attempt outcome or a failure outcome.
   */
  async assertCan<P extends PlaybookPlays, K extends Extract<keyof P, string>>(
    playbook: Playbook<P>,
    playName: K,
    ...args: Parameters<P[K]> extends [infer Param] ? [Param] : []
  ): Promise<PlayResult> {
    const params = args[0] as unknown;
    const scopeStr = playbook.logScope() ? ` ${playbook.logScope()}` : '';
    console.log(`Assert:${scopeStr} can ${playName} ${playbook.name}`);

    if (this._mode === 'collect') {
      let result: PlayResult;
      try {
        result = await this._runPlay(playbook, playName, params, { indent: 1 });
      } catch (e) {
        const outcome = e instanceof Error ? e.message : String(e);
        this._collected.push({ play: playName, expected: 'success', outcome, pass: false });
        console.log('');
        return { isSuccess: false, outcome };
      }
      this._collected.push({ play: playName, expected: 'success', outcome: result.outcome, pass: result.isSuccess });
      console.log('');
      return result;
    }

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
  async assertCannot<P extends PlaybookPlays, K extends Extract<keyof P, string>>(
    playbook: Playbook<P>,
    playName: K,
    ...args: Parameters<P[K]> extends [infer Param] ? [Param] : []
  ): Promise<PlayResult> {
    const params = args[0] as unknown;
    const scopeStr = playbook.logScope() ? ` ${playbook.logScope()}` : '';
    console.log(`Assert:${scopeStr} cannot ${playName} ${playbook.name}`);

    if (this._mode === 'collect') {
      let result: PlayResult;
      try {
        result = await this._runPlay(playbook, playName, params, { indent: 1 });
      } catch (e) {
        const outcome = e instanceof Error ? e.message : String(e);
        this._collected.push({ play: playName, expected: 'failure', outcome, pass: false });
        console.log('');
        return { isSuccess: false, outcome };
      }
      this._collected.push({ play: playName, expected: 'failure', outcome: result.outcome, pass: !result.isSuccess });
      console.log('');
      return result;
    }

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
   * In collect mode: logs a results table and throws if any checks failed.
   * No-op in fail-fast mode (errors already threw at the call site).
   */
  async review(): Promise<void> {
    if (this._collected.length === 0) return;

    console.table(
      this._collected.map(r => ({
        Play: r.play,
        Expected: r.expected,
        Outcome: r.outcome,
        Status: r.pass ? '✅ PASS' : '❌ FAIL',
      }))
    );

    const failures = this._collected.filter(r => !r.pass);
    if (failures.length === 0) return;

    const lines = failures
      .map(r => `  ❌ ${r.play} — expected ${r.expected}, got "${r.outcome}"`)
      .join('\n');
    throw new Error(`Director.review(): ${failures.length} of ${this._collected.length} checks failed\n\n${lines}`);
  }

  /**
   * Runs a play and returns the outcome without asserting.
   * Use with `assertCan` / `assertCannot` when you need to aggregate results (e.g. permission matrices).
   */
  async run<P extends PlaybookPlays, K extends Extract<keyof P, string>>(
    playbook: Playbook<P>,
    playName: K,
    ...args: Parameters<P[K]> extends [infer Param] ? [Param] : []
  ): Promise<PlayResult> {
    const params = args[0] as unknown;
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
  async ensureExists<P extends PlaybookPlays>(
    playbook: Playbook<P>,
    ...args: Parameters<P['exists']> extends [infer Param] ? [Param, EnsureExistsOptions?] : [EnsureExistsOptions?]
  ): Promise<void> {
    const isOptions = (arg: unknown): arg is EnsureExistsOptions => 
      arg !== null && typeof arg === 'object' && ('syncTo' in arg || 'shouldReloadSync' in arg || 'recheckBeforeCreate' in arg);
    
    let params: unknown = undefined;
    let opts: EnsureExistsOptions | undefined = undefined;

    if (args.length === 1) {
      if (isOptions(args[0])) opts = args[0];
      else params = args[0];
    } else if (args.length === 2) {
      params = args[0];
      opts = args[1] as EnsureExistsOptions;
    }
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
      let syncResult = await this._runPlay(targetPlaybook, 'exists', params, { 
        indent: 1, 
        labelSuffix: '(sync check)' 
      });

      // Under the hood: if shouldReloadSync is true, automatically retry up to 2 times
      let syncAttempts = 0;
      while (!syncResult.isSuccess && shouldReload && syncAttempts < 2) {
        if (targetPage) {
          const startT = Date.now();
          await targetPage.reload({ waitUntil: 'domcontentloaded' });
          console.log(`    ↻  page reloaded  (${Date.now() - startT}ms)`);
        }
        syncResult = await this._runPlay(targetPlaybook, 'exists', params, {
          indent: 1,
          labelSuffix: `(sync check attempt ${syncAttempts + 2})`,
        });
        syncAttempts++;
      }

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

    const runOpts: RunOptions = { ...opts };
    if (this.config?.ambiguityBufferMs !== undefined) {
      runOpts.ambiguityBufferMs = this.config.ambiguityBufferMs;
    }
    const { lastOutcome } = await play.run(label, ctx, runOpts);

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
