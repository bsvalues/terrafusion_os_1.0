"""
Supabase Environment Manager

This module manages the Supabase environment variables for different environments
(development, training, production) and provides functions for getting and setting them.
"""

import os
import logging
import json
from typing import Dict, Any, Optional, List, Tuple

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

def save_environment_to_file(env_vars: Dict[str, str]) -> bool:
    """
    Save environment variables to .env file.
    
    Args:
        env_vars: Dictionary of environment variables
        
    Returns:
        True if successful, False otherwise
    """
    if not DOTENV_AVAILABLE:
        logger.warning("dotenv package not installed, cannot save to .env file")
        return False
    
    try:
        # Load existing environment file
        if os.path.exists(ENV_FILE):
            dotenv.load_dotenv(ENV_FILE)
        
        # Update variables
        for key, value in env_vars.items():
            dotenv.set_key(ENV_FILE, key, value)
        
        return True
    except Exception as e:
        logger.error(f"Error saving environment variables to {ENV_FILE}: {str(e)}")
        return False

def get_environment_variables(environment: Optional[str] = None) -> Dict[str, Any]:
    """
    Get Supabase environment variables for a specific environment.
    
    Args:
        environment: Environment name (development, training, production)
        
    Returns:
        Dictionary with environment variables
    """
    # Load environment variables
    load_environment_variables()
    
    # Use current environment if none specified
    if not environment:
        environment = get_current_environment()
    
    # Ensure valid environment
    if environment not in VALID_ENVIRONMENTS:
        logger.warning(f"Invalid environment: {environment}, using development")
        environment = "development"
    
    # Get environment-specific variables
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
    
    # Use environment-specific variables if available, otherwise use base variables
    url = env_url or (base_url if environment == "development" else None)
    key = env_key or (base_key if environment == "development" else None)
    service_key = env_service_key or (base_service_key if environment == "development" else None)
    
    # Check if configured
    configured = bool(url and key)
    
    return {
        "environment": environment,
        "url": url,
        "key": key,
        "service_key": service_key,
        "url_var": env_url_var,
        "key_var": env_key_var,
        "service_key_var": env_service_key_var,
        "key_available": bool(key),
        "service_key_available": bool(service_key),
        "configured": configured
    }

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
    current_vars = get_environment_variables(environment)
    
    # Only update specified variables
    if url is None:
        url = current_vars.get("url")
    
    if key is None:
        key = current_vars.get("key")
    
    if service_key is None:
        service_key = current_vars.get("service_key")
    
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
    if save_to_file:
        save_environment_to_file(env_vars)
    
    logger.info(f"Set Supabase environment to {environment}")
    
    return True

def is_configured(environment: Optional[str] = None) -> bool:
    """
    Check if the Supabase environment is configured.
    
    Args:
        environment: Environment name (development, training, production)
        
    Returns:
        True if configured, False otherwise
    """
    env_vars = get_environment_variables(environment)
    return env_vars.get("configured", False)

def list_environments() -> Dict[str, Dict[str, Any]]:
    """
    List all Supabase environments and their configuration status.
    
    Returns:
        Dictionary of environments and their configuration
    """
    environments = {}
    
    for env in VALID_ENVIRONMENTS:
        env_vars = get_environment_variables(env)
        environments[env] = {
            "configured": env_vars["configured"],
            "url": env_vars["url"],
            "key_available": env_vars["key_available"],
            "service_key_available": env_vars["service_key_available"]
        }
    
    return environments

def create_sample_environment(environment: str = "development") -> Dict[str, Any]:
    """
    Create a sample environment configuration for testing.
    
    Args:
        environment: Environment name (development, training, production)
        
    Returns:
        Dictionary with environment variables
    """
    # Ensure valid environment
    if environment not in VALID_ENVIRONMENTS:
        logger.warning(f"Invalid environment: {environment}, using development")
        environment = "development"
    
    # Set sample values
    url = f"https://{environment}-sample.supabase.co"
    key = f"{environment}_sample_key"
    service_key = f"{environment}_sample_service_key"
    
    # Set environment variables
    set_environment_variables(environment, url, key, service_key)
    
    # Return variables
    return get_environment_variables(environment)

def main():
    """Command-line interface for Supabase environment manager."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Manage Supabase environments")
    parser.add_argument("--list", action="store_true", help="List all environments")
    parser.add_argument("--current", action="store_true", help="Show current environment")
    parser.add_argument("--set", choices=VALID_ENVIRONMENTS, help="Set active environment")
    parser.add_argument("--url", help="Set URL for active environment")
    parser.add_argument("--key", help="Set API key for active environment")
    parser.add_argument("--service-key", help="Set service key for active environment")
    parser.add_argument("--sample", choices=VALID_ENVIRONMENTS, help="Create sample environment")
    
    args = parser.parse_args()
    
    if args.list:
        environments = list_environments()
        print("Supabase Environments:")
        for env, config in environments.items():
            print(f"  {env}:")
            print(f"    Configured: {config['configured']}")
            print(f"    URL: {config['url']}")
            print(f"    API Key Available: {config['key_available']}")
            print(f"    Service Key Available: {config['service_key_available']}")
    elif args.current:
        env = get_current_environment()
        env_vars = get_environment_variables(env)
        print(f"Current Environment: {env}")
        print(f"  Configured: {env_vars['configured']}")
        print(f"  URL: {env_vars['url']}")
        print(f"  API Key Available: {env_vars['key_available']}")
        print(f"  Service Key Available: {env_vars['service_key_available']}")
    elif args.set:
        env_vars = get_environment_variables(args.set)
        if env_vars["configured"]:
            set_environment_variables(args.set)
            print(f"Active environment set to {args.set}")
        else:
            print(f"Cannot set {args.set} as active environment (not configured)")
    elif args.sample:
        env_vars = create_sample_environment(args.sample)
        print(f"Created sample {args.sample} environment")
        print(f"  URL: {env_vars['url']}")
        print(f"  API Key: {env_vars['key']}")
        print(f"  Service Key: {env_vars['service_key']}")
    elif args.url or args.key or args.service_key:
        env = get_current_environment()
        set_environment_variables(env, args.url, args.key, args.service_key)
        print(f"Updated {env} environment")
    else:
        parser.print_help()

if __name__ == "__main__":
    main()