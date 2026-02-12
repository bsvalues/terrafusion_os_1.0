#!/usr/bin/env python3
"""
Command-line tool for Levy Calculation System database operations.

This script provides direct access to database operations without requiring
the full Flask application to be initialized. It's designed for quick
operations from the command line.

Usage:
    python cli_tool.py backup       # Create a database backup
    python cli_tool.py verify       # Verify database connectivity
    python cli_tool.py info         # Display database information
"""

import os
import sys
import argparse
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def backup_database():
    """Create a backup of the PostgreSQL database."""
    logger.info("Creating database backup...")
    
    try:
        # Import backup function from pg_backup_simple.py
        from pg_backup_simple import backup_database as simple_backup
        success, filepath = simple_backup()
        
        if success:
            logger.info(f"Database backup created successfully: {filepath}")
            return 0
        else:
            logger.error("Database backup failed. See logs for details.")
            return 1
    except Exception as e:
        logger.error(f"Error creating backup: {str(e)}")
        return 1

def verify_database():
    """Verify the database connection."""
    logger.info("Verifying database connection...")
    
    try:
        # Import from pg_verify.py
        from pg_verify import check_postgres_connection
        success = check_postgres_connection()
        
        if success:
            logger.info("Database connection verified successfully.")
            return 0
        else:
            logger.error("Database connection verification failed.")
            return 1
    except Exception as e:
        logger.error(f"Error verifying database: {str(e)}")
        return 1

def database_info():
    """Display information about the database."""
    logger.info("Retrieving database information...")
    
    try:
        import psycopg2
        from urllib.parse import urlparse
        
        # Get database connection parameters
        db_url = os.environ.get('DATABASE_URL')
        if not db_url:
            logger.error("DATABASE_URL environment variable not set")
            return 1
        
        # Parse database URL
        parsed = urlparse(db_url)
        params = {
            'host': parsed.hostname,
            'port': parsed.port or 5432,
            'user': parsed.username,
            'password': parsed.password,
            'database': parsed.path.lstrip('/')
        }
        
        # Connect to the database
        conn = psycopg2.connect(
            host=params['host'],
            port=params['port'],
            user=params['user'],
            password=params['password'],
            database=params['database']
        )
        
        # Get PostgreSQL version
        with conn.cursor() as cursor:
            cursor.execute("SELECT version();")
            version = cursor.fetchone()[0]
            logger.info(f"PostgreSQL version: {version}")
            
            # Get list of tables
            cursor.execute("""
                SELECT tablename 
                FROM pg_tables 
                WHERE schemaname = 'public'
                ORDER BY tablename
            """)
            tables = cursor.fetchall()
            
            if tables:
                logger.info(f"Found {len(tables)} tables in database:")
                for table in tables:
                    # Get row count for table
                    cursor.execute(f"SELECT COUNT(*) FROM {table[0]}")
                    count = cursor.fetchone()[0]
                    logger.info(f"  - {table[0]}: {count} rows")
            else:
                logger.warning("No tables found in database.")
        
        conn.close()
        return 0
    except Exception as e:
        logger.error(f"Error retrieving database info: {str(e)}")
        return 1

def main():
    """Main function for CLI tool."""
    parser = argparse.ArgumentParser(
        description="Command-line tool for Levy Calculation System database operations",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )
    
    subparsers = parser.add_subparsers(dest='command', help='Command to execute')
    
    # Backup command
    backup_parser = subparsers.add_parser('backup', help='Create a database backup')
    
    # Verify command
    verify_parser = subparsers.add_parser('verify', help='Verify database connectivity')
    
    # Info command
    info_parser = subparsers.add_parser('info', help='Display database information')
    
    args = parser.parse_args()
    
    if args.command == 'backup':
        return backup_database()
    elif args.command == 'verify':
        return verify_database()
    elif args.command == 'info':
        return database_info()
    else:
        parser.print_help()
        return 0

if __name__ == '__main__':
    sys.exit(main())