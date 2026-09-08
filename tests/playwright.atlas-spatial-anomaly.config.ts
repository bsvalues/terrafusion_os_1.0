import { defineConfig } from '@playwright/test';
import { randomUUID } from 'node:crypto';

export default defineConfig({
  testDir: './e2e',
  testMatch: 'atlas-spatial-anomaly.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60000,
  // Playwright clears its outputDir: assign a fresh leaf, never the retained DB/log parent.
  outputDir: `../artifacts/atlas-browser/run-results-${randomUUID()}/playwright`,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:5013',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  // Opt-in harness starts only the coordinator-reserved actual API/Pilot. No mock webServer.
});
