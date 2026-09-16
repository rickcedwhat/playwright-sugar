/**
 * Lite `attemptAction` / `detectState` — copy into your repo.
 * Soft-triggers an action, then races outcome locators until one is visible.
 * For strict-mode warnings, ambiguity buffers, and richer timeouts, use the package export.
 */
import type { Locator } from '@playwright/test';

export type LiteOutcome = {
  name: string;
  locator?: Locator;
  isSuccess: boolean;
  isTimeoutOutcome?: boolean;
  isActionErrorOutcome?: boolean;
};

export type LiteResolution = {
  isSuccess: boolean;
  outcome: string;
  locator?: Locator;
};

export async function attemptAction(
  action: () => Promise<void>,
  outcomes: LiteOutcome[],
  opts?: { timeout?: number }
): Promise<LiteResolution> {
  const timeout = opts?.timeout ?? 30_000;
  let actionError: Error | undefined;

  try {
    await action();
  } catch (e) {
    actionError = e instanceof Error ? e : new Error(String(e));
  }

  const start = Date.now();
  while (Date.now() - start < timeout) {
    for (const o of outcomes) {
      if (!o.locator) continue;
      try {
        if (await o.locator.isVisible()) {
          return { isSuccess: o.isSuccess, outcome: o.name, locator: o.locator };
        }
      } catch {
        // ignore transient locator errors while polling
      }
    }
    await new Promise((r) => setTimeout(r, 100));
  }

  const fallback = actionError
    ? outcomes.find((o) => o.isActionErrorOutcome) ?? outcomes.find((o) => o.isTimeoutOutcome)
    : outcomes.find((o) => o.isTimeoutOutcome);

  if (fallback) {
    return { isSuccess: fallback.isSuccess, outcome: fallback.name };
  }

  const checked = outcomes.map((o) => o.name).join(', ');
  let msg = `attemptAction timed out after ${timeout}ms. Checked: ${checked}`;
  if (actionError) msg += `\nAction also failed: ${actionError.message}`;
  throw new Error(msg);
}

export async function detectState(
  outcomes: LiteOutcome[],
  opts?: { timeout?: number }
): Promise<LiteResolution> {
  return attemptAction(async () => {}, outcomes, { timeout: opts?.timeout ?? 5_000 });
}
