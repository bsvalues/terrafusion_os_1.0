"""
Experience Buffer for Agent Learning

This module implements a centralized experience buffer that collects and manages
agent experiences for continuous learning and improvement. It follows the design
specified in the MCP architecture guide, providing mechanisms for storing, retrieving,
and prioritizing experiences.

The buffer supports:
1. Logging experiences from any agent
2. Prioritized Experience Retrieval
3. Batch sampling for training
4. Experience expiration and cleanup
"""

import logging
import threading
import time
import uuid
import json
import datetime
from typing import Dict, List, Tuple, Any, Optional, Set, Union
from collections import deque
import heapq
import random

logger = logging.getLogger(__name__)

class Experience:
    """
    Represents a single experience entry in the buffer
    """
    
    def __init__(self, 
                 agent_id: str,
                 state: Dict[str, Any],
                 action: Dict[str, Any],
                 result: Dict[str, Any],
                 next_state: Optional[Dict[str, Any]] = None,
                 reward_signal: Optional[float] = None,
                 priority: float = 1.0,
                 metadata: Optional[Dict[str, Any]] = None,
                 experience_id: Optional[str] = None):
        """
        Initialize a new experience entry
        
        Args:
            agent_id: ID of the agent logging the experience
            state: Representation of state before action
            action: Representation of action taken
            result: Outcome of the action
            next_state: Representation of state after action (default: None)
            reward_signal: Optional numeric reward if using RL (default: None)
            priority: Priority value for this experience (default: 1.0)
            metadata: Optional additional metadata
            experience_id: Optional unique ID for this experience (default: auto-generated UUID)
        """
        self.experience_id = experience_id or str(uuid.uuid4())
        self.agent_id = agent_id
        self.timestamp = datetime.datetime.utcnow().isoformat() + "Z"
        self.state = state
        self.action = action
        self.result = result
        self.next_state = next_state
        self.reward_signal = reward_signal
        self.priority = priority
        self.metadata = metadata or {}
        
    def to_dict(self) -> Dict[str, Any]:
        """Convert experience to dictionary representation"""
        result = {
            "experienceId": self.experience_id,
            "agentId": self.agent_id,
            "timestamp": self.timestamp,
            "state": self.state,
            "action": self.action,
            "result": self.result,
            "metadata": {
                "priority": self.priority,
                **self.metadata
            }
        }
        
        # Add optional fields if present
        if self.next_state is not None:
            result["nextState"] = self.next_state
            
        if self.reward_signal is not None:
            result["rewardSignal"] = self.reward_signal
            
        return result
    
    def to_json(self) -> str:
        """Convert experience to JSON string"""
        return json.dumps(self.to_dict())
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Experience':
        """Create an Experience object from a dictionary"""
        # Extract metadata fields
        metadata = data.get("metadata", {})
        priority = metadata.get("priority", 1.0)
        
        # Remove priority from metadata to avoid duplication
        if "priority" in metadata:
            metadata_copy = metadata.copy()
            del metadata_copy["priority"]
        else:
            metadata_copy = metadata
        
        # Create and return the Experience object
        return cls(
            agent_id=data.get("agentId"),
            state=data.get("state", {}),
            action=data.get("action", {}),
            result=data.get("result", {}),
            next_state=data.get("nextState"),
            reward_signal=data.get("rewardSignal"),
            priority=priority,
            metadata=metadata_copy,
            experience_id=data.get("experienceId")
        )
    
    @classmethod
    def from_json(cls, json_str: str) -> 'Experience':
        """Create an Experience object from a JSON string"""
        try:
            data = json.loads(json_str)
            return cls.from_dict(data)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse experience JSON: {e}")
            raise ValueError(f"Invalid experience JSON: {e}")
    
    def __lt__(self, other):
        """Comparison operator for priority queue"""
        if not isinstance(other, Experience):
            return NotImplemented
        return self.priority > other.priority  # Higher priority first

class ExperienceBuffer:
    """
    Centralized buffer for collecting and managing agent experiences
    """
    
    def __init__(self, max_size: int = 10000, cleanup_interval: int = 3600):
        """
        Initialize the experience buffer
        
        Args:
            max_size: Maximum number of experiences to store (default: 10000)
            cleanup_interval: Interval in seconds for running cleanup tasks (default: 3600)
        """
        self.experiences = {}  # Mapping of experience_id to Experience object
        self.agent_indices = {}  # Mapping of agent_id to set of experience_ids
        self.priority_queue = []  # Heap queue for prioritized experiences
        self.max_size = max_size
        self.cleanup_interval = cleanup_interval
        self.lock = threading.RLock()
        self.running = False
        self.worker_thread = None
        self.last_cleanup = time.time()
        
        # Statistics
        self.total_added = 0
        self.total_sampled = 0
        self.total_expired = 0
        
    def start(self):
        """Start the experience buffer worker thread"""
        with self.lock:
            if self.running:
                logger.warning("Experience buffer already running")
                return
                
            self.running = True
            self.worker_thread = threading.Thread(target=self._worker, daemon=True)
            self.worker_thread.start()
            logger.info("Experience buffer started")
    
    def stop(self):
        """Stop the experience buffer worker thread"""
        with self.lock:
            if not self.running:
                logger.warning("Experience buffer not running")
                return
                
            self.running = False
            if self.worker_thread:
                self.worker_thread.join(timeout=5.0)
                self.worker_thread = None
            logger.info("Experience buffer stopped")
    
    def add_experience(self, experience: Experience) -> bool:
        """
        Add an experience to the buffer
        
        Args:
            experience: The experience to add
            
        Returns:
            True if the experience was successfully added, False otherwise
        """
        with self.lock:
            # Check if buffer is full
            if len(self.experiences) >= self.max_size:
                # Remove lowest priority experience
                self._remove_lowest_priority()
            
            # Add experience
            exp_id = experience.experience_id
            self.experiences[exp_id] = experience
            
            # Update agent index
            agent_id = experience.agent_id
            if agent_id not in self.agent_indices:
                self.agent_indices[agent_id] = set()
            self.agent_indices[agent_id].add(exp_id)
            
            # Add to priority queue
            heapq.heappush(self.priority_queue, (experience.priority, exp_id))
            
            self.total_added += 1
            logger.debug(f"Added experience {exp_id} from agent {agent_id} with priority {experience.priority}")
            return True
    
    def get_experience(self, experience_id: str) -> Optional[Experience]:
        """Get a specific experience by ID"""
        with self.lock:
            return self.experiences.get(experience_id)
    
    def sample(self, count: int = 1, agent_id: Optional[str] = None) -> List[Experience]:
        """
        Sample experiences from the buffer
        
        Args:
            count: Number of experiences to sample (default: 1)
            agent_id: Optional agent ID to filter by (default: None)
            
        Returns:
            List of sampled experiences
        """
        with self.lock:
            # Get candidate experience IDs
            if agent_id:
                if agent_id not in self.agent_indices:
                    return []
                candidate_ids = list(self.agent_indices[agent_id])
            else:
                candidate_ids = list(self.experiences.keys())
            
            # Sample experiences
            if not candidate_ids:
                return []
                
            # Adjust count if needed
            count = min(count, len(candidate_ids))
            
            # Sample randomly
            sampled_ids = random.sample(candidate_ids, count)
            sampled_experiences = [self.experiences[exp_id] for exp_id in sampled_ids]
            
            self.total_sampled += count
            return sampled_experiences
    
    def sample_prioritized(self, count: int = 1) -> List[Experience]:
        """
        Sample experiences with priority-based sampling
        
        Args:
            count: Number of experiences to sample (default: 1)
            
        Returns:
            List of sampled experiences in priority order (highest first)
        """
        with self.lock:
            # Adjust count if needed
            count = min(count, len(self.experiences))
            
            if count == 0:
                return []
                
            # Get experiences in priority order
            pq_copy = self.priority_queue.copy()
            results = []
            
            for _ in range(count):
                if not pq_copy:
                    break
                    
                _, exp_id = heapq.heappop(pq_copy)
                if exp_id in self.experiences:
                    results.append(self.experiences[exp_id])
            
            self.total_sampled += len(results)
            return results
    
    def get_agent_experiences(self, agent_id: str) -> List[Experience]:
        """Get all experiences for a specific agent"""
        with self.lock:
            if agent_id not in self.agent_indices:
                return []
                
            return [self.experiences[exp_id] for exp_id in self.agent_indices[agent_id]
                   if exp_id in self.experiences]
    
    def clear(self):
        """Clear all experiences from the buffer"""
        with self.lock:
            self.experiences.clear()
            self.agent_indices.clear()
            self.priority_queue.clear()
            logger.info("Experience buffer cleared")
    
    def _remove_lowest_priority(self):
        """Remove the lowest priority experience from the buffer"""
        # Rebuild priority queue to remove invalid entries
        valid_entries = [(e.priority, e.experience_id) for e in self.experiences.values()]
        self.priority_queue = []
        for entry in valid_entries:
            heapq.heappush(self.priority_queue, entry)
            
        if not self.priority_queue:
            return
            
        # Get and remove lowest priority experience
        priority, exp_id = self.priority_queue[0]
        heapq.heappop(self.priority_queue)
        
        if exp_id in self.experiences:
            experience = self.experiences[exp_id]
            agent_id = experience.agent_id
            
            # Remove from experiences
            del self.experiences[exp_id]
            
            # Remove from agent index
            if agent_id in self.agent_indices and exp_id in self.agent_indices[agent_id]:
                self.agent_indices[agent_id].remove(exp_id)
                
            logger.debug(f"Removed lowest priority experience {exp_id}")
    
    def _worker(self):
        """Worker thread for the experience buffer"""
        logger.info("Experience buffer worker thread started")
        
        while self.running:
            # Check if cleanup is needed
            current_time = time.time()
            if current_time - self.last_cleanup >= self.cleanup_interval:
                self._cleanup()
                self.last_cleanup = current_time
                
            # Sleep for a while
            time.sleep(10.0)
            
        logger.info("Experience buffer worker thread stopped")
    
    def _cleanup(self):
        """Perform cleanup tasks"""
        with self.lock:
            # For now, just ensure the buffer size is within limits
            # A more sophisticated implementation could expire old experiences,
            # remove duplicates, etc.
            overflow = len(self.experiences) - self.max_size
            if overflow > 0:
                logger.info(f"Cleaning up {overflow} experiences")
                for _ in range(overflow):
                    self._remove_lowest_priority()
                self.total_expired += overflow
    
    def get_stats(self) -> Dict[str, Any]:
        """Get statistics about the experience buffer"""
        with self.lock:
            stats = {
                'size': len(self.experiences),
                'max_size': self.max_size,
                'usage_percent': (len(self.experiences) / self.max_size) * 100 if self.max_size > 0 else 0,
                'total_added': self.total_added,
                'total_sampled': self.total_sampled,
                'total_expired': self.total_expired,
                'num_agents': len(self.agent_indices),
                'agents': {}
            }
            
            # Add agent-specific stats
            for agent_id, exp_ids in self.agent_indices.items():
                stats['agents'][agent_id] = {
                    'count': len(exp_ids)
                }
                
            return stats