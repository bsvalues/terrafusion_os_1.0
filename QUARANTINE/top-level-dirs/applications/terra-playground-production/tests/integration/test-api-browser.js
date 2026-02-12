/**
 * Universal API Test Module
 *
 * This module is designed to work in both browser and Node.js environments
 * to test API endpoints without CORS or middleware issues.
 */

// Determine execution environment
const isBrowser = typeof window !== 'undefined';

// API Base URL
const API_BASE_URL = isBrowser ? window.location.origin + '/api' : 'http://localhost:5000/api';

/**
 * Make an API request
 * @param {string} endpoint - API endpoint path (without the /api prefix)
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
 * @param {object|null} body - Request body for POST/PUT requests
 * @returns {Promise<object>} - API response
 */
async function makeApiRequest(endpoint, method = 'GET', body = null) {
  const url = `${API_BASE_URL}/${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    credentials: 'same-origin', // Include cookies for same-origin requests
  };

  if (body && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(body);
  }

  try {
    console.log(`Making ${method} request to ${url}`);
    const response = await fetch(url, options);

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      return {
        success: response.ok,
        status: response.status,
        data,
      };
    } else {
      // Handle non-JSON responses
      const text = await response.text();
      console.warn('Received non-JSON response:', text.substring(0, 100) + '...');
      return {
        success: false,
        status: response.status,
        error: 'Non-JSON response received',
        text: text.substring(0, 500), // Truncate long HTML responses
      };
    }
  } catch (error) {
    console.error(`Error making request to ${url}:`, error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Test health endpoint
async function testHealth() {
  return await makeApiRequest('health');
}

// Test AI Assistant providers
async function testLlmProviders() {
  return await makeApiRequest('ai-assistant/providers');
}

// Test AI Assistant key validation
async function testLlmApiKeyValidation() {
  return await makeApiRequest('ai-assistant/validate-keys');
}

// Test LLM generation
async function testLlmGeneration(
  prompt = 'Explain CAMA in property assessment',
  provider = 'openai'
) {
  return await makeApiRequest('ai-assistant/generate', 'POST', {
    prompt,
    provider,
    max_tokens: 150,
  });
}

// Test agent system status
async function testAgentSystemStatus() {
  return await makeApiRequest('agent-system/status');
}

// Test GIS layers
async function testGisLayers() {
  return await makeApiRequest('gis/layers');
}

// Test properties
async function testProperties() {
  return await makeApiRequest('properties');
}

// Run all tests
async function runAllTests() {
  console.log('===== STARTING API BROWSER TESTS =====');

  // Health check
  console.log('\nTesting health endpoint:');
  const healthResult = await testHealth();
  console.log('Health result:', healthResult);

  // LLM providers
  console.log('\nTesting LLM providers:');
  const providersResult = await testLlmProviders();
  console.log('LLM providers result:', providersResult);

  // LLM API key validation
  console.log('\nTesting LLM API key validation:');
  const apiKeyResult = await testLlmApiKeyValidation();
  console.log('LLM API key validation result:', apiKeyResult);

  // LLM generation
  console.log('\nTesting LLM generation:');
  const generationResult = await testLlmGeneration();
  console.log('LLM generation result:', generationResult);

  // Agent system status
  console.log('\nTesting agent system status:');
  const agentStatusResult = await testAgentSystemStatus();
  console.log('Agent system status result:', agentStatusResult);

  // GIS layers
  console.log('\nTesting GIS layers:');
  const gisLayersResult = await testGisLayers();
  console.log('GIS layers result:', gisLayersResult);

  // Properties
  console.log('\nTesting properties:');
  const propertiesResult = await testProperties();
  console.log('Properties result:', propertiesResult);

  console.log('\n===== API BROWSER TESTS COMPLETED =====');

  // Return all results
  return {
    health: healthResult,
    llmProviders: providersResult,
    llmApiKeyValidation: apiKeyResult,
    llmGeneration: generationResult,
    agentSystemStatus: agentStatusResult,
    gisLayers: gisLayersResult,
    properties: propertiesResult,
  };
}

// Export API functions based on environment
if (isBrowser) {
  // Export for browser console use
  window.apiTests = {
    makeApiRequest,
    testHealth,
    testLlmProviders,
    testLlmApiKeyValidation,
    testLlmGeneration,
    testAgentSystemStatus,
    testGisLayers,
    testProperties,
    runAllTests,
  };
}

// Export for ESM
export {
  makeApiRequest,
  testHealth,
  testLlmProviders,
  testLlmApiKeyValidation,
  testLlmGeneration,
  testAgentSystemStatus,
  testGisLayers,
  testProperties,
  runAllTests,
};
