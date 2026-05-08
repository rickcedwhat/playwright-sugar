import type { Locator, Page } from '@playwright/test';
import type { Outcome } from './attemptAction.js';

/**
 * An outcome as configured by the user — `locator` may be a page-bound function
 * resolved by Play before calling attemptAction. `after` is consumed by Play
 * to derive the `timeout` parameter.
 */
export type OutcomeSpec = Omit<Outcome, 'locator'> & {
  locator?: Locator | ((page: Page, ctx: Record<string, unknown>) => Locator);
  after?: number;
};

type LocatorArg = Locator | ((page: Page, ctx: Record<string, unknown>) => Locator);

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

function timeoutOutcome(): OutcomeSpec;
function timeoutOutcome(after: number): OutcomeSpec;
function timeoutOutcome(name: string, after?: number): OutcomeSpec;
function timeoutOutcome(nameOrAfter?: string | number, after?: number): OutcomeSpec {
  if (typeof nameOrAfter === 'number') {
    return { name: 'timeout', isSuccess: false, isTimeoutOutcome: true, after: nameOrAfter };
  }
  return {
    name: nameOrAfter ?? 'timeout',
    isSuccess: false,
    isTimeoutOutcome: true,
    ...(after !== undefined && { after }),
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
