import type { Page } from '@playwright/test';
import { attemptAction, detectPageState } from './attemptAction.js';
import type { AttemptActionOptions, Outcome } from './attemptAction.js';
import type { OutcomeSpec } from './outcomes.js';

export type { AttemptActionOptions } from './attemptAction.js';

// ── Public types ──────────────────────────────────────────────────────────────

export type ActOptions = {
  skip?: boolean;
};

export type DetectOptions = ActOptions & {
  timeout?: number;
};

/** Mutable context object passed to every act function during play execution. */
export type PlayCtx = {
  /** Result of the most recent .detect() — winner's name and isSuccess. */
  state: { name: string; isSuccess: boolean; data?: unknown } | null;
  /** Result of the most recent .attempt() — set even on failure outcomes. */
  result: { isSuccess: boolean; outcome: string; data?: unknown } | null;
  /** Arbitrary extra context from Playbook.withCtx() (e.g. table helpers). */
  [key: string]: unknown;
};

type ActFn = (page: Page, ctx: PlayCtx) => Promise<void>;

type DetectCandidate = {
  name: string;
  isSuccess: boolean;
  locator?: import('@playwright/test').Locator;
};

// ── Internal act record (discriminated union) ─────────────────────────────────

type ActRecord =
  | { kind: 'act'; name: string; fn: ActFn; skip: boolean }
  | { kind: 'detect'; fn: (page: Page) => DetectCandidate[]; timeout?: number; skip: boolean }
  | {
      kind: 'attempt';
      name: string;
      trigger: ActFn;
      outcomes: OutcomeSpec[];
      opts?: AttemptActionOptions;
    }
  | { kind: 'cleanup'; fn: ActFn; skip: boolean }
  | { kind: 'reload'; opts: Parameters<Page['reload']>[0] | undefined; skip: boolean };

// ── Play ──────────────────────────────────────────────────────────────────────

export class Play {
  private readonly _acts: ActRecord[];

  constructor(acts: ActRecord[] = []) {
    this._acts = acts;
  }

  private _append(act: ActRecord): Play {
    return new Play([...this._acts, act]);
  }

  // ── Act builders ────────────────────────────────────────────────────────────

  act(name: string, fn: ActFn, opts: ActOptions = {}): Play {
    return this._append({ kind: 'act', name, fn, skip: opts.skip ?? false });
  }

  nav(fn: ActFn, opts: ActOptions = {}): Play {
    return this._append({ kind: 'act', name: 'nav', fn, skip: opts.skip ?? false });
  }

  prep(fn: ActFn, opts: ActOptions = {}): Play {
    return this._append({ kind: 'act', name: 'prep', fn, skip: opts.skip ?? false });
  }

  reload(reloadOpts?: Parameters<Page['reload']>[0], opts: ActOptions = {}): Play {
    return this._append({ kind: 'reload', opts: reloadOpts, skip: opts.skip ?? false });
  }

  detect(fn: (page: Page) => DetectCandidate[], opts: DetectOptions = {}): Play {
    return this._append({
      kind: 'detect',
      fn,
      ...(opts.timeout !== undefined && { timeout: opts.timeout }),
      skip: opts.skip ?? false,
    });
  }

  attempt(trigger: ActFn, outcomes: OutcomeSpec[], opts?: AttemptActionOptions): Play;
  attempt(name: string, trigger: ActFn, outcomes: OutcomeSpec[], opts?: AttemptActionOptions): Play;
  attempt(
    nameOrTrigger: string | ActFn,
    triggerOrOutcomes: ActFn | OutcomeSpec[],
    outcomesOrOpts?: OutcomeSpec[] | AttemptActionOptions,
    maybeOpts?: AttemptActionOptions
  ): Play {
    if (typeof nameOrTrigger === 'string') {
      const name = nameOrTrigger;
      const trigger = triggerOrOutcomes as ActFn;
      const outcomes = outcomesOrOpts as OutcomeSpec[];
      const opts = maybeOpts;
      return this._append({
        kind: 'attempt',
        name,
        trigger,
        outcomes,
        ...(opts !== undefined && { opts }),
      });
    }

    const trigger = nameOrTrigger as ActFn;
    const outcomes = triggerOrOutcomes as OutcomeSpec[];
    const opts = outcomesOrOpts as AttemptActionOptions | undefined;

    return this._append({
      kind: 'attempt',
      name: 'attempt',
      trigger,
      outcomes,
      ...(opts !== undefined && { opts }),
    });
  }

  cleanup(fn: ActFn, opts: ActOptions = {}): Play {
    return this._append({ kind: 'cleanup', fn, skip: opts.skip ?? false });
  }

  // ── Execution ────────────────────────────────────────────────────────────────

  async run(label: string, ctx: PlayCtx): Promise<PlayCtx> {
    const page = ctx['page'] as Page;
    if (!page) throw new Error(`[${label}] No page in PlayCtx — bind one via Playbook.withCtx({ page })`);

    const mainActs = this._acts.filter(a => a.kind !== 'cleanup');
    const cleanupActs = this._acts.filter(a => a.kind === 'cleanup');

    await page.bringToFront();
    console.log(`▶ Play: ${label}`);

    let attemptReached = false;
    let runError: Error | undefined;

    for (const act of mainActs) {
      const actName = _actLabel(act);

      if (runError || (act.kind !== 'attempt' && act.skip)) {
        console.log(`  ⏭  ${actName}  SKIPPED`);
        continue;
      }

      const t = Date.now();

      try {
        switch (act.kind) {
          case 'act':
            await act.fn(page, ctx);
            console.log(`  ✅ ${actName}  (${Date.now() - t}ms)`);
            break;

          case 'reload':
            await page.reload(act.opts);
            console.log(`  ✅ ${actName}  (${Date.now() - t}ms)`);
            break;

          case 'detect': {
            const candidates = act.fn(page);
            const outcomes: Outcome[] = candidates.map(c => ({
              name: c.name,
              isSuccess: c.isSuccess,
              ...(c.locator !== undefined && { locator: c.locator }),
            }));
            const detectParams: Parameters<typeof detectPageState>[0] = { outcomes };
            if (act.timeout !== undefined) detectParams.timeout = act.timeout;
            const detectResult = await detectPageState(detectParams);
            ctx['state'] = { name: detectResult.outcome, isSuccess: detectResult.isSuccess, data: detectResult.data };
            console.log(`  ✅ ${actName}  (${Date.now() - t}ms) → state: ${detectResult.outcome}`);
            break;
          }

          case 'attempt': {
            attemptReached = true;
            const resolvedOutcomes: Outcome[] = act.outcomes.map(o => ({
              name: o.name,
              isSuccess: o.isSuccess,
              ...(o.isTimeoutOutcome && { isTimeoutOutcome: true }),
              ...(o.isActionErrorOutcome && { isActionErrorOutcome: true }),
              ...(o.onOutcome && { onOutcome: o.onOutcome }),
              ...(o.locator !== undefined && {
                locator: typeof o.locator === 'function' ? o.locator(page, ctx) : o.locator,
              }),
            }));

            const timeoutOutcome = act.outcomes.find(o => o.isTimeoutOutcome);
            const resolvedTimeout = act.opts?.timeout ?? timeoutOutcome?.after;
            const attemptOpts: AttemptActionOptions | undefined =
              resolvedTimeout !== undefined ? { ...act.opts, timeout: resolvedTimeout } : act.opts;

            const result = await attemptAction(
              () => act.trigger(page, ctx),
              resolvedOutcomes,
              attemptOpts
            );
            ctx['result'] = result;

            const ms = Date.now() - t;
            if (result.isSuccess) {
              console.log(`  ✅ ${actName}  (${ms}ms) → outcome: ${result.outcome}`);
            } else {
              console.log(`  ❌ ${actName}  (${ms}ms) → outcome: ${result.outcome}`);
            }
            break;
          }
        }
      } catch (err: unknown) {
        const ms = Date.now() - t;
        const raw = err instanceof Error ? err : new Error(String(err));
        const wrapped = new Error(`[${label} > ${actName}] ${raw.message}`, { cause: raw });
        console.log(`  ❌ ${actName}  (${ms}ms) → ${wrapped.message}`);
        runError = wrapped;
      }
    }

    if (attemptReached && !runError) {
      for (const act of cleanupActs) {
        if (act.kind !== 'cleanup') continue;

        if (act.skip) {
          console.log(`  ⏭  cleanup  SKIPPED`);
          continue;
        }

        const t = Date.now();
        try {
          await act.fn(page, ctx);
          console.log(`  ✅ cleanup  (${Date.now() - t}ms)`);
        } catch (err: unknown) {
          const ms = Date.now() - t;
          const raw = err instanceof Error ? err : new Error(String(err));
          const wrapped = new Error(`[${label} > cleanup] ${raw.message}`, { cause: raw });
          console.log(`  ❌ cleanup  (${ms}ms) → ${wrapped.message}`);
          if (!runError) runError = wrapped;
        }
      }
    } else if (attemptReached && runError) {
      for (const act of cleanupActs) {
        if (act.kind === 'cleanup') console.log(`  ⏭  cleanup  SKIPPED`);
      }
    }

    if (runError) throw runError;
    return ctx;
  }
}

function _actLabel(act: ActRecord): string {
  switch (act.kind) {
    case 'act': return act.name;
    case 'detect': return 'detect';
    case 'attempt': return act.name;
    case 'cleanup': return 'cleanup';
    case 'reload': return 'reload';
  }
}
