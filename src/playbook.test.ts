import { describe, it, expect, vi } from 'vitest';
import type { Page } from '@playwright/test';
import { Play } from './play.js';
import { Playbook, bindPlaybooks } from './playbook.js';

function makePage(label: string): Page {
  return {
    bringToFront: vi.fn().mockResolvedValue(undefined),
    toString: () => label,
  } as unknown as Page;
}

describe('bindPlaybooks', () => {
  it('returns distinct bound instances per page', () => {
    const pageA = makePage('A');
    const pageB = makePage('B');
    const base = new Playbook('X', {
      p: () => new Play(),
    });
    const catalog = { one: base, two: base };

    const boundA = bindPlaybooks({ page: pageA }, catalog);
    const boundB = bindPlaybooks({ page: pageB }, catalog);

    expect(boundA.one).not.toBe(base);
    expect(boundA.one).not.toBe(boundB.one);
    expect(boundA.one.getPage()).toBe(pageA);
    expect(boundB.one.getPage()).toBe(pageB);
  });

  it('merges extra ctx keys onto each playbook', () => {
    const page = makePage('P');
    const table = { id: 't1' };
    const base = new Playbook('Y', { p: () => new Play() });
    const bound = bindPlaybooks({ page, table }, { only: base });
    const ctx = bound.only.buildCtx();
    expect(ctx['page']).toBe(page);
    expect(ctx['table']).toEqual(table);
  });
});
