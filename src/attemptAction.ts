import type { Locator } from '@playwright/test';

export type AsyncLocatorFn = () => Locator | null | Promise<Locator | null>;

export type Outcome = {
  name: string;
  locator?: Locator | AsyncLocatorFn;
  isSuccess: boolean;
  isTimeoutOutcome?: boolean;
  isActionErrorOutcome?: boolean;
  onOutcome?: (winner: Locator) => Promise<unknown>;
};

/** Resolution from {@link attemptAction} / {@link detectState} — maps to {@link PlayOutcome}. */
export type AttemptResolution = {
  isSuccess: boolean;
  outcome: string;
  payload?: unknown;
  locator?: Locator;
};

/** Options for `attemptAction` / `Play.attempt` — extend with future flags without breaking the positional API. */
export type AttemptActionOptions = {
  timeout?: number;
  ambiguityBufferMs?: number;
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
    console.warn(`[attemptAction] Trigger action failed, proceeding to outcome detection. Error: ${e.message}`);
  }

  const startTime = Date.now();
  const strictModeErrorsLogged = new Set<string>();

  // Polling Phase
  const bufferMs = opts?.ambiguityBufferMs ?? 150;
  
  type Winner = { outcome: Outcome; locator: Locator };
  let firstWinner: Winner | null = null;
  const winners: Winner[] = [];

  const candidatePromises = normalizedOutcomes.map(async (o) => {
    while (Date.now() - startTime < timeout) {
      try {
        if (!o.locator) return null;
        
        let actualLocator: Locator | null = null;
        if (typeof o.locator === 'function') {
          actualLocator = await o.locator();
        } else {
          actualLocator = o.locator;
        }

        if (actualLocator && await actualLocator.isVisible()) {
          return { outcome: o, locator: actualLocator };
        }
      } catch (error: unknown) {
        const errorMsg = error instanceof Error ? error.message : '';
        const isStrictModeError =
          errorMsg.includes("strict mode violation") ||
          (errorMsg.includes("resolved to") && errorMsg.includes("elements")) ||
          errorMsg.includes("expected single element");

        if (isStrictModeError && !strictModeErrorsLogged.has(o.name)) {
          strictModeErrorsLogged.add(o.name);
          console.error(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  STRICT MODE VIOLATION DETECTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Outcome: "${o.name}"
Issue: Locator matched multiple elements
Fix: Make your locator more specific

Locator: ${o.locator?.toString() ?? 'N/A'}

Original error:
${errorMsg}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
        }
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
    let bufferTimer: NodeJS.Timeout | null = null;

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
    
    let payload: unknown | undefined = undefined;
    if (winner.outcome.onOutcome && winner.locator) {
      payload = await winner.outcome.onOutcome(winner.locator);
    }
    const resolution: AttemptResolution = {
      isSuccess: winner.outcome.isSuccess,
      outcome: winner.outcome.name,
    };
    if (payload !== undefined) resolution.payload = payload;
    if (winner.locator != null) resolution.locator = winner.locator;
    return resolution;
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

  const debugList = normalizedOutcomes
    .map(
      (o) =>
        `\n  - ${o.name}: ${o.locator ? (typeof o.locator === "function" ? "<async locator>" : o.locator.toString()) : "N/A"}`
    )
    .join("");

  let errorMessage = `Action timed out: None of the expected outcomes occurred within ${timeout}ms. \nchecked for:${debugList}`;
  if (actionError) {
    errorMessage += `\n\nNOTE: The action also failed with: ${actionError.message}`;
  }

  throw new Error(errorMessage);
}

export async function detectState(params: {
  outcomes: Outcome[];
  timeout?: number;
  ambiguityBufferMs?: number;
}) {
  return attemptAction(
    async () => {},
    params.outcomes,
    { 
      timeout: params.timeout ?? 5000,
      ...(params.ambiguityBufferMs !== undefined && { ambiguityBufferMs: params.ambiguityBufferMs })
    }
  );
}
