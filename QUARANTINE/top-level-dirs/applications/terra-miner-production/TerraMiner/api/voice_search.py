"""
API routes for voice-activated property search functionality.

This module provides endpoints for processing natural language voice queries
and returning relevant property search results.
"""

import json
import logging
import uuid
from datetime import datetime
from typing import Dict, Any

from flask import Blueprint, request, jsonify, current_app

from ai.voice_processor import VoiceSearchProcessor

# Configure logger
logger = logging.getLogger(__name__)

# Create blueprint
voice_search_api = Blueprint('voice_search_api', __name__)

# Initialize voice search processor
voice_processor = VoiceSearchProcessor()


@voice_search_api.route('/api/voice-property-search', methods=['POST'])
def voice_property_search():
    """
    Process voice search queries and return property search results.
    
    Expects a JSON payload with a 'query' field containing the transcribed voice query.
    Returns structured search results with interpreted parameters and matching properties.
    
    Returns:
        JSON response with search results or error message
    """
    try:
        # Generate a request ID for tracking
        request_id = str(uuid.uuid4())
        
        # Check if request is JSON
        if not request.is_json:
            logger.warning(f"Non-JSON request received (ID: {request_id})")
            return jsonify({
                "error": "Invalid request format. JSON required.",
                "request_id": request_id
            }), 400
            
        # Extract the query from the request
        data = request.get_json()
        query = data.get('query', '').strip()
        
        if not query:
            logger.warning(f"Empty query received (ID: {request_id})")
            return jsonify({
                "error": "No query provided. Please provide a search query.",
                "request_id": request_id
            }), 400
        
        # Log the incoming request
        logger.info(f"Voice search request (ID: {request_id}): {query}")
        
        # Process the natural language query using OpenAI
        search_params, error = voice_processor.process_query(query)
        
        if error:
            logger.error(f"Error processing query (ID: {request_id}): {error}")
            return jsonify({
                "error": error,
                "request_id": request_id
            }), 500
        
        # Search for properties using the interpreted parameters
        properties = voice_processor.search_properties(search_params)
        
        # Log the results
        logger.info(f"Voice search completed (ID: {request_id}): Found {len(properties)} properties")
        
        # Return the response
        response = {
            "query": query,
            "interpreted_query": search_params,
            "properties": properties,
            "timestamp": datetime.now().isoformat(),
            "request_id": request_id
        }
        
        # In a production environment, we would log this to analytics
        # _log_search_analytics(request_id, query, search_params, len(properties))
        
        return jsonify(response), 200
        
    except Exception as e:
        # Generate an error ID for tracking if there's an exception
        error_id = str(uuid.uuid4())
        logger.error(f"Unhandled exception in voice search (ID: {error_id}): {str(e)}", exc_info=True)
        
        return jsonify({
            "error": "An unexpected error occurred while processing your search.",
            "error_id": error_id
        }), 500


def _log_search_analytics(request_id: str, query: str, params: Dict[str, Any], result_count: int) -> None:
    """
    Log search analytics for monitoring and improvement.
    In a production environment, this would store data in the database.
    
    Args:
        request_id (str): Unique identifier for the request
        query (str): Original voice query
        params (Dict[str, Any]): Interpreted search parameters
        result_count (int): Number of properties returned
    """
    try:
        # This is a placeholder. In production, you would save this to your database
        analytics_data = {
            "request_id": request_id,
            "timestamp": datetime.now().isoformat(),
            "query": query,
            "interpreted_params": params,
            "result_count": result_count,
            "user_agent": request.user_agent.string if request.user_agent else "Unknown",
            "ip_address": request.remote_addr
        }
        
        # Here you would save this to your database
        # db.session.add(SearchAnalytics(**analytics_data))
        # db.session.commit()
        
        logger.debug(f"Logged search analytics for request {request_id}")
    except Exception as e:
        logger.error(f"Failed to log search analytics: {str(e)}")