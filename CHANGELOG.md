# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.0] - 2026-09-16

### Changed (breaking)

- **Public API pivot** — package exports are QA helpers only (`attemptAction`, `detectState`, `Outcomes`, `relator`, `verifiedFill`, `clickToOpen`, `clickToURL`, `findByScrolling`, `hoverMenu`, `watchFor`, `pageTag`, strategies). **`Play` / `Playbook` / `Director` / `bindPlaybooks` are removed from the published barrel** and live under `deprecated/playbook/` for a possible future package.
- Docs and roadmap updated for **lite (snippets/) + robust (src/)** helper forms; MIT `LICENSE` and npm metadata added for publish.

### Added

- **`snippets/`** — copy-paste lite variants of `attemptAction`, `verifiedFill`, `clickToOpen`, and `relator`.
- **`docs/ISSUE_TRIAGE.md`** — recommended closes/keeps after the pivot.
- **`CONTRIBUTING.md`** — short guide for adding helpers (lite + robust).

### Notes (playbook era, now deprecated)

Historical behavior still documented in `deprecated/playbook/`: `bindPlaybooks`, `Playbook.withCtx(name, ctx)`, Play third-arg outcomes, positional `attemptAction`.

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
