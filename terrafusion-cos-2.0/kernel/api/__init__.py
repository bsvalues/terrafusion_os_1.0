"""
TerraFusion cOS 2.0 - API Module
MIT PhD Systems Design Engineer Standards
"""

from .ai_swarm_routes import router as ai_swarm_router
from .costforge_routes import router as costforge_router

__all__ = ["ai_swarm_router", "costforge_router"]
