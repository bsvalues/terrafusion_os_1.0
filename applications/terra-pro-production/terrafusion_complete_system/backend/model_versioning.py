"""
TerraFusion Model Versioning System
Manages versioning and tracking of trained models
"""

import os
import json
import shutil
import csv
from datetime import datetime
from typing import Dict, List, Optional, Any, Tuple

# Configuration
MODEL_REGISTRY_DIR = os.path.join(os.getcwd(), "models", "registry")
MODEL_ARCHIVE_DIR = os.path.join(os.getcwd(), "models", "archive")
MODEL_METADATA_FILE = os.path.join(MODEL_REGISTRY_DIR, "model_metadata.json")
MODEL_METRICS_FILE = os.path.join(MODEL_REGISTRY_DIR, "model_metrics.csv")

# Create directories if they don't exist
for directory in [MODEL_REGISTRY_DIR, MODEL_ARCHIVE_DIR]:
    if not os.path.exists(directory):
        os.makedirs(directory)

def load_model_metadata() -> Dict[str, Any]:
    """
    Load the model metadata from the registry
    
    Returns:
        Dict: Model metadata dictionary
    """
    if os.path.exists(MODEL_METADATA_FILE):
        with open(MODEL_METADATA_FILE, 'r') as f:
            return json.load(f)
    
    # If file doesn't exist, create initial structure
    metadata = {
        "models": {
            "condition_model": {
                "current_version": "1.0.0",
                "versions": {}
            }
        },
        "last_updated": datetime.now().isoformat()
    }
    
    # Save the initial metadata
    with open(MODEL_METADATA_FILE, 'w') as f:
        json.dump(metadata, f, indent=2)
    
    return metadata

def save_model_metadata(metadata: Dict[str, Any]) -> None:
    """
    Save the model metadata to the registry
    
    Args:
        metadata: Model metadata dictionary
    """
    metadata["last_updated"] = datetime.now().isoformat()
    
    with open(MODEL_METADATA_FILE, 'w') as f:
        json.dump(metadata, f, indent=2)

def register_model_version(
    model_name: str,
    model_path: str,
    model_version: str = None,
    metrics: Dict[str, Any] = None,
    description: str = None
) -> Tuple[str, str]:
    """
    Register a new model version in the registry
    
    Args:
        model_name: Name of the model (e.g., "condition_model")
        model_path: Path to the model file
        model_version: Version of the model (auto-generated if None)
        metrics: Dictionary of model performance metrics
        description: Description of the model version
        
    Returns:
        Tuple: (version, archived_model_path)
    """
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file not found at {model_path}")
    
    # Load current metadata
    metadata = load_model_metadata()
    
    # Initialize model entry if it doesn't exist
    if model_name not in metadata["models"]:
        metadata["models"][model_name] = {
            "current_version": "0.0.0",
            "versions": {}
        }
    
    # Generate version if not provided
    if model_version is None:
        # Parse current version and increment minor version
        current_version = metadata["models"][model_name]["current_version"]
        major, minor, patch = map(int, current_version.split('.'))
        model_version = f"{major}.{minor + 1}.{0}"
    
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    
    # Create archived model filename
    file_extension = os.path.splitext(model_path)[1]
    archived_filename = f"{model_name}_v{model_version.replace('.', '_')}_{timestamp}{file_extension}"
    archived_model_path = os.path.join(MODEL_ARCHIVE_DIR, archived_filename)
    
    # Copy model file to archive directory
    shutil.copy(model_path, archived_model_path)
    
    # Update metadata
    metadata["models"][model_name]["versions"][model_version] = {
        "file_path": archived_model_path,
        "timestamp": timestamp,
        "metrics": metrics or {},
        "description": description or f"Version {model_version} of {model_name}"
    }
    
    # Update current version if it's a newer version
    current_version_parts = [int(x) for x in metadata["models"][model_name]["current_version"].split('.')]
    new_version_parts = [int(x) for x in model_version.split('.')]
    
    if new_version_parts > current_version_parts:
        metadata["models"][model_name]["current_version"] = model_version
    
    # Log metrics to CSV if provided
    if metrics and os.path.exists(MODEL_METRICS_FILE):
        with open(MODEL_METRICS_FILE, 'a', newline='') as f:
            writer = csv.writer(f)
            row = [timestamp, model_name, model_version]
            for metric_name, metric_value in metrics.items():
                row.append(f"{metric_name}:{metric_value}")
            writer.writerow(row)
    elif metrics:
        # Create metrics file with header if it doesn't exist
        with open(MODEL_METRICS_FILE, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(["timestamp", "model_name", "version", "metrics"])
            row = [timestamp, model_name, model_version]
            for metric_name, metric_value in metrics.items():
                row.append(f"{metric_name}:{metric_value}")
            writer.writerow(row)
    
    # Save updated metadata
    save_model_metadata(metadata)
    
    return model_version, archived_model_path

def get_model_path(model_name: str, version: str = None) -> str:
    """
    Get the path to a model file by name and version
    
    Args:
        model_name: Name of the model
        version: Version of the model (uses current version if None)
        
    Returns:
        str: Path to the model file
    """
    metadata = load_model_metadata()
    
    if model_name not in metadata["models"]:
        raise ValueError(f"Model {model_name} not found in registry")
    
    if version is None:
        version = metadata["models"][model_name]["current_version"]
    
    if version not in metadata["models"][model_name]["versions"]:
        raise ValueError(f"Version {version} of model {model_name} not found in registry")
    
    return metadata["models"][model_name]["versions"][version]["file_path"]

def get_model_versions(model_name: str) -> List[str]:
    """
    Get all available versions of a model
    
    Args:
        model_name: Name of the model
        
    Returns:
        List[str]: List of available versions
    """
    metadata = load_model_metadata()
    
    if model_name not in metadata["models"]:
        return []
    
    return list(metadata["models"][model_name]["versions"].keys())

def get_current_version(model_name: str) -> str:
    """
    Get the current version of a model
    
    Args:
        model_name: Name of the model
        
    Returns:
        str: Current version of the model
    """
    metadata = load_model_metadata()
    
    if model_name not in metadata["models"]:
        raise ValueError(f"Model {model_name} not found in registry")
    
    return metadata["models"][model_name]["current_version"]

def set_current_version(model_name: str, version: str) -> None:
    """
    Set the current version of a model
    
    Args:
        model_name: Name of the model
        version: Version to set as current
    """
    metadata = load_model_metadata()
    
    if model_name not in metadata["models"]:
        raise ValueError(f"Model {model_name} not found in registry")
    
    if version not in metadata["models"][model_name]["versions"]:
        raise ValueError(f"Version {version} of model {model_name} not found in registry")
    
    metadata["models"][model_name]["current_version"] = version
    save_model_metadata(metadata)

def compare_model_versions(model_name: str, version1: str, version2: str) -> Dict[str, Any]:
    """
    Compare metrics between two model versions
    
    Args:
        model_name: Name of the model
        version1: First version to compare
        version2: Second version to compare
        
    Returns:
        Dict: Comparison of metrics
    """
    metadata = load_model_metadata()
    
    if model_name not in metadata["models"]:
        raise ValueError(f"Model {model_name} not found in registry")
    
    if version1 not in metadata["models"][model_name]["versions"]:
        raise ValueError(f"Version {version1} of model {model_name} not found in registry")
    
    if version2 not in metadata["models"][model_name]["versions"]:
        raise ValueError(f"Version {version2} of model {model_name} not found in registry")
    
    metrics1 = metadata["models"][model_name]["versions"][version1]["metrics"]
    metrics2 = metadata["models"][model_name]["versions"][version2]["metrics"]
    
    # Calculate differences
    comparison = {}
    all_metrics = set(metrics1.keys()) | set(metrics2.keys())
    
    for metric in all_metrics:
        value1 = metrics1.get(metric, None)
        value2 = metrics2.get(metric, None)
        
        if value1 is not None and value2 is not None and isinstance(value1, (int, float)) and isinstance(value2, (int, float)):
            comparison[metric] = {
                "v1": value1,
                "v2": value2,
                "diff": value2 - value1,
                "pct_change": (value2 - value1) / value1 * 100 if value1 != 0 else float('inf')
            }
        else:
            comparison[metric] = {
                "v1": value1,
                "v2": value2,
                "diff": "N/A",
                "pct_change": "N/A"
            }
    
    return comparison

def initialize_model_registry(initial_model_path: str = None) -> None:
    """
    Initialize the model registry with the current model
    
    Args:
        initial_model_path: Path to the initial model file
    """
    # Create directories
    for directory in [MODEL_REGISTRY_DIR, MODEL_ARCHIVE_DIR]:
        if not os.path.exists(directory):
            os.makedirs(directory)
    
    # Create initial metadata file if it doesn't exist
    if not os.path.exists(MODEL_METADATA_FILE):
        metadata = {
            "models": {},
            "last_updated": datetime.now().isoformat()
        }
        
        with open(MODEL_METADATA_FILE, 'w') as f:
            json.dump(metadata, f, indent=2)
    
    # Register initial model if provided
    if initial_model_path and os.path.exists(initial_model_path):
        register_model_version(
            "condition_model",
            initial_model_path,
            model_version="1.0.0",
            description="Initial condition model"
        )

# Initialize registry if this script is run directly
if __name__ == "__main__":
    initialize_model_registry()