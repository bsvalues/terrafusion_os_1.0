"""
Agent Tools API

This module provides API endpoints for accessing agent tools functionality.
"""

import os
import logging
import json
from typing import Dict, Any, List, Optional
from flask import Blueprint, request, jsonify, current_app

# Import agent tools functionality
from ai.agent_tools import agent_tools_manager

# Set up logging
logger = logging.getLogger(__name__)

# Create blueprint
agent_tools_api = Blueprint('agent_tools_api', __name__)

@agent_tools_api.route('/api/agent-tools/search', methods=['GET'])
def search_tools():
    """Search for available agent tools."""
    query = request.args.get('query', '')
    limit = request.args.get('limit', 10, type=int)
    
    if not agent_tools_manager:
        return jsonify({
            'error': 'agent_tools_not_initialized',
            'message': 'Agent tools manager not initialized'
        }), 500
    
    try:
        tools = agent_tools_manager.search_available_tools(query, limit)
        return jsonify({
            'tools': tools,
            'count': len(tools),
            'query': query
        })
    except Exception as e:
        logger.error(f"Error searching for tools: {str(e)}")
        return jsonify({
            'error': 'search_error',
            'message': str(e)
        }), 500

@agent_tools_api.route('/api/agent-tools/execute', methods=['POST'])
def execute_tool():
    """Execute a specific agent tool."""
    data = request.get_json()
    
    if not data:
        return jsonify({
            'error': 'invalid_request',
            'message': 'Missing request body'
        }), 400
    
    tool_name = data.get('tool_name')
    arguments = data.get('arguments', {})
    
    if not tool_name:
        return jsonify({
            'error': 'missing_tool_name',
            'message': 'Tool name is required'
        }), 400
    
    if not agent_tools_manager:
        return jsonify({
            'error': 'agent_tools_not_initialized',
            'message': 'Agent tools manager not initialized'
        }), 500
    
    try:
        result = agent_tools_manager.execute_tool(tool_name, arguments)
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error executing tool {tool_name}: {str(e)}")
        return jsonify({
            'error': 'execution_error',
            'message': str(e)
        }), 500

@agent_tools_api.route('/api/agent-tools/definition/<tool_name>', methods=['GET'])
def get_tool_definition(tool_name):
    """Get definition for a specific tool."""
    if not agent_tools_manager:
        return jsonify({
            'error': 'agent_tools_not_initialized',
            'message': 'Agent tools manager not initialized'
        }), 500
    
    try:
        definition = agent_tools_manager.get_tool_definition(tool_name)
        
        if not definition:
            return jsonify({
                'error': 'tool_not_found',
                'message': f'Tool {tool_name} not found'
            }), 404
            
        return jsonify(definition)
    except Exception as e:
        logger.error(f"Error getting tool definition for {tool_name}: {str(e)}")
        return jsonify({
            'error': 'definition_error',
            'message': str(e)
        }), 500

@agent_tools_api.route('/api/agent-tools/apps', methods=['GET'])
def get_available_apps():
    """Get all available apps in the ACI platform."""
    if not agent_tools_manager:
        return jsonify({
            'error': 'agent_tools_not_initialized',
            'message': 'Agent tools manager not initialized'
        }), 500
    
    try:
        apps = agent_tools_manager.get_all_available_apps()
        return jsonify({
            'apps': apps,
            'count': len(apps)
        })
    except Exception as e:
        logger.error(f"Error getting available apps: {str(e)}")
        return jsonify({
            'error': 'apps_error',
            'message': str(e)
        }), 500

@agent_tools_api.route('/api/agent-tools/status', methods=['GET'])
def get_status():
    """Get status of agent tools integration."""
    from ai import check_api_keys, get_component_status
    
    api_keys = check_api_keys()
    components = get_component_status()
    
    return jsonify({
        'api_keys': api_keys,
        'components': components,
        'agent_tools_available': agent_tools_manager is not None
    })

def register_blueprint(app):
    """Register the agent tools API blueprint with the Flask app."""
    app.register_blueprint(agent_tools_api)
    logger.info("Registered Agent Tools API blueprint")