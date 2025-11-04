"""
Agent Communication Service

This module implements the communication service for agent orchestration,
enabling message passing, negotiation, and distributed problem solving.
"""
import os
import json
import logging
import time
import uuid
import threading
import queue
from typing import Dict, List, Any, Optional, Union, Callable, Set, Tuple

class MessagePriority:
    """Message priority levels."""
    LOW = 0
    MEDIUM = 1
    HIGH = 2
    CRITICAL = 3


class CommunicationChannel:
    """
    A communication channel between agents.
    
    This represents a logical grouping of communications, such as:
    - Direct messaging between two agents
    - Group channel for a team of agents
    - Broadcast channel for system-wide messages
    """
    
    def __init__(self, channel_id: str, name: str, participants: List[str],
                is_group: bool = False, metadata: Optional[Dict[str, Any]] = None):
        """
        Initialize a communication channel.
        
        Args:
            channel_id: Unique identifier for the channel
            name: Human-readable name
            participants: List of participant agent IDs
            is_group: Whether this is a group channel
            metadata: Optional channel metadata
        """
        self.id = channel_id
        self.name = name
        self.participants = participants
        self.is_group = is_group
        self.metadata = metadata or {}
        self.created_at = time.time()
        self.last_activity = time.time()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert channel to a dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'participants': self.participants,
            'is_group': self.is_group,
            'metadata': self.metadata,
            'created_at': self.created_at,
            'last_activity': self.last_activity
        }


class Message:
    """
    Represents a message exchanged between agents.
    """
    
    def __init__(self, message_id: str, channel_id: str, 
                sender: str, content: Dict[str, Any],
                message_type: str, priority: int = MessagePriority.MEDIUM,
                correlation_id: Optional[str] = None,
                in_reply_to: Optional[str] = None,
                expires_at: Optional[float] = None,
                metadata: Optional[Dict[str, Any]] = None):
        """
        Initialize a message.
        
        Args:
            message_id: Unique identifier for the message
            channel_id: ID of the communication channel
            sender: ID of the sending agent
            content: Message content
            message_type: Type of message
            priority: Message priority
            correlation_id: Optional correlation ID for message threads
            in_reply_to: Optional ID of message this is replying to
            expires_at: Optional expiration timestamp
            metadata: Optional message metadata
        """
        self.id = message_id
        self.channel_id = channel_id
        self.sender = sender
        self.content = content
        self.type = message_type
        self.priority = priority
        self.correlation_id = correlation_id
        self.in_reply_to = in_reply_to
        self.created_at = time.time()
        self.expires_at = expires_at
        self.metadata = metadata or {}
        self.delivered = False
        self.delivery_attempts = 0
        self.delivery_time = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert message to a dictionary."""
        return {
            'id': self.id,
            'channel_id': self.channel_id,
            'sender': self.sender,
            'content': self.content,
            'type': self.type,
            'priority': self.priority,
            'correlation_id': self.correlation_id,
            'in_reply_to': self.in_reply_to,
            'created_at': self.created_at,
            'expires_at': self.expires_at,
            'metadata': self.metadata,
            'delivered': self.delivered,
            'delivery_attempts': self.delivery_attempts,
            'delivery_time': self.delivery_time
        }


class Subscription:
    """
    Represents an agent's subscription to a communication channel.
    """
    
    def __init__(self, agent_id: str, channel_id: str,
                filters: Optional[Dict[str, Any]] = None,
                created_at: Optional[float] = None):
        """
        Initialize a subscription.
        
        Args:
            agent_id: ID of the subscribing agent
            channel_id: ID of the channel
            filters: Optional message filters
            created_at: Optional creation timestamp
        """
        self.agent_id = agent_id
        self.channel_id = channel_id
        self.filters = filters or {}
        self.created_at = created_at or time.time()
        self.last_activity = time.time()
    
    def should_deliver(self, message: Message) -> bool:
        """
        Check if a message should be delivered to this subscription.
        
        Args:
            message: Message to check
            
        Returns:
            Whether the message should be delivered
        """
        # If message is expired, don't deliver
        if message.expires_at and time.time() > message.expires_at:
            return False
        
        # Apply filters
        for key, value in self.filters.items():
            if key == 'priority':
                # Priority filter: only deliver messages with priority >= filter value
                if message.priority < value:
                    return False
            elif key == 'types':
                # Types filter: only deliver messages of specified types
                if message.type not in value:
                    return False
            elif key == 'senders':
                # Senders filter: only deliver messages from specified senders
                if message.sender not in value:
                    return False
        
        return True
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert subscription to a dictionary."""
        return {
            'agent_id': self.agent_id,
            'channel_id': self.channel_id,
            'filters': self.filters,
            'created_at': self.created_at,
            'last_activity': self.last_activity
        }


class DeliveryStatus:
    """
    Represents the delivery status of a message to an agent.
    """
    
    def __init__(self, message_id: str, agent_id: str):
        """
        Initialize a delivery status.
        
        Args:
            message_id: ID of the message
            agent_id: ID of the recipient agent
        """
        self.message_id = message_id
        self.agent_id = agent_id
        self.delivered = False
        self.delivery_time = None
        self.read = False
        self.read_time = None
        self.acknowledged = False
        self.acknowledgement_time = None
        self.delivery_attempts = 0
        self.last_attempt = None
        self.error = None
    
    def mark_delivered(self) -> None:
        """Mark the message as delivered."""
        self.delivered = True
        self.delivery_time = time.time()
    
    def mark_read(self) -> None:
        """Mark the message as read."""
        self.read = True
        self.read_time = time.time()
    
    def mark_acknowledged(self) -> None:
        """Mark the message as acknowledged."""
        self.acknowledged = True
        self.acknowledgement_time = time.time()
    
    def record_attempt(self, error: Optional[str] = None) -> None:
        """
        Record a delivery attempt.
        
        Args:
            error: Optional error message
        """
        self.delivery_attempts += 1
        self.last_attempt = time.time()
        self.error = error
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert delivery status to a dictionary."""
        return {
            'message_id': self.message_id,
            'agent_id': self.agent_id,
            'delivered': self.delivered,
            'delivery_time': self.delivery_time,
            'read': self.read,
            'read_time': self.read_time,
            'acknowledged': self.acknowledged,
            'acknowledgement_time': self.acknowledgement_time,
            'delivery_attempts': self.delivery_attempts,
            'last_attempt': self.last_attempt,
            'error': self.error
        }


class CommunicationService:
    """
    Communication service for agent orchestration.
    
    This service enables message passing, negotiation,
    and distributed problem solving between agents.
    """
    
    def __init__(self, storage_dir: Optional[str] = None):
        """
        Initialize the communication service.
        
        Args:
            storage_dir: Optional directory for persistent storage
        """
        # Initialize storage directory
        if storage_dir is None:
            storage_dir = os.path.join(os.getcwd(), 'communication_storage')
        
        self.storage_dir = storage_dir
        os.makedirs(storage_dir, exist_ok=True)
        
        # Initialize data structures
        self.channels = {}  # channel_id -> CommunicationChannel
        self.messages = {}  # message_id -> Message
        self.subscriptions = {}  # (agent_id, channel_id) -> Subscription
        self.delivery_statuses = {}  # (message_id, agent_id) -> DeliveryStatus
        self.channel_messages = {}  # channel_id -> set of message_ids
        self.agent_inboxes = {}  # agent_id -> queue of messages
        
        # Initialize logger
        self.logger = logging.getLogger('communication_service')
        
        # Initialize delivery thread
        self.shutdown_flag = threading.Event()
        self.delivery_thread = threading.Thread(target=self._delivery_loop)
        self.delivery_thread.daemon = True
        self.delivery_thread.start()
        
        # Initialize handlers for different message types
        self._init_message_handlers()
        
        # Load existing data
        self._load_data()
    
    def _init_message_handlers(self) -> None:
        """Initialize handlers for different message types."""
        self.message_handlers = {}
        # Handlers will be registered by external components
    
    def register_message_handler(self, message_type: str, handler: Callable[[Message], None]) -> None:
        """
        Register a handler for a specific message type.
        
        Args:
            message_type: Type of message to handle
            handler: Handler function
        """
        self.message_handlers[message_type] = handler
        self.logger.info(f"Registered handler for message type: {message_type}")
    
    def _load_data(self) -> None:
        """Load existing data from storage."""
        # In a real implementation, this would load data from persistent storage
        # For this example, we'll initialize with some default channels
        
        # Create a system channel
        system_channel = CommunicationChannel(
            channel_id="system",
            name="System Channel",
            participants=[],  # Empty initially, agents will subscribe
            is_group=True,
            metadata={"description": "System-wide notifications and announcements"}
        )
        
        self.channels["system"] = system_channel
        self.channel_messages["system"] = set()
    
    def create_channel(self, name: str, participants: List[str],
                     is_group: bool = False, metadata: Optional[Dict[str, Any]] = None) -> str:
        """
        Create a new communication channel.
        
        Args:
            name: Human-readable name
            participants: List of participant agent IDs
            is_group: Whether this is a group channel
            metadata: Optional channel metadata
            
        Returns:
            Channel ID
        """
        # Generate a channel ID
        channel_id = str(uuid.uuid4())
        
        # Create the channel
        channel = CommunicationChannel(
            channel_id=channel_id,
            name=name,
            participants=participants,
            is_group=is_group,
            metadata=metadata
        )
        
        # Store the channel
        self.channels[channel_id] = channel
        self.channel_messages[channel_id] = set()
        
        # Subscribe participants
        for agent_id in participants:
            self.subscribe(agent_id, channel_id)
        
        self.logger.info(f"Created channel: {name} (ID: {channel_id})")
        return channel_id
    
    def get_channel(self, channel_id: str) -> Optional[CommunicationChannel]:
        """
        Get a channel by ID.
        
        Args:
            channel_id: ID of the channel
            
        Returns:
            Channel or None if not found
        """
        return self.channels.get(channel_id)
    
    def delete_channel(self, channel_id: str) -> bool:
        """
        Delete a channel.
        
        Args:
            channel_id: ID of the channel to delete
            
        Returns:
            Deletion success
        """
        if channel_id not in self.channels:
            return False
        
        # Get the channel
        channel = self.channels[channel_id]
        
        # Remove subscriptions
        for agent_id in channel.participants:
            subscription_key = (agent_id, channel_id)
            if subscription_key in self.subscriptions:
                del self.subscriptions[subscription_key]
        
        # Remove messages
        if channel_id in self.channel_messages:
            for message_id in self.channel_messages[channel_id]:
                if message_id in self.messages:
                    del self.messages[message_id]
                
                # Remove delivery statuses
                for agent_id in channel.participants:
                    delivery_key = (message_id, agent_id)
                    if delivery_key in self.delivery_statuses:
                        del self.delivery_statuses[delivery_key]
            
            del self.channel_messages[channel_id]
        
        # Remove channel
        del self.channels[channel_id]
        
        self.logger.info(f"Deleted channel: {channel_id}")
        return True
    
    def add_participant(self, channel_id: str, agent_id: str) -> bool:
        """
        Add a participant to a channel.
        
        Args:
            channel_id: ID of the channel
            agent_id: ID of the agent to add
            
        Returns:
            Addition success
        """
        if channel_id not in self.channels:
            return False
        
        channel = self.channels[channel_id]
        
        # Check if already a participant
        if agent_id in channel.participants:
            return True
        
        # Add to participants
        channel.participants.append(agent_id)
        
        # Subscribe to the channel
        self.subscribe(agent_id, channel_id)
        
        # Update last activity
        channel.last_activity = time.time()
        
        self.logger.info(f"Added participant {agent_id} to channel {channel_id}")
        return True
    
    def remove_participant(self, channel_id: str, agent_id: str) -> bool:
        """
        Remove a participant from a channel.
        
        Args:
            channel_id: ID of the channel
            agent_id: ID of the agent to remove
            
        Returns:
            Removal success
        """
        if channel_id not in self.channels:
            return False
        
        channel = self.channels[channel_id]
        
        # Check if a participant
        if agent_id not in channel.participants:
            return False
        
        # Remove from participants
        channel.participants.remove(agent_id)
        
        # Unsubscribe from the channel
        self.unsubscribe(agent_id, channel_id)
        
        # Update last activity
        channel.last_activity = time.time()
        
        self.logger.info(f"Removed participant {agent_id} from channel {channel_id}")
        return True
    
    def subscribe(self, agent_id: str, channel_id: str,
                filters: Optional[Dict[str, Any]] = None) -> bool:
        """
        Subscribe an agent to a channel.
        
        Args:
            agent_id: ID of the agent
            channel_id: ID of the channel
            filters: Optional message filters
            
        Returns:
            Subscription success
        """
        if channel_id not in self.channels:
            return False
        
        # Create subscription
        subscription = Subscription(
            agent_id=agent_id,
            channel_id=channel_id,
            filters=filters
        )
        
        # Store subscription
        subscription_key = (agent_id, channel_id)
        self.subscriptions[subscription_key] = subscription
        
        # Initialize agent inbox if not exists
        if agent_id not in self.agent_inboxes:
            self.agent_inboxes[agent_id] = queue.PriorityQueue()
        
        self.logger.info(f"Subscribed agent {agent_id} to channel {channel_id}")
        return True
    
    def unsubscribe(self, agent_id: str, channel_id: str) -> bool:
        """
        Unsubscribe an agent from a channel.
        
        Args:
            agent_id: ID of the agent
            channel_id: ID of the channel
            
        Returns:
            Unsubscription success
        """
        subscription_key = (agent_id, channel_id)
        if subscription_key not in self.subscriptions:
            return False
        
        # Remove subscription
        del self.subscriptions[subscription_key]
        
        self.logger.info(f"Unsubscribed agent {agent_id} from channel {channel_id}")
        return True
    
    def send_message(self, message: Message) -> str:
        """
        Send a message to a channel.
        
        Args:
            message: Message to send
            
        Returns:
            Message ID
        """
        # Generate ID if not provided
        if not message.id:
            message.id = str(uuid.uuid4())
        
        # Verify channel exists
        if message.channel_id not in self.channels:
            raise ValueError(f"Channel {message.channel_id} not found")
        
        # Store message
        self.messages[message.id] = message
        self.channel_messages[message.channel_id].add(message.id)
        
        # Update channel activity
        channel = self.channels[message.channel_id]
        channel.last_activity = time.time()
        
        # Queue for delivery
        self._queue_message_for_delivery(message)
        
        # Call appropriate handler if registered
        if message.type in self.message_handlers:
            try:
                self.message_handlers[message.type](message)
            except Exception as e:
                self.logger.error(f"Error in message handler for type {message.type}: {str(e)}")
        
        self.logger.info(f"Sent message: {message.id} to channel {message.channel_id}")
        return message.id
    
    def _queue_message_for_delivery(self, message: Message) -> None:
        """
        Queue a message for delivery to recipients.
        
        Args:
            message: Message to queue
        """
        # Get channel
        channel = self.channels[message.channel_id]
        
        # Find subscribers to deliver to
        for agent_id in channel.participants:
            subscription_key = (agent_id, message.channel_id)
            if subscription_key in self.subscriptions:
                subscription = self.subscriptions[subscription_key]
                
                # Check if message should be delivered to this subscription
                if subscription.should_deliver(message):
                    # Create delivery status
                    delivery_key = (message.id, agent_id)
                    delivery_status = DeliveryStatus(message.id, agent_id)
                    self.delivery_statuses[delivery_key] = delivery_status
                    
                    # Queue message for agent
                    if agent_id in self.agent_inboxes:
                        # Use priority queue: (priority, timestamp, message_id)
                        priority_tuple = (-message.priority, time.time(), message.id)
                        self.agent_inboxes[agent_id].put(priority_tuple)
    
    def get_message(self, message_id: str) -> Optional[Message]:
        """
        Get a message by ID.
        
        Args:
            message_id: ID of the message
            
        Returns:
            Message or None if not found
        """
        return self.messages.get(message_id)
    
    def get_channel_messages(self, channel_id: str, 
                           since: Optional[float] = None,
                           limit: int = 100,
                           message_type: Optional[str] = None) -> List[Message]:
        """
        Get messages from a channel.
        
        Args:
            channel_id: ID of the channel
            since: Optional timestamp to get messages since
            limit: Maximum number of messages to return
            message_type: Optional filter by message type
            
        Returns:
            List of messages
        """
        if channel_id not in self.channel_messages:
            return []
        
        # Get message IDs for the channel
        message_ids = self.channel_messages[channel_id]
        
        # Get messages
        messages = []
        for message_id in message_ids:
            if message_id in self.messages:
                message = self.messages[message_id]
                
                # Apply filters
                if since and message.created_at < since:
                    continue
                
                if message_type and message.type != message_type:
                    continue
                
                messages.append(message)
        
        # Sort by creation time (newest first)
        messages.sort(key=lambda m: m.created_at, reverse=True)
        
        # Apply limit
        return messages[:limit]
    
    def get_agent_messages(self, agent_id: str, channel_id: Optional[str] = None,
                         undelivered_only: bool = False, limit: int = 10) -> List[Message]:
        """
        Get messages for an agent.
        
        Args:
            agent_id: ID of the agent
            channel_id: Optional filter by channel ID
            undelivered_only: Whether to only return undelivered messages
            limit: Maximum number of messages to return
            
        Returns:
            List of messages
        """
        if agent_id not in self.agent_inboxes:
            return []
        
        # Clone the inbox to avoid modifying the original
        inbox_clone = queue.PriorityQueue()
        original_items = []
        
        messages = []
        count = 0
        
        # Get items from the queue
        while not self.agent_inboxes[agent_id].empty() and count < limit:
            try:
                item = self.agent_inboxes[agent_id].get_nowait()
                original_items.append(item)
                
                _, _, message_id = item
                
                if message_id in self.messages:
                    message = self.messages[message_id]
                    
                    # Apply filters
                    if channel_id and message.channel_id != channel_id:
                        continue
                    
                    delivery_key = (message_id, agent_id)
                    if undelivered_only and delivery_key in self.delivery_statuses:
                        if self.delivery_statuses[delivery_key].delivered:
                            continue
                    
                    messages.append(message)
                    count += 1
            except queue.Empty:
                break
        
        # Put items back in the queue
        for item in original_items:
            inbox_clone.put(item)
        
        # Replace the original queue with the clone
        self.agent_inboxes[agent_id] = inbox_clone
        
        # Sort by priority and creation time
        messages.sort(key=lambda m: (-m.priority, m.created_at))
        
        return messages
    
    def mark_delivered(self, message_id: str, agent_id: str) -> bool:
        """
        Mark a message as delivered to an agent.
        
        Args:
            message_id: ID of the message
            agent_id: ID of the agent
            
        Returns:
            Success flag
        """
        delivery_key = (message_id, agent_id)
        if delivery_key not in self.delivery_statuses:
            return False
        
        delivery_status = self.delivery_statuses[delivery_key]
        delivery_status.mark_delivered()
        
        # Update message delivered status if all recipients have received it
        if message_id in self.messages:
            message = self.messages[message_id]
            channel = self.channels.get(message.channel_id)
            
            if channel:
                all_delivered = True
                for recipient in channel.participants:
                    if recipient != message.sender:
                        recipient_key = (message_id, recipient)
                        if recipient_key not in self.delivery_statuses or not self.delivery_statuses[recipient_key].delivered:
                            all_delivered = False
                            break
                
                if all_delivered:
                    message.delivered = True
                    message.delivery_time = time.time()
        
        return True
    
    def mark_read(self, message_id: str, agent_id: str) -> bool:
        """
        Mark a message as read by an agent.
        
        Args:
            message_id: ID of the message
            agent_id: ID of the agent
            
        Returns:
            Success flag
        """
        delivery_key = (message_id, agent_id)
        if delivery_key not in self.delivery_statuses:
            return False
        
        delivery_status = self.delivery_statuses[delivery_key]
        
        # Message must be delivered before it can be read
        if not delivery_status.delivered:
            return False
        
        delivery_status.mark_read()
        return True
    
    def mark_acknowledged(self, message_id: str, agent_id: str) -> bool:
        """
        Mark a message as acknowledged by an agent.
        
        Args:
            message_id: ID of the message
            agent_id: ID of the agent
            
        Returns:
            Success flag
        """
        delivery_key = (message_id, agent_id)
        if delivery_key not in self.delivery_statuses:
            return False
        
        delivery_status = self.delivery_statuses[delivery_key]
        
        # Message must be read before it can be acknowledged
        if not delivery_status.read:
            return False
        
        delivery_status.mark_acknowledged()
        return True
    
    def get_delivery_status(self, message_id: str, agent_id: Optional[str] = None) -> Union[DeliveryStatus, Dict[str, DeliveryStatus], None]:
        """
        Get delivery status for a message.
        
        Args:
            message_id: ID of the message
            agent_id: Optional specific agent ID
            
        Returns:
            Delivery status, dictionary of statuses, or None if not found
        """
        if agent_id:
            delivery_key = (message_id, agent_id)
            return self.delivery_statuses.get(delivery_key)
        
        # Return all delivery statuses for the message
        statuses = {}
        for (msg_id, agt_id), status in self.delivery_statuses.items():
            if msg_id == message_id:
                statuses[agt_id] = status
        
        return statuses if statuses else None
    
    def _delivery_loop(self) -> None:
        """Background loop for message delivery."""
        while not self.shutdown_flag.is_set():
            try:
                # Check for messages that need delivery attempts
                current_time = time.time()
                
                # Process up to 100 delivery statuses at a time
                processed = 0
                for (message_id, agent_id), status in list(self.delivery_statuses.items()):
                    if processed >= 100:
                        break
                    
                    # Skip already delivered messages
                    if status.delivered:
                        continue
                    
                    # Check if we should retry delivery
                    retry = False
                    
                    if status.delivery_attempts == 0:
                        # First attempt
                        retry = True
                    elif status.delivery_attempts < 5:
                        # Retry with exponential backoff
                        last_attempt = status.last_attempt or current_time
                        backoff = 2 ** status.delivery_attempts  # 2, 4, 8, 16 seconds
                        
                        if current_time - last_attempt > backoff:
                            retry = True
                    
                    if retry:
                        # In a real implementation, this would attempt to deliver
                        # the message to the agent's endpoint
                        
                        # For this example, we'll simulate successful delivery
                        status.mark_delivered()
                        
                        # In a real system, we'd record an attempt and possibly an error
                        # status.record_attempt("Connection refused")
                        
                        processed += 1
                
                # Sleep to avoid busy waiting
                time.sleep(1)
            
            except Exception as e:
                self.logger.error(f"Error in delivery loop: {str(e)}")
                time.sleep(1)
    
    def shutdown(self) -> None:
        """Shutdown the communication service."""
        self.shutdown_flag.set()
        self.delivery_thread.join(timeout=5)
        self.logger.info("Communication service shutdown complete")
    
    def create_direct_channel(self, agent1_id: str, agent2_id: str,
                            name: Optional[str] = None) -> str:
        """
        Create a direct communication channel between two agents.
        
        Args:
            agent1_id: ID of the first agent
            agent2_id: ID of the second agent
            name: Optional channel name
            
        Returns:
            Channel ID
        """
        # Check if channel already exists
        for channel_id, channel in self.channels.items():
            if not channel.is_group and set(channel.participants) == {agent1_id, agent2_id}:
                return channel_id
        
        # Create channel name if not provided
        if not name:
            name = f"Direct: {agent1_id} <-> {agent2_id}"
        
        # Create channel
        return self.create_channel(
            name=name,
            participants=[agent1_id, agent2_id],
            is_group=False,
            metadata={"type": "direct"}
        )
    
    def get_or_create_direct_channel(self, agent1_id: str, agent2_id: str) -> str:
        """
        Get or create a direct communication channel between two agents.
        
        Args:
            agent1_id: ID of the first agent
            agent2_id: ID of the second agent
            
        Returns:
            Channel ID
        """
        # Check if channel already exists
        for channel_id, channel in self.channels.items():
            if not channel.is_group and set(channel.participants) == {agent1_id, agent2_id}:
                return channel_id
        
        # Create channel
        return self.create_direct_channel(agent1_id, agent2_id)
    
    def broadcast_message(self, sender: str, message_type: str, content: Dict[str, Any],
                        priority: int = MessagePriority.MEDIUM) -> str:
        """
        Broadcast a message to all agents via the system channel.
        
        Args:
            sender: ID of the sending agent
            message_type: Type of message
            content: Message content
            priority: Message priority
            
        Returns:
            Message ID
        """
        # Create message
        message = Message(
            message_id=str(uuid.uuid4()),
            channel_id="system",
            sender=sender,
            content=content,
            message_type=message_type,
            priority=priority
        )
        
        # Send message
        return self.send_message(message)
    
    def send_direct_message(self, sender: str, recipient: str, 
                          message_type: str, content: Dict[str, Any],
                          priority: int = MessagePriority.MEDIUM) -> str:
        """
        Send a direct message to another agent.
        
        Args:
            sender: ID of the sending agent
            recipient: ID of the receiving agent
            message_type: Type of message
            content: Message content
            priority: Message priority
            
        Returns:
            Message ID
        """
        # Get or create direct channel
        channel_id = self.get_or_create_direct_channel(sender, recipient)
        
        # Create message
        message = Message(
            message_id=str(uuid.uuid4()),
            channel_id=channel_id,
            sender=sender,
            content=content,
            message_type=message_type,
            priority=priority
        )
        
        # Send message
        return self.send_message(message)
    
    def get_agent_channels(self, agent_id: str) -> List[CommunicationChannel]:
        """
        Get all channels an agent is a participant in.
        
        Args:
            agent_id: ID of the agent
            
        Returns:
            List of channels
        """
        return [channel for channel in self.channels.values() if agent_id in channel.participants]
    
    def reply_to_message(self, original_message_id: str, sender: str, 
                       content: Dict[str, Any], message_type: Optional[str] = None,
                       priority: Optional[int] = None) -> str:
        """
        Reply to a message.
        
        Args:
            original_message_id: ID of the message to reply to
            sender: ID of the sending agent
            content: Reply content
            message_type: Optional message type (defaults to original message type)
            priority: Optional priority (defaults to original priority)
            
        Returns:
            Message ID
        """
        if original_message_id not in self.messages:
            raise ValueError(f"Original message {original_message_id} not found")
        
        original_message = self.messages[original_message_id]
        
        # Create reply message
        message = Message(
            message_id=str(uuid.uuid4()),
            channel_id=original_message.channel_id,
            sender=sender,
            content=content,
            message_type=message_type or original_message.type,
            priority=priority or original_message.priority,
            correlation_id=original_message.correlation_id or original_message.id,
            in_reply_to=original_message_id
        )
        
        # Send message
        return self.send_message(message)
    
    def get_conversation_thread(self, thread_id: str, limit: int = 100) -> List[Message]:
        """
        Get a conversation thread.
        
        Args:
            thread_id: Correlation ID of the thread
            limit: Maximum number of messages to return
            
        Returns:
            List of messages in the thread
        """
        # Find messages in the thread
        thread_messages = []
        
        for message in self.messages.values():
            if message.correlation_id == thread_id or message.id == thread_id:
                thread_messages.append(message)
        
        # Sort by creation time
        thread_messages.sort(key=lambda m: m.created_at)
        
        # Apply limit
        return thread_messages[:limit]