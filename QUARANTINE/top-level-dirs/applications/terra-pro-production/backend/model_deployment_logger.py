"""
TerraFusion Model Deployment Logger
Tracks model deployment history and events
"""

import os
import csv
import json
from datetime import datetime
from typing import Dict, Any, List, Optional

# Try to import model versioning system (not critical for deployment logger operation)
try:
    from backend.model_versioning import get_model_versions, get_current_version
    MODEL_VERSIONING_AVAILABLE = True
except ImportError:
    MODEL_VERSIONING_AVAILABLE = False
    print("Model versioning system not available. Using mock versions for fallback configuration.")

# Configuration
DEPLOYMENT_LOG_DIR = os.path.join(os.getcwd(), "models", "deployment_logs")
DEPLOYMENT_EVENTS_FILE = os.path.join(DEPLOYMENT_LOG_DIR, "deployment_events.csv")
ROLLOUT_STATUS_FILE = os.path.join(DEPLOYMENT_LOG_DIR, "rollout_status.json")

# Ensure directory exists
if not os.path.exists(DEPLOYMENT_LOG_DIR):
    os.makedirs(DEPLOYMENT_LOG_DIR)

# Event types
EVENT_DEPLOYMENT = "deployment"
EVENT_ROLLBACK = "rollback"
EVENT_ERROR = "error"
EVENT_RECOVERY = "recovery"
EVENT_CONFIG_CHANGE = "config_change"

class DeploymentStatus:
    """Class to track the current model deployment status"""
    
    def __init__(self):
        self.status_file = ROLLOUT_STATUS_FILE
        self._load_status()
    
    def _load_status(self):
        """Load status from file or create default"""
        if os.path.exists(self.status_file):
            try:
                with open(self.status_file, 'r') as f:
                    self.status = json.load(f)
            except Exception as e:
                print(f"Error loading status file: {str(e)}")
                self._create_default_status()
        else:
            self._create_default_status()
    
    def _create_default_status(self):
        """Create default status"""
        self.status = {
            "current_deployment": {
                "model": "condition_model",
                "version": "1.0.0",
                "timestamp": datetime.now().isoformat(),
                "status": "active"
            },
            "fallback_enabled": False,
            "fallback_version": None,
            "deployment_history": [],
            "last_updated": datetime.now().isoformat()
        }
        self._save_status()
    
    def _save_status(self):
        """Save status to file"""
        self.status["last_updated"] = datetime.now().isoformat()
        
        try:
            with open(self.status_file, 'w') as f:
                json.dump(self.status, f, indent=2)
        except Exception as e:
            print(f"Error saving status file: {str(e)}")
    
    def update_deployment(self, model: str, version: str, status: str = "active"):
        """Update the current deployment"""
        # Add previous deployment to history
        if "current_deployment" in self.status:
            self.status["deployment_history"].insert(0, self.status["current_deployment"])
            
            # Keep only the last 10 deployments in the history
            if len(self.status["deployment_history"]) > 10:
                self.status["deployment_history"] = self.status["deployment_history"][:10]
        
        # Set new current deployment
        self.status["current_deployment"] = {
            "model": model,
            "version": version,
            "timestamp": datetime.now().isoformat(),
            "status": status
        }
        
        self._save_status()
    
    def set_fallback_config(self, enabled: bool, fallback_version: Optional[str] = None):
        """Configure fallback settings"""
        self.status["fallback_enabled"] = enabled
        self.status["fallback_version"] = fallback_version
        self._save_status()
    
    def get_current_deployment(self) -> Dict[str, Any]:
        """Get current deployment information"""
        return self.status["current_deployment"]
    
    def get_fallback_config(self) -> Dict[str, Any]:
        """Get fallback configuration"""
        return {
            "enabled": self.status["fallback_enabled"],
            "version": self.status["fallback_version"]
        }
    
    def get_deployment_history(self) -> List[Dict[str, Any]]:
        """Get deployment history"""
        return self.status["deployment_history"]

def log_deployment_event(
    event_type: str,
    model: str,
    version: str,
    message: str,
    metadata: Optional[Dict[str, Any]] = None
) -> None:
    """
    Log a model deployment event
    
    Args:
        event_type: Type of event (deployment, rollback, error, etc.)
        model: Name of the model
        version: Version of the model
        message: Description of the event
        metadata: Additional metadata about the event
    """
    timestamp = datetime.now().isoformat()
    
    # Ensure CSV file exists with headers
    if not os.path.exists(DEPLOYMENT_EVENTS_FILE):
        with open(DEPLOYMENT_EVENTS_FILE, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(["timestamp", "event_type", "model", "version", "message", "metadata"])
    
    # Log the event
    with open(DEPLOYMENT_EVENTS_FILE, 'a', newline='') as f:
        writer = csv.writer(f)
        writer.writerow([
            timestamp,
            event_type,
            model,
            version,
            message,
            json.dumps(metadata or {})
        ])
    
    # Update deployment status if it's a deployment or rollback event
    if event_type in [EVENT_DEPLOYMENT, EVENT_ROLLBACK]:
        status = DeploymentStatus()
        status.update_deployment(model, version)
    
    print(f"Deployment event logged: [{event_type}] {model} v{version} - {message}")

def configure_fallback(enabled: bool, fallback_version: Optional[str] = None) -> None:
    """
    Configure automatic fallback to a previous version
    
    Args:
        enabled: Whether fallback is enabled
        fallback_version: Version to fall back to (if None, will use most recent previous version)
    """
    # Verify version if specified and versioning is available
    if fallback_version and MODEL_VERSIONING_AVAILABLE:
        available_versions = get_model_versions("condition_model")
        if fallback_version not in available_versions:
            print(f"Warning: Version {fallback_version} not found in model registry")
            print(f"Available versions: {', '.join(available_versions) if available_versions else 'None'}")
            print("Proceeding with fallback configuration anyway...")
    
    status = DeploymentStatus()
    status.set_fallback_config(enabled, fallback_version)
    
    # Log the configuration change
    log_deployment_event(
        EVENT_CONFIG_CHANGE,
        "condition_model",
        status.get_current_deployment()["version"],
        f"Fallback {'enabled' if enabled else 'disabled'}" + 
        (f" to version {fallback_version}" if fallback_version else ""),
        {"fallback_enabled": enabled, "fallback_version": fallback_version}
    )
    
    print(f"Fallback configuration updated: enabled={enabled}, version={fallback_version}")

def get_fallback_model_version() -> Optional[str]:
    """
    Get the version to fall back to
    
    Returns:
        str: Version to fall back to, or None if fallback is disabled
    """
    status = DeploymentStatus()
    fallback_config = status.get_fallback_config()
    
    if not fallback_config["enabled"]:
        return None
    
    # If explicit fallback version is specified, use it
    if fallback_config["version"]:
        return fallback_config["version"]
    
    # Otherwise, use the most recent previous version from history
    history = status.get_deployment_history()
    if history:
        return history[0]["version"]
    
    # If no history, return None
    return None

def get_current_deployment_info() -> Dict[str, Any]:
    """
    Get current deployment information
    
    Returns:
        Dict: Current deployment information
    """
    status = DeploymentStatus()
    return status.get_current_deployment()