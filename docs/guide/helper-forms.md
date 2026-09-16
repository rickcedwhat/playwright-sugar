# Helper forms: lite vs robust

Every helper should ideally exist in **two forms**:

1. **Robust (package)** — under `src/`, published as `@rickcedwhat/playwright-sugar`. Full behavior plus intelligent errors, debug logs, and extra options.
2. **Lite (copy-paste)** — under [`/snippets`](https://github.com/rickcedwhat/playwright-sugar/tree/main/snippets). **Generated** from the robust source by stripping `sugar-full-only` regions (`pnpm run snippets:generate`). Same core algorithm; no hand-maintained duplicate.

Start with a lite snippet when exploring. Switch to the package export when you want shared upgrades and better failure messages across a suite.

CI runs `pnpm run snippets:check` so snippets cannot drift from `src/`.
