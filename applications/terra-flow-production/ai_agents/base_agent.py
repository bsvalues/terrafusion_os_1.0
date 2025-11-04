"""
Base AI Agent Framework

This module defines the foundation for AI agents that enhance data stability,
security, and integrity for the Benton County Washington Assessor's Office.
"""

import os
import logging
import json
import datetime
import uuid
import threading
import queue
import time
from typing import Dict, List, Any, Optional, Union, Tuple, Callable

logger = logging.getLogger(__name__)

class AIAgent:
    """
    Base class for all AI agents in the system.
    Provides common functionality and communication patterns.
    """
    
    def __init__(self, agent_id: str = None, name: str = "BaseAgent", 
                description: str = "", capabilities: List[str] = None):
        """
        Initialize the AI agent.
        
        Args:
            agent_id: Unique identifier for the agent (generated if not provided)
            name: Human-readable name of the agent
            description: Description of the agent's purpose
            capabilities: List of agent capabilities
        """
        self.agent_id = agent_id or str(uuid.uuid4())
        self.name = name
        self.description = description
        self.capabilities = capabilities or []
        
        # Agent state
        self.status = "initialized"
        self.last_activity = time.time()
        self.experience = []  # History of tasks and outcomes
        self.learning_enabled = True
        
        # Communication channels
        self.message_queue = queue.Queue()
        self.response_queues = {}
        
        # Performance metrics
        self.metrics = {
            'tasks_processed': 0,
            'tasks_succeeded': 0,
            'tasks_failed': 0,
            'average_processing_time': 0,
            'total_processing_time': 0
        }
        
        # Setup
        self._setup_agent()
        
        logger.info(f"AI Agent '{self.name}' initialized with ID: {self.agent_id}")
    
    def _setup_agent(self):
        """Set up the agent (can be overridden by subclasses)"""
        pass
    
    def start(self):
        """Start the agent's background thread"""
        self.status = "running"
        self.agent_thread = threading.Thread(target=self._agent_loop)
        self.agent_thread.daemon = True
        self.agent_thread.start()
        logger.info(f"Agent '{self.name}' started")
    
    def stop(self):
        """Stop the agent"""
        self.status = "stopping"
        # Allow time for agent to clean up
        time.sleep(0.5)
        self.status = "stopped"
        logger.info(f"Agent '{self.name}' stopped")
    
    def _agent_loop(self):
        """Main processing loop for the agent"""
        while self.status == "running":
            try:
                # Process any messages in the queue
                self._process_messages()
                
                # Perform agent-specific background tasks
                self._background_tasks()
                
                # Sleep briefly to prevent high CPU usage
                time.sleep(0.1)
            except Exception as e:
                logger.error(f"Error in agent '{self.name}' loop: {str(e)}")
                time.sleep(1)  # Sleep longer after error
    
    def _process_messages(self):
        """Process messages in the queue"""
        try:
            # Check if there are messages without blocking
            if not self.message_queue.empty():
                message = self.message_queue.get_nowait()
                
                # Process the message
                if message["type"] == "task":
                    self._handle_task(message)
                elif message["type"] == "control":
                    self._handle_control(message)
                elif message["type"] == "query":
                    self._handle_query(message)
                else:
                    logger.warning(f"Unknown message type: {message['type']}")
                
                # Mark message as processed
                self.message_queue.task_done()
        except queue.Empty:
            # No messages in queue
            pass
        except Exception as e:
            logger.error(f"Error processing message in agent '{self.name}': {str(e)}")
    
    def _background_tasks(self):
        """Perform background tasks (can be overridden by subclasses)"""
        pass
    
    def _handle_task(self, message: Dict[str, Any]):
        """
        Handle a task message.
        
        Args:
            message: Task message containing task_data
        """
        try:
            start_time = time.time()
            
            # Extract task data
            task_id = message.get("task_id", str(uuid.uuid4()))
            task_data = message.get("task_data", {})
            response_queue = message.get("response_queue")
            
            # Log task receipt
            logger.info(f"Agent '{self.name}' processing task {task_id}")
            
            # Process the task
            result = self.process_task(task_data)
            
            # Calculate processing time
            processing_time = time.time() - start_time
            
            # Update metrics
            self.metrics['tasks_processed'] += 1
            if result.get("status") == "success":
                self.metrics['tasks_succeeded'] += 1
            else:
                self.metrics['tasks_failed'] += 1
            self.metrics['total_processing_time'] += processing_time
            self.metrics['average_processing_time'] = (
                self.metrics['total_processing_time'] / self.metrics['tasks_processed']
            )
            
            # Update experience if learning is enabled
            if self.learning_enabled:
                self.experience.append({
                    "task_id": task_id,
                    "task_data": task_data,
                    "result": result,
                    "processing_time": processing_time,
                    "timestamp": datetime.datetime.now().isoformat()
                })
                
                # Limit experience history to prevent memory issues
                if len(self.experience) > 1000:
                    self.experience = self.experience[-1000:]
            
            # Send response if a response queue was provided
            if response_queue:
                response_message = {
                    "task_id": task_id,
                    "agent_id": self.agent_id,
                    "result": result,
                    "processing_time": processing_time
                }
                response_queue.put(response_message)
            
            # Update last activity time
            self.last_activity = time.time()
            
        except Exception as e:
            logger.error(f"Error handling task in agent '{self.name}': {str(e)}")
            # Send error response if a response queue was provided
            if response_queue:
                response_message = {
                    "task_id": message.get("task_id", "unknown"),
                    "agent_id": self.agent_id,
                    "error": str(e),
                    "status": "error"
                }
                response_queue.put(response_message)
    
    def _handle_control(self, message: Dict[str, Any]):
        """
        Handle a control message.
        
        Args:
            message: Control message containing command
        """
        command = message.get("command")
        
        if command == "stop":
            self.stop()
        elif command == "pause":
            self.status = "paused"
            logger.info(f"Agent '{self.name}' paused")
        elif command == "resume":
            self.status = "running"
            logger.info(f"Agent '{self.name}' resumed")
        elif command == "update_config":
            self._update_config(message.get("config", {}))
        else:
            logger.warning(f"Unknown control command: {command}")
    
    def _handle_query(self, message: Dict[str, Any]):
        """
        Handle a query message.
        
        Args:
            message: Query message containing query_type
        """
        query_type = message.get("query_type")
        response_queue = message.get("response_queue")
        
        if not response_queue:
            logger.warning("Query received without response queue")
            return
        
        if query_type == "status":
            response = {
                "agent_id": self.agent_id,
                "name": self.name,
                "status": self.status,
                "capabilities": self.capabilities,
                "metrics": self.metrics,
                "last_activity": self.last_activity
            }
        elif query_type == "metrics":
            response = {
                "agent_id": self.agent_id,
                "metrics": self.metrics
            }
        elif query_type == "capabilities":
            response = {
                "agent_id": self.agent_id,
                "capabilities": self.capabilities
            }
        else:
            response = {
                "agent_id": self.agent_id,
                "error": f"Unknown query type: {query_type}"
            }
        
        response_queue.put(response)
    
    def _update_config(self, config: Dict[str, Any]):
        """
        Update agent configuration.
        
        Args:
            config: New configuration parameters
        """
        if "learning_enabled" in config:
            self.learning_enabled = config["learning_enabled"]
        
        # Additional config updates can be added here
        
        logger.info(f"Agent '{self.name}' configuration updated")
    
    def send_message(self, agent_id: str, message_type: str, 
                    payload: Dict[str, Any], wait_for_response: bool = False,
                    timeout: float = 30.0) -> Optional[Dict[str, Any]]:
        """
        Send a message to another agent.
        
        Args:
            agent_id: ID of the recipient agent
            message_type: Type of message ('task', 'control', 'query')
            payload: Message payload
            wait_for_response: Whether to wait for a response
            timeout: Timeout in seconds
            
        Returns:
            Response if wait_for_response is True, otherwise None
        """
        from ai_agents.agent_manager import agent_manager
        
        # Check if recipient agent exists
        if not agent_manager.agent_exists(agent_id):
            logger.error(f"Cannot send message to non-existent agent: {agent_id}")
            return None
        
        # Create a response queue if waiting for response
        response_queue = None
        if wait_for_response:
            response_queue = queue.Queue()
            
            # Store the response queue in a way that can be accessed by message ID
            message_id = str(uuid.uuid4())
            self.response_queues[message_id] = response_queue
        
        # Create the message
        message = {
            "type": message_type,
            "agent_id": self.agent_id,
            "message_id": message_id if wait_for_response else None,
            "response_queue": response_queue,
            **payload
        }
        
        # Send the message
        agent_manager.send_message_to_agent(agent_id, message)
        
        # Wait for response if requested
        if wait_for_response:
            try:
                response = response_queue.get(timeout=timeout)
                del self.response_queues[message_id]
                return response
            except queue.Empty:
                logger.warning(f"Timeout waiting for response from agent {agent_id}")
                del self.response_queues[message_id]
                return {"error": "Timeout waiting for response"}
        
        return None
    
    def process_task(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process a task (to be implemented by subclasses).
        
        Args:
            task_data: Task data
            
        Returns:
            Task result
        """
        logger.warning("Base process_task called, should be overridden by subclass")
        return {
            "status": "error",
            "error": "process_task not implemented"
        }
    
    def get_agent_info(self) -> Dict[str, Any]:
        """
        Get information about the agent.
        
        Returns:
            Dictionary with agent information
        """
        return {
            "agent_id": self.agent_id,
            "name": self.name,
            "description": self.description,
            "capabilities": self.capabilities,
            "status": self.status,
            "metrics": self.metrics,
            "last_activity": self.last_activity
        }


class AIAgentPool:
    """
    Manages a pool of AI agent instances that can be used for specific tasks.
    Provides load balancing and fault tolerance.
    """
    
    def __init__(self, agent_class: type, pool_size: int = 3, 
                agent_args: Dict[str, Any] = None):
        """
        Initialize the agent pool.
        
        Args:
            agent_class: Class of agent to instantiate
            pool_size: Number of agent instances to create
            agent_args: Arguments to pass to agent constructor
        """
        self.agent_class = agent_class
        self.pool_size = pool_size
        self.agent_args = agent_args or {}
        
        # Pool state
        self.agents = []
        self.active = True
        self.task_counter = 0
        
        # Initialize the pool
        self._initialize_pool()
        
        logger.info(f"AI Agent Pool initialized with {pool_size} instances of {agent_class.__name__}")
    
    def _initialize_pool(self):
        """Initialize the agent instances in the pool"""
        for i in range(self.pool_size):
            # Create agent instance with unique ID
            agent_id = f"{self.agent_class.__name__}_{i}_{uuid.uuid4().hex[:8]}"
            agent = self.agent_class(agent_id=agent_id, **self.agent_args)
            
            # Start the agent
            agent.start()
            
            # Add to pool
            self.agents.append(agent)
    
    def process_task(self, task_data: Dict[str, Any], 
                    timeout: float = 30.0) -> Dict[str, Any]:
        """
        Process a task using an agent from the pool.
        Uses simple round-robin load balancing.
        
        Args:
            task_data: Task data
            timeout: Timeout in seconds
            
        Returns:
            Task result
        """
        if not self.active or not self.agents:
            return {
                "status": "error",
                "error": "Agent pool is not active or empty"
            }
        
        # Select agent using round-robin
        agent_index = self.task_counter % len(self.agents)
        agent = self.agents[agent_index]
        self.task_counter += 1
        
        # Create response queue
        response_queue = queue.Queue()
        
        # Create message
        message = {
            "type": "task",
            "task_id": str(uuid.uuid4()),
            "task_data": task_data,
            "response_queue": response_queue
        }
        
        # Send message to agent
        agent.message_queue.put(message)
        
        # Wait for response
        try:
            response = response_queue.get(timeout=timeout)
            return response.get("result", {"status": "error", "error": "No result in response"})
        except queue.Empty:
            logger.warning(f"Timeout waiting for response from agent {agent.agent_id}")
            return {
                "status": "error",
                "error": "Timeout waiting for response"
            }
    
    def stop(self):
        """Stop all agents in the pool"""
        self.active = False
        for agent in self.agents:
            agent.stop()
        logger.info(f"AI Agent Pool with {len(self.agents)} instances stopped")
    
    def get_pool_status(self) -> Dict[str, Any]:
        """
        Get status of all agents in the pool.
        
        Returns:
            Dictionary with pool status
        """
        return {
            "active": self.active,
            "pool_size": len(self.agents),
            "agents": [agent.get_agent_info() for agent in self.agents]
        }