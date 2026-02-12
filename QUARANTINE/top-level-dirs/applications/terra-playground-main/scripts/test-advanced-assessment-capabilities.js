/**
 * Test Advanced Property Assessment Capabilities
 *
 * This script tests the newly implemented advanced property assessment
 * capabilities including area analysis, anomaly detection, neighborhood reporting,
 * land use impact analysis, and future value prediction.
 */

import fetch from 'node-fetch';
const baseUrl = 'http://localhost:5000/api/agent';
const testPropertyId = '1001'; // Replace with a valid property ID in your system
const testZipCode = '97330'; // Replace with a valid zip code in your system

// Utility function to make API requests
async function apiRequest(endpoint, method = 'GET', data = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer test-token', // Replace with a valid token if needed
    },
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${baseUrl}${endpoint}`, options);
    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(`API Error: ${responseData.error || response.statusText}`);
    }

    return responseData;
  } catch (error) {
    console.error(`Request failed for ${endpoint}:`, error.message);
    return { error: error.message };
  }
}

// Test area analysis capability
async function testAreaAnalysis() {
  console.log('\n--- Testing Area Analysis ---');
  const result = await apiRequest(`/property-assessment/area-analysis/${testZipCode}`, 'POST', {
    propertyType: 'Residential',
    timeframe: '1year',
  });

  console.log('Area Analysis Results:');
  if (result.error) {
    console.log('Error:', result.error);
  } else {
    console.log('Zip Code:', result.zipCode);
    console.log('Property Count:', result.propertyCount);
    console.log('Average Value:', result.statistics?.averageValue);
    console.log('Trend Points:', result.trends?.length);
  }

  return result;
}

// Test anomaly detection capability
async function testAnomalyDetection() {
  console.log('\n--- Testing Anomaly Detection ---');
  const result = await apiRequest(
    `/property-assessment/detect-anomalies/${testPropertyId}`,
    'POST',
    {
      threshold: 0.2, // 20% threshold
    }
  );

  console.log('Anomaly Detection Results:');
  if (result.error) {
    console.log('Error:', result.error);
  } else {
    console.log('Property ID:', result.propertyId);
    console.log('Source Value:', result.sourceValue);
    console.log('Is Anomaly:', result.anomalyDetection?.isValueAnomaly);
    console.log('Valuation Confidence:', result.anomalyDetection?.valuationConfidence);
    console.log('Deviation from Average:', result.anomalyMetrics?.deviationFromAverage);
  }

  return result;
}

// Test neighborhood report capability
async function testNeighborhoodReport() {
  console.log('\n--- Testing Neighborhood Report ---');
  const result = await apiRequest(
    `/property-assessment/neighborhood-report/${testZipCode}`,
    'POST',
    {
      includeValuationTrends: true,
      includeDemographics: true,
    }
  );

  console.log('Neighborhood Report Results:');
  if (result.error) {
    console.log('Error:', result.error);
  } else {
    console.log('Zip Code:', result.zipCode);
    console.log('Property Count:', result.propertyCount);
    console.log('Property Types:', Object.keys(result.propertyDistribution?.byType || {}));
    console.log('Value Ranges:', Object.keys(result.propertyDistribution?.byValue || {}));

    if (result.valuationTrends) {
      console.log('Trends Included:', result.valuationTrends.length);
    }

    if (result.demographics) {
      console.log('Demographics Included:', !!result.demographics);
    }
  }

  return result;
}

// Test land use impact analysis capability
async function testLandUseImpact() {
  console.log('\n--- Testing Land Use Impact Analysis ---');
  const result = await apiRequest(
    `/property-assessment/land-use-impact/${testPropertyId}`,
    'POST',
    {
      alternativeLandUse: 'Commercial',
    }
  );

  console.log('Land Use Impact Results:');
  if (result.error) {
    console.log('Error:', result.error);
  } else {
    console.log('Property ID:', result.propertyId);
    console.log('Current Land Use:', result.currentLandUse);
    console.log('Current Value:', result.currentValue);

    if (result.bestAlternative) {
      console.log('Best Alternative:', result.bestAlternative.landUse);
      console.log('Estimated Value:', result.bestAlternative.estimatedValue);
      console.log('Value Difference:', result.bestAlternative.valueDifference);
      console.log('Percent Change:', result.bestAlternative.percentChange + '%');
    }
  }

  return result;
}

// Test future value prediction capability
async function testFutureValuePrediction() {
  console.log('\n--- Testing Future Value Prediction ---');
  const result = await apiRequest(`/property-assessment/predict-value/${testPropertyId}`, 'POST', {
    yearsAhead: 5,
  });

  console.log('Future Value Prediction Results:');
  if (result.error) {
    console.log('Error:', result.error);
  } else {
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
  }

  return result;
}

// Run all tests
async function runAllTests() {
  try {
    await testAreaAnalysis();
    await testAnomalyDetection();
    await testNeighborhoodReport();
    await testLandUseImpact();
    await testFutureValuePrediction();

    console.log('\n✅ All tests completed');
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
  }
}

// Execute tests
runAllTests();

// Add ESM export
export {
  testAreaAnalysis,
  testAnomalyDetection,
  testNeighborhoodReport,
  testLandUseImpact,
  testFutureValuePrediction,
  runAllTests,
};
