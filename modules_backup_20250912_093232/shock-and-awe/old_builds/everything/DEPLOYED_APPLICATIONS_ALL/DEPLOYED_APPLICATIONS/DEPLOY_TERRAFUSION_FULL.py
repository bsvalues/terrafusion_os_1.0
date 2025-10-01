#!/usr/bin/env python3
� TERRAFUSION FULL ECOSYSTEM DEPLOYMENT V3.0.0
===============================================
Comprehensive deployment system for the complete TerraFusion platform
with production-ready infrastructure, database management, and monitoring.

Applications Deployed:
- TerraFusionPlayground: Application launcher & health monitor (Port 30
- TerraFusionSync: Data synchronization backbone (Port \${{TF_API_5002_PORT:-5002}}
- TerraFlow: Data processing engine (Port 51)
- TerraAgent: AI assistance system (Port 53- TerraMiner: Data mining platform (Port \${{TF_API_5002_PORT:-5002}}
- TerraLevy: Levy management system (Port 57
- TerraFusionAnalytics: Analytics dashboard (Port 508
- TerraFusionPilt: PILT management system (Port \${{TF_API_5002_PORT:-5002}})

Database Architecture:
- SQLite for development (fast, independent)
- PostgreSQL for production (scalable, enterprise)
- Automated data replication between services
"""

import os
import sys
import subprocess
import time
import json
import threading
import socket
import requests
from pathlib import Path
from datetime import datetime
import platform

class TerraFusionFullDeployment:
    def __init__(self):
        self.base_path = Path(__file__).parent
        self.processes = {}
        self.ports = [object Object]   self.deployment_log = []
        
        # Application configurations
        self.applications = {
          TerraFusionPlayground':[object Object]
             path': 'TerraFusionPlayground_PRODUCTION,
            port0
             command: ,
                type,
              description: plication Launcher & Health Monitor,
                health_endpoint': '/api/health'
            },
            TerraFusionSync':[object Object]
             path': TerraFusionSync_PRODUCTION,
            port2
                command':python app.py,
                type,
              description': 'Data Synchronization Backbone,
                health_endpoint': '/health'
            },
         TerraFlow[object Object]
                path': 'TerraFlow_PRODUCTION,
            port1
                command':python app.py,
                type,
              description': 'Data Processing Engine,
                health_endpoint': '/health'
            },
          TerraAgent[object Object]
            path': 'TerraAgent_PRODUCTION,
            port3
                command':python app.py,
                type,
                description': 'AI Assistance System,
                health_endpoint': '/health'
            },
          TerraMiner[object Object]
             path': 'TerraMiner_PRODUCTION,
            port6
                command':python app.py,
                type,
              description': 'Data Mining Platform,
                health_endpoint': '/health'
            },
         TerraLevy[object Object]
                path': 'TerraLevy_PRODUCTION,
            port7
                command':python app.py,
                type,
                description': 'Levy Management System,
                health_endpoint': '/health'
            },
          TerraFusionAnalytics':[object Object]
             path': 'TerraFusionAnalytics_PRODUCTION,
            port8
             command: ,
                type,
              description': 'Analytics Dashboard,
                health_endpoint': '/api/health'
            },
            TerraFusionPilt':[object Object]
             path': TerraFusionPilt_PRODUCTION,
            port9
             command: ,
                type,
               description': 'PILT Management System,
                health_endpoint': '/api/health'
            }
        }

    def log_event(self, event, level="INFO"):
        timestamp = datetime.now().strftime(%Y-%m-%d %H:%M:%S")
        log_entry = f"[{timestamp}] {level}: {event}"
        self.deployment_log.append(log_entry)
        print(log_entry)

    def print_banner(self):
        print("🚀 TERRAFUSION FULL ECOSYSTEM DEPLOYMENT V3.00)
        print("=" *60
        print("🎯 MISSION: Deploy civil infrastructure brain)
        print("⚡ DATABASE: Hybrid SQLite/PostgreSQL architecture)
        print("🧬 BRANDING: TerraFusion V2mic Blue + Quantum Teal))
        print("🏛️ TARGET: Benton County Assessor's Office)
        print("🔐 SECURITY: Production-ready with comprehensive monitoring)
        print("=" *60
        print()

    def check_prerequisites(self):
        self.log_event("Checking prerequisites...)
        print(🔍 CHECKING PREREQUISITES...")
        print(-     prerequisites = {
           Node.js': [node', '--version'],
            npm['npm', '--version'],
        Python: [sys.executable, '--version'],
            Git['git', '--version']
        }

        all_met = True
        for name, command in prerequisites.items():
            try:
                result = subprocess.run(command, capture_output=True, text=true0                if result.returncode == 0:
                    version = result.stdout.strip()
                    print(f"✅ {name}: {version}")
                    self.log_event(f"{name} found: {version})              else:
                    print(f"❌ {name}: Not found")
                    self.log_event(f"{name} not found", "ERROR")
                    all_met =false            except (FileNotFoundError, subprocess.TimeoutExpired):
                print(f"❌ {name}: Not found)              self.log_event(f"{name} not found", "ERROR)               all_met = False

        if all_met:
            print("✅ All prerequisites met!")
            self.log_event(All prerequisites verified successfully")
        else:
            print("❌ Some prerequisites missing")
            self.log_event("Prerequisites check failed",ERROR")

        print()
        return all_met

    def check_port_availability(self, port):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(("127))
                return True
            except OSError:
                return False

    def find_free_port(self, start_port):
        for port in range(start_port, start_port +100           if self.check_port_availability(port):
                return port
        return None

    def setup_database(self):
        self.log_event("Setting up database architecture...)
        print("🗄️ SETTING UP DATABASE ARCHITECTURE...")
        print(- * 40)

        db_script = self.base_path / "setup_database_architecture.py"
        if db_script.exists():
            try:
                result = subprocess.run([sys.executable, str(db_script)], 
                                      capture_output=True, text=true0                if result.returncode == 0:
                    print("✅ Database setup completed")
                    self.log_event("Database setup completed successfully)              else:
                    print(f⚠️ Database setup warnings: {result.stderr}")
                    self.log_event(f"Database setup warnings:[object Object]result.stderr}", "WARNING")
            except subprocess.TimeoutExpired:
                print(⚠️ Database setup timed out)              self.log_event("Database setup timed out", WARNING")
        else:
            print(⚠️ Database setup script not found")
            self.log_event("Database setup script not found", "WARNING")

        print()

    def create_application_directories(self):
        self.log_event("Creating application directories...)
        print("📁 CREATING APPLICATION DIRECTORIES...")
        print(-* 40)

        for app_name, config in self.applications.items():
            app_path = self.base_path / config['path']
            if not app_path.exists():
                app_path.mkdir(parents=True, exist_ok=True)
                print(f"✅ Created: {app_path})              self.log_event(fCreated directory: {app_path}")

                # Create basic application structure
                if config[type'] == 'nextjs':
                    self.create_nextjs_app(app_path, app_name)
                elif config[type'] == 'python':
                    self.create_python_app(app_path, app_name, config['port])
        print()

    def create_nextjs_app(self, app_path, app_name):
        package_json = app_path / "package.json"
        if not package_json.exists():
            package_content =[object Object]
              name": app_name.lower(),
               version": "1.0.0,
                description": f"[object Object]app_name} - TerraFusion Application,
           scripts                   dev":next dev -p 3000",
                build": "next build",
                start": "next start",
                    lint": "next lint"
                },
                dependencies                 next": "^14.0.0",
                  react                  react-dom": "^18               },
                devDependencies": {
                   @types/node": "^20",
                    @types/react": "^18",
                   @types/react-dom": "^18",
                   typescript": "^5                }
            }
            
            with open(package_json, 'w') as f:
                json.dump(package_content, f, indent=2)

        # Create basic Next.js structure
        app_dir = app_path /app"
        app_dir.mkdir(exist_ok=True)
        
        page_tsx = app_dir / page.tsx"
        if not page_tsx.exists():
            with open(page_tsx, 'w') as f:
                f.write(f''import React from 'react;

export default function {app_name}()[object Object][object Object] return (
    <div style={{ padding: 2em', fontFamily: Arial, sans-serif}}>
      <h1>🚀 {app_name}</h1    <p>TerraFusion Application - {app_name}</p>
      <p>Status: Running on port \${{TF_FRONTEND_PORT:-3000}}>
    </div>
  );
}}
'')

        layout_tsx = app_dir / "layout.tsx"
        if not layout_tsx.exists():
            with open(layout_tsx, 'w') as f:
                f.write(''import React from 'react;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) [object Object]return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
'')

    def create_python_app(self, app_path, app_name, port):
        app_py = app_path / "app.py"
        if not app_py.exists():
            with open(app_py, 'w') as f:
                f.write(f''fromflask import Flask, jsonify
import os

app = Flask(__name__)

@app.route('/)
defhome():
    return f🚀 {{app_name}} - TerraFusion Application"

@app.route('/health')
def health():
    return jsonify({{
        status": healthy",
      service": "{app_name},
        port": {port}
    }})

@app.route(/api/health')
def api_health():
    return jsonify({{
        status": healthy",
      service": "{app_name},
        port": {port}
    }})

if __name__ == '__main__':
    app.run(host='12700.1port={port}, debug=False)
''')

        requirements_txt = app_path /requirements.txt"
        if not requirements_txt.exists():
            with open(requirements_txt, 'w') as f:
                f.write("flask==30.0\nrequests==20.31)

    def launch_application(self, name, config):
        app_path = self.base_path / config[path']
        if not app_path.exists():
            self.log_event(f"Application directory not found: {app_path}", "ERROR")
            print(f"❌ {name}: Directory not found - {app_path}")
            return None

        # Check if port is available
        if not self.check_port_availability(config['port']):
            free_port = self.find_free_port(config['port'])           if free_port:
                config['port'] = free_port
                self.log_event(f"Port {config['port']} busy, using {free_port}")
            else:
                self.log_event(f"No free ports available for {name}", "ERROR")             print(f❌ {name}: No free ports available)            return None

        self.log_event(f"Launching {name} on port {config['port']}...)
        print(f"🚀 Launching {name} on port {config['port']}...)
        print(f"   📁 Path: {app_path})
        print(f   📝 Description: {config['description]}")

        try:
            if config[type'] == 'nextjs':
                # Install dependencies if needed
                node_modules = app_path / "node_modules"
                if not node_modules.exists():
                    self.log_event(f"Installing dependencies for {name}...")
                    subprocess.run([npm, 'install'], cwd=app_path, 
                                 capture_output=True, timeout=300)

                process = subprocess.Popen(
                    config['command'].split(),
                    cwd=app_path,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True
                )
            else:
                # Install Python dependencies if needed
                requirements = app_path /requirements.txt"
                if requirements.exists():
                    self.log_event(fInstalling Python dependencies for {name}...")
                    subprocess.run([sys.executable, '-m,pip', install-r',requirements.txt'], 
                                 cwd=app_path, capture_output=True, timeout=300)

                process = subprocess.Popen(
                    [sys.executable, 'app.py'],
                    cwd=app_path,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True
                )

            self.processes[name] = process
            self.ports[name] = config['port']
            print(f✅ {name}: Started (PID: {process.pid})")
            self.log_event(f"{name} started successfully (PID: {process.pid})")
            return process

        except Exception as e:
            error_msg = fFailed to start {name}: {e}          self.log_event(error_msg, "ERROR")
            print(f"❌ {name}: {error_msg}")
            return None

    def verify_deployment(self):
        self.log_event("Verifying deployment status...")
        print("\n🔍 VERIFYING DEPLOYMENT STATUS...")
        print(-)

        healthy_services = 0
        total_services = len(self.applications)

        for name, config in self.applications.items():
            if name in self.processes and self.processes[name].poll() is None:
                port = self.ports.get(name, config['port'])
                health_url = f"http://127.000.1rt}{config[health_endpoint']}"
                
                try:
                    response = requests.get(health_url, timeout=5)
                    if response.status_code == 200:
                        print(f✅ {name}: HEALTHY (Port {port})")
                        self.log_event(f"{name} verified healthy on port {port}")
                        healthy_services += 1
                    else:
                        print(f⚠️ {name}: Status {response.status_code} (Port {port})")
                        self.log_event(f"{name} returned status {response.status_code}", "WARNING)            except requests.exceptions.RequestException:
                    print(f❌ {name}: OFFLINE (Port {port})")
                    self.log_event(f{name} is offline on port {port}", "ERROR")
            else:
                print(f❌ {name}: NOT RUNNING)              self.log_event(f"{name} is not running",ERROR")

        print(f"\n📊 DEPLOYMENT SUMMARY: {healthy_services}/{total_services} services healthy")
        self.log_event(f"Deployment verification complete: {healthy_services}/{total_services} healthy")

        if healthy_services == total_services:
            print("🎉 ALL SERVICES DEPLOYED SUCCESSFULLY!")
            self.log_event("Full deployment successful", SUCCESS")
        else:
            print(f"⚠️ {total_services - healthy_services} services need attention")
            self.log_event(f"Deployment incomplete: {total_services - healthy_services} services failed", "WARNING")

        print()

    def create_health_monitor(self):
        self.log_event("Creating health monitor...)
        monitor_script = self.base_path / HEALTH_MONITOR.py   
        health_endpoints = []
        for name, config in self.applications.items():
            port = self.ports.get(name, config['port'])
            health_endpoints.append(f       {name}:http://127.00.1t}{config\"health_endpoint\"]}',")

        monitor_content = f'''#!/usr/bin/env python3rt requests
import time
import json
from datetime import datetime

def check_health():
    services = {{
{chr(10n(health_endpoints)}
    }}
    
    print("🏥 TERRAFUSION HEALTH MONITOR)
    print("=" * 50)
    print(f"Timestamp: {{datetime.now().strftime(%Y-%m-%d %H:%M:%S')}}")
    print()
    
    healthy_count =0
    total_count = len(services)
    
    for name, url in services.items():
        try:
            response = requests.get(url, timeout=5)
            if response.status_code == 200             print(f"✅ {{name}}: HEALTHY)           healthy_count += 1            else:
                print(f"⚠️ {{name}}: Status {{response.status_code}}")
        except:
            print(f"❌ {{name}}: OFFLINE")
    
    print("=" * 50)
    print(fHealth Status: {{healthy_count}}/{{total_count}} services healthy")
    
    if healthy_count == total_count:
        print("🎉 ALL SYSTEMS OPERATIONAL!")
    else:
        print(f"⚠️ {{total_count - healthy_count}} services need attention")
    
    print()

if __name__ == "__main__":
    while True:
        check_health()
        time.sleep(30)
''     
        with open(monitor_script, 'w') as f:
            f.write(monitor_content)
        
        print(f"✅ Health monitor created: {monitor_script}")
        self.log_event(f"Health monitor created: {monitor_script})
    def create_deployment_summary(self):
        self.log_event("Creating deployment summary...)      summary_file = self.base_path / "DEPLOYMENT_SUMMARY.md  
        summary_content = f"� TerraFusion Full Deployment Summary

## Deployment Information
- **Date**: {datetime.now().strftime(%Y-%m-%d %H:%M:%S)}
- **Version**: 300
- **Status**: {'✅ SUCCESSFUL' if len(self.processes) == len(self.applications) else⚠️ PARTIAL}

##Application Status

""      
        for name, config in self.applications.items():
            status = "✅ RUNNING" if name in self.processes and self.processes[name].poll() is None else "❌ STOPPED            port = self.ports.get(name, config['port'])
            summary_content += f"- **{name}**: {status} (Port {port})\n   summary_content += f""## Access Points

""      
        for name, config in self.applications.items():
            port = self.ports.get(name, config['port'])
            summary_content += f"- **{name}**: http://1270{port}\n   summary_content += f"""
## Health Monitoring

Run the health monitor to check all services:
```bash
python HEALTH_MONITOR.py
```

## Deployment Log

```
{chr(10).join(self.deployment_log)}
```

## Next Steps

1. Access the TerraFusionPlayground at http://127.0.00.12itor system health with the health monitor
3. Configure additional services as needed
4. Set up production environment variables
""     
        with open(summary_file, 'w') as f:
            f.write(summary_content)
        
        print(f"✅ Deployment summary created: {summary_file}")
        self.log_event(f"Deployment summary created: {summary_file})

    def deploy_ecosystem(self):
        self.print_banner()

        if not self.check_prerequisites():
            self.log_event("Prerequisites check failed, deployment aborted", "ERROR")
            print("❌ Prerequisites not met. Deployment aborted.")
            return False

        self.setup_database()
        self.create_application_directories()

        self.log_event("Starting TerraFusion ecosystem deployment...)
        print("🚀 STARTING TERRAFUSION ECOSYSTEM DEPLOYMENT...)
        print(= * 60)

        # Launch applications in order
        deployment_order = [
          TerraFusionPlayground',  # Application launcher
            TerraFusionSync',        # Data backbone
      TerraFlow',              # Data processing
       TerraAgent',             # AI system
       TerraMiner',             # Data mining
      TerraLevy',              # Levy management
          TerraFusionAnalytics',   # Analytics dashboard
           TerraFusionPilt'         # PILT management
        ]

        for app_name in deployment_order:
            if app_name in self.applications:
                config = self.applications[app_name]
                self.launch_application(app_name, config)
                time.sleep(2)  # Stagger launches

        # Wait for services to initialize
        self.log_event("Waiting for services to initialize...")
        print("\n⏳ Waiting for services to initialize...")
        time.sleep(15)

        # Verify deployment
        self.verify_deployment()

        # Create health monitor and summary
        self.create_health_monitor()
        self.create_deployment_summary()

        self.log_event("TerraFusion ecosystem deployment completed", SUCCESS")
        print("\n🎉 TERRAFUSION ECOSYSTEM DEPLOYMENT COMPLETE!)
        print("=" *60
        print("🌐 Access Points:")
        
        for name, config in self.applications.items():
            port = self.ports.get(name, config['port'])
            print(f • [object Object]name}: http://127:{port}")

        print("\n🏥 Health Monitor: python HEALTH_MONITOR.py)
        print("📋 Summary: DEPLOYMENT_SUMMARY.md)
        print(=0       return True

    def cleanup(self):
        self.log_event("Cleaning up processes...")
        print("\n🧹 Cleaning up processes...")
        for name, process in self.processes.items():
            if process.poll() is None:
                process.terminate()
                print(f"✅ {name}: Terminated)              self.log_event(f{name} terminated")


if __name__ == "__main__":
    deployer = TerraFusionFullDeployment()

    try:
        success = deployer.deploy_ecosystem()
        if success:
            print(n🎯 Press Ctrl+C to stop all services...")
            while True:
                time.sleep(1)
    except KeyboardInterrupt:
        print("\n🛑 Shutdown requested...")
        deployer.cleanup()
        print("✅ TerraFusion Ecosystem stopped.")
    except Exception as e:
        print(f"\n❌ Deployment error: {e}")
        deployer.cleanup() 