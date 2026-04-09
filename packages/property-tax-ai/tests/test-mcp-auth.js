/**
 * Test MCP Authentication
 * 
 * This script tests the JWT token-based authentication for MCP endpoints
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api';

async function testMcpAuthentication() {
  console.log('=== Testing MCP Authentication ===');
  
  try {
    // Step 1: Get a JWT token using an API key
    console.log('\nTesting POST /api/auth/token');
    
    // Use the read-only API key
    const tokenResponse = await fetch(`${BASE_URL}/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        apiKey: 'api-key-read-only-3a9f8e7d6c5b4a3210'
      })
    });
    
    if (!tokenResponse.ok) {
      throw new Error(`Failed to get token: ${tokenResponse.status} ${tokenResponse.statusText}`);
    }
    
    const { token } = await tokenResponse.json();
    console.log('Successfully obtained JWT token');
    
    // Step 2: Use the token to access MCP tools
    console.log('\nTesting GET /api/mcp/tools with JWT token');
    const toolsResponse = await fetch(`${BASE_URL}/mcp/tools`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!toolsResponse.ok) {
      throw new Error(`Failed to fetch MCP tools: ${toolsResponse.status} ${toolsResponse.statusText}`);
    }
    
    const tools = await toolsResponse.json();
    console.log(`Successfully retrieved ${tools.length} tools with JWT authentication`);
    
    // Step 3: Test direct API key authentication
    console.log('\nTesting GET /api/mcp/tools with direct API key');
    const toolsWithApiKeyResponse = await fetch(`${BASE_URL}/mcp/tools`, {
      headers: {
        'X-API-Key': 'api-key-read-only-3a9f8e7d6c5b4a3210'
      }
    });
    
    if (!toolsWithApiKeyResponse.ok) {
      throw new Error(`Failed to fetch MCP tools with API key: ${toolsWithApiKeyResponse.status} ${toolsWithApiKeyResponse.statusText}`);
    }
    
    const toolsWithApiKey = await toolsWithApiKeyResponse.json();
    console.log(`Successfully retrieved ${toolsWithApiKey.length} tools with API key authentication`);
    
    // Step 4: Test unauthorized access (execute endpoint with read-only token)
    console.log('\nTesting POST /api/mcp/execute with read-only token (should fail)');
    
    const unauthorizedResponse = await fetch(`${BASE_URL}/mcp/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        toolName: 'getSchema',
        parameters: {}
      })
    });
    
    if (unauthorizedResponse.status === 403) {
      console.log('Successfully blocked unauthorized access (status 403 as expected)');
    } else if (unauthorizedResponse.ok) {
      console.error('ERROR: Unauthorized access was permitted!');
    } else {
      console.error(`Unexpected status: ${unauthorizedResponse.status} ${unauthorizedResponse.statusText}`);
    }
    
    // Step 5: Get an admin token with write access
    console.log('\nTesting POST /api/auth/token for admin access');
    
    const adminTokenResponse = await fetch(`${BASE_URL}/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        apiKey: 'api-key-admin-1a2b3c4d5e6f7g8h9i0j'
      })
    });
    
    if (!adminTokenResponse.ok) {
      throw new Error(`Failed to get admin token: ${adminTokenResponse.status} ${adminTokenResponse.statusText}`);
    }
    
    const { token: adminToken } = await adminTokenResponse.json();
    console.log('Successfully obtained admin JWT token');
    
    // Step 6: Use admin token to access execute endpoint
    console.log('\nTesting POST /api/mcp/execute with admin token');
    
    const executeResponse = await fetch(`${BASE_URL}/mcp/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        toolName: 'getSchema',
        parameters: {}
      })
    });
    
    if (!executeResponse.ok) {
      throw new Error(`Failed to execute MCP tool: ${executeResponse.status} ${executeResponse.statusText}`);
    }
    
    const executeResult = await executeResponse.json();
    console.log('Successfully executed MCP tool with admin token');
    console.log(`Tables found: ${Object.keys(executeResult.result.tables).length}`);
    
    console.log('\nAuthentication tests completed successfully');
  } catch (error) {
    console.error('Error during authentication tests:', error);
  }
}

// Run the test
testMcpAuthentication();