#!/usr/bin/env python
"""
Initialize Environment Script for GeoAssessmentPro

This script sets up a new environment (development, training, production)
by copying the template environment variables and running the necessary
database migrations.
"""

import os
import sys
import logging
import argparse
import shutil
import subprocess
from typing import Dict, Any, List, Optional

# Configure logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Constants
VALID_ENVIRONMENTS = ["development", "training", "production"]
ENV_TEMPLATE = ".env.template"
ENV_FILE = ".env"

def copy_template_env():
    """
    Copy the template environment file to .env if it doesn't exist
    """
    if not os.path.exists(ENV_TEMPLATE):
        logger.error(f"Template environment file {ENV_TEMPLATE} not found")
        return False
    
    if not os.path.exists(ENV_FILE):
        logger.info(f"Creating {ENV_FILE} from template")
        shutil.copyfile(ENV_TEMPLATE, ENV_FILE)
        return True
    else:
        logger.info(f"{ENV_FILE} already exists, not overwriting")
        return True

def update_env_variable(variable: str, value: str):
    """
    Update a specific environment variable in the .env file
    
    Args:
        variable: The environment variable name
        value: The value to set
    """
    if not os.path.exists(ENV_FILE):
        logger.error(f"Environment file {ENV_FILE} not found")
        return False
    
    # Read the existing file
    with open(ENV_FILE, "r") as f:
        lines = f.readlines()
    
    # Find the variable and update it, or add it if it doesn't exist
    variable_found = False
    for i, line in enumerate(lines):
        if line.strip().startswith(f"{variable}="):
            lines[i] = f"{variable}={value}\n"
            variable_found = True
            break
    
    if not variable_found:
        lines.append(f"{variable}={value}\n")
    
    # Write the updated file
    with open(ENV_FILE, "w") as f:
        f.writelines(lines)
    
    logger.info(f"Updated {variable} in {ENV_FILE}")
    return True

def run_command(command: List[str], check: bool = True) -> bool:
    """
    Run a command and log the output
    
    Args:
        command: The command to run
        check: Whether to check for non-zero exit code
        
    Returns:
        True if the command succeeded, False otherwise
    """
    logger.info(f"Running command: {' '.join(command)}")
    try:
        result = subprocess.run(command, check=check, capture_output=True, text=True)
        logger.info(result.stdout)
        if result.stderr:
            logger.warning(result.stderr)
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"Command failed with exit code {e.returncode}")
        logger.error(f"STDOUT: {e.stdout}")
        logger.error(f"STDERR: {e.stderr}")
        return False

def run_database_migrations() -> bool:
    """
    Run database migrations
    
    Returns:
        True if the migrations succeeded, False otherwise
    """
    # Run the migrate_database.py script
    logger.info("Running database migrations")
    if not run_command(["python", "migrate_database.py"]):
        return False
    
    # Run the migrate_data_quality.py script if it exists
    if os.path.exists("migrate_data_quality.py"):
        logger.info("Running data quality migrations")
        if not run_command(["python", "migrate_data_quality.py"]):
            return False
    
    # Run the migrate_report_schema.py script if it exists
    if os.path.exists("migrate_report_schema.py"):
        logger.info("Running report schema migrations")
        if not run_command(["python", "migrate_report_schema.py"]):
            return False
    
    logger.info("All database migrations completed successfully")
    return True

def initialize_environment(environment: str, database_url: Optional[str] = None, 
                           supabase_url: Optional[str] = None, 
                           supabase_key: Optional[str] = None,
                           supabase_service_key: Optional[str] = None,
                           skip_migrations: bool = False) -> bool:
    """
    Initialize a new environment
    
    Args:
        environment: The environment to initialize (development, training, production)
        database_url: The database URL to use (optional)
        supabase_url: The Supabase URL to use (optional)
        supabase_key: The Supabase key to use (optional)
        supabase_service_key: The Supabase service key to use (optional)
        skip_migrations: Whether to skip running database migrations
        
    Returns:
        True if initialization succeeded, False otherwise
    """
    if environment not in VALID_ENVIRONMENTS:
        logger.error(f"Invalid environment: {environment}")
        logger.error(f"Valid environments are: {', '.join(VALID_ENVIRONMENTS)}")
        return False
    
    logger.info(f"Initializing {environment} environment")
    
    # Copy the template environment file if it doesn't exist
    if not copy_template_env():
        return False
    
    # Update the environment mode
    if not update_env_variable("ENV_MODE", environment):
        return False
    
    # Update the database URL if provided
    if database_url:
        if environment == "development":
            if not update_env_variable("DATABASE_URL", database_url):
                return False
        else:
            if not update_env_variable(f"DATABASE_URL_{environment.upper()}", database_url):
                return False
    
    # Update the Supabase URLs if provided
    if supabase_url:
        if environment == "development":
            if not update_env_variable("SUPABASE_URL", supabase_url):
                return False
        else:
            if not update_env_variable(f"SUPABASE_URL_{environment.upper()}", supabase_url):
                return False
    
    # Update the Supabase keys if provided
    if supabase_key:
        if environment == "development":
            if not update_env_variable("SUPABASE_KEY", supabase_key):
                return False
        else:
            if not update_env_variable(f"SUPABASE_KEY_{environment.upper()}", supabase_key):
                return False
    
    # Update the Supabase service keys if provided
    if supabase_service_key:
        if environment == "development":
            if not update_env_variable("SUPABASE_SERVICE_KEY", supabase_service_key):
                return False
        else:
            if not update_env_variable(f"SUPABASE_SERVICE_KEY_{environment.upper()}", supabase_service_key):
                return False
    
    # Reload the environment variables
    if os.path.exists("switch_environment.py"):
        if not run_command(["python", "switch_environment.py", environment]):
            return False
    
    # Run database migrations if not skipped
    if not skip_migrations:
        if not run_database_migrations():
            return False
    
    logger.info(f"Successfully initialized {environment} environment")
    return True

def main():
    """Main function"""
    parser = argparse.ArgumentParser(description="Initialize a new environment")
    parser.add_argument("environment", choices=VALID_ENVIRONMENTS,
                      help="The environment to initialize")
    parser.add_argument("--database-url", 
                      help="The database URL to use")
    parser.add_argument("--supabase-url", 
                      help="The Supabase URL to use")
    parser.add_argument("--supabase-key", 
                      help="The Supabase key to use")
    parser.add_argument("--supabase-service-key", 
                      help="The Supabase service key to use")
    parser.add_argument("--skip-migrations", action="store_true",
                      help="Skip running database migrations")
    
    args = parser.parse_args()
    
    result = initialize_environment(
        args.environment,
        database_url=args.database_url,
        supabase_url=args.supabase_url,
        supabase_key=args.supabase_key,
        supabase_service_key=args.supabase_service_key,
        skip_migrations=args.skip_migrations
    )
    
    return 0 if result else 1

if __name__ == "__main__":
    sys.exit(main())