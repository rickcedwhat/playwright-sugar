import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import type { MockInstance } from 'vitest';
import type { Page } from '@playwright/test';
import { Play } from './play.js';
import { Playbook } from './playbook.js';
import { Outcomes } from './outcomes.js';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('./attemptAction.js', () => ({
  attemptAction: vi.fn(),
  detectPageState: vi.fn(),
}));

import { attemptAction, detectPageState } from './attemptAction.js';

const mockAttemptAction = attemptAction as unknown as MockInstance;
const mockDetectPageState = detectPageState as unknown as MockInstance;

// Suppress play logging in tests
beforeAll(() => { vi.spyOn(console, 'log').mockImplementation(() => {}); });
afterAll(() => { vi.restoreAllMocks(); });
beforeEach(() => {
  mockAttemptAction.mockReset();
  mockDetectPageState.mockReset();
});

function makePage(overrides: Partial<Record<string, unknown>> = {}): Page {
  return {
    reload: vi.fn().mockResolvedValue(undefined),
    getByText: vi.fn().mockReturnValue({ toString: () => 'mock-locator' }),
    bringToFront: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as Page;
}

const mockLocator = {} as any;

// ── bringToFront ──────────────────────────────────────────────────────────────

describe('Play.run() always calls bringToFront', () => {
  it('calls page.bringToFront() before the first act', async () => {
    const page = makePage();
    await new Play().act('nav', async () => {}).run('label', { page, state: null, result: null });
    expect(page.bringToFront).toHaveBeenCalledOnce();
  });

  it('calls bringToFront even when all acts are skipped', async () => {
    const page = makePage();
    await new Play().act('nav', async () => {}, { skip: true }).run('label', { page, state: null, result: null });
    expect(page.bringToFront).toHaveBeenCalledOnce();
  });
});

// ── Play chain order ──────────────────────────────────────────────────────────

describe('Play chain order', () => {
  it('executes acts in the order they were added', async () => {
    const order: number[] = [];
    const page = makePage();

    const play = new Play()
      .act('first', async () => { order.push(1); })
      .act('second', async () => { order.push(2); })
      .act('third', async () => { order.push(3); });

    await play.run('label', { page, state: null, result: null });

    expect(order).toEqual([1, 2, 3]);
  });

  it('nav and prep are named aliases for act', async () => {
    const names: string[] = [];
    const page = makePage();

    mockAttemptAction.mockResolvedValueOnce({ isSuccess: true, outcome: 'ok', data: undefined });

    const play = new Play()
      .nav(async () => { names.push('nav'); })
      .prep(async () => { names.push('prep'); })
      .attempt({
        trigger: async () => {},
        outcomes: [Outcomes.success(mockLocator)],
      });

    await play.run('label', { page, state: null, result: null });

    expect(names).toEqual(['nav', 'prep']);
  });
});

// ── skip ──────────────────────────────────────────────────────────────────────

describe('ActOptions.skip', () => {
  it('skips acts with skip: true', async () => {
    const fn = vi.fn().mockResolvedValue(undefined);
    const page = makePage();

    const play = new Play().act('skipped', fn, { skip: true });

    await play.run('label', { page, state: null, result: null });

    expect(fn).not.toHaveBeenCalled();
  });

  it('still runs acts without skip', async () => {
    const fn = vi.fn().mockResolvedValue(undefined);
    const page = makePage();

    const play = new Play()
      .act('skipped', vi.fn(), { skip: true })
      .act('runs', fn);

    await play.run('label', { page, state: null, result: null });

    expect(fn).toHaveBeenCalledOnce();
  });

  it('skip on .reload() prevents page.reload from being called', async () => {
    const page = makePage();

    const play = new Play().reload({ waitUntil: 'domcontentloaded' }, { skip: true });

    await play.run('label', { page, state: null, result: null });

    expect(page.reload).not.toHaveBeenCalled();
  });
});

// ── .reload() ─────────────────────────────────────────────────────────────────

describe('.reload()', () => {
  it('calls page.reload() with provided options', async () => {
    const page = makePage();
    const play = new Play().reload({ waitUntil: 'domcontentloaded', timeout: 5000 });

    await play.run('label', { page, state: null, result: null });

    expect(page.reload).toHaveBeenCalledWith({ waitUntil: 'domcontentloaded', timeout: 5000 });
  });

  it('calls page.reload() with no arguments when no options given', async () => {
    const page = makePage();
    const play = new Play().reload();

    await play.run('label', { page, state: null, result: null });

    expect(page.reload).toHaveBeenCalledWith(undefined);
  });
});

// ── .detect() → ctx.state ────────────────────────────────────────────────────

describe('.detect() ctx.state', () => {
  beforeEach(() => {
    mockDetectPageState.mockResolvedValue({ isSuccess: true, outcome: 'found', data: undefined });
  });

  it('sets ctx.state with the name and isSuccess from the winning outcome', async () => {
    const page = makePage();

    const play = new Play().detect(() => [
      { name: 'found', isSuccess: true, locator: mockLocator },
    ]);

    const ctx = await play.run('label', { page, state: null, result: null });

    expect(ctx['state']).toEqual({ name: 'found', isSuccess: true, data: undefined });
  });

  it('ctx.state is available in acts that follow detect', async () => {
    const page = makePage();
    let seenState: unknown = undefined;

    const play = new Play()
      .detect(() => [{ name: 'found', isSuccess: true, locator: mockLocator }])
      .act('read-state', async (_p, ctx) => { seenState = ctx['state']; });

    await play.run('label', { page, state: null, result: null });

    expect(seenState).toMatchObject({ name: 'found', isSuccess: true });
  });
});

// ── .attempt() and cleanup ────────────────────────────────────────────────────

describe('.attempt() and .cleanup()', () => {
  it('cleanup is skipped when attempt was never reached', async () => {
    const cleanupFn = vi.fn().mockResolvedValue(undefined);
    const page = makePage();

    const play = new Play()
      .act('only-act', async () => {})
      .cleanup(cleanupFn);

    await play.run('label', { page, state: null, result: null });

    expect(cleanupFn).not.toHaveBeenCalled();
  });

  it('cleanup runs when attempt was reached (success outcome)', async () => {
    const cleanupFn = vi.fn().mockResolvedValue(undefined);
    const page = makePage();
    mockAttemptAction.mockResolvedValueOnce({ isSuccess: true, outcome: 'ok', data: undefined });

    const play = new Play()
      .attempt({ trigger: async () => {}, outcomes: [Outcomes.success(mockLocator)] })
      .cleanup(cleanupFn);

    await play.run('label', { page, state: null, result: null });

    expect(cleanupFn).toHaveBeenCalledOnce();
  });

  it('cleanup runs when attempt was reached (failure outcome)', async () => {
    const cleanupFn = vi.fn().mockResolvedValue(undefined);
    const page = makePage();
    mockAttemptAction.mockResolvedValueOnce({ isSuccess: false, outcome: 'fail', data: undefined });

    const play = new Play()
      .attempt({ trigger: async () => {}, outcomes: [Outcomes.failure(mockLocator)] })
      .cleanup(cleanupFn);

    await play.run('label', { page, state: null, result: null });

    expect(cleanupFn).toHaveBeenCalledOnce();
  });

  it('cleanup receives ctx.result from the attempt', async () => {
    const page = makePage();
    let seenResult: unknown;
    mockAttemptAction.mockResolvedValueOnce({ isSuccess: false, outcome: 'blocked', data: undefined });

    const play = new Play()
      .attempt({ trigger: async () => {}, outcomes: [Outcomes.failure(mockLocator)] })
      .cleanup(async (_p, ctx) => { seenResult = ctx['result']; });

    await play.run('label', { page, state: null, result: null });

    expect(seenResult).toMatchObject({ isSuccess: false, outcome: 'blocked' });
  });

  it('sets ctx.result with the attempt outcome', async () => {
    const page = makePage();
    mockAttemptAction.mockResolvedValueOnce({ isSuccess: true, outcome: 'created', data: 42 });

    const play = new Play()
      .attempt({ trigger: async () => {}, outcomes: [Outcomes.success(mockLocator)] });

    const ctx = await play.run('label', { page, state: null, result: null });

    expect(ctx['result']).toEqual({ isSuccess: true, outcome: 'created', data: 42 });
  });
});

// ── Error labels and Error.cause ──────────────────────────────────────────────

describe('error labels', () => {
  it('wraps act errors with [label > actName] prefix', async () => {
    const page = makePage();
    const cause = new Error('row not found');

    const play = new Play().act('prep', async () => { throw cause; });

    await expect(play.run('MyPb > update', { page, state: null, result: null }))
      .rejects.toThrow('[MyPb > update > prep] row not found');
  });

  it('preserves Error.cause on wrapped errors', async () => {
    const page = makePage();
    const original = new Error('original');

    const play = new Play().act('prep', async () => { throw original; });

    let thrown: Error | undefined;
    try {
      await play.run('label', { page, state: null, result: null });
    } catch (e) {
      thrown = e as Error;
    }

    expect(thrown?.cause).toBe(original);
  });

  it('includes the act name in the error for named .attempt()', async () => {
    const page = makePage();
    mockAttemptAction.mockRejectedValueOnce(new Error('attempt failed'));

    const play = new Play().attempt('submit', {
      trigger: async () => {},
      outcomes: [Outcomes.success(mockLocator)],
    });

    await expect(play.run('Pb > play', { page, state: null, result: null }))
      .rejects.toThrow('[Pb > play > submit]');
  });
});

// ── .attempt() resolves page-bound locators ───────────────────────────────────

describe('.attempt() locator resolution', () => {
  it('resolves a page-bound locator fn before calling attemptAction', async () => {
    const page = makePage();
    const resolvedLocator = { toString: () => 'success-locator' } as any;
    (page.getByText as unknown as MockInstance).mockReturnValue(resolvedLocator);

    let capturedOutcomes: unknown;
    mockAttemptAction.mockImplementationOnce(async ({ outcomes }) => {
      capturedOutcomes = outcomes;
      return { isSuccess: true, outcome: 'success', data: undefined };
    });

    const play = new Play().attempt({
      trigger: async () => {},
      outcomes: [Outcomes.success(p => p.getByText('This dataset is empty'))],
    });

    await play.run('label', { page, state: null, result: null });

    const outcome = (capturedOutcomes as any[])[0];
    expect(outcome.locator).toBe(resolvedLocator);
    expect(page.getByText).toHaveBeenCalledWith('This dataset is empty');
  });

  it('passes ctx as second arg to locator fns', async () => {
    const page = makePage();
    (page.getByText as unknown as MockInstance).mockReturnValue({});
    let capturedCtx: unknown;
    mockAttemptAction.mockImplementationOnce(async () =>
      ({ isSuccess: true, outcome: 'success', data: undefined })
    );

    const play = new Play().attempt({
      trigger: async () => {},
      outcomes: [Outcomes.success((_p, ctx) => { capturedCtx = ctx; return _p.getByText('test'); })],
    });

    await play.run('label', { page, state: null, result: null });

    expect(capturedCtx).toBeDefined();
    expect(typeof capturedCtx).toBe('object');
  });

  it('passes the timeout outcome .after value to attemptAction', async () => {
    const page = makePage();
    let capturedTimeout: unknown;
    mockAttemptAction.mockImplementationOnce(async ({ timeout }) => {
      capturedTimeout = timeout;
      return { isSuccess: true, outcome: 'ok', data: undefined };
    });

    const play = new Play().attempt({
      trigger: async () => {},
      outcomes: [
        Outcomes.success(p => p.getByText('done')),
        Outcomes.timeout(8000),
      ],
    });

    await play.run('label', { page, state: null, result: null });

    expect(capturedTimeout).toBe(8000);
  });
});

// ── Outcomes DSL ──────────────────────────────────────────────────────────────

describe('Outcomes DSL', () => {
  it('success(fn) stores the fn and isSuccess: true', () => {
    const fn = (p: Page) => p.getByText('hello');
    const outcome = Outcomes.success(fn);
    expect(outcome.isSuccess).toBe(true);
    expect(outcome.locator).toBe(fn);
  });

  it('failure(fn) stores the fn and isSuccess: false', () => {
    const fn = (p: Page) => p.getByText('error');
    const outcome = Outcomes.failure(fn);
    expect(outcome.isSuccess).toBe(false);
    expect(outcome.locator).toBe(fn);
  });

  it('success(name, locator) uses explicit name', () => {
    const outcome = Outcomes.success('Created!', mockLocator);
    expect(outcome.name).toBe('Created!');
    expect(outcome.isSuccess).toBe(true);
  });

  it('timeout(after) stores after and isTimeoutOutcome', () => {
    const outcome = Outcomes.timeout(5000);
    expect(outcome.after).toBe(5000);
    expect(outcome.isTimeoutOutcome).toBe(true);
    expect(outcome.isSuccess).toBe(false);
  });
});

// ── Playbook.withCtx() ────────────────────────────────────────────────────────

describe('Playbook.withCtx()', () => {
  const plays = {
    exists: () => new Play(),
  };

  it('returns a new Playbook instance', () => {
    const pb = new Playbook(plays);
    const page = makePage();
    const copy = pb.withCtx({ page });

    expect(copy).not.toBe(pb);
  });

  it('original Playbook is unchanged', () => {
    const pb = new Playbook(plays);
    const page = makePage();
    pb.withCtx({ page });

    expect(() => pb.getPage()).toThrow('no page bound');
  });

  it('new Playbook has the bound page', () => {
    const pb = new Playbook(plays);
    const page = makePage();
    const copy = pb.withCtx({ page });

    expect(copy.getPage()).toBe(page);
  });

  it('extra context keys flow into buildCtx()', () => {
    const pb = new Playbook(plays);
    const page = makePage();
    const table = { getRow: vi.fn() };
    const copy = pb.withCtx({ page, table });

    const ctx = copy.buildCtx();
    expect(ctx['table']).toBe(table);
  });

  it('later withCtx() merges on top of earlier ctx', () => {
    const pb = new Playbook(plays);
    const page1 = makePage();
    const page2 = makePage();
    const withPage1 = pb.withCtx({ page: page1 });
    const withPage2 = withPage1.withCtx({ page: page2 });

    expect(withPage2.getPage()).toBe(page2);
    expect(withPage1.getPage()).toBe(page1);
  });
});

// ── Extra context propagates to acts ─────────────────────────────────────────

describe('extra ctx from Playbook.withCtx()', () => {
  it('table and other extras are visible in act functions via ctx', async () => {
    const page = makePage();
    const table = { getRow: vi.fn() };
    let seenTable: unknown;

    const pb = new Playbook({
      check: () => new Play().act('read-table', async (_p, ctx) => {
        seenTable = ctx['table'];
      }),
    }).withCtx({ page, table });

    const ctx = pb.buildCtx();
    const play = pb.getPlay('check')({});
    await play.run('label', ctx);

    expect(seenTable).toBe(table);
  });
});

// ── Logging ───────────────────────────────────────────────────────────────────

describe('Play logging', () => {
  let logSpy: MockInstance;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logSpy.mockClear();
  });

  it('logs ▶ Play: label at the start', async () => {
    const page = makePage();
    await new Play().run('MyPb > exists', { page, state: null, result: null });
    expect(logSpy).toHaveBeenCalledWith('▶ Play: MyPb > exists');
  });

  it('logs ✅ for a successful act', async () => {
    const page = makePage();
    await new Play().act('nav', async () => {}).run('label', { page, state: null, result: null });
    expect(logSpy).toHaveBeenCalledWith(expect.stringMatching(/✅ nav\s+\(\d+ms\)/));
  });

  it('logs ⏭ for a skipped act', async () => {
    const page = makePage();
    await new Play().act('prep', async () => {}, { skip: true }).run('label', { page, state: null, result: null });
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('⏭  prep  SKIPPED'));
  });

  it('logs ❌ for a failing act and ⏭ for subsequent acts', async () => {
    const page = makePage();
    const play = new Play()
      .act('nav', async () => { throw new Error('boom'); })
      .act('prep', async () => {});

    await expect(play.run('label', { page, state: null, result: null })).rejects.toThrow();

    expect(logSpy).toHaveBeenCalledWith(expect.stringMatching(/❌ nav/));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('⏭  prep  SKIPPED'));
  });

  it('logs ❌ for a failure outcome from attempt', async () => {
    const page = makePage();
    mockAttemptAction.mockResolvedValueOnce({ isSuccess: false, outcome: 'blocked', data: undefined });

    const play = new Play().attempt({
      trigger: async () => {},
      outcomes: [Outcomes.failure(mockLocator)],
    });

    await play.run('label', { page, state: null, result: null });

    expect(logSpy).toHaveBeenCalledWith(expect.stringMatching(/❌ attempt.*outcome: blocked/));
  });

  it('logs → state: <name> after detect', async () => {
    const page = makePage();
    mockDetectPageState.mockResolvedValue({ isSuccess: true, outcome: 'found', data: undefined });

    const play = new Play().detect(() => [{ name: 'found', isSuccess: true, locator: mockLocator }]);
    await play.run('label', { page, state: null, result: null });

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('→ state: found'));
  });

  it('logs ⏭ cleanup SKIPPED when attempt was not reached', async () => {
    const page = makePage();
    const play = new Play()
      .act('nav', async () => {})
      .cleanup(async () => {});

    await play.run('label', { page, state: null, result: null });

    const calls = logSpy.mock.calls.map(c => c[0] as string);
    expect(calls.some(c => c.includes('cleanup'))).toBe(false);
  });

  it('logs ⏭ cleanup SKIPPED when a prior act threw', async () => {
    const page = makePage();
    mockAttemptAction.mockResolvedValueOnce({ isSuccess: true, outcome: 'ok', data: undefined });

    const play = new Play()
      .attempt({ trigger: async () => {}, outcomes: [Outcomes.success(mockLocator)] })
      .act('post', async () => { throw new Error('after attempt'); })
      .cleanup(async () => {});

    await expect(play.run('label', { page, state: null, result: null })).rejects.toThrow();

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('⏭  cleanup  SKIPPED'));
  });
});

// ── SyncStrategy ──────────────────────────────────────────────────────────────

describe('SyncStrategy', () => {
  it('withReload() calls reload on the given page', async () => {
    const { SyncStrategy } = await import('./syncStrategy.js');
    const page = makePage();
    const strategy = SyncStrategy.withReload();
    await strategy.sync(page as unknown as Page);
    expect(page.reload).toHaveBeenCalledWith({ waitUntil: 'domcontentloaded' });
  });

  it('custom() calls the provided fn with the page', async () => {
    const { SyncStrategy } = await import('./syncStrategy.js');
    const page = makePage();
    const fn = vi.fn().mockResolvedValue(undefined);
    const strategy = SyncStrategy.custom(fn);
    await strategy.sync(page as unknown as Page);
    expect(fn).toHaveBeenCalledWith(page);
  });
});
