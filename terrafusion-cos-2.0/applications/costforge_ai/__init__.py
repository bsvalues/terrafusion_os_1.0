# TerraFusion cOS 2.0 - CostForge AI Application
# MIT PhD Systems Design Engineer Standards
# Full AI Valuation Platform

"""
TerraFusion cOS 2.0 CostForge AI Application

Complete AI-powered property valuation and cost analysis platform.
Includes MCP server, React frontend, and full application functionality.

Key Features:
- AI-powered property valuation
- Multiple valuation methodologies
- USPAP compliance
- Market analysis
- Cost prediction
- Revenue optimization
- Audit trails
- Performance analytics

Components:
- MCP Server with tools
- React frontend with UI/UX
- Valuation engines
- AI models
- Compliance framework
- Analytics dashboard
"""

__version__ = "2.0.0"
__author__ = "TerraFusion Systems"
__status__ = "Production"

from .mcp_server import CostForgeAIMCPServer
from .valuation_engine import ValuationEngine
from .ai_models import CostPredictionModel
from .compliance import USPAPCompliance
from .analytics import PerformanceAnalytics

__all__ = [
    "CostForgeAIMCPServer",
    "ValuationEngine",
    "CostPredictionModel",
    "USPAPCompliance",
    "PerformanceAnalytics",
]
