#!/usr/bin/env python3
"""
Check Supabase Connection

This script checks if the Supabase connection is working.
It verifies the environment variables, connection, and related services.
"""

import sys
import logging
import argparse
from typing import Dict, Any, Optional, List

# Import local modules
from set_supabase_env import ensure_supabase_env, get_current_environment
from verify_supabase_env import run_all_checks, check_environment_variables, check_supabase_connection

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def check_and_report() -> bool:
    """
    Check Supabase connection and report the results.
    
    Returns:
        True if successful, False otherwise
    """
    # Get current environment
    environment = get_current_environment()
    
    # Ensure environment variables are set
    if not ensure_supabase_env(environment):
        logger.error(f"Failed to ensure Supabase environment: {environment}")
        return False
    
    # Run all checks
    all_checks = run_all_checks()
    success = all_checks["overall_success"]
    
    # Print results
    print(f"\n=== Supabase Connection Check ({environment}) ===\n")
    print(f"Overall: {'✅' if success else '❌'} {all_checks['overall_status']}")
    print("\nDetailed results:")
    
    for check_name, check_result in all_checks["checks"].items():
        check_success = check_result.get("success", False)
        message = check_result.get("message", "No message")
        print(f"{check_name.capitalize()}: {'✅' if check_success else '❌'} {message}")
    
    # Return overall success
    return success

def get_simple_connection_status() -> Dict[str, Any]:
    """
    Get a simple status report of the Supabase connection.
    
    Returns:
        Dictionary with status information
    """
    # Get current environment
    environment = get_current_environment()
    
    # Check environment variables
    env_check = check_environment_variables()
    
    # Check connection if environment variables are set
    if env_check["success"]:
        connection_check = check_supabase_connection()
    else:
        connection_check = {
            "success": False,
            "message": "Missing required environment variables",
            "error": env_check["message"]
        }
    
    # Build status
    return {
        "environment": environment,
        "connected": connection_check["success"],
        "message": connection_check["message"],
        "url_available": env_check["url"],
        "key_available": env_check["key"],
        "service_key_available": env_check["service_key"]
    }

def main():
    """Main function"""
    parser = argparse.ArgumentParser(description="Check Supabase connection")
    parser.add_argument("--environment", "-e", choices=["development", "training", "production"],
                     help="Supabase environment to check")
    parser.add_argument("--simple", "-s", action="store_true", help="Simple output")
    parser.add_argument("--json", "-j", action="store_true", help="JSON output")
    parser.add_argument("--verbose", "-v", action="store_true", help="Verbose output")
    
    args = parser.parse_args()
    
    # Set log level based on verbose flag
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Use specified environment if provided
    if args.environment:
        from set_supabase_env import set_environment_variables
        set_environment_variables(args.environment)
    
    # Get simple status if requested
    if args.simple:
        status = get_simple_connection_status()
        
        if args.json:
            import json
            print(json.dumps(status, indent=2))
        else:
            # Simple output
            print(f"Environment: {status['environment']}")
            print(f"Connected: {'Yes' if status['connected'] else 'No'}")
            print(f"Message: {status['message']}")
            print(f"URL Available: {'Yes' if status['url_available'] else 'No'}")
            print(f"Key Available: {'Yes' if status['key_available'] else 'No'}")
            print(f"Service Key Available: {'Yes' if status['service_key_available'] else 'No'}")
        
        # Exit with success if connected
        sys.exit(0 if status['connected'] else 1)
    
    # Run full check and report
    success = check_and_report()
    
    # Exit with success if all checks passed
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()