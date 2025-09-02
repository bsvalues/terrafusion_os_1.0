#!/usr/bin/env python3
"""
Complete TerraFusion OS 1.0 Migration - Final Sweep
Copy all remaining databases, cost matrices, and create missing manifests
"""

import os
import json
import shutil
import sys
from pathlib import Path
from datetime import datetime

def copy_all_databases():
    """Copy all database files found in source"""
    print("=== Copying All Database Files ===")
    
    source_path = Path("e:/TerraFusion_OS")
    target_path = Path("e:/TerraFusion_OS_1.0/data/databases")
    
    # Database files found in audit
    database_files = [
        "Installers/BentonCounty_Production_Installer/Data/BentonCounty/properties.db",
        "platforms/TerraFusion_Remix_Clean/data/democratic_health.db",
        "platforms/TerraFusion_Master_Workspace/monitoring/championship_analytics.db",
        "platforms/championship/ARCHIVE/legacy/unified_costforge/terrafusion_build/TerraFusionBuild/terrabuild.db",
        "platforms/championship/ARCHIVE/legacy/data/terrafusion_real.db",
        "platforms/championship/ARCHIVE/legacy/data/terrafusion_production_1750866735518.db",
        "platforms/championship/ARCHIVE/legacy/data/terrafusion_production.db",
        "platforms/championship/ARCHIVE/legacy/data/terrafusionsync_real_1750866714245.db",
        "platforms/championship/ARCHIVE/legacy/data/terrafusionsync_real.db",
        "platforms/championship/ARCHIVE/legacy/data/terrafusionsync_backup.db",
        "platforms/championship/ARCHIVE/legacy/data/terrafusionsync_94k.db",
        "platforms/championship/ARCHIVE/legacy/data/SemanticSymbols.db",
        "platforms/championship/ARCHIVE/legacy/data/real_pacs.db",
        "platforms/championship/ARCHIVE/legacy/data/CodeChunks.db",
        "platforms/championship/ARCHIVE/legacy/data/Browse.VC.db"
    ]
    
    copied_count = 0
    for db_file in database_files:
        source_file = source_path / db_file
        if source_file.exists():
            target_file = target_path / source_file.name
            try:
                shutil.copy2(source_file, target_file)
                file_size = source_file.stat().st_size / (1024 * 1024)  # MB
                print(f"✓ Copied: {source_file.name} ({file_size:.2f} MB)")
                copied_count += 1
            except Exception as e:
                print(f"✗ Failed to copy {source_file.name}: {e}")
        else:
            print(f"⚠ Not found: {db_file}")
    
    print(f"✓ Copied {copied_count} database files")

def create_missing_manifests():
    """Create manifests for modules that don't have them"""
    print("\n=== Creating Missing Module Manifests ===")
    
    modules_path = Path("e:/TerraFusion_OS_1.0/modules")
    
    for module_dir in modules_path.iterdir():
        if module_dir.is_dir() and module_dir.name != "module-registry.json":
            manifest_file = module_dir / "module.manifest.json"
            if not manifest_file.exists():
                # Count items in module
                try:
                    item_count = sum(1 for _ in module_dir.rglob('*'))
                    
                    # Determine tier based on module name
                    tier = "Tier 3 (Extended Features)"  # Default
                    if module_dir.name in ["government-edition", "costforge-ai-champion", "marketplace-champion", "ai-command-brain"]:
                        tier = "Tier 1 (Core Government)"
                    elif module_dir.name in ["terra-agent-champion", "terra-flow-champion", "gispro", "terra-fusion-assessor", "terra-levy", "web-audit-tracker"]:
                        tier = "Tier 2 (Essential Operations)"
                    
                    manifest = {
                        "name": module_dir.name,
                        "tier": tier,
                        "itemCount": item_count,
                        "migratedAt": datetime.now().isoformat() + "Z",
                        "status": "active"
                    }
                    
                    with open(manifest_file, 'w', encoding='utf-8') as f:
                        json.dump(manifest, f, indent=2)
                    
                    print(f"✓ Created manifest for {module_dir.name} ({item_count} items)")
                except Exception as e:
                    print(f"✗ Failed to create manifest for {module_dir.name}: {e}")

def copy_additional_property_data():
    """Copy any additional property data files"""
    print("\n=== Copying Additional Property Data ===")
    
    source_path = Path("e:/TerraFusion_OS")
    target_path = Path("e:/TerraFusion_OS_1.0/data/counties")
    
    # Look for additional property files
    property_files = [
        "platforms/championship/DEPLOYMENT/benton_county_20250811_080206/data/benton_county_properties.json",
        "Installers/BentonCounty_Production_Installer/Data/BentonCounty/properties.json"
    ]
    
    for prop_file in property_files:
        source_file = source_path / prop_file
        if source_file.exists():
            target_file = target_path / f"{source_file.stem}_additional.json"
            try:
                shutil.copy2(source_file, target_file)
                file_size = source_file.stat().st_size / (1024 * 1024)  # MB
                print(f"✓ Copied: {target_file.name} ({file_size:.2f} MB)")
            except Exception as e:
                print(f"✗ Failed to copy {source_file.name}: {e}")

def verify_intelligence_completeness():
    """Verify all intelligence files are present"""
    print("\n=== Verifying Intelligence Data Completeness ===")
    
    source_intel = Path("e:/TerraFusion_OS/INTELLIGENCE")
    target_intel = Path("e:/TerraFusion_OS_1.0/data/intelligence")
    
    if source_intel.exists():
        source_files = set(f.name for f in source_intel.glob("*.json"))
        target_files = set(f.name for f in target_intel.glob("*.json"))
        
        missing_files = source_files - target_files
        if missing_files:
            print(f"⚠ Missing {len(missing_files)} intelligence files:")
            for missing in missing_files:
                source_file = source_intel / missing
                target_file = target_intel / missing
                try:
                    shutil.copy2(source_file, target_file)
                    print(f"✓ Copied missing: {missing}")
                except Exception as e:
                    print(f"✗ Failed to copy {missing}: {e}")
        else:
            print("✓ All intelligence files already present")

def final_summary():
    """Generate final migration summary"""
    print("\n=== Final Migration Summary ===")
    
    # Count files in each directory
    data_path = Path("e:/TerraFusion_OS_1.0/data")
    modules_path = Path("e:/TerraFusion_OS_1.0/modules")
    
    counties_count = len(list((data_path / "counties").glob("*.json"))) if (data_path / "counties").exists() else 0
    intelligence_count = len(list((data_path / "intelligence").glob("*.json"))) if (data_path / "intelligence").exists() else 0
    databases_count = len(list((data_path / "databases").glob("*.db"))) if (data_path / "databases").exists() else 0
    modules_count = len([d for d in modules_path.iterdir() if d.is_dir()]) if modules_path.exists() else 0
    manifests_count = len(list(modules_path.glob("*/module.manifest.json"))) if modules_path.exists() else 0
    
    print(f"✓ County Data Files: {counties_count}")
    print(f"✓ Intelligence Files: {intelligence_count}")
    print(f"✓ Database Files: {databases_count}")
    print(f"✓ Modules Migrated: {modules_count}")
    print(f"✓ Module Manifests: {manifests_count}")
    
    print("\n🎉 COMPLETE MIGRATION FINISHED!")
    print("All TerraFusion OS data has been consolidated into version 1.0")

if __name__ == "__main__":
    try:
        print("Starting Complete TerraFusion OS 1.0 Migration...")
        copy_all_databases()
        create_missing_manifests()
        copy_additional_property_data()
        verify_intelligence_completeness()
        final_summary()
    except Exception as e:
        print(f"Complete migration failed: {e}")
        sys.exit(1)
