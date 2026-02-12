"""
Audit System Component for TerraFusion Sync Service.

This module provides comprehensive auditing capabilities for synchronization operations,
tracking all changes, conflicts, and operations for compliance and debugging purposes.
"""

import os
import uuid
import logging
import datetime
import json
import threading
from typing import Dict, List, Any, Tuple, Optional, Union, Set, Callable

import sqlalchemy as sa
from sqlalchemy.sql import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.engine import Engine, Connection

logger = logging.getLogger(__name__)


class AuditEvent:
    """Represents an auditable event in the synchronization process."""
    
    def __init__(self, 
                 event_id: str,
                 event_type: str,
                 component: str,
                 job_id: str,
                 table_name: Optional[str] = None,
                 record_id: Optional[str] = None,
                 operation: Optional[str] = None,
                 user_id: Optional[str] = None,
                 data: Optional[Dict[str, Any]] = None,
                 timestamp: datetime.datetime = None,
                 success: bool = True,
                 error_message: Optional[str] = None):
        """
        Initialize an audit event.
        
        Args:
            event_id: Unique identifier for the event
            event_type: Type of event (e.g., 'operation', 'conflict', 'schema_change')
            component: Component that generated the event
            job_id: ID of the sync job
            table_name: Name of the table involved
            record_id: ID of the record involved
            operation: Type of operation (e.g., 'insert', 'update', 'delete')
            user_id: ID of the user who initiated the action
            data: Additional event-specific data
            timestamp: When the event occurred
            success: Whether the event was successful
            error_message: Error message if event failed
        """
        self.event_id = event_id
        self.event_type = event_type
        self.component = component
        self.job_id = job_id
        self.table_name = table_name
        self.record_id = record_id
        self.operation = operation
        self.user_id = user_id
        self.data = data or {}
        self.timestamp = timestamp or datetime.datetime.utcnow()
        self.success = success
        self.error_message = error_message
        
    def to_dict(self) -> Dict[str, Any]:
        """Convert event to a dictionary representation."""
        return {
            'event_id': self.event_id,
            'event_type': self.event_type,
            'component': self.component,
            'job_id': self.job_id,
            'table_name': self.table_name,
            'record_id': self.record_id,
            'operation': self.operation,
            'user_id': self.user_id,
            'data': self.data,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'success': self.success,
            'error_message': self.error_message
        }
        
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'AuditEvent':
        """
        Create an AuditEvent from a dictionary representation.
        
        Args:
            data: Dictionary representation of an audit event
            
        Returns:
            AuditEvent instance
        """
        timestamp = None
        if data.get('timestamp'):
            try:
                timestamp = datetime.datetime.fromisoformat(data['timestamp'])
            except ValueError:
                timestamp = datetime.datetime.utcnow()
                
        return cls(
            event_id=data['event_id'],
            event_type=data['event_type'],
            component=data['component'],
            job_id=data['job_id'],
            table_name=data.get('table_name'),
            record_id=data.get('record_id'),
            operation=data.get('operation'),
            user_id=data.get('user_id'),
            data=data.get('data', {}),
            timestamp=timestamp,
            success=data.get('success', True),
            error_message=data.get('error_message')
        )


class AuditStore:
    """Interface for storing audit events."""
    
    def store_event(self, event: AuditEvent) -> bool:
        """
        Store an audit event.
        
        Args:
            event: Event to store
            
        Returns:
            True if storage was successful
        """
        raise NotImplementedError("Subclasses must implement store_event method")
        
    def get_events(self, 
                  job_id: Optional[str] = None,
                  event_type: Optional[str] = None,
                  component: Optional[str] = None,
                  table_name: Optional[str] = None,
                  start_time: Optional[datetime.datetime] = None,
                  end_time: Optional[datetime.datetime] = None,
                  success: Optional[bool] = None,
                  limit: int = 1000,
                  offset: int = 0) -> List[AuditEvent]:
        """
        Get audit events with filtering.
        
        Args:
            job_id: Filter by job ID
            event_type: Filter by event type
            component: Filter by component
            table_name: Filter by table name
            start_time: Filter for events after this time
            end_time: Filter for events before this time
            success: Filter by success status
            limit: Maximum number of events to return
            offset: Offset for pagination
            
        Returns:
            List of audit events
        """
        raise NotImplementedError("Subclasses must implement get_events method")
        
    def get_event(self, event_id: str) -> Optional[AuditEvent]:
        """
        Get an audit event by ID.
        
        Args:
            event_id: ID of the event to get
            
        Returns:
            AuditEvent if found, None otherwise
        """
        raise NotImplementedError("Subclasses must implement get_event method")


class InMemoryAuditStore(AuditStore):
    """In-memory implementation of AuditStore."""
    
    def __init__(self, max_events: int = 100000):
        """
        Initialize an in-memory audit store.
        
        Args:
            max_events: Maximum number of events to store in memory
        """
        self.events = {}  # Map event_id to AuditEvent
        self.max_events = max_events
        self.lock = threading.RLock()
        
    def store_event(self, event: AuditEvent) -> bool:
        """
        Store an audit event in memory.
        
        Args:
            event: Event to store
            
        Returns:
            True if storage was successful
        """
        with self.lock:
            self.events[event.event_id] = event
            
            # Enforce max events limit
            if len(self.events) > self.max_events:
                # Remove oldest events
                excess = len(self.events) - self.max_events
                oldest = sorted(
                    self.events.items(),
                    key=lambda item: item[1].timestamp
                )[:excess]
                for event_id, _ in oldest:
                    del self.events[event_id]
                    
        return True
        
    def get_events(self, 
                  job_id: Optional[str] = None,
                  event_type: Optional[str] = None,
                  component: Optional[str] = None,
                  table_name: Optional[str] = None,
                  start_time: Optional[datetime.datetime] = None,
                  end_time: Optional[datetime.datetime] = None,
                  success: Optional[bool] = None,
                  limit: int = 1000,
                  offset: int = 0) -> List[AuditEvent]:
        """
        Get audit events with filtering.
        
        Args:
            job_id: Filter by job ID
            event_type: Filter by event type
            component: Filter by component
            table_name: Filter by table name
            start_time: Filter for events after this time
            end_time: Filter for events before this time
            success: Filter by success status
            limit: Maximum number of events to return
            offset: Offset for pagination
            
        Returns:
            List of audit events
        """
        with self.lock:
            filtered_events = []
            
            for event in self.events.values():
                # Apply filters
                if job_id is not None and event.job_id != job_id:
                    continue
                if event_type is not None and event.event_type != event_type:
                    continue
                if component is not None and event.component != component:
                    continue
                if table_name is not None and event.table_name != table_name:
                    continue
                if start_time is not None and event.timestamp < start_time:
                    continue
                if end_time is not None and event.timestamp > end_time:
                    continue
                if success is not None and event.success != success:
                    continue
                    
                filtered_events.append(event)
                
            # Sort by timestamp (newest first)
            filtered_events.sort(key=lambda e: e.timestamp, reverse=True)
            
            # Apply pagination
            return filtered_events[offset:offset+limit]
            
    def get_event(self, event_id: str) -> Optional[AuditEvent]:
        """
        Get an audit event by ID.
        
        Args:
            event_id: ID of the event to get
            
        Returns:
            AuditEvent if found, None otherwise
        """
        with self.lock:
            return self.events.get(event_id)
            
    def clear(self):
        """Clear all events from the store."""
        with self.lock:
            self.events.clear()


class DatabaseAuditStore(AuditStore):
    """Database implementation of AuditStore."""
    
    def __init__(self, 
                 engine: Engine,
                 table_name: str = 'sync_audit_events'):
        """
        Initialize a database audit store.
        
        Args:
            engine: SQLAlchemy engine
            table_name: Name of the audit events table
        """
        self.engine = engine
        self.table_name = table_name
        
        # Ensure the table exists
        self._ensure_table_exists()
        
    def _ensure_table_exists(self):
        """Create the audit events table if it doesn't exist."""
        try:
            with self.engine.begin() as conn:
                # Check if table exists
                table_exists_query = text(f"""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = :table_name
                )
                """)
                result = conn.execute(table_exists_query, {'table_name': self.table_name})
                table_exists = result.scalar()
                
                if not table_exists:
                    # Create the table
                    create_table_query = text(f"""
                    CREATE TABLE {self.table_name} (
                        event_id VARCHAR(50) PRIMARY KEY,
                        event_type VARCHAR(50) NOT NULL,
                        component VARCHAR(50) NOT NULL,
                        job_id VARCHAR(50) NOT NULL,
                        table_name VARCHAR(100),
                        record_id VARCHAR(200),
                        operation VARCHAR(50),
                        user_id VARCHAR(50),
                        data JSONB,
                        timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
                        success BOOLEAN NOT NULL,
                        error_message TEXT
                    )
                    """)
                    conn.execute(create_table_query)
                    
                    # Create indexes
                    index_queries = [
                        text(f"CREATE INDEX idx_{self.table_name}_job_id ON {self.table_name} (job_id)"),
                        text(f"CREATE INDEX idx_{self.table_name}_timestamp ON {self.table_name} (timestamp)"),
                        text(f"CREATE INDEX idx_{self.table_name}_event_type ON {self.table_name} (event_type)"),
                        text(f"CREATE INDEX idx_{self.table_name}_table_name ON {self.table_name} (table_name)"),
                        text(f"CREATE INDEX idx_{self.table_name}_success ON {self.table_name} (success)")
                    ]
                    for query in index_queries:
                        conn.execute(query)
                        
                    logger.info(f"Created audit events table: {self.table_name}")
                    
        except Exception as e:
            logger.error(f"Error ensuring audit table exists: {str(e)}")
            
    def store_event(self, event: AuditEvent) -> bool:
        """
        Store an audit event in the database.
        
        Args:
            event: Event to store
            
        Returns:
            True if storage was successful
        """
        try:
            query = text(f"""
            INSERT INTO {self.table_name} (
                event_id, event_type, component, job_id, table_name, record_id,
                operation, user_id, data, timestamp, success, error_message
            ) VALUES (
                :event_id, :event_type, :component, :job_id, :table_name, :record_id,
                :operation, :user_id, :data, :timestamp, :success, :error_message
            )
            """)
            
            params = {
                'event_id': event.event_id,
                'event_type': event.event_type,
                'component': event.component,
                'job_id': event.job_id,
                'table_name': event.table_name,
                'record_id': event.record_id,
                'operation': event.operation,
                'user_id': event.user_id,
                'data': json.dumps(event.data),
                'timestamp': event.timestamp,
                'success': event.success,
                'error_message': event.error_message
            }
            
            with self.engine.begin() as conn:
                conn.execute(query, params)
                
            return True
            
        except Exception as e:
            logger.error(f"Error storing audit event: {str(e)}")
            return False
            
    def get_events(self, 
                  job_id: Optional[str] = None,
                  event_type: Optional[str] = None,
                  component: Optional[str] = None,
                  table_name: Optional[str] = None,
                  start_time: Optional[datetime.datetime] = None,
                  end_time: Optional[datetime.datetime] = None,
                  success: Optional[bool] = None,
                  limit: int = 1000,
                  offset: int = 0) -> List[AuditEvent]:
        """
        Get audit events with filtering.
        
        Args:
            job_id: Filter by job ID
            event_type: Filter by event type
            component: Filter by component
            table_name: Filter by table name
            start_time: Filter for events after this time
            end_time: Filter for events before this time
            success: Filter by success status
            limit: Maximum number of events to return
            offset: Offset for pagination
            
        Returns:
            List of audit events
        """
        try:
            # Build the WHERE clause based on filters
            conditions = []
            params = {}
            
            if job_id is not None:
                conditions.append("job_id = :job_id")
                params['job_id'] = job_id
                
            if event_type is not None:
                conditions.append("event_type = :event_type")
                params['event_type'] = event_type
                
            if component is not None:
                conditions.append("component = :component")
                params['component'] = component
                
            if table_name is not None:
                conditions.append("table_name = :table_name")
                params['table_name'] = table_name
                
            if start_time is not None:
                conditions.append("timestamp >= :start_time")
                params['start_time'] = start_time
                
            if end_time is not None:
                conditions.append("timestamp <= :end_time")
                params['end_time'] = end_time
                
            if success is not None:
                conditions.append("success = :success")
                params['success'] = success
                
            # Build the query
            query_text = f"SELECT * FROM {self.table_name}"
            if conditions:
                query_text += " WHERE " + " AND ".join(conditions)
                
            # Add ordering and pagination
            query_text += " ORDER BY timestamp DESC"
            query_text += " LIMIT :limit OFFSET :offset"
            params['limit'] = limit
            params['offset'] = offset
            
            query = text(query_text)
            
            events = []
            with self.engine.connect() as conn:
                result = conn.execute(query, params)
                
                for row in result:
                    # Convert row to dictionary
                    row_dict = dict(row)
                    
                    # Parse JSON data
                    if row_dict['data'] and isinstance(row_dict['data'], str):
                        row_dict['data'] = json.loads(row_dict['data'])
                        
                    # Create AuditEvent object
                    event = AuditEvent(
                        event_id=row_dict['event_id'],
                        event_type=row_dict['event_type'],
                        component=row_dict['component'],
                        job_id=row_dict['job_id'],
                        table_name=row_dict['table_name'],
                        record_id=row_dict['record_id'],
                        operation=row_dict['operation'],
                        user_id=row_dict['user_id'],
                        data=row_dict['data'] or {},
                        timestamp=row_dict['timestamp'],
                        success=row_dict['success'],
                        error_message=row_dict['error_message']
                    )
                    events.append(event)
                    
            return events
            
        except Exception as e:
            logger.error(f"Error getting audit events: {str(e)}")
            return []
            
    def get_event(self, event_id: str) -> Optional[AuditEvent]:
        """
        Get an audit event by ID.
        
        Args:
            event_id: ID of the event to get
            
        Returns:
            AuditEvent if found, None otherwise
        """
        try:
            query = text(f"SELECT * FROM {self.table_name} WHERE event_id = :event_id")
            
            with self.engine.connect() as conn:
                result = conn.execute(query, {'event_id': event_id})
                row = result.fetchone()
                
                if not row:
                    return None
                    
                # Convert row to dictionary
                row_dict = dict(row)
                
                # Parse JSON data
                if row_dict['data'] and isinstance(row_dict['data'], str):
                    row_dict['data'] = json.loads(row_dict['data'])
                    
                # Create AuditEvent object
                return AuditEvent(
                    event_id=row_dict['event_id'],
                    event_type=row_dict['event_type'],
                    component=row_dict['component'],
                    job_id=row_dict['job_id'],
                    table_name=row_dict['table_name'],
                    record_id=row_dict['record_id'],
                    operation=row_dict['operation'],
                    user_id=row_dict['user_id'],
                    data=row_dict['data'] or {},
                    timestamp=row_dict['timestamp'],
                    success=row_dict['success'],
                    error_message=row_dict['error_message']
                )
                
        except Exception as e:
            logger.error(f"Error getting audit event: {str(e)}")
            return None


class FileAuditStore(AuditStore):
    """File-based implementation of AuditStore."""
    
    def __init__(self, 
                 directory: str,
                 max_file_size_mb: float = 10.0,
                 max_files: int = 10,
                 index_in_memory: bool = True):
        """
        Initialize a file-based audit store.
        
        Args:
            directory: Directory to store audit files
            max_file_size_mb: Maximum size of audit files in MB
            max_files: Maximum number of audit files to keep
            index_in_memory: Whether to keep an in-memory index of events
        """
        self.directory = directory
        self.max_file_size_mb = max_file_size_mb
        self.max_files = max_files
        self.index_in_memory = index_in_memory
        
        self.current_file = None
        self.file_counter = 0
        self.lock = threading.RLock()
        
        # In-memory index for faster lookups
        self.event_index = {}  # Map event_id to (file_path, line_offset)
        
        # Create directory if it doesn't exist
        os.makedirs(directory, exist_ok=True)
        
        # Initialize current file
        self._initialize_current_file()
        
    def _initialize_current_file(self):
        """Initialize the current audit file."""
        with self.lock:
            # Find the highest existing file counter
            file_pattern = os.path.join(self.directory, 'audit_*.json')
            existing_files = [
                f for f in os.listdir(self.directory)
                if f.startswith('audit_') and f.endswith('.json')
            ]
            
            if existing_files:
                # Extract counter values
                counters = []
                for f in existing_files:
                    try:
                        counter = int(f[6:-5])  # Extract number from audit_NNN.json
                        counters.append(counter)
                    except ValueError:
                        pass
                        
                if counters:
                    self.file_counter = max(counters)
                    
            # Create a new file
            self._create_new_file()
            
            # Build index if enabled
            if self.index_in_memory:
                self._build_index()
                
    def _create_new_file(self):
        """Create a new audit file."""
        self.file_counter += 1
        self.current_file = os.path.join(
            self.directory, 
            f'audit_{self.file_counter:03d}.json'
        )
        
        # If file doesn't exist, create it with an empty JSON array
        if not os.path.exists(self.current_file):
            with open(self.current_file, 'w') as f:
                f.write('[\n]')
                
        logger.info(f"Created new audit file: {self.current_file}")
        
        # Clean up old files
        self._cleanup_old_files()
        
    def _cleanup_old_files(self):
        """Delete oldest audit files if over the max limit."""
        audit_files = sorted([
            os.path.join(self.directory, f)
            for f in os.listdir(self.directory)
            if f.startswith('audit_') and f.endswith('.json')
        ])
        
        # Keep the newest files
        files_to_delete = audit_files[:-self.max_files] if len(audit_files) > self.max_files else []
        
        for file_path in files_to_delete:
            try:
                os.remove(file_path)
                logger.info(f"Deleted old audit file: {file_path}")
                
                # Remove from index
                if self.index_in_memory:
                    self.event_index = {
                        event_id: location
                        for event_id, location in self.event_index.items()
                        if location[0] != file_path
                    }
            except OSError as e:
                logger.error(f"Error deleting old audit file {file_path}: {str(e)}")
                
    def _check_file_size(self):
        """Check if the current file is over max size and create a new one if needed."""
        if not os.path.exists(self.current_file):
            self._create_new_file()
            return
            
        file_size_mb = os.path.getsize(self.current_file) / (1024 * 1024)
        if file_size_mb >= self.max_file_size_mb:
            self._create_new_file()
            
    def _build_index(self):
        """Build an in-memory index of all events."""
        if not self.index_in_memory:
            return
            
        self.event_index = {}
        
        audit_files = sorted([
            os.path.join(self.directory, f)
            for f in os.listdir(self.directory)
            if f.startswith('audit_') and f.endswith('.json')
        ])
        
        for file_path in audit_files:
            try:
                with open(file_path, 'r') as f:
                    # Read the entire file to get all events
                    content = f.read()
                    if content.strip() in ('', '[]', '['):
                        continue
                        
                    # Fix the JSON format (remove trailing comma if any)
                    if content.strip().endswith(',\n]'):
                        content = content.strip()[:-3] + '\n]'
                    elif content.strip().endswith(',]'):
                        content = content.strip()[:-2] + ']'
                        
                    try:
                        events_array = json.loads(content)
                        for event_dict in events_array:
                            if 'event_id' in event_dict:
                                self.event_index[event_dict['event_id']] = (file_path, 0)  # Offset is not relevant for full read
                    except json.JSONDecodeError:
                        # Fall back to line-by-line reading for malformed JSON
                        f.seek(0)
                        line_offset = 0
                        for line in f:
                            if line.strip() and not line.strip() in ('[]', '[', ']'):
                                # Remove trailing comma if any
                                json_line = line.strip()
                                if json_line.endswith(','):
                                    json_line = json_line[:-1]
                                    
                                try:
                                    event_dict = json.loads(json_line)
                                    if 'event_id' in event_dict:
                                        self.event_index[event_dict['event_id']] = (file_path, line_offset)
                                except json.JSONDecodeError:
                                    pass
                                    
                            line_offset = f.tell()
            except Exception as e:
                logger.error(f"Error building index for file {file_path}: {str(e)}")
                
    def store_event(self, event: AuditEvent) -> bool:
        """
        Store an audit event in a file.
        
        Args:
            event: Event to store
            
        Returns:
            True if storage was successful
        """
        with self.lock:
            try:
                # Check if file needs to be rotated
                self._check_file_size()
                
                # Convert event to JSON
                event_json = json.dumps(event.to_dict())
                
                # Append to the file
                with open(self.current_file, 'r+') as f:
                    # Go to the end of the file minus closing bracket
                    f.seek(0, os.SEEK_END)
                    position = f.tell()
                    f.seek(max(0, position - 2))
                    
                    # Check if we need to add a comma
                    ending = f.read()
                    f.seek(max(0, position - 2))
                    
                    if ending.strip() == ']':
                        # File has events, add comma and new event
                        f.write(',\n' + event_json + '\n]')
                    else:
                        # File is empty or not properly formatted
                        f.seek(0)
                        content = f.read().strip()
                        
                        if content in ('', '[]', '['):
                            # Empty file, write with brackets
                            f.seek(0)
                            f.write('[\n' + event_json + '\n]')
                            f.truncate()
                        else:
                            # Malformed file, append at end
                            f.seek(0, os.SEEK_END)
                            f.write(event_json + '\n]')
                            
                # Update index
                if self.index_in_memory:
                    self.event_index[event.event_id] = (self.current_file, 0)  # Offset not tracked for simplicity
                    
                return True
                
            except Exception as e:
                logger.error(f"Error storing audit event to file: {str(e)}")
                return False
                
    def get_events(self, 
                  job_id: Optional[str] = None,
                  event_type: Optional[str] = None,
                  component: Optional[str] = None,
                  table_name: Optional[str] = None,
                  start_time: Optional[datetime.datetime] = None,
                  end_time: Optional[datetime.datetime] = None,
                  success: Optional[bool] = None,
                  limit: int = 1000,
                  offset: int = 0) -> List[AuditEvent]:
        """
        Get audit events with filtering.
        
        Args:
            job_id: Filter by job ID
            event_type: Filter by event type
            component: Filter by component
            table_name: Filter by table name
            start_time: Filter for events after this time
            end_time: Filter for events before this time
            success: Filter by success status
            limit: Maximum number of events to return
            offset: Offset for pagination
            
        Returns:
            List of audit events
        """
        with self.lock:
            all_events = []
            
            # Load all events from files
            audit_files = sorted([
                os.path.join(self.directory, f)
                for f in os.listdir(self.directory)
                if f.startswith('audit_') and f.endswith('.json')
            ], reverse=True)  # Newest first
            
            for file_path in audit_files:
                try:
                    with open(file_path, 'r') as f:
                        # Read the entire file
                        content = f.read()
                        
                        # Fix JSON if needed
                        if content.strip().endswith(',\n]'):
                            content = content.strip()[:-3] + '\n]'
                        elif content.strip().endswith(',]'):
                            content = content.strip()[:-2] + ']'
                            
                        if content.strip() in ('', '[]', '[', ']'):
                            continue
                            
                        try:
                            events_array = json.loads(content)
                            for event_dict in events_array:
                                # Create AuditEvent object
                                event = AuditEvent.from_dict(event_dict)
                                all_events.append(event)
                        except json.JSONDecodeError:
                            logger.error(f"Malformed JSON in audit file {file_path}")
                except Exception as e:
                    logger.error(f"Error reading audit file {file_path}: {str(e)}")
                    
            # Apply filters
            filtered_events = []
            for event in all_events:
                if job_id is not None and event.job_id != job_id:
                    continue
                if event_type is not None and event.event_type != event_type:
                    continue
                if component is not None and event.component != component:
                    continue
                if table_name is not None and event.table_name != table_name:
                    continue
                if start_time is not None and event.timestamp < start_time:
                    continue
                if end_time is not None and event.timestamp > end_time:
                    continue
                if success is not None and event.success != success:
                    continue
                    
                filtered_events.append(event)
                
            # Sort by timestamp (newest first)
            filtered_events.sort(key=lambda e: e.timestamp, reverse=True)
            
            # Apply pagination
            return filtered_events[offset:offset+limit]
            
    def get_event(self, event_id: str) -> Optional[AuditEvent]:
        """
        Get an audit event by ID.
        
        Args:
            event_id: ID of the event to get
            
        Returns:
            AuditEvent if found, None otherwise
        """
        with self.lock:
            # Use index if available
            if self.index_in_memory and event_id in self.event_index:
                file_path, _ = self.event_index[event_id]
                
                try:
                    with open(file_path, 'r') as f:
                        content = f.read()
                        
                        # Fix JSON if needed
                        if content.strip().endswith(',\n]'):
                            content = content.strip()[:-3] + '\n]'
                        elif content.strip().endswith(',]'):
                            content = content.strip()[:-2] + ']'
                            
                        events_array = json.loads(content)
                        for event_dict in events_array:
                            if event_dict.get('event_id') == event_id:
                                return AuditEvent.from_dict(event_dict)
                except Exception as e:
                    logger.error(f"Error reading audit file {file_path}: {str(e)}")
                    
            # Fall back to full scan if not found or no index
            audit_files = [
                os.path.join(self.directory, f)
                for f in os.listdir(self.directory)
                if f.startswith('audit_') and f.endswith('.json')
            ]
            
            for file_path in audit_files:
                try:
                    with open(file_path, 'r') as f:
                        content = f.read()
                        
                        # Fix JSON if needed
                        if content.strip().endswith(',\n]'):
                            content = content.strip()[:-3] + '\n]'
                        elif content.strip().endswith(',]'):
                            content = content.strip()[:-2] + ']'
                            
                        events_array = json.loads(content)
                        for event_dict in events_array:
                            if event_dict.get('event_id') == event_id:
                                return AuditEvent.from_dict(event_dict)
                except Exception as e:
                    logger.error(f"Error reading audit file {file_path}: {str(e)}")
                    
            return None


class MultiAuditStore(AuditStore):
    """Audit store that writes to multiple underlying stores."""
    
    def __init__(self, stores: List[AuditStore]):
        """
        Initialize a multi-store.
        
        Args:
            stores: List of audit stores to write to
        """
        self.stores = stores
        
    def store_event(self, event: AuditEvent) -> bool:
        """
        Store an audit event in all underlying stores.
        
        Args:
            event: Event to store
            
        Returns:
            True if storage was successful in at least one store
        """
        success = False
        for store in self.stores:
            store_success = store.store_event(event)
            success = success or store_success
            
        return success
        
    def get_events(self, 
                  job_id: Optional[str] = None,
                  event_type: Optional[str] = None,
                  component: Optional[str] = None,
                  table_name: Optional[str] = None,
                  start_time: Optional[datetime.datetime] = None,
                  end_time: Optional[datetime.datetime] = None,
                  success: Optional[bool] = None,
                  limit: int = 1000,
                  offset: int = 0) -> List[AuditEvent]:
        """
        Get audit events with filtering from the first store.
        
        Args:
            job_id: Filter by job ID
            event_type: Filter by event type
            component: Filter by component
            table_name: Filter by table name
            start_time: Filter for events after this time
            end_time: Filter for events before this time
            success: Filter by success status
            limit: Maximum number of events to return
            offset: Offset for pagination
            
        Returns:
            List of audit events
        """
        if not self.stores:
            return []
            
        # Use the first store for reading
        return self.stores[0].get_events(
            job_id=job_id,
            event_type=event_type,
            component=component,
            table_name=table_name,
            start_time=start_time,
            end_time=end_time,
            success=success,
            limit=limit,
            offset=offset
        )
        
    def get_event(self, event_id: str) -> Optional[AuditEvent]:
        """
        Get an audit event by ID from the first store.
        
        Args:
            event_id: ID of the event to get
            
        Returns:
            AuditEvent if found, None otherwise
        """
        if not self.stores:
            return None
            
        # Use the first store for reading
        return self.stores[0].get_event(event_id)


class AuditSystem:
    """
    Audit system for tracking all sync operations.
    
    Features:
    - Comprehensive event logging
    - Multiple storage options
    - Filtering and search
    - Compliance reporting
    """
    
    def __init__(self, 
                 audit_store: AuditStore = None,
                 engine: Engine = None,
                 audit_level: str = 'standard',
                 include_data: bool = False):
        """
        Initialize the Audit System.
        
        Args:
            audit_store: Store for audit events
            engine: SQLAlchemy engine (for database store)
            audit_level: Level of auditing ('minimal', 'standard', 'detailed')
            include_data: Whether to include record data in audit events
        """
        # Set up audit store
        if audit_store:
            self.audit_store = audit_store
        elif engine:
            self.audit_store = DatabaseAuditStore(engine)
        else:
            self.audit_store = InMemoryAuditStore()
            
        self.audit_level = audit_level
        self.include_data = include_data
        
    def log_event(self, 
                 event_type: str,
                 component: str,
                 job_id: str,
                 table_name: Optional[str] = None,
                 record_id: Optional[str] = None,
                 operation: Optional[str] = None,
                 user_id: Optional[str] = None,
                 data: Optional[Dict[str, Any]] = None,
                 success: bool = True,
                 error_message: Optional[str] = None) -> str:
        """
        Log an audit event.
        
        Args:
            event_type: Type of event
            component: Component that generated the event
            job_id: ID of the sync job
            table_name: Name of the table involved
            record_id: ID of the record involved
            operation: Type of operation
            user_id: ID of the user who initiated the action
            data: Additional event-specific data
            success: Whether the event was successful
            error_message: Error message if event failed
            
        Returns:
            ID of the created event
        """
        # Check audit level
        if self.audit_level == 'minimal' and event_type not in ('job_start', 'job_end', 'conflict', 'error'):
            return None
            
        if self.audit_level == 'standard' and event_type in ('record_read', 'schema_read'):
            return None
            
        # Filter data based on include_data setting
        if not self.include_data and data and 'record' in data:
            # Exclude full record data
            if event_type == 'conflict':
                # For conflicts, keep necessary information
                source = data.get('source_record', {})
                target = data.get('target_record', {})
                differences = data.get('differences', {})
                
                # Keep only primary key and changed fields
                if 'primary_keys' in data:
                    pk_fields = data['primary_keys']
                    filtered_source = {k: v for k, v in source.items() if k in pk_fields or k in differences}
                    filtered_target = {k: v for k, v in target.items() if k in pk_fields or k in differences}
                else:
                    filtered_source = {}
                    filtered_target = {}
                    
                data = {
                    'source_record': filtered_source,
                    'target_record': filtered_target,
                    'differences': differences,
                    'primary_keys': data.get('primary_keys', [])
                }
            else:
                # For other events, exclude record data
                data_copy = dict(data)
                if 'record' in data_copy:
                    del data_copy['record']
                if 'source_record' in data_copy:
                    del data_copy['source_record']
                if 'target_record' in data_copy:
                    del data_copy['target_record']
                data = data_copy
                
        # Create and store event
        event_id = str(uuid.uuid4())
        event = AuditEvent(
            event_id=event_id,
            event_type=event_type,
            component=component,
            job_id=job_id,
            table_name=table_name,
            record_id=record_id,
            operation=operation,
            user_id=user_id,
            data=data or {},
            success=success,
            error_message=error_message
        )
        
        self.audit_store.store_event(event)
        return event_id
        
    def log_operation(self, 
                     job_id: str,
                     table_name: str,
                     operation: str,
                     record_id: str,
                     record: Dict[str, Any] = None,
                     user_id: Optional[str] = None,
                     success: bool = True,
                     error_message: Optional[str] = None) -> str:
        """
        Log an operation event.
        
        Args:
            job_id: ID of the sync job
            table_name: Name of the table
            operation: Type of operation (insert, update, delete)
            record_id: ID of the record
            record: The record data
            user_id: ID of the user who initiated the action
            success: Whether the operation was successful
            error_message: Error message if operation failed
            
        Returns:
            ID of the created event
        """
        return self.log_event(
            event_type='operation',
            component='Sync',
            job_id=job_id,
            table_name=table_name,
            record_id=record_id,
            operation=operation,
            user_id=user_id,
            data={'record': record} if record else None,
            success=success,
            error_message=error_message
        )
        
    def log_conflict(self, 
                    job_id: str,
                    table_name: str,
                    record_id: str,
                    source_record: Dict[str, Any],
                    target_record: Dict[str, Any],
                    differences: Dict[str, Tuple[Any, Any]],
                    primary_keys: List[str],
                    user_id: Optional[str] = None) -> str:
        """
        Log a conflict event.
        
        Args:
            job_id: ID of the sync job
            table_name: Name of the table
            record_id: ID of the record
            source_record: Record from source database
            target_record: Record from target database
            differences: Dictionary mapping field names to (source_value, target_value) tuples
            primary_keys: List of primary key column names
            user_id: ID of the user who initiated the action
            
        Returns:
            ID of the created event
        """
        differences_dict = {
            field: {'source': src_val, 'target': tgt_val}
            for field, (src_val, tgt_val) in differences.items()
        }
        
        return self.log_event(
            event_type='conflict',
            component='ConflictResolver',
            job_id=job_id,
            table_name=table_name,
            record_id=record_id,
            operation='conflict',
            user_id=user_id,
            data={
                'source_record': source_record,
                'target_record': target_record,
                'differences': differences_dict,
                'primary_keys': primary_keys
            }
        )
        
    def log_conflict_resolution(self, 
                               job_id: str,
                               table_name: str,
                               record_id: str,
                               resolution_strategy: str,
                               resolved_record: Dict[str, Any],
                               user_id: Optional[str] = None) -> str:
        """
        Log a conflict resolution event.
        
        Args:
            job_id: ID of the sync job
            table_name: Name of the table
            record_id: ID of the record
            resolution_strategy: Strategy used to resolve the conflict
            resolved_record: The resolved record
            user_id: ID of the user who performed the resolution
            
        Returns:
            ID of the created event
        """
        return self.log_event(
            event_type='conflict_resolution',
            component='ConflictResolver',
            job_id=job_id,
            table_name=table_name,
            record_id=record_id,
            operation='resolve',
            user_id=user_id,
            data={
                'resolution_strategy': resolution_strategy,
                'record': resolved_record
            }
        )
        
    def log_error(self, 
                 job_id: str,
                 component: str,
                 error_message: str,
                 table_name: Optional[str] = None,
                 record_id: Optional[str] = None,
                 operation: Optional[str] = None,
                 user_id: Optional[str] = None,
                 data: Optional[Dict[str, Any]] = None) -> str:
        """
        Log an error event.
        
        Args:
            job_id: ID of the sync job
            component: Component where the error occurred
            error_message: Error message
            table_name: Name of the table involved
            record_id: ID of the record involved
            operation: Type of operation that failed
            user_id: ID of the user who initiated the action
            data: Additional error-specific data
            
        Returns:
            ID of the created event
        """
        return self.log_event(
            event_type='error',
            component=component,
            job_id=job_id,
            table_name=table_name,
            record_id=record_id,
            operation=operation,
            user_id=user_id,
            data=data,
            success=False,
            error_message=error_message
        )
        
    def log_job_start(self, 
                     job_id: str,
                     tables: List[str],
                     source_db: str,
                     target_db: str,
                     user_id: Optional[str] = None) -> str:
        """
        Log a job start event.
        
        Args:
            job_id: ID of the sync job
            tables: List of tables to be synchronized
            source_db: Source database identifier
            target_db: Target database identifier
            user_id: ID of the user who initiated the job
            
        Returns:
            ID of the created event
        """
        return self.log_event(
            event_type='job_start',
            component='Orchestrator',
            job_id=job_id,
            user_id=user_id,
            data={
                'tables': tables,
                'source_db': source_db,
                'target_db': target_db
            }
        )
        
    def log_job_end(self, 
                   job_id: str,
                   success: bool,
                   stats: Dict[str, Any],
                   error_message: Optional[str] = None,
                   user_id: Optional[str] = None) -> str:
        """
        Log a job end event.
        
        Args:
            job_id: ID of the sync job
            success: Whether the job was successful
            stats: Job statistics
            error_message: Error message if job failed
            user_id: ID of the user who initiated the job
            
        Returns:
            ID of the created event
        """
        return self.log_event(
            event_type='job_end',
            component='Orchestrator',
            job_id=job_id,
            user_id=user_id,
            data={'stats': stats},
            success=success,
            error_message=error_message
        )
        
    def get_job_events(self, 
                      job_id: str,
                      event_types: Optional[List[str]] = None,
                      limit: int = 1000,
                      offset: int = 0) -> List[AuditEvent]:
        """
        Get all events for a job.
        
        Args:
            job_id: ID of the sync job
            event_types: Optional list of event types to filter by
            limit: Maximum number of events to return
            offset: Offset for pagination
            
        Returns:
            List of audit events
        """
        if event_types and len(event_types) == 1:
            # Single event type
            return self.audit_store.get_events(
                job_id=job_id,
                event_type=event_types[0],
                limit=limit,
                offset=offset
            )
        elif event_types:
            # Multiple event types
            all_events = []
            for event_type in event_types:
                events = self.audit_store.get_events(
                    job_id=job_id,
                    event_type=event_type,
                    limit=limit
                )
                all_events.extend(events)
                
            # Sort by timestamp (newest first)
            all_events.sort(key=lambda e: e.timestamp, reverse=True)
            
            # Apply pagination
            return all_events[offset:offset+limit]
        else:
            # All event types
            return self.audit_store.get_events(
                job_id=job_id,
                limit=limit,
                offset=offset
            )
            
    def get_table_events(self, 
                        table_name: str,
                        event_types: Optional[List[str]] = None,
                        start_time: Optional[datetime.datetime] = None,
                        end_time: Optional[datetime.datetime] = None,
                        limit: int = 1000,
                        offset: int = 0) -> List[AuditEvent]:
        """
        Get all events for a table.
        
        Args:
            table_name: Name of the table
            event_types: Optional list of event types to filter by
            start_time: Filter for events after this time
            end_time: Filter for events before this time
            limit: Maximum number of events to return
            offset: Offset for pagination
            
        Returns:
            List of audit events
        """
        if event_types and len(event_types) == 1:
            # Single event type
            return self.audit_store.get_events(
                table_name=table_name,
                event_type=event_types[0],
                start_time=start_time,
                end_time=end_time,
                limit=limit,
                offset=offset
            )
        elif event_types:
            # Multiple event types
            all_events = []
            for event_type in event_types:
                events = self.audit_store.get_events(
                    table_name=table_name,
                    event_type=event_type,
                    start_time=start_time,
                    end_time=end_time,
                    limit=limit
                )
                all_events.extend(events)
                
            # Sort by timestamp (newest first)
            all_events.sort(key=lambda e: e.timestamp, reverse=True)
            
            # Apply pagination
            return all_events[offset:offset+limit]
        else:
            # All event types
            return self.audit_store.get_events(
                table_name=table_name,
                start_time=start_time,
                end_time=end_time,
                limit=limit,
                offset=offset
            )
            
    def get_record_history(self, 
                          table_name: str,
                          record_id: str,
                          start_time: Optional[datetime.datetime] = None,
                          end_time: Optional[datetime.datetime] = None) -> List[AuditEvent]:
        """
        Get the history of a record.
        
        Args:
            table_name: Name of the table
            record_id: ID of the record
            start_time: Filter for events after this time
            end_time: Filter for events before this time
            
        Returns:
            List of audit events for the record
        """
        return self.audit_store.get_events(
            table_name=table_name,
            record_id=record_id,
            start_time=start_time,
            end_time=end_time,
            limit=1000
        )
        
    def generate_report(self, 
                       job_id: Optional[str] = None,
                       table_name: Optional[str] = None,
                       start_time: Optional[datetime.datetime] = None,
                       end_time: Optional[datetime.datetime] = None) -> Dict[str, Any]:
        """
        Generate a summary report of audit events.
        
        Args:
            job_id: Filter by job ID
            table_name: Filter by table name
            start_time: Filter for events after this time
            end_time: Filter for events before this time
            
        Returns:
            Report with summary statistics
        """
        # Get relevant events
        events = self.audit_store.get_events(
            job_id=job_id,
            table_name=table_name,
            start_time=start_time,
            end_time=end_time,
            limit=10000  # Use a large limit for report generation
        )
        
        # Count events by type
        event_counts = {}
        for event in events:
            event_type = event.event_type
            event_counts[event_type] = event_counts.get(event_type, 0) + 1
            
        # Count operations
        operation_counts = {}
        for event in events:
            if event.event_type == 'operation' and event.operation:
                operation = event.operation
                operation_counts[operation] = operation_counts.get(operation, 0) + 1
                
        # Count errors
        error_count = sum(1 for event in events if not event.success)
        
        # Count conflicts
        conflict_count = sum(1 for event in events if event.event_type == 'conflict')
        
        # Count by component
        component_counts = {}
        for event in events:
            component = event.component
            component_counts[component] = component_counts.get(component, 0) + 1
            
        # Count by table
        table_counts = {}
        for event in events:
            if event.table_name:
                table = event.table_name
                table_counts[table] = table_counts.get(table, 0) + 1
                
        # Get earliest and latest events
        if events:
            earliest = min(events, key=lambda e: e.timestamp).timestamp
            latest = max(events, key=lambda e: e.timestamp).timestamp
        else:
            earliest = None
            latest = None
            
        # Generate report
        report = {
            'total_events': len(events),
            'event_counts': event_counts,
            'operation_counts': operation_counts,
            'error_count': error_count,
            'conflict_count': conflict_count,
            'component_counts': component_counts,
            'table_counts': table_counts,
            'earliest_event': earliest.isoformat() if earliest else None,
            'latest_event': latest.isoformat() if latest else None,
            'filters': {
                'job_id': job_id,
                'table_name': table_name,
                'start_time': start_time.isoformat() if start_time else None,
                'end_time': end_time.isoformat() if end_time else None
            }
        }
        
        return report
        
    def cleanup_old_events(self, 
                          retention_days: int = 90,
                          event_types: Optional[List[str]] = None) -> int:
        """
        Delete old events from the audit store.
        
        Args:
            retention_days: Number of days to retain events
            event_types: Optional list of event types to clean up
            
        Returns:
            Number of events deleted
        """
        # Not implemented for all store types
        logger.warning("Cleanup not implemented for this audit store type")
        return 0