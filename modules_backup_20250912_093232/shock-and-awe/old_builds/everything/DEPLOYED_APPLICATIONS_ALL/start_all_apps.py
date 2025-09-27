#!/usr/bin/env python3
"""
TerraFusion Platform Master Dashboard Launcher
Launches all 8 applications in sequence with verification
"""

import subprocess
import time
import requests
import sys
import os
from pathlib import Path

# Complete TerraFusion Application Suite
APPS = {
    "TerraFusion Build": {
        "dir": "TerraFusion_Build_PRODUCTION",
        "command": ["node", "simple-server.js"],
        "port": \${{TF_API_PORT:-5000}},
        "health_url": "http://localhost:\${{TF_API_PORT:-5000}}/",
        "description": "Property Assessment Platform"
    },
    "TerraFlow": {
        "dir": "TerraFlow_PRODUCTION", 
        "command": ["python", "app.py"],
        "port": \${{TF_API_PORT:-5000}},
        "health_url": "http://localhost:\${{TF_API_PORT:-5000}}/",
        "description": "Workflow Management Engine"
    },
    "TerraFusionSync": {
        "dir": "TerraFusionSync_PRODUCTION",
        "command": ["python", "app.py"],
        "port": \${{TF_API_PORT:-5000}},
        "health_url": "http://localhost:\${{TF_API_PORT:-5000}}/",
        "description": "Data Synchronization Hub"
    },
    "TerraAgent": {
        "dir": "TerraAgent_PRODUCTION",
        "command": ["python", "app_simple.py"],
        "port": \${{TF_API_PORT:-5000}},
        "health_url": "http://localhost:\${{TF_API_PORT:-5000}}/api/system_status",
        "description": "AI Agent Management System"
    },
    "TerraFusionAssessor": {
        "dir": "TerraFusionAssessor_PRODUCTION",
        "command": ["npm", "start"],
        "port": \${{TF_API_PORT:-5000}},
        "health_url": "http://localhost:\${{TF_API_PORT:-5000}}/",
        "description": "Enterprise Assessment Platform (36 Routes)"
    },
    "TerraFusionDashboard": {
        "dir": "TerraFusionDashboard_PRODUCTION",
        "command": ["npm", "run", "start"],
        "port": \${{TF_API_PORT:-5000}},
        "health_url": "http://localhost:\${{TF_API_PORT:-5000}}/",
        "description": "Executive Command Center Dashboard"
    },
    "TerraMiner": {
        "dir": "TerraMiner_PRODUCTION",
        "command": ["python", "app.py"],
        "port": \${{TF_API_PORT:-5000}},
        "health_url": "http://localhost:\${{TF_API_PORT:-5000}}/",
        "description": "Advanced Data Mining & Analytics (3,140 lines)"
    },
    "TerraFusionLevy": {
        "dir": "TerraFusionLevy_PRODUCTION",
        "command": ["python", "main.py"],
        "port": \${{TF_API_PORT:-5000}},
        "health_url": "http://localhost:\${{TF_API_PORT:-5000}}/",
        "description": "Tax Levy Management System"
    }
}

def check_port(port):
    """Check if a port is listening"""
    try:
        import socket
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(1)
        result = sock.connect_ex(('localhost', port))
        sock.close()
        return result == 0
    except:
        return False

def check_health(url):
    """Check if application is responding"""
    try:
        response = requests.get(url, timeout=5)
        return response.status_code in [200, 404]  # 404 is okay, means server is running
    except:
        return False

def start_application(name, config):
    """Start a single application"""
    print(f"\n🚀 Starting {name}...")
    print(f"   📋 {config['description']}")
    print(f"   🌐 Port: {config['port']}")
    print(f"   📁 Directory: {config['dir']}")
    
    # Check if already running
    if check_port(config['port']):
        print(f"   ✅ Already running on port {config['port']}")
        return True
    
    # Change to app directory
    app_dir = Path(config['dir'])
    if not app_dir.exists():
        print(f"   ❌ Directory not found: {config['dir']}")
        return False
    
    try:
        # Start the application
        process = subprocess.Popen(
            config['command'],
            cwd=app_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            creationflags=subprocess.CREATE_NEW_CONSOLE if sys.platform == "win32" else 0
        )
        
        # Wait for startup
        print(f"   ⏳ Waiting for startup...")
        for i in range(45):  # Wait up to 45 seconds for complex apps
            time.sleep(1)
            if check_port(config['port']):
                print(f"   ✅ {name} started successfully on port {config['port']}")
                
                # Verify health endpoint
                if check_health(config['health_url']):
                    print(f"   ✅ Health check passed: {config['health_url']}")
                else:
                    print(f"   ⚠️  Health check failed, but server is running")
                
                return True
            if i % 5 == 0:
                print(f"   ⏳ Still starting... ({i+1}/45)")
        
        print(f"   ❌ Failed to start {name} (timeout)")
        try:
            process.terminate()
        except:
            pass
        return False
        
    except Exception as e:
        print(f"   ❌ Error starting {name}: {str(e)}")
        return False

def show_dashboard():
    """Show the TerraFusion Dashboard"""
    print(f"\n🎯 TerraFusion Platform Dashboard")
    print("=" * 60)
    
    running_apps = []
    for name, config in APPS.items():
        status = "🟢 ONLINE" if check_port(config['port']) else "🔴 OFFLINE"
        print(f"{status} | {name}")
        print(f"         📋 {config['description']}")
        print(f"         🌐 http://localhost:{config['port']}")
        print()
        
        if check_port(config['port']):
            running_apps.append((name, config['port']))
    
    if running_apps:
        print(f"✅ {len(running_apps)}/8 Applications Online")
        print(f"\n🚀 Quick Access URLs:")
        for name, port in running_apps:
            print(f"   • {name}: http://localhost:{port}")
    else:
        print(f"❌ No applications currently running")

def main():
    """Main startup routine"""
    print("🌟 TerraFusion Platform Master Launcher")
    print("=" * 60)
    print("🏢 Enterprise Property Assessment & Tax Management Suite")
    print("🤖 AI-Powered Data Mining & Analytics Platform")
    print("=" * 60)
    
    # Show current status first
    show_dashboard()
    
    print(f"\n🚀 Starting TerraFusion Platform...")
    successful = 0
    total = len(APPS)
    
    # Start each application
    for name, config in APPS.items():
        if start_application(name, config):
            successful += 1
        else:
            print(f"⚠️  Skipping {name} - failed to start")
    
    # Final Summary
    print(f"\n🎊 TerraFusion Platform Startup Complete!")
    print("=" * 60)
    print(f"✅ Successfully started: {successful}/{total} applications")
    
    if successful == total:
        print(f"🎯 PERFECT! All {total} applications are running!")
    elif successful > 0:
        print(f"⚠️  {total - successful} applications need attention")
    else:
        print(f"❌ No applications started successfully")
        print(f"Please check the error messages above")
        return
    
    print(f"\n🌐 TerraFusion Platform URLs:")
    print("-" * 40)
    for name, config in APPS.items():
        if check_port(config['port']):
            print(f"🟢 {name}")
            print(f"   http://localhost:{config['port']}")
            print(f"   {config['description']}")
            print()
    
    print(f"🎊 Welcome to TerraFusion - The Future of Property Assessment! 🎊")

if __name__ == "__main__":
    main() 