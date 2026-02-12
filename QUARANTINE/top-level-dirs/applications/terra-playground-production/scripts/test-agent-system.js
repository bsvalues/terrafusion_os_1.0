/**
 * MCP Agent System Test Script
 *
 * This script initializes and tests the MCP Agent System, including
 * agent initialization, capability execution, and the overall Model
 * Context Protocol implementation.
 */

// Allow ESM imports without having to use .mjs extension
require('esbuild-register');

const { MemStorage } = require('../server/storage');
const { AgentSystem } = require('../server/services/agent-system');

async function testAgentSystem() {
  console.log('=== MCP Agent System Test ===');

  try {
    // Initialize storage
    console.log('Initializing storage...');
    const storage = new MemStorage();

    // Create the agent system
    console.log('Creating agent system...');
    const agentSystem = new AgentSystem(storage);

    // Initialize the system
    console.log('Initializing agent system...');
    await agentSystem.initialize();

    // Get system status
    console.log('Getting system status...');
    const status = agentSystem.getSystemStatus();
    console.log('Agent System Status:', JSON.stringify(status, null, 2));

    // Start all agents
    console.log('\nStarting all agents...');
    await agentSystem.startAllAgents();

    // Get updated status after starting
    const statusAfterStart = agentSystem.getSystemStatus();
    console.log('Agents started, status:', JSON.stringify(statusAfterStart, null, 2));

    // Test Property Assessment Agent capabilities
    if (agentSystem.getAgent('property_assessment')) {
      console.log('\n=== Testing Property Assessment Agent ===');

      // Test with a sample property (ensure it exists in your data)
      const samplePropertyId = 'PROP-001';

      try {
        console.log(`Analyzing property ${samplePropertyId}...`);
        const analysisResult = await agentSystem.executeCapability(
          'property_assessment',
          'analyzeProperty',
          { propertyId: samplePropertyId }
        );

        console.log('Property Analysis Result:', JSON.stringify(analysisResult, null, 2));
      } catch (error) {
        console.error('Error analyzing property:', error.message);
      }

      try {
        console.log(`\nGenerating property story for ${samplePropertyId}...`);
        const storyResult = await agentSystem.executeCapability(
          'property_assessment',
          'generatePropertyStory',
          {
            propertyId: samplePropertyId,
            options: {
              format: 'detailed',
              includeComparables: true,
              aiProvider: 'openai', // Use OpenAI as the provider
            },
          }
        );

        console.log('Property Story Result:', JSON.stringify(storyResult, null, 2));
      } catch (error) {
        console.error('Error generating property story:', error.message);
      }
    }

    // Test Data Ingestion Agent capabilities
    if (agentSystem.getAgent('data_ingestion')) {
      console.log('\n=== Testing Data Ingestion Agent ===');

      try {
        console.log('Importing PACS modules...');
        const modulesResult = await agentSystem.executeCapability(
          'data_ingestion',
          'importPacsModules',
          {} // Use default modules
        );

        console.log('PACS Modules Import Result:', JSON.stringify(modulesResult, null, 2));
      } catch (error) {
        console.error('Error importing PACS modules:', error.message);
      }
    }

    // Test Reporting Agent capabilities
    if (agentSystem.getAgent('reporting')) {
      console.log('\n=== Testing Reporting Agent ===');

      try {
        console.log('Creating a test report...');
        const reportResult = await agentSystem.executeCapability('reporting', 'createReport', {
          name: 'Property Value Distribution',
          description: 'Analysis of property values across the county',
          type: 'property',
          query: {
            aggregate: {
              groupBy: 'propertyType',
              metrics: [
                { type: 'count', name: 'count' },
                { type: 'sum', field: 'value', name: 'totalValue' },
                { type: 'average', field: 'value', name: 'avgValue' },
              ],
            },
          },
        });

        console.log('Report Creation Result:', JSON.stringify(reportResult, null, 2));

        if (reportResult.success && reportResult.result) {
          const reportId = reportResult.result.reportId;

          console.log(`\nRunning report ${reportId}...`);
          const runResult = await agentSystem.executeCapability('reporting', 'runReport', {
            reportId,
          });

          console.log('Report Run Result:', JSON.stringify(runResult, null, 2));
        }
      } catch (error) {
        console.error('Error working with reports:', error.message);
      }
    }

    // Stop all agents
    console.log('\nStopping all agents...');
    await agentSystem.stopAllAgents();

    // Get updated status after stopping
    const statusAfterStop = agentSystem.getSystemStatus();
    console.log('Agents stopped, status:', JSON.stringify(statusAfterStop, null, 2));

    console.log('\n=== MCP Agent System Test Complete ===');
  } catch (error) {
    console.error('Error testing agent system:', error);
  }
}

// Run the test
testAgentSystem().catch(console.error);
