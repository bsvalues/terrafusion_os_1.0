"""
MCP Message Broker

This module implements an enhanced message broker for handling agent-to-agent communication.
It provides a robust, event-driven architecture that routes messages between agents based on the
standardized message format defined in agent_protocol.py.

Key features:
- Topic-based publish-subscribe messaging
- Pattern-based message subscription
- Event-driven architecture with callbacks
- Message persistence and replay capability
- Delayed message delivery
- Message priority handling
- Performance metrics and monitoring
"""

import logging
import threading
import queue
import time
import re
import json
import heapq
import datetime
from typing import Dict, List, Callable, Any, Optional, Set, Union, Pattern, Tuple
from collections import defaultdict, deque
import uuid
from dataclasses import dataclass, field

from mcp.agent_protocol import Message, MessageType, MessagePriority

logger = logging.getLogger(__name__)

@dataclass(order=True)
class DelayedMessage:
    """Class for messages that should be delivered at a specific time"""
    delivery_time: float
    priority: int
    message: Message = field(compare=False)
    id: str = field(default_factory=lambda: str(uuid.uuid4()), compare=False)

class MessageFilter:
    """Filter for pattern-based message subscription"""
    def __init__(self, pattern: Optional[str] = None, 
                 message_types: Optional[List[Union[str, MessageType]]] = None,
                 source_agents: Optional[List[str]] = None,
                 target_agents: Optional[List[str]] = None,
                 payload_criteria: Optional[Dict[str, Any]] = None):
        """
        Initialize a message filter
        
        Args:
            pattern: Regex pattern to match against message topics
            message_types: List of message types to match
            source_agents: List of source agent IDs to match
            target_agents: List of target agent IDs to match
            payload_criteria: Dict of payload field criteria to match
        """
        self.pattern = re.compile(pattern) if pattern else None
        self.message_types = self._normalize_message_types(message_types) if message_types else None
        self.source_agents = set(source_agents) if source_agents else None
        self.target_agents = set(target_agents) if target_agents else None
        self.payload_criteria = payload_criteria
        
    def _normalize_message_types(self, message_types: List[Union[str, MessageType]]) -> Set[str]:
        """Convert message types to a set of strings"""
        result = set()
        for msg_type in message_types:
            if isinstance(msg_type, MessageType):
                result.add(msg_type.value)
            else:
                result.add(msg_type)
        return result
    
    def matches(self, message: Message, topic: str) -> bool:
        """
        Check if a message matches this filter
        
        Args:
            message: The message to check
            topic: The topic the message was published to
            
        Returns:
            True if the message matches this filter, False otherwise
        """
        # Check topic pattern
        if self.pattern and not self.pattern.match(topic):
            return False
            
        # Check message type
        if self.message_types:
            msg_type = message.message_type
            if isinstance(msg_type, MessageType):
                msg_type = msg_type.value
            if msg_type not in self.message_types:
                return False
                
        # Check source agent
        if self.source_agents and message.source_agent_id not in self.source_agents:
            return False
            
        # Check target agent
        if self.target_agents and message.target_agent_id not in self.target_agents:
            return False
            
        # Check payload criteria
        if self.payload_criteria:
            for key, value in self.payload_criteria.items():
                if key not in message.payload or message.payload[key] != value:
                    return False
                    
        return True

class MessageBroker:
    """
    Message broker for agent-to-agent communication.
    
    This broker implements an enhanced publish-subscribe model for message routing with
    support for pattern-based subscriptions, delayed messages, and message persistence.
    Agents can subscribe to topics, direct messages, or message patterns, and the broker
    routes messages accordingly.
    """
    
    def __init__(self, max_stored_messages: int = 1000, storage_path: Optional[str] = None):
        """
        Initialize the message broker
        
        Args:
            max_stored_messages: Maximum number of messages to keep in the message history
            storage_path: Optional path to store message persistence data
        """
        # Core messaging functionality
        self.topics = defaultdict(set)  # Mapping of topic to set of subscribers
        self.subscribers = {}  # Mapping of agent_id to subscriber info
        self.queues = {}  # Mapping of agent_id to message queue
        
        # Pattern-based subscription
        self.pattern_subscribers = {}  # Mapping of agent_id to list of MessageFilter objects
        
        # Delayed message functionality
        self.delayed_messages = []  # Priority queue for delayed messages
        self.delayed_messages_lock = threading.Lock()
        
        # Message persistence
        self.message_history = deque(maxlen=max_stored_messages)  # Recent message history
        self.storage_path = storage_path
        
        # Performance metrics
        self.metrics = {
            'messages_published': 0,
            'messages_delivered': 0,
            'pattern_matches': 0,
            'delayed_messages': 0,
            'peak_queue_size': defaultdict(int),
            'start_time': time.time()
        }
        
        # Thread control
        self.running = False
        self.worker_thread = None
        self.lock = threading.RLock()
        
    def start(self):
        """Start the message broker"""
        with self.lock:
            if self.running:
                logger.warning("Message broker already running")
                return
                
            self.running = True
            self.worker_thread = threading.Thread(target=self._worker, daemon=True)
            self.worker_thread.start()
            logger.info("Message broker started")
    
    def stop(self):
        """Stop the message broker"""
        with self.lock:
            if not self.running:
                logger.warning("Message broker not running")
                return
                
            self.running = False
            if self.worker_thread:
                self.worker_thread.join(timeout=5.0)
                self.worker_thread = None
            logger.info("Message broker stopped")
    
    def subscribe(self, agent_id: str, callback: Optional[Callable[[Message], None]] = None) -> queue.Queue:
        """
        Subscribe an agent to receive messages
        
        Args:
            agent_id: The ID of the agent subscribing
            callback: Optional callback function to be called when a message is received.
                     If None, messages will be placed in a queue that the agent can poll.
                     
        Returns:
            A queue for the agent to poll for messages (if callback is None)
        """
        with self.lock:
            # Create a message queue for this agent
            msg_queue = queue.Queue()
            self.queues[agent_id] = msg_queue
            
            # Store subscriber info
            self.subscribers[agent_id] = {
                'callback': callback,
                'queue': msg_queue,
                'topics': set()
            }
            
            # Auto-subscribe to direct messages
            self.topics[agent_id].add(agent_id)
            
            logger.info(f"Agent {agent_id} subscribed to message broker")
            return msg_queue
    
    def unsubscribe(self, agent_id: str):
        """Unsubscribe an agent from the broker"""
        with self.lock:
            if agent_id not in self.subscribers:
                logger.warning(f"Agent {agent_id} not subscribed")
                return
                
            # Remove from topics
            for topic, subscribers in self.topics.items():
                if agent_id in subscribers:
                    subscribers.remove(agent_id)
            
            # Remove subscriber info
            del self.subscribers[agent_id]
            
            # Remove queue
            if agent_id in self.queues:
                del self.queues[agent_id]
                
            logger.info(f"Agent {agent_id} unsubscribed from message broker")
    
    def subscribe_to_topic(self, agent_id: str, topic: str):
        """Subscribe an agent to a specific topic"""
        with self.lock:
            if agent_id not in self.subscribers:
                logger.warning(f"Agent {agent_id} not subscribed to broker")
                return
                
            self.topics[topic].add(agent_id)
            self.subscribers[agent_id]['topics'].add(topic)
            logger.info(f"Agent {agent_id} subscribed to topic {topic}")
    
    def unsubscribe_from_topic(self, agent_id: str, topic: str):
        """Unsubscribe an agent from a specific topic"""
        with self.lock:
            if agent_id not in self.subscribers:
                logger.warning(f"Agent {agent_id} not subscribed to broker")
                return
                
            if topic in self.topics and agent_id in self.topics[topic]:
                self.topics[topic].remove(agent_id)
                
            if topic in self.subscribers[agent_id]['topics']:
                self.subscribers[agent_id]['topics'].remove(topic)
                
            logger.info(f"Agent {agent_id} unsubscribed from topic {topic}")
    
    def _update_metrics(self):
        """
        Update performance metrics
        """
        with self.lock:
            # Update queue size metrics
            for agent_id, info in self.subscribers.items():
                queue_size = info['queue'].qsize()
                self.metrics['peak_queue_size'][agent_id] = max(
                    queue_size, 
                    self.metrics['peak_queue_size'][agent_id]
                )
                
            # Calculate messages per second
            uptime = time.time() - self.metrics['start_time']
            if uptime > 0:
                self.metrics['messages_per_second'] = self.metrics['messages_published'] / uptime
                
            # Log metrics if significant activity
            if self.metrics['messages_published'] > 0:
                logger.debug(f"Message broker metrics: {self.metrics}")
                
    def publish(self, message: Message, topic: Optional[str] = None) -> bool:
        """
        Publish a message to the broker
        
        Args:
            message: The message to publish
            topic: Optional topic to publish to (if different from target_agent_id)
            
        Returns:
            True if the message was successfully published, False otherwise
        """
        if not message.is_valid():
            logger.warning(f"Attempted to publish invalid message: {message}")
            return False
            
        with self.lock:
            # Get the effective topic (use provided topic or message target)
            effective_topic = topic if topic is not None else message.target_agent_id
            
            # Identify direct subscribers
            subscribers = set()
            
            if effective_topic == "broadcast":
                # Message for all subscribers
                for agent_id in self.subscribers:
                    subscribers.add(agent_id)
            elif effective_topic in self.topics:
                # Message for subscribers of a specific topic
                subscribers = self.topics[effective_topic].copy()
            else:
                # Direct message to a specific agent
                if effective_topic in self.subscribers:
                    subscribers.add(effective_topic)
                    
            # Identify pattern-based subscribers
            pattern_matched_agents = set()
            for agent_id, filters in self.pattern_subscribers.items():
                for filter in filters:
                    if filter.matches(message, effective_topic):
                        pattern_matched_agents.add(agent_id)
                        self.metrics['pattern_matches'] += 1
                        break
                        
            # Combine direct and pattern-based subscribers
            all_subscribers = subscribers.union(pattern_matched_agents)
            
            # If no subscribers and not a direct message, log warning
            if not all_subscribers and effective_topic != message.target_agent_id:
                logger.warning(f"No subscribers for topic {effective_topic}")
                
            # If direct message and no subscriber, return failure
            if not all_subscribers and effective_topic == message.target_agent_id and effective_topic != "broadcast":
                logger.warning(f"No subscriber for target {effective_topic}")
                return False
                
            # Store in message history
            self.store_message(message)
            
            # Update metrics
            self.metrics['messages_published'] += 1
            
            # Deliver message to subscribers
            messages_delivered = 0
            for agent_id in all_subscribers:
                if agent_id == message.source_agent_id:
                    # Skip sending message back to sender
                    continue
                    
                subscriber = self.subscribers.get(agent_id)
                if not subscriber:
                    continue
                    
                # Use callback if available, otherwise queue
                try:
                    if subscriber['callback']:
                        subscriber['callback'](message)
                    else:
                        subscriber['queue'].put(message)
                        
                    messages_delivered += 1
                except Exception as e:
                    logger.error(f"Error delivering message to agent {agent_id}: {str(e)}")
            
            # Update delivery metrics
            self.metrics['messages_delivered'] += messages_delivered
            
            # Log success
            if messages_delivered > 0:
                logger.debug(f"Published message {message.message_id} to {messages_delivered} subscribers")
                
            return True
    
    def subscribe_with_pattern(self, agent_id: str, message_filter: MessageFilter) -> bool:
        """
        Subscribe an agent with a message pattern filter
        
        Args:
            agent_id: The ID of the agent subscribing
            message_filter: The message filter to apply
            
        Returns:
            True if subscription was successful, False otherwise
        """
        with self.lock:
            if agent_id not in self.subscribers:
                logger.warning(f"Agent {agent_id} not subscribed to broker")
                return False
                
            # Create pattern subscription list if needed
            if agent_id not in self.pattern_subscribers:
                self.pattern_subscribers[agent_id] = []
                
            # Add filter to subscription list
            self.pattern_subscribers[agent_id].append(message_filter)
            
            logger.info(f"Agent {agent_id} subscribed with pattern filter")
            return True
            
    def unsubscribe_pattern(self, agent_id: str, pattern_index: Optional[int] = None) -> bool:
        """
        Unsubscribe an agent from a pattern subscription
        
        Args:
            agent_id: The ID of the agent unsubscribing
            pattern_index: Optional index of the pattern to remove. If None, all patterns are removed.
            
        Returns:
            True if unsubscription was successful, False otherwise
        """
        with self.lock:
            if agent_id not in self.subscribers:
                logger.warning(f"Agent {agent_id} not subscribed to broker")
                return False
                
            if agent_id not in self.pattern_subscribers:
                logger.warning(f"Agent {agent_id} has no pattern subscriptions")
                return False
                
            if pattern_index is None:
                # Remove all patterns
                del self.pattern_subscribers[agent_id]
                logger.info(f"Removed all pattern subscriptions for agent {agent_id}")
            else:
                # Remove specific pattern
                if pattern_index < 0 or pattern_index >= len(self.pattern_subscribers[agent_id]):
                    logger.warning(f"Invalid pattern index {pattern_index} for agent {agent_id}")
                    return False
                    
                self.pattern_subscribers[agent_id].pop(pattern_index)
                logger.info(f"Removed pattern subscription {pattern_index} for agent {agent_id}")
                
            return True
            
    def publish_delayed(self, message: Message, delay_seconds: float, 
                         priority: int = 0) -> bool:
        """
        Publish a message with a delay
        
        Args:
            message: The message to publish
            delay_seconds: Delay in seconds before delivering the message
            priority: Message priority (higher values = higher priority)
            
        Returns:
            True if the delayed message was scheduled successfully, False otherwise
        """
        if not message.is_valid():
            logger.warning(f"Attempted to publish invalid delayed message: {message}")
            return False
            
        # Calculate delivery time
        delivery_time = time.time() + delay_seconds
        
        # Create delayed message
        delayed_msg = DelayedMessage(
            delivery_time=delivery_time,
            priority=priority,
            message=message
        )
        
        # Add to priority queue
        with self.delayed_messages_lock:
            heapq.heappush(self.delayed_messages, delayed_msg)
            self.metrics['delayed_messages'] += 1
            
        logger.info(f"Scheduled delayed message {message.message_id} for delivery in {delay_seconds} seconds")
        return True
        
    def store_message(self, message: Message) -> None:
        """
        Store a message in the history buffer
        
        Args:
            message: The message to store
        """
        self.message_history.append(message)
        
        # If storage path is configured, also persist to disk
        if self.storage_path:
            try:
                # TODO: Implement file-based persistence
                pass
            except Exception as e:
                logger.error(f"Error persisting message to storage: {str(e)}")
                
    def get_message_history(self, limit: Optional[int] = None) -> List[Message]:
        """
        Get recent message history
        
        Args:
            limit: Maximum number of messages to return
            
        Returns:
            List of recent messages
        """
        with self.lock:
            if limit is None or limit >= len(self.message_history):
                return list(self.message_history)
            else:
                return list(self.message_history)[-limit:]

    def _process_delayed_messages(self) -> int:
        """
        Process delayed messages that are ready for delivery
        
        Returns:
            Number of messages processed
        """
        now = time.time()
        processed = 0
        
        with self.delayed_messages_lock:
            # Keep processing until no more ready messages
            while self.delayed_messages and self.delayed_messages[0].delivery_time <= now:
                # Pop the next ready message
                delayed_msg = heapq.heappop(self.delayed_messages)
                
                # Publish it
                if self.publish(delayed_msg.message):
                    processed += 1
                
        return processed
            
    def _worker(self):
        """Worker thread for the message broker"""
        logger.info("Message broker worker thread started")
        
        # Process interval (seconds)
        process_interval = 0.1
        
        # Metrics update interval (seconds)
        metrics_interval = 10.0
        last_metrics_update = time.time()
        
        while self.running:
            try:
                # Process delayed messages
                processed = self._process_delayed_messages()
                if processed > 0:
                    logger.debug(f"Processed {processed} delayed messages")
                
                # Update metrics periodically
                now = time.time()
                if now - last_metrics_update > metrics_interval:
                    self._update_metrics()
                    last_metrics_update = now
                
                # Sleep for a short interval
                time.sleep(process_interval)
                
            except Exception as e:
                logger.error(f"Error in message broker worker: {str(e)}")
                # Sleep a bit longer after an error
                time.sleep(1.0)
            
        logger.info("Message broker worker thread stopped")
    
    def get_topic_subscribers(self, topic: str) -> Set[str]:
        """Get the set of subscribers for a specific topic"""
        with self.lock:
            return self.topics.get(topic, set()).copy()
    
    def get_agent_topics(self, agent_id: str) -> Set[str]:
        """Get the set of topics an agent is subscribed to"""
        with self.lock:
            if agent_id not in self.subscribers:
                return set()
            return self.subscribers[agent_id]['topics'].copy()
    
    def get_stats(self) -> Dict[str, Any]:
        """Get statistics about the message broker"""
        with self.lock:
            # First ensure metrics are up to date
            self._update_metrics()
            
            # Basic broker stats
            stats = {
                'running': self.running,
                'num_subscribers': len(self.subscribers),
                'num_topics': len(self.topics),
                'num_pattern_subscribers': len(self.pattern_subscribers),
                'messages_history_count': len(self.message_history),
                'subscribers': {},
                'topics': {},
                'pattern_subscribers': {},
                'performance': {}
            }
            
            # Add subscriber stats
            for agent_id, info in self.subscribers.items():
                stats['subscribers'][agent_id] = {
                    'queue_size': info['queue'].qsize(),
                    'has_callback': bool(info['callback']),
                    'num_topics': len(info['topics']),
                    'peak_queue_size': self.metrics['peak_queue_size'].get(agent_id, 0)
                }
                
            # Add topic stats
            for topic, subscribers in self.topics.items():
                stats['topics'][topic] = {
                    'num_subscribers': len(subscribers),
                    'subscribers': list(subscribers)
                }
                
            # Add pattern subscriber stats
            for agent_id, filters in self.pattern_subscribers.items():
                stats['pattern_subscribers'][agent_id] = {
                    'num_patterns': len(filters)
                }
            
            # Copy performance metrics
            with self.delayed_messages_lock:
                delayed_count = len(self.delayed_messages)
                
            stats['performance'] = {
                'messages_published': self.metrics['messages_published'],
                'messages_delivered': self.metrics['messages_delivered'],
                'pattern_matches': self.metrics['pattern_matches'],
                'delayed_messages_pending': delayed_count,
                'delayed_messages_total': self.metrics['delayed_messages'],
                'uptime': time.time() - self.metrics['start_time'],
                'messages_per_second': self.metrics.get('messages_per_second', 0)
            }
                
            return stats