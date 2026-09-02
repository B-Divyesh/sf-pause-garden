import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: 'line',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }, grep: /@mobile/ },
  ],
  webServer: [
    {
      command: 'DATABASE_PATH=/tmp/pause-garden-e2e.sqlite npm run dev:rooms',
      url: 'http://127.0.0.1:8787/health',
      // A production preview can use this port with the live room endpoint.
      // Refuse it instead of letting a browser claim silently test that build.
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: 'npm run build:test && BUILD_OUT_DIR=test-dist npm run preview',
      url: 'http://127.0.0.1:4173',
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
