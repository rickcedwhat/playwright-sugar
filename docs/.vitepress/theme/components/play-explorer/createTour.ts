/** Step-through tour for DatasetPlaybook `create` mirroring tests/director.spec.ts */

export type RoleChoice = 'admin' | 'viewer';

export type PlayChoice = 'create';

export type DetectChoice = 'empty' | 'table';

export type OutcomeChoice = 'success' | 'failure' | 'timeout';

export const CREATE_PHASES = ['overview', 'nav', 'detect', 'attempt', 'outcomes', 'director'] as const;

export type CreatePhaseId = (typeof CREATE_PHASES)[number];

export interface ExplorerChoices {
  play: PlayChoice;
  role: RoleChoice;
  detect: DetectChoice | null;
  outcome: OutcomeChoice | null;
}

/** Layout follows Prettier-style breaks (≈printWidth 80) for readable wrapping in the explorer. */
export const CREATE_PLAY_BOOK_EXCERPT = `create: ({ name }: CreateParams) =>
  new Play()
    .nav(async (page) => {
      await page.getByRole('button', { name: 'Datasets' }).click();
    })
    .detect(
      (page) => [
        {
          name: 'empty',
          isSuccess: true,
          locator: page.getByRole('button', { name: 'Empty dataset' }),
        },
        {
          name: 'table',
          isSuccess: true,
          locator: page.locator('[data-component="TableHeadersComponent"]'),
        },
      ],
      { timeout: 8000 },
    )
    .attempt(
      async (page, ctx) => {
        const state = ctx['state'] as { name: string } | null;
        const btnName = state?.name === 'empty' ? 'Empty dataset' : 'Dataset';
        await page
          .getByRole('button', { name: btnName, exact: true })
          .click();
        await page.getByPlaceholder('Name').fill(name, { timeout: 3000 });
        await page.getByRole('button', { name: 'Create' }).click();
      },
      [
        Outcomes.success((page) => page.getByText('This dataset is empty')),
        Outcomes.failure((page) =>
          page
            .locator('li[data-sonner-toast]')
            .filter({ hasText: /Failed to/i }),
        ),
        Outcomes.timeout(3_000),
      ],
    ),`;

const DIRECTOR_ADMIN = `const director = new Director();
const pb = datasetPb.withCtx({ page });
await director.assertCan(pb, 'create', { name: 'My Dataset' });`;

const DIRECTOR_VIEWER = `await page.goto('/?role=viewer');
await clearDatasets(page);

const director = new Director();
const pb = datasetPb.withCtx({ page });

const result = await director.assertCannot(pb, 'create', { name: 'Blocked Dataset' });
expect(result.isSuccess).toBe(false);`;

export function playbookLines(): string[] {
  return CREATE_PLAY_BOOK_EXCERPT.split('\n');
}

export function phaseTitles(phase: CreatePhaseId): { title: string; hint: string } {
  switch (phase) {
    case 'overview':
      return {
        title: 'Overview',
        hint: 'The code block stays in collapsed overview form; the mock starts on Home. Use the flow chart to branch and hover nodes to peek at the real lines.',
      };
    case 'nav':
      return {
        title: 'Navigate to Datasets',
        hint: `Clicks the “Datasets” entry in the Sugar Lab.`,
      };
    case 'detect':
      return {
        title: 'Detect the two winning list shapes',
        hint: '`empty` vs `table` was chosen up front — the mock shows the winning list shape while this step explains `.detect`.',
      };
    case 'attempt':
      return {
        title: 'Click path + modal fills',
        hint: '`ctx.state.name` selects which launcher button matches the detect branch.',
      };
    case 'outcomes':
      return {
        title: 'Success, failure, and timeout locators',
        hint: 'The mock shows the real locator for your pick: success headline, failure toast, or a 3s timeout wait. `Outcomes.timeout(3_000)` wins if neither beats it.',
      };
    case 'director':
      return {
        title: 'Seal the playbook with Director',
        hint: '`assertCan` validates privileged runs; preload viewer URL for `assertCannot`.',
      };
    default:
      return { title: String(phase), hint: '' };
  }
}

/** Short bullets for the step panel (right column). */
export function phaseBullets(phase: CreatePhaseId): string[] {
  switch (phase) {
    case 'overview':
      return [
        'A Play chains acts: navigation, branching detect, resilient attempt, then Director assertions.',
        'The illustrative shell starts on Home; the next step is the `.nav` hop into Datasets.',
        'The flow chart under the snippet mirrors the play — grey branches are inactive until you hover or click.',
      ];
    case 'nav':
      return [
        'Mirrors page.getByRole("button", { name: "Datasets" }) — the sidebar affordance in Sugar Lab.',
        'From Home, this step lands you on the Datasets surface before `.detect` branches.',
      ];
    case 'detect':
      return [
        'Two locators can both be success — whichever appears first wins and seeds ctx.state.',
        'Your detect branch was set before the tour; the mock already reflects empty vs table.',
      ];
    case 'attempt':
      return [
        'ctx.state?.name chooses between the lone Empty dataset CTA and the inline Dataset button.',
        'The modal fill + submit mirrors the real Playwright calls in tests/director.spec.ts.',
      ];
    case 'outcomes':
      return [
        'Outcomes.success watches for the detail headline; Outcomes.failure watches Sonner toasts; timeout races for 3s with no match.',
        'The mock mounts the locator you chose on the flow chart so you can see what Playwright would wait for.',
      ];
    case 'director':
      return [
        'Director binds page via withCtx, then assertCan / assertCannot encode RBAC expectations.',
        'The snippet appends the exact assertion block used in the spec file.',
      ];
    default:
      return [];
  }
}

/**
 * Non-overlapping ranges covering the static `create` excerpt (lines 1…40).
 * When a step highlights elsewhere, inactive lines collapse to the first line of each range.
 */
export const PLAYBOOK_COLLAPSE: readonly { readonly start: number; readonly end: number; readonly label: string }[] = [
  { start: 1, end: 2, label: 'create({ name }: CreateParams) => new Play()  …' },
  { start: 3, end: 5, label: '  .nav(async (page) => { · · · })' },
  { start: 6, end: 20, label: '  .detect( · · · )' },
  { start: 21, end: 21, label: '  .attempt(' },
  { start: 22, end: 30, label: '    async (page, ctx) => { · · · }' },
  { start: 31, end: 39, label: '    [ Outcomes.success | .failure | .timeout ]' },
  { start: 40, end: 40, label: '  ),' },
];

export type LineVisual =
  | { kind: 'full' }
  | { kind: 'collapsed'; label: string }
  | { kind: 'hidden' };

/** How to render one 1-based line when focus mode is on (`highlight` non-null). */
export function getLineVisual(
  lineNumber1: number,
  highlight: readonly [number, number],
  playbookLineCount: number,
  totalLines: number
): LineVisual {
  const [h0, h1] = highlight;
  if (lineNumber1 >= h0 && lineNumber1 <= h1) return { kind: 'full' };

  const past = playbookLineCount;
  if (totalLines > past && lineNumber1 > past && lineNumber1 <= past + 4) {
    if (lineNumber1 === past + 1)
      return { kind: 'collapsed', label: '  // ─· from tests/director.spec.ts ·─' };
    return { kind: 'hidden' };
  }

  if (lineNumber1 <= past) {
    for (const r of PLAYBOOK_COLLAPSE) {
      if (lineNumber1 < r.start || lineNumber1 > r.end) continue;
      if (lineNumber1 === r.start) return { kind: 'collapsed', label: r.label };
      return { kind: 'hidden' };
    }
  }

  return { kind: 'full' };
}

function highlightPlaybook(phase: CreatePhaseId): readonly [number, number] | null {
  switch (phase) {
    case 'overview':
      return null;
    case 'nav':
      return [3, 5];
    case 'detect':
      return [6, 20];
    case 'attempt':
      return [22, 30];
    case 'outcomes':
      return [31, 39];
    default:
      return null;
  }
}

export function getCombinedSourceAndHighlight(
  phase: CreatePhaseId,
  choices: ExplorerChoices
): { lines: string[]; highlight: readonly [number, number] | null } {
  const pb = playbookLines();

  if (phase === 'director') {
    const divider = ['', '─'.repeat(28), 'From tests/director.spec.ts:', ''];
    const dirBlob = choices.role === 'viewer' ? DIRECTOR_VIEWER : DIRECTOR_ADMIN;
    const dirLines = dirBlob.split('\n');
    const lines = [...pb, ...divider, ...dirLines];
    const offset = pb.length + divider.length;
    return { lines, highlight: [offset + 1, offset + dirLines.length] };
  }

  return { lines: [...pb], highlight: highlightPlaybook(phase) };
}

export function adminCannotDemoFailure(role: RoleChoice): boolean {
  return role === 'admin';
}

export function viewerCannotReachSuccess(role: RoleChoice): boolean {
  return role === 'viewer';
}

export const OUTCOME_BRANCHES: readonly OutcomeChoice[] = ['success', 'failure', 'timeout'];
