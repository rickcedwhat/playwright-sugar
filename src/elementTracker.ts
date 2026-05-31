import type { Locator, Page } from '@playwright/test';

/**
 * Tracks which DOM elements have already been processed, using a browser-side WeakMap.
 * Works for both append-only DOMs (identity match) and virtualized/recycled DOMs
 * (text-content signature match).
 *
 * Typical use: loop over a virtualized list, call `getUnseenIndices` each page-turn,
 * and only process rows that haven't been seen before.
 */
export class ElementTracker {
  public readonly id: string;

  constructor(prefix = 'tracker') {
    this.id = `__pwSugar_${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Returns indices of elements whose text content has changed since the last commit
   * (or all indices on first call). Does NOT persist — use `commitIndices` to save.
   */
  async peekUnseenIndices(locators: Locator): Promise<number[]> {
    return locators.evaluateAll((elements, trackerId) => {
      const win = window as unknown as Record<string, unknown>;
      if (!win[trackerId]) win[trackerId] = new WeakMap<Element, string>();
      const seen = win[trackerId] as WeakMap<Element, string>;
      const result: number[] = [];
      elements.forEach((el, i) => {
        if (seen.get(el) !== el.textContent) result.push(i);
      });
      return result;
    }, this.id);
  }

  /**
   * Marks `indices` as seen (persists their current text content in the browser WeakMap).
   * Only call this for rows you actually intend to process.
   */
  async commitIndices(locators: Locator, indices: number[]): Promise<void> {
    await locators.evaluateAll((elements, [trackerId, idxs]) => {
      const win = window as unknown as Record<string, unknown>;
      if (!win[trackerId]) win[trackerId] = new WeakMap<Element, string>();
      const seen = win[trackerId] as WeakMap<Element, string>;
      for (const i of idxs) {
        const el = elements[i];
        if (el) seen.set(el, el.textContent ?? '');
      }
    }, [this.id, indices] as [string, number[]]);
  }

  /** Peeks at unseen indices and immediately commits them. */
  async getUnseenIndices(locators: Locator): Promise<number[]> {
    const indices = await this.peekUnseenIndices(locators);
    await this.commitIndices(locators, indices);
    return indices;
  }

  /** Removes the tracking WeakMap from the browser window. Call when done. */
  async cleanup(page: Page): Promise<void> {
    try {
      await page.evaluate((id: string) => { delete (window as unknown as Record<string, unknown>)[id]; }, this.id);
    } catch {
      // ignore context-destroyed errors
    }
  }
}
