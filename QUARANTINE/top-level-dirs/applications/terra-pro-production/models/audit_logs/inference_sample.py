#!/usr/bin/env python3

import sys
import os
import datetime
import random
import csv
import json

# Get the project root directory (2 levels up from this script)
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(project_root)

# Function to directly write to the audit log CSV
def log_inference(filename, model_name, model_version, score, confidence=None, 
                  execution_time_ms=None, fallback_used=False, user_id=None, metadata=None):
    """Direct implementation of log_inference to avoid import issues"""
    # Define the audit log path
    audit_dir = os.path.join(project_root, "models", "audit_logs")
    audit_path = os.path.join(audit_dir, "inference_audit_log.csv")
    
    # Create audit directory if it doesn't exist
    os.makedirs(audit_dir, exist_ok=True)
    
    # Get current timestamp
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    # Prepare data for logging
    row = {
        "timestamp": timestamp,
        "filename": filename,
        "model_name": model_name,
        "model_version": model_version,
        "score": score,
        "confidence": confidence if confidence is not None else "",
        "execution_time_ms": execution_time_ms if execution_time_ms is not None else "",
        "fallback_used": str(fallback_used),
        "user_id": user_id if user_id is not None else "",
        "metadata": str(metadata) if metadata is not None else ""
    }
    
    # Check if file exists and create with header if not
    file_exists = os.path.isfile(audit_path)
    
    # Write to CSV
    with open(audit_path, "a", newline="") as f:
        fieldnames = [
            "timestamp", "filename", "model_name", "model_version", 
            "score", "confidence", "execution_time_ms", "fallback_used", 
            "user_id", "metadata"
        ]
        
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        
        if not file_exists:
            writer.writeheader()
        
        writer.writerow(row)

# Create some sample inference data
def create_sample_data(count=20):
    """Create sample inference data for demonstration"""
    print(f"Creating {count} sample inference records...")
    
    versions = ["1.0.0", "2.0.0", "2.1.0"]
    model_names = ["condition_model"]
    
    # Create entries across a few days
    for i in range(count):
        # Randomize creation date within the last week
        days_ago = random.randint(0, 6)
        seconds_ago = random.randint(0, 86400)
        
        # Generate random data
        model_version = random.choice(versions)
        
        # Higher scores more likely in newer versions
        base_score = 2.5
        if model_version == "2.1.0":
            base_score = 3.2
        elif model_version == "2.0.0":
            base_score = 2.8
            
        score = min(5.0, max(1.0, random.normalvariate(base_score, 0.7)))
        
        # Fallbacks more common in newer versions (still being tested)
        fallback_probability = 0.05  # 5% chance by default
        if model_version == "2.1.0":
            fallback_probability = 0.20  # 20% chance for newest version
            
        fallback_used = random.random() < fallback_probability
        
        # Execution time varies by version and fallback
        if fallback_used:
            execution_time = random.uniform(500, 800)  # Fallbacks take longer
        else:
            if model_version == "1.0.0":
                execution_time = random.uniform(150, 300)
            elif model_version == "2.0.0":
                execution_time = random.uniform(200, 400)
            else:
                execution_time = random.uniform(250, 450)  # Newer versions can be more complex
        
        # Generate a realistic filename
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{timestamp}_property_{i+1}.jpg"
        
        # Sometimes include user feedback
        has_feedback = random.random() < 0.3  # 30% of inferences get feedback
        
        metadata = {
            "path": f"uploads/{filename}",
            "image_width": random.randint(800, 3000),
            "image_height": random.randint(600, 2000),
            "source": random.choice(["mobile_app", "web_upload", "api"])
        }
        
        if has_feedback:
            # User score tends to be close to model score but with some variation
            user_score = min(5.0, max(1.0, score + random.normalvariate(0, 0.5)))
            score_difference = user_score - score
            
            metadata["feedback"] = True
            metadata["user_score"] = user_score
            metadata["score_difference"] = round(score_difference, 2)
            metadata["agreement"] = abs(score_difference) <= 0.5
        
        # Log the inference
        log_inference(
            filename=filename,
            model_name=model_names[0],
            model_version=model_version,
            score=round(score, 2),
            confidence=random.uniform(0.7, 0.95) if not fallback_used else random.uniform(0.4, 0.7),
            execution_time_ms=round(execution_time, 2),
            fallback_used=fallback_used,
            metadata=metadata
        )
        
        print(f"Created sample inference: {filename}, score={round(score, 2)}, version={model_version}")
    
    print(f"Successfully created {count} sample inference records!")

if __name__ == "__main__":
    count = 20
    if len(sys.argv) > 1:
        try:
            count = int(sys.argv[1])
        except ValueError:
            pass
            
    create_sample_data(count)
