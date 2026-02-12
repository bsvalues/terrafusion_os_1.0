"""
TerraFusion Model Drift Monitor
Tracks and analyzes the difference between model predictions and user corrections
"""

import os
import csv
import json
import datetime
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

# Define the path to store drift logs
DRIFT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models", "drift_logs")
DRIFT_PATH = os.path.join(DRIFT_DIR, "condition_drift_log.csv")
FEEDBACK_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models", "feedback", "condition_feedback.csv")

def ensure_feedback_dir():
    """Ensure the feedback directory exists"""
    feedback_dir = os.path.dirname(FEEDBACK_PATH)
    os.makedirs(feedback_dir, exist_ok=True)
    
    # Create feedback file with header if it doesn't exist
    if not os.path.exists(FEEDBACK_PATH):
        with open(FEEDBACK_PATH, "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow([
                "timestamp", "filename", "ai_score", "user_score", 
                "difference", "model_version", "abs_difference"
            ])
        print(f"Created feedback log: {FEEDBACK_PATH}")

def ensure_drift_dir():
    """Ensure the drift directory exists"""
    os.makedirs(DRIFT_DIR, exist_ok=True)
    
    # Create drift file with header if it doesn't exist
    if not os.path.exists(DRIFT_PATH):
        with open(DRIFT_PATH, "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow([
                "date", "model_version", "mean_drift", "median_drift", 
                "std_drift", "sample_count", "max_drift", "min_drift",
                "drift_direction"
            ])
        print(f"Created drift log: {DRIFT_PATH}")

def log_feedback(filename: str, ai_score: float, user_score: float, model_version: str) -> Dict[str, Any]:
    """
    Log user feedback about model predictions
    
    Args:
        filename: The filename of the uploaded image
        ai_score: The score predicted by the model
        user_score: The score provided by the user
        model_version: The version of the model used
        
    Returns:
        Dict with logging confirmation and agreement status
    """
    # Ensure the feedback directory exists
    ensure_feedback_dir()
    
    # Calculate difference
    difference = user_score - ai_score
    abs_difference = abs(difference)
    
    # Get current timestamp
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    # Write to CSV
    with open(FEEDBACK_PATH, "a", newline="") as f:
        writer = csv.writer(f)
        writer.writerow([
            timestamp, 
            filename, 
            ai_score, 
            user_score, 
            difference,
            model_version,
            abs_difference
        ])
    
    # Determine if there is agreement (within 0.5 points)
    agreement = abs_difference <= 0.5
    
    return {
        "logged": True,
        "agreement": agreement,
        "difference": difference,
        "abs_difference": abs_difference
    }

def calculate_daily_drift() -> bool:
    """
    Calculate daily drift metrics from feedback data
    
    Returns:
        bool: True if successful, False otherwise
    """
    # Ensure directories exist
    ensure_feedback_dir()
    ensure_drift_dir()
    
    try:
        # Check if feedback data exists
        if not os.path.exists(FEEDBACK_PATH):
            print(f"Feedback file not found: {FEEDBACK_PATH}")
            return False
        
        # Read feedback data
        feedback_df = pd.read_csv(FEEDBACK_PATH)
        
        # If empty, return early
        if len(feedback_df) == 0:
            print("No feedback data available")
            return False
        
        # Extract date from timestamp
        feedback_df['date'] = pd.to_datetime(feedback_df['timestamp']).dt.date
        
        # Group by date and model_version
        grouped = feedback_df.groupby(['date', 'model_version'])
        
        # Results list
        drift_records = []
        
        # Calculate drift metrics
        for (date, model_version), group in grouped:
            # Filter out invalid values
            valid_group = group.dropna(subset=['difference'])
            if len(valid_group) == 0:
                continue
                
            # Calculate metrics
            mean_drift = valid_group['difference'].mean()
            median_drift = valid_group['difference'].median()
            std_drift = valid_group['difference'].std()
            sample_count = len(valid_group)
            max_drift = valid_group['difference'].max()
            min_drift = valid_group['difference'].min()
            
            # Determine drift direction
            # Positive means users are rating higher than AI (AI is conservative)
            # Negative means users are rating lower than AI (AI is optimistic)
            if mean_drift > 0.1:
                drift_direction = "conservative"
            elif mean_drift < -0.1:
                drift_direction = "optimistic"
            else:
                drift_direction = "neutral"
            
            # Append to results
            drift_records.append({
                "date": date,
                "model_version": model_version,
                "mean_drift": mean_drift,
                "median_drift": median_drift,
                "std_drift": std_drift,
                "sample_count": sample_count,
                "max_drift": max_drift,
                "min_drift": min_drift,
                "drift_direction": drift_direction
            })
        
        # Create DataFrame from records
        drift_df = pd.DataFrame(drift_records)
        
        # Save to CSV
        if len(drift_df) > 0:
            # Write to CSV, replacing existing file
            drift_df.to_csv(DRIFT_PATH, index=False)
            print(f"Updated drift log: {DRIFT_PATH}")
            return True
        else:
            print("No drift records to write")
            return False
            
    except Exception as e:
        print(f"Error calculating drift: {str(e)}")
        return False

def get_drift_trends(days: int = 30) -> Dict[str, Any]:
    """
    Get drift trends over the specified number of days
    
    Args:
        days: Number of days to analyze (default: 30)
        
    Returns:
        Dict containing drift trend data
    """
    ensure_drift_dir()
    
    try:
        # Check if drift data exists
        if not os.path.exists(DRIFT_PATH):
            print(f"Drift file not found: {DRIFT_PATH}")
            return {"error": "Drift data not available"}
        
        # Read drift data
        drift_df = pd.read_csv(DRIFT_PATH)
        
        # If empty, return early
        if len(drift_df) == 0:
            return {"error": "No drift data available"}
        
        # Convert date strings to datetime
        drift_df['date'] = pd.to_datetime(drift_df['date'])
        
        # Filter to recent days - making sure to convert both to compatible types
        cutoff_date = pd.to_datetime(datetime.datetime.now().date() - datetime.timedelta(days=days))
        recent_df = drift_df[drift_df['date'] >= cutoff_date]
        
        # If no recent data, return all data
        if len(recent_df) == 0:
            recent_df = drift_df
        
        # Group by model_version
        version_stats = {}
        for model_version, group in recent_df.groupby('model_version'):
            version_stats[model_version] = {
                "mean_drift": group['mean_drift'].mean(),
                "sample_count": group['sample_count'].sum(),
                "drift_direction_counts": group['drift_direction'].value_counts().to_dict(),
                "trends": {
                    "dates": group['date'].dt.strftime("%Y-%m-%d").tolist(),
                    "mean_drifts": group['mean_drift'].tolist(),
                    "sample_counts": group['sample_count'].tolist()
                }
            }
        
        # Calculate overall trends
        overall_stats = {
            "mean_drift": recent_df['mean_drift'].mean(),
            "total_samples": recent_df['sample_count'].sum(),
            "drift_direction_counts": recent_df['drift_direction'].value_counts().to_dict(),
            "trends": {
                "dates": recent_df['date'].dt.strftime("%Y-%m-%d").unique().tolist(),
            }
        }
        
        # Get daily overall mean drift
        daily_drift = []
        for date, group in recent_df.groupby('date'):
            weighted_mean = np.average(
                group['mean_drift'], 
                weights=group['sample_count']
            )
            daily_drift.append({
                "date": date.strftime("%Y-%m-%d"),
                "mean_drift": weighted_mean,
                "sample_count": group['sample_count'].sum()
            })
        
        # Sort by date
        daily_drift.sort(key=lambda x: x["date"])
        
        # Extract trends
        overall_stats["trends"]["mean_drifts"] = [d["mean_drift"] for d in daily_drift]
        overall_stats["trends"]["sample_counts"] = [d["sample_count"] for d in daily_drift]
        
        # Return the data
        return {
            "version_stats": version_stats,
            "overall_stats": overall_stats,
            "daily_drift": daily_drift
        }
        
    except Exception as e:
        print(f"Error getting drift trends: {str(e)}")
        return {"error": str(e)}

def visualize_drift(days: int = 30, output_path: Optional[str] = None) -> Optional[str]:
    """
    Visualize drift trends
    
    Args:
        days: Number of days to analyze (default: 30)
        output_path: Path to save visualization (default: auto-generated)
        
    Returns:
        Path to the saved visualization or None if failed
    """
    try:
        import matplotlib.pyplot as plt
        import matplotlib.dates as mdates
        from matplotlib.ticker import MaxNLocator
    except ImportError:
        print("Matplotlib not installed. Run 'pip install matplotlib'.")
        return None
        
    # Get drift data
    drift_data = get_drift_trends(days)
    
    if "error" in drift_data:
        print(f"Error: {drift_data['error']}")
        return None
    
    # Create figure
    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(12, 10), sharex=True, gridspec_kw={'height_ratios': [3, 1]})
    
    # Get version colors
    version_colors = plt.cm.tab10.colors
    
    # Plot drift by version
    for i, (version, stats) in enumerate(drift_data["version_stats"].items()):
        color = version_colors[i % len(version_colors)]
        dates = [datetime.datetime.strptime(d, "%Y-%m-%d") for d in stats["trends"]["dates"]]
        ax1.plot(dates, stats["trends"]["mean_drifts"], 'o-', label=f"v{version}", color=color)
    
    # Add zero line
    ax1.axhline(y=0, color='gray', linestyle='--')
    
    # Add labels
    ax1.set_ylabel('Mean Drift (User - AI)')
    ax1.set_title('Model Drift Over Time')
    ax1.legend()
    ax1.grid(True, alpha=0.3)
    
    # Format x-axis dates
    ax1.xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m-%d'))
    ax1.xaxis.set_major_locator(mdates.AutoDateLocator())
    
    # Plot sample counts
    daily_drift = drift_data["daily_drift"]
    dates = [datetime.datetime.strptime(d["date"], "%Y-%m-%d") for d in daily_drift]
    sample_counts = [d["sample_count"] for d in daily_drift]
    
    ax2.bar(dates, sample_counts, alpha=0.7)
    ax2.set_ylabel('Feedback Count')
    ax2.set_xlabel('Date')
    ax2.grid(True, alpha=0.3)
    ax2.yaxis.set_major_locator(MaxNLocator(integer=True))
    
    # Rotate x-axis labels
    plt.setp(ax1.xaxis.get_majorticklabels(), rotation=45)
    plt.setp(ax2.xaxis.get_majorticklabels(), rotation=45)
    
    # Adjust layout
    plt.tight_layout()
    
    # Save figure if output_path provided
    if output_path is None:
        # Generate output path
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        output_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models", "reports")
        os.makedirs(output_dir, exist_ok=True)
        output_path = os.path.join(output_dir, f"drift_visualization_{timestamp}.png")
    
    plt.savefig(output_path)
    plt.close(fig)
    
    print(f"Saved drift visualization to {output_path}")
    return output_path

def generate_drift_report(days: int = 30) -> Optional[str]:
    """
    Generate a drift report HTML file
    
    Args:
        days: Number of days to analyze (default: 30)
        
    Returns:
        Path to the saved report or None if failed
    """
    try:
        import matplotlib.pyplot as plt
        import matplotlib.dates as mdates
        import base64
        from io import BytesIO
    except ImportError:
        print("Matplotlib not installed. Run 'pip install matplotlib'.")
        return None
    
    # Get drift data
    drift_data = get_drift_trends(days)
    
    if "error" in drift_data:
        print(f"Error: {drift_data['error']}")
        return None
    
    # Function to convert plot to base64 for embedding in HTML
    def plot_to_base64(fig):
        buf = BytesIO()
        fig.savefig(buf, format='png', bbox_inches='tight')
        buf.seek(0)
        img_str = base64.b64encode(buf.read()).decode('utf-8')
        buf.close()
        return img_str
    
    # Create figures
    
    # 1. Drift over time by version
    fig1, ax1 = plt.subplots(figsize=(10, 6))
    version_colors = plt.cm.tab10.colors
    
    for i, (version, stats) in enumerate(drift_data["version_stats"].items()):
        color = version_colors[i % len(version_colors)]
        dates = [datetime.datetime.strptime(d, "%Y-%m-%d") for d in stats["trends"]["dates"]]
        ax1.plot(dates, stats["trends"]["mean_drifts"], 'o-', label=f"v{version}", color=color)
    
    # Add zero line
    ax1.axhline(y=0, color='gray', linestyle='--')
    
    # Add labels
    ax1.set_ylabel('Mean Drift (User - AI)')
    ax1.set_title('Model Drift Over Time by Version')
    ax1.legend()
    ax1.grid(True, alpha=0.3)
    
    # Format x-axis dates
    ax1.xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m-%d'))
    ax1.xaxis.set_major_locator(mdates.AutoDateLocator())
    plt.setp(ax1.xaxis.get_majorticklabels(), rotation=45)
    plt.tight_layout()
    
    # 2. Sample counts over time
    fig2, ax2 = plt.subplots(figsize=(10, 4))
    daily_drift = drift_data["daily_drift"]
    dates = [datetime.datetime.strptime(d["date"], "%Y-%m-%d") for d in daily_drift]
    sample_counts = [d["sample_count"] for d in daily_drift]
    
    ax2.bar(dates, sample_counts, alpha=0.7)
    ax2.set_ylabel('Feedback Count')
    ax2.set_xlabel('Date')
    ax2.set_title('User Feedback Volume Over Time')
    ax2.grid(True, alpha=0.3)
    
    # Format x-axis dates
    ax2.xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m-%d'))
    ax2.xaxis.set_major_locator(mdates.AutoDateLocator())
    plt.setp(ax2.xaxis.get_majorticklabels(), rotation=45)
    plt.tight_layout()
    
    # 3. Drift direction pie chart for each version
    pie_charts = {}
    for version, stats in drift_data["version_stats"].items():
        fig3, ax3 = plt.subplots(figsize=(8, 8))
        
        drift_directions = stats.get("drift_direction_counts", {})
        if not drift_directions:
            continue
            
        labels = []
        sizes = []
        for direction in ["conservative", "neutral", "optimistic"]:
            count = drift_directions.get(direction, 0)
            if count > 0:
                labels.append(f"{direction.capitalize()} ({count})")
                sizes.append(count)
        
        if not sizes:
            continue
            
        colors = ['#ff9999', '#99ff99', '#66b3ff']
        ax3.pie(sizes, labels=labels, colors=colors, autopct='%1.1f%%', startangle=90)
        ax3.axis('equal')
        ax3.set_title(f'Drift Direction Distribution (v{version})')
        plt.tight_layout()
        
        pie_charts[version] = plot_to_base64(fig3)
        plt.close(fig3)
    
    # Convert plots to base64
    plot1_base64 = plot_to_base64(fig1)
    plot2_base64 = plot_to_base64(fig2)
    
    plt.close(fig1)
    plt.close(fig2)
    
    # Generate timestamp for report
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    report_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models", "reports")
    os.makedirs(report_dir, exist_ok=True)
    report_path = os.path.join(report_dir, f"drift_report_{timestamp}.html")
    
    # Prepare HTML content
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>TerraFusion Model Drift Report</title>
        <style>
            body {{ font-family: Arial, sans-serif; margin: 40px; }}
            h1, h2, h3 {{ color: #2c3e50; }}
            .report-card {{ 
                background-color: #f9f9f9; 
                border-radius: 5px; 
                padding: 20px; 
                margin-bottom: 20px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }}
            .stats-grid {{ 
                display: grid; 
                grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); 
                gap: 15px; 
                margin: 20px 0;
            }}
            .stat-card {{ 
                background-color: white; 
                border-radius: 5px; 
                padding: 15px; 
                text-align: center;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }}
            .stat-label {{ font-size: 14px; color: #7f8c8d; margin-bottom: 5px; }}
            .stat-value {{ font-size: 24px; font-weight: bold; color: #2c3e50; }}
            .plot {{ width: 100%; max-width: 800px; margin: 20px 0; }}
            .version-grid {{
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                gap: 20px;
                margin: 20px 0;
            }}
            .version-card {{
                background-color: white;
                border-radius: 5px;
                padding: 15px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }}
            .good {{ color: #27ae60; }}
            .warning {{ color: #f39c12; }}
            .error {{ color: #e74c3c; }}
            .footer {{ 
                margin-top: 40px; 
                padding-top: 20px; 
                border-top: 1px solid #eee; 
                color: #7f8c8d; 
                font-size: 14px;
            }}
        </style>
    </head>
    <body>
        <h1>TerraFusion Model Drift Report</h1>
        <p>Generated on: {datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")}</p>
        <p>Analysis period: Last {days} days</p>
    """
    
    # Add overall stats
    overall_stats = drift_data["overall_stats"]
    mean_drift = overall_stats["mean_drift"]
    total_samples = overall_stats["total_samples"]
    
    # Determine drift status
    drift_status = "good"
    drift_message = "No significant drift detected"
    if abs(mean_drift) > 0.5:
        drift_status = "error"
        direction = "optimistic (higher scores)" if mean_drift < 0 else "conservative (lower scores)"
        drift_message = f"Significant drift detected. AI is too {direction}."
    elif abs(mean_drift) > 0.2:
        drift_status = "warning"
        direction = "optimistic (higher scores)" if mean_drift < 0 else "conservative (lower scores)"
        drift_message = f"Minor drift detected. AI tends to be {direction}."
    
    # Add overall stats section
    html_content += f"""
        <div class="report-card">
            <h2>Overall Drift Analysis</h2>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-label">Mean Drift</div>
                    <div class="stat-value {drift_status}">{mean_drift:.2f}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Total Feedback Samples</div>
                    <div class="stat-value">{total_samples}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Status</div>
                    <div class="stat-value {drift_status}">{drift_message}</div>
                </div>
            </div>
            <div>
                <h3>Drift Over Time</h3>
                <img src="data:image/png;base64,{plot1_base64}" class="plot" alt="Drift Over Time">
            </div>
            <div>
                <h3>Feedback Volume</h3>
                <img src="data:image/png;base64,{plot2_base64}" class="plot" alt="Feedback Volume">
            </div>
        </div>
    """
    
    # Add version-specific stats
    html_content += f"""
        <div class="report-card">
            <h2>Version-Specific Analysis</h2>
            <div class="version-grid">
    """
    
    for version, stats in drift_data["version_stats"].items():
        version_drift = stats["mean_drift"]
        sample_count = stats["sample_count"]
        
        # Determine version drift status
        version_status = "good"
        version_message = "No significant drift"
        if abs(version_drift) > 0.5:
            version_status = "error"
            direction = "optimistic (higher scores)" if version_drift < 0 else "conservative (lower scores)"
            version_message = f"Significant drift. Too {direction}."
        elif abs(version_drift) > 0.2:
            version_status = "warning"
            direction = "optimistic (higher scores)" if version_drift < 0 else "conservative (lower scores)"
            version_message = f"Minor drift. Tends to be {direction}."
        
        # Add pie chart if available
        pie_chart_html = ""
        if version in pie_charts:
            pie_chart_html = f"""
                <div>
                    <h4>Drift Direction Distribution</h4>
                    <img src="data:image/png;base64,{pie_charts[version]}" style="width: 100%; max-width: 300px;" alt="Drift Direction">
                </div>
            """
        
        html_content += f"""
            <div class="version-card">
                <h3>Model v{version}</h3>
                <div class="stat-card">
                    <div class="stat-label">Mean Drift</div>
                    <div class="stat-value {version_status}">{version_drift:.2f}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Feedback Samples</div>
                    <div class="stat-value">{sample_count}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Status</div>
                    <div class="stat-value {version_status}">{version_message}</div>
                </div>
                {pie_chart_html}
            </div>
        """
    
    html_content += """
            </div>
        </div>
    """
    
    # Add recommendations section
    html_content += f"""
        <div class="report-card">
            <h2>Recommendations</h2>
    """
    
    # Generate recommendations based on the drift analysis
    recommendations = []
    
    if abs(mean_drift) > 0.5:
        recommendations.append("Consider retraining or updating the model to address significant drift.")
        
        if mean_drift > 0:
            recommendations.append("The model is consistently scoring properties lower than users. Adjust the scoring curve upward.")
        else:
            recommendations.append("The model is consistently scoring properties higher than users. Adjust the scoring curve downward.")
    
    if total_samples < 50:
        recommendations.append("Collect more user feedback to improve drift analysis accuracy.")
    
    # Add version-specific recommendations
    for version, stats in drift_data["version_stats"].items():
        version_drift = stats["mean_drift"]
        sample_count = stats["sample_count"]
        
        if abs(version_drift) > 0.5 and sample_count >= 10:
            if version_drift > 0:
                recommendations.append(f"Model v{version} consistently scores properties lower than users. Consider adjusting or updating this version.")
            else:
                recommendations.append(f"Model v{version} consistently scores properties higher than users. Consider adjusting or updating this version.")
    
    # Add recommendations or default message
    if recommendations:
        html_content += "<ul>"
        for rec in recommendations:
            html_content += f"<li>{rec}</li>"
        html_content += "</ul>"
    else:
        html_content += "<p>No specific recommendations at this time. The model appears to be performing well.</p>"
    
    html_content += """
        </div>
        <div class="footer">
            <p>Generated by TerraFusion Model Drift Monitor</p>
        </div>
    </body>
    </html>
    """
    
    # Write HTML to file
    with open(report_path, 'w') as f:
        f.write(html_content)
    
    print(f"Drift report generated successfully: {report_path}")
    
    return report_path

# Run this when the module is executed directly
if __name__ == "__main__":
    import sys
    
    # Parse arguments
    if len(sys.argv) > 1 and sys.argv[1] == "--calculate":
        print("Calculating daily drift metrics...")
        calculate_daily_drift()
    elif len(sys.argv) > 1 and sys.argv[1] == "--visualize":
        days = 30
        if len(sys.argv) > 2:
            try:
                days = int(sys.argv[2])
            except ValueError:
                pass
        print(f"Visualizing drift for the last {days} days...")
        visualize_drift(days)
    elif len(sys.argv) > 1 and sys.argv[1] == "--report":
        days = 30
        if len(sys.argv) > 2:
            try:
                days = int(sys.argv[2])
            except ValueError:
                pass
        print(f"Generating drift report for the last {days} days...")
        generate_drift_report(days)
    else:
        print("Usage:")
        print("  python drift_monitor.py --calculate")
        print("  python drift_monitor.py --visualize [days]")
        print("  python drift_monitor.py --report [days]")