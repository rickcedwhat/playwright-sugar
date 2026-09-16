import type { Page } from '@playwright/test';
import type { Play } from './play.js';
import type { PlayCtx } from './play.js';

// ── Types ─────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PlayFactory = (params: any) => Play;

export type PlaybookPlays = Record<string, PlayFactory>;

/**
 * Context bound to a Playbook via .withCtx().
 * `page` is required for Director to run plays; extra keys flow into PlayCtx.
 */
export type PlaybookCtx = {
  page: Page;
  /**
   * Optional log label (set with two-argument `Playbook.withCtx(name, ctx)`).
   * Stored internally; not passed into act `ctx` (see {@link Playbook.buildCtx}).
   */
  playbookLogScope?: string;
  [key: string]: unknown;
};

/**
 * Result of {@link bindPlaybooks}: same keys as the input catalog, each playbook
 * merged with the shared context (preserves per-playbook play typings).
 */
export type BoundPlaybookCatalog<T extends Record<string, Playbook>> = {
  [K in keyof T]: T[K] extends Playbook<infer P> ? Playbook<P> : Playbook;
};

/**
 * Optional settings for {@link bindPlaybooks}.
 */
export type BindPlaybooksOptions = {
  /**
   * When set, equivalent to calling two-argument `withCtx(name, { ...ctx })` on each catalog entry
   * (log label only; {@link Playbook.name} is unchanged).
   */
  name?: string;
};

/**
 * Binds every playbook in `catalog` to the same context via {@link Playbook.withCtx}.
 * Typical use: one object for “user” and one for “admin”, without repeating `.withCtx`.
 *
 * @example
 * ```ts
 * const catalog = { project: projectPb, logs: logsPb };
 * const user = bindPlaybooks({ page: userPage }, catalog, { name: 'User' });
 * const admin = bindPlaybooks({ page: adminPage }, catalog, { name: 'Admin' });
 * await director.ensureExists(admin.project, { name: 'x' });
 * await director.assertCan(user.logs, 'access', {});
 * ```
 */
export function bindPlaybooks<T extends Record<string, Playbook>>(
  ctx: Partial<PlaybookCtx>,
  catalog: T,
  opts?: BindPlaybooksOptions
): BoundPlaybookCatalog<T> {
  const out = {} as BoundPlaybookCatalog<T>;
  for (const key of Object.keys(catalog) as (keyof T & string)[]) {
    const original = catalog[key]!;
    (out as Record<string, Playbook>)[key] =
      opts?.name && opts.name.length > 0 ? original.withCtx(opts.name, ctx) : original.withCtx(ctx);
  }
  return out;
}

// ── Playbook ──────────────────────────────────────────────────────────────────

export class Playbook<TPlays extends PlaybookPlays = PlaybookPlays> {
  /** Registry id from `new Playbook(name, plays)`; middle segment of {@link Playbook.runLabel}. */
  readonly name: string;
  private readonly _plays: TPlays;
  private readonly _ctx: Partial<PlaybookCtx>;

  constructor(name: string, plays: TPlays);
  constructor(plays: TPlays);
  constructor(nameOrPlays: string | TPlays, plays?: TPlays) {
    if (typeof nameOrPlays === 'string') {
      this.name = nameOrPlays;
      this._plays = plays!;
    } else {
      this.name = 'Playbook';
      this._plays = nameOrPlays;
    }
    this._ctx = {};
  }

  /**
   * Returns a new Playbook with merged context. The original is unchanged.
   *
   * Two forms:
   * - `withCtx({ page, ... })` — bind page and optional act context.
   * - `withCtx(name, { page, ... })` — same, plus a **log-only** first segment for {@link Playbook.runLabel}
   *   (`name` is not the playbook registry id; that stays {@link Playbook.name}).
   *
   * ```ts
   * datasetPb.withCtx({ page: userPage, table: braintrustTable });
   * datasetPb.withCtx('User', { page: userPage, table: braintrustTable });
   * ```
   */
  withCtx(ctx: Partial<PlaybookCtx>): Playbook<TPlays>;
  withCtx(name: string, ctx: Partial<PlaybookCtx>): Playbook<TPlays>;
  withCtx(nameOrCtx: string | Partial<PlaybookCtx>, maybeCtx?: Partial<PlaybookCtx>): Playbook<TPlays> {
    if (typeof nameOrCtx === 'string') {
      if (maybeCtx === undefined) {
        throw new Error('Playbook.withCtx(name, ctx): ctx is required when name is provided');
      }
      return this.mergeCtx({ ...maybeCtx, playbookLogScope: nameOrCtx });
    }
    return this.mergeCtx(nameOrCtx);
  }

  private mergeCtx(partial: Partial<PlaybookCtx>): Playbook<TPlays> {
    const copy = new Playbook<TPlays>(this.name, this._plays);
    (copy as unknown as { _ctx: Partial<PlaybookCtx> })['_ctx'] = { ...this._ctx, ...partial };
    return copy;
  }

  /**
   * Returns the play factory for the given name.
   * Throws if the play doesn't exist in this Playbook.
   */
  getPlay(playName: string): PlayFactory {
    const factory = this._plays[playName];
    if (!factory) {
      throw new Error(`Playbook "${this.name}" has no play named "${playName}"`);
    }
    return factory;
  }

  /**
   * Returns the bound page. Throws if no page has been bound via withCtx().
   */
  getPage(): Page {
    const page = this._ctx['page'];
    if (!page) {
      throw new Error(
        `Playbook "${this.name}" has no page bound — call .withCtx({ page }) or .withCtx(name, { page }) before using Director`
      );
    }
    return page as Page;
  }

  /**
   * Log label from `withCtx(name, ctx)` / {@link bindPlaybooks} `opts`, if any.
   */
  logScope(): string | undefined {
    const s = this._ctx['playbookLogScope'];
    return typeof s === 'string' && s.length > 0 ? s : undefined;
  }

  /**
   * Label passed to `Play.run` / used in `Director` errors: either
   * `` `${logScope} > ${name} > ${playName}` `` or `` `${name} > ${playName}` ``.
   */
  runLabel(playName: string): string {
    const scope = this.logScope();
    if (scope !== undefined) {
      return `${scope} > ${this.name} > ${playName}`;
    }
    return `${this.name} > ${playName}`;
  }

  /**
   * Returns a PlayCtx derived from the bound context. Includes `page` so `Play.run()`
   * can access it via `ctx['page']`. Omits {@link PlaybookCtx.playbookLogScope} so act callbacks stay free of log metadata.
   */
  buildCtx(): PlayCtx {
    const { page: _page, playbookLogScope: _omit, ...rest } = this._ctx as PlaybookCtx;
    return {
      ...rest,
      page: _page,
    } as PlayCtx;
  }
}
