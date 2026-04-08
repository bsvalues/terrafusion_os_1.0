/**
 * Test MCP Tools
 * 
 * This script tests various MCP tools and their execution
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api';
const API_KEY = 'api-key-admin-1a2b3c4d5e6f7g8h9i0j'; // Admin API key with full access

// Helper function to get JWT token
async function getToken() {
  const response = await fetch(`${BASE_URL}/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey: API_KEY })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to get token: ${response.status} ${response.statusText}`);
  }
  
  const { token } = await response.json();
  return token;
}

// Helper function to execute MCP tool
async function executeTool(token, toolName, parameters = {}) {
  const response = await fetch(`${BASE_URL}/mcp/execute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ toolName, parameters })
  });
  
  const result = await response.json();
  
  if (!response.ok) {
    console.error(`Failed to execute tool ${toolName}:`, result);
    return null;
  }
  
  return result;
}

async function testMcpTools() {
  console.log('=== Testing MCP Tools ===');
  
  try {
    // Get JWT token first
    const token = await getToken();
    console.log('Successfully obtained JWT token');
    
    // Get available tools
    const toolsResponse = await fetch(`${BASE_URL}/mcp/tools`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const tools = await toolsResponse.json();
    console.log(`Available tools (${tools.length}):`);
    tools.forEach(tool => console.log(`- ${tool.name}: ${tool.description}`));
    
    // Test 1: Get schema
    console.log('\nTesting getSchema tool:');
    const schemaResult = await executeTool(token, 'getSchema');
    if (schemaResult) {
      console.log('Schema retrieved successfully');
      console.log(`Tables: ${Object.keys(schemaResult.result.tables).join(', ')}`);
    }
    
    // Test 2: Get property by ID
    console.log('\nTesting getPropertyById tool:');
    const propertyResult = await executeTool(token, 'getPropertyById', { propertyId: 'BC001' });
    if (propertyResult) {
      console.log('Property retrieved successfully:');
      console.log(`Property ID: ${propertyResult.result.propertyId}`);
      console.log(`Address: ${propertyResult.result.address}`);
      console.log(`Value: $${propertyResult.result.assessedValue}`);
    }
    
    // Test 3: Get properties (with filter)
    console.log('\nTesting getProperties tool:');
    const propertiesResult = await executeTool(token, 'getProperties', { addressContains: 'Main' });
    if (propertiesResult) {
      console.log(`Found ${propertiesResult.result.length} properties with 'Main' in the address`);
      propertiesResult.result.forEach(prop => {
        console.log(`- ${prop.propertyId}: ${prop.address}, $${prop.assessedValue}`);
      });
    }
    
    // Test 4: Get PACS modules
    console.log('\nTesting getPacsModules tool:');
    const modulesResult = await executeTool(token, 'getPacsModules');
    if (modulesResult) {
      console.log(`Retrieved ${modulesResult.result.length} PACS modules`);
      if (modulesResult.result.length > 0) {
        console.log('Sample modules:');
        modulesResult.result.slice(0, 3).forEach(module => {
          console.log(`- ${module.name}: ${module.description.substring(0, 50)}...`);
        });
      }
    }
    
    // Test 5: Security validation (should be blocked by security service)
    console.log('\nTesting security validation (with malicious input):');
    const securityResult = await executeTool(token, 'getProperties', { 
      addressContains: "'; DROP TABLE properties; --" 
    });
    
    if (!securityResult || securityResult.message) {
      console.log('Security validation working as expected:');
      console.log(`Error: ${securityResult ? securityResult.message : 'Request failed'}`);
    } else if (securityResult && securityResult.success === true) {
      console.error('WARNING: Security validation failed - malicious input was accepted!');
    }
    
    console.log('\nMCP tools tests completed');
    
  } catch (error) {
    console.error('Error during MCP tools tests:', error);
  }
}

// Run the tests
testMcpTools();