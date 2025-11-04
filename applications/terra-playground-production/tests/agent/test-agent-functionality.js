/**
 * Agent System Functionality Testing
 *
 * This script tests the core agent system functionality including:
 * - Agent initialization
 * - Websocket connections
 * - Command execution
 * - Agent system API endpoints
 */

import fetch from 'node-fetch';
import WebSocket from 'ws';

// Config
const API_BASE_URL = 'http://localhost:5000/api';
const AGENT_SYSTEM_ENDPOINT = `${API_BASE_URL}/agent-system`;
const WS_URL = 'ws://localhost:5000/api/agents/ws';

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

// Test agent system status
async function testAgentSystemStatus() {
  console.log('Testing Agent System Status...');
  const result = await makeRequest(`${AGENT_SYSTEM_ENDPOINT}/status`);

  if (result.success) {
    console.log('Agent System Status:', result.data);
    return result.data;
  } else {
    console.error('Failed to get agent system status:', result.error || result.data);
    return null;
  }
}

// Test agent websocket connection
function testAgentWebsocket() {
  return new Promise((resolve, reject) => {
    console.log('Testing Agent WebSocket Connection...');
    let resolved = false;

    try {
      const ws = new WebSocket(WS_URL);

      // Set up a timeout to close the connection if it takes too long
      const timeout = setTimeout(() => {
        if (!resolved) {
          console.error('WebSocket connection timed out');
          if (ws.readyState === WebSocket.OPEN) {
            ws.close();
          }
          resolve({ success: false, error: 'Connection timed out' });
          resolved = true;
        }
      }, 10000);

      ws.on('open', () => {
        console.log('WebSocket connection established');

        // Send an auth message
        const authMessage = {
          type: 'auth',
          clientType: 'test-client',
          clientId: `test-${Date.now()}`,
        };

        ws.send(JSON.stringify(authMessage));
      });

      ws.on('message', data => {
        try {
          const message = JSON.parse(data);
          console.log('Received WebSocket message:', message);

          // Check if this is an auth response
          if (message.type === 'auth_response' && message.success) {
            console.log('Authentication successful');
            clearTimeout(timeout);
            ws.close();
            resolve({ success: true, data: message });
            resolved = true;
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });

      ws.on('error', error => {
        console.error('WebSocket error:', error);
        clearTimeout(timeout);
        if (!resolved) {
          resolve({ success: false, error: error.message });
          resolved = true;
        }
      });

      ws.on('close', () => {
        console.log('WebSocket connection closed');
        clearTimeout(timeout);
        if (!resolved) {
          resolve({ success: false, error: 'Connection closed unexpectedly' });
          resolved = true;
        }
      });
    } catch (error) {
      console.error('Error setting up WebSocket connection:', error);
      if (!resolved) {
        resolve({ success: false, error: error.message });
        resolved = true;
      }
    }
  });
}

// Test agent capability execution
async function testAgentCapabilityExecution() {
  console.log('Testing Agent Capability Execution...');

  // Try to execute the property assessment capability
  const propertyId = 'BC001'; // Use an existing property ID
  const url = `${AGENT_SYSTEM_ENDPOINT}/property-assessment/analyze/${propertyId}`;

  const result = await makeRequest(url, 'POST');

  if (result.success) {
    console.log('Agent Capability Execution Result:', result.data);
    return result.data;
  } else {
    console.error('Failed to execute agent capability:', result.error || result.data);
    return null;
  }
}

// Test getting all AI agents
async function testGetAllAgents() {
  console.log('Testing Get All AI Agents...');
  const result = await makeRequest(`${API_BASE_URL}/ai-agents`);

  if (result.success) {
    console.log(`Found ${result.data.length} AI agents`);
    result.data.forEach(agent => {
      console.log(`- ${agent.name} (${agent.type}): ${agent.status}`);
    });
    return result.data;
  } else {
    console.error('Failed to get AI agents:', result.error || result.data);
    return null;
  }
}

// Test agent training status
async function testAgentTrainingStatus() {
  console.log('Testing Agent Training Status...');
  // This endpoint might need to be adjusted based on your actual API
  const result = await makeRequest(`${API_BASE_URL}/ai-agents/training-status`);

  if (result.success) {
    console.log('Agent Training Status:', result.data);
    return result.data;
  } else {
    console.error('Failed to get agent training status:', result.error || result.data);
    return null;
  }
}

// Test LLM service configuration
async function testLLMConfiguration() {
  console.log('Testing LLM Service Configuration...');
  // This endpoint might need to be adjusted based on your actual API
  const result = await makeRequest(`${API_BASE_URL}/ai-assistant/providers`);

  if (result.success) {
    console.log('LLM Providers:', result.data);
    return result.data;
  } else {
    console.error('Failed to get LLM configuration:', result.error || result.data);
    return null;
  }
}

// Run all tests
async function runAllTests() {
  console.log('===== STARTING AGENT SYSTEM TESTS =====');

  try {
    // Test basic agent system functionality
    const systemStatus = await testAgentSystemStatus();
    const agents = await testGetAllAgents();
    const websocketResult = await testAgentWebsocket();

    // Test more specific functionality
    if (systemStatus && systemStatus.isInitialized) {
      await testAgentCapabilityExecution();
    } else {
      console.log('Skipping capability execution test as agent system is not initialized');
    }

    // Test LLM configuration
    await testLLMConfiguration();

    // Try to test training status
    await testAgentTrainingStatus();

    console.log('===== AGENT SYSTEM TESTS COMPLETED =====');
  } catch (error) {
    console.error('Error running tests:', error);
  }
}

// Execute the tests
runAllTests().catch(console.error);
