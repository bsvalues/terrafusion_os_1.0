#!/usr/bin/env node
// TerraFusion Local Agent Cockpit — pre-pack preflight.
//
// Pure-node, no third-party deps, no network. Exits 0 when the cockpit is
// safe to hand to electron-builder, non-zero with a clear message
// otherwise. Re-usable from CI and from the founder's terminal.
//
// Usage:
//   node scripts/preflight.mjs            # human output
//   node scripts/preflight.mjs --json     # machine output
//
// API (for tests):
//   import { runPreflight } from './preflight.mjs';
//   const result = await runPreflight({ cockpitDir });
//   // result === { ok: boolean, errors: string[], checks: string[] }

'use strict';

import { readFileSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REQUIRED_SOURCE_FILES = [
  'main.js',
  'preload.js',
  'chatBus.js',
  'package.json',
  'renderer/index.html',
  'renderer/index.css',
  'renderer/index.js',
];

const PINNED_DEV_DEPS = ['electron', 'electron-builder'];

const FORBIDDEN_PACKAGE_PATTERNS = [
  /\.env\b/,
  /(?:^|[/\\])\.git(?:[/\\]|$)/,
  /(?:^|[/\\])node_modules(?:[/\\].*)?$/, // bare node_modules pattern
];

const REQUIRED_BUILD_FILES = [
  'main.js',
  'preload.js',
  'chatBus.js',
  'renderer/**/*',
  'package.json',
];

export async function runPreflight({ cockpitDir } = {}) {
  if (!cockpitDir) {
    throw new Error('runPreflight: cockpitDir is required');
  }
  const errors = [];
  const checks = [];
  const fail = (msg) => errors.push(msg);
  const pass = (msg) => checks.push(msg);

  // 1. All required source files exist.
  for (const rel of REQUIRED_SOURCE_FILES) {
    const p = path.join(cockpitDir, rel);
    if (!existsSync(p)) {
      fail(`Missing required cockpit source: ${rel}`);
      continue;
    }
    try {
      if (!statSync(p).isFile()) fail(`Cockpit source must be a file: ${rel}`);
    } catch (e) {
      fail(`Could not stat ${rel}: ${e.message}`);
    }
  }
  pass(`source-files: ${REQUIRED_SOURCE_FILES.length} required paths checked`);

  // 2. package.json is parseable JSON and has the required build block.
  let pkg = null;
  try {
    pkg = JSON.parse(readFileSync(path.join(cockpitDir, 'package.json'), 'utf8'));
  } catch (e) {
    fail(`package.json is not valid JSON: ${e.message}`);
  }

  if (pkg) {
    if (!pkg.build || typeof pkg.build !== 'object') {
      fail('package.json is missing the "build" block (electron-builder config)');
    } else {
      const b = pkg.build;
      if (!b.appId || !/^[a-z0-9.-]+$/i.test(b.appId)) {
        fail('build.appId missing or not reverse-DNS-shaped');
      }
      if (!b.productName || typeof b.productName !== 'string') {
        fail('build.productName missing');
      }
      if (!b.directories || b.directories.output !== 'dist') {
        fail('build.directories.output must be "dist"');
      }
      if (b.asar !== true) fail('build.asar must be true');
      if (b.publish !== null) fail('build.publish must be null (no auto-release)');
      if (b.forceCodeSigning === true) {
        fail('build.forceCodeSigning must NOT be true (founder cert may not exist)');
      }
      const filesGlob = Array.isArray(b.files) ? b.files : [];
      // 3. Required entries present in files glob.
      for (const required of REQUIRED_BUILD_FILES) {
        if (!filesGlob.includes(required)) {
          fail(`build.files must include "${required}"`);
        }
      }
      // 4. No forbidden include patterns (we allow exclude lines starting with !).
      for (const entry of filesGlob) {
        if (typeof entry !== 'string') {
          fail(`build.files contains non-string entry: ${JSON.stringify(entry)}`);
          continue;
        }
        if (entry.startsWith('!')) continue; // excludes are fine
        for (const bad of FORBIDDEN_PACKAGE_PATTERNS) {
          if (bad.test(entry)) {
            fail(`build.files include "${entry}" matches forbidden pattern ${bad}`);
          }
        }
      }
      // 5. No remote URLs anywhere in build config.
      const serialized = JSON.stringify(b);
      if (/https?:\/\//i.test(serialized)) {
        fail('build config must not contain remote URLs');
      }
      pass('build-config: appId, productName, output, asar, publish, files, no-remote');
    }

    // 6. devDependencies pinned.
    const devDeps = pkg.devDependencies || {};
    for (const name of PINNED_DEV_DEPS) {
      const v = devDeps[name];
      if (!v) {
        fail(`devDependencies.${name} missing`);
      } else if (!/^\d+\.\d+\.\d+$/.test(v)) {
        fail(`devDependencies.${name} must be a pinned semver (got "${v}")`);
      }
    }
    // 7. Same packages MUST NOT appear in runtime deps.
    const runtimeDeps = pkg.dependencies || {};
    for (const name of PINNED_DEV_DEPS) {
      if (name in runtimeDeps) {
        fail(`${name} must NEVER be in runtime dependencies`);
      }
    }
    pass(`deps: ${PINNED_DEV_DEPS.join(', ')} pinned and devDep-only`);
  }

  // 8. node --check on JS sources.
  const jsTargets = ['main.js', 'preload.js', 'chatBus.js', 'renderer/index.js'];
  for (const rel of jsTargets) {
    const full = path.join(cockpitDir, rel);
    if (!existsSync(full)) continue; // already reported above
    const r = spawnSync(process.execPath, ['--check', full], { encoding: 'utf8' });
    if (r.status !== 0) {
      fail(`node --check failed on ${rel}: ${(r.stderr || r.stdout).trim()}`);
    }
  }
  pass(`node-check: ${jsTargets.length} JS sources parsed`);

  // 9. Renderer HTML invariants.
  const htmlPath = path.join(cockpitDir, 'renderer', 'index.html');
  if (existsSync(htmlPath)) {
    const html = readFileSync(htmlPath, 'utf8');
    if (!/<meta\s+http-equiv="Content-Security-Policy"/i.test(html)) {
      fail('renderer/index.html missing CSP meta tag');
    }
    if (!/default-src\s+'self'/.test(html)) {
      fail('renderer CSP must include default-src \'self\'');
    }
    if (!/connect-src\s+'none'/.test(html)) {
      fail('renderer CSP must include connect-src \'none\'');
    }
    // No remote script/link URLs.
    if (/<script[^>]*\ssrc=["'](https?:)?\/\//i.test(html)) {
      fail('renderer must not load remote scripts');
    }
    if (/<link[^>]*\shref=["'](https?:)?\/\//i.test(html)) {
      fail('renderer must not load remote stylesheets');
    }
    pass('renderer-html: CSP locked, no remote assets');
  }

  // 10. main.js security flags.
  const mainPath = path.join(cockpitDir, 'main.js');
  if (existsSync(mainPath)) {
    const main = readFileSync(mainPath, 'utf8');
    if (!/contextIsolation\s*:\s*true/.test(main)) {
      fail('main.js: contextIsolation must be true');
    }
    if (!/nodeIntegration\s*:\s*false/.test(main)) {
      fail('main.js: nodeIntegration must be false');
    }
    if (!/sandbox\s*:\s*true/.test(main)) {
      fail('main.js: sandbox must be true');
    }
    pass('main-security: contextIsolation, nodeIntegration, sandbox');
  }

  return { ok: errors.length === 0, errors, checks };
}

function defaultCockpitDir() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, '..');
}

const isMain = (() => {
  try {
    return path.resolve(process.argv[1] || '') === path.resolve(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
})();

if (isMain) {
  const json = process.argv.includes('--json');
  const cockpitDir = defaultCockpitDir();
  runPreflight({ cockpitDir }).then((result) => {
    if (json) {
      process.stdout.write(JSON.stringify(result, null, 2) + '\n');
    } else {
      for (const c of result.checks) process.stdout.write(`[ok]   ${c}\n`);
      for (const e of result.errors) process.stderr.write(`[fail] ${e}\n`);
      process.stdout.write(
        `\nPreflight: ${result.ok ? 'PASS' : 'FAIL'} ` +
          `(${result.checks.length} checks, ${result.errors.length} errors)\n`,
      );
    }
    process.exit(result.ok ? 0 : 1);
  }).catch((err) => {
    process.stderr.write(`Preflight crashed: ${err.stack || err.message}\n`);
    process.exit(2);
  });
}
