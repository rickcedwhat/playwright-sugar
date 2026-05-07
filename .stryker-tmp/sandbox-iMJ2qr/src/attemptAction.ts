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
}): Promise<{
  isSuccess: boolean;
  outcome: string;
  data: any;
}> {
  if (stryMutAct_9fa48("0")) {
    {}
  } else {
    stryCov_9fa48("0");
    const {
      action,
      timeout = 30000
    } = params;

    // Normalize outcomes
    const normalizedOutcomes: Outcome[] = params.outcomes.map(o => {
      if (stryMutAct_9fa48("1")) {
        {}
      } else {
        stryCov_9fa48("1");
        if (stryMutAct_9fa48("3") ? false : stryMutAct_9fa48("2") ? true : (stryCov_9fa48("2", "3"), (stryMutAct_9fa48("4") ? "" : (stryCov_9fa48("4"), 'name')) in o)) {
          if (stryMutAct_9fa48("5")) {
            {}
          } else {
            stryCov_9fa48("5");
            return o as Outcome;
          }
        }
        const locator = o as Locator;
        return stryMutAct_9fa48("6") ? {} : (stryCov_9fa48("6"), {
          name: stryMutAct_9fa48("7") ? `` : (stryCov_9fa48("7"), `Visible: ${locator.toString()}`),
          locator,
          isSuccess: stryMutAct_9fa48("8") ? false : (stryCov_9fa48("8"), true)
        });
      }
    });

    // Trigger Phase: Soft Trigger implementation
    let actionError: Error | undefined;
    if (stryMutAct_9fa48("10") ? false : stryMutAct_9fa48("9") ? true : (stryCov_9fa48("9", "10"), action)) {
      if (stryMutAct_9fa48("11")) {
        {}
      } else {
        stryCov_9fa48("11");
        try {
          if (stryMutAct_9fa48("12")) {
            {}
          } else {
            stryCov_9fa48("12");
            await action();
          }
        } catch (e: any) {
          if (stryMutAct_9fa48("13")) {
            {}
          } else {
            stryCov_9fa48("13");
            actionError = e;
            console.warn(stryMutAct_9fa48("14") ? `` : (stryCov_9fa48("14"), `[attemptAction] Trigger action failed, proceeding to outcome detection. Error: ${e.message}`));
          }
        }
      }
    }
    const startTime = Date.now();
    const strictModeErrorsLogged = new Set<string>();

    // Polling Phase
    while (stryMutAct_9fa48("17") ? Date.now() - startTime >= timeout : stryMutAct_9fa48("16") ? Date.now() - startTime <= timeout : stryMutAct_9fa48("15") ? false : (stryCov_9fa48("15", "16", "17"), (stryMutAct_9fa48("18") ? Date.now() + startTime : (stryCov_9fa48("18"), Date.now() - startTime)) < timeout)) {
      if (stryMutAct_9fa48("19")) {
        {}
      } else {
        stryCov_9fa48("19");
        const results = await Promise.all(normalizedOutcomes.map(async o => {
          if (stryMutAct_9fa48("20")) {
            {}
          } else {
            stryCov_9fa48("20");
            try {
              if (stryMutAct_9fa48("21")) {
                {}
              } else {
                stryCov_9fa48("21");
                if (stryMutAct_9fa48("24") ? false : stryMutAct_9fa48("23") ? true : stryMutAct_9fa48("22") ? o.locator : (stryCov_9fa48("22", "23", "24"), !o.locator)) return stryMutAct_9fa48("25") ? {} : (stryCov_9fa48("25"), {
                  outcome: o,
                  isVisible: stryMutAct_9fa48("26") ? true : (stryCov_9fa48("26"), false),
                  locator: null
                });
                const locator = (stryMutAct_9fa48("29") ? typeof o.locator !== 'function' : stryMutAct_9fa48("28") ? false : stryMutAct_9fa48("27") ? true : (stryCov_9fa48("27", "28", "29"), typeof o.locator === (stryMutAct_9fa48("30") ? "" : (stryCov_9fa48("30"), 'function')))) ? await o.locator() : o.locator;
                const isVisible = await locator.isVisible();
                return stryMutAct_9fa48("31") ? {} : (stryCov_9fa48("31"), {
                  outcome: o,
                  isVisible,
                  locator
                });
              }
            } catch (error: any) {
              if (stryMutAct_9fa48("32")) {
                {}
              } else {
                stryCov_9fa48("32");
                const errorMsg = stryMutAct_9fa48("35") ? error.message && "" : stryMutAct_9fa48("34") ? false : stryMutAct_9fa48("33") ? true : (stryCov_9fa48("33", "34", "35"), error.message || (stryMutAct_9fa48("36") ? "Stryker was here!" : (stryCov_9fa48("36"), "")));
                const isStrictModeError = stryMutAct_9fa48("39") ? (errorMsg.includes("strict mode violation") || errorMsg.includes("resolved to") && errorMsg.includes("elements")) && errorMsg.includes("expected single element") : stryMutAct_9fa48("38") ? false : stryMutAct_9fa48("37") ? true : (stryCov_9fa48("37", "38", "39"), (stryMutAct_9fa48("41") ? errorMsg.includes("strict mode violation") && errorMsg.includes("resolved to") && errorMsg.includes("elements") : stryMutAct_9fa48("40") ? false : (stryCov_9fa48("40", "41"), errorMsg.includes(stryMutAct_9fa48("42") ? "" : (stryCov_9fa48("42"), "strict mode violation")) || (stryMutAct_9fa48("44") ? errorMsg.includes("resolved to") || errorMsg.includes("elements") : stryMutAct_9fa48("43") ? false : (stryCov_9fa48("43", "44"), errorMsg.includes(stryMutAct_9fa48("45") ? "" : (stryCov_9fa48("45"), "resolved to")) && errorMsg.includes(stryMutAct_9fa48("46") ? "" : (stryCov_9fa48("46"), "elements")))))) || errorMsg.includes(stryMutAct_9fa48("47") ? "" : (stryCov_9fa48("47"), "expected single element")));
                if (stryMutAct_9fa48("50") ? isStrictModeError || !strictModeErrorsLogged.has(o.name) : stryMutAct_9fa48("49") ? false : stryMutAct_9fa48("48") ? true : (stryCov_9fa48("48", "49", "50"), isStrictModeError && (stryMutAct_9fa48("51") ? strictModeErrorsLogged.has(o.name) : (stryCov_9fa48("51"), !strictModeErrorsLogged.has(o.name))))) {
                  if (stryMutAct_9fa48("52")) {
                    {}
                  } else {
                    stryCov_9fa48("52");
                    strictModeErrorsLogged.add(o.name);
                    console.error(stryMutAct_9fa48("53") ? `` : (stryCov_9fa48("53"), `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  STRICT MODE VIOLATION DETECTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Outcome: "${o.name}"
Issue: Locator matched multiple elements
Fix: Make your locator more specific

Locator: ${o.locator ? (stryMutAct_9fa48("56") ? typeof o.locator !== "function" : stryMutAct_9fa48("55") ? false : stryMutAct_9fa48("54") ? true : (stryCov_9fa48("54", "55", "56"), typeof o.locator === (stryMutAct_9fa48("57") ? "" : (stryCov_9fa48("57"), "function")))) ? stryMutAct_9fa48("58") ? "" : (stryCov_9fa48("58"), "<async locator>") : o.locator.toString() : stryMutAct_9fa48("59") ? "" : (stryCov_9fa48("59"), "N/A")}

Original error:
${errorMsg}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`));
                  }
                }
                return stryMutAct_9fa48("60") ? {} : (stryCov_9fa48("60"), {
                  outcome: o,
                  isVisible: stryMutAct_9fa48("61") ? true : (stryCov_9fa48("61"), false),
                  locator: null
                });
              }
            }
          }
        }));
        const winners = stryMutAct_9fa48("62") ? results : (stryCov_9fa48("62"), results.filter(stryMutAct_9fa48("63") ? () => undefined : (stryCov_9fa48("63"), r => r.isVisible)));
        if (stryMutAct_9fa48("67") ? winners.length <= 0 : stryMutAct_9fa48("66") ? winners.length >= 0 : stryMutAct_9fa48("65") ? false : stryMutAct_9fa48("64") ? true : (stryCov_9fa48("64", "65", "66", "67"), winners.length > 0)) {
          if (stryMutAct_9fa48("68")) {
            {}
          } else {
            stryCov_9fa48("68");
            // Collision Policing
            await new Promise(stryMutAct_9fa48("69") ? () => undefined : (stryCov_9fa48("69"), resolve => setTimeout(resolve, 100)));
            const secondCheck = await Promise.all(normalizedOutcomes.map(async o => {
              if (stryMutAct_9fa48("70")) {
                {}
              } else {
                stryCov_9fa48("70");
                try {
                  if (stryMutAct_9fa48("71")) {
                    {}
                  } else {
                    stryCov_9fa48("71");
                    if (stryMutAct_9fa48("74") ? false : stryMutAct_9fa48("73") ? true : stryMutAct_9fa48("72") ? o.locator : (stryCov_9fa48("72", "73", "74"), !o.locator)) return stryMutAct_9fa48("75") ? {} : (stryCov_9fa48("75"), {
                      outcome: o,
                      isVisible: stryMutAct_9fa48("76") ? true : (stryCov_9fa48("76"), false),
                      locator: null
                    });
                    const locator = (stryMutAct_9fa48("79") ? typeof o.locator !== 'function' : stryMutAct_9fa48("78") ? false : stryMutAct_9fa48("77") ? true : (stryCov_9fa48("77", "78", "79"), typeof o.locator === (stryMutAct_9fa48("80") ? "" : (stryCov_9fa48("80"), 'function')))) ? await o.locator() : o.locator;
                    const isVisible = await locator.isVisible();
                    return stryMutAct_9fa48("81") ? {} : (stryCov_9fa48("81"), {
                      outcome: o,
                      isVisible,
                      locator
                    });
                  }
                } catch (e) {
                  if (stryMutAct_9fa48("82")) {
                    {}
                  } else {
                    stryCov_9fa48("82");
                    return stryMutAct_9fa48("83") ? {} : (stryCov_9fa48("83"), {
                      outcome: o,
                      isVisible: stryMutAct_9fa48("84") ? true : (stryCov_9fa48("84"), false),
                      locator: null
                    });
                  }
                }
              }
            }));
            const realWinners = stryMutAct_9fa48("85") ? secondCheck : (stryCov_9fa48("85"), secondCheck.filter(stryMutAct_9fa48("86") ? () => undefined : (stryCov_9fa48("86"), r => r.isVisible)));
            if (stryMutAct_9fa48("90") ? realWinners.length <= 1 : stryMutAct_9fa48("89") ? realWinners.length >= 1 : stryMutAct_9fa48("88") ? false : stryMutAct_9fa48("87") ? true : (stryCov_9fa48("87", "88", "89", "90"), realWinners.length > 1)) {
              if (stryMutAct_9fa48("91")) {
                {}
              } else {
                stryCov_9fa48("91");
                throw new Error(stryMutAct_9fa48("92") ? `` : (stryCov_9fa48("92"), `Ambiguous Page State: Multiple outcomes detected: [${realWinners.map(stryMutAct_9fa48("93") ? () => undefined : (stryCov_9fa48("93"), w => w.outcome.name)).join(stryMutAct_9fa48("94") ? "" : (stryCov_9fa48("94"), ', '))}]. Fix your locators!`));
              }
            }
            if (stryMutAct_9fa48("97") ? realWinners.length !== 1 : stryMutAct_9fa48("96") ? false : stryMutAct_9fa48("95") ? true : (stryCov_9fa48("95", "96", "97"), realWinners.length === 1)) {
              if (stryMutAct_9fa48("98")) {
                {}
              } else {
                stryCov_9fa48("98");
                const winner = realWinners[0];
                if (stryMutAct_9fa48("101") ? false : stryMutAct_9fa48("100") ? true : stryMutAct_9fa48("99") ? winner : (stryCov_9fa48("99", "100", "101"), !winner)) throw new Error(stryMutAct_9fa48("102") ? "" : (stryCov_9fa48("102"), 'Winner vanished during processing'));
                let data = undefined;
                if (stryMutAct_9fa48("105") ? winner.outcome.onOutcome || winner.locator : stryMutAct_9fa48("104") ? false : stryMutAct_9fa48("103") ? true : (stryCov_9fa48("103", "104", "105"), winner.outcome.onOutcome && winner.locator)) {
                  if (stryMutAct_9fa48("106")) {
                    {}
                  } else {
                    stryCov_9fa48("106");
                    data = await winner.outcome.onOutcome(winner.locator);
                  }
                }
                return stryMutAct_9fa48("107") ? {} : (stryCov_9fa48("107"), {
                  isSuccess: winner.outcome.isSuccess,
                  outcome: winner.outcome.name,
                  data
                });
              }
            }
          }
        }
        await new Promise(stryMutAct_9fa48("108") ? () => undefined : (stryCov_9fa48("108"), resolve => setTimeout(resolve, 100)));
      }
    }

    // Timeout Handling
    // If action failed, we prioritize isActionErrorOutcome. 
    // Otherwise, we use isTimeoutOutcome.
    const timeoutOutcome = actionError ? stryMutAct_9fa48("111") ? normalizedOutcomes.find(o => o.isActionErrorOutcome) && normalizedOutcomes.find(o => o.isTimeoutOutcome) : stryMutAct_9fa48("110") ? false : stryMutAct_9fa48("109") ? true : (stryCov_9fa48("109", "110", "111"), normalizedOutcomes.find(stryMutAct_9fa48("112") ? () => undefined : (stryCov_9fa48("112"), o => o.isActionErrorOutcome)) || normalizedOutcomes.find(stryMutAct_9fa48("113") ? () => undefined : (stryCov_9fa48("113"), o => o.isTimeoutOutcome))) : normalizedOutcomes.find(stryMutAct_9fa48("114") ? () => undefined : (stryCov_9fa48("114"), o => o.isTimeoutOutcome));
    if (stryMutAct_9fa48("116") ? false : stryMutAct_9fa48("115") ? true : (stryCov_9fa48("115", "116"), timeoutOutcome)) {
      if (stryMutAct_9fa48("117")) {
        {}
      } else {
        stryCov_9fa48("117");
        const data = timeoutOutcome.onOutcome ? await timeoutOutcome.onOutcome(null as any) : undefined;
        return stryMutAct_9fa48("118") ? {} : (stryCov_9fa48("118"), {
          isSuccess: timeoutOutcome.isSuccess,
          outcome: timeoutOutcome.name,
          data
        });
      }
    }
    const debugList = normalizedOutcomes.map(stryMutAct_9fa48("119") ? () => undefined : (stryCov_9fa48("119"), o => stryMutAct_9fa48("120") ? `` : (stryCov_9fa48("120"), `\n  - ${o.name}: ${o.locator ? (stryMutAct_9fa48("123") ? typeof o.locator !== "function" : stryMutAct_9fa48("122") ? false : stryMutAct_9fa48("121") ? true : (stryCov_9fa48("121", "122", "123"), typeof o.locator === (stryMutAct_9fa48("124") ? "" : (stryCov_9fa48("124"), "function")))) ? stryMutAct_9fa48("125") ? "" : (stryCov_9fa48("125"), "<async locator>") : o.locator.toString() : stryMutAct_9fa48("126") ? "" : (stryCov_9fa48("126"), "N/A")}`))).join(stryMutAct_9fa48("127") ? "Stryker was here!" : (stryCov_9fa48("127"), ""));
    let errorMessage = stryMutAct_9fa48("128") ? `` : (stryCov_9fa48("128"), `Action timed out: None of the expected outcomes occurred within ${timeout}ms. \nchecked for:${debugList}`);
    if (stryMutAct_9fa48("130") ? false : stryMutAct_9fa48("129") ? true : (stryCov_9fa48("129", "130"), actionError)) {
      if (stryMutAct_9fa48("131")) {
        {}
      } else {
        stryCov_9fa48("131");
        errorMessage += stryMutAct_9fa48("132") ? `` : (stryCov_9fa48("132"), `\n\nNOTE: The trigger action also failed with: ${actionError.message}`);
      }
    }
    throw new Error(errorMessage);
  }
}
export async function detectPageState(params: {
  outcomes: (Outcome | Locator)[];
  timeout?: number;
}) {
  if (stryMutAct_9fa48("133")) {
    {}
  } else {
    stryCov_9fa48("133");
    return attemptAction(stryMutAct_9fa48("134") ? {} : (stryCov_9fa48("134"), {
      outcomes: params.outcomes,
      timeout: stryMutAct_9fa48("135") ? params.timeout && 5000 : (stryCov_9fa48("135"), params.timeout ?? 5000)
    }));
  }
}