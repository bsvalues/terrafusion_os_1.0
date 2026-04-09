"""
Model Content Protocol (MCP) integration with Flask routes.

This module provides functionality for integrating MCP capabilities into the Flask application,
including route enhancement and API endpoints.
"""

import json
import logging
from typing import Dict, List, Any, Callable, Optional

from flask import Blueprint, request, jsonify, current_app, render_template

from utils.mcp_core import registry, workflow_registry
from utils.mcp_agents import (
    levy_analysis_agent,
    levy_prediction_agent,
    workflow_coordinator_agent
)

logger = logging.getLogger(__name__)


def init_mcp():
    """
    Initialize the MCP framework.
    
    This function should be called during application startup.
    """
    logger.info("Initializing MCP framework")
    # Nothing to do here - the registry is automatically populated
    # when the modules are imported


def enhance_route_with_mcp(route_func: Callable) -> Callable:
    """
    Decorator to enhance a route with MCP capabilities.
    
    Args:
        route_func: The route function to enhance
        
    Returns:
        Enhanced route function
    """
    def enhanced_route(*args, **kwargs):
        # Execute the original route function
        result = route_func(*args, **kwargs)
        
        # If the result is a rendered template, add MCP capabilities
        if isinstance(result, str) and "<!DOCTYPE html>" in result:
            # Extract MCP data for the template
            # This is a simplified example - in a real application,
            # this would extract relevant data from the request/context
            mcp_data = {
                "available_functions": registry.list_functions(),
                "available_workflows": workflow_registry.list_workflows(),
                "available_agents": [
                    levy_analysis_agent.to_dict(),
                    levy_prediction_agent.to_dict(),
                    workflow_coordinator_agent.to_dict()
                ]
            }
            
            # This is a placeholder - in a real application, we would
            # inject the MCP data into the template context
            # For now, we'll just return the original result
            return result
        
        return result
    
    # Preserve the original function's metadata
    enhanced_route.__name__ = route_func.__name__
    enhanced_route.__doc__ = route_func.__doc__
    
    return enhanced_route


def enhance_routes_with_mcp(app):
    """
    Enhance all routes in the application with MCP capabilities.
    
    Args:
        app: Flask application
    """
    # This is a simplified version - in a real application,
    # we would iterate through all routes and apply the decorator
    # For now, we'll just log that we're enhancing routes
    logger.info("Enhancing routes with MCP capabilities")


def init_mcp_api_routes(app):
    """
    Initialize MCP API routes.
    
    Args:
        app: Flask application
    """
    mcp_api = Blueprint('mcp_api', __name__)
    
    @mcp_api.route('/api/mcp/functions', methods=['GET'])
    def list_functions():
        """API endpoint to list available MCP functions."""
        return jsonify({"functions": registry.list_functions()})
    
    @mcp_api.route('/api/mcp/workflows', methods=['GET'])
    def list_workflows():
        """API endpoint to list available MCP workflows."""
        return jsonify({"workflows": workflow_registry.list_workflows()})
    
    @mcp_api.route('/api/mcp/agents', methods=['GET'])
    def list_agents():
        """API endpoint to list available MCP agents."""
        agents = [
            levy_analysis_agent.to_dict(),
            levy_prediction_agent.to_dict(),
            workflow_coordinator_agent.to_dict()
        ]
        return jsonify({"agents": agents})
    
    @mcp_api.route('/api/mcp/function/execute', methods=['POST'])
    def execute_function():
        """API endpoint to execute an MCP function."""
        data = request.json
        if not data or 'function' not in data:
            return jsonify({"error": "Invalid request", "message": "Missing function name"}), 400
        
        function_name = data['function']
        parameters = data.get('parameters', {})
        
        try:
            result = registry.execute_function(function_name, parameters)
            return jsonify({"result": result})
        except Exception as e:
            logger.error(f"Error executing function {function_name}: {str(e)}")
            return jsonify({"error": "Function execution failed", "message": str(e)}), 500
    
    @mcp_api.route('/api/mcp/workflow/execute', methods=['POST'])
    def execute_workflow():
        """API endpoint to execute an MCP workflow."""
        data = request.json
        if not data or 'workflow' not in data:
            return jsonify({"error": "Invalid request", "message": "Missing workflow name"}), 400
        
        workflow_name = data['workflow']
        parameters = data.get('parameters', {})
        
        try:
            results = workflow_registry.execute_workflow(workflow_name, parameters)
            return jsonify({"result": {"status": "completed", "steps": len(results), "outputs": results}})
        except Exception as e:
            logger.error(f"Error executing workflow {workflow_name}: {str(e)}")
            return jsonify({"error": "Workflow execution failed", "message": str(e)}), 500
    
    @mcp_api.route('/api/mcp/agent/request', methods=['POST'])
    def agent_request():
        """API endpoint to send a request to an MCP agent."""
        data = request.json
        if not data or 'agent' not in data or 'request' not in data:
            return jsonify({"error": "Invalid request", "message": "Missing agent or request"}), 400
        
        agent_name = data['agent']
        request_name = data['request']
        parameters = data.get('parameters', {})
        
        # Get the appropriate agent
        if agent_name == "LevyAnalysisAgent":
            agent = levy_analysis_agent
        elif agent_name == "LevyPredictionAgent":
            agent = levy_prediction_agent
        elif agent_name == "WorkflowCoordinatorAgent":
            agent = workflow_coordinator_agent
        else:
            return jsonify({"error": "Invalid agent", "message": f"Agent '{agent_name}' not found"}), 400
        
        try:
            result = agent.handle_request(request_name, parameters)
            return jsonify({"result": {"response": f"{request_name} completed", "data": result}})
        except Exception as e:
            logger.error(f"Error handling agent request {agent_name}/{request_name}: {str(e)}")
            return jsonify({"error": "Agent request failed", "message": str(e)}), 500
    
    app.register_blueprint(mcp_api)