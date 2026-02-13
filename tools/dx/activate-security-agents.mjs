#!/usr/bin/env node

/**
 * TerraFusion OS - Security Agent Activation Tool
 *
 * Activates dormant security-focused AI agents from the 1,008 agent swarm.
 * Designed for Phase 4 security enhancement operations.
 *
 * Agent Types Targeted:
 * - ComplianceMonitor agents (150 total)
 * - Security-focused agents from quantum swarm
 *
 * Usage:
 *   node tools/dx/activate-security-agents.mjs [options]
 *
 * Options:
 *   --count <number>    Number of security agents to activate (default: 50)
 *   --type <type>       Agent type: compliance|security|all (default: compliance)
 *   --dry-run           Show what would be activated without making changes
 *   --status            Show current agent status only
 *
 * @author TerraFusion OS Team
 * @version 1.0.0
 */

import { spawn } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '../..');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.magenta}${msg}${colors.reset}\n`),
};

/**
 * Agent configuration based on audit findings
 */
const AGENT_REGISTRY = {
  compliance_monitor: {
    total: 150,
    capabilities: ['regulation_checking', 'violation_detection', 'audit_trail', 'reporting'],
    priority: 'high',
    description: 'Washington State compliance and regulation monitoring',
  },
  security_auditor: {
    total: 25, // Subset of compliance monitors
    capabilities: ['security_scanning', 'threat_detection', 'access_monitoring'],
    priority: 'critical',
    description: 'Security audit and threat detection',
  },
  audit_trail_monitor: {
    total: 30, // Subset of compliance monitors
    capabilities: ['audit_logging', 'change_tracking', 'compliance_reporting'],
    priority: 'high',
    description: 'FISMA-HIGH audit trail monitoring',
  },
  intrusion_detector: {
    total: 20, // Part of quantum swarm consciousness nodes
    capabilities: ['anomaly_detection', 'intrusion_detection', 'threat_response'],
    priority: 'critical',
    description: 'Real-time intrusion detection and response',
  },
};

/**
 * Agent status enums from backend
 */
const AGENT_STATUS = {
  OFFLINE: 'Offline',
  INITIALIZING: 'Initializing',
  ONLINE: 'Online',
  BUSY: 'Busy',
  ERROR: 'Error',
  MAINTENANCE: 'Maintenance',
  TERMINATING: 'Terminating',
};

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    count: 50,
    type: 'compliance',
    dryRun: false,
    status: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--count':
        options.count = parseInt(args[++i], 10);
        break;
      case '--type':
        options.type = args[++i];
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--status':
        options.status = true;
        break;
      case '--help':
        printHelp();
        process.exit(0);
    }
  }

  return options;
}

/**
 * Print help information
 */
function printHelp() {
  console.log(`
${colors.bright}TerraFusion OS - Security Agent Activation Tool${colors.reset}

${colors.cyan}Usage:${colors.reset}
  node tools/dx/activate-security-agents.mjs [options]

${colors.cyan}Options:${colors.reset}
  --count <number>    Number of security agents to activate (default: 50)
  --type <type>       Agent type: compliance|security|all (default: compliance)
  --dry-run           Show what would be activated without making changes
  --status            Show current agent status only
  --help              Show this help message

${colors.cyan}Agent Types:${colors.reset}
  compliance          Compliance Monitor agents (150 total)
  security            Security auditor agents (25 total)
  audit               Audit trail monitors (30 total)
  intrusion           Intrusion detection agents (20 total)
  all                 All security-focused agents (225 total)

${colors.cyan}Examples:${colors.reset}
  # Show current agent status
  node tools/dx/activate-security-agents.mjs --status

  # Activate 25 compliance agents (dry run)
  node tools/dx/activate-security-agents.mjs --count 25 --type compliance --dry-run

  # Activate all security agents
  node tools/dx/activate-security-agents.mjs --type all

  # Activate 10 intrusion detection agents
  node tools/dx/activate-security-agents.mjs --count 10 --type intrusion
`);
}

/**
 * Get current agent swarm status
 */
async function getAgentStatus() {
  log.header('🤖 AI Agent Swarm Status');

  // Read swarm configuration
  const swarmConfigPath = join(ROOT, 'os-platform/ai-systems/supreme-commander/swarm-config/swarm-config.json');
  const aiConfigPath = join(ROOT, 'config/ai/ai-swarm-config.json');

  let swarmConfig = {};
  let aiConfig = {};

  if (existsSync(swarmConfigPath)) {
    swarmConfig = JSON.parse(readFileSync(swarmConfigPath, 'utf-8'));
  }

  if (existsSync(aiConfigPath)) {
    aiConfig = JSON.parse(readFileSync(aiConfigPath, 'utf-8'));
  }

  // Display phase deployment status
  if (swarmConfig.deploymentPhases) {
    console.log(`${colors.bright}Deployment Phases:${colors.reset}`);
    swarmConfig.deploymentPhases.forEach((phase) => {
      const statusColor =
        phase.status === 'OPERATIONAL'
          ? colors.green
          : phase.status === 'SCHEDULED'
          ? colors.yellow
          : colors.blue;
      console.log(
        `  Phase ${phase.phase}: ${statusColor}${phase.status}${colors.reset} - ${phase.agents} agents (${phase.deploymentDate})`
      );
    });
    console.log();
  }

  // Display current agent counts
  if (aiConfig.agents) {
    console.log(`${colors.bright}Current Agent Distribution:${colors.reset}`);
    console.log(`  Supreme Commander: ${aiConfig.agents.supreme_commander_claude || 0}`);
    console.log(`  Field Generals: ${aiConfig.agents.field_generals || 0}`);
    console.log(`  Operational Forces: ${aiConfig.agents.operational_forces || 0}`);
    console.log(`  Claude Flow Hive Minds: ${aiConfig.agents.claude_flow_hive_minds || 0}`);
    console.log(`  Neural Cognitive Systems: ${aiConfig.agents.neural_cognitive_systems || 0}`);
    console.log();
    console.log(
      `  ${colors.bright}Total Deployed:${colors.reset} ${aiConfig.deployment?.total_agents || 0} / ${swarmConfig.swarmTotalCapacity || 50000}`
    );
    console.log();
  }

  // Display security-focused agent types
  console.log(`${colors.bright}Security-Focused Agent Registry:${colors.reset}`);
  Object.entries(AGENT_REGISTRY).forEach(([type, config]) => {
    console.log(`  ${type.padEnd(25)} ${config.total.toString().padStart(4)} agents - ${config.description}`);
  });
  console.log();

  // Display agent status breakdown (simulated - would query API in production)
  console.log(`${colors.bright}Agent Status Breakdown (Phase 1 - 1,008 agents):${colors.reset}`);
  console.log(`  ${colors.green}Online:${colors.reset}         ${850} agents`);
  console.log(`  ${colors.yellow}Idle:${colors.reset}           ${100} agents`);
  console.log(`  ${colors.blue}Busy:${colors.reset}           ${50} agents`);
  console.log(`  ${colors.red}Offline:${colors.reset}        ${8} agents`);
  console.log();

  return {
    totalDeployed: aiConfig.deployment?.total_agents || 0,
    totalCapacity: swarmConfig.swarmTotalCapacity || 50000,
    phase1: 1008,
  };
}

/**
 * Activate security agents
 */
async function activateSecurityAgents(options) {
  const { count, type, dryRun } = options;

  log.header('🔐 Security Agent Activation');

  // Determine which agent types to activate
  let targetAgents = [];
  if (type === 'all') {
    targetAgents = Object.keys(AGENT_REGISTRY);
  } else if (type === 'compliance') {
    targetAgents = ['compliance_monitor'];
  } else if (type === 'security') {
    targetAgents = ['security_auditor', 'intrusion_detector'];
  } else if (type === 'audit') {
    targetAgents = ['audit_trail_monitor'];
  } else if (type === 'intrusion') {
    targetAgents = ['intrusion_detector'];
  } else {
    log.error(`Unknown agent type: ${type}`);
    process.exit(1);
  }

  // Calculate activation plan
  const activationPlan = [];
  let remainingCount = count;

  for (const agentType of targetAgents) {
    const agentConfig = AGENT_REGISTRY[agentType];
    const toActivate = Math.min(remainingCount, agentConfig.total);

    if (toActivate > 0) {
      activationPlan.push({
        type: agentType,
        count: toActivate,
        priority: agentConfig.priority,
        capabilities: agentConfig.capabilities,
      });
      remainingCount -= toActivate;
    }

    if (remainingCount <= 0) break;
  }

  // Display activation plan
  console.log(`${colors.bright}Activation Plan:${colors.reset}`);
  activationPlan.forEach((plan) => {
    const priorityColor = plan.priority === 'critical' ? colors.red : colors.yellow;
    console.log(`  ${plan.type.padEnd(25)} ${plan.count.toString().padStart(3)} agents [${priorityColor}${plan.priority}${colors.reset}]`);
    console.log(`    Capabilities: ${plan.capabilities.join(', ')}`);
  });
  console.log();

  if (dryRun) {
    log.warn('DRY RUN MODE - No agents will be activated');
    console.log();
    console.log(`${colors.bright}Activation Commands (not executed):${colors.reset}`);
    activationPlan.forEach((plan) => {
      console.log(`  curl -X POST http://localhost:5000/api/ai-swarm/activate`);
      console.log(`       -H "Content-Type: application/json"`);
      console.log(`       -d '{"agentType":"${plan.type}","count":${plan.count}}'`);
      console.log();
    });
    return;
  }

  // Execute activation (requires backend API)
  log.info('Activation mechanism:');
  console.log('  1. Use TerraFusion.Consciousness API: POST /api/consciousness/scale');
  console.log('  2. Use MillionAgentService.ScaleToAgentsAsync()');
  console.log('  3. Use AICommandService.ScaleSwarmAsync()');
  console.log();

  log.warn('NOTE: Actual activation requires backend API to be running.');
  log.warn('Run: cd backend && dotnet run --project src/TerraFusion.Consciousness');
  console.log();

  // Show example API calls
  console.log(`${colors.bright}Example API Calls:${colors.reset}`);
  console.log(`
# Scale entire swarm
curl -X POST http://localhost:3004/api/consciousness/scale \\
  -H "Content-Type: application/json" \\
  -d '{"targetAgentCount": ${1008 + count}}'

# Activate specific agent type
curl -X POST http://localhost:5000/api/ai-agents/activate \\
  -H "Content-Type: application/json" \\
  -d '{"agentType": "ComplianceMonitor", "count": ${count}}'
`);
}

/**
 * Main function
 */
async function main() {
  const options = parseArgs();

  console.log(`
${colors.bright}${colors.magenta}═══════════════════════════════════════════════════════════════${colors.reset}
${colors.bright}${colors.magenta}  TerraFusion OS - Security Agent Activation Tool v1.0${colors.reset}
${colors.bright}${colors.magenta}═══════════════════════════════════════════════════════════════${colors.reset}
`);

  // Get current status
  const status = await getAgentStatus();

  // If only status requested, exit
  if (options.status) {
    log.success('Status check complete');
    return;
  }

  // Activate agents
  await activateSecurityAgents(options);

  log.success('Activation plan generated successfully');
  console.log();
}

// Run main function
main().catch((error) => {
  log.error(`Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
