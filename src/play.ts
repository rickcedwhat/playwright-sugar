import type { Page } from '@playwright/test';
import { attemptAction, detectPageState } from './attemptAction.js';
import type { Outcome } from './attemptAction.js';
import type { OutcomeSpec } from './outcomes.js';

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

type AttemptConfig = {
  trigger: ActFn;
  outcomes: OutcomeSpec[];
  /** Optional explicit timeout. If omitted, Play derives it from the timeout outcome's .after field. */
  timeout?: number;
};

// ── Internal act record (discriminated union) ─────────────────────────────────

type ActRecord =
  | { kind: 'act'; name: string; fn: ActFn; skip: boolean }
  | { kind: 'detect'; fn: (page: Page) => DetectCandidate[]; timeout?: number; skip: boolean }
  | { kind: 'attempt'; name: string; config: AttemptConfig; skip: boolean }
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

  attempt(config: AttemptConfig, opts?: ActOptions): Play;
  attempt(name: string, config: AttemptConfig, opts?: ActOptions): Play;
  attempt(
    nameOrConfig: string | AttemptConfig,
    configOrOpts?: AttemptConfig | ActOptions,
    opts?: ActOptions
  ): Play {
    if (typeof nameOrConfig === 'string') {
      const config = configOrOpts as AttemptConfig;
      return this._append({ kind: 'attempt', name: nameOrConfig, config, skip: opts?.skip ?? false });
    }
    const config = nameOrConfig;
    const options = configOrOpts as ActOptions | undefined;
    return this._append({ kind: 'attempt', name: 'attempt', config, skip: options?.skip ?? false });
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

      if (act.skip || runError) {
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
            const resolvedOutcomes: Outcome[] = act.config.outcomes.map(o => ({
              name: o.name,
              isSuccess: o.isSuccess,
              ...(o.isTimeoutOutcome && { isTimeoutOutcome: true }),
              ...(o.isActionErrorOutcome && { isActionErrorOutcome: true }),
              ...(o.onOutcome && { onOutcome: o.onOutcome }),
              ...(o.locator !== undefined && {
                locator: typeof o.locator === 'function' ? o.locator(page, ctx) : o.locator,
              }),
            }));

            const timeoutOutcome = act.config.outcomes.find(o => o.isTimeoutOutcome);
            const timeout =
              act.config.timeout ??
              (timeoutOutcome?.after !== undefined ? timeoutOutcome.after : undefined);

            const attemptParams: Parameters<typeof attemptAction>[0] = {
              action: () => act.config.trigger(page, ctx),
              outcomes: resolvedOutcomes,
            };
            if (timeout !== undefined) attemptParams.timeout = timeout;

            const result = await attemptAction(attemptParams);
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
