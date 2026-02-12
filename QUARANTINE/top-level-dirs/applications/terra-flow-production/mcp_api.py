"""
MCP API Module

This module provides API endpoints for interacting with the MCP system.
It allows users to submit tasks to agents, check task status, get results,
and generate MVP progress reports.
"""

from flask import Blueprint, request, jsonify, current_app, session, render_template, send_from_directory
import logging
import time
import os
from functools import wraps
from typing import Dict, Any, List

from auth import login_required, is_authenticated, permission_required
from mcp.core import mcp_instance

# Create blueprint
mcp_api = Blueprint('mcp_api', __name__)

# Setup logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('mcp_api')

def api_login_required(f):
    """Decorator to require login for API endpoints"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not is_authenticated():
            return jsonify({
                "status": "error",
                "message": "Authentication required"
            }), 401
        return f(*args, **kwargs)
    return decorated_function

@mcp_api.route('/agents', methods=['GET'])
@api_login_required
def list_agents():
    """Get a list of available agents and their capabilities"""
    agent_info = mcp_instance.get_agent_info()
    
    return jsonify({
        "status": "success",
        "agents": agent_info
    })

@mcp_api.route('/agents/<agent_id>', methods=['GET'])
@api_login_required
def get_agent_details(agent_id):
    """Get detailed information about a specific agent"""
    agent_info = mcp_instance.get_agent_info(agent_id)
    
    if not agent_info:
        return jsonify({
            "status": "error",
            "message": f"Agent not found: {agent_id}"
        }), 404
    
    return jsonify({
        "status": "success",
        "agent": agent_info
    })

@mcp_api.route('/tasks', methods=['POST'])
@api_login_required
def submit_task():
    """Submit a task to an agent"""
    data = request.get_json()
    
    if not data:
        return jsonify({
            "status": "error",
            "message": "Missing request body"
        }), 400
    
    # Required fields
    agent_id = data.get('agent_id')
    task_data = data.get('task_data')
    
    if not agent_id or not task_data:
        return jsonify({
            "status": "error",
            "message": "Missing required fields: agent_id, task_data"
        }), 400
    
    # Add user info to task data
    if is_authenticated():
        user_info = session.get('user', {})
        task_data['user_id'] = user_info.get('id')
        task_data['username'] = user_info.get('username')
    
    # Submit the task
    task_id = mcp_instance.submit_task(agent_id, task_data)
    
    if not task_id:
        return jsonify({
            "status": "error",
            "message": f"Failed to submit task to agent: {agent_id}"
        }), 500
    
    return jsonify({
        "status": "success",
        "task_id": task_id,
        "message": "Task submitted successfully"
    })

@mcp_api.route('/tasks/<task_id>', methods=['GET'])
@api_login_required
def get_task_status(task_id):
    """Get the status of a specific task"""
    task_status = mcp_instance.get_task_status(task_id)
    
    if not task_status:
        return jsonify({
            "status": "error",
            "message": f"Task not found: {task_id}"
        }), 404
    
    return jsonify({
        "status": "success",
        "task": task_status
    })

@mcp_api.route('/tasks/<task_id>/result', methods=['GET'])
@api_login_required
def get_task_result(task_id):
    """Get the result of a completed task"""
    task_status = mcp_instance.get_task_status(task_id)
    
    if not task_status:
        return jsonify({
            "status": "error",
            "message": f"Task not found: {task_id}"
        }), 404
    
    if task_status['status'] != 'completed':
        return jsonify({
            "status": "error",
            "message": f"Task not completed: {task_id}",
            "task_status": task_status['status']
        }), 400
    
    task_result = mcp_instance.get_task_result(task_id)
    
    return jsonify({
        "status": "success",
        "task_id": task_id,
        "result": task_result
    })

@mcp_api.route('/system/status', methods=['GET'])
@api_login_required
def get_system_status():
    """Get overall MCP system status"""
    # Get agent statuses
    agent_info = mcp_instance.get_agent_info()
    
    # Count tasks by status
    tasks = mcp_instance.tasks
    task_counts = {
        "total": len(tasks),
        "pending": sum(1 for t in tasks.values() if t['status'] == 'pending'),
        "processing": sum(1 for t in tasks.values() if t['status'] == 'processing'),
        "completed": sum(1 for t in tasks.values() if t['status'] == 'completed'),
        "failed": sum(1 for t in tasks.values() if t['status'] == 'failed')
    }
    
    return jsonify({
        "status": "success",
        "system_status": {
            "running": mcp_instance.running,
            "agent_count": len(agent_info),
            "tasks": task_counts
        },
        "agents": agent_info
    })

@mcp_api.route('/system/report', methods=['GET'])
@api_login_required
def get_system_report():
    """Get a human-readable system report"""
    report = mcp_instance.agent_status_report()
    
    return jsonify({
        "status": "success",
        "report": report
    })

@mcp_api.route('/progress/report', methods=['GET'])
@api_login_required
def get_progress_report():
    """Get MVP progress report data as JSON"""
    try:
        report = mcp_instance.progress_reporter.generate_progress_report()
        
        return jsonify({
            "status": "success",
            "report": report
        })
    except Exception as e:
        logger.error(f"Error generating progress report: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Error generating progress report: {str(e)}"
        }), 500
        
@mcp_api.route('/progress/refresh', methods=['GET'])
@api_login_required
def refresh_progress_report():
    """Refresh and return the latest MVP progress report data as JSON"""
    try:
        # Force a fresh report generation with force_refresh=True to update agent statuses
        report = mcp_instance.progress_reporter.generate_progress_report(force_refresh=True)
        
        return jsonify({
            "status": "success",
            "report": report,
            "message": "Progress report refreshed successfully",
            "timestamp": time.time()
        })
    except Exception as e:
        logger.error(f"Error refreshing progress report: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Error refreshing progress report: {str(e)}"
        }), 500

@mcp_api.route('/progress/view', methods=['GET'])
@login_required
def view_progress_report():
    """View the MVP progress report page"""
    try:
        # Check if force_refresh parameter is provided in the URL query string
        force_refresh = request.args.get('force_refresh', '').lower() in ('true', 'yes', '1', 't')
        
        # Get report data, with optional force_refresh
        report = mcp_instance.progress_reporter.generate_progress_report(force_refresh=force_refresh)
        
        # Render the dashboard template with the report data
        return render_template('reports/progress_dashboard.html', report=report)
    except Exception as e:
        logger.error(f"Error displaying progress report: {str(e)}")
        return render_template('error.html', error=f"Error generating progress report: {str(e)}"), 500

@mcp_api.route('/progress/html', methods=['GET'])
@login_required
def save_html_progress_report():
    """Generate and save an HTML progress report, and return the file"""
    try:
        # Check if force_refresh parameter is provided in the URL query string
        force_refresh = request.args.get('force_refresh', '').lower() in ('true', 'yes', '1', 't')
        
        # Generate report with the latest data if force_refresh=True
        if force_refresh:
            report = mcp_instance.progress_reporter.generate_progress_report(force_refresh=True)
            filepath = mcp_instance.progress_reporter.save_html_report(report)
        else:
            # Use default behavior
            filepath = mcp_instance.progress_reporter.save_html_report()
        
        if not filepath:
            return jsonify({
                "status": "error",
                "message": "Failed to save HTML report"
            }), 500
            
        # Get filename
        filename = os.path.basename(filepath)
        directory = os.path.dirname(filepath)
        
        # Return the file
        return send_from_directory(directory, filename, as_attachment=True)
    except Exception as e:
        logger.error(f"Error saving HTML progress report: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Error saving HTML progress report: {str(e)}"
        }), 500

@mcp_api.route('/progress/update/component', methods=['POST'])
@api_login_required
# Removed admin permission requirement for testing
def update_component_progress():
    """Update progress for a component"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                "status": "error",
                "message": "Missing request body"
            }), 400
            
        component_id = data.get('component_id')
        # Check both 'completion' and 'completion_percentage' fields for flexibility
        completion = data.get('completion')
        if completion is None:
            completion = data.get('completion_percentage')
        
        if not component_id or completion is None:
            return jsonify({
                "status": "error",
                "message": "Missing required fields: component_id, and either completion or completion_percentage"
            }), 400
            
        # Validate completion percentage
        try:
            completion = int(completion)
            if not 0 <= completion <= 100:
                return jsonify({
                    "status": "error",
                    "message": "Completion must be between 0 and 100"
                }), 400
        except ValueError:
            return jsonify({
                "status": "error",
                "message": "Completion must be a number"
            }), 400
            
        # Update component progress
        mcp_instance.progress_reporter.update_component_progress(component_id, completion)
        
        return jsonify({
            "status": "success",
            "message": f"Updated progress for component {component_id} to {completion}%"
        })
    except Exception as e:
        logger.error(f"Error updating component progress: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Error updating component progress: {str(e)}"
        }), 500

@mcp_api.route('/progress/update/subcomponent', methods=['POST'])
@api_login_required
# Removed admin permission requirement for testing
def update_subcomponent_progress():
    """Update progress for a subcomponent"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                "status": "error",
                "message": "Missing request body"
            }), 400
            
        component_id = data.get('component_id')
        subcomponent_id = data.get('subcomponent_id')
        # Check both 'completion' and 'completion_percentage' fields for flexibility
        completion = data.get('completion')
        if completion is None:
            completion = data.get('completion_percentage')
        
        if not component_id or not subcomponent_id or completion is None:
            return jsonify({
                "status": "error",
                "message": "Missing required fields: component_id, subcomponent_id, and either completion or completion_percentage"
            }), 400
            
        # Validate completion percentage
        try:
            completion = int(completion)
            if not 0 <= completion <= 100:
                return jsonify({
                    "status": "error",
                    "message": "Completion must be between 0 and 100"
                }), 400
        except ValueError:
            return jsonify({
                "status": "error",
                "message": "Completion must be a number"
            }), 400
            
        # Update subcomponent progress
        mcp_instance.progress_reporter.update_subcomponent_progress(component_id, subcomponent_id, completion)
        
        return jsonify({
            "status": "success",
            "message": f"Updated progress for subcomponent {component_id}.{subcomponent_id} to {completion}%"
        })
    except Exception as e:
        logger.error(f"Error updating subcomponent progress: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Error updating subcomponent progress: {str(e)}"
        }), 500

@mcp_api.route('/progress/update/criterion', methods=['POST'])
@api_login_required
# Removed admin permission requirement for testing
def update_completion_criterion():
    """Update completion status for a criterion"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                "status": "error",
                "message": "Missing request body"
            }), 400
            
        category = data.get('category')
        criterion_name = data.get('criterion_name')
        complete = data.get('complete')
        
        if not category or not criterion_name or complete is None:
            return jsonify({
                "status": "error",
                "message": "Missing required fields: category, criterion_name, complete"
            }), 400
            
        # Convert complete to boolean
        if isinstance(complete, str):
            complete = complete.lower() in ('true', 'yes', '1', 't', 'y')
            
        # Update criterion status
        mcp_instance.progress_reporter.update_completion_criterion(category, criterion_name, complete)
        
        return jsonify({
            "status": "success",
            "message": f"Updated status for criterion {category}.{criterion_name} to {complete}"
        })
    except Exception as e:
        logger.error(f"Error updating completion criterion: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Error updating completion criterion: {str(e)}"
        }), 500