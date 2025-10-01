#!/usr/bin/env python3

import asyncio
import json
import sqlite3
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional
from dataclasses import dataclass

try:
    from mcp import ClientSession, StdioServerParameters
    from mcp.client.stdio import stdio_client
    from mcp.types import Tool, TextContent
    MCP_AVAILABLE = True
except ImportError:
    MCP_AVAILABLE = False

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class PropertyContext:
    property_id: str
    address: str
    market_value: float
    assessed_value: float
    property_type: str
    year_built: int
    square_footage: float

class TerraFusionMCPClient:
    def __init__(self, db_path: str = "terrafusionsync_real.db"):
        self.db_path = db_path
        self.active_sessions = {}
        self.available_tools = {}
        
    async def initialize_mcp_servers(self):
        servers = [
            ("property-data", ["python", "mcp_servers/property_server.py"]),
            ("assessment-calc", ["python", "mcp_servers/assessment_server.py"]),
            ("market-analysis", ["python", "mcp_servers/market_server.py"]),
            ("report-gen", ["python", "mcp_servers/report_server.py"])
        ]
        
        for name, command in servers:
            await self._start_server(name, command)
        
        logger.info("MCP servers initialized")
        
    async def _start_server(self, server_name: str, command: List[str]):
        try:
            server_params = StdioServerParameters(command=command)
            
            async with stdio_client(server_params) as (read, write):
                async with ClientSession(read, write) as session:
                    await session.initialize()
                    tools = await session.list_tools()
                    self.available_tools[server_name] = tools.tools
                    self.active_sessions[server_name] = session
                    
        except Exception as e:
            logger.error(f"Failed to start {server_name}: {e}")
    
    async def get_property_context(self, property_id: str) -> PropertyContext:
        property_data = await self._call_tool(
            "property-data",
            "get_property_details",
            {"property_id": property_id}
        )
        
        return PropertyContext(
            property_id=property_data.get("prop_id"),
            address=property_data.get("address"),
            market_value=property_data.get("market_value", 0),
            assessed_value=property_data.get("assessed_value", 0),
            property_type=property_data.get("property_use_desc"),
            year_built=property_data.get("year_built", 0),
            square_footage=property_data.get("total_finished_area", 0)
        )
    
    async def calculate_assessment(self, property_id: str) -> Dict[str, Any]:
        context = await self.get_property_context(property_id)
        
        return await self._call_tool(
            "assessment-calc",
            "calculate_assessment",
            {
                "property_data": context.__dict__,
                "method": "market_approach",
                "assessment_year": datetime.now().year
            }
        )
    
    async def _call_tool(self, server_name: str, tool_name: str, arguments: Dict[str, Any]) -> Any:
        if server_name not in self.active_sessions:
            return None
            
        try:
            session = self.active_sessions[server_name]
            result = await session.call_tool(tool_name, arguments)
            
            if result.content and len(result.content) == 1:
                return json.loads(result.content[0].text)
            return None
            
        except Exception as e:
            logger.error(f"Error calling {tool_name}: {e}")
            return None

class TerraFusionPromptEnhancer:
    def __init__(self):
        self.templates = {
            "cursor_code": """
TerraFusion AI - Property Assessment Code Generator
Based on Cursor's proven patterns for precise code generation.

Task: {task}
Context: Benton County property assessment with 255,292 records
Generate production-ready code with error handling and optimization.
""",
            "v0_interface": """
TerraFusion UI Generator - Government-grade interfaces
Based on v0's proven patterns for beautiful, functional interfaces.

Request: {request}
Requirements: WCAG 2.1 compliant, mobile-responsive, secure
Generate React/Next.js components with TypeScript.
""",
            "devin_autonomous": """
TerraFusion Autonomous Agent - Complex assessment workflows
Based on Devin's proven autonomous patterns.

Task: {task}
Capabilities: Data analysis, market research, compliance validation
Execute multi-step assessment workflow with progress reporting.
"""
        }
    
    def enhance_prompt(self, prompt_type: str, context: Dict[str, Any]) -> str:
        if prompt_type in self.templates:
            return self.templates[prompt_type].format(**context)
        return f"Enhanced prompt for {prompt_type}"

def create_mcp_client() -> TerraFusionMCPClient:
    return TerraFusionMCPClient()

def create_prompt_enhancer() -> TerraFusionPromptEnhancer:
    return TerraFusionPromptEnhancer()

async def main():
    mcp_client = create_mcp_client()
    
    if MCP_AVAILABLE:
        await mcp_client.initialize_mcp_servers()
        assessment = await mcp_client.calculate_assessment("12345")
        print(f"Assessment: {assessment}")
    
    prompt_enhancer = create_prompt_enhancer()
    enhanced = prompt_enhancer.enhance_prompt(
        "cursor_code", 
        {"task": "Generate property valuation algorithm"}
    )
    print(f"Enhanced prompt: {enhanced}")

if __name__ == "__main__":
    asyncio.run(main()) 