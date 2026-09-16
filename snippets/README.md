# Copy-paste snippets

Lightweight, self-contained versions of sugar helpers. Drop into a test helper file in your own repo — **no package import required**.

The published package (`src/`) keeps the **robust** variants: richer errors, debug logs, and options.

| Helper | Snippet | Package export |
|--------|---------|----------------|
| `attemptAction` / `detectState` | [`attemptAction.lite.ts`](./attemptAction.lite.ts) | `src/attemptAction.ts` |
| `verifiedFill` | [`verifiedFill.lite.ts`](./verifiedFill.lite.ts) | `src/verifiedFill.ts` |
| `clickToOpen` | [`clickToOpen.lite.ts`](./clickToOpen.lite.ts) | `src/clickToOpen.ts` |
| `relator` | [`relator.lite.ts`](./relator.lite.ts) | `src/relator.ts` |

When adding a new helper, ship both forms when practical.
