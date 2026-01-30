/**
 * Contract tests for run_with_log.mjs
 * Ensures security hardening remains intact across changes
 *
 * Run: node scripts/ci/run_with_log.contract.test.mjs
 */

import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const scriptPath = join(__dirname, 'run_with_log.mjs');

let passed = 0;
let failed = 0;

function runTest(name, args, expectedExitCode, stderrContains = null, stderrNotContains = null) {
  return new Promise(resolve => {
    const child = spawn('node', [scriptPath, ...args], {
      shell: false,
      stdio: ['inherit', 'pipe', 'pipe'],
    });

    let stderr = '';
    child.stderr.on('data', d => (stderr += d.toString()));
    child.stdout.on('data', () => {}); // drain

    child.on('close', code => {
      const checks = [];

      // Check exit code
      if (code !== expectedExitCode) {
        checks.push(`Expected exit code ${expectedExitCode}, got ${code}`);
      }

      // Check stderr contains expected string
      if (stderrContains && !stderr.includes(stderrContains)) {
        checks.push(`Expected stderr to contain "${stderrContains}", got: ${stderr.slice(0, 200)}`);
      }

      // Check stderr does NOT contain forbidden string
      if (stderrNotContains && stderr.includes(stderrNotContains)) {
        checks.push(`Expected stderr NOT to contain "${stderrNotContains}", but it did`);
      }

      if (checks.length === 0) {
        console.log(`✅ ${name}`);
        passed++;
      } else {
        console.log(`❌ ${name}`);
        checks.forEach(c => console.log(`   ${c}`));
        failed++;
      }

      resolve();
    });
  });
}

async function main() {
  console.log('🔒 run_with_log.mjs Contract Tests\n');

  // === ALLOWLIST TESTS ===
  await runTest(
    'Blocks unauthorized command (curl)',
    ['curl', '--version'],
    2, // Exit code 2 for security rejections
    'not in the allowed list'
  );

  await runTest('Allows pnpm command', ['pnpm', '--version'], 0, 'allowed_cmd=pnpm');

  await runTest('Allows echo command', ['echo', 'hello'], 0, 'allowed_cmd=echo');

  // === DANGEROUS CHARS REJECTION ===
  await runTest(
    'Rejects % character (cmd variable expansion)',
    ['echo', '%PATH%'],
    2, // Exit code 2 for security rejections
    'dangerous characters'
  );

  await runTest(
    'Rejects ! character (delayed expansion)',
    ['echo', 'hello!world'],
    2, // Exit code 2 for security rejections
    'dangerous characters'
  );

  // === SECRET REDACTION ===
  await runTest(
    'Redacts --token=secret form',
    ['echo', '--token=secret123'],
    0,
    '***REDACTED***',
    'secret123'
  );

  await runTest(
    'Redacts --token secret (two-arg) form',
    ['echo', '--token', 'secret123'],
    0,
    '***REDACTED***',
    'secret123'
  );

  await runTest(
    'Redacts --password=value form',
    ['echo', '--password=hunter2'],
    0,
    '***REDACTED***',
    'hunter2'
  );

  await runTest(
    'Redacts Authorization Bearer header',
    ['echo', '-H', 'Authorization: Bearer abc123'],
    0,
    'Bearer ***REDACTED***',
    'abc123'
  );

  // === QUOTING TESTS ===
  await runTest('Handles spaces in args', ['echo', 'hello world'], 0, '"hello world"');

  await runTest('Handles & character (cmd operator)', ['echo', 'a&b'], 0, '"a&b"');

  // === SUMMARY ===
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
