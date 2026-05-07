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
import { ScrollStrategies, EndStrategies, MatchStrategies } from './strategies.js';
import type { ScrollStrategy, EndStrategy, MatchStrategy } from './strategies.js';
export interface FindByScrollingOptions {
  container?: Locator;
  maxAttempts?: number;
  waitAfterStep?: number;
  // Strategies
  scrollStrategy?: ScrollStrategy;
  endStrategy?: EndStrategy;
  matchStrategy?: MatchStrategy;
  // Deprecated / Simple Shorthands
  stepAmount?: number;
  stepAction?: () => Promise<void>;
}

/**
 * Robustly finds an element within a list by scrolling or performing actions.
 * Uses a strategy-based approach for maximum flexibility.
 */
export async function findByScrolling(target: Locator, options: FindByScrollingOptions = {}) {
  if (stryMutAct_9fa48("161")) {
    {}
  } else {
    stryCov_9fa48("161");
    const {
      container,
      maxAttempts = 50,
      waitAfterStep = 200,
      stepAmount = 600,
      stepAction
    } = options;
    const page = target.page();

    // 1. Resolve Strategies
    const scroll = stryMutAct_9fa48("164") ? options.scrollStrategy && (stepAction ? {
      name: 'Custom',
      perform: stepAction
    } : ScrollStrategies.wheel(stepAmount)) : stryMutAct_9fa48("163") ? false : stryMutAct_9fa48("162") ? true : (stryCov_9fa48("162", "163", "164"), options.scrollStrategy || (stepAction ? stryMutAct_9fa48("165") ? {} : (stryCov_9fa48("165"), {
      name: stryMutAct_9fa48("166") ? "" : (stryCov_9fa48("166"), 'Custom'),
      perform: stepAction
    }) : ScrollStrategies.wheel(stepAmount)));
    const end = stryMutAct_9fa48("169") ? options.endStrategy && EndStrategies.stuck() : stryMutAct_9fa48("168") ? false : stryMutAct_9fa48("167") ? true : (stryCov_9fa48("167", "168", "169"), options.endStrategy || EndStrategies.stuck());
    const match = stryMutAct_9fa48("172") ? options.matchStrategy && MatchStrategies.visible() : stryMutAct_9fa48("171") ? false : stryMutAct_9fa48("170") ? true : (stryCov_9fa48("170", "171", "172"), options.matchStrategy || MatchStrategies.visible());

    // 2. Setup Context
    if (stryMutAct_9fa48("174") ? false : stryMutAct_9fa48("173") ? true : (stryCov_9fa48("173", "174"), container)) {
      if (stryMutAct_9fa48("175")) {
        {}
      } else {
        stryCov_9fa48("175");
        await container.hover().catch(() => {});
      }
    } else {
      if (stryMutAct_9fa48("176")) {
        {}
      } else {
        stryCov_9fa48("176");
        const viewport = page.viewportSize();
        if (stryMutAct_9fa48("178") ? false : stryMutAct_9fa48("177") ? true : (stryCov_9fa48("177", "178"), viewport)) {
          if (stryMutAct_9fa48("179")) {
            {}
          } else {
            stryCov_9fa48("179");
            await page.mouse.move(stryMutAct_9fa48("180") ? viewport.width * 2 : (stryCov_9fa48("180"), viewport.width / 2), stryMutAct_9fa48("181") ? viewport.height * 2 : (stryCov_9fa48("181"), viewport.height / 2));
          }
        }
      }
    }

    // 3. Main Loop
    for (let i = 0; stryMutAct_9fa48("184") ? i >= maxAttempts : stryMutAct_9fa48("183") ? i <= maxAttempts : stryMutAct_9fa48("182") ? false : (stryCov_9fa48("182", "183", "184"), i < maxAttempts); stryMutAct_9fa48("185") ? i-- : (stryCov_9fa48("185"), i++)) {
      if (stryMutAct_9fa48("186")) {
        {}
      } else {
        stryCov_9fa48("186");
        // A. Check Match
        if (stryMutAct_9fa48("188") ? false : stryMutAct_9fa48("187") ? true : (stryCov_9fa48("187", "188"), await match.isMatch(target))) return target;

        // B. Check End of List
        if (stryMutAct_9fa48("190") ? false : stryMutAct_9fa48("189") ? true : (stryCov_9fa48("189", "190"), await end.isEnd(page, container, i))) break;

        // C. Perform Scroll/Step
        await scroll.perform(page, container);

        // D. Wait for render
        await page.waitForTimeout(waitAfterStep);
      }
    }

    // Final check
    return (await match.isMatch(target)) ? target : null;
  }
}