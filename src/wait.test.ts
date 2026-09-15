import type { Page } from '@playwright/test';
import { describe, expect, it, vi } from 'vitest';
import { wait } from './wait.js';

function makePage() {
  return {
    waitForTimeout: vi.fn().mockResolvedValue(undefined),
    evaluate: vi.fn().mockResolvedValue(undefined),
  } as unknown as Page;
}

describe('wait', () => {
  it('waits for the specified duration with overlay', async () => {
    const page = makePage();
    await wait(page, 3000);

    expect(page.waitForTimeout).toHaveBeenCalledWith(3000);
    // cleanup of stale overlay + inject + cleanup = 3 evaluate calls
    expect(page.evaluate).toHaveBeenCalledTimes(3);
  });

  it('passes custom message to the overlay', async () => {
    const page = makePage();
    await wait(page, 1000, { message: 'Loading data' });

    // The inject call (second evaluate) receives the message
    const injectCall = (page.evaluate as ReturnType<typeof vi.fn>).mock.calls[1]!;
    expect(injectCall[1]).toEqual(
      expect.objectContaining({ message: 'Loading data' }),
    );
  });

  it('skips overlay when overlay is false', async () => {
    const page = makePage();
    await wait(page, 2000, { overlay: false });

    expect(page.waitForTimeout).toHaveBeenCalledWith(2000);
    expect(page.evaluate).not.toHaveBeenCalled();
  });

  it('cleans up overlay even when waitForTimeout rejects', async () => {
    const page = makePage();
    (page.waitForTimeout as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('timeout'),
    );

    await expect(wait(page, 1000)).rejects.toThrow('timeout');

    // Cleanup evaluate still called (the last call)
    const calls = (page.evaluate as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls.length).toBeGreaterThanOrEqual(3);
  });
});
