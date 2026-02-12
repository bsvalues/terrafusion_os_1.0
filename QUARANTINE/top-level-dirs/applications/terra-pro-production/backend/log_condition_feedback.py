"""
TerraFusion Condition Feedback Logger
Logs user feedback on property condition scores to enable model improvement
"""

import csv
import os
from datetime import datetime

# Define the feedback log file
FEEDBACK_LOG = os.path.join(os.getcwd(), "data", "condition_feedback.csv")

# Create data directory if it doesn't exist
os.makedirs(os.path.dirname(FEEDBACK_LOG), exist_ok=True)

# Initialize the log file with headers if it doesn't exist
if not os.path.exists(FEEDBACK_LOG):
    with open(FEEDBACK_LOG, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["timestamp", "filename", "ai_score", "user_score", "model_version"])

def log_condition_feedback(filename, ai_score, user_score, model_version="1.0"):
    """
    Log user feedback about property condition scores
    
    Args:
        filename: The filename of the uploaded image
        ai_score: The condition score predicted by the AI model
        user_score: The corrected score provided by the user
        model_version: Version of the model that generated the AI score
    """
    # Ensure the directory exists
    os.makedirs(os.path.dirname(FEEDBACK_LOG), exist_ok=True)
    
    with open(FEEDBACK_LOG, "a", newline="") as f:
        writer = csv.writer(f)
        writer.writerow([
            datetime.now().isoformat(),
            filename,
            ai_score,
            user_score,
            model_version
        ])
    
    print(f"Feedback logged: AI={ai_score}, User={user_score}, Image={filename}")
    
    # Return stats on agreement rate
    return {
        "logged": True,
        "filename": filename,
        "agreement": ai_score == user_score
    }

def get_feedback_stats():
    """
    Get statistics about the feedback data
    
    Returns:
        dict: Statistics about the feedback data
    """
    if not os.path.exists(FEEDBACK_LOG):
        return {
            "total_feedback": 0,
            "agreement_rate": None,
            "average_difference": None
        }
    
    try:
        with open(FEEDBACK_LOG, "r") as f:
            reader = csv.DictReader(f)
            rows = list(reader)
            
        if not rows:
            return {
                "total_feedback": 0,
                "agreement_rate": None,
                "average_difference": None
            }
            
        total = len(rows)
        agreements = sum(1 for row in rows if float(row["ai_score"]) == float(row["user_score"]))
        
        differences = [abs(float(row["ai_score"]) - float(row["user_score"])) for row in rows]
        avg_diff = sum(differences) / len(differences) if differences else 0
        
        return {
            "total_feedback": total,
            "agreement_rate": agreements / total if total > 0 else None,
            "average_difference": avg_diff
        }
    except Exception as e:
        print(f"Error getting feedback stats: {str(e)}")
        return {
            "total_feedback": 0,
            "agreement_rate": None,
            "average_difference": None,
            "error": str(e)
        }