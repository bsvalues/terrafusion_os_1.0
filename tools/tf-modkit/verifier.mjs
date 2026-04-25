/**
 * tf-modkit — Post-Conversion Verifier
 * ======================================
 * Runs verification checks after a package conversion.
 * Read-only — reports pass/fail for each check.
 */

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { DEAD_REFERENCE_PATTERNS } from './patterns.mjs';

/**
 * Verify a package post-conversion.
 * @param {string} pkgDir - Absolute path to the package directory
 * @returns {object} Verification report
 */
export function verifyPackage(pkgDir) {
  const results = {
    package: require_identity(pkgDir),
    checks: [],
    passed: 0,
    failed: 0,
    warnings: 0,
  };

  // Check 1: No server/ directory
  const serverDir = join(pkgDir, 'server');
  addCheck(results, 'NO_SERVER_DIR', 'No server/ directory exists',
    !existsSync(serverDir) || !statSync(serverDir).isDirectory());

  // Check 2: No Replit artifacts
  const replitFiles = ['.replit', 'replit.nix', 'generated-icon.png', 'drizzle.config.ts'];
  const foundReplit = replitFiles.filter(f => existsSync(join(pkgDir, f)));
  addCheck(results, 'NO_REPLIT', 'No Replit artifacts',
    foundReplit.length === 0, foundReplit.length > 0 ? `Found: ${foundReplit.join(', ')}` : null);

  // Check 3: No dead references in client source
  const clientSrc = join(pkgDir, 'client', 'src');
  const appDir = join(pkgDir, 'app');
  const srcDir = join(pkgDir, 'src');
  const searchDirs = [clientSrc, appDir, srcDir].filter(d => existsSync(d));

  for (const pattern of DEAD_REFERENCE_PATTERNS) {
    const hits = grepDir(searchDirs, pattern);
    const isPass = hits.length === 0;
    addCheck(results, `NO_REF_${pattern.toUpperCase().replace(/[^A-Z]/g, '_')}`,
      `No references to "${pattern}"`,
      isPass, !isPass ? `${hits.length} hits: ${hits.slice(0, 3).map(h => h.file + ':' + h.line).join(', ')}${hits.length > 3 ? '...' : ''}` : null);
  }

  // Check 4: No dead Drizzle schema
  const schemaFiles = ['shared/schema.ts', 'shared/core-schema.ts', 'src/shared/schema.ts'];
  const foundSchema = schemaFiles.filter(f => existsSync(join(pkgDir, f)));
  addCheck(results, 'NO_DRIZZLE_SCHEMA', 'No dead Drizzle schema files',
    foundSchema.length === 0, foundSchema.length > 0 ? `Found: ${foundSchema.join(', ')}` : null);

  // Check 5: Has OsContext.tsx
  const osContextPaths = [
    join(clientSrc, 'contexts', 'OsContext.tsx'),
    join(srcDir, 'contexts', 'OsContext.tsx'),
    join(appDir, 'contexts', 'OsContext.tsx'),
  ];
  const hasOsContext = osContextPaths.some(p => existsSync(p));
  addCheck(results, 'HAS_OSCONTEXT', 'OsContext.tsx exists for OS-native auth',
    hasOsContext, null, !hasOsContext ? 'warning' : null);

  // Check 6: No .env with secrets
  const envFiles = ['.env', '.env.local'].filter(f => existsSync(join(pkgDir, f)));
  addCheck(results, 'NO_ENV_SECRETS', 'No committed .env files with secrets',
    envFiles.length === 0, envFiles.length > 0 ? `Found: ${envFiles.join(', ')}` : null);

  // Check 7: No Electron artifacts
  const electronFiles = ['electron.js', 'preload.js', 'electron-builder.json'].filter(f => existsSync(join(pkgDir, f)));
  addCheck(results, 'NO_ELECTRON', 'No dead Electron wrapper',
    electronFiles.length === 0, electronFiles.length > 0 ? `Found: ${electronFiles.join(', ')}` : null);

  // Check 8: package.json name is not "rest-express"
  const pkgJsonPath = join(pkgDir, 'package.json');
  if (existsSync(pkgJsonPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf8'));
      addCheck(results, 'CORRECT_NAME', 'package.json has correct name (not "rest-express")',
        pkg.name !== 'rest-express', pkg.name === 'rest-express' ? 'Still named "rest-express"' : null);

      // Check 9: No dead deps in package.json
      const deadDeps = ['express', 'passport', 'drizzle-orm', '@neondatabase/serverless',
        'passport-local', 'express-session', 'memorystore', 'connect-pg-simple'];
      const allDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
      const foundDeadDeps = deadDeps.filter(d => allDeps[d]);
      addCheck(results, 'NO_DEAD_DEPS', 'No Express/Passport/Drizzle dependencies',
        foundDeadDeps.length === 0, foundDeadDeps.length > 0 ? `Found: ${foundDeadDeps.join(', ')}` : null);
    } catch { /* no-op */ }
  }

  // Tally
  results.passed = results.checks.filter(c => c.status === 'pass').length;
  results.failed = results.checks.filter(c => c.status === 'fail').length;
  results.warnings = results.checks.filter(c => c.status === 'warning').length;

  return results;
}

function addCheck(results, id, description, passed, detail, overrideStatus) {
  results.checks.push({
    id,
    description,
    status: overrideStatus || (passed ? 'pass' : 'fail'),
    detail: detail || null,
  });
}

function require_identity(pkgDir) {
  const appJsonPath = join(pkgDir, 'terrafusion.app.json');
  if (existsSync(appJsonPath)) {
    try {
      const appJson = JSON.parse(readFileSync(appJsonPath, 'utf8'));
      return appJson.id || appJson.name || pkgDir.split(/[/\\]/).pop();
    } catch { /* fall through */ }
  }
  return pkgDir.split(/[/\\]/).pop();
}

/**
 * Grep directories for a pattern (case-insensitive).
 * Returns array of { file, line, lineNum, text }
 */
function grepDir(dirs, pattern) {
  const hits = [];
  const regex = new RegExp(pattern, 'i');

  for (const dir of dirs) {
    if (!existsSync(dir)) continue;
    const files = walkDir(dir, ['.ts', '.tsx', '.js', '.jsx', '.mjs']);
    for (const f of files) {
      try {
        const lines = readFileSync(f, 'utf8').split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (regex.test(lines[i])) {
            // Skip node_modules and comments-only hits
            const relPath = relative(dir, f);
            if (relPath.includes('node_modules')) continue;
            hits.push({ file: relPath, line: i + 1, text: lines[i].trim().substring(0, 80) });
          }
        }
      } catch { /* no-op */ }
    }
  }
  return hits;
}

function walkDir(dir, extensions) {
  const results = [];
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...walkDir(fullPath, extensions));
      } else if (extensions.some(ext => entry.name.endsWith(ext))) {
        results.push(fullPath);
      }
    }
  } catch { /* no-op */ }
  return results;
}
