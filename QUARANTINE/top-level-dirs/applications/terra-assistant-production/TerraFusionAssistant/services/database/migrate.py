#!/usr/bin/env python
"""
Database Migration CLI Tool

This script provides a command-line interface for managing database schema migrations
for the TerraFusion platform.
"""

import os
import sys
import argparse
import logging
import json
from typing import List, Dict, Any, Optional
from migration_manager import MigrationManager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('migrate')

def create_parser() -> argparse.ArgumentParser:
    """Create and configure the argument parser."""
    parser = argparse.ArgumentParser(
        description='TerraFusion Database Migration Tool'
    )
    
    subparsers = parser.add_subparsers(dest='command', help='Command to execute')
    
    # Status command
    status_parser = subparsers.add_parser('status', help='Show migration status')
    status_parser.add_argument('--json', action='store_true', help='Output in JSON format')
    
    # Create command
    create_parser = subparsers.add_parser('create', help='Create a new migration')
    create_parser.add_argument('message', help='Migration message')
    create_parser.add_argument('--no-autogenerate', action='store_true', 
                            help='Do not autogenerate migration from models')
    
    # Upgrade command
    upgrade_parser = subparsers.add_parser('upgrade', help='Upgrade database schema')
    upgrade_parser.add_argument('--revision', default='head', 
                            help='Target revision (default: head)')
    
    # Downgrade command
    downgrade_parser = subparsers.add_parser('downgrade', help='Downgrade database schema')
    downgrade_parser.add_argument('revision', help='Target revision or number of revisions (e.g., -1)')
    
    # Check command
    check_parser = subparsers.add_parser('check', help='Check database structure')
    check_parser.add_argument('--json', action='store_true', help='Output in JSON format')
    
    return parser

def format_status(status: Dict[str, Any], json_output: bool = False) -> str:
    """Format migration status for display."""
    if json_output:
        return json.dumps(status, indent=2)
    
    output = []
    output.append("=== Migration Status ===")
    output.append(f"Current Revision: {status['current_revision'] or 'None (database not initialized)'}")
    output.append(f"Latest Available Revision: {status['head_revision'] or 'None (no migrations available)'}")
    output.append(f"Status: {'Up to date' if status['up_to_date'] else 'Updates available'}")
    output.append(f"Total Migrations: {status['total_migrations']}")
    output.append(f"Applied Migrations: {status['migrations_applied']}")
    output.append(f"Pending Migrations: {status['migrations_pending']}")
    
    if status['applied_migrations']:
        output.append("\nApplied Migrations:")
        for m in status['applied_migrations']:
            output.append(f"  {m['revision']} - {m['created']} - {m['description']}")
    
    if status['pending_migrations']:
        output.append("\nPending Migrations:")
        for m in status['pending_migrations']:
            output.append(f"  {m['revision']} - {m['created']} - {m['description']}")
    
    return '\n'.join(output)

def format_check_result(result: Dict[str, Any], json_output: bool = False) -> str:
    """Format database check result for display."""
    if json_output:
        return json.dumps(result, indent=2)
    
    output = []
    output.append("=== Database Structure ===")
    output.append(f"Tables: {result['table_count']}")
    
    # Add migration status
    status = result['migration_status']
    output.append("\n=== Migration Status ===")
    output.append(f"Current Revision: {status['current_revision'] or 'None (database not initialized)'}")
    output.append(f"Latest Available Revision: {status['head_revision'] or 'None (no migrations available)'}")
    output.append(f"Status: {'Up to date' if status['up_to_date'] else 'Updates available'}")
    
    # Table details
    if result['tables']:
        output.append("\nTables:")
        for table in result['tables']:
            output.append(f"\n  {table['name']} ({table['column_count']} columns)")
            
            output.append("    Columns:")
            for col in table['columns']:
                pk_marker = " (PK)" if col['primary_key'] else ""
                nullable = "" if col['nullable'] else " NOT NULL"
                default = f" DEFAULT {col['default']}" if col['default'] else ""
                output.append(f"      {col['name']} - {col['type']}{nullable}{default}{pk_marker}")
            
            if table['indexes']:
                output.append("    Indexes:")
                for idx in table['indexes']:
                    unique = " (UNIQUE)" if idx['unique'] else ""
                    output.append(f"      {idx['name']} on ({', '.join(idx['columns'])}){unique}")
            
            if table['foreign_keys']:
                output.append("    Foreign Keys:")
                for fk in table['foreign_keys']:
                    output.append(f"      {fk['name']}: ({', '.join(fk['columns'])}) -> "
                                f"{fk['referred_table']}({', '.join(fk['referred_columns'])})")
    
    return '\n'.join(output)

def main(args: Optional[List[str]] = None) -> int:
    """Main entry point for the migration tool."""
    parser = create_parser()
    parsed_args = parser.parse_args(args)
    
    if not parsed_args.command:
        parser.print_help()
        return 1
    
    try:
        manager = MigrationManager()
        
        if parsed_args.command == 'status':
            status = manager.get_migration_status()
            print(format_status(status, parsed_args.json))
        
        elif parsed_args.command == 'create':
            script_path = manager.create_migration(
                parsed_args.message,
                not parsed_args.no_autogenerate
            )
            print(f"Created migration script: {script_path}")
        
        elif parsed_args.command == 'upgrade':
            success, message = manager.upgrade(parsed_args.revision)
            print(message)
            if not success:
                return 1
        
        elif parsed_args.command == 'downgrade':
            success, message = manager.downgrade(parsed_args.revision)
            print(message)
            if not success:
                return 1
        
        elif parsed_args.command == 'check':
            result = manager.check_database()
            print(format_check_result(result, parsed_args.json))
        
        return 0
    
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return 1

if __name__ == '__main__':
    sys.exit(main())