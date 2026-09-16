# Issue triage (pivot: QA helpers)

GitHub issues were written when the repo leaned toward an RBAC playbook framework. This triage matches the current direction: **published sugar = small helpers**; **Play/Playbook/Director = deprecated** (future optional package).

## Close as done / superseded

| Issue | Action | Reason |
|-------|--------|--------|
| [#55](https://github.com/rickcedwhat/playwright-sugar/issues/55) | **Close** | Done: RBAC framework removed from public barrel; sources in `deprecated/playbook/` |
| [#38](https://github.com/rickcedwhat/playwright-sugar/issues/38) | **Close** | Shipped as `pageTag` |
| [#9](https://github.com/rickcedwhat/playwright-sugar/issues/9) | **Close** | Shipped as `clickToURL` |
| [#37](https://github.com/rickcedwhat/playwright-sugar/issues/37) | **Close** | Sugar Lab / docs embeds exist |

## Keep open (helpers / package quality)

| Issue | Notes |
|-------|--------|
| [#34](https://github.com/rickcedwhat/playwright-sugar/issues/34) | Logging / debug hints — core to robust forms |
| [#8](https://github.com/rickcedwhat/playwright-sugar/issues/8) | `waitForStable` |
| [#60](https://github.com/rickcedwhat/playwright-sugar/issues/60) | `clickForResponse` |
| [#58](https://github.com/rickcedwhat/playwright-sugar/issues/58) | `clickFor` / `clickMenu` |
| [#56](https://github.com/rickcedwhat/playwright-sugar/issues/56) | Playground coverage for untried helpers |
| [#43](https://github.com/rickcedwhat/playwright-sugar/issues/43) | Flake registry (optional; still helper-shaped) |
| [#40](https://github.com/rickcedwhat/playwright-sugar/issues/40) | `sortTo()` |
| [#32](https://github.com/rickcedwhat/playwright-sugar/issues/32) | Cross-pollination from smart-table |

## Park / close as deferred (playbook framework)

Label or close with comment pointing at `deprecated/playbook/`. Do not block npm publish.

| Issues | Theme |
|--------|--------|
| #20, #21, #42, #44, #45, #47–#53 | Playbook/Director enhancements, visualizers, RBAC collect mode |
| #48 / #50 duplicates | Live state detection logger |

## Suggested new issues

1. **npm publish checklist** — peerDeps, README, dual-form docs, first tagged release
2. **Lite snippets for remaining helpers** — parity with package exports
3. **Collaborator onboarding** — short CONTRIBUTING for adding a helper (lite + robust)

If you have write access, apply closes/comments from this table; CI tokens may be read-only for issues.
