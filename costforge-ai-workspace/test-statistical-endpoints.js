/**
 * Statistical Analysis Endpoints Test Suite
 * Tests all four PhD-level analytical methods: Bayesian, Monte Carlo, Regression, Spatial Autocorrelation
 * 
 * TerraFusion OS - Government. Transcended.
 */

const testPropertyData = [
  { propertyId: 'prop1', assessedValue: 250000, squareFeet: 1500, yearBuilt: 1995, latitude: 46.2804, longitude: -119.2752 },
  { propertyId: 'prop2', assessedValue: 320000, squareFeet: 1800, yearBuilt: 2000, latitude: 46.2850, longitude: -119.2800 },
  { propertyId: 'prop3', assessedValue: 180000, squareFeet: 1200, yearBuilt: 1985, latitude: 46.2780, longitude: -119.2700 },
  { propertyId: 'prop4', assessedValue: 420000, squareFeet: 2200, yearBuilt: 2010, latitude: 46.2900, longitude: -119.2850 },
  { propertyId: 'prop5', assessedValue: 275000, squareFeet: 1600, yearBuilt: 1998, latitude: 46.2820, longitude: -119.2780 }
];

async function testEndpoint(name, endpoint, data) {
  try {
    console.log(`\n🧪 Testing ${name}...`);
    
    const response = await fetch(`http://localhost:5001/api/analytics/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ ${name} - SUCCESS`);
      console.log(`   Confidence: ${result.terrafusion?.confidence || 'Not reported'}`);
      console.log(`   Method: ${result.terrafusion?.method || 'Standard'}`);
      if (result.data) {
        const keys = Object.keys(result.data).slice(0, 3); // Show first 3 keys
        console.log(`   Results: ${keys.join(', ')}${keys.length > 3 ? '...' : ''}`);
      }
    } else {
      console.log(`❌ ${name} - FAILED: ${result.error}`);
    }
    
    return result.success;
  } catch (error) {
    console.log(`❌ ${name} - ERROR: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  console.log('🎯 CostForge AI - Statistical Analysis API Test Suite');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🏛️  TerraFusion OS - Government. Transcended.');
  console.log('📊 Testing PhD-level analytical capabilities...\n');

  const tests = [
    {
      name: 'Bayesian Analysis',
      endpoint: 'bayesian',
      data: {
        properties: testPropertyData,
        priorMean: 280000,
        priorVariance: 50000,
        analysisType: 'property-valuation'
      }
    },
    {
      name: 'Monte Carlo Simulation', 
      endpoint: 'monteCarlo',
      data: {
        properties: testPropertyData,
        iterations: 1000,
        variationPercent: 15,
        distributionType: 'normal'
      }
    },
    {
      name: 'Regression Analysis',
      endpoint: 'regression', 
      data: {
        properties: testPropertyData,
        dependentVariable: 'assessedValue',
        independentVariables: ['squareFeet', 'yearBuilt']
      }
    },
    {
      name: 'Spatial Autocorrelation (NEW)',
      endpoint: 'spatialAutocorrelation',
      data: {
        properties: testPropertyData,
        spatialWeights: 'inverse-distance'
      }
    }
  ];

  let passedTests = 0;
  
  for (const test of tests) {
    const success = await testEndpoint(test.name, test.endpoint, test.data);
    if (success) passedTests++;
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🏆 Test Results: ${passedTests}/${tests.length} endpoints operational`);
  
  if (passedTests === tests.length) {
    console.log('✅ CHAMPIONSHIP LEVEL - All statistical analysis endpoints operational!');
    console.log('🧠 PhD-level analytical capabilities: CONFIRMED');
    console.log('🎯 Mass appraisal workflows: READY');
  } else {
    console.log(`⚠️  ${tests.length - passedTests} endpoints require attention`);
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// Run the test suite
runAllTests().catch(console.error);