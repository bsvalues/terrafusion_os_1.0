/**
 * Agent Coordination Test
 * 
 * This test validates the coordination between different agent types
 * in the MCP system, ensuring they can work together on complex tasks.
 */

const { createStorage } = require('../server/storage-factory');
const { AgentSystem } = require('../server/services/agent-system');

// Test configuration
const TEST_PROPERTY_ID = 'BC001'; // Test property ID

async function runAgentCoordinationTest() {
  console.log('Starting agent coordination test...');
  
  try {
    // Initialize storage
    const storage = createStorage();
    
    // Create and initialize agent system
    const agentSystem = new AgentSystem(storage);
    await agentSystem.initialize();
    
    console.log('Agent system initialized.');
    
    // Start all agents
    await agentSystem.startAllAgents();
    console.log('All agents started successfully.');
    
    // Get system status
    const systemStatus = agentSystem.getSystemStatus();
    console.log('System status:', JSON.stringify(systemStatus, null, 2));
    
    // Test scenario 1: Property assessment with data validation
    console.log('\n--- Test Scenario 1: Property assessment with data validation ---');
    
    // Step 1: Validate property data using data ingestion agent
    console.log('\nStep 1: Validating property data...');
    const dataValidationResult = await agentSystem.executeCapability(
      'data_ingestion',
      'validateImportData',
      {
        propertyId: TEST_PROPERTY_ID,
        validateOnly: true
      }
    );
    
    console.log('Data validation result:', JSON.stringify(dataValidationResult, null, 2));
    
    if (!dataValidationResult.success) {
      throw new Error('Data validation failed: ' + dataValidationResult.error);
    }
    
    // Step 2: Analyze property using property assessment agent
    console.log('\nStep 2: Analyzing property...');
    const propertyAnalysis = await agentSystem.executeCapability(
      'property_assessment',
      'analyzeProperty',
      {
        propertyId: TEST_PROPERTY_ID
      }
    );
    
    console.log('Property analysis result:', JSON.stringify(propertyAnalysis, null, 2));
    
    if (!propertyAnalysis.success) {
      throw new Error('Property analysis failed: ' + propertyAnalysis.error);
    }
    
    // Step 3: Generate property story
    console.log('\nStep 3: Generating property story...');
    const propertyStory = await agentSystem.executeCapability(
      'property_assessment',
      'generatePropertyStory',
      {
        propertyId: TEST_PROPERTY_ID,
        options: {
          format: 'detailed',
          includeTrends: true
        }
      }
    );
    
    console.log('Property story result:', JSON.stringify(propertyStory, null, 2));
    
    if (!propertyStory.success) {
      throw new Error('Property story generation failed: ' + propertyStory.error);
    }
    
    // Step 4: Generate a report using reporting agent
    console.log('\nStep 4: Generating property report...');
    const reportResult = await agentSystem.executeCapability(
      'reporting',
      'runReport',
      {
        reportType: 'property_assessment',
        parameters: {
          propertyId: TEST_PROPERTY_ID,
          includeAnalysis: true,
          includeStory: true
        }
      }
    );
    
    console.log('Report generation result:', JSON.stringify(reportResult, null, 2));
    
    if (!reportResult.success) {
      throw new Error('Report generation failed: ' + reportResult.error);
    }
    
    // Test scenario 2: Comparable properties analysis
    console.log('\n--- Test Scenario 2: Comparable properties analysis ---');
    
    // Step 1: Find comparable properties
    console.log('\nStep 1: Finding comparable properties...');
    const comparablesResult = await agentSystem.executeCapability(
      'property_assessment',
      'findComparableProperties',
      {
        propertyId: TEST_PROPERTY_ID,
        count: 3,
        radius: 5
      }
    );
    
    console.log('Comparable properties result:', JSON.stringify(comparablesResult, null, 2));
    
    if (!comparablesResult.success) {
      throw new Error('Finding comparable properties failed: ' + comparablesResult.error);
    }
    
    // Step 2: Generate comparable analysis
    console.log('\nStep 2: Generating comparable analysis...');
    const comparableIds = comparablesResult.result.comparables.map(c => c.property.propertyId);
    
    const analysisResult = await agentSystem.executeCapability(
      'property_assessment',
      'generateComparableAnalysis',
      {
        propertyId: TEST_PROPERTY_ID,
        comparableIds
      }
    );
    
    console.log('Comparable analysis result:', JSON.stringify(analysisResult, null, 2));
    
    if (!analysisResult.success) {
      throw new Error('Comparable analysis failed: ' + analysisResult.error);
    }
    
    // Step 3: Export analysis to FTP using data ingestion agent
    console.log('\nStep 3: Exporting analysis to FTP...');
    const exportResult = await agentSystem.executeCapability(
      'data_ingestion',
      'exportToFTP',
      {
        content: {
          propertyId: TEST_PROPERTY_ID,
          analysis: analysisResult.result,
          exportDate: new Date().toISOString()
        },
        filename: `property_analysis_${TEST_PROPERTY_ID}_${Date.now()}.json`,
        dryRun: true // Set to true to avoid actual FTP upload during testing
      }
    );
    
    console.log('Export result:', JSON.stringify(exportResult, null, 2));
    
    if (!exportResult.success) {
      throw new Error('Analysis export failed: ' + exportResult.error);
    }
    
    // Stop all agents
    await agentSystem.stopAllAgents();
    console.log('\nAll agents stopped successfully.');
    
    console.log('\nAgent coordination test completed successfully!');
    return true;
    
  } catch (error) {
    console.error('Error during agent coordination test:', error);
    throw error;
  }
}

// Run the test if directly executed
if (require.main === module) {
  runAgentCoordinationTest()
    .then(result => {
      console.log('Test result:', result ? 'PASSED' : 'FAILED');
      process.exit(result ? 0 : 1);
    })
    .catch(error => {
      console.error('Test failed with error:', error);
      process.exit(1);
    });
} else {
  // Export for use in other test suites
  module.exports = {
    runAgentCoordinationTest
  };
}