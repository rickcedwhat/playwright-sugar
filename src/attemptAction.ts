import type { Locator } from '@playwright/test';

export type Outcome = {
  name: string;
  locator?: Locator | (() => Promise<Locator>);
  isSuccess: boolean;
  isTimeoutOutcome?: boolean;
  isActionErrorOutcome?: boolean;
  onOutcome?: (winner: Locator) => Promise<any>;
};

/**
 * Races multiple potential outcomes against each other.
 * 
 * @param params.action - The trigger action to perform (e.g. a click)
 * @param params.outcomes - Array of possible outcomes (can be full Outcome objects or simple Locators)
 * @param params.timeout - How long to wait for an outcome (default: 30000ms)
 */
export async function attemptAction(params: {
  action?: () => Promise<void>;
  outcomes: (Outcome | Locator)[];
  timeout?: number; 
}): Promise<{ isSuccess: boolean; outcome: string; data: any }> {
  const { action, timeout = 30000 } = params;

  // Normalize outcomes
  const normalizedOutcomes: Outcome[] = params.outcomes.map((o) => {
    if ('name' in o) {
      return o as Outcome;
    }
    const locator = o as Locator;
    return {
      name: `Visible: ${locator.toString()}`,
      locator,
      isSuccess: true,
    };
  });

  // Trigger Phase: Soft Trigger implementation
  let actionError: Error | undefined;
  if (action) {
    try {
      await action();
    } catch (e: any) {
      actionError = e;
      console.warn(`[attemptAction] Trigger action failed, proceeding to outcome detection. Error: ${e.message}`);
    }
  }

  const startTime = Date.now();
  const strictModeErrorsLogged = new Set<string>();

  // Polling Phase
  while (Date.now() - startTime < timeout) {
    const results = await Promise.all(
      normalizedOutcomes.map(async (o) => {
        try {
          if (!o.locator) return { outcome: o, isVisible: false, locator: null };
          
          const locator = typeof o.locator === 'function' ? await o.locator() : o.locator;
          const isVisible = await locator.isVisible();
          return { outcome: o, isVisible, locator };
        } catch (error: any) {
          const errorMsg = error.message || "";
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

Locator: ${o.locator ? (typeof o.locator === "function" ? "<async locator>" : o.locator.toString()) : "N/A"}

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
            const locator = typeof o.locator === 'function' ? await o.locator() : o.locator;
            const isVisible = await locator.isVisible();
            return { outcome: o, isVisible, locator };
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
        
        let data = undefined;
        if (winner.outcome.onOutcome && winner.locator) {
          data = await winner.outcome.onOutcome(winner.locator);
        }
        return {
          isSuccess: winner.outcome.isSuccess,
          outcome: winner.outcome.name,
          data,
        };
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Timeout Handling
  // If action failed, we prioritize isActionErrorOutcome. 
  // Otherwise, we use isTimeoutOutcome.
  const timeoutOutcome = actionError 
    ? (normalizedOutcomes.find((o) => o.isActionErrorOutcome) || normalizedOutcomes.find((o) => o.isTimeoutOutcome))
    : normalizedOutcomes.find((o) => o.isTimeoutOutcome);

  if (timeoutOutcome) {
    const data = timeoutOutcome.onOutcome
      ? await timeoutOutcome.onOutcome(null as any)
      : undefined;
      
    return {
      isSuccess: timeoutOutcome.isSuccess,
      outcome: timeoutOutcome.name,
      data,
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
    errorMessage += `\n\nNOTE: The trigger action also failed with: ${actionError.message}`;
  }

  throw new Error(errorMessage);
}

export async function detectPageState(params: {
  outcomes: (Outcome | Locator)[];
  timeout?: number; 
}) {
  return attemptAction({
    outcomes: params.outcomes,
    timeout: params.timeout ?? 5000,
  });
}
