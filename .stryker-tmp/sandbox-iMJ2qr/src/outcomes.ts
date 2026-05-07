// @ts-nocheck
function stryNS_9fa48() {
  var g = typeof globalThis === 'object' && globalThis && globalThis.Math === Math && globalThis || new Function("return this")();
  var ns = g.__stryker__ || (g.__stryker__ = {});
  if (ns.activeMutant === undefined && g.process && g.process.env && g.process.env.__STRYKER_ACTIVE_MUTANT__) {
    ns.activeMutant = g.process.env.__STRYKER_ACTIVE_MUTANT__;
  }
  function retrieveNS() {
    return ns;
  }
  stryNS_9fa48 = retrieveNS;
  return retrieveNS();
}
stryNS_9fa48();
function stryCov_9fa48() {
  var ns = stryNS_9fa48();
  var cov = ns.mutantCoverage || (ns.mutantCoverage = {
    static: {},
    perTest: {}
  });
  function cover() {
    var c = cov.static;
    if (ns.currentTestId) {
      c = cov.perTest[ns.currentTestId] = cov.perTest[ns.currentTestId] || {};
    }
    var a = arguments;
    for (var i = 0; i < a.length; i++) {
      c[a[i]] = (c[a[i]] || 0) + 1;
    }
  }
  stryCov_9fa48 = cover;
  cover.apply(null, arguments);
}
function stryMutAct_9fa48(id) {
  var ns = stryNS_9fa48();
  function isActive(id) {
    if (ns.activeMutant === id) {
      if (ns.hitCount !== void 0 && ++ns.hitCount > ns.hitLimit) {
        throw new Error('Stryker: Hit count limit reached (' + ns.hitCount + ')');
      }
      return true;
    }
    return false;
  }
  stryMutAct_9fa48 = isActive;
  return isActive(id);
}
import type { Locator } from '@playwright/test';
import type { Outcome } from './attemptAction.js';
export type OutcomeOptions = {
  isSuccess?: boolean;
  onOutcome?: (winner: Locator) => Promise<any>;
};
export const Outcomes = stryMutAct_9fa48("191") ? {} : (stryCov_9fa48("191"), {
  /**
   * Defines a successful outcome based on a locator.
   */
  success(name: string, locator: Locator | (() => Promise<Locator>), options: Omit<OutcomeOptions, 'isSuccess'> = {}): Outcome {
    if (stryMutAct_9fa48("192")) {
      {}
    } else {
      stryCov_9fa48("192");
      return stryMutAct_9fa48("193") ? {} : (stryCov_9fa48("193"), {
        name,
        locator,
        isSuccess: stryMutAct_9fa48("194") ? false : (stryCov_9fa48("194"), true),
        ...options
      });
    }
  },
  /**
   * Defines a failure outcome based on a locator.
   */
  failure(name: string, locator: Locator | (() => Promise<Locator>), options: Omit<OutcomeOptions, 'isSuccess'> = {}): Outcome {
    if (stryMutAct_9fa48("195")) {
      {}
    } else {
      stryCov_9fa48("195");
      return stryMutAct_9fa48("196") ? {} : (stryCov_9fa48("196"), {
        name,
        locator,
        isSuccess: stryMutAct_9fa48("197") ? true : (stryCov_9fa48("197"), false),
        ...options
      });
    }
  },
  /**
   * Fallback for when the trigger action fails.
   */
  actionError(name: string, options: OutcomeOptions = stryMutAct_9fa48("198") ? {} : (stryCov_9fa48("198"), {
    isSuccess: stryMutAct_9fa48("199") ? true : (stryCov_9fa48("199"), false)
  })): Outcome {
    if (stryMutAct_9fa48("200")) {
      {}
    } else {
      stryCov_9fa48("200");
      return stryMutAct_9fa48("201") ? {} : (stryCov_9fa48("201"), {
        name,
        isActionErrorOutcome: stryMutAct_9fa48("202") ? false : (stryCov_9fa48("202"), true),
        isSuccess: stryMutAct_9fa48("203") ? true : (stryCov_9fa48("203"), false),
        ...options
      });
    }
  },
  /**
   * Fallback for when no other outcomes matched.
   */
  timeout(name: string, options: OutcomeOptions = stryMutAct_9fa48("204") ? {} : (stryCov_9fa48("204"), {
    isSuccess: stryMutAct_9fa48("205") ? true : (stryCov_9fa48("205"), false)
  })): Outcome {
    if (stryMutAct_9fa48("206")) {
      {}
    } else {
      stryCov_9fa48("206");
      return stryMutAct_9fa48("207") ? {} : (stryCov_9fa48("207"), {
        name,
        isTimeoutOutcome: stryMutAct_9fa48("208") ? false : (stryCov_9fa48("208"), true),
        isSuccess: stryMutAct_9fa48("209") ? true : (stryCov_9fa48("209"), false),
        ...options
      });
    }
  }
});