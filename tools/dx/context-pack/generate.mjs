#!/usr/bin/env node

/**
 * TerraFusion Context Pack Generator
 *
 * Generates the atomic unit of memory for the DX Spine.
 * This file is the SSOT for workspace state.
 *
 * Usage:
 *   node generate.mjs [--output path] [--generator name]
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync, promises as fsPromises } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const { readFile } = fsPromises;

const __dirname = dirname(fileURLToPath(import.meta.url));

// Import drift detection (optional - don't fail if not available)
let detectDrift = null;
try {
  const driftModule = await import('../contract-drift.mjs');
  detectDrift = driftModule.detectDrift;
} catch {
  // Drift detection not available
}

// Configuration
const DEFAULT_OUTPUT = '.terrafusion/context';
const CONTEXT_FILE = 'latest.json';
const CONTEXT_MD = 'latest.md';

/**
 * Execute a shell command and return output
 */
function exec(cmd, options = {}) {
  try {
    return execSync(cmd, { encoding: 'utf8', ...options }).trim();
  } catch (e) {
    return options.fallback ?? '';
  }
}

/**
 * Find the repository root
 */
function findRepoRoot() {
  try {
    return exec('git rev-parse --show-toplevel');
  } catch {
    return process.cwd();
  }
}

/**
 * Get git status information
 */
function getGitInfo(repoRoot) {
  const branch = exec('git branch --show-current', { cwd: repoRoot, fallback: 'unknown' });
  const lastCommit = exec('git rev-parse HEAD', { cwd: repoRoot, fallback: 'unknown' });
  const statusOutput = exec('git status --porcelain', { cwd: repoRoot, fallback: '' });
  const dirtyFiles = statusOutput.split('\n').filter(l => l.trim()).map(l => l.substring(3));

  return { branch, lastCommit, dirtyFiles };
}

/**
 * Check service health by port
 */
function checkServiceHealth(port) {
  try {
    // Check if port is listening
    const result = exec(`ss -tlnp 2>/dev/null | grep ":${port}" || true`);
    return result.includes(`:${port}`) ? 'up' : 'down';
  } catch {
    return 'unknown';
  }
}

/**
 * Get service health status
 */
function getHealthStatus() {
  const services = {
    api: { port: 5000, status: checkServiceHealth(5000) },
    gateway: { port: 3002, status: checkServiceHealth(3002) },
    consciousness: { port: 3004, status: checkServiceHealth(3004) },
    portal: { port: 5174, status: checkServiceHealth(5174) },
    transparency: { port: 8788, status: checkServiceHealth(8788) }
  };

  const upCount = Object.values(services).filter(s => s.status === 'up').length;
  const total = Object.keys(services).length;

  let overallHealth;
  if (upCount === total) overallHealth = 'excellent';
  else if (upCount >= total * 0.6) overallHealth = 'good';
  else if (upCount >= total * 0.3) overallHealth = 'warning';
  else overallHealth = 'critical';

  return { services, overallHealth };
}

/**
 * Scan for TODOs in critical files
 */
function scanTodos(repoRoot) {
  const todos = { critical: [], high: [], medium: [], low: [] };

  try {
    // Scan for security TODOs (critical)
    const securityTodos = exec(
      `grep -rn "TODO" "${repoRoot}/backend/TerraFusion.Security" 2>/dev/null || true`
    );
    if (securityTodos) {
      securityTodos.split('\n').filter(l => l.trim()).slice(0, 5).forEach(line => {
        const match = line.match(/^([^:]+):(\d+):(.+)$/);
        if (match) {
          todos.critical.push({ file: match[1], line: parseInt(match[2]), text: match[3].trim() });
        }
      });
    }

    // Scan for DI TODOs (high)
    const diTodos = exec(
      `grep -rn "TODO.*register\\|TODO.*service" "${repoRoot}/backend" 2>/dev/null | head -5 || true`
    );
    if (diTodos) {
      diTodos.split('\n').filter(l => l.trim()).forEach(line => {
        const match = line.match(/^([^:]+):(\d+):(.+)$/);
        if (match) {
          todos.high.push({ file: match[1], line: parseInt(match[2]), text: match[3].trim() });
        }
      });
    }
  } catch {
    // Ignore grep errors
  }

  return todos;
}

/**
 * Get contract drift status
 */
function getContractDrift() {
  if (!detectDrift) {
    return {
      available: false,
      checked: [],
      drifted: [],
      unknown: [],
      timestamp: null
    };
  }

  try {
    const { results } = detectDrift(false);
    return {
      available: true,
      ...results
    };
  } catch (error) {
    return {
      available: false,
      error: error.message,
      checked: [],
      drifted: [],
      unknown: [],
      timestamp: null
    };
  }
}

/**
 * Determine next actions based on state
 */
function determineNextActions(health, todos, gitInfo, contractDrift = null) {
  const actions = [];

  // Contract drift-based actions (highest priority)
  if (contractDrift && contractDrift.drifted && contractDrift.drifted.length > 0) {
    actions.push(`Fix ${contractDrift.drifted.length} drifted contract(s): ${contractDrift.drifted.join(', ')}`);
  }

  // Health-based actions
  if (health.overallHealth === 'critical') {
    actions.push('Start backend services: tdc launch:backend');
  }

  if (health.services.api.status === 'down') {
    actions.push('Start API server: cd backend && dotnet run --project TerraFusion.API');
  }

  // Git-based actions
  if (gitInfo.dirtyFiles.length > 0) {
    actions.push(`Review ${gitInfo.dirtyFiles.length} uncommitted changes`);
  }

  // Todo-based actions
  if (todos.critical.length > 0) {
    actions.push(`Address ${todos.critical.length} CRITICAL security TODOs`);
  }

  // Default actions
  if (actions.length < 5) {
    actions.push('Run /doctor for full workspace health check');
  }
  if (actions.length < 5) {
    actions.push('Run /compliance to verify FISMA status');
  }

  return actions.slice(0, 5);
}

/**
 * Generate the Context Pack
 */
async function generateContextPack(generator = 'tdc') {
  const repoRoot = findRepoRoot();
  const gitInfo = getGitInfo(repoRoot);
  const health = getHealthStatus();
  const todos = scanTodos(repoRoot);
  const contractDrift = getContractDrift();
  const nextActions = determineNextActions(health, todos, gitInfo, contractDrift);

  // Add skills registry status
  const skillsRegistryPath = join(repoRoot, 'tools', 'dx', 'skills', 'registry.json');
  let skills = { registered: 0, active: 0, skills: [] };
  try {
    if (existsSync(skillsRegistryPath)) {
      const registry = JSON.parse(await readFile(skillsRegistryPath, 'utf8'));
      skills = {
        registered: registry.metadata.totalSkills,
        active: registry.metadata.activeSkills,
        skills: registry.skills.map(s => ({
          id: s.id,
          lane: s.ownerLane,
          status: s.status,
        })),
      };
    }
  } catch { /* non-fatal */ }

  // Update evidence pack from latest receipt
  const receiptPath = join(repoRoot, '.terrafusion', 'evidence', 'latest-receipt.json');
  let evidencePackData = { cid: null, traceUrl: null, latencyMs: null, receiptPresent: false };
  try {
    if (existsSync(receiptPath)) {
      const receipt = JSON.parse(await readFile(receiptPath, 'utf8'));
      evidencePackData = {
        cid: receipt.cid || null,
        traceUrl: null,
        latencyMs: null,
        receiptPresent: true,
      };
    }
  } catch { /* non-fatal */ }

  const contextPack = {
    version: '1.0',
    generated: new Date().toISOString(),
    generator,

    repo: {
      root: repoRoot,
      branch: gitInfo.branch,
      lastCommit: gitInfo.lastCommit,
      dirtyFiles: gitInfo.dirtyFiles
    },

    focus: {
      scene: null,
      lane: 'dev',
      pr: null,
      intent: null
    },

    health,

    governance: {
      tier1EvidenceStatus: 'not-applicable',
      dodVersion: '1.0',
      sceneEnforcementActive: false,
      missingEvidence: []
    },

    contractDrift,

    todos,
    nextActions,

    skills,

    evidencePack: evidencePackData
  };

  return contextPack;
}

/**
 * Generate markdown summary
 */
function generateMarkdownSummary(pack) {
  const healthEmoji = {
    excellent: '🟢',
    good: '🟡',
    warning: '🟠',
    critical: '🔴'
  }[pack.health.overallHealth];

  const servicesList = Object.entries(pack.health.services)
    .map(([name, info]) => `- ${info.status === 'up' ? '✅' : '❌'} ${name} (:${info.port})`)
    .join('\n');

  const todoCount = pack.todos.critical.length + pack.todos.high.length +
                    pack.todos.medium.length + pack.todos.low.length;

  const nextActionsList = pack.nextActions.map((a, i) => `${i + 1}. ${a}`).join('\n');

  // Contract drift section
  let contractDriftSection = '';
  if (pack.contractDrift && pack.contractDrift.available) {
    const driftEmoji = pack.contractDrift.drifted.length === 0 ? '✅' : '⚠️';
    contractDriftSection = `
## Contract Drift ${driftEmoji}

| Metric | Count |
|--------|-------|
| Contracts Checked | ${pack.contractDrift.checked.length} |
| Valid | ${pack.contractDrift.checked.length - pack.contractDrift.drifted.length - pack.contractDrift.unknown.length} |
| Drifted | ${pack.contractDrift.drifted.length} |
| Unknown | ${pack.contractDrift.unknown.length} |

${pack.contractDrift.drifted.length > 0 ? `**Drifted:** ${pack.contractDrift.drifted.join(', ')}` : '**Status:** All contracts valid'}
`;
  }

  // Skills registry section
  let skillsSection = '';
  if (pack.skills && pack.skills.registered > 0) {
    const skillsByLane = pack.skills.skills.reduce((acc, skill) => {
      acc[skill.lane] = (acc[skill.lane] || 0) + 1;
      return acc;
    }, {});
    const laneBreakdown = Object.entries(skillsByLane)
      .map(([lane, count]) => `- ${lane}: ${count}`)
      .join('\n');

    skillsSection = `
## Skills Registry 📚

| Metric | Count |
|--------|-------|
| Registered | ${pack.skills.registered} |
| Active | ${pack.skills.active} |

**By Lane:**
${laneBreakdown}
`;
  }

  return `# TerraFusion Context Pack

**Generated:** ${pack.generated}
**Generator:** ${pack.generator}

## Repository

| Field | Value |
|-------|-------|
| Root | \`${pack.repo.root}\` |
| Branch | \`${pack.repo.branch}\` |
| Last Commit | \`${pack.repo.lastCommit.substring(0, 8)}\` |
| Dirty Files | ${pack.repo.dirtyFiles.length} |

## Health ${healthEmoji}

**Overall:** ${pack.health.overallHealth.toUpperCase()}

### Services
${servicesList}
${contractDriftSection}${skillsSection}
## Focus

| Field | Value |
|-------|-------|
| Lane | ${pack.focus.lane} |
| Scene | ${pack.focus.scene || 'None'} |
| PR | ${pack.focus.pr || 'None'} |

## TODOs (${todoCount} total)

- 🔴 Critical: ${pack.todos.critical.length}
- 🟠 High: ${pack.todos.high.length}
- 🟡 Medium: ${pack.todos.medium.length}
- 🟢 Low: ${pack.todos.low.length}

## Next Actions

${nextActionsList}

---
*Context Pack v${pack.version} — Context never lost.*
`;
}

/**
 * Write Context Pack to disk
 */
function writeContextPack(pack, outputDir) {
  // Ensure directory exists
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  // Write JSON
  const jsonPath = join(outputDir, CONTEXT_FILE);
  writeFileSync(jsonPath, JSON.stringify(pack, null, 2));

  // Write Markdown
  const mdPath = join(outputDir, CONTEXT_MD);
  const markdown = generateMarkdownSummary(pack);
  writeFileSync(mdPath, markdown);

  return { jsonPath, mdPath };
}

/**
 * Main entry point
 */
async function main() {
  const args = process.argv.slice(2);

  // Parse arguments
  let outputDir = DEFAULT_OUTPUT;
  let generator = 'tdc';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--output' && args[i + 1]) {
      outputDir = args[i + 1];
      i++;
    } else if (args[i] === '--generator' && args[i + 1]) {
      generator = args[i + 1];
      i++;
    }
  }

  // Resolve output path relative to repo root
  const repoRoot = findRepoRoot();
  const fullOutputDir = join(repoRoot, outputDir);

  // Generate and write
  console.log('🔄 Generating Context Pack...');
  const pack = await generateContextPack(generator);
  const { jsonPath, mdPath } = writeContextPack(pack, fullOutputDir);

  console.log(`✅ Context Pack written:`);
  console.log(`   JSON: ${jsonPath}`);
  console.log(`   MD:   ${mdPath}`);
  console.log(`\n📊 Health: ${pack.health.overallHealth.toUpperCase()}`);
  console.log(`📋 Next Actions:`);
  pack.nextActions.forEach((a, i) => console.log(`   ${i + 1}. ${a}`));
}

// Run if executed directly
main();

export { generateContextPack, writeContextPack, generateMarkdownSummary };
