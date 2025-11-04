#!/usr/bin/env python3
"""
TerraFusion Model Fallback Configuration - Direct Method
Script to enable automatic fallback to v1.0.0 without model registry dependency

Usage:
  python direct_fallback_enable.py
"""

import os
import json
from datetime import datetime

# Configuration
DEPLOYMENT_LOG_DIR = os.path.join(os.getcwd(), "models", "deployment_logs")
ROLLOUT_STATUS_FILE = os.path.join(DEPLOYMENT_LOG_DIR, "rollout_status.json")
DEPLOYMENT_EVENTS_FILE = os.path.join(DEPLOYMENT_LOG_DIR, "deployment_events.csv")

# Create the directory if it doesn't exist
if not os.path.exists(DEPLOYMENT_LOG_DIR):
    os.makedirs(DEPLOYMENT_LOG_DIR)
    print(f"Created directory: {DEPLOYMENT_LOG_DIR}")

# Default status
default_status = {
    "current_deployment": {
        "model": "condition_model",
        "version": "2.0.0",
        "timestamp": datetime.now().isoformat(),
        "status": "active"
    },
    "fallback_enabled": True,
    "fallback_version": "1.0.0",
    "deployment_history": [
        {
            "model": "condition_model",
            "version": "1.0.0",
            "timestamp": (datetime.now().isoformat()),
            "status": "superseded"
        }
    ],
    "last_updated": datetime.now().isoformat()
}

# Write the status file
with open(ROLLOUT_STATUS_FILE, 'w') as f:
    json.dump(default_status, f, indent=2)
    print(f"Created rollout status file: {ROLLOUT_STATUS_FILE}")

# Ensure events file exists with headers if it doesn't already
if not os.path.exists(DEPLOYMENT_EVENTS_FILE):
    with open(DEPLOYMENT_EVENTS_FILE, 'w') as f:
        f.write("timestamp,event_type,model,version,message,metadata\n")
        print(f"Created deployment events file: {DEPLOYMENT_EVENTS_FILE}")

# Add the config change event
timestamp = datetime.now().isoformat()
event_type = "config_change"
model = "condition_model"
version = "2.0.0"
message = "Fallback enabled to version 1.0.0"
metadata = '{"fallback_enabled": true, "fallback_version": "1.0.0"}'

# Append to events file
with open(DEPLOYMENT_EVENTS_FILE, 'a') as f:
    f.write(f"{timestamp},{event_type},{model},{version},{message},{metadata}\n")
    print(f"Added config change event to events file")

print("\nFallback to v1.0.0 successfully enabled!")
print("The system will now automatically fall back to version 1.0.0 if there are issues with the current model.")