import type { Locator, Page } from '@playwright/test';
import type { Outcome } from './attemptAction.js';

/**
 * An outcome as configured by the user — `locator` may be a page-bound function
 * resolved by Play before calling attemptAction. `timeout` is passed directly
 * as `AttemptActionOptions.timeout` to `attemptAction`; there is no `after` field.
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

/**
 * Creates a timeout outcome specification.
 *
 * By default, calling `Outcomes.timeout(name)` (via the `timeoutOutcome` factory mapping to `Outcomes.timeout` DSL entry)
 * marks `isSuccess: false` and represents a failure condition where a wait or locator action timed out.
 *
 * However, calling `Outcomes.timeout(name, { isSuccess: true })` overrides this behavior, marking `isSuccess: true`.
 * This changes control flow by designating the timeout as a successful outcome. This is useful when expecting a state
 * *not* to occur or when a timeout is the desired target outcome (e.g. verifying a modal remains closed).
 * This success-override allows subsequent success-branching in Play's execution, satisfies the Director's assertion
 * checks (e.g., `assertCan`), and avoids triggering retry/error recovery cycles or cleanups that consume `isSuccess`
 * and `isTimeoutOutcome`.
 *
 * @example
 * // Default: timeout is treated as a failure
 * Outcomes.timeout('spinner-stuck')
 * // => { name: 'spinner-stuck', isSuccess: false, isTimeoutOutcome: true }
 *
 * // Override: timeout is treated as a success
 * Outcomes.timeout('modal-never-appeared', { isSuccess: true })
 * // => { name: 'modal-never-appeared', isSuccess: true, isTimeoutOutcome: true }
 */
function timeoutOutcome(name?: string, opts?: { isSuccess?: boolean }): OutcomeSpec {
  return {
    name: name ?? 'timeout',
    isSuccess: opts?.isSuccess ?? false,
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
