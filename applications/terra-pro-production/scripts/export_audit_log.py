#!/usr/bin/env python3
"""
TerraFusion Model Inference Audit Log Exporter
Script to export and analyze model inference audit logs

Usage:
  python export_audit_log.py --format csv --output audit_export.csv
  python export_audit_log.py --format json --output audit_export.json
  python export_audit_log.py --stats --days 7 --output stats_report.json
"""

import os
import sys
import csv
import json
import argparse
import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional

# Add parent directory to path so we can import backend modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import audit inference path
try:
    from backend.audit_inference import AUDIT_PATH, get_inference_stats
except ImportError:
    # Define default path if module can't be imported
    AUDIT_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 
                             "models", "audit_logs", "inference_audit_log.csv")
    
    def get_inference_stats(limit: int = 100) -> Dict[str, Any]:
        """Fallback function if the actual one can't be imported"""
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
            }
        }
        
        if not os.path.exists(AUDIT_PATH):
            # Create empty audit log if it doesn't exist
            os.makedirs(os.path.dirname(AUDIT_PATH), exist_ok=True)
            with open(AUDIT_PATH, "w", newline="") as f:
                writer = csv.writer(f)
                writer.writerow([
                    "timestamp", "filename", "model_name", "model_version", 
                    "score", "confidence", "execution_time_ms", "fallback_used", 
                    "user_id", "metadata"
                ])
            print(f"Created inference audit log: {AUDIT_PATH}")
            return stats
        
        # Read from CSV and calculate basic stats
        inferences = []
        with open(AUDIT_PATH, "r", newline="") as f:
            reader = csv.DictReader(f)
            for row in reader:
                inferences.append(row)
        
        if not inferences:
            return stats
        
        # Calculate statistics
        stats["total_inferences"] = len(inferences)
        
        # Calculate average score
        total_score = 0
        score_counts = {
            "1.0-1.9": 0,
            "2.0-2.9": 0,
            "3.0-3.9": 0,
            "4.0-5.0": 0
        }
        
        for inf in inferences:
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
        
        if stats["total_inferences"] > 0:
            stats["average_score"] = total_score / stats["total_inferences"]
        
        # Calculate fallback rate
        fallback_count = 0
        for inf in inferences:
            if "fallback_used" in inf and inf["fallback_used"] and inf["fallback_used"].lower() == "true":
                fallback_count += 1
        
        if stats["total_inferences"] > 0:
            stats["fallback_rate"] = (fallback_count / stats["total_inferences"]) * 100
        
        # Count version usage
        version_counts = {}
        for inf in inferences:
            if "model_version" in inf and inf["model_version"]:
                version = inf["model_version"]
                if version in version_counts:
                    version_counts[version] += 1
                else:
                    version_counts[version] = 1
        
        stats["version_usage"] = version_counts
        stats["score_distribution"] = score_counts
        
        return stats

def filter_by_date(inferences: List[Dict[str, Any]], days: Optional[int] = None) -> List[Dict[str, Any]]:
    """Filter inferences by date range
    
    Args:
        inferences: List of inference records
        days: Number of days to include (None for all)
        
    Returns:
        List of filtered inference records
    """
    if days is None:
        return inferences
    
    cutoff_date = datetime.datetime.now() - datetime.timedelta(days=days)
    cutoff_str = cutoff_date.strftime("%Y-%m-%d %H:%M:%S")
    
    return [inf for inf in inferences if inf.get("timestamp", "") >= cutoff_str]

def read_audit_log(days: Optional[int] = None) -> List[Dict[str, Any]]:
    """Read the audit log file and return inferences
    
    Args:
        days: Number of days to include (None for all)
        
    Returns:
        List of inference records
    """
    if not os.path.exists(AUDIT_PATH):
        # Create empty audit log if it doesn't exist
        os.makedirs(os.path.dirname(AUDIT_PATH), exist_ok=True)
        with open(AUDIT_PATH, "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow([
                "timestamp", "filename", "model_name", "model_version", 
                "score", "confidence", "execution_time_ms", "fallback_used", 
                "user_id", "metadata"
            ])
        print(f"Created inference audit log: {AUDIT_PATH}")
        return []
    
    inferences = []
    with open(AUDIT_PATH, "r", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            inferences.append(row)
    
    return filter_by_date(inferences, days)

def export_csv(output_path: str, days: Optional[int] = None) -> None:
    """Export audit log to CSV format
    
    Args:
        output_path: Path to save the CSV file
        days: Number of days to include (None for all)
    """
    inferences = read_audit_log(days)
    
    if not inferences:
        print("No inference records found for export")
        with open(output_path, "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow([
                "timestamp", "filename", "model_name", "model_version", 
                "score", "confidence", "execution_time_ms", "fallback_used", 
                "user_id", "metadata"
            ])
        print(f"Created empty CSV export: {output_path}")
        return
    
    # Create directory if it doesn't exist
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    with open(output_path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=inferences[0].keys())
        writer.writeheader()
        writer.writerows(inferences)
    
    record_count = len(inferences)
    print(f"Exported {record_count} inference records to {output_path}")

def export_json(output_path: str, days: Optional[int] = None) -> None:
    """Export audit log to JSON format
    
    Args:
        output_path: Path to save the JSON file
        days: Number of days to include (None for all)
    """
    inferences = read_audit_log(days)
    
    # Create directory if it doesn't exist
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    with open(output_path, "w") as f:
        json.dump(inferences, f, indent=2)
    
    record_count = len(inferences)
    print(f"Exported {record_count} inference records to {output_path}")

def export_stats(output_path: str, days: Optional[int] = None) -> None:
    """Export statistics about the audit log
    
    Args:
        output_path: Path to save the statistics file
        days: Number of days to include (None for all)
    """
    # Get statistics directly from the module if possible
    # Otherwise calculate them here
    stats = get_inference_stats(limit=None)
    
    # Create directory if it doesn't exist
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    with open(output_path, "w") as f:
        json.dump(stats, f, indent=2)
    
    print(f"Exported statistics to {output_path}")
    
    # Print summary to console
    print("\nSummary Statistics:")
    print(f"Total inferences: {stats['total_inferences']}")
    print(f"Average score: {stats['average_score']:.1f}")
    print(f"Fallback rate: {stats['fallback_rate']:.1f}%")
    
    print("\nVersion usage:")
    for version, count in stats.get("version_usage", {}).items():
        print(f"  {version}: {count} inferences")
    
    print("\nScore distribution:")
    for score_range, count in stats.get("score_distribution", {}).items():
        print(f"  {score_range}: {count} inferences")

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description="Export and analyze TerraFusion model inference audit logs"
    )
    
    parser.add_argument(
        "--format", 
        choices=["csv", "json"], 
        help="Export format (csv or json)"
    )
    
    parser.add_argument(
        "--stats", 
        action="store_true", 
        help="Export statistics instead of raw data"
    )
    
    parser.add_argument(
        "--days", 
        type=int, 
        help="Number of days to include in export (default: all)"
    )
    
    parser.add_argument(
        "--output", 
        required=True, 
        help="Output file path"
    )
    
    args = parser.parse_args()
    
    if args.stats:
        export_stats(args.output, args.days)
    elif args.format == "csv":
        export_csv(args.output, args.days)
    elif args.format == "json":
        export_json(args.output, args.days)
    else:
        print("Error: Must specify either --stats or --format")
        parser.print_help()
        sys.exit(1)

if __name__ == "__main__":
    main()