"""
Master Control Program (MCP) Core Module

This module provides the central coordination for the MCP architecture,
which manages and orchestrates the various specialized agents in the system.
The MCP is designed as a central intelligence that delegates tasks to appropriate agents.

The enhanced version now supports the Agent-to-Agent communication protocol,
enabling specialized agents to collaborate effectively on complex assessment workflows.
It also provides a centralized experience buffer for agent learning and improvement.
"""

import logging
import threading
import time
from typing import Dict, List, Callable, Any, Optional, Union
import importlib
import os
import sys
import json
import uuid

# Agent-to-Agent protocol support
from mcp.agent_protocol import AgentCommunicationProtocol, MessageType, Message
from mcp.message_broker import MessageBroker, MessageFilter
from mcp.experience_buffer import ExperienceBuffer, Experience
from mcp.master_prompt import MasterPromptManager, MasterPrompt
from mcp.status_reporter import StatusReporter
from mcp.progress_report import ProgressReporter
from mcp.knowledge_sharing import KnowledgeSharingSystem

# Setup logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('mcp')

class MCP:
    """
    Master Control Program coordinator class
    
    This class serves as the central coordination system for the agent-based architecture,
    managing agent registration, task delegation, workflow orchestration, and inter-agent
    communication through the Agent-to-Agent protocol.
    """
    
    def __init__(self):
        """Initialize the MCP"""
        self.agents = {}  # Dictionary to store registered agents
        self.tasks = {}   # Dictionary to store active tasks
        self.task_queue = []  # Queue of pending tasks
        self.task_results = {}  # Storage for task results
        self.running = False
        self.worker_thread = None
        self.task_id_counter = 0
        self.conversations = {}  # Storage for agent conversations
        
        # Initialize message broker
        self.message_broker = MessageBroker()
        
        # Initialize experience buffer
        self.experience_buffer = ExperienceBuffer(max_size=10000, cleanup_interval=3600)
        
        # Initialize status reporter
        self.status_reporter = StatusReporter(self.message_broker)
        
        # Initialize progress reporter (integrated with status reporter)
        self.progress_reporter = ProgressReporter(self.status_reporter)
        
        # Agent-to-Agent communication protocol
        self.protocol = AgentCommunicationProtocol(self)
        
        # Master Prompt Manager
        self.master_prompt_manager = MasterPromptManager(self)
        
        # Knowledge Sharing System
        self.knowledge_sharing = KnowledgeSharingSystem(self.message_broker)
        
        # Assessment domain customization
        self.assessment_context = {
            "state": "Washington",
            "county": "Benton",
            "current_assessment_year": time.strftime("%Y"),
            "property_types": ["residential", "commercial", "agricultural", "industrial"]
        }
        
        # Initialize the default system master prompt
        self.default_master_prompt = self.master_prompt_manager.get_default_system_prompt()
        
        logger.info("MCP initialized with Agent-to-Agent protocol, experience buffer, status reporting, knowledge sharing, and master prompt system support")
    
    def register_agent(self, agent_id: str, agent_instance) -> bool:
        """Register an agent with the MCP"""
        if agent_id in self.agents:
            logger.warning(f"Agent {agent_id} already registered")
            return False
        
        self.agents[agent_id] = agent_instance
        
        # Register agent with status reporter
        self.status_reporter.register_agent(agent_id)
        
        # Register agent with knowledge sharing system
        self.knowledge_sharing.register_agent(agent_id)
        
        # First subscribe agent to the message broker
        self.message_broker.subscribe(agent_id)
        
        # Then subscribe to the broadcast topic for status updates and general messages
        self.message_broker.subscribe_to_topic(agent_id, 'broadcast')
        
        # Set up agent's protocol attributes if they don't exist
        if not hasattr(agent_instance, 'protocol'):
            # We access protocol directly instead of through agent_protocol (which doesn't exist)
            agent_instance.protocol = self.protocol
            
        # Register the agent's message handlers
        if hasattr(agent_instance, 'message_handlers'):
            for msg_type, handler in agent_instance.message_handlers.items():
                self.register_message_handler(agent_id, msg_type, handler)
                
        # Register status handler
        if hasattr(agent_instance, '_handle_status_request'):
            from mcp.agent_protocol import MessageType
            self.register_message_handler(
                agent_id, 
                MessageType.STATUS_REQUEST,  # Use the actual enum value
                agent_instance._handle_status_request
            )
        
        # Set initial agent status - using 'normal' as the default valid status level
        # Status options are typically: 'normal', 'warning', 'error', 'critical', 'blocked'
        agent_status = getattr(agent_instance, 'status', 'normal')
        # Ensure we're using a valid status level
        if agent_status not in ['normal', 'warning', 'error', 'critical', 'blocked']:
            agent_status = 'normal'
            
        self.status_reporter.set_agent_status(
            agent_id=agent_id,
            status=agent_status,
            message=f"Agent {agent_id} initialized",
            details={
                'type': agent_instance.__class__.__name__,
                'capabilities': getattr(agent_instance, 'capabilities', []),
                'registered_at': time.time()
            }
        )
        
        logger.info(f"Agent {agent_id} registered")
        return True
    
    def deregister_agent(self, agent_id: str) -> bool:
        """Remove an agent from the MCP registry"""
        if agent_id not in self.agents:
            logger.warning(f"Agent {agent_id} not registered")
            return False
        
        # Remove from agents registry
        del self.agents[agent_id]
        
        # Update status reporter
        try:
            # Set a final status message before removing
            # Using 'normal' as the status since 'deregistered' might not be a valid status level
            self.status_reporter.set_agent_status(
                agent_id=agent_id,
                status="normal",
                message=f"Agent {agent_id} was deregistered from the system",
                details={"deregistered_at": time.time()}
            )
        except Exception as e:
            logger.warning(f"Error updating status for deregistered agent {agent_id}: {str(e)}")
        
        # Unregister from knowledge sharing system
        try:
            self.knowledge_sharing.unregister_agent(agent_id)
        except Exception as e:
            logger.warning(f"Error unregistering agent {agent_id} from knowledge sharing: {str(e)}")
            
        # Unsubscribe from broadcast topic and message broker
        try:
            # First unsubscribe from all topics including 'broadcast'
            self.message_broker.unsubscribe_from_topic(agent_id, 'broadcast')
            
            # Then unsubscribe from the message broker entirely
            self.message_broker.unsubscribe(agent_id)
        except Exception as e:
            logger.warning(f"Error unsubscribing agent {agent_id} from message broker: {str(e)}")
        
        logger.info(f"Agent {agent_id} deregistered")
        return True
    
    def submit_task(self, agent_id: str, task_data: Dict[str, Any], 
                   callback: Optional[Callable] = None) -> Optional[str]:
        """Submit a task to an agent"""
        if agent_id not in self.agents:
            logger.error(f"Cannot submit task to unknown agent {agent_id}")
            return None
        
        self.task_id_counter += 1
        task_id = f"task_{self.task_id_counter}"
        
        task = {
            'id': task_id,
            'agent_id': agent_id,
            'data': task_data,
            'status': 'pending',
            'callback': callback,
            'submitted_at': time.time()
        }
        
        self.tasks[task_id] = task
        self.task_queue.append(task_id)
        logger.info(f"Task {task_id} submitted to agent {agent_id}")
        
        # Start worker thread if not already running
        if not self.running:
            self.start()
        
        return task_id
    
    def get_task_status(self, task_id: str) -> Optional[Dict[str, Any]]:
        """Get the status of a specific task"""
        if task_id not in self.tasks:
            logger.warning(f"Task {task_id} not found")
            return None
        
        return {
            'id': task_id,
            'status': self.tasks[task_id]['status'],
            'agent_id': self.tasks[task_id]['agent_id'],
            'submitted_at': self.tasks[task_id]['submitted_at']
        }
    
    def get_task_result(self, task_id: str) -> Any:
        """Get the result of a completed task"""
        if task_id not in self.task_results:
            logger.warning(f"No results for task {task_id}")
            return None
        
        return self.task_results[task_id]
    
    def start(self) -> bool:
        """Start the MCP worker thread and its components"""
        if self.running:
            logger.warning("MCP already running")
            return False
        
        # Start message broker
        self.message_broker.start()
        logger.info("Message broker started")
        
        # Start experience buffer
        self.experience_buffer.start()
        logger.info("Experience buffer started")
        
        # Start status reporter
        self.status_reporter.start()
        logger.info("Status reporter started")
        
        # Start knowledge sharing system
        self.knowledge_sharing.start()
        logger.info("Knowledge sharing system started")
        
        # Start MCP worker thread
        self.running = True
        self.worker_thread = threading.Thread(target=self._worker_loop)
        self.worker_thread.daemon = True
        self.worker_thread.start()
        logger.info("MCP worker thread started")
        return True
    
    def stop(self) -> bool:
        """Stop the MCP worker thread and its components"""
        if not self.running:
            logger.warning("MCP not running")
            return False
        
        # Stop MCP worker thread
        self.running = False
        if self.worker_thread:
            self.worker_thread.join(timeout=5.0)
        logger.info("MCP worker thread stopped")
        
        # Stop experience buffer
        self.experience_buffer.stop()
        logger.info("Experience buffer stopped")
        
        # Stop status reporter
        self.status_reporter.stop()
        logger.info("Status reporter stopped")
        
        # Stop knowledge sharing system
        self.knowledge_sharing.stop()
        logger.info("Knowledge sharing system stopped")
        
        # Stop message broker
        self.message_broker.stop()
        logger.info("Message broker stopped")
        
        return True
    
    def _worker_loop(self):
        """Main worker loop for processing tasks"""
        logger.info("Worker loop started")
        while self.running:
            if not self.task_queue:
                time.sleep(0.1)  # Sleep briefly if no tasks
                continue
            
            # Get next task
            task_id = self.task_queue.pop(0)
            task = self.tasks[task_id]
            agent_id = task['agent_id']
            
            # Update task status
            task['status'] = 'processing'
            
            # Update status reporter for task start
            self.status_reporter.set_agent_status(
                agent_id=agent_id,
                status='normal',
                message=f"Processing task {task_id}",
                details={
                    'task_id': task_id,
                    'task_type': task['data'].get('type', 'unknown'),
                    'started_at': time.time()
                }
            )
            
            try:
                # Process task
                agent = self.agents[agent_id]
                result = agent.process_task(task['data'])
                
                # Store result
                self.task_results[task_id] = result
                task['status'] = 'completed'
                task['completed_at'] = time.time()
                
                # Update status reporter for task completion
                self.status_reporter.set_agent_status(
                    agent_id=agent_id,
                    status='normal',
                    message=f"Completed task {task_id}",
                    details={
                        'task_id': task_id,
                        'task_type': task['data'].get('type', 'unknown'),
                        'completed_at': task['completed_at'],
                        'duration': task['completed_at'] - task['submitted_at']
                    }
                )
                
                # Call callback if provided
                if task['callback']:
                    try:
                        task['callback'](task_id, result)
                    except Exception as e:
                        logger.error(f"Error in task callback: {str(e)}")
                        
                        # Update status reporter for callback error
                        self.status_reporter.set_agent_status(
                            agent_id=agent_id,
                            status='warning',
                            message=f"Callback error for task {task_id}",
                            details={
                                'task_id': task_id,
                                'error': str(e)
                            }
                        )
                
            except Exception as e:
                # Update task status
                task['status'] = 'failed'
                task['error'] = str(e)
                task['failed_at'] = time.time()
                
                logger.error(f"Error processing task {task_id}: {str(e)}")
                
                # Update status reporter for task failure
                self.status_reporter.set_agent_status(
                    agent_id=agent_id,
                    status='error',
                    message=f"Failed to process task {task_id}",
                    details={
                        'task_id': task_id,
                        'error': str(e),
                        'failed_at': task['failed_at']
                    }
                )
        
        logger.info("Worker loop terminated")
    
    def get_agent(self, agent_id: str):
        """Get an agent by its ID"""
        if agent_id in self.agents:
            return self.agents[agent_id]
        return None
        
    def has_agent(self, agent_id: str) -> bool:
        """Check if an agent exists by ID
        
        Args:
            agent_id: ID of the agent to check
            
        Returns:
            True if the agent exists, False otherwise
        """
        return agent_id in self.agents
        
    def get_agent_info(self, agent_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Get information about registered agents"""
        if agent_id:
            if agent_id not in self.agents:
                return None
            agent = self.agents[agent_id]
            return {
                'id': agent_id,
                'type': agent.__class__.__name__,
                'capabilities': getattr(agent, 'capabilities', []),
                'status': getattr(agent, 'status', 'unknown')
            }
        else:
            # Return info for all agents
            return {
                agent_id: {
                    'type': agent.__class__.__name__,
                    'capabilities': getattr(agent, 'capabilities', []),
                    'status': getattr(agent, 'status', 'unknown')
                }
                for agent_id, agent in self.agents.items()
            }
            
    def get_agent_status_info(self, agent_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Get combined agent info and status information for agents
        
        Args:
            agent_id: Optional agent ID to get information for. If None, returns info for all agents.
            
        Returns:
            Dictionary with combined agent info and status information
        """
        result = {}
        
        # Determine which agents to include
        agent_ids = [agent_id] if agent_id else self.agents.keys()
        
        for aid in agent_ids:
            if aid not in self.agents:
                continue
                
            # Get basic agent info
            agent_info = self.get_agent_info(aid)
            if not agent_info:
                continue
                
            # Get status information
            status_info = self.status_reporter.get_agent_status(aid)
            
            # Combine information
            combined_info = {
                **agent_info,
                'status_info': status_info or {},
                'blockers': (aid in self.status_reporter.blockers),
                'tasks': {
                    task_id: task
                    for task_id, task in self.tasks.items()
                    if task['agent_id'] == aid
                }
            }
            
            result[aid] = combined_info
            
        return result
        
    def add_knowledge(
        self,
        agent_id: str,
        title: str,
        content: str,
        entry_type: str,
        tags: List[str] = None,
        context: Dict[str, Any] = None,
        references: List[str] = None
    ) -> Optional[str]:
        """
        Add a knowledge entry to the knowledge sharing system
        
        Args:
            agent_id: ID of the agent adding the knowledge
            title: Title or summary of the entry
            content: Main content of the entry
            entry_type: Type of knowledge (insight, error, warning, etc.)
            tags: List of tags for categorization
            context: Additional context information
            references: List of related knowledge entry IDs
            
        Returns:
            ID of the added entry, or None if there was an error
        """
        if agent_id not in self.agents:
            logger.error(f"Cannot add knowledge from unknown agent {agent_id}")
            return None
            
        try:
            entry_id = self.knowledge_sharing.add_knowledge(
                agent_id=agent_id,
                title=title,
                content=content,
                entry_type=entry_type,
                tags=tags,
                context=context,
                references=references
            )
            
            logger.info(f"Added knowledge entry {entry_id} from agent {agent_id}")
            return entry_id
        except Exception as e:
            logger.error(f"Error adding knowledge from agent {agent_id}: {str(e)}")
            return None
            
    def query_knowledge(
        self,
        agent_id: str,
        query_text: str,
        entry_type: Optional[str] = None,
        tags: Optional[List[str]] = None,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Query the knowledge base
        
        Args:
            agent_id: ID of the agent making the query
            query_text: Text to search for
            entry_type: Optional type of entries to search for
            tags: Optional tags to filter by
            limit: Maximum number of entries to return
            
        Returns:
            List of matching knowledge entries as dictionaries
        """
        if agent_id not in self.agents:
            logger.error(f"Cannot query knowledge from unknown agent {agent_id}")
            return []
            
        try:
            results = self.knowledge_sharing.query_knowledge(
                agent_id=agent_id,
                query_text=query_text,
                entry_type=entry_type,
                tags=tags,
                limit=limit
            )
            
            logger.info(f"Agent {agent_id} queried knowledge base with '{query_text}'")
            return results
        except Exception as e:
            logger.error(f"Error querying knowledge for agent {agent_id}: {str(e)}")
            return []
            
    def get_knowledge_entry(self, entry_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a specific knowledge entry
        
        Args:
            entry_id: ID of the entry to retrieve
            
        Returns:
            The entry as a dictionary, or None if not found
        """
        try:
            entry = self.knowledge_sharing.get_entry(entry_id)
            return entry
        except Exception as e:
            logger.error(f"Error retrieving knowledge entry {entry_id}: {str(e)}")
            return None
    
    def get_related_knowledge(self, entry_id: str, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Get entries related to a specific entry
        
        Args:
            entry_id: ID of the entry to find related entries for
            limit: Maximum number of entries to return
            
        Returns:
            List of related entries as dictionaries
        """
        try:
            related = self.knowledge_sharing.get_related_entries(entry_id, limit)
            return related
        except Exception as e:
            logger.error(f"Error retrieving related knowledge for entry {entry_id}: {str(e)}")
            return []
    
    def get_agent_knowledge(self, agent_id: str, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Get knowledge entries from a specific agent
        
        Args:
            agent_id: ID of the agent to get entries for
            limit: Maximum number of entries to return
            
        Returns:
            List of knowledge entries as dictionaries
        """
        if agent_id not in self.agents:
            logger.error(f"Cannot get knowledge from unknown agent {agent_id}")
            return []
            
        try:
            entries = self.knowledge_sharing.get_agent_knowledge(agent_id, limit)
            return entries
        except Exception as e:
            logger.error(f"Error retrieving knowledge for agent {agent_id}: {str(e)}")
            return []
    
    def provide_knowledge_feedback(
        self,
        agent_id: str,
        entry_id: str,
        rating: float,
        feedback_text: Optional[str] = None
    ) -> bool:
        """
        Provide feedback on a knowledge entry
        
        Args:
            agent_id: ID of the agent providing feedback
            entry_id: ID of the entry to rate
            rating: Rating (0.0 to 5.0)
            feedback_text: Optional feedback text
            
        Returns:
            True if feedback was recorded, False otherwise
        """
        if agent_id not in self.agents:
            logger.error(f"Cannot provide feedback from unknown agent {agent_id}")
            return False
            
        try:
            success = self.knowledge_sharing.provide_feedback(
                agent_id=agent_id,
                entry_id=entry_id,
                rating=rating,
                feedback_text=feedback_text
            )
            
            if success:
                logger.info(f"Agent {agent_id} provided feedback for knowledge entry {entry_id}")
            else:
                logger.warning(f"Failed to record feedback from agent {agent_id} for entry {entry_id}")
                
            return success
        except Exception as e:
            logger.error(f"Error providing knowledge feedback from agent {agent_id}: {str(e)}")
            return False
    
    def discover_agents(self, agent_dir: str = 'agents') -> List[str]:
        """Automatically discover and register available agents"""
        agent_modules = []
        
        # Get absolute path to the agent directory
        agent_path = os.path.abspath(os.path.join(os.path.dirname(__file__), agent_dir))
        
        # Add to Python path if needed
        if agent_path not in sys.path:
            sys.path.append(agent_path)
        
        # Look for Python files in the agent directory
        for file in os.listdir(agent_path):
            if file.endswith('.py') and not file.startswith('__'):
                module_name = file[:-3]  # Remove .py extension
                try:
                    # Import the module
                    import_path = f"mcp.agents.{module_name}"
                    module = importlib.import_module(import_path)
                    agent_modules.append(module_name)
                    
                    # Look for Agent classes in the module
                    for attr_name in dir(module):
                        attr = getattr(module, attr_name)
                        if (isinstance(attr, type) and 
                            attr_name.endswith('Agent') and 
                            hasattr(attr, 'process_task')):
                            
                            # Skip if it's the BaseAgent class
                            if attr_name == 'BaseAgent':
                                continue
                                
                            # Skip if already registered from direct import
                            agent_id = f"{module_name}.{attr_name}"
                            if agent_id in self.agents:
                                logger.info(f"Agent {agent_id} already registered")
                                continue
                                
                            # Create instance and register
                            agent_instance = attr()
                            self.register_agent(agent_id, agent_instance)
                
                except Exception as e:
                    logger.error(f"Error loading agent module {module_name}: {str(e)}")
        
        return agent_modules
    
    def agent_status_report(self) -> str:
        """Generate a human-readable status report of all agents"""
        if not self.agents:
            return "No agents registered."
        
        report = "MCP Agent Status Report\n"
        report += "=====================\n\n"
        
        for agent_id, agent in self.agents.items():
            report += f"Agent: {agent_id}\n"
            report += f"Type: {agent.__class__.__name__}\n"
            report += f"Status: {getattr(agent, 'status', 'unknown')}\n"
            if hasattr(agent, 'capabilities'):
                report += "Capabilities:\n"
                for capability in agent.capabilities:
                    report += f"  - {capability}\n"
            if hasattr(agent, 'last_activity'):
                report += f"Last Activity: {agent.last_activity}\n"
            report += "\n"
        
        return report

    def _initialize_agent_protocol(self, agent_id: str, agent_instance) -> None:
        """
        Initialize the protocol for a specific agent
        
        This method is now deprecated as the functionality has been moved to register_agent
        for clearer integration with agent subscription and initialization.
        
        Args:
            agent_id: ID of the agent
            agent_instance: Agent instance
        """
        # This method is no longer used and kept only for backward compatibility
        # The implementation has been moved to register_agent to fix TypeScript errors
        logger.warning("_initialize_agent_protocol is deprecated - functionality moved to register_agent")
            
    def inject_protocol(self) -> None:
        """
        Inject the protocol into all registered agents
        
        This method provides each agent with a reference to the protocol,
        enabling them to use the Agent-to-Agent communication functionality.
        """
        for agent_id, agent in self.agents.items():
            # Subscribe agent to the "broadcast" topic
            self.message_broker.subscribe_to_topic(agent_id, "broadcast")
            
            # Add protocol to agent if it has the proper interface
            if hasattr(agent, 'send_query') and hasattr(agent, 'send_inform') and hasattr(agent, 'send_request'):
                # Inject the protocol into the agent's methods
                agent.send_query.__defaults__ = agent.send_query.__defaults__[:-1] + (self.protocol,)
                agent.send_inform.__defaults__ = agent.send_inform.__defaults__[:-1] + (self.protocol,)
                agent.send_request.__defaults__ = agent.send_request.__defaults__[:-1] + (self.protocol,)
                
                logger.info(f"Injected protocol into agent {agent_id}")
                
                # Register default message handlers if they exist
                if hasattr(agent, '_handle_query'):
                    self.protocol.register_message_handler(
                        agent_id,
                        MessageType.QUERY,
                        agent._handle_query
                    )
                
                if hasattr(agent, '_handle_inform'):
                    self.protocol.register_message_handler(
                        agent_id,
                        MessageType.INFORM,
                        agent._handle_inform
                    )
                
                if hasattr(agent, '_handle_request'):
                    self.protocol.register_message_handler(
                        agent_id,
                        MessageType.REQUEST,
                        agent._handle_request
                    )
    
    def register_message_handler(
        self, 
        agent_id: str, 
        message_type: Union[str, MessageType], 
        handler: Callable
    ) -> bool:
        """
        Register a message handler for an agent
        
        Args:
            agent_id: ID of the agent
            message_type: Type of message to handle
            handler: Function to call when a message of this type is received
            
        Returns:
            True if handler registered successfully, False otherwise
        """
        if agent_id not in self.agents:
            logger.error(f"Cannot register handler for unknown agent {agent_id}")
            return False
        
        # Convert string message types to enum if needed
        if isinstance(message_type, str):
            try:
                message_type = MessageType(message_type)
            except ValueError:
                logger.error(f"Invalid message type: {message_type}")
                return False
        
        self.protocol.register_message_handler(agent_id, message_type, handler)
        logger.info(f"Registered {message_type.value if isinstance(message_type, MessageType) else message_type} handler for agent {agent_id}")
        return True
    
    def send_agent_message(
        self,
        sender_id: str,
        receiver_id: str,
        message_type: Union[str, MessageType],
        content: Dict[str, Any],
        wait_for_response: bool = False,
        timeout: float = 30.0
    ) -> Optional[Any]:
        """
        Send a message from one agent to another
        
        Args:
            sender_id: ID of the sending agent
            receiver_id: ID of the receiving agent
            message_type: Type of message to send
            content: Content of the message (should be a dictionary)
            wait_for_response: Whether to wait for a response
            timeout: Timeout in seconds when waiting for response
            
        Returns:
            Response message if wait_for_response is True, otherwise None
        """
        if sender_id not in self.agents:
            logger.error(f"Unknown sending agent {sender_id}")
            return None
        
        if receiver_id not in self.agents and receiver_id != "broadcast":
            logger.error(f"Unknown receiving agent {receiver_id}")
            return None
        
        try:
            # Create the message
            message = Message(
                source_agent_id=sender_id,
                target_agent_id=receiver_id,
                message_type=message_type,
                payload=content
            )
            
            # Send through the protocol
            result = self.protocol.send_message(
                message=message,
                wait_for_response=wait_for_response,
                timeout=timeout
            )
            
            return result
        except Exception as e:
            logger.error(f"Error sending message from {sender_id} to {receiver_id}: {str(e)}")
            return None
    
    def create_conversation(
        self,
        initiator_id: str,
        responder_id: str,
        topic: str
    ) -> Optional[str]:
        """
        Create a conversation between two agents
        
        Args:
            initiator_id: ID of the initiating agent
            responder_id: ID of the responding agent
            topic: Topic of the conversation
            
        Returns:
            Conversation ID if successful, None otherwise
        """
        if initiator_id not in self.agents:
            logger.error(f"Unknown initiating agent {initiator_id}")
            return None
        
        if responder_id not in self.agents:
            logger.error(f"Unknown responding agent {responder_id}")
            return None
        
        try:
            conversation_id = self.protocol.create_conversation(
                initiator_id=initiator_id,
                responder_id=responder_id,
                topic=topic
            )
            
            logger.info(f"Created conversation {conversation_id} between {initiator_id} and {responder_id}")
            return conversation_id
        except Exception as e:
            logger.error(f"Error creating conversation: {str(e)}")
            return None
    
    def get_conversation(self, conversation_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a conversation by ID
        
        Args:
            conversation_id: ID of the conversation
            
        Returns:
            Conversation data if found, None otherwise
        """
        try:
            conversation = self.protocol.get_conversation(conversation_id)
            if conversation:
                return conversation.to_dict()
            return None
        except Exception as e:
            logger.error(f"Error getting conversation {conversation_id}: {str(e)}")
            return None
    
    def distribute_master_prompt(self, prompt_id: Optional[str] = None) -> bool:
        """
        Distribute a master prompt to all registered agents
        
        This is a centralized function to broadcast a specific master prompt 
        to all agents, ensuring system-wide consistency in agent behavior
        and coordination.
        
        Args:
            prompt_id: ID of the prompt to distribute (default: the system default prompt)
            
        Returns:
            True if distribution was successful, False otherwise
        """
        try:
            # Use default prompt if none specified
            if prompt_id is None:
                prompt = self.default_master_prompt
            else:
                prompt = self.master_prompt_manager.get_prompt(prompt_id)
            
            # Register all agents for this prompt
            for agent_id in self.agents.keys():
                self.master_prompt_manager.register_agent(agent_id, prompt.prompt_id)
            
            logger.info(f"Distributed master prompt {prompt.prompt_id} to {len(self.agents)} agents")
            return True
        except Exception as e:
            logger.error(f"Error distributing master prompt: {str(e)}")
            return False
    
    def delegate_task(self, agent_id: str, task_data: Dict[str, Any], 
                  callback: Optional[Callable] = None) -> Optional[str]:
        """
        Delegate a task to a specific agent (alias for submit_task for backwards compatibility)
        
        Args:
            agent_id: ID of the agent to delegate the task to
            task_data: Data for the task
            callback: Optional callback function to call when the task is complete
            
        Returns:
            Task ID if the task was submitted successfully, None otherwise
        """
        return self.submit_task(agent_id, task_data, callback)
    
    def register_workflow_agent(self, agent_type: str) -> str:
        """
        Register a specialized assessment agent with the MCP
        
        Args:
            agent_type: Type of agent to register
            
        Returns:
            ID of the registered agent
        """
        try:
            # Import the agent class
            module_path = f"mcp.agents.{agent_type}_agent"
            class_name = f"{agent_type.title().replace('_', '')}Agent"
            
            module = importlib.import_module(module_path)
            agent_class = getattr(module, class_name)
            
            # Create and register the agent
            agent = agent_class()
            agent_id = agent_type
            
            self.register_agent(agent_id, agent)
            
            # Inject protocol
            self.inject_protocol()
            
            return agent_id
        except Exception as e:
            logger.error(f"Error registering workflow agent {agent_type}: {str(e)}")
            return ""


# Create a global instance
mcp_instance = MCP()