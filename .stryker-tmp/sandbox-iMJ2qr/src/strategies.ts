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
import type { Page, Locator } from '@playwright/test';

/**
 * Strategy for how to progress through the list.
 */
export interface ScrollStrategy {
  name: string;
  perform: (page: Page, container?: Locator) => Promise<void>;
}

/**
 * Strategy for detecting when we've reached the end of the list.
 */
export interface EndStrategy {
  isEnd: (page: Page, container?: Locator, attempt?: number) => Promise<boolean>;
}

/**
 * Strategy for detecting if the current state matches what we are looking for.
 */
export interface MatchStrategy {
  isMatch: (target: Locator) => Promise<boolean>;
}

// --- BUILT-IN STRATEGIES ---

export const ScrollStrategies = stryMutAct_9fa48("225") ? {} : (stryCov_9fa48("225"), {
  /**
   * Performs a real user mouse wheel scroll. 
   * Best for virtualized lists (AG Grid, React Window).
   */
  wheel(amount: number = 600): ScrollStrategy {
    if (stryMutAct_9fa48("226")) {
      {}
    } else {
      stryCov_9fa48("226");
      return stryMutAct_9fa48("227") ? {} : (stryCov_9fa48("227"), {
        name: stryMutAct_9fa48("228") ? "" : (stryCov_9fa48("228"), 'WheelScroll'),
        perform: async page => {
          if (stryMutAct_9fa48("229")) {
            {}
          } else {
            stryCov_9fa48("229");
            await page.mouse.wheel(0, amount);
          }
        }
      });
    }
  },
  /**
   * Clicks a "Load More" or "Next" button.
   */
  click(button: Locator): ScrollStrategy {
    if (stryMutAct_9fa48("230")) {
      {}
    } else {
      stryCov_9fa48("230");
      return stryMutAct_9fa48("231") ? {} : (stryCov_9fa48("231"), {
        name: stryMutAct_9fa48("232") ? "" : (stryCov_9fa48("232"), 'ClickButton'),
        perform: async () => {
          if (stryMutAct_9fa48("233")) {
            {}
          } else {
            stryCov_9fa48("233");
            await button.click();
          }
        }
      });
    }
  }
});
export const EndStrategies = stryMutAct_9fa48("234") ? {} : (stryCov_9fa48("234"), {
  /**
   * Stops if the scroll position hasn't changed between attempts.
   */
  stuck(): EndStrategy {
    if (stryMutAct_9fa48("235")) {
      {}
    } else {
      stryCov_9fa48("235");
      let lastScrollTop = stryMutAct_9fa48("236") ? +1 : (stryCov_9fa48("236"), -1);
      return stryMutAct_9fa48("237") ? {} : (stryCov_9fa48("237"), {
        isEnd: async (_page, container, attempt) => {
          if (stryMutAct_9fa48("238")) {
            {}
          } else {
            stryCov_9fa48("238");
            if (stryMutAct_9fa48("241") ? !container && attempt === 0 : stryMutAct_9fa48("240") ? false : stryMutAct_9fa48("239") ? true : (stryCov_9fa48("239", "240", "241"), (stryMutAct_9fa48("242") ? container : (stryCov_9fa48("242"), !container)) || (stryMutAct_9fa48("244") ? attempt !== 0 : stryMutAct_9fa48("243") ? false : (stryCov_9fa48("243", "244"), attempt === 0)))) return stryMutAct_9fa48("245") ? true : (stryCov_9fa48("245"), false);
            const current = await container.evaluate(stryMutAct_9fa48("246") ? () => undefined : (stryCov_9fa48("246"), el => el.scrollTop));
            if (stryMutAct_9fa48("249") ? current !== lastScrollTop : stryMutAct_9fa48("248") ? false : stryMutAct_9fa48("247") ? true : (stryCov_9fa48("247", "248", "249"), current === lastScrollTop)) return stryMutAct_9fa48("250") ? false : (stryCov_9fa48("250"), true);
            lastScrollTop = current;
            return stryMutAct_9fa48("251") ? true : (stryCov_9fa48("251"), false);
          }
        }
      });
    }
  },
  /**
   * Stops after a fixed number of attempts.
   */
  max(limit: number): EndStrategy {
    if (stryMutAct_9fa48("252")) {
      {}
    } else {
      stryCov_9fa48("252");
      return stryMutAct_9fa48("253") ? {} : (stryCov_9fa48("253"), {
        isEnd: stryMutAct_9fa48("254") ? () => undefined : (stryCov_9fa48("254"), async (_page, _container, attempt) => stryMutAct_9fa48("258") ? (attempt || 0) < limit : stryMutAct_9fa48("257") ? (attempt || 0) > limit : stryMutAct_9fa48("256") ? false : stryMutAct_9fa48("255") ? true : (stryCov_9fa48("255", "256", "257", "258"), (stryMutAct_9fa48("261") ? attempt && 0 : stryMutAct_9fa48("260") ? false : stryMutAct_9fa48("259") ? true : (stryCov_9fa48("259", "260", "261"), attempt || 0)) >= limit))
      });
    }
  }
});
export const MatchStrategies = stryMutAct_9fa48("262") ? {} : (stryCov_9fa48("262"), {
  /**
   * Matches when the locator is visible in the viewport.
   */
  visible(): MatchStrategy {
    if (stryMutAct_9fa48("263")) {
      {}
    } else {
      stryCov_9fa48("263");
      return stryMutAct_9fa48("264") ? {} : (stryCov_9fa48("264"), {
        isMatch: stryMutAct_9fa48("265") ? () => undefined : (stryCov_9fa48("265"), async target => await target.isVisible())
      });
    }
  }
});