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
import { expect } from '@playwright/test';
import type { Locator } from '@playwright/test';

/**
 * Guaranteed Side-Effect Click
 * Retries the click if the target element doesn't appear.
 */
export async function clickToOpen(trigger: Locator, target: Locator, options: {
  maxRetries?: number;
  timeout?: number;
  subTimeout?: number;
} = {}): Promise<void> {
  if (stryMutAct_9fa48("136")) {
    {}
  } else {
    stryCov_9fa48("136");
    const {
      maxRetries = 3,
      timeout = 30000,
      subTimeout = 2000
    } = options;
    const startTime = Date.now();
    for (let i = 0; stryMutAct_9fa48("139") ? i > maxRetries : stryMutAct_9fa48("138") ? i < maxRetries : stryMutAct_9fa48("137") ? false : (stryCov_9fa48("137", "138", "139"), i <= maxRetries); stryMutAct_9fa48("140") ? i-- : (stryCov_9fa48("140"), i++)) {
      if (stryMutAct_9fa48("141")) {
        {}
      } else {
        stryCov_9fa48("141");
        try {
          if (stryMutAct_9fa48("142")) {
            {}
          } else {
            stryCov_9fa48("142");
            await trigger.click();

            // Wait for target with a short sub-timeout
            await target.waitFor(stryMutAct_9fa48("143") ? {} : (stryCov_9fa48("143"), {
              state: stryMutAct_9fa48("144") ? "" : (stryCov_9fa48("144"), 'visible'),
              timeout: subTimeout
            }));
            return; // Success
          }
        } catch (e) {
          if (stryMutAct_9fa48("145")) {
            {}
          } else {
            stryCov_9fa48("145");
            if (stryMutAct_9fa48("149") ? Date.now() - startTime <= timeout : stryMutAct_9fa48("148") ? Date.now() - startTime >= timeout : stryMutAct_9fa48("147") ? false : stryMutAct_9fa48("146") ? true : (stryCov_9fa48("146", "147", "148", "149"), (stryMutAct_9fa48("150") ? Date.now() + startTime : (stryCov_9fa48("150"), Date.now() - startTime)) > timeout)) {
              if (stryMutAct_9fa48("151")) {
                {}
              } else {
                stryCov_9fa48("151");
                throw new Error(stryMutAct_9fa48("152") ? `` : (stryCov_9fa48("152"), `clickToOpen timed out after ${timeout}ms. Target never appeared.`));
              }
            }
            if (stryMutAct_9fa48("155") ? i !== maxRetries : stryMutAct_9fa48("154") ? false : stryMutAct_9fa48("153") ? true : (stryCov_9fa48("153", "154", "155"), i === maxRetries)) {
              if (stryMutAct_9fa48("156")) {
                {}
              } else {
                stryCov_9fa48("156");
                throw new Error(stryMutAct_9fa48("157") ? `` : (stryCov_9fa48("157"), `clickToOpen failed after ${maxRetries} retries. Target never appeared.`));
              }
            }
            console.log(stryMutAct_9fa48("158") ? `` : (stryCov_9fa48("158"), `clickToOpen: Target not visible after click (attempt ${stryMutAct_9fa48("159") ? i - 1 : (stryCov_9fa48("159"), i + 1)}). Retrying in 100ms...`));
            await new Promise(stryMutAct_9fa48("160") ? () => undefined : (stryCov_9fa48("160"), resolve => setTimeout(resolve, 100)));
          }
        }
      }
    }
  }
}