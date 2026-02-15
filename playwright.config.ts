import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:5000',
    extraHTTPHeaders: {
      'Content-Type': 'application/json',
    },
  },
  projects: [
    {
      name: 'evendi-api',
      testMatch: /evendi.*\.spec\.ts/,
      use: { baseURL: 'http://localhost:5000' },
    },
    {
      name: 'creatorhub-api',
      testMatch: /creatorhub.*\.spec\.ts/,
      use: { baseURL: 'http://localhost:3001' },
    },
    {
      name: 'bridge-api',
      testMatch: /bridge.*\.spec\.ts/,
      use: { baseURL: 'http://localhost:5000' },
    },
  ],
});
