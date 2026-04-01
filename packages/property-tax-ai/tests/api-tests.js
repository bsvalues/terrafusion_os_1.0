// Basic API Testing Script
import fetch from 'node-fetch';
import assert from 'assert';

// Base URL for API requests
const API_BASE_URL = 'http://localhost:5000/api';

// Test the API health endpoint
async function testHealthEndpoint() {
  console.log('Testing /api/health endpoint...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    
    assert(response.status === 200, `Expected status 200, but got ${response.status}`);
    assert(data.status === 'healthy', `Expected status to be 'healthy', but got ${data.status}`);
    
    console.log('✅ Health endpoint test passed!');
    return true;
  } catch (error) {
    console.error('❌ Health endpoint test failed:', error.message);
    return false;
  }
}

// Test fetching all properties
async function testGetAllProperties() {
  console.log('Testing /api/properties endpoint...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/properties`);
    const data = await response.json();
    
    assert(response.status === 200, `Expected status 200, but got ${response.status}`);
    assert(Array.isArray(data), 'Expected an array of properties');
    
    console.log(`✅ Get all properties test passed! Found ${data.length} properties.`);
    return true;
  } catch (error) {
    console.error('❌ Get all properties test failed:', error.message);
    return false;
  }
}

// Test fetching all AI agents
async function testGetAllAiAgents() {
  console.log('Testing /api/ai-agents endpoint...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/ai-agents`);
    const data = await response.json();
    
    assert(response.status === 200, `Expected status 200, but got ${response.status}`);
    assert(Array.isArray(data), 'Expected an array of AI agents');
    
    console.log(`✅ Get all AI agents test passed! Found ${data.length} agents.`);
    return true;
  } catch (error) {
    console.error('❌ Get all AI agents test failed:', error.message);
    return false;
  }
}

// Test fetching all PACS modules
async function testGetAllPacsModules() {
  console.log('Testing /api/pacs-modules endpoint...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/pacs-modules`);
    const data = await response.json();
    
    assert(response.status === 200, `Expected status 200, but got ${response.status}`);
    assert(Array.isArray(data), 'Expected an array of PACS modules');
    
    console.log(`✅ Get all PACS modules test passed! Found ${data.length} modules.`);
    return true;
  } catch (error) {
    console.error('❌ Get all PACS modules test failed:', error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('Starting API tests...\n');
  
  let passedTests = 0;
  let totalTests = 0;
  
  // Health endpoint
  totalTests++;
  if (await testHealthEndpoint()) passedTests++;
  
  console.log(''); // Separator
  
  // Properties endpoint
  totalTests++;
  if (await testGetAllProperties()) passedTests++;
  
  console.log(''); // Separator
  
  // AI agents endpoint
  totalTests++;
  if (await testGetAllAiAgents()) passedTests++;
  
  console.log(''); // Separator
  
  // PACS modules endpoint
  totalTests++;
  if (await testGetAllPacsModules()) passedTests++;
  
  console.log('\n--------------------------');
  console.log(`Test Results: ${passedTests}/${totalTests} tests passed`);
  console.log('--------------------------');
  
  // Return a success code only if all tests passed
  process.exit(passedTests === totalTests ? 0 : 1);
}

// Run the tests
runAllTests();