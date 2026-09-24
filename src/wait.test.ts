import type { Frame, Page } from '@playwright/test';
import { describe, expect, it, vi } from 'vitest';
import { wait } from './wait.js';

type Mock = ReturnType<typeof vi.fn>;

function makePage() {
  const mainFrame = {} as Frame;
  const page = {
    waitForTimeout: vi.fn().mockResolvedValue(undefined),
    evaluate: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
    off: vi.fn(),
    mainFrame: () => mainFrame,
    isClosed: vi.fn().mockReturnValue(false),
  };
  return { page: page as unknown as Page, mocks: page, mainFrame };
}

/** The `framenavigated` listener the last `wait()` call registered. */
function navigatedListener(mocks: ReturnType<typeof makePage>['mocks'], index = 0) {
  const call = mocks.on.mock.calls[index]!;
  expect(call[0]).toBe('framenavigated');
  return call[1] as (frame: Frame) => void;
}

describe('wait', () => {
  it('waits for the specified duration with overlay', async () => {
    const { page, mocks } = makePage();
    await wait(page, 3000);

    expect(mocks.waitForTimeout).toHaveBeenCalledWith(3000);
    // render + cleanup = 2 evaluate calls
    expect(mocks.evaluate).toHaveBeenCalledTimes(2);
  });

  it('passes custom message and duration to the overlay', async () => {
    const { page, mocks } = makePage();
    await wait(page, 1000, { message: 'Loading data' });

    const renderCall = mocks.evaluate.mock.calls[0]!;
    expect(renderCall[1]).toEqual(
      expect.objectContaining({ message: 'Loading data', remainingMs: 1000 }),
    );
  });

  it('skips overlay when overlay is false', async () => {
    const { page, mocks } = makePage();
    await wait(page, 2000, { overlay: false });

    expect(mocks.waitForTimeout).toHaveBeenCalledWith(2000);
    expect(mocks.evaluate).not.toHaveBeenCalled();
    expect(mocks.on).not.toHaveBeenCalled();
  });

  it.each([0, -5, NaN, Infinity])(
    'falls back to a plain waitForTimeout without overlay for ms=%s',
    async (ms) => {
      const { page, mocks } = makePage();
      await wait(page, ms);

      expect(mocks.waitForTimeout).toHaveBeenCalledWith(ms);
      expect(mocks.evaluate).not.toHaveBeenCalled();
    },
  );

  it('still resolves when overlay evaluate rejects (e.g. context destroyed)', async () => {
    const { page, mocks } = makePage();
    mocks.evaluate.mockRejectedValue(
      new Error('Execution context was destroyed, most likely because of a navigation'),
    );

    await expect(wait(page, 1000)).resolves.toBeUndefined();
    expect(mocks.waitForTimeout).toHaveBeenCalledWith(1000);
  });

  it('propagates waitForTimeout errors unchanged and still cleans up', async () => {
    const { page, mocks } = makePage();
    const closed = new Error('Target page, context or browser has been closed');
    mocks.waitForTimeout.mockRejectedValueOnce(closed);

    await expect(wait(page, 1000)).rejects.toBe(closed);

    // render + cleanup
    expect(mocks.evaluate).toHaveBeenCalledTimes(2);
    // listener removed with the same function that was registered
    expect(mocks.off).toHaveBeenCalledWith('framenavigated', navigatedListener(mocks));
  });

  it('skips the cleanup evaluate when the page is already closed', async () => {
    const { page, mocks } = makePage();
    mocks.waitForTimeout.mockImplementation(async () => {
      mocks.isClosed.mockReturnValue(true);
      throw new Error('Target page, context or browser has been closed');
    });

    await expect(wait(page, 1000)).rejects.toThrow('closed');

    // only the initial render; no cleanup against a closed page
    expect(mocks.evaluate).toHaveBeenCalledTimes(1);
    expect(mocks.off).toHaveBeenCalledTimes(1);
  });

  describe('navigation', () => {
    it('re-renders the overlay when the main frame navigates mid-wait', async () => {
      const { page, mocks, mainFrame } = makePage();
      let resolveWait!: () => void;
      mocks.waitForTimeout.mockReturnValue(new Promise<void>((r) => (resolveWait = r)));

      const pending = wait(page, 5000, { message: 'Hold on' });
      await vi.waitFor(() => expect(mocks.waitForTimeout).toHaveBeenCalled());
      expect(mocks.evaluate).toHaveBeenCalledTimes(1);

      navigatedListener(mocks)(mainFrame);
      expect(mocks.evaluate).toHaveBeenCalledTimes(2);
      const rerender = mocks.evaluate.mock.calls[1]!;
      expect(rerender[1]).toEqual(expect.objectContaining({ message: 'Hold on' }));
      const { remainingMs } = rerender[1] as { remainingMs: number };
      expect(remainingMs).toBeGreaterThan(0);
      expect(remainingMs).toBeLessThanOrEqual(5000);

      resolveWait();
      await pending;
      // render + re-render + cleanup
      expect(mocks.evaluate).toHaveBeenCalledTimes(3);
    });

    it('ignores navigations of child frames', async () => {
      const { page, mocks } = makePage();
      let resolveWait!: () => void;
      mocks.waitForTimeout.mockReturnValue(new Promise<void>((r) => (resolveWait = r)));

      const pending = wait(page, 5000);
      await vi.waitFor(() => expect(mocks.waitForTimeout).toHaveBeenCalled());

      navigatedListener(mocks)({} as Frame);
      expect(mocks.evaluate).toHaveBeenCalledTimes(1);

      resolveWait();
      await pending;
    });

    it('a superseded (orphaned) wait stops re-rendering on navigation', async () => {
      const { page, mocks, mainFrame } = makePage();
      let resolveFirst!: () => void;
      let resolveSecond!: () => void;
      mocks.waitForTimeout
        .mockReturnValueOnce(new Promise<void>((r) => (resolveFirst = r)))
        .mockReturnValueOnce(new Promise<void>((r) => (resolveSecond = r)));

      const first = wait(page, 10_000, { message: 'first' });
      await vi.waitFor(() => expect(mocks.waitForTimeout).toHaveBeenCalledTimes(1));
      const second = wait(page, 10_000, { message: 'second' });
      await vi.waitFor(() => expect(mocks.waitForTimeout).toHaveBeenCalledTimes(2));
      expect(mocks.evaluate).toHaveBeenCalledTimes(2);

      // Orphan's listener is a no-op; the active call's listener re-renders
      navigatedListener(mocks, 0)(mainFrame);
      expect(mocks.evaluate).toHaveBeenCalledTimes(2);
      navigatedListener(mocks, 1)(mainFrame);
      expect(mocks.evaluate).toHaveBeenCalledTimes(3);
      expect(mocks.evaluate.mock.calls[2]![1]).toEqual(
        expect.objectContaining({ message: 'second' }),
      );

      // Orphan's cleanup targets its own token, not the active overlay
      resolveFirst();
      await first;
      const firstToken = (mocks.evaluate.mock.calls[0]![1] as { token: number }).token;
      const secondToken = (mocks.evaluate.mock.calls[1]![1] as { token: number }).token;
      expect(firstToken).not.toBe(secondToken);
      expect(mocks.evaluate.mock.calls[3]![1]).toEqual({ marker: 'data-pw-sugar-wait', token: firstToken });

      resolveSecond();
      await second;
      expect(mocks.evaluate.mock.calls[4]![1]).toEqual({ marker: 'data-pw-sugar-wait', token: secondToken });
    });
  });
});
