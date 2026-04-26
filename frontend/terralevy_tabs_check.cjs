const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:5173/gen2/terralevy', { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(4000);
  const body = await page.evaluate(() => document.body.innerText);
  const labels = ['Overview', 'Levies', 'Districts & Rates', 'Budget', 'Reference & Compliance', 'Certification', 'Data Quality']
    .filter(label => body.includes(label));
  console.log('TABS:', labels.join(' | '));
  await page.screenshot({ path: 'terralevy_tabs_restored.png' });
  await browser.close();
})();
