"""
Base Agent Module

This module provides the BaseAgent class that all specialized agents
in the MCP architecture should inherit from. It defines the common
interface and functionality that all agents must implement.

The enhanced version now includes support for the Agent-to-Agent communication
protocol, enabling specialized agents to collaborate effectively on complex
property assessment workflows.
"""

import logging
import time
from typing import Dict, List, Any, Optional, Union, Callable
import uuid
import threading
import json
from datetime import datetime

# Setup logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

class BaseAgent:
    """
    Base class for all MCP agents
    
    This class provides the foundation for specialized assessment agents in the
    Benton County system, with support for both task-based processing and
    agent-to-agent communication protocol.
    """
    
    def __init__(self, agent_id: Optional[str] = None):
        """Initialize the base agent"""
        self.agent_id = agent_id or f"{self.__class__.__name__}_{uuid.uuid4().hex[:8]}"
        self.status = "initialized"
        self.capabilities = []
        self.last_activity = time.time()
        self.logger = logging.getLogger(f"agent.{self.agent_id}")
        self.active_tasks = {}
        
        # Agent knowledge base
        self.knowledge = {}
        
        # Message handlers for the agent-to-agent protocol
        self.message_handlers = {}
        
        # Agent context - maintains state across interactions
        self.context = {
            "conversations": {},
            "last_interactions": {},
            "domain_knowledge": {}
        }
        
        # Demographics for Washington assessment context
        self.assessment_context = {
            "state": "Washington",
            "county": "Benton",
            "jurisdiction": "Benton County Assessor's Office",
            "property_types": ["residential", "commercial", "agricultural", "industrial"]
        }
        
        self.logger.info(f"Agent {self.agent_id} initialized")
    
    def process_task(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process a task assigned to this agent
        
        This method must be implemented by all derived agent classes.
        """
        raise NotImplementedError("Agents must implement process_task method")
    
    def get_status(self) -> str:
        """Get the current status of the agent"""
        return self.status
    
    def set_status(self, status: str) -> None:
        """Set the agent status"""
        self.status = status
        self.last_activity = time.time()
        self.logger.info(f"Agent status changed to: {status}")
        
    def _handle_status_request(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle a status request message
        
        Args:
            message: The status request message
            
        Returns:
            Status update message with agent's current status
        """
        self.logger.info(f"Received status request from {message.get('sender_id', 'unknown')}")
        
        # Create detailed status information
        status_details = {
            "status": self.status,
            "capabilities": self.capabilities,
            "last_activity": self.last_activity,
            "active_tasks": len(self.active_tasks),
            "agent_type": self.__class__.__name__
        }
        
        # Return a status update message
        return {
            "message_type": "status_update",
            "content": {
                "status": self.status,
                "details": status_details
            },
            "sender_id": self.agent_id,
            "receiver_id": message.get("sender_id", "status_reporter"),  # Default to status_reporter if no sender
            "conversation_id": message.get("conversation_id"),
            "reply_to": message.get("id")
        }
    
    def get_capabilities(self) -> List[str]:
        """Get the list of agent capabilities"""
        return self.capabilities
    
    def update_capabilities(self, capabilities: List[str]) -> None:
        """Update the agent capabilities list"""
        self.capabilities = capabilities
        self.logger.info(f"Agent capabilities updated: {capabilities}")
    
    def add_capability(self, capability: str) -> None:
        """Add a new capability to the agent"""
        if capability not in self.capabilities:
            self.capabilities.append(capability)
            self.logger.info(f"Added capability: {capability}")
    
    def can_process(self, task_type: str) -> bool:
        """Check if the agent can process a specific task type"""
        return task_type in self.capabilities
    
    def shutdown(self) -> None:
        """Shutdown the agent gracefully"""
        self.set_status("shutdown")
        self.logger.info(f"Agent {self.agent_id} shutdown")
    
    def start_background_task(self, task_func, task_data: Dict[str, Any]) -> str:
        """Start a task in the background and return a task ID"""
        task_id = f"bg_{uuid.uuid4().hex[:12]}"
        
        def wrapper():
            try:
                self.active_tasks[task_id] = {"status": "running", "started": time.time()}
                result = task_func(task_data)
                self.active_tasks[task_id] = {
                    "status": "completed",
                    "started": self.active_tasks[task_id]["started"],
                    "completed": time.time(),
                    "result": result
                }
            except Exception as e:
                self.logger.error(f"Background task {task_id} failed: {str(e)}")
                self.active_tasks[task_id] = {
                    "status": "failed",
                    "started": self.active_tasks[task_id]["started"],
                    "completed": time.time(),
                    "error": str(e)
                }
        
        thread = threading.Thread(target=wrapper)
        thread.daemon = True
        thread.start()
        
        return task_id
    
    def get_background_task_status(self, task_id: str) -> Dict[str, Any]:
        """Get the status of a background task"""
        if task_id not in self.active_tasks:
            return {"status": "unknown", "error": "Task ID not found"}
        return self.active_tasks[task_id]
        
    # Agent-to-Agent Protocol Support
    
    def register_message_handler(
        self, 
        message_type: str, 
        handler: Callable
    ) -> None:
        """
        Register a handler for a specific message type
        
        Args:
            message_type: The type of message to handle
            handler: Function to call when a message of this type is received
        """
        self.message_handlers[message_type] = handler
        self.logger.info(f"Registered handler for {message_type} messages")
        
    def handle_message(self, message: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Handle an incoming message from another agent
        
        Args:
            message: The message to handle
            
        Returns:
            Optional response message
        """
        message_type = message.get("message_type")
        
        # Update last interaction time with sender
        sender_id = message.get("sender_id")
        if sender_id:
            self.context["last_interactions"][sender_id] = time.time()
            
        # Store conversation context
        conversation_id = message.get("conversation_id")
        if conversation_id:
            if conversation_id not in self.context["conversations"]:
                self.context["conversations"][conversation_id] = []
            self.context["conversations"][conversation_id].append(message)
        
        # Check for registered handler
        if message_type in self.message_handlers:
            try:
                return self.message_handlers[message_type](message)
            except Exception as e:
                self.logger.error(f"Error in message handler for {message_type}: {str(e)}")
                return {
                    "message_type": "failure",
                    "content": {"error": str(e)},
                    "sender_id": self.agent_id,
                    "receiver_id": message.get("sender_id"),
                    "conversation_id": conversation_id,
                    "reply_to": message.get("id")
                }
        
        # Default handling based on message type
        if message_type == "query":
            return self._handle_query(message)
        elif message_type == "inform":
            return self._handle_inform(message)
        elif message_type == "request":
            return self._handle_request(message)
        elif message_type == "status_request":
            return self._handle_status_request(message)
        
        # Unknown message type
        self.logger.warning(f"No handler for message type: {message_type}")
        return {
            "message_type": "not_understood",
            "content": {"error": f"No handler for message type: {message_type}"},
            "sender_id": self.agent_id,
            "receiver_id": message.get("sender_id"),
            "conversation_id": conversation_id,
            "reply_to": message.get("id")
        }
        
    def _handle_query(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """
        Default handler for query messages
        
        Args:
            message: The query message
            
        Returns:
            Response message
        """
        # Default implementation - derived agents should override this
        return {
            "message_type": "inform",
            "content": {
                "information": f"Agent {self.agent_id} cannot answer queries of this type",
                "query": message.get("content", {}).get("query")
            },
            "sender_id": self.agent_id,
            "receiver_id": message.get("sender_id"),
            "conversation_id": message.get("conversation_id"),
            "reply_to": message.get("id")
        }
        
    def _handle_inform(self, message: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Default handler for inform messages
        
        Args:
            message: The inform message
            
        Returns:
            Optional response message
        """
        # Default implementation - just store information in context
        content = message.get("content", {})
        information = content.get("information")
        
        if information:
            # Store in domain knowledge if appropriate
            if "domain" in content:
                domain = content["domain"]
                if domain not in self.context["domain_knowledge"]:
                    self.context["domain_knowledge"][domain] = []
                self.context["domain_knowledge"][domain].append({
                    "information": information,
                    "source": message.get("sender_id"),
                    "timestamp": datetime.utcnow().isoformat()
                })
                
        # Usually no response needed for inform messages
        return None
        
    def _handle_request(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """
        Default handler for request messages
        
        Args:
            message: The request message
            
        Returns:
            Response message
        """
        # Default implementation - derived agents should override this
        action = message.get("content", {}).get("action")
        
        return {
            "message_type": "failure",
            "content": {
                "error": f"Agent {self.agent_id} cannot perform action: {action}",
                "action": action
            },
            "sender_id": self.agent_id,
            "receiver_id": message.get("sender_id"),
            "conversation_id": message.get("conversation_id"),
            "reply_to": message.get("id")
        }
        
    # Knowledge Management
    
    def add_knowledge(self, domain: str, key: str, value: Any) -> None:
        """
        Add knowledge to the agent's knowledge base
        
        Args:
            domain: The knowledge domain (e.g., "property_valuation", "tax_law")
            key: Key to store the knowledge under
            value: The knowledge to store
        """
        if domain not in self.knowledge:
            self.knowledge[domain] = {}
        self.knowledge[domain][key] = value
        
    def get_knowledge(self, domain: str, key: str) -> Optional[Any]:
        """
        Retrieve knowledge from the agent's knowledge base
        
        Args:
            domain: The knowledge domain
            key: Key to retrieve
            
        Returns:
            The knowledge if found, None otherwise
        """
        return self.knowledge.get(domain, {}).get(key)
        
    def has_knowledge(self, domain: str, key: str) -> bool:
        """
        Check if the agent has specific knowledge
        
        Args:
            domain: The knowledge domain
            key: Key to check
            
        Returns:
            True if the agent has this knowledge, False otherwise
        """
        return key in self.knowledge.get(domain, {})
        
    # Agent to Agent protocol integration
        
    def send_query(
        self, 
        receiver_id: str, 
        query: str, 
        context: Optional[Dict[str, Any]] = None,
        conversation_id: Optional[str] = None,
        protocol_handler = None  # Will be injected by MCP
    ) -> Optional[Dict[str, Any]]:
        """
        Send a query to another agent
        
        Args:
            receiver_id: ID of the receiving agent
            query: The query to send
            context: Additional context for the query
            conversation_id: Optional ID of an existing conversation
            protocol_handler: Protocol handler injected by MCP
            
        Returns:
            Response message if available
        """
        if not protocol_handler:
            self.logger.error("No protocol handler available")
            return None
            
        message = {
            "message_type": "query",
            "content": {
                "query": query,
                "context": context or {}
            },
            "sender_id": self.agent_id,
            "receiver_id": receiver_id,
            "conversation_id": conversation_id
        }
        
        return protocol_handler.send_message(**message, wait_for_response=True)
        
    def send_inform(
        self,
        receiver_id: str,
        information: Any,
        domain: Optional[str] = None,
        conversation_id: Optional[str] = None,
        reply_to: Optional[str] = None,
        protocol_handler = None  # Will be injected by MCP
    ) -> str:
        """
        Send information to another agent
        
        Args:
            receiver_id: ID of the receiving agent
            information: The information to send
            domain: Optional domain the information belongs to
            conversation_id: Optional ID of an existing conversation
            reply_to: Optional ID of a message this is replying to
            protocol_handler: Protocol handler injected by MCP
            
        Returns:
            ID of the sent message
        """
        if not protocol_handler:
            self.logger.error("No protocol handler available")
            return None
            
        content = {"information": information}
        if domain:
            content["domain"] = domain
            
        message = {
            "message_type": "inform",
            "content": content,
            "sender_id": self.agent_id,
            "receiver_id": receiver_id,
            "conversation_id": conversation_id,
            "reply_to": reply_to
        }
        
        return protocol_handler.send_message(**message)
        
    def send_request(
        self,
        receiver_id: str,
        action: str,
        parameters: Optional[Dict[str, Any]] = None,
        conversation_id: Optional[str] = None,
        protocol_handler = None  # Will be injected by MCP
    ) -> Optional[Dict[str, Any]]:
        """
        Send a request to another agent
        
        Args:
            receiver_id: ID of the receiving agent
            action: The action to request
            parameters: Parameters for the action
            conversation_id: Optional ID of an existing conversation
            protocol_handler: Protocol handler injected by MCP
            
        Returns:
            Response message if available
        """
        if not protocol_handler:
            self.logger.error("No protocol handler available")
            return None
            
        message = {
            "message_type": "request",
            "content": {
                "action": action,
                "parameters": parameters or {}
            },
            "sender_id": self.agent_id,
            "receiver_id": receiver_id,
            "conversation_id": conversation_id
        }
        
        return protocol_handler.send_message(**message, wait_for_response=True)

# Agent registry to keep track of all agent implementations
_agent_registry = {}