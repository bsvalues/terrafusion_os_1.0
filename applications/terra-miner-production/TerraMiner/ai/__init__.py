"""
AI Module

This module provides AI capabilities for the application, including:
- Agent tools integration using aipotheosis-labs ACI
- OpenAI interface for text and image generation
- Content analysis and processing
"""

import os
import logging
from typing import Dict, Any, Optional

# Set up logging
logger = logging.getLogger(__name__)

# Track initialization status
_initialized = False

# Store AI components
ai_components = {}

def initialize_ai():
    """Initialize all AI components."""
    global _initialized, ai_components
    
    if _initialized:
        logger.debug("AI components already initialized")
        return True
    
    logger.info("Initializing AI module")
    
    try:
        # Initialize OpenAI
        from ai.openai_integration import initialize_openai
        openai_initialized = initialize_openai()
        ai_components["openai"] = openai_initialized
        
        # Initialize Agent Tools
        from ai.agent_tools import initialize_agent_tools
        agent_tools_initialized = initialize_agent_tools()
        ai_components["agent_tools"] = agent_tools_initialized
        
        _initialized = all([
            openai_initialized,
            agent_tools_initialized
        ])
        
        if _initialized:
            logger.info("AI modules loaded successfully")
        else:
            logger.warning("Some AI modules failed to initialize")
        
        return _initialized
    except Exception as e:
        logger.error(f"Failed to initialize AI module: {str(e)}")
        return False

def is_initialized() -> bool:
    """Check if AI module is initialized."""
    return _initialized

def get_component_status() -> Dict[str, bool]:
    """Get initialization status of all AI components."""
    return ai_components.copy()

def check_api_keys() -> Dict[str, bool]:
    """Check if required API keys are available."""
    keys = {
        "OPENAI_API_KEY": bool(os.environ.get("OPENAI_API_KEY")),
        "ACI_API_KEY": bool(os.environ.get("ACI_API_KEY"))
    }
    return keys