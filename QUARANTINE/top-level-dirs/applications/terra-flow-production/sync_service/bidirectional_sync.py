"""
Bi-directional sync engine for the Data Hub Sync Service.

This module extends the core sync engine to support bi-directional synchronization 
between production and training environments:

1. Down-sync: Move data from production to training environments.
2. Up-sync: Move changes from training back to production environments.
"""
import uuid
import datetime
import logging
from typing import Dict, List, Any, Union, Optional, Tuple

import sqlalchemy as sa
from sqlalchemy.sql import text

from app import db
from sync_service.models import (
    SyncJob, SyncLog, TableConfiguration, UpSyncDataChange, 
    UpSyncDataChangeArchive, GlobalSetting
)
from sync_service.sync_engine import SyncEngine
from sync_service.config import (
    PROD_CLONE_DB_URI, TRAINING_DB_URI, SQL_SERVER_CONNECTION_STRING
)

# Set up logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

class BidirectionalSyncEngine(SyncEngine):
    """Base class for bi-directional synchronization operations."""
    
    def __init__(self, job_id: str = None, user_id: int = None, sync_direction: str = None):
        """Initialize the bi-directional sync engine.
        
        Args:
            job_id: Optional job ID for tracking. If None, a new UUID will be generated.
            user_id: Optional user ID who initiated the sync.
            sync_direction: Either 'up' (training to production) or 'down' (production to training).
        """
        super().__init__(job_id, user_id)
        
        if sync_direction not in ('up', 'down'):
            raise ValueError("sync_direction must be either 'up' or 'down'")
            
        self.sync_direction = sync_direction
        self.job.job_type = f"{sync_direction}_sync"
        self.job.name = f"{sync_direction.capitalize()}-Sync Job {self.job_id}"
        db.session.commit()
        
        self.log(f"Initialized {sync_direction}-sync job", component="Init")

class UpSyncEngine(BidirectionalSyncEngine):
    """Engine for up-sync operations (training to production)."""
    
    def __init__(self, job_id: str = None, user_id: int = None):
        """Initialize the up-sync engine."""
        super().__init__(job_id, user_id, sync_direction='up')
        
        # For up-sync, the source is training and target is production
        self.source_engine = self.target_engine  # Initially set in SyncEngine
        self.target_engine = sa.create_engine(PROD_CLONE_DB_URI)
        
        self.log("UpSyncEngine initialized with correct source/target directions", component="Init")
        
    def start_sync(self):
        """Start the up-sync process."""
        if not self.source_engine or not self.target_engine:
            self.log("Databases not connected. Cannot start up-sync.", level="ERROR")
            return False
        
        try:
            # Update job status
            self.job.status = 'running'
            self.job.start_time = datetime.datetime.utcnow()
            db.session.commit()
            
            self.log("Starting up-sync process", level="INFO", component="Main")
            
            # Get pending changes to sync
            changes = self._get_pending_changes()
            self.job.total_records = len(changes)
            db.session.commit()
            
            if not changes:
                self.log("No pending changes to synchronize", level="INFO", component="Main")
                self.job.status = 'completed'
                self.job.end_time = datetime.datetime.utcnow()
                db.session.commit()
                return True
            
            # Process each change
            for change in changes:
                self._apply_change(change)
                self.job.processed_records += 1
                db.session.commit()
            
            # Update global settings
            self._update_sync_timestamp()
            
            # Complete the job
            self.job.status = 'completed'
            self.job.end_time = datetime.datetime.utcnow()
            db.session.commit()
            
            self.log("Up-sync process completed successfully", level="INFO", component="Main")
            return True
            
        except Exception as e:
            self.log(f"Error in up-sync process: {str(e)}", level="ERROR", component="Main")
            self.job.status = 'failed'
            self.job.end_time = datetime.datetime.utcnow()
            self.job.error_details = {
                'error': str(e),
                'step': 'sync'
            }
            db.session.commit()
            return False
    
    def _get_pending_changes(self) -> List[Dict[str, Any]]:
        """Get pending changes from the UpSyncDataChange table."""
        changes = UpSyncDataChange.query.filter_by(is_processed=False).all()
        
        self.log(f"Found {len(changes)} pending changes to up-sync", level="INFO", component="Extract")
        
        # Convert to dictionaries for processing
        return [{
            'id': change.id,
            'table_name': change.table_name,
            'field_name': change.field_name,
            'keys': change.keys,
            'new_value': change.new_value,
            'old_value': change.old_value,
            'action': change.action,
            'date': change.date,
            'pacs_user': change.pacs_user,
            'parcel_id': change.parcel_id
        } for change in changes]
    
    def _apply_change(self, change: Dict[str, Any]) -> bool:
        """Apply a single change to the target (production) database."""
        table_name = change['table_name']
        self.log(f"Applying change to {table_name}: {change['action']}", level="INFO", component="Load", table_name=table_name)
        
        try:
            # Parse the keys to use in the WHERE clause
            keys_dict = {}
            for key_pair in change['keys'].split(','):
                if '=' in key_pair:
                    key, value = key_pair.split('=', 1)
                    keys_dict[key.strip()] = value.strip()
            
            # Build the WHERE clause
            where_conditions = " AND ".join([f"{k} = :{k}" for k in keys_dict.keys()])
            
            # Connect to target database
            with self.target_engine.connect() as conn:
                # Begin transaction
                trans = conn.begin()
                
                try:
                    if change['action'] == 'insert':
                        # For insert, we need all field values from the source database
                        # This would typically involve a more complex query to get all fields
                        # Here we're just implementing a placeholder that updates a single field
                        update_query = f"UPDATE {table_name} SET {change['field_name']} = :new_value WHERE {where_conditions}"
                        params = {**keys_dict, 'new_value': change['new_value']}
                        conn.execute(text(update_query), params)
                        
                    elif change['action'] == 'update':
                        # For update, we just need to update the specific field
                        update_query = f"UPDATE {table_name} SET {change['field_name']} = :new_value WHERE {where_conditions}"
                        params = {**keys_dict, 'new_value': change['new_value']}
                        conn.execute(text(update_query), params)
                        
                    elif change['action'] == 'delete':
                        # For delete, we delete the entire row matching the keys
                        delete_query = f"DELETE FROM {table_name} WHERE {where_conditions}"
                        conn.execute(text(delete_query), keys_dict)
                    
                    # Mark the change as processed
                    self._mark_change_processed(change['id'])
                    
                    # Commit transaction
                    trans.commit()
                    
                    self.log(f"Successfully applied {change['action']} to {table_name}", level="INFO", component="Load", table_name=table_name)
                    return True
                    
                except Exception as e:
                    # Roll back transaction
                    trans.rollback()
                    self.log(f"Error applying change to {table_name}: {str(e)}", level="ERROR", component="Load", table_name=table_name)
                    raise
                
        except Exception as e:
            self.log(f"Error in _apply_change for {table_name}: {str(e)}", level="ERROR", component="Load", table_name=table_name)
            self.job.error_records += 1
            if not self.job.error_details.get('tables'):
                self.job.error_details['tables'] = {}
            self.job.error_details['tables'][table_name] = str(e)
            db.session.commit()
            return False
    
    def _mark_change_processed(self, change_id: int) -> bool:
        """Mark a change as processed and archive it."""
        try:
            # Get the change
            change = UpSyncDataChange.query.get(change_id)
            if not change:
                self.log(f"Change ID {change_id} not found", level="WARNING", component="Archive")
                return False
            
            # Archive the change
            archive = UpSyncDataChangeArchive(
                table_name=change.table_name,
                field_name=change.field_name,
                keys=change.keys,
                new_value=change.new_value,
                old_value=change.old_value,
                action=change.action,
                date=change.date,
                record_inserted_date=change.record_inserted_date,
                is_processed_date=datetime.datetime.utcnow(),
                pacs_user=change.pacs_user,
                cc_field_id=change.cc_field_id,
                parcel_id=change.parcel_id,
                unique_cc_row_id=change.unique_cc_row_id,
                unique_cc_parent_row_id=change.unique_cc_parent_row_id,
                is_processed=True
            )
            db.session.add(archive)
            
            # Mark the original change as processed
            change.is_processed = True
            change.is_processed_date = datetime.datetime.utcnow()
            db.session.commit()
            
            self.log(f"Marked change ID {change_id} as processed", level="INFO", component="Archive")
            return True
            
        except Exception as e:
            self.log(f"Error marking change as processed: {str(e)}", level="ERROR", component="Archive")
            db.session.rollback()
            return False
    
    def _update_sync_timestamp(self):
        """Update the global settings with the latest up-sync time."""
        global_setting = GlobalSetting.query.first()
        
        if not global_setting:
            self.log("Global settings not found", level="WARNING", component="Main")
            return
        
        global_setting.last_sync_job_id = self.job_id
        global_setting.last_sync_time = datetime.datetime.utcnow()
        db.session.commit()
        
        self.log("Updated global settings with latest up-sync timestamp", level="INFO", component="Main")

class DownSyncEngine(BidirectionalSyncEngine):
    """Engine for down-sync operations (production to training)."""
    
    def __init__(self, job_id: str = None, user_id: int = None):
        """Initialize the down-sync engine."""
        super().__init__(job_id, user_id, sync_direction='down')
        
        # For down-sync, we use the default source/target setup in SyncEngine
        self.log("DownSyncEngine initialized with default source/target directions", component="Init")

    def start_sync(self):
        """Start the down-sync process.
        This uses the core SyncEngine functionality, as it's syncing from
        production to training, which is the default direction.
        """
        return super().start_sync()

class DataSynchronizer:
    """Helper class for synchronization operations through the API."""
    
    @staticmethod
    def get_job_status(job_id):
        """Get the status of a job."""
        job = SyncJob.query.filter_by(job_id=job_id).first()
        if not job:
            return {"status": "not_found", "message": "Job not found"}
        
        return {
            "status": job.status,
            "job_id": job.job_id,
            "name": job.name,
            "start_time": job.start_time.isoformat() if job.start_time else None,
            "end_time": job.end_time.isoformat() if job.end_time else None,
            "total_records": job.total_records,
            "processed_records": job.processed_records,
            "error_records": job.error_records,
            "error_details": job.error_details,
            "progress": (job.processed_records / job.total_records * 100) if job.total_records > 0 else 0
        }
    
    @staticmethod
    def get_job_logs(job_id, level=None, limit=100):
        """Get logs for a job."""
        query = SyncLog.query.filter_by(job_id=job_id)
        
        if level:
            query = query.filter_by(level=level.upper())
            
        logs = query.order_by(SyncLog.created_at.desc()).limit(limit).all()
        
        return [{
            "timestamp": log.created_at.isoformat(),
            "level": log.level,
            "message": log.message,
            "component": log.component,
            "table_name": log.table_name,
            "record_count": log.record_count,
            "duration_ms": log.duration_ms
        } for log in logs]
    
    @staticmethod
    def start_incremental_sync(user_id):
        """Start an incremental sync job."""
        engine = SyncEngine(user_id=user_id)
        engine.job.job_type = 'incremental'
        db.session.commit()
        
        engine.start_sync()
        return engine.job_id
    
    @staticmethod
    def start_full_sync(user_id):
        """Start a full sync job."""
        engine = SyncEngine(user_id=user_id)
        engine.job.job_type = 'full'
        db.session.commit()
        
        engine.start_sync()
        return engine.job_id
    
    @staticmethod
    def start_up_sync(user_id):
        """Start an up-sync job (training to production)."""
        engine = UpSyncEngine(user_id=user_id)
        
        # Start the sync process in a background thread to not block the request
        # In a real application, you might want to use a task queue like Celery
        import threading
        thread = threading.Thread(target=engine.start_sync)
        thread.daemon = True
        thread.start()
        
        return engine.job_id
    
    @staticmethod
    def start_down_sync(user_id):
        """Start a down-sync job (production to training)."""
        engine = DownSyncEngine(user_id=user_id)
        
        # Start the sync process in a background thread to not block the request
        # In a real application, you might want to use a task queue like Celery
        import threading
        thread = threading.Thread(target=engine.start_sync)
        thread.daemon = True
        thread.start()
        
        return engine.job_id
    
    @staticmethod
    def start_property_export(user_id, database_name, num_years, min_bill_years):
        """Start a property export job."""
        engine = SyncEngine(user_id=user_id)
        engine.job.job_type = 'property_export'
        engine.job.name = f"Property Export to {database_name}"
        db.session.commit()
        
        # TODO: Implement property export functionality
        # This will be part of another implementation
        
        return engine.job_id
    
    @staticmethod
    def get_pending_changes_count():
        """Get count of pending up-sync changes."""
        return UpSyncDataChange.query.filter_by(is_processed=False).count()