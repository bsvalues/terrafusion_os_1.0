"""
Collective Intelligence System

This module implements the collective agent intelligence system,
enabling collaborative problem solving and consensus-based verification.
"""
import os
import json
import logging
import time
import uuid
import threading
import queue
from enum import Enum
from typing import Dict, List, Any, Optional, Union, Callable, Set, Tuple

class AgentRole(Enum):
    """Possible roles for agents in the system."""
    CODE_QUALITY = "code_quality"
    ARCHITECTURE = "architecture"
    DATABASE = "database"
    DOCUMENTATION = "documentation"
    SECURITY = "security"
    PERFORMANCE = "performance"
    TESTING = "testing"
    COORDINATOR = "coordinator"
    REASONING = "reasoning"


class CollaborationMode(Enum):
    """Possible collaboration modes between agents."""
    INDEPENDENT = "independent"  # Agents work independently
    SEQUENTIAL = "sequential"    # Agents work in sequence
    PARALLEL = "parallel"        # Agents work in parallel
    CONSENSUS = "consensus"      # Agents work to reach consensus
    DEBATE = "debate"            # Agents debate to solve a problem


class MessageType(Enum):
    """Types of messages exchanged between agents."""
    TASK_ASSIGNMENT = "task_assignment"
    TASK_RESULT = "task_result"
    QUERY = "query"
    RESPONSE = "response"
    PROPOSAL = "proposal"
    FEEDBACK = "feedback"
    CONSENSUS_REQUEST = "consensus_request"
    CONSENSUS_VOTE = "consensus_vote"
    DEBATE_ARGUMENT = "debate_argument"
    INFORMATION_SHARING = "information_sharing"
    ERROR = "error"


class TaskStatus(Enum):
    """Possible statuses for a task."""
    PENDING = "pending"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class ConsensusStatus(Enum):
    """Possible statuses for a consensus process."""
    INITIALIZING = "initializing"
    COLLECTING_VOTES = "collecting_votes"
    ANALYZING_RESULTS = "analyzing_results"
    CONSENSUS_REACHED = "consensus_reached"
    CONSENSUS_FAILED = "consensus_failed"


class DebateStatus(Enum):
    """Possible statuses for a debate process."""
    INITIALIZING = "initializing"
    PRESENTING_ARGUMENTS = "presenting_arguments"
    COUNTER_ARGUMENTS = "counter_arguments"
    REFINING_POSITIONS = "refining_positions"
    REACHING_CONCLUSION = "reaching_conclusion"
    CONCLUSION_REACHED = "conclusion_reached"
    DEBATE_FAILED = "debate_failed"


class Agent:
    """
    Represents an agent in the collective intelligence system.
    
    This is a lightweight representation used by the orchestrator,
    not the actual agent implementation.
    """
    
    def __init__(self, agent_id: str, name: str, role: AgentRole, 
                capabilities: List[str], endpoint: str):
        """
        Initialize an agent.
        
        Args:
            agent_id: Unique identifier for the agent
            name: Human-readable name
            role: Agent's role in the system
            capabilities: List of agent capabilities
            endpoint: Communication endpoint for the agent
        """
        self.id = agent_id
        self.name = name
        self.role = role
        self.capabilities = capabilities
        self.endpoint = endpoint
        self.status = "idle"
        self.current_task = None
        self.last_heartbeat = time.time()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert agent to a dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'role': self.role.value,
            'capabilities': self.capabilities,
            'endpoint': self.endpoint,
            'status': self.status,
            'current_task': self.current_task,
            'last_heartbeat': self.last_heartbeat
        }


class Task:
    """
    Represents a task in the collective intelligence system.
    """
    
    def __init__(self, task_id: str, task_type: str, description: str,
                data: Dict[str, Any], required_capabilities: List[str],
                priority: int = 5, deadline: Optional[float] = None):
        """
        Initialize a task.
        
        Args:
            task_id: Unique identifier for the task
            task_type: Type of task
            description: Human-readable description
            data: Task data/parameters
            required_capabilities: Capabilities required to complete the task
            priority: Task priority (1-10, higher is more important)
            deadline: Optional deadline timestamp
        """
        self.id = task_id
        self.type = task_type
        self.description = description
        self.data = data
        self.required_capabilities = required_capabilities
        self.priority = priority
        self.deadline = deadline
        self.status = TaskStatus.PENDING
        self.assigned_agent = None
        self.created_at = time.time()
        self.started_at = None
        self.completed_at = None
        self.result = None
        self.error = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert task to a dictionary."""
        return {
            'id': self.id,
            'type': self.type,
            'description': self.description,
            'data': self.data,
            'required_capabilities': self.required_capabilities,
            'priority': self.priority,
            'deadline': self.deadline,
            'status': self.status.value,
            'assigned_agent': self.assigned_agent,
            'created_at': self.created_at,
            'started_at': self.started_at,
            'completed_at': self.completed_at,
            'result': self.result,
            'error': self.error
        }


class Message:
    """
    Represents a message exchanged between agents.
    """
    
    def __init__(self, message_id: str, message_type: MessageType,
                sender: str, recipients: List[str],
                content: Dict[str, Any], correlation_id: Optional[str] = None,
                expires_at: Optional[float] = None):
        """
        Initialize a message.
        
        Args:
            message_id: Unique identifier for the message
            message_type: Type of message
            sender: ID of the sending agent
            recipients: List of recipient agent IDs
            content: Message content
            correlation_id: Optional correlation ID for message threads
            expires_at: Optional expiration timestamp
        """
        self.id = message_id
        self.type = message_type
        self.sender = sender
        self.recipients = recipients
        self.content = content
        self.correlation_id = correlation_id
        self.created_at = time.time()
        self.expires_at = expires_at
        self.delivered = False
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert message to a dictionary."""
        return {
            'id': self.id,
            'type': self.type.value,
            'sender': self.sender,
            'recipients': self.recipients,
            'content': self.content,
            'correlation_id': self.correlation_id,
            'created_at': self.created_at,
            'expires_at': self.expires_at,
            'delivered': self.delivered
        }


class ConsensusProcess:
    """
    Represents a consensus-building process between agents.
    """
    
    def __init__(self, process_id: str, topic: str, description: str,
                options: List[Dict[str, Any]], participants: List[str],
                threshold: float = 0.7, deadline: Optional[float] = None):
        """
        Initialize a consensus process.
        
        Args:
            process_id: Unique identifier for the process
            topic: Topic of consensus
            description: Description of what consensus is needed for
            options: List of possible options to choose from
            participants: List of participating agent IDs
            threshold: Consensus threshold (e.g., 0.7 for 70% agreement)
            deadline: Optional deadline timestamp
        """
        self.id = process_id
        self.topic = topic
        self.description = description
        self.options = options
        self.participants = participants
        self.threshold = threshold
        self.deadline = deadline
        self.status = ConsensusStatus.INITIALIZING
        self.created_at = time.time()
        self.completed_at = None
        self.votes = {}  # agent_id -> option_id
        self.result = None
        self.message_thread = []
    
    def add_vote(self, agent_id: str, option_id: str, 
                confidence: float, explanation: Optional[str] = None) -> None:
        """
        Add a vote from an agent.
        
        Args:
            agent_id: ID of the voting agent
            option_id: ID of the chosen option
            confidence: Confidence in the vote (0.0 to 1.0)
            explanation: Optional explanation for the vote
        """
        self.votes[agent_id] = {
            'option_id': option_id,
            'confidence': confidence,
            'explanation': explanation,
            'timestamp': time.time()
        }
    
    def calculate_consensus(self) -> Dict[str, Any]:
        """
        Calculate the current consensus state.
        
        Returns:
            Consensus calculation results
        """
        if not self.votes:
            return {
                'reached': False,
                'option_id': None,
                'agreement_level': 0.0,
                'vote_count': 0,
                'total_participants': len(self.participants)
            }
        
        # Count votes for each option
        vote_counts = {}
        for option in self.options:
            option_id = option['id']
            vote_counts[option_id] = 0
        
        for vote in self.votes.values():
            option_id = vote['option_id']
            vote_counts[option_id] += 1
        
        # Find the option with the most votes
        max_votes = 0
        max_option = None
        
        for option_id, count in vote_counts.items():
            if count > max_votes:
                max_votes = count
                max_option = option_id
        
        # Calculate agreement level
        agreement_level = max_votes / len(self.participants)
        
        # Check if consensus threshold is reached
        consensus_reached = agreement_level >= self.threshold
        
        return {
            'reached': consensus_reached,
            'option_id': max_option,
            'agreement_level': agreement_level,
            'vote_count': len(self.votes),
            'total_participants': len(self.participants),
            'vote_counts': vote_counts
        }
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert consensus process to a dictionary."""
        return {
            'id': self.id,
            'topic': self.topic,
            'description': self.description,
            'options': self.options,
            'participants': self.participants,
            'threshold': self.threshold,
            'deadline': self.deadline,
            'status': self.status.value,
            'created_at': self.created_at,
            'completed_at': self.completed_at,
            'votes': self.votes,
            'result': self.result,
            'message_thread': [m.to_dict() for m in self.message_thread] if self.message_thread else []
        }


class DebateProcess:
    """
    Represents a debate process between agents.
    """
    
    def __init__(self, process_id: str, topic: str, description: str,
                question: str, participants: List[str],
                max_rounds: int = 3, deadline: Optional[float] = None):
        """
        Initialize a debate process.
        
        Args:
            process_id: Unique identifier for the process
            topic: Topic of debate
            description: Description of the debate purpose
            question: Question to debate
            participants: List of participating agent IDs
            max_rounds: Maximum number of debate rounds
            deadline: Optional deadline timestamp
        """
        self.id = process_id
        self.topic = topic
        self.description = description
        self.question = question
        self.participants = participants
        self.max_rounds = max_rounds
        self.deadline = deadline
        self.status = DebateStatus.INITIALIZING
        self.created_at = time.time()
        self.completed_at = None
        self.current_round = 0
        self.arguments = {}  # agent_id -> list of arguments
        self.conclusion = None
        self.message_thread = []
    
    def add_argument(self, agent_id: str, argument: str, 
                    evidence: Optional[List[Dict[str, Any]]] = None,
                    counter_to: Optional[str] = None) -> str:
        """
        Add an argument to the debate.
        
        Args:
            agent_id: ID of the agent making the argument
            argument: The argument text
            evidence: Optional supporting evidence
            counter_to: Optional ID of argument this counters
            
        Returns:
            ID of the new argument
        """
        argument_id = str(uuid.uuid4())
        
        if agent_id not in self.arguments:
            self.arguments[agent_id] = []
        
        self.arguments[agent_id].append({
            'id': argument_id,
            'text': argument,
            'evidence': evidence or [],
            'counter_to': counter_to,
            'timestamp': time.time(),
            'round': self.current_round
        })
        
        return argument_id
    
    def advance_round(self) -> bool:
        """
        Advance to the next debate round.
        
        Returns:
            Success flag
        """
        if self.current_round >= self.max_rounds:
            return False
        
        self.current_round += 1
        
        # Update status based on round
        if self.current_round == 1:
            self.status = DebateStatus.PRESENTING_ARGUMENTS
        elif self.current_round == 2:
            self.status = DebateStatus.COUNTER_ARGUMENTS
        elif self.current_round == self.max_rounds - 1:
            self.status = DebateStatus.REFINING_POSITIONS
        elif self.current_round == self.max_rounds:
            self.status = DebateStatus.REACHING_CONCLUSION
        
        return True
    
    def set_conclusion(self, conclusion: str, supporting_arguments: List[str],
                      confidence: float) -> None:
        """
        Set the conclusion of the debate.
        
        Args:
            conclusion: Conclusion text
            supporting_arguments: List of supporting argument IDs
            confidence: Confidence in the conclusion (0.0 to 1.0)
        """
        self.conclusion = {
            'text': conclusion,
            'supporting_arguments': supporting_arguments,
            'confidence': confidence,
            'timestamp': time.time()
        }
        
        self.status = DebateStatus.CONCLUSION_REACHED
        self.completed_at = time.time()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert debate process to a dictionary."""
        return {
            'id': self.id,
            'topic': self.topic,
            'description': self.description,
            'question': self.question,
            'participants': self.participants,
            'max_rounds': self.max_rounds,
            'deadline': self.deadline,
            'status': self.status.value,
            'created_at': self.created_at,
            'completed_at': self.completed_at,
            'current_round': self.current_round,
            'arguments': self.arguments,
            'conclusion': self.conclusion,
            'message_thread': [m.to_dict() for m in self.message_thread] if self.message_thread else []
        }


class TaskOrchestrator:
    """
    Orchestrates task assignment and execution across agents.
    """
    
    def __init__(self, communication_service: Any):
        """
        Initialize the task orchestrator.
        
        Args:
            communication_service: Service for agent communication
        """
        self.communication_service = communication_service
        self.tasks = {}  # task_id -> Task
        self.pending_tasks = queue.PriorityQueue()  # (priority, deadline, created_at, task_id)
        self.agents = {}  # agent_id -> Agent
        self.capability_index = {}  # capability -> set of agent_ids
        self.logger = logging.getLogger('task_orchestrator')
        
        # Start background thread for task assignment
        self.shutdown_flag = threading.Event()
        self.assignment_thread = threading.Thread(target=self._assignment_loop)
        self.assignment_thread.daemon = True
        self.assignment_thread.start()
    
    def register_agent(self, agent: Agent) -> None:
        """
        Register an agent with the orchestrator.
        
        Args:
            agent: Agent to register
        """
        self.agents[agent.id] = agent
        
        # Update capability index
        for capability in agent.capabilities:
            if capability not in self.capability_index:
                self.capability_index[capability] = set()
            
            self.capability_index[capability].add(agent.id)
        
        self.logger.info(f"Registered agent: {agent.name} (ID: {agent.id}, Role: {agent.role.value})")
    
    def deregister_agent(self, agent_id: str) -> bool:
        """
        Deregister an agent from the orchestrator.
        
        Args:
            agent_id: ID of the agent to deregister
            
        Returns:
            Deregistration success
        """
        if agent_id not in self.agents:
            return False
        
        agent = self.agents[agent_id]
        
        # Remove from capability index
        for capability in agent.capabilities:
            if capability in self.capability_index:
                self.capability_index[capability].discard(agent_id)
        
        # Remove agent
        del self.agents[agent_id]
        
        self.logger.info(f"Deregistered agent: {agent.name} (ID: {agent_id})")
        return True
    
    def update_agent_status(self, agent_id: str, status: str) -> bool:
        """
        Update an agent's status.
        
        Args:
            agent_id: ID of the agent
            status: New status
            
        Returns:
            Update success
        """
        if agent_id not in self.agents:
            return False
        
        self.agents[agent_id].status = status
        self.agents[agent_id].last_heartbeat = time.time()
        
        return True
    
    def submit_task(self, task: Task) -> str:
        """
        Submit a task to the orchestrator.
        
        Args:
            task: Task to submit
            
        Returns:
            Task ID
        """
        # Generate ID if not provided
        if not task.id:
            task.id = str(uuid.uuid4())
        
        # Store task
        self.tasks[task.id] = task
        
        # Add to priority queue
        priority_tuple = (
            -task.priority,  # Negate for max-priority queue
            task.deadline or float('inf'),  # Earlier deadlines first
            task.created_at,  # Earlier creation time wins ties
            task.id
        )
        self.pending_tasks.put(priority_tuple)
        
        self.logger.info(f"Submitted task: {task.type} (ID: {task.id}, Priority: {task.priority})")
        
        return task.id
    
    def get_task(self, task_id: str) -> Optional[Task]:
        """
        Get a task by ID.
        
        Args:
            task_id: ID of the task
            
        Returns:
            Task or None if not found
        """
        return self.tasks.get(task_id)
    
    def cancel_task(self, task_id: str) -> bool:
        """
        Cancel a task.
        
        Args:
            task_id: ID of the task to cancel
            
        Returns:
            Cancellation success
        """
        if task_id not in self.tasks:
            return False
        
        task = self.tasks[task_id]
        
        # Check if task can be cancelled
        if task.status in [TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.CANCELLED]:
            return False
        
        # If task is assigned, notify the agent
        if task.status == TaskStatus.ASSIGNED and task.assigned_agent:
            self._send_cancel_notification(task)
        
        # Update task status
        task.status = TaskStatus.CANCELLED
        
        self.logger.info(f"Cancelled task: {task.type} (ID: {task_id})")
        return True
    
    def _send_cancel_notification(self, task: Task) -> None:
        """
        Send cancellation notification to an agent.
        
        Args:
            task: Task to cancel
        """
        message = Message(
            message_id=str(uuid.uuid4()),
            message_type=MessageType.TASK_ASSIGNMENT,
            sender="task_orchestrator",
            recipients=[task.assigned_agent],
            content={
                'action': 'cancel',
                'task_id': task.id
            }
        )
        
        self.communication_service.send_message(message)
    
    def update_task_status(self, task_id: str, status: TaskStatus, 
                         result: Optional[Dict[str, Any]] = None,
                         error: Optional[str] = None) -> bool:
        """
        Update a task's status.
        
        Args:
            task_id: ID of the task
            status: New status
            result: Optional task result
            error: Optional error message
            
        Returns:
            Update success
        """
        if task_id not in self.tasks:
            return False
        
        task = self.tasks[task_id]
        
        # Update task
        task.status = status
        
        if status == TaskStatus.IN_PROGRESS and not task.started_at:
            task.started_at = time.time()
        
        if status == TaskStatus.COMPLETED:
            task.completed_at = time.time()
            task.result = result
        
        if status == TaskStatus.FAILED:
            task.completed_at = time.time()
            task.error = error
        
        self.logger.info(f"Updated task {task_id} status to {status.value}")
        return True
    
    def find_capable_agents(self, capabilities: List[str]) -> List[Agent]:
        """
        Find agents capable of handling specific capabilities.
        
        Args:
            capabilities: List of required capabilities
            
        Returns:
            List of capable agents
        """
        if not capabilities:
            return list(self.agents.values())
        
        # Find agents with all required capabilities
        capable_agent_ids = None
        
        for capability in capabilities:
            if capability in self.capability_index:
                agent_ids = self.capability_index[capability]
                
                if capable_agent_ids is None:
                    capable_agent_ids = agent_ids.copy()
                else:
                    capable_agent_ids &= agent_ids
            else:
                # If any capability has no agents, return empty list
                return []
        
        # Convert to list of agents
        return [self.agents[agent_id] for agent_id in capable_agent_ids or []]
    
    def _assignment_loop(self) -> None:
        """Background loop for assigning tasks to agents."""
        while not self.shutdown_flag.is_set():
            try:
                # If no pending tasks, wait and continue
                if self.pending_tasks.empty():
                    time.sleep(1)
                    continue
                
                # Get the highest priority task
                try:
                    # Use get_nowait to avoid blocking
                    _, _, _, task_id = self.pending_tasks.get_nowait()
                except queue.Empty:
                    # No tasks available
                    time.sleep(1)
                    continue
                
                # Check if task still exists and is pending
                if task_id not in self.tasks:
                    continue
                
                task = self.tasks[task_id]
                if task.status != TaskStatus.PENDING:
                    continue
                
                # Find capable agents
                capable_agents = self.find_capable_agents(task.required_capabilities)
                if not capable_agents:
                    # No capable agents, put back in queue with lower priority
                    new_priority = max(-10, -task.priority - 1)  # Limit to -10
                    priority_tuple = (
                        new_priority,
                        task.deadline or float('inf'),
                        task.created_at,
                        task.id
                    )
                    self.pending_tasks.put(priority_tuple)
                    
                    self.logger.warning(f"No capable agents for task {task_id}, reducing priority")
                    
                    # Wait before trying again
                    time.sleep(5)
                    continue
                
                # Find the best agent (simple strategy: first available)
                assigned = False
                for agent in capable_agents:
                    if agent.status == "idle":
                        # Assign task to this agent
                        self._assign_task_to_agent(task, agent)
                        assigned = True
                        break
                
                if not assigned:
                    # No available agents, put back in queue
                    priority_tuple = (
                        -task.priority,
                        task.deadline or float('inf'),
                        task.created_at,
                        task.id
                    )
                    self.pending_tasks.put(priority_tuple)
                    
                    # Wait before trying again
                    time.sleep(1)
            
            except Exception as e:
                self.logger.error(f"Error in task assignment loop: {str(e)}")
                time.sleep(1)
    
    def _assign_task_to_agent(self, task: Task, agent: Agent) -> None:
        """
        Assign a task to an agent.
        
        Args:
            task: Task to assign
            agent: Agent to assign to
        """
        # Update task
        task.status = TaskStatus.ASSIGNED
        task.assigned_agent = agent.id
        
        # Update agent
        agent.status = "busy"
        agent.current_task = task.id
        
        # Send assignment message
        message = Message(
            message_id=str(uuid.uuid4()),
            message_type=MessageType.TASK_ASSIGNMENT,
            sender="task_orchestrator",
            recipients=[agent.id],
            content={
                'action': 'assign',
                'task': task.to_dict()
            }
        )
        
        self.communication_service.send_message(message)
        
        self.logger.info(f"Assigned task {task.id} to agent {agent.id}")
    
    def shutdown(self) -> None:
        """Shutdown the task orchestrator."""
        self.shutdown_flag.set()
        self.assignment_thread.join(timeout=5)
        self.logger.info("Task orchestrator shutdown complete")


class CollaborationOrchestrator:
    """
    Orchestrates collaboration between agents.
    """
    
    def __init__(self, communication_service: Any):
        """
        Initialize the collaboration orchestrator.
        
        Args:
            communication_service: Service for agent communication
        """
        self.communication_service = communication_service
        self.consensus_processes = {}  # process_id -> ConsensusProcess
        self.debate_processes = {}  # process_id -> DebateProcess
        self.logger = logging.getLogger('collaboration_orchestrator')
        
        # Start background threads
        self.shutdown_flag = threading.Event()
        self.consensus_thread = threading.Thread(target=self._consensus_loop)
        self.consensus_thread.daemon = True
        self.consensus_thread.start()
        
        self.debate_thread = threading.Thread(target=self._debate_loop)
        self.debate_thread.daemon = True
        self.debate_thread.start()
    
    def start_consensus_process(self, topic: str, description: str,
                              options: List[Dict[str, Any]], participants: List[str],
                              threshold: float = 0.7, deadline: Optional[float] = None) -> str:
        """
        Start a new consensus process.
        
        Args:
            topic: Topic of consensus
            description: Description of what consensus is needed for
            options: List of possible options to choose from
            participants: List of participating agent IDs
            threshold: Consensus threshold (e.g., 0.7 for 70% agreement)
            deadline: Optional deadline timestamp
            
        Returns:
            Process ID
        """
        # Generate ID
        process_id = str(uuid.uuid4())
        
        # Create process
        process = ConsensusProcess(
            process_id=process_id,
            topic=topic,
            description=description,
            options=options,
            participants=participants,
            threshold=threshold,
            deadline=deadline
        )
        
        # Store process
        self.consensus_processes[process_id] = process
        
        # Start the process
        self._init_consensus_process(process)
        
        self.logger.info(f"Started consensus process: {topic} (ID: {process_id})")
        return process_id
    
    def _init_consensus_process(self, process: ConsensusProcess) -> None:
        """
        Initialize a consensus process.
        
        Args:
            process: Consensus process to initialize
        """
        # Create initial message
        message = Message(
            message_id=str(uuid.uuid4()),
            message_type=MessageType.CONSENSUS_REQUEST,
            sender="collaboration_orchestrator",
            recipients=process.participants,
            content={
                'process_id': process.id,
                'topic': process.topic,
                'description': process.description,
                'options': process.options
            },
            correlation_id=process.id
        )
        
        # Add to message thread
        process.message_thread.append(message)
        
        # Send message
        self.communication_service.send_message(message)
        
        # Update status
        process.status = ConsensusStatus.COLLECTING_VOTES
    
    def submit_consensus_vote(self, process_id: str, agent_id: str, option_id: str,
                            confidence: float, explanation: Optional[str] = None) -> bool:
        """
        Submit a vote for a consensus process.
        
        Args:
            process_id: ID of the consensus process
            agent_id: ID of the voting agent
            option_id: ID of the chosen option
            confidence: Confidence in the vote (0.0 to 1.0)
            explanation: Optional explanation for the vote
            
        Returns:
            Submission success
        """
        if process_id not in self.consensus_processes:
            return False
        
        process = self.consensus_processes[process_id]
        
        # Check if agent is a participant
        if agent_id not in process.participants:
            return False
        
        # Check if process is still collecting votes
        if process.status != ConsensusStatus.COLLECTING_VOTES:
            return False
        
        # Add vote
        process.add_vote(agent_id, option_id, confidence, explanation)
        
        # Check if all votes are in
        if len(process.votes) == len(process.participants):
            process.status = ConsensusStatus.ANALYZING_RESULTS
        
        self.logger.info(f"Submitted vote for consensus process {process_id} from agent {agent_id}")
        return True
    
    def get_consensus_process(self, process_id: str) -> Optional[ConsensusProcess]:
        """
        Get a consensus process by ID.
        
        Args:
            process_id: ID of the process
            
        Returns:
            Process or None if not found
        """
        return self.consensus_processes.get(process_id)
    
    def _consensus_loop(self) -> None:
        """Background loop for managing consensus processes."""
        while not self.shutdown_flag.is_set():
            try:
                # Process each consensus process
                for process_id, process in list(self.consensus_processes.items()):
                    # Skip completed processes
                    if process.status in [ConsensusStatus.CONSENSUS_REACHED, ConsensusStatus.CONSENSUS_FAILED]:
                        continue
                    
                    # Check for deadline
                    if process.deadline and time.time() > process.deadline:
                        self._finalize_consensus_process(process, False, "Deadline expired")
                        continue
                    
                    # If analyzing results, calculate consensus
                    if process.status == ConsensusStatus.ANALYZING_RESULTS:
                        consensus_result = process.calculate_consensus()
                        
                        if consensus_result['reached']:
                            # Consensus reached
                            self._finalize_consensus_process(process, True, consensus_result)
                        elif len(process.votes) == len(process.participants):
                            # All votes in but no consensus
                            self._finalize_consensus_process(process, False, "No consensus reached")
                
                # Sleep to avoid busy waiting
                time.sleep(1)
            
            except Exception as e:
                self.logger.error(f"Error in consensus loop: {str(e)}")
                time.sleep(1)
    
    def _finalize_consensus_process(self, process: ConsensusProcess, success: bool,
                                  result: Union[Dict[str, Any], str]) -> None:
        """
        Finalize a consensus process.
        
        Args:
            process: Consensus process to finalize
            success: Whether consensus was successful
            result: Consensus result or failure reason
        """
        # Update process status and result
        process.status = ConsensusStatus.CONSENSUS_REACHED if success else ConsensusStatus.CONSENSUS_FAILED
        process.completed_at = time.time()
        process.result = result
        
        # Create result message
        message = Message(
            message_id=str(uuid.uuid4()),
            message_type=MessageType.CONSENSUS_VOTE,
            sender="collaboration_orchestrator",
            recipients=process.participants,
            content={
                'process_id': process.id,
                'success': success,
                'result': result
            },
            correlation_id=process.id
        )
        
        # Add to message thread
        process.message_thread.append(message)
        
        # Send message
        self.communication_service.send_message(message)
        
        self.logger.info(f"Finalized consensus process {process.id}: {'Success' if success else 'Failed'}")
    
    def start_debate_process(self, topic: str, description: str,
                           question: str, participants: List[str],
                           max_rounds: int = 3, deadline: Optional[float] = None) -> str:
        """
        Start a new debate process.
        
        Args:
            topic: Topic of debate
            description: Description of the debate purpose
            question: Question to debate
            participants: List of participating agent IDs
            max_rounds: Maximum number of debate rounds
            deadline: Optional deadline timestamp
            
        Returns:
            Process ID
        """
        # Generate ID
        process_id = str(uuid.uuid4())
        
        # Create process
        process = DebateProcess(
            process_id=process_id,
            topic=topic,
            description=description,
            question=question,
            participants=participants,
            max_rounds=max_rounds,
            deadline=deadline
        )
        
        # Store process
        self.debate_processes[process_id] = process
        
        # Start the process
        self._init_debate_process(process)
        
        self.logger.info(f"Started debate process: {topic} (ID: {process_id})")
        return process_id
    
    def _init_debate_process(self, process: DebateProcess) -> None:
        """
        Initialize a debate process.
        
        Args:
            process: Debate process to initialize
        """
        # Create initial message
        message = Message(
            message_id=str(uuid.uuid4()),
            message_type=MessageType.DEBATE_ARGUMENT,
            sender="collaboration_orchestrator",
            recipients=process.participants,
            content={
                'process_id': process.id,
                'topic': process.topic,
                'description': process.description,
                'question': process.question,
                'round': 0,
                'action': 'start'
            },
            correlation_id=process.id
        )
        
        # Add to message thread
        process.message_thread.append(message)
        
        # Send message
        self.communication_service.send_message(message)
        
        # Update status and advance to first round
        process.status = DebateStatus.INITIALIZING
        process.advance_round()
    
    def submit_debate_argument(self, process_id: str, agent_id: str, argument: str,
                             evidence: Optional[List[Dict[str, Any]]] = None,
                             counter_to: Optional[str] = None) -> Optional[str]:
        """
        Submit an argument for a debate process.
        
        Args:
            process_id: ID of the debate process
            agent_id: ID of the agent making the argument
            argument: The argument text
            evidence: Optional supporting evidence
            counter_to: Optional ID of argument this counters
            
        Returns:
            Argument ID or None if submission failed
        """
        if process_id not in self.debate_processes:
            return None
        
        process = self.debate_processes[process_id]
        
        # Check if agent is a participant
        if agent_id not in process.participants:
            return None
        
        # Check if process is not completed
        if process.status in [DebateStatus.CONCLUSION_REACHED, DebateStatus.DEBATE_FAILED]:
            return None
        
        # Add argument
        argument_id = process.add_argument(agent_id, argument, evidence, counter_to)
        
        # Create message to share with other participants
        message = Message(
            message_id=str(uuid.uuid4()),
            message_type=MessageType.DEBATE_ARGUMENT,
            sender=agent_id,
            recipients=[p for p in process.participants if p != agent_id],
            content={
                'process_id': process.id,
                'argument_id': argument_id,
                'argument': argument,
                'evidence': evidence,
                'counter_to': counter_to,
                'round': process.current_round
            },
            correlation_id=process.id
        )
        
        # Add to message thread
        process.message_thread.append(message)
        
        # Send message
        self.communication_service.send_message(message)
        
        # Check if all participants have argued in this round
        all_argued = True
        for participant in process.participants:
            if participant not in process.arguments:
                all_argued = False
                break
            
            # Check if at least one argument is in the current round
            has_current_round_arg = False
            for arg in process.arguments[participant]:
                if arg['round'] == process.current_round:
                    has_current_round_arg = True
                    break
            
            if not has_current_round_arg:
                all_argued = False
                break
        
        # If all have argued and not in final round, advance to next round
        if all_argued and process.current_round < process.max_rounds:
            process.advance_round()
            
            # Notify all participants of new round
            round_message = Message(
                message_id=str(uuid.uuid4()),
                message_type=MessageType.DEBATE_ARGUMENT,
                sender="collaboration_orchestrator",
                recipients=process.participants,
                content={
                    'process_id': process.id,
                    'action': 'new_round',
                    'round': process.current_round
                },
                correlation_id=process.id
            )
            
            # Add to message thread
            process.message_thread.append(round_message)
            
            # Send message
            self.communication_service.send_message(round_message)
        
        # If all have argued and in final round, move to conclusion phase
        if all_argued and process.current_round == process.max_rounds:
            process.status = DebateStatus.REACHING_CONCLUSION
            
            # Request conclusion from all participants
            conclusion_message = Message(
                message_id=str(uuid.uuid4()),
                message_type=MessageType.DEBATE_ARGUMENT,
                sender="collaboration_orchestrator",
                recipients=process.participants,
                content={
                    'process_id': process.id,
                    'action': 'request_conclusion'
                },
                correlation_id=process.id
            )
            
            # Add to message thread
            process.message_thread.append(conclusion_message)
            
            # Send message
            self.communication_service.send_message(conclusion_message)
        
        self.logger.info(f"Submitted argument for debate process {process_id} from agent {agent_id}")
        return argument_id
    
    def submit_debate_conclusion(self, process_id: str, agent_id: str, conclusion: str,
                               supporting_arguments: List[str], confidence: float) -> bool:
        """
        Submit a conclusion for a debate process.
        
        Args:
            process_id: ID of the debate process
            agent_id: ID of the agent making the conclusion
            conclusion: Conclusion text
            supporting_arguments: List of supporting argument IDs
            confidence: Confidence in the conclusion (0.0 to 1.0)
            
        Returns:
            Submission success
        """
        if process_id not in self.debate_processes:
            return False
        
        process = self.debate_processes[process_id]
        
        # Check if agent is a participant
        if agent_id not in process.participants:
            return False
        
        # Check if process is in conclusion phase
        if process.status != DebateStatus.REACHING_CONCLUSION:
            return False
        
        # Set conclusion
        process.set_conclusion(conclusion, supporting_arguments, confidence)
        
        # Notify all participants of conclusion
        conclusion_message = Message(
            message_id=str(uuid.uuid4()),
            message_type=MessageType.DEBATE_ARGUMENT,
            sender="collaboration_orchestrator",
            recipients=process.participants,
            content={
                'process_id': process.id,
                'action': 'conclusion',
                'conclusion': conclusion,
                'supporting_arguments': supporting_arguments,
                'confidence': confidence,
                'concluding_agent': agent_id
            },
            correlation_id=process.id
        )
        
        # Add to message thread
        process.message_thread.append(conclusion_message)
        
        # Send message
        self.communication_service.send_message(conclusion_message)
        
        self.logger.info(f"Submitted conclusion for debate process {process_id} from agent {agent_id}")
        return True
    
    def get_debate_process(self, process_id: str) -> Optional[DebateProcess]:
        """
        Get a debate process by ID.
        
        Args:
            process_id: ID of the process
            
        Returns:
            Process or None if not found
        """
        return self.debate_processes.get(process_id)
    
    def _debate_loop(self) -> None:
        """Background loop for managing debate processes."""
        while not self.shutdown_flag.is_set():
            try:
                # Process each debate process
                for process_id, process in list(self.debate_processes.items()):
                    # Skip completed processes
                    if process.status in [DebateStatus.CONCLUSION_REACHED, DebateStatus.DEBATE_FAILED]:
                        continue
                    
                    # Check for deadline
                    if process.deadline and time.time() > process.deadline:
                        self._finalize_debate_process(process, False, "Deadline expired")
                        continue
                
                # Sleep to avoid busy waiting
                time.sleep(1)
            
            except Exception as e:
                self.logger.error(f"Error in debate loop: {str(e)}")
                time.sleep(1)
    
    def _finalize_debate_process(self, process: DebateProcess, success: bool,
                               reason: str) -> None:
        """
        Finalize a debate process.
        
        Args:
            process: Debate process to finalize
            success: Whether debate was successful
            reason: Reason for finalization
        """
        if not success:
            # Update process status
            process.status = DebateStatus.DEBATE_FAILED
            process.completed_at = time.time()
            
            # Create failure message
            message = Message(
                message_id=str(uuid.uuid4()),
                message_type=MessageType.DEBATE_ARGUMENT,
                sender="collaboration_orchestrator",
                recipients=process.participants,
                content={
                    'process_id': process.id,
                    'action': 'failed',
                    'reason': reason
                },
                correlation_id=process.id
            )
            
            # Add to message thread
            process.message_thread.append(message)
            
            # Send message
            self.communication_service.send_message(message)
            
            self.logger.info(f"Finalized debate process {process.id}: Failed - {reason}")
    
    def shutdown(self) -> None:
        """Shutdown the collaboration orchestrator."""
        self.shutdown_flag.set()
        self.consensus_thread.join(timeout=5)
        self.debate_thread.join(timeout=5)
        self.logger.info("Collaboration orchestrator shutdown complete")


class CollectiveIntelligenceSystem:
    """
    Main class for the collective intelligence system.
    
    This coordinates the task orchestrator and collaboration orchestrator.
    """
    
    def __init__(self, communication_service: Any):
        """
        Initialize the collective intelligence system.
        
        Args:
            communication_service: Service for agent communication
        """
        self.communication_service = communication_service
        self.task_orchestrator = TaskOrchestrator(communication_service)
        self.collaboration_orchestrator = CollaborationOrchestrator(communication_service)
        self.logger = logging.getLogger('collective_intelligence')
    
    def register_agent(self, agent_id: str, name: str, role: str, 
                      capabilities: List[str], endpoint: str) -> bool:
        """
        Register an agent with the system.
        
        Args:
            agent_id: Unique identifier for the agent
            name: Human-readable name
            role: Agent's role in the system
            capabilities: List of agent capabilities
            endpoint: Communication endpoint for the agent
            
        Returns:
            Registration success
        """
        try:
            # Convert role string to enum
            agent_role = AgentRole(role)
            
            # Create agent
            agent = Agent(
                agent_id=agent_id,
                name=name,
                role=agent_role,
                capabilities=capabilities,
                endpoint=endpoint
            )
            
            # Register with orchestrators
            self.task_orchestrator.register_agent(agent)
            
            self.logger.info(f"Registered agent: {name} (ID: {agent_id}, Role: {role})")
            return True
        except Exception as e:
            self.logger.error(f"Error registering agent {agent_id}: {str(e)}")
            return False
    
    def deregister_agent(self, agent_id: str) -> bool:
        """
        Deregister an agent from the system.
        
        Args:
            agent_id: ID of the agent to deregister
            
        Returns:
            Deregistration success
        """
        return self.task_orchestrator.deregister_agent(agent_id)
    
    def submit_task(self, task_type: str, description: str,
                  data: Dict[str, Any], required_capabilities: List[str],
                  priority: int = 5, deadline: Optional[float] = None) -> str:
        """
        Submit a task to the system.
        
        Args:
            task_type: Type of task
            description: Human-readable description
            data: Task data/parameters
            required_capabilities: Capabilities required to complete the task
            priority: Task priority (1-10, higher is more important)
            deadline: Optional deadline timestamp
            
        Returns:
            Task ID
        """
        # Create task
        task = Task(
            task_id=str(uuid.uuid4()),
            task_type=task_type,
            description=description,
            data=data,
            required_capabilities=required_capabilities,
            priority=priority,
            deadline=deadline
        )
        
        # Submit to orchestrator
        return self.task_orchestrator.submit_task(task)
    
    def get_task_status(self, task_id: str) -> Dict[str, Any]:
        """
        Get the status of a task.
        
        Args:
            task_id: ID of the task
            
        Returns:
            Task status information
        """
        task = self.task_orchestrator.get_task(task_id)
        if not task:
            return {
                'exists': False,
                'error': f"Task {task_id} not found"
            }
        
        return {
            'exists': True,
            'task': task.to_dict()
        }
    
    def start_collaborative_task(self, task_type: str, description: str,
                               data: Dict[str, Any], participants: List[str],
                               collaboration_mode: CollaborationMode,
                               priority: int = 5) -> Dict[str, str]:
        """
        Start a collaborative task involving multiple agents.
        
        Args:
            task_type: Type of task
            description: Human-readable description
            data: Task data/parameters
            participants: List of participating agent IDs
            collaboration_mode: Collaboration mode
            priority: Task priority (1-10, higher is more important)
            
        Returns:
            Dictionary with task/process IDs
        """
        result = {}
        
        if collaboration_mode == CollaborationMode.INDEPENDENT:
            # Create individual tasks for each agent
            for agent_id in participants:
                agent = self.task_orchestrator.agents.get(agent_id)
                if agent:
                    task = Task(
                        task_id=str(uuid.uuid4()),
                        task_type=task_type,
                        description=description,
                        data=data,
                        required_capabilities=[],  # No specific capabilities, targeting agent directly
                        priority=priority
                    )
                    task.assigned_agent = agent_id
                    task.status = TaskStatus.ASSIGNED
                    
                    task_id = self.task_orchestrator.submit_task(task)
                    result[agent_id] = task_id
        
        elif collaboration_mode == CollaborationMode.SEQUENTIAL:
            # Create a chain of tasks, with each agent's task depending on the previous one
            pass  # Implementation would involve task dependencies and notifications
        
        elif collaboration_mode == CollaborationMode.PARALLEL:
            # Create a single task with multiple assigned agents
            pass  # Implementation would involve shared task state
        
        elif collaboration_mode == CollaborationMode.CONSENSUS:
            # Start a consensus process
            process_id = self.collaboration_orchestrator.start_consensus_process(
                topic=task_type,
                description=description,
                options=data.get('options', []),
                participants=participants,
                threshold=data.get('threshold', 0.7)
            )
            result['process_id'] = process_id
        
        elif collaboration_mode == CollaborationMode.DEBATE:
            # Start a debate process
            process_id = self.collaboration_orchestrator.start_debate_process(
                topic=task_type,
                description=description,
                question=data.get('question', description),
                participants=participants,
                max_rounds=data.get('max_rounds', 3)
            )
            result['process_id'] = process_id
        
        return result
    
    def shutdown(self) -> None:
        """Shutdown the collective intelligence system."""
        self.task_orchestrator.shutdown()
        self.collaboration_orchestrator.shutdown()
        self.logger.info("Collective intelligence system shutdown complete")