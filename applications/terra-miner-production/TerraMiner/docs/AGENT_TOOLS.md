# Agent Tools Integration

## Overview

This document provides information about the Agent Tools integration in the TerraMiner platform. The Agent Tools feature leverages aipotheosis-labs' ACI (Agent Connector Interface) to provide access to 600+ external tool integrations for AI agents.

## Features

- **Tool Search**: Search and discover available tools based on keywords or categories
- **Tool Execution**: Execute tools with custom parameters directly from the UI
- **API Integration**: Access tools programmatically through the Agent Tools API

## Setting Up

### Requirements

To use the Agent Tools integration, you need an ACI API key from aipotheosis-labs. Set this key as an environment variable:

```
ACI_API_KEY=your_api_key_here
```

### Initialization

The Agent Tools system is automatically initialized when the application starts. If the API key is not available, the system will still work but with limited functionality.

## Using Agent Tools UI

The Agent Tools UI provides a user-friendly interface for working with the available tools. Access it at `/agent-tools`.

### Searching for Tools

1. Enter a search query in the search box (e.g., "weather", "maps", "search")
2. Optionally select a category filter
3. Click "Search" to find matching tools

### Executing Tools

1. Enter the tool name (e.g., "BRAVE_SEARCH__WEB_SEARCH")
2. Enter the tool arguments in JSON format (e.g., `{"query": "real estate market trends"}`)
3. Click "Execute Tool" to run the tool
4. View the results in the "Execution Result" section

## API Reference

The Agent Tools API provides programmatic access to the tool functionality.

### Endpoints

- **GET /api/agent-tools/search**: Search for available tools
  - Query parameters:
    - `query`: Search query string
    - `limit`: Maximum number of results (default: 10)
    - `category`: Filter by category (optional)

- **GET /api/agent-tools/definition/:tool_name**: Get detailed definition for a specific tool
  - Path parameters:
    - `tool_name`: Name of the tool

- **POST /api/agent-tools/execute**: Execute a specific tool
  - Request body:
    - `tool_name`: Name of the tool to execute
    - `arguments`: JSON object containing tool arguments

- **GET /api/agent-tools/apps**: Get all available apps
  - No parameters required

- **GET /api/agent-tools/status**: Get status of agent tools integration
  - No parameters required

## Integrating with Your Code

### Example: Searching for Tools

```python
import requests

def search_tools(query, limit=10):
    response = requests.get(
        f"/api/agent-tools/search?query={query}&limit={limit}"
    )
    return response.json()

# Example usage
weather_tools = search_tools("weather")
print(f"Found {len(weather_tools['tools'])} weather-related tools")
```

### Example: Executing a Tool

```python
import requests
import json

def execute_tool(tool_name, arguments):
    response = requests.post(
        "/api/agent-tools/execute",
        json={
            "tool_name": tool_name,
            "arguments": arguments
        }
    )
    return response.json()

# Example usage
result = execute_tool(
    "WEATHER__GET_CURRENT",
    {"location": "Seattle, WA"}
)
print(f"Current weather: {json.dumps(result, indent=2)}")
```

## Troubleshooting

### Common Issues

1. **Tool Execution Fails**: Check that you have the required API key and that the tool arguments are in the correct format.

2. **API Key Missing**: If you see "ACI client not initialized" errors, set the ACI_API_KEY environment variable.

3. **Rate Limiting**: Some tools may have rate limits. If you encounter rate limit errors, reduce the frequency of requests.

### Getting Help

For more information about aipotheosis-labs tools, visit their GitHub repository: [https://github.com/aipotheosis-labs](https://github.com/aipotheosis-labs)

## Adding New Tools

The Agent Tools system automatically discovers available tools based on your API key. To add new tools:

1. Request access to additional tools from aipotheosis-labs
2. Your API key will be updated with permissions for the new tools
3. The tools will automatically appear in search results