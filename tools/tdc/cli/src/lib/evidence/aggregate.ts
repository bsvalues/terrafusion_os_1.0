/**
 * Evidence Pack Aggregator
 *
 * Aggregates all lane-specific audit contracts into a single deterministic
 * Evidence Pack with cryptographic integrity (SHA-256 hashing).
 *
 * Strict rollup rules:
 * - ANY child lane FAIL → overall FAIL
 * - ANY child lane WARN → overall WARN (if no FAIL)
 * - ALL child lanes SKIP → overall SKIP
 * - Otherwise → overall PASS
 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { generateMarkdownSnippet } from './markdown';

export interface EvidencePackOptions {
  contractFiles: string[];
  prNumber?: number;
  branchRef?: string;
  contextPath: string;
}

export interface ContractArtifact {
  skillName: string;
  lane: string;
  status: 'PASS' | 'FAIL' | 'WARN' | 'SKIP';
  violationsCount: number;
  artifactPath: string;
  hash: string;
  cid?: string;
  executedAt?: string;
}

export interface EvidencePack {
  contractVersion: string;
  prNumber?: number;
  branchRef?: string;
  generatedAt: string;
  overallStatus: 'PASS' | 'FAIL' | 'WARN' | 'SKIP';
  lanesAudited: string[];
  contracts: ContractArtifact[];
  totalViolations: number;
  contextHash: string;
  markdownSnippet: string;
  metadata?: {
    tdcVersion?: string;
    nodeVersion?: string;
    ciEnvironment?: string;
    triggeredBy?: string;
  };
}

/**
 * Compute SHA-256 hash of a file
 */
function hashFile(filePath: string): string {
  const content = fs.readFileSync(filePath, 'utf8');
  const hash = crypto.createHash('sha256').update(content).digest('hex');
  return `sha256:${hash}`;
}

/**
 * Load and validate a contract artifact
 */
function loadContractArtifact(filePath: string): ContractArtifact {
  const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // Extract required fields (contract schema enforcement will be added in Phase 7A)
  const skillName = content.skillName || path.basename(filePath, '.json');
  const lane = content.lane || 'unknown';
  const status = content.status || 'SKIP';
  const violationsCount = content.violationsCount || content.violations?.length || 0;
  const executedAt = content.executedAt || content.generatedAt;

  return {
    skillName,
    lane,
    status,
    violationsCount,
    artifactPath: filePath,
    hash: hashFile(filePath),
    executedAt,
  };
}

/**
 * Compute overall status using strict rollup rules
 */
function computeOverallStatus(contracts: ContractArtifact[]): 'PASS' | 'FAIL' | 'WARN' | 'SKIP' {
  if (contracts.length === 0) return 'SKIP';

  // ANY FAIL → overall FAIL
  if (contracts.some(c => c.status === 'FAIL')) return 'FAIL';

  // ANY WARN → overall WARN (no FAIL present)
  if (contracts.some(c => c.status === 'WARN')) return 'WARN';

  // ALL SKIP → overall SKIP
  if (contracts.every(c => c.status === 'SKIP')) return 'SKIP';

  // Otherwise → PASS
  return 'PASS';
}

/**
 * Get current git branch name
 */
function getCurrentBranch(): string | undefined {
  try {
    const { execSync } = require('child_process');
    return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return undefined;
  }
}

/**
 * Get PR number from environment (GitHub Actions)
 */
function getPRNumberFromEnv(): number | undefined {
  const prNumber = process.env.GITHUB_PR_NUMBER || process.env.PR_NUMBER;
  return prNumber ? parseInt(prNumber) : undefined;
}

/**
 * Aggregate all lane contracts into Evidence Pack
 */
export async function aggregateEvidencePack(options: EvidencePackOptions): Promise<EvidencePack> {
  const contracts: ContractArtifact[] = [];

  // Load and validate all contract artifacts
  for (const file of options.contractFiles) {
    try {
      const artifact = loadContractArtifact(file);
      contracts.push(artifact);
    } catch (error: any) {
      console.warn(`Warning: Failed to load contract ${file}: ${error.message}`);
    }
  }

  // Sort contracts by skillName for determinism
  contracts.sort((a, b) => a.skillName.localeCompare(b.skillName));

  // Extract unique lanes
  const lanesAudited = Array.from(new Set(contracts.map(c => c.lane))).sort();

  // Compute overall status
  const overallStatus = computeOverallStatus(contracts);

  // Compute total violations
  const totalViolations = contracts.reduce((sum, c) => sum + c.violationsCount, 0);

  // Hash Context Pack (if exists)
  let contextHash = 'sha256:0000000000000000000000000000000000000000000000000000000000000000';
  if (fs.existsSync(options.contextPath)) {
    contextHash = hashFile(options.contextPath);
  }

  // Detect PR number and branch
  const prNumber = options.prNumber || getPRNumberFromEnv();
  const branchRef = options.branchRef || getCurrentBranch();

  // Build Evidence Pack
  const evidencePack: EvidencePack = {
    contractVersion: '1.0.0',
    prNumber,
    branchRef,
    generatedAt: new Date().toISOString(),
    overallStatus,
    lanesAudited,
    contracts,
    totalViolations,
    contextHash,
    markdownSnippet: '', // Will be generated below
    metadata: {
      tdcVersion: '1.0.0',
      nodeVersion: process.version,
      ciEnvironment: process.env.CI ? 'github-actions' : 'local',
      triggeredBy: process.env.GITHUB_ACTOR || process.env.USER || 'unknown',
    },
  };

  // Generate markdown snippet
  evidencePack.markdownSnippet = generateMarkdownSnippet(evidencePack);

  return evidencePack;
}
