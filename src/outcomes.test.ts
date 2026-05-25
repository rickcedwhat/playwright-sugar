import { describe, it, expect } from 'vitest';
import type { Page } from '@playwright/test';
import { Outcomes } from './outcomes.js';

describe('Outcomes DSL', () => {
  const mockLocator = {} as any;

  it('success(locator) stores pre-bound locator and isSuccess: true', () => {
    const outcome = Outcomes.success(mockLocator);
    expect(outcome.isSuccess).toBe(true);
    expect(outcome.locator).toBe(mockLocator);
    expect(outcome.name).toBe('success');
  });

  it('success(name, locator) uses the provided name', () => {
    const outcome = Outcomes.success('created', mockLocator);
    expect(outcome.name).toBe('created');
    expect(outcome.locator).toBe(mockLocator);
    expect(outcome.isSuccess).toBe(true);
  });

  it('success(fn) stores a (page, ctx) => Locator fn', () => {
    const fn = (p: Page) => p.getByText('Done');
    const outcome = Outcomes.success(fn);
    expect(outcome.locator).toBe(fn);
    expect(outcome.isSuccess).toBe(true);
  });

  it('success(name, fn) stores fn with explicit name', () => {
    const fn = (p: Page) => p.getByText('Done');
    const outcome = Outcomes.success('done', fn);
    expect(outcome.name).toBe('done');
    expect(outcome.locator).toBe(fn);
  });

  it('success(name, locator, { onOutcome }) stores the callback', () => {
    const cb = async () => 'data';
    const outcome = Outcomes.success('S', mockLocator, { onOutcome: cb });
    expect(outcome.onOutcome).toBe(cb);
  });

  it('failure(locator) stores locator and isSuccess: false', () => {
    const outcome = Outcomes.failure(mockLocator);
    expect(outcome.isSuccess).toBe(false);
    expect(outcome.locator).toBe(mockLocator);
    expect(outcome.name).toBe('failure');
  });

  it('failure(name, locator) uses the provided name', () => {
    const outcome = Outcomes.failure('blocked', mockLocator);
    expect(outcome.name).toBe('blocked');
    expect(outcome.isSuccess).toBe(false);
  });

  it('failure(fn) stores a (page, ctx) => Locator fn', () => {
    const fn = (p: Page) => p.getByText('Error');
    const outcome = Outcomes.failure(fn);
    expect(outcome.locator).toBe(fn);
    expect(outcome.isSuccess).toBe(false);
  });

  it('timeout() has sensible defaults', () => {
    const outcome = Outcomes.timeout();
    expect(outcome.isTimeoutOutcome).toBe(true);
    expect(outcome.isSuccess).toBe(false);
    expect(outcome.name).toBe('timeout');
  });

  it('timeout(name) uses provided name', () => {
    const outcome = Outcomes.timeout('timed-out');
    expect(outcome.name).toBe('timed-out');
  });

  it('actionError() has sensible defaults', () => {
    const outcome = Outcomes.actionError();
    expect(outcome.isActionErrorOutcome).toBe(true);
    expect(outcome.isSuccess).toBe(false);
    expect(outcome.name).toBe('action-error');
  });

  it('actionError(name) uses provided name', () => {
    const outcome = Outcomes.actionError('click-failed');
    expect(outcome.name).toBe('click-failed');
  });
});
