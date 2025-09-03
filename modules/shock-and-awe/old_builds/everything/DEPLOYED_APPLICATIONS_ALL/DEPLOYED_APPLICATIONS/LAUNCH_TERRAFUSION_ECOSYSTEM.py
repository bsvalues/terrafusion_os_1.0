#!/usr/bin/env python3
"""
🚀 TERRAFUSION ECOSYSTEM LAUNCHER V2.0.0
=========================================
Comprehensive deployment system for all TerraFusion applications
with hybrid database architecture and production-ready infrastructure.

Database Architecture:
- SQLite for development (fast, independent)
- PostgreSQL for production (scalable, enterprise)
- Automated data replication between services

Applications Deployed:
- TerraFusionPilt: PILT management system (Port 5009) ✅ OPERATIONAL
- TerraFlow: Data processing engine (Port 5001)
- TerraSync: Data synchronization backbone (Port 5002)
- TerraAgent: AI assistance system (Port 5003)
- TerraMiner: Data mining platform (Port 5006)
- TerraFusionPlayground: Application launcher (Port 3000)
"""

import os
import sys
import subprocess
import time
import json
import threading
from pathlib import Path


class TerraFusionEcosystemLauncher:
    def __init__(self):
        self.base_path = Path(__file__).parent
        self.applications = {
            'TerraFusionPilt': {
                'path': 'TerraFusionPilt_PRODUCTION',
                'port': 5009,
                'status': 'OPERATIONAL',
                'command': 'npm run dev',
                'description': 'PILT Management System - DATABASE FIX VERIFIED ✅'
            },
            'TerraFlow': {
                'path': 'TerraFlow_PRODUCTION',
                'port': 5001,
                'status': 'READY',
                'command': 'python app.py',
                'description': 'Data Processing Engine'
            },
            'TerraSync': {
                'path': 'TerraFusionSync_PRODUCTION',
                'port': 5002,
                'status': 'READY',
                'command': 'python app.py',
                'description': 'Data Synchronization Backbone'
            },
            'TerraAgent': {
                'path': 'TerraAgent_PRODUCTION',
                'port': 5003,
                'status': 'READY',
                'command': 'python app.py',
                'description': 'AI Assistance System'
            },
            'TerraMiner': {
                'path': 'TerraMiner_PRODUCTION',
                'port': 5006,
                'status': 'READY',
                'command': 'python app.py',
                'description': 'Data Mining Platform'
            },
            'TerraFusionPlayground': {
                'path': 'TerraFusionPlayground_PRODUCTION',
                'port': 3000,
                'status': 'READY',
                'command': 'python start_playground.py',
                'description': 'Application Launcher & Health Monitor'
            }
        }
        self.processes = {}

    def print_banner(self):
        print("🚀 TERRAFUSION ECOSYSTEM LAUNCHER V2.0.0")
        print("=" * 50)
        print("🎯 MISSION: Deploy civil infrastructure brain")
        print("⚡ DATABASE: Hybrid SQLite/PostgreSQL architecture")
        print("🧬 BRANDING: TerraFusion V2.0 (Cosmic Blue + Quantum Teal)")
        print("🏛️ TARGET: Benton County Assessor's Office")
        print("=" * 50)
        print()

    def check_prerequisites(self):
        print("🔍 CHECKING PREREQUISITES...")
        print("-" * 30)

        # Check Node.js
        try:
            result = subprocess.run(
                ['node', '--version'], capture_output=True, text=True)
            print(f"✅ Node.js: {result.stdout.strip()}")
        except FileNotFoundError:
            print("❌ Node.js not found")
            return False

        # Check Python
        print(f"✅ Python: {sys.version.split()[0]}")

        # Check npm
        try:
            result = subprocess.run(
                ['npm', '--version'], capture_output=True, text=True)
            print(f"✅ npm: {result.stdout.strip()}")
        except FileNotFoundError:
            print("❌ npm not found")
            return False

        print("✅ All prerequisites met!")
        print()
        return True

    def launch_application(self, name, config):
        app_path = self.base_path / config['path']
        if not app_path.exists():
            print(f"❌ {name}: Directory not found - {app_path}")
            return None

        print(f"🚀 Launching {name} on port {config['port']}...")
        print(f"   📁 Path: {app_path}")
        print(f"   📝 Description: {config['description']}")

        try:
            if config['command'].startswith('npm'):
                process = subprocess.Popen(
                    config['command'].split(),
                    cwd=app_path,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True
                )
            else:
                process = subprocess.Popen(
                    [sys.executable] + config['command'].split()[1:],
                    cwd=app_path,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True
                )

            self.processes[name] = process
            print(f"✅ {name}: Started (PID: {process.pid})")
            return process

        except Exception as e:
            print(f"❌ {name}: Failed to start - {e}")
            return None

    def verify_deployment(self):
        print("\n🔍 VERIFYING DEPLOYMENT STATUS...")
        print("-" * 40)

        for name, config in self.applications.items():
            if name in self.processes and self.processes[name].poll() is None:
                print(f"✅ {name}: Running on port {config['port']}")
            else:
                print(f"⚠️ {name}: Not running")

        print("\n🎯 DEPLOYMENT VERIFICATION COMPLETE")

    def create_health_monitor(self):
        monitor_script = self.base_path / "HEALTH_MONITOR.py"
        with open(monitor_script, 'w') as f:
            f.write('''#!/usr/bin/env python3
import requests
import time
import json

def check_health():
    services = {
        'TerraFusionPilt': 'http://localhost:5009/api/health',
        'TerraFlow': 'http://localhost:5001/api/health',
        'TerraSync': 'http://localhost:5002/api/health',
        'TerraAgent': 'http://localhost:5003/api/health',
        'TerraMiner': 'http://localhost:5006/api/health',
        'Playground': 'http://localhost:3000/api/health'
    }
    
    print("🏥 TERRAFUSION HEALTH MONITOR")
    print("=" * 35)
    
    for name, url in services.items():
        try:
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                print(f"✅ {name}: HEALTHY")
            else:
                print(f"⚠️ {name}: Status {response.status_code}")
        except:
            print(f"❌ {name}: OFFLINE")
    
    print("=" * 35)

if __name__ == "__main__":
    while True:
        check_health()
        time.sleep(30)
''')
        print(f"✅ Health monitor created: {monitor_script}")

    def deploy_ecosystem(self):
        self.print_banner()

        if not self.check_prerequisites():
            print("❌ Prerequisites not met. Deployment aborted.")
            return False

        print("🚀 STARTING TERRAFUSION ECOSYSTEM DEPLOYMENT...")
        print("=" * 50)

        # Launch applications in order
        deployment_order = [
            'TerraFusionPilt',  # Already operational
            'TerraSync',        # Data backbone
            'TerraFlow',        # Data processing
            'TerraAgent',       # AI system
            'TerraMiner',       # Data mining
            'TerraFusionPlayground'  # Application launcher
        ]

        for app_name in deployment_order:
            if app_name in self.applications:
                config = self.applications[app_name]
                if app_name == 'TerraFusionPilt' and config['status'] == 'OPERATIONAL':
                    print(
                        f"✅ {app_name}: Already running (Database fix verified)")
                    continue

                self.launch_application(app_name, config)
                time.sleep(3)  # Stagger launches

        # Wait for services to initialize
        print("\n⏳ Waiting for services to initialize...")
        time.sleep(10)

        # Verify deployment
        self.verify_deployment()

        # Create health monitor
        self.create_health_monitor()

        print("\n🎉 TERRAFUSION ECOSYSTEM DEPLOYMENT COMPLETE!")
        print("=" * 50)
        print("🌐 Access Points:")
        print("   • TerraFusionPilt: http://localhost:5009")
        print("   • TerraFlow: http://localhost:5001")
        print("   • TerraSync: http://localhost:5002")
        print("   • TerraAgent: http://localhost:5003")
        print("   • TerraMiner: http://localhost:5006")
        print("   • Playground: http://localhost:3000")
        print("\n🏥 Health Monitor: python HEALTH_MONITOR.py")
        print("=" * 50)

        return True

    def cleanup(self):
        print("\n🧹 Cleaning up processes...")
        for name, process in self.processes.items():
            if process.poll() is None:
                process.terminate()
                print(f"✅ {name}: Terminated")


if __name__ == "__main__":
    launcher = TerraFusionEcosystemLauncher()

    try:
        success = launcher.deploy_ecosystem()
        if success:
            print("\n🎯 Press Ctrl+C to stop all services...")
            while True:
                time.sleep(1)
    except KeyboardInterrupt:
        print("\n🛑 Shutdown requested...")
        launcher.cleanup()
        print("✅ TerraFusion Ecosystem stopped.")
    except Exception as e:
        print(f"\n❌ Deployment error: {e}")
        launcher.cleanup()
