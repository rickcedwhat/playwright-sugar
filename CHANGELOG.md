# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed (breaking)

- **`attemptAction`** — signature is now positional: `attemptAction(action, outcomes, opts?)`. The previous single-object parameter is removed. Use `async () => {}` as the action when you only need to poll outcomes (or use **`detectPageState`**).
- **`Play.attempt`** — optional third/fourth argument is now `AttemptActionOptions` (e.g. `{ timeout: 5000 }`) instead of a bare `timeout` number, aligned with `attemptAction`.

## [0.2.0] - 2026-05-08

### Added
- `Play` — immutable chainable builder for structured test scenarios (`.nav`, `.prep`, `.reload`, `.detect`, `.attempt`, `.cleanup`).
- `Playbook` — named play-factory registry with `withCtx()` for binding page and custom context.
- `Director` — `assertCan`, `assertCannot`, `ensureExists` for RBAC testing and fixture setup.
- `SyncStrategy` — `default()`, `withReload()`, `custom(fn)` for multi-page sync in `ensureExists`.
- `Outcomes` positional API: `success(locator)`, `success(name, locator)`, `failure(...)`, `timeout(after)`, `actionError(name)`. Locator arg accepts `(page, ctx) => Locator` for access to full Playbook context.
- Sugar Lab playground app for integration testing.
- VitePress documentation site, deployed to GitHub Pages on version tags.

### Changed
- `Outcomes` DSL switched from object-config to positional API (breaking — v0.1 had no published consumers).

## [0.1.0] - 2026-05-07

### Added
- Initial release of `@rickcedwhat/playwright-sugar`.
- `attemptAction` engine for resilient branching logic.
- `Outcomes` DSL for readable test outcomes.
- `relator` for semantic ancestor-based locators.
- `verifiedFill` for high-level verification of inputs.
- `findByScrolling` with strategy-based infinite scroll support.
- `clickToOpen` for guaranteed side-effect clicks.
- Husky and GitHub Actions CI suite.
