"""
Migration Manager Module

This module provides an interface for managing database schema migrations for the TerraFusion platform.
It wraps Alembic to provide a programmatic interface for migrations.
"""

import os
import sys
import logging
import subprocess
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
import alembic.config
from alembic.script import ScriptDirectory
from alembic.runtime.migration import MigrationContext
from sqlalchemy import create_engine, inspect

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MigrationManager:
    """
    Manager for database schema migrations.
    
    This class provides methods for:
    - Checking migration status
    - Generating new migrations
    - Applying migrations
    - Rolling back migrations
    - Showing migration history
    """
    
    def __init__(self, migrations_dir: str = None, db_url: str = None):
        """
        Initialize the migration manager.
        
        Args:
            migrations_dir: Directory containing Alembic migrations
            db_url: Database URL for connecting to the database
        """
        # Set migrations directory
        if migrations_dir is None:
            # Default to the migrations directory in this package
            current_dir = os.path.dirname(os.path.abspath(__file__))
            migrations_dir = os.path.join(current_dir, 'migrations')
        
        self.migrations_dir = migrations_dir
        
        # Set database URL
        if db_url is None:
            # Get from environment
            db_url = os.environ.get('DATABASE_URL')
            
            if not db_url:
                raise EnvironmentError("DATABASE_URL environment variable is not set")
        
        self.db_url = db_url
        
        # Initialize Alembic configuration
        self.alembic_cfg = alembic.config.Config(os.path.join(migrations_dir, 'alembic.ini'))
        self.alembic_cfg.set_main_option('script_location', migrations_dir)
        self.alembic_cfg.set_main_option('sqlalchemy.url', self.db_url)
        
        # Create engine for database operations
        self.engine = create_engine(self.db_url)
        
        logger.info(f"Initialized migration manager with migrations directory: {migrations_dir}")
    
    def get_current_revision(self) -> Optional[str]:
        """
        Get the current migration revision in the database.
        
        Returns:
            Current revision ID or None if no migrations have been applied
        """
        with self.engine.connect() as conn:
            context = MigrationContext.configure(conn)
            return context.get_current_revision()
    
    def get_script_directory(self) -> ScriptDirectory:
        """
        Get the Alembic script directory.
        
        Returns:
            Alembic ScriptDirectory instance
        """
        return ScriptDirectory.from_config(self.alembic_cfg)
    
    def get_migration_status(self) -> Dict[str, Any]:
        """
        Get the status of database migrations.
        
        Returns:
            Dict containing migration status information
        """
        # Get current revision
        current_revision = self.get_current_revision()
        
        # Get script directory
        script_directory = self.get_script_directory()
        
        # Get latest available revision
        if script_directory.get_revisions():
            head_revision = script_directory.get_current_head()
        else:
            head_revision = None
        
        # Check if database is up to date
        up_to_date = current_revision == head_revision
        
        # Get pending migrations
        pending_migrations = []
        
        if current_revision != head_revision:
            revs = list(script_directory.iterate_revisions(current_revision, head_revision))
            pending_migrations = [
                {
                    'revision': rev.revision,
                    'description': rev.doc,
                    'created': rev.date_created.strftime("%Y-%m-%d %H:%M:%S")
                }
                for rev in revs if rev.revision != current_revision
            ]
        
        # Get applied migrations
        applied_migrations = []
        
        if current_revision:
            revs = list(script_directory.iterate_revisions('base', current_revision))
            applied_migrations = [
                {
                    'revision': rev.revision,
                    'description': rev.doc,
                    'created': rev.date_created.strftime("%Y-%m-%d %H:%M:%S")
                }
                for rev in revs
            ]
        
        return {
            'current_revision': current_revision,
            'head_revision': head_revision,
            'up_to_date': up_to_date,
            'pending_migrations': pending_migrations,
            'applied_migrations': applied_migrations,
            'total_migrations': len(applied_migrations) + len(pending_migrations),
            'migrations_applied': len(applied_migrations),
            'migrations_pending': len(pending_migrations)
        }
    
    def create_migration(self, message: str, autogenerate: bool = True) -> str:
        """
        Create a new migration.
        
        Args:
            message: Migration message
            autogenerate: Whether to autogenerate migration based on models
            
        Returns:
            Path to the created migration script
        """
        logger.info(f"Creating new migration: {message}")
        
        # Build command arguments
        args = [
            '--message', message
        ]
        
        if autogenerate:
            args.append('--autogenerate')
        
        # Run alembic revision command
        try:
            from alembic import command
            command.revision(self.alembic_cfg, *args)
            
            # Get the created revision file
            script_directory = self.get_script_directory()
            revision = script_directory.get_current_head()
            
            if revision:
                script = script_directory.get_revision(revision)
                return os.path.abspath(script.path)
            else:
                raise RuntimeError("Failed to determine the created migration script")
        
        except Exception as e:
            logger.error(f"Error creating migration: {e}")
            raise
    
    def upgrade(self, target: str = 'head') -> Tuple[bool, str]:
        """
        Upgrade the database to a specific revision.
        
        Args:
            target: Target revision (default: 'head' for latest)
            
        Returns:
            Tuple: (success, message)
        """
        logger.info(f"Upgrading database to revision: {target}")
        
        try:
            from alembic import command
            command.upgrade(self.alembic_cfg, target)
            
            current_rev = self.get_current_revision()
            return True, f"Successfully upgraded database to revision {current_rev}"
        
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Error upgrading database: {error_msg}")
            return False, f"Error upgrading database: {error_msg}"
    
    def downgrade(self, target: str) -> Tuple[bool, str]:
        """
        Downgrade the database to a specific revision.
        
        Args:
            target: Target revision or '-1' for previous revision
            
        Returns:
            Tuple: (success, message)
        """
        logger.info(f"Downgrading database to revision: {target}")
        
        try:
            from alembic import command
            command.downgrade(self.alembic_cfg, target)
            
            current_rev = self.get_current_revision()
            rev_msg = f"{current_rev}" if current_rev else "base (no revisions)"
            return True, f"Successfully downgraded database to revision {rev_msg}"
        
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Error downgrading database: {error_msg}")
            return False, f"Error downgrading database: {error_msg}"
    
    def check_database(self) -> Dict[str, Any]:
        """
        Check the database structure.
        
        Returns:
            Dict with database structure information
        """
        inspector = inspect(self.engine)
        
        result = {
            'tables': [],
            'table_count': 0,
            'migration_status': self.get_migration_status()
        }
        
        # Get table information
        for table_name in inspector.get_table_names():
            # Get columns
            columns = [
                {
                    'name': col['name'],
                    'type': str(col['type']),
                    'nullable': col['nullable'],
                    'default': col['default'],
                    'primary_key': col['primary_key']
                }
                for col in inspector.get_columns(table_name)
            ]
            
            # Get indexes
            indexes = [
                {
                    'name': idx['name'],
                    'columns': idx['column_names'],
                    'unique': idx['unique']
                }
                for idx in inspector.get_indexes(table_name)
            ]
            
            # Get foreign keys
            foreign_keys = [
                {
                    'name': fk['name'],
                    'columns': fk['constrained_columns'],
                    'referred_table': fk['referred_table'],
                    'referred_columns': fk['referred_columns']
                }
                for fk in inspector.get_foreign_keys(table_name)
            ]
            
            # Add table info
            result['tables'].append({
                'name': table_name,
                'columns': columns,
                'indexes': indexes,
                'foreign_keys': foreign_keys,
                'column_count': len(columns)
            })
        
        result['table_count'] = len(result['tables'])
        
        return result