"""
API routes for the ETL system.

This module provides API endpoints to:
1. Get available ETL plugins
2. Run ETL jobs
3. Check job status
4. Get job history
"""
import logging
from datetime import datetime
from flask import Blueprint, jsonify, request, current_app

from etl.manager import etl_manager
from api.auth import api_key_required

# Configure logger
logger = logging.getLogger(__name__)

# Create blueprint
etl_bp = Blueprint('etl', __name__, url_prefix='/api/etl')

@etl_bp.route('/plugins', methods=['GET'])
@api_key_required(['etl:read'])
def get_plugins():
    """
    Get a list of available ETL plugins.
    
    Returns:
        JSON: List of available ETL plugins with their information
    """
    try:
        plugins = etl_manager.get_available_plugins()
        return jsonify({
            "success": True,
            "plugins": plugins
        })
    except Exception as e:
        logger.exception(f"Error getting ETL plugins: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@etl_bp.route('/jobs', methods=['POST'])
@api_key_required(['etl:write'])
def run_job():
    """
    Run an ETL job.
    
    Request JSON:
        plugin_name (str): Name of the ETL plugin to run
        config (dict, optional): Configuration for the ETL plugin
    
    Returns:
        JSON: Job ID and status information
    """
    try:
        data = request.get_json()
        
        if not data or "plugin_name" not in data:
            return jsonify({
                "success": False,
                "error": "Missing required parameter: plugin_name"
            }), 400
        
        plugin_name = data["plugin_name"]
        config = data.get("config", {})
        
        # Start the job
        job_id = etl_manager.run_job(plugin_name, config)
        
        # Get initial status
        status = etl_manager.get_job_status(job_id)
        
        return jsonify({
            "success": True,
            "job_id": job_id,
            "status": status
        })
    except ValueError as ve:
        logger.warning(f"Invalid ETL job request: {str(ve)}")
        return jsonify({
            "success": False,
            "error": str(ve)
        }), 400
    except Exception as e:
        logger.exception(f"Error running ETL job: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@etl_bp.route('/jobs/<job_id>', methods=['GET'])
@api_key_required(['etl:read'])
def get_job_status(job_id):
    """
    Get the status of an ETL job.
    
    Args:
        job_id (str): The ID of the job
    
    Returns:
        JSON: Job status information
    """
    try:
        status = etl_manager.get_job_status(job_id)
        return jsonify({
            "success": True,
            "status": status
        })
    except ValueError as ve:
        return jsonify({
            "success": False,
            "error": str(ve)
        }), 404
    except Exception as e:
        logger.exception(f"Error getting job status: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@etl_bp.route('/jobs/<job_id>/cancel', methods=['POST'])
@api_key_required(['etl:write'])
def cancel_job(job_id):
    """
    Cancel an ETL job.
    
    Args:
        job_id (str): The ID of the job to cancel
    
    Returns:
        JSON: Success status
    """
    try:
        canceled = etl_manager.cancel_job(job_id)
        if canceled:
            return jsonify({
                "success": True,
                "message": f"Job {job_id} canceled"
            })
        else:
            return jsonify({
                "success": False,
                "error": f"Job {job_id} not found or already completed"
            }), 404
    except Exception as e:
        logger.exception(f"Error canceling job: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@etl_bp.route('/jobs', methods=['GET'])
@api_key_required(['etl:read'])
def get_jobs():
    """
    Get job history with optional filtering.
    
    Query parameters:
        limit (int, optional): Maximum number of records to return (default: 100)
        plugin_name (str, optional): Filter by ETL plugin name
        status (str, optional): Filter by job status
        since (str, optional): Filter to jobs since this datetime (ISO format)
    
    Returns:
        JSON: List of job history records
    """
    try:
        # Parse query parameters
        limit = request.args.get('limit', 100, type=int)
        plugin_name = request.args.get('plugin_name')
        status = request.args.get('status')
        since_str = request.args.get('since')
        
        # Parse since datetime if provided
        since = None
        if since_str:
            try:
                since = datetime.fromisoformat(since_str)
            except ValueError:
                return jsonify({
                    "success": False,
                    "error": "Invalid datetime format for 'since' parameter. Use ISO format (YYYY-MM-DDTHH:MM:SS)."
                }), 400
        
        # Get active jobs
        active_jobs = etl_manager.get_active_jobs()
        
        # Get job history with filters
        history = etl_manager.get_job_history(
            limit=limit,
            plugin_name=plugin_name,
            status=status,
            since=since
        )
        
        # Combine active jobs and history
        all_jobs = active_jobs + history
        
        # Apply additional filtering if needed
        if plugin_name:
            all_jobs = [j for j in all_jobs if j["plugin_name"] == plugin_name]
        if status:
            all_jobs = [j for j in all_jobs if j["status"] == status]
        if since:
            all_jobs = [j for j in all_jobs if j["start_time"] and j["start_time"] >= since]
        
        # Sort by start time (most recent first) and apply limit
        sorted_jobs = sorted(
            all_jobs,
            key=lambda j: j["start_time"] if j["start_time"] else datetime.min,
            reverse=True
        )
        
        return jsonify({
            "success": True,
            "jobs": sorted_jobs[:limit]
        })
    except Exception as e:
        logger.exception(f"Error getting job history: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# Function to register blueprint with Flask app
def register_etl_blueprint(app):
    """Register the ETL blueprint with the Flask app."""
    app.register_blueprint(etl_bp)
    logger.info("Registered ETL API blueprint")