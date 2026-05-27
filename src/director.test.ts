import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { Director } from './director.js';
import type { PlayResult } from './director.js';

beforeAll(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'table').mockImplementation(() => {});
});
afterAll(() => { vi.restoreAllMocks(); });

function makeDirector(collect = true) {
  const director = new Director({ collect });
  vi.spyOn(director as any, '_runPlay');
  return director as any;
}

function stubRun(director: any, result: PlayResult) {
  director._runPlay.mockResolvedValue(result);
}

function stubRunError(director: any, message: string) {
  director._runPlay.mockRejectedValue(new Error(message));
}

const mockPlaybook = {
  logScope: () => undefined,
  runLabel: (name: string) => `MockPlaybook > ${name}`,
  getPlay: vi.fn(),
  buildCtx: vi.fn(),
  withCtx: vi.fn(),
  getPage: vi.fn(),
  name: 'MockPlaybook',
} as any;

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'table').mockImplementation(() => {});
});

// ── assertCan — collect mode ──────────────────────────────────────────────────

describe('assertCan — collect mode', () => {
  it('does not throw when play fails', async () => {
    const d = makeDirector();
    stubRun(d, { isSuccess: false, outcome: 'blocked' });
    await expect(d.assertCan(mockPlaybook, 'viewPage')).resolves.not.toThrow();
  });

  it('records a failure when play fails', async () => {
    const d = makeDirector();
    stubRun(d, { isSuccess: false, outcome: 'blocked' });
    await d.assertCan(mockPlaybook, 'viewPage');
    const collected = (d as any)._collected;
    expect(collected).toHaveLength(1);
    expect(collected[0]).toMatchObject({ play: 'viewPage', expected: 'success', outcome: 'blocked', pass: false });
  });

  it('records a pass when play succeeds', async () => {
    const d = makeDirector();
    stubRun(d, { isSuccess: true, outcome: 'success' });
    await d.assertCan(mockPlaybook, 'viewPage');
    const collected = (d as any)._collected;
    expect(collected[0]).toMatchObject({ pass: true });
  });

  it('records a failure and does not throw when _runPlay throws', async () => {
    const d = makeDirector();
    stubRunError(d, 'Playwright timeout');
    await expect(d.assertCan(mockPlaybook, 'viewPage')).resolves.not.toThrow();
    expect((d as any)._collected[0]).toMatchObject({ pass: false, outcome: 'Playwright timeout' });
  });
});

// ── assertCannot — collect mode ───────────────────────────────────────────────

describe('assertCannot — collect mode', () => {
  it('does not throw when play succeeds (unexpected success)', async () => {
    const d = makeDirector();
    stubRun(d, { isSuccess: true, outcome: 'success' });
    await expect(d.assertCannot(mockPlaybook, 'deleteUser')).resolves.not.toThrow();
  });

  it('records a failure when play unexpectedly succeeds', async () => {
    const d = makeDirector();
    stubRun(d, { isSuccess: true, outcome: 'success' });
    await d.assertCannot(mockPlaybook, 'deleteUser');
    expect((d as any)._collected[0]).toMatchObject({ expected: 'failure', pass: false });
  });

  it('records a pass when play fails (expected block)', async () => {
    const d = makeDirector();
    stubRun(d, { isSuccess: false, outcome: 'blocked' });
    await d.assertCannot(mockPlaybook, 'deleteUser');
    expect((d as any)._collected[0]).toMatchObject({ expected: 'failure', pass: true });
  });
});

// ── fail-fast mode (regression) ───────────────────────────────────────────────

describe('fail-fast mode', () => {
  it('assertCan throws immediately on failure', async () => {
    const d = makeDirector(false);
    stubRun(d, { isSuccess: false, outcome: 'blocked' });
    await expect(d.assertCan(mockPlaybook, 'viewPage')).rejects.toThrow('assertCan');
  });

  it('assertCannot throws immediately on unexpected success', async () => {
    const d = makeDirector(false);
    stubRun(d, { isSuccess: true, outcome: 'success' });
    await expect(d.assertCannot(mockPlaybook, 'deleteUser')).rejects.toThrow('assertCannot');
  });
});

// ── review() ──────────────────────────────────────────────────────────────────

describe('review()', () => {
  it('does not throw when all checks passed', async () => {
    const d = makeDirector();
    stubRun(d, { isSuccess: true, outcome: 'success' });
    await d.assertCan(mockPlaybook, 'viewPage');
    await expect(d.review()).resolves.not.toThrow();
  });

  it('throws with a summary when checks failed', async () => {
    const d = makeDirector();
    stubRun(d, { isSuccess: false, outcome: 'blocked' });
    await d.assertCan(mockPlaybook, 'viewPage');
    await expect(d.review()).rejects.toThrow('1 of 1 checks failed');
  });

  it('includes each failed play in the error message', async () => {
    const d = makeDirector();
    stubRun(d, { isSuccess: false, outcome: 'blocked' });
    await d.assertCan(mockPlaybook, 'viewPage');
    await d.assertCan(mockPlaybook, 'editPage');
    await expect(d.review()).rejects.toThrow('2 of 2 checks failed');
  });

  it('is a no-op when no checks were collected', async () => {
    const d = makeDirector();
    await expect(d.review()).resolves.not.toThrow();
  });

  it('logs a table of results', async () => {
    const d = makeDirector();
    stubRun(d, { isSuccess: true, outcome: 'success' });
    await d.assertCan(mockPlaybook, 'viewPage');
    await d.review();
    expect(console.table).toHaveBeenCalledOnce();
  });
});
