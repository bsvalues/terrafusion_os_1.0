#!/usr/bin/env python3
"""
TerraFusion Model Fallback Configuration
Script to enable or disable automatic fallback to previous model versions

Usage:
  python enable_fallback.py --enable --version 1.0.0
  python enable_fallback.py --disable
"""

import os
import sys
import argparse

# Add parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import deployment logger
from backend.model_deployment_logger import configure_fallback, get_current_deployment_info
from backend.model_versioning import get_model_versions, get_current_version

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="Configure model fallback settings")
    
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--enable", action="store_true", help="Enable automatic fallback")
    group.add_argument("--disable", action="store_true", help="Disable automatic fallback")
    group.add_argument("--status", action="store_true", help="Show current fallback status")
    
    parser.add_argument("--version", help="Specific version to fall back to (default: most recent previous version)")
    
    args = parser.parse_args()
    
    if args.status:
        # Show current deployment and fallback status
        try:
            current_deployment = get_current_deployment_info()
            print(f"Current deployment:")
            print(f"  Model: {current_deployment['model']}")
            print(f"  Version: {current_deployment['version']}")
            print(f"  Status: {current_deployment['status']}")
            print(f"  Timestamp: {current_deployment['timestamp']}")
            
            # Get available versions
            available_versions = get_model_versions("condition_model")
            print(f"\nAvailable versions:")
            current_version = get_current_version("condition_model")
            for version in available_versions:
                current_marker = "*" if version == current_version else " "
                print(f"  {current_marker} {version}")
            
            # Show fallback configuration
            from backend.model_deployment_logger import DeploymentStatus
            status = DeploymentStatus()
            fallback_config = status.get_fallback_config()
            
            print(f"\nFallback configuration:")
            print(f"  Enabled: {fallback_config['enabled']}")
            print(f"  Fallback version: {fallback_config['version'] or 'Most recent previous version'}")
            
        except Exception as e:
            print(f"Error getting deployment status: {str(e)}")
            sys.exit(1)
    else:
        # Configure fallback
        if args.enable:
            print(f"Enabling automatic fallback" + (f" to version {args.version}" if args.version else ""))
            
            # Validate version if provided
            if args.version:
                try:
                    available_versions = get_model_versions("condition_model")
                    if args.version not in available_versions:
                        print(f"Error: Version {args.version} not found")
                        print(f"Available versions: {', '.join(available_versions)}")
                        sys.exit(1)
                except Exception as e:
                    print(f"Error validating version: {str(e)}")
                    sys.exit(1)
            
            try:
                configure_fallback(True, args.version)
                print("Fallback configuration updated successfully")
            except Exception as e:
                print(f"Error configuring fallback: {str(e)}")
                sys.exit(1)
        else:  # disable
            print("Disabling automatic fallback")
            try:
                configure_fallback(False)
                print("Fallback configuration updated successfully")
            except Exception as e:
                print(f"Error configuring fallback: {str(e)}")
                sys.exit(1)

if __name__ == "__main__":
    main()