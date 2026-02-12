const path = require('path');
const fs = require('fs');

const { test, expect } = require('@playwright/test');

test('canonical UI loads and shows TerraFusion branding', async ({ page }) => {
  const uiPath = path.join(__dirname, '..', 'ui', 'index.html');
  const fileUrl = `file://${uiPath}`;
  await page.goto(fileUrl);

  // Minimal stable check: document title
  const title = await page.title();
  expect(title.toLowerCase()).toContain('terrafusion');

  // Save screenshot artifact
  const artifactsDir = path.join(__dirname, '..', 'logs', 'artifacts');
  try {
    fs.mkdirSync(artifactsDir, { recursive: true });
  } catch (e) {}
  const shotPath = path.join(artifactsDir, 'renderer-screenshot.png');
  await page.screenshot({ path: shotPath, fullPage: true });
});
