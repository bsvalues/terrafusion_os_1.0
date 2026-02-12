"""
Agent Service API for GeoAssessmentPro

This module provides RESTful API endpoints for AI agent management,
task dispatching, and result retrieval.
"""

import os
import logging
import json
from typing import Dict, Any, List, Optional
from datetime import datetime

from flask import Blueprint, request, jsonify, current_app
from ai_agents.mcp_core import get_mcp, TaskPriority

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Blueprint
agent_bp = Blueprint("geo_agent", __name__, url_prefix="/api/v1/agents")

@agent_bp.route("/", methods=["GET"])
def get_agents():
    """
    Get list of available agent types and active agents.
    
    Returns:
        JSON with agent information
    """
    try:
        # Get MCP instance
        mcp = get_mcp()
        
        # Get registered agent types
        agent_types = list(mcp.agent_types.keys())
        
        # Get active agents of all types
        active_agents = mcp.get_active_agents()
        
        # Get agent pools
        agent_pools = list(mcp.agent_pools.values())
        
        return jsonify({
            "agent_types": agent_types,
            "active_agents": active_agents,
            "agent_pools": agent_pools
        })
        
    except Exception as e:
        logger.error(f"Error getting agents: {str(e)}")
        
        return jsonify({
            "error": "Error getting agents",
            "message": str(e)
        }), 500

@agent_bp.route("/types", methods=["GET"])
def get_agent_types():
    """
    Get list of available agent types.
    
    Returns:
        JSON with agent type information
    """
    try:
        # Get MCP instance
        mcp = get_mcp()
        
        # Get registered agent types
        agent_types = list(mcp.agent_types.keys())
        
        return jsonify({
            "agent_types": agent_types,
            "count": len(agent_types)
        })
        
    except Exception as e:
        logger.error(f"Error getting agent types: {str(e)}")
        
        return jsonify({
            "error": "Error getting agent types",
            "message": str(e)
        }), 500

@agent_bp.route("/active", methods=["GET"])
def get_active_agents():
    """
    Get list of active agents.
    
    Query parameters:
        agent_type: Filter by agent type
        
    Returns:
        JSON with active agent information
    """
    try:
        # Get query parameters
        agent_type = request.args.get("agent_type")
        
        # Get MCP instance
        mcp = get_mcp()
        
        # Get active agents
        active_agents = mcp.get_active_agents(agent_type)
        
        return jsonify({
            "agents": active_agents,
            "count": len(active_agents),
            "filtered_by_type": agent_type
        })
        
    except Exception as e:
        logger.error(f"Error getting active agents: {str(e)}")
        
        return jsonify({
            "error": "Error getting active agents",
            "message": str(e)
        }), 500

@agent_bp.route("/pools", methods=["GET"])
def get_agent_pools():
    """
    Get list of agent pools.
    
    Returns:
        JSON with agent pool information
    """
    try:
        # Get MCP instance
        mcp = get_mcp()
        
        # Get agent pools
        agent_pools = list(mcp.agent_pools.values())
        
        return jsonify({
            "pools": agent_pools,
            "count": len(agent_pools)
        })
        
    except Exception as e:
        logger.error(f"Error getting agent pools: {str(e)}")
        
        return jsonify({
            "error": "Error getting agent pools",
            "message": str(e)
        }), 500

@agent_bp.route("/pools/<pool_id>", methods=["GET"])
def get_agent_pool(pool_id):
    """
    Get information about a specific agent pool.
    
    Args:
        pool_id: ID of the agent pool
        
    Returns:
        JSON with agent pool information
    """
    try:
        # Get MCP instance
        mcp = get_mcp()
        
        # Check if pool exists
        if pool_id not in mcp.agent_pools:
            return jsonify({
                "error": "Pool not found",
                "message": f"Agent pool {pool_id} does not exist"
            }), 404
        
        # Get pool information
        pool = mcp.agent_pools[pool_id]
        
        # Get detailed agent information
        agent_details = []
        for agent_id in pool["agents"]:
            if agent_id in mcp.active_agents:
                agent_details.append(mcp.active_agents[agent_id].report_status())
        
        # Add agent details to pool information
        pool_info = pool.copy()
        pool_info["agent_details"] = agent_details
        
        return jsonify(pool_info)
        
    except Exception as e:
        logger.error(f"Error getting agent pool: {str(e)}")
        
        return jsonify({
            "error": "Error getting agent pool",
            "message": str(e)
        }), 500

@agent_bp.route("/pools", methods=["POST"])
def create_agent_pool():
    """
    Create a new agent pool.
    
    Request body should contain:
    {
        "agent_type": "Type of agents in the pool",
        "pool_size": Number of agents to create,
        "pool_name": "Optional name for the pool"
    }
    
    Returns:
        JSON with pool ID and information
    """
    try:
        # Parse request JSON
        request_data = request.get_json()
        
        if not request_data:
            return jsonify({
                "error": "Invalid request",
                "message": "Request body must be valid JSON"
            }), 400
        
        # Extract parameters
        agent_type = request_data.get("agent_type")
        pool_size = request_data.get("pool_size")
        pool_name = request_data.get("pool_name")
        
        if not agent_type:
            return jsonify({
                "error": "Missing parameter",
                "message": "Agent type must be specified"
            }), 400
        
        if not pool_size:
            return jsonify({
                "error": "Missing parameter",
                "message": "Pool size must be specified"
            }), 400
        
        # Get MCP instance
        mcp = get_mcp()
        
        # Create agent pool
        pool_id = mcp.create_agent_pool(agent_type, pool_size, pool_name)
        
        return jsonify({
            "pool_id": pool_id,
            "agent_type": agent_type,
            "pool_size": pool_size,
            "pool_name": pool_name,
            "message": f"Agent pool {pool_id} created successfully"
        })
        
    except ValueError as e:
        return jsonify({
            "error": "Invalid parameter",
            "message": str(e)
        }), 400
        
    except Exception as e:
        logger.error(f"Error creating agent pool: {str(e)}")
        
        return jsonify({
            "error": "Error creating agent pool",
            "message": str(e)
        }), 500

@agent_bp.route("/tasks", methods=["POST"])
def dispatch_task():
    """
    Dispatch a task to an agent.
    
    Request body should contain:
    {
        "agent_type": "Type of agent to process the task",
        "task_data": Task data object,
        "priority": "low|normal|high|critical" (optional, default: "normal"),
        "wait": true|false (optional, default: false)
    }
    
    Returns:
        Task ID or result if wait=true
    """
    try:
        # Parse request JSON
        request_data = request.get_json()
        
        if not request_data:
            return jsonify({
                "error": "Invalid request",
                "message": "Request body must be valid JSON"
            }), 400
        
        # Extract parameters
        agent_type = request_data.get("agent_type")
        task_data = request_data.get("task_data")
        priority_str = request_data.get("priority", "normal")
        wait = request_data.get("wait", False)
        
        if not agent_type:
            return jsonify({
                "error": "Missing parameter",
                "message": "Agent type must be specified"
            }), 400
        
        if not task_data:
            return jsonify({
                "error": "Missing parameter",
                "message": "Task data must be specified"
            }), 400
        
        # Convert priority string to TaskPriority enum
        priority_map = {
            "low": TaskPriority.LOW,
            "normal": TaskPriority.NORMAL,
            "high": TaskPriority.HIGH,
            "critical": TaskPriority.CRITICAL
        }
        priority = priority_map.get(priority_str.lower(), TaskPriority.NORMAL)
        
        # Get MCP instance
        mcp = get_mcp()
        
        # Set timeout for waiting tasks
        timeout = 60 if wait else None
        
        # Dispatch task
        result = mcp.dispatch_task(
            agent_type=agent_type,
            task_data=task_data,
            priority=priority,
            wait=wait,
            timeout=timeout
        )
        
        # Return result or task ID
        if wait:
            return jsonify({
                "status": "completed",
                "result": result
            })
        else:
            return jsonify({
                "status": "pending",
                "task_id": result,
                "message": "Task dispatched successfully"
            })
        
    except ValueError as e:
        return jsonify({
            "error": "Invalid parameter",
            "message": str(e)
        }), 400
        
    except Exception as e:
        logger.error(f"Error dispatching task: {str(e)}")
        
        return jsonify({
            "error": "Error dispatching task",
            "message": str(e)
        }), 500

@agent_bp.route("/pools/<pool_id>/tasks", methods=["POST"])
def dispatch_task_to_pool(pool_id):
    """
    Dispatch a task to an agent pool.
    
    Args:
        pool_id: ID of the agent pool
        
    Request body should contain:
    {
        "task_data": Task data object,
        "priority": "low|normal|high|critical" (optional, default: "normal"),
        "wait": true|false (optional, default: false)
    }
    
    Returns:
        Task ID or result if wait=true
    """
    try:
        # Parse request JSON
        request_data = request.get_json()
        
        if not request_data:
            return jsonify({
                "error": "Invalid request",
                "message": "Request body must be valid JSON"
            }), 400
        
        # Extract parameters
        task_data = request_data.get("task_data")
        priority_str = request_data.get("priority", "normal")
        wait = request_data.get("wait", False)
        
        if not task_data:
            return jsonify({
                "error": "Missing parameter",
                "message": "Task data must be specified"
            }), 400
        
        # Convert priority string to TaskPriority enum
        priority_map = {
            "low": TaskPriority.LOW,
            "normal": TaskPriority.NORMAL,
            "high": TaskPriority.HIGH,
            "critical": TaskPriority.CRITICAL
        }
        priority = priority_map.get(priority_str.lower(), TaskPriority.NORMAL)
        
        # Get MCP instance
        mcp = get_mcp()
        
        # Check if pool exists
        if pool_id not in mcp.agent_pools:
            return jsonify({
                "error": "Pool not found",
                "message": f"Agent pool {pool_id} does not exist"
            }), 404
        
        # Set timeout for waiting tasks
        timeout = 60 if wait else None
        
        # Dispatch task to pool
        result = mcp.dispatch_task_to_pool(
            pool_id=pool_id,
            task_data=task_data,
            priority=priority,
            wait=wait,
            timeout=timeout
        )
        
        # Return result or task ID
        if wait:
            return jsonify({
                "status": "completed",
                "result": result
            })
        else:
            return jsonify({
                "status": "pending",
                "task_id": result,
                "message": f"Task dispatched to pool {pool_id} successfully"
            })
        
    except ValueError as e:
        return jsonify({
            "error": "Invalid parameter",
            "message": str(e)
        }), 400
        
    except Exception as e:
        logger.error(f"Error dispatching task to pool: {str(e)}")
        
        return jsonify({
            "error": "Error dispatching task to pool",
            "message": str(e)
        }), 500

@agent_bp.route("/tasks/<task_id>", methods=["GET"])
def get_task_status(task_id):
    """
    Get status of a task.
    
    Args:
        task_id: ID of the task
        
    Returns:
        Task status and results if available
    """
    try:
        # Get MCP instance
        mcp = get_mcp()
        
        # Get task status
        status = mcp.get_task_status(task_id)
        
        # If task is completed, get the result
        if status["status"] == "completed":
            try:
                result = mcp.get_task_result(task_id)
                return jsonify({
                    "status": "completed",
                    "task_id": task_id,
                    "result": result
                })
            except Exception as e:
                return jsonify({
                    "status": "error",
                    "task_id": task_id,
                    "error": str(e)
                }), 500
        
        # Return task status
        return jsonify({
            "status": status["status"],
            "task_id": task_id,
            "created_at": status["created_at"],
            "updated_at": status["updated_at"]
        })
        
    except ValueError as e:
        return jsonify({
            "error": "Task not found",
            "message": str(e)
        }), 404
        
    except Exception as e:
        logger.error(f"Error getting task status: {str(e)}")
        
        return jsonify({
            "error": "Error getting task status",
            "message": str(e)
        }), 500

@agent_bp.route("/tasks/<task_id>/result", methods=["GET"])
def get_task_result(task_id):
    """
    Get result of a completed task.
    
    Args:
        task_id: ID of the task
        
    Returns:
        Task result
    """
    try:
        # Get MCP instance
        mcp = get_mcp()
        
        # Get task result
        result = mcp.get_task_result(task_id)
        
        return jsonify({
            "status": "completed",
            "task_id": task_id,
            "result": result
        })
        
    except ValueError as e:
        return jsonify({
            "error": "Task not found",
            "message": str(e)
        }), 404
        
    except Exception as e:
        logger.error(f"Error getting task result: {str(e)}")
        
        return jsonify({
            "error": "Error getting task result",
            "message": str(e)
        }), 500

@agent_bp.route("/capabilities", methods=["GET"])
def get_agent_capabilities():
    """
    Get capabilities of available agents.
    
    Query parameters:
        agent_type: Filter by agent type
        
    Returns:
        JSON with agent capabilities
    """
    try:
        # Get query parameters
        agent_type = request.args.get("agent_type")
        
        # Get MCP instance
        mcp = get_mcp()
        
        # Get agent types
        agent_types = [agent_type] if agent_type else mcp.agent_types.keys()
        
        # Get capabilities for each agent type
        agent_capabilities = {}
        
        for agent_type in agent_types:
            if agent_type in mcp.agent_types:
                # Create an instance to query capabilities
                agent = mcp.create_agent(agent_type)
                
                # Get capabilities - capabilities is now a standard attribute on BaseAgent
                if agent.capabilities:
                    if isinstance(agent.capabilities, dict):
                        capabilities = list(agent.capabilities.keys())
                    elif isinstance(agent.capabilities, list):
                        capabilities = agent.capabilities
                    else:
                        capabilities = []
                else:
                    capabilities = []
                
                agent_capabilities[agent_type] = capabilities
        
        return jsonify({
            "agent_capabilities": agent_capabilities
        })
        
    except Exception as e:
        logger.error(f"Error getting agent capabilities: {str(e)}")
        
        return jsonify({
            "error": "Error getting agent capabilities",
            "message": str(e)
        }), 500

def register_blueprint(app):
    """Register the blueprint with the Flask app"""
    app.register_blueprint(agent_bp)
    logger.info("Registered agent service blueprint")