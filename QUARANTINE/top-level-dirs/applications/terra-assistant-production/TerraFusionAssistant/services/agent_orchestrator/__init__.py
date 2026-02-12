"""
Agent Orchestrator Package

This package provides a framework for creating, managing, and coordinating 
AI agents for code analysis tasks. It implements a Multi-Agent Coordination 
Platform (MCP) based architecture for task distribution and agent communication.
"""

# Import core components for easy access
from services.agent_orchestrator.orchestrator import AgentOrchestrator, get_orchestrator
from services.agent_orchestrator.task import Task, TaskPriority, TaskStatus
from services.agent_orchestrator.agent import Agent, AgentStatus, AgentCapability
from services.agent_orchestrator.specialized_agents import (
    CodeAnalysisAgent, 
    SecurityAnalysisAgent,
    ArchitectureAnalysisAgent,
    DatabaseAnalysisAgent
)
from services.agent_orchestrator.agent_controller import AgentController, get_agent_controller