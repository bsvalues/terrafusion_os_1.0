#!/usr/bin/env node
/**
 * TerraFusion OS - Support Bundle Generator
 *
 * One-command incident-grade debug bundle:
 * - Orchestrates doctor + trace:query + env snapshot
 * - Redacts secrets/tokens/PII
 * - Outputs to artifacts/support-bundle/
 * - <5s runtime
 *
 * Usage:
 *   node scripts/support-bundle.mjs
 *   pnpm run support:bundle
 */

import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '..');

// ============================================================================
// Redaction Patterns
// ============================================================================

const SECRET_PATTERNS = [
  /sk-[a-zA-Z0-9]{32,}/g, // API keys (sk- pattern)
  /Bearer\s+[a-zA-Z0-9\-._~+/]+=*/g, // Bearer tokens
  /ghp_[a-zA-Z0-9]{36}/g, // GitHub tokens
  /(api[_-]?key|secret|token|password)\s*[:=]\s*\S+/gi, // Key-value pairs
];

const PII_PATTERNS = [
  /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email
  /\b\d{3}-\d{3}-\d{4}\b/g, // Phone (US)
];

function redactSensitive(text) {
  let redacted = text;

  // Redact secrets
  for (const pattern of SECRET_PATTERNS) {
    redacted = redacted.replace(pattern, '[REDACTED]');
  }

  // Redact PII
  for (const pattern of PII_PATTERNS) {
    redacted = redacted.replace(pattern, '[REDACTED]');
  }

  return redacted;
}

// ============================================================================
// Data Collectors
// ============================================================================

function getMetadata() {
  try {
    const gitSha = execSync('git rev-parse HEAD', {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
      cwd: REPO_ROOT,
    }).trim();

    return {
      timestamp: new Date().toISOString(),
      gitSha: gitSha.substring(0, 9),
      platform: `${process.platform}-${process.arch}`,
      nodeVersion: process.version,
    };
  } catch (error) {
    return {
      timestamp: new Date().toISOString(),
      gitSha: 'unknown',
      platform: `${process.platform}-${process.arch}`,
      nodeVersion: process.version,
    };
  }
}

async function getDoctorData() {
  try {
    // Import doctor module
    const doctorModule = await import('./doctor.mjs');
    const { checks, runDoctor } = doctorModule;

    // Run checks
    const results = [];
    for (const check of checks) {
      try {
        const result = await check.run();
        results.push({
          name: check.name,
          pass: result.pass,
          message: result.message,
        });
      } catch (error) {
        results.push({
          name: check.name,
          pass: false,
          message: `Check failed: ${error.message}`,
        });
      }
    }

    const passed = results.filter(r => r.pass).length;
    const failed = results.filter(r => !r.pass).length;

    return {
      checks: results,
      summary: {
        passed,
        failed,
        total: results.length,
      },
    };
  } catch (error) {
    return {
      checks: [],
      summary: {
        passed: 0,
        failed: 0,
        total: 0,
      },
      error: `Failed to run doctor: ${error.message}`,
    };
  }
}

async function getTraceData(recentFailures = 10) {
  try {
    // Import trace service
    const traceModule = await import('../os-platform/core/trace/index.js');
    const trace = traceModule.default || traceModule;
    const traceService = trace.traceService;

    // Query recent failures
    const failures = traceService.query({ type: 'tool_failed' }).slice(0, recentFailures);

    // Extract correlation IDs
    const correlationIds = [...new Set(failures.map(f => f.correlationId).filter(Boolean))];

    // Build pivot summaries (first 3 IDs only, to keep bundle size reasonable)
    const pivots = correlationIds.slice(0, 3).map(correlationId => {
      const events = traceService.query({ correlationId });
      return {
        correlationId,
        eventCount: events.length,
        types: [...new Set(events.map(e => e.type))],
        components: [...new Set(events.map(e => e.component).filter(Boolean))],
      };
    });

    return {
      failures: failures.map(f => ({
        type: f.type,
        correlationId: f.correlationId,
        errorCode: f.errorCode,
        component: f.component,
        timestamp: f.timestamp,
        // Do NOT include stackTrace or payload (may contain sensitive data)
      })),
      correlationIds,
      pivots,
    };
  } catch (error) {
    return {
      failures: [],
      correlationIds: [],
      pivots: [],
      error: `Failed to query traces: ${error.message}`,
    };
  }
}

function generateHints(traceData) {
  const commands = [];
  const nextSteps = [];

  // Generate trace:query commands for each correlation ID
  if (traceData.correlationIds && traceData.correlationIds.length > 0) {
    commands.push('# Query full trace chains for recent failures:');
    for (const corrId of traceData.correlationIds.slice(0, 5)) {
      commands.push(`pnpm run trace:query --correlation ${corrId}`);
    }
  }

  // Add general debugging commands
  commands.push('');
  commands.push('# Query recent failures by type:');
  commands.push('pnpm run trace:query --recent 10 --type tool_failed');
  commands.push('');
  commands.push('# Query by error code:');
  commands.push('pnpm run trace:query --error-code EXECUTION_FAILED');

  // Next steps suggestions
  nextSteps.push('1. Review correlation IDs above and query full trace chains');
  nextSteps.push('2. Check doctor output for environment issues');
  nextSteps.push('3. Verify all gates pass: pnpm run type-check && node --test');
  nextSteps.push('4. If issue persists, examine stackTrace for specific failures');

  return {
    commands,
    nextSteps,
  };
}

// ============================================================================
// Bundle Generator
// ============================================================================

/**
 * Generate support bundle
 * @param {Object} options
 * @param {string} options.output - 'object' or 'file'
 * @param {number} options.recentFailures - Number of recent failures to include
 * @returns {Promise<Object>} Bundle object or file result
 */
export async function generateSupportBundle(options = {}) {
  const { output = 'file', recentFailures = 10 } = options;

  // Collect data
  const meta = getMetadata();
  const doctor = await getDoctorData();
  const traces = await getTraceData(recentFailures);
  const hints = generateHints(traces);

  // Build bundle
  const bundle = {
    meta,
    doctor,
    traces,
    hints,
  };

  // Redact sensitive information from entire bundle
  const bundleStr = JSON.stringify(bundle, null, 2);
  const redactedStr = redactSensitive(bundleStr);
  const redactedBundle = JSON.parse(redactedStr);

  if (output === 'object') {
    return redactedBundle;
  }

  // Write to file
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${timestamp}-bundle.json`;
  const artifactsDir = resolve(REPO_ROOT, 'artifacts/support-bundle');
  const filePath = resolve(artifactsDir, filename);

  // Ensure directory exists
  mkdirSync(artifactsDir, { recursive: true });

  // Write bundle
  writeFileSync(filePath, redactedStr, 'utf-8');

  return {
    filePath,
    size: redactedStr.length,
    timestamp: meta.timestamp,
  };
}

// ============================================================================
// CLI Entrypoint
// ============================================================================

if (
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith('support-bundle.mjs')
) {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║        TERRAFUSION OS: SUPPORT BUNDLE GENERATOR              ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('Generating incident-grade debug bundle...');
  console.log('');

  generateSupportBundle({ output: 'file', recentFailures: 10 })
    .then(result => {
      console.log('✅ Bundle generated successfully');
      console.log('');
      console.log(`  File: ${result.filePath}`);
      console.log(`  Size: ${(result.size / 1024).toFixed(2)} KB`);
      console.log(`  Timestamp: ${result.timestamp}`);
      console.log('');
      console.log('Next steps:');
      console.log('  1. Review bundle for recent failures');
      console.log('  2. Use correlation IDs to query full trace chains');
      console.log('  3. Run: pnpm run trace:query --correlation <id>');
      console.log('');
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Bundle generation failed:', err);
      process.exit(1);
    });
}
