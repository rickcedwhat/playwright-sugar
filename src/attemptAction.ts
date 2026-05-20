import type { Locator } from '@playwright/test';

export type Outcome = {
  name: string;
  locator?: Locator;
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
  while (Date.now() - startTime < timeout) {
    const results = await Promise.all(
      normalizedOutcomes.map(async (o) => {
        try {
          if (!o.locator) return { outcome: o, isVisible: false, locator: null };
          
          const isVisible = await o.locator.isVisible();
          return { outcome: o, isVisible, locator: o.locator };
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
          return { outcome: o, isVisible: false, locator: null };
        }
      })
    );

    const winners = results.filter((r) => r.isVisible);

    if (winners.length > 0) {
      // Collision Policing
      await new Promise((resolve) => setTimeout(resolve, 100));

      const secondCheck = await Promise.all(
        normalizedOutcomes.map(async (o) => {
          try {
            if (!o.locator) return { outcome: o, isVisible: false, locator: null };
            const isVisible = await o.locator.isVisible();
            return { outcome: o, isVisible, locator: o.locator };
          } catch (e) {
            return { outcome: o, isVisible: false, locator: null };
          }
        })
      );

      const realWinners = secondCheck.filter((r) => r.isVisible);

      if (realWinners.length > 1) {
        throw new Error(
          `Ambiguous Page State: Multiple outcomes detected: [${realWinners
            .map((w) => w.outcome.name)
            .join(', ')}]. Fix your locators!`
        );
      }

      if (realWinners.length === 1) {
        const winner = realWinners[0];
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
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
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
}) {
  return attemptAction(
    async () => {},
    params.outcomes,
    { timeout: params.timeout ?? 5000 }
  );
}
