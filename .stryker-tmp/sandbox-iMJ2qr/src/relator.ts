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
import type { Locator, Page } from '@playwright/test';

/**
 * Semantic Relative Locator
 * Finds a target locator that is semantically related to an anchor locator.
 * 
 * @param anchor - The unique reference element (e.g. text for a specific row)
 * @param target - The element you want to find (e.g. a generic button)
 * @param container - Optional: A selector or locator to limit the search (e.g. 'tr' or '.card')
 */
export function relator(anchor: Locator, target: Locator, container?: string | Locator): Locator {
  if (stryMutAct_9fa48("210")) {
    {}
  } else {
    stryCov_9fa48("210");
    const page = anchor.page();
    if (stryMutAct_9fa48("212") ? false : stryMutAct_9fa48("211") ? true : (stryCov_9fa48("211", "212"), container)) {
      if (stryMutAct_9fa48("213")) {
        {}
      } else {
        stryCov_9fa48("213");
        const containerLocator = (stryMutAct_9fa48("216") ? typeof container !== 'string' : stryMutAct_9fa48("215") ? false : stryMutAct_9fa48("214") ? true : (stryCov_9fa48("214", "215", "216"), typeof container === (stryMutAct_9fa48("217") ? "" : (stryCov_9fa48("217"), 'string')))) ? page.locator(container) : container;
        return stryMutAct_9fa48("218") ? containerLocator.last().locator(target) : (stryCov_9fa48("218"), containerLocator.filter(stryMutAct_9fa48("219") ? {} : (stryCov_9fa48("219"), {
          has: anchor
        })).last().locator(target));
      }
    }

    // Automatic mode: Finds the innermost element containing BOTH
    return stryMutAct_9fa48("221") ? page.locator('*').filter({
      has: target
    }).last().locator(target) : stryMutAct_9fa48("220") ? page.locator('*').filter({
      has: anchor
    }).last().locator(target) : (stryCov_9fa48("220", "221"), page.locator(stryMutAct_9fa48("222") ? "" : (stryCov_9fa48("222"), '*')).filter(stryMutAct_9fa48("223") ? {} : (stryCov_9fa48("223"), {
      has: anchor
    })).filter(stryMutAct_9fa48("224") ? {} : (stryCov_9fa48("224"), {
      has: target
    })).last().locator(target));
  }
}