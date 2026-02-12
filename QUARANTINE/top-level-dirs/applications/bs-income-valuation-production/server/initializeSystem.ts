/**
 * System Initialization
 * 
 * This module initializes the entire AI system including the Core,
 * MCP, and all agents. It orchestrates the startup sequence and
 * establishes the necessary connections.
 */

import { Core } from '../agents/Core';
import { ValuationAgent } from '../agents/ValuationAgent.new';
import { DataCleanerAgent } from '../agents/DataCleanerAgent.new';
import { ReportingAgent } from '../agents/ReportingAgent.new';
import { ArchitectPrimeAgent } from '../agents/ArchitectPrimeAgent';
import { IntegrationCoordinatorAgent } from '../agents/IntegrationCoordinatorAgent';
import { ValuationLeadAgent } from '../agents/ValuationLeadAgent';
import { DataCleaningLeadAgent } from '../agents/DataCleaningLeadAgent';
import { ReportingLeadAgent } from '../agents/ReportingLeadAgent';
import { ComplianceLeadAgent, ExtendedComponentDomain } from '../agents/ComplianceLeadAgent';
import { DataIntegrationLeadAgent, IntegrationComponentDomain } from '../agents/DataIntegrationLeadAgent';
import { ComponentDomain } from '../agents/ComponentLeadAgent';
import { MASTER_PROMPT } from '../config/masterPrompt';

let systemInitialized = false;
let core: Core;

/**
 * Initialize the AI system
 * Creates and connects all components
 */
export function initializeSystem(): Core {
  if (systemInitialized) {
    console.log('System already initialized, returning existing Core instance');
    return core;
  }
  
  console.log('Initializing AI System...');
  
  // Initialize Core with configuration
  core = Core.getInstance({
    systemName: 'Benton County Property Valuation System',
    version: '1.0.0',
    environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    enableLogging: true
  });
  
  // Create and register operational agents
  const valuationAgent = new ValuationAgent('valuation-agent-1');
  const dataCleanerAgent = new DataCleanerAgent('data-cleaner-agent-1');
  const reportingAgent = new ReportingAgent('reporting-agent-1');
  
  // Create command structure agents
  const architectPrimeAgent = new ArchitectPrimeAgent('architect-prime-1');
  const integrationCoordinatorAgent = new IntegrationCoordinatorAgent('integration-coordinator-1');
  
  // Create Component Lead agents
  const valuationLeadAgent = new ValuationLeadAgent('valuation-lead-1');
  const dataCleaningLeadAgent = new DataCleaningLeadAgent('data-cleaning-lead-1');
  const reportingLeadAgent = new ReportingLeadAgent('reporting-lead-1');
  const complianceLeadAgent = new ComplianceLeadAgent('compliance-lead-1');
  const dataIntegrationLeadAgent = new DataIntegrationLeadAgent('data-integration-lead-1');
  
  // Register operational agents with Core
  core.registerAgent(valuationAgent);
  core.registerAgent(dataCleanerAgent);
  core.registerAgent(reportingAgent);
  
  // Register command structure agents with Core
  core.registerAgent(architectPrimeAgent);
  core.registerAgent(integrationCoordinatorAgent);
  
  // Register Component Lead agents with Core
  core.registerAgent(valuationLeadAgent);
  core.registerAgent(dataCleaningLeadAgent);
  core.registerAgent(reportingLeadAgent);
  core.registerAgent(complianceLeadAgent);
  core.registerAgent(dataIntegrationLeadAgent);
  
  // Register team agents with their respective leads
  valuationLeadAgent.registerTeamAgent(valuationAgent.getAgentId());
  dataCleaningLeadAgent.registerTeamAgent(dataCleanerAgent.getAgentId());
  reportingLeadAgent.registerTeamAgent(reportingAgent.getAgentId());
  
  // Broadcast initial system announcement
  core.broadcastAnnouncement(
    'Benton County Property Valuation System initialized successfully',
    'high'
  );
  
  // Set up system-wide event listeners
  setupEventListeners(core);
  
  systemInitialized = true;
  console.log('AI System initialization complete');
  
  return core;
}

/**
 * Set up event listeners for the Core
 * @param core The Core instance
 */
function setupEventListeners(core: Core): void {
  // Listen for agent registration events
  core.addEventListener('agent_registered', (event) => {
    console.log(`Agent registered event: ${event.data.agentId} (${event.data.agentType})`);
  });
  
  // Listen for error messages
  core.addEventListener('message_error', (event) => {
    const message = event.data;
    console.error(`Error message received: ${message.payload.errorMessage} from ${message.sourceAgentId}`);
  });
  
  // Listen for help requests
  core.addEventListener('message_assistance_requested', (event) => {
    const message = event.data;
    console.log(`Help requested by ${message.sourceAgentId}: ${message.payload.problemDescription}`);
  });
  
  // Listen for health check events
  core.addEventListener('health_check', (event) => {
    const status = event.data;
    
    // If system is degraded or in error, log details
    if (status.status !== 'healthy') {
      console.warn(`System health degraded: ${status.status}`);
      
      // Check individual components
      if (status.components.mcp.status !== 'healthy') {
        console.warn(`MCP status: ${status.components.mcp.status}`);
      }
      
      // Check unhealthy agents
      Object.entries(status.components.agents).forEach(([agentId, agentStatus]) => {
        if (agentStatus && typeof agentStatus === 'object' && 'status' in agentStatus) {
          if (agentStatus.status !== 'healthy') {
            console.warn(`Agent ${agentId} status: ${agentStatus.status}`);
          }
        } else {
          console.warn(`Agent ${agentId} has invalid status format`);
        }
      });
    }
  });
}

/**
 * Get the Core instance
 * Initializes the system if not already done
 */
export function getCore(): Core {
  if (!systemInitialized) {
    return initializeSystem();
  }
  return core;
}

/**
 * Display the master prompt to the console
 * Useful for development and debugging
 */
export function displayMasterPrompt(): void {
  console.log('===== MASTER PROMPT =====');
  console.log(MASTER_PROMPT);
  console.log('========================');
}