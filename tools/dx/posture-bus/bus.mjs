#!/usr/bin/env node
/**
 * TerraFusion Posture Bus
 *
 * Lightweight event bus that collects governance posture signals
 * from all lanes and produces a unified posture score.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';

const REPO_ROOT = resolve(import.meta.dirname, '../../..');
const POSTURE_DIR = join(REPO_ROOT, '.terrafusion', 'posture');
const POSTURE_FILE = join(POSTURE_DIR, 'latest.json');

/**
 * Governance lanes with their weight in the posture score.
 */
const LANE_WEIGHTS = {
  dev: 0.25,
  governance: 0.25,
  security: 0.25,
  ops: 0.15,
  data: 0.10,
};

/**
 * @typedef {Object} PostureSignal
 * @property {string} lane - Governance lane
 * @property {string} source - Signal source (e.g., 'test-runner', 'lint', 'compliance-scan')
 * @property {number} score - Score 0-100
 * @property {string} status - 'pass' | 'warn' | 'fail'
 * @property {string} [message] - Human-readable message
 * @property {string} timestamp - ISO 8601
 */

/**
 * @typedef {Object} PostureReport
 * @property {string} version
 * @property {string} generatedAt
 * @property {number} overallScore
 * @property {string} overallStatus
 * @property {Object} lanes
 * @property {PostureSignal[]} signals
 * @property {string} hash
 */

/**
 * Create a new posture signal.
 */
export function createSignal(lane, source, score, status, message = '') {
  if (!LANE_WEIGHTS[lane]) {
    throw new Error(`Invalid lane: ${lane}. Valid: ${Object.keys(LANE_WEIGHTS).join(', ')}`);
  }
  if (score < 0 || score > 100) {
    throw new Error(`Score must be 0-100, got: ${score}`);
  }
  return {
    lane,
    source,
    score,
    status,
    message,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Calculate the posture report from collected signals.
 */
export function calculatePosture(signals) {
  // Group signals by lane
  const laneSignals = {};
  for (const lane of Object.keys(LANE_WEIGHTS)) {
    laneSignals[lane] = signals.filter(s => s.lane === lane);
  }

  // Calculate per-lane scores (average of signals in lane)
  const laneScores = {};
  for (const [lane, sigs] of Object.entries(laneSignals)) {
    if (sigs.length === 0) {
      laneScores[lane] = { score: 0, status: 'unknown', signalCount: 0 };
    } else {
      const avg = sigs.reduce((sum, s) => sum + s.score, 0) / sigs.length;
      const worstStatus = sigs.some(s => s.status === 'fail') ? 'fail' :
                          sigs.some(s => s.status === 'warn') ? 'warn' : 'pass';
      laneScores[lane] = {
        score: Math.round(avg * 10) / 10,
        status: worstStatus,
        signalCount: sigs.length,
      };
    }
  }

  // Calculate weighted overall score
  let overallScore = 0;
  let totalWeight = 0;
  for (const [lane, weight] of Object.entries(LANE_WEIGHTS)) {
    if (laneScores[lane].signalCount > 0) {
      overallScore += laneScores[lane].score * weight;
      totalWeight += weight;
    }
  }
  overallScore = totalWeight > 0 ? Math.round((overallScore / totalWeight) * 10) / 10 : 0;

  const overallStatus = overallScore >= 90 ? 'excellent' :
                        overallScore >= 70 ? 'good' :
                        overallScore >= 50 ? 'warning' : 'critical';

  const report = {
    version: '1.0',
    generatedAt: new Date().toISOString(),
    overallScore,
    overallStatus,
    lanes: laneScores,
    signals,
    hash: '',
  };

  // Add integrity hash
  report.hash = createHash('sha256').update(JSON.stringify({ ...report, hash: '' })).digest('hex');

  return report;
}

/**
 * Save posture report to disk.
 */
export async function savePosture(report) {
  if (!existsSync(POSTURE_DIR)) {
    await mkdir(POSTURE_DIR, { recursive: true });
  }
  await writeFile(POSTURE_FILE, JSON.stringify(report, null, 2));
  return POSTURE_FILE;
}

/**
 * Load the latest posture report.
 */
export async function loadPosture() {
  if (!existsSync(POSTURE_FILE)) {
    return null;
  }
  return JSON.parse(await readFile(POSTURE_FILE, 'utf8'));
}

/**
 * Collect default posture signals from the workspace.
 */
export async function collectDefaultSignals() {
  const signals = [];

  // Dev lane: check for test results
  const testResultsExist = existsSync(join(REPO_ROOT, 'os-platform', 'development', 'testing-suite'));
  signals.push(createSignal('dev', 'test-infrastructure', testResultsExist ? 75 : 25, testResultsExist ? 'pass' : 'warn', testResultsExist ? 'Test suite present' : 'Test suite not found'));

  // Dev lane: check for lint config
  const eslintExists = existsSync(join(REPO_ROOT, 'frontend', '.eslintrc.cjs')) || existsSync(join(REPO_ROOT, 'frontend', 'eslint.config.js'));
  signals.push(createSignal('dev', 'lint-config', eslintExists ? 80 : 30, eslintExists ? 'pass' : 'warn', eslintExists ? 'ESLint configured' : 'ESLint not configured'));

  // Governance lane: check for evidence pack
  const evidenceExists = existsSync(join(REPO_ROOT, '.terrafusion', 'evidence', 'latest-receipt.json'));
  signals.push(createSignal('governance', 'evidence-pack', evidenceExists ? 90 : 40, evidenceExists ? 'pass' : 'warn', evidenceExists ? 'Evidence pack present' : 'No evidence pack'));

  // Governance lane: check for skills registry
  const skillsExist = existsSync(join(REPO_ROOT, 'tools', 'dx', 'skills', 'registry.json'));
  signals.push(createSignal('governance', 'skills-registry', skillsExist ? 85 : 30, skillsExist ? 'pass' : 'warn', skillsExist ? 'Skills registry active' : 'No skills registry'));

  // Security lane: check for security project
  const securityExists = existsSync(join(REPO_ROOT, 'backend', 'src', 'TerraFusion.Security', 'TerraFusion.Security.csproj'));
  signals.push(createSignal('security', 'security-project', securityExists ? 80 : 20, securityExists ? 'pass' : 'fail', securityExists ? 'Security project integrated' : 'Security project missing'));

  // Security lane: check for audit log
  const auditExists = existsSync(join(REPO_ROOT, '.terrafusion', 'audit.log'));
  signals.push(createSignal('security', 'audit-log', auditExists ? 85 : 30, auditExists ? 'pass' : 'warn', auditExists ? 'Audit log active' : 'No audit log'));

  // Ops lane: check for CI workflows
  const ciExists = existsSync(join(REPO_ROOT, '.github', 'workflows'));
  signals.push(createSignal('ops', 'ci-workflows', ciExists ? 80 : 20, ciExists ? 'pass' : 'fail', ciExists ? 'CI workflows configured' : 'No CI workflows'));

  // Data lane: check for database migrations
  const migrationsExist = existsSync(join(REPO_ROOT, 'backend', 'src', 'TerraFusion.Data'));
  signals.push(createSignal('data', 'data-layer', migrationsExist ? 80 : 30, migrationsExist ? 'pass' : 'warn', migrationsExist ? 'Data layer present' : 'No data layer'));

  // Governance lane: check for contracts
  const contractsDir = join(REPO_ROOT, 'tools', 'dx', 'command-contracts');
  if (existsSync(contractsDir)) {
    const { readdirSync } = await import('node:fs');
    const contracts = readdirSync(contractsDir).filter(f => f.endsWith('.contract.json'));
    signals.push(createSignal('governance', 'command-contracts', contracts.length >= 5 ? 90 : 60, 'pass', `${contracts.length} contracts`));
  } else {
    signals.push(createSignal('governance', 'command-contracts', 20, 'fail', 'No contracts directory'));
  }

  return signals;
}
