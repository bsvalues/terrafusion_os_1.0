const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("http://localhost:5173/dais", { waitUntil: "networkidle", timeout: 20000 });
  await page.waitForTimeout(1000);
  await page.locator("text=TerraLevy").first().click();
  await page.waitForTimeout(4000);
  await page.screenshot({ path: "proof_levy_window.png", fullPage: false });
  // Check iframe content
  const frames = page.frames();
  console.log("Frame count:", frames.length);
  for (const f of frames) {
    console.log("Frame URL:", f.url());
    try {
      const t = await f.evaluate(() => document.body?.innerText?.substring(0, 300));
      if (t && t.length > 5) console.log("Frame text:", t);
    } catch(e) { console.log("Frame eval error:", e.message); }
  }
  // Check for error message in main page
  const errEl = await page.locator("text=not registered").count();
  const errEl2 = await page.locator("text=app server running").count();
  const errEl3 = await page.locator("text=Failed to load").count();
  console.log("Error indicators:", { notRegistered: errEl, appServer: errEl2, failedToLoad: errEl3 });
  await browser.close();
})();
