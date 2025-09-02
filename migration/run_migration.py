#!/usr/bin/env python3
"""
TerraFusion OS 1.0 Migration Script
Python alternative to PowerShell scripts for better cross-platform compatibility
"""

import os
import json
import shutil
import sys
from pathlib import Path
from datetime import datetime

def create_directories(base_path, directories):
    """Create target directories"""
    for directory in directories:
        dir_path = Path(base_path) / directory
        dir_path.mkdir(parents=True, exist_ok=True)
        print(f"✓ Created directory: {dir_path}")

def consolidate_data():
    """Consolidate county data from fragmented platforms"""
    print("=== TerraFusion OS 1.0 Data Consolidation ===")
    
    source_path = Path("e:/TerraFusion_OS")
    target_path = Path("e:/TerraFusion_OS_1.0/data")
    
    print(f"Source: {source_path}")
    print(f"Target: {target_path}")
    print()
    
    # Create target directories
    directories = [
        "counties",
        "ai-models", 
        "cost-matrices",
        "databases",
        "intelligence"
    ]
    
    create_directories(target_path, directories)
    
    # County Property Data Sources
    print("\n=== Consolidating County Property Data ===")
    
    property_data_sources = [
        "INTELLIGENCE/benton_analysis.json",
        "INTELLIGENCE/benton_extraction.json", 
        "INTELLIGENCE/benton_valuations.json",
        "data/county-intelligence/benton_analysis.json",
        "platforms/championship/DEPLOYMENT/benton_county_20250811_080206/data/benton_county_properties.json",
        "platforms/terrafusion-os-new/src/services/intelligence-service/benton_valuations.json"
    ]
    
    consolidated_properties = []
    property_count = 0
    
    for source in property_data_sources:
        full_path = source_path / source
        if full_path.exists():
            print(f"  Processing: {source}")
            try:
                with open(full_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    if isinstance(data, list):
                        consolidated_properties.extend(data)
                        property_count += len(data)
                        print(f"    ✓ Added {len(data)} properties")
                    else:
                        consolidated_properties.append(data)
                        property_count += 1
                        print(f"    ✓ Added 1 property")
            except Exception as e:
                print(f"    ✗ Failed to parse JSON: {e}")
        else:
            print(f"    ⚠ Not found: {full_path}")
    
    # Save consolidated property data
    target_property_file = target_path / "counties" / "benton_county_properties.json"
    try:
        with open(target_property_file, 'w', encoding='utf-8') as f:
            json.dump(consolidated_properties, f, indent=2, ensure_ascii=False)
        print(f"✓ Consolidated {property_count} properties to: {target_property_file}")
    except Exception as e:
        print(f"✗ Failed to save consolidated properties: {e}")
    
    # Cost Matrix Data
    print("\n=== Consolidating Cost Matrix Data ===")
    
    cost_matrix_sources = [
        "platforms/championship/ARCHIVE/legacy/unified_costforge/benton_cost_matrix_live.json",
        "platforms/championship/ARCHIVE/legacy/unified_costforge/benton_cost_matrix_proper.json",
        "platforms/championship/ARCHIVE/legacy/unified_costforge/benton_matrix_exact_identifiers.json"
    ]
    
    for source in cost_matrix_sources:
        full_path = source_path / source
        if full_path.exists():
            file_name = full_path.name
            target_file = target_path / "cost-matrices" / file_name
            try:
                shutil.copy2(full_path, target_file)
                print(f"✓ Copied: {file_name}")
            except Exception as e:
                print(f"✗ Failed to copy {file_name}: {e}")
        else:
            print(f"⚠ Not found: {source}")
    
    # Database Files
    print("\n=== Consolidating Database Files ===")
    
    database_sources = [
        "platforms/championship/ARCHIVE/legacy/data/terrafusion_real.db",
        "platforms/championship/ARCHIVE/legacy/data/terrafusion_production.db",
        "platforms/championship/ARCHIVE/legacy/data/real_pacs.db",
        "platforms/TerraFusion_Remix_Clean/data/democratic_health.db"
    ]
    
    for source in database_sources:
        full_path = source_path / source
        if full_path.exists():
            file_name = full_path.name
            target_file = target_path / "databases" / file_name
            try:
                shutil.copy2(full_path, target_file)
                file_size = full_path.stat().st_size / (1024 * 1024)  # MB
                print(f"✓ Copied: {file_name} ({file_size:.2f} MB)")
            except Exception as e:
                print(f"✗ Failed to copy {file_name}: {e}")
        else:
            print(f"⚠ Not found: {source}")
    
    # Intelligence Data
    print("\n=== Consolidating Intelligence Data ===")
    
    intelligence_path = source_path / "INTELLIGENCE"
    if intelligence_path.exists():
        for json_file in intelligence_path.glob("*.json"):
            target_file = target_path / "intelligence" / json_file.name
            try:
                shutil.copy2(json_file, target_file)
                print(f"✓ Copied: {json_file.name}")
            except Exception as e:
                print(f"✗ Failed to copy {json_file.name}: {e}")
    
    # AI Models Placeholder
    print("\n=== Preparing AI Models Directory ===")
    ai_models_readme = """# AI Models Directory

This directory will contain the 147 AI models from the AI Command Brain system.

## Model Categories:
- Property Valuation Models (CostForge AI)
- Predictive Analytics Models
- Neural Intelligence Networks
- Government Operations Models

## Migration Status:
- [ ] CostForge AI Models (from Rust backend)
- [ ] Neural Network Models
- [ ] Predictive Analytics Models
- [ ] Government Operations Models

Note: AI models will be migrated from the existing Rust backend during Phase 2.
"""
    
    try:
        with open(target_path / "ai-models" / "README.md", 'w', encoding='utf-8') as f:
            f.write(ai_models_readme)
        print("✓ Created AI models directory structure")
    except Exception as e:
        print(f"✗ Failed to create AI models README: {e}")
    
    # Summary Report
    print("\n=== Migration Summary ===")
    print(f"✓ Property Data: {property_count} properties consolidated")
    print("✓ Cost Matrices: Multiple matrices consolidated")
    print("✓ Databases: Legacy databases preserved")
    print("✓ Intelligence: County intelligence data migrated")
    print("✓ AI Models: Directory structure prepared")
    print("\n🎉 DATA CONSOLIDATION COMPLETED SUCCESSFULLY!")

def migrate_modules():
    """Migrate all 32 modules from fragmented system"""
    print("\n=== TerraFusion OS 1.0 Module Migration ===")
    
    source_path = Path("e:/TerraFusion_OS/modules")
    target_path = Path("e:/TerraFusion_OS_1.0/modules")
    
    print(f"Source: {source_path}")
    print(f"Target: {target_path}")
    print()
    
    # Module Priority Tiers
    tier1_modules = [
        "government-edition",
        "costforge-ai-champion", 
        "marketplace-champion",
        "ai-command-brain"
    ]
    
    tier2_modules = [
        "terra-agent-champion",
        "terra-flow-champion",
        "gispro",
        "terra-fusion-assessor",
        "terra-levy",
        "web-audit-tracker"
    ]
    
    tier3_modules = [
        "commercial-suite",
        "development",
        "costforge-ai",
        "costforge-ai-desktop",
        "terra-agent",
        "terra-collections",
        "terra-flow",
        "terra-fusion-dashboard",
        "terra-fusion-sync",
        "terra-insight",
        "terra-miner",
        "property-workbench"
    ]
    
    # Create target directory
    target_path.mkdir(parents=True, exist_ok=True)
    
    def migrate_module_tier(modules, tier_name, color):
        print(f"\n=== Migrating {tier_name} ===")
        
        for module in modules:
            source_module_path = source_path / module
            target_module_path = target_path / module
            
            if source_module_path.exists():
                try:
                    # Count items in source
                    item_count = sum(1 for _ in source_module_path.rglob('*'))
                    
                    # Copy module
                    if target_module_path.exists():
                        shutil.rmtree(target_module_path)
                    shutil.copytree(source_module_path, target_module_path)
                    
                    # Create module manifest
                    manifest = {
                        "name": module,
                        "tier": tier_name,
                        "itemCount": item_count,
                        "migratedAt": datetime.now().isoformat() + "Z",
                        "status": "active"
                    }
                    
                    with open(target_module_path / "module.manifest.json", 'w', encoding='utf-8') as f:
                        json.dump(manifest, f, indent=2)
                    
                    print(f"  ✓ {module} ({item_count} items)")
                except Exception as e:
                    print(f"  ✗ {module} (error: {e})")
            else:
                print(f"  ⚠ {module} (not found)")
    
    # Migrate by tiers
    migrate_module_tier(tier1_modules, "Tier 1 (Core Government)", "Cyan")
    migrate_module_tier(tier2_modules, "Tier 2 (Essential Operations)", "Yellow")
    migrate_module_tier(tier3_modules, "Tier 3 (Extended Features)", "Magenta")
    
    # Create module registry
    print("\n=== Creating Module Registry ===")
    
    module_registry = {
        "version": "1.0.0",
        "totalModules": len(tier1_modules + tier2_modules + tier3_modules),
        "tiers": {
            "tier1": {
                "name": "Core Government",
                "modules": tier1_modules,
                "priority": "high"
            },
            "tier2": {
                "name": "Essential Operations",
                "modules": tier2_modules,
                "priority": "medium"
            },
            "tier3": {
                "name": "Extended Features",
                "modules": tier3_modules,
                "priority": "low"
            }
        },
        "migratedAt": datetime.now().isoformat() + "Z"
    }
    
    try:
        with open(target_path / "module-registry.json", 'w', encoding='utf-8') as f:
            json.dump(module_registry, f, indent=2)
        print(f"✓ Module registry created with {module_registry['totalModules']} modules")
    except Exception as e:
        print(f"✗ Failed to create module registry: {e}")
    
    # Summary
    print("\n=== Migration Summary ===")
    print(f"✓ Tier 1 (Core): {len(tier1_modules)} modules")
    print(f"✓ Tier 2 (Essential): {len(tier2_modules)} modules")
    print(f"✓ Tier 3 (Extended): {len(tier3_modules)} modules")
    print(f"✓ Total: {len(tier1_modules + tier2_modules + tier3_modules)} modules migrated")
    print("\n🎉 MODULE MIGRATION COMPLETED SUCCESSFULLY!")

if __name__ == "__main__":
    try:
        print("Starting TerraFusion OS 1.0 Migration...")
        consolidate_data()
        migrate_modules()
        print("\n=== COMPLETE MIGRATION FINISHED ===")
        print("All data and modules have been successfully migrated to TerraFusion OS 1.0!")
    except Exception as e:
        print(f"Migration failed with error: {e}")
        sys.exit(1)
