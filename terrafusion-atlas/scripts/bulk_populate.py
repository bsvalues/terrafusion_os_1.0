#!/usr/bin/env python3
"""
Bulk Registry Population Script
Automatically populate Atlas registries from classification results
"""

import json
import subprocess
import sys
from pathlib import Path

ATLAS_ROOT = Path(__file__).parent.parent
DRAFT_FILE = ATLAS_ROOT / "atlas-auto-draft.json"

def load_draft():
    """Load auto-classification results"""
    with open(DRAFT_FILE) as f:
        return json.load(f)

def add_to_atlas(registry, item):
    """Add item to Atlas using atlas_seed.py"""
    cmd = [
        'python3', 'scripts/atlas_seed.py', registry,
        '--id', item['suggested_id'],
        '--name', item['name'],
        '--owner', item['suggested_owner'],
        '--source_path', item['source_path']
    ]
    
    if item.get('tags'):
        cmd.extend(['--tags', ','.join(item['tags'])])
    
    # Add lifecycle for applicable registries
    if registry in ['services', 'engines', 'frontends', 'agents', 'modules', 'datasets', 'pipelines']:
        cmd.extend(['--lifecycle', 'active'])
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, cwd=ATLAS_ROOT)
        return result.returncode == 0
    except Exception as e:
        print(f"  ❌ Error adding {item['suggested_id']}: {e}")
        return False

def main():
    print("🚀 Bulk Atlas Population Starting...\n")
    
    # Load classification results
    draft = load_draft()
    classifications = draft.get('classifications', {})
    
    # Track statistics
    stats = {
        'attempted': 0,
        'succeeded': 0,
        'failed': 0
    }
    
    # Prioritize registries (add most important first)
    priority_order = [
        'services',
        'engines', 
        'frontends',
        'agents',
        'modules',
        'datasets',
        'pipelines',
        'deployments',
        'environments',
        'partners',
        'compliance',
        'brands',
        'releases',
        'components'
    ]
    
    for registry in priority_order:
        items = classifications.get(registry, [])
        
        if not items:
            continue
        
        print(f"\n{'='*70}")
        print(f"📦 Processing {registry.upper()} ({len(items)} items)")
        print(f"{'='*70}\n")
        
        # Take top N items per registry (to avoid overwhelming)
        max_items = 20 if registry not in ['releases', 'compliance'] else 5
        items_to_add = items[:max_items]
        
        for i, item in enumerate(items_to_add, 1):
            stats['attempted'] += 1
            
            print(f"[{i}/{len(items_to_add)}] Adding: {item['suggested_id']}")
            
            if add_to_atlas(registry, item):
                stats['succeeded'] += 1
                print(f"  ✅ Success")
            else:
                stats['failed'] += 1
                print(f"  ⚠️  Failed (may already exist)")
        
        if len(items) > max_items:
            print(f"\n💡 Note: {len(items) - max_items} more {registry} items available in auto-draft")
    
    # Final summary
    print(f"\n{'='*70}")
    print("📊 BULK POPULATION COMPLETE")
    print(f"{'='*70}\n")
    print(f"  Attempted: {stats['attempted']}")
    print(f"  Succeeded: {stats['succeeded']}")
    print(f"  Failed:    {stats['failed']}")
    print(f"\n✨ Run 'python3 scripts/atlas_summary.py' to see updated Atlas")

if __name__ == '__main__':
    main()
