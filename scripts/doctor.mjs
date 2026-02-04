#!/usr/bin/env node
/**
 * TerraFusion OS - System Health Checker
 *
 * Validates that a clean checkout is correctly configured and healthy.
 * Read-only, fast (<2s), actionable output.
 *
 * Usage:
 *   node scripts/doctor.mjs
 *   pnpm run doctor
 */

import { readFile, access } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { env, exit, version as nodeVersion } from 'node:process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '..');

// ============================================================================
// Result Type
// ============================================================================

/**
 * @typedef {Object} CheckResult
 * @property {boolean} pass - Whether the check passed
 * @property {string} message - Human-readable message
 * @property {string} [fix] - Optional fix instructions
 */

/**
 * @typedef {Object} Check
 * @property {string} name - Check identifier
 * @property {() => Promise<CheckResult>} run - Execute the check
 */

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if a path exists
 */
async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Parse semver-style version string
 */
function parseSemver(versionStr) {
  const match = versionStr.match(/(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    original: versionStr,
  };
}

/**
 * Check if version satisfies a range like ">=18.0.0 <25.0.0"
 */
function satisfiesRange(version, rangeStr) {
  const v = parseSemver(version);
  if (!v) return false;

  // Parse range: ">=18.0.0 <25.0.0"
  const parts = rangeStr.trim().split(/\s+/);

  for (const part of parts) {
    const gteMatch = part.match(/^>=(\d+\.\d+\.\d+)$/);
    const ltMatch = part.match(/^<(\d+\.\d+\.\d+)$/);
    const eqMatch = part.match(/^(\d+\.\d+\.\d+)$/);

    if (gteMatch) {
      const min = parseSemver(gteMatch[1]);
      if (
        v.major < min.major ||
        (v.major === min.major && v.minor < min.minor) ||
        (v.major === min.major && v.minor === min.minor && v.patch < min.patch)
      ) {
        return false;
      }
    } else if (ltMatch) {
      const max = parseSemver(ltMatch[1]);
      if (
        v.major > max.major ||
        (v.major === max.major && v.minor > max.minor) ||
        (v.major === max.major && v.minor === max.minor && v.patch >= max.patch)
      ) {
        return false;
      }
    } else if (eqMatch) {
      const exact = parseSemver(eqMatch[1]);
      if (v.major !== exact.major || v.minor !== exact.minor || v.patch !== exact.patch) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Get command version safely
 */
function getCommandVersion(command, args = ['--version']) {
  try {
    const output = execSync(`${command} ${args.join(' ')}`, {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return output;
  } catch {
    return null;
  }
}

// ============================================================================
// Health Checks
// ============================================================================

/**
 * Check 1: Node.js version
 */
const nodeVersionCheck = {
  name: 'node-version',
  run: async () => {
    try {
      const pkgPath = resolve(REPO_ROOT, 'package.json');
      const pkgContent = await readFile(pkgPath, 'utf-8');
      const pkg = JSON.parse(pkgContent);

      const requiredRange = pkg.engines?.node;
      if (!requiredRange) {
        return {
          pass: true,
          message: 'Node.js version: no constraint in package.json',
        };
      }

      const currentVersion = nodeVersion; // e.g. "v20.10.0"
      const cleanVersion = currentVersion.replace(/^v/, '');

      if (satisfiesRange(cleanVersion, requiredRange)) {
        return {
          pass: true,
          message: `Node.js ${cleanVersion} ✓ (required: ${requiredRange})`,
        };
      } else {
        return {
          pass: false,
          message: `Node.js ${cleanVersion} does not satisfy ${requiredRange}`,
          fix: `Install Node.js in range ${requiredRange}. Recommended: use .nvmrc or .tool-versions.`,
        };
      }
    } catch (err) {
      return {
        pass: false,
        message: `Failed to check Node.js version: ${err.message}`,
        fix: 'Ensure package.json exists and is valid JSON.',
      };
    }
  },
};

/**
 * Check 2: pnpm version
 */
const pnpmVersionCheck = {
  name: 'pnpm-version',
  run: async () => {
    try {
      const pkgPath = resolve(REPO_ROOT, 'package.json');
      const pkgContent = await readFile(pkgPath, 'utf-8');
      const pkg = JSON.parse(pkgContent);

      const packageManager = pkg.packageManager; // e.g. "pnpm@9.0.0"
      if (!packageManager || !packageManager.startsWith('pnpm@')) {
        return {
          pass: true,
          message: 'pnpm: no version constraint in package.json',
        };
      }

      const requiredVersion = packageManager.replace('pnpm@', '');
      const pnpmVersionOutput = getCommandVersion('pnpm', ['--version']);

      if (!pnpmVersionOutput) {
        return {
          pass: false,
          message: 'pnpm is not installed or not in PATH',
          fix: `Install pnpm ${requiredVersion}: npm install -g pnpm@${requiredVersion}`,
        };
      }

      const installedVersion = pnpmVersionOutput.trim();
      const requiredSemver = parseSemver(requiredVersion);
      const installedSemver = parseSemver(installedVersion);

      if (!installedSemver) {
        return {
          pass: false,
          message: `Could not parse pnpm version: ${installedVersion}`,
          fix: 'Reinstall pnpm.',
        };
      }

      // Exact match or compatible
      if (
        installedSemver.major === requiredSemver.major &&
        installedSemver.minor >= requiredSemver.minor
      ) {
        return {
          pass: true,
          message: `pnpm ${installedVersion} ✓ (required: ${requiredVersion})`,
        };
      } else {
        return {
          pass: false,
          message: `pnpm ${installedVersion} incompatible with ${requiredVersion}`,
          fix: `Install pnpm ${requiredVersion}: npm install -g pnpm@${requiredVersion}`,
        };
      }
    } catch (err) {
      return {
        pass: false,
        message: `Failed to check pnpm version: ${err.message}`,
        fix: 'Ensure pnpm is installed and package.json is valid.',
      };
    }
  },
};

/**
 * Check 3: Required directory structure
 */
const directoryStructureCheck = {
  name: 'directory-structure',
  run: async () => {
    const requiredDirs = [
      'os-platform',
      'os-platform/core',
      'scripts',
      'docs',
      'docs/ops',
      '.github',
      '.github/workflows',
    ];

    const missing = [];
    for (const dir of requiredDirs) {
      const fullPath = resolve(REPO_ROOT, dir);
      if (!(await pathExists(fullPath))) {
        missing.push(dir);
      }
    }

    if (missing.length === 0) {
      return {
        pass: true,
        message: `Directory structure ✓ (${requiredDirs.length} required paths exist)`,
      };
    } else {
      return {
        pass: false,
        message: `Missing required directories: ${missing.join(', ')}`,
        fix: 'Ensure you are in the repository root and the repo is fully cloned.',
      };
    }
  },
};

/**
 * Check 4: Required files exist
 */
const requiredFilesCheck = {
  name: 'required-files',
  run: async () => {
    const requiredFiles = [
      'package.json',
      'tsconfig.core.json',
      'AGENTS.md',
      'os-platform/core/index.ts',
      'scripts/wave1-preflight.ps1',
      'scripts/wave1-freeze-guard.ps1',
    ];

    const missing = [];
    for (const file of requiredFiles) {
      const fullPath = resolve(REPO_ROOT, file);
      if (!(await pathExists(fullPath))) {
        missing.push(file);
      }
    }

    if (missing.length === 0) {
      return {
        pass: true,
        message: `Required files ✓ (${requiredFiles.length} critical files exist)`,
      };
    } else {
      return {
        pass: false,
        message: `Missing required files: ${missing.join(', ')}`,
        fix: 'Ensure repository is fully cloned and not corrupted.',
      };
    }
  },
};

/**
 * Check 5: Environment check (optional vars only)
 */
const environmentCheck = {
  name: 'environment-check',
  run: async () => {
    // Check for known incompatible env vars (do not print values)
    const forbidden = [];

    // Example: check for CI=true in local dev (if you don't want local to think it's CI)
    // if (env.CI === 'true' && !env.GITHUB_ACTIONS) {
    //   forbidden.push('CI=true (set outside of CI environment)');
    // }

    // Zone A protection flag check (should not be set in normal dev)
    if (env.WAVE1_TEMPLATE_OVERRIDE === '1') {
      forbidden.push('WAVE1_TEMPLATE_OVERRIDE=1 (should only be set with explicit approval)');
    }

    if (forbidden.length > 0) {
      return {
        pass: false,
        message: `Incompatible environment variables detected: ${forbidden.join(', ')}`,
        fix: 'Unset the listed environment variables or review .env files.',
      };
    }

    return {
      pass: true,
      message: 'Environment ✓ (no incompatible variables detected)',
    };
  },
};

// ============================================================================
// Check Registry
// ============================================================================

export const checks = [
  nodeVersionCheck,
  pnpmVersionCheck,
  directoryStructureCheck,
  requiredFilesCheck,
  environmentCheck,
];

// ============================================================================
// Doctor Orchestrator
// ============================================================================

/**
 * Run all health checks and report results
 * @param {Check[]} checksToRun - Array of checks to execute
 * @param {Object} options - Options
 * @param {Function} options.log - Logger function (default: console.log)
 * @returns {Promise<number>} Exit code (0 = healthy, 1 = issues)
 */
export async function runDoctor(checksToRun = checks, options = {}) {
  const log = options.log || console.log;
  const startTime = Date.now();

  log('');
  log('╔══════════════════════════════════════════════════════════════╗');
  log('║        TERRAFUSION OS: SYSTEM HEALTH CHECK                   ║');
  log('╚══════════════════════════════════════════════════════════════╝');
  log('');

  const results = [];

  for (const check of checksToRun) {
    try {
      const result = await check.run();
      results.push({ check: check.name, ...result });
    } catch (error) {
      results.push({
        check: check.name,
        pass: false,
        message: `Check threw error: ${error.message}`,
        fix: 'Review check implementation or system state.',
      });
    }
  }

  const duration = Date.now() - startTime;
  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;

  // Print results
  for (const result of results) {
    const icon = result.pass ? '✅' : '❌';
    log(`${icon} ${result.message}`);

    if (!result.pass && result.fix) {
      log(`   Fix: ${result.fix}`);
    }
  }

  log('');
  log('═══════════════════════════════════════════════════════════════');
  log('');
  log(`  Checks passed: ${passed}/${results.length}`);
  log(`  Checks failed: ${failed}/${results.length}`);
  log(`  Duration: ${duration}ms`);
  log('');

  if (failed === 0) {
    log('  ╔═══════════════════════════════════════╗');
    log('  ║            ✅ SYSTEM HEALTHY          ║');
    log('  ╚═══════════════════════════════════════╝');
    log('');
    log('  Ready to ship. Government. Transcended.');
    log('');
    return 0;
  } else {
    log('  ╔═══════════════════════════════════════╗');
    log('  ║          ❌ ISSUES DETECTED           ║');
    log('  ╚═══════════════════════════════════════╝');
    log('');
    log('  Fix the issues above before proceeding.');
    log('');
    return 1;
  }
}

// ============================================================================
// CLI Entrypoint
// ============================================================================

// Only run if invoked directly (not imported)
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('doctor.mjs')) {
  runDoctor()
    .then(code => exit(code))
    .catch(err => {
      console.error('❌ Doctor failed with unhandled error:', err);
      exit(2);
    });
}
