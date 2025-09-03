#!/usr/bin/envconst colors = {
  blue: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const API_BASE = process.env.API_BASE || 'http://localhost:5000';
const JWT_TOKEN = process.env.JWT_TOKEN || '';
const OUTPUT_FILE = path.join(__dirname, '..', 'docs', 'REALITY_MATRIX.md');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\xanb[36m'
};

// Helper to make authenticated requests
async function fetchEndpoint(endpoint) {
  try {
    const headers = {};
    if (JWT_TOKEN) {
      headers['Authorization'] = `Bearer ${JWT_TOKEN}`;
    }
    
    const response = await fetch(`${API_BASE}${endpoint}`, { headers });
    
    if (!response.ok) {
      console.warn(`⚠️  ${endpoint} returned ${response.status}`);
      return { error: response.status, endpoint };
    }
    
    return await response.json();
  } catch (error) {
    console.error(`❌ Failed to fetch ${endpoint}:`, error.message);
    return { error: error.message, endpoint };
  }
}

// Fetch all data points
async function gatherSystemStatus() {
  console.log('🔍 Gathering system status...\n');
  
  const [health, modules, agents, security, database, swarm] = await Promise.all([
    fetchEndpoint('/health'),
    fetchEndpoint('/api/modules/status'),
    fetchEndpoint('/api/agents/metrics'),
    fetchEndpoint('/api/security/status'),
    fetchEndpoint('/api/database/status'),
    fetchEndpoint('/api/swarm/status')
  ]);
  
  return { health, modules, agents, security, database, swarm };
}

// Determine status symbol
function getStatusSymbol(status) {
  if (status === 'Healthy' || status === 'Active' || status === true) return '✅';
  if (status === 'Degraded' || status === 'Warning') return '⚠️';
  if (status === 'Unhealthy' || status === 'Failed' || status === false) return '❌';
  return '❓';
}

// Generate the markdown report
function generateMarkdown(data) {
  const now = new Date().toISOString();
  const { health, modules, agents, security, database, swarm } = data;
  
  // Calculate overall system status
  const overallHealthy = 
    health?.status === 'Healthy' &&
    modules?.total > 0 &&
    !agents?.error &&
    security?.authenticationEnabled;
  
  let markdown = `# 🎯 TERRAFUSION OS - REALITY MATRIX
**Generated**: ${now}  
**API Endpoint**: ${API_BASE}  
**Overall Status**: ${getStatusSymbol(overallHealthy)} ${overallHealthy ? 'OPERATIONAL' : 'DEGRADED'}

---

## 📊 System Health Overview

| Component | Status | Details |
|-----------|--------|---------|
| **Core API** | ${getStatusSymbol(health?.status)} | ${health?.status || 'Unknown'} |
| **Database** | ${getStatusSymbol(database?.database?.isConnected)} | ${database?.database?.provider || 'Unknown'} - ${database?.database?.moduleCount || 0} modules |
| **Modules** | ${getStatusSymbol(modules?.total > 0)} | ${modules?.total || 0} modules loaded |
| **AI Swarm** | ${getStatusSymbol(swarm?.swarmStatus?.isOperational)} | ${swarm?.swarmStatus?.activeAgents || 0}/${swarm?.swarmStatus?.totalAgents || 0} agents |
| **Security** | ${getStatusSymbol(security?.authenticationEnabled)} | ${security?.authScheme || 'Unknown'} |

---

## 🔧 Module System Status

`;
  
  // Module details
  if (modules?.modules && Array.isArray(modules.modules)) {
    markdown += `### Active Modules (${modules.modules.length})\n\n`;
    markdown += '| Module | Version | Tier | Status |\n';
    markdown += '|--------|---------|------|--------|\n';
    
    modules.modules.slice(0, 10).forEach(mod => {
      markdown += `| **${mod.name}** | ${mod.version || '1.0.0'} | ${mod.tier || 'Unknown'} | ${getStatusSymbol(mod.status)} ${mod.status || 'Unknown'} |\n`;
    });
    
    if (modules.modules.length > 10) {
      markdown += `| ... and ${modules.modules.length - 10} more | | | |\n`;
    }
  } else {
    markdown += '⚠️ Module information unavailable\n';
  }
  
  markdown += '\n---\n\n## 🤖 AI System Status\n\n';
  
  // AI Agent details
  if (agents && !agents.error) {
    markdown += '### Agent Metrics\n\n';
    markdown += '| Metric | Value |\n';
    markdown += '|--------|-------|\n';
    markdown += `| **Total Agents** | ${agents.totalAgents || 0} |\n`;
    markdown += `| **Active Agents** | ${agents.activeAgents || 0} |\n`;
    markdown += `| **Success Rate** | ${agents.successRate || 0}% |\n`;
    markdown += `| **Avg Latency** | ${agents.avgLatencyMs || 0}ms |\n`;
    
    if (agents.byRole && Object.keys(agents.byRole).length > 0) {
      markdown += '\n### Agents by Role\n\n';
      markdown += '| Role | Count |\n';
      markdown += '|------|-------|\n';
      Object.entries(agents.byRole).forEach(([role, count]) => {
        markdown += `| ${role} | ${count} |\n`;
      });
    }
  } else {
    markdown += '⚠️ AI Agent metrics unavailable\n';
  }
  
  // Security details
  markdown += '\n---\n\n## 🔐 Security Configuration\n\n';
  if (security && !security.error) {
    markdown += '| Setting | Value |\n';
    markdown += '|---------|-------|\n';
    markdown += `| **Authentication** | ${getStatusSymbol(security.authenticationEnabled)} ${security.authScheme || 'Unknown'} |\n`;
    markdown += `| **Audit Logging** | ${getStatusSymbol(security.auditLoggingEnabled)} ${security.auditLoggingEnabled ? 'Enabled' : 'Disabled'} |\n`;
    markdown += `| **MFA** | ${getStatusSymbol(security.mfaEnabled)} ${security.mfaEnabled ? 'Enabled' : 'Disabled'} |\n`;
    markdown += `| **Issuer** | ${security.issuer || 'Not configured'} |\n`;
  } else {
    markdown += '⚠️ Security information unavailable\n';
  }
  
  // Health check details
  if (health?.checks) {
    markdown += '\n---\n\n## 🏥 Detailed Health Checks\n\n';
    markdown += '| Check | Status | Duration | Description |\n';
    markdown += '|-------|--------|----------|-------------|\n';
    
    Object.entries(health.checks).forEach(([name, check]) => {
      const duration = check.duration ? `${check.duration}ms` : 'N/A';
      const description = check.description || check.exception?.message || '';
      markdown += `| **${name}** | ${getStatusSymbol(check.status)} ${check.status} | ${duration} | ${description} |\n`;
    });
  }
  
  markdown += '\n---\n\n';
  markdown += '## 📈 Performance Metrics\n\n';
  markdown += '```\n';
  markdown += `API Response Time: ${health?.totalDuration || 0}ms\n`;
  markdown += `Database Connected: ${database?.database?.isConnected ? 'Yes' : 'No'}\n`;
  markdown += `Module Load Time: ${modules?.loadTimeMs || 0}ms\n`;
  markdown += `Agent Queue Depth: ${agents?.queuedTasks || 0}\n`;
  markdown += '```\n';
  
  markdown += '\n---\n\n';
  markdown += '## 🔄 Auto-Refresh\n\n';
  markdown += 'This document is automatically generated. To refresh:\n\n';
  markdown += '```bash\n';
  markdown += 'node scripts/emit-reality-matrix.js\n';
  markdown += '```\n\n';
  markdown += 'Or with authentication:\n\n';
  markdown += '```bash\n';
  markdown += 'JWT_TOKEN=your-token node scripts/emit-reality-matrix.js\n';
  markdown += '```\n';
  
  return markdown;
}

// Main execution
async function main() {
  try {
    console.log('🚀 Terrafusion Reality Matrix Generator\n');
    console.log(`📍 API Endpoint: ${API_BASE}`);
    console.log(`📄 Output File: ${OUTPUT_FILE}\n`);
    
    const data = await gatherSystemStatus();
    const markdown = generateMarkdown(data);
    
    // Ensure docs directory exists
    const docsDir = path.dirname(OUTPUT_FILE);
    await fs.mkdir(docsDir, { recursive: true });
    
    // Write the markdown file
    await fs.writeFile(OUTPUT_FILE, markdown, 'utf8');
    
    console.log(`\n✅ Reality Matrix generated successfully!`);
    console.log(`📄 View at: ${OUTPUT_FILE}`);
    
    // Print summary to console
    console.log('\n📊 Quick Summary:');
    console.log(`   Modules: ${data.modules?.total || 0}`);
    console.log(`   AI Agents: ${data.agents?.activeAgents || 0}/${data.agents?.totalAgents || 0}`);
    console.log(`   Health: ${data.health?.status || 'Unknown'}`);
    console.log(`   Security: ${data.security?.authenticationEnabled ? 'Enabled' : 'Disabled'}`);
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { gatherSystemStatus, generateMarkdown };
