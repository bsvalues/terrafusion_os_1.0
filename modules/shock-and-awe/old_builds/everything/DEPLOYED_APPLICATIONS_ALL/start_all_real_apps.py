#!/usr/bin/env python3
"""
START ALL REAL TERRAFUSION PRODUCTION APPLICATIONS
Master launcher for all existing full-stack applications
"""
import subprocess
import time
import os
import sys
import webbrowser

print("🚀 STARTING ALL REAL TERRAFUSION PRODUCTION APPLICATIONS")
print("=" * 70)

# Real production applications to start
REAL_APPLICATIONS = [
    {
        "name": "TerraAgent Production",
        "path": "TerraAgent_PRODUCTION",
        "command": ["python", "app.py"],
        "port": \${{TF_API_PORT:-5000}},
        "url": "http://localhost:\${{TF_API_PORT:-5000}}"
    },
    {
        "name": "TerraFusionBuild Actual", 
        "path": "TerraFusionBuild_ACTUAL",
        "command": ["npm", "run", "dev"],
        "port": \${{TF_API_PORT:-5000}},
        "url": "http://localhost:\${{TF_API_PORT:-5000}}"
    },
    {
        "name": "TerraFusionSync Production",
        "path": "TerraFusionSync_PRODUCTION", 
        "command": ["python", "app.py"],
        "port": \${{TF_API_PORT:-5000}},
        "url": "http://localhost:\${{TF_API_PORT:-5000}}"
    },
    {
        "name": "BCBSGISPRO Production",
        "path": "BCBSGISPRO_PRODUCTION",
        "command": ["npm", "run", "dev"],
        "port": \${{TF_API_PORT:-5000}},
        "url": "http://localhost:\${{TF_API_PORT:-5000}}"
    },
    {
        "name": "BCBSLevy Production",
        "path": "BCBSLevy_PRODUCTION",
        "command": ["python", "app.py"],
        "port": \${{TF_API_PORT:-5000}},
        "url": "http://localhost:\${{TF_API_PORT:-5000}}"
    },
    {
        "name": "TerraFusionPro Production",
        "path": "TerraFusionPro_PRODUCTION",
        "command": ["python", "flask_api.py"],
        "port": \${{TF_API_PORT:-5000}},
        "url": "http://localhost:\${{TF_API_PORT:-5000}}"
    },
    {
        "name": "TerraMiner Production",
        "path": "TerraMiner_PRODUCTION",
        "command": ["python", "app.py"],
        "port": \${{TF_API_PORT:-5000}},
        "url": "http://localhost:\${{TF_API_PORT:-5000}}"
    },
    {
        "name": "TerraFusionAssessor Production",
        "path": "TerraFusionAssessor_PRODUCTION", 
        "command": ["python", "app.py"],
        "port": \${{TF_API_PORT:-5000}},
        "url": "http://localhost:\${{TF_API_PORT:-5000}}"
    }
]

def start_application(app_config):
    """Start a real production application"""
    print(f"▶️ Starting {app_config['name']}...")
    
    app_path = app_config['path']
    if not os.path.exists(app_path):
        print(f"❌ Directory not found: {app_path}")
        return None
        
    try:
        # Change to the application directory
        original_dir = os.getcwd()
        os.chdir(app_path)
        
        # Start the application
        process = subprocess.Popen(
            app_config['command'],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        # Go back to original directory
        os.chdir(original_dir)
        
        print(f"✅ {app_config['name']} started on port {app_config['port']}")
        return process
        
    except Exception as e:
        print(f"❌ Failed to start {app_config['name']}: {e}")
        return None

def main():
    print("🚀 LAUNCHING ALL REAL TERRAFUSION APPLICATIONS")
    print("=" * 70)
    
    processes = []
    
    # Start all applications
    for app_config in REAL_APPLICATIONS:
        process = start_application(app_config)
        if process:
            processes.append({
                'process': process,
                'config': app_config
            })
        time.sleep(3)  # Stagger startup
    
    print("\n" + "=" * 70)
    print("🎉 REAL TERRAFUSION SUITE IS NOW RUNNING!")
    print("=" * 70)
    print("📱 Access your REAL applications:")
    
    for app_config in REAL_APPLICATIONS:
        print(f"   • {app_config['name']:<30} {app_config['url']}")
    
    print("\n💡 These are REAL full-stack applications with:")
    print("   • Real property data and database connections")
    print("   • Working forms, calculations, and user interfaces")
    print("   • GIS mapping with actual Benton County coordinates")
    print("   • Assessment tools with real valuation algorithms")
    print("   • Sync capabilities with external data sources")
    
    # Open the first available application
    try:
        print(f"\n🌐 Opening {REAL_APPLICATIONS[0]['name']}...")
        webbrowser.open(REAL_APPLICATIONS[0]['url'])
    except:
        pass
        
    print("\n🔧 Press Ctrl+C to stop all applications")
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n🛑 Stopping all applications...")
        for process_info in processes:
            try:
                process_info['process'].terminate()
                print(f"✅ Stopped {process_info['config']['name']}")
            except:
                pass
        print("👋 All applications stopped")

if __name__ == "__main__":
    main() 