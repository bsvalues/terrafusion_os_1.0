const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("http://localhost:5173/dais", { waitUntil: "networkidle", timeout: 20000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "proof_dais.png" });
  const daisText = await page.evaluate(() => document.body.innerText.substring(0, 300));
  console.log("DAIS:", daisText);
  const count = await page.locator("text=TerraLevy").count();
  console.log("TerraLevy tiles found:", count);
  if (count > 0) {
    await page.locator("text=TerraLevy").first().click();
    await page.waitForTimeout(3500);
    await page.screenshot({ path: "proof_after_click.png" });
    const afterText = await page.evaluate(() => document.body.innerText.substring(0, 500));
    console.log("AFTER CLICK URL:", page.url());
    console.log("AFTER CLICK TEXT:", afterText);
  }
  await browser.close();
})();
