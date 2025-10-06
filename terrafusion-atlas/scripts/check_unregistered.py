#!/usr/bin/env python3
"""
Check for Unregistered Items
Scans repository for potential items not in Atlas
"""

import json
from pathlib import Path

ATLAS_ROOT = Path(__file__).parent.parent
REPO_ROOT = ATLAS_ROOT.parent
REGISTRIES_DIR = ATLAS_ROOT / "registries"

# Patterns that indicate an item should be registered
PATTERNS = {
    'services': ['*/appsettings.json', '*/Program.cs', '*/Startup.cs'],
    'engines': ['*/Cargo.toml', '*/src/lib.rs'],
    'frontends': ['*/package.json', '*/vite.config.*', '*/next.config.*'],
    'modules': ['*/module.json', '*/plugin.json'],
}

def get_registered_paths():
    """Get all source paths from registries"""
    registered = set()
    for registry_file in REGISTRIES_DIR.glob("*.json"):
        with open(registry_file) as f:
            data = json.load(f)
            for item in data.get('items', []):
                path = item.get('source_path', '')
                if path:
                    registered.add(path)
    return registered

def find_potential_items():
    """Find directories that might need registration"""
    registered = get_registered_paths()
    unregistered = []
    
    # Check for services (C# projects)
    for csproj in REPO_ROOT.glob("**/*.csproj"):
        rel_path = str(csproj.parent.relative_to(REPO_ROOT))
        if rel_path not in registered and not any(skip in rel_path for skip in ['obj', 'bin', 'test']):
            unregistered.append(('service', rel_path))
    
    # Check for Rust engines
    for cargo in REPO_ROOT.glob("**/Cargo.toml"):
        rel_path = str(cargo.parent.relative_to(REPO_ROOT))
        if rel_path not in registered and 'target' not in rel_path:
            unregistered.append(('engine', rel_path))
    
    # Check for frontends (package.json with scripts)
    for pkg in REPO_ROOT.glob("**/package.json"):
        rel_path = str(pkg.parent.relative_to(REPO_ROOT))
        if rel_path not in registered and 'node_modules' not in rel_path:
            try:
                with open(pkg) as f:
                    data = json.load(f)
                    if 'scripts' in data and any(s in data['scripts'] for s in ['dev', 'build', 'start']):
                        unregistered.append(('frontend', rel_path))
            except:
                pass
    
    return unregistered

def main():
    print("🔍 Checking for unregistered items...\n")
    
    unregistered = find_potential_items()
    
    if not unregistered:
        print("✅ No obvious unregistered items found!")
        return
    
    print(f"⚠️  Found {len(unregistered)} potential unregistered items:\n")
    
    by_type = {}
    for item_type, path in unregistered:
        if item_type not in by_type:
            by_type[item_type] = []
        by_type[item_type].append(path)
    
    for item_type, paths in sorted(by_type.items()):
        print(f"### {item_type.title()}s")
        for path in sorted(paths)[:10]:  # Limit output
            print(f"  - {path}")
        if len(paths) > 10:
            print(f"  - ... and {len(paths) - 10} more")
        print()
    
    print("\n💡 To register an item, use:")
    print(f"   python3 terrafusion-atlas/scripts/atlas_seed.py <registry> --id <id> --name <name> --owner <team> --source_path <path>")

if __name__ == '__main__':
    main()
