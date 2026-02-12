"""
Agent Controller

This module provides a high-level interface for interacting with the Agent Orchestrator
and specialized agents. It serves as a bridge between the UI and the agent system.
"""

import os
import logging
import time
import uuid
from typing import Dict, List, Any, Optional, Union, Tuple

from services.agent_orchestrator.orchestrator import get_orchestrator
from services.agent_orchestrator.task import Task, TaskStatus, TaskPriority
from services.agent_orchestrator.agent import Agent, AgentCapability, AgentStatus
from services.agent_orchestrator.specialized_agents import (
    CodeAnalysisAgent,
    SecurityAnalysisAgent,
    ArchitectureAnalysisAgent,
    DatabaseAnalysisAgent
)
from services.ai_models.ai_service import AIService

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class AgentController:
    """
    High-level controller for the agent system.
    
    This class provides methods for initializing the agent system,
    creating specialized agents, and dispatching tasks to agents.
    """
    
    def __init__(self, ai_service: Optional[AIService] = None):
        """
        Initialize the agent controller.
        
        Args:
            ai_service: Optional AI service to be used by agents
        """
        self.orchestrator = get_orchestrator()
        self.ai_service = ai_service or AIService()
        self.initialized = False
        self.agent_pools = {}
        
        logger.info("Agent Controller initialized")
    
    def initialize_agent_system(self) -> Dict[str, Any]:
        """
        Initialize the agent system.
        
        This method registers the agent types, creates agent pools,
        and prepares the system for processing tasks.
        
        Returns:
            Dictionary with initialization status and agent information
        """
        if self.initialized:
            return {
                "status": "already_initialized",
                "message": "Agent system already initialized",
                "agents": self._get_agent_info()
            }
        
        # Register agent types
        logger.info("Registering agent types...")
        self.orchestrator.register_agent_type("code_analysis", CodeAnalysisAgent)
        self.orchestrator.register_agent_type("security_analysis", SecurityAnalysisAgent)
        self.orchestrator.register_agent_type("architecture_analysis", ArchitectureAnalysisAgent)
        self.orchestrator.register_agent_type("database_analysis", DatabaseAnalysisAgent)
        
        # Create agent pools
        logger.info("Creating agent pools...")
        code_pool_id = self.orchestrator.create_agent_pool(
            agent_type_name="code_analysis",
            pool_size=2,
            name="CodeAnalysisAgent",
            description="Code analysis agent pool",
            capabilities=[AgentCapability.CODE_ANALYSIS, AgentCapability.CODE_COMPLEXITY],
            max_concurrent_tasks=2
        )
        self.agent_pools["code_analysis"] = code_pool_id
        
        security_pool_id = self.orchestrator.create_agent_pool(
            agent_type_name="security_analysis",
            pool_size=1,
            name="SecurityAnalysisAgent",
            description="Security analysis agent pool",
            capabilities=[AgentCapability.SECURITY_REVIEW],
            max_concurrent_tasks=1
        )
        self.agent_pools["security_analysis"] = security_pool_id
        
        architecture_pool_id = self.orchestrator.create_agent_pool(
            agent_type_name="architecture_analysis",
            pool_size=1,
            name="ArchitectureAnalysisAgent",
            description="Architecture analysis agent pool",
            capabilities=[AgentCapability.ARCHITECTURE_REVIEW, AgentCapability.DEPENDENCY_ANALYSIS],
            max_concurrent_tasks=1
        )
        self.agent_pools["architecture_analysis"] = architecture_pool_id
        
        database_pool_id = self.orchestrator.create_agent_pool(
            agent_type_name="database_analysis",
            pool_size=1,
            name="DatabaseAnalysisAgent",
            description="Database analysis agent pool",
            capabilities=[AgentCapability.DATABASE_ANALYSIS],
            max_concurrent_tasks=1
        )
        self.agent_pools["database_analysis"] = database_pool_id
        
        self.initialized = True
        
        return {
            "status": "success",
            "message": "Agent system initialized successfully",
            "agent_pools": self.agent_pools,
            "agents": self._get_agent_info()
        }
    
    def shutdown_agent_system(self) -> Dict[str, Any]:
        """
        Shutdown the agent system.
        
        This method stops all agents and cleans up resources.
        
        Returns:
            Dictionary with shutdown status
        """
        if not self.initialized:
            return {
                "status": "not_initialized",
                "message": "Agent system not initialized"
            }
        
        # Shutdown all agents
        logger.info("Shutting down agent system...")
        self.orchestrator.shutdown_all_agents()
        
        self.initialized = False
        self.agent_pools = {}
        
        return {
            "status": "success",
            "message": "Agent system shutdown successfully"
        }
    
    def analyze_code(
        self,
        code: str,
        language: Optional[str] = None,
        analysis_type: str = "review",
        wait: bool = True,
        timeout: float = 60.0
    ) -> Dict[str, Any]:
        """
        Analyze code using the code analysis agent.
        
        Args:
            code: Code to analyze
            language: Programming language of the code
            analysis_type: Type of analysis to perform
            wait: Whether to wait for task completion
            timeout: Timeout in seconds
            
        Returns:
            Dictionary with analysis results or task ID
        """
        if not self.initialized:
            self.initialize_agent_system()
        
        # Create task data
        task_data = {
            "code": code,
            "language": language,
            "analysis_type": analysis_type
        }
        
        # Dispatch task to code analysis agent pool
        pool_id = self.agent_pools.get("code_analysis")
        
        result = self.orchestrator.dispatch_task(
            task_type="code_analysis",
            data=task_data,
            priority=TaskPriority.NORMAL,
            pool_id=pool_id,
            wait=wait,
            timeout=timeout
        )
        
        if wait:
            # Return task result
            task = result
            if task.status == TaskStatus.COMPLETED:
                return {
                    "status": "success",
                    "task_id": task.id,
                    "results": task.result
                }
            else:
                return {
                    "status": "error",
                    "task_id": task.id,
                    "error": task.error or "Task did not complete successfully"
                }
        else:
            # Return task ID
            task_id = result
            return {
                "status": "dispatched",
                "task_id": task_id,
                "message": "Task dispatched for processing"
            }
    
    def analyze_security(
        self,
        code: str,
        language: Optional[str] = None,
        scan_type: str = "comprehensive",
        wait: bool = True,
        timeout: float = 60.0
    ) -> Dict[str, Any]:
        """
        Analyze code security using the security analysis agent.
        
        Args:
            code: Code to analyze
            language: Programming language of the code
            scan_type: Type of security scan to perform
            wait: Whether to wait for task completion
            timeout: Timeout in seconds
            
        Returns:
            Dictionary with security analysis results or task ID
        """
        if not self.initialized:
            self.initialize_agent_system()
        
        # Create task data
        task_data = {
            "code": code,
            "language": language,
            "scan_type": scan_type
        }
        
        # Dispatch task to security analysis agent pool
        pool_id = self.agent_pools.get("security_analysis")
        
        result = self.orchestrator.dispatch_task(
            task_type="security_analysis",
            data=task_data,
            priority=TaskPriority.HIGH,  # Security analysis has higher priority
            pool_id=pool_id,
            wait=wait,
            timeout=timeout
        )
        
        if wait:
            # Return task result
            task = result
            if task.status == TaskStatus.COMPLETED:
                return {
                    "status": "success",
                    "task_id": task.id,
                    "results": task.result
                }
            else:
                return {
                    "status": "error",
                    "task_id": task.id,
                    "error": task.error or "Task did not complete successfully"
                }
        else:
            # Return task ID
            task_id = result
            return {
                "status": "dispatched",
                "task_id": task_id,
                "message": "Task dispatched for processing"
            }
    
    def analyze_repository_architecture(
        self,
        repo_path: str,
        framework: Optional[str] = None,
        languages: Optional[List[str]] = None,
        wait: bool = True,
        timeout: float = 120.0  # Architecture analysis may take longer
    ) -> Dict[str, Any]:
        """
        Analyze repository architecture using the architecture analysis agent.
        
        Args:
            repo_path: Path to the repository
            framework: Framework used in the repository
            languages: Programming languages used in the repository
            wait: Whether to wait for task completion
            timeout: Timeout in seconds
            
        Returns:
            Dictionary with architecture analysis results or task ID
        """
        if not self.initialized:
            self.initialize_agent_system()
        
        # Check if repo path exists
        if not os.path.exists(repo_path):
            return {
                "status": "error",
                "error": f"Repository path not found: {repo_path}"
            }
        
        # Create task data
        task_data = {
            "repo_path": repo_path,
            "framework": framework,
            "languages": languages or []
        }
        
        # Dispatch task to architecture analysis agent pool
        pool_id = self.agent_pools.get("architecture_analysis")
        
        result = self.orchestrator.dispatch_task(
            task_type="architecture_analysis",
            data=task_data,
            priority=TaskPriority.NORMAL,
            pool_id=pool_id,
            wait=wait,
            timeout=timeout
        )
        
        if wait:
            # Return task result
            task = result
            if task.status == TaskStatus.COMPLETED:
                return {
                    "status": "success",
                    "task_id": task.id,
                    "results": task.result
                }
            else:
                return {
                    "status": "error",
                    "task_id": task.id,
                    "error": task.error or "Task did not complete successfully"
                }
        else:
            # Return task ID
            task_id = result
            return {
                "status": "dispatched",
                "task_id": task_id,
                "message": "Task dispatched for processing"
            }
    
    def analyze_database_structures(
        self,
        schema_files: List[str] = None,
        orm_files: List[str] = None,
        db_type: str = "unknown",
        wait: bool = True,
        timeout: float = 60.0
    ) -> Dict[str, Any]:
        """
        Analyze database structures using the database analysis agent.
        
        Args:
            schema_files: List of schema file paths
            orm_files: List of ORM file paths
            db_type: Type of database
            wait: Whether to wait for task completion
            timeout: Timeout in seconds
            
        Returns:
            Dictionary with database analysis results or task ID
        """
        if not self.initialized:
            self.initialize_agent_system()
        
        # Check if files exist
        schema_files = schema_files or []
        orm_files = orm_files or []
        
        if not schema_files and not orm_files:
            return {
                "status": "error",
                "error": "No schema files or ORM files provided"
            }
        
        # Check if files exist
        for file_path in schema_files + orm_files:
            if not os.path.exists(file_path):
                return {
                    "status": "error",
                    "error": f"File not found: {file_path}"
                }
        
        # Create task data
        task_data = {
            "schema_files": schema_files,
            "orm_files": orm_files,
            "db_type": db_type
        }
        
        # Dispatch task to database analysis agent pool
        pool_id = self.agent_pools.get("database_analysis")
        
        result = self.orchestrator.dispatch_task(
            task_type="database_analysis",
            data=task_data,
            priority=TaskPriority.NORMAL,
            pool_id=pool_id,
            wait=wait,
            timeout=timeout
        )
        
        if wait:
            # Return task result
            task = result
            if task.status == TaskStatus.COMPLETED:
                return {
                    "status": "success",
                    "task_id": task.id,
                    "results": task.result
                }
            else:
                return {
                    "status": "error",
                    "task_id": task.id,
                    "error": task.error or "Task did not complete successfully"
                }
        else:
            # Return task ID
            task_id = result
            return {
                "status": "dispatched",
                "task_id": task_id,
                "message": "Task dispatched for processing"
            }
    
    def get_task_status(self, task_id: str) -> Dict[str, Any]:
        """
        Get the status of a task.
        
        Args:
            task_id: ID of the task
            
        Returns:
            Dictionary with task status information
        """
        task_status = self.orchestrator.get_task_status(task_id)
        
        if task_status is None:
            return {
                "status": "error",
                "error": f"Task {task_id} not found"
            }
        
        return {
            "status": "success",
            "task_id": task_id,
            "task_status": task_status
        }
    
    def get_agent_status(self) -> Dict[str, Any]:
        """
        Get the status of all agents.
        
        Returns:
            Dictionary with agent status information
        """
        if not self.initialized:
            return {
                "status": "not_initialized",
                "message": "Agent system not initialized"
            }
        
        return {
            "status": "success",
            "agents": self._get_agent_info(),
            "agent_pools": self._get_pool_info()
        }
    
    def _get_agent_info(self) -> Dict[str, Dict[str, Any]]:
        """
        Get information about all agents.
        
        Returns:
            Dictionary mapping agent ID to agent information
        """
        return self.orchestrator.get_all_agents_status()
    
    def _get_pool_info(self) -> Dict[str, Dict[str, Any]]:
        """
        Get information about all agent pools.
        
        Returns:
            Dictionary mapping pool name to pool information
        """
        pool_info = {}
        
        for pool_name, pool_id in self.agent_pools.items():
            pool_status = self.orchestrator.get_pool_status(pool_id)
            if pool_status:
                pool_info[pool_name] = pool_status
        
        return pool_info

# Create a singleton instance
_controller_instance = None

def get_agent_controller(ai_service: Optional[AIService] = None) -> AgentController:
    """
    Get or create the singleton Agent Controller instance.
    
    Args:
        ai_service: Optional AI service to be used by agents
        
    Returns:
        AgentController instance
    """
    global _controller_instance
    
    if _controller_instance is None:
        _controller_instance = AgentController(ai_service)
    
    return _controller_instance