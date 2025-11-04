"""
Knowledge Sharing Mechanism

This module implements a centralized knowledge sharing system that allows agents
to store, retrieve, and collaborate on knowledge artifacts. It provides a way for
agents to share insights, best practices, and lessons learned in real-time.

Key features:
- Centralized knowledge repository
- Standardized knowledge formats
- Integrated with message broker for real-time updates
- Query and retrieval mechanisms
- Knowledge rating and feedback system
"""

import time
import logging
import threading
import json
import uuid
from typing import Dict, List, Any, Optional, Union, Callable
from datetime import datetime
from collections import defaultdict

from mcp.agent_protocol import Message, MessageType
from mcp.message_broker import MessageBroker, MessageFilter

logger = logging.getLogger(__name__)

# Knowledge entry types
KNOWLEDGE_TYPES = {
    'insight': 0,      # General observations or insights
    'error': 1,        # Error descriptions and resolutions
    'warning': 2,      # Warnings and preventative measures
    'best_practice': 3, # Best practices and recommendations
    'performance': 4,  # Performance optimizations
    'compatibility': 5, # Compatibility notes
    'debugging': 6,    # Debugging tips
    'integration': 7,  # Integration notes
}

class KnowledgeEntry:
    """
    Represents a single knowledge entry in the knowledge base
    """
    
    def __init__(
        self,
        entry_id: str,
        title: str,
        content: str,
        entry_type: str,
        source_agent_id: str,
        tags: List[str] = None,
        context: Dict[str, Any] = None,
        references: List[str] = None,
        created_at: float = None,
        updated_at: float = None,
        rating: float = 0.0,
        rating_count: int = 0
    ):
        """
        Initialize a knowledge entry
        
        Args:
            entry_id: Unique identifier for the entry
            title: Title or summary of the entry
            content: Main content of the entry
            entry_type: Type of knowledge (insight, error, warning, etc.)
            source_agent_id: ID of the agent that created the entry
            tags: List of tags for categorization
            context: Additional context information
            references: List of related knowledge entry IDs
            created_at: Timestamp when the entry was created
            updated_at: Timestamp when the entry was last updated
            rating: Average rating of the entry (0.0 to 5.0)
            rating_count: Number of ratings received
        """
        self.entry_id = entry_id
        self.title = title
        self.content = content
        self.entry_type = entry_type
        self.source_agent_id = source_agent_id
        self.tags = tags or []
        self.context = context or {}
        self.references = references or []
        self.created_at = created_at or time.time()
        self.updated_at = updated_at or self.created_at
        self.rating = rating
        self.rating_count = rating_count
        
    def to_dict(self) -> Dict[str, Any]:
        """Convert the entry to a dictionary"""
        return {
            'entry_id': self.entry_id,
            'title': self.title,
            'content': self.content,
            'entry_type': self.entry_type,
            'source_agent_id': self.source_agent_id,
            'tags': self.tags,
            'context': self.context,
            'references': self.references,
            'created_at': self.created_at,
            'updated_at': self.updated_at,
            'rating': self.rating,
            'rating_count': self.rating_count
        }
        
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'KnowledgeEntry':
        """Create an entry from a dictionary"""
        return cls(
            entry_id=data['entry_id'],
            title=data['title'],
            content=data['content'],
            entry_type=data['entry_type'],
            source_agent_id=data['source_agent_id'],
            tags=data.get('tags', []),
            context=data.get('context', {}),
            references=data.get('references', []),
            created_at=data.get('created_at'),
            updated_at=data.get('updated_at'),
            rating=data.get('rating', 0.0),
            rating_count=data.get('rating_count', 0)
        )
        
    def update_rating(self, new_rating: float) -> None:
        """
        Update the entry's rating with a new rating
        
        Args:
            new_rating: New rating (0.0 to 5.0)
        """
        if 0.0 <= new_rating <= 5.0:
            total_rating = (self.rating * self.rating_count) + new_rating
            self.rating_count += 1
            self.rating = total_rating / self.rating_count
        
    def add_reference(self, reference_id: str) -> None:
        """
        Add a reference to another knowledge entry
        
        Args:
            reference_id: ID of the referenced entry
        """
        if reference_id not in self.references:
            self.references.append(reference_id)
            self.updated_at = time.time()
            
    def update_content(self, new_content: str) -> None:
        """
        Update the entry's content
        
        Args:
            new_content: New content for the entry
        """
        self.content = new_content
        self.updated_at = time.time()
        
    def add_tag(self, tag: str) -> None:
        """
        Add a tag to the entry
        
        Args:
            tag: Tag to add
        """
        if tag not in self.tags:
            self.tags.append(tag)
            self.updated_at = time.time()
            
    def add_context(self, key: str, value: Any) -> None:
        """
        Add context information to the entry
        
        Args:
            key: Context key
            value: Context value
        """
        self.context[key] = value
        self.updated_at = time.time()


class KnowledgeBase:
    """
    Central repository for knowledge entries
    """
    
    def __init__(self):
        """Initialize the knowledge base"""
        self.entries = {}  # Map of entry_id to KnowledgeEntry
        self.entry_by_agent = defaultdict(list)  # Map of agent_id to list of entry_ids
        self.entry_by_type = defaultdict(list)  # Map of entry_type to list of entry_ids
        self.entry_by_tag = defaultdict(list)  # Map of tag to list of entry_ids
        self.references = defaultdict(list)  # Map of entry_id to list of referencing entry_ids
        self.lock = threading.RLock()
        
    def add_entry(self, entry: KnowledgeEntry) -> str:
        """
        Add a new knowledge entry to the repository
        
        Args:
            entry: The knowledge entry to add
            
        Returns:
            ID of the added entry
        """
        with self.lock:
            # Store the entry
            self.entries[entry.entry_id] = entry
            
            # Update indexes
            self.entry_by_agent[entry.source_agent_id].append(entry.entry_id)
            self.entry_by_type[entry.entry_type].append(entry.entry_id)
            
            for tag in entry.tags:
                self.entry_by_tag[tag].append(entry.entry_id)
                
            # Update reference index
            for ref_id in entry.references:
                self.references[ref_id].append(entry.entry_id)
                
            return entry.entry_id
        
    def get_entry(self, entry_id: str) -> Optional[KnowledgeEntry]:
        """
        Get a knowledge entry by ID
        
        Args:
            entry_id: ID of the entry to retrieve
            
        Returns:
            The knowledge entry, or None if not found
        """
        with self.lock:
            return self.entries.get(entry_id)
        
    def update_entry(self, entry_id: str, **updates) -> bool:
        """
        Update a knowledge entry
        
        Args:
            entry_id: ID of the entry to update
            **updates: Updates to apply to the entry
            
        Returns:
            True if the entry was updated, False otherwise
        """
        with self.lock:
            entry = self.entries.get(entry_id)
            if not entry:
                return False
                
            # Apply updates
            for key, value in updates.items():
                if hasattr(entry, key):
                    setattr(entry, key, value)
                    
            # Update timestamps
            entry.updated_at = time.time()
            
            # Re-index if needed
            if 'tags' in updates:
                # Remove from existing tag indexes
                for tag_id in self.entry_by_tag:
                    if entry_id in self.entry_by_tag[tag_id]:
                        self.entry_by_tag[tag_id].remove(entry_id)
                        
                # Add to new tag indexes
                for tag in entry.tags:
                    self.entry_by_tag[tag].append(entry_id)
                    
            # Update reference index if needed
            if 'references' in updates:
                # Remove from existing reference indexes
                for ref_id in self.references:
                    if entry_id in self.references[ref_id]:
                        self.references[ref_id].remove(entry_id)
                        
                # Add to new reference indexes
                for ref_id in entry.references:
                    self.references[ref_id].append(entry_id)
                    
            return True
        
    def delete_entry(self, entry_id: str) -> bool:
        """
        Delete a knowledge entry
        
        Args:
            entry_id: ID of the entry to delete
            
        Returns:
            True if the entry was deleted, False otherwise
        """
        with self.lock:
            entry = self.entries.get(entry_id)
            if not entry:
                return False
                
            # Remove from indexes
            self.entry_by_agent[entry.source_agent_id].remove(entry_id)
            self.entry_by_type[entry.entry_type].remove(entry_id)
            
            for tag in entry.tags:
                if entry_id in self.entry_by_tag[tag]:
                    self.entry_by_tag[tag].remove(entry_id)
                    
            # Remove references
            for ref_id in entry.references:
                if entry_id in self.references[ref_id]:
                    self.references[ref_id].remove(entry_id)
                    
            # Remove entry
            del self.entries[entry_id]
            return True
        
    def find_entries(
        self,
        agent_id: Optional[str] = None,
        entry_type: Optional[str] = None,
        tags: Optional[List[str]] = None,
        search_text: Optional[str] = None,
        limit: int = 100
    ) -> List[KnowledgeEntry]:
        """
        Find knowledge entries based on criteria
        
        Args:
            agent_id: Optional agent ID to filter by
            entry_type: Optional entry type to filter by
            tags: Optional list of tags to filter by (entries must have ALL tags)
            search_text: Optional text to search for in title and content
            limit: Maximum number of entries to return
            
        Returns:
            List of matching knowledge entries
        """
        with self.lock:
            # Start with all entries
            entry_ids = set(self.entries.keys())
            
            # Filter by agent
            if agent_id is not None:
                agent_entry_ids = set(self.entry_by_agent.get(agent_id, []))
                entry_ids &= agent_entry_ids
                
            # Filter by type
            if entry_type is not None:
                type_entry_ids = set(self.entry_by_type.get(entry_type, []))
                entry_ids &= type_entry_ids
                
            # Filter by tags (must have ALL tags)
            if tags:
                for tag in tags:
                    tag_entry_ids = set(self.entry_by_tag.get(tag, []))
                    entry_ids &= tag_entry_ids
                    
            # Get entry objects
            results = [self.entries[entry_id] for entry_id in entry_ids]
            
            # Filter by search text
            if search_text:
                search_text = search_text.lower()
                results = [
                    entry for entry in results
                    if search_text in entry.title.lower() or search_text in entry.content.lower()
                ]
                
            # Sort by rating and then by creation date
            results.sort(key=lambda e: (e.rating, e.created_at), reverse=True)
            
            # Apply limit
            return results[:limit]
        
    def get_related_entries(self, entry_id: str, limit: int = 10) -> List[KnowledgeEntry]:
        """
        Get entries related to a specific entry
        
        Args:
            entry_id: ID of the entry to find related entries for
            limit: Maximum number of entries to return
            
        Returns:
            List of related knowledge entries
        """
        with self.lock:
            entry = self.entries.get(entry_id)
            if not entry:
                return []
                
            related_ids = set()
            
            # Add entries referenced by this entry
            related_ids.update(entry.references)
            
            # Add entries that reference this entry
            related_ids.update(self.references.get(entry_id, []))
            
            # Add entries with the same tags
            for tag in entry.tags:
                related_ids.update(self.entry_by_tag.get(tag, []))
                
            # Remove the original entry
            if entry_id in related_ids:
                related_ids.remove(entry_id)
                
            # Get entry objects
            related_entries = [
                self.entries[related_id] 
                for related_id in related_ids
                if related_id in self.entries
            ]
            
            # Sort by relevance (number of shared tags) and then by rating
            def relevance(e):
                shared_tags = len(set(e.tags) & set(entry.tags))
                return (shared_tags, e.rating)
                
            related_entries.sort(key=relevance, reverse=True)
            
            return related_entries[:limit]
        
    def get_stats(self) -> Dict[str, Any]:
        """
        Get statistics about the knowledge base
        
        Returns:
            Dictionary with statistics
        """
        with self.lock:
            stats = {
                'total_entries': len(self.entries),
                'entries_by_type': {
                    entry_type: len(entries)
                    for entry_type, entries in self.entry_by_type.items()
                },
                'entries_by_agent': {
                    agent_id: len(entries)
                    for agent_id, entries in self.entry_by_agent.items()
                },
                'total_tags': len(self.entry_by_tag),
                'top_tags': sorted(
                    [(tag, len(entries)) for tag, entries in self.entry_by_tag.items()],
                    key=lambda x: x[1],
                    reverse=True
                )[:10],
                'avg_rating': sum(e.rating for e in self.entries.values()) / max(1, len(self.entries)),
                'avg_references': sum(len(e.references) for e in self.entries.values()) / max(1, len(self.entries))
            }
            return stats


class KnowledgeSharingSystem:
    """
    System for managing knowledge sharing between agents
    """
    
    def __init__(self, message_broker: MessageBroker):
        """
        Initialize the knowledge sharing system
        
        Args:
            message_broker: The message broker for communication
        """
        self.message_broker = message_broker
        self.knowledge_base = KnowledgeBase()
        self.subscribed_agents = set()
        self.running = False
        self.worker_thread = None
        self.lock = threading.RLock()
        self.query_handlers = {}
        
    def start(self):
        """Start the knowledge sharing system"""
        with self.lock:
            if self.running:
                logger.warning("Knowledge sharing system already running")
                return
                
            # Subscribe to knowledge sharing messages
            self.message_broker.subscribe_with_pattern(
                agent_id="knowledge_sharing",
                message_filter=MessageFilter(
                    message_types=["KNOWLEDGE_QUERY", "KNOWLEDGE_UPDATE", "KNOWLEDGE_FEEDBACK"]
                )
            )
            
            self.running = True
            self.worker_thread = threading.Thread(target=self._worker_loop, daemon=True)
            self.worker_thread.start()
            logger.info("Knowledge sharing system started")
            
    def stop(self):
        """Stop the knowledge sharing system"""
        with self.lock:
            if not self.running:
                logger.warning("Knowledge sharing system not running")
                return
                
            self.running = False
            if self.worker_thread:
                self.worker_thread.join(timeout=5.0)
                self.worker_thread = None
            logger.info("Knowledge sharing system stopped")
            
    def register_agent(self, agent_id: str):
        """
        Register an agent with the knowledge sharing system
        
        Args:
            agent_id: ID of the agent to register
        """
        with self.lock:
            self.subscribed_agents.add(agent_id)
            logger.info(f"Agent {agent_id} registered with knowledge sharing system")
            
    def unregister_agent(self, agent_id: str):
        """
        Unregister an agent from the knowledge sharing system
        
        Args:
            agent_id: ID of the agent to unregister
        """
        with self.lock:
            if agent_id in self.subscribed_agents:
                self.subscribed_agents.remove(agent_id)
                logger.info(f"Agent {agent_id} unregistered from knowledge sharing system")
                
    def add_knowledge(
        self,
        agent_id: str,
        title: str,
        content: str,
        entry_type: str,
        tags: List[str] = None,
        context: Dict[str, Any] = None,
        references: List[str] = None
    ) -> str:
        """
        Add a new knowledge entry
        
        Args:
            agent_id: ID of the agent adding the knowledge
            title: Title or summary of the entry
            content: Main content of the entry
            entry_type: Type of knowledge (insight, error, warning, etc.)
            tags: List of tags for categorization
            context: Additional context information
            references: List of related knowledge entry IDs
            
        Returns:
            ID of the added entry
        """
        # Validate entry type
        if entry_type not in KNOWLEDGE_TYPES:
            logger.warning(f"Invalid knowledge entry type: {entry_type}")
            entry_type = 'insight'  # Default to insight
            
        # Create entry
        entry_id = str(uuid.uuid4())
        entry = KnowledgeEntry(
            entry_id=entry_id,
            title=title,
            content=content,
            entry_type=entry_type,
            source_agent_id=agent_id,
            tags=tags,
            context=context,
            references=references
        )
        
        # Add to knowledge base
        self.knowledge_base.add_entry(entry)
        
        # Broadcast the new entry
        self._broadcast_knowledge_update(entry)
        
        logger.info(f"New knowledge entry added: {entry_id} (from {agent_id})")
        return entry_id
        
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
        # Find matching entries
        entries = self.knowledge_base.find_entries(
            entry_type=entry_type,
            tags=tags,
            search_text=query_text,
            limit=limit
        )
        
        # Convert to dictionaries
        results = [entry.to_dict() for entry in entries]
        
        logger.info(f"Knowledge query from {agent_id}: '{query_text}' - found {len(results)} results")
        return results
        
    def provide_feedback(
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
        entry = self.knowledge_base.get_entry(entry_id)
        if not entry:
            logger.warning(f"Cannot rate unknown knowledge entry: {entry_id}")
            return False
            
        # Update rating
        entry.update_rating(rating)
        
        # Add feedback as context if provided
        if feedback_text:
            feedback_context = entry.context.get('feedback', [])
            feedback_context.append({
                'agent_id': agent_id,
                'rating': rating,
                'text': feedback_text,
                'timestamp': time.time()
            })
            entry.context['feedback'] = feedback_context
            
        # Update the entry
        self.knowledge_base.update_entry(
            entry_id=entry_id,
            rating=entry.rating,
            rating_count=entry.rating_count,
            context=entry.context
        )
        
        logger.info(f"Feedback received for entry {entry_id} from {agent_id}: rating={rating}")
        return True
        
    def get_entry(self, entry_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a specific knowledge entry
        
        Args:
            entry_id: ID of the entry to retrieve
            
        Returns:
            The entry as a dictionary, or None if not found
        """
        entry = self.knowledge_base.get_entry(entry_id)
        if entry:
            return entry.to_dict()
        return None
        
    def get_related_entries(self, entry_id: str, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Get entries related to a specific entry
        
        Args:
            entry_id: ID of the entry to find related entries for
            limit: Maximum number of entries to return
            
        Returns:
            List of related entries as dictionaries
        """
        entries = self.knowledge_base.get_related_entries(entry_id, limit)
        return [entry.to_dict() for entry in entries]
        
    def get_agent_knowledge(self, agent_id: str, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Get knowledge entries from a specific agent
        
        Args:
            agent_id: ID of the agent to get entries for
            limit: Maximum number of entries to return
            
        Returns:
            List of knowledge entries as dictionaries
        """
        entries = self.knowledge_base.find_entries(agent_id=agent_id, limit=limit)
        return [entry.to_dict() for entry in entries]
        
    def get_knowledge_by_type(self, entry_type: str, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Get knowledge entries of a specific type
        
        Args:
            entry_type: Type of entries to get
            limit: Maximum number of entries to return
            
        Returns:
            List of knowledge entries as dictionaries
        """
        entries = self.knowledge_base.find_entries(entry_type=entry_type, limit=limit)
        return [entry.to_dict() for entry in entries]
        
    def get_knowledge_stats(self) -> Dict[str, Any]:
        """
        Get statistics about the knowledge base
        
        Returns:
            Dictionary with statistics
        """
        return self.knowledge_base.get_stats()
        
    def register_query_handler(self, agent_id: str, handler: Callable):
        """
        Register a handler for knowledge queries
        
        Args:
            agent_id: ID of the agent
            handler: Function to call when a query is received
        """
        with self.lock:
            self.query_handlers[agent_id] = handler
            logger.info(f"Registered query handler for agent {agent_id}")
        
    def _worker_loop(self):
        """Main worker loop for the knowledge sharing system"""
        logger.info("Knowledge sharing worker thread started")
        
        while self.running:
            try:
                # Wait for and process incoming messages
                message = self.message_broker.get_messages_for_agent("knowledge_sharing", timeout=1.0)
                if message:
                    self._process_message(message)
                    
            except Exception as e:
                logger.error(f"Error in knowledge sharing worker: {str(e)}")
                time.sleep(1.0)
                
        logger.info("Knowledge sharing worker thread stopped")
        
    def _process_message(self, message: Message):
        """
        Process an incoming message
        
        Args:
            message: The message to process
        """
        try:
            msg_type = message.message_type
            payload = message.payload
            source_agent_id = message.source_agent_id
            
            if msg_type == "KNOWLEDGE_QUERY":
                self._handle_query(source_agent_id, payload)
            elif msg_type == "KNOWLEDGE_UPDATE":
                self._handle_update(source_agent_id, payload)
            elif msg_type == "KNOWLEDGE_FEEDBACK":
                self._handle_feedback(source_agent_id, payload)
            else:
                logger.warning(f"Unknown message type: {msg_type}")
                
        except Exception as e:
            logger.error(f"Error processing message: {str(e)}")
            
    def _handle_query(self, agent_id: str, payload: Dict[str, Any]):
        """
        Handle a knowledge query
        
        Args:
            agent_id: ID of the agent making the query
            payload: Query payload
        """
        query_id = payload.get('query_id')
        query_text = payload.get('query_text', '')
        entry_type = payload.get('entry_type')
        tags = payload.get('tags')
        limit = payload.get('limit', 10)
        
        # Find matching entries
        results = self.query_knowledge(agent_id, query_text, entry_type, tags, limit)
        
        # Send response
        response = {
            'query_id': query_id,
            'results': results,
            'result_count': len(results),
            'timestamp': time.time()
        }
        
        # Create response message
        response_msg = Message(
            source_agent_id="knowledge_sharing",
            target_agent_id=agent_id,
            message_type="KNOWLEDGE_RESPONSE",
            payload=response
        )
        
        # Send response
        self.message_broker.publish(response_msg)
        
    def _handle_update(self, agent_id: str, payload: Dict[str, Any]):
        """
        Handle a knowledge update
        
        Args:
            agent_id: ID of the agent sending the update
            payload: Update payload
        """
        # Extract entry details
        title = payload.get('title', '')
        content = payload.get('content', '')
        entry_type = payload.get('entry_type', 'insight')
        tags = payload.get('tags', [])
        context = payload.get('context', {})
        references = payload.get('references', [])
        
        # Add the entry
        entry_id = self.add_knowledge(
            agent_id=agent_id,
            title=title,
            content=content,
            entry_type=entry_type,
            tags=tags,
            context=context,
            references=references
        )
        
        # Notify the agent of success
        response = {
            'status': 'success',
            'entry_id': entry_id,
            'timestamp': time.time()
        }
        
        response_msg = Message(
            source_agent_id="knowledge_sharing",
            target_agent_id=agent_id,
            message_type="KNOWLEDGE_UPDATE_RESPONSE",
            payload=response
        )
        
        self.message_broker.publish(response_msg)
        
    def _handle_feedback(self, agent_id: str, payload: Dict[str, Any]):
        """
        Handle knowledge feedback
        
        Args:
            agent_id: ID of the agent providing feedback
            payload: Feedback payload
        """
        entry_id = payload.get('entry_id')
        rating = payload.get('rating')
        feedback_text = payload.get('feedback_text')
        
        if entry_id and rating is not None:
            self.provide_feedback(agent_id, entry_id, rating, feedback_text)
        
    def _broadcast_knowledge_update(self, entry: KnowledgeEntry):
        """
        Broadcast a knowledge update to all subscribed agents
        
        Args:
            entry: The knowledge entry to broadcast
        """
        # Create notification message
        notification = {
            'event': 'new_knowledge',
            'entry': entry.to_dict(),
            'timestamp': time.time()
        }
        
        # Create message
        msg = Message(
            source_agent_id="knowledge_sharing",
            target_agent_id="broadcast",
            message_type="KNOWLEDGE_NOTIFICATION",
            payload=notification
        )
        
        # Publish to all agents
        self.message_broker.publish(msg)