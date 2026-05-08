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
  [key: string]: unknown;
};

// ── Playbook ──────────────────────────────────────────────────────────────────

export class Playbook<TPlays extends PlaybookPlays = PlaybookPlays> {
  /** Optional human-readable name used by Director in error labels. */
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
   * ```ts
   * const userPb = datasetPb.withCtx({ page: userPage, table: braintrustTable });
   * ```
   */
  withCtx(ctx: Partial<PlaybookCtx>): Playbook<TPlays> {
    const copy = new Playbook<TPlays>(this.name, this._plays);
    (copy as unknown as { _ctx: Partial<PlaybookCtx> })['_ctx'] = { ...this._ctx, ...ctx };
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
        `Playbook "${this.name}" has no page bound — call .withCtx({ page }) before using Director`
      );
    }
    return page as Page;
  }

  /**
   * Returns a PlayCtx derived from the bound context, with state and result
   * initialised to null. Includes `page` so Play.run() can access it via ctx['page'].
   */
  buildCtx(): PlayCtx {
    const { page: _page, ...rest } = this._ctx as PlaybookCtx;
    return {
      ...rest,
      page: _page,
      state: null,
      result: null,
    };
  }
}
