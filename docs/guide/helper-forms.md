# Helper forms: lite vs robust

Every helper should ideally exist in **two forms**:

1. **Lite (copy-paste)** — under [`/snippets`](https://github.com/rickcedwhat/playwright-sugar/tree/main/snippets). Self-contained TypeScript you can drop into any Playwright repo without adding a dependency.
2. **Robust (package)** — under `src/`, published as `@rickcedwhat/playwright-sugar`. Same idea, plus intelligent errors, debug logs, and extra options.

Start with a lite snippet when exploring. Switch to the package export when you want shared upgrades and better failure messages across a suite.
