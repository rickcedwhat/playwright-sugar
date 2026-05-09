# Sugar Lab playground

The **Sugar Lab** is a small React app in the `lab/` directory. It powers the dataset flows used in [`tests/director.spec.ts`](https://github.com/rickcedwhat/playwright-sugar/blob/main/tests/director.spec.ts) — empty vs populated tables, admin vs viewer, toasts, and navigation.

Run it locally (default URL `http://localhost:5173`):

```bash
pnpm --dir lab dev
```

In another terminal, run the docs site if you want both:

```bash
pnpm docs:dev
```

Embedded panels below load the lab in an iframe. They only work when the lab is reachable — typically **same machine, lab on port 5173**. For a deployed docs build, set `VITE_LAB_ORIGIN` at build time (see the note at the end).

## Query parameters

| Parameter | Effect |
|-----------|--------|
| `clear=1` | Clear persisted datasets (`localStorage`) before the app loads. |
| `seed=<name>` | Append one dataset row (often paired with `clear=1`). |
| `role=viewer` | Read-only user: create / rename / delete show failure toasts (matches integration tests). |
| `view=settings` | Open the **Settings** screen instead of Datasets. |

`role` is read from the URL on the Datasets page, so you can change behavior without reloading storage.

---

### Empty table (branching / “not found”)

Use **`clear=1`** so the table starts empty — useful when explaining `.detect()` branches such as “no datasets” vs “row visible”.

<LabEmbed query="clear=1" />

Same URL in the address bar: `http://localhost:5173/?clear=1`

---

### Viewer role (failure toasts / `assertCannot`)

**`clear=1&role=viewer`** — empty list; try **Empty dataset** / create flows and see permission toasts, aligned with `Outcomes.failure` + soft triggers in the library.

<LabEmbed query="clear=1&role=viewer" />

---

### One seeded row (rename / row actions)

**`clear=1&seed=Demo%20Dataset`** — reproducible single row for menus and rename without manual setup.

<LabEmbed query="clear=1&seed=Demo%20Dataset" />

---

### Settings route (navigation target)

**`view=settings`** — neutral page for sidebar / navigation examples.

<LabEmbed query="view=settings" />

---

## Deployed docs and `VITE_LAB_ORIGIN`

GitHub Pages builds for this repo currently publish **docs only**. If the iframe shows “connection refused”, start the lab locally or host the lab separately and rebuild docs with:

```bash
VITE_LAB_ORIGIN=https://your-lab-host.example pnpm docs:build
```

You can add a `docs/.env.production` (gitignored locally) with that variable for repeatable builds.
