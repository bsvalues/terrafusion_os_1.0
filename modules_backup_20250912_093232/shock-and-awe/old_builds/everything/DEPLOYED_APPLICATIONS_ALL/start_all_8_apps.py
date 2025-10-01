#!/usr/bin/env python3
"""
🌟 TerraFusion Complete Platform Launcher 🌟
ALL 8 Enterprise Applications with Real-time Dashboard
Property Assessment • AI Management • Data Mining • Tax Management
"""

import subprocess
import time
import requests
import sys
import os
from pathlib import Path
import threading
import webbrowser

# 🚀 Complete TerraFusion Suite - ALL 8 Applications
TERRAFUSION_APPS = {
    "1️⃣ TerraFusion Build": {
        "dir": "TerraFusion_Build_PRODUCTION",
        "command": ["node", "simple-server.js"],
        "port": \${{TF_API_PORT:-5000}},
        "url": "http://localhost:\${{TF_API_PORT:-5000}}",
        "icon": "🏠",
        "category": "Property Assessment",
        "description": "Core Property Assessment Platform"
    },
    "2️⃣ TerraFlow": {
        "dir": "TerraFlow_PRODUCTION", 
        "command": ["python", "app.py"],
        "port": \${{TF_API_PORT:-5000}},
        "url": "http://localhost:\${{TF_API_PORT:-5000}}",
        "icon": "🔄",
        "category": "Workflow Management", 
        "description": "Data Workflow & Process Engine"
    },
    "3️⃣ TerraFusionSync": {
        "dir": "TerraFusionSync_PRODUCTION",
        "command": ["python", "app.py"],
        "port": \${{TF_API_PORT:-5000}},
        "url": "http://localhost:\${{TF_API_PORT:-5000}}",
        "icon": "🔗",
        "category": "Data Synchronization",
        "description": "Multi-System Data Hub"
    },
    "4️⃣ TerraAgent": {
        "dir": "TerraAgent_PRODUCTION",
        "command": ["python", "app_simple.py"],
        "port": \${{TF_API_PORT:-5000}},
        "url": "http://localhost:\${{TF_API_PORT:-5000}}",
        "icon": "🤖",
        "category": "AI Management",
        "description": "AI Agent Management System"
    },
    "5️⃣ TerraFusionAssessor": {
        "dir": "TerraFusionAssessor_PRODUCTION",
        "command": ["npm", "start"],
        "port": \${{TF_API_PORT:-5000}},
        "url": "http://localhost:\${{TF_API_PORT:-5000}}",
        "icon": "🏢",
        "category": "Enterprise Assessment",
        "description": "Advanced Assessment Platform (36 Routes)"
    },
    "6️⃣ TerraFusionDashboard": {
        "dir": "TerraFusionDashboard_PRODUCTION",
        "command": ["node", "dist/index.js"],
        "port": \${{TF_API_PORT:-5000}},
        "url": "http://localhost:\${{TF_API_PORT:-5000}}",
        "icon": "📊",
        "category": "Executive Dashboard",
        "description": "Command Center & Analytics"
    },
    "7️⃣ TerraMiner": {
        "dir": "TerraMiner_PRODUCTION",
        "command": ["python", "app.py"],
        "port": \${{TF_API_PORT:-5000}},
        "url": "http://localhost:\${{TF_API_PORT:-5000}}",
        "icon": "⛏️",
        "category": "Data Mining",
        "description": "Advanced Analytics (3,140 lines)"
    },
    "8️⃣ TerraFusionLevy": {
        "dir": "TerraFusionLevy_PRODUCTION",
        "command": ["python", "main.py"],
        "port": \${{TF_API_PORT:-5000}},
        "url": "http://localhost:\${{TF_API_PORT:-5000}}",
        "icon": "💰",
        "category": "Tax Management",
        "description": "Comprehensive Levy System"
    }
}

# Process tracking
running_processes = {}

def check_port(port):
    """Check if port is listening"""
    try:
        import socket
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(2)
        result = sock.connect_ex(('localhost', port))
        sock.close()
        return result == 0
    except:
        return False

def check_health(url):
    """Check application health"""
    try:
        response = requests.get(url, timeout=5)
        return response.status_code in [200, 404, 302, 301]
    except:
        return False

def start_single_app(name, config):
    """Start individual application"""
    print(f"\n🚀 Starting {name}")
    print(f"   {config['icon']} {config['description']}")
    print(f"   🌐 Port {config['port']} | {config['category']}")
    
    # Check if running
    if check_port(config['port']):
        print(f"   ✅ Already running!")
        return True
    
    # Verify directory
    app_dir = Path(config['dir'])
    if not app_dir.exists():
        print(f"   ❌ Directory missing: {config['dir']}")
        return False
    
    try:
        # Windows-optimized process creation
        startupinfo = None
        creationflags = 0
        
        if sys.platform == "win32":
            startupinfo = subprocess.STARTUPINFO()
            startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
            startupinfo.wShowWindow = subprocess.SW_MINIMIZE
            creationflags = subprocess.CREATE_NEW_CONSOLE
        
        # Start process
        process = subprocess.Popen(
            config['command'],
            cwd=app_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            startupinfo=startupinfo,
            creationflags=creationflags
        )
        
        running_processes[name] = process
        
        # Wait for startup
        print(f"   ⏳ Starting up...")
        for i in range(45):
            time.sleep(1)
            if check_port(config['port']):
                print(f"   ✅ {name} is LIVE on port {config['port']}!")
                return True
            if i % 15 == 14:
                print(f"   ⏳ Still loading... ({i+1}/45s)")
        
        print(f"   ❌ Startup timeout")
        process.terminate()
        return False
        
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
        return False

def show_live_dashboard():
    """Display real-time platform status"""
    print("\n" + "🌟" * 25)
    print("🌟 TERRAFUSION COMPLETE PLATFORM 🌟")
    print("🌟" * 25)
    print("🏢 Enterprise Property Assessment & Tax Management")
    print("🤖 AI-Powered Data Mining & Analytics Suite")
    print("=" * 70)
    
    online_count = 0
    online_apps = []
    
    for name, config in TERRAFUSION_APPS.items():
        is_online = check_port(config['port'])
        status = "🟢 ONLINE " if is_online else "🔴 OFFLINE"
        
        print(f"{status} {config['icon']} {name}")
        print(f"       📋 {config['description']}")
        print(f"       🌐 {config['url']} | {config['category']}")
        print()
        
        if is_online:
            online_count += 1
            online_apps.append((name, config))
    
    print(f"📊 PLATFORM STATUS: {online_count}/8 Applications Online")
    
    if online_count == 8:
        print(f"🎊 PERFECT! FULL PLATFORM OPERATIONAL! 🎊")
    elif online_count >= 6:
        print(f"🎯 Excellent! Most applications running")
    elif online_count >= 3:
        print(f"⚡ Good! Core applications online")
    else:
        print(f"⚠️  Platform needs attention")
    
    return online_count, online_apps

def open_browser_dashboard(online_apps):
    """Open browser tabs for all running applications"""
    if online_apps:
        print(f"\n🌐 Opening {len(online_apps)} applications in browser...")
        for name, config in online_apps[:3]:  # Open first 3 to avoid overwhelming
            try:
                webbrowser.open(config['url'])
                time.sleep(1)
            except:
                pass

def main():
    """Master Launcher"""
    try:
        print("🚀" * 30)
        print("🚀 TERRAFUSION MASTER LAUNCHER 🚀")
        print("🚀" * 30)
        
        # Initial status
        online_count, online_apps = show_live_dashboard()
        
        # Ask what to do
        print(f"\n🎯 Choose Action:")
        print(f"   1️⃣ Start All Applications (Full Platform)")
        print(f"   2️⃣ Show Status Only")
        print(f"   3️⃣ Open Browser Dashboard")
        print(f"   4️⃣ Exit")
        
        try:
            choice = input(f"\n💡 Enter choice (1-4): ").strip()
        except:
            choice = "1"  # Default to starting all
        
        if choice == "2":
            show_live_dashboard()
            return
        elif choice == "3":
            online_count, online_apps = show_live_dashboard()
            open_browser_dashboard(online_apps)
            return
        elif choice == "4":
            print(f"👋 Goodbye!")
            return
        
        # Start all applications
        print(f"\n🚀 Starting TerraFusion Platform...")
        print(f"⏳ This will take 2-3 minutes for all 8 applications...")
        
        successful = 0
        total = len(TERRAFUSION_APPS)
        
        for i, (name, config) in enumerate(TERRAFUSION_APPS.items(), 1):
            print(f"\n📋 [{i}/{total}] Launching {name}...")
            if start_single_app(name, config):
                successful += 1
            time.sleep(1)  # Brief pause between starts
        
        # Final results
        print(f"\n" + "🎊" * 40)
        print(f"🎊 TERRAFUSION PLATFORM LAUNCH COMPLETE! 🎊")
        print(f"🎊" * 40)
        print(f"✅ Success Rate: {successful}/{total} applications ({(successful/total)*100:.1f}%)")
        
        if successful == total:
            print(f"🏆 PERFECT DEPLOYMENT! All applications running!")
        elif successful >= 6:
            print(f"🎯 Excellent! Platform mostly operational")
        else:
            print(f"⚠️  Some applications need attention")
        
        # Show final dashboard
        time.sleep(2)
        online_count, online_apps = show_live_dashboard()
        
        if online_apps:
            print(f"\n🌐 QUICK ACCESS URLS:")
            print(f"=" * 40)
            for name, config in online_apps:
                print(f"✅ {config['icon']} {name}")
                print(f"   🌐 {config['url']}")
                print(f"   📋 {config['description']}")
                print()
        
        print(f"🎯 TerraFusion Platform Ready!")
        print(f"🔗 Click any URL above to access applications")
        
        # Auto-open browser
        try:
            auto_open = input(f"\n💡 Open applications in browser? (y/n): ").lower()
            if auto_open.startswith('y'):
                open_browser_dashboard(online_apps)
        except:
            pass
        
        print(f"\n🎊 Welcome to TerraFusion - The Future of Property Assessment! 🎊")
        
    except KeyboardInterrupt:
        print(f"\n⚠️  Interrupted by user")
    except Exception as e:
        print(f"❌ Launcher error: {str(e)}")

if __name__ == "__main__":
    main() 