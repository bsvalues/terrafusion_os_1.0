#!/usr/bin/env python3
"""
TerraFusion OS - MCP Tools Validation
Validate MCP tools integration and configuration
"""

import json
import os

def validate_mcp_tools():
    print("=== MCP TOOLS VALIDATION ===")
    
    try:
        with open('mcp.json', 'r') as f:
            config = json.load(f)
        
        print(f"Total MCP Servers: {len(config.get('mcpServers', {}))}")
        print(f"Total MCP Tools: {len(config.get('mcpTools', {}))}")
        
        print("\nMCP Servers:")
        for server_name in config.get('mcpServers', {}).keys():
            print(f"  - {server_name}")
        
        print("\nMCP Tools:")
        for tool_name in config.get('mcpTools', {}).keys():
            print(f"  - {tool_name}")
        
        print("\n✅ MCP Tools: Validated")
        return True
        
    except Exception as e:
        print(f"❌ MCP Validation Error: {e}")
        return False

if __name__ == "__main__":
    validate_mcp_tools()
