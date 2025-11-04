#!/usr/bin/env python3
"""
Supabase Environment Setup Wizard

This script helps configure Supabase environment connections for the GeoAssessmentPro application.
It allows setting up development, training, and production environments with separate credentials.
"""

import os
import sys
import logging
import argparse
from typing import Dict, Any, Optional

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("supabase_setup")

def setup_environment(environment: str, config_file: Optional[str] = None) -> bool:
    """
    Set up a specific Supabase environment
    
    Args:
        environment: Environment name (development, training, production)
        config_file: Optional path to config file to update
        
    Returns:
        True if setup was successful, False otherwise
    """
    logger.info(f"Setting up Supabase {environment} environment...")
    
    # Get environment-specific URL
    url = input(f"Enter Supabase URL for {environment} environment: ").strip()
    if not url:
        logger.warning(f"Supabase URL is required for {environment} environment.")
        return False
    
    # Get environment-specific API key
    key = input(f"Enter Supabase API key for {environment} environment: ").strip()
    if not key:
        logger.warning(f"Supabase API key is required for {environment} environment.")
        return False
    
    # Get environment-specific service role key (optional)
    service_key = input(f"Enter Supabase service role key for {environment} environment (optional): ").strip()
    
    # Store in environment variables (temporarily)
    os.environ[f"SUPABASE_URL_{environment.upper()}"] = url
    os.environ[f"SUPABASE_KEY_{environment.upper()}"] = key
    if service_key:
        os.environ[f"SUPABASE_SERVICE_KEY_{environment.upper()}"] = service_key
    
    # If this is the default environment, also set the base variables
    if environment == "development":
        os.environ["SUPABASE_URL"] = url
        os.environ["SUPABASE_KEY"] = key
        if service_key:
            os.environ["SUPABASE_SERVICE_KEY"] = service_key
    
    # Save to .env file if requested
    if input("Save these credentials to .env file? (y/n): ").lower().startswith('y'):
        try:
            update_env_file(environment, url, key, service_key)
            logger.info(f"Credentials for {environment} environment saved to .env file.")
        except Exception as e:
            logger.error(f"Error saving credentials: {str(e)}")
            return False
    
    # Update config file if requested and provided
    if config_file and input(f"Update {config_file} with {environment} environment? (y/n): ").lower().startswith('y'):
        try:
            update_config_file(config_file, environment, url, key, service_key)
            logger.info(f"Config file {config_file} updated for {environment} environment.")
        except Exception as e:
            logger.error(f"Error updating config file: {str(e)}")
            return False
    
    logger.info(f"Supabase {environment} environment setup complete!")
    return True

def update_env_file(environment: str, url: str, key: str, service_key: Optional[str] = None) -> None:
    """
    Update .env file with environment-specific credentials
    
    Args:
        environment: Environment name
        url: Supabase URL
        key: Supabase API key
        service_key: Optional Supabase service role key
    """
    env_path = ".env"
    env_vars = {}
    
    # Read existing .env file
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    name, value = line.split('=', 1)
                    env_vars[name.strip()] = value.strip()
    
    # Update with new values
    env_vars[f"SUPABASE_URL_{environment.upper()}"] = url
    env_vars[f"SUPABASE_KEY_{environment.upper()}"] = key
    if service_key:
        env_vars[f"SUPABASE_SERVICE_KEY_{environment.upper()}"] = service_key
    
    # If this is the default environment, also set the base variables
    if environment == "development":
        env_vars["SUPABASE_URL"] = url
        env_vars["SUPABASE_KEY"] = key
        if service_key:
            env_vars["SUPABASE_SERVICE_KEY"] = service_key
    
    # Write back to .env file
    with open(env_path, 'w') as f:
        for name, value in env_vars.items():
            f.write(f"{name}={value}\n")

def update_config_file(config_path: str, environment: str, url: str, key: str, service_key: Optional[str] = None) -> None:
    """
    Update a config file with environment-specific credentials
    
    Args:
        config_path: Path to config file
        environment: Environment name
        url: Supabase URL
        key: Supabase API key
        service_key: Optional Supabase service role key
    """
    # This is a placeholder. In a real implementation, you would parse and update
    # the config file based on its format (JSON, YAML, INI, etc.)
    logger.warning("Config file updating not implemented yet.")
    return

def test_connection(environment: str) -> bool:
    """
    Test the connection to a Supabase environment
    
    Args:
        environment: Environment name to test
        
    Returns:
        True if connection was successful, False otherwise
    """
    try:
        # Import here to avoid circular imports
        from supabase_env_manager import get_current_environment, get_environment_variables, set_environment_variables
        from supabase_client import get_supabase_client
        
        # Set the environment context
        set_environment_variables(environment)
        
        # Get the credentials
        env_vars = get_environment_variables(environment)
        url = env_vars.get('url')
        key = env_vars.get('key')
        
        if not url or not key:
            logger.error(f"Missing URL or API key for {environment} environment.")
            return False
        
        # Try to get a client
        client = get_supabase_client(environment)
        if not client:
            logger.error(f"Failed to create Supabase client for {environment} environment.")
            return False
        
        # Try a simple operation
        result = client.table('system_info').select('value').limit(1).execute()
        
        logger.info(f"Successfully connected to Supabase {environment} environment!")
        return True
    
    except Exception as e:
        logger.error(f"Error testing connection to {environment} environment: {str(e)}")
        return False

def setup_all_environments(config_file: Optional[str] = None) -> None:
    """
    Set up all Supabase environments
    
    Args:
        config_file: Optional path to config file to update
    """
    logger.info("Supabase Environment Setup Wizard")
    logger.info("================================")
    
    # Set up development environment
    if input("\nSet up development environment? (y/n): ").lower().startswith('y'):
        setup_environment("development", config_file)
        if input("Test development environment connection? (y/n): ").lower().startswith('y'):
            test_connection("development")
    
    # Set up training environment
    if input("\nSet up training environment? (y/n): ").lower().startswith('y'):
        setup_environment("training", config_file)
        if input("Test training environment connection? (y/n): ").lower().startswith('y'):
            test_connection("training")
    
    # Set up production environment
    if input("\nSet up production environment? (y/n): ").lower().startswith('y'):
        setup_environment("production", config_file)
        if input("Test production environment connection? (y/n): ").lower().startswith('y'):
            test_connection("production")
    
    logger.info("\nSupabase environment setup complete!")

def main() -> None:
    """
    Main entry point for the script
    """
    parser = argparse.ArgumentParser(description="Supabase Environment Setup Wizard")
    parser.add_argument("-c", "--config", help="Path to config file to update")
    parser.add_argument("-e", "--environment", choices=["development", "training", "production"], 
                        help="Specific environment to set up (default: all environments)")
    parser.add_argument("-t", "--test", action="store_true", 
                        help="Test the connection after setup")
    
    args = parser.parse_args()
    
    if args.environment:
        setup_success = setup_environment(args.environment, args.config)
        if setup_success and args.test:
            test_connection(args.environment)
    else:
        setup_all_environments(args.config)

if __name__ == "__main__":
    main()