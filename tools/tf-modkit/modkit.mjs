#!/usr/bin/env node
/**
 * tf-modkit — TerraFusion Module Conversion Kit
 * ===============================================
 * CLI tool to scan, plan, and verify conversion of standalone
 * webapp packages into TerraFusion OS native modules.
 *
 * Usage:
 *   node modkit.mjs scan [package]           # Scan one or all packages
 *   node modkit.mjs plan <package>           # Generate conversion plan
 *   node modkit.mjs verify <package>         # Run post-conversion checks
 *   node modkit.mjs dashboard                # Full monorepo dashboard
 *   node modkit.mjs report <package>         # Full report (scan + plan + verify)
 *   node modkit.mjs secrets                  # Scan all packages for committed secrets
 */

import { readdirSync, existsSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve, basename } from 'node:path';
import { scanPackage } from './scanner.mjs';
import { generatePlan } from './planner.mjs';
import { verifyPackage } from './verifier.mjs';

// --- Color helpers ---
const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
};

const SEV_COLOR = {
  critical: C.bgRed + C.white,
  high: C.red,
  medium: C.yellow,
  low: C.dim,
};

const CLASS_ICON = {
  'clean': `${C.green}✓${C.reset}`,
  'express-clone': `${C.red}██${C.reset}`,
  'nextjs-hybrid': `${C.magenta}██${C.reset}`,
  'nextjs-app': `${C.magenta}█${C.reset}`,
  'flask-backend': `${C.yellow}██${C.reset}`,
  'partial-clone': `${C.yellow}█${C.reset}`,
};

const STATUS_ICON = {
  pass: `${C.green}✓${C.reset}`,
  fail: `${C.red}✗${C.reset}`,
  warning: `${C.yellow}!${C.reset}`,
};

// --- Resolve packages directory ---
const SCRIPT_DIR = new URL('.', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const PACKAGES_DIR = resolve(SCRIPT_DIR, '..', '..', 'packages');

function getPackageDir(name) {
  const dir = join(PACKAGES_DIR, name);
  if (!existsSync(dir) || !statSync(dir).isDirectory()) {
    console.error(`${C.red}Package not found: ${name}${C.reset}`);
    console.error(`Looked in: ${dir}`);
    process.exit(1);
  }
  return dir;
}

function getAllPackages() {
  return readdirSync(PACKAGES_DIR)
    .filter(f => {
      const p = join(PACKAGES_DIR, f);
      return statSync(p).isDirectory() && !f.startsWith('.');
    })
    .sort();
}

// ============================================================
// COMMANDS
// ============================================================

function cmdScan(pkgName) {
  if (pkgName) {
    const report = scanPackage(getPackageDir(pkgName));
    printScanReport(report);
    return;
  }

  // Scan all
  const packages = getAllPackages();
  console.log(`${C.bold}${C.cyan}tf-modkit scan${C.reset} — Scanning ${packages.length} packages\n`);
  
  const reports = packages.map(p => scanPackage(join(PACKAGES_DIR, p)));
  
  // Summary table
  console.log(`${C.bold}  Package                 Classification       Server LOC   Dead Deps   Issues${C.reset}`);
  console.log('  ' + '─'.repeat(85));
  
  for (const r of reports) {
    const icon = CLASS_ICON[r.classification] || '?';
    const name = r.name.padEnd(22);
    const cls = r.classification.padEnd(18);
    const loc = r.serverFiles.lines > 0 ? String(r.serverFiles.lines).padStart(8) : '       -';
    const deps = r.deadDeps.length > 0 ? String(r.deadDeps.length).padStart(8) : '       -';
    const issues = r.issues.length > 0 ? `${C.red}${r.issues.length}${C.reset}` : `${C.green}0${C.reset}`;
    console.log(`  ${icon} ${name} ${cls} ${loc}   ${deps}      ${issues}`);
  }

  // Totals
  const totalServer = reports.reduce((s, r) => s + r.serverFiles.lines, 0);
  const totalDead = reports.reduce((s, r) => s + r.deadDeps.length, 0);
  const totalIssues = reports.reduce((s, r) => s + r.issues.length, 0);
  const totalSecrets = reports.reduce((s, r) => s + r.secrets.length, 0);
  const needsConversion = reports.filter(r => r.classification !== 'clean').length;

  console.log('  ' + '─'.repeat(85));
  console.log(`  ${C.bold}TOTALS${C.reset}                                     ${String(totalServer).padStart(8)}   ${String(totalDead).padStart(8)}      ${totalIssues}`);
  console.log();
  console.log(`  ${C.cyan}Packages needing conversion:${C.reset} ${needsConversion}/${packages.length}`);
  console.log(`  ${C.cyan}Total dead server code:${C.reset}      ${totalServer.toLocaleString()} lines`);
  if (totalSecrets > 0) {
    console.log(`  ${C.bgRed}${C.white} SECURITY ${C.reset} ${totalSecrets} committed secret(s) found — run: node modkit.mjs secrets`);
  }
  console.log();
}

function cmdPlan(pkgName) {
  const report = scanPackage(getPackageDir(pkgName));
  const plan = generatePlan(report);
  printPlan(plan);
}

function cmdVerify(pkgName) {
  const results = verifyPackage(getPackageDir(pkgName));
  printVerification(results);
}

function cmdDashboard() {
  const packages = getAllPackages();
  console.log(`\n${C.bold}${C.cyan}╔══════════════════════════════════════════════════════════════╗${C.reset}`);
  console.log(`${C.bold}${C.cyan}║          tf-modkit — Monorepo Conversion Dashboard           ║${C.reset}`);
  console.log(`${C.bold}${C.cyan}╚══════════════════════════════════════════════════════════════╝${C.reset}\n`);

  const reports = packages.map(p => scanPackage(join(PACKAGES_DIR, p)));

  // Classification breakdown
  const byClass = {};
  for (const r of reports) {
    byClass[r.classification] = (byClass[r.classification] || []);
    byClass[r.classification].push(r);
  }

  console.log(`${C.bold}Classification Breakdown${C.reset}`);
  console.log('─'.repeat(50));
  for (const [cls, pkgs] of Object.entries(byClass).sort((a, b) => b[1].length - a[1].length)) {
    const icon = CLASS_ICON[cls] || '?';
    console.log(`  ${icon} ${C.bold}${cls}${C.reset} (${pkgs.length}): ${pkgs.map(p => p.name).join(', ')}`);
  }

  // Security summary
  const allSecrets = reports.flatMap(r => r.secrets.map(s => ({ ...s, package: r.name })));
  const allCookies = reports.filter(r => r.issues.some(i => i.code === 'COMMITTED_COOKIES'));
  
  console.log(`\n${C.bold}Security Summary${C.reset}`);
  console.log('─'.repeat(50));
  if (allSecrets.length === 0 && allCookies.length === 0) {
    console.log(`  ${C.green}✓ No committed secrets detected${C.reset}`);
  } else {
    for (const s of allSecrets) {
      console.log(`  ${C.bgRed}${C.white} CRIT ${C.reset} ${s.package}: ${s.type} in ${s.file}`);
    }
    for (const r of allCookies) {
      console.log(`  ${C.red} HIGH ${C.reset} ${r.name}: cookies.txt committed`);
    }
  }

  // Conversion effort
  console.log(`\n${C.bold}Conversion Effort Matrix${C.reset}`);
  console.log('─'.repeat(50));
  
  const convertible = reports.filter(r => r.classification !== 'clean');
  for (const r of convertible.sort((a, b) => b.serverFiles.lines - a.serverFiles.lines)) {
    const plan = generatePlan(r);
    const effort = plan.estimatedEffort.toUpperCase().padEnd(8);
    const tasks = String(plan.totalTasks).padStart(3);
    const bar = '█'.repeat(Math.min(30, Math.ceil(r.serverFiles.lines / 3000)));
    console.log(`  ${r.name.padEnd(20)} ${effort} ${tasks} tasks  ${C.red}${bar}${C.reset} ${r.serverFiles.lines.toLocaleString()} LOC`);
  }

  // Missing OsContext
  const missingOs = reports.filter(r => !r.hasOsContext && r.classification !== 'clean');
  if (missingOs.length > 0) {
    console.log(`\n${C.bold}Missing OsContext.tsx${C.reset} (${missingOs.length} packages)`);
    console.log('─'.repeat(50));
    for (const r of missingOs) {
      console.log(`  ${C.yellow}!${C.reset} ${r.name}`);
    }
  }

  // Grand totals
  const totalServer = reports.reduce((s, r) => s + r.serverFiles.lines, 0);
  const totalDead = reports.reduce((s, r) => s + r.deadDeps.length, 0);
  const totalIssues = reports.reduce((s, r) => s + r.issues.length, 0);

  console.log(`\n${C.bold}Grand Totals${C.reset}`);
  console.log('─'.repeat(50));
  console.log(`  Dead server code:   ${C.red}${totalServer.toLocaleString()}${C.reset} lines across ${convertible.length} packages`);
  console.log(`  Dead dependencies:  ${C.red}${totalDead}${C.reset} total`);
  console.log(`  Total issues:       ${C.red}${totalIssues}${C.reset}`);
  console.log(`  Clean packages:     ${C.green}${reports.length - convertible.length}${C.reset}/${reports.length}`);
  console.log();
}

function cmdReport(pkgName) {
  console.log(`\n${C.bold}${C.cyan}tf-modkit full report: ${pkgName}${C.reset}\n`);
  
  console.log(`${'═'.repeat(60)}`);
  console.log(`${C.bold}PHASE 1: SCAN${C.reset}`);
  console.log(`${'═'.repeat(60)}`);
  const report = scanPackage(getPackageDir(pkgName));
  printScanReport(report);

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`${C.bold}PHASE 2: PLAN${C.reset}`);
  console.log(`${'═'.repeat(60)}`);
  const plan = generatePlan(report);
  printPlan(plan);

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`${C.bold}PHASE 3: VERIFY${C.reset}`);
  console.log(`${'═'.repeat(60)}`);
  const verification = verifyPackage(getPackageDir(pkgName));
  printVerification(verification);
}

function cmdSecrets() {
  const packages = getAllPackages();
  console.log(`\n${C.bold}${C.red}tf-modkit secrets scan${C.reset} — Checking ${packages.length} packages\n`);

  let found = 0;
  for (const p of packages) {
    const report = scanPackage(join(PACKAGES_DIR, p));
    const secIssues = report.issues.filter(i => 
      i.code === 'COMMITTED_SECRET' || i.code === 'COMMITTED_COOKIES'
    );
    
    if (secIssues.length > 0) {
      console.log(`  ${C.bgRed}${C.white} ${p} ${C.reset}`);
      for (const issue of secIssues) {
        console.log(`    ${SEV_COLOR[issue.severity]}${issue.severity.toUpperCase()}${C.reset} ${issue.message}`);
        found++;
      }
    }
  }

  if (found === 0) {
    console.log(`  ${C.green}✓ No committed secrets found${C.reset}`);
  } else {
    console.log(`\n  ${C.bgRed}${C.white} ${found} security issue(s) found ${C.reset}`);
    console.log(`  ${C.dim}Action: Rotate credentials, delete files, add .env to .gitignore${C.reset}`);
  }
  console.log();
}

function cmdExport(pkgName) {
  const report = scanPackage(getPackageDir(pkgName));
  const plan = generatePlan(report);
  const verification = verifyPackage(getPackageDir(pkgName));

  const output = { scan: report, plan, verification, exportedAt: new Date().toISOString() };
  const outFile = join(PACKAGES_DIR, pkgName, 'MODKIT_REPORT.json');
  writeFileSync(outFile, JSON.stringify(output, null, 2));
  console.log(`${C.green}✓${C.reset} Report written to ${outFile}`);
}

// ============================================================
// PRINTERS
// ============================================================

function printScanReport(r) {
  const icon = CLASS_ICON[r.classification] || '?';
  console.log(`\n  ${icon} ${C.bold}${r.name}${C.reset} → ${C.cyan}${r.classification}${C.reset}`);
  console.log(`  ${'─'.repeat(50)}`);
  console.log(`  Identity:        ${r.identity} ${r.packageJsonName !== r.identity ? `(pkg.json: "${r.packageJsonName}")` : ''}`);
  console.log(`  Server pattern:  ${r.serverPattern || 'none'}`);
  console.log(`  DB driver:       ${r.dbDriver}`);
  console.log(`  Server files:    ${r.serverFiles.count} (${r.serverFiles.lines.toLocaleString()} lines)`);
  console.log(`  Dead deps:       ${r.deadDeps.length}`);
  console.log(`  Schema files:    ${r.schemaFiles.length > 0 ? r.schemaFiles.join(', ') : 'none'}`);
  console.log(`  Auth files:      ${r.authFiles.dead.length} dead, OsContext: ${r.hasOsContext ? C.green + '✓' + C.reset : C.red + '✗' + C.reset}`);
  console.log(`  Replit artifacts: ${r.replitArtifacts.length > 0 ? r.replitArtifacts.join(', ') : 'none'}`);
  console.log(`  Python files:    ${r.pythonFiles.length > 0 ? r.pythonFiles.join(', ') : 'none'}`);
  console.log(`  Electron:        ${r.electronArtifacts.length > 0 ? r.electronArtifacts.join(', ') : 'none'}`);
  console.log(`  Secrets:         ${r.secrets.length > 0 ? C.bgRed + C.white + ' ' + r.secrets.length + ' FOUND ' + C.reset : C.green + '0' + C.reset}`);
  
  if (r.attachedAssets.exists) {
    console.log(`  attached_assets: ${r.attachedAssets.count} files (needs human triage)`);
  }

  if (r.issues.length > 0) {
    console.log(`\n  ${C.bold}Issues (${r.issues.length})${C.reset}`);
    for (const issue of r.issues) {
      const sevColor = SEV_COLOR[issue.severity] || '';
      console.log(`    ${sevColor}${issue.severity.toUpperCase().padEnd(8)}${C.reset} [${issue.code}] ${issue.message}`);
    }
  }

  if (r.recommendations.length > 0) {
    console.log(`\n  ${C.bold}Recommendations${C.reset}`);
    for (const rec of r.recommendations) {
      console.log(`    ${C.cyan}→${C.reset} ${rec}`);
    }
  }
  console.log();
}

function printPlan(plan) {
  console.log(`\n  ${C.bold}Conversion Plan: ${plan.package}${C.reset}`);
  console.log(`  Classification: ${plan.classification}`);
  console.log(`  Effort: ${C.bold}${plan.estimatedEffort.toUpperCase()}${C.reset}`);
  console.log(`  Total tasks: ${plan.totalTasks}`);

  if (plan.securityBlockers.length > 0) {
    console.log(`\n  ${C.bgRed}${C.white} SECURITY BLOCKERS — Fix BEFORE conversion ${C.reset}`);
    for (const b of plan.securityBlockers) {
      console.log(`    ${C.red}●${C.reset} ${b.action}`);
      console.log(`      ${C.dim}${b.detail}${C.reset}`);
    }
  }

  if (plan.estimatedEffort === 'none') {
    console.log(`\n  ${C.green}✓ Package is clean — no conversion needed${C.reset}\n`);
    return;
  }

  for (const phase of plan.phases) {
    console.log(`\n  ${C.bold}${C.cyan}${phase.id}: ${phase.name}${C.reset} (${phase.tasks.length} tasks)`);
    for (const task of phase.tasks) {
      const sevColor = SEV_COLOR[task.severity] || '';
      console.log(`    ${sevColor}${task.severity.substring(0, 4).toUpperCase().padEnd(4)}${C.reset} ${task.title}`);
      if (task.preCheck) {
        console.log(`         ${C.yellow}⚠ ${task.preCheck}${C.reset}`);
      }
    }
  }
  console.log();
}

function printVerification(v) {
  console.log(`\n  ${C.bold}Verification: ${v.package}${C.reset}`);
  console.log(`  ${'─'.repeat(50)}`);

  for (const check of v.checks) {
    const icon = STATUS_ICON[check.status] || '?';
    console.log(`  ${icon} ${check.description}`);
    if (check.detail) {
      console.log(`    ${C.dim}${check.detail}${C.reset}`);
    }
  }

  console.log(`\n  ${C.bold}Result:${C.reset} ${C.green}${v.passed} passed${C.reset}, ${v.failed > 0 ? C.red + v.failed + ' failed' + C.reset : '0 failed'}, ${v.warnings > 0 ? C.yellow + v.warnings + ' warnings' + C.reset : '0 warnings'}`);
  
  if (v.failed === 0 && v.warnings === 0) {
    console.log(`  ${C.bgGreen}${C.white} CONVERSION VERIFIED ${C.reset}`);
  } else if (v.failed === 0) {
    console.log(`  ${C.bgYellow} CONVERSION OK (with warnings) ${C.reset}`);
  } else {
    console.log(`  ${C.bgRed}${C.white} CONVERSION INCOMPLETE — ${v.failed} check(s) failing ${C.reset}`);
  }
  console.log();
}

// ============================================================
// MAIN
// ============================================================

const [cmd, ...args] = process.argv.slice(2);

const HELP = `
${C.bold}${C.cyan}tf-modkit${C.reset} — TerraFusion Module Conversion Kit

${C.bold}Commands:${C.reset}
  scan [package]     Scan one package or all packages for webapp patterns
  plan <package>     Generate a conversion plan
  verify <package>   Run post-conversion verification checks
  dashboard          Full monorepo conversion dashboard
  report <package>   Full report (scan + plan + verify)
  secrets            Scan all packages for committed secrets/credentials
  export <package>   Export scan+plan+verify to JSON file

${C.bold}Examples:${C.reset}
  node modkit.mjs scan                    # Scan all packages
  node modkit.mjs scan terrabuild         # Scan one package
  node modkit.mjs dashboard               # Full dashboard
  node modkit.mjs plan property-tax-ai    # Generate conversion plan
  node modkit.mjs verify terrabuild       # Check if conversion is done
  node modkit.mjs secrets                 # Find committed credentials
  node modkit.mjs report terra-gama       # Full 3-phase report
`;

switch (cmd) {
  case 'scan':
    cmdScan(args[0]);
    break;
  case 'plan':
    if (!args[0]) { console.error('Usage: node modkit.mjs plan <package>'); process.exit(1); }
    cmdPlan(args[0]);
    break;
  case 'verify':
    if (!args[0]) { console.error('Usage: node modkit.mjs verify <package>'); process.exit(1); }
    cmdVerify(args[0]);
    break;
  case 'dashboard':
    cmdDashboard();
    break;
  case 'report':
    if (!args[0]) { console.error('Usage: node modkit.mjs report <package>'); process.exit(1); }
    cmdReport(args[0]);
    break;
  case 'secrets':
    cmdSecrets();
    break;
  case 'export':
    if (!args[0]) { console.error('Usage: node modkit.mjs export <package>'); process.exit(1); }
    cmdExport(args[0]);
    break;
  default:
    console.log(HELP);
    break;
}
