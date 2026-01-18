import re
import json
import os
import sys

LOG_FILE = ".ci_artifacts_local/dotnet_warnings.log"
OUTPUT_FILE = ".ci_artifacts_local/dotnet-warnings.json"
BASELINE_FILE = "governance/dotnet-warning-baseline.json"

# Regex for MSBuild file logger output
# Example: C:\Path\File.cs(12,34): warning CS1234: Message [C:\Path\Project.csproj]
# Note: The ' [Project]' part is added by MSBuild when building solutions, but sometimes it's missing or different.
# We will make the regex robust.
WARNING_PATTERN = re.compile(r"^(?P<file>.+?)\((?P<line>\d+),(?P<col>\d+)\): warning (?P<code>CS\d+|CA\d+|SA\d+?): (?P<message>.+?)(?: \[(?P<project>.+?)\])?$")

def parse_log(log_path):
    warnings = []
    
    if not os.path.exists(log_path):
        print(f"Error: Log file not found at {log_path}")
        return []

    print(f"Parsing log file: {log_path}")
    with open(log_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            match = WARNING_PATTERN.match(line)
            if match:
                entry = match.groupdict()
                # Normalize paths to be relative if possible
                cwd = os.getcwd()
                if entry['file'].startswith(cwd):
                    entry['file'] = os.path.relpath(entry['file'], cwd)
                if entry['project'] and entry['project'].startswith(cwd):
                    entry['project'] = os.path.relpath(entry['project'], cwd)
                
                warnings.append(entry)
    
    return warnings

def generate_inventory(warnings):
    inventory = {
        "generatedAt": "now", # Placeholder, updated below
        "totalCount": len(warnings),
        "byCode": {},
        "byProject": {},
        "items": warnings
    }

    from datetime import datetime
    inventory["generatedAt"] = datetime.utcnow().isoformat()

    # Aggregations
    for w in warnings:
        code = w['code']
        proj = w['project'] if w['project'] else "Unknown"

        inventory["byCode"][code] = inventory["byCode"].get(code, 0) + 1
        inventory["byProject"][proj] = inventory["byProject"].get(proj, 0) + 1
    
    return inventory

def main():
    if len(sys.argv) > 1:
        log_path = sys.argv[1]
    else:
        log_path = LOG_FILE
    
    warnings = parse_log(log_path)
    print(f"Found {len(warnings)} warnings.")

    inventory = generate_inventory(warnings)

    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(inventory, f, indent=2)
    
    print(f"Inventory saved to {OUTPUT_FILE}")

    # Create/Update Baseline
    baseline = {
        "totalWarnings": len(warnings),
        "updatedAt": inventory["generatedAt"]
    }
    
    os.makedirs(os.path.dirname(BASELINE_FILE), exist_ok=True)
    with open(BASELINE_FILE, 'w', encoding='utf-8') as f:
        json.dump(baseline, f, indent=2)
    
    print(f"Baseline updated at {BASELINE_FILE}")

if __name__ == "__main__":
    main()
