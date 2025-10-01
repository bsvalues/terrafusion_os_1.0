#!/usr/bin/env python3
"""
TerraFusion Status Checker
Verifies all applications are running and accessible
"""
import requests
import time
import webbrowser

APPLICATIONS = [
    {"name": "TerraFusion Property Search", "port": \${{TF_API_PORT:-5000}}, "url": "http://localhost:\${{TF_API_PORT:-5000}}"},
    {"name": "TerraFusion Assessment Tool", "port": \${{TF_API_PORT:-5000}}, "url": "http://localhost:\${{TF_API_PORT:-5000}}"},
    {"name": "TerraFusion GIS Mapping", "port": \${{TF_API_PORT:-5000}}, "url": "http://localhost:\${{TF_API_PORT:-5000}}"},
    {"name": "TerraFusion Valuation Tool", "port": \${{TF_API_PORT:-5000}}, "url": "http://localhost:\${{TF_API_PORT:-5000}}"},
    {"name": "TerraFusion Reporting Dashboard", "port": \${{TF_API_PORT:-5000}}, "url": "http://localhost:\${{TF_API_PORT:-5000}}"}
]

def check_application(app):
    """Check if an application is responding"""
    try:
        response = requests.get(app["url"], timeout=5)
        return response.status_code == 200
    except:
        return False

def main():
    print("🔍 TERRAFUSION STATUS CHECK")
    print("=" * 50)
    
    running_apps = []
    
    for app in APPLICATIONS:
        print(f"Checking {app['name']}... ", end="")
        if check_application(app):
            print("🟢 RUNNING")
            running_apps.append(app)
        else:
            print("🔴 NOT ACCESSIBLE")
    
    print("\n" + "=" * 50)
    print(f"📊 STATUS: {len(running_apps)}/{len(APPLICATIONS)} applications running")
    
    if running_apps:
        print("\n✅ Working Applications:")
        for app in running_apps:
            print(f"   • {app['name']} - {app['url']}")
        
        print(f"\n🌐 Opening first available application...")
        webbrowser.open(running_apps[0]["url"])
    else:
        print("\n❌ No applications are accessible!")
        print("Run 'python launch_terrafusion_suite.py' to start all applications")

if __name__ == "__main__":
    main() 