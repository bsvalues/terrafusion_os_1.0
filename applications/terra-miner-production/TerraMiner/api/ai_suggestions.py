"""
API endpoints for AI-powered contextual suggestions.
"""

import json
import logging
from flask import Blueprint, jsonify, request
from ai.suggestions import get_contextual_suggestions

logger = logging.getLogger(__name__)

# Create blueprint
ai_suggestions_api = Blueprint('ai_suggestions_api', __name__)

@ai_suggestions_api.route('/api/ai/suggestions', methods=['POST'])
def get_suggestions():
    """
    API endpoint to get AI-powered contextual suggestions.
    
    Expects:
        - context_type: Type of context (dashboard, property_detail, etc.)
        - context_data: Optional JSON data providing context for suggestions
    
    Returns:
        JSON response with suggestions or error message
    """
    try:
        # Get request data
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        context_type = data.get('context_type')
        context_data = data.get('context_data')
        
        if not context_type:
            return jsonify({"error": "Missing context_type parameter"}), 400
            
        # Get suggestions
        suggestions = get_contextual_suggestions(
            context_type=context_type,
            context_data=context_data
        )
        
        return jsonify({"suggestions": suggestions})
        
    except Exception as e:
        logger.error(f"Error generating suggestions: {str(e)}")
        return jsonify({"error": "Failed to generate suggestions", "details": str(e)}), 500