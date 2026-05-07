import type { Locator } from '@playwright/test';
import type { Outcome } from './attemptAction.js';

export type OutcomeOptions = {
  isSuccess?: boolean;
  onOutcome?: (winner: Locator) => Promise<any>;
};

export const Outcomes = {
  /**
   * Defines a successful outcome based on a locator.
   */
  success(
    name: string, 
    locator: Locator | (() => Promise<Locator>), 
    options: Omit<OutcomeOptions, 'isSuccess'> = {}
  ): Outcome {
    return { name, locator, isSuccess: true, ...options };
  },

  /**
   * Defines a failure outcome based on a locator.
   */
  failure(
    name: string, 
    locator: Locator | (() => Promise<Locator>), 
    options: Omit<OutcomeOptions, 'isSuccess'> = {}
  ): Outcome {
    return { name, locator, isSuccess: false, ...options };
  },

  /**
   * Fallback for when the trigger action fails.
   */
  actionError(
    name: string, 
    options: OutcomeOptions = { isSuccess: false }
  ): Outcome {
    return { name, isActionErrorOutcome: true, isSuccess: false, ...options };
  },

  /**
   * Fallback for when no other outcomes matched.
   */
  timeout(
    name: string, 
    options: OutcomeOptions = { isSuccess: false }
  ): Outcome {
    return { name, isTimeoutOutcome: true, isSuccess: false, ...options };
  }
};
