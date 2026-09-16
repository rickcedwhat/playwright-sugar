# Deprecated: Play / Playbook / Director (RBAC framework)

Parked here for future ideas — likely a separate package (e.g. `playwright-playbook`) that depends on `@rickcedwhat/playwright-sugar` primitives.

## Why it was removed from the public API

`Playwright Sugar` is pivoting to **small QA helpers**: copy-paste lite snippets plus robust package exports with better errors and logs.

`Play`, `Playbook`, and `Director` grew into an RBAC / multi-role test framework. That work is valuable, but it is not the package’s primary product surface for npm publish.

## What stays in sugar

- `attemptAction` / `detectState` / `Outcomes` — branching and soft triggers
- Interaction helpers: `relator`, `verifiedFill`, `clickToOpen`, `clickToURL`, `hoverMenu`, `watchFor`, `findByScrolling`, `pageTag`

## Using this code locally

Imports point at `../../src/*` for shared primitives. Unit tests live beside the sources. The Playwright e2e `director.spec.ts` is not part of the default `tests/` suite; run it explicitly if needed:

```bash
pnpm exec playwright test deprecated/playbook/director.spec.ts
```

## Best practices

See [PLAYBOOK_BEST_PRACTICES.md](./PLAYBOOK_BEST_PRACTICES.md).
