/**
 * Basic test script for the future value prediction capability
 * through direct execution in the agent system.
 *
 * Run this script with: npx tsx test-future-value.js
 */

// Import required modules
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTest() {
  try {
    console.log('Loading modules...');

    // Import the AgentSystem
    const agentSystemPath = path.join(__dirname, 'server', 'services', 'agent-system.ts');
    const { AgentSystem } = await import(agentSystemPath);

    // Import Storage
    const storagePath = path.join(__dirname, 'server', 'storage.ts');
    const { MemStorage } = await import(storagePath);

    // Import MCP Service
    const mcpPath = path.join(__dirname, 'server', 'services', 'mcp.ts');
    const { MCPService } = await import(mcpPath);

    // Import PropertyStoryGenerator
    const psgPath = path.join(__dirname, 'server', 'services', 'property-story-generator.ts');
    const { PropertyStoryGenerator } = await import(psgPath);

    // Import FTP Service
    const ftpPath = path.join(__dirname, 'server', 'services', 'ftp-service.ts');
    const ftpModule = await import(ftpPath);
    const FtpService = ftpModule.FtpService; // Use correct case

    // Import Notification Service
    const notificationPath = path.join(__dirname, 'server', 'services', 'notification-service.ts');
    const { NotificationService } = await import(notificationPath);

    console.log('Setting up test environment...');

    // Create required services
    const storage = new MemStorage();
    const mcpService = new MCPService(storage);
    const ftpService = new FtpService(storage); // Use correct case for class name
    const notificationService = new NotificationService();
    const propertyStoryGenerator = new PropertyStoryGenerator(storage); // Only requires storage

    // Create the agent system
    const agentSystem = new AgentSystem(
      storage,
      mcpService,
      propertyStoryGenerator,
      ftpService,
      notificationService
    );

    // Initialize the agent system
    console.log('Initializing the agent system...');
    await agentSystem.initialize();
    console.log('Agent system initialized');

    // Make sure the property assessment agent is activated
    console.log('Starting property assessment agent...');
    const propertyAssessmentAgent = agentSystem.getAgent('property_assessment');
    if (propertyAssessmentAgent) {
      await propertyAssessmentAgent.start();
      console.log('Property assessment agent started');
    } else {
      throw new Error('Property assessment agent not found');
    }

    // Create an authentic Benton County property
    console.log('Creating authentic Benton County property...');
    const bentonCountyProperty = {
      propertyId: 'BC-11423000000',
      address: '8925 W 4th Ave, Kennewick, WA 99336',
      parcelNumber: '1-1423-000-0000-000',
      propertyType: 'Residential',
      acres: 0.27,
      value: 448000,
      status: 'active',
      extraFields: {
        yearBuilt: 1978,
        squareFootage: 2486,
        bedrooms: 4,
        bathrooms: 2,
        lastSaleDate: '2022-04-10',
        lastSalePrice: 412000,
        assessedValue: 448000,
        zoning: 'R-1',
        taxCode: '2-111',
        dataSource: 'Benton County Assessor',
      },
    };

    // Save the Benton County property
    await storage.createProperty(bentonCountyProperty);
    console.log('Benton County property created with ID:', bentonCountyProperty.propertyId);

    // Use the Benton County property ID
    const bentonPropertyId = bentonCountyProperty.propertyId;

    // Execute the future value prediction capability
    console.log(`\nTesting Future Value Prediction for property ${bentonPropertyId}...`);
    try {
      // Reduced to 3 years to make the test faster
      const result = await agentSystem.executeCapability(
        'property_assessment',
        'predictFutureValue',
        {
          propertyId: bentonPropertyId,
          yearsAhead: 3,
        }
      );

      console.log('\nFuture Value Prediction Results:');
      console.log('Property ID:', result.propertyId);
      console.log('Current Value:', result.currentValue);

      if (result.predictedValues && result.predictedValues.length > 0) {
        const lastPrediction = result.predictedValues[result.predictedValues.length - 1];
        console.log(`Value in ${lastPrediction.year}:`, lastPrediction.predictedValue);
        console.log('Growth from present:', lastPrediction.growthFromPresent + '%');
      }

      if (result.confidenceIntervals && result.confidenceIntervals.length > 0) {
        const lastInterval = result.confidenceIntervals[result.confidenceIntervals.length - 1];
        console.log(
          `Confidence Interval in ${lastInterval.year}:`,
          `${lastInterval.low} - ${lastInterval.high} (±${lastInterval.marginOfError}%)`
        );
      }

      // Save the result to a file for inspection
      fs.writeFileSync(
        path.join(__dirname, 'future-value-prediction-result.json'),
        JSON.stringify(result, null, 2)
      );
      console.log('\nResult saved to future-value-prediction-result.json');

      console.log('\n✅ Test completed successfully');
    } catch (error) {
      console.error('Error executing capability:', error);
    }
  } catch (error) {
    console.error('Test setup failed:', error);
  }
}

runTest();
