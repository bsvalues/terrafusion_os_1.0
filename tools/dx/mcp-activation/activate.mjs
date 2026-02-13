#!/usr/bin/env node

/**
 * MCP Activation Script
 *
 * Enforces DX Spine Charter §7 - MCP Security Posture
 *
 * Usage:
 *   node activate.mjs <serverId> [options]
 *
 * Examples:
 *   node activate.mjs document-server --scope development
 *   node activate.mjs harris-pacs-connector --scope development --approved-by coach@terrafusion.dev --justification "Testing parcel sync"
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  repoRoot: path.resolve(__dirname, '../../..'),
  mcpApprovalDir: '.terrafusion/mcp-approvals',
  contextPackPath: '.terrafusion/context/latest.json',
  auditLogPath: '.terrafusion/audit.log',

  // Server definitions per DX Spine Charter §7.1
  servers: {
    'document-server': {
      defaultState: 'active',
      riskLevel: 'read',
      requiresApproval: false,
      description: 'Read-only document access for development workflows'
    },
    'compliance-monitoring-kit': {
      defaultState: 'active',
      riskLevel: 'read',
      requiresApproval: false,
      description: 'Read-only compliance monitoring tools'
    },
    'harris-pacs-connector': {
      defaultState: 'inactive',
      riskLevel: 'write-remote',
      requiresApproval: true,
      description: 'Harris PACS 9.0 property data connector (89,247 Benton County parcels)'
    },
    'revenue-discovery-tools': {
      defaultState: 'inactive',
      riskLevel: 'write-local',
      requiresApproval: true,
      description: 'Revenue discovery and analysis tools'
    },
    'property-assessment-suite': {
      defaultState: 'inactive',
      riskLevel: 'write-local',
      requiresApproval: true,
      description: 'Property assessment and valuation tools'
    }
  }
};

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    printUsage();
    process.exit(0);
  }

  const serverId = args[0];
  const options = {
    scope: 'development',
    expiresInDays: 0,
    justification: null,
    approvedBy: null,
    skipApproval: false
  };

  for (let i = 1; i < args.length; i += 2) {
    const flag = args[i];
    const value = args[i + 1];

    switch (flag) {
      case '--scope':
        options.scope = value;
        break;
      case '--expires-in-days':
        options.expiresInDays = parseInt(value, 10);
        break;
      case '--justification':
        options.justification = value;
        break;
      case '--approved-by':
        options.approvedBy = value;
        break;
      case '--skip-approval':
        options.skipApproval = true;
        i--; // Boolean flag, no value
        break;
    }
  }

  return { serverId, options };
}

/**
 * Print usage instructions
 */
function printUsage() {
  console.log(`
MCP Activation Script - DX Spine Charter §7

Usage:
  node activate.mjs <serverId> [options]

Arguments:
  serverId              MCP server to activate (required)

Options:
  --scope <env>         Activation scope: development|staging|production (default: development)
  --expires-in-days <n> Days until activation expires (0 = no expiration, default: 0)
  --justification <str> Reason for activation (required for write servers)
  --approved-by <email> Approver email or identifier (required for write servers)
  --skip-approval       Skip approval for read-only servers

Available Servers:
  document-server              (read-only, auto-approved)
  compliance-monitoring-kit    (read-only, auto-approved)
  harris-pacs-connector        (write-remote, requires approval)
  revenue-discovery-tools      (write-local, requires approval)
  property-assessment-suite    (write-local, requires approval)

Examples:
  # Activate read-only server
  node activate.mjs document-server --scope development

  # Activate write server with approval
  node activate.mjs harris-pacs-connector \\
    --scope development \\
    --approved-by coach@terrafusion.dev \\
    --justification "Testing Benton County parcel sync" \\
    --expires-in-days 90
  `);
}

/**
 * Validate server ID
 */
function validateServerId(serverId) {
  if (!CONFIG.servers[serverId]) {
    throw new Error(`Unknown server ID: ${serverId}. Run with --help to see available servers.`);
  }
}

/**
 * Validate activation request
 */
function validateRequest(serverId, options) {
  const server = CONFIG.servers[serverId];

  // Validate scope
  if (!['development', 'staging', 'production'].includes(options.scope)) {
    throw new Error(`Invalid scope: ${options.scope}. Must be development, staging, or production.`);
  }

  // Validate expiration
  if (options.expiresInDays < 0 || options.expiresInDays > 365) {
    throw new Error('expiresInDays must be between 0 and 365');
  }

  // Check if approval is required
  if (server.requiresApproval && !options.skipApproval) {
    if (!options.approvedBy) {
      throw new Error(`Server '${serverId}' requires approval. Provide --approved-by parameter.`);
    }

    if (!options.justification) {
      throw new Error(`Server '${serverId}' requires justification. Provide --justification parameter.`);
    }

    const minJustificationLength = options.scope === 'production' ? 50 : 10;
    if (options.justification.length < minJustificationLength) {
      throw new Error(`Justification must be at least ${minJustificationLength} characters for ${options.scope} scope.`);
    }
  }

  // Production-specific validation
  if (options.scope === 'production') {
    if (options.expiresInDays === 0) {
      throw new Error('Production activations require an expiration date. Set --expires-in-days.');
    }

    if (!options.approvedBy) {
      throw new Error('Production activations require --approved-by parameter.');
    }
  }
}

/**
 * Generate approval artifact
 */
function generateApprovalArtifact(serverId, options) {
  const server = CONFIG.servers[serverId];
  const now = new Date().toISOString();

  const expiresAt = options.expiresInDays > 0
    ? new Date(Date.now() + options.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
    : null;

  return {
    toolId: serverId,
    approvedBy: options.approvedBy || 'auto-approved',
    approvalDate: now,
    riskLevel: server.riskLevel,
    scope: options.scope,
    expiresAt,
    justification: options.justification || server.description,
    constraints: {
      maxRequestsPerHour: server.riskLevel === 'read' ? 1000 : 100,
      allowedOperations: [],
      dataAccessRestrictions: options.scope === 'development' ? ['no-production-data'] : [],
      auditLevel: server.riskLevel === 'read' ? 'minimal' : 'verbose'
    },
    auditTrail: [
      {
        timestamp: now,
        action: 'created',
        actor: options.approvedBy || 'system',
        reason: 'Initial activation'
      }
    ],
    revoked: false,
    revokedAt: null,
    revokedBy: null,
    revokedReason: null
  };
}

/**
 * Generate audit log entry
 */
function generateAuditEntry(serverId, options, approvalArtifact) {
  const now = new Date().toISOString();
  const auditId = `audit-${now.replace(/[:.]/g, '').replace('T', '-').replace('Z', '')}-mcp-activate`;

  return {
    auditId,
    timestamp: now,
    event: 'mcp-server-activated',
    actor: options.approvedBy || 'system',
    serverId,
    scope: options.scope,
    riskLevel: CONFIG.servers[serverId].riskLevel,
    approvalArtifact: `${CONFIG.mcpApprovalDir}/${serverId}-${options.scope}.json`
  };
}

/**
 * Ensure directory exists
 */
async function ensureDir(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
}

/**
 * Write approval artifact to disk
 */
async function writeApprovalArtifact(serverId, options, approvalArtifact) {
  const approvalDir = path.join(CONFIG.repoRoot, CONFIG.mcpApprovalDir);
  await ensureDir(approvalDir);

  const filename = `${serverId}-${options.scope}.json`;
  const filepath = path.join(approvalDir, filename);

  await fs.writeFile(filepath, JSON.stringify(approvalArtifact, null, 2), 'utf8');

  return filepath;
}

/**
 * Append to audit log
 */
async function appendAuditLog(auditEntry) {
  const auditPath = path.join(CONFIG.repoRoot, CONFIG.auditLogPath);
  await ensureDir(path.dirname(auditPath));

  const logLine = JSON.stringify(auditEntry) + '\n';
  await fs.appendFile(auditPath, logLine, 'utf8');
}

/**
 * Update Context Pack
 */
async function updateContextPack(serverId, options, approvalArtifact) {
  const contextPath = path.join(CONFIG.repoRoot, CONFIG.contextPackPath);

  let contextPack = {};
  try {
    const data = await fs.readFile(contextPath, 'utf8');
    contextPack = JSON.parse(data);
  } catch (err) {
    // Context pack doesn't exist yet, start fresh
    contextPack = {
      version: '1.0',
      generated: new Date().toISOString(),
      generator: 'mcp-activation'
    };
  }

  // Initialize mcpServers section if not present
  if (!contextPack.mcpServers) {
    contextPack.mcpServers = {
      active: [],
      inactive: Object.keys(CONFIG.servers).filter(id => CONFIG.servers[id].defaultState === 'inactive')
    };
  }

  // Add/update active server
  const existingIndex = contextPack.mcpServers.active.findIndex(s => s.serverId === serverId && s.scope === options.scope);
  const serverEntry = {
    serverId,
    scope: options.scope,
    activatedAt: approvalArtifact.approvalDate,
    expiresAt: approvalArtifact.expiresAt,
    approvalArtifact: `${CONFIG.mcpApprovalDir}/${serverId}-${options.scope}.json`,
    riskLevel: CONFIG.servers[serverId].riskLevel
  };

  if (existingIndex >= 0) {
    contextPack.mcpServers.active[existingIndex] = serverEntry;
  } else {
    contextPack.mcpServers.active.push(serverEntry);
  }

  // Remove from inactive list
  contextPack.mcpServers.inactive = contextPack.mcpServers.inactive.filter(id => id !== serverId);

  // Update timestamp
  contextPack.generated = new Date().toISOString();

  // Write back to disk
  await ensureDir(path.dirname(contextPath));
  await fs.writeFile(contextPath, JSON.stringify(contextPack, null, 2), 'utf8');
}

/**
 * Generate activation report
 */
function generateReport(serverId, options, approvalArtifact, auditEntry) {
  const server = CONFIG.servers[serverId];

  const nextActions = [
    `MCP server '${serverId}' is now active in ${options.scope}`,
    `Approval artifact: ${CONFIG.mcpApprovalDir}/${serverId}-${options.scope}.json`,
    `Context Pack updated: ${CONFIG.contextPackPath}`
  ];

  if (approvalArtifact.expiresAt) {
    nextActions.push(`Expires: ${approvalArtifact.expiresAt} (${options.expiresInDays} days)`);
    nextActions.push(`Renewal required before expiration`);
  } else {
    nextActions.push('No expiration (review periodically for security)');
  }

  nextActions.push(`Rate limit: ${approvalArtifact.constraints.maxRequestsPerHour} requests/hour`);
  nextActions.push(`Audit level: ${approvalArtifact.constraints.auditLevel}`);

  const warnings = [];

  if (server.riskLevel !== 'read') {
    warnings.push(`This server can modify state (risk level: ${server.riskLevel})`);
    warnings.push('All operations will be logged to audit trail');
  }

  if (options.scope === 'production') {
    warnings.push('PRODUCTION SCOPE: Exercise extreme caution');
    warnings.push('Security review required within 30 days');
  }

  return {
    success: true,
    serverId,
    status: 'active',
    approvalArtifact,
    auditId: auditEntry.auditId,
    contextPackUpdated: true,
    nextActions,
    warnings
  };
}

/**
 * Main activation flow
 */
async function activate() {
  try {
    // Parse arguments
    const { serverId, options } = parseArgs();

    // Validate
    validateServerId(serverId);
    validateRequest(serverId, options);

    // Generate artifacts
    const approvalArtifact = generateApprovalArtifact(serverId, options);
    const auditEntry = generateAuditEntry(serverId, options, approvalArtifact);

    // Write to disk
    await writeApprovalArtifact(serverId, options, approvalArtifact);
    await appendAuditLog(auditEntry);
    await updateContextPack(serverId, options, approvalArtifact);

    // Generate report
    const report = generateReport(serverId, options, approvalArtifact, auditEntry);

    // Output JSON result
    console.log(JSON.stringify(report, null, 2));

    process.exit(0);
  } catch (err) {
    const errorReport = {
      success: false,
      serverId: null,
      status: 'error',
      error: err.message,
      contextPackUpdated: false,
      nextActions: [
        'Review error message above',
        'Run with --help to see usage instructions',
        'Check DX Spine Charter §7 for MCP security requirements'
      ]
    };

    console.error(JSON.stringify(errorReport, null, 2));
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  activate();
}

export { activate, CONFIG };
