"""
TerraFusion Model Retraining Log Generator
Creates a template CSV file for tracking model retraining history
"""
import os
import csv
import datetime
from pathlib import Path

def create_retrain_log(output_path=None):
    """
    Create a template retrain log CSV file with headers and example entries
    
    Args:
        output_path (str): Path to save the retrain log (optional)
        
    Returns:
        str: Path to the created retrain log file
    """
    # Determine output path
    if output_path is None:
        # Create data directory if it doesn't exist
        data_dir = Path("data")
        data_dir.mkdir(exist_ok=True)
        output_path = data_dir / "retrain_log.csv"
    
    # Get current time for sample entries
    current_time = datetime.datetime.now()
    time_str_1 = (current_time - datetime.timedelta(days=30)).strftime("%Y-%m-%d %H:%M:%S")
    time_str_2 = (current_time - datetime.timedelta(days=15)).strftime("%Y-%m-%d %H:%M:%S")
    time_str_3 = current_time.strftime("%Y-%m-%d %H:%M:%S")
    
    # Define headers and sample data
    headers = [
        "timestamp", 
        "model_version", 
        "model_architecture",
        "train_samples", 
        "validation_accuracy", 
        "training_time_seconds",
        "condition_mse",
        "condition_rmse", 
        "condition_mae",
        "retrain_trigger", 
        "model_path"
    ]
    
    sample_entries = [
        # Initial model
        [
            time_str_1,
            "1.0.0",
            "MobileNetV2",
            100,
            0.85,
            120,
            0.71,
            0.84,
            0.65,
            "initial_training",
            "models/condition_model_v1.pth"
        ],
        # Second model version with more data
        [
            time_str_2,
            "2.0.0",
            "MobileNetV2",
            150,
            0.89,
            135,
            0.58,
            0.76,
            0.52,
            "additional_data",
            "models/condition_model_v2.pth"
        ],
        # Latest model version with architecture improvements
        [
            time_str_3,
            "2.1.0",
            "MobileNetV2-Enhanced",
            175,
            0.92,
            155,
            0.45,
            0.67,
            0.41,
            "drift_detected",
            "models/condition_model_v2.1.pth"
        ]
    ]
    
    # Write to CSV file
    with open(output_path, 'w', newline='') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(headers)
        writer.writerows(sample_entries)
    
    print(f"Retrain log template created at: {output_path}")
    return str(output_path)

if __name__ == "__main__":
    create_retrain_log()