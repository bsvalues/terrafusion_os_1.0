#!/usr/bin/env python3
"""
TerraFusion Model Registry Initializer
Script to initialize the model registry with v1 and v2 models for testing

Usage:
  python init_model_registry.py
"""

import os
import sys
import json
from datetime import datetime

# Add parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Ensure model directories exist
models_dir = os.path.join(os.getcwd(), "models")
registry_dir = os.path.join(models_dir, "registry")
archive_dir = os.path.join(models_dir, "archive")

# Create directories if they don't exist
for dir_path in [models_dir, registry_dir, archive_dir]:
    if not os.path.exists(dir_path):
        os.makedirs(dir_path)

# Create placeholder model files for v1 and v2
v1_model_path = os.path.join(archive_dir, "condition_model_v1.0.0.pth")
v2_model_path = os.path.join(archive_dir, "condition_model_v2.0.0.pth")

# Check if placeholder files already exist
if not os.path.exists(v1_model_path):
    with open(v1_model_path, 'w') as f:
        f.write("This is a placeholder for v1.0.0 model weights")
    print(f"Created placeholder v1 model at {v1_model_path}")

if not os.path.exists(v2_model_path):
    with open(v2_model_path, 'w') as f:
        f.write("This is a placeholder for v2.0.0 model weights")
    print(f"Created placeholder v2 model at {v2_model_path}")

# Create registry metadata file
registry_metadata_path = os.path.join(registry_dir, "registry.json")

registry_data = {
    "model_name": "condition_model",
    "current_version": "2.0.0",
    "versions": {
        "1.0.0": {
            "path": v1_model_path,
            "created_at": datetime.now().isoformat(),
            "description": "Initial model trained on synthetic data",
            "metrics": {
                "accuracy": 0.78,
                "precision": 0.76,
                "recall": 0.75,
                "f1_score": 0.75
            }
        },
        "2.0.0": {
            "path": v2_model_path,
            "created_at": datetime.now().isoformat(),
            "description": "Improved model trained on user feedback data",
            "metrics": {
                "accuracy": 0.85,
                "precision": 0.84,
                "recall": 0.82,
                "f1_score": 0.83
            }
        }
    },
    "last_updated": datetime.now().isoformat()
}

with open(registry_metadata_path, 'w') as f:
    json.dump(registry_data, f, indent=2)

print(f"Created registry metadata at {registry_metadata_path}")

# Create symbolic link for current version
current_model_path = os.path.join(models_dir, "condition_model.pth")
if os.path.exists(current_model_path):
    os.remove(current_model_path)

# Create a symlink on Unix or a copy on Windows
try:
    os.symlink(v2_model_path, current_model_path)
    print(f"Created symbolic link for current model at {current_model_path}")
except AttributeError:
    # Windows may not support symlinks
    import shutil
    shutil.copy2(v2_model_path, current_model_path)
    print(f"Created copy of current model at {current_model_path}")
except Exception as e:
    print(f"Error creating link to current model: {str(e)}")
    # Fallback to copy
    import shutil
    shutil.copy2(v2_model_path, current_model_path)
    print(f"Created copy of current model at {current_model_path}")

print("\nModel registry initialized successfully with v1 and v2 models!")
print("You can now enable fallback with: python scripts/enable_fallback.py --enable --version 1.0.0")