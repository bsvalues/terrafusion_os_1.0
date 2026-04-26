const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:5173/gen2/terralevy', { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(2500);
  const text = await page.evaluate(() => document.body.innerText.substring(0, 1200));
  console.log(text);
  await browser.close();
})();
