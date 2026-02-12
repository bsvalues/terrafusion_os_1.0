#!/usr/bin/env python3
"""
TerraFusion Model Drift Report Generator
Generates reports showing the difference between AI predictions and user corrections

Usage:
  python generate_drift_report.py --days 30
"""

import os
import sys
import argparse
from pathlib import Path

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def generate_drift_report(days=30):
    """Generate drift visualization and HTML report"""
    try:
        # Import the drift monitor functions
        from backend.drift_monitor import calculate_daily_drift, visualize_drift, generate_drift_report
        
        # First, ensure that drift metrics are calculated
        print("Calculating drift metrics...")
        if calculate_daily_drift():
            print("Drift metrics calculated successfully.")
        else:
            print("Error: Failed to calculate drift metrics.")
            return False
        
        # Generate the visualization
        print(f"Generating drift visualization for the last {days} days...")
        vis_path = visualize_drift(days=days)
        if vis_path:
            print(f"Drift visualization saved to: {vis_path}")
        else:
            print("Error: Failed to generate drift visualization.")
            return False
        
        # Generate the HTML report
        print(f"Generating drift report for the last {days} days...")
        report_path = generate_drift_report(days=days)
        if report_path:
            print(f"Drift report generated successfully: {report_path}")
            
            # Try to open the report in the default browser
            try:
                import webbrowser
                webbrowser.open('file://' + report_path)
            except:
                print("Note: Could not open report in browser automatically.")
                
            return True
        else:
            print("Error: Failed to generate drift report.")
            return False
    except Exception as e:
        print(f"Error generating drift report: {str(e)}")
        return False

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="Generate model drift reports")
    
    parser.add_argument(
        "--days",
        type=int,
        default=30,
        help="Number of days to analyze (default: 30)"
    )
    
    args = parser.parse_args()
    
    # Generate the reports
    success = generate_drift_report(args.days)
    
    # Return the appropriate exit code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()