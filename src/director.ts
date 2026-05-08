import type { Page } from '@playwright/test';
import type { Playbook } from './playbook.js';
import { SyncStrategy } from './syncStrategy.js';

export type EnsureExistsOptions = {
  syncTo: Page;
  syncStrategy?: SyncStrategy;
};

export type PlayResult = {
  isSuccess: boolean;
  outcome: string;
  data?: unknown;
};

const SYNC_RETRY_TIMEOUT = 30_000;
const SYNC_RETRY_INTERVAL = 500;

export class Director {
  /**
   * Runs a play and asserts that it resulted in a **success** outcome.
   * Throws if the play produced no attempt result or a failure outcome.
   */
  async assertCan(
    playbook: Playbook,
    playName: string,
    params: unknown
  ): Promise<PlayResult> {
    const result = await this._runPlay(playbook, playName, params);
    if (!result.isSuccess) {
      throw new Error(
        `[${playbook.name} > ${playName}] assertCan: expected success but got "${result.outcome}"`
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
    const result = await this._runPlay(playbook, playName, params);
    if (result.isSuccess) {
      throw new Error(
        `[${playbook.name} > ${playName}] assertCannot: expected failure but got success`
      );
    }
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
    const existsResult = await this._runPlay(playbook, 'exists', params);

    if (!existsResult.isSuccess) {
      await this._runPlay(playbook, 'create', params);
    }

    if (opts?.syncTo) {
      const strategy = opts.syncStrategy ?? SyncStrategy.default();
      await strategy.sync(opts.syncTo);

      const targetPlaybook = playbook.withCtx({ page: opts.syncTo });
      await this._retryExists(targetPlaybook, params, playbook.name);
    }
  }

  // ── Internal ─────────────────────────────────────────────────────────────────

  private async _runPlay(
    playbook: Playbook,
    playName: string,
    params: unknown
  ): Promise<PlayResult> {
    const factory = playbook.getPlay(playName);
    const play = factory(params);
    const ctx = playbook.buildCtx();
    const label = `${playbook.name} > ${playName}`;

    const finalCtx = await play.run(label, ctx);

    if (!finalCtx['result']) {
      return { isSuccess: false, outcome: 'no-attempt' };
    }

    return finalCtx['result'] as PlayResult;
  }

  private async _retryExists(
    playbook: Playbook,
    params: unknown,
    originalName: string
  ): Promise<void> {
    const deadline = Date.now() + SYNC_RETRY_TIMEOUT;
    while (Date.now() < deadline) {
      const result = await this._runPlay(playbook, 'exists', params);
      if (result.isSuccess) return;
      await new Promise(resolve => setTimeout(resolve, SYNC_RETRY_INTERVAL));
    }
    throw new Error(
      `[${originalName}] ensureExists: resource not found on sync target after ${SYNC_RETRY_TIMEOUT}ms`
    );
  }
}
