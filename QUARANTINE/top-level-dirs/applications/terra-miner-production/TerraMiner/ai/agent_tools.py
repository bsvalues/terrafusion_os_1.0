"""
Agent Tools Module

This module provides integration with aipotheosis-labs ACI (Agent Connector Interface)
to access hundreds of tools for AI agents.
"""

import os
import logging
import json
from typing import Dict, Any, List, Optional

# Import the ACI client from aipolabs
from aipolabs import ACI

# Set up logging
logger = logging.getLogger(__name__)

class AgentToolsManager:
    """
    Manager for ACI agent tools integration.
    
    This class provides a facade for interacting with the ACI API and utilizing
    various agent tools for data retrieval, analysis, and processing.
    """
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize the agent tools manager.
        
        Args:
            api_key (Optional[str]): ACI API key. If not provided, it will be read from environment variables.
        """
        self.api_key = api_key or os.environ.get("ACI_API_KEY")
        self.client = None
        self.available_tools = {}
        
        if not self.api_key:
            logger.warning("ACI API key not provided. Some agent tools may not be available.")
        else:
            try:
                self.client = ACI(api_key=self.api_key)
                logger.info("ACI client initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize ACI client: {str(e)}")
    
    def search_available_tools(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Search for available tools based on a query.
        
        Args:
            query (str): Search query
            limit (int): Maximum number of results to return
            
        Returns:
            List[Dict[str, Any]]: List of matching tools
        """
        if not self.client:
            logger.warning("ACI client not initialized. Cannot search for tools.")
            return []
        
        try:
            # Search for functions using the ACI meta function
            results = self.client.handle_function_call(
                function_name="ACI_SEARCH_FUNCTIONS",
                function_arguments={
                    "query": query,
                    "limit": limit
                },
                linked_account_owner_id="default"  # Replace with actual user ID in production
            )
            
            # Store the found tools in the available_tools dict for quick lookup
            for tool in results.get("functions", []):
                tool_name = tool.get("name")
                if tool_name:
                    self.available_tools[tool_name] = tool
            
            return results.get("functions", [])
        except Exception as e:
            logger.error(f"Error searching for tools: {str(e)}")
            return []
    
    def get_tool_definition(self, tool_name: str) -> Dict[str, Any]:
        """
        Get the definition of a specific tool.
        
        Args:
            tool_name (str): Name of the tool
            
        Returns:
            Dict[str, Any]: Tool definition
        """
        if not self.client:
            logger.warning("ACI client not initialized. Cannot get tool definition.")
            return {}
        
        try:
            # Try to get from cached tools first
            if tool_name in self.available_tools:
                return self.available_tools[tool_name]
            
            # If not in cache, fetch from API
            result = self.client.handle_function_call(
                function_name="ACI_GET_FUNCTION_DEFINITION",
                function_arguments={
                    "function_name": tool_name
                },
                linked_account_owner_id="default"  # Replace with actual user ID in production
            )
            
            # Cache the result
            if result:
                self.available_tools[tool_name] = result
            
            return result
        except Exception as e:
            logger.error(f"Error getting tool definition: {str(e)}")
            return {}
    
    def execute_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute a specific tool with the provided arguments.
        
        Args:
            tool_name (str): Name of the tool
            arguments (Dict[str, Any]): Arguments for the tool
            
        Returns:
            Dict[str, Any]: Result of the tool execution
        """
        if not self.client:
            logger.warning("ACI client not initialized. Cannot execute tool.")
            return {"error": "ACI client not initialized"}
        
        try:
            # Execute the function
            result = self.client.handle_function_call(
                function_name=tool_name,
                function_arguments=arguments,
                linked_account_owner_id="default"  # Replace with actual user ID in production
            )
            
            return result
        except Exception as e:
            logger.error(f"Error executing tool {tool_name}: {str(e)}")
            return {"error": str(e)}
    
    def get_all_available_apps(self) -> List[Dict[str, Any]]:
        """
        Get all available apps in the ACI platform.
        
        Returns:
            List[Dict[str, Any]]: List of available apps
        """
        if not self.client:
            logger.warning("ACI client not initialized. Cannot get available apps.")
            return []
        
        try:
            # Search for apps using the ACI meta function
            results = self.client.handle_function_call(
                function_name="ACI_SEARCH_APPS",
                function_arguments={
                    "query": "",  # Empty query to get all apps
                    "limit": 100  # Get a large number to get most apps
                },
                linked_account_owner_id="default"  # Replace with actual user ID in production
            )
            
            return results.get("apps", [])
        except Exception as e:
            logger.error(f"Error getting available apps: {str(e)}")
            return []


# Initialize the Agent Tools Manager
agent_tools_manager = None

def initialize_agent_tools():
    """Initialize the agent tools manager."""
    global agent_tools_manager
    
    try:
        api_key = os.environ.get("ACI_API_KEY")
        agent_tools_manager = AgentToolsManager(api_key=api_key)
        
        # Pre-cache some commonly used tools
        common_tools = [
            "BRAVE_SEARCH__WEB_SEARCH",
            "WOLFRAM_ALPHA__QUERY",
            "WEATHER__GET_CURRENT",
            "GOOGLE_MAPS__SEARCH",
            "REDDIT__SEARCH_POSTS"
        ]
        
        for tool_name in common_tools:
            try:
                agent_tools_manager.get_tool_definition(tool_name)
            except:
                pass
                
        return True
    except Exception as e:
        logger.error(f"Failed to initialize agent tools: {str(e)}")
        return False