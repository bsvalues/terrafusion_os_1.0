"""
Agent Base Module for Code Deep Dive Analyzer

This module provides the base classes and interfaces for all specialized AI agents
in the system. It handles communication with the protocol server, message processing,
task execution, and continuous learning capabilities.
"""

import os
import time
import logging
import uuid
import threading
import queue
from enum import Enum
from typing import Dict, List, Any, Optional, Union, TypeVar, Generic, Set, NamedTuple, Iterator
from abc import ABC, abstractmethod

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class AgentState(Enum):
    """Possible states for an agent"""
    INITIALIZING = "initializing"
    IDLE = "idle"
    BUSY = "busy"
    LEARNING = "learning"
    OFFLINE = "offline"

class AgentCategory(Enum):
    """Categories of agents in the system"""
    CODE_QUALITY = "code_quality"
    ARCHITECTURE = "architecture"
    DATABASE = "database"
    DOCUMENTATION = "documentation"
    AGENT_READINESS = "agent_readiness"
    LEARNING_COORDINATOR = "learning_coordinator"
    AI_INTEGRATION = "ai_integration"

class MessageType(Enum):
    """Types of messages that can be exchanged between agents"""
    REQUEST = "request"
    RESPONSE = "response"
    BROADCAST = "broadcast"
    ALERT = "alert"
    LEARNING_UPDATE = "learning_update"

class MessagePriority(Enum):
    """Priority levels for messages"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class ProtocolMessage:
    """
    Message for agent-to-agent communication.
    
    This class represents a message in the agent communication protocol.
    """
    def __init__(self, 
               message_id: str,
               sender_id: str,
               recipients: List[str],
               message_type: MessageType,
               content: Dict[str, Any],
               metadata: Optional[Dict[str, Any]] = None,
               priority: MessagePriority = MessagePriority.MEDIUM,
               timestamp: Optional[float] = None):
        """
        Initialize a new protocol message.
        
        Args:
            message_id: Unique identifier for this message
            sender_id: ID of the agent sending the message
            recipients: List of recipient agent IDs
            message_type: Type of message
            content: Message content
            metadata: Optional message metadata
            priority: Message priority
            timestamp: Optional message timestamp (defaults to current time)
        """
        self.message_id = message_id
        self.sender_id = sender_id
        self.recipients = recipients
        self.message_type = message_type
        self.content = content
        self.metadata = metadata or {}
        self.priority = priority
        self.timestamp = timestamp or time.time()
        
    def to_dict(self) -> Dict[str, Any]:
        """Convert the message to a dictionary for serialization"""
        return {
            "message_id": self.message_id,
            "sender_id": self.sender_id,
            "recipients": self.recipients,
            "message_type": self.message_type.value,
            "content": self.content,
            "metadata": self.metadata,
            "priority": self.priority.value,
            "timestamp": self.timestamp
        }
        
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ProtocolMessage':
        """Create a message from a dictionary"""
        return cls(
            message_id=data["message_id"],
            sender_id=data["sender_id"],
            recipients=data["recipients"],
            message_type=MessageType(data["message_type"]),
            content=data["content"],
            metadata=data.get("metadata", {}),
            priority=MessagePriority(data["priority"]),
            timestamp=data["timestamp"]
        )

class Task:
    """
    Task assigned to an agent.
    
    This class represents a task that can be assigned to and executed by an agent.
    """
    def __init__(self,
               task_id: str,
               agent_id: str,
               capability: str,
               parameters: Dict[str, Any],
               priority: str = "medium",
               deadline: Optional[float] = None,
               created_at: Optional[float] = None):
        """
        Initialize a new task.
        
        Args:
            task_id: Unique identifier for this task
            agent_id: ID of the agent assigned to this task
            capability: Capability required for this task
            parameters: Task parameters
            priority: Task priority
            deadline: Optional deadline for task completion
            created_at: Optional task creation timestamp
        """
        self.task_id = task_id
        self.agent_id = agent_id
        self.capability = capability
        self.parameters = parameters
        self.priority = priority
        self.deadline = deadline
        self.created_at = created_at or time.time()
        self.started_at = None
        self.completed_at = None
        self.status = "pending"
        self.result = None
        self.error = None
        
    def start(self):
        """Mark the task as started"""
        self.started_at = time.time()
        self.status = "in_progress"
        
    def complete(self, result: Dict[str, Any]):
        """Mark the task as completed successfully"""
        self.completed_at = time.time()
        self.status = "completed"
        self.result = result
        
    def fail(self, error: str):
        """Mark the task as failed"""
        self.completed_at = time.time()
        self.status = "failed"
        self.error = error
        
    def to_dict(self) -> Dict[str, Any]:
        """Convert the task to a dictionary for serialization"""
        return {
            "task_id": self.task_id,
            "agent_id": self.agent_id,
            "capability": self.capability,
            "parameters": self.parameters,
            "priority": self.priority,
            "deadline": self.deadline,
            "created_at": self.created_at,
            "started_at": self.started_at,
            "completed_at": self.completed_at,
            "status": self.status,
            "result": self.result,
            "error": self.error
        }
        
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Task':
        """Create a task from a dictionary"""
        task = cls(
            task_id=data["task_id"],
            agent_id=data["agent_id"],
            capability=data["capability"],
            parameters=data["parameters"],
            priority=data["priority"],
            deadline=data.get("deadline"),
            created_at=data["created_at"]
        )
        task.started_at = data.get("started_at")
        task.completed_at = data.get("completed_at")
        task.status = data["status"]
        task.result = data.get("result")
        task.error = data.get("error")
        return task

class Agent(ABC):
    """
    Base class for all agents in the system.
    
    This class handles communication with the protocol server, message processing,
    task execution and tracking, and provides hooks for specialized agent behavior.
    """
    def __init__(self, agent_id: str, agent_type: AgentCategory, capabilities: List[str],
                preferred_model: Optional[str] = None):
        """
        Initialize a new agent.
        
        Args:
            agent_id: Unique identifier for this agent
            agent_type: Category this agent belongs to
            capabilities: List of capabilities this agent provides
            preferred_model: Optional preferred AI model to use
        """
        self.agent_id = agent_id
        self.agent_type = agent_type
        self.capabilities = capabilities
        self.preferred_model = preferred_model
        
        self.state = AgentState.INITIALIZING
        self.inbox = queue.Queue()
        self.outbox = queue.Queue()
        self.task_queue = queue.Queue()
        self.current_tasks = {}
        self.task_history = {}
        
        self.running = False
        self.worker_thread = None
        self.message_handler_thread = None
        self.heartbeat_thread = None
        
        self.logger = logging.getLogger(f"Agent-{agent_id}")
        
    def start(self):
        """Start the agent's processing threads"""
        if self.running:
            return
            
        self.running = True
        self._update_state(AgentState.IDLE)
        
        # Start worker thread
        self.worker_thread = threading.Thread(target=self._worker_loop)
        self.worker_thread.daemon = True
        self.worker_thread.start()
        
        # Start message handler thread
        self.message_handler_thread = threading.Thread(target=self._message_handler_loop)
        self.message_handler_thread.daemon = True
        self.message_handler_thread.start()
        
        # Start heartbeat thread
        self.heartbeat_thread = threading.Thread(target=self._heartbeat_loop)
        self.heartbeat_thread.daemon = True
        self.heartbeat_thread.start()
        
        self.logger.info(f"Agent {self.agent_id} started")
    
    def stop(self):
        """Stop the agent's processing threads"""
        if not self.running:
            return
            
        self.running = False
        self._update_state(AgentState.OFFLINE)
        
        # Wait for threads to terminate
        if self.worker_thread:
            self.worker_thread.join(timeout=1.0)
            
        if self.message_handler_thread:
            self.message_handler_thread.join(timeout=1.0)
            
        if self.heartbeat_thread:
            self.heartbeat_thread.join(timeout=1.0)
            
        self.logger.info(f"Agent {self.agent_id} stopped")
    
    def _update_state(self, new_state: AgentState):
        """Update the agent's state and notify the server"""
        self.state = new_state
        self._send_status_update()
    
    def _send_status_update(self):
        """Send a status update to the server"""
        # In a real implementation, this would communicate with a server
        # For this demo, we just log the status change
        self.logger.info(f"Agent {self.agent_id} state updated to {self.state.value}")
    
    def _send_heartbeat(self):
        """Send a heartbeat to the server to indicate the agent is still alive"""
        # In a real implementation, this would communicate with a server
        # For this demo, we just log the heartbeat periodically
        self.logger.debug(f"Agent {self.agent_id} heartbeat")
    
    def _worker_loop(self):
        """Main worker loop that processes the agent's tasks"""
        while self.running:
            try:
                # Check for and process tasks
                self._check_for_new_tasks()
                self._process_current_tasks()
                
                # Sleep to avoid busy waiting
                time.sleep(0.1)
            except Exception as e:
                self.logger.error(f"Error in worker loop: {str(e)}")
    
    def _message_handler_loop(self):
        """Loop for processing incoming messages"""
        while self.running:
            try:
                # Check for and process messages
                self._check_for_new_messages()
                self._process_inbox()
                self._process_outbox()
                
                # Sleep to avoid busy waiting
                time.sleep(0.1)
            except Exception as e:
                self.logger.error(f"Error in message handler loop: {str(e)}")
    
    def _heartbeat_loop(self):
        """Loop for sending periodic heartbeats"""
        while self.running:
            try:
                # Send heartbeat
                self._send_heartbeat()
                
                # Sleep for heartbeat interval
                time.sleep(10.0)
            except Exception as e:
                self.logger.error(f"Error in heartbeat loop: {str(e)}")
    
    def _check_for_new_messages(self):
        """Check for new messages from the protocol server"""
        # In a real implementation, this would retrieve messages from a server
        # For this demo, messages are added to the inbox directly
        pass
    
    def _process_inbox(self):
        """Process messages in the inbox"""
        try:
            # Process up to 10 messages per iteration to avoid blocking
            for _ in range(10):
                # Get a message from the inbox (non-blocking)
                try:
                    message = self.inbox.get(block=False)
                except queue.Empty:
                    break
                    
                # Process the message based on its type
                if message.message_type == MessageType.REQUEST:
                    self._handle_request(message)
                elif message.message_type == MessageType.RESPONSE:
                    self._handle_response(message)
                elif message.message_type == MessageType.LEARNING_UPDATE:
                    self._handle_learning_update(message)
                elif message.message_type == MessageType.BROADCAST:
                    self._handle_broadcast(message)
                elif message.message_type == MessageType.ALERT:
                    self._handle_alert(message)
                    
                # Mark the message as processed
                self.inbox.task_done()
        except Exception as e:
            self.logger.error(f"Error processing inbox: {str(e)}")
    
    def _process_outbox(self):
        """Send messages in the outbox to the protocol server"""
        try:
            # Process up to 10 messages per iteration to avoid blocking
            for _ in range(10):
                # Get a message from the outbox (non-blocking)
                try:
                    message = self.outbox.get(block=False)
                except queue.Empty:
                    break
                    
                # In a real implementation, this would send the message to a server
                # For this demo, we just log the message
                self.logger.info(f"Sending message: {message.message_id}")
                
                # Mark the message as processed
                self.outbox.task_done()
        except Exception as e:
            self.logger.error(f"Error processing outbox: {str(e)}")
    
    def _handle_request(self, message: ProtocolMessage):
        """Handle request messages"""
        self.logger.info(f"Received request: {message.message_id}")
        # Process the request and generate a response
        # This would be implemented in subclasses based on their needs
    
    def _handle_response(self, message: ProtocolMessage):
        """Handle response messages"""
        self.logger.info(f"Received response: {message.message_id}")
        # Process the response
        self._process_response(message)
    
    def _handle_learning_update(self, message: ProtocolMessage):
        """Handle learning update messages"""
        self.logger.info(f"Received learning update: {message.message_id}")
        # Apply the learning update
        update_id = message.content.get("update_id")
        pattern = message.content.get("pattern", {})
        capability = message.content.get("capability")
        
        if update_id and pattern and capability:
            self._apply_learning_update(update_id, pattern, capability)
    
    def _handle_broadcast(self, message: ProtocolMessage):
        """Handle broadcast messages"""
        self.logger.info(f"Received broadcast: {message.message_id}")
        # Process the broadcast action
        action = message.content.get("action")
        if action:
            self._process_broadcast_action(message, action)
    
    def _handle_alert(self, message: ProtocolMessage):
        """Handle alert messages"""
        self.logger.info(f"Received alert: {message.message_id}")
        # Process the alert
        # This would be implemented in subclasses based on their needs
    
    def _process_response(self, message: ProtocolMessage):
        """
        Process a response message.
        
        This method should be implemented by subclasses based on their needs.
        """
        pass
    
    def _process_broadcast_action(self, message: ProtocolMessage, action: str):
        """
        Process a broadcast action.
        
        This method should be implemented by subclasses based on their needs.
        """
        pass
    
    def _check_for_new_tasks(self):
        """Check for new tasks from the protocol server"""
        # In a real implementation, this would retrieve tasks from a server
        # For this demo, tasks are added to the task queue directly
        pass
    
    def _process_current_tasks(self):
        """Process any current tasks"""
        # Only process tasks if the agent is idle or already busy
        if self.state != AgentState.IDLE and self.state != AgentState.BUSY:
            return
            
        # Determine how many tasks we can process concurrently
        max_tasks = self._get_max_concurrent_tasks()
        current_task_count = len(self.current_tasks)
        
        # If we're already at max capacity, just wait for tasks to complete
        if current_task_count >= max_tasks:
            return
            
        # Get more tasks from the queue
        tasks_to_start = max_tasks - current_task_count
        
        try:
            # Process up to the available task slots
            for _ in range(tasks_to_start):
                # Get a task from the queue (non-blocking)
                try:
                    task = self.task_queue.get(block=False)
                except queue.Empty:
                    break
                    
                # Start the task
                task.start()
                self.current_tasks[task.task_id] = task
                
                # Update agent state if this is the first task
                if len(self.current_tasks) == 1:
                    self._update_state(AgentState.BUSY)
                
                # Execute the task in a separate thread to avoid blocking
                task_thread = threading.Thread(
                    target=self._execute_task_wrapper,
                    args=(task,)
                )
                task_thread.daemon = True
                task_thread.start()
                
                # Mark the task as processed in the queue
                self.task_queue.task_done()
        except Exception as e:
            self.logger.error(f"Error processing tasks: {str(e)}")
    
    def _execute_task_wrapper(self, task: Task):
        """Wrapper for task execution to handle exceptions"""
        try:
            # Execute the task
            result = self._execute_task(task)
            
            # Mark the task as completed
            task.complete(result)
            
            # Send response
            self._send_task_response(task, result)
        except Exception as e:
            # Log the error
            self.logger.error(f"Error executing task {task.task_id}: {str(e)}")
            
            # Mark the task as failed
            task.fail(str(e))
            
            # Send error response
            self._send_task_error(task, str(e))
        finally:
            # Move the task to history
            self.task_history[task.task_id] = task
            
            # Remove from current tasks
            if task.task_id in self.current_tasks:
                del self.current_tasks[task.task_id]
                
            # Update agent state if no more tasks
            if not self.current_tasks:
                self._update_state(AgentState.IDLE)
    
    def _send_task_response(self, task: Task, result: Dict[str, Any]):
        """Send a response message for a completed task"""
        # Create a response message
        message = ProtocolMessage(
            message_id=f"resp-{uuid.uuid4()}",
            sender_id=self.agent_id,
            recipients=["controller"],  # Assuming a controller agent
            message_type=MessageType.RESPONSE,
            content={
                "task_id": task.task_id,
                "result": result
            },
            metadata={
                "task_capability": task.capability,
                "execution_time": task.completed_at - task.started_at
            },
            priority=MessagePriority.MEDIUM
        )
        
        # Add the message to the outbox
        self.outbox.put(message)
    
    def _send_task_error(self, task: Task, error: str):
        """Send an error response message for a failed task"""
        # Create an error response message
        message = ProtocolMessage(
            message_id=f"err-{uuid.uuid4()}",
            sender_id=self.agent_id,
            recipients=["controller"],  # Assuming a controller agent
            message_type=MessageType.RESPONSE,
            content={
                "task_id": task.task_id,
                "error": error
            },
            metadata={
                "task_capability": task.capability,
                "execution_time": task.completed_at - task.started_at
            },
            priority=MessagePriority.HIGH
        )
        
        # Add the message to the outbox
        self.outbox.put(message)
    
    def _apply_learning_update(self, update_id: str, pattern: Dict[str, Any], capability: str):
        """
        Apply a learning update to the agent's behavior.
        
        This method should be implemented by subclasses based on their needs.
        """
        pass
    
    def _get_max_concurrent_tasks(self) -> int:
        """Get the maximum number of concurrent tasks this agent can handle"""
        # Default to 1 concurrent task
        return 1
    
    @abstractmethod
    def _execute_task(self, task: Task) -> Dict[str, Any]:
        """
        Execute a task assigned to this agent.
        
        This method must be implemented by subclasses.
        
        Args:
            task: The task to execute
        
        Returns:
            Dict containing the result of the task execution
        """
        pass
    
    def send_message(self, recipients: List[str], message_type: MessageType,
                   content: Dict[str, Any], metadata: Dict[str, Any] = None,
                   priority: MessagePriority = MessagePriority.MEDIUM):
        """
        Send a message to other agents.
        
        Args:
            recipients: List of recipient agent IDs
            message_type: Type of message
            content: Message content
            metadata: Message metadata
            priority: Message priority
        """
        # Create a message
        message = ProtocolMessage(
            message_id=f"msg-{uuid.uuid4()}",
            sender_id=self.agent_id,
            recipients=recipients,
            message_type=message_type,
            content=content,
            metadata=metadata,
            priority=priority
        )
        
        # Add the message to the outbox
        self.outbox.put(message)
    
    def record_feedback(self, task_id: str, action_type: str,
                      rating: float, comments: str = "",
                      context: Dict[str, Any] = None):
        """
        Record feedback on an action performed by the agent.
        
        Args:
            task_id: ID of the task the feedback relates to
            action_type: Type of action the feedback is about
            rating: Rating from 0.0 to 1.0
            comments: Optional comments about the rating
            context: Optional context information
        """
        # Create a feedback message
        message = ProtocolMessage(
            message_id=f"feedback-{uuid.uuid4()}",
            sender_id=self.agent_id,
            recipients=["learning_coordinator"],  # Send to learning coordinator
            message_type=MessageType.RESPONSE,
            content={
                "feedback_type": "action_feedback",
                "task_id": task_id,
                "action_type": action_type,
                "rating": rating,
                "comments": comments,
                "context": context or {}
            },
            priority=MessagePriority.LOW
        )
        
        # Add the message to the outbox
        self.outbox.put(message)
    
    def submit_learning_update(self, pattern: Dict[str, Any], capability: str,
                            effectiveness: float, confidence: float,
                            agent_types: List[str] = None):
        """
        Submit a learning update to the learning system.
        
        Args:
            pattern: The pattern that was discovered
            capability: The capability this pattern applies to
            effectiveness: Estimated effectiveness (0.0 to 1.0)
            confidence: Confidence in the effectiveness estimate (0.0 to 1.0)
            agent_types: List of agent types this update applies to
        """
        # Create a learning update message
        message = ProtocolMessage(
            message_id=f"learn-{uuid.uuid4()}",
            sender_id=self.agent_id,
            recipients=["learning_coordinator"],  # Send to learning coordinator
            message_type=MessageType.LEARNING_UPDATE,
            content={
                "update_type": "pattern_discovery",
                "pattern": pattern,
                "capability": capability,
                "effectiveness": effectiveness,
                "confidence": confidence,
                "agent_types": agent_types or [self.agent_type.value]
            },
            priority=MessagePriority.MEDIUM
        )
        
        # Add the message to the outbox
        self.outbox.put(message)

class CodeQualityAgent(Agent):
    """Base class for code quality analysis agents"""
    
    def __init__(self, agent_id: str, capabilities: List[str], preferred_model: Optional[str] = None):
        super().__init__(
            agent_id=agent_id,
            agent_type=AgentCategory.CODE_QUALITY,
            capabilities=capabilities,
            preferred_model=preferred_model
        )
    
    def _get_max_concurrent_tasks(self) -> int:
        """Get the maximum number of concurrent tasks this agent can handle"""
        return 2  # Code quality agents can handle 2 concurrent tasks
    
    def _apply_learning_update(self, update_id: str, pattern: Dict[str, Any], capability: str):
        """Apply a learning update to the code quality agent"""
        self.logger.info(f"Applying learning update {update_id} for capability {capability}")
        # In a real implementation, this would update the agent's behavior
        # For this demo, we just log the update
        
    def _execute_task(self, task: Task) -> Dict[str, Any]:
        """Execute a code quality analysis task"""
        self.logger.info(f"Executing code quality task: {task.capability}")
        
        # In a real implementation, this would perform the actual analysis
        # For this demo, we just return a simulated result
        
        # Simulate task execution time
        time.sleep(2.0)
        
        if task.capability == "code_review":
            return {
                "quality_score": 8.5,
                "issues": [
                    "Variable naming inconsistency on line 42",
                    "Possible null reference exception in getUserData() method",
                    "Consider using list comprehension on lines 78-82 for better readability"
                ],
                "suggestions": [
                    "Refactor the authenticateUser method to reduce complexity",
                    "Add parameter type hints to improve code clarity"
                ]
            }
        elif task.capability == "style_check":
            return {
                "style_score": 7.8,
                "style_issues": [
                    "Inconsistent indentation in class LoginManager",
                    "Line length exceeds 100 characters on lines 23, 45, 67",
                    "Missing docstrings in 3 methods"
                ]
            }
        elif task.capability == "documentation_analysis":
            return {
                "documentation_score": 6.5,
                "coverage": 75.2,
                "missing_docs": [
                    "Class UserRepository has no docstring",
                    "Method authenticateUser parameters are not documented",
                    "Return values not documented in 4 methods"
                ]
            }
        else:
            return {
                "error": f"Unsupported capability: {task.capability}"
            }

class ArchitectureAgent(Agent):
    """Base class for architecture analysis agents"""
    
    def __init__(self, agent_id: str, capabilities: List[str], preferred_model: Optional[str] = None):
        super().__init__(
            agent_id=agent_id,
            agent_type=AgentCategory.ARCHITECTURE,
            capabilities=capabilities,
            preferred_model=preferred_model
        )
    
    def _get_max_concurrent_tasks(self) -> int:
        """Get the maximum number of concurrent tasks this agent can handle"""
        return 1  # Architecture agents handle 1 task at a time due to complexity
        
    def _execute_task(self, task: Task) -> Dict[str, Any]:
        """Execute an architecture analysis task"""
        self.logger.info(f"Executing architecture task: {task.capability}")
        
        # In a real implementation, this would perform the actual analysis
        # For this demo, we just return a simulated result
        
        # Simulate task execution time
        time.sleep(3.0)
        
        if task.capability == "architecture_review":
            return {
                "architecture_score": 7.2,
                "patterns_detected": [
                    "Repository Pattern",
                    "Factory Method",
                    "Observer Pattern (partial implementation)"
                ],
                "issues": [
                    "High coupling between UserService and PaymentProcessor",
                    "Circular dependency between Order and Customer classes",
                    "Service layer bypass in OrderController"
                ],
                "recommendations": [
                    "Introduce interface for PaymentProcessor to reduce coupling",
                    "Consider applying Mediator pattern for component communication",
                    "Refactor authentication flow to use proper middleware"
                ]
            }
        elif task.capability == "dependency_analysis":
            return {
                "dependencies": {
                    "direct": 45,
                    "indirect": 127,
                    "external": 12
                },
                "problematic_dependencies": [
                    "Tight coupling between OrderService and ShippingService",
                    "ProductCatalog depends on concrete DatabaseService instead of abstraction",
                    "Too many dependencies (23) in UserController class"
                ],
                "dependency_graph": {
                    "nodes": [
                        {"id": "UserService", "group": 1},
                        {"id": "OrderService", "group": 1},
                        {"id": "ProductService", "group": 1},
                        {"id": "DatabaseService", "group": 2},
                        {"id": "CacheService", "group": 2},
                        {"id": "AuthService", "group": 3}
                    ],
                    "links": [
                        {"source": "UserService", "target": "DatabaseService", "value": 5},
                        {"source": "UserService", "target": "AuthService", "value": 8},
                        {"source": "OrderService", "target": "UserService", "value": 3},
                        {"source": "OrderService", "target": "ProductService", "value": 7},
                        {"source": "ProductService", "target": "DatabaseService", "value": 6},
                        {"source": "ProductService", "target": "CacheService", "value": 4}
                    ]
                }
            }
        elif task.capability == "pattern_detection":
            return {
                "patterns_detected": [
                    {
                        "name": "Singleton",
                        "locations": ["DatabaseManager", "ConfigService"],
                        "quality": "Good implementation"
                    },
                    {
                        "name": "Factory Method",
                        "locations": ["ProductFactory", "ReportGenerator"],
                        "quality": "Standard implementation"
                    },
                    {
                        "name": "Observer",
                        "locations": ["OrderStatusManager", "NotificationService"],
                        "quality": "Poor implementation, consider refactoring"
                    },
                    {
                        "name": "Repository",
                        "locations": ["UserRepository", "OrderRepository", "ProductRepository"],
                        "quality": "Good implementation with proper abstractions"
                    }
                ],
                "anti_patterns": [
                    {
                        "name": "God Object",
                        "locations": ["SystemManager"],
                        "severity": "High"
                    },
                    {
                        "name": "Spaghetti Code",
                        "locations": ["LegacyReportGenerator"],
                        "severity": "Medium"
                    }
                ]
            }
        else:
            return {
                "error": f"Unsupported capability: {task.capability}"
            }

class DatabaseAgent(Agent):
    """Base class for database analysis agents"""
    
    def __init__(self, agent_id: str, capabilities: List[str], preferred_model: Optional[str] = None):
        super().__init__(
            agent_id=agent_id,
            agent_type=AgentCategory.DATABASE,
            capabilities=capabilities,
            preferred_model=preferred_model
        )
    
    def _get_max_concurrent_tasks(self) -> int:
        """Get the maximum number of concurrent tasks this agent can handle"""
        return 1  # Database agents handle 1 task at a time
        
    def _execute_task(self, task: Task) -> Dict[str, Any]:
        """Execute a database analysis task"""
        self.logger.info(f"Executing database task: {task.capability}")
        
        # In a real implementation, this would perform the actual analysis
        # For this demo, we just return a simulated result
        
        # Simulate task execution time
        time.sleep(2.5)
        
        if task.capability == "schema_analysis":
            return {
                "entities": 18,
                "relationships": 24,
                "normalization_score": 8.2,
                "issues": [
                    "OrderItems table missing proper foreign key constraint",
                    "UserAddress has redundant fields (consider normalization)",
                    "ProductCategory table uses string primary keys instead of integers"
                ],
                "recommendations": [
                    "Add foreign key constraint to OrderItems.order_id",
                    "Normalize UserAddress into separate address table",
                    "Change primary key type of ProductCategory"
                ]
            }
        elif task.capability == "query_optimization":
            return {
                "analyzed_queries": 12,
                "problematic_queries": [
                    {
                        "query_id": "Q001",
                        "issues": ["Missing index on user_id", "Full table scan on Orders"],
                        "recommendation": "Add index on Orders.user_id and Orders.order_date"
                    },
                    {
                        "query_id": "Q002",
                        "issues": ["Inefficient JOIN with Products table", "Cartesian product risk"],
                        "recommendation": "Rewrite query using INNER JOIN with explicit join condition"
                    },
                    {
                        "query_id": "Q003",
                        "issues": ["Too many JOINs (7 tables)", "Redundant sorting"],
                        "recommendation": "Consider creating a view or optimize schema to reduce joins"
                    }
                ],
                "potential_savings": {
                    "query_execution_time": "65%",
                    "disk_io": "43%",
                    "cpu_usage": "38%"
                }
            }
        elif task.capability == "performance_tuning":
            return {
                "current_performance": {
                    "avg_query_time": "320ms",
                    "peak_connections": 45,
                    "slow_queries_per_hour": 23
                },
                "bottlenecks": [
                    "Inefficient indexing on OrderItems table",
                    "Poor connection pooling configuration",
                    "Missing caching for product catalog queries"
                ],
                "recommendations": [
                    {
                        "description": "Add composite index on (order_id, product_id)",
                        "expected_improvement": "70% faster order retrieval",
                        "implementation_difficulty": "Low"
                    },
                    {
                        "description": "Increase connection pool min size to 10",
                        "expected_improvement": "25% faster at peak times",
                        "implementation_difficulty": "Low"
                    },
                    {
                        "description": "Implement Redis caching for product catalog",
                        "expected_improvement": "90% faster product browsing",
                        "implementation_difficulty": "Medium"
                    }
                ]
            }
        else:
            return {
                "error": f"Unsupported capability: {task.capability}"
            }

class DocumentationAgent(Agent):
    """Base class for documentation agents"""
    
    def __init__(self, agent_id: str, capabilities: List[str], preferred_model: Optional[str] = None):
        super().__init__(
            agent_id=agent_id,
            agent_type=AgentCategory.DOCUMENTATION,
            capabilities=capabilities,
            preferred_model=preferred_model
        )
    
    def _get_max_concurrent_tasks(self) -> int:
        """Get the maximum number of concurrent tasks this agent can handle"""
        return 3  # Documentation agents can handle multiple tasks
        
    def _execute_task(self, task: Task) -> Dict[str, Any]:
        """Execute a documentation task"""
        self.logger.info(f"Executing documentation task: {task.capability}")
        
        # In a real implementation, this would perform the actual documentation
        # For this demo, we just return a simulated result
        
        # Simulate task execution time
        time.sleep(1.5)
        
        if task.capability == "doc_generation":
            return {
                "generated_docs": {
                    "readme_md": "Project overview and setup instructions",
                    "api_docs": "REST API endpoints documentation",
                    "component_docs": "Description of major components"
                },
                "coverage": 85.3,
                "missing_areas": [
                    "Configuration options",
                    "Deployment instructions",
                    "Error handling documentation"
                ]
            }
        elif task.capability == "coverage_analysis":
            return {
                "total_components": 156,
                "documented_components": 114,
                "coverage_score": 73.1,
                "documentation_quality_score": 7.8,
                "poorly_documented_areas": [
                    "Authentication module (30% coverage)",
                    "Payment processing (45% coverage)",
                    "Error handling (25% coverage)"
                ],
                "recommendations": [
                    "Add API documentation for authentication endpoints",
                    "Improve code comments in PaymentProcessor class",
                    "Document error codes and recovery strategies"
                ]
            }
        elif task.capability == "consistency_check":
            return {
                "consistency_score": 68.7,
                "inconsistencies": [
                    "Parameter naming inconsistent between docs and code in UserService",
                    "API endpoints use camelCase in code but snake_case in documentation",
                    "Return values not accurately described in OrderController methods"
                ],
                "terminology_issues": [
                    "Inconsistent use of 'purchase' vs 'order'",
                    "Authentication and authorization used interchangeably",
                    "User vs Customer vs Client terminology mixed"
                ],
                "recommendations": [
                    "Create a terminology glossary for the project",
                    "Update API docs to match actual parameter names",
                    "Standardize on camelCase for all API parameter documentation"
                ]
            }
        else:
            return {
                "error": f"Unsupported capability: {task.capability}"
            }

class LearningCoordinatorAgent(Agent):
    """
    Base class for the learning coordinator agent.
    
    This special agent analyzes feedback, identifies patterns,
    and coordinates learning updates across the agent system.
    """
    
    def __init__(self, agent_id: str = "learning_coordinator", preferred_model: Optional[str] = None):
        super().__init__(
            agent_id=agent_id,
            agent_type=AgentCategory.LEARNING_COORDINATOR,
            capabilities=[
                "feedback_processing",
                "pattern_identification",
                "model_evaluation"
            ],
            preferred_model=preferred_model
        )
        
        # Initialize feedback buffer and pattern storage
        self.feedback_buffer = []
        self.patterns = {}
        self.pattern_efficacy = {}
        
    def _get_max_concurrent_tasks(self) -> int:
        """Get the maximum number of concurrent tasks this agent can handle"""
        return 1  # Learning coordinator handles 1 task at a time
        
    def _execute_task(self, task: Task) -> Dict[str, Any]:
        """Execute a learning coordinator task"""
        self.logger.info(f"Executing learning coordinator task: {task.capability}")
        
        if task.capability == "feedback_processing":
            return self._process_feedback_task(task)
        elif task.capability == "pattern_identification":
            return self._identify_patterns_task(task)
        elif task.capability == "model_evaluation":
            return self._evaluate_model_task(task)
        else:
            return {
                "error": f"Unsupported capability: {task.capability}"
            }
    
    def _process_feedback_task(self, task: Task) -> Dict[str, Any]:
        """Process feedback and add to buffer"""
        # Extract feedback from task parameters
        feedback = task.parameters.get("feedback", {})
        
        if not feedback:
            return {"error": "No feedback provided"}
        
        # Add to feedback buffer
        self.feedback_buffer.append(feedback)
        
        # If buffer reaches threshold, schedule pattern identification
        if len(self.feedback_buffer) >= 10:  # Threshold for pattern analysis
            self._schedule_pattern_identification()
        
        return {
            "feedback_processed": True,
            "feedback_buffer_size": len(self.feedback_buffer)
        }
    
    def _identify_patterns_task(self, task: Task) -> Dict[str, Any]:
        """Identify patterns from feedback"""
        # Get feedback sample size from task parameters
        sample_size = task.parameters.get("sample_size", 10)
        
        # Get feedback sample
        feedback_sample = self.feedback_buffer[:sample_size]
        
        # Analyze feedback for patterns
        patterns = self._analyze_feedback_for_patterns(feedback_sample)
        
        # Submit patterns as learning updates
        update_ids = []
        for pattern in patterns:
            update_id = self._submit_pattern_as_learning_update(pattern)
            update_ids.append(update_id)
        
        # Remove processed feedback from buffer
        self.feedback_buffer = self.feedback_buffer[sample_size:]
        
        return {
            "patterns_identified": len(patterns),
            "update_ids": update_ids,
            "remaining_feedback": len(self.feedback_buffer)
        }
    
    def _evaluate_model_task(self, task: Task) -> Dict[str, Any]:
        """Evaluate model performance"""
        # Get model ID from task parameters
        model_id = task.parameters.get("model_id")
        
        if not model_id:
            return {"error": "No model ID provided"}
        
        # Evaluate the model
        evaluation_results = self._evaluate_model(model_id)
        
        return evaluation_results
    
    def _schedule_pattern_identification(self):
        """Schedule a pattern identification task"""
        # Create a pattern identification task
        task = Task(
            task_id=f"pattern-{uuid.uuid4()}",
            agent_id=self.agent_id,
            capability="pattern_identification",
            parameters={
                "sample_size": len(self.feedback_buffer)
            },
            priority="medium"
        )
        
        # Add to task queue
        self.task_queue.put(task)
    
    def _analyze_feedback_for_patterns(self, feedback_subset: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Analyze feedback to identify patterns"""
        # In a real implementation, this would use sophisticated analysis
        # For this demo, we just simulate pattern discovery
        
        patterns = []
        
        # Group feedback by action type
        feedback_by_action = {}
        for fb in feedback_subset:
            action = fb.get("action_type")
            if action not in feedback_by_action:
                feedback_by_action[action] = []
            feedback_by_action[action].append(fb)
        
        # Look for patterns in each action type
        for action, action_feedback in feedback_by_action.items():
            # Skip if too few samples
            if len(action_feedback) < 3:
                continue
                
            # Calculate average rating
            avg_rating = sum(fb.get("rating", 0) for fb in action_feedback) / len(action_feedback)
            
            # Skip if average rating is neutral
            if 0.4 <= avg_rating <= 0.6:
                continue
                
            # Find common elements in contexts
            contexts = [fb.get("context", {}) for fb in action_feedback]
            common_elements = self._find_common_elements(contexts)
            
            # If we found common elements, create a pattern
            if common_elements:
                pattern = {
                    "action_type": action,
                    "pattern_elements": common_elements,
                    "avg_rating": avg_rating,
                    "sample_size": len(action_feedback),
                    "confidence": min(0.5 + (len(action_feedback) / 20), 0.95)  # More samples = higher confidence
                }
                
                # Determine target capability
                if "code_review" in action:
                    capability = "code_review"
                elif "architecture" in action:
                    capability = "architecture_review"
                elif "database" in action:
                    capability = "schema_analysis"
                else:
                    capability = "general"
                    
                pattern["capability"] = capability
                patterns.append(pattern)
        
        return patterns
    
    def _find_common_elements(self, contexts: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Find common elements in a list of context dictionaries"""
        if not contexts:
            return {}
            
        # Start with the first context
        common = contexts[0].copy()
        
        # Intersect with each other context
        for context in contexts[1:]:
            # Remove keys not in this context
            for key in list(common.keys()):
                if key not in context:
                    del common[key]
                elif common[key] != context[key]:
                    del common[key]
        
        return common
    
    def _submit_pattern_as_learning_update(self, pattern: Dict[str, Any]) -> str:
        """Submit a pattern as a learning update"""
        # Generate update ID
        update_id = f"update-{uuid.uuid4()}"
        
        # Extract pattern elements and capability
        pattern_elements = pattern.get("pattern_elements", {})
        capability = pattern.get("capability", "general")
        
        # Create a learning update message
        message = ProtocolMessage(
            message_id=f"learn-{uuid.uuid4()}",
            sender_id=self.agent_id,
            recipients=["all"],  # Send to all agents
            message_type=MessageType.LEARNING_UPDATE,
            content={
                "update_type": "pattern_discovery",
                "update_id": update_id,
                "pattern": pattern_elements,
                "capability": capability,
                "effectiveness": pattern.get("avg_rating", 0.5),
                "confidence": pattern.get("confidence", 0.5)
            },
            priority=MessagePriority.LOW
        )
        
        # Add the message to the outbox
        self.outbox.put(message)
        
        # Store the pattern
        self.patterns[update_id] = pattern
        
        return update_id
    
    def _evaluate_model(self, model_id: str) -> Dict[str, Any]:
        """Evaluate a model's performance"""
        # In a real implementation, this would perform actual evaluation
        # For this demo, we just return a simulated result
        
        return {
            "model_id": model_id,
            "accuracy": 0.92,
            "response_time": {
                "avg_ms": 780,
                "p95_ms": 1200,
                "p99_ms": 1800
            },
            "cost_per_1000_tokens": 0.02,
            "reliability": 0.995,
            "strengths": [
                "Code quality assessment",
                "Architectural pattern recognition",
                "Detailed explanations"
            ],
            "weaknesses": [
                "Slowness on large codebases",
                "Occasional hallucinations in edge cases",
                "Limited multi-language support"
            ]
        }