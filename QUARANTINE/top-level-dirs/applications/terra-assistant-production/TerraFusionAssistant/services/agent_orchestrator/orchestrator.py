"""
Agent Orchestrator

This module implements the Agent Orchestrator, which coordinates agents,
dispatches tasks, and manages agent pools for code analysis.
"""

import os
import uuid
import time
import logging
import threading
from datetime import datetime
from typing import Dict, List, Any, Optional, Union, Callable, Type, Set, Tuple

from services.agent_orchestrator.task import Task, TaskStatus, TaskPriority
from services.agent_orchestrator.agent import Agent, AgentStatus, AgentCapability, GenericAgent

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class AgentOrchestrator:
    """
    Agent Orchestrator for coordinating multiple AI agents.
    
    The Agent Orchestrator is responsible for:
    - Registering agent types and creating agents
    - Managing agent pools for different task types
    - Dispatching tasks to appropriate agents
    - Tracking task execution and results
    - Supporting agent-to-agent communication
    """
    
    def __init__(self):
        """Initialize the Agent Orchestrator."""
        # Agent management
        self.agent_types = {}  # agent_type_name -> agent_class
        self.agents = {}  # agent_id -> agent
        self.agent_pools = {}  # pool_id -> pool_info
        
        # Task management
        self.tasks = {}  # task_id -> task
        self.pending_tasks = set()  # Set of pending task IDs
        self.completed_tasks = {}  # task_id -> task (last N tasks)
        self.max_completed_tasks = 1000  # Maximum number of completed tasks to keep
        
        # Task result callbacks
        self.task_callbacks = {}  # task_id -> callback_function
        
        # Threading protection
        self.lock = threading.RLock()
        
        logger.info("Agent Orchestrator initialized")
    
    def register_agent_type(self, agent_type_name: str, agent_class: Type[Agent]):
        """
        Register an agent type with the orchestrator.
        
        Args:
            agent_type_name: Name for the agent type
            agent_class: Agent class to use for this type
            
        Raises:
            ValueError: If agent_type_name is already registered
        """
        with self.lock:
            if agent_type_name in self.agent_types:
                raise ValueError(f"Agent type '{agent_type_name}' is already registered")
            
            self.agent_types[agent_type_name] = agent_class
            logger.info(f"Registered agent type: {agent_type_name}")
    
    def create_agent(
        self,
        agent_type_name: str,
        name: Optional[str] = None,
        description: Optional[str] = None,
        capabilities: Optional[List[Union[AgentCapability, str]]] = None,
        max_concurrent_tasks: int = 1
    ) -> Agent:
        """
        Create an agent of the specified type.
        
        Args:
            agent_type_name: Type of agent to create
            name: Optional agent name
            description: Optional agent description
            capabilities: Optional list of agent capabilities
            max_concurrent_tasks: Maximum number of concurrent tasks
            
        Returns:
            Created agent instance
            
        Raises:
            ValueError: If agent_type_name is not registered
        """
        with self.lock:
            if agent_type_name not in self.agent_types:
                raise ValueError(f"Agent type '{agent_type_name}' is not registered")
            
            # Create default name/description if not provided
            if name is None:
                name = f"{agent_type_name}Agent"
            
            if description is None:
                description = f"Agent for {agent_type_name} tasks"
            
            # Create the agent
            agent_class = self.agent_types[agent_type_name]
            agent = agent_class(
                name=name,
                description=description,
                capabilities=capabilities,
                max_concurrent_tasks=max_concurrent_tasks
            )
            
            # Store and start the agent
            self.agents[agent.id] = agent
            agent.start()
            
            logger.info(f"Created agent of type {agent_type_name} with ID {agent.id}")
            return agent
    
    def create_generic_agent(
        self,
        processor_func: Callable[[Task], Dict[str, Any]],
        name: str,
        description: str,
        capabilities: Optional[List[Union[AgentCapability, str]]] = None,
        max_concurrent_tasks: int = 1
    ) -> Agent:
        """
        Create a generic agent with a custom processor function.
        
        Args:
            processor_func: Function to process tasks
            name: Agent name
            description: Agent description
            capabilities: Optional list of agent capabilities
            max_concurrent_tasks: Maximum number of concurrent tasks
            
        Returns:
            Created agent instance
        """
        with self.lock:
            agent = GenericAgent(
                processor_func=processor_func,
                name=name,
                description=description,
                capabilities=capabilities,
                max_concurrent_tasks=max_concurrent_tasks
            )
            
            # Store and start the agent
            self.agents[agent.id] = agent
            agent.start()
            
            logger.info(f"Created generic agent with ID {agent.id}")
            return agent
    
    def create_agent_pool(
        self,
        agent_type_name: str,
        pool_size: int,
        name: Optional[str] = None,
        description: Optional[str] = None,
        capabilities: Optional[List[Union[AgentCapability, str]]] = None,
        max_concurrent_tasks: int = 1
    ) -> str:
        """
        Create a pool of agents of the specified type.
        
        Args:
            agent_type_name: Type of agents to create
            pool_size: Number of agents to create
            name: Optional base name for agents
            description: Optional base description for agents
            capabilities: Optional list of agent capabilities
            max_concurrent_tasks: Maximum number of concurrent tasks per agent
            
        Returns:
            ID of the created pool
            
        Raises:
            ValueError: If agent_type_name is not registered or pool_size is invalid
        """
        with self.lock:
            if agent_type_name not in self.agent_types:
                raise ValueError(f"Agent type '{agent_type_name}' is not registered")
            
            if pool_size < 1:
                raise ValueError("Pool size must be at least 1")
            
            # Generate pool ID
            pool_id = str(uuid.uuid4())
            
            # Create default name/description if not provided
            if name is None:
                name = f"{agent_type_name}PoolAgent"
            
            if description is None:
                description = f"Pool agent for {agent_type_name} tasks"
            
            # Create the agents
            agent_ids = []
            for i in range(pool_size):
                agent_name = f"{name}{i+1}"
                agent_description = f"{description} (Pool: {pool_id[:8]})"
                
                agent = self.create_agent(
                    agent_type_name=agent_type_name,
                    name=agent_name,
                    description=agent_description,
                    capabilities=capabilities,
                    max_concurrent_tasks=max_concurrent_tasks
                )
                
                agent_ids.append(agent.id)
            
            # Create pool record
            self.agent_pools[pool_id] = {
                'id': pool_id,
                'agent_type': agent_type_name,
                'size': pool_size,
                'agents': agent_ids,
                'created_at': datetime.utcnow().isoformat()
            }
            
            logger.info(f"Created agent pool {pool_id} with {pool_size} agents of type {agent_type_name}")
            return pool_id
    
    def shutdown_agent(self, agent_id: str):
        """
        Shutdown an agent.
        
        Args:
            agent_id: ID of the agent to shutdown
            
        Raises:
            ValueError: If agent_id is not found
        """
        with self.lock:
            if agent_id not in self.agents:
                raise ValueError(f"Agent {agent_id} not found")
            
            agent = self.agents[agent_id]
            agent.stop()
            
            logger.info(f"Agent {agent_id} shutdown requested")
    
    def shutdown_agent_pool(self, pool_id: str):
        """
        Shutdown all agents in a pool.
        
        Args:
            pool_id: ID of the agent pool
            
        Raises:
            ValueError: If pool_id is not found
        """
        with self.lock:
            if pool_id not in self.agent_pools:
                raise ValueError(f"Agent pool {pool_id} not found")
            
            pool = self.agent_pools[pool_id]
            
            for agent_id in pool['agents']:
                if agent_id in self.agents:
                    self.shutdown_agent(agent_id)
            
            # Remove pool
            del self.agent_pools[pool_id]
            
            logger.info(f"Agent pool {pool_id} shutdown")
    
    def shutdown_all_agents(self):
        """Shutdown all agents."""
        with self.lock:
            # Shutdown all agents
            for agent_id in list(self.agents.keys()):
                try:
                    self.shutdown_agent(agent_id)
                except Exception as e:
                    logger.error(f"Error shutting down agent {agent_id}: {str(e)}")
            
            # Clear agent pools
            self.agent_pools.clear()
            
            logger.info("All agents shutdown")
    
    def create_task(
        self,
        task_type: str,
        data: Dict[str, Any],
        priority: TaskPriority = TaskPriority.NORMAL,
        parent_task_id: Optional[str] = None,
        source_repository: Optional[str] = None,
        required_capabilities: Optional[List[Union[AgentCapability, str]]] = None,
        timeout: Optional[float] = None
    ) -> Task:
        """
        Create a new task.
        
        Args:
            task_type: Type of task
            data: Task data
            priority: Task priority
            parent_task_id: Optional parent task ID
            source_repository: Optional source repository
            required_capabilities: Optional required agent capabilities
            timeout: Optional timeout in seconds
            
        Returns:
            Created task
        """
        with self.lock:
            task = Task(
                task_type=task_type,
                data=data,
                priority=priority,
                parent_task_id=parent_task_id,
                source_repository=source_repository,
                required_capabilities=required_capabilities,
                timeout=timeout
            )
            
            self.tasks[task.id] = task
            self.pending_tasks.add(task.id)
            
            logger.info(f"Created task {task.id} of type {task_type} with priority {priority.name}")
            return task
    
    def assign_task(self, task: Task, agent_id: str):
        """
        Assign a task to a specific agent.
        
        Args:
            task: Task to assign
            agent_id: ID of the agent to assign to
            
        Raises:
            ValueError: If agent_id is not found
        """
        with self.lock:
            if agent_id not in self.agents:
                raise ValueError(f"Agent {agent_id} not found")
            
            agent = self.agents[agent_id]
            
            # Add task to agent queue
            agent.add_task(task)
            
            # Update task
            task.assigned_to = agent_id
            
            # Remove from pending tasks
            self.pending_tasks.discard(task.id)
            
            logger.info(f"Assigned task {task.id} to agent {agent_id}")
    
    def find_suitable_agent(
        self,
        task: Task,
        agent_type: Optional[str] = None,
        pool_id: Optional[str] = None
    ) -> Optional[str]:
        """
        Find a suitable agent for a task.
        
        Args:
            task: Task to find an agent for
            agent_type: Optional specific agent type to use
            pool_id: Optional agent pool to use
            
        Returns:
            ID of a suitable agent or None if no suitable agent found
        """
        with self.lock:
            suitable_agents = []
            
            # Filter agents by pool if specified
            if pool_id is not None:
                if pool_id not in self.agent_pools:
                    logger.warning(f"Agent pool {pool_id} not found")
                    return None
                
                pool_agent_ids = self.agent_pools[pool_id]['agents']
                candidates = {agent_id: self.agents[agent_id] for agent_id in pool_agent_ids if agent_id in self.agents}
            else:
                candidates = self.agents
            
            # Filter agents by type if specified
            if agent_type is not None:
                filtered_candidates = {}
                agent_class = self.agent_types.get(agent_type)
                
                if agent_class is None:
                    logger.warning(f"Agent type {agent_type} not found")
                    return None
                
                for agent_id, agent in candidates.items():
                    if isinstance(agent, agent_class):
                        filtered_candidates[agent_id] = agent
                
                candidates = filtered_candidates
            
            # Filter agents by required capabilities
            if task.required_capabilities:
                for agent_id, agent in candidates.items():
                    if agent.has_all_capabilities(task.required_capabilities):
                        suitable_agents.append((agent_id, agent))
            else:
                suitable_agents = list(candidates.items())
            
            if not suitable_agents:
                return None
            
            # Prefer idle agents
            idle_agents = [(agent_id, agent) for agent_id, agent in suitable_agents if agent.status == AgentStatus.IDLE]
            
            if idle_agents:
                # Return the agent with the fewest active tasks
                return min(idle_agents, key=lambda x: len(x[1].active_tasks))[0]
            else:
                # If no idle agents, return the agent with the fewest active tasks
                return min(suitable_agents, key=lambda x: len(x[1].active_tasks))[0]
    
    def dispatch_task(
        self,
        task_type: str,
        data: Dict[str, Any],
        priority: TaskPriority = TaskPriority.NORMAL,
        agent_type: Optional[str] = None,
        pool_id: Optional[str] = None,
        wait: bool = False,
        timeout: Optional[float] = None,
        required_capabilities: Optional[List[Union[AgentCapability, str]]] = None,
        parent_task_id: Optional[str] = None,
        source_repository: Optional[str] = None,
        callback: Optional[Callable[[Task], None]] = None
    ) -> Union[str, Task]:
        """
        Dispatch a task to a suitable agent.
        
        Args:
            task_type: Type of task
            data: Task data
            priority: Task priority
            agent_type: Optional specific agent type to use
            pool_id: Optional agent pool to use
            wait: Whether to wait for task completion
            timeout: Optional timeout in seconds
            required_capabilities: Optional required agent capabilities
            parent_task_id: Optional parent task ID
            source_repository: Optional source repository
            callback: Optional callback function
            
        Returns:
            Task ID if wait=False, Task if wait=True
            
        Raises:
            ValueError: If no suitable agent found
        """
        with self.lock:
            # Create the task
            task = self.create_task(
                task_type=task_type,
                data=data,
                priority=priority,
                parent_task_id=parent_task_id,
                source_repository=source_repository,
                required_capabilities=required_capabilities,
                timeout=timeout
            )
            
            # Set callback if provided
            if callback:
                task.set_callback(callback)
                self.task_callbacks[task.id] = callback
            
            # Find a suitable agent
            agent_id = self.find_suitable_agent(task, agent_type, pool_id)
            
            if agent_id is None:
                logger.warning(f"No suitable agent found for task {task.id}")
                task.set_error("No suitable agent found")
                return task.id if not wait else task
            
            # Assign the task
            self.assign_task(task, agent_id)
            
            if wait:
                # Wait for task completion
                task_id = task.id
                deadline = time.time() + (timeout or 60.0)
                
                while time.time() < deadline:
                    # Refresh task from self.tasks
                    task = self.tasks[task_id]
                    
                    if task.status in [TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.TIMEOUT, TaskStatus.CANCELLED]:
                        return task
                    
                    time.sleep(0.1)
                
                # Task timed out
                task.update_status(TaskStatus.TIMEOUT)
                return task
            else:
                return task.id
    
    def dispatch_to_agent(
        self,
        agent_id: str,
        task_type: str,
        data: Dict[str, Any],
        priority: TaskPriority = TaskPriority.NORMAL,
        wait: bool = False,
        timeout: Optional[float] = None,
        parent_task_id: Optional[str] = None,
        source_repository: Optional[str] = None,
        callback: Optional[Callable[[Task], None]] = None
    ) -> Union[str, Task]:
        """
        Dispatch a task to a specific agent.
        
        Args:
            agent_id: ID of the agent to dispatch to
            task_type: Type of task
            data: Task data
            priority: Task priority
            wait: Whether to wait for task completion
            timeout: Optional timeout in seconds
            parent_task_id: Optional parent task ID
            source_repository: Optional source repository
            callback: Optional callback function
            
        Returns:
            Task ID if wait=False, Task if wait=True
            
        Raises:
            ValueError: If agent_id is not found
        """
        with self.lock:
            if agent_id not in self.agents:
                raise ValueError(f"Agent {agent_id} not found")
            
            # Create the task
            task = self.create_task(
                task_type=task_type,
                data=data,
                priority=priority,
                parent_task_id=parent_task_id,
                source_repository=source_repository,
                timeout=timeout
            )
            
            # Set callback if provided
            if callback:
                task.set_callback(callback)
                self.task_callbacks[task.id] = callback
            
            # Assign the task
            self.assign_task(task, agent_id)
            
            if wait:
                # Wait for task completion
                task_id = task.id
                deadline = time.time() + (timeout or 60.0)
                
                while time.time() < deadline:
                    # Refresh task from self.tasks
                    task = self.tasks[task_id]
                    
                    if task.status in [TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.TIMEOUT, TaskStatus.CANCELLED]:
                        return task
                    
                    time.sleep(0.1)
                
                # Task timed out
                task.update_status(TaskStatus.TIMEOUT)
                return task
            else:
                return task.id
    
    def get_task(self, task_id: str) -> Optional[Task]:
        """
        Get a task by ID.
        
        Args:
            task_id: ID of the task
            
        Returns:
            Task or None if not found
        """
        with self.lock:
            return self.tasks.get(task_id)
    
    def get_agent(self, agent_id: str) -> Optional[Agent]:
        """
        Get an agent by ID.
        
        Args:
            agent_id: ID of the agent
            
        Returns:
            Agent or None if not found
        """
        with self.lock:
            return self.agents.get(agent_id)
    
    def get_agent_status(self, agent_id: str) -> Optional[Dict[str, Any]]:
        """
        Get an agent's status.
        
        Args:
            agent_id: ID of the agent
            
        Returns:
            Agent status dictionary or None if not found
        """
        with self.lock:
            agent = self.agents.get(agent_id)
            if agent:
                return agent.report_status()
            return None
    
    def get_all_agents_status(self) -> Dict[str, Dict[str, Any]]:
        """
        Get status of all agents.
        
        Returns:
            Dictionary of agent ID to status dictionary
        """
        with self.lock:
            return {agent_id: agent.report_status() for agent_id, agent in self.agents.items()}
    
    def get_pool_status(self, pool_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a pool's status.
        
        Args:
            pool_id: ID of the pool
            
        Returns:
            Pool status dictionary or None if not found
        """
        with self.lock:
            if pool_id not in self.agent_pools:
                return None
            
            pool = self.agent_pools[pool_id]
            agent_statuses = {}
            
            for agent_id in pool['agents']:
                if agent_id in self.agents:
                    agent_statuses[agent_id] = self.agents[agent_id].report_status()
            
            return {
                'id': pool_id,
                'agent_type': pool['agent_type'],
                'size': pool['size'],
                'created_at': pool['created_at'],
                'agents': agent_statuses
            }
    
    def get_task_status(self, task_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a task's status.
        
        Args:
            task_id: ID of the task
            
        Returns:
            Task status dictionary or None if not found
        """
        with self.lock:
            task = self.tasks.get(task_id)
            if task:
                return task.to_dict()
            return None
    
    def cancel_task(self, task_id: str) -> bool:
        """
        Cancel a pending or dispatched task.
        
        Args:
            task_id: ID of the task to cancel
            
        Returns:
            True if task was cancelled, False otherwise
        """
        with self.lock:
            task = self.tasks.get(task_id)
            if not task:
                return False
            
            if task.status in [TaskStatus.PENDING, TaskStatus.DISPATCHED]:
                task.update_status(TaskStatus.CANCELLED)
                self.pending_tasks.discard(task_id)
                
                # If assigned to an agent, try to remove from agent's queue
                if task.assigned_to and task.assigned_to in self.agents:
                    # Note: This doesn't actually remove from the agent's queue
                    # as that would require a more complex agent implementation
                    # The agent will just skip the task if it's cancelled
                    pass
                
                logger.info(f"Cancelled task {task_id}")
                return True
            
            return False
    
    def shutdown(self):
        """Shutdown the Agent Orchestrator and all agents."""
        with self.lock:
            self.shutdown_all_agents()
            logger.info("Agent Orchestrator shutdown")

# Create a singleton instance
_orchestrator_instance = None

def get_orchestrator() -> AgentOrchestrator:
    """
    Get or create the singleton Agent Orchestrator instance.
    
    Returns:
        AgentOrchestrator instance
    """
    global _orchestrator_instance
    
    if _orchestrator_instance is None:
        _orchestrator_instance = AgentOrchestrator()
    
    return _orchestrator_instance