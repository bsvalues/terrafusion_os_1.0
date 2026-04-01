/**
 * Agent System API Test
 * 
 * This script tests the agent system API endpoints to verify the format of responses
 * and ensure our planned improvements will be compatible with existing code.
 */

import fetch from 'node-fetch';

// Development API key (for testing purposes only)
const DEV_API_KEY = 'dev-mcp-platform-key';
const API_BASE_URL = 'http://localhost:5000';

// Test the agent status endpoint
async function testAgentStatus() {
  console.log('Testing Agent Status API...');
  try {
    const response = await fetch(`${API_BASE_URL}/api/agents/status`, {
      headers: {
        'x-api-key': DEV_API_KEY
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Agent Status Response Structure:');
    console.log(JSON.stringify(data, null, 2));
    
    // Verify agent structure
    console.log('\nAgent data type:', typeof data.agents);
    
    if (data.agents && typeof data.agents === 'object') {
      // Check if it's an array or object
      if (Array.isArray(data.agents)) {
        console.log('✓ Agents is an array with', data.agents.length, 'items');
        console.log('First agent structure:', JSON.stringify(data.agents[0], null, 2));
      } else {
        console.log('✓ Agents is an object with', Object.keys(data.agents).length, 'properties');
        const firstAgentKey = Object.keys(data.agents)[0];
        console.log('First agent key:', firstAgentKey);
        console.log('First agent structure:', JSON.stringify(data.agents[firstAgentKey], null, 2));
      }
    } else {
      console.log('✗ Unexpected agents structure:', data.agents);
    }
    
    return data;
  } catch (error) {
    console.error('Error testing agent status:', error);
    return null;
  }
}

// Test agent capabilities endpoint
async function testAgentCapabilities() {
  console.log('\nTesting Agent Capabilities API...');
  try {
    const response = await fetch(`${API_BASE_URL}/api/agents/capabilities`, {
      headers: {
        'x-api-key': DEV_API_KEY
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Agent Capabilities Response Structure:');
    console.log(JSON.stringify(data, null, 2));
    
    return data;
  } catch (error) {
    console.error('Error testing agent capabilities:', error);
    return null;
  }
}

// Run all tests
async function runTests() {
  console.log('===== AGENT SYSTEM API TESTS =====\n');
  
  const statusData = await testAgentStatus();
  const capabilitiesData = await testAgentCapabilities();
  
  console.log('\n===== TEST SUMMARY =====');
  console.log('Agent Status API:', statusData ? '✓ SUCCESS' : '✗ FAILED');
  console.log('Agent Capabilities API:', capabilitiesData ? '✓ SUCCESS' : '✗ FAILED');
  
  console.log('\n===== FINDINGS =====');
  if (statusData) {
    const agentFormat = Array.isArray(statusData.agents) ? 'array' : 'object';
    console.log(`- Agent status API returns agents as ${agentFormat}`);
  }
  
  console.log('\n===== TEST COMPLETE =====');
}

// Run the tests
runTests();