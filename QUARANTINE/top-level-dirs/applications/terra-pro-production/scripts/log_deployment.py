#!/usr/bin/env python3
"""
TerraFusion Model Deployment Event Logger
Script to log model deployment events

Usage:
  python log_deployment.py --event deployment --model condition_model --version 2.0.0 --message "Deployed new model"
  python log_deployment.py --event rollback --model condition_model --version 1.0.0 --message "Rolled back due to performance issues"
  python log_deployment.py --event error --model condition_model --version 2.0.0 --message "Error during inference"
"""

import os
import sys
import argparse
import json

# Add parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import deployment logger
from backend.model_deployment_logger import (
    log_deployment_event,
    EVENT_DEPLOYMENT,
    EVENT_ROLLBACK,
    EVENT_ERROR,
    EVENT_RECOVERY,
    EVENT_CONFIG_CHANGE,
    get_current_deployment_info
)

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="Log model deployment events")
    
    parser.add_argument("--event", choices=["deployment", "rollback", "error", "recovery", "config_change"], 
                        required=True, help="Type of event to log")
    parser.add_argument("--model", required=True, help="Name of the model")
    parser.add_argument("--version", required=True, help="Version of the model")
    parser.add_argument("--message", required=True, help="Description of the event")
    parser.add_argument("--metadata", help="Additional metadata as JSON string")
    
    args = parser.parse_args()
    
    # Map event string to constant
    event_map = {
        "deployment": EVENT_DEPLOYMENT,
        "rollback": EVENT_ROLLBACK,
        "error": EVENT_ERROR,
        "recovery": EVENT_RECOVERY,
        "config_change": EVENT_CONFIG_CHANGE
    }
    
    event_type = event_map[args.event]
    
    # Parse metadata
    metadata = None
    if args.metadata:
        try:
            metadata = json.loads(args.metadata)
        except json.JSONDecodeError:
            print(f"Error: Invalid JSON in metadata")
            sys.exit(1)
    
    try:
        log_deployment_event(
            event_type,
            args.model,
            args.version,
            args.message,
            metadata
        )
        print(f"Event logged successfully: [{args.event}] {args.model} v{args.version} - {args.message}")
        
        # Show current deployment info
        deployment_info = get_current_deployment_info()
        print("\nCurrent deployment:")
        print(f"  Model: {deployment_info['model']}")
        print(f"  Version: {deployment_info['version']}")
        print(f"  Status: {deployment_info['status']}")
        print(f"  Timestamp: {deployment_info['timestamp']}")
        
    except Exception as e:
        print(f"Error logging event: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()