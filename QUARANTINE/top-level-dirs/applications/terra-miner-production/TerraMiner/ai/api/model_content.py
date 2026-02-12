import logging
from flask import Blueprint, request, jsonify

from ai.model_content_protocol import model_content_server

logger = logging.getLogger(__name__)

# Create Blueprint for model content protocol API endpoints
model_content_api = Blueprint('model_content_api', __name__, url_prefix='/api/model-content')

@model_content_api.route('/health', methods=['GET'])
def health_check():
    """Check health of model content protocol server"""
    return jsonify({
        "status": "online",
        "service": "model_content_protocol_server",
        "active_requests": len(model_content_server.active_requests),
        "stored_content": len(model_content_server.content_store)
    })

@model_content_api.route('/generate', methods=['POST'])
def generate_content():
    """Start content generation request"""
    try:
        request_data = request.get_json()
        
        if not request_data:
            return jsonify({
                "status": "error",
                "message": "Missing request data"
            }), 400
        
        response = model_content_server.start_content_generation(request_data)
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Error in generate_content endpoint: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Failed to start content generation: {str(e)}"
        }), 500

@model_content_api.route('/status/<request_id>', methods=['GET'])
def check_status(request_id):
    """Check status of a content generation request"""
    try:
        status = model_content_server.check_request_status(request_id)
        return jsonify(status)
        
    except Exception as e:
        logger.error(f"Error in check_status endpoint: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Failed to check status: {str(e)}"
        }), 500

@model_content_api.route('/content/<content_id>', methods=['GET'])
def get_content(content_id):
    """Get generated content by ID"""
    try:
        content = model_content_server.get_content(content_id)
        return jsonify(content)
        
    except Exception as e:
        logger.error(f"Error in get_content endpoint: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Failed to retrieve content: {str(e)}"
        }), 500

@model_content_api.route('/agent/execute', methods=['POST'])
def execute_agent_action():
    """Execute an action using the agent protocol"""
    try:
        action_data = request.get_json()
        
        if not action_data:
            return jsonify({
                "status": "error",
                "message": "Missing action data"
            }), 400
        
        response = model_content_server.execute_agent_action(action_data)
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Error in execute_agent_action endpoint: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Failed to execute agent action: {str(e)}"
        }), 500

@model_content_api.route('/cleanup', methods=['POST'])
def cleanup_old_data():
    """Clean up old requests and content"""
    try:
        data = request.get_json() or {}
        max_age_hours = data.get('max_age_hours', 24)
        
        # Run cleanup
        model_content_server.cleanup_old_requests(max_age_hours)
        
        return jsonify({
            "status": "success",
            "message": f"Cleanup completed with max age of {max_age_hours} hours"
        })
        
    except Exception as e:
        logger.error(f"Error in cleanup_old_data endpoint: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Failed to clean up old data: {str(e)}"
        }), 500