/**
 * TerraFusion Performance Skill Audit
 * Phase 4G: Informational Performance Audit Lane
 *
 * This is a read-only, deterministic scanner that identifies performance
 * anti-patterns based on Vercel React Best Practices.
 *
 * GOVERNANCE: This tool is INFORMATIONAL ONLY and never blocks merges.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { bundlesScanner } from './scanners/bundles.js';
import { clientBoundaryScanner } from './scanners/client-boundary.js';
import { rerendersScanner } from './scanners/rerenders.js';
import type { AuditConfig, AuditReport, Finding, Scanner, Severity } from './scanners/types.js';
import { waterfallsScanner } from './scanners/waterfalls.js';
import { generateRemediationPlan, generateUnifiedDiff } from './plan-generator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Scanners registry
const SCANNERS: Scanner[] = [
  waterfallsScanner,
  bundlesScanner,
  clientBoundaryScanner,
  rerendersScanner,
];

// Default configuration
const DEFAULT_CONFIG: AuditConfig = {
  maxFindings: parseInt(process.env.PERF_AUDIT_MAX_FINDINGS || '200', 10),
  severityThreshold: (process.env.PERF_AUDIT_SEVERITY_THRESHOLD || 'medium') as Severity,
  includePaths: [
    'frontend-v2/**/*.{ts,tsx}',
    'applications/**/*.{ts,tsx}',
    'os-platform/**/*.{ts,tsx}',
    'terrabuild-modernization/**/*.{ts,tsx}',
  ],
  excludePaths: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/*.test.*',
    '**/*.spec.*',
    '**/__tests__/**',
    '**/*.d.ts',
  ],
  forbiddenPaths: ['**/ARCHIVE/**', '**/archive/**'],
};

// Rules version for auditability
const RULES_VERSION = 'vercel-react-2026-01';

// CLI flags
const CLI_FLAGS = {
  emitPatch: process.argv.includes('--emit-patch'),
  verbose: process.argv.includes('--verbose'),
};

/**
 * Recursively find all TypeScript/TSX files
 */
function findFiles(dir: string, config: AuditConfig, baseDir: string = dir): string[] {
  const files: string[] = [];

  if (!fs.existsSync(dir)) {
    return files;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');

    // Check forbidden paths
    if (config.forbiddenPaths.some(p => matchGlob(relativePath, p))) {
      continue;
    }

    // Check exclude paths
    if (config.excludePaths.some(p => matchGlob(relativePath, p))) {
      continue;
    }

    if (entry.isDirectory()) {
      files.push(...findFiles(fullPath, config, baseDir));
    } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Simple glob matching (supports ** and *)
 */
function matchGlob(path: string, pattern: string): boolean {
  const regexPattern = pattern
    .replace(/\*\*/g, '<<<GLOBSTAR>>>')
    .replace(/\*/g, '[^/]*')
    .replace(/<<<GLOBSTAR>>>/g, '.*')
    .replace(/\./g, '\\.');

  return new RegExp(`^${regexPattern}$`).test(path);
}

/**
 * Get git ref for the report
 */
function getGitRef(): string {
  try {
    const gitHead = fs.readFileSync(path.join(process.cwd(), '.git', 'HEAD'), 'utf8').trim();
    if (gitHead.startsWith('ref:')) {
      const refPath = gitHead.slice(5).trim();
      const refFile = path.join(process.cwd(), '.git', refPath);
      if (fs.existsSync(refFile)) {
        return fs.readFileSync(refFile, 'utf8').trim().slice(0, 8);
      }
      return refPath.split('/').pop() || 'unknown';
    }
    return gitHead.slice(0, 8);
  } catch {
    return process.env.GITHUB_SHA?.slice(0, 8) || 'local';
  }
}

/**
 * Severity priority for sorting
 */
function severityPriority(severity: Severity): number {
  switch (severity) {
    case 'critical':
      return 0;
    case 'high':
      return 1;
    case 'medium':
      return 2;
    default:
      return 3;
  }
}

/**
 * Generate markdown report
 */
function generateMarkdownReport(report: AuditReport): string {
  const lines: string[] = [
    '# TerraFusion Performance Audit Report',
    '',
    `**Run**: ${report.run.ref} at ${report.run.timestamp}`,
    `**Rules Version**: ${report.run.rulesVersion}`,
    `**Files Scanned**: ${report.run.filesScanned}`,
    `**Duration**: ${report.run.durationMs}ms`,
    '',
    '## Summary',
    '',
    `| Severity | Count |`,
    `|----------|-------|`,
    `| 🔴 Critical | ${report.summary.critical} |`,
    `| 🟠 High | ${report.summary.high} |`,
    `| 🟡 Medium | ${report.summary.medium} |`,
    `| **Total** | **${report.summary.total}** |`,
    '',
  ];

  if (report.findings.length === 0) {
    lines.push('## Findings', '', '✅ No performance issues detected!');
  } else {
    lines.push('## Top Findings', '');

    // Show top 20 findings
    const topFindings = report.findings.slice(0, 20);

    for (const finding of topFindings) {
      const icon =
        finding.severity === 'critical' ? '🔴' : finding.severity === 'high' ? '🟠' : '🟡';
      lines.push(`### ${icon} ${finding.rule}`);
      lines.push('');
      lines.push(
        `**File**: \`${finding.file}\`${finding.lineStart ? `:${finding.lineStart}` : ''}`
      );
      lines.push('');
      lines.push(finding.message);

      if (finding.snippet) {
        lines.push('');
        lines.push('```typescript');
        lines.push(finding.snippet);
        lines.push('```');
      }

      if (finding.suggestedFix) {
        lines.push('');
        lines.push('**Suggested Fix**:');
        lines.push('');
        lines.push('```typescript');
        lines.push(finding.suggestedFix);
        lines.push('```');
      }

      lines.push('');
      lines.push('---');
      lines.push('');
    }

    if (report.findings.length > 20) {
      lines.push(`*...and ${report.findings.length - 20} more findings in JSON report*`);
    }
  }

  lines.push('');
  lines.push('---');
  lines.push('*Generated by @terrafusion/perf-skill-audit (Phase 4G)*');

  return lines.join('\n');
}

/**
 * Main audit function
 */
async function runAudit(): Promise<void> {
  console.log('🔍 TerraFusion Performance Skill Audit');
  console.log('   Phase 4G: Informational Only\n');

  const startTime = Date.now();
  const config = DEFAULT_CONFIG;

  // Find workspace root
  const workspaceRoot = process.cwd();
  console.log(`📁 Workspace: ${workspaceRoot}`);

  // Collect files from all include paths
  const allFiles: string[] = [];
  const scannedDirs = new Set<string>();

  for (const pattern of config.includePaths) {
    const baseDir = pattern.split('/**')[0];
    const fullBaseDir = path.join(workspaceRoot, baseDir);

    if (!scannedDirs.has(baseDir) && fs.existsSync(fullBaseDir)) {
      const files = findFiles(fullBaseDir, config, workspaceRoot);
      allFiles.push(...files);
      scannedDirs.add(baseDir);
    }
  }

  console.log(`📄 Found ${allFiles.length} files to scan\n`);

  // Run scanners
  const findings: Finding[] = [];

  for (const file of allFiles) {
    if (findings.length >= config.maxFindings) {
      console.log(`⚠️  Max findings (${config.maxFindings}) reached, stopping scan`);
      break;
    }

    try {
      const content = fs.readFileSync(file, 'utf8');
      const relativePath = path.relative(workspaceRoot, file).replace(/\\/g, '/');

      for (const scanner of SCANNERS) {
        const scannerFindings = scanner.scan(content, relativePath, {
          maxFindings: config.maxFindings - findings.length,
          severityThreshold: config.severityThreshold,
          forbiddenPaths: config.forbiddenPaths,
        });

        findings.push(...scannerFindings);
      }
    } catch (err) {
      // Skip files that can't be read
      console.warn(`⚠️  Could not scan: ${file}`);
    }
  }

  // Sort findings by severity, then by priorityScore (higher first)
  findings.sort((a, b) => {
    const severityDiff = severityPriority(a.severity) - severityPriority(b.severity);
    if (severityDiff !== 0) return severityDiff;
    // Within same severity, sort by priorityScore descending
    const aScore = a.priorityScore ?? 50;
    const bScore = b.priorityScore ?? 50;
    return bScore - aScore;
  });

  // Limit to max findings
  const limitedFindings = findings.slice(0, config.maxFindings);

  // Build report
  const report: AuditReport = {
    run: {
      ref: getGitRef(),
      timestamp: new Date().toISOString(),
      rulesVersion: RULES_VERSION,
      filesScanned: allFiles.length,
      durationMs: Date.now() - startTime,
    },
    summary: {
      critical: limitedFindings.filter(f => f.severity === 'critical').length,
      high: limitedFindings.filter(f => f.severity === 'high').length,
      medium: limitedFindings.filter(f => f.severity === 'medium').length,
      total: limitedFindings.length,
    },
    findings: limitedFindings,
  };

  // Ensure output directory exists
  const outDir = path.join(__dirname, '..', 'out');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // Write reports
  const jsonPath = path.join(outDir, 'perf-audit-report.json');
  const mdPath = path.join(outDir, 'perf-audit-report.md');

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  fs.writeFileSync(mdPath, generateMarkdownReport(report));

  // Phase 4I: Generate remediation plan for waterfall findings
  const plan = generateRemediationPlan(limitedFindings, getGitRef(), RULES_VERSION);
  const planPath = path.join(outDir, 'waterfalls.plan.json');
  fs.writeFileSync(planPath, JSON.stringify(plan, null, 2));

  // Generate unified diffs if --emit-patch flag is set
  const diffPath = path.join(outDir, 'waterfalls.patch');
  if (CLI_FLAGS.emitPatch) {
    const eligibleItems = plan.items.filter(item => item.eligibility.eligible && item.suggestedPatch);
    const diffs: string[] = [];
    
    for (const item of eligibleItems) {
      const diff = generateUnifiedDiff(item, []);
      if (diff) {
        diffs.push(diff);
      }
    }
    
    if (diffs.length > 0) {
      fs.writeFileSync(diffPath, diffs.join('\n\n'));
      console.log(`\n🔧 Patches written:`);
      console.log(`   ${diffPath} (${diffs.length} eligible fixes)`);
    } else {
      console.log(`\n⚠️  No eligible patches generated (run with --verbose for details)`);
    }
  }

  // Print plan summary
  console.log(`\n📋 Remediation Plan:`);
  console.log(`   📄 Total items: ${plan.summary.total}`);
  console.log(`   ✅ Eligible:    ${plan.summary.eligible}`);
  console.log(`   🔀 Promise.all: ${plan.summary.promiseAll}`);
  console.log(`   📦 Batch-stub:  ${plan.summary.batchStub}`);
  console.log(`   👀 Review-only: ${plan.summary.reviewOnly}`);
  console.log(`\n   Plan: ${planPath}`);

  // Print summary
  console.log('📊 Audit Summary:');
  console.log(`   🔴 Critical: ${report.summary.critical}`);
  console.log(`   🟠 High:     ${report.summary.high}`);
  console.log(`   🟡 Medium:   ${report.summary.medium}`);
  console.log(`   ─────────────────`);
  console.log(`   📝 Total:    ${report.summary.total}`);
  console.log('');
  console.log(`✅ Reports written to:`);
  console.log(`   ${jsonPath}`);
  console.log(`   ${mdPath}`);
  console.log(`\n⏱️  Duration: ${report.run.durationMs}ms`);
}

// Run if executed directly
runAudit().catch(err => {
  console.error('❌ Audit failed:', err);
  process.exit(1);
});
