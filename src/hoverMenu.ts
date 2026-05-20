import type { Locator } from '@playwright/test';

export type HoverMenuOptions = {
  /** Whether to click the final item in the chain. Default: `true`. */
  click?: boolean;
  /** Timeout in ms to wait for each next item to become visible. Default: `5000`. */
  stepTimeout?: number;
  /** Pause in ms after each hover before checking visibility. Default: `100`. */
  stepDelay?: number;
  /** How many times to re-hover a step before giving up. Default: `2`. */
  retries?: number;
};

/**
 * Navigates a chain of hover-triggered menu items reliably.
 *
 * Moves between triggers using an L-shaped path that stays within the open
 * menu's bounding box, avoiding the diagonal moves that cause menus to close.
 * Each step waits for the next item to be visible before proceeding.
 *
 * @param chain - Ordered locators to hover through; the last item is the target.
 * @returns The final locator in the chain (already clicked unless `click: false`).
 */
export async function hoverMenu(chain: Locator[], options: HoverMenuOptions = {}): Promise<Locator> {
  const { click = true, stepTimeout = 5000, stepDelay = 100, retries = 2 } = options;

  if (chain.length === 0) throw new Error('hoverMenu: chain must contain at least one locator');

  const page = chain[0]!.page();

  // Activate the first item to open the initial menu
  await chain[0]!.hover();
  if (stepDelay > 0) await page.waitForTimeout(stepDelay);

  for (let i = 0; i < chain.length - 1; i++) {
    const current = chain[i]!;
    const next = chain[i + 1]!;

    // Wait for next to become visible; re-hover current if it times out
    let visible = false;
    for (let attempt = 0; attempt <= retries; attempt++) {
      if (attempt > 0) {
        await current.hover();
        if (stepDelay > 0) await page.waitForTimeout(stepDelay);
      }
      try {
        await next.waitFor({ state: 'visible', timeout: stepTimeout });
        visible = true;
        break;
      } catch {
        if (attempt === retries) break;
      }
    }

    if (!visible) {
      throw new Error(
        `hoverMenu: step ${i} → ${i + 1} failed — next item never became visible after ${retries + 1} hover attempt(s). ` +
        `Locator: ${next.toString()}`
      );
    }

    // Navigate to next via L-shaped path, then explicitly hover to ensure its submenu opens
    await _safeMove(page, current, next);
    await next.hover();
    if (stepDelay > 0) await page.waitForTimeout(stepDelay);
  }

  const last = chain[chain.length - 1]!;
  if (click) await last.click();
  return last;
}

async function _safeMove(
  page: ReturnType<Locator['page']>,
  from: Locator,
  to: Locator
): Promise<void> {
  const fromBox = await from.boundingBox();
  const toBox = await to.boundingBox();

  if (!fromBox || !toBox) return;

  const fromCx = fromBox.x + fromBox.width / 2;
  const fromCy = fromBox.y + fromBox.height / 2;
  const toCx = toBox.x + toBox.width / 2;
  const toCy = toBox.y + toBox.height / 2;

  const opensToRight = toBox.x > fromBox.x + fromBox.width / 2;

  if (opensToRight) {
    // Move horizontally first (stay in the menu row), then vertically into the submenu
    await page.mouse.move(toCx, fromCy);
    await page.mouse.move(toCx, toCy);
  } else {
    // Opens below — move vertically first, then horizontally
    await page.mouse.move(fromCx, toCy);
    await page.mouse.move(toCx, toCy);
  }
}
