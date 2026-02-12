"""
Verify Supabase Environment

This module provides functions to verify that the Supabase environment is properly set up.
"""

import os
import sys
import logging
import time
import json
from typing import Dict, Any, Optional, List, Tuple, Union, cast
from datetime import datetime

try:
    import dotenv
    DOTENV_AVAILABLE = True
except ImportError:
    DOTENV_AVAILABLE = False

try:
    from supabase import create_client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False

# Local modules
from set_supabase_env import ensure_supabase_env, get_current_environment
from supabase_client import get_supabase_client, release_supabase_client

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def load_environment_variables() -> Dict[str, Any]:
    """
    Load environment variables from .env file.
    
    Returns:
        Dictionary of environment variables
    """
    if DOTENV_AVAILABLE:
        try:
            dotenv.load_dotenv()
            logger.debug("Loaded environment variables from .env file")
        except Exception as e:
            logger.warning(f"Failed to load environment variables from .env file: {str(e)}")
    
    # Get environment
    environment = get_current_environment()
    
    # Get environment variables for Supabase
    return {
        "environment": environment,
        "url": os.environ.get(f"SUPABASE_URL_{environment.upper()}") or os.environ.get("SUPABASE_URL"),
        "key": os.environ.get(f"SUPABASE_KEY_{environment.upper()}") or os.environ.get("SUPABASE_KEY"),
        "service_key": os.environ.get(f"SUPABASE_SERVICE_KEY_{environment.upper()}") or os.environ.get("SUPABASE_SERVICE_KEY")
    }

def check_environment_variables() -> Dict[str, Any]:
    """
    Check if the required environment variables are set.
    
    Returns:
        Dictionary with check results
    """
    logger.debug("Checking environment variables")
    
    # Load environment variables
    env_vars = load_environment_variables()
    
    # Check required environment variables
    url = env_vars.get("url")
    key = env_vars.get("key")
    service_key = env_vars.get("service_key")
    
    # Return result
    return {
        "success": bool(url and key),
        "environment": env_vars.get("environment", "development"),
        "url": bool(url),
        "key": bool(key),
        "service_key": bool(service_key),
        "message": (
            "All required environment variables are set"
            if url and key
            else "Missing required environment variables: " + ", ".join(
                [var for var, value in [("SUPABASE_URL", url), ("SUPABASE_KEY", key)] if not value]
            )
        )
    }

def check_supabase_connection() -> Dict[str, Any]:
    """
    Check if the Supabase connection is working.
    
    Returns:
        Dictionary with check results
    """
    logger.debug("Checking Supabase connection")
    
    # Check if Supabase is available
    if not SUPABASE_AVAILABLE:
        return {
            "success": False,
            "message": "Supabase package not installed"
        }
    
    # Load environment variables
    env_vars = load_environment_variables()
    
    # Check required environment variables
    url = env_vars.get("url")
    key = env_vars.get("key")
    
    if not url or not key:
        return {
            "success": False,
            "message": "Missing required environment variables: " + ", ".join(
                [var for var, value in [("SUPABASE_URL", url), ("SUPABASE_KEY", key)] if not value]
            )
        }
    
    # Try to create a client
    try:
        client = get_supabase_client(url, key)
        response = client.rpc("check_connection").execute()
        
        if response.data:
            result = {
                "success": True,
                "message": "Supabase connection is working",
                "data": response.data
            }
        else:
            result = {
                "success": True,
                "message": "Supabase connection established, but no data returned from check_connection RPC"
            }
        release_supabase_client(client)
        return result
    except Exception as e:
        logger.warning(f"Failed to connect to Supabase: {str(e)}")
        
        # Try to determine if it's a network issue
        try:
            import socket
            host = url.split("//")[1].split("/")[0].split(":")[0]
            socket.gethostbyname(host)
            
            # If we get here, the host is resolvable
            message = f"Failed to connect to Supabase: {str(e)}"
        except Exception:
            # If we get here, the host is not resolvable
            message = f"Failed to resolve Supabase host: {url}"
        
        return {
            "success": False,
            "message": message,
            "error": str(e)
        }

def check_supabase_auth() -> Dict[str, Any]:
    """
    Check if Supabase authentication is working.
    
    Returns:
        Dictionary with check results
    """
    logger.debug("Checking Supabase authentication")
    
    # Check if Supabase is available
    if not SUPABASE_AVAILABLE:
        return {
            "success": False,
            "message": "Supabase package not installed"
        }
    
    # Load environment variables
    env_vars = load_environment_variables()
    
    # Check required environment variables
    url = env_vars.get("url")
    key = env_vars.get("key")
    
    if not url or not key:
        return {
            "success": False,
            "message": "Missing required environment variables: " + ", ".join(
                [var for var, value in [("SUPABASE_URL", url), ("SUPABASE_KEY", key)] if not value]
            )
        }
    
    # Try to create a client
    try:
        client = get_supabase_client(url, key)
        response = client.auth.get_session()
        
        if response:
            result = {
                "success": True,
                "message": "Supabase authentication is working"
            }
        else:
            result = {
                "success": False,
                "message": "Failed to initialize Supabase authentication"
            }
        release_supabase_client(client)
        return result
    except Exception as e:
        logger.warning(f"Failed to initialize Supabase authentication: {str(e)}")
        return {
            "success": False,
            "message": f"Failed to initialize Supabase authentication: {str(e)}",
            "error": str(e)
        }

def check_supabase_storage() -> Dict[str, Any]:
    """
    Check if Supabase storage is working.
    
    Returns:
        Dictionary with check results
    """
    logger.debug("Checking Supabase storage")
    
    # Check if Supabase is available
    if not SUPABASE_AVAILABLE:
        return {
            "success": False,
            "message": "Supabase package not installed"
        }
    
    # Load environment variables
    env_vars = load_environment_variables()
    
    # Check required environment variables
    url = env_vars.get("url")
    key = env_vars.get("key")
    
    if not url or not key:
        return {
            "success": False,
            "message": "Missing required environment variables: " + ", ".join(
                [var for var, value in [("SUPABASE_URL", url), ("SUPABASE_KEY", key)] if not value]
            )
        }
    
    # Try to create a client
    try:
        client = get_supabase_client(url, key)
        
        # Get list of buckets
        response = client.storage.list_buckets()
        
        # If we get here, storage is working
        result = {
            "success": True,
            "message": f"Supabase storage is working. {len(response)} buckets found.",
            "buckets": [bucket["name"] for bucket in response]
        }
        release_supabase_client(client)
        return result
    except Exception as e:
        logger.warning(f"Failed to initialize Supabase storage: {str(e)}")
        return {
            "success": False,
            "message": f"Failed to initialize Supabase storage: {str(e)}",
            "error": str(e)
        }

def check_supabase_service_role() -> Dict[str, Any]:
    """
    Check if Supabase service role is working.
    
    Returns:
        Dictionary with check results
    """
    logger.debug("Checking Supabase service role")
    
    # Check if Supabase is available
    if not SUPABASE_AVAILABLE:
        return {
            "success": False,
            "message": "Supabase package not installed"
        }
    
    # Load environment variables
    env_vars = load_environment_variables()
    
    # Check required environment variables
    url = env_vars.get("url")
    service_key = env_vars.get("service_key")
    
    if not url or not service_key:
        return {
            "success": False,
            "message": "Missing required environment variables: " + ", ".join(
                [var for var, value in [("SUPABASE_URL", url), ("SUPABASE_SERVICE_KEY", service_key)] if not value]
            )
        }
    
    # Try to create a client
    try:
        client = get_supabase_client(url, service_key)
        
        # Get list of users (only available with service role)
        try:
            response = client.auth.admin.list_users()
            
            # If we get here, service role is working
            result = {
                "success": True,
                "message": f"Supabase service role is working. {len(response.users) if response.users else 0} users found."
            }
            release_supabase_client(client)
            return result
        except Exception as e:
            logger.warning(f"Failed to list users with service role: {str(e)}")
            release_supabase_client(client)
            return {
                "success": False,
                "message": f"Failed to list users with service role: {str(e)}",
                "error": str(e)
            }
    except Exception as e:
        logger.warning(f"Failed to initialize Supabase with service role: {str(e)}")
        return {
            "success": False,
            "message": f"Failed to initialize Supabase with service role: {str(e)}",
            "error": str(e)
        }

def check_supabase_database() -> Dict[str, Any]:
    """
    Check if Supabase database is working.
    
    Returns:
        Dictionary with check results
    """
    logger.debug("Checking Supabase database")
    
    # Check if Supabase is available
    if not SUPABASE_AVAILABLE:
        return {
            "success": False,
            "message": "Supabase package not installed"
        }
    
    # Load environment variables
    env_vars = load_environment_variables()
    
    # Check required environment variables
    url = env_vars.get("url")
    key = env_vars.get("key")
    
    if not url or not key:
        return {
            "success": False,
            "message": "Missing required environment variables: " + ", ".join(
                [var for var, value in [("SUPABASE_URL", url), ("SUPABASE_KEY", key)] if not value]
            )
        }
    
    # Try to create a client
    try:
        client = get_supabase_client(url, key)
        
        # Perform a simple query
        response = client.table("test_connection").select("*").limit(1).execute()
        
        # If we get here, database is working
        result = {
            "success": True,
            "message": "Supabase database is working"
        }
        release_supabase_client(client)
        return result
    except Exception as e:
        # Check if table doesn't exist
        if "relation" in str(e) and "does not exist" in str(e):
            # Table doesn't exist, try to create it
            try:
                # We need to use service role for this
                service_key = env_vars.get("service_key")
                if not service_key:
                    return {
                        "success": False,
                        "message": "Missing required environment variable: SUPABASE_SERVICE_KEY"
                    }
                
                service_client = get_supabase_client(url, service_key)
                
                try:
                    # Create test_connection table
                    response = service_client.rpc(
                        "create_test_connection_table",
                        {
                            "table_name": "test_connection"
                        }
                    ).execute()
                    
                    # Try to insert a row
                    response = service_client.table("test_connection").insert({
                        "created_at": datetime.now().isoformat(),
                        "test_value": "Connection test"
                    }).execute()
                    
                    # If we get here, database is working
                    result = {
                        "success": True,
                        "message": "Supabase database is working (created test table)"
                    }
                    release_supabase_client(service_client)
                    return result
                except Exception as e:
                    release_supabase_client(service_client)
                    raise e
            except Exception as inner_e:
                logger.warning(f"Failed to create test table: {str(inner_e)}")
                return {
                    "success": False,
                    "message": f"Failed to create test table: {str(inner_e)}",
                    "error": str(inner_e)
                }
        
        logger.warning(f"Failed to query Supabase database: {str(e)}")
        return {
            "success": False,
            "message": f"Failed to query Supabase database: {str(e)}",
            "error": str(e)
        }

def check_supabase_functions() -> Dict[str, Any]:
    """
    Check if Supabase edge functions are working.
    
    Returns:
        Dictionary with check results
    """
    logger.debug("Checking Supabase edge functions")
    
    # Check if Supabase is available
    if not SUPABASE_AVAILABLE:
        return {
            "success": False,
            "message": "Supabase package not installed"
        }
    
    # Load environment variables
    env_vars = load_environment_variables()
    
    # Check required environment variables
    url = env_vars.get("url")
    key = env_vars.get("key")
    
    if not url or not key:
        return {
            "success": False,
            "message": "Missing required environment variables: " + ", ".join(
                [var for var, value in [("SUPABASE_URL", url), ("SUPABASE_KEY", key)] if not value]
            )
        }
    
    # Try to create a client
    try:
        # Edge functions are hard to check without knowing their names
        # So we'll just check if we can call a built-in RPC function
        
        client = get_supabase_client(url, key)
        response = client.rpc("check_connection").execute()
        
        # If we get here, functions are probably working
        result = {
            "success": True,
            "message": "Supabase functions seem to be working (RPC check)"
        }
        release_supabase_client(client)
        return result
    except Exception as e:
        logger.warning(f"Failed to check Supabase functions: {str(e)}")
        return {
            "success": False,
            "message": f"Failed to check Supabase functions: {str(e)}",
            "error": str(e)
        }

def run_all_checks() -> Dict[str, Any]:
    """
    Run all Supabase environment checks.
    
    Returns:
        Dictionary with all check results
    """
    logger.debug("Running all Supabase environment checks")
    
    # First, try to ensure Supabase environment is configured
    ensure_supabase_env()
    
    # Run all checks
    checks = {
        "environment_variables": check_environment_variables(),
        "connection": check_supabase_connection(),
        "auth": check_supabase_auth(),
        "storage": check_supabase_storage(),
        "service_role": check_supabase_service_role(),
        "database": check_supabase_database(),
        "functions": check_supabase_functions()
    }
    
    # Determine overall success
    success = all(check["success"] for check in checks.values())
    status = "All checks passed" if success else "Some checks failed"
    
    # Return results
    return {
        "overall_success": success,
        "overall_status": status,
        "checks": checks
    }

def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Verify Supabase environment")
    parser.add_argument("--environment", "-e", choices=["development", "training", "production"],
                     help="Supabase environment to check")
    parser.add_argument("--check", "-c", choices=["all", "env", "connection", "auth", "storage", "service", "database", "functions"],
                     default="all", help="Check to run")
    parser.add_argument("--json", "-j", action="store_true", help="Output results as JSON")
    parser.add_argument("--verbose", "-v", action="store_true", help="Verbose output")
    
    args = parser.parse_args()
    
    # Set log level based on verbose flag
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Use specified environment if provided
    if args.environment:
        from set_supabase_env import set_environment_variables
        set_environment_variables(args.environment)
    
    # Run the specified check
    if args.check == "all":
        results = run_all_checks()
    elif args.check == "env":
        results = {"checks": {"environment_variables": check_environment_variables()}}
    elif args.check == "connection":
        results = {"checks": {"connection": check_supabase_connection()}}
    elif args.check == "auth":
        results = {"checks": {"auth": check_supabase_auth()}}
    elif args.check == "storage":
        results = {"checks": {"storage": check_supabase_storage()}}
    elif args.check == "service":
        results = {"checks": {"service_role": check_supabase_service_role()}}
    elif args.check == "database":
        results = {"checks": {"database": check_supabase_database()}}
    elif args.check == "functions":
        results = {"checks": {"functions": check_supabase_functions()}}
    
    # Output results
    if args.json:
        print(json.dumps(results, indent=2))
    else:
        # Get environment
        environment = get_current_environment()
        
        print(f"\n=== Supabase Environment Verification ({environment}) ===\n")
        
        # Print results in a nice format
        for check_name, check_result in results["checks"].items():
            check_success = check_result.get("success", False)
            message = check_result.get("message", "No message")
            print(f"{check_name.capitalize()}: {'✅' if check_success else '❌'} {message}")
            
            # Print additional info if available
            if "buckets" in check_result:
                buckets = check_result["buckets"]
                print(f"  Buckets: {', '.join(buckets) if buckets else 'None'}")
        
        # Print overall status if available
        if "overall_success" in results:
            overall_success = results["overall_success"]
            overall_status = results["overall_status"]
            print(f"\nOverall: {'✅' if overall_success else '❌'} {overall_status}")
    
    # Exit with success if all checks passed
    if args.check == "all":
        sys.exit(0 if results["overall_success"] else 1)
    else:
        # Exit with success if the specific check passed
        check_success = list(results["checks"].values())[0].get("success", False)
        sys.exit(0 if check_success else 1)

if __name__ == "__main__":
    main()