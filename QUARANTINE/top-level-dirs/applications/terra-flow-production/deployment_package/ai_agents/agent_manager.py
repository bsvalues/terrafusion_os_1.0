"""
AI Agent Manager

This module manages and coordinates all AI agents in the system,
facilitating communication and providing centralized control.
"""

import os
import logging
import json
import datetime
import uuid
import threading
import time
from typing import Dict, List, Any, Optional, Union, Tuple, Type

from ai_agents.base_agent import AIAgent, AIAgentPool

logger = logging.getLogger(__name__)

class AIAgentManager:
    """
    Manages all AI agents in the system, facilitating communication,
    providing centralized control, and monitoring agent health.
    """
    
    def __init__(self):
        """Initialize the agent manager"""
        # Agent registry
        self.agents = {}  # agent_id -> agent
        self.agent_pools = {}  # pool_name -> pool
        self.agent_types = {}  # agent_type -> agent_class
        
        # Agent monitoring
        self.monitor_interval = 30  # seconds
        self.monitor_thread = None
        self.monitor_running = False
        
        # Manager state
        self.running = False
        
        logger.info("AI Agent Manager initialized")
    
    def start(self):
        """Start the agent manager"""
        if self.running:
            logger.warning("Agent Manager already running")
            return
        
        self.running = True
        
        # Start monitoring thread
        self.monitor_running = True
        self.monitor_thread = threading.Thread(target=self._monitor_agents)
        self.monitor_thread.daemon = True
        self.monitor_thread.start()
        
        logger.info("AI Agent Manager started")
    
    def stop(self):
        """Stop the agent manager and all managed agents"""
        if not self.running:
            logger.warning("Agent Manager not running")
            return
        
        # Stop monitoring
        self.monitor_running = False
        if self.monitor_thread:
            self.monitor_thread.join(timeout=2.0)
        
        # Stop all agents
        for agent_id, agent in list(self.agents.items()):
            logger.info(f"Stopping agent: {agent_id}")
            try:
                agent.stop()
            except Exception as e:
                logger.error(f"Error stopping agent {agent_id}: {str(e)}")
        
        # Stop all agent pools
        for pool_name, pool in list(self.agent_pools.items()):
            logger.info(f"Stopping agent pool: {pool_name}")
            try:
                pool.stop()
            except Exception as e:
                logger.error(f"Error stopping agent pool {pool_name}: {str(e)}")
        
        self.running = False
        logger.info("AI Agent Manager stopped")
    
    def register_agent_type(self, agent_type: str, agent_class: Type[AIAgent]):
        """
        Register an agent class with a type name.
        
        Args:
            agent_type: Type name for the agent class
            agent_class: Agent class to register
        """
        self.agent_types[agent_type] = agent_class
        logger.info(f"Registered agent type: {agent_type}")
    
    def register_agent(self, agent: AIAgent):
        """
        Register an agent with the manager.
        
        Args:
            agent: Agent instance to register
        """
        if agent.agent_id in self.agents:
            logger.warning(f"Agent with ID {agent.agent_id} already registered")
            return
        
        self.agents[agent.agent_id] = agent
        logger.info(f"Registered agent: {agent.name} (ID: {agent.agent_id})")
        
        # Start the agent if manager is running
        if self.running and agent.status == "initialized":
            agent.start()
    
    def unregister_agent(self, agent_id: str):
        """
        Unregister an agent from the manager.
        
        Args:
            agent_id: ID of the agent to unregister
        """
        if agent_id not in self.agents:
            logger.warning(f"Agent with ID {agent_id} not registered")
            return
        
        # Stop the agent if it's running
        agent = self.agents[agent_id]
        if agent.status == "running":
            agent.stop()
        
        # Remove from registry
        del self.agents[agent_id]
        logger.info(f"Unregistered agent: {agent_id}")
    
    def create_agent(self, agent_type: str, name: str = None, 
                    description: str = "", capabilities: List[str] = None, 
                    **kwargs) -> Optional[AIAgent]:
        """
        Create and register a new agent instance.
        
        Args:
            agent_type: Type of agent to create
            name: Name for the agent
            description: Description of the agent
            capabilities: Agent capabilities
            **kwargs: Additional arguments for the agent constructor
            
        Returns:
            Created agent instance, or None if creation failed
        """
        if agent_type not in self.agent_types:
            logger.error(f"Unknown agent type: {agent_type}")
            return None
        
        try:
            # Generate agent ID
            agent_id = str(uuid.uuid4())
            
            # Create agent instance
            agent_class = self.agent_types[agent_type]
            agent = agent_class(
                agent_id=agent_id,
                name=name or f"{agent_type.capitalize()}Agent",
                description=description,
                capabilities=capabilities,
                **kwargs
            )
            
            # Register the agent
            self.register_agent(agent)
            
            return agent
        except Exception as e:
            logger.error(f"Error creating agent of type {agent_type}: {str(e)}")
            return None
    
    def create_agent_pool(self, pool_name: str, agent_type: str, 
                         pool_size: int = 3, **kwargs) -> bool:
        """
        Create and register a new agent pool.
        
        Args:
            pool_name: Name for the pool
            agent_type: Type of agent for the pool
            pool_size: Number of agent instances in the pool
            **kwargs: Additional arguments for the agent constructor
            
        Returns:
            True if pool was created, False otherwise
        """
        if agent_type not in self.agent_types:
            logger.error(f"Unknown agent type: {agent_type}")
            return False
        
        if pool_name in self.agent_pools:
            logger.warning(f"Agent pool with name {pool_name} already exists")
            return False
        
        try:
            # Create agent pool
            agent_class = self.agent_types[agent_type]
            pool = AIAgentPool(agent_class, pool_size, kwargs)
            
            # Register the pool
            self.agent_pools[pool_name] = pool
            
            logger.info(f"Created agent pool: {pool_name} with {pool_size} instances of {agent_type}")
            return True
        except Exception as e:
            logger.error(f"Error creating agent pool {pool_name}: {str(e)}")
            return False
    
    def get_agent(self, agent_id: str) -> Optional[AIAgent]:
        """
        Get an agent by ID.
        
        Args:
            agent_id: ID of the agent
            
        Returns:
            Agent instance, or None if not found
        """
        return self.agents.get(agent_id)
    
    def agent_exists(self, agent_id: str) -> bool:
        """
        Check if an agent exists.
        
        Args:
            agent_id: ID of the agent
            
        Returns:
            True if agent exists, False otherwise
        """
        return agent_id in self.agents
    
    def send_message_to_agent(self, agent_id: str, message: Dict[str, Any]) -> bool:
        """
        Send a message to an agent.
        
        Args:
            agent_id: ID of the recipient agent
            message: Message to send
            
        Returns:
            True if message was sent, False otherwise
        """
        agent = self.get_agent(agent_id)
        if not agent:
            logger.error(f"Cannot send message to non-existent agent: {agent_id}")
            return False
        
        try:
            agent.message_queue.put(message)
            return True
        except Exception as e:
            logger.error(f"Error sending message to agent {agent_id}: {str(e)}")
            return False
    
    def broadcast_message(self, message_type: str, payload: Dict[str, Any], 
                         agent_filter: Callable[[AIAgent], bool] = None) -> int:
        """
        Broadcast a message to multiple agents.
        
        Args:
            message_type: Type of message ('task', 'control', 'query')
            payload: Message payload
            agent_filter: Function to filter which agents receive the message
            
        Returns:
            Number of agents the message was sent to
        """
        sent_count = 0
        
        for agent_id, agent in self.agents.items():
            # Skip agents that don't pass the filter
            if agent_filter and not agent_filter(agent):
                continue
            
            # Create the message
            message = {
                "type": message_type,
                "broadcast": True,
                **payload
            }
            
            # Send the message
            try:
                agent.message_queue.put(message)
                sent_count += 1
            except Exception as e:
                logger.error(f"Error broadcasting message to agent {agent_id}: {str(e)}")
        
        return sent_count
    
    def process_task_with_pool(self, pool_name: str, task_data: Dict[str, Any], 
                              timeout: float = 30.0) -> Dict[str, Any]:
        """
        Process a task using an agent pool.
        
        Args:
            pool_name: Name of the agent pool
            task_data: Task data
            timeout: Timeout in seconds
            
        Returns:
            Task result
        """
        pool = self.agent_pools.get(pool_name)
        if not pool:
            return {
                "status": "error",
                "error": f"Agent pool '{pool_name}' not found"
            }
        
        return pool.process_task(task_data, timeout)
    
    def get_all_agents_info(self) -> List[Dict[str, Any]]:
        """
        Get information about all registered agents.
        
        Returns:
            List of agent information dictionaries
        """
        return [agent.get_agent_info() for agent in self.agents.values()]
    
    def get_all_pools_status(self) -> Dict[str, Any]:
        """
        Get status of all agent pools.
        
        Returns:
            Dictionary with pool status information
        """
        return {
            pool_name: pool.get_pool_status()
            for pool_name, pool in self.agent_pools.items()
        }
    
    def _monitor_agents(self):
        """Monitor agent health periodically"""
        while self.monitor_running:
            try:
                # Check each agent
                for agent_id, agent in list(self.agents.items()):
                    # Check if agent is responsive
                    if agent.status == "running":
                        time_since_activity = time.time() - agent.last_activity
                        
                        # Check for agents that haven't been active in a while
                        if time_since_activity > 300:  # 5 minutes
                            logger.warning(f"Agent {agent_id} has been inactive for {time_since_activity:.1f} seconds")
                    
                    # Check for agents in error status
                    elif agent.status in ["error", "failed"]:
                        logger.error(f"Agent {agent_id} is in error state: {agent.status}")
                
                # Sleep until next check
                time.sleep(self.monitor_interval)
            except Exception as e:
                logger.error(f"Error in agent monitoring: {str(e)}")
                time.sleep(5)  # Sleep briefly after error

# Create a singleton instance
agent_manager = AIAgentManager()