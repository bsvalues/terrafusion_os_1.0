"""
TerraFusion Sync Service - Main Integration Module.

This module provides the TerraFusionSyncService class which integrates all components
of the TerraFusion architecture to provide a complete synchronization service.
"""

import os
import uuid
import logging
import datetime
import threading
from typing import Dict, List, Any, Tuple, Optional, Union, Set, Callable

import sqlalchemy as sa
from sqlalchemy.sql import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.engine import Engine, Connection

from sync_service.terra_fusion.change_detector import ChangeDetector
from sync_service.terra_fusion.transformer import Transformer
from sync_service.terra_fusion.validator import Validator
from sync_service.terra_fusion.orchestrator import SelfHealingOrchestrator, RetryPolicy
from sync_service.terra_fusion.conflict_resolver import ConflictResolver
from sync_service.terra_fusion.audit_system import AuditSystem, DatabaseAuditStore

from sync_service.data_type_handlers import DataTypeHandler, get_handler_for_column

logger = logging.getLogger(__name__)


class TerraFusionSyncService:
    """
    Main service class that integrates all components of the TerraFusion architecture.
    
    This service supersedes the legacy DatabaseProjectSyncService with enhanced features
    and a modern, modular architecture.
    """
    
    def __init__(self, 
                 source_connection_string: str = None,
                 target_connection_string: str = None,
                 user_id: int = None,
                 job_id: str = None,
                 config: Dict[str, Any] = None):
        """
        Initialize the TerraFusion Sync Service.
        
        Args:
            source_connection_string: Connection string for source database
            target_connection_string: Connection string for target database
            user_id: Optional user ID who initiated the sync
            job_id: Optional job ID for tracking, a new UUID will be generated if None
            config: Optional configuration dictionary
        """
        self.job_id = job_id or str(uuid.uuid4())
        self.user_id = user_id
        self.source_connection_string = source_connection_string
        self.target_connection_string = target_connection_string
        
        # Default configuration
        self.default_config = {
            # General configuration
            'batch_size': 1000,
            'max_parallel_tables': 1,
            'max_parallel_operations': 5,
            'checkpoint_interval': 100,
            
            # Change detection configuration
            'detection_strategy': 'hash',
            'cdc_enabled': False,
            'cdc_table_prefix': '_cdc',
            
            # Schema validation configuration
            'schema_validation': True,
            'schema_auto_migration': True,
            
            # Conflict resolution configuration
            'conflict_strategy': 'source_wins',
            'ai_resolution': False,
            'ai_service_url': None,
            
            # Retry configuration
            'max_retries': 3,
            'retry_base_delay': 2.0,
            'retry_max_delay': 60.0,
            'exponential_backoff': True,
            
            # Audit configuration
            'audit_level': 'standard',
            'include_data': False,
            'audit_table': 'sync_audit_events',
            
            # Directory configuration
            'state_directory': 'sync_states',
            'mapping_directory': 'sync_service/mappings'
        }
        
        # Merge with provided config
        self.config = self.default_config.copy()
        if config:
            self.config.update(config)
            
        # Initialize database engines
        self.source_engine = None
        self.target_engine = None
        
        if source_connection_string:
            self.source_engine = sa.create_engine(source_connection_string)
            
        if target_connection_string:
            self.target_engine = sa.create_engine(target_connection_string)
            
        # Initialize components
        self._initialize_components()
        
    def _initialize_components(self):
        """Initialize all TerraFusion components."""
        # Change Detector
        self.change_detector = ChangeDetector(
            source_engine=self.source_engine,
            target_engine=self.target_engine,
            batch_size=self.config['batch_size'],
            detection_strategy=self.config['detection_strategy'],
            cdc_table_prefix=self.config['cdc_table_prefix'],
            cdc_enabled=self.config['cdc_enabled']
        )
        
        # Transformer
        self.transformer = Transformer(
            mapping_directory=self.config['mapping_directory'],
            use_ai_transformation=self.config['ai_resolution'],
            ai_service_url=self.config['ai_service_url']
        )
        
        # Validator
        self.validator = Validator()
        
        # Conflict Resolver
        self.conflict_resolver = ConflictResolver(
            default_strategy=self.config['conflict_strategy'],
            ai_service_url=self.config['ai_service_url']
        )
        
        # Audit System
        if self.target_engine:
            audit_store = DatabaseAuditStore(
                engine=self.target_engine,
                table_name=self.config['audit_table']
            )
        else:
            audit_store = None
            
        self.audit_system = AuditSystem(
            audit_store=audit_store,
            engine=self.target_engine,
            audit_level=self.config['audit_level'],
            include_data=self.config['include_data']
        )
        
        # Retry Policy
        retry_policy = RetryPolicy(
            max_retries=self.config['max_retries'],
            base_delay=self.config['retry_base_delay'],
            max_delay=self.config['retry_max_delay'],
            exponential_backoff=self.config['exponential_backoff']
        )
        
        # Self-Healing Orchestrator
        self.orchestrator = SelfHealingOrchestrator(
            change_detector=self.change_detector,
            transformer=self.transformer,
            validator=self.validator,
            conflict_resolver=self.conflict_resolver,
            audit_system=self.audit_system,
            retry_policy=retry_policy,
            max_parallel_tables=self.config['max_parallel_tables'],
            max_parallel_operations=self.config['max_parallel_operations'],
            batch_size=self.config['batch_size'],
            checkpoint_interval=self.config['checkpoint_interval'],
            state_directory=self.config['state_directory']
        )
        
    def start_full_sync(self, async_mode: bool = True) -> str:
        """
        Start a full synchronization of all tables.
        
        Args:
            async_mode: Whether to run the sync asynchronously
            
        Returns:
            Job ID of the sync operation
        """
        # Identify tables to sync
        tables = self._identify_project_tables()
        
        # Log job start
        self.audit_system.log_job_start(
            job_id=self.job_id,
            tables=[t['name'] for t in tables],
            source_db=self.source_connection_string.split('@')[-1] if self.source_connection_string else 'source',
            target_db=self.target_connection_string.split('@')[-1] if self.target_connection_string else 'target',
            user_id=str(self.user_id) if self.user_id else None
        )
        
        # Start the sync
        return self.orchestrator.start_sync(
            source_engine=self.source_engine,
            target_engine=self.target_engine,
            tables=tables,
            job_id=self.job_id,
            async_mode=async_mode
        )
        
    def start_incremental_sync(self, 
                              tables: List[str] = None, 
                              async_mode: bool = True) -> str:
        """
        Start an incremental synchronization of specified tables.
        
        Args:
            tables: List of table names to sync, or None for all tables
            async_mode: Whether to run the sync asynchronously
            
        Returns:
            Job ID of the sync operation
        """
        # Identify tables to sync
        all_tables = self._identify_project_tables()
        
        if tables:
            # Filter to specified tables
            sync_tables = [t for t in all_tables if t['name'] in tables]
        else:
            sync_tables = all_tables
            
        # Log job start
        self.audit_system.log_job_start(
            job_id=self.job_id,
            tables=[t['name'] for t in sync_tables],
            source_db=self.source_connection_string.split('@')[-1] if self.source_connection_string else 'source',
            target_db=self.target_connection_string.split('@')[-1] if self.target_connection_string else 'target',
            user_id=str(self.user_id) if self.user_id else None
        )
        
        # Start the sync
        return self.orchestrator.start_sync(
            source_engine=self.source_engine,
            target_engine=self.target_engine,
            tables=sync_tables,
            job_id=self.job_id,
            async_mode=async_mode
        )
        
    def stop_sync(self) -> bool:
        """
        Stop an ongoing synchronization job.
        
        Returns:
            True if the job was stopped, False otherwise
        """
        return self.orchestrator.stop_sync(self.job_id)
        
    def get_sync_status(self) -> Dict[str, Any]:
        """
        Get the status of the current sync job.
        
        Returns:
            Dictionary with job status information
        """
        return self.orchestrator.get_sync_status(self.job_id)
        
    def resume_sync(self, async_mode: bool = True) -> bool:
        """
        Resume a previously interrupted sync job.
        
        Args:
            async_mode: Whether to run the sync asynchronously
            
        Returns:
            True if the job was resumed, False otherwise
        """
        return self.orchestrator.resume_sync(
            job_id=self.job_id,
            source_engine=self.source_engine,
            target_engine=self.target_engine,
            async_mode=async_mode
        )
        
    def get_conflicts(self, 
                     table_name: Optional[str] = None, 
                     status: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Get conflicts from the current sync job.
        
        Args:
            table_name: Optional table name to filter by
            status: Optional status to filter by ('pending', 'resolved')
            
        Returns:
            List of conflicts
        """
        conflicts = self.conflict_resolver.get_conflicts(table_name, status)
        return [conflict.to_dict() for conflict in conflicts]
        
    def resolve_conflict(self, 
                        conflict_id: str, 
                        strategy: str = None) -> bool:
        """
        Resolve a conflict.
        
        Args:
            conflict_id: ID of the conflict to resolve
            strategy: Resolution strategy to use
            
        Returns:
            True if the conflict was resolved, False otherwise
        """
        conflict = self.conflict_resolver.get_conflict(conflict_id)
        if not conflict:
            return False
            
        resolved_record = self.conflict_resolver.resolve_conflict(
            conflict, 
            strategy_name=strategy
        )
        
        # Log resolution
        if resolved_record:
            self.audit_system.log_conflict_resolution(
                job_id=self.job_id,
                table_name=conflict.table_name,
                record_id=conflict_id,
                resolution_strategy=strategy or self.config['conflict_strategy'],
                resolved_record=resolved_record,
                user_id=str(self.user_id) if self.user_id else None
            )
            
        return bool(resolved_record)
        
    def resolve_all_conflicts(self, strategy: str = None) -> int:
        """
        Resolve all pending conflicts.
        
        Args:
            strategy: Resolution strategy to use
            
        Returns:
            Number of conflicts resolved
        """
        conflicts = self.conflict_resolver.get_conflicts(status='pending')
        count = 0
        
        for conflict in conflicts:
            if self.resolve_conflict(conflict.conflict_id, strategy):
                count += 1
                
        return count
        
    def get_audit_events(self, 
                        event_type: Optional[str] = None,
                        table_name: Optional[str] = None,
                        limit: int = 1000,
                        offset: int = 0) -> List[Dict[str, Any]]:
        """
        Get audit events for the current job.
        
        Args:
            event_type: Optional event type to filter by
            table_name: Optional table name to filter by
            limit: Maximum number of events to return
            offset: Offset for pagination
            
        Returns:
            List of audit events
        """
        events = self.audit_system.get_job_events(
            job_id=self.job_id,
            event_types=[event_type] if event_type else None,
            limit=limit,
            offset=offset
        )
        
        return [event.to_dict() for event in events]
        
    def get_audit_report(self) -> Dict[str, Any]:
        """
        Generate an audit report for the current job.
        
        Returns:
            Report dictionary
        """
        return self.audit_system.generate_report(job_id=self.job_id)
        
    def validate_schema_compatibility(self, table_name: str) -> Tuple[bool, List[str]]:
        """
        Validate schema compatibility between source and target databases.
        
        Args:
            table_name: Name of the table to validate
            
        Returns:
            Tuple of (is_compatible, list_of_issues)
        """
        try:
            # Introspect source schema
            source_schema = self.validator.introspect_database_schema(
                engine=self.source_engine,
                table_name=table_name
            )
            
            # Introspect target schema
            target_schema = self.validator.introspect_database_schema(
                engine=self.target_engine,
                table_name=table_name
            )
            
            # Validate compatibility
            return self.validator.validate_schema_compatibility(
                source_schema=source_schema,
                target_schema=target_schema
            )
            
        except Exception as e:
            logger.error(f"Error validating schema compatibility: {str(e)}")
            return False, [f"Error: {str(e)}"]
            
    def _identify_project_tables(self) -> List[Dict[str, Any]]:
        """
        Identify tables for synchronization.
        
        Returns:
            List of table info dictionaries
        """
        from sync_service.models import TableConfiguration
        
        try:
            # Get custom table configuration
            table_configs = TableConfiguration.query.filter_by(
                sync_enabled=True, 
                config_type='project'
            ).all()
            
            if table_configs:
                # Use configured tables
                project_tables = [
                    {
                        'name': config.name,
                        'primary_keys': [pk.name for pk in config.primary_keys],
                        'fields': [field.name for field in config.fields if field.sync_enabled]
                    }
                    for config in table_configs
                ]
                logger.info(f"Using {len(project_tables)} configured project tables")
            else:
                # Auto-detect project tables through introspection
                project_tables = self._auto_detect_tables()
                
            # No project tables found
            if not project_tables:
                logger.warning("No project tables found for synchronization")
                
            return project_tables
                
        except Exception as e:
            logger.error(f"Failed to identify project tables: {str(e)}")
            raise
            
    def _auto_detect_tables(self) -> List[Dict[str, Any]]:
        """
        Auto-detect tables through database introspection.
        
        Returns:
            List of table info dictionaries
        """
        if not self.source_engine:
            raise Exception("Source database connection not established")
            
        project_tables = []
        
        with self.source_engine.connect() as conn:
            # Find tables with 'project' in the name or with project-related columns
            query = text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            AND (
                table_name LIKE '%project%' 
                OR table_name LIKE '%gis%'
                OR table_name IN (
                    SELECT table_name 
                    FROM information_schema.columns 
                    WHERE column_name LIKE '%project%'
                )
            )
            """)
            result = conn.execute(query)
            
            for row in result:
                table_name = row[0]
                # Get primary keys
                pk_query = text("""
                SELECT a.attname
                FROM pg_index i
                JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
                WHERE i.indrelid = :table_name::regclass
                AND i.indisprimary;
                """)
                pk_result = conn.execute(pk_query, {'table_name': table_name})
                primary_keys = [row[0] for row in pk_result]
                
                # Get all columns
                col_query = text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = :table_name
                """)
                col_result = conn.execute(col_query, {'table_name': table_name})
                fields = [row[0] for row in col_result]
                
                project_tables.append({
                    'name': table_name,
                    'primary_keys': primary_keys,
                    'fields': fields
                })
                
        logger.info(f"Auto-detected {len(project_tables)} project tables")
        return project_tables
        
    def health_check(self) -> Dict[str, Any]:
        """
        Perform a health check on the sync service.
        
        Returns:
            Dictionary with health status
        """
        health = {
            'status': 'healthy',
            'source_db': 'unavailable',
            'target_db': 'unavailable',
            'components': {
                'change_detector': 'available',
                'transformer': 'available',
                'validator': 'available',
                'orchestrator': 'available',
                'conflict_resolver': 'available',
                'audit_system': 'available'
            },
            'timestamp': datetime.datetime.utcnow().isoformat()
        }
        
        # Check source database
        try:
            if self.source_engine:
                with self.source_engine.connect() as conn:
                    conn.execute(text("SELECT 1"))
                health['source_db'] = 'available'
        except Exception as e:
            health['source_db'] = f"error: {str(e)}"
            health['status'] = 'degraded'
            
        # Check target database
        try:
            if self.target_engine:
                with self.target_engine.connect() as conn:
                    conn.execute(text("SELECT 1"))
                health['target_db'] = 'available'
        except Exception as e:
            health['target_db'] = f"error: {str(e)}"
            health['status'] = 'degraded'
            
        return health