"""
Self-Healing Orchestrator Component for TerraFusion Sync Service.

This module orchestrates the entire synchronization process, managing the flow of data
through the different components and providing error recovery and self-healing capabilities.
"""

import os
import uuid
import logging
import datetime
import threading
import time
import json
import traceback
from typing import Dict, List, Any, Tuple, Optional, Union, Set, Callable

import sqlalchemy as sa
from sqlalchemy.sql import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.engine import Engine, Connection

from sync_service.terra_fusion.change_detector import ChangeDetector
from sync_service.terra_fusion.transformer import Transformer
from sync_service.terra_fusion.validator import Validator
from sync_service.terra_fusion.conflict_resolver import ConflictResolver
from sync_service.terra_fusion.audit_system import AuditSystem
from sync_service.data_type_handlers import DataTypeHandler, get_handler_for_column

logger = logging.getLogger(__name__)


class RetryPolicy:
    """Policy for retrying failed operations."""
    
    def __init__(self, 
                 max_retries: int = 3, 
                 base_delay: float = 2.0, 
                 max_delay: float = 60.0,
                 exponential_backoff: bool = True):
        """
        Initialize a retry policy.
        
        Args:
            max_retries: Maximum number of retry attempts
            base_delay: Base delay between retries in seconds
            max_delay: Maximum delay between retries in seconds
            exponential_backoff: Whether to use exponential backoff for delays
        """
        self.max_retries = max_retries
        self.base_delay = base_delay
        self.max_delay = max_delay
        self.exponential_backoff = exponential_backoff
        
    def get_delay(self, attempt: int) -> float:
        """
        Calculate delay for a retry attempt.
        
        Args:
            attempt: Current retry attempt (0-based)
            
        Returns:
            Delay in seconds before the next retry
        """
        if attempt >= self.max_retries:
            raise ValueError(f"Retry attempt {attempt + 1} exceeds max retries {self.max_retries}")
            
        if self.exponential_backoff:
            # Exponential backoff: base_delay * 2^attempt
            delay = self.base_delay * (2 ** attempt)
        else:
            # Linear backoff: base_delay * (attempt + 1)
            delay = self.base_delay * (attempt + 1)
            
        # Cap at max_delay
        return min(delay, self.max_delay)


class SyncOperation:
    """Represents a synchronization operation that can be tracked and retried."""
    
    def __init__(self, 
                 operation_id: str,
                 table_name: str,
                 operation_type: str,
                 record_ids: List[str],
                 records: List[Dict[str, Any]],
                 status: str = 'pending',
                 retry_count: int = 0,
                 last_error: str = None,
                 created_at: datetime.datetime = None,
                 updated_at: datetime.datetime = None):
        """
        Initialize a sync operation.
        
        Args:
            operation_id: Unique identifier for the operation
            table_name: Name of the table being synchronized
            operation_type: Type of operation ('insert', 'update', 'delete')
            record_ids: List of record identifiers
            records: List of records to synchronize
            status: Current status of the operation
            retry_count: Number of retry attempts so far
            last_error: Last error message if any
            created_at: Creation timestamp
            updated_at: Last update timestamp
        """
        self.operation_id = operation_id
        self.table_name = table_name
        self.operation_type = operation_type
        self.record_ids = record_ids
        self.records = records
        self.status = status
        self.retry_count = retry_count
        self.last_error = last_error
        self.created_at = created_at or datetime.datetime.utcnow()
        self.updated_at = updated_at or self.created_at
        
    def mark_retried(self, error: str = None):
        """
        Mark the operation as retried.
        
        Args:
            error: Error message if the retry failed
        """
        self.retry_count += 1
        self.last_error = error
        self.updated_at = datetime.datetime.utcnow()
        if error:
            self.status = 'failed'
        
    def mark_completed(self):
        """Mark the operation as completed successfully."""
        self.status = 'completed'
        self.updated_at = datetime.datetime.utcnow()
        
    def mark_failed(self, error: str):
        """
        Mark the operation as permanently failed.
        
        Args:
            error: Error message describing the failure
        """
        self.status = 'failed'
        self.last_error = error
        self.updated_at = datetime.datetime.utcnow()
        
    def to_dict(self) -> Dict[str, Any]:
        """Convert operation to a dictionary representation."""
        return {
            'operation_id': self.operation_id,
            'table_name': self.table_name,
            'operation_type': self.operation_type,
            'record_ids': self.record_ids,
            'status': self.status,
            'retry_count': self.retry_count,
            'last_error': self.last_error,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'SyncOperation':
        """
        Create a SyncOperation from a dictionary representation.
        
        Args:
            data: Dictionary representation of a sync operation
            
        Returns:
            SyncOperation instance
        """
        return cls(
            operation_id=data['operation_id'],
            table_name=data['table_name'],
            operation_type=data['operation_type'],
            record_ids=data['record_ids'],
            records=data.get('records', []),
            status=data['status'],
            retry_count=data['retry_count'],
            last_error=data['last_error'],
            created_at=datetime.datetime.fromisoformat(data['created_at']) if data.get('created_at') else None,
            updated_at=datetime.datetime.fromisoformat(data['updated_at']) if data.get('updated_at') else None
        )


class SyncState:
    """Manages the state of a synchronization job."""
    
    def __init__(self, 
                 job_id: str,
                 source_connection: str = None,
                 target_connection: str = None,
                 tables: List[Dict[str, Any]] = None,
                 status: str = 'pending',
                 stats: Dict[str, Any] = None,
                 operations: Dict[str, SyncOperation] = None,
                 checkpoint: Dict[str, Any] = None,
                 created_at: datetime.datetime = None,
                 updated_at: datetime.datetime = None,
                 start_time: datetime.datetime = None,
                 end_time: datetime.datetime = None):
        """
        Initialize sync state.
        
        Args:
            job_id: Unique identifier for the sync job
            source_connection: Source database connection string or identifier
            target_connection: Target database connection string or identifier
            tables: List of tables to synchronize
            status: Current status of the job
            stats: Statistics about the job
            operations: Dictionary of operations by operation_id
            checkpoint: Checkpoint data for resuming
            created_at: Creation timestamp
            updated_at: Last update timestamp
            start_time: Job start timestamp
            end_time: Job end timestamp
        """
        self.job_id = job_id
        self.source_connection = source_connection
        self.target_connection = target_connection
        self.tables = tables or []
        self.status = status
        self.stats = stats or {
            'total_tables': 0,
            'processed_tables': 0,
            'total_records': 0,
            'processed_records': 0,
            'inserted_records': 0,
            'updated_records': 0,
            'deleted_records': 0,
            'error_records': 0,
            'conflict_records': 0
        }
        self.operations = operations or {}
        self.checkpoint = checkpoint or {}
        self.created_at = created_at or datetime.datetime.utcnow()
        self.updated_at = updated_at or self.created_at
        self.start_time = start_time
        self.end_time = end_time
        
    def add_operation(self, operation: SyncOperation):
        """
        Add a sync operation to the state.
        
        Args:
            operation: The operation to add
        """
        self.operations[operation.operation_id] = operation
        self.updated_at = datetime.datetime.utcnow()
        
    def update_operation(self, operation_id: str, **kwargs):
        """
        Update an existing operation.
        
        Args:
            operation_id: ID of the operation to update
            **kwargs: Attributes to update
        """
        if operation_id in self.operations:
            for key, value in kwargs.items():
                setattr(self.operations[operation_id], key, value)
            self.operations[operation_id].updated_at = datetime.datetime.utcnow()
            self.updated_at = datetime.datetime.utcnow()
            
    def get_operation(self, operation_id: str) -> Optional[SyncOperation]:
        """
        Get an operation by ID.
        
        Args:
            operation_id: ID of the operation to get
            
        Returns:
            SyncOperation if found, None otherwise
        """
        return self.operations.get(operation_id)
        
    def get_operations_by_status(self, status: str) -> List[SyncOperation]:
        """
        Get operations by status.
        
        Args:
            status: Status to filter by
            
        Returns:
            List of operations with the specified status
        """
        return [op for op in self.operations.values() if op.status == status]
        
    def set_checkpoint(self, checkpoint_data: Dict[str, Any]):
        """
        Set checkpoint data for job resumption.
        
        Args:
            checkpoint_data: Checkpoint data
        """
        self.checkpoint = checkpoint_data
        self.updated_at = datetime.datetime.utcnow()
        
    def increment_stat(self, stat_name: str, amount: int = 1):
        """
        Increment a statistic counter.
        
        Args:
            stat_name: Name of the statistic to increment
            amount: Amount to increment by
        """
        if stat_name in self.stats:
            self.stats[stat_name] += amount
        else:
            self.stats[stat_name] = amount
        self.updated_at = datetime.datetime.utcnow()
        
    def update_status(self, status: str):
        """
        Update the job status.
        
        Args:
            status: New status
        """
        self.status = status
        self.updated_at = datetime.datetime.utcnow()
        
        if status == 'running' and not self.start_time:
            self.start_time = datetime.datetime.utcnow()
        elif status in ('completed', 'failed') and not self.end_time:
            self.end_time = datetime.datetime.utcnow()
            
    def to_dict(self) -> Dict[str, Any]:
        """Convert state to a dictionary representation."""
        return {
            'job_id': self.job_id,
            'source_connection': self.source_connection,
            'target_connection': self.target_connection,
            'tables': self.tables,
            'status': self.status,
            'stats': self.stats,
            'operations': {
                op_id: op.to_dict() for op_id, op in self.operations.items()
            },
            'checkpoint': self.checkpoint,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None
        }
        
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'SyncState':
        """
        Create a SyncState from a dictionary representation.
        
        Args:
            data: Dictionary representation of a sync state
            
        Returns:
            SyncState instance
        """
        operations = {}
        if 'operations' in data:
            for op_id, op_data in data['operations'].items():
                operations[op_id] = SyncOperation.from_dict(op_data)
                
        return cls(
            job_id=data['job_id'],
            source_connection=data['source_connection'],
            target_connection=data['target_connection'],
            tables=data['tables'],
            status=data['status'],
            stats=data['stats'],
            operations=operations,
            checkpoint=data['checkpoint'] if 'checkpoint' in data else None,
            created_at=datetime.datetime.fromisoformat(data['created_at']) if data.get('created_at') else None,
            updated_at=datetime.datetime.fromisoformat(data['updated_at']) if data.get('updated_at') else None,
            start_time=datetime.datetime.fromisoformat(data['start_time']) if data.get('start_time') else None,
            end_time=datetime.datetime.fromisoformat(data['end_time']) if data.get('end_time') else None
        )


class SelfHealingOrchestrator:
    """
    Orchestrates the synchronization process with self-healing capabilities.
    
    Features:
    - Job scheduling and management
    - Parallel execution of sync operations
    - Error handling and recovery
    - Checkpointing for resumable operations
    - Performance monitoring and optimization
    """
    
    def __init__(self, 
                 change_detector: ChangeDetector = None,
                 transformer: Transformer = None,
                 validator: Validator = None,
                 conflict_resolver: Optional['ConflictResolver'] = None,
                 audit_system: Optional['AuditSystem'] = None,
                 retry_policy: RetryPolicy = None,
                 max_parallel_tables: int = 1,
                 max_parallel_operations: int = 5,
                 batch_size: int = 1000,
                 checkpoint_interval: int = 100,
                 state_directory: str = 'sync_states'):
        """
        Initialize the Orchestrator.
        
        Args:
            change_detector: Change detector component
            transformer: Transformer component
            validator: Validator component
            conflict_resolver: Conflict resolver component
            audit_system: Audit system component
            retry_policy: Policy for retrying failed operations
            max_parallel_tables: Maximum number of tables to process in parallel
            max_parallel_operations: Maximum number of operations to process in parallel per table
            batch_size: Number of records to process in a batch
            checkpoint_interval: Number of records between checkpoints
            state_directory: Directory for storing sync state files
        """
        self.change_detector = change_detector
        self.transformer = transformer
        self.validator = validator
        self.conflict_resolver = conflict_resolver
        self.audit_system = audit_system
        self.retry_policy = retry_policy or RetryPolicy()
        self.max_parallel_tables = max_parallel_tables
        self.max_parallel_operations = max_parallel_operations
        self.batch_size = batch_size
        self.checkpoint_interval = checkpoint_interval
        self.state_directory = state_directory
        
        self.active_syncs = {}  # Map job_id to SyncState
        self.sync_locks = {}    # Map job_id to threading.Lock
        self.shutdown_flags = {}  # Map job_id to shutdown flag
        
        # Create state directory if it doesn't exist
        os.makedirs(state_directory, exist_ok=True)
        
    def start_sync(self, 
                  source_engine: Engine, 
                  target_engine: Engine,
                  tables: List[Dict[str, Any]],
                  job_id: str = None,
                  async_mode: bool = True) -> str:
        """
        Start a synchronization job.
        
        Args:
            source_engine: SQLAlchemy engine for source database
            target_engine: SQLAlchemy engine for target database
            tables: List of tables to synchronize, each with fields and primary keys
            job_id: Optional job ID, a new UUID will be generated if None
            async_mode: Whether to run the job asynchronously
            
        Returns:
            Job ID
        """
        # Generate job ID if not provided
        job_id = job_id or str(uuid.uuid4())
        
        # Initialize Change Detector if needed
        if not self.change_detector:
            self.change_detector = ChangeDetector(
                source_engine=source_engine,
                target_engine=target_engine,
                batch_size=self.batch_size
            )
            
        # Get connection strings for state tracking
        source_conn = str(source_engine.url)
        target_conn = str(target_engine.url)
        
        # Create sync state
        state = SyncState(
            job_id=job_id,
            source_connection=source_conn,
            target_connection=target_conn,
            tables=tables,
            status='pending',
            stats={
                'total_tables': len(tables),
                'total_records': 0,  # Will be updated during sync
                'processed_tables': 0,
                'processed_records': 0,
                'inserted_records': 0,
                'updated_records': 0,
                'deleted_records': 0,
                'error_records': 0,
                'conflict_records': 0
            }
        )
        
        # Register the sync in memory
        self.active_syncs[job_id] = state
        self.sync_locks[job_id] = threading.Lock()
        self.shutdown_flags[job_id] = False
        
        # Save initial state
        self._save_state(state)
        
        # Run the sync
        if async_mode:
            # Start in a separate thread
            thread = threading.Thread(
                target=self._run_sync,
                args=(job_id, source_engine, target_engine)
            )
            thread.daemon = True
            thread.start()
        else:
            # Run synchronously
            self._run_sync(job_id, source_engine, target_engine)
            
        return job_id
        
    def stop_sync(self, job_id: str) -> bool:
        """
        Stop a synchronization job.
        
        Args:
            job_id: ID of the job to stop
            
        Returns:
            True if the job was found and stopped, False otherwise
        """
        if job_id in self.active_syncs:
            self.shutdown_flags[job_id] = True
            
            # Wait for a short time to allow clean shutdown
            start_time = time.time()
            while job_id in self.active_syncs and time.time() - start_time < 10:
                time.sleep(0.5)
                
            # Force removal if still active
            if job_id in self.active_syncs:
                with self.sync_locks[job_id]:
                    state = self.active_syncs[job_id]
                    state.update_status('stopped')
                    self._save_state(state)
                    del self.active_syncs[job_id]
                    del self.sync_locks[job_id]
                    del self.shutdown_flags[job_id]
                    
            return True
        return False
        
    def get_sync_status(self, job_id: str) -> Dict[str, Any]:
        """
        Get the status of a synchronization job.
        
        Args:
            job_id: ID of the job
            
        Returns:
            Job status information
        """
        # Try active syncs first
        if job_id in self.active_syncs:
            with self.sync_locks[job_id]:
                return self.active_syncs[job_id].to_dict()
                
        # Try to load from file
        try:
            return self._load_state(job_id).to_dict()
        except FileNotFoundError:
            return {'job_id': job_id, 'status': 'not_found', 'error': 'Sync job not found'}
            
    def resume_sync(self, job_id: str, 
                   source_engine: Engine = None, 
                   target_engine: Engine = None,
                   async_mode: bool = True) -> bool:
        """
        Resume a previously interrupted sync job.
        
        Args:
            job_id: ID of the job to resume
            source_engine: SQLAlchemy engine for source database
            target_engine: SQLAlchemy engine for target database
            async_mode: Whether to run the job asynchronously
            
        Returns:
            True if the job was found and resumed, False otherwise
        """
        try:
            # Load state from file
            state = self._load_state(job_id)
            
            # Check if job is resumable
            if state.status not in ('failed', 'interrupted', 'stopped'):
                return False
                
            # Create engines if not provided
            if not source_engine:
                source_engine = sa.create_engine(state.source_connection)
            if not target_engine:
                target_engine = sa.create_engine(state.target_connection)
                
            # Update state
            state.update_status('resuming')
            
            # Register the sync
            self.active_syncs[job_id] = state
            self.sync_locks[job_id] = threading.Lock()
            self.shutdown_flags[job_id] = False
            
            # Save updated state
            self._save_state(state)
            
            # Run the sync
            if async_mode:
                # Start in a separate thread
                thread = threading.Thread(
                    target=self._run_sync,
                    args=(job_id, source_engine, target_engine, True)
                )
                thread.daemon = True
                thread.start()
            else:
                # Run synchronously
                self._run_sync(job_id, source_engine, target_engine, True)
                
            return True
            
        except FileNotFoundError:
            return False
        except Exception as e:
            logger.error(f"Error resuming sync job {job_id}: {str(e)}")
            return False
            
    def _run_sync(self, 
                job_id: str, 
                source_engine: Engine, 
                target_engine: Engine,
                is_resume: bool = False):
        """
        Execute the synchronization process.
        
        Args:
            job_id: ID of the sync job
            source_engine: SQLAlchemy engine for source database
            target_engine: SQLAlchemy engine for target database
            is_resume: Whether this is resuming an interrupted job
        """
        if job_id not in self.active_syncs:
            logger.error(f"Cannot run sync: job {job_id} not found")
            return
            
        try:
            # Get state with lock
            with self.sync_locks[job_id]:
                state = self.active_syncs[job_id]
                state.update_status('running')
                
            # Update Change Detector if needed
            if self.change_detector:
                self.change_detector.source_engine = source_engine
                self.change_detector.target_engine = target_engine
                
            # Initialize components if needed
            if not self.transformer:
                self.transformer = Transformer()
            if not self.validator:
                self.validator = Validator()
                
            # Process tables
            if is_resume:
                # Resume from checkpoint
                self._resume_from_checkpoint(job_id, source_engine, target_engine)
            else:
                # Start fresh sync
                self._sync_tables(job_id, source_engine, target_engine)
                
            # Check if we were asked to shut down
            if self.shutdown_flags.get(job_id, False):
                # Clean shutdown
                with self.sync_locks[job_id]:
                    state = self.active_syncs[job_id]
                    state.update_status('stopped')
                    self._save_state(state)
                    
                # Clean up
                del self.active_syncs[job_id]
                del self.sync_locks[job_id]
                del self.shutdown_flags[job_id]
                return
                
            # Mark as completed
            with self.sync_locks[job_id]:
                state = self.active_syncs[job_id]
                state.update_status('completed')
                self._save_state(state)
                
            # Clean up
            del self.active_syncs[job_id]
            del self.sync_locks[job_id]
            del self.shutdown_flags[job_id]
            
        except Exception as e:
            logger.error(f"Error in sync job {job_id}: {str(e)}")
            logger.error(traceback.format_exc())
            
            # Mark as failed
            try:
                with self.sync_locks[job_id]:
                    state = self.active_syncs[job_id]
                    state.update_status('failed')
                    if 'error' not in state.stats:
                        state.stats['error'] = str(e)
                    self._save_state(state)
            except Exception:
                pass
                
            # Clean up
            try:
                del self.active_syncs[job_id]
                del self.sync_locks[job_id]
                del self.shutdown_flags[job_id]
            except Exception:
                pass
                
    def _sync_tables(self, job_id: str, source_engine: Engine, target_engine: Engine):
        """
        Synchronize all tables for a job.
        
        Args:
            job_id: ID of the sync job
            source_engine: SQLAlchemy engine for source database
            target_engine: SQLAlchemy engine for target database
        """
        # Get tables to process
        with self.sync_locks[job_id]:
            state = self.active_syncs[job_id]
            tables = state.tables
            
        # Process tables based on parallel settings
        if self.max_parallel_tables <= 1:
            # Process tables sequentially
            for table_info in tables:
                if self.shutdown_flags.get(job_id, False):
                    break
                self._sync_table(job_id, table_info, source_engine, target_engine)
        else:
            # Process tables in parallel
            # TODO: Implement parallel table processing
            # For now, just do sequential processing
            for table_info in tables:
                if self.shutdown_flags.get(job_id, False):
                    break
                self._sync_table(job_id, table_info, source_engine, target_engine)
                
    def _sync_table(self, job_id: str, table_info: Dict[str, Any], 
                   source_engine: Engine, target_engine: Engine):
        """
        Synchronize a single table.
        
        Args:
            job_id: ID of the sync job
            table_info: Information about the table to sync
            source_engine: SQLAlchemy engine for source database
            target_engine: SQLAlchemy engine for target database
        """
        table_name = table_info['name']
        primary_keys = table_info['primary_keys']
        fields = table_info['fields']
        
        logger.info(f"Syncing table {table_name} for job {job_id}")
        
        try:
            # Update checkpoint for current table
            with self.sync_locks[job_id]:
                state = self.active_syncs[job_id]
                state.set_checkpoint({
                    'current_table': table_name,
                    'status': 'started'
                })
                
            # Detect changes
            changes = self.change_detector.detect_changes(
                table_name=table_name,
                primary_keys=primary_keys,
                columns=fields
            )
            
            # Update stats with total changes
            total_changes = (
                len(changes['new']) + 
                len(changes['modified']) + 
                len(changes['deleted'])
            )
            
            with self.sync_locks[job_id]:
                state = self.active_syncs[job_id]
                state.stats['total_records'] += total_changes
                state.set_checkpoint({
                    'current_table': table_name,
                    'total_changes': total_changes,
                    'processed_changes': 0,
                    'status': 'changes_detected'
                })
                
            # Process new records
            self._process_new_records(job_id, table_name, primary_keys, changes['new'], target_engine)
            
            # Process modified records
            self._process_modified_records(job_id, table_name, primary_keys, changes['modified'], target_engine)
            
            # Process deleted records
            self._process_deleted_records(job_id, table_name, primary_keys, changes['deleted'], target_engine)
            
            # Update table completion status
            with self.sync_locks[job_id]:
                state = self.active_syncs[job_id]
                state.increment_stat('processed_tables')
                state.set_checkpoint({
                    'current_table': table_name,
                    'status': 'completed'
                })
                
            logger.info(f"Completed sync for table {table_name} in job {job_id}")
            
        except Exception as e:
            logger.error(f"Error syncing table {table_name} for job {job_id}: {str(e)}")
            logger.error(traceback.format_exc())
            
            # Update error status
            with self.sync_locks[job_id]:
                state = self.active_syncs[job_id]
                state.increment_stat('error_records')
                if 'table_errors' not in state.stats:
                    state.stats['table_errors'] = {}
                state.stats['table_errors'][table_name] = str(e)
                state.set_checkpoint({
                    'current_table': table_name,
                    'status': 'error',
                    'error': str(e)
                })
                
    def _process_new_records(self, job_id: str, table_name: str, 
                           primary_keys: List[str], records: List[Dict[str, Any]], 
                           target_engine: Engine):
        """
        Process new records (inserts).
        
        Args:
            job_id: ID of the sync job
            table_name: Name of the table
            primary_keys: List of primary key columns
            records: List of records to insert
            target_engine: SQLAlchemy engine for target database
        """
        if not records:
            return
            
        logger.info(f"Processing {len(records)} new records for table {table_name}")
        
        for i in range(0, len(records), self.batch_size):
            if self.shutdown_flags.get(job_id, False):
                break
                
            batch = records[i:i+self.batch_size]
            
            # Transform records if needed
            if self.transformer:
                transformed_batch = self.transformer.transform_records(batch)
            else:
                transformed_batch = batch
                
            # Validate records if needed
            if self.validator:
                valid, error_map = self.validator.validate_records(table_name, transformed_batch)
                if not valid:
                    # Log validation errors
                    for idx, errors in error_map.items():
                        record_id = self._format_record_id(transformed_batch[idx], primary_keys)
                        logger.warning(f"Validation errors for new record {record_id} in {table_name}: {', '.join(errors)}")
                        
                    # Filter out invalid records
                    transformed_batch = [
                        rec for idx, rec in enumerate(transformed_batch)
                        if idx not in error_map
                    ]
                    
            # Create operations for the batch
            operations = []
            for record in transformed_batch:
                record_id = self._format_record_id(record, primary_keys)
                operation = SyncOperation(
                    operation_id=str(uuid.uuid4()),
                    table_name=table_name,
                    operation_type='insert',
                    record_ids=[record_id],
                    records=[record],
                    status='pending'
                )
                operations.append(operation)
                
                # Register operation in state
                with self.sync_locks[job_id]:
                    state = self.active_syncs[job_id]
                    state.add_operation(operation)
                    
            # Process operations
            for operation in operations:
                if self.shutdown_flags.get(job_id, False):
                    break
                    
                try:
                    # Execute the insert
                    with target_engine.begin() as conn:
                        self._execute_insert(conn, table_name, operation.records[0])
                        
                    # Update operation and stats
                    with self.sync_locks[job_id]:
                        state = self.active_syncs[job_id]
                        operation.mark_completed()
                        state.update_operation(operation.operation_id, status='completed')
                        state.increment_stat('processed_records')
                        state.increment_stat('inserted_records')
                        
                        # Update checkpoint
                        current_checkpoint = state.checkpoint
                        current_checkpoint['processed_changes'] = (
                            current_checkpoint.get('processed_changes', 0) + 1
                        )
                        state.set_checkpoint(current_checkpoint)
                        
                        # Save state periodically
                        if state.stats['processed_records'] % self.checkpoint_interval == 0:
                            self._save_state(state)
                            
                except Exception as e:
                    logger.error(f"Error inserting record {operation.record_ids[0]} in {table_name}: {str(e)}")
                    
                    # Handle the error based on retry policy
                    self._handle_operation_error(job_id, operation, str(e))
                    
    def _process_modified_records(self, job_id: str, table_name: str, 
                                primary_keys: List[str], records: List[Dict[str, Any]], 
                                target_engine: Engine):
        """
        Process modified records (updates).
        
        Args:
            job_id: ID of the sync job
            table_name: Name of the table
            primary_keys: List of primary key columns
            records: List of records to update
            target_engine: SQLAlchemy engine for target database
        """
        if not records:
            return
            
        logger.info(f"Processing {len(records)} modified records for table {table_name}")
        
        for i in range(0, len(records), self.batch_size):
            if self.shutdown_flags.get(job_id, False):
                break
                
            batch = records[i:i+self.batch_size]
            
            # Transform records if needed
            if self.transformer:
                transformed_batch = self.transformer.transform_records(batch)
            else:
                transformed_batch = batch
                
            # Validate records if needed
            if self.validator:
                valid, error_map = self.validator.validate_records(table_name, transformed_batch)
                if not valid:
                    # Log validation errors
                    for idx, errors in error_map.items():
                        record_id = self._format_record_id(transformed_batch[idx], primary_keys)
                        logger.warning(f"Validation errors for modified record {record_id} in {table_name}: {', '.join(errors)}")
                        
                    # Filter out invalid records
                    transformed_batch = [
                        rec for idx, rec in enumerate(transformed_batch)
                        if idx not in error_map
                    ]
                    
            # Create operations for the batch
            operations = []
            for record in transformed_batch:
                record_id = self._format_record_id(record, primary_keys)
                operation = SyncOperation(
                    operation_id=str(uuid.uuid4()),
                    table_name=table_name,
                    operation_type='update',
                    record_ids=[record_id],
                    records=[record],
                    status='pending'
                )
                operations.append(operation)
                
                # Register operation in state
                with self.sync_locks[job_id]:
                    state = self.active_syncs[job_id]
                    state.add_operation(operation)
                    
            # Process operations
            for operation in operations:
                if self.shutdown_flags.get(job_id, False):
                    break
                    
                try:
                    # Execute the update
                    with target_engine.begin() as conn:
                        self._execute_update(conn, table_name, operation.records[0], primary_keys)
                        
                    # Update operation and stats
                    with self.sync_locks[job_id]:
                        state = self.active_syncs[job_id]
                        operation.mark_completed()
                        state.update_operation(operation.operation_id, status='completed')
                        state.increment_stat('processed_records')
                        state.increment_stat('updated_records')
                        
                        # Update checkpoint
                        current_checkpoint = state.checkpoint
                        current_checkpoint['processed_changes'] = (
                            current_checkpoint.get('processed_changes', 0) + 1
                        )
                        state.set_checkpoint(current_checkpoint)
                        
                        # Save state periodically
                        if state.stats['processed_records'] % self.checkpoint_interval == 0:
                            self._save_state(state)
                            
                except Exception as e:
                    logger.error(f"Error updating record {operation.record_ids[0]} in {table_name}: {str(e)}")
                    
                    # Handle the error based on retry policy
                    self._handle_operation_error(job_id, operation, str(e))
                    
    def _process_deleted_records(self, job_id: str, table_name: str, 
                               primary_keys: List[str], records: List[Dict[str, Any]], 
                               target_engine: Engine):
        """
        Process deleted records (deletes).
        
        Args:
            job_id: ID of the sync job
            table_name: Name of the table
            primary_keys: List of primary key columns
            records: List of records to delete
            target_engine: SQLAlchemy engine for target database
        """
        if not records:
            return
            
        logger.info(f"Processing {len(records)} deleted records for table {table_name}")
        
        for i in range(0, len(records), self.batch_size):
            if self.shutdown_flags.get(job_id, False):
                break
                
            batch = records[i:i+self.batch_size]
            
            # Create operations for the batch
            operations = []
            for record in batch:
                record_id = self._format_record_id(record, primary_keys)
                operation = SyncOperation(
                    operation_id=str(uuid.uuid4()),
                    table_name=table_name,
                    operation_type='delete',
                    record_ids=[record_id],
                    records=[record],
                    status='pending'
                )
                operations.append(operation)
                
                # Register operation in state
                with self.sync_locks[job_id]:
                    state = self.active_syncs[job_id]
                    state.add_operation(operation)
                    
            # Process operations
            for operation in operations:
                if self.shutdown_flags.get(job_id, False):
                    break
                    
                try:
                    # Execute the delete
                    with target_engine.begin() as conn:
                        self._execute_delete(conn, table_name, operation.records[0], primary_keys)
                        
                    # Update operation and stats
                    with self.sync_locks[job_id]:
                        state = self.active_syncs[job_id]
                        operation.mark_completed()
                        state.update_operation(operation.operation_id, status='completed')
                        state.increment_stat('processed_records')
                        state.increment_stat('deleted_records')
                        
                        # Update checkpoint
                        current_checkpoint = state.checkpoint
                        current_checkpoint['processed_changes'] = (
                            current_checkpoint.get('processed_changes', 0) + 1
                        )
                        state.set_checkpoint(current_checkpoint)
                        
                        # Save state periodically
                        if state.stats['processed_records'] % self.checkpoint_interval == 0:
                            self._save_state(state)
                            
                except Exception as e:
                    logger.error(f"Error deleting record {operation.record_ids[0]} in {table_name}: {str(e)}")
                    
                    # Handle the error based on retry policy
                    self._handle_operation_error(job_id, operation, str(e))
                    
    def _execute_insert(self, conn: Connection, table_name: str, record: Dict[str, Any]):
        """
        Execute an insert operation.
        
        Args:
            conn: SQLAlchemy connection
            table_name: Name of the table
            record: Record to insert
        """
        # Prepare columns and values
        columns = list(record.keys())
        values = [record[col] for col in columns]
        
        # Build the query
        placeholders = ', '.join([f':{i}' for i in range(len(columns))])
        column_list = ', '.join(columns)
        query = text(f"INSERT INTO {table_name} ({column_list}) VALUES ({placeholders})")
        
        # Execute the query
        params = {str(i): value for i, value in enumerate(values)}
        conn.execute(query, params)
        
    def _execute_update(self, conn: Connection, table_name: str, 
                      record: Dict[str, Any], primary_keys: List[str]):
        """
        Execute an update operation.
        
        Args:
            conn: SQLAlchemy connection
            table_name: Name of the table
            record: Record to update
            primary_keys: List of primary key columns
        """
        # Prepare SET clause
        set_items = []
        params = {}
        
        for col, value in record.items():
            if col not in primary_keys:
                param_name = f"val_{col}"
                set_items.append(f"{col} = :{param_name}")
                params[param_name] = value
                
        if not set_items:
            # Nothing to update
            return
            
        # Prepare WHERE clause
        where_conditions = []
        for pk in primary_keys:
            if pk in record:
                param_name = f"pk_{pk}"
                where_conditions.append(f"{pk} = :{param_name}")
                params[param_name] = record[pk]
            else:
                raise ValueError(f"Primary key {pk} not found in record")
                
        # Build the query
        set_clause = ', '.join(set_items)
        where_clause = ' AND '.join(where_conditions)
        query = text(f"UPDATE {table_name} SET {set_clause} WHERE {where_clause}")
        
        # Execute the query
        conn.execute(query, params)
        
    def _execute_delete(self, conn: Connection, table_name: str, 
                      record: Dict[str, Any], primary_keys: List[str]):
        """
        Execute a delete operation.
        
        Args:
            conn: SQLAlchemy connection
            table_name: Name of the table
            record: Record to delete
            primary_keys: List of primary key columns
        """
        # Prepare WHERE clause
        where_conditions = []
        params = {}
        
        for pk in primary_keys:
            if pk in record:
                param_name = f"pk_{pk}"
                where_conditions.append(f"{pk} = :{param_name}")
                params[param_name] = record[pk]
            else:
                raise ValueError(f"Primary key {pk} not found in record")
                
        # Build the query
        where_clause = ' AND '.join(where_conditions)
        query = text(f"DELETE FROM {table_name} WHERE {where_clause}")
        
        # Execute the query
        conn.execute(query, params)
        
    def _handle_operation_error(self, job_id: str, operation: SyncOperation, error: str):
        """
        Handle an error in a sync operation based on retry policy.
        
        Args:
            job_id: ID of the sync job
            operation: The operation that failed
            error: Error message
        """
        with self.sync_locks[job_id]:
            state = self.active_syncs[job_id]
            
            # Check retry count against policy
            if operation.retry_count < self.retry_policy.max_retries:
                # Update for retry
                operation.mark_retried(error)
                state.update_operation(
                    operation.operation_id,
                    retry_count=operation.retry_count,
                    last_error=error,
                    status='retry'
                )
                
                # Schedule retry after delay
                delay = self.retry_policy.get_delay(operation.retry_count - 1)
                
                # For simplicity, we'll just use threading.Timer for now
                # In a production system, you might want a more robust scheduling mechanism
                timer = threading.Timer(
                    delay,
                    self._retry_operation,
                    args=[job_id, operation.operation_id]
                )
                timer.daemon = True
                timer.start()
                
            else:
                # Mark as permanently failed
                operation.mark_failed(error)
                state.update_operation(
                    operation.operation_id,
                    retry_count=operation.retry_count,
                    last_error=error,
                    status='failed'
                )
                state.increment_stat('error_records')
                
                # Log the failure
                logger.error(f"Operation {operation.operation_id} failed after {operation.retry_count} retries: {error}")
                
    def _retry_operation(self, job_id: str, operation_id: str):
        """
        Retry a failed operation.
        
        Args:
            job_id: ID of the sync job
            operation_id: ID of the operation to retry
        """
        # Check if job is still active
        if job_id not in self.active_syncs:
            logger.warning(f"Cannot retry operation {operation_id}: job {job_id} is no longer active")
            return
            
        # Check if we were asked to shut down
        if self.shutdown_flags.get(job_id, False):
            logger.info(f"Skipping retry of operation {operation_id}: job {job_id} is shutting down")
            return
            
        try:
            # Get operation from state
            with self.sync_locks[job_id]:
                state = self.active_syncs[job_id]
                operation = state.get_operation(operation_id)
                
                if not operation or operation.status != 'retry':
                    logger.warning(f"Cannot retry operation {operation_id}: not found or not in retry status")
                    return
                    
                # Update status to retrying
                operation.status = 'retrying'
                state.update_operation(operation_id, status='retrying')
                
            # Get engines (assuming they haven't changed)
            source_conn = state.source_connection
            target_conn = state.target_connection
            source_engine = sa.create_engine(source_conn)
            target_engine = sa.create_engine(target_conn)
            
            # Execute the operation based on type
            table_name = operation.table_name
            record = operation.records[0]
            
            if operation.operation_type == 'insert':
                with target_engine.begin() as conn:
                    self._execute_insert(conn, table_name, record)
            elif operation.operation_type == 'update':
                # Need to determine primary keys from table info
                table_info = next(
                    (t for t in state.tables if t['name'] == table_name),
                    None
                )
                if not table_info:
                    raise ValueError(f"Table info not found for {table_name}")
                    
                primary_keys = table_info['primary_keys']
                
                with target_engine.begin() as conn:
                    self._execute_update(conn, table_name, record, primary_keys)
            elif operation.operation_type == 'delete':
                # Need to determine primary keys from table info
                table_info = next(
                    (t for t in state.tables if t['name'] == table_name),
                    None
                )
                if not table_info:
                    raise ValueError(f"Table info not found for {table_name}")
                    
                primary_keys = table_info['primary_keys']
                
                with target_engine.begin() as conn:
                    self._execute_delete(conn, table_name, record, primary_keys)
                    
            # Update operation and stats on success
            with self.sync_locks[job_id]:
                state = self.active_syncs[job_id]
                operation.mark_completed()
                state.update_operation(operation_id, status='completed')
                
                # Update record counts based on operation type
                if operation.operation_type == 'insert':
                    state.increment_stat('inserted_records')
                elif operation.operation_type == 'update':
                    state.increment_stat('updated_records')
                elif operation.operation_type == 'delete':
                    state.increment_stat('deleted_records')
                    
                # Always increment the processed count
                state.increment_stat('processed_records')
                
                # Save state
                self._save_state(state)
                
            logger.info(f"Successfully retried operation {operation_id} for job {job_id}")
            
        except Exception as e:
            logger.error(f"Error retrying operation {operation_id} for job {job_id}: {str(e)}")
            
            try:
                # Handle the error based on retry policy
                with self.sync_locks[job_id]:
                    state = self.active_syncs[job_id]
                    operation = state.get_operation(operation_id)
                    
                    if operation:
                        self._handle_operation_error(job_id, operation, str(e))
            except Exception as handle_err:
                logger.error(f"Error handling retry failure: {str(handle_err)}")
                
    def _resume_from_checkpoint(self, job_id: str, source_engine: Engine, target_engine: Engine):
        """
        Resume a sync job from its last checkpoint.
        
        Args:
            job_id: ID of the sync job to resume
            source_engine: SQLAlchemy engine for source database
            target_engine: SQLAlchemy engine for target database
        """
        # Get current state
        with self.sync_locks[job_id]:
            state = self.active_syncs[job_id]
            checkpoint = state.checkpoint
            tables = state.tables
            
        if not checkpoint:
            # No checkpoint, just start from the beginning
            self._sync_tables(job_id, source_engine, target_engine)
            return
            
        # Find the table to resume from
        current_table = checkpoint.get('current_table')
        if not current_table:
            # No current table, start from the beginning
            self._sync_tables(job_id, source_engine, target_engine)
            return
            
        # Find the table info
        current_table_idx = next(
            (i for i, t in enumerate(tables) if t['name'] == current_table),
            None
        )
        
        if current_table_idx is None:
            # Table not found, start from the beginning
            self._sync_tables(job_id, source_engine, target_engine)
            return
            
        # Check the status
        status = checkpoint.get('status', '')
        
        if status == 'completed':
            # Table was completed, start with the next table
            remaining_tables = tables[current_table_idx + 1:]
            
            # Set up the remaining tables
            with self.sync_locks[job_id]:
                state = self.active_syncs[job_id]
                state.tables = remaining_tables
                
            # Process the remaining tables
            self._sync_tables(job_id, source_engine, target_engine)
            
        elif status == 'error':
            # There was an error with this table, try again
            remaining_tables = tables[current_table_idx:]
            
            # Set up the remaining tables
            with self.sync_locks[job_id]:
                state = self.active_syncs[job_id]
                state.tables = remaining_tables
                
            # Process the remaining tables
            self._sync_tables(job_id, source_engine, target_engine)
            
        else:
            # Table is in progress, resume it
            table_info = tables[current_table_idx]
            
            # Resume this table and then do the rest
            self._sync_table(job_id, table_info, source_engine, target_engine)
            
            # Process remaining tables
            remaining_tables = tables[current_table_idx + 1:]
            
            if remaining_tables:
                # Set up the remaining tables
                with self.sync_locks[job_id]:
                    state = self.active_syncs[job_id]
                    state.tables = remaining_tables
                    
                # Process the remaining tables
                self._sync_tables(job_id, source_engine, target_engine)
                
    def _format_record_id(self, record: Dict[str, Any], primary_keys: List[str]) -> str:
        """
        Format a record's primary key values as a string.
        
        Args:
            record: The record
            primary_keys: List of primary key columns
            
        Returns:
            String representation of the record's primary key
        """
        if len(primary_keys) == 1:
            # Single primary key
            pk = primary_keys[0]
            return str(record.get(pk, 'None'))
        else:
            # Composite primary key
            return '|'.join(str(record.get(pk, 'None')) for pk in primary_keys)
            
    def _save_state(self, state: SyncState):
        """
        Save a sync state to a file.
        
        Args:
            state: The state to save
        """
        try:
            # Convert state to dictionary
            state_dict = state.to_dict()
            
            # Remove large data from records to save space
            if 'operations' in state_dict:
                for op_id, op in state_dict['operations'].items():
                    if 'records' in op:
                        del op['records']
                        
            # Save to file
            file_path = os.path.join(self.state_directory, f"{state.job_id}.json")
            
            with open(file_path, 'w') as f:
                json.dump(state_dict, f, indent=2)
                
        except Exception as e:
            logger.error(f"Error saving sync state for job {state.job_id}: {str(e)}")
            
    def _load_state(self, job_id: str) -> SyncState:
        """
        Load a sync state from a file.
        
        Args:
            job_id: ID of the job to load
            
        Returns:
            The loaded state
            
        Raises:
            FileNotFoundError: If the state file doesn't exist
        """
        file_path = os.path.join(self.state_directory, f"{job_id}.json")
        
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Sync state file not found: {file_path}")
            
        try:
            with open(file_path, 'r') as f:
                state_dict = json.load(f)
                
            return SyncState.from_dict(state_dict)
            
        except Exception as e:
            logger.error(f"Error loading sync state for job {job_id}: {str(e)}")
            raise