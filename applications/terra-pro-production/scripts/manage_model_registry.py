#!/usr/bin/env python3
"""
TerraFusion Model Registry Management Script
Tool for managing model versions and tracking model performance

Usage:
  python manage_model_registry.py init - Initialize the model registry
  python manage_model_registry.py register <model_path> <version> - Register a model
  python manage_model_registry.py list - List all model versions
  python manage_model_registry.py set-current <version> - Set the current version
  python manage_model_registry.py compare <version1> <version2> - Compare model versions
"""

import os
import sys
import argparse
import json
import glob
from datetime import datetime

# Add parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import versioning system
from backend.model_versioning import (
    initialize_model_registry,
    register_model_version,
    get_model_versions,
    get_current_version,
    set_current_version,
    compare_model_versions,
    load_model_metadata
)

def init_command():
    """Initialize the model registry"""
    print("Initializing model registry...")
    
    # Look for model files
    default_model_path = os.path.join(os.getcwd(), "models", "condition_model.pth")
    
    if os.path.exists(default_model_path):
        print(f"Found default model at {default_model_path}")
        initialize_model_registry(default_model_path)
        print("Model registry initialized with existing model")
    else:
        # Look for any .pth files in the models directory
        model_files = glob.glob(os.path.join(os.getcwd(), "models", "*.pth"))
        
        if model_files:
            print(f"Found model file: {model_files[0]}")
            initialize_model_registry(model_files[0])
            print("Model registry initialized with found model")
        else:
            print("No model files found. Initializing empty registry...")
            initialize_model_registry()
            print("Empty model registry initialized")
    
    print("Done!")

def register_command(model_path, version=None, description=None):
    """Register a model version"""
    if not os.path.exists(model_path):
        print(f"Error: Model file not found at {model_path}")
        return
    
    print(f"Registering model from {model_path}...")
    
    try:
        # Register model
        version, archived_path = register_model_version(
            "condition_model",
            model_path,
            model_version=version,
            description=description
        )
        
        print(f"Model registered as version {version}")
        print(f"Archived at: {archived_path}")
    except Exception as e:
        print(f"Error registering model: {str(e)}")

def list_command():
    """List all model versions"""
    print("Listing model versions...")
    
    try:
        # Get all versions
        versions = get_model_versions("condition_model")
        current_version = get_current_version("condition_model")
        
        if not versions:
            print("No model versions found.")
            return
        
        print(f"Found {len(versions)} model versions:")
        
        # Load metadata for details
        metadata = load_model_metadata()
        
        for version in versions:
            version_data = metadata["models"]["condition_model"]["versions"][version]
            timestamp = version_data.get("timestamp", "Unknown")
            description = version_data.get("description", "No description")
            
            # Highlight current version
            current_marker = "*" if version == current_version else " "
            
            print(f"{current_marker} v{version} [{timestamp}] - {description}")
            
            # Show metrics if available
            if "metrics" in version_data and version_data["metrics"]:
                print("   Metrics:")
                for metric_name, metric_value in version_data["metrics"].items():
                    print(f"     {metric_name}: {metric_value}")
    except Exception as e:
        print(f"Error listing model versions: {str(e)}")

def set_current_command(version):
    """Set the current model version"""
    print(f"Setting current version to {version}...")
    
    try:
        # Set current version
        set_current_version("condition_model", version)
        print("Current version updated successfully")
    except Exception as e:
        print(f"Error setting current version: {str(e)}")

def compare_command(version1, version2):
    """Compare two model versions"""
    print(f"Comparing model versions {version1} and {version2}...")
    
    try:
        # Compare versions
        comparison = compare_model_versions("condition_model", version1, version2)
        
        if not comparison:
            print("No metrics available for comparison")
            return
        
        # Display comparison
        print(f"{'Metric':<20} {'v' + version1:<10} {'v' + version2:<10} {'Diff':<10} {'% Change':<10}")
        print("-" * 60)
        
        for metric, values in comparison.items():
            v1 = values.get("v1", "N/A")
            v2 = values.get("v2", "N/A")
            diff = values.get("diff", "N/A")
            pct = values.get("pct_change", "N/A")
            
            if isinstance(pct, float):
                pct_str = f"{pct:.2f}%"
            else:
                pct_str = str(pct)
            
            print(f"{metric:<20} {v1:<10} {v2:<10} {diff:<10} {pct_str:<10}")
    except Exception as e:
        print(f"Error comparing model versions: {str(e)}")

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="TerraFusion Model Registry Management")
    subparsers = parser.add_subparsers(dest="command", help="Command to run")
    
    # Init command
    init_parser = subparsers.add_parser("init", help="Initialize the model registry")
    
    # Register command
    register_parser = subparsers.add_parser("register", help="Register a model version")
    register_parser.add_argument("model_path", help="Path to model file")
    register_parser.add_argument("--version", help="Version number (auto-generated if not specified)")
    register_parser.add_argument("--description", help="Model description")
    
    # List command
    list_parser = subparsers.add_parser("list", help="List all model versions")
    
    # Set current command
    set_current_parser = subparsers.add_parser("set-current", help="Set the current model version")
    set_current_parser.add_argument("version", help="Version to set as current")
    
    # Compare command
    compare_parser = subparsers.add_parser("compare", help="Compare model versions")
    compare_parser.add_argument("version1", help="First version to compare")
    compare_parser.add_argument("version2", help="Second version to compare")
    
    args = parser.parse_args()
    
    if args.command == "init":
        init_command()
    elif args.command == "register":
        register_command(args.model_path, args.version, args.description)
    elif args.command == "list":
        list_command()
    elif args.command == "set-current":
        set_current_command(args.version)
    elif args.command == "compare":
        compare_command(args.version1, args.version2)
    else:
        parser.print_help()

if __name__ == "__main__":
    main()