import { describe, it, expect } from 'vitest';
import type { Page } from '@playwright/test';
import { Outcomes } from './outcomes.js';

describe('Outcomes DSL', () => {
  const mockLocator = {} as any;

  it('success({ locator }) stores a page-bound fn and isSuccess: true', () => {
    const fn = (p: Page) => p.getByText('hello');
    const outcome = Outcomes.success({ locator: fn });
    expect(outcome.isSuccess).toBe(true);
    expect(outcome.locator).toBe(fn);
  });

  it('success({ locator }) accepts a pre-bound Locator', () => {
    const outcome = Outcomes.success({ locator: mockLocator });
    expect(outcome.isSuccess).toBe(true);
    expect(outcome.locator).toBe(mockLocator);
  });

  it('success({ text }) stores a page-bound fn derived from getByText', () => {
    const outcome = Outcomes.success({ text: 'Created!' });
    expect(outcome.isSuccess).toBe(true);
    expect(typeof outcome.locator).toBe('function');
    // name is derived from text
    expect(outcome.name).toBe('Created!');
  });

  it('success({ text }) uses regex as name fallback', () => {
    const outcome = Outcomes.success({ text: /done/i });
    expect(outcome.name).toBe('success');
  });

  it('success({ name, locator }) uses the provided name', () => {
    const outcome = Outcomes.success({ name: 'created', locator: mockLocator });
    expect(outcome.name).toBe('created');
  });

  it('failure({ locator }) stores a page-bound fn and isSuccess: false', () => {
    const fn = (p: Page) => p.getByText('error');
    const outcome = Outcomes.failure({ locator: fn });
    expect(outcome.isSuccess).toBe(false);
    expect(outcome.locator).toBe(fn);
  });

  it('failure({ text }) derives name from text', () => {
    const outcome = Outcomes.failure({ text: 'Not allowed' });
    expect(outcome.isSuccess).toBe(false);
    expect(outcome.name).toBe('Not allowed');
  });

  it('timeout() has sensible defaults', () => {
    const outcome = Outcomes.timeout();
    expect(outcome.isTimeoutOutcome).toBe(true);
    expect(outcome.isSuccess).toBe(false);
    expect(outcome.name).toBe('timeout');
    expect(outcome.after).toBeUndefined();
  });

  it('timeout({ after: n }) stores after', () => {
    const outcome = Outcomes.timeout({ after: 5000 });
    expect(outcome.after).toBe(5000);
    expect(outcome.isTimeoutOutcome).toBe(true);
  });

  it('timeout({ name }) uses provided name', () => {
    const outcome = Outcomes.timeout({ name: 'timed-out' });
    expect(outcome.name).toBe('timed-out');
  });

  it('actionError() has sensible defaults', () => {
    const outcome = Outcomes.actionError();
    expect(outcome.isActionErrorOutcome).toBe(true);
    expect(outcome.isSuccess).toBe(false);
    expect(outcome.name).toBe('action-error');
  });

  it('actionError({ name }) uses provided name', () => {
    const outcome = Outcomes.actionError({ name: 'click-failed' });
    expect(outcome.name).toBe('click-failed');
  });
});
