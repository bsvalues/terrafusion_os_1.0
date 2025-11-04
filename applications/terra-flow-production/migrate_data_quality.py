#!/usr/bin/env python3
"""
Generate migration for data quality tables
"""
import os
import sys
import subprocess
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def create_migration():
    """Create a migration for data quality tables"""
    logger.info("Creating migration for data quality tables...")
    
    # Create the migration file
    migration_message = "Add data quality alert tables"
    
    try:
        # Use Flask-Migrate to generate a migration
        result = subprocess.run(
            ["flask", "db", "migrate", "-m", migration_message],
            capture_output=True,
            text=True,
            check=True
        )
        logger.info(f"Migration created:\n{result.stdout}")
        
        # Apply the migration
        logger.info("Applying migration...")
        result = subprocess.run(
            ["flask", "db", "upgrade"],
            capture_output=True,
            text=True,
            check=True
        )
        logger.info(f"Migration applied:\n{result.stdout}")
        
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"Error running migration command: {e}")
        logger.error(f"Command output: {e.stdout}")
        logger.error(f"Command error: {e.stderr}")
        return False
    except Exception as e:
        logger.error(f"Error creating migration: {e}")
        return False

if __name__ == "__main__":
    if create_migration():
        logger.info("Migration completed successfully")
        sys.exit(0)
    else:
        logger.error("Migration failed")
        sys.exit(1)