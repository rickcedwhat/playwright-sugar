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
import { expect } from '@playwright/test';

/**
 * Fills a field and verifies that the value actually stuck.
 * Handles cases where React/Vue state lag might cause values to revert.
 * 
 * @param locator - The field to fill
 * @param value - The value to enter
 * @param params.validate - Whether to verify the value after filling (default: true)
 * @param params.timeout - How long to wait for verification (default: 5000ms)
 */
export async function verifiedFill(locator: Locator, value: string, params: {
  validate?: boolean;
  timeout?: number;
} = {}) {
  if (stryMutAct_9fa48("266")) {
    {}
  } else {
    stryCov_9fa48("266");
    const {
      validate = stryMutAct_9fa48("267") ? false : (stryCov_9fa48("267"), true),
      timeout = 5000
    } = params;
    await locator.fill(value);

    // Blur the field to trigger any 'change' or 'blur' events that might sync state
    await locator.blur();
    if (stryMutAct_9fa48("269") ? false : stryMutAct_9fa48("268") ? true : (stryCov_9fa48("268", "269"), validate)) {
      if (stryMutAct_9fa48("270")) {
        {}
      } else {
        stryCov_9fa48("270");
        try {
          if (stryMutAct_9fa48("271")) {
            {}
          } else {
            stryCov_9fa48("271");
            await expect(locator).toHaveValue(value, stryMutAct_9fa48("272") ? {} : (stryCov_9fa48("272"), {
              timeout
            }));
          }
        } catch (e) {
          if (stryMutAct_9fa48("273")) {
            {}
          } else {
            stryCov_9fa48("273");
            // Re-try once if it failed (sometimes a single retry handles the lag)
            await locator.fill(value);
            await locator.blur();
            await expect(locator).toHaveValue(value, stryMutAct_9fa48("274") ? {} : (stryCov_9fa48("274"), {
              timeout
            }));
          }
        }
      }
    }
  }
}