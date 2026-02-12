#!/usr/bin/env python3
"""
Atlas Validation Script
Validates Atlas registries for correctness
"""

import json
import sys
from pathlib import Path

ATLAS_ROOT = Path(__file__).parent.parent
REGISTRIES_DIR = ATLAS_ROOT / "registries"

def validate_registry(registry_file):
    """Validate a single registry file"""
    errors = []
    warnings = []
    
    with open(registry_file) as f:
        try:
            data = json.load(f)
        except json.JSONDecodeError as e:
            return [f"Invalid JSON: {e}"], []
    
    # Check required fields
    if 'registry' not in data:
        errors.append("Missing 'registry' field")
    if 'items' not in data:
        errors.append("Missing 'items' field")
    
    # Validate items
    items = data.get('items', [])
    for i, item in enumerate(items):
        # Required fields
        if 'id' not in item:
            errors.append(f"Item {i}: Missing 'id' field")
        if 'name' not in item:
            errors.append(f"Item {i}: Missing 'name' field")
        if 'owner' not in item:
            errors.append(f"Item {i}: Missing 'owner' field")
        elif not item['owner']:
            warnings.append(f"Item {item.get('id', i)}: Empty owner")
        
        # Recommended fields
        if 'tags' not in item or not item['tags']:
            warnings.append(f"Item {item.get('id', i)}: No tags")
        if 'source_path' not in item:
            warnings.append(f"Item {item.get('id', i)}: No source_path")
    
    return errors, warnings

def main():
    print("🔍 Validating TerraFusion Atlas...")
    
    total_errors = 0
    total_warnings = 0
    
    for registry_file in sorted(REGISTRIES_DIR.glob("*.json")):
        print(f"\n📋 Validating {registry_file.name}...")
        errors, warnings = validate_registry(registry_file)
        
        if errors:
            print(f"  ❌ {len(errors)} error(s):")
            for error in errors:
                print(f"     - {error}")
            total_errors += len(errors)
        
        if warnings:
            print(f"  ⚠️  {len(warnings)} warning(s):")
            for warning in warnings:
                print(f"     - {warning}")
            total_warnings += len(warnings)
        
        if not errors and not warnings:
            print("  ✅ Valid!")
    
    print(f"\n📊 Summary:")
    print(f"   Errors: {total_errors}")
    print(f"   Warnings: {total_warnings}")
    
    if total_errors > 0:
        print("\n❌ Validation failed!")
        sys.exit(1)
    elif total_warnings > 0:
        print("\n⚠️  Validation passed with warnings.")
        sys.exit(0)
    else:
        print("\n✅ All registries valid!")
        sys.exit(0)

if __name__ == '__main__':
    main()
