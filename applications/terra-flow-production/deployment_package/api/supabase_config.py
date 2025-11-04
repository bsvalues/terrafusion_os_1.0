"""
Supabase Config API

This module provides endpoints to get Supabase configuration for the client.
"""

import os
import logging
from flask import Blueprint, jsonify
from config_loader import is_supabase_enabled, get_config

# Configure logging
logger = logging.getLogger(__name__)

# Create blueprint
supabase_config_bp = Blueprint('supabase_config', __name__, url_prefix='/api')

@supabase_config_bp.route('/supabase-config', methods=['GET'])
def get_supabase_config():
    """Get Supabase configuration for the client."""
    if not is_supabase_enabled():
        logger.warning("Supabase is not enabled, but config was requested")
        return jsonify({
            "enabled": False,
            "url": "",
            "key": ""
        }), 200
    
    # For client-side use, we only send the URL and anon key
    # The service key should never be sent to the client
    db_config = get_config("database")
    
    config = {
        "enabled": True,
        "url": db_config.get("supabase_url", ""),
        "key": db_config.get("supabase_key", "")
    }
    
    return jsonify(config), 200