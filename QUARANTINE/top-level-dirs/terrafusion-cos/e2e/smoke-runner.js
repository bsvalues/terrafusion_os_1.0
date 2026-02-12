// Simple Puppeteer smoke test: start brand server (external) then verify DOM
const { spawn } = require('child_process');
const path = require('path');

const puppeteer = require('puppeteer');

(async () => {
  const brandPort = process.env.TF_BRAND_PORT || 49153;
  const brandUrl = `http://localhost:${brandPort}/webgl-transcendence-complete.html`;

  // Start the brand server using the provided script
  const serverProcess = spawn(
    process.execPath,
    [path.join(__dirname, '..', 'electron', 'serve_brand.js')],
    {
      env: { ...process.env, TF_BRAND_PORT: brandPort },
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  );

  serverProcess.stdout.on('data', d => process.stdout.write(`[brand-server] ${d}`));
  serverProcess.stderr.on('data', d => process.stderr.write(`[brand-server-err] ${d}`));

  // wait for health
  const waitForHealth = async (retries = 20, delay = 300) => {
    for (let i = 0; i < retries; i++) {
      try {
        const res = await fetch(`http://localhost:${brandPort}/__health`);
        if (res.ok) return true;
      } catch (e) {}
      await new Promise(r => setTimeout(r, delay));
    }
    return false;
  };

  // use global fetch (node 18+) or require node-fetch if unavailable
  if (typeof fetch === 'undefined')
    global.fetch = (...args) => import('node-fetch').then(m => m.default(...args));

  const healthy = await waitForHealth();
  if (!healthy) {
    console.error('Brand server did not become healthy in time');
    process.exit(2);
  }

  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  const res = await page.goto(brandUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });

  if (!res || res.status() !== 200) {
    console.error('Failed to load brand page, status:', res && res.status());
    await browser.close();
    serverProcess.kill();
    process.exit(3);
  }

  // Checks:
  // - headline contains Government. Transcended.
  // - transcendence-badge exists
  // - speed metric exists and is non-empty
  const headline = await page.$eval('.hero-headline', el => el.textContent.trim());
  const badge = (await page.$('.transcendence-badge')) !== null;
  const speedMetric = await page.$eval('#speed-metric', el => el.textContent.trim());

  console.log('Headline:', headline);
  console.log('Badge present:', !!badge);
  console.log('Speed metric:', speedMetric);

  if (headline !== 'Government. Transcended.' || !badge || !speedMetric) {
    console.error('Smoke checks failed');
    await browser.close();
    serverProcess.kill();
    process.exit(4);
  }

  console.log('Smoke test passed');
  await browser.close();
  serverProcess.kill();
  process.exit(0);
})();
