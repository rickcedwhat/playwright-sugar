# Sugar Lab playground

Start here:

```bash
pnpm --dir lab install
pnpm --dir lab dev
```

Then, in another terminal:

```bash
pnpm docs:dev
```

Use the sandbox below to map UI behavior to real test commands in `tests/director.spec.ts`.

## Run-this-test sandbox

Pick a page context (`adminPage`/`userPage`) and operation (`create`/`update`/`delete`):

<RunTestSandbox />

## Notes

- `Run this test` copies the exact command to your clipboard; paste it in a terminal.
- The iframe uses local lab data presets (`clear`, `seed`, `role`) so each mode is reproducible.

## Deployed docs and `VITE_LAB_ORIGIN`

GitHub Pages builds publish docs only. If iframe content is unavailable remotely, host the lab separately and build docs with:

```bash
VITE_LAB_ORIGIN=https://your-lab-host.example pnpm docs:build
```
