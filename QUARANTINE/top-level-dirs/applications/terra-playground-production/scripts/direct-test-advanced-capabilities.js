/**
 * Direct Test of Advanced Property Assessment Capabilities
 *
 * This script directly accesses the Property Assessment Agent's capabilities
 * through the AgentSystem class, bypassing the Express API layer.
 */

import { AgentSystem } from '../server/services/agent-system.js';
import { MemStorage } from '../server/storage.js';
import { MCPService } from '../server/services/mcp.js';
import { PropertyStoryGenerator } from '../server/services/property-story-generator.js';
import { FTPService } from '../server/services/ftp-service.js';
import { NotificationService } from '../server/services/notification-service.js';

// The test property and zipcode
const testPropertyId = 'BC001';
const testZipCode = '97330'; // We'll use a test zip code since our test data may not have real ones

async function setupTestEnvironment() {
  console.log('Setting up test environment...');

  // Create required services
  const storage = new MemStorage();
  const mcpService = new MCPService(storage);
  const ftpService = new FTPService();
  const notificationService = new NotificationService();
  const propertyStoryGenerator = new PropertyStoryGenerator(storage, mcpService);

  // Create the agent system
  const agentSystem = new AgentSystem(
    storage,
    mcpService,
    propertyStoryGenerator,
    ftpService,
    notificationService
  );

  // Initialize the agent system
  await agentSystem.initialize();
  console.log('Test environment ready');

  return agentSystem;
}

// Test the generateAreaAnalysis capability
async function testAreaAnalysis(agentSystem) {
  console.log('\n--- Testing Area Analysis ---');

  try {
    const result = await agentSystem.executeCapability(
      'property_assessment',
      'generateAreaAnalysis',
      {
        zipCode: testZipCode,
        propertyType: 'Residential',
        timeframe: '1year',
      }
    );

    console.log('Area Analysis Results:');
    console.log('Zip Code:', result.zipCode);
    console.log('Property Count:', result.propertyCount);
    if (result.statistics) {
      console.log('Average Value:', result.statistics.averageValue);
    }
    if (result.trends) {
      console.log('Trend Points:', result.trends.length);
    }

    return result;
  } catch (error) {
    console.error('Error testing area analysis:', error.message);
    return { error: error.message };
  }
}

// Test the detectValuationAnomalies capability
async function testAnomalyDetection(agentSystem) {
  console.log('\n--- Testing Anomaly Detection ---');

  try {
    const result = await agentSystem.executeCapability(
      'property_assessment',
      'detectValuationAnomalies',
      {
        propertyId: testPropertyId,
        threshold: 0.2, // 20% threshold
      }
    );

    console.log('Anomaly Detection Results:');
    console.log('Property ID:', result.propertyId);
    console.log('Source Value:', result.sourceValue);

    if (result.anomalyDetection) {
      console.log('Is Anomaly:', result.anomalyDetection.isValueAnomaly);
      console.log('Valuation Confidence:', result.anomalyDetection.valuationConfidence);
    }

    if (result.anomalyMetrics) {
      console.log('Deviation from Average:', result.anomalyMetrics.deviationFromAverage);
    }

    return result;
  } catch (error) {
    console.error('Error testing anomaly detection:', error.message);
    return { error: error.message };
  }
}

// Test the generateNeighborhoodReport capability
async function testNeighborhoodReport(agentSystem) {
  console.log('\n--- Testing Neighborhood Report ---');

  try {
    const result = await agentSystem.executeCapability(
      'property_assessment',
      'generateNeighborhoodReport',
      {
        zipCode: testZipCode,
        includeValuationTrends: true,
        includeDemographics: true,
      }
    );

    console.log('Neighborhood Report Results:');
    console.log('Zip Code:', result.zipCode);
    console.log('Property Count:', result.propertyCount);

    if (result.propertyDistribution) {
      console.log(
        'Property Type Distribution:',
        Object.keys(result.propertyDistribution.byType || {})
      );
      console.log('Value Ranges:', Object.keys(result.propertyDistribution.byValue || {}));
    }

    if (result.valuationTrends) {
      console.log('Trends Included:', result.valuationTrends.length);
    }

    if (result.demographics) {
      console.log('Demographics Included:', !!result.demographics);
    }

    return result;
  } catch (error) {
    console.error('Error testing neighborhood report:', error.message);
    return { error: error.message };
  }
}

// Test the analyzeLandUseImpact capability
async function testLandUseImpact(agentSystem) {
  console.log('\n--- Testing Land Use Impact Analysis ---');

  try {
    const result = await agentSystem.executeCapability(
      'property_assessment',
      'analyzeLandUseImpact',
      {
        propertyId: testPropertyId,
        alternativeLandUse: 'Commercial',
      }
    );

    console.log('Land Use Impact Results:');
    console.log('Property ID:', result.propertyId);
    console.log('Current Land Use:', result.currentLandUse);
    console.log('Current Value:', result.currentValue);

    if (result.bestAlternative) {
      console.log('Best Alternative:', result.bestAlternative.landUse);
      console.log('Estimated Value:', result.bestAlternative.estimatedValue);
      console.log('Value Difference:', result.bestAlternative.valueDifference);
      console.log('Percent Change:', result.bestAlternative.percentChange + '%');
    }

    return result;
  } catch (error) {
    console.error('Error testing land use impact:', error.message);
    return { error: error.message };
  }
}

// Test the predictFutureValue capability
async function testFutureValuePrediction(agentSystem) {
  console.log('\n--- Testing Future Value Prediction ---');

  try {
    const result = await agentSystem.executeCapability(
      'property_assessment',
      'predictFutureValue',
      {
        propertyId: testPropertyId,
        yearsAhead: 5,
      }
    );

    console.log('Future Value Prediction Results:');
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

    return result;
  } catch (error) {
    console.error('Error testing future value prediction:', error.message);
    return { error: error.message };
  }
}

// Run all tests
async function runAllTests() {
  try {
    const agentSystem = await setupTestEnvironment();

    await testAreaAnalysis(agentSystem);
    await testAnomalyDetection(agentSystem);
    await testNeighborhoodReport(agentSystem);
    await testLandUseImpact(agentSystem);
    await testFutureValuePrediction(agentSystem);

    console.log('\n✅ All tests completed');
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
  }
}

// Execute tests
runAllTests();
