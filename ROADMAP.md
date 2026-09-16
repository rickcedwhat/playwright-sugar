# Playwright Sugar Roadmap

Sugar stays focused on **small QA helpers** with lite (copy-paste) and robust (package) forms. The playbook/RBAC framework is parked under `deprecated/playbook/` for a possible separate repo.

## Direction

- Prefer primitives QAs can drop into any Playwright suite
- Grow debug quality in package exports (errors, logs, hints) — see issue #34
- Keep untested helpers (`hoverMenu`, `pageTag`, `watchFor`, etc.) until exercised; do not delete on sight
- Publish `@rickcedwhat/playwright-sugar` to npm with a stable public surface (no Director/Play/Playbook)

## Upcoming helpers

### Passive toast cleaner (`withCleaner`)
Proactively clear known overlays before a block of code (beyond `addLocatorHandler`).

### Stability helper (`waitForStable`)
Wait until an element’s box is unchanged briefly before clicking (animation-safe).

### Network silence (`waitForSilence`)
Wait for a quiet window of network activity without full `networkidle`.

### Dual-form coverage
Finish lite snippets for remaining package helpers (`hoverMenu`, `watchFor`, `findByScrolling`, `clickToURL`, `pageTag`).

## Deferred (deprecated playbook folder)

Director collect mode, playbook visualizers, registered routines, and related RBAC tooling — see `docs/ISSUE_TRIAGE.md` and `deprecated/playbook/`. Revisit only if spinning up a separate playbook package.
