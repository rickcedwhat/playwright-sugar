---
name: review-contributor-pr
description: >-
  Review contributor pull requests for playwright-sugar (API fit, philosophy,
  usefulness, developer experience). Use when asked to review a helper PR,
  assess a contributor change, or critique a new public API before merge.
---

# Review contributor PRs

Use this skill for human-style review of contributor PRs — especially new helpers.
Do **not** treat this as a substitute for CI or CodeRabbit; use it for product/API judgment.

## When to use

- Someone asks what you think of a contributor PR / new helper API
- Reviewing whether a change fits sugar before merge or feedback to the author
- Comparing a proposed API to existing helpers (`pageTag`, `relator`, `attemptAction`, …)

## Sources of truth (read these)

1. PR title, body, commits, and the actual changed source (not just the summary)
2. `README.md` — library pitch and helper framing
3. `docs/guide/helper-forms.md` — lite vs robust expectation
4. `CONTRIBUTING.md` — what belongs here
5. `ROADMAP.md` — intentional direction vs accidental scope
6. Closest existing sibling helper(s) in `src/` and `docs/api/`

## Review dimensions

Cover each dimension briefly. Lead with a one-line verdict.

### 1. API surface

- Signature, options, defaults, return type / handle
- Naming: is the export name too generic, colliding, or misleading?
- Is the surface minimal for the job, or overbuilt?
- Defaults: do they encourage the right usage in headed vs headless / CI?

### 2. Philosophy fit

Map to sugar’s stated goals:

| Goal | Questions |
|---|---|
| Small QA primitives | Drop-in? Any Playwright suite? |
| Less flakiness / less boilerplate | Does it make tests more robust, or only prettier? |
| Clearer failures / debug quality | Better errors, logs, headed visibility? |
| Lite + robust dual form | Package export only, or intended to ship as a snippet + `MANIFEST`? Flag a missing lite snippet only when the helper is intended to ship as a snippet. |
| Sibling patterns | Same family as `pageTag` (headed debug) vs `relator` / `attemptAction` (action helpers)? |

Be explicit when something fits **debug-visibility** but not **anti-flake**. Both are valid; do not pretend they are the same.

### 3. Usefulness

- When is this clearly valuable?
- When should authors still prefer native Playwright?
- Risk of encouraging an anti-pattern (e.g. fixed sleeps) via a first-class name?
- Would a reviewer / QA actually reach for this?

### 4. Developer experience (how it runs)

Walk through concrete usage:

1. What the caller writes
2. What Node/Playwright does
3. What appears in headed mode / traces / screenshots
4. Headless / CI behavior
5. Failure and edge-case contract (what may throw; what must never interfere)

Call out documented guarantees vs implementation gaps.

### 5. Delivery hygiene (contributor PRs)

Flag without blocking the product judgment:

- Tests: unit vs real-browser; do they lock the stated contract?
- Docs: API page, README, CHANGELOG, sidebar/index wiring
- Lite snippet generation / `snippets:check` if applicable
- Draft vs ready-for-review while the tip is still moving
- Merge-from-`main` fallout (lost docs entries, etc.)

## Output format

Keep it pointed:

1. **Verdict** — one or two sentences
2. **API** — signature + notable defaults
3. **Philosophy** — table or short bullets (fit / partial / miss)
4. **Usefulness** — when yes / when no
5. **How it works** — caller → runtime → what they see
6. **Review asks** (optional) — concrete questions or change requests for the author

Do not restate the whole PR description. Prefer judgment over narration.

## Tone with contributors

When drafting feedback to share with the author:

- Lead with what works
- Separate product questions from nits
- Prefer the author fix design/contract issues; maintainer may take tiny merge blockers if the author is blocked (say so clearly)
- Point at CodeRabbit findings only after verifying them against current code

## Anti-patterns for this review

- Merging because CI is green without API judgment
- Treating every headed overlay as automatically on-mission
- Ignoring missing lite form when `helper-forms.md` expects dual form
- Asking for a Vercel-style app preview for a test-helper library (prefer demo specs, traces/videos, Lab for interaction helpers)
