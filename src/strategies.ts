import type { Page, Locator } from '@playwright/test';

/**
 * Strategy for how to progress through the list.
 */
export interface ScrollStrategy {
  name: string;
  perform: (page: Page, container?: Locator) => Promise<void>;
}

/**
 * Strategy for detecting when we've reached the end of the list.
 */
export interface EndStrategy {
  isEnd: (page: Page, container?: Locator, attempt?: number) => Promise<boolean>;
}

/**
 * Strategy for detecting if the current state matches what we are looking for.
 */
export interface MatchStrategy {
  isMatch: (target: Locator) => Promise<boolean>;
}

// --- BUILT-IN STRATEGIES ---

export const ScrollStrategies = {
  /**
   * Performs a real user mouse wheel scroll. 
   * Best for virtualized lists (AG Grid, React Window).
   */
  wheel(amount: number = 600): ScrollStrategy {
    return {
      name: 'WheelScroll',
      perform: async (page) => {
        await page.mouse.wheel(0, amount);
      }
    };
  },

  /**
   * Clicks a "Load More" or "Next" button.
   */
  click(button: Locator): ScrollStrategy {
    return {
      name: 'ClickButton',
      perform: async () => {
        await button.click();
      }
    };
  }
};

export const EndStrategies = {
  /**
   * Stops if the scroll position hasn't changed between attempts.
   */
  stuck(): EndStrategy {
    let lastScrollTop = -1;
    return {
      isEnd: async (_page, container, attempt) => {
        if (!container || attempt === 0) return false;
        const current = await container.evaluate((el) => el.scrollTop);
        if (current === lastScrollTop) return true;
        lastScrollTop = current;
        return false;
      }
    };
  },

  /**
   * Stops after a fixed number of attempts.
   */
  max(limit: number): EndStrategy {
    return {
      isEnd: async (_page, _container, attempt) => (attempt || 0) >= limit
    };
  }
};

export const MatchStrategies = {
  /**
   * Matches when the locator is visible in the viewport.
   */
  visible(): MatchStrategy {
    return {
      isMatch: async (target) => await target.isVisible()
    };
  }
};
