const path = require('path');

const { test, expect } = require('@playwright/test');

test('preload exposes limited API and blocks unsafe channels (via Electron)', async ({
  playwright,
}) => {
  // Launch the Electron app so preload.js is executed
  const electronPath = path.join(__dirname, '..', 'electron', 'main.js');
  const cwd = path.join(__dirname, '..');

  const electronApp = await playwright._electron.launch({
    args: [electronPath],
    env: {
      TF_USE_EMBEDDED_BRAND: '0',
      TF_DISABLE_GZIP: '1',
      TF_LOG_DIR: path.join(cwd, 'logs', 'tmp_e2e'),
    },
    cwd: cwd,
  });

  try {
    const window = await electronApp.firstWindow();
    // Ensure window loaded
    await window.waitForLoadState('domcontentloaded');

    // Node integration must be disabled
    const hasRequire = await window.evaluate(() => typeof window.require !== 'undefined');
    expect(hasRequire).toBe(false);

    // Check TerraFusionAPI is present and methods are functions
    const apiType = await window.evaluate(() => typeof window.TerraFusionAPI);
    expect(apiType).toBe('object');

    const funcs = await window.evaluate(() => {
      const names = [
        'getSystemStatus',
        'apiCall',
        'costforgeValuation',
        'terraflowWorkflow',
        'terrafusionSync',
        'navigateTo',
        'onNavigate',
        'invoke',
        'send',
        'on',
      ];
      const res = {};
      for (const n of names)
        res[n] = typeof (window.TerraFusionAPI && window.TerraFusionAPI[n]) === 'function';
      return res;
    });
    for (const k of Object.keys(funcs)) expect(funcs[k]).toBe(true);

    // Generic invoke must throw when channel is forbidden (client-side guard in preload)
    const invokeThrows = await window.evaluate(() => {
      try {
        window.TerraFusionAPI.invoke('forbidden-channel');
        return { threw: false };
      } catch (e) {
        return { threw: true, msg: e && e.message ? e.message : String(e) };
      }
    });
    expect(invokeThrows.threw).toBe(true);
    expect(invokeThrows.msg).toContain('Forbidden ipc invoke channel');
  } finally {
    await electronApp.close();
  }
});
