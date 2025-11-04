#!/usr/bin/env python3
"""
TerraFusion MIT PhD Systems Agent - Migration Status Analysis
Evidence-based assessment of what needs to be migrated
"""
import json
from pathlib import Path

# Load discovery report
with open('TERRAFUSION_COMPREHENSIVE_DISCOVERY_REPORT.json', 'r') as f:
    data = json.load(f)

print("=" * 80)
print("TERRAFUSION MIGRATION STATUS ANALYSIS")
print("=" * 80)

# Already integrated systems (from discovery report)
integrated_keywords = ['TerraLevy', 'TerraFlow', 'TerraFusionSync', 'TerraFusionAssessor', 'BCBSGISPRO', 'BSIncomeValuation']
integrated_systems = [s for s in data['all_systems'] if any(kw in s['name'] for kw in integrated_keywords)]

print(f"\n✅ ALREADY INTEGRATED: {len(integrated_systems)} systems")
for sys in integrated_systems:
    print(f"   - {sys['name']}")

# Top priority unintegrated
print(f"\n🎯 TOP 15 UNINTEGRATED SYSTEMS (CRITICAL/HIGH PRIORITY):")
print("-" * 80)

for i, sys in enumerate(data['top_integration_opportunities'][:15], 1):
    print(f"\n{i}. {sys['name']}")
    print(f"   Priority: {sys['priority']}")
    print(f"   Foundation Value: +{sys['foundation_value']}")
    print(f"   Source Location: {sys['locations'][0]}")
    print(f"   Type: {sys['system_type']}")
    print(f"   Technologies: {', '.join(sys['technologies'][:5])}")
    print(f"   Capabilities: {', '.join(sys['capabilities'][:3])}")

# Summary statistics
print(f"\n" + "=" * 80)
print(f"SUMMARY:")
print(f"  Total Systems Found: {data['executive_summary']['total_systems_discovered']}")
print(f"  Already Integrated: {data['executive_summary']['already_integrated']}")
print(f"  Need Migration: {data['executive_summary']['unintegrated_opportunities']}")
print(f"  Current Foundation: {data['executive_summary']['current_foundation_score']}")
print(f"  Potential Foundation: {data['executive_summary']['ultimate_foundation_score']}")
print(f"  Gain from Migration: +{data['executive_summary']['total_enhancement_potential']}")
print("=" * 80)

# Check what actually exists in workspace
print(f"\n🔍 VERIFYING CURRENT WORKSPACE CONTENTS:")
print("-" * 80)

workspace_root = Path('.')
key_dirs = ['backend', 'SDK/modules', 'applications', 'apps']

for dir_path in key_dirs:
    path = workspace_root / dir_path
    if path.exists():
        items = list(path.iterdir())
        print(f"\n{dir_path}/: {len(items)} items")
        for item in sorted(items)[:10]:  # First 10
            print(f"  - {item.name}")
    else:
        print(f"\n{dir_path}/: NOT FOUND")

print("\n" + "=" * 80)
