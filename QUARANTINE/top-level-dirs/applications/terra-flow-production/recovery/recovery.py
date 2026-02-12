"""
Recovery Module

This module implements data recovery capabilities for the Benton County Assessor's Office,
providing backup, restoration, and disaster recovery features.
"""

import os
import logging
import json
import datetime
import uuid
import shutil
import time
from typing import Dict, List, Any, Optional, Tuple, Set

# Configure logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

class RecoveryManager:
    """
    Manager for data recovery operations, including backup, restoration,
    and disaster recovery processes.
    """
    
    def __init__(self):
        """Initialize the recovery manager"""
        # Default paths
        self.backup_directory = os.environ.get('BACKUP_DIRECTORY', 'backups')
        self.recovery_directory = os.environ.get('RECOVERY_DIRECTORY', 'recovery')
        self.backup_retention_days = int(os.environ.get('BACKUP_RETENTION_DAYS', '90'))
        
        # Create directories if they don't exist
        os.makedirs(self.backup_directory, exist_ok=True)
        os.makedirs(self.recovery_directory, exist_ok=True)
        
        # Track backup and recovery operations
        self.operations_history = []
        self.active_recovery_operations = {}
        
        # Recovery configurations
        self.recovery_priorities = {
            'critical': ['property_master', 'assessment_main', 'user_data'],
            'high': ['spatial_data', 'documents', 'historical_assessments'],
            'medium': ['reports', 'logs', 'audit_data'],
            'low': ['temporary_data', 'cache', 'exports']
        }
        
        # Recovery point objectives (RPO) in minutes
        self.rpo_targets = {
            'critical': 15,       # 15 minutes
            'high': 60,           # 1 hour
            'medium': 1440,       # 24 hours
            'low': 10080          # 1 week
        }
        
        # Recovery time objectives (RTO) in minutes
        self.rto_targets = {
            'critical': 60,       # 1 hour
            'high': 240,          # 4 hours
            'medium': 1440,       # 24 hours
            'low': 4320           # 3 days
        }
        
        # Backup schedule
        self.backup_schedule = {
            'full': {
                'frequency': 'weekly',
                'day_of_week': 'sunday',
                'time': '01:00'
            },
            'differential': {
                'frequency': 'daily',
                'time': '03:00'
            },
            'incremental': {
                'frequency': 'hourly',
                'interval_hours': 6,
                'start_time': '00:00'
            }
        }
        
        # Backup sets tracking
        self.backup_sets = []
        self._load_backup_sets()
        
        # Initialization state
        self._initialized = True
        
        logger.info("Recovery Manager initialized")
    
    def is_initialized(self) -> bool:
        """
        Check if the recovery manager is properly initialized.
        
        Returns:
            True if initialized, False otherwise
        """
        return self._initialized
    
    def _load_backup_sets(self) -> None:
        """Load backup sets metadata from backup directory"""
        metadata_path = os.path.join(self.backup_directory, 'backup_metadata.json')
        
        if os.path.exists(metadata_path):
            try:
                with open(metadata_path, 'r') as f:
                    self.backup_sets = json.load(f)
                logger.info(f"Loaded {len(self.backup_sets)} backup sets from metadata")
            except Exception as e:
                logger.error(f"Error loading backup metadata: {str(e)}")
                self.backup_sets = []
    
    def _save_backup_sets(self) -> None:
        """Save backup sets metadata to backup directory"""
        metadata_path = os.path.join(self.backup_directory, 'backup_metadata.json')
        
        try:
            with open(metadata_path, 'w') as f:
                json.dump(self.backup_sets, f, indent=2)
            logger.info(f"Saved {len(self.backup_sets)} backup sets to metadata")
        except Exception as e:
            logger.error(f"Error saving backup metadata: {str(e)}")
    
    def create_backup(self, backup_type: str = 'full', 
                     sources: Optional[List[str]] = None,
                     description: Optional[str] = None) -> Dict[str, Any]:
        """
        Create a backup of the specified sources.
        
        Args:
            backup_type: Type of backup ('full', 'differential', 'incremental')
            sources: List of sources to back up (None for all)
            description: Optional description of the backup
            
        Returns:
            Backup information
        """
        backup_id = str(uuid.uuid4())
        timestamp = datetime.datetime.now()
        timestamp_str = timestamp.strftime('%Y%m%d_%H%M%S')
        
        # Default sources if none provided
        if not sources:
            sources = []
            for priority in ['critical', 'high', 'medium', 'low']:
                sources.extend(self.recovery_priorities[priority])
        
        # Create backup directory
        backup_path = os.path.join(self.backup_directory, f"{backup_type}_{timestamp_str}")
        os.makedirs(backup_path, exist_ok=True)
        
        # Create backup info
        backup_info = {
            'id': backup_id,
            'type': backup_type,
            'created_at': timestamp.isoformat(),
            'description': description or f"{backup_type.capitalize()} backup at {timestamp_str}",
            'sources': sources,
            'path': backup_path,
            'size_bytes': 0,
            'status': 'in_progress',
            'completed_at': None,
            'files_count': 0,
            'checksum': None,
            'base_backup_id': None  # For differential/incremental backups
        }
        
        # If differential/incremental, find the base backup
        if backup_type in ['differential', 'incremental']:
            base_backup = self._find_latest_full_backup()
            if base_backup:
                backup_info['base_backup_id'] = base_backup['id']
            else:
                logger.warning("No full backup found, creating full backup instead")
                backup_info['type'] = 'full'
        
        # Add to backup sets
        self.backup_sets.append(backup_info)
        self._save_backup_sets()
        
        # Log the operation
        operation = {
            'type': 'backup_start',
            'backup_id': backup_id,
            'timestamp': timestamp.isoformat(),
            'details': {
                'backup_type': backup_type,
                'sources': sources
            }
        }
        self.operations_history.append(operation)
        
        logger.info(f"Started {backup_type} backup with ID: {backup_id}")
        
        try:
            # Perform the actual backup
            self._perform_backup(backup_info)
            
            # Update backup status
            backup_info['status'] = 'completed'
            backup_info['completed_at'] = datetime.datetime.now().isoformat()
            
            # Get directory size
            backup_info['size_bytes'] = self._get_directory_size(backup_path)
            
            # Calculate checksum
            backup_info['checksum'] = self._calculate_backup_checksum(backup_path)
            
            # Save updated metadata
            self._save_backup_sets()
            
            # Log the operation
            operation = {
                'type': 'backup_complete',
                'backup_id': backup_id,
                'timestamp': datetime.datetime.now().isoformat(),
                'details': {
                    'size_bytes': backup_info['size_bytes'],
                    'files_count': backup_info['files_count']
                }
            }
            self.operations_history.append(operation)
            
            logger.info(f"Completed {backup_type} backup with ID: {backup_id}")
            
            return backup_info
            
        except Exception as e:
            # Update backup status
            backup_info['status'] = 'failed'
            
            # Log the error
            operation = {
                'type': 'backup_error',
                'backup_id': backup_id,
                'timestamp': datetime.datetime.now().isoformat(),
                'details': {
                    'error': str(e)
                }
            }
            self.operations_history.append(operation)
            
            logger.error(f"Backup error: {str(e)}")
            raise
    
    def _perform_backup(self, backup_info: Dict[str, Any]) -> None:
        """
        Perform the actual backup operation.
        
        Args:
            backup_info: Backup information dictionary
        """
        # This is a simplified implementation
        # In a real system, this would use enterprise backup solutions
        
        sources = backup_info['sources']
        backup_path = backup_info['path']
        files_count = 0
        
        # Create a metadata file with backup information
        metadata_path = os.path.join(backup_path, 'backup_info.json')
        with open(metadata_path, 'w') as f:
            json.dump(backup_info, f, indent=2)
        
        # Mock data source paths for demonstration
        source_dirs = {
            'property_master': 'data/property',
            'assessment_main': 'data/assessments',
            'user_data': 'data/users',
            'spatial_data': 'data/spatial',
            'documents': 'data/documents',
            'historical_assessments': 'data/historical',
            'reports': 'data/reports',
            'logs': 'logs',
            'audit_data': 'data/audit',
            'temporary_data': 'data/temp',
            'cache': 'data/cache',
            'exports': 'data/exports'
        }
        
        # Process each source
        for source in sources:
            source_path = source_dirs.get(source)
            if not source_path or not os.path.exists(source_path):
                logger.warning(f"Source path not found: {source_path}")
                continue
            
            # Create destination directory
            dest_path = os.path.join(backup_path, source)
            os.makedirs(dest_path, exist_ok=True)
            
            # Backup logic depends on the backup type
            if backup_info['type'] == 'full':
                # For full backup, copy everything
                files_copied = self._copy_directory(source_path, dest_path)
                files_count += files_copied
                
            elif backup_info['type'] == 'differential':
                # For differential, copy files newer than the last full backup
                base_backup_id = backup_info.get('base_backup_id')
                if base_backup_id:
                    base_backup = self._find_backup_by_id(base_backup_id)
                    if base_backup:
                        base_time = datetime.datetime.fromisoformat(base_backup['created_at'])
                        files_copied = self._copy_directory(
                            source_path, dest_path, 
                            min_mtime=base_time.timestamp()
                        )
                        files_count += files_copied
                
            elif backup_info['type'] == 'incremental':
                # For incremental, copy files newer than the last backup (full or incremental)
                last_backup = self._find_latest_backup_for_source(source)
                if last_backup:
                    last_time = datetime.datetime.fromisoformat(last_backup['created_at'])
                    files_copied = self._copy_directory(
                        source_path, dest_path, 
                        min_mtime=last_time.timestamp()
                    )
                    files_count += files_copied
        
        # Update the files count
        backup_info['files_count'] = files_count
    
    def _copy_directory(self, source_dir: str, dest_dir: str, 
                       min_mtime: Optional[float] = None) -> int:
        """
        Copy a directory, optionally filtering by modification time.
        
        Args:
            source_dir: Source directory path
            dest_dir: Destination directory path
            min_mtime: Only copy files modified after this timestamp
            
        Returns:
            Number of files copied
        """
        files_copied = 0
        
        for root, dirs, files in os.walk(source_dir):
            # Create corresponding destination directory
            rel_path = os.path.relpath(root, source_dir)
            current_dest_dir = os.path.join(dest_dir, rel_path)
            os.makedirs(current_dest_dir, exist_ok=True)
            
            # Copy files
            for file in files:
                source_file = os.path.join(root, file)
                dest_file = os.path.join(current_dest_dir, file)
                
                # Check modification time if needed
                if min_mtime is not None:
                    mtime = os.path.getmtime(source_file)
                    if mtime < min_mtime:
                        continue
                
                # Copy the file
                try:
                    shutil.copy2(source_file, dest_file)
                    files_copied += 1
                except Exception as e:
                    logger.error(f"Error copying file {source_file}: {str(e)}")
        
        return files_copied
    
    def _get_directory_size(self, directory: str) -> int:
        """
        Calculate the size of a directory in bytes.
        
        Args:
            directory: Directory path
            
        Returns:
            Directory size in bytes
        """
        total_size = 0
        
        for root, dirs, files in os.walk(directory):
            for file in files:
                file_path = os.path.join(root, file)
                try:
                    total_size += os.path.getsize(file_path)
                except Exception:
                    pass
        
        return total_size
    
    def _calculate_backup_checksum(self, backup_path: str) -> str:
        """
        Calculate a checksum for the backup.
        
        Args:
            backup_path: Backup directory path
            
        Returns:
            Checksum string
        """
        # This is a simplified implementation
        # In a real system, a more robust checksum would be used
        import hashlib
        
        checksums = []
        
        for root, dirs, files in os.walk(backup_path):
            for file in sorted(files):
                file_path = os.path.join(root, file)
                try:
                    rel_path = os.path.relpath(file_path, backup_path)
                    with open(file_path, 'rb') as f:
                        content = f.read()
                    file_hash = hashlib.md5(content).hexdigest()
                    checksums.append(f"{rel_path}:{file_hash}")
                except Exception:
                    pass
        
        # Create an overall checksum from the concatenated checksums
        overall_checksum = hashlib.sha256('|'.join(checksums).encode()).hexdigest()
        return overall_checksum
    
    def _find_latest_full_backup(self) -> Optional[Dict[str, Any]]:
        """
        Find the latest full backup.
        
        Returns:
            Latest full backup info or None
        """
        full_backups = [b for b in self.backup_sets if b['type'] == 'full' and b['status'] == 'completed']
        if not full_backups:
            return None
        
        # Sort by creation time (most recent first)
        sorted_backups = sorted(
            full_backups,
            key=lambda b: datetime.datetime.fromisoformat(b['created_at']),
            reverse=True
        )
        
        return sorted_backups[0] if sorted_backups else None
    
    def _find_backup_by_id(self, backup_id: str) -> Optional[Dict[str, Any]]:
        """
        Find a backup by its ID.
        
        Args:
            backup_id: Backup ID
            
        Returns:
            Backup info or None
        """
        for backup in self.backup_sets:
            if backup['id'] == backup_id:
                return backup
        
        return None
    
    def _find_latest_backup_for_source(self, source: str) -> Optional[Dict[str, Any]]:
        """
        Find the latest backup for a specific source.
        
        Args:
            source: Source name
            
        Returns:
            Latest backup info or None
        """
        relevant_backups = [
            b for b in self.backup_sets 
            if source in b.get('sources', []) and b['status'] == 'completed'
        ]
        
        if not relevant_backups:
            return None
        
        # Sort by creation time (most recent first)
        sorted_backups = sorted(
            relevant_backups,
            key=lambda b: datetime.datetime.fromisoformat(b['created_at']),
            reverse=True
        )
        
        return sorted_backups[0] if sorted_backups else None
    
    def list_backups(self, backup_type: Optional[str] = None, 
                    start_date: Optional[datetime.datetime] = None,
                    end_date: Optional[datetime.datetime] = None,
                    status: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        List backups with optional filtering.
        
        Args:
            backup_type: Filter by backup type
            start_date: Filter by start date
            end_date: Filter by end date
            status: Filter by backup status
            
        Returns:
            List of matching backup info dictionaries
        """
        results = self.backup_sets.copy()
        
        # Apply filters
        if backup_type:
            results = [b for b in results if b['type'] == backup_type]
        
        if start_date:
            results = [
                b for b in results 
                if datetime.datetime.fromisoformat(b['created_at']) >= start_date
            ]
        
        if end_date:
            results = [
                b for b in results 
                if datetime.datetime.fromisoformat(b['created_at']) <= end_date
            ]
        
        if status:
            results = [b for b in results if b['status'] == status]
        
        # Sort by creation time (most recent first)
        results = sorted(
            results,
            key=lambda b: datetime.datetime.fromisoformat(b['created_at']),
            reverse=True
        )
        
        return results
    
    def restore_from_backup(self, backup_id: str, 
                          target_directory: Optional[str] = None,
                          sources: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        Restore data from a backup.
        
        Args:
            backup_id: ID of the backup to restore from
            target_directory: Target directory (None for original locations)
            sources: List of sources to restore (None for all)
            
        Returns:
            Restoration information
        """
        # Find the backup
        backup = self._find_backup_by_id(backup_id)
        if not backup:
            raise ValueError(f"Backup not found: {backup_id}")
        
        # Check backup status
        if backup['status'] != 'completed':
            raise ValueError(f"Backup is not completed: {backup_id}")
        
        # Set target directory
        if not target_directory:
            target_directory = self.recovery_directory
        
        # Create restoration info
        restoration_id = str(uuid.uuid4())
        timestamp = datetime.datetime.now()
        
        # Default to all sources in the backup if none specified
        if not sources:
            sources = backup['sources']
        else:
            # Verify all requested sources are in the backup
            for source in sources:
                if source not in backup['sources']:
                    raise ValueError(f"Source not in backup: {source}")
        
        restoration_info = {
            'id': restoration_id,
            'backup_id': backup_id,
            'created_at': timestamp.isoformat(),
            'sources': sources,
            'target_directory': target_directory,
            'status': 'in_progress',
            'completed_at': None,
            'files_restored': 0
        }
        
        # Log the operation
        operation = {
            'type': 'restoration_start',
            'restoration_id': restoration_id,
            'backup_id': backup_id,
            'timestamp': timestamp.isoformat(),
            'details': {
                'sources': sources,
                'target_directory': target_directory
            }
        }
        self.operations_history.append(operation)
        
        # Track active restoration
        self.active_recovery_operations[restoration_id] = restoration_info
        
        logger.info(f"Started restoration with ID: {restoration_id} from backup: {backup_id}")
        
        try:
            # Perform the restoration
            self._perform_restoration(backup, restoration_info)
            
            # Update restoration status
            restoration_info['status'] = 'completed'
            restoration_info['completed_at'] = datetime.datetime.now().isoformat()
            
            # Log the operation
            operation = {
                'type': 'restoration_complete',
                'restoration_id': restoration_id,
                'timestamp': datetime.datetime.now().isoformat(),
                'details': {
                    'files_restored': restoration_info['files_restored']
                }
            }
            self.operations_history.append(operation)
            
            logger.info(f"Completed restoration with ID: {restoration_id}")
            
            return restoration_info
            
        except Exception as e:
            # Update restoration status
            restoration_info['status'] = 'failed'
            
            # Log the error
            operation = {
                'type': 'restoration_error',
                'restoration_id': restoration_id,
                'timestamp': datetime.datetime.now().isoformat(),
                'details': {
                    'error': str(e)
                }
            }
            self.operations_history.append(operation)
            
            logger.error(f"Restoration error: {str(e)}")
            raise
    
    def _perform_restoration(self, backup: Dict[str, Any], 
                            restoration_info: Dict[str, Any]) -> None:
        """
        Perform the actual restoration operation.
        
        Args:
            backup: Backup information
            restoration_info: Restoration information
        """
        # Get backup path and sources
        backup_path = backup['path']
        sources = restoration_info['sources']
        target_directory = restoration_info['target_directory']
        files_restored = 0
        
        # For full backups, simply copy from the backup
        if backup['type'] == 'full':
            for source in sources:
                source_backup_path = os.path.join(backup_path, source)
                if not os.path.exists(source_backup_path):
                    logger.warning(f"Source not found in backup: {source}")
                    continue
                
                # Determine target path
                target_path = os.path.join(target_directory, source)
                os.makedirs(os.path.dirname(target_path), exist_ok=True)
                
                # Copy files
                files_copied = self._copy_directory(source_backup_path, target_path)
                files_restored += files_copied
        
        # For differential/incremental, more complex logic is needed
        elif backup['type'] in ['differential', 'incremental']:
            # For differential, we need the base full backup
            if backup['type'] == 'differential':
                base_backup_id = backup.get('base_backup_id')
                if not base_backup_id:
                    raise ValueError("Differential backup has no base backup ID")
                
                base_backup = self._find_backup_by_id(base_backup_id)
                if not base_backup:
                    raise ValueError(f"Base backup not found: {base_backup_id}")
                
                # First restore from full backup
                for source in sources:
                    source_backup_path = os.path.join(base_backup['path'], source)
                    if not os.path.exists(source_backup_path):
                        logger.warning(f"Source not found in base backup: {source}")
                        continue
                    
                    # Determine target path
                    target_path = os.path.join(target_directory, source)
                    os.makedirs(os.path.dirname(target_path), exist_ok=True)
                    
                    # Copy files from full backup
                    files_copied = self._copy_directory(source_backup_path, target_path)
                    files_restored += files_copied
            
            # Then apply the differential/incremental backup
            for source in sources:
                source_backup_path = os.path.join(backup_path, source)
                if not os.path.exists(source_backup_path):
                    logger.warning(f"Source not found in differential/incremental backup: {source}")
                    continue
                
                # Determine target path
                target_path = os.path.join(target_directory, source)
                os.makedirs(os.path.dirname(target_path), exist_ok=True)
                
                # Copy files from differential/incremental backup (overwriting as needed)
                files_copied = self._copy_directory(source_backup_path, target_path)
                files_restored += files_copied
        
        # Update the files restored count
        restoration_info['files_restored'] = files_restored
    
    def clean_old_backups(self, retention_days: Optional[int] = None) -> int:
        """
        Clean up old backups based on retention policy.
        
        Args:
            retention_days: Number of days to keep backups (None for default)
            
        Returns:
            Number of backups deleted
        """
        if retention_days is None:
            retention_days = self.backup_retention_days
        
        # Calculate cutoff date
        cutoff_date = datetime.datetime.now() - datetime.timedelta(days=retention_days)
        
        # Find old backups
        backups_to_delete = []
        for backup in self.backup_sets:
            backup_date = datetime.datetime.fromisoformat(backup['created_at'])
            if backup_date < cutoff_date:
                backups_to_delete.append(backup)
        
        # Delete old backups
        deleted_count = 0
        for backup in backups_to_delete:
            try:
                # Delete backup directory
                backup_path = backup['path']
                if os.path.exists(backup_path):
                    shutil.rmtree(backup_path)
                
                # Remove from backup sets
                self.backup_sets.remove(backup)
                deleted_count += 1
                
                logger.info(f"Deleted old backup: {backup['id']}")
            except Exception as e:
                logger.error(f"Error deleting backup {backup['id']}: {str(e)}")
        
        # Save updated backup sets
        if deleted_count > 0:
            self._save_backup_sets()
        
        return deleted_count
    
    def get_operation_history(self, operation_type: Optional[str] = None,
                            limit: int = 100) -> List[Dict[str, Any]]:
        """
        Get operation history with optional filtering.
        
        Args:
            operation_type: Filter by operation type
            limit: Maximum number of operations to return
            
        Returns:
            List of operations
        """
        if operation_type:
            filtered_ops = [op for op in self.operations_history if op['type'].startswith(operation_type)]
        else:
            filtered_ops = self.operations_history.copy()
        
        # Sort by timestamp (most recent first)
        sorted_ops = sorted(
            filtered_ops,
            key=lambda op: op['timestamp'],
            reverse=True
        )
        
        # Apply limit
        return sorted_ops[:limit]
    
    def verify_backup(self, backup_id: str) -> Dict[str, Any]:
        """
        Verify a backup's integrity.
        
        Args:
            backup_id: ID of the backup to verify
            
        Returns:
            Verification results
        """
        # Find the backup
        backup = self._find_backup_by_id(backup_id)
        if not backup:
            raise ValueError(f"Backup not found: {backup_id}")
        
        verification_id = str(uuid.uuid4())
        timestamp = datetime.datetime.now()
        
        verification_info = {
            'id': verification_id,
            'backup_id': backup_id,
            'created_at': timestamp.isoformat(),
            'status': 'in_progress',
            'completed_at': None,
            'is_valid': False,
            'issues': []
        }
        
        # Log the operation
        operation = {
            'type': 'verification_start',
            'verification_id': verification_id,
            'backup_id': backup_id,
            'timestamp': timestamp.isoformat()
        }
        self.operations_history.append(operation)
        
        logger.info(f"Started verification with ID: {verification_id} for backup: {backup_id}")
        
        try:
            # Check if backup directory exists
            backup_path = backup['path']
            if not os.path.exists(backup_path):
                verification_info['issues'].append({
                    'type': 'missing_directory',
                    'message': f"Backup directory not found: {backup_path}"
                })
                verification_info['is_valid'] = False
            else:
                # Verify backup checksum
                original_checksum = backup.get('checksum')
                if original_checksum:
                    current_checksum = self._calculate_backup_checksum(backup_path)
                    if current_checksum != original_checksum:
                        verification_info['issues'].append({
                            'type': 'checksum_mismatch',
                            'message': "Backup checksum does not match",
                            'details': {
                                'original': original_checksum,
                                'current': current_checksum
                            }
                        })
                        verification_info['is_valid'] = False
                    else:
                        verification_info['is_valid'] = True
                else:
                    verification_info['issues'].append({
                        'type': 'missing_checksum',
                        'message': "Original backup has no checksum"
                    })
                    verification_info['is_valid'] = False
            
            # Update verification status
            verification_info['status'] = 'completed'
            verification_info['completed_at'] = datetime.datetime.now().isoformat()
            
            # Log the operation
            operation = {
                'type': 'verification_complete',
                'verification_id': verification_id,
                'timestamp': datetime.datetime.now().isoformat(),
                'details': {
                    'is_valid': verification_info['is_valid'],
                    'issues_count': len(verification_info['issues'])
                }
            }
            self.operations_history.append(operation)
            
            logger.info(f"Completed verification with ID: {verification_id}")
            
            return verification_info
            
        except Exception as e:
            # Update verification status
            verification_info['status'] = 'failed'
            verification_info['is_valid'] = False
            verification_info['issues'].append({
                'type': 'verification_error',
                'message': str(e)
            })
            
            # Log the error
            operation = {
                'type': 'verification_error',
                'verification_id': verification_id,
                'timestamp': datetime.datetime.now().isoformat(),
                'details': {
                    'error': str(e)
                }
            }
            self.operations_history.append(operation)
            
            logger.error(f"Verification error: {str(e)}")
            
            return verification_info
    
    def get_recovery_metrics(self) -> Dict[str, Any]:
        """
        Get recovery metrics and statistics.
        
        Returns:
            Dictionary of recovery metrics
        """
        # Calculate total backup size
        total_size = sum(
            backup.get('size_bytes', 0) 
            for backup in self.backup_sets 
            if backup['status'] == 'completed'
        )
        
        # Calculate recovery capabilities
        recovery_points = {}
        for priority in self.recovery_priorities:
            sources = self.recovery_priorities[priority]
            latest_backups = {}
            
            for source in sources:
                latest_backup = self._find_latest_backup_for_source(source)
                if latest_backup:
                    backup_time = datetime.datetime.fromisoformat(latest_backup['created_at'])
                    age_minutes = (datetime.datetime.now() - backup_time).total_seconds() / 60
                    rpo_target = self.rpo_targets.get(priority, float('inf'))
                    
                    latest_backups[source] = {
                        'backup_id': latest_backup['id'],
                        'backup_time': backup_time.isoformat(),
                        'age_minutes': age_minutes,
                        'meets_rpo': age_minutes <= rpo_target
                    }
            
            recovery_points[priority] = latest_backups
        
        # Get recent operations
        recent_operations = self.get_operation_history(limit=10)
        
        # Summary statistics
        backup_counts = {}
        for backup_type in ['full', 'differential', 'incremental']:
            backup_counts[backup_type] = len([
                b for b in self.backup_sets 
                if b['type'] == backup_type and b['status'] == 'completed'
            ])
        
        return {
            'total_backups': len(self.backup_sets),
            'completed_backups': len([b for b in self.backup_sets if b['status'] == 'completed']),
            'failed_backups': len([b for b in self.backup_sets if b['status'] == 'failed']),
            'backup_counts': backup_counts,
            'total_backup_size_bytes': total_size,
            'recovery_points': recovery_points,
            'recent_operations': recent_operations,
            'rpo_targets': self.rpo_targets,
            'rto_targets': self.rto_targets
        }

# Create singleton instance
recovery_manager = RecoveryManager()