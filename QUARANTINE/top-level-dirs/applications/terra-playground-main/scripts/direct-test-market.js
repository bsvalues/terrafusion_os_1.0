// Simple direct test of market methods
const storage = require('../server/storage');

async function testMarketMethods() {
  console.log('=== Testing Market Methods ===');

  // Create a storage instance
  const memStorage = new storage.MemStorage();

  try {
    // Test 1: Market Trends
    console.log('\n1. Testing getMarketTrends');
    const trends = await memStorage.getMarketTrends('Benton County');
    console.log(`Retrieved ${trends.length} market trends`);
    console.log('Sample trend:', trends[0]);

    // Test 2: Economic Indicators
    console.log('\n2. Testing getEconomicIndicators');
    const indicators = await memStorage.getEconomicIndicators('Benton County');
    console.log(`Retrieved ${indicators.length} economic indicators`);
    console.log('Sample indicator:', indicators[0]);

    // Test 3: Regulatory Framework
    console.log('\n3. Testing getRegulatoryFramework');
    const framework = await memStorage.getRegulatoryFramework('Benton County');
    console.log('Retrieved regulatory framework with:');
    console.log(`- ${framework.zoningRegulations.length} zoning regulations`);
    console.log(`- ${framework.buildingCodes.length} building codes`);
    console.log(`- ${framework.environmentalRegulations.length} environmental regulations`);

    // Test 4: Environmental Risks
    console.log('\n4. Testing getEnvironmentalRisks');
    const risks = await memStorage.getEnvironmentalRisks('BC001');
    console.log(`Retrieved ${risks.risks.length} environmental risks`);
    console.log('Sample risk:', risks.risks[0]);

    console.log('\n=== All tests completed successfully ===');
  } catch (error) {
    console.error('Error during tests:', error);
  }
}

// Run the tests
testMarketMethods();
