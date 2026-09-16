# Copy-paste snippets

**AUTO-GENERATED** from annotated `src/` helpers. Do not edit these files by hand.

```bash
pnpm run snippets:generate   # rewrite snippets/
pnpm run snippets:check      # fail if out of date (CI + prepublish)
```

## Markers in `src/`

| Marker | Effect on lite output |
|--------|------------------------|
| `// sugar-full-only-begin` … `// sugar-full-only-end` | Block omitted |
| `// sugar-full-only` | Next statement omitted |
| `// sugar-lite-replace: <code>` | Emits `<code>` only in the snippet |

Lite keeps the same core algorithm; robust-only logs, richer errors, and advanced options are stripped.

| Helper | Snippet | Source |
|--------|---------|--------|
| `attemptAction` / `detectState` | [`attemptAction.lite.ts`](./attemptAction.lite.ts) | `src/attemptAction.ts` |
| `verifiedFill` | [`verifiedFill.lite.ts`](./verifiedFill.lite.ts) | `src/verifiedFill.ts` |
| `clickToOpen` | [`clickToOpen.lite.ts`](./clickToOpen.lite.ts) | `src/clickToOpen.ts` |
| `relator` | [`relator.lite.ts`](./relator.lite.ts) | `src/relator.ts` |
