// Minimal Playwright config for smoke test that loads local file:// UI
module.exports = {
  timeout: 30000,
  use: {
    headless: true,
    viewport: { width: 1280, height: 800 },
  },
  testDir: __dirname,
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
};
