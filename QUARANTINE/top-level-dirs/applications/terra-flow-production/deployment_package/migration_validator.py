#!/usr/bin/env python
"""
Database Migration Validator for GeoAssessmentPro

This module provides validation and safety checks for database migrations,
including schema validation, data validation, and rollback capabilities.
"""

import os
import sys
import json
import logging
import datetime
import tempfile
import shutil
from typing import Dict, List, Any, Tuple, Optional, Union, Set
from sqlalchemy import text, MetaData, Table, inspect, create_engine
from sqlalchemy.engine import Engine, Connection
from alembic.migration import MigrationContext

# Configure logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class MigrationValidator:
    """Validator for database migrations"""
    
    def __init__(self, engine: Optional[Engine] = None, 
                connection_string: Optional[str] = None,
                snapshot_dir: str = "migration_snapshots"):
        """
        Initialize migration validator
        
        Args:
            engine: SQLAlchemy engine
            connection_string: Database connection string
            snapshot_dir: Directory for migration snapshots
        """
        if engine:
            self.engine = engine
        elif connection_string:
            self.engine = create_engine(connection_string)
        else:
            raise ValueError("Either engine or connection_string must be provided")
        
        self.snapshot_dir = snapshot_dir
        self.metadata = MetaData()
        
        # Create snapshot directory if it doesn't exist
        os.makedirs(self.snapshot_dir, exist_ok=True)
    
    def _get_schema_info(self, connection: Connection) -> Dict[str, Any]:
        """
        Get database schema information
        
        Args:
            connection: Database connection
            
        Returns:
            Dict with schema information
        """
        inspector = inspect(connection)
        schema_info = {
            "tables": {},
            "indexes": {},
            "foreign_keys": {},
            "timestamp": datetime.datetime.utcnow().isoformat()
        }
        
        # Get table information
        for table_name in inspector.get_table_names():
            table_info = {
                "columns": [],
                "primary_key": inspector.get_pk_constraint(table_name),
                "indexes": inspector.get_indexes(table_name),
                "foreign_keys": inspector.get_foreign_keys(table_name),
                "unique_constraints": inspector.get_unique_constraints(table_name),
                "column_comment": {}
            }
            
            # Get column information
            for column in inspector.get_columns(table_name):
                column_info = {
                    "name": column["name"],
                    "type": str(column["type"]),
                    "nullable": column.get("nullable", True),
                    "default": str(column.get("default", "")),
                    "autoincrement": column.get("autoincrement", False),
                    "comment": column.get("comment", "")
                }
                table_info["columns"].append(column_info)
                
                # Store column comment separately for easy comparison
                if column.get("comment"):
                    table_info["column_comment"][column["name"]] = column["comment"]
            
            schema_info["tables"][table_name] = table_info
        
        # Get view information
        for view_name in inspector.get_view_names():
            view_info = {
                "definition": inspector.get_view_definition(view_name),
                "columns": []
            }
            
            # Get column information for view
            for column in inspector.get_columns(view_name, view=True):
                column_info = {
                    "name": column["name"],
                    "type": str(column["type"]),
                    "nullable": column.get("nullable", True),
                    "comment": column.get("comment", "")
                }
                view_info["columns"].append(column_info)
            
            schema_info["views"][view_name] = view_info
        
        return schema_info
    
    def _get_table_row_counts(self, connection: Connection) -> Dict[str, int]:
        """
        Get row counts for all tables
        
        Args:
            connection: Database connection
            
        Returns:
            Dict with table names and row counts
        """
        inspector = inspect(connection)
        row_counts = {}
        
        for table_name in inspector.get_table_names():
            try:
                result = connection.execute(text(f"SELECT COUNT(*) FROM {table_name}"))
                row_counts[table_name] = result.scalar()
            except Exception as e:
                logger.warning(f"Error getting row count for table {table_name}: {str(e)}")
                row_counts[table_name] = -1
        
        return row_counts
    
    def _get_database_size(self, connection: Connection) -> Dict[str, Any]:
        """
        Get database size information
        
        Args:
            connection: Database connection
            
        Returns:
            Dict with database size information
        """
        size_info = {
            "tables": {},
            "total_size": 0,
            "total_index_size": 0
        }
        
        try:
            # This query works for PostgreSQL
            result = connection.execute(text("""
                SELECT 
                    relname as table_name,
                    pg_size_pretty(pg_total_relation_size(relid)) as total_size,
                    pg_size_pretty(pg_relation_size(relid)) as table_size,
                    pg_size_pretty(pg_total_relation_size(relid) - pg_relation_size(relid)) as index_size,
                    pg_total_relation_size(relid) as size_bytes,
                    (pg_total_relation_size(relid) - pg_relation_size(relid)) as index_bytes
                FROM pg_catalog.pg_statio_user_tables
                ORDER BY pg_total_relation_size(relid) DESC
            """))
            
            for row in result:
                size_info["tables"][row.table_name] = {
                    "total_size": row.total_size,
                    "table_size": row.table_size,
                    "index_size": row.index_size,
                    "size_bytes": row.size_bytes,
                    "index_bytes": row.index_bytes
                }
                size_info["total_size"] += row.size_bytes
                size_info["total_index_size"] += row.index_bytes
            
            # Add human-readable total sizes
            size_info["total_size_pretty"] = self._bytes_to_human(size_info["total_size"])
            size_info["total_index_size_pretty"] = self._bytes_to_human(size_info["total_index_size"])
        except Exception as e:
            logger.warning(f"Error getting database size information: {str(e)}")
            # For other databases, just provide row counts
            inspector = inspect(connection)
            for table_name in inspector.get_table_names():
                size_info["tables"][table_name] = {
                    "total_size": "unknown",
                    "table_size": "unknown",
                    "index_size": "unknown",
                    "size_bytes": 0,
                    "index_bytes": 0
                }
        
        return size_info
    
    def _bytes_to_human(self, size_bytes: int) -> str:
        """
        Convert bytes to human-readable format
        
        Args:
            size_bytes: Size in bytes
            
        Returns:
            Human-readable size string
        """
        if size_bytes == 0:
            return "0 B"
        
        units = ["B", "KB", "MB", "GB", "TB", "PB"]
        i = 0
        while size_bytes >= 1024 and i < len(units) - 1:
            size_bytes /= 1024
            i += 1
        
        return f"{size_bytes:.2f} {units[i]}"
    
    def _get_migration_version(self, connection: Connection) -> str:
        """
        Get current migration version
        
        Args:
            connection: Database connection
            
        Returns:
            Current migration version
        """
        # Check if alembic_version table exists
        inspector = inspect(connection)
        if "alembic_version" in inspector.get_table_names():
            result = connection.execute(text("SELECT version_num FROM alembic_version"))
            version = result.scalar()
            return version
        else:
            return "unknown"
    
    def create_snapshot(self, snapshot_name: Optional[str] = None, include_data: bool = False) -> str:
        """
        Create a database snapshot
        
        Args:
            snapshot_name: Name for the snapshot
            include_data: Whether to include row counts and table sizes
            
        Returns:
            Path to the snapshot file
        """
        if not snapshot_name:
            timestamp = datetime.datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            snapshot_name = f"snapshot_{timestamp}"
        
        snapshot_path = os.path.join(self.snapshot_dir, f"{snapshot_name}.json")
        
        with self.engine.connect() as connection:
            # Get schema information
            schema_info = self._get_schema_info(connection)
            
            # Get migration version
            migration_version = self._get_migration_version(connection)
            
            snapshot = {
                "name": snapshot_name,
                "timestamp": datetime.datetime.utcnow().isoformat(),
                "migration_version": migration_version,
                "schema_info": schema_info
            }
            
            # Include data information if requested
            if include_data:
                # Get row counts
                row_counts = self._get_table_row_counts(connection)
                snapshot["row_counts"] = row_counts
                
                # Get database size information
                size_info = self._get_database_size(connection)
                snapshot["size_info"] = size_info
            
            # Save snapshot to file
            with open(snapshot_path, "w") as f:
                json.dump(snapshot, f, indent=2)
            
            logger.info(f"Created database snapshot: {snapshot_path}")
        
        return snapshot_path
    
    def load_snapshot(self, snapshot_name: str) -> Dict[str, Any]:
        """
        Load a database snapshot
        
        Args:
            snapshot_name: Name of the snapshot
            
        Returns:
            Dict with snapshot data
        """
        # If snapshot_name doesn't end with .json, add it
        if not snapshot_name.endswith(".json"):
            snapshot_name = f"{snapshot_name}.json"
        
        snapshot_path = os.path.join(self.snapshot_dir, snapshot_name)
        
        if not os.path.exists(snapshot_path):
            logger.error(f"Snapshot {snapshot_path} not found")
            return {}
        
        try:
            with open(snapshot_path, "r") as f:
                snapshot = json.load(f)
            
            logger.info(f"Loaded database snapshot: {snapshot_path}")
            return snapshot
        except Exception as e:
            logger.error(f"Error loading snapshot {snapshot_path}: {str(e)}")
            return {}
    
    def list_snapshots(self) -> List[Dict[str, Any]]:
        """
        List all available snapshots
        
        Returns:
            List of dicts with snapshot information
        """
        snapshots = []
        
        for filename in os.listdir(self.snapshot_dir):
            if filename.endswith(".json"):
                snapshot_path = os.path.join(self.snapshot_dir, filename)
                try:
                    with open(snapshot_path, "r") as f:
                        snapshot = json.load(f)
                    
                    snapshots.append({
                        "name": snapshot.get("name", filename[:-5]),
                        "path": snapshot_path,
                        "timestamp": snapshot.get("timestamp"),
                        "migration_version": snapshot.get("migration_version", "unknown")
                    })
                except Exception as e:
                    logger.warning(f"Error loading snapshot {snapshot_path}: {str(e)}")
        
        # Sort by timestamp
        snapshots.sort(key=lambda s: s.get("timestamp", ""), reverse=True)
        
        return snapshots
    
    def compare_snapshots(self, snapshot1_name: str, snapshot2_name: str) -> Dict[str, Any]:
        """
        Compare two database snapshots
        
        Args:
            snapshot1_name: Name of the first snapshot
            snapshot2_name: Name of the second snapshot
            
        Returns:
            Dict with comparison results
        """
        snapshot1 = self.load_snapshot(snapshot1_name)
        snapshot2 = self.load_snapshot(snapshot2_name)
        
        if not snapshot1 or not snapshot2:
            return {"error": "Failed to load one or both snapshots"}
        
        comparison = {
            "snapshot1": snapshot1.get("name"),
            "snapshot2": snapshot2.get("name"),
            "timestamp1": snapshot1.get("timestamp"),
            "timestamp2": snapshot2.get("timestamp"),
            "migration_version1": snapshot1.get("migration_version"),
            "migration_version2": snapshot2.get("migration_version"),
            "changes": {
                "tables": {
                    "added": [],
                    "removed": [],
                    "modified": {}
                },
                "columns": {
                    "added": {},
                    "removed": {},
                    "modified": {}
                },
                "indexes": {
                    "added": {},
                    "removed": {},
                    "modified": {}
                },
                "foreign_keys": {
                    "added": {},
                    "removed": {},
                    "modified": {}
                }
            }
        }
        
        # Get schema info from snapshots
        schema1 = snapshot1.get("schema_info", {}).get("tables", {})
        schema2 = snapshot2.get("schema_info", {}).get("tables", {})
        
        # Compare tables
        tables1 = set(schema1.keys())
        tables2 = set(schema2.keys())
        
        # Find added and removed tables
        added_tables = tables2 - tables1
        removed_tables = tables1 - tables2
        
        comparison["changes"]["tables"]["added"] = list(added_tables)
        comparison["changes"]["tables"]["removed"] = list(removed_tables)
        
        # Compare common tables
        common_tables = tables1.intersection(tables2)
        for table_name in common_tables:
            table1 = schema1[table_name]
            table2 = schema2[table_name]
            
            # Check for column changes
            columns1 = {col["name"]: col for col in table1.get("columns", [])}
            columns2 = {col["name"]: col for col in table2.get("columns", [])}
            
            col_names1 = set(columns1.keys())
            col_names2 = set(columns2.keys())
            
            # Find added and removed columns
            added_columns = col_names2 - col_names1
            removed_columns = col_names1 - col_names2
            
            if added_columns:
                comparison["changes"]["columns"]["added"][table_name] = list(added_columns)
            
            if removed_columns:
                comparison["changes"]["columns"]["removed"][table_name] = list(removed_columns)
            
            # Compare common columns
            common_columns = col_names1.intersection(col_names2)
            modified_columns = {}
            
            for col_name in common_columns:
                col1 = columns1[col_name]
                col2 = columns2[col_name]
                
                # Check for changes in column properties
                changes = {}
                
                for prop in ["type", "nullable", "default", "comment"]:
                    if col1.get(prop) != col2.get(prop):
                        changes[prop] = {
                            "from": col1.get(prop),
                            "to": col2.get(prop)
                        }
                
                if changes:
                    modified_columns[col_name] = changes
            
            if modified_columns:
                comparison["changes"]["columns"]["modified"][table_name] = modified_columns
            
            # If the table has any column changes, consider it modified
            if (table_name in comparison["changes"]["columns"]["added"] or
                table_name in comparison["changes"]["columns"]["removed"] or
                table_name in comparison["changes"]["columns"]["modified"]):
                comparison["changes"]["tables"]["modified"][table_name] = {
                    "columns_added": comparison["changes"]["columns"]["added"].get(table_name, []),
                    "columns_removed": comparison["changes"]["columns"]["removed"].get(table_name, []),
                    "columns_modified": comparison["changes"]["columns"]["modified"].get(table_name, {})
                }
        
        # Include row count changes if available
        if "row_counts" in snapshot1 and "row_counts" in snapshot2:
            row_counts1 = snapshot1.get("row_counts", {})
            row_counts2 = snapshot2.get("row_counts", {})
            
            comparison["data_changes"] = {
                "row_counts": {}
            }
            
            # Compare row counts for common tables
            for table_name in common_tables:
                count1 = row_counts1.get(table_name, 0)
                count2 = row_counts2.get(table_name, 0)
                
                if count1 != count2:
                    comparison["data_changes"]["row_counts"][table_name] = {
                        "from": count1,
                        "to": count2,
                        "diff": count2 - count1
                    }
        
        return comparison
    
    def validate_migration(self, migration_name: str, 
                         snapshot_before: Optional[str] = None,
                         snapshot_after: Optional[str] = None,
                         validate_data: bool = True) -> Dict[str, Any]:
        """
        Validate a database migration
        
        Args:
            migration_name: Name or ID of the migration
            snapshot_before: Name of pre-migration snapshot
            snapshot_after: Name of post-migration snapshot
            validate_data: Whether to validate data changes
            
        Returns:
            Dict with validation results
        """
        # Create snapshot before migration if not provided
        if not snapshot_before:
            snapshot_before = f"pre_{migration_name}_{datetime.datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
            self.create_snapshot(snapshot_before, include_data=validate_data)
        
        # Run the migration
        # This is just a placeholder - you would integrate with your migration system
        logger.info(f"Migration {migration_name} would run here")
        
        # Create snapshot after migration if not provided
        if not snapshot_after:
            snapshot_after = f"post_{migration_name}_{datetime.datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
            self.create_snapshot(snapshot_after, include_data=validate_data)
        
        # Compare snapshots
        comparison = self.compare_snapshots(snapshot_before, snapshot_after)
        
        # Add validation results
        validation = {
            "migration": migration_name,
            "comparison": comparison,
            "warnings": [],
            "errors": [],
            "is_valid": True
        }
        
        # Check for potentially dangerous changes
        schema_changes = comparison.get("changes", {})
        
        # Check for table removals
        if schema_changes.get("tables", {}).get("removed"):
            validation["warnings"].append(f"Migration removes tables: {schema_changes['tables']['removed']}")
        
        # Check for column removals
        if schema_changes.get("columns", {}).get("removed"):
            for table, columns in schema_changes["columns"]["removed"].items():
                validation["warnings"].append(f"Migration removes columns from table {table}: {columns}")
        
        # Check for type changes that could lose data
        if schema_changes.get("columns", {}).get("modified"):
            for table, columns in schema_changes["columns"]["modified"].items():
                for column, changes in columns.items():
                    if "type" in changes:
                        validation["warnings"].append(
                            f"Migration changes type of column {table}.{column} "
                            f"from {changes['type']['from']} to {changes['type']['to']}"
                        )
        
        # Check for nullable changes
        if schema_changes.get("columns", {}).get("modified"):
            for table, columns in schema_changes["columns"]["modified"].items():
                for column, changes in columns.items():
                    if "nullable" in changes and changes["nullable"]["from"] and not changes["nullable"]["to"]:
                        validation["warnings"].append(
                            f"Migration changes column {table}.{column} from nullable to non-nullable"
                        )
        
        # Check for data changes if validate_data is True
        if validate_data and "data_changes" in comparison:
            data_changes = comparison.get("data_changes", {})
            row_counts = data_changes.get("row_counts", {})
            
            # Check for significant data loss
            for table, change in row_counts.items():
                if change["diff"] < 0 and abs(change["diff"]) > 100:
                    validation["warnings"].append(
                        f"Migration may cause significant data loss in table {table}: "
                        f"{abs(change['diff'])} rows removed"
                    )
        
        # Set is_valid to False if there are errors
        if validation["errors"]:
            validation["is_valid"] = False
        
        return validation
    
    def dry_run_migration(self, migration_file: str) -> Dict[str, Any]:
        """
        Perform a dry run of a migration
        
        Args:
            migration_file: Path to migration file
            
        Returns:
            Dict with dry run results
        """
        # This would need to be implemented based on your migration system
        # For alembic, you could use alembic.command.upgrade with sql=True
        
        dry_run = {
            "migration_file": migration_file,
            "sql_statements": [],
            "tables_affected": [],
            "estimated_impact": "unknown",
            "warnings": []
        }
        
        # For now, just return a placeholder
        logger.info(f"Dry run of migration {migration_file} would happen here")
        
        return dry_run
    
    def backup_before_migration(self, migration_name: str) -> str:
        """
        Create a backup before running a migration
        
        Args:
            migration_name: Name or ID of the migration
            
        Returns:
            Path to the backup file
        """
        timestamp = datetime.datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        backup_name = f"backup_{migration_name}_{timestamp}"
        backup_dir = os.path.join(self.snapshot_dir, "backups")
        os.makedirs(backup_dir, exist_ok=True)
        
        # Create a snapshot first
        snapshot_path = self.create_snapshot(f"pre_{migration_name}_{timestamp}", include_data=True)
        
        # For PostgreSQL, you could use pg_dump
        # For other databases, use appropriate tools
        # For now, just return the snapshot path
        logger.info(f"Backup before migration {migration_name} would happen here")
        
        return snapshot_path
    
    def rollback_migration(self, migration_name: str, backup_path: Optional[str] = None) -> bool:
        """
        Rollback a migration
        
        Args:
            migration_name: Name or ID of the migration
            backup_path: Path to the backup file
            
        Returns:
            True if successful, False otherwise
        """
        # This would need to be implemented based on your migration system
        # For alembic, you could use alembic.command.downgrade
        
        # If a backup path is provided, restore from it
        if backup_path:
            logger.info(f"Restoring from backup {backup_path} would happen here")
        
        logger.info(f"Rollback of migration {migration_name} would happen here")
        
        return True
    
    def generate_migration_report(self, migration_name: str, 
                                validation_result: Dict[str, Any]) -> str:
        """
        Generate a report for a migration
        
        Args:
            migration_name: Name or ID of the migration
            validation_result: Validation result dict
            
        Returns:
            Path to the report file
        """
        timestamp = datetime.datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        report_name = f"migration_report_{migration_name}_{timestamp}.json"
        report_dir = os.path.join(self.snapshot_dir, "reports")
        os.makedirs(report_dir, exist_ok=True)
        
        report_path = os.path.join(report_dir, report_name)
        
        # Add timestamp to report
        report = {
            "migration_name": migration_name,
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "validation_result": validation_result
        }
        
        # Save report to file
        with open(report_path, "w") as f:
            json.dump(report, f, indent=2)
        
        logger.info(f"Generated migration report: {report_path}")
        
        return report_path

def initialize_validator(connection_string: Optional[str] = None) -> MigrationValidator:
    """
    Initialize migration validator
    
    Args:
        connection_string: Database connection string
        
    Returns:
        MigrationValidator instance
    """
    # If connection_string is not provided, try to get from environment
    if not connection_string:
        # Try to import from the app
        try:
            from app import db
            return MigrationValidator(engine=db.engine)
        except ImportError:
            # Try to get from environment
            connection_string = os.environ.get("DATABASE_URL")
            
            if not connection_string:
                raise ValueError("Database connection string not provided and not found in environment")
    
    return MigrationValidator(connection_string=connection_string)

def create_initial_snapshot() -> str:
    """
    Create an initial database snapshot
    
    Returns:
        Path to the snapshot file
    """
    validator = initialize_validator()
    return validator.create_snapshot("initial", include_data=True)

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="GeoAssessmentPro Migration Validator")
    subparsers = parser.add_subparsers(dest="command", help="Command to run")
    
    # Snapshot command
    snapshot_parser = subparsers.add_parser("snapshot", help="Create a database snapshot")
    snapshot_parser.add_argument("--name", help="Name for the snapshot")
    snapshot_parser.add_argument("--include-data", action="store_true", 
                              help="Include row counts and table sizes")
    
    # List snapshots command
    list_parser = subparsers.add_parser("list", help="List available snapshots")
    
    # Compare snapshots command
    compare_parser = subparsers.add_parser("compare", help="Compare two snapshots")
    compare_parser.add_argument("snapshot1", help="Name of the first snapshot")
    compare_parser.add_argument("snapshot2", help="Name of the second snapshot")
    
    # Validate migration command
    validate_parser = subparsers.add_parser("validate", help="Validate a migration")
    validate_parser.add_argument("migration", help="Name or ID of the migration")
    validate_parser.add_argument("--snapshot-before", help="Name of pre-migration snapshot")
    validate_parser.add_argument("--snapshot-after", help="Name of post-migration snapshot")
    validate_parser.add_argument("--validate-data", action="store_true", 
                              help="Validate data changes")
    
    # Dry run command
    dry_run_parser = subparsers.add_parser("dry-run", help="Perform a dry run of a migration")
    dry_run_parser.add_argument("migration_file", help="Path to migration file")
    
    # Backup command
    backup_parser = subparsers.add_parser("backup", help="Create a backup before migration")
    backup_parser.add_argument("migration", help="Name or ID of the migration")
    
    # Parse arguments
    args = parser.parse_args()
    
    # Initialize validator
    validator = initialize_validator()
    
    # Run command
    if args.command == "snapshot":
        path = validator.create_snapshot(args.name, args.include_data)
        print(f"Created snapshot: {path}")
    elif args.command == "list":
        snapshots = validator.list_snapshots()
        print(f"Found {len(snapshots)} snapshots:")
        for snapshot in snapshots:
            print(f"  - {snapshot['name']}: {snapshot['timestamp']} "
                 f"(version: {snapshot['migration_version']})")
    elif args.command == "compare":
        comparison = validator.compare_snapshots(args.snapshot1, args.snapshot2)
        print(json.dumps(comparison, indent=2))
    elif args.command == "validate":
        validation = validator.validate_migration(
            args.migration, 
            args.snapshot_before, 
            args.snapshot_after, 
            args.validate_data
        )
        print(json.dumps(validation, indent=2))
    elif args.command == "dry-run":
        dry_run = validator.dry_run_migration(args.migration_file)
        print(json.dumps(dry_run, indent=2))
    elif args.command == "backup":
        path = validator.backup_before_migration(args.migration)
        print(f"Created backup: {path}")
    else:
        # If no command provided, show help
        parser.print_help()