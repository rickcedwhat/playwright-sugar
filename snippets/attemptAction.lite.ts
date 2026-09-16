/**
 * AUTO-GENERATED — do not edit by hand.
 * Source: src/attemptAction.ts
 * Regenerate: pnpm run snippets:generate
 *
 * Lite copy-paste attemptAction / detectState. Same core behavior as the package
 * export; robust-only diagnostics and extras are stripped.
 */
import type { Locator } from '@playwright/test';

export type Outcome = {
  name: string;
  locator?: Locator;
  isSuccess: boolean;
  isTimeoutOutcome?: boolean;
  isActionErrorOutcome?: boolean;
};

/** Resolution from {@link attemptAction} / {@link detectState}. */
export type AttemptResolution = {
  isSuccess: boolean;
  outcome: string;
  locator?: Locator;
};

/** Options for `attemptAction` — extend with future flags without breaking the positional API. */
export type AttemptActionOptions = {
  timeout?: number;
};

export async function attemptAction(
  action: () => Promise<void>,
  outcomes: Outcome[],
  opts?: AttemptActionOptions
): Promise<AttemptResolution> {
  const normalizedOutcomes = outcomes;
  const timeout = opts?.timeout ?? 30000;

  // Trigger Phase: Soft Trigger implementation
  let actionError: Error | undefined;
  try {
    await action();
  } catch (e: any) {
    actionError = e;
  }

  const startTime = Date.now();

  // Polling Phase
  const bufferMs = 150;

  type Winner = { outcome: Outcome; locator: Locator };
  let firstWinner: Winner | null = null;
  const winners: Winner[] = [];

  const candidatePromises = normalizedOutcomes.map(async (o) => {
    while (Date.now() - startTime < timeout) {
      try {
        if (!o.locator) return null;

        let actualLocator: Locator | null = null;
        actualLocator = o.locator;

        if (actualLocator && await actualLocator.isVisible()) {
          return { outcome: o, locator: actualLocator };
        }
      } catch (error: unknown) {
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return null;
  });

  await new Promise<void>((resolve) => {
    if (candidatePromises.length === 0) {
      resolve();
      return;
    }

    let resolvedCount = 0;
    let bufferTimer: ReturnType<typeof setTimeout> | null = null;

    candidatePromises.forEach(p => {
      p.then(winner => {
        resolvedCount++;
        if (winner) {
          winners.push(winner);
          if (!firstWinner) {
            firstWinner = winner;
            bufferTimer = setTimeout(() => resolve(), bufferMs);
          }
        }

        if (resolvedCount === candidatePromises.length) {
          if (bufferTimer) clearTimeout(bufferTimer);
          resolve();
        }
      });
    });
  });

  if (winners.length > 1) {
    throw new Error(
      `Ambiguous Page State: Multiple outcomes detected: [${winners
        .map((w) => w.outcome.name)
        .join(', ')}]. Fix your locators!`
    );
  }

  if (winners.length === 1) {
    const winner = winners[0];
    if (!winner) throw new Error('Winner vanished during processing');

    return {
      isSuccess: winner.outcome.isSuccess,
      outcome: winner.outcome.name,
      locator: winner.locator,
    };
  }

  // Timeout Handling — no visible winner; do not run onOutcome (no winning locator).
  const timeoutOutcome = actionError
    ? normalizedOutcomes.find((o) => o.isActionErrorOutcome) ||
      normalizedOutcomes.find((o) => o.isTimeoutOutcome)
    : normalizedOutcomes.find((o) => o.isTimeoutOutcome);

  if (timeoutOutcome) {
    return {
      isSuccess: timeoutOutcome.isSuccess,
      outcome: timeoutOutcome.name,
    };
  }

  const checked = normalizedOutcomes.map((o) => o.name).join(', ');
  let errorMessage = `Action timed out after ${timeout}ms. Checked: ${checked}`;
  if (actionError) {
    errorMessage += `\n\nNOTE: The action also failed with: ${actionError.message}`;
  }
  throw new Error(errorMessage);
}

export async function detectState(params: {
  outcomes: Outcome[];
  timeout?: number;
}) {
  return attemptAction(
    async () => {},
    params.outcomes,
    {
      timeout: params.timeout ?? 5000,
    }
  );
}
