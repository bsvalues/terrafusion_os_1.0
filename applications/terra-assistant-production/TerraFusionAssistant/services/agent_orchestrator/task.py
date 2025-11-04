"""
Task Module

This module defines the Task class and related enums for the Agent Orchestrator.
"""

import uuid
import time
from enum import Enum, auto
from datetime import datetime
from typing import Dict, Any, Optional, List, Union, Callable

class TaskPriority(Enum):
    """Task priority levels"""
    LOW = 0
    NORMAL = 1
    HIGH = 2
    CRITICAL = 3

class TaskStatus(Enum):
    """Task status values"""
    PENDING = auto()
    DISPATCHED = auto()
    PROCESSING = auto()
    COMPLETED = auto()
    FAILED = auto()
    TIMEOUT = auto()
    CANCELLED = auto()

class Task:
    """
    Represents a task to be processed by an agent.
    
    Tasks contain the data to be processed, metadata about the task,
    and track the task's status throughout its lifecycle.
    """
    
    def __init__(
        self,
        task_type: str,
        data: Dict[str, Any],
        priority: TaskPriority = TaskPriority.NORMAL,
        task_id: Optional[str] = None,
        parent_task_id: Optional[str] = None,
        source_repository: Optional[str] = None,
        required_capabilities: Optional[List[str]] = None,
        timeout: Optional[float] = None
    ):
        """
        Initialize a task.
        
        Args:
            task_type: Type of task (e.g., 'code_analysis', 'security_review')
            data: Task data to be processed
            priority: Priority level for the task
            task_id: Optional task ID (generated if not provided)
            parent_task_id: Optional ID of a parent task
            source_repository: Optional source repository ID or URL
            required_capabilities: Optional list of agent capabilities required
            timeout: Optional timeout in seconds
        """
        self.id = task_id or str(uuid.uuid4())
        self.task_type = task_type
        self.data = data
        self.priority = priority
        self.parent_task_id = parent_task_id
        self.source_repository = source_repository
        self.required_capabilities = required_capabilities or []
        self.timeout = timeout
        
        # Status tracking
        self.status = TaskStatus.PENDING
        self.created_at = datetime.utcnow().isoformat()
        self.updated_at = self.created_at
        self.started_at = None
        self.completed_at = None
        
        # Execution tracking
        self.assigned_to = None  # Agent ID
        self.result = None
        self.error = None
        self.subtasks = []  # List of subtask IDs
        
        # Callback handling
        self.callback = None  # Optional callback function
    
    def to_dict(self) -> Dict[str, Any]:
        """
        Convert task to a dictionary.
        
        Returns:
            Dictionary representation of the task
        """
        return {
            'id': self.id,
            'task_type': self.task_type,
            'data': self.data,
            'priority': self.priority.name,
            'parent_task_id': self.parent_task_id,
            'source_repository': self.source_repository,
            'required_capabilities': self.required_capabilities,
            'timeout': self.timeout,
            'status': self.status.name,
            'created_at': self.created_at,
            'updated_at': self.updated_at,
            'started_at': self.started_at,
            'completed_at': self.completed_at,
            'assigned_to': self.assigned_to,
            'result': self.result,
            'error': self.error,
            'subtasks': self.subtasks
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Task':
        """
        Create a task from a dictionary.
        
        Args:
            data: Task data dictionary
            
        Returns:
            Task instance
        """
        task = cls(
            task_type=data['task_type'],
            data=data['data'],
            priority=TaskPriority[data['priority']],
            task_id=data['id'],
            parent_task_id=data.get('parent_task_id'),
            source_repository=data.get('source_repository'),
            required_capabilities=data.get('required_capabilities', []),
            timeout=data.get('timeout')
        )
        
        # Set status fields
        task.status = TaskStatus[data['status']]
        task.created_at = data['created_at']
        task.updated_at = data['updated_at']
        task.started_at = data.get('started_at')
        task.completed_at = data.get('completed_at')
        
        # Set execution fields
        task.assigned_to = data.get('assigned_to')
        task.result = data.get('result')
        task.error = data.get('error')
        task.subtasks = data.get('subtasks', [])
        
        return task
    
    def update_status(self, status: TaskStatus):
        """
        Update the task status and timestamp.
        
        Args:
            status: New task status
        """
        self.status = status
        self.updated_at = datetime.utcnow().isoformat()
        
        if status == TaskStatus.PROCESSING and not self.started_at:
            self.started_at = self.updated_at
        
        if status in [TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.TIMEOUT, TaskStatus.CANCELLED]:
            self.completed_at = self.updated_at
    
    def set_result(self, result: Any):
        """
        Set the task result and update status to completed.
        
        Args:
            result: Task execution result
        """
        self.result = result
        self.update_status(TaskStatus.COMPLETED)
        
        # Call callback if defined
        if callable(self.callback):
            try:
                self.callback(self)
            except Exception as e:
                # Log but don't fail on callback errors
                print(f"Error in task callback: {e}")
    
    def set_error(self, error: str):
        """
        Set the task error and update status to failed.
        
        Args:
            error: Error message
        """
        self.error = error
        self.update_status(TaskStatus.FAILED)
        
        # Call callback if defined
        if callable(self.callback):
            try:
                self.callback(self)
            except Exception as e:
                # Log but don't fail on callback errors
                print(f"Error in task callback: {e}")
    
    def set_callback(self, callback: Callable[['Task'], None]):
        """
        Set a callback function to be called when the task completes.
        
        Args:
            callback: Function to call with the task as argument
        """
        self.callback = callback
    
    def add_subtask(self, subtask_id: str):
        """
        Add a subtask ID to this task.
        
        Args:
            subtask_id: ID of the subtask
        """
        if subtask_id not in self.subtasks:
            self.subtasks.append(subtask_id)
            self.updated_at = datetime.utcnow().isoformat()