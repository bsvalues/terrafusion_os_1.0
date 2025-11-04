"""
TerraFusionPlatform Multi-agent Coordination Platform (MCP) Controller

This module serves as the central controller for coordinating different AI agents
and executing various types of missions.
"""

from .agents.build_agent import scaffold_code
from .agents.test_agent import run_tests
from .agents.secure_agent import run_security_scan
import logging

logger = logging.getLogger(__name__)

def execute_mission(mission_type, params):
    """
    Execute a mission using the appropriate agent.
    
    Args:
        mission_type: Type of mission ("scaffold", "test", "secure")
        params: Parameters for the mission
        
    Returns:
        Mission execution result
    """
    logger.info(f"Executing mission: {mission_type} with params: {params}")
    
    if mission_type == "scaffold":
        return scaffold_code(params)
    elif mission_type == "test":
        return run_tests(params)
    elif mission_type == "secure":
        return run_security_scan(params)
    else:
        logger.warning(f"Unknown mission type: {mission_type}")
        return f"❓ Unknown mission type: {mission_type}"