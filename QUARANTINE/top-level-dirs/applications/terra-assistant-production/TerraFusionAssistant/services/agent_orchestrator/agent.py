"""
Agent Module

This module defines the Agent class and related enums for the Agent Orchestrator.
"""

import os
import uuid
import time
import queue
import logging
import threading
from enum import Enum, auto
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Dict, List, Any, Optional, Union, Callable, Set, Tuple

from services.agent_orchestrator.task import Task, TaskStatus, TaskPriority

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class AgentStatus(Enum):
    """Agent status values"""
    IDLE = auto()
    BUSY = auto()
    ERROR = auto()
    SHUTDOWN = auto()

class AgentCapability(Enum):
    """Agent capability types"""
    CODE_ANALYSIS = "code_analysis"
    SECURITY_REVIEW = "security_review"
    PERFORMANCE_OPTIMIZATION = "performance_optimization"
    CODE_COMPLEXITY = "code_complexity"
    DATABASE_ANALYSIS = "database_analysis"
    API_ANALYSIS = "api_analysis"
    ARCHITECTURE_REVIEW = "architecture_review"
    DEPENDENCY_ANALYSIS = "dependency_analysis"
    TEST_COVERAGE = "test_coverage"
    DOCUMENTATION_ANALYSIS = "documentation_analysis"
    LANGUAGE_SPECIFIC = "language_specific"  # Requires language specification
    FRAMEWORK_SPECIFIC = "framework_specific"  # Requires framework specification

class Agent(ABC):
    """
    Base class for all agents in the Agent Orchestrator.
    
    Agents are responsible for processing specific types of tasks based on their
    capabilities and can communicate with other agents via the orchestrator.
    """
    
    def __init__(
        self,
        name: str = "BaseAgent",
        description: str = "Base agent for code analysis tasks",
        capabilities: Optional[List[Union[AgentCapability, str]]] = None,
        max_concurrent_tasks: int = 1,
        agent_id: Optional[str] = None
    ):
        """
        Initialize the agent.
        
        Args:
            name: Agent name
            description: Agent description
            capabilities: List of agent capabilities
            max_concurrent_tasks: Maximum number of concurrent tasks
            agent_id: Optional agent ID (generated if not provided)
        """
        self.id = agent_id or str(uuid.uuid4())
        self.name = name
        self.description = description
        
        # Convert string capabilities to enum
        self.capabilities = []
        if capabilities:
            for cap in capabilities:
                if isinstance(cap, str):
                    try:
                        self.capabilities.append(AgentCapability(cap))
                    except ValueError:
                        logger.warning(f"Unknown capability: {cap}")
                else:
                    self.capabilities.append(cap)
        
        # Task processing
        self.max_concurrent_tasks = max_concurrent_tasks
        self.task_queue = queue.PriorityQueue()
        self.active_tasks = {}  # task_id -> Task
        self.completed_tasks = {}  # task_id -> Task (last N tasks)
        self.max_completed_tasks = 100  # Maximum number of completed tasks to keep
        
        # Status tracking
        self.status = AgentStatus.IDLE
        self.created_at = datetime.utcnow().isoformat()
        self.last_activity = time.time()
        self.task_count = 0
        self.error_count = 0
        self.last_error = None
        
        # Threading
        self.task_threads = []
        self.shutdown_flag = False
    
    @abstractmethod
    def process_task(self, task: Task) -> Dict[str, Any]:
        """
        Process a task.
        
        This method must be implemented by subclasses to define how
        specific task types are processed.
        
        Args:
            task: Task to process
            
        Returns:
            Dictionary containing task result
        """
        pass
    
    def start(self):
        """Start agent processing."""
        self.shutdown_flag = False
        
        # Create worker threads based on max_concurrent_tasks
        for i in range(self.max_concurrent_tasks):
            thread = threading.Thread(
                target=self._process_task_queue,
                name=f"{self.name}-worker-{i}",
                daemon=True
            )
            thread.start()
            self.task_threads.append(thread)
        
        logger.info(f"Agent {self.id} ({self.name}) started with {self.max_concurrent_tasks} worker threads")
    
    def stop(self):
        """Stop agent processing."""
        self.shutdown_flag = True
        
        # Wait for threads to finish (with timeout)
        for thread in self.task_threads:
            thread.join(timeout=2.0)
        
        self.task_threads = []
        self.status = AgentStatus.SHUTDOWN
        logger.info(f"Agent {self.id} ({self.name}) stopped")
    
    def add_task(self, task: Task):
        """
        Add a task to the agent's queue.
        
        Args:
            task: Task to process
        """
        # Mark task as assigned to this agent
        task.assigned_to = self.id
        task.update_status(TaskStatus.DISPATCHED)
        
        # Add to active tasks
        self.active_tasks[task.id] = task
        
        # Add to queue with priority
        # Higher priority values have lower queue priority numbers
        queue_priority = 100 - (task.priority.value * 10)
        self.task_queue.put((queue_priority, task.id))
        
        # Ensure agent is started
        if not self.task_threads:
            self.start()
        
        logger.info(f"Task {task.id} added to agent {self.id} ({self.name}) queue with priority {task.priority.name}")
    
    def _process_task_queue(self):
        """Process tasks from the queue until shutdown."""
        while not self.shutdown_flag:
            try:
                # Get task from queue with timeout to allow for shutdown
                try:
                    priority, task_id = self.task_queue.get(timeout=1.0)
                except queue.Empty:
                    continue
                
                # Get task from active tasks
                if task_id not in self.active_tasks:
                    logger.warning(f"Task {task_id} not found in active tasks for agent {self.id}")
                    self.task_queue.task_done()
                    continue
                
                task = self.active_tasks[task_id]
                
                # Process task
                self.status = AgentStatus.BUSY
                self.last_activity = time.time()
                
                # Mark task as processing
                task.update_status(TaskStatus.PROCESSING)
                
                try:
                    # Process the task
                    result = self.process_task(task)
                    
                    # Set task result
                    task.set_result(result)
                    
                    # Update counters
                    self.task_count += 1
                    logger.info(f"Agent {self.id} ({self.name}) completed task {task_id}")
                
                except Exception as e:
                    # Handle task processing error
                    error_msg = str(e)
                    self.error_count += 1
                    self.last_error = error_msg
                    logger.error(f"Agent {self.id} ({self.name}) failed to process task {task_id}: {error_msg}")
                    
                    # Set task error
                    task.set_error(error_msg)
                
                finally:
                    # Move from active to completed tasks
                    del self.active_tasks[task_id]
                    
                    # Add to completed tasks (with limit)
                    self.completed_tasks[task_id] = task
                    if len(self.completed_tasks) > self.max_completed_tasks:
                        oldest_task_id = next(iter(self.completed_tasks))
                        del self.completed_tasks[oldest_task_id]
                    
                    # Reset agent status if no more active tasks
                    if not self.active_tasks:
                        self.status = AgentStatus.IDLE
                    
                    self.task_queue.task_done()
            
            except Exception as e:
                # Handle errors in the task processing loop
                logger.error(f"Error in agent {self.id} ({self.name}) task processing loop: {str(e)}")
                self.status = AgentStatus.ERROR
                self.last_error = str(e)
                self.error_count += 1
                time.sleep(1)  # Avoid tight loop in case of persistent errors
    
    def has_capability(self, capability: Union[AgentCapability, str]) -> bool:
        """
        Check if the agent has a specific capability.
        
        Args:
            capability: Capability to check
            
        Returns:
            True if the agent has the capability, False otherwise
        """
        if isinstance(capability, str):
            try:
                capability = AgentCapability(capability)
            except ValueError:
                return False
        
        return capability in self.capabilities
    
    def has_all_capabilities(self, capabilities: List[Union[AgentCapability, str]]) -> bool:
        """
        Check if the agent has all specified capabilities.
        
        Args:
            capabilities: List of capabilities to check
            
        Returns:
            True if the agent has all capabilities, False otherwise
        """
        return all(self.has_capability(cap) for cap in capabilities)
    
    def report_status(self) -> Dict[str, Any]:
        """
        Report the current status of the agent.
        
        Returns:
            Dictionary with agent status information
        """
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'status': self.status.name,
            'capabilities': [cap.value for cap in self.capabilities],
            'created_at': self.created_at,
            'last_activity': self.last_activity,
            'task_count': self.task_count,
            'error_count': self.error_count,
            'active_tasks': len(self.active_tasks),
            'queue_size': self.task_queue.qsize(),
            'last_error': self.last_error
        }

class GenericAgent(Agent):
    """
    Generic agent that can process tasks using a provided function.
    
    This agent is useful for creating simple agents without defining new classes.
    """
    
    def __init__(
        self,
        processor_func: Callable[[Task], Dict[str, Any]],
        name: str = "GenericAgent",
        description: str = "Generic agent with customizable processor",
        capabilities: Optional[List[Union[AgentCapability, str]]] = None,
        max_concurrent_tasks: int = 1,
        agent_id: Optional[str] = None
    ):
        """
        Initialize the generic agent.
        
        Args:
            processor_func: Function to process tasks
            name: Agent name
            description: Agent description
            capabilities: List of agent capabilities
            max_concurrent_tasks: Maximum number of concurrent tasks
            agent_id: Optional agent ID (generated if not provided)
        """
        super().__init__(name, description, capabilities, max_concurrent_tasks, agent_id)
        self.processor_func = processor_func
    
    def process_task(self, task: Task) -> Dict[str, Any]:
        """
        Process a task using the provided processor function.
        
        Args:
            task: Task to process
            
        Returns:
            Dictionary containing task result
        """
        return self.processor_func(task)