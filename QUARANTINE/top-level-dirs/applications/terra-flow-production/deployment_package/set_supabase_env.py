"""
Supabase Environment Setup

This module helps to set up the Supabase environment variables for
different environments (development, training, production).
"""

import os
import sys
import logging
import argparse
from typing import Dict, Any, Optional, List, Tuple, Union

try:
    import dotenv
    DOTENV_AVAILABLE = True
except ImportError:
    DOTENV_AVAILABLE = False

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Constants
ENV_FILE = ".env"
VALID_ENVIRONMENTS = ["development", "training", "production"]

def load_environment_variables() -> bool:
    """
    Load environment variables from .env file if available.
    
    Returns:
        True if successful, False otherwise
    """
    if DOTENV_AVAILABLE:
        try:
            dotenv.load_dotenv(ENV_FILE)
            logger.debug(f"Loaded environment variables from {ENV_FILE}")
            return True
        except Exception as e:
            logger.warning(f"Failed to load environment variables from {ENV_FILE}: {str(e)}")
            return False
    else:
        logger.warning("dotenv package not installed, cannot load from .env file")
        return False

def get_current_environment() -> str:
    """
    Get the current active Supabase environment.
    
    Returns:
        Environment name (development, training, production)
    """
    env = os.environ.get("SUPABASE_ACTIVE_ENVIRONMENT")
    if env and env in VALID_ENVIRONMENTS:
        return env
    return "development"  # Default to development

def check_environment_configuration(environment: str) -> Tuple[bool, Dict[str, Any]]:
    """
    Check if a Supabase environment is configured.
    
    Args:
        environment: Environment name (development, training, production)
        
    Returns:
        Tuple of (is_configured, config)
    """
    # Load environment variables
    load_environment_variables()
    
    # Check environment-specific variables
    env_url_var = f"SUPABASE_URL_{environment.upper()}"
    env_key_var = f"SUPABASE_KEY_{environment.upper()}"
    env_service_key_var = f"SUPABASE_SERVICE_KEY_{environment.upper()}"
    
    env_url = os.environ.get(env_url_var)
    env_key = os.environ.get(env_key_var)
    env_service_key = os.environ.get(env_service_key_var)
    
    # For development, also check base variables
    base_url = os.environ.get("SUPABASE_URL")
    base_key = os.environ.get("SUPABASE_KEY")
    base_service_key = os.environ.get("SUPABASE_SERVICE_KEY")
    
    # Use environment-specific variables if available, otherwise use base variables for development
    url = env_url or (base_url if environment == "development" else None)
    key = env_key or (base_key if environment == "development" else None)
    service_key = env_service_key or (base_service_key if environment == "development" else None)
    
    # Check if configured
    is_configured = bool(url and key)
    
    # Build configuration
    config = {
        "environment": environment,
        "url": url,
        "key": key,
        "service_key": service_key,
        "url_var": env_url_var,
        "key_var": env_key_var,
        "service_key_var": env_service_key_var,
        "key_available": bool(key),
        "service_key_available": bool(service_key),
        "configured": is_configured
    }
    
    return is_configured, config

def set_environment_variables(environment: str, 
                             url: Optional[str] = None, 
                             key: Optional[str] = None, 
                             service_key: Optional[str] = None, 
                             save_to_file: bool = True) -> bool:
    """
    Set Supabase environment variables for a specific environment.
    
    Args:
        environment: Environment name (development, training, production)
        url: Supabase URL
        key: Supabase API key
        service_key: Supabase service key
        save_to_file: Whether to save to .env file
        
    Returns:
        True if successful, False otherwise
    """
    # Ensure valid environment
    if environment not in VALID_ENVIRONMENTS:
        logger.warning(f"Invalid environment: {environment}")
        return False
    
    # Get current variables
    is_configured, current_config = check_environment_configuration(environment)
    
    # Only update specified variables
    if url is None:
        url = current_config.get("url")
    
    if key is None:
        key = current_config.get("key")
    
    if service_key is None:
        service_key = current_config.get("service_key")
    
    # Set environment-specific variables
    env_url_var = f"SUPABASE_URL_{environment.upper()}"
    env_key_var = f"SUPABASE_KEY_{environment.upper()}"
    env_service_key_var = f"SUPABASE_SERVICE_KEY_{environment.upper()}"
    
    env_vars = {}
    
    if url:
        os.environ[env_url_var] = url
        env_vars[env_url_var] = url
    
    if key:
        os.environ[env_key_var] = key
        env_vars[env_key_var] = key
    
    if service_key:
        os.environ[env_service_key_var] = service_key
        env_vars[env_service_key_var] = service_key
    
    # Set active environment
    os.environ["SUPABASE_ACTIVE_ENVIRONMENT"] = environment
    env_vars["SUPABASE_ACTIVE_ENVIRONMENT"] = environment
    
    # Set base variables to match active environment
    if url:
        os.environ["SUPABASE_URL"] = url
        env_vars["SUPABASE_URL"] = url
    
    if key:
        os.environ["SUPABASE_KEY"] = key
        env_vars["SUPABASE_KEY"] = key
    
    if service_key:
        os.environ["SUPABASE_SERVICE_KEY"] = service_key
        env_vars["SUPABASE_SERVICE_KEY"] = service_key
    
    # Save to file if requested
    if save_to_file and DOTENV_AVAILABLE:
        try:
            # Load existing environment file
            dotenv.load_dotenv(ENV_FILE)
            
            # Update variables
            for key, value in env_vars.items():
                dotenv.set_key(ENV_FILE, key, value)
            
            logger.info(f"Saved environment variables to {ENV_FILE}")
        except Exception as e:
            logger.error(f"Error saving environment variables to {ENV_FILE}: {str(e)}")
            return False
    
    logger.info(f"Set Supabase environment to {environment}")
    
    return True

def create_environment_if_needed(environment: str, 
                                url: Optional[str] = None, 
                                key: Optional[str] = None, 
                                service_key: Optional[str] = None) -> bool:
    """
    Create a Supabase environment if it doesn't exist.
    
    Args:
        environment: Environment name (development, training, production)
        url: Supabase URL
        key: Supabase API key
        service_key: Supabase service key
        
    Returns:
        True if successful, False otherwise
    """
    # Check if environment is already configured
    is_configured, config = check_environment_configuration(environment)
    
    if is_configured:
        logger.info(f"Environment {environment} is already configured")
        return True
    
    # Set environment variables
    return set_environment_variables(environment, url, key, service_key)

def ensure_supabase_env(environment: Optional[str] = None, required_vars: Optional[List[str]] = None) -> bool:
    """
    Ensure that Supabase environment variables are set.
    This function is used by other modules to ensure that the Supabase
    environment is properly set up before using it.
    
    Args:
        environment: Environment name (development, training, production)
        required_vars: List of required variable names
        
    Returns:
        True if successful, False otherwise
    """
    # Use current environment if none specified
    if environment is None:
        environment = get_current_environment()
    
    # Default required variables
    if required_vars is None:
        required_vars = ["SUPABASE_URL", "SUPABASE_KEY"]
    
    # Check if environment is configured
    is_configured, config = check_environment_configuration(environment)
    
    if not is_configured:
        logger.error(f"Supabase environment {environment} is not configured")
        return False
    
    # Set environment variables
    set_environment_variables(environment)
    
    # Check if required variables are set
    for var in required_vars:
        if var not in os.environ or not os.environ[var]:
            logger.error(f"Missing required environment variable: {var}")
            return False
    
    return True

def main():
    """Command-line interface for setting Supabase environment variables."""
    parser = argparse.ArgumentParser(description="Set Supabase environment variables")
    parser.add_argument("environment", choices=VALID_ENVIRONMENTS, help="Environment to set")
    parser.add_argument("--url", help="Supabase URL")
    parser.add_argument("--key", help="Supabase API key")
    parser.add_argument("--service-key", help="Supabase service key")
    parser.add_argument("--no-save", action="store_true", help="Don't save to .env file")
    parser.add_argument("--create-if-needed", action="store_true", help="Create environment if it doesn't exist")
    parser.add_argument("--show", action="store_true", help="Show environment variables")
    parser.add_argument("--verbose", "-v", action="store_true", help="Verbose output")
    
    args = parser.parse_args()
    
    # Set log level based on verbose flag
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Load environment variables
    load_environment_variables()
    
    # Show environment variables if requested
    if args.show:
        is_configured, config = check_environment_configuration(args.environment)
        print(f"Environment: {args.environment}")
        print(f"Configured: {is_configured}")
        
        if is_configured:
            print(f"URL: {config['url']}")
            print(f"Key Available: {config['key_available']}")
            print(f"Service Key Available: {config['service_key_available']}")
        
        sys.exit(0)
    
    # Check if environment is already configured
    is_configured, config = check_environment_configuration(args.environment)
    
    if is_configured and not (args.url or args.key or args.service_key):
        # Just set as active
        if set_environment_variables(args.environment):
            print(f"Set {args.environment} as active Supabase environment")
            sys.exit(0)
        else:
            print(f"Failed to set {args.environment} as active Supabase environment")
            sys.exit(1)
    
    # Create environment if needed
    if args.create_if_needed and not is_configured:
        if not args.url or not args.key:
            print("URL and API key are required to create a new environment")
            sys.exit(1)
        
        if create_environment_if_needed(args.environment, args.url, args.key, args.service_key):
            print(f"Created {args.environment} Supabase environment")
            sys.exit(0)
        else:
            print(f"Failed to create {args.environment} Supabase environment")
            sys.exit(1)
    
    # Set environment variables
    if set_environment_variables(args.environment, args.url, args.key, args.service_key, not args.no_save):
        print(f"Set {args.environment} as active Supabase environment")
        
        # Show environment variables
        if args.verbose:
            is_configured, config = check_environment_configuration(args.environment)
            print(f"URL: {config['url']}")
            print(f"Key Available: {config['key_available']}")
            print(f"Service Key Available: {config['service_key_available']}")
        
        sys.exit(0)
    else:
        print(f"Failed to set {args.environment} as active Supabase environment")
        sys.exit(1)

if __name__ == "__main__":
    main()