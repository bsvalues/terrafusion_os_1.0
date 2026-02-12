"""
Multi-Agent Coordination Platform (MCP) Core

This module implements the core Multi-Agent Coordination Platform (MCP) functionality, 
including task dispatching, agent management, and coordination.
"""

import os
import sys
import time
import uuid
import json
import logging
import threading
import queue
from enum import Enum, auto
from typing import Dict, Any, List, Optional, Union, Callable, Type
from datetime import datetime
from abc import ABC, abstractmethod

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Define constants
DEFAULT_TASK_TIMEOUT = 60  # seconds

class TaskPriority(Enum):
    """Task priority levels"""
    LOW = 0
    NORMAL = 1
    HIGH = 2
    CRITICAL = 3

class TaskStatus(Enum):
    """Task status values"""
    PENDING = auto()
    DISPATCHED = auto()
    PROCESSING = auto()
    COMPLETED = auto()
    FAILED = auto()
    TIMEOUT = auto()
    CANCELLED = auto()

class AgentStatus(Enum):
    """Agent status values"""
    IDLE = auto()
    BUSY = auto()
    ERROR = auto()
    SHUTDOWN = auto()

class BaseAgent(ABC):
    """
    Base class for all agents in the Multi-Agent Coordination Platform.
    
    Agents are responsible for processing specific types of tasks and can
    communicate with other agents via the MCP.
    """
    
    def __init__(self):
        """Initialize the agent"""
        self.id = str(uuid.uuid4())
        self.status = AgentStatus.IDLE
        self.task_queue = queue.PriorityQueue()
        self.current_task = None
        self.last_activity = time.time()
        self.last_error = None
        self.task_thread = None
        self.shutdown_flag = False
        self.capabilities = []  # List of agent capabilities
    
    @abstractmethod
    def process_task(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process a task.
        
        Args:
            task_data: Dictionary containing task data
            
        Returns:
            Dictionary containing task result
        """
        pass
    
    def start_processing(self):
        """Start the task processing thread"""
        if self.task_thread is None or not self.task_thread.is_alive():
            self.shutdown_flag = False
            self.task_thread = threading.Thread(target=self._process_task_queue, daemon=True)
            self.task_thread.start()
            logger.info(f"Agent {self.id} started processing thread")
    
    def stop_processing(self):
        """Stop the task processing thread"""
        self.shutdown_flag = True
        logger.info(f"Agent {self.id} is shutting down")
    
    def _process_task_queue(self):
        """Process tasks from the queue until shutdown"""
        while not self.shutdown_flag:
            try:
                # Get task from queue with timeout to allow for shutdown
                try:
                    priority, task = self.task_queue.get(timeout=1)
                except queue.Empty:
                    continue
                
                # Process task
                self.status = AgentStatus.BUSY
                self.current_task = task
                
                # Mark task as processing
                self.current_task['status'] = TaskStatus.PROCESSING
                self.current_task['started_at'] = datetime.utcnow().isoformat()
                
                try:
                    # Process the task
                    result = self.process_task(task['data'])
                    
                    # Update task status
                    self.current_task['status'] = TaskStatus.COMPLETED
                    self.current_task['completed_at'] = datetime.utcnow().isoformat()
                    self.current_task['result'] = result
                    logger.info(f"Agent {self.id} completed task {task['id']}")
                    
                except Exception as e:
                    # Handle task processing error
                    error_msg = str(e)
                    self.last_error = error_msg
                    logger.error(f"Agent {self.id} failed to process task {task['id']}: {error_msg}")
                    
                    # Update task status
                    self.current_task['status'] = TaskStatus.FAILED
                    self.current_task['error'] = error_msg
                    self.current_task['completed_at'] = datetime.utcnow().isoformat()
                
                finally:
                    # Reset agent status
                    self.status = AgentStatus.IDLE
                    self.last_activity = time.time()
                    self.current_task = None
                    self.task_queue.task_done()
            
            except Exception as e:
                logger.error(f"Error in agent {self.id} task processing loop: {str(e)}")
                self.status = AgentStatus.ERROR
                self.last_error = str(e)
                time.sleep(1)  # Avoid tight loop in case of persistent errors
    
    def add_task(self, task: Dict[str, Any], priority: TaskPriority = TaskPriority.NORMAL):
        """
        Add a task to the agent's queue.
        
        Args:
            task: Task data dictionary
            priority: Task priority level
        """
        # Ensure processing thread is running
        self.start_processing()
        
        # Add task to queue with priority
        # Higher priority values have lower queue priority numbers
        # For the queue, lower numbers = higher priority
        queue_priority = 100 - (priority.value * 10)
        self.task_queue.put((queue_priority, task))
        logger.info(f"Task {task['id']} added to agent {self.id} queue with priority {priority.name}")
    
    def report_status(self) -> Dict[str, Any]:
        """
        Report the current status of the agent.
        
        Returns:
            Dictionary with agent status information
        """
        return {
            'id': self.id,
            'status': self.status.name,
            'last_activity': self.last_activity,
            'queue_size': self.task_queue.qsize(),
            'current_task': self.current_task['id'] if self.current_task else None,
            'last_error': self.last_error
        }

class MCPCore:
    """
    Multi-Agent Coordination Platform (MCP) Core.
    
    The MCP Core is responsible for coordinating multiple agents, dispatching
    tasks to appropriate agents, and managing agent pools.
    """
    
    def __init__(self):
        """Initialize the MCP Core"""
        self.agent_types = {}
        self.active_agents = {}
        self.agent_pools = {}
        self.tasks = {}
        self.task_results = {}
        self.task_callbacks = {}
        self.lock = threading.RLock()
        logger.info("MCP Core initialized")
    
    def register_agent_type(self, agent_type: str, agent_class: Type[BaseAgent]):
        """
        Register an agent type with the MCP.
        
        Args:
            agent_type: Name of the agent type
            agent_class: Agent class to instantiate for this type
        """
        with self.lock:
            self.agent_types[agent_type] = agent_class
            logger.info(f"Registered agent type: {agent_type}")
    
    def create_agent(self, agent_type: str) -> BaseAgent:
        """
        Create an agent of the specified type.
        
        Args:
            agent_type: Type of agent to create
            
        Returns:
            Created agent instance
            
        Raises:
            ValueError: If agent type is not registered
        """
        with self.lock:
            if agent_type not in self.agent_types:
                raise ValueError(f"Agent type '{agent_type}' is not registered")
            
            # Create agent
            agent = self.agent_types[agent_type]()
            
            # Start agent processing
            agent.start_processing()
            
            # Add to active agents
            self.active_agents[agent.id] = agent
            
            logger.info(f"Created agent of type {agent_type} with ID {agent.id}")
            return agent
    
    def shutdown_agent(self, agent_id: str):
        """
        Shutdown an agent.
        
        Args:
            agent_id: ID of the agent to shutdown
        """
        with self.lock:
            if agent_id in self.active_agents:
                agent = self.active_agents[agent_id]
                agent.stop_processing()
                agent.status = AgentStatus.SHUTDOWN
                logger.info(f"Agent {agent_id} shutdown requested")
    
    def create_agent_pool(self, agent_type: str, pool_size: int, pool_name: Optional[str] = None) -> str:
        """
        Create a pool of agents of the specified type.
        
        Args:
            agent_type: Type of agents to create
            pool_size: Number of agents to create
            pool_name: Optional name for the pool
            
        Returns:
            ID of the created pool
            
        Raises:
            ValueError: If agent type is not registered or pool size is invalid
        """
        with self.lock:
            if agent_type not in self.agent_types:
                raise ValueError(f"Agent type '{agent_type}' is not registered")
            
            if pool_size < 1:
                raise ValueError("Pool size must be at least 1")
            
            # Generate pool ID
            pool_id = str(uuid.uuid4())
            
            # Create agents
            agent_ids = []
            for _ in range(pool_size):
                agent = self.create_agent(agent_type)
                agent_ids.append(agent.id)
            
            # Create pool record
            self.agent_pools[pool_id] = {
                'id': pool_id,
                'name': pool_name or f"{agent_type.lower()}_pool_{pool_id[:8]}",
                'agent_type': agent_type,
                'size': pool_size,
                'agents': agent_ids,
                'created_at': datetime.utcnow().isoformat()
            }
            
            logger.info(f"Created agent pool {pool_id} with {pool_size} agents of type {agent_type}")
            return pool_id
    
    def dispatch_task(
        self, 
        agent_type: str, 
        task_data: Dict[str, Any], 
        priority: TaskPriority = TaskPriority.NORMAL,
        wait: bool = False,
        timeout: Optional[float] = None
    ) -> Union[str, Dict[str, Any]]:
        """
        Dispatch a task to an agent of the specified type.
        
        Args:
            agent_type: Type of agent to dispatch to
            task_data: Task data to process
            priority: Priority level for the task
            wait: Whether to wait for task completion
            timeout: Timeout in seconds (only used if wait=True)
            
        Returns:
            Task ID or task result if wait=True
            
        Raises:
            ValueError: If agent type is not registered
            TimeoutError: If wait=True and the task times out
        """
        with self.lock:
            if agent_type not in self.agent_types:
                raise ValueError(f"Agent type '{agent_type}' is not registered")
            
            # Find or create an agent of the specified type
            agent = None
            for a in self.active_agents.values():
                if isinstance(a, self.agent_types[agent_type]) and a.status == AgentStatus.IDLE:
                    agent = a
                    break
            
            if agent is None:
                # No idle agent found, create a new one
                agent = self.create_agent(agent_type)
            
            # Create the task
            task_id = str(uuid.uuid4())
            created_at = datetime.utcnow().isoformat()
            
            task = {
                'id': task_id,
                'agent_id': agent.id,
                'agent_type': agent_type,
                'data': task_data,
                'priority': priority.name,
                'status': TaskStatus.PENDING,
                'created_at': created_at,
                'updated_at': created_at
            }
            
            # Store task
            self.tasks[task_id] = task
            
            # Add task to agent queue
            agent.add_task(task, priority)
            
            # Update task status
            task['status'] = TaskStatus.DISPATCHED
            task['updated_at'] = datetime.utcnow().isoformat()
            
            logger.info(f"Dispatched task {task_id} to agent {agent.id} with priority {priority.name}")
            
            if wait:
                # Wait for task completion
                return self._wait_for_task_completion(task_id, timeout or DEFAULT_TASK_TIMEOUT)
            else:
                return task_id
    
    def dispatch_task_to_pool(
        self, 
        pool_id: str, 
        task_data: Dict[str, Any], 
        priority: TaskPriority = TaskPriority.NORMAL,
        wait: bool = False,
        timeout: Optional[float] = None
    ) -> Union[str, Dict[str, Any]]:
        """
        Dispatch a task to an agent pool.
        
        Args:
            pool_id: ID of the agent pool
            task_data: Task data to process
            priority: Priority level for the task
            wait: Whether to wait for task completion
            timeout: Timeout in seconds (only used if wait=True)
            
        Returns:
            Task ID or task result if wait=True
            
        Raises:
            ValueError: If pool ID is not found
            TimeoutError: If wait=True and the task times out
        """
        with self.lock:
            if pool_id not in self.agent_pools:
                raise ValueError(f"Agent pool '{pool_id}' does not exist")
            
            pool = self.agent_pools[pool_id]
            agent_type = pool['agent_type']
            
            # Find an idle agent in the pool
            agent = None
            for agent_id in pool['agents']:
                if agent_id in self.active_agents:
                    a = self.active_agents[agent_id]
                    if a.status == AgentStatus.IDLE:
                        agent = a
                        break
            
            if agent is None:
                # No idle agent found, use the first agent in the pool
                agent_id = pool['agents'][0]
                agent = self.active_agents[agent_id]
            
            # Create the task
            task_id = str(uuid.uuid4())
            created_at = datetime.utcnow().isoformat()
            
            task = {
                'id': task_id,
                'agent_id': agent.id,
                'agent_type': agent_type,
                'pool_id': pool_id,
                'data': task_data,
                'priority': priority.name,
                'status': TaskStatus.PENDING,
                'created_at': created_at,
                'updated_at': created_at
            }
            
            # Store task
            self.tasks[task_id] = task
            
            # Add task to agent queue
            agent.add_task(task, priority)
            
            # Update task status
            task['status'] = TaskStatus.DISPATCHED
            task['updated_at'] = datetime.utcnow().isoformat()
            
            logger.info(f"Dispatched task {task_id} to agent {agent.id} in pool {pool_id} with priority {priority.name}")
            
            if wait:
                # Wait for task completion
                return self._wait_for_task_completion(task_id, timeout or DEFAULT_TASK_TIMEOUT)
            else:
                return task_id
    
    def _wait_for_task_completion(self, task_id: str, timeout: float) -> Dict[str, Any]:
        """
        Wait for a task to complete.
        
        Args:
            task_id: ID of the task to wait for
            timeout: Timeout in seconds
            
        Returns:
            Task result
            
        Raises:
            TimeoutError: If the task doesn't complete within the timeout
            ValueError: If the task fails or is cancelled
        """
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            task = self.tasks.get(task_id)
            
            if not task:
                raise ValueError(f"Task {task_id} not found")
            
            if task['status'] == TaskStatus.COMPLETED:
                return task['result']
            
            if task['status'] == TaskStatus.FAILED:
                raise ValueError(f"Task {task_id} failed: {task.get('error', 'Unknown error')}")
            
            if task['status'] == TaskStatus.CANCELLED:
                raise ValueError(f"Task {task_id} was cancelled")
            
            # Wait a bit before checking again
            time.sleep(0.1)
        
        # Timeout reached
        task = self.tasks.get(task_id)
        if task:
            task['status'] = TaskStatus.TIMEOUT
            task['updated_at'] = datetime.utcnow().isoformat()
        
        raise TimeoutError(f"Task {task_id} timed out after {timeout} seconds")
    
    def get_task_status(self, task_id: str) -> Dict[str, Any]:
        """
        Get the status of a task.
        
        Args:
            task_id: ID of the task
            
        Returns:
            Task status information
            
        Raises:
            ValueError: If task ID is not found
        """
        with self.lock:
            if task_id not in self.tasks:
                raise ValueError(f"Task {task_id} not found")
            
            task = self.tasks[task_id]
            return {
                'id': task['id'],
                'status': task['status'].name if isinstance(task['status'], TaskStatus) else task['status'],
                'agent_id': task['agent_id'],
                'agent_type': task['agent_type'],
                'pool_id': task.get('pool_id'),
                'priority': task['priority'],
                'created_at': task['created_at'],
                'updated_at': task['updated_at'],
                'started_at': task.get('started_at'),
                'completed_at': task.get('completed_at')
            }
    
    def get_task_result(self, task_id: str) -> Dict[str, Any]:
        """
        Get the result of a completed task.
        
        Args:
            task_id: ID of the task
            
        Returns:
            Task result
            
        Raises:
            ValueError: If task ID is not found or task is not completed
        """
        with self.lock:
            if task_id not in self.tasks:
                raise ValueError(f"Task {task_id} not found")
            
            task = self.tasks[task_id]
            
            if task['status'] != TaskStatus.COMPLETED:
                raise ValueError(f"Task {task_id} is not completed (status: {task['status']})")
            
            return task['result']
    
    def cancel_task(self, task_id: str) -> bool:
        """
        Cancel a pending or dispatched task.
        
        Args:
            task_id: ID of the task to cancel
            
        Returns:
            True if task was cancelled, False otherwise
            
        Raises:
            ValueError: If task ID is not found
        """
        with self.lock:
            if task_id not in self.tasks:
                raise ValueError(f"Task {task_id} not found")
            
            task = self.tasks[task_id]
            
            if task['status'] in [TaskStatus.PENDING, TaskStatus.DISPATCHED]:
                task['status'] = TaskStatus.CANCELLED
                task['updated_at'] = datetime.utcnow().isoformat()
                logger.info(f"Cancelled task {task_id}")
                return True
            else:
                logger.info(f"Cannot cancel task {task_id} with status {task['status']}")
                return False
    
    def get_active_agents(self, agent_type: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Get list of active agents.
        
        Args:
            agent_type: Optional agent type to filter by
            
        Returns:
            List of active agent information
        """
        with self.lock:
            agent_list = []
            
            for agent_id, agent in self.active_agents.items():
                # Skip agents of different type if filter is specified
                if agent_type and not isinstance(agent, self.agent_types.get(agent_type)):
                    continue
                
                # Get agent info
                agent_info = agent.report_status()
                
                # Add agent type
                for agent_type_name, agent_class in self.agent_types.items():
                    if isinstance(agent, agent_class):
                        agent_info['agent_type'] = agent_type_name
                        break
                
                agent_list.append(agent_info)
            
            return agent_list
    
    def shutdown(self):
        """Shutdown all agents"""
        with self.lock:
            logger.info("Shutting down MCP Core")
            
            # Shutdown all active agents
            for agent_id, agent in list(self.active_agents.items()):
                try:
                    agent.stop_processing()
                    logger.info(f"Agent {agent_id} shutdown requested")
                except Exception as e:
                    logger.error(f"Error shutting down agent {agent_id}: {str(e)}")
            
            # Clear agent pools
            self.agent_pools.clear()
            
            logger.info("MCP Core shutdown complete")

# Create a singleton MCP instance
_mcp_instance = None

def get_mcp() -> MCPCore:
    """
    Get or create the singleton MCP instance.
    
    Returns:
        MCPCore instance
    """
    global _mcp_instance
    
    if _mcp_instance is None:
        _mcp_instance = MCPCore()
    
    return _mcp_instance