import type { Locator } from '@playwright/test';
import { ScrollStrategies, EndStrategies, MatchStrategies } from './strategies.js';
import type { ScrollStrategy, EndStrategy, MatchStrategy } from './strategies.js';

export interface FindByScrollingOptions {
  container?: Locator;
  maxAttempts?: number;
  waitAfterStep?: number;
  // Strategies
  scrollStrategy?: ScrollStrategy;
  endStrategy?: EndStrategy;
  matchStrategy?: MatchStrategy;
  // Deprecated / Simple Shorthands
  stepAmount?: number;
  stepAction?: () => Promise<void>;
}

/**
 * Robustly finds an element within a list by scrolling or performing actions.
 * Uses a strategy-based approach for maximum flexibility.
 */
export async function findByScrolling(
  target: Locator,
  options: FindByScrollingOptions = {}
) {
  const {
    container,
    maxAttempts = 50,
    waitAfterStep = 200,
    stepAmount = 600,
    stepAction
  } = options;

  const page = target.page();

  // 1. Resolve Strategies
  const scroll = options.scrollStrategy || 
    (stepAction ? { name: 'Custom', perform: stepAction } : ScrollStrategies.wheel(stepAmount));
  
  const end = options.endStrategy || EndStrategies.stuck();
  const match = options.matchStrategy || MatchStrategies.visible();

  // 2. Setup Context
  if (container) {
    await container.hover().catch(() => {});
  } else {
    const viewport = page.viewportSize();
    if (viewport) {
      await page.mouse.move(viewport.width / 2, viewport.height / 2);
    }
  }

  // 3. Main Loop
  for (let i = 0; i < maxAttempts; i++) {
    // A. Check Match
    if (await match.isMatch(target)) return target;

    // B. Check End of List
    if (await end.isEnd(page, container, i)) break;

    // C. Perform Scroll/Step
    await scroll.perform(page, container);

    // D. Wait for render
    await page.waitForTimeout(waitAfterStep);
  }

  // Final check
  return (await match.isMatch(target)) ? target : null;
}
