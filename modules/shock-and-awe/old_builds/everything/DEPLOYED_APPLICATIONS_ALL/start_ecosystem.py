#!/usr/bin/env python3
import os
import sys
import time
import subprocess
from pathlib import Path

def main():
    print("🚀 TerraFusion Enterprise Ecosystem Launcher")
    print("Intelligence That Counties Envy")
    print("=" * 60)
    
    apps = [
        {'name': 'TerraFusion Build', 'script': 'terrafusion_build_complete.py', "port": \${{TF_API_PORT:-5000}}},
        {'name': 'TerraFlow', 'path': 'TerraFlow_PRODUCTION', 'script': 'app.py', "port": \${{TF_API_PORT:-5000}}},
        {'name': 'TerraFusionSync', 'path': 'TerraFusionSync_PRODUCTION', 'script': 'app.py', "port": \${{TF_API_PORT:-5000}}},
        {'name': 'TerraAgent', 'path': 'TerraAgent_PRODUCTION', 'script': 'app.py', "port": \${{TF_API_PORT:-5000}}},
        {'name': 'TerraFusionAssessor', 'path': 'TerraFusionAssessor_PRODUCTION', 'script': 'app.py', "port": \${{TF_API_PORT:-5000}}},
        {'name': 'TerraFusionDashboard', 'path': 'TerraFusionDashboard_PRODUCTION', 'script': 'app.py', "port": \${{TF_API_PORT:-5000}}},
        {'name': 'TerraMiner', 'path': 'TerraMiner_PRODUCTION', 'script': 'app.py', "port": \${{TF_API_PORT:-5000}}},
        {'name': 'BSIncomeValuation', 'path': 'BSIncomeValuation_PRODUCTION', 'script': 'app.py', "port": \${{TF_API_PORT:-5000}}},
        {'name': 'TerraFusionPro', 'path': 'TerraFusionPro_PRODUCTION', 'script': 'app.py', "port": \${{TF_API_PORT:-5000}}},
        {'name': 'BCBSGISPRO', 'path': 'BCBSGISPRO_PRODUCTION', 'script': 'app.py', "port": \${{TF_API_PORT:-5000}}}
    ]
    
    launched = 0
    processes = []
    
    for app in apps:
        try:
            app_path = Path(app.get('path', '.'))
            script_path = app_path / app['script']
            
            print(f"🚀 Launching {app['name']} on port {app['port']}...")
            
            if script_path.exists():
                process = subprocess.Popen(
                    [sys.executable, str(script_path)],
                    cwd=str(app_path) if app_path != Path('.') else None,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE
                )
                processes.append((app['name'], process))
                print(f"✅ {app['name']} started (PID: {process.pid})")
                launched += 1
            else:
                print(f"❌ Script not found: {script_path}")
            
            time.sleep(2)
            
        except Exception as e:
            print(f"❌ Failed to launch {app['name']}: {str(e)}")
    
    print(f"\n🎯 Launched {launched}/{len(apps)} applications")
    print("\n🌐 Access URLs:")
    for app in apps:
        print(f"   {app['name']}: http://localhost:{app['port']}")
    
    print("\n🎉 TerraFusion Enterprise Ecosystem is running!")
    print("⌨️ Press Ctrl+C to shutdown all applications")
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n🛑 Shutting down applications...")
        for name, process in processes:
            try:
                process.terminate()
                print(f"✅ {name} stopped")
            except:
                pass
        print("🏁 Shutdown complete")

if __name__ == '__main__':
    main() 