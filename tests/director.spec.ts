import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { Director, Playbook, Play, Outcomes, SyncStrategy } from '../src/index.js';

// ── Dataset Playbook ──────────────────────────────────────────────────────────
//
// Mirrors the example from Issue #10, adapted for the Sugar Lab UI.

type ExistsParams = { name: string; withReload?: boolean };
type CreateParams = { name: string };
type UpdateParams = { name: string; newName: string };

const datasetPb = new Playbook('DatasetPlaybook', {

  exists: ({ name, withReload = false }: ExistsParams) => new Play()
    .reload({ waitUntil: 'domcontentloaded' }, { skip: !withReload })
    .nav(async page => { await page.getByRole('button', { name: 'Datasets' }).click(); })
    .detect(page => [
      { name: 'found',    isSuccess: true,  locator: page.locator(`tr:has-text("${name}")`) },
      { name: 'notFound', isSuccess: false, locator: page.getByText('No datasets') },
    ]),

  create: ({ name }: CreateParams) => new Play()
    .nav(async page => { await page.getByRole('button', { name: 'Datasets' }).click(); })
    .detect(page => [
      { name: 'empty', isSuccess: true, locator: page.getByRole('button', { name: 'Empty dataset' }) },
      { name: 'table', isSuccess: true, locator: page.locator('[data-component="TableHeadersComponent"]') },
    ], { timeout: 8000 })
    .attempt({
      trigger: async (page, ctx) => {
        const state = ctx['state'] as { name: string } | null;
        const btnName = state?.name === 'empty' ? 'Empty dataset' : 'Dataset';
        await page.getByRole('button', { name: btnName, exact: true }).click();
        await page.getByPlaceholder('Name').fill(name, { timeout: 3000 });
        await page.getByRole('button', { name: 'Create' }).click();
      },
      outcomes: [
        Outcomes.success(page => page.getByText('This dataset is empty')),
        Outcomes.failure(page => page.locator('li[data-sonner-toast]').filter({ hasText: /Failed to/i })),
        Outcomes.timeout(10_000),
      ],
    }),

  update: ({ name, newName }: UpdateParams) => new Play()
    .nav(async page => { await page.getByRole('button', { name: 'Datasets' }).click(); })
    .prep(async page => {
      await page.locator(`tr:has-text("${name}")`).getByRole('button', { name: 'Row actions' }).click();
      await page.getByRole('menuitem', { name: 'Rename' }).click();
    })
    .attempt({
      trigger: async page => {
        // For viewer: no textbox appears (rename blocked by role check), trigger fails softly
        await page.getByRole('textbox').fill(newName, { timeout: 2000 });
        await page.getByRole('button', { name: 'Save' }).click();
      },
      outcomes: [
        Outcomes.success(page => page.getByText('Updated dataset')),
        Outcomes.failure(page => page.locator('li[data-sonner-toast]').filter({ hasText: /Failed to/i })),
        Outcomes.timeout(5000),
      ],
    })
    .cleanup(async (page, ctx) => {
      const result = ctx['result'] as { isSuccess: boolean } | null;
      if (result?.isSuccess) {
        await page.locator(`tr:has-text("${newName}")`).getByRole('button', { name: 'Row actions' }).click();
        await page.getByRole('menuitem', { name: 'Rename' }).click();
        await page.getByRole('textbox').fill(name);
        await page.getByRole('button', { name: 'Save' }).click();
        await page.getByText('Updated dataset').waitFor();
      } else {
        await page.keyboard.press('Escape');
      }
    }),
});

// ── Helpers ───────────────────────────────────────────────────────────────────

async function clearDatasets(page: Page) {
  await page.evaluate(() => localStorage.removeItem('sugar-lab-datasets'));
  await page.reload();
}

async function seedDataset(page: Page, name: string) {
  await page.evaluate((n: string) => {
    const existing = JSON.parse(localStorage.getItem('sugar-lab-datasets') || '[]');
    existing.push({ id: crypto.randomUUID(), name: n });
    localStorage.setItem('sugar-lab-datasets', JSON.stringify(existing));
  }, name);
  await page.reload();
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await clearDatasets(page);
});

// ── assertCan / assertCannot — create ────────────────────────────────────────

test('assertCan: admin creates dataset from empty state', async ({ page }) => {
  const director = new Director();
  const pb = datasetPb.withCtx({ page });

  await director.assertCan(pb, 'create', { name: 'My Dataset' });

  // Dataset detail page confirms creation
  await expect(page.getByText('This dataset is empty')).toBeVisible();
});

test('assertCan: admin creates dataset from table state (detect branches to "table")', async ({ page }) => {
  await seedDataset(page, 'Existing Dataset');

  const director = new Director();
  const pb = datasetPb.withCtx({ page });

  await director.assertCan(pb, 'create', { name: 'Second Dataset' });

  await expect(page.getByText('This dataset is empty')).toBeVisible();
});

test('assertCannot: viewer cannot create dataset', async ({ page }) => {
  await page.goto('/?role=viewer');
  await clearDatasets(page);

  const director = new Director();
  const pb = datasetPb.withCtx({ page });

  const result = await director.assertCannot(pb, 'create', { name: 'Blocked Dataset' });
  expect(result.isSuccess).toBe(false);
});

// ── assertCan / assertCannot — update ────────────────────────────────────────

test('assertCan: admin renames dataset, cleanup reverts the rename', async ({ page }) => {
  await seedDataset(page, 'Original Name');

  const director = new Director();
  const pb = datasetPb.withCtx({ page });

  await director.assertCan(pb, 'update', { name: 'Original Name', newName: 'Renamed' });

  // Cleanup reverted the rename — original name should be visible again
  await page.getByRole('button', { name: 'Datasets' }).click();
  await expect(page.locator('tr:has-text("Original Name")')).toBeVisible();
  await expect(page.locator('tr:has-text("Renamed")')).not.toBeVisible();
});

test('assertCannot: viewer cannot rename dataset, cleanup presses Escape', async ({ page }) => {
  await seedDataset(page, 'Protected Dataset');
  await page.goto('/?role=viewer');

  const director = new Director();
  const pb = datasetPb.withCtx({ page });

  const result = await director.assertCannot(pb, 'update', { name: 'Protected Dataset', newName: 'Hacked' });
  expect(result.isSuccess).toBe(false);

  // Dataset name is unchanged
  await page.getByRole('button', { name: 'Datasets' }).click();
  await expect(page.locator('tr:has-text("Protected Dataset")')).toBeVisible();
});

// ── ensureExists ──────────────────────────────────────────────────────────────

test('ensureExists creates dataset when it does not exist', async ({ page }) => {
  const director = new Director();
  const pb = datasetPb.withCtx({ page });

  await director.ensureExists(pb, { name: 'Ensure Me' });

  await page.getByRole('button', { name: 'Datasets' }).click();
  await expect(page.locator('tr:has-text("Ensure Me")')).toBeVisible();
});

test('ensureExists skips create when dataset already exists', async ({ page }) => {
  await seedDataset(page, 'Already Here');

  const director = new Director();
  const pb = datasetPb.withCtx({ page });

  await director.ensureExists(pb, { name: 'Already Here', withReload: true });

  // Still only one dataset
  const rows = page.locator('tr:has-text("Already Here")');
  await page.getByRole('button', { name: 'Datasets' }).click();
  await expect(rows).toHaveCount(1);
});

test('ensureExists with SyncStrategy.withReload() syncs to a second page', async ({ page, context }) => {
  const userPage = await context.newPage();
  await userPage.goto('/');

  const director = new Director();
  const adminPb = datasetPb.withCtx({ page });

  await director.ensureExists(adminPb, { name: 'Synced Dataset' }, {
    syncTo: userPage,
    syncStrategy: SyncStrategy.withReload(),
  });

  // Verify dataset visible on user page after sync
  await userPage.getByRole('button', { name: 'Datasets' }).click();
  await expect(userPage.locator('tr:has-text("Synced Dataset")')).toBeVisible();

  await userPage.close();
});

// ── reload skip flag ──────────────────────────────────────────────────────────

test('exists with withReload: true picks up data written after initial page load', async ({ page }) => {
  // Inject a dataset into localStorage after the page has already loaded
  // (simulating data written by another tab/context)
  await page.evaluate((n: string) => {
    localStorage.setItem('sugar-lab-datasets', JSON.stringify([{ id: '1', name: n }]));
  }, 'Late Dataset');

  const director = new Director();
  const pb = datasetPb.withCtx({ page });

  // withReload: true — page reloads, React reinitialises from localStorage, finds the dataset
  await director.ensureExists(pb, { name: 'Late Dataset', withReload: true });

  // Only 1 dataset — create was NOT run because exists returned found after reload
  const stored = await page.evaluate<{ name: string }[]>(() =>
    JSON.parse(localStorage.getItem('sugar-lab-datasets') || '[]')
  );
  expect(stored).toHaveLength(1);
  expect(stored[0]!.name).toBe('Late Dataset');
});
