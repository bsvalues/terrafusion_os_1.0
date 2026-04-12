/**
 * tf-modkit — Package Scanner
 * =============================
 * Detects webapp clone patterns in TerraFusion OS module packages.
 * Read-only — never modifies files.
 *
 * Usage: import { scanPackage } from './scanner.mjs'
 */

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, basename, relative } from 'node:path';
import {
  REPLIT_ARTIFACTS, STANDALONE_ARTIFACTS, ELECTRON_ARTIFACTS,
  LAUNCHER_ARTIFACTS, EXPRESS_INDICATORS, FLASK_INDICATORS,
  NEXTJS_INDICATORS, DEAD_DB_DEPS, DEAD_AUTH_DEPS, REPLIT_DEPS,
  DEAD_SERVER_DEPS, SECRET_PATTERNS, DEAD_AUTH_FILES,
} from './patterns.mjs';

/**
 * Scan a package directory and return a structured report.
 * @param {string} pkgDir - Absolute path to the package directory
 * @returns {object} Scan report
 */
export function scanPackage(pkgDir) {
  const name = basename(pkgDir);
  const report = {
    name,
    path: pkgDir,
    identity: null,
    classification: 'clean',     // clean | express-clone | nextjs-hybrid | flask-backend | partial-clone
    serverPattern: null,         // replit-boilerplate | custom-express | re-export | nextjs-app | flask | none
    dbDriver: null,
    replitArtifacts: [],
    standaloneArtifacts: [],
    electronArtifacts: [],
    launcherArtifacts: [],
    deadDeps: [],
    deadAuthDeps: [],
    replitDeps: [],
    deadServerDeps: [],
    deadDbDeps: [],
    secrets: [],
    authFiles: { dead: [], osContext: null },
    serverFiles: { count: 0, lines: 0 },
    schemaFiles: [],
    pythonFiles: [],
    hasOsContext: false,
    hasTerrafusionAppJson: false,
    appJsonPort: null,
    packageJsonName: null,
    envFiles: [],
    attachedAssets: { exists: false, count: 0 },
    nodeModulesCommitted: false,
    issues: [],      // { severity, code, message, file? }
    recommendations: [],
  };

  // --- Identity ---
  report.hasTerrafusionAppJson = existsSync(join(pkgDir, 'terrafusion.app.json'));
  if (report.hasTerrafusionAppJson) {
    try {
      const appJson = JSON.parse(readFileSync(join(pkgDir, 'terrafusion.app.json'), 'utf8'));
      report.identity = appJson.id || appJson.name || name;
      report.appJsonPort = appJson.port || appJson.devPort || null;
    } catch { report.identity = name; }
  } else {
    report.identity = name;
  }

  // --- Package.json ---
  const pkgJsonPath = join(pkgDir, 'package.json');
  let deps = {}, devDeps = {}, scripts = {};
  if (existsSync(pkgJsonPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf8'));
      report.packageJsonName = pkg.name;
      deps = pkg.dependencies || {};
      devDeps = pkg.devDependencies || {};
      scripts = pkg.scripts || {};

      if (pkg.name === 'rest-express') {
        report.issues.push({ severity: 'medium', code: 'GENERIC_NAME', message: 'package.json name is "rest-express" (Replit template default)', file: 'package.json' });
      }
    } catch { /* no-op */ }
  }

  const allDeps = { ...deps, ...devDeps };

  // --- Dependency Analysis ---
  for (const d of DEAD_DB_DEPS) {
    if (allDeps[d]) report.deadDbDeps.push(d);
  }
  for (const d of DEAD_AUTH_DEPS) {
    if (allDeps[d]) report.deadAuthDeps.push(d);
  }
  for (const d of REPLIT_DEPS) {
    if (allDeps[d]) report.replitDeps.push(d);
  }
  for (const d of DEAD_SERVER_DEPS) {
    if (allDeps[d]) report.deadServerDeps.push(d);
  }
  for (const d of EXPRESS_INDICATORS.deps) {
    if (allDeps[d] && !report.deadDeps.includes(d)) report.deadDeps.push(d);
  }

  // Concat all dead deps for convenience
  report.deadDeps = [...new Set([...report.deadDeps, ...report.deadDbDeps, ...report.deadAuthDeps, ...report.replitDeps, ...report.deadServerDeps])];

  // --- Replit Artifacts ---
  for (const f of REPLIT_ARTIFACTS) {
    if (existsSync(join(pkgDir, f))) report.replitArtifacts.push(f);
  }

  // --- Standalone Artifacts ---
  for (const f of STANDALONE_ARTIFACTS) {
    if (existsSync(join(pkgDir, f))) report.standaloneArtifacts.push(f);
  }

  // --- Electron Artifacts ---
  for (const f of ELECTRON_ARTIFACTS) {
    if (existsSync(join(pkgDir, f))) report.electronArtifacts.push(f);
  }

  // --- Launcher Artifacts ---
  try {
    const rootFiles = readdirSync(pkgDir);
    for (const f of rootFiles) {
      for (const pattern of LAUNCHER_ARTIFACTS) {
        if (pattern.test(f)) report.launcherArtifacts.push(f);
      }
    }
  } catch { /* no-op */ }

  // --- Server Detection ---
  const serverDir = join(pkgDir, 'server');
  if (existsSync(serverDir) && statSync(serverDir).isDirectory()) {
    const serverFiles = walkDir(serverDir, ['.ts', '.js', '.mjs']);
    report.serverFiles.count = serverFiles.length;
    report.serverFiles.lines = countLines(serverFiles);

    // Detect server pattern
    const indexTs = join(serverDir, 'index.ts');
    const indexJs = join(serverDir, 'index.js');
    const coreIndex = join(serverDir, 'core-index.ts');

    if (existsSync(indexTs)) {
      const content = readFileSync(indexTs, 'utf8');
      if (content.length < 100 && content.includes('core-index')) {
        report.serverPattern = 're-export';
      } else if (content.includes('registerRoutes') && content.includes('setupVite')) {
        report.serverPattern = 'replit-boilerplate';
      } else if (content.includes('express')) {
        report.serverPattern = 'custom-express';
      }
    } else if (existsSync(indexJs)) {
      const content = readFileSync(indexJs, 'utf8');
      if (content.includes('express')) {
        report.serverPattern = 'custom-express';
      }
    } else if (existsSync(coreIndex)) {
      report.serverPattern = 're-export';
    }
  }

  // --- Next.js Detection ---
  const isNextJs = NEXTJS_INDICATORS.files.some(f => existsSync(join(pkgDir, f))) || allDeps['next'];
  if (isNextJs) {
    report.serverPattern = report.serverPattern ? `${report.serverPattern}+nextjs` : 'nextjs-app';
  }

  // --- Flask Detection ---
  const flaskFiles = FLASK_INDICATORS.files.filter(f => existsSync(join(pkgDir, f)));
  if (flaskFiles.length > 0) {
    report.pythonFiles = flaskFiles;
    if (!report.serverPattern) {
      report.serverPattern = 'flask';
    } else {
      report.serverPattern += '+flask';
    }
  }

  // Also check for Python files at root
  try {
    const rootFiles = readdirSync(pkgDir).filter(f => f.endsWith('.py'));
    for (const f of rootFiles) {
      if (!report.pythonFiles.includes(f)) report.pythonFiles.push(f);
    }
  } catch { /* no-op */ }

  // Check backend/ directory (terra-levy pattern)
  const backendDir = join(pkgDir, 'backend');
  if (existsSync(backendDir) && statSync(backendDir).isDirectory()) {
    const backendFiles = walkDir(backendDir, ['.py']);
    if (backendFiles.length > 0) {
      report.pythonFiles.push(`backend/ (${backendFiles.length} Python files)`);
      if (!report.serverPattern || report.serverPattern === 'none') {
        report.serverPattern = 'flask';
      }
    }
  }

  // --- DB Driver Detection ---
  if (allDeps['@neondatabase/serverless']) report.dbDriver = 'neon-serverless';
  else if (allDeps['better-sqlite3'] && allDeps['pg']) report.dbDriver = 'dual-sqlite-postgres';
  else if (allDeps['better-sqlite3']) report.dbDriver = 'better-sqlite3';
  else if (allDeps['postgres']) report.dbDriver = 'raw-postgres';
  else if (allDeps['pg']) report.dbDriver = 'pg-pool';
  else report.dbDriver = 'none';

  // --- Schema Files ---
  const schemaLocations = [
    'shared/schema.ts', 'shared/core-schema.ts', 'src/shared/schema.ts',
    'shared/schema.js', 'server/schema.ts',
  ];
  for (const s of schemaLocations) {
    if (existsSync(join(pkgDir, s))) report.schemaFiles.push(s);
  }

  // --- Auth File Detection ---
  const clientSrc = join(pkgDir, 'client', 'src');
  const appDir = join(pkgDir, 'app'); // Next.js
  const srcDir = join(pkgDir, 'src');

  for (const dir of [clientSrc, appDir, srcDir]) {
    if (!existsSync(dir)) continue;
    const allFiles = walkDir(dir, ['.ts', '.tsx']);
    for (const f of allFiles) {
      const name = basename(f);
      if (name === 'OsContext.tsx' || name === 'OsContext.ts') {
        report.hasOsContext = true;
        report.authFiles.osContext = relative(pkgDir, f);
      }
      for (const pattern of DEAD_AUTH_FILES) {
        if (pattern.test(name)) {
          report.authFiles.dead.push(relative(pkgDir, f));
        }
      }
    }
  }

  // --- Secrets Detection ---
  const envFiles = ['.env', '.env.local', '.env.production', 'client/.env'];
  for (const ef of envFiles) {
    const efPath = join(pkgDir, ef);
    if (existsSync(efPath)) {
      report.envFiles.push(ef);
      try {
        const content = readFileSync(efPath, 'utf8');
        for (const sp of SECRET_PATTERNS) {
          if (sp.regex.test(content)) {
            report.secrets.push({ type: sp.name, file: ef });
            report.issues.push({
              severity: 'critical',
              code: 'COMMITTED_SECRET',
              message: `${sp.name} detected in ${ef}`,
              file: ef,
            });
          }
        }
      } catch { /* no-op */ }
    }
  }

  // Also scan cookies.txt
  if (existsSync(join(pkgDir, 'cookies.txt'))) {
    report.issues.push({
      severity: 'high',
      code: 'COMMITTED_COOKIES',
      message: 'cookies.txt committed to repo',
      file: 'cookies.txt',
    });
  }

  // --- attached_assets ---
  const assetsDir = join(pkgDir, 'attached_assets');
  if (existsSync(assetsDir) && statSync(assetsDir).isDirectory()) {
    try {
      const assetFiles = readdirSync(assetsDir);
      report.attachedAssets = { exists: true, count: assetFiles.length };
    } catch { /* no-op */ }
  }

  // --- Classification ---
  // Check if Python files are actual Flask/Django backends vs data scripts
  const hasFlaskBackend = flaskFiles.some(f => f.includes('app.py') || f.includes('requirements.txt'))
    && (report.pythonFiles.some(f => f.includes('backend/')) || flaskFiles.some(f => f === 'app.py'));
  // Standalone .py scripts at root (import_*, analyze_*, extract_*) are data tools, not backends
  const pyScriptsOnly = report.pythonFiles.length > 0 &&
    report.pythonFiles.every(f => /^(import_|analyze_|extract_|test_|enhanced_|benton_|cost_|excel_)/.test(basename(f)));

  if (isNextJs && (hasFlaskBackend || flaskFiles.length > 0)) {
    report.classification = 'nextjs-hybrid';
  } else if (isNextJs) {
    report.classification = 'nextjs-app';
  } else if (report.serverFiles.count > 5 && (report.replitArtifacts.length > 0 || report.serverPattern === 'replit-boilerplate')) {
    report.classification = 'express-clone';
  } else if (report.serverFiles.count > 0 || report.deadDeps.length > 3) {
    report.classification = 'partial-clone';
  } else if (hasFlaskBackend && !pyScriptsOnly) {
    report.classification = 'flask-backend';
  } else {
    report.classification = 'clean';
  }

  // --- Generate Issues ---
  if (report.serverFiles.count > 0) {
    report.issues.push({
      severity: report.serverFiles.lines > 1000 ? 'critical' : 'high',
      code: 'DEAD_SERVER',
      message: `${report.serverFiles.count} server files (${report.serverFiles.lines.toLocaleString()} lines) — all dead, .NET serves the API`,
    });
  }

  if (report.deadDeps.length > 0) {
    report.issues.push({
      severity: report.deadDeps.length > 10 ? 'critical' : 'high',
      code: 'DEAD_DEPS',
      message: `${report.deadDeps.length} dead npm dependencies`,
    });
  }

  if (report.schemaFiles.length > 0) {
    report.issues.push({
      severity: 'high',
      code: 'DEAD_SCHEMA',
      message: `Dead Drizzle schema: ${report.schemaFiles.join(', ')}`,
    });
  }

  if (report.authFiles.dead.length > 0) {
    report.issues.push({
      severity: 'high',
      code: 'DEAD_AUTH',
      message: `${report.authFiles.dead.length} dead auth files (OsContext is the only valid auth)`,
    });
  }

  if (!report.hasOsContext && report.classification !== 'clean') {
    report.issues.push({
      severity: 'high',
      code: 'MISSING_OSCONTEXT',
      message: 'No OsContext.tsx — needs injection for OS-native auth',
    });
  }

  if (report.replitArtifacts.length > 0) {
    report.issues.push({
      severity: 'medium',
      code: 'REPLIT_ARTIFACTS',
      message: `Replit artifacts: ${report.replitArtifacts.join(', ')}`,
    });
  }

  if (report.standaloneArtifacts.length > 0) {
    report.issues.push({
      severity: 'medium',
      code: 'STANDALONE_PROJECT',
      message: `Standalone project artifacts (monorepo should own these): ${report.standaloneArtifacts.join(', ')}`,
    });
  }

  if (report.electronArtifacts.length > 0) {
    report.issues.push({
      severity: 'medium',
      code: 'DEAD_ELECTRON',
      message: `Dead Electron wrapper (OS shell provides desktop): ${report.electronArtifacts.join(', ')}`,
    });
  }

  if (report.launcherArtifacts.length > 0) {
    report.issues.push({
      severity: 'low',
      code: 'LAUNCHER_SCRIPTS',
      message: `Dead launcher scripts: ${report.launcherArtifacts.join(', ')}`,
    });
  }

  // --- Generate Recommendations ---
  if (report.classification !== 'clean') {
    if (report.serverFiles.count > 0) {
      report.recommendations.push('Delete server/ directory (after evacuating any live code like Rust kernels)');
    }
    if (report.schemaFiles.length > 0) {
      report.recommendations.push('Delete Drizzle schema files, create TS interfaces matching .NET DTOs');
    }
    if (!report.hasOsContext) {
      report.recommendations.push('Inject OsContext.tsx for OS-native auth');
    }
    if (report.authFiles.dead.length > 0) {
      report.recommendations.push(`Delete ${report.authFiles.dead.length} dead auth files, rewire to OsContext`);
    }
    if (report.deadDeps.length > 0) {
      report.recommendations.push(`Remove ${report.deadDeps.length} dead dependencies from package.json`);
    }
    if (report.replitArtifacts.length > 0) {
      report.recommendations.push('Delete Replit artifacts (.replit, replit.nix, generated-icon.png, theme.json, drizzle.config.ts)');
    }
    if (report.standaloneArtifacts.length > 0) {
      report.recommendations.push('Remove standalone project files (monorepo root owns .gitignore, lockfiles, .github)');
    }
    if (report.electronArtifacts.length > 0) {
      report.recommendations.push('Delete Electron wrapper files (OS shell provides desktop)');
    }
    if (report.secrets.length > 0) {
      report.recommendations.push('URGENT: Rotate exposed credentials and add .env to .gitignore');
    }
  }

  return report;
}

/**
 * Walk a directory recursively, returning files matching extensions.
 */
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
  } catch { /* permission errors, etc */ }
  return results;
}

/**
 * Count lines across a list of files.
 */
function countLines(files) {
  let total = 0;
  for (const f of files) {
    try {
      const content = readFileSync(f, 'utf8');
      total += content.split('\n').length;
    } catch { /* no-op */ }
  }
  return total;
}
