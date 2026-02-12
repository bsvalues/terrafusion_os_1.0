#!/usr/bin/env python3
"""
Security Scan CLI Tool

This tool runs security scans on the GeoAssessmentPro project.
"""

import os
import sys
import argparse
import logging
import json
import time
from typing import Dict, Any

from security.security_scanner import SecurityScanner

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("security_scan")

def parse_arguments():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description="Security scanning tool for GeoAssessmentPro")
    
    parser.add_argument(
        "--config", "-c",
        help="Path to scanner configuration file",
        default=None
    )
    
    parser.add_argument(
        "--output", "-o",
        help="Path to output JSON file",
        default="security_scan_results.json"
    )
    
    parser.add_argument(
        "--verbose", "-v",
        help="Enable verbose output",
        action="store_true"
    )
    
    parser.add_argument(
        "--checks",
        help="Comma-separated list of checks to run (default: all)",
        default="all"
    )
    
    parser.add_argument(
        "--exclude",
        help="Comma-separated list of paths to exclude from scanning",
        default=None
    )
    
    parser.add_argument(
        "--path",
        help="Path to scan (default: current directory)",
        default="."
    )
    
    return parser.parse_args()

def configure_scanner(args) -> Dict[str, Any]:
    """
    Configure the scanner based on command-line arguments.
    
    Args:
        args: Command-line arguments
        
    Returns:
        Scanner configuration dictionary
    """
    # Base configuration
    config = {
        "scan_paths": [args.path],
        "exclude_paths": [
            "node_modules", "venv", ".git", "__pycache__", "migrations",
            ".pytest_cache", "dist", "build", ".venv"
        ]
    }
    
    # Add user-specified exclusions
    if args.exclude:
        user_exclusions = [p.strip() for p in args.exclude.split(",")]
        config["exclude_paths"].extend(user_exclusions)
    
    # Configure enabled checks
    if args.checks and args.checks.lower() != "all":
        check_names = [c.strip() for c in args.checks.split(",")]
        config["checks_enabled"] = {
            "vulnerability_scan": "vulnerability" in check_names,
            "configuration_audit": "configuration" in check_names,
            "dependency_check": "dependency" in check_names,
            "secret_detection": "secret" in check_names,
            "permission_audit": "permission" in check_names
        }
    
    # Set log level
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Load config file if provided
    if args.config and os.path.isfile(args.config):
        with open(args.config, "r") as f:
            file_config = json.load(f)
        
        # Merge configurations
        for key, value in file_config.items():
            if isinstance(value, dict) and key in config and isinstance(config[key], dict):
                config[key].update(value)
            else:
                config[key] = value
        
        logger.info(f"Loaded configuration from {args.config}")
    
    return config

def print_report_summary(results: Dict[str, Any]):
    """
    Print a summary of the scan results.
    
    Args:
        results: Scan results
    """
    print("\n" + "=" * 70)
    print(f"SECURITY SCAN SUMMARY: {results['overall_status'].upper()}")
    print("=" * 70)
    
    # Print basic stats
    print(f"Total findings: {results['vulnerability_count']}")
    if "severity_counts" in results:
        print("\nFindings by severity:")
        for severity, count in results["severity_counts"].items():
            severity_upper = severity.upper()
            
            # Color coding
            if severity == "critical":
                severity_display = f"\033[1;31m{severity_upper}\033[0m"  # Bold red
            elif severity == "high":
                severity_display = f"\033[31m{severity_upper}\033[0m"  # Red
            elif severity == "medium":
                severity_display = f"\033[33m{severity_upper}\033[0m"  # Yellow
            else:
                severity_display = f"\033[34m{severity_upper}\033[0m"  # Blue
            
            print(f"  {severity_display}: {count}")
    
    # Group findings by type
    findings_by_type = {}
    for finding in results["findings"]:
        finding_type = finding["type"]
        if finding_type not in findings_by_type:
            findings_by_type[finding_type] = []
        findings_by_type[finding_type].append(finding)
    
    print("\nFindings by type:")
    for finding_type, findings in findings_by_type.items():
        print(f"  {finding_type.capitalize()}: {len(findings)}")
    
    # Print top critical and high findings
    if any(f["severity"] == "critical" for f in results["findings"]):
        print("\nCRITICAL FINDINGS:")
        for finding in results["findings"]:
            if finding["severity"] == "critical":
                print(f"  - {finding['description']} in {finding['file']}" + 
                      (f" (line {finding['line']})" if 'line' in finding else ""))
    
    if any(f["severity"] == "high" for f in results["findings"]):
        print("\nHIGH SEVERITY FINDINGS:")
        high_findings = [f for f in results["findings"] if f["severity"] == "high"]
        # Show at most 5 high findings in the summary
        for finding in high_findings[:5]:
            print(f"  - {finding['description']} in {finding['file']}" + 
                  (f" (line {finding['line']})" if 'line' in finding else ""))
        
        if len(high_findings) > 5:
            print(f"  ... and {len(high_findings) - 5} more high severity findings")
    
    print("\nScan completed in: {:.2f} seconds".format(results["scan_duration_seconds"]))
    print("=" * 70)
    print(f"Full results saved to: {args.output}")
    print("=" * 70)

def main():
    """Main function"""
    global args
    args = parse_arguments()
    
    try:
        # Configure and run scanner
        logger.info("Starting security scan")
        start_time = time.time()
        
        config = configure_scanner(args)
        scanner = SecurityScanner(config_path=args.config)
        
        # Update scanner config with command-line options
        scanner.config.update(config)
        
        # Run the scan
        results = scanner.run_security_scan()
        
        # Save results to file
        scanner.export_results_to_json(args.output)
        
        # Print summary
        print_report_summary(results)
        
        # Return appropriate exit code
        if results["overall_status"] == "fail":
            return 1
        else:
            return 0
        
    except Exception as e:
        logger.error(f"Error during security scan: {str(e)}")
        return 2

if __name__ == "__main__":
    sys.exit(main())