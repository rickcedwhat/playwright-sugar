/**
 * Visual spike — run headed and switch between the tabs manually.
 * Each page gets one tag so you can tell at a glance which tab you're on.
 *
 *   npx playwright test tests/pageTag.visual.spec.ts --headed --project=chromium
 */
import { test } from '@playwright/test';
import { pageTag, PageTag } from '../src/index.js';

// Simulate POM-style label generators
const adminLabel  = PageTag.labelFor('Admin');
const viewerLabel = PageTag.labelFor('Viewer');

test.use({
  video: 'on',
  trace: 'on',
  launchOptions: { slowMo: 400 },
});

test('one tag per page — switch tabs to see each one', async ({ page, context }) => {
  PageTag.reset();

  const adminPage  = page;
  const viewerPage = await context.newPage();
  const guestPage  = await context.newPage();

  await Promise.all([
    adminPage.goto('/'),
    viewerPage.goto('/'),
    guestPage.goto('/'),
  ]);

  // Each page gets one tag — label + auto color from palette
  await pageTag(adminPage,  { type: 'bar',  label: adminLabel.next() });   // "Admin 1"
  await pageTag(viewerPage, { type: 'bar',  label: viewerLabel.next() }); // "Viewer 1"
  await pageTag(guestPage,  { type: 'chip', placement: 'top-right' });    // auto label + color

  // Hold open so you can click between tabs and see the tags
  await page.waitForTimeout(15_000);
});
