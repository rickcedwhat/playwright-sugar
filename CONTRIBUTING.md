# Contributing

Thanks for helping — especially if you are adding one or two focused helpers.

## What belongs here

- Small Playwright utilities that make QA work easier
- Prefer **two forms** when adding a helper:
  1. Robust implementation under `src/` with clear errors / debug logs
  2. Annotate robust-only bits with `sugar-full-only` / `sugar-lite-replace` markers (see `snippets/README.md`)
  3. Run `pnpm run snippets:generate` and commit the updated `snippets/*.lite.ts`
- Re-export from `src/index.ts`
- Add a short API note under `docs/api/` when the helper is ready for docs
- Register the helper in `scripts/generate-snippets.mjs` `MANIFEST` if it should ship a lite snippet

## What does not belong in the published API

`Play` / `Playbook` / `Director` live in `deprecated/playbook/` only. Do not re-export them from `src/index.ts` unless we intentionally revive a separate playbook package.

## Checks

```bash
pnpm install
pnpm run test:unit
pnpm run build
pnpm exec tsc --noEmit
```

Use conventional commits (`feat:`, `fix:`, `docs:`, …).
