import type { Locator } from '@playwright/test';

// sugar-full-only-begin
export type AsyncLocatorFn = () => Locator | null | Promise<Locator | null>;
// sugar-full-only-end

export type Outcome = {
  name: string;
  // sugar-full-only-begin
  locator?: Locator | AsyncLocatorFn;
  // sugar-full-only-end
  // sugar-lite-replace: locator?: Locator;
  isSuccess: boolean;
  isTimeoutOutcome?: boolean;
  isActionErrorOutcome?: boolean;
  // sugar-full-only-begin
  onOutcome?: (winner: Locator) => Promise<unknown>;
  // sugar-full-only-end
};

/** Resolution from {@link attemptAction} / {@link detectState}. */
export type AttemptResolution = {
  isSuccess: boolean;
  outcome: string;
  // sugar-full-only-begin
  payload?: unknown;
  // sugar-full-only-end
  locator?: Locator;
};

/** Options for `attemptAction` — extend with future flags without breaking the positional API. */
export type AttemptActionOptions = {
  timeout?: number;
  // sugar-full-only-begin
  ambiguityBufferMs?: number;
  // sugar-full-only-end
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
    // sugar-full-only
    console.warn(`[attemptAction] Trigger action failed, proceeding to outcome detection. Error: ${e.message}`);
  }

  const startTime = Date.now();
  // sugar-full-only-begin
  const strictModeErrorsLogged = new Set<string>();
  // sugar-full-only-end

  // Polling Phase
  // sugar-full-only-begin
  const bufferMs = opts?.ambiguityBufferMs ?? 150;
  // sugar-full-only-end
  // sugar-lite-replace: const bufferMs = 150;

  type Winner = { outcome: Outcome; locator: Locator };
  let firstWinner: Winner | null = null;
  const winners: Winner[] = [];

  const candidatePromises = normalizedOutcomes.map(async (o) => {
    while (Date.now() - startTime < timeout) {
      try {
        if (!o.locator) return null;

        let actualLocator: Locator | null = null;
        // sugar-full-only-begin
        if (typeof o.locator === 'function') {
          actualLocator = await o.locator();
        } else {
          actualLocator = o.locator;
        }
        // sugar-full-only-end
        // sugar-lite-replace: actualLocator = o.locator;

        if (actualLocator && await actualLocator.isVisible()) {
          return { outcome: o, locator: actualLocator };
        }
      } catch (error: unknown) {
        // sugar-full-only-begin
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
        // sugar-full-only-end
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

    // sugar-full-only-begin
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
    // sugar-full-only-end
    // sugar-lite-replace: return {
    // sugar-lite-replace:   isSuccess: winner.outcome.isSuccess,
    // sugar-lite-replace:   outcome: winner.outcome.name,
    // sugar-lite-replace:   locator: winner.locator,
    // sugar-lite-replace: };
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

  // sugar-full-only-begin
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
  // sugar-full-only-end
  // sugar-lite-replace: const checked = normalizedOutcomes.map((o) => o.name).join(', ');
  // sugar-lite-replace: let errorMessage = `Action timed out after ${timeout}ms. Checked: ${checked}`;
  // sugar-lite-replace: if (actionError) {
  // sugar-lite-replace:   errorMessage += `\n\nNOTE: The action also failed with: ${actionError.message}`;
  // sugar-lite-replace: }
  // sugar-lite-replace: throw new Error(errorMessage);
}

export async function detectState(params: {
  outcomes: Outcome[];
  timeout?: number;
  // sugar-full-only-begin
  ambiguityBufferMs?: number;
  // sugar-full-only-end
}) {
  return attemptAction(
    async () => {},
    params.outcomes,
    {
      timeout: params.timeout ?? 5000,
      // sugar-full-only-begin
      ...(params.ambiguityBufferMs !== undefined && { ambiguityBufferMs: params.ambiguityBufferMs })
      // sugar-full-only-end
    }
  );
}
