#!/usr/bin/env python3
"""
DEPLOYMENT FAILURE ANALYSIS
Michael's perspective - What actually went wrong
"""

import os
import requests
from pathlib import Path

def analyze_deployment_failures():
    print("💀 DEPLOYMENT FAILURE ANALYSIS")
    print("=" * 50)
    print("Michael's Analysis: Here's what's actually broken")
    print()
    
    # Check 1: Are the actual application files present?
    print("🔍 Check 1: Application File Structure")
    expected_apps = [
        "TerraFusion_Build_PRODUCTION",
        "TerraFlow_PRODUCTION", 
        "TerraFusionSync_PRODUCTION",
        "TerraAgent_PRODUCTION",
        "TerraFusionAssessor_PRODUCTION",
        "TerraFusionDashboard_PRODUCTION",
        "TerraMiner_PRODUCTION",
        "BSIncomeValuation_PRODUCTION",
        "TerraFusionPro_PRODUCTION",
        "BCBSGISPRO_PRODUCTION"
    ]
    
    missing_apps = []
    for app in expected_apps:
        app_path = Path(app)
        if not app_path.exists():
            missing_apps.append(app)
            print(f"❌ MISSING: {app}")
        else:
            # Check if main application file exists
            main_files = ["app.py", "main.py", "terrafusion_build_ENTERPRISE_COMPLETE.py"]
            has_main = any((app_path / main_file).exists() for main_file in main_files)
            if has_main:
                print(f"✅ EXISTS: {app}")
            else:
                print(f"⚠️ INCOMPLETE: {app} (no main application file)")
    
    # Check 2: Are applications actually running?
    print(f"\n🔍 Check 2: Application Accessibility")
    ports = [5000, 5001, 5002, 5003, 5004, 5005, 5006, 5007, 5008, 5010]
    running_apps = 0
    
    for port in ports:
        try:
            response = requests.get(f"http://localhost:{port}/health", timeout=5)
            if response.status_code == 200:
                print(f"✅ Port {port}: RUNNING")
                running_apps += 1
            else:
                print(f"❌ Port {port}: HTTP {response.status_code}")
        except requests.exceptions.ConnectionError:
            print(f"❌ Port {port}: NOT ACCESSIBLE")
        except requests.exceptions.Timeout:
            print(f"⏰ Port {port}: TIMEOUT")
        except Exception as e:
            print(f"❌ Port {port}: ERROR - {str(e)[:50]}")
    
    # Check 3: DevOps template deployment status
    print(f"\n🔍 Check 3: DevOps Template Deployment")
    template_indicators = [
        "enterprise_templates/",
        "terrafusion_branding/",
        "verify_enterprise_restoration.py",
        "continuous_enterprise_monitoring.py"
    ]
    
    for indicator in template_indicators:
        if Path(indicator).exists():
            print(f"✅ PRESENT: {indicator}")
        else:
            print(f"❌ MISSING: {indicator}")
    
    # The Brutal Truth
    print(f"\n💀 THE BRUTAL TRUTH:")
    print(f"   📊 Applications Actually Running: {running_apps}/{len(ports)}")
    print(f"   📁 Missing Application Directories: {len(missing_apps)}")
    print(f"   🔧 DevOps Work Status: Templates created but not integrated")
    print()
    
    if running_apps == 0:
        print("🚨 CRITICAL ISSUE: NO APPLICATIONS ARE ACTUALLY RUNNING")
        print("   The DevOps scripts created templates but didn't start applications")
        print("   Either the applications don't exist or they failed to start")
    
    if missing_apps:
        print("🚨 CRITICAL ISSUE: MISSING APPLICATION DIRECTORIES")
        print("   The following expected production directories don't exist:")
        for app in missing_apps:
            print(f"   - {app}")
    
    print("\n🔧 REQUIRED ACTIONS:")
    print("1. Locate the actual TerraFusion application files")
    print("2. Ensure they're in the correct DEPLOYED_APPLICATIONS structure") 
    print("3. Manually start each application and verify it runs")
    print("4. THEN apply the DevOps enterprise features")
    print("5. Don't trust automation until basic apps work")

if __name__ == "__main__":
    analyze_deployment_failures() 