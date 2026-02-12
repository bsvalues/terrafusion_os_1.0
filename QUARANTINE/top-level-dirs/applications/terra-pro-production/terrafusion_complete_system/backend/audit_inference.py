"""
TerraFusion Model Inference Audit Trail
Logs every model inference with detailed information for tracking and analysis
"""

import os
import csv
import json
import time
import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

# Define the path to store audit logs
AUDIT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models", "audit_logs")
AUDIT_PATH = os.path.join(AUDIT_DIR, "inference_audit_log.csv")

def log_inference(
    filename: str, 
    model_name: str, 
    model_version: str, 
    score: float, 
    confidence: Optional[float] = None, 
    execution_time_ms: Optional[float] = None,
    fallback_used: bool = False,
    user_id: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None
) -> None:
    """
    Log a model inference to the audit trail
    
    Args:
        filename: The filename of the uploaded image
        model_name: Name of the model used (e.g., "condition_model")
        model_version: Version of the model used (e.g., "1.0.0", "2.0.0")
        score: The predicted score
        confidence: Confidence level of the prediction (optional)
        execution_time_ms: Time taken for inference in milliseconds (optional)
        fallback_used: Whether a fallback model was used (optional)
        user_id: Identifier for the user who uploaded the image (optional)
        metadata: Additional information about the inference (optional)
    """
    # Create audit directory if it doesn't exist
    os.makedirs(AUDIT_DIR, exist_ok=True)
    
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
    file_exists = os.path.isfile(AUDIT_PATH)
    
    # Write to CSV
    with open(AUDIT_PATH, "a", newline="") as f:
        fieldnames = [
            "timestamp", "filename", "model_name", "model_version", 
            "score", "confidence", "execution_time_ms", "fallback_used", 
            "user_id", "metadata"
        ]
        
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        
        if not file_exists:
            writer.writeheader()
        
        writer.writerow(row)

def get_inferences(limit: Optional[int] = None) -> List[Dict[str, Any]]:
    """
    Get recent model inferences
    
    Args:
        limit: Maximum number of records to return (default: all)
        
    Returns:
        List: List of inference records
    """
    if not os.path.exists(AUDIT_PATH):
        return []
    
    inferences = []
    with open(AUDIT_PATH, "r", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            inferences.append(row)
    
    # Sort by timestamp (newest first)
    inferences.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    
    # Apply limit if specified
    if limit is not None:
        inferences = inferences[:limit]
    
    return inferences

def get_inference_stats(limit: Optional[int] = None) -> Dict[str, Any]:
    """
    Get statistics about recent model inferences
    
    Args:
        limit: Maximum number of records to analyze (default: all)
        
    Returns:
        Dict: Statistics about model inferences
    """
    # Initialize statistics dictionary
    stats = {
        "total_inferences": 0,
        "average_score": 0.0,
        "fallback_rate": 0.0,
        "version_usage": {},
        "score_distribution": {
            "1.0-1.9": 0,
            "2.0-2.9": 0,
            "3.0-3.9": 0,
            "4.0-5.0": 0
        },
        "execution_times": {
            "average": 0.0,
            "min": 0.0,
            "max": 0.0
        },
        "feedback_stats": {
            "total_feedback": 0,
            "average_difference": 0.0,
            "agreement_rate": 0.0
        }
    }
    
    # Get inferences
    inferences = get_inferences(limit)
    
    if not inferences:
        return stats
    
    # Calculate basic statistics
    stats["total_inferences"] = len(inferences)
    
    # Calculate average score
    total_score = 0
    score_counts = {
        "1.0-1.9": 0,
        "2.0-2.9": 0,
        "3.0-3.9": 0,
        "4.0-5.0": 0
    }
    
    # Track execution times
    execution_times = []
    
    # Track feedback
    feedback_count = 0
    total_difference = 0.0
    close_match_count = 0
    
    for inf in inferences:
        # Score stats
        if "score" in inf and inf["score"]:
            try:
                score = float(inf["score"])
                total_score += score
                
                # Count for distribution
                if 1.0 <= score < 2.0:
                    score_counts["1.0-1.9"] += 1
                elif 2.0 <= score < 3.0:
                    score_counts["2.0-2.9"] += 1
                elif 3.0 <= score < 4.0:
                    score_counts["3.0-3.9"] += 1
                elif 4.0 <= score <= 5.0:
                    score_counts["4.0-5.0"] += 1
            except (ValueError, TypeError):
                pass
        
        # Execution time stats
        if "execution_time_ms" in inf and inf["execution_time_ms"]:
            try:
                exec_time = float(inf["execution_time_ms"])
                execution_times.append(exec_time)
            except (ValueError, TypeError):
                pass
        
        # Version usage
        if "model_version" in inf and inf["model_version"]:
            version = inf["model_version"]
            if version in stats["version_usage"]:
                stats["version_usage"][version] += 1
            else:
                stats["version_usage"][version] = 1
        
        # Fallback stats
        if "fallback_used" in inf and inf["fallback_used"].lower() == "true":
            stats["fallback_count"] = stats.get("fallback_count", 0) + 1
        
        # Feedback stats
        if "metadata" in inf and inf["metadata"]:
            try:
                metadata_str = inf["metadata"]
                
                # Check if this is a feedback entry
                if "feedback" in metadata_str.lower() and "true" in metadata_str.lower():
                    feedback_count += 1
                    
                    # Try to extract score difference
                    if "score_difference" in metadata_str:
                        try:
                            # Try to parse as JSON first
                            try:
                                metadata = json.loads(metadata_str.replace("'", "\""))
                                if "score_difference" in metadata:
                                    diff = float(metadata["score_difference"])
                                    total_difference += abs(diff)
                                    
                                    # Check if this is a close match (within 0.5 points)
                                    if abs(diff) <= 0.5:
                                        close_match_count += 1
                            except:
                                # Try regex-based extraction
                                import re
                                match = re.search(r"'score_difference':\s*([-\d\.]+)", metadata_str)
                                if match:
                                    diff = float(match.group(1))
                                    total_difference += abs(diff)
                                    
                                    # Check if this is a close match (within 0.5 points)
                                    if abs(diff) <= 0.5:
                                        close_match_count += 1
                        except:
                            pass
            except:
                pass
    
    # Calculate average score
    if stats["total_inferences"] > 0:
        stats["average_score"] = total_score / stats["total_inferences"]
    
    # Calculate fallback rate
    if stats["total_inferences"] > 0:
        stats["fallback_rate"] = (stats.get("fallback_count", 0) / stats["total_inferences"]) * 100
    
    # Calculate execution time stats
    if execution_times:
        stats["execution_times"]["average"] = sum(execution_times) / len(execution_times)
        stats["execution_times"]["min"] = min(execution_times)
        stats["execution_times"]["max"] = max(execution_times)
    
    # Calculate feedback stats
    if feedback_count > 0:
        stats["feedback_stats"]["total_feedback"] = feedback_count
        stats["feedback_stats"]["average_difference"] = total_difference / feedback_count
        stats["feedback_stats"]["agreement_rate"] = (close_match_count / feedback_count) * 100
    
    # Update score distribution
    stats["score_distribution"] = score_counts
    
    return stats

def get_version_performance() -> Dict[str, Dict[str, Any]]:
    """
    Get performance statistics grouped by model version
    
    Returns:
        Dict: Performance statistics for each model version
    """
    if not os.path.exists(AUDIT_PATH):
        return {}
    
    # Read inferences
    inferences = get_inferences()
    
    # Group by version
    version_stats = {}
    
    for inf in inferences:
        version = inf.get("model_version", "unknown")
        
        if version not in version_stats:
            version_stats[version] = {
                "count": 0,
                "total_score": 0,
                "scores": [],
                "execution_times": [],
                "fallback_count": 0
            }
        
        version_stats[version]["count"] += 1
        
        # Add score
        if "score" in inf and inf["score"]:
            try:
                score = float(inf["score"])
                version_stats[version]["total_score"] += score
                version_stats[version]["scores"].append(score)
            except (ValueError, TypeError):
                pass
        
        # Add execution time
        if "execution_time_ms" in inf and inf["execution_time_ms"]:
            try:
                exec_time = float(inf["execution_time_ms"])
                version_stats[version]["execution_times"].append(exec_time)
            except (ValueError, TypeError):
                pass
        
        # Track fallbacks
        if "fallback_used" in inf and inf["fallback_used"].lower() == "true":
            version_stats[version]["fallback_count"] += 1
    
    # Calculate statistics for each version
    for version, stats in version_stats.items():
        count = stats["count"]
        
        if count > 0:
            # Calculate average score
            if stats["scores"]:
                stats["avg_score"] = stats["total_score"] / len(stats["scores"])
                stats["min_score"] = min(stats["scores"])
                stats["max_score"] = max(stats["scores"])
                
                # Calculate score standard deviation
                if len(stats["scores"]) > 1:
                    mean = stats["avg_score"]
                    variance = sum((x - mean) ** 2 for x in stats["scores"]) / len(stats["scores"])
                    stats["score_std_dev"] = variance ** 0.5
                else:
                    stats["score_std_dev"] = 0
            
            # Calculate execution time statistics
            if stats["execution_times"]:
                stats["avg_execution_time"] = sum(stats["execution_times"]) / len(stats["execution_times"])
                stats["min_execution_time"] = min(stats["execution_times"])
                stats["max_execution_time"] = max(stats["execution_times"])
                
                # Calculate execution time standard deviation
                if len(stats["execution_times"]) > 1:
                    mean = stats["avg_execution_time"]
                    variance = sum((x - mean) ** 2 for x in stats["execution_times"]) / len(stats["execution_times"])
                    stats["execution_time_std_dev"] = variance ** 0.5
                else:
                    stats["execution_time_std_dev"] = 0
            
            # Calculate fallback rate
            stats["fallback_rate"] = (stats["fallback_count"] / count) * 100
        
        # Clean up temporary data
        stats.pop("total_score", None)
        stats.pop("scores", None)
        stats.pop("execution_times", None)
    
    return version_stats

def get_scores_by_date() -> Dict[str, Tuple[float, int]]:
    """
    Get average scores grouped by date
    
    Returns:
        Dict: Mapping of dates to (average_score, count) tuples
    """
    if not os.path.exists(AUDIT_PATH):
        return {}
    
    # Read inferences
    inferences = get_inferences()
    
    # Group by date
    date_scores = {}
    
    for inf in inferences:
        if "timestamp" in inf and inf["timestamp"]:
            try:
                # Extract date part only
                date_str = inf["timestamp"].split()[0]
                
                if date_str not in date_scores:
                    date_scores[date_str] = {"total": 0, "count": 0}
                
                # Add score
                if "score" in inf and inf["score"]:
                    try:
                        score = float(inf["score"])
                        date_scores[date_str]["total"] += score
                        date_scores[date_str]["count"] += 1
                    except (ValueError, TypeError):
                        pass
            except:
                pass
    
    # Calculate averages
    result = {}
    for date_str, data in date_scores.items():
        if data["count"] > 0:
            avg_score = data["total"] / data["count"]
            result[date_str] = (avg_score, data["count"])
    
    return result

def clear_audit_log(backup: bool = True) -> bool:
    """
    Clear the audit log (with option to backup)
    
    Args:
        backup: Whether to create a backup of the log before clearing (default: True)
        
    Returns:
        bool: True if successful, False otherwise
    """
    if not os.path.exists(AUDIT_PATH):
        return True  # Nothing to clear
    
    try:
        # Create backup if requested
        if backup:
            timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_path = f"{AUDIT_PATH}.{timestamp}.backup"
            with open(AUDIT_PATH, "r") as src, open(backup_path, "w") as dst:
                dst.write(src.read())
        
        # Clear the log (but keep the header)
        with open(AUDIT_PATH, "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow([
                "timestamp", "filename", "model_name", "model_version", 
                "score", "confidence", "execution_time_ms", "fallback_used", 
                "user_id", "metadata"
            ])
        
        return True
    except Exception as e:
        print(f"Error clearing audit log: {str(e)}")
        return False