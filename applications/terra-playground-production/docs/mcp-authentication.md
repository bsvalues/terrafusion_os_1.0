# MCP Authentication System

This document provides an overview of the authentication system for the Model Context Protocol (MCP) API in the Benton County Assessor's Office platform.

## Overview

The authentication system secures MCP endpoints using JWT (JSON Web Token) based authentication with role-based access control. The system supports two methods of authentication:

1. **API Key Exchange for JWT Token**: Client applications can exchange an API key for a short-lived JWT token
2. **Direct API Key Authentication**: Client applications can use an API key directly in the request header

## Authentication Methods

### JWT Token Authentication

1. Exchange an API key for a JWT token using the token endpoint:

   ```
   POST /api/auth/token
   Content-Type: application/json

   {
     "apiKey": "your-api-key"
   }
   ```

2. Use the JWT token in subsequent requests:
   ```
   GET /api/mcp/tools
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### Direct API Key Authentication

Use the API key directly in the request header:

```
GET /api/mcp/tools
X-API-Key: your-api-key
```

## Access Levels and Permissions

The authentication system supports three levels of access:

1. **Read-only** (TokenScope.READ_ONLY)

   - Can access `/api/mcp/tools` and other read-only endpoints
   - Cannot execute MCP tools or modify data

2. **Read-write** (TokenScope.READ_WRITE)

   - Includes all read-only permissions
   - Can execute most MCP tools
   - Can modify non-critical data

3. **Admin** (TokenScope.ADMIN)
   - Full access to all MCP endpoints
   - Can execute all MCP tools, including sensitive operations
   - Can manage API keys and access control

## Security Considerations

1. **Token Expiration**: JWT tokens are short-lived (1 hour by default) to minimize the risk of token theft
2. **Rate Limiting**: The system includes rate limiting to prevent abuse and brute force attacks
3. **Comprehensive Logging**: All authentication attempts and token use are logged for audit purposes
4. **IP Restrictions**: API keys can be restricted to specific IP addresses for enhanced security

## API Key Management

API keys are managed by system administrators. Each API key includes:

- Client ID: Identifies the client application
- User ID: Links the API key to a specific user
- Access Level: Determines the level of access granted
- Description: Optional description of the API key's purpose
- Expiration Date: Optional date after which the API key becomes invalid
- IP Restrictions: Optional list of IP addresses from which the API key can be used

## Example Usage

### Node.js Example

```javascript
const fetch = require('node-fetch');

// Get JWT token
async function getToken(apiKey) {
  const response = await fetch('http://localhost:3000/api/auth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey }),
  });

  const { token } = await response.json();
  return token;
}

// Use the token to execute an MCP tool
async function executeMcpTool(token, toolName, parameters) {
  const response = await fetch('http://localhost:3000/api/mcp/execute', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ toolName, parameters }),
  });

  return await response.json();
}

// Example usage
async function main() {
  const token = await getToken('your-api-key');
  const result = await executeMcpTool(token, 'getPropertyById', { propertyId: 'BC001' });
  console.log(result);
}
```

## Troubleshooting

- **401 Unauthorized**: The API key or JWT token is invalid or expired
- **403 Forbidden**: The authenticated user does not have the required permissions
- **429 Too Many Requests**: The rate limit has been exceeded

Contact the system administrator if you need assistance with API key management or authentication issues.
