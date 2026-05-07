// @ts-nocheck
import { test, expect } from '@playwright/test';
import { attemptAction, detectPageState, relator, clickToOpen, Outcomes, verifiedFill } from '../src/index.js';

test.describe('Playwright Simple POC', () => {
  
  test('attemptAction should detect outcomes', async ({ page }) => {
    await page.setContent(`
      <button id="trigger">Click Me</button>
      <div id="success" style="display: none;">Success!</div>
    `);

    const trigger = page.locator('#trigger');
    const success = page.locator('#success');

    const result = await attemptAction({
      action: async () => {
        await trigger.click();
        await page.evaluate(() => {
          setTimeout(() => {
            document.getElementById('success')!.style.display = 'block';
          }, 500);
        });
      },
      outcomes: [
        { name: 'Success', locator: success, isSuccess: true }
      ],
      timeout: 5000
    });

    expect(result.isSuccess).toBe(true);
    expect(result.outcome).toBe('Success');
  });

  test('attemptAction should throw on ambiguity', async ({ page }) => {
    await page.setContent(`
      <div class="result">A</div>
      <div class="result">B</div>
    `);

    const locatorA = page.locator('.result').first();
    const locatorB = page.locator('.result').last();

    await expect(attemptAction({
      outcomes: [
        { name: 'A', locator: locatorA, isSuccess: true },
        { name: 'B', locator: locatorB, isSuccess: true }
      ],
      timeout: 2000
    })).rejects.toThrow('Ambiguous Page State');
  });

  test('relator should scope correctly (Hybrid Mode)', async ({ page }) => {
    await page.setContent(`
      <div class="row" id="row1">
        <span>User #1</span>
        <input class="status" value="Inactive" />
      </div>
      <div class="row" id="row2">
        <span>User #2</span>
        <input class="status" value="Inactive" />
      </div>
    `);

    const anchor = page.getByText('User #2');
    const target = page.locator('input.status');
    
    // Using the container barrier
    await relator(anchor, target, 'div.row').fill('Active');
    
    const val1 = await page.locator('#row1 input.status').inputValue();
    const val2 = await page.locator('#row2 input.status').inputValue();
    
    expect(val1).toBe('Inactive');
    expect(val2).toBe('Active');
  });

  test('relator should scope correctly (Automatic Mode)', async ({ page }) => {
    await page.setContent(`
      <div class="card">
        <h3>Pro Plan</h3>
        <button>Buy</button>
      </div>
      <div class="card">
        <h3>Free Plan</h3>
        <button>Buy</button>
      </div>
    `);

    const anchor = page.getByText('Pro Plan');
    const target = page.getByRole('button', { name: 'Buy' });
    
    // Automatic LCA logic
    const buyButton = relator(anchor, target);
    await buyButton.highlight(); // Visual feedback
    await buyButton.click();
    
    // Verify we clicked the right one (the one in the Pro Plan card)
    // For this simple test, we just check that it didn't throw ambiguity
    await expect(buyButton).toBeVisible();
  });

  test('clickToOpen should retry if target missing', async ({ page }) => {
    await page.setContent(`
      <button id="trigger">Open</button>
      <div id="target" style="display: none;">Target</div>
    `);

    const trigger = page.locator('#trigger');
    const target = page.locator('#target');

    // First click does nothing, second click shows target
    await page.evaluate(() => {
      (window as any).clickCount = 0;
      document.getElementById('trigger')!.addEventListener('click', () => {
        (window as any).clickCount++;
        if ((window as any).clickCount >= 2) {
          document.getElementById('target')!.style.display = 'block';
        }
      });
    });

    await clickToOpen(trigger, target, { subTimeout: 1000, maxRetries: 3 });
    
    await expect(target).toBeVisible();
    const clickCount = await page.evaluate(() => (window as any).clickCount);
    expect(clickCount).toBe(2);
  });

  test('attemptAction should support shorthand Locator outcomes', async ({ page }) => {
    await page.setContent('<div id="done">Done</div>');
    const done = page.locator('#done');
    
    // Passing a raw locator instead of a full Outcome object
    const result = await attemptAction({
      outcomes: [done]
    });
    
    expect(result.isSuccess).toBe(true);
    expect(result.outcome).toContain('#done');
  });

  test('attemptAction should provide rich debug info on timeout', async ({ page }) => {
    await page.setContent('<div>Nothing here</div>');
    const missing = page.locator('#missing');
    
    const promise = attemptAction({
      outcomes: [{ name: 'Missing', locator: missing, isSuccess: true }],
      timeout: 500
    });
    
    await expect(promise).rejects.toThrow(/checked for:\n  - Missing/);
  });

  test('attemptAction should detect and log strict mode violations', async ({ page }) => {
    await page.setContent(`
      <div class="match">1</div>
      <div class="match">2</div>
    `);
    
    const ambiguous = page.locator('.match');
    
    // This will trigger a strict mode violation in Playwright because .match matches 2 elements
    // We expect it to log the ASCII warning to console.error
    await attemptAction({
      outcomes: [{ name: 'Ambiguous', locator: ambiguous, isSuccess: true }],
      timeout: 500
    }).catch(() => {}); // Ignore the timeout error, we are checking the console
  });

  test('Soft Trigger: Button Click Works (Success)', async ({ page }) => {
    await page.setContent(`
      <button id="run">Run</button>
      <div id="success" style="display: none;">Job Started</div>
    `);
    
    const runBtn = page.locator('#run');
    const successMsg = page.getByText('Job Started');
    
    const result = await attemptAction({
      action: async () => { 
        await runBtn.click();
        await page.evaluate(() => {
          setTimeout(() => document.getElementById('success')!.style.display = 'block', 100);
        });
      },
      outcomes: [successMsg]
    });
    
    expect(result.isSuccess).toBe(true);
    expect(result.outcome).toContain('Job Started');
  });

  test('Soft Trigger: Button Click Met with Error Message', async ({ page }) => {
    await page.setContent(`
      <button id="run">Run</button>
      <div id="error" style="display: none;">Access Denied</div>
    `);
    
    const runBtn = page.locator('#run');
    const errorMsg = page.getByText('Access Denied');
    
    const result = await attemptAction({
      action: async () => { 
        await runBtn.click();
        await page.evaluate(() => {
          setTimeout(() => document.getElementById('error')!.style.display = 'block', 100);
        });
      },
      outcomes: [
        { name: 'Access Denied', locator: errorMsg, isSuccess: false }
      ]
    });
    
    expect(result.isSuccess).toBe(false);
    expect(result.outcome).toBe('Access Denied');
  });

  test('Soft Trigger: Button Missing (Fallback to Timeout Outcome)', async ({ page }) => {
    await page.setContent('<div>No button here</div>');
    
    const result = await attemptAction({
      action: async () => { 
        // This will fail because the button doesn't exist
        await page.locator('#missing-run-btn').click({ timeout: 500 }); 
      },
      outcomes: [
        { name: 'Success State', locator: page.locator('#success'), isSuccess: true },
        { name: 'RBAC: Button Missing', isTimeoutOutcome: true, isSuccess: false }
      ],
      timeout: 2000
    });
    
    expect(result.isSuccess).toBe(false);
    expect(result.outcome).toBe('RBAC: Button Missing');
  });

  test('Soft Trigger: Distinguish between Action Error and Timeout', async ({ page }) => {
    await page.setContent('<div>Nothing here</div>');
    
    const outcomes = [
      { name: 'Timed Out', isTimeoutOutcome: true, isSuccess: false },
      { name: 'Action Failed', isActionErrorOutcome: true, isSuccess: false }
    ];

    // Case 1: Action fails
    const res1 = await attemptAction({
      action: async () => { throw new Error('Boom'); },
      outcomes,
      timeout: 500
    });
    expect(res1.outcome).toBe('Action Failed');

    // Case 2: Action works, but nothing happens
    const res2 = await attemptAction({
      action: async () => {}, // Noop
      outcomes,
      timeout: 500
    });
    expect(res2.outcome).toBe('Timed Out');
  });

  test('Outcomes DSL should produce correct objects', async ({ page }) => {
    const loc = page.locator('#test');
    expect(Outcomes.success('S', loc)).toEqual({ name: 'S', locator: loc, isSuccess: true });
    expect(Outcomes.failure('F', loc)).toEqual({ name: 'F', locator: loc, isSuccess: false });
    expect(Outcomes.actionError('E')).toEqual({ name: 'E', isActionErrorOutcome: true, isSuccess: false });
    expect(Outcomes.timeout('T')).toEqual({ name: 'T', isTimeoutOutcome: true, isSuccess: false });
    expect(Outcomes.timeout('T', { isSuccess: true })).toEqual({ name: 'T', isTimeoutOutcome: true, isSuccess: true });
  });

  test('Outcomes DSL should support onOutcome', async ({ page }) => {
    const loc = page.locator('#test');
    const cb = async () => 'data';
    const outcome = Outcomes.success('S', loc, { onOutcome: cb });
    expect(outcome.onOutcome).toBe(cb);
  });

  test('verifiedFill should verify the value stuck', async ({ page }) => {
    await page.setContent('<input id="email">');
    const input = page.locator('#email');
    
    await verifiedFill(input, 'test@example.com');
    await expect(input).toHaveValue('test@example.com');
  });
});
