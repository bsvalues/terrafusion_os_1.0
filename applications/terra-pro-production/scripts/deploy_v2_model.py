#!/usr/bin/env python3
"""
TerraFusion Condition Model v2 Deployment Script
Deploys a newly trained model as the current version for production use

Usage:
  python deploy_v2_model.py <model_path> [--metrics <metrics_json>]
"""

import os
import sys
import json
import argparse
from datetime import datetime

# Add parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import versioning system
from backend.model_versioning import register_model_version, get_current_version

def deploy_model(model_path, metrics=None):
    """
    Deploy a model as the new production version
    
    Args:
        model_path: Path to the model file
        metrics: Dictionary of model performance metrics
    """
    if not os.path.exists(model_path):
        print(f"Error: Model file not found at {model_path}")
        return False
    
    try:
        # Get current version for logging
        try:
            current_version = get_current_version("condition_model")
            print(f"Current version: {current_version}")
        except Exception:
            current_version = "unknown"
            print("No current version found. This will be the first version.")
        
        # Parse metrics if provided
        metrics_dict = {}
        if metrics:
            try:
                if os.path.exists(metrics):
                    # Load from file
                    with open(metrics, 'r') as f:
                        metrics_dict = json.load(f)
                else:
                    # Parse JSON string
                    metrics_dict = json.loads(metrics)
            except Exception as e:
                print(f"Warning: Error parsing metrics: {str(e)}")
        
        # Register the model with automatic version number
        new_version, archived_path = register_model_version(
            "condition_model",
            model_path,
            metrics=metrics_dict,
            description=f"Deployed v2 model trained with user feedback data on {datetime.now().strftime('%Y-%m-%d')}"
        )
        
        print(f"Successfully deployed model v{new_version}")
        print(f"Model archived at: {archived_path}")
        print(f"Previous version: {current_version}")
        
        return True
    except Exception as e:
        print(f"Error deploying model: {str(e)}")
        return False

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="Deploy a trained v2 model to production")
    parser.add_argument("model_path", help="Path to the trained model file")
    parser.add_argument("--metrics", help="Path to JSON file with metrics or JSON string of metrics")
    
    args = parser.parse_args()
    
    success = deploy_model(args.model_path, args.metrics)
    
    if success:
        print("Model deployment completed successfully")
        print("The new model will be used for all future property condition predictions")
    else:
        print("Model deployment failed")
        sys.exit(1)

if __name__ == "__main__":
    main()