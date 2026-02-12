"""
TerraFusion SyncService Security Configuration

This module provides security configuration and utilities for the TerraFusion SyncService platform.
"""

import os
import secrets
import logging
from typing import Dict, Any, List, Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('security')

# CORS Configuration
CORS_CONFIG = {
    "allowed_origins": [
        # In production, replace these with specific allowed origins
        "*"  # Allow all origins during development
    ],
    "allowed_methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "allowed_headers": ["Content-Type", "Authorization", "X-Requested-With"],
    "expose_headers": ["Content-Length", "X-Request-ID"],
    "allow_credentials": True,
    "max_age": 86400  # 24 hours
}

# Rate Limiting Configuration
RATE_LIMIT_CONFIG = {
    "enabled": True,
    "default_limits": [
        # Allow 60 requests per minute by default
        "60 per minute"
    ],
    "storage_uri": "memory://",  # Use memory storage in development
    # Higher limits for specific endpoints
    "endpoint_limits": {
        "/api/status": "120 per minute",
        "/health": "120 per minute"
    }
}

# Authentication Configuration
AUTH_CONFIG = {
    "auth_required": False,  # Set to True in production
    "token_expiration_minutes": 60,
    "refresh_token_expiration_days": 7,
    "jwt_algorithm": "HS256",
    # Secret key should be loaded from environment variable in production
    "jwt_secret_key": os.environ.get("JWT_SECRET_KEY", secrets.token_hex(32)),
    # In production, use proper role definitions
    "roles": {
        "admin": {
            "can_read": ["*"],
            "can_write": ["*"],
            "can_delete": ["*"]
        },
        "user": {
            "can_read": ["status", "sync-pairs", "metrics"],
            "can_write": ["sync-operations"],
            "can_delete": []
        },
        "monitor": {
            "can_read": ["status", "metrics", "health"],
            "can_write": [],
            "can_delete": []
        }
    }
}

# CSP (Content Security Policy) Configuration
CSP_CONFIG = {
    "default-src": ["'self'"],
    "script-src": ["'self'", "'unsafe-inline'"],  # For development
    "style-src": ["'self'", "'unsafe-inline'"],  # For development
    "img-src": ["'self'", "data:"],
    "connect-src": ["'self'"],
    "font-src": ["'self'"],
    "object-src": ["'none'"],
    "media-src": ["'self'"],
    "frame-src": ["'none'"]
}

# API Key Configuration (for external service consumers)
API_KEY_CONFIG = {
    "header_name": "X-API-Key",
    "enabled": False,  # Set to True in production
    # In production, keys should be stored in a database
    "valid_keys": {
        # "acme-monitoring": "api-key-value-here"  # Add keys in production
    }
}


def generate_api_key(service_name: str) -> str:
    """
    Generate a new API key for a service.
    
    Args:
        service_name: Name of the service to generate a key for
        
    Returns:
        Generated API key
    """
    # Generate a secure random token
    api_key = secrets.token_urlsafe(32)
    
    # In a real implementation, this would be stored in the database
    logger.info(f"Generated API key for service: {service_name}")
    
    return api_key


def generate_csp_header() -> str:
    """
    Generate a Content-Security-Policy header value from the configuration.
    
    Returns:
        CSP header value
    """
    parts = []
    
    for directive, sources in CSP_CONFIG.items():
        if sources:
            parts.append(f"{directive} {' '.join(sources)}")
    
    return "; ".join(parts)


def check_is_api_key_valid(api_key: str) -> bool:
    """
    Check if an API key is valid.
    
    Args:
        api_key: API key to validate
        
    Returns:
        True if the API key is valid, False otherwise
    """
    if not API_KEY_CONFIG["enabled"]:
        # API key validation is disabled
        return True
    
    # Check if the API key is in the list of valid keys
    for key in API_KEY_CONFIG["valid_keys"].values():
        if secrets.compare_digest(key, api_key):
            return True
    
    return False


def get_service_for_api_key(api_key: str) -> Optional[str]:
    """
    Get the service name associated with an API key.
    
    Args:
        api_key: API key to look up
        
    Returns:
        Service name or None if not found
    """
    if not API_KEY_CONFIG["enabled"]:
        # API key validation is disabled
        return None
    
    # Find the service name for the API key
    for service_name, key in API_KEY_CONFIG["valid_keys"].items():
        if secrets.compare_digest(key, api_key):
            return service_name
    
    return None


def apply_security_headers(headers: Dict[str, str]) -> Dict[str, str]:
    """
    Apply security headers to a response.
    
    Args:
        headers: Original headers dictionary
        
    Returns:
        Headers with security headers added
    """
    # Add CSP header
    headers["Content-Security-Policy"] = generate_csp_header()
    
    # Add other security headers
    headers["X-Content-Type-Options"] = "nosniff"
    headers["X-Frame-Options"] = "DENY"
    headers["X-XSS-Protection"] = "1; mode=block"
    headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    
    return headers