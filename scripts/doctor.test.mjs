/**
 * TerraFusion OS - System Health Checker Tests
 *
 * Tests for `pnpm run doctor` health validation.
 *
 * Run: node --test scripts/doctor.test.mjs
 */

import assert from 'node:assert';
import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '..');

// ============================================================================
// Test Suite: Doctor Health Checks
// ============================================================================

describe('Doctor Health Checker', () => {
  describe('Contract', () => {
    it('exports runDoctor function', async () => {
      const doctorModule = await import('./doctor.mjs');
      assert.strictEqual(typeof doctorModule.runDoctor, 'function', 'runDoctor should be exported');
    });

    it('exports Check interface types', async () => {
      const doctorModule = await import('./doctor.mjs');
      assert.ok(doctorModule.checks, 'checks array should be exported');
      assert.ok(Array.isArray(doctorModule.checks), 'checks should be an array');
    });
  });

  describe('Version Checks', () => {
    it('detects Node version from package.json engines', async () => {
      const { checks } = await import('./doctor.mjs');
      const nodeCheck = checks.find(c => c.name === 'node-version');
      assert.ok(nodeCheck, 'node-version check should exist');

      const result = await nodeCheck.run();
      // Should pass (we're running on valid Node)
      assert.strictEqual(result.pass, true, 'Node version check should pass in test environment');
    });

    it('detects pnpm from package.json packageManager', async () => {
      const { checks } = await import('./doctor.mjs');
      const pnpmCheck = checks.find(c => c.name === 'pnpm-version');
      assert.ok(pnpmCheck, 'pnpm-version check should exist');

      const result = await pnpmCheck.run();
      // May pass or fail depending on environment, but should not throw
      assert.ok(result, 'pnpm check should return a result');
      assert.ok('pass' in result, 'result should have pass field');
    });
  });

  describe('Structure Checks', () => {
    it('validates required directories exist', async () => {
      const { checks } = await import('./doctor.mjs');
      const structureCheck = checks.find(c => c.name === 'directory-structure');
      assert.ok(structureCheck, 'directory-structure check should exist');

      const result = await structureCheck.run();
      if (!result.pass) {
        console.log('Structure check failed (expected in test):', result.message);
      }
      assert.ok(result, 'structure check should return a result');
    });
  });

  describe('Output Format', () => {
    it('prints ✅ healthy when all checks pass', async () => {
      const { runDoctor, checks } = await import('./doctor.mjs');

      // Mock checks that all pass
      const mockChecks = [
        { name: 'test-pass-1', run: async () => ({ pass: true, message: 'OK' }) },
        { name: 'test-pass-2', run: async () => ({ pass: true, message: 'OK' }) },
      ];

      let output = '';
      const mockLog = msg => {
        output += msg + '\n';
      };

      const exitCode = await runDoctor(mockChecks, { log: mockLog });

      assert.strictEqual(exitCode, 0, 'Should exit 0 when all checks pass');
      assert.ok(output.includes('✅'), 'Output should contain success indicator');
    });

    it('prints ❌ issues and exits non-zero when checks fail', async () => {
      const { runDoctor } = await import('./doctor.mjs');

      const mockChecks = [
        {
          name: 'test-fail',
          run: async () => ({
            pass: false,
            message: 'Test failure',
            fix: 'Run test fix command',
          }),
        },
      ];

      let output = '';
      const mockLog = msg => {
        output += msg + '\n';
      };

      const exitCode = await runDoctor(mockChecks, { log: mockLog });

      assert.strictEqual(exitCode, 1, 'Should exit non-zero when checks fail');
      assert.ok(output.includes('❌'), 'Output should contain failure indicator');
      assert.ok(output.includes('fix'), 'Output should contain fix instructions');
    });

    it('does not print sensitive environment values', async () => {
      const { checks } = await import('./doctor.mjs');
      const envCheck = checks.find(c => c.name === 'environment-check');

      if (envCheck) {
        // Set a sensitive var
        process.env.TEST_SECRET_KEY = 'super-secret-value';

        const result = await envCheck.run();

        assert.ok(
          !result.message.includes('super-secret-value'),
          'Check message should not include secret values'
        );

        delete process.env.TEST_SECRET_KEY;
      }
    });
  });

  describe('CLI Integration', () => {
    it('exits 0 when invoked directly and checks pass', async () => {
      const proc = spawn('node', ['scripts/doctor.mjs'], {
        cwd: REPO_ROOT,
        env: { ...process.env, DOCTOR_TEST_MODE: '1' },
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', data => {
        stdout += data.toString();
      });
      proc.stderr.on('data', data => {
        stderr += data.toString();
      });

      const exitCode = await new Promise((resolve, reject) => {
        proc.on('close', code => resolve(code));
        proc.on('error', err => reject(err));

        // Timeout after 5 seconds
        setTimeout(() => {
          proc.kill();
          reject(new Error('Doctor script timed out'));
        }, 5000);
      });

      // May exit 0 or 1 depending on actual system state
      // Just verify it completes without crash
      assert.ok(exitCode === 0 || exitCode === 1, `Should exit 0 or 1, got ${exitCode}`);
      assert.ok(stdout.length > 0 || stderr.length > 0, 'Should produce output');
    });
  });

  describe('Performance', () => {
    it('completes in under 2 seconds', async () => {
      const { runDoctor, checks } = await import('./doctor.mjs');

      const start = Date.now();
      await runDoctor(checks, { log: () => {} }); // silent
      const duration = Date.now() - start;

      assert.ok(duration < 2000, `Doctor should complete in <2s, took ${duration}ms`);
    });
  });
});
