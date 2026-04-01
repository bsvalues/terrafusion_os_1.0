/**
 * Test Script for Market Prediction Model
 * 
 * This script tests the storage methods used by the Market Prediction Model.
 */
import { MemStorage } from '../server/storage';
import { MarketPredictionModel } from '../server/services/market-prediction-model';
import { RiskAssessmentEngine } from '../server/services/risk-assessment-engine';

async function testMarketPredictionServices() {
  console.log("Starting Market Prediction and Risk Assessment Tests");
  console.log("=================================================");
  
  // Initialize a storage instance
  const storage = new MemStorage();
  
  // Initialize the Market Prediction Model
  const marketPredictionModel = new MarketPredictionModel(storage);
  
  // Initialize the Risk Assessment Engine
  const riskAssessmentEngine = new RiskAssessmentEngine(storage);
  
  // Test 1: Get Market Trends for a Region
  console.log("\n# Test 1: Market Trends for 'Benton County'");
  try {
    const trends = await storage.getMarketTrends("Benton County");
    console.log(`Retrieved ${trends.length} market trends. Sample trends:`);
    trends.slice(0, 2).forEach(trend => {
      console.log(`- ${trend.metric}: ${trend.value} (${trend.trend}) with ${trend.confidence * 100}% confidence`);
    });
  } catch (error) {
    console.error("Error retrieving market trends:", error);
  }
  
  // Test 2: Get Economic Indicators for a Region
  console.log("\n# Test 2: Economic Indicators for 'Benton County'");
  try {
    const indicators = await storage.getEconomicIndicators("Benton County");
    console.log(`Retrieved ${indicators.length} economic indicators. Sample indicators:`);
    indicators.slice(0, 2).forEach(indicator => {
      console.log(`- ${indicator.name}: ${indicator.value} (${indicator.impact} impact) with ${indicator.significance * 100}% significance`);
    });
  } catch (error) {
    console.error("Error retrieving economic indicators:", error);
  }
  
  // Test 3: Get Comparable Properties for a Property
  console.log("\n# Test 3: Comparable Properties for 'BC001'");
  try {
    const comparables = await storage.findComparableProperties("BC001", 3);
    console.log(`Retrieved ${comparables.length} comparable properties. Sample properties:`);
    comparables.slice(0, 2).forEach(property => {
      console.log(`- ${property.propertyId}: ${property.address} (${property.propertyType})`);
    });
  } catch (error) {
    console.error("Error retrieving comparable properties:", error);
  }
  
  // Test 4: Get Property History for a Property
  console.log("\n# Test 4: Property History for 'BC001'");
  try {
    const history = await storage.getPropertyHistory("BC001");
    console.log(`Retrieved property history with ${history.valueHistory.length} value changes and ${history.events.length} events.`);
    console.log("Sample value change:", history.valueHistory[0]);
    console.log("Sample event:", history.events[0]);
  } catch (error) {
    console.error("Error retrieving property history:", error);
  }
  
  // Test 5: Get Regulatory Framework for a Region
  console.log("\n# Test 5: Regulatory Framework for 'Benton County'");
  try {
    const framework = await storage.getRegulatoryFramework("Benton County");
    console.log(`Retrieved regulatory framework with:`);
    console.log(`- ${framework.zoningRegulations.length} zoning regulations`);
    console.log(`- ${framework.buildingCodes.length} building codes`);
    console.log(`- ${framework.environmentalRegulations.length} environmental regulations`);
    console.log(`- ${framework.taxPolicies.length} tax policies`);
  } catch (error) {
    console.error("Error retrieving regulatory framework:", error);
  }
  
  // Test 6: Get Environmental Risks for a Property
  console.log("\n# Test 6: Environmental Risks for 'BC001'");
  try {
    const risks = await storage.getEnvironmentalRisks("BC001");
    console.log(`Retrieved ${risks.risks.length} environmental risks and ${risks.environmentalHazards.length} environmental hazards.`);
    console.log("Sample risk:", risks.risks[0]);
    console.log("Sample hazard:", risks.environmentalHazards[0]);
  } catch (error) {
    console.error("Error retrieving environmental risks:", error);
  }
  
  console.log("\n=================================================");
  console.log("Market Prediction and Risk Assessment Tests Complete");
}

// Run the tests
testMarketPredictionServices().catch(error => {
  console.error("Error running tests:", error);
});