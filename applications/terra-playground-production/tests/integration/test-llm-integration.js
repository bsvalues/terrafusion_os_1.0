/**
 * LLM Integration Testing
 *
 * This script tests the integration with LLM providers including:
 * - API key validation
 * - Model availability
 * - Response generation
 * - Error handling
 */

import fetch from 'node-fetch';

// Config
const API_BASE_URL = 'http://localhost:5000/api';
const AI_ASSISTANT_ENDPOINT = `${API_BASE_URL}/ai-assistant`;

// Helper function for HTTP requests
async function makeRequest(url, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return { success: response.ok, status: response.status, data };
  } catch (error) {
    console.error(`Error making request to ${url}:`, error);
    return { success: false, error: error.message };
  }
}

// Test available LLM providers
async function testLLMProviders() {
  console.log('Testing LLM Providers...');
  const result = await makeRequest(`${AI_ASSISTANT_ENDPOINT}/providers`);

  if (result.success) {
    console.log('Available LLM Providers:', result.data);
    return result.data;
  } else {
    console.error('Failed to get LLM providers:', result.error || result.data);
    return null;
  }
}

// Test LLM API key validation
async function testLLMApiKeyValidation() {
  console.log('Testing LLM API Key Validation...');
  // This endpoint might need to be adjusted based on your actual API
  const result = await makeRequest(`${AI_ASSISTANT_ENDPOINT}/validate-keys`);

  if (result.success) {
    console.log('LLM API Key Validation Result:', result.data);
    return result.data;
  } else {
    console.error('Failed to validate LLM API keys:', result.error || result.data);
    return null;
  }
}

// Test LLM generation capability
async function testLLMGeneration() {
  console.log('Testing LLM Generation...');

  const prompt =
    'Explain what CAMA stands for in property assessment and provide a brief description.';

  const result = await makeRequest(`${AI_ASSISTANT_ENDPOINT}/generate`, 'POST', {
    prompt,
    provider: 'openai', // Adjust based on available providers
    model: 'gpt-4o', // Adjust based on available models
    max_tokens: 150,
  });

  if (result.success) {
    console.log('LLM Generation Result:', result.data);
    return result.data;
  } else {
    console.error('Failed to generate LLM response:', result.error || result.data);
    return null;
  }
}

// Test LLM integration with the agent system
async function testLLMAgentIntegration() {
  console.log('Testing LLM Integration with Agent System...');

  // Try to trigger a property analysis that would use LLM capabilities
  const propertyId = 'BC001'; // Use an existing property ID
  const result = await makeRequest(
    `${API_BASE_URL}/agent-system/property-assessment/analyze/${propertyId}`,
    'POST'
  );

  if (result.success) {
    console.log('LLM Agent Integration Result:', result.data);

    // Check if the response contains LLM-generated content
    if (result.data.analysis && result.data.analysis.summary) {
      console.log('LLM-generated summary available');
    } else {
      console.warn('No LLM-generated summary in the response');
    }

    return result.data;
  } else {
    console.error('Failed to test LLM agent integration:', result.error || result.data);
    return null;
  }
}

// Test for missing API keys or configuration issues
async function testLLMConfigurationIssues() {
  console.log('Testing for LLM Configuration Issues...');

  const providersResult = await testLLMProviders();

  if (!providersResult || !providersResult.providers || providersResult.providers.length === 0) {
    console.error('No LLM providers available, check API key configuration');
    return true;
  }

  // Try a simple generation test with a short prompt
  const result = await makeRequest(`${AI_ASSISTANT_ENDPOINT}/generate`, 'POST', {
    prompt: "Return only the word 'success' as a test",
    provider: providersResult.providers[0],
    max_tokens: 10,
  });

  if (!result.success) {
    console.error('LLM configuration issue detected:', result.error || result.data);
    return true;
  } else {
    console.log('No obvious LLM configuration issues detected');
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('===== STARTING LLM INTEGRATION TESTS =====');

  try {
    // Test LLM providers and configuration
    const providers = await testLLMProviders();

    if (providers && providers.providers && providers.providers.length > 0) {
      // Test API key validation
      await testLLMApiKeyValidation();

      // Test generation capability with valid configuration
      await testLLMGeneration();

      // Test integration with the agent system
      await testLLMAgentIntegration();
    } else {
      console.log('Skipping generation tests due to unavailable LLM providers');

      // Check for configuration issues
      await testLLMConfigurationIssues();
    }

    console.log('===== LLM INTEGRATION TESTS COMPLETED =====');
  } catch (error) {
    console.error('Error running LLM integration tests:', error);
  }
}

// Execute the tests
runAllTests().catch(console.error);
