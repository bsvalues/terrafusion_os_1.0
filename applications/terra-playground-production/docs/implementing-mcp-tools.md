# Implementing MCP Tools

This guide explains how to implement new Model Context Protocol (MCP) tools for the Benton County Assessor's Office platform.

## Understanding MCP Tools

MCP tools are specialized functions that provide secure, controlled access to property data and operations. Each tool:

1. Has a unique name and description
2. Accepts a defined set of parameters
3. Performs a specific data operation or functionality
4. Returns a structured result
5. Has associated permission requirements

## Step-by-Step Implementation Guide

### 1. Define Tool Interface

Add your tool definition to the `MCPToolDefinition` array in the MCP service:

```typescript
export const MCPToolDefinitions: MCPToolDefinition[] = [
  // ... existing tools

  {
    name: 'myNewTool',
    description: 'Detailed description of what this tool does',
    requiredPermission: TokenScope.READ_ONLY, // or READ_WRITE, ADMIN
    parameters: z.object({
      param1: z.string().min(1).describe('Description of parameter 1'),
      param2: z.number().optional().describe('Optional numeric parameter'),
      // Add all parameters with their types and validations
    }),
    handler: myNewToolHandler,
  },
];
```

### 2. Implement Tool Handler

Create a handler function that implements the tool's logic:

```typescript
async function myNewToolHandler(
  params: z.infer<typeof myNewToolParameters>,
  context: MCPRequestContext
): Promise<any> {
  // Validate parameters (beyond Zod schema validation)
  if (specialValidationNeeded(params.param1)) {
    throw new Error('Invalid parameter: param1');
  }

  // Implement tool logic
  const result = await performOperation(params);

  // Log operation if needed (sensitive operations should be logged)
  if (isSignificantOperation) {
    await context.logAction('myNewTool executed', { params });
  }

  // Return result
  return result;
}
```

### 3. Add Parameter Schema

Define a Zod schema for your tool's parameters:

```typescript
const myNewToolParameters = z.object({
  param1: z.string().min(1).describe('Description of parameter 1'),
  param2: z.number().optional().describe('Optional numeric parameter'),
  // Add all parameters with their types and validations
});
```

### 4. Security Considerations

When implementing a tool, always consider:

1. **Input Validation**: Validate all parameters beyond just type checking
2. **Access Control**: Use the appropriate `requiredPermission` level
3. **Data Filtering**: Filter results based on user permissions
4. **Error Handling**: Provide clear error messages without exposing sensitive details
5. **Audit Logging**: Log sensitive operations for audit purposes

### 5. Tool Testing

Create tests for your new tool in the `tests/test-mcp.js` file:

```javascript
// Test your new tool
console.log('\nTesting myNewTool:');
const myToolResult = await executeTool(token, 'myNewTool', {
  param1: 'test',
  param2: 123,
});
if (myToolResult) {
  console.log('Tool executed successfully:');
  console.log(myToolResult.result);
}
```

## Example: Property Search Tool

Here's an example of a complete tool implementation for property searching:

```typescript
// Parameter schema
const searchPropertiesParameters = z.object({
  addressContains: z.string().min(1).max(100).describe('Partial address to search for'),
  limit: z.number().int().min(1).max(100).default(10).describe('Maximum number of results to return')
});

// Handler implementation
async function searchPropertiesHandler(
  params: z.infer<typeof searchPropertiesParameters>,
  context: MCPRequestContext
): Promise<Property[]> {
  // Validate parameters beyond schema validation
  securityService.checkSqlInjection(params.addressContains);

  // Execute the search
  const properties = await storage.getAllProperties();

  // Filter results
  const filtered = properties.filter(p =>
    p.address.toLowerCase().includes(params.addressContains.toLowerCase())
  ).slice(0, params.limit);

  // Log the search
  await context.logAction('Property search executed', {
    query: params.addressContains,
    resultCount: filtered.length
  });

  // Return results
  return filtered;
}

// Tool definition
{
  name: 'searchProperties',
  description: 'Search for properties containing the specified address text',
  requiredPermission: TokenScope.READ_ONLY,
  parameters: searchPropertiesParameters,
  handler: searchPropertiesHandler
}
```

## Best Practices

1. **Descriptive Naming**: Use clear, descriptive names for tools and parameters
2. **Comprehensive Validation**: Validate all inputs thoroughly
3. **Minimal Scope**: Keep tools focused on a single responsibility
4. **Consistent Error Handling**: Use consistent error formats and messages
5. **Performance Awareness**: Consider the performance impact of tools that may return large datasets
6. **Documentation**: Document all parameters and expected behaviors
7. **Security First**: Always prioritize security in tool implementation

## Integration with AI Agents

When designing tools for AI agent use:

1. **Clear Descriptions**: Provide detailed descriptions that AI agents can understand
2. **Predictable Patterns**: Use consistent parameter naming and result structures
3. **Granular Functionality**: Create smaller, focused tools rather than complex multi-function tools
4. **Error Guidance**: Return helpful error messages that guide toward correct usage

## Adding to the MCP Service

After implementing your tool, register it in the MCP service by adding it to the `MCPToolDefinitions` array.

The MCP service will automatically:

1. Register your tool in the available tools list
2. Apply parameter validation through Zod
3. Enforce permission requirements
4. Log tool execution
5. Apply security checks to inputs
