#!/usr/bin/env python
"""
Switch Environment Script for GeoAssessmentPro

This script switches the application to a different environment
(development, training, production).
"""

import os
import sys
import logging
import argparse
import configparser
import dotenv
from typing import Dict, Any, Optional

# Configure logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Constants
VALID_ENVIRONMENTS = ["development", "training", "production"]
ENV_FILE = ".env"

def load_env_file() -> Dict[str, str]:
    """
    Load environment variables from .env file
    
    Returns:
        Dictionary of environment variables
    """
    # Load environment variables from .env file
    dotenv.load_dotenv(ENV_FILE)
    
    # Get all environment variables as a dictionary
    env_vars = {}
    if os.path.exists(ENV_FILE):
        with open(ENV_FILE, "r") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                try:
                    key, value = line.split("=", 1)
                    env_vars[key] = value
                except ValueError:
                    # Skip lines that don't have a key-value pair
                    pass
    
    return env_vars

def save_env_file(env_vars: Dict[str, str]) -> bool:
    """
    Save environment variables to .env file
    
    Args:
        env_vars: Dictionary of environment variables
        
    Returns:
        True if successful, False otherwise
    """
    try:
        with open(ENV_FILE, "w") as f:
            for key, value in env_vars.items():
                f.write(f"{key}={value}\n")
        logger.info(f"Updated environment variables in {ENV_FILE}")
        return True
    except Exception as e:
        logger.error(f"Failed to update environment variables in {ENV_FILE}: {str(e)}")
        return False

def switch_to_environment(environment: str) -> bool:
    """
    Switch to the specified environment
    
    Args:
        environment: The environment to switch to (development, training, production)
        
    Returns:
        True if successful, False otherwise
    """
    if environment not in VALID_ENVIRONMENTS:
        logger.error(f"Invalid environment: {environment}")
        logger.error(f"Valid environments are: {', '.join(VALID_ENVIRONMENTS)}")
        return False
    
    # Load environment variables from .env file
    env_vars = load_env_file()
    
    # Update ENV_MODE
    env_vars["ENV_MODE"] = environment
    
    # Update database URL if environment-specific URL exists
    if environment != "development":
        # Check if there's an environment-specific URL
        db_url_key = f"DATABASE_URL_{environment.upper()}"
        if db_url_key in env_vars:
            db_url = env_vars[db_url_key]
            logger.info(f"Using {environment}-specific database URL: {db_url}")
            env_vars["DATABASE_URL"] = db_url
        else:
            logger.warning(f"No {environment}-specific database URL found in {ENV_FILE}")
    
    # Update Supabase URL if environment-specific URL exists
    if environment != "development":
        # Check if there's an environment-specific URL
        supabase_url_key = f"SUPABASE_URL_{environment.upper()}"
        if supabase_url_key in env_vars:
            supabase_url = env_vars[supabase_url_key]
            logger.info(f"Using {environment}-specific Supabase URL: {supabase_url}")
            env_vars["SUPABASE_URL"] = supabase_url
        else:
            logger.warning(f"No {environment}-specific Supabase URL found in {ENV_FILE}")
    
    # Update Supabase key if environment-specific key exists
    if environment != "development":
        # Check if there's an environment-specific key
        supabase_key_key = f"SUPABASE_KEY_{environment.upper()}"
        if supabase_key_key in env_vars:
            supabase_key = env_vars[supabase_key_key]
            logger.info(f"Using {environment}-specific Supabase key")
            env_vars["SUPABASE_KEY"] = supabase_key
        else:
            logger.warning(f"No {environment}-specific Supabase key found in {ENV_FILE}")
    
    # Update Supabase service key if environment-specific key exists
    if environment != "development":
        # Check if there's an environment-specific key
        supabase_service_key_key = f"SUPABASE_SERVICE_KEY_{environment.upper()}"
        if supabase_service_key_key in env_vars:
            supabase_service_key = env_vars[supabase_service_key_key]
            logger.info(f"Using {environment}-specific Supabase service key")
            env_vars["SUPABASE_SERVICE_KEY"] = supabase_service_key
        else:
            logger.warning(f"No {environment}-specific Supabase service key found in {ENV_FILE}")
    
    # Save updated environment variables to .env file
    if not save_env_file(env_vars):
        return False
    
    # Check if the Supabase client is available and attempt to refresh the connection
    try:
        import set_supabase_env
        result = set_supabase_env.set_supabase_environment(environment)
        if result:
            logger.info(f"Set Supabase environment to {environment}")
        else:
            logger.warning(f"Failed to set Supabase environment to {environment}")
    except ImportError as e:
        logger.warning(f"Could not import set_supabase_env module: {str(e)}")
        # This is not a critical error, so we continue
    
    logger.info(f"Successfully switched to {environment} environment")
    return True

def main():
    """Main function"""
    parser = argparse.ArgumentParser(description="Switch to a different environment")
    parser.add_argument("environment", choices=VALID_ENVIRONMENTS,
                      help="The environment to switch to")
    
    args = parser.parse_args()
    
    result = switch_to_environment(args.environment)
    
    return 0 if result else 1

if __name__ == "__main__":
    sys.exit(main())