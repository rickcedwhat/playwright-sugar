import { describe, it, expect } from 'vitest';
import { Outcomes } from './outcomes.js';

describe('Outcomes DSL', () => {
  const mockLocator = {} as any;

  it('should create a success outcome', () => {
    const outcome = Outcomes.success('test-success', mockLocator);
    expect(outcome.name).toBe('test-success');
    expect(outcome.isSuccess).toBe(true);
    expect(outcome.locator).toBe(mockLocator);
  });

  it('should create a failure outcome', () => {
    const outcome = Outcomes.failure('test-fail', mockLocator);
    expect(outcome.name).toBe('test-fail');
    expect(outcome.isSuccess).toBe(false);
  });

  it('should create an action error outcome', () => {
    const outcome = Outcomes.actionError('test-error');
    expect(outcome.isActionErrorOutcome).toBe(true);
    expect(outcome.isSuccess).toBe(false);
  });

  it('should create a timeout outcome', () => {
    const outcome = Outcomes.timeout('test-timeout');
    expect(outcome.isTimeoutOutcome).toBe(true);
    expect(outcome.isSuccess).toBe(false);
  });
});
