"""
Conflict Resolver Component for TerraFusion Sync Service.

This module is responsible for detecting and resolving conflicts that occur during
synchronization between source and target databases.
"""

import logging
import datetime
import json
from typing import Dict, List, Any, Tuple, Optional, Union, Set, Callable

import sqlalchemy as sa
from sqlalchemy.sql import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.engine import Engine, Connection

from sync_service.data_type_handlers import DataTypeHandler, get_handler_for_column

logger = logging.getLogger(__name__)


class ConflictStrategy:
    """Base class for conflict resolution strategies."""
    
    def __init__(self, name: str, description: str = None):
        """
        Initialize a conflict resolution strategy.
        
        Args:
            name: Unique name for the strategy
            description: Human-readable description of the strategy
        """
        self.name = name
        self.description = description or name
        
    def resolve(self, 
               source_record: Dict[str, Any], 
               target_record: Dict[str, Any],
               context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Resolve a conflict between source and target records.
        
        Args:
            source_record: Record from source database
            target_record: Record from target database
            context: Additional context for resolution
            
        Returns:
            Resolved record to be used
        """
        raise NotImplementedError("Subclasses must implement resolve method")


class SourceWinsStrategy(ConflictStrategy):
    """Strategy that always chooses the source record."""
    
    def __init__(self):
        """Initialize the source-wins strategy."""
        super().__init__(
            name="source_wins",
            description="Always use the source record in conflicts"
        )
        
    def resolve(self, 
               source_record: Dict[str, Any], 
               target_record: Dict[str, Any],
               context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Resolve by choosing the source record.
        
        Args:
            source_record: Record from source database
            target_record: Record from target database
            context: Additional context for resolution
            
        Returns:
            Source record
        """
        return source_record


class TargetWinsStrategy(ConflictStrategy):
    """Strategy that always chooses the target record."""
    
    def __init__(self):
        """Initialize the target-wins strategy."""
        super().__init__(
            name="target_wins",
            description="Always use the target record in conflicts"
        )
        
    def resolve(self, 
               source_record: Dict[str, Any], 
               target_record: Dict[str, Any],
               context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Resolve by choosing the target record.
        
        Args:
            source_record: Record from source database
            target_record: Record from target database
            context: Additional context for resolution
            
        Returns:
            Target record
        """
        return target_record


class NewerWinsStrategy(ConflictStrategy):
    """Strategy that chooses the newer record based on a timestamp field."""
    
    def __init__(self, timestamp_field: str = 'updated_at'):
        """
        Initialize the newer-wins strategy.
        
        Args:
            timestamp_field: Name of the field containing the timestamp
        """
        super().__init__(
            name="newer_wins",
            description=f"Use the record with the newer {timestamp_field} value"
        )
        self.timestamp_field = timestamp_field
        
    def resolve(self, 
               source_record: Dict[str, Any], 
               target_record: Dict[str, Any],
               context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Resolve by choosing the record with the newer timestamp.
        
        Args:
            source_record: Record from source database
            target_record: Record from target database
            context: Additional context for resolution
            
        Returns:
            Newer record
        """
        # Check if timestamp field exists in both records
        if self.timestamp_field not in source_record or self.timestamp_field not in target_record:
            # Fall back to source-wins if timestamp not available
            logger.warning(f"Timestamp field '{self.timestamp_field}' not found in both records, using source record")
            return source_record
            
        source_ts = source_record[self.timestamp_field]
        target_ts = target_record[self.timestamp_field]
        
        # Handle non-datetime timestamps
        if not isinstance(source_ts, datetime.datetime):
            if isinstance(source_ts, str):
                try:
                    source_ts = datetime.datetime.fromisoformat(source_ts)
                except ValueError:
                    logger.warning(f"Could not parse source timestamp '{source_ts}', using source record")
                    return source_record
            else:
                logger.warning(f"Source timestamp is not a datetime or string, using source record")
                return source_record
                
        if not isinstance(target_ts, datetime.datetime):
            if isinstance(target_ts, str):
                try:
                    target_ts = datetime.datetime.fromisoformat(target_ts)
                except ValueError:
                    logger.warning(f"Could not parse target timestamp '{target_ts}', using source record")
                    return source_record
            else:
                logger.warning(f"Target timestamp is not a datetime or string, using source record")
                return source_record
                
        # Compare timestamps
        if source_ts >= target_ts:
            return source_record
        else:
            return target_record


class MergeStrategy(ConflictStrategy):
    """Strategy that merges records based on field-level rules."""
    
    def __init__(self, field_rules: Dict[str, str] = None):
        """
        Initialize the merge strategy.
        
        Args:
            field_rules: Dictionary mapping field names to resolution rules
                        ('source', 'target', 'newer', 'non_null')
        """
        super().__init__(
            name="merge",
            description="Merge records based on field-level rules"
        )
        self.field_rules = field_rules or {}
        self.default_rule = 'source'  # Default to source if no rule specified
        
    def resolve(self, 
               source_record: Dict[str, Any], 
               target_record: Dict[str, Any],
               context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Resolve by merging records based on field rules.
        
        Args:
            source_record: Record from source database
            target_record: Record from target database
            context: Additional context for resolution
            
        Returns:
            Merged record
        """
        # Start with source record as base
        merged = dict(source_record)
        
        # Get all fields from both records
        all_fields = set(source_record.keys()).union(set(target_record.keys()))
        
        for field in all_fields:
            rule = self.field_rules.get(field, self.default_rule)
            
            # Skip primary keys
            if context and 'primary_keys' in context and field in context['primary_keys']:
                continue
                
            # Apply rule for this field
            if rule == 'source':
                # Use source value if available
                if field in source_record:
                    merged[field] = source_record[field]
            elif rule == 'target':
                # Use target value if available
                if field in target_record:
                    merged[field] = target_record[field]
            elif rule == 'newer':
                # Use newer value based on timestamp
                timestamp_field = context.get('timestamp_field', 'updated_at') if context else 'updated_at'
                
                if timestamp_field in source_record and timestamp_field in target_record:
                    source_ts = source_record[timestamp_field]
                    target_ts = target_record[timestamp_field]
                    
                    if not isinstance(source_ts, datetime.datetime):
                        source_ts = self._parse_timestamp(source_ts)
                    if not isinstance(target_ts, datetime.datetime):
                        target_ts = self._parse_timestamp(target_ts)
                        
                    if source_ts and target_ts:
                        if source_ts >= target_ts:
                            if field in source_record:
                                merged[field] = source_record[field]
                        else:
                            if field in target_record:
                                merged[field] = target_record[field]
                    elif field in source_record:
                        merged[field] = source_record[field]
                else:
                    # No timestamps, use source
                    if field in source_record:
                        merged[field] = source_record[field]
            elif rule == 'non_null':
                # Use non-null value
                source_value = source_record.get(field)
                target_value = target_record.get(field)
                
                if source_value is not None:
                    merged[field] = source_value
                elif target_value is not None:
                    merged[field] = target_value
            else:
                # Unknown rule, use source
                if field in source_record:
                    merged[field] = source_record[field]
                    
        return merged
        
    def _parse_timestamp(self, ts_value) -> Optional[datetime.datetime]:
        """
        Parse a timestamp value to a datetime object.
        
        Args:
            ts_value: Value to parse
            
        Returns:
            Datetime object or None if parsing fails
        """
        if isinstance(ts_value, str):
            try:
                return datetime.datetime.fromisoformat(ts_value)
            except ValueError:
                return None
        return None


class CustomStrategy(ConflictStrategy):
    """Strategy that uses a custom function to resolve conflicts."""
    
    def __init__(self, name: str, description: str, 
                resolver_func: Callable[[Dict[str, Any], Dict[str, Any], Dict[str, Any]], Dict[str, Any]]):
        """
        Initialize a custom resolution strategy.
        
        Args:
            name: Unique name for the strategy
            description: Human-readable description of the strategy
            resolver_func: Function that takes (source_record, target_record, context) and returns the resolved record
        """
        super().__init__(name=name, description=description)
        self.resolver_func = resolver_func
        
    def resolve(self, 
               source_record: Dict[str, Any], 
               target_record: Dict[str, Any],
               context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Resolve using the custom resolver function.
        
        Args:
            source_record: Record from source database
            target_record: Record from target database
            context: Additional context for resolution
            
        Returns:
            Resolved record
        """
        return self.resolver_func(source_record, target_record, context or {})


class AIStrategy(ConflictStrategy):
    """Strategy that uses AI to resolve conflicts."""
    
    def __init__(self, ai_service_url: str = None):
        """
        Initialize the AI resolution strategy.
        
        Args:
            ai_service_url: URL of the AI service for resolution
        """
        super().__init__(
            name="ai",
            description="Use AI to resolve conflicts intelligently"
        )
        self.ai_service_url = ai_service_url
        
    def resolve(self, 
               source_record: Dict[str, Any], 
               target_record: Dict[str, Any],
               context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Resolve using AI service.
        
        Args:
            source_record: Record from source database
            target_record: Record from target database
            context: Additional context for resolution
            
        Returns:
            Resolved record
        """
        if not self.ai_service_url:
            logger.warning("AI resolution requested but no AI service URL provided, using source record")
            return source_record
            
        try:
            import requests
            
            # Prepare request to AI service
            payload = {
                "source_record": source_record,
                "target_record": target_record,
                "context": context or {}
            }
            
            response = requests.post(
                self.ai_service_url,
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                result = response.json()
                return result.get("resolved_record", source_record)
            else:
                logger.error(f"AI resolution failed: {response.status_code} {response.text}")
                return source_record
                
        except Exception as e:
            logger.error(f"Error in AI resolution: {str(e)}")
            return source_record


class Conflict:
    """Represents a conflict between source and target records."""
    
    def __init__(self, 
                 conflict_id: str,
                 table_name: str,
                 primary_key_values: Dict[str, Any],
                 source_record: Dict[str, Any],
                 target_record: Dict[str, Any],
                 differences: Dict[str, Tuple[Any, Any]],
                 resolution_strategy: str = None,
                 resolved_record: Dict[str, Any] = None,
                 status: str = 'pending',
                 created_at: datetime.datetime = None,
                 resolved_at: datetime.datetime = None):
        """
        Initialize a conflict.
        
        Args:
            conflict_id: Unique identifier for the conflict
            table_name: Name of the table
            primary_key_values: Dictionary mapping primary key column names to values
            source_record: Record from source database
            target_record: Record from target database
            differences: Dictionary mapping field names to tuples of (source_value, target_value)
            resolution_strategy: Name of the resolution strategy used or to be used
            resolved_record: Resolved record after applying the strategy
            status: Current status of the conflict
            created_at: Creation timestamp
            resolved_at: Resolution timestamp
        """
        self.conflict_id = conflict_id
        self.table_name = table_name
        self.primary_key_values = primary_key_values
        self.source_record = source_record
        self.target_record = target_record
        self.differences = differences
        self.resolution_strategy = resolution_strategy
        self.resolved_record = resolved_record
        self.status = status
        self.created_at = created_at or datetime.datetime.utcnow()
        self.resolved_at = resolved_at
        
    def to_dict(self) -> Dict[str, Any]:
        """Convert conflict to a dictionary representation."""
        return {
            'conflict_id': self.conflict_id,
            'table_name': self.table_name,
            'primary_key_values': self.primary_key_values,
            'source_record': self.source_record,
            'target_record': self.target_record,
            'differences': {
                field: {'source': source_val, 'target': target_val}
                for field, (source_val, target_val) in self.differences.items()
            },
            'resolution_strategy': self.resolution_strategy,
            'resolved_record': self.resolved_record,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None
        }
        
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Conflict':
        """
        Create a Conflict from a dictionary representation.
        
        Args:
            data: Dictionary representation of a conflict
            
        Returns:
            Conflict instance
        """
        differences = {
            field: (diff_data['source'], diff_data['target'])
            for field, diff_data in data['differences'].items()
        }
        
        return cls(
            conflict_id=data['conflict_id'],
            table_name=data['table_name'],
            primary_key_values=data['primary_key_values'],
            source_record=data['source_record'],
            target_record=data['target_record'],
            differences=differences,
            resolution_strategy=data['resolution_strategy'],
            resolved_record=data['resolved_record'],
            status=data['status'],
            created_at=datetime.datetime.fromisoformat(data['created_at']) if data.get('created_at') else None,
            resolved_at=datetime.datetime.fromisoformat(data['resolved_at']) if data.get('resolved_at') else None
        )


class ConflictResolver:
    """
    Detects and resolves conflicts between source and target databases.
    
    Features:
    - Multiple resolution strategies
    - Manual or automatic conflict resolution
    - Field-level conflict detection
    - AI-assisted resolution
    """
    
    def __init__(self, 
                 default_strategy: str = 'source_wins',
                 ai_service_url: str = None,
                 store_conflicts: bool = True,
                 conflict_table: str = 'sync_conflicts'):
        """
        Initialize the Conflict Resolver.
        
        Args:
            default_strategy: Default strategy to use for resolution
            ai_service_url: URL of the AI service for resolution
            store_conflicts: Whether to store conflicts in the database
            conflict_table: Name of the table to store conflicts in
        """
        self.default_strategy = default_strategy
        self.ai_service_url = ai_service_url
        self.store_conflicts = store_conflicts
        self.conflict_table = conflict_table
        
        # Initialize strategies
        self.strategies = {
            'source_wins': SourceWinsStrategy(),
            'target_wins': TargetWinsStrategy(),
            'newer_wins': NewerWinsStrategy(),
            'merge': MergeStrategy(),
            'ai': AIStrategy(ai_service_url=ai_service_url)
        }
        
        # Active conflicts
        self.conflicts = {}  # Map conflict_id to Conflict
        
    def detect_conflicts(self, 
                        source_record: Dict[str, Any], 
                        target_record: Dict[str, Any],
                        table_name: str,
                        primary_keys: List[str],
                        timestamp_field: str = 'updated_at') -> Optional[Conflict]:
        """
        Detect conflicts between source and target records.
        
        Args:
            source_record: Record from source database
            target_record: Record from target database
            table_name: Name of the table
            primary_keys: List of primary key columns
            timestamp_field: Name of the timestamp field for conflict detection
            
        Returns:
            Conflict object if conflict detected, None otherwise
        """
        if not source_record or not target_record:
            return None
            
        # Extract primary key values
        pk_values = {
            pk: source_record.get(pk)
            for pk in primary_keys
            if pk in source_record
        }
        
        # Find differences
        differences = {}
        all_fields = set(source_record.keys()).union(set(target_record.keys()))
        
        for field in all_fields:
            # Skip primary keys
            if field in primary_keys:
                continue
                
            source_value = source_record.get(field)
            target_value = target_record.get(field)
            
            # Check if values differ
            if self._values_differ(source_value, target_value, field):
                differences[field] = (source_value, target_value)
                
        if not differences:
            # No differences found
            return None
            
        # Check for timestamp-based conflict
        if timestamp_field in source_record and timestamp_field in target_record:
            source_ts = source_record[timestamp_field]
            target_ts = target_record[timestamp_field]
            
            if not isinstance(source_ts, datetime.datetime):
                source_ts = self._parse_timestamp(source_ts)
            if not isinstance(target_ts, datetime.datetime):
                target_ts = self._parse_timestamp(target_ts)
                
            if source_ts and target_ts:
                # If source is newer, this isn't actually a conflict
                if source_ts > target_ts:
                    # This is a simple update, not a conflict
                    return None
                    
        # Create conflict object
        conflict_id = f"{table_name}_{'.'.join(f'{pk}={pk_values[pk]}' for pk in sorted(pk_values.keys()))}"
        
        conflict = Conflict(
            conflict_id=conflict_id,
            table_name=table_name,
            primary_key_values=pk_values,
            source_record=source_record,
            target_record=target_record,
            differences=differences,
            status='pending'
        )
        
        # Register the conflict
        self.conflicts[conflict_id] = conflict
        
        return conflict
        
    def resolve_conflict(self, 
                        conflict: Conflict, 
                        strategy_name: str = None,
                        context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Resolve a conflict using the specified strategy.
        
        Args:
            conflict: The conflict to resolve
            strategy_name: Name of the strategy to use, or None to use default
            context: Additional context for resolution
            
        Returns:
            Resolved record
        """
        # Use default if no strategy specified
        strategy_name = strategy_name or self.default_strategy
        
        # Get the strategy
        strategy = self.strategies.get(strategy_name)
        if not strategy:
            logger.warning(f"Unknown resolution strategy '{strategy_name}', using default")
            strategy = self.strategies.get(self.default_strategy)
            
        # Prepare context
        if not context:
            context = {}
        context['table_name'] = conflict.table_name
        context['primary_keys'] = list(conflict.primary_key_values.keys())
        
        # Apply the strategy
        resolved_record = strategy.resolve(
            conflict.source_record,
            conflict.target_record,
            context
        )
        
        # Update the conflict
        conflict.resolution_strategy = strategy_name
        conflict.resolved_record = resolved_record
        conflict.status = 'resolved'
        conflict.resolved_at = datetime.datetime.utcnow()
        
        # Store the conflict if enabled
        if self.store_conflicts:
            self._store_conflict(conflict)
            
        return resolved_record
        
    def resolve_conflicts_batch(self, 
                              conflicts: List[Conflict], 
                              strategy_name: str = None,
                              context: Dict[str, Any] = None) -> Dict[str, Dict[str, Any]]:
        """
        Resolve multiple conflicts using the specified strategy.
        
        Args:
            conflicts: List of conflicts to resolve
            strategy_name: Name of the strategy to use, or None to use default
            context: Additional context for resolution
            
        Returns:
            Dictionary mapping conflict IDs to resolved records
        """
        results = {}
        
        for conflict in conflicts:
            resolved_record = self.resolve_conflict(conflict, strategy_name, context)
            results[conflict.conflict_id] = resolved_record
            
        return results
        
    def get_conflicts(self, 
                    table_name: Optional[str] = None, 
                    status: Optional[str] = None) -> List[Conflict]:
        """
        Get conflicts matching the specified criteria.
        
        Args:
            table_name: Optional table name to filter by
            status: Optional status to filter by
            
        Returns:
            List of conflicts
        """
        result = []
        
        for conflict in self.conflicts.values():
            # Apply filters
            if table_name and conflict.table_name != table_name:
                continue
            if status and conflict.status != status:
                continue
                
            result.append(conflict)
            
        return result
        
    def get_conflict(self, conflict_id: str) -> Optional[Conflict]:
        """
        Get a conflict by ID.
        
        Args:
            conflict_id: ID of the conflict to get
            
        Returns:
            Conflict if found, None otherwise
        """
        return self.conflicts.get(conflict_id)
        
    def add_strategy(self, strategy: ConflictStrategy):
        """
        Add or update a resolution strategy.
        
        Args:
            strategy: The strategy to add
        """
        self.strategies[strategy.name] = strategy
        logger.info(f"Added resolution strategy '{strategy.name}'")
        
    def create_custom_strategy(self, 
                              name: str, 
                              description: str, 
                              resolver_func: Callable[[Dict[str, Any], Dict[str, Any], Dict[str, Any]], Dict[str, Any]]):
        """
        Create and register a custom resolution strategy.
        
        Args:
            name: Unique name for the strategy
            description: Human-readable description of the strategy
            resolver_func: Function that takes (source_record, target_record, context) and returns the resolved record
        """
        strategy = CustomStrategy(name, description, resolver_func)
        self.add_strategy(strategy)
        
    def _values_differ(self, value1: Any, value2: Any, field_name: str) -> bool:
        """
        Check if two values differ, with special handling for complex types.
        
        Args:
            value1: First value
            value2: Second value
            field_name: Name of the field being compared
            
        Returns:
            True if the values differ, False otherwise
        """
        # Check for None equality
        if value1 is None and value2 is None:
            return False
            
        # If only one is None, they differ
        if value1 is None or value2 is None:
            return True
            
        # Try to get a data type handler for this field
        handler = get_handler_for_column(field_name)
        
        if handler:
            # Use handler for comparison
            return handler.values_differ(value1, value2)
            
        # Handle different types
        if type(value1) != type(value2):
            # Special case: numeric types
            if isinstance(value1, (int, float)) and isinstance(value2, (int, float)):
                return abs(float(value1) - float(value2)) > 1e-10
                
            # Special case: string and non-string
            if isinstance(value1, str) or isinstance(value2, str):
                try:
                    if isinstance(value1, str):
                        converted = type(value2)(value1)
                        return converted != value2
                    else:
                        converted = type(value1)(value2)
                        return value1 != converted
                except (ValueError, TypeError):
                    return True
                    
            # Different types
            return True
            
        # Handle same types
        if isinstance(value1, (str, int, float, bool)):
            # Simple types
            return value1 != value2
        elif isinstance(value1, (list, tuple)):
            # Lists/tuples
            if len(value1) != len(value2):
                return True
            return any(self._values_differ(v1, v2, field_name) for v1, v2 in zip(value1, value2))
        elif isinstance(value1, dict):
            # Dictionaries
            if set(value1.keys()) != set(value2.keys()):
                return True
            return any(self._values_differ(value1[k], value2[k], f"{field_name}.{k}") for k in value1)
        elif isinstance(value1, datetime.datetime):
            # Timestamps - compare with a small tolerance
            delta = abs((value1 - value2).total_seconds())
            return delta > 1
        else:
            # Fallback to direct comparison
            return value1 != value2
            
    def _parse_timestamp(self, ts_value) -> Optional[datetime.datetime]:
        """
        Parse a timestamp value to a datetime object.
        
        Args:
            ts_value: Value to parse
            
        Returns:
            Datetime object or None if parsing fails
        """
        if isinstance(ts_value, str):
            try:
                return datetime.datetime.fromisoformat(ts_value)
            except ValueError:
                return None
        return None
        
    def _store_conflict(self, conflict: Conflict):
        """
        Store a conflict in the database.
        
        Args:
            conflict: Conflict to store
        """
        # This would typically store the conflict in a database table
        # For this implementation, we just keep it in memory
        logger.info(f"Stored conflict {conflict.conflict_id} for table {conflict.table_name}")
        
    def export_conflicts(self) -> Dict[str, Any]:
        """
        Export all conflicts as a dictionary.
        
        Returns:
            Dictionary representation of all conflicts
        """
        return {
            conflict_id: conflict.to_dict()
            for conflict_id, conflict in self.conflicts.items()
        }
        
    def import_conflicts(self, conflicts_data: Dict[str, Dict[str, Any]]):
        """
        Import conflicts from a dictionary.
        
        Args:
            conflicts_data: Dictionary mapping conflict IDs to conflict data
        """
        for conflict_id, conflict_data in conflicts_data.items():
            conflict = Conflict.from_dict(conflict_data)
            self.conflicts[conflict_id] = conflict