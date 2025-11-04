"""
Conflict Resolution for Sync Service

This module provides conflict resolution strategies for bidirectional sync operations.
It implements timestamp-based resolution with field-level conflict detection to ensure
data integrity during synchronization.
"""
import logging
import datetime
from typing import Dict, Any, List, Tuple, Optional

from app import db
from sync_service.models import SyncLog, SyncJob, FieldConfiguration
from sync_service.app_context import with_app_context

# Set up logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

class ConflictResolutionStrategy:
    """Base class for conflict resolution strategies"""
    
    def __init__(self, job_id: str = None):
        """Initialize the conflict resolution strategy
        
        Args:
            job_id: The ID of the sync job using this strategy
        """
        self.job_id = job_id
    
    def resolve_conflict(self, table_name: str, record_id: Any, 
                        source_data: Dict[str, Any], target_data: Dict[str, Any]) -> Dict[str, Any]:
        """Resolve a conflict between source and target data
        
        Args:
            table_name: The name of the table containing the conflict
            record_id: The ID of the record with the conflict
            source_data: The data from the source system
            target_data: The data from the target system
            
        Returns:
            Dict containing the resolved data
        """
        raise NotImplementedError("Subclasses must implement resolve_conflict")
    
    def log_conflict(self, table_name: str, record_id: Any, 
                    field_name: str, source_value: Any, target_value: Any, 
                    resolution: str):
        """Log a conflict and its resolution
        
        Args:
            table_name: The name of the table containing the conflict
            record_id: The ID of the record with the conflict
            field_name: The name of the field with the conflict
            source_value: The value from the source system
            target_value: The value from the target system
            resolution: The resolution applied (e.g., "source", "target", "manual")
        """
        if not self.job_id:
            logger.warning("No job ID provided for conflict logging")
            return
            
        # Create conflict log entry
        log_entry = SyncLog()
        log_entry.job_id = self.job_id
        log_entry.level = "warning"
        log_entry.message = f"Conflict in {table_name}.{field_name} for record {record_id}"
        log_entry.details = {
            "table": table_name,
            "record_id": str(record_id),
            "field": field_name,
            "source_value": str(source_value),
            "target_value": str(target_value),
            "resolution": resolution
        }
        
        # Add to session and commit
        db.session.add(log_entry)
        db.session.commit()
        
        logger.info(f"Logged conflict in {table_name}.{field_name} for record {record_id}, resolution: {resolution}")


class TimestampBasedResolution(ConflictResolutionStrategy):
    """Timestamp-based conflict resolution with field-level detection
    
    This strategy resolves conflicts based on timestamp comparison at the field level.
    Fields with more recent timestamps in their last_modified field win.
    """
    
    def __init__(self, job_id: str = None, default_winner: str = "source"):
        """Initialize timestamp-based resolution
        
        Args:
            job_id: The ID of the sync job using this strategy
            default_winner: Default winner ("source" or "target") if timestamps are equal
        """
        super().__init__(job_id)
        self.default_winner = default_winner
        if default_winner not in ["source", "target"]:
            raise ValueError("default_winner must be 'source' or 'target'")
    
    @with_app_context
    def resolve_conflict(self, table_name: str, record_id: Any, 
                        source_data: Dict[str, Any], target_data: Dict[str, Any],
                        timestamp_field: str = "last_modified") -> Dict[str, Any]:
        """Resolve conflicts using timestamp-based field-level resolution
        
        Args:
            table_name: The name of the table containing the conflict
            record_id: The ID of the record with the conflict
            source_data: The data from the source system
            target_data: The data from the target system
            timestamp_field: The name of the timestamp field to use for comparison
            
        Returns:
            Dict containing the resolved data
        """
        resolved_data = {}
        
        # Get field configurations for this table
        field_configs = FieldConfiguration.query.filter_by(table_name=table_name).all()
        field_config_dict = {fc.field_name: fc for fc in field_configs}
        
        # Process each field in the data
        for field_name in set(list(source_data.keys()) + list(target_data.keys())):
            # Skip ID field
            if field_name == "id":
                resolved_data[field_name] = record_id
                continue
                
            # Skip timestamp field itself
            if field_name == timestamp_field:
                # Use the most recent timestamp
                source_ts = source_data.get(timestamp_field)
                target_ts = target_data.get(timestamp_field)
                
                if source_ts and target_ts:
                    resolved_data[timestamp_field] = max(source_ts, target_ts)
                elif source_ts:
                    resolved_data[timestamp_field] = source_ts
                elif target_ts:
                    resolved_data[timestamp_field] = target_ts
                else:
                    resolved_data[timestamp_field] = datetime.datetime.utcnow()
                    
                continue
            
            # Check if the field exists in both datasets
            source_has_field = field_name in source_data
            target_has_field = field_name in target_data
            
            # If field only exists in one dataset, use that value
            if source_has_field and not target_has_field:
                resolved_data[field_name] = source_data[field_name]
                continue
                
            if target_has_field and not source_has_field:
                resolved_data[field_name] = target_data[field_name]
                continue
            
            # Field exists in both, check if there's a conflict
            source_value = source_data[field_name]
            target_value = target_data[field_name]
            
            if source_value == target_value:
                # No conflict, values are the same
                resolved_data[field_name] = source_value
                continue
            
            # We have a conflict, determine winner based on timestamps
            source_ts = source_data.get(timestamp_field)
            target_ts = target_data.get(timestamp_field)
            
            # Check field-specific configuration
            field_config = field_config_dict.get(field_name)
            field_resolution = None
            
            if field_config and field_config.conflict_resolution:
                field_resolution = field_config.conflict_resolution
            
            # Apply resolution strategy
            resolution = "unknown"
            
            if field_resolution == "source_wins":
                resolved_data[field_name] = source_value
                resolution = "source (field config)"
                
            elif field_resolution == "target_wins":
                resolved_data[field_name] = target_value
                resolution = "target (field config)"
                
            elif field_resolution == "newer_wins":
                # Timestamp-based resolution
                if source_ts and target_ts:
                    if source_ts > target_ts:
                        resolved_data[field_name] = source_value
                        resolution = "source (newer)"
                    elif target_ts > source_ts:
                        resolved_data[field_name] = target_value
                        resolution = "target (newer)"
                    else:
                        # Equal timestamps, use default
                        if self.default_winner == "source":
                            resolved_data[field_name] = source_value
                            resolution = "source (default)"
                        else:
                            resolved_data[field_name] = target_value
                            resolution = "target (default)"
                elif source_ts:
                    resolved_data[field_name] = source_value
                    resolution = "source (only timestamp)"
                elif target_ts:
                    resolved_data[field_name] = target_value
                    resolution = "target (only timestamp)"
                else:
                    # No timestamps, use default
                    if self.default_winner == "source":
                        resolved_data[field_name] = source_value
                        resolution = "source (default)"
                    else:
                        resolved_data[field_name] = target_value
                        resolution = "target (default)"
            else:
                # Default resolution based on configuration
                if self.default_winner == "source":
                    resolved_data[field_name] = source_value
                    resolution = "source (default)"
                else:
                    resolved_data[field_name] = target_value
                    resolution = "target (default)"
            
            # Log the conflict and its resolution
            self.log_conflict(
                table_name=table_name,
                record_id=record_id,
                field_name=field_name,
                source_value=source_value,
                target_value=target_value,
                resolution=resolution
            )
        
        return resolved_data


class ManualResolution(ConflictResolutionStrategy):
    """Manual conflict resolution
    
    This strategy flags conflicts for manual resolution and provides
    a staging area for pending conflicts.
    """
    
    def __init__(self, job_id: str = None):
        """Initialize manual resolution strategy
        
        Args:
            job_id: The ID of the sync job using this strategy
        """
        super().__init__(job_id)
    
    @with_app_context
    def resolve_conflict(self, table_name: str, record_id: Any, 
                        source_data: Dict[str, Any], target_data: Dict[str, Any]) -> Dict[str, Any]:
        """Flag conflict for manual resolution
        
        Args:
            table_name: The name of the table containing the conflict
            record_id: The ID of the record with the conflict
            source_data: The data from the source system
            target_data: The data from the target system
            
        Returns:
            None to indicate pending manual resolution
        """
        # Create a conflict record for manual resolution
        from sync_service.models import SyncConflict
        
        # Store conflict data for later resolution
        conflict = SyncConflict()
        conflict.job_id = self.job_id
        conflict.table_name = table_name
        conflict.record_id = str(record_id)
        conflict.source_data = source_data
        conflict.target_data = target_data
        conflict.resolution_status = "pending"
        conflict.created_at = datetime.datetime.utcnow()
        
        db.session.add(conflict)
        db.session.commit()
        
        # Log the pending conflict
        self.log_conflict(
            table_name=table_name,
            record_id=record_id,
            field_name="multiple_fields",
            source_value="[source data]",
            target_value="[target data]",
            resolution="pending_manual"
        )
        
        # Return None to indicate that no automatic resolution was made
        return None


class FieldLevelConflictDetector:
    """Field-level conflict detection
    
    This class provides methods for detecting conflicts at the field level
    and determining which fields have changed between two versions of a record.
    """
    
    @staticmethod
    def detect_conflicts(source_data: Dict[str, Any], target_data: Dict[str, Any],
                        primary_key: str = "id") -> Dict[str, Tuple[Any, Any]]:
        """Detect conflicts between source and target data at the field level
        
        Args:
            source_data: The data from the source system
            target_data: The data from the target system
            primary_key: The name of the primary key field to exclude
            
        Returns:
            Dict mapping field names to (source_value, target_value) tuples for fields with conflicts
        """
        conflicts = {}
        
        # Combine all fields from both datasets
        all_fields = set(source_data.keys()) | set(target_data.keys())
        
        # Remove primary key from consideration
        if primary_key in all_fields:
            all_fields.remove(primary_key)
        
        # Check each field for conflicts
        for field in all_fields:
            source_value = source_data.get(field)
            target_value = target_data.get(field)
            
            # Handle fields that only exist in one dataset
            if field not in source_data:
                conflicts[field] = (None, target_value)
                continue
                
            if field not in target_data:
                conflicts[field] = (source_value, None)
                continue
            
            # Check for value conflicts
            if source_value != target_value:
                conflicts[field] = (source_value, target_value)
        
        return conflicts
    
    @staticmethod
    def get_changed_fields(old_data: Dict[str, Any], new_data: Dict[str, Any],
                           primary_key: str = "id") -> List[str]:
        """Determine which fields have changed between two versions of a record
        
        Args:
            old_data: The older version of the record
            new_data: The newer version of the record
            primary_key: The name of the primary key field to exclude
            
        Returns:
            List of field names that have changed
        """
        changed_fields = []
        
        # Combine all fields from both datasets
        all_fields = set(old_data.keys()) | set(new_data.keys())
        
        # Remove primary key from consideration
        if primary_key in all_fields:
            all_fields.remove(primary_key)
        
        # Check each field for changes
        for field in all_fields:
            old_value = old_data.get(field)
            new_value = new_data.get(field)
            
            # Handle fields that only exist in one dataset
            if field not in old_data or field not in new_data:
                changed_fields.append(field)
                continue
            
            # Check for value changes
            if old_value != new_value:
                changed_fields.append(field)
        
        return changed_fields


# Factory function to create the appropriate resolution strategy
def create_resolution_strategy(strategy_type: str, job_id: str = None, 
                               default_winner: str = "source") -> ConflictResolutionStrategy:
    """Create a conflict resolution strategy based on the specified type
    
    Args:
        strategy_type: The type of strategy to create ("timestamp", "manual")
        job_id: The ID of the sync job using this strategy
        default_winner: Default winner for timestamp-based resolution
        
    Returns:
        A ConflictResolutionStrategy instance
    """
    if strategy_type == "timestamp":
        return TimestampBasedResolution(job_id, default_winner)
    elif strategy_type == "manual":
        return ManualResolution(job_id)
    else:
        raise ValueError(f"Unknown conflict resolution strategy: {strategy_type}")