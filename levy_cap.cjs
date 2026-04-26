const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173/gen2/terralevy', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'terralevy_current.png' });
  const text = await page.evaluate(() => document.body.innerText.substring(0, 800));
  console.log('VISIBLE:', text);
  await browser.close();
})();
