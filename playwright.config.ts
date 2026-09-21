import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // PW_NO_SERVER=1 skips the lab dev server for specs that don't need it
  // (e.g. tests/wait.spec.ts).
  ...(process.env.PW_NO_SERVER
    ? {}
    : {
        webServer: {
          command: 'pnpm --dir lab dev',
          url: 'http://localhost:5173',
          reuseExistingServer: !process.env.CI,
          timeout: 30_000,
        },
      }),
});
