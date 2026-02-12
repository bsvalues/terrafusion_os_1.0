#!/usr/bin/env python3
"""
TerraFusion Production Analysis Script
Diagnoses critical production readiness issues
"""

import os
import json
from pathlib import Path

def main():
    print('🚨 TERRAFUSION EMERGENCY PRODUCTION ANALYSIS')
    print('=' * 60)
    
    # Check production applications
    apps = [d for d in Path('.').iterdir() if d.is_dir() and 'PRODUCTION' in d.name]
    print(f'📊 Found {len(apps)} production applications:')
    for app in apps:
        print(f'  - {app.name}')
    
    print(f'\n🔍 CRITICAL DATABASE ARCHITECTURE ANALYSIS:')
    
    # Check TerraFusionSync database configuration
    sync_config = Path('TerraFusionSync_PRODUCTION/config/database.json')
    if sync_config.exists():
        with open(sync_config) as f:
            config = json.load(f)
        print(f'  ✅ TerraFusionSync config: {config.get("engine", "unknown")} engine')
    else:
        print('  ❌ TerraFusionSync database config missing')
    
    # Check for SQLite database
    sqlite_db = Path('terrafusionsync_real.db')
    print(f'  SQLite DB: {"✅" if sqlite_db.exists() else "❌"} ({sqlite_db})')
    
    # Check environment variables
    db_url = os.environ.get('DATABASE_URL')
    print(f'  DATABASE_URL: {"✅" if db_url else "❌"} {db_url or "Not set"}')
    
    print(f'\n🔗 APPLICATION CONNECTIVITY ANALYSIS:')
    
    # Check connectivity to TerraFusionSync
    api_connected = 0
    for app_dir in apps:
        has_api = False
        try:
            for py_file in list(app_dir.rglob('*.py'))[:10]:  # Limit to first 10 files
                content = py_file.read_text(errors='ignore')
                if any(p in content for p in ['localhost:5002', 'terrafusionsync', '/api/v1']):
                    has_api = True
                    break
        except Exception as e:
            print(f'    Error checking {app_dir.name}: {e}')
        
        status = '✅' if has_api else '❌'
        print(f'  {status} {app_dir.name}: {"Connected" if has_api else "Not connected"}')
        if has_api:
            api_connected += 1
    
    connectivity_score = (api_connected / len(apps) * 100) if apps else 0
    print(f'\n📈 CONNECTIVITY SCORE: {api_connected}/{len(apps)} ({connectivity_score:.1f}%)')
    
    print(f'\n🎨 BRANDING CONSISTENCY CHECK:')
    
    # Check branding
    brand_colors = ['#0891b2', '#00d2ff', 'cosmic-blue', 'quantum-teal']
    branded_apps = 0
    
    for app_dir in apps:
        has_branding = False
        try:
            for file_path in list(app_dir.rglob('*'))[:20]:  # Limit files checked
                if file_path.suffix in ['.css', '.html', '.py', '.js']:
                    content = file_path.read_text(errors='ignore')
                    if any(color in content for color in brand_colors):
                        has_branding = True
                        break
        except Exception as e:
            print(f'    Error checking branding for {app_dir.name}: {e}')
        
        status = '✅' if has_branding else '❌'
        print(f'  {status} {app_dir.name}: {"Branded" if has_branding else "Missing branding"}')
        if has_branding:
            branded_apps += 1
    
    branding_score = (branded_apps / len(apps) * 100) if apps else 0
    print(f'\n🎨 BRANDING SCORE: {branded_apps}/{len(apps)} ({branding_score:.1f}%)')
    
    # Overall assessment
    print(f'\n🏆 PRODUCTION READINESS SUMMARY:')
    print(f'  🔗 Data Connectivity: {connectivity_score:.1f}%')
    print(f'  🎨 Brand Consistency: {branding_score:.1f}%')
    
    overall_score = (connectivity_score + branding_score) / 2
    print(f'  📊 Overall Readiness: {overall_score:.1f}%')
    
    if overall_score < 70:
        print('🚨 VERDICT: CRITICAL PRODUCTION GAPS - IMMEDIATE ACTION REQUIRED')
        print('\n🔧 CRITICAL FIXES NEEDED:')
        if connectivity_score < 50:
            print('  1. Connect all applications to TerraFusionSync data hub')
            print('  2. Implement unified database architecture')
        if branding_score < 50:
            print('  3. Apply consistent TerraFusion branding')
            print('  4. Implement premium UI components')
    elif overall_score < 90:
        print('⚠️  VERDICT: PRODUCTION READINESS NEEDS WORK')
    else:
        print('✅ VERDICT: PRODUCTION READY')
    
    print(f'\n⚖️ Execute with Excellence. Fix These Issues NOW.')
    
    # Check for missing features
    print(f'\n🤖 MISSING AI FEATURES ANALYSIS:')
    
    # Check TerraFusion Build for AI features
    build_dir = Path('TerraFusionBuild_ACTUAL')
    if build_dir.exists():
        ai_features = ['valuation', 'analysis', 'ai', 'algorithm', 'prediction']
        found_features = []
        
        try:
            for py_file in list(build_dir.rglob('*.py'))[:20]:
                content = py_file.read_text(errors='ignore').lower()
                for feature in ai_features:
                    if feature in content and feature not in found_features:
                        found_features.append(feature)
        except Exception as e:
            print(f'    Error checking AI features: {e}')
        
        print(f'  AI Features Found: {len(found_features)}/5 ({", ".join(found_features)})')
        
        if len(found_features) < 3:
            print('  🚨 CRITICAL: Missing core AI valuation capabilities')
    else:
        print('  ❌ TerraFusion Build application not found')

if __name__ == "__main__":
    main() 