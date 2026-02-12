"""
Master Control Program (MCP) Package

This package provides the core functionality for the MCP architecture
that coordinates multiple specialized agents for the GIS system.
"""

import logging
from mcp.core import mcp_instance as mcp

# Configure logging
logger = logging.getLogger(__name__)

# Log MCP initialization
logger.info("MCP initialized")

# Import integrators after MCP is initialized
try:
    from mcp.integrators import initialize_integrators
    initialize_integrators(mcp)
except ImportError:
    logger.warning("Integrators module not found, skipping agent integrations")
except Exception as e:
    logger.error(f"Error initializing integrators: {str(e)}")