import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Locator } from '@playwright/test';
import { watchFor } from './watchFor.js';

function makeLocator(visible: boolean): Locator {
  return {
    isVisible: vi.fn().mockResolvedValue(visible),
  } as unknown as Locator;
}

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });

describe('watchFor', () => {
  it('calls callback when locator is visible', async () => {
    const locator = makeLocator(true);
    const callback = vi.fn().mockResolvedValue(undefined);

    const stop = watchFor(locator, callback, { interval: 10 });
    await vi.advanceTimersByTimeAsync(0);

    expect(callback).toHaveBeenCalledWith(locator);
    expect(callback).toHaveBeenCalledTimes(1);
    stop();
  });

  it('skips callback when locator is not visible', async () => {
    const locator = makeLocator(false);
    const callback = vi.fn();

    const stop = watchFor(locator, callback, { interval: 10 });
    await vi.advanceTimersByTimeAsync(50);
    stop();

    expect(callback).not.toHaveBeenCalled();
  });

  it('polls repeatedly on the configured interval', async () => {
    const locator = makeLocator(true);
    const callback = vi.fn().mockResolvedValue(undefined);

    const stop = watchFor(locator, callback, { interval: 10 });
    await vi.advanceTimersByTimeAsync(35);
    stop();

    expect(callback.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('stops polling after stop() is called', async () => {
    const locator = makeLocator(true);
    const callback = vi.fn().mockResolvedValue(undefined);

    const stop = watchFor(locator, callback, { interval: 10 });
    await vi.advanceTimersByTimeAsync(0);
    stop();
    const countAtStop = callback.mock.calls.length;

    await vi.advanceTimersByTimeAsync(100);

    expect(callback.mock.calls.length).toBe(countAtStop);
  });

  it('defaults to 500ms interval', async () => {
    const locator = makeLocator(true);
    const callback = vi.fn().mockResolvedValue(undefined);

    const stop = watchFor(locator, callback);
    await vi.advanceTimersByTimeAsync(0);   // first iteration (immediate)
    expect(callback).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(499); // not yet
    expect(callback).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1);   // 500ms elapsed — second iteration
    expect(callback).toHaveBeenCalledTimes(2);
    stop();
  });
});
