#!/usr/bin/env python3
"""
Generate sample feedback data for demonstrating drift visualization
"""

import os
import sys
import csv
import random
import datetime
from pathlib import Path

# Add project root to path
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(project_root)

# Set the feedback file path
FEEDBACK_PATH = os.path.join(project_root, "models", "feedback", "condition_feedback.csv")

def ensure_feedback_dir():
    """Ensure the feedback directory exists and create file with header if needed"""
    os.makedirs(os.path.dirname(FEEDBACK_PATH), exist_ok=True)
    
    # Create file with header if it doesn't exist
    if not os.path.exists(FEEDBACK_PATH):
        with open(FEEDBACK_PATH, "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow([
                "timestamp", "filename", "ai_score", "user_score", 
                "difference", "model_version", "abs_difference"
            ])
        print(f"Created feedback log: {FEEDBACK_PATH}")

def generate_sample_feedback(count=50, days=30):
    """Generate sample feedback data with drift patterns
    
    Args:
        count: Number of feedback records to generate
        days: Number of days to spread the feedback over
    """
    ensure_feedback_dir()
    
    # Define model versions and their usage periods
    model_versions = {
        "1.0.0": {"start_day": days, "end_day": days * 0.7},  # Older records
        "2.0.0": {"start_day": days * 0.7, "end_day": days * 0.3},  # Middle period
        "2.1.0": {"start_day": days * 0.3, "end_day": 0}  # Recent records
    }
    
    # Model bias patterns (will create drift)
    model_biases = {
        "1.0.0": 0.3,      # v1.0.0 scores properties 0.3 points LOWER than users (conservative)
        "2.0.0": -0.2,     # v2.0.0 scores properties 0.2 points HIGHER than users (optimistic)
        "2.1.0": -0.5      # v2.1.0 scores properties 0.5 points HIGHER than users (very optimistic)
    }
    
    # Generate sample data
    feedback_data = []
    
    for i in range(count):
        # Randomly select a day within the range (weighted toward recent days)
        day_ago = random.betavariate(1, 2) * days  # Beta distribution to weight toward recent days
        
        # Determine which model version was active at this time
        model_version = None
        for version, period in model_versions.items():
            if period["end_day"] <= day_ago <= period["start_day"]:
                model_version = version
                break
        
        if model_version is None:
            model_version = "2.1.0"  # Default to latest if no match
        
        # Create timestamp
        timestamp = (datetime.datetime.now() - datetime.timedelta(days=day_ago)).strftime("%Y-%m-%d %H:%M:%S")
        
        # Generate filename
        time_str = timestamp.replace(" ", "_").replace(":", "").replace("-", "")
        filename = f"{time_str}_property_{i+1}.jpg"
        
        # Generate a random true condition (what the user would perceive)
        true_condition = round(random.uniform(1.0, 5.0), 1)
        
        # Apply model bias plus some random noise to get the AI's prediction
        model_bias = model_biases[model_version]
        noise = random.normalvariate(0, 0.2)  # Random noise with std dev of 0.2
        ai_score = max(1.0, min(5.0, true_condition - model_bias + noise))
        ai_score = round(ai_score, 1)
        
        # The user's score is the true condition plus a small perception error
        perception_error = random.normalvariate(0, 0.1)  # User perception error
        user_score = max(1.0, min(5.0, true_condition + perception_error))
        user_score = round(user_score, 1)
        
        # Calculate difference
        difference = user_score - ai_score
        abs_difference = abs(difference)
        
        # Add to data
        feedback_data.append([
            timestamp,
            filename,
            ai_score,
            user_score,
            difference,
            model_version,
            abs_difference
        ])
    
    # Sort by timestamp
    feedback_data.sort(key=lambda x: x[0])
    
    # Write to CSV
    with open(FEEDBACK_PATH, "a", newline="") as f:
        writer = csv.writer(f)
        for row in feedback_data:
            writer.writerow(row)
    
    print(f"Generated {count} sample feedback records spanning {days} days")
    print(f"Data written to {FEEDBACK_PATH}")
    
    # Display drift pattern
    print("\nDrift patterns embedded in the data:")
    for version, bias in model_biases.items():
        direction = "conservative (scores lower than users)" if bias > 0 else "optimistic (scores higher than users)"
        print(f"  • Model v{version}: {abs(bias):.1f} points {direction}")

def calculate_drift():
    """Calculate and visualize drift from the feedback data"""
    try:
        # Import from backend
        from backend.drift_monitor import calculate_daily_drift, visualize_drift, generate_drift_report
        
        # Calculate drift metrics
        print("Calculating drift metrics...")
        if calculate_daily_drift():
            print("Drift metrics calculated successfully")
        else:
            print("Failed to calculate drift metrics")
            return False
        
        # Visualize drift
        print("Generating drift visualization...")
        vis_path = visualize_drift()
        if vis_path:
            print(f"Drift visualization saved to: {vis_path}")
        else:
            print("Failed to generate drift visualization")
        
        # Generate report
        print("Generating drift report...")
        report_path = generate_drift_report()
        if report_path:
            print(f"Drift report saved to: {report_path}")
        else:
            print("Failed to generate drift report")
        
        return True
    except Exception as e:
        print(f"Error calculating drift: {str(e)}")
        return False

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Generate sample feedback data and visualize drift")
    parser.add_argument("--count", type=int, default=100, help="Number of feedback records to generate")
    parser.add_argument("--days", type=int, default=30, help="Number of days to spread the feedback over")
    parser.add_argument("--calculate", action="store_true", help="Calculate drift after generating data")
    
    args = parser.parse_args()
    
    # Generate sample data
    generate_sample_feedback(args.count, args.days)
    
    # Calculate drift if requested
    if args.calculate:
        calculate_drift()