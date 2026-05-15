import { test, expect } from '@playwright/test';
import { hoverMenu } from '../src/index.js';

// ── Shared menu fixture helpers ───────────────────────────────────────────────

// JS-driven hover menus — more reliable than CSS :hover in headless Chromium.
// Script must come AFTER the menu markup so querySelectorAll finds the elements.
const MENU_JS = `
  <script>
    document.querySelectorAll('li').forEach(li => {
      li.addEventListener('mouseenter', () => {
        const sub = li.querySelector(':scope > ul');
        if (sub) sub.style.display = 'block';
      });
      li.addEventListener('mouseleave', () => {
        const sub = li.querySelector(':scope > ul');
        if (sub) sub.style.display = '';
      });
    });
  </script>
`;

const BASE_STYLE = `
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { padding: 40px; font-family: sans-serif; }
    ul { list-style: none; }
    .menu { position: relative; display: inline-block; }
    .menu li { position: relative; }
    .menu li a {
      display: block; padding: 8px 16px; white-space: nowrap;
      background: #eee; border: 1px solid #ccc; cursor: pointer;
      user-select: none;
    }
    .submenu {
      display: none; position: absolute;
      left: 100%; top: 0;
      min-width: 160px;
    }
    .submenu-below {
      display: none; position: absolute;
      top: 100%; left: 0;
      min-width: 160px;
    }
  </style>
`;

const TWO_LEVEL_HTML = `
  ${BASE_STYLE}
  <ul class="menu">
    <li><a id="insert">Insert</a>
      <ul class="submenu">
        <li><a id="table">Table</a></li>
        <li><a id="image">Image</a></li>
      </ul>
    </li>
  </ul>
  ${MENU_JS}
`;

const THREE_LEVEL_HTML = `
  ${BASE_STYLE}
  <ul class="menu">
    <li><a id="insert">Insert</a>
      <ul class="submenu">
        <li><a id="table">Table</a>
          <ul class="submenu">
            <li><a id="cell-3x3">3×3</a></li>
            <li><a id="cell-5x5">5×5</a></li>
          </ul>
        </li>
      </ul>
    </li>
  </ul>
  ${MENU_JS}
`;

const BELOW_MENU_HTML = `
  ${BASE_STYLE}
  <ul class="menu">
    <li><a id="file">File</a>
      <ul class="submenu-below">
        <li><a id="save">Save</a></li>
        <li><a id="export">Export</a></li>
      </ul>
    </li>
  </ul>
  ${MENU_JS}
`;

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('hoverMenu()', () => {

  test('two-level: navigates and clicks the target item', async ({ page }) => {
    await page.setContent(TWO_LEVEL_HTML);

    let clicked = false;
    await page.exposeFunction('onTableClick', () => { clicked = true; });
    await page.evaluate(() => {
      document.getElementById('table')!.addEventListener('click', () => (window as any).onTableClick());
    });

    await hoverMenu([
      page.locator('#insert'),
      page.locator('#table'),
    ]);

    expect(clicked).toBe(true);
  });

  test('three-level: navigates through two submenus and clicks', async ({ page }) => {
    await page.setContent(THREE_LEVEL_HTML);

    let clicked = false;
    await page.exposeFunction('on3x3Click', () => { clicked = true; });
    await page.evaluate(() => {
      document.getElementById('cell-3x3')!.addEventListener('click', () => (window as any).on3x3Click());
    });

    await hoverMenu([
      page.locator('#insert'),
      page.locator('#table'),
      page.locator('#cell-3x3'),
    ]);

    expect(clicked).toBe(true);
  });

  test('click: false — returns final locator without clicking it', async ({ page }) => {
    await page.setContent(TWO_LEVEL_HTML);

    let clicked = false;
    await page.exposeFunction('onTableClick', () => { clicked = true; });
    await page.evaluate(() => {
      document.getElementById('table')!.addEventListener('click', () => (window as any).onTableClick());
    });

    const result = await hoverMenu([
      page.locator('#insert'),
      page.locator('#table'),
    ], { click: false });

    expect(clicked).toBe(false);
    await expect(result).toBeVisible();
  });

  test('single item chain: hovers and clicks without traversal', async ({ page }) => {
    await page.setContent(TWO_LEVEL_HTML);

    let clicked = false;
    await page.exposeFunction('onInsertClick', () => { clicked = true; });
    await page.evaluate(() => {
      document.getElementById('insert')!.addEventListener('click', () => (window as any).onInsertClick());
    });

    await hoverMenu([page.locator('#insert')]);

    expect(clicked).toBe(true);
  });

  test('submenu-below: safe-path also works when submenu opens downward', async ({ page }) => {
    await page.setContent(BELOW_MENU_HTML);

    let clicked = false;
    await page.exposeFunction('onSaveClick', () => { clicked = true; });
    await page.evaluate(() => {
      document.getElementById('save')!.addEventListener('click', () => (window as any).onSaveClick());
    });

    await hoverMenu([
      page.locator('#file'),
      page.locator('#save'),
    ]);

    expect(clicked).toBe(true);
  });

  test('returns the final locator in the chain', async ({ page }) => {
    await page.setContent(TWO_LEVEL_HTML);

    const imageLocator = page.locator('#image');
    const result = await hoverMenu([
      page.locator('#insert'),
      imageLocator,
    ], { click: false });

    // Same object reference — we return the locator passed in, not a new one
    expect(result).toBe(imageLocator);
  });

  test('throws a descriptive error when a step times out', async ({ page }) => {
    await page.setContent(TWO_LEVEL_HTML);

    await expect(
      hoverMenu([
        page.locator('#insert'),
        page.locator('#nonexistent'),
      ], { stepTimeout: 500, retries: 1 })
    ).rejects.toThrow(/hoverMenu: step 0 → 1 failed/);
  });

  test('empty chain throws immediately', async ({ page }) => {
    await page.setContent('<div></div>');

    await expect(hoverMenu([])).rejects.toThrow('hoverMenu: chain must contain at least one locator');
  });

});
