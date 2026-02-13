/**
 * TerraFusion OS - Phase 10 SDUI Parse Tests
 *
 * Tests that the SDUI module:
 *   1. Parses cleanly (no syntax errors)
 *   2. Exports expected symbols (registerSduiCommand, validateSchema, etc.)
 *   3. Has proper TypeScript types that compile
 *
 * This is a **regression guard** against the template literal corruption
 * that broke Phase 10 SDUI in commit 9f2c2aec4.
 *
 * Run: node --test os-platform/core/tests/phase10-sdui.parse.test.mjs
 */

import assert from 'node:assert';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const repoRoot = resolve(__dirname, '../../../');

describe('Phase 10 - SDUI Module Parse Tests', () => {
  it('sdui module exists and can be imported', async () => {
    const sduiPath = resolve(repoRoot, 'tools/tdc/cli/dist/commands/sdui.js');
    const sduiUrl = `file:///${sduiPath.replace(/\\/g, '/')}`;

    try {
      const sdui = await import(sduiUrl);
      assert.ok(sdui, 'SDUI module should export an object');
    } catch (err) {
      if (err.code === 'ERR_MODULE_NOT_FOUND') {
        assert.fail('SDUI module not found - did TDC CLI build fail?');
      }
      throw err;
    }
  });

  it('sdui module exports registerSduiCommand function', async () => {
    const sduiPath = resolve(repoRoot, 'tools/tdc/cli/dist/commands/sdui.js');
    const sduiUrl = `file:///${sduiPath.replace(/\\/g, '/')}`;
    const sdui = await import(sduiUrl);

    assert.ok(
      typeof sdui.registerSduiCommand === 'function',
      'registerSduiCommand should be a function'
    );
  });

  it('sdui module exports validateSchema function', async () => {
    const sduiPath = resolve(repoRoot, 'tools/tdc/cli/dist/commands/sdui.js');
    const sduiUrl = `file:///${sduiPath.replace(/\\/g, '/')}`;
    const sdui = await import(sduiUrl);

    assert.ok(typeof sdui.validateSchema === 'function', 'validateSchema should be a function');
  });

  it('sdui module exports previewSchema function', async () => {
    const sduiPath = resolve(repoRoot, 'tools/tdc/cli/dist/commands/sdui.js');
    const sduiUrl = `file:///${sduiPath.replace(/\\/g, '/')}`;
    const sdui = await import(sduiUrl);

    assert.ok(typeof sdui.previewSchema === 'function', 'previewSchema should be a function');
  });

  it('sdui module exports component allowlist', async () => {
    const sduiPath = resolve(repoRoot, 'tools/tdc/cli/dist/commands/sdui.js');
    const sduiUrl = `file:///${sduiPath.replace(/\\/g, '/')}`;
    const sdui = await import(sduiUrl);

    // Should export ALLOWED_COMPONENTS or similar
    assert.ok(
      sdui.ALLOWED_COMPONENTS || sdui.COMPONENT_CONTRACTS,
      'Should export component allowlist or contracts'
    );
  });
});

describe('Phase 10 - TypeScript Compilation Guard', () => {
  it('sdui.ts compiles without syntax errors', async () => {
    // This test ensures that if someone commits broken TypeScript,
    // the test suite catches it before merge.

    const { execSync } = await import('child_process');
    const tdcCliDir = resolve(repoRoot, 'tools/tdc/cli');

    try {
      // Build the entire TDC CLI (uses local tsconfig.json)
      execSync('npx tsc --noEmit', {
        cwd: tdcCliDir,
        encoding: 'utf8',
        stdio: 'pipe',
      });

      assert.ok(true, 'TypeScript compilation passed');
    } catch (err) {
      assert.fail(`TypeScript compilation failed:\n${err.stdout || err.message}`);
    }
  });
});
