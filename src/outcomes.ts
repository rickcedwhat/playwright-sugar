import type { Locator, Page } from '@playwright/test';
import type { Outcome } from './attemptAction.js';

/**
 * An outcome as configured by the user — `locator` may be a page-bound function
 * resolved by Play before calling attemptAction. `after` is consumed by Play
 * to derive the `timeout` parameter.
 */
export type OutcomeSpec = Omit<Outcome, 'locator'> & {
  locator?: Locator | ((page: Page, ctx: Record<string, unknown>) => Locator | Promise<Locator>);
};

type LocatorArg = Locator | ((page: Page, ctx: Record<string, unknown>) => Locator | Promise<Locator>);

type OnOutcome = { onOutcome?: (winner: Locator) => Promise<unknown> };

// ── DSL ───────────────────────────────────────────────────────────────────────

function successOutcome(locator: LocatorArg): OutcomeSpec;
function successOutcome(name: string, locator: LocatorArg, opts?: OnOutcome): OutcomeSpec;
function successOutcome(
  nameOrLocator: string | LocatorArg,
  locator?: LocatorArg,
  opts?: OnOutcome
): OutcomeSpec {
  const [name, loc] = typeof nameOrLocator === 'string'
    ? [nameOrLocator, locator!]
    : ['success', nameOrLocator];
  return {
    name,
    isSuccess: true,
    locator: loc,
    ...(opts?.onOutcome && { onOutcome: opts.onOutcome }),
  };
}

function failureOutcome(locator: LocatorArg): OutcomeSpec;
function failureOutcome(name: string, locator: LocatorArg, opts?: OnOutcome): OutcomeSpec;
function failureOutcome(
  nameOrLocator: string | LocatorArg,
  locator?: LocatorArg,
  opts?: OnOutcome
): OutcomeSpec {
  const [name, loc] = typeof nameOrLocator === 'string'
    ? [nameOrLocator, locator!]
    : ['failure', nameOrLocator];
  return {
    name,
    isSuccess: false,
    locator: loc,
    ...(opts?.onOutcome && { onOutcome: opts.onOutcome }),
  };
}

function timeoutOutcome(name?: string): OutcomeSpec {
  return {
    name: name ?? 'timeout',
    isSuccess: false,
    isTimeoutOutcome: true,
  };
}

function actionErrorOutcome(name?: string): OutcomeSpec {
  return { name: name ?? 'action-error', isSuccess: false, isActionErrorOutcome: true };
}

export const Outcomes = {
  success: successOutcome,
  failure: failureOutcome,
  timeout: timeoutOutcome,
  actionError: actionErrorOutcome,
};
