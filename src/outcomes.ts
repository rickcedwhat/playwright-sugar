import type { Locator, Page } from '@playwright/test';
import type { Outcome } from './attemptAction.js';

/**
 * An outcome as configured by the user — `locator` may be a page-bound function
 * resolved by Play before calling attemptAction. `after` is consumed by Play
 * to derive the `timeout` parameter.
 */
export type OutcomeSpec = Omit<Outcome, 'locator'> & {
  locator?: Locator | ((page: Page) => Locator);
  after?: number;
};

// ── config shapes ─────────────────────────────────────────────────────────────

type LocatorConfig = {
  name?: string;
  locator: Locator | ((page: Page) => Locator);
  onOutcome?: (winner: Locator) => Promise<unknown>;
};

type TextConfig = {
  name?: string;
  text: string | RegExp;
  onOutcome?: (winner: Locator) => Promise<unknown>;
};

type OutcomeInput = LocatorConfig | TextConfig;

function resolveLocator(config: OutcomeInput): Locator | ((page: Page) => Locator) {
  if ('text' in config) {
    const { text } = config;
    return (p) => p.getByText(text);
  }
  return config.locator;
}

function deriveName(config: OutcomeInput, fallback: string): string {
  if (config.name) return config.name;
  if ('text' in config) return typeof config.text === 'string' ? config.text : fallback;
  return fallback;
}

// ── DSL ───────────────────────────────────────────────────────────────────────

function successOutcome(config: OutcomeInput): OutcomeSpec {
  return {
    name: deriveName(config, 'success'),
    isSuccess: true,
    locator: resolveLocator(config),
    ...(config.onOutcome && { onOutcome: config.onOutcome }),
  };
}

function failureOutcome(config: OutcomeInput): OutcomeSpec {
  return {
    name: deriveName(config, 'failure'),
    isSuccess: false,
    locator: resolveLocator(config),
    ...(config.onOutcome && { onOutcome: config.onOutcome }),
  };
}

function timeoutOutcome(config: { after?: number; name?: string } = {}): OutcomeSpec {
  return {
    name: config.name ?? 'timeout',
    isSuccess: false,
    isTimeoutOutcome: true,
    ...(config.after !== undefined && { after: config.after }),
  };
}

function actionErrorOutcome(config: { name?: string } = {}): OutcomeSpec {
  return {
    name: config.name ?? 'action-error',
    isSuccess: false,
    isActionErrorOutcome: true,
  };
}

export const Outcomes = {
  success: successOutcome,
  failure: failureOutcome,
  timeout: timeoutOutcome,
  actionError: actionErrorOutcome,
};
