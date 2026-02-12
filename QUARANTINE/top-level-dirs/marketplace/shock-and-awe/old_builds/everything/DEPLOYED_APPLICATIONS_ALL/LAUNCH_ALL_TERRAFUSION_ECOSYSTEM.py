#!/usr/bin/env python3
"""
TerraFusion Enterprise Ecosystem - Complete Deployment Launcher
==============================================================
Intelligence That Counties Envy • Tesla Precision • Jobs Elegance • Musk Scale • Brady Excellence

This system launches all 10 TerraFusion applications in production mode
with real-time monitoring, health checks, and enterprise-grade management.
"""

import os
import sys
import time
import json
import logging
import subprocess
import threading
import requests
from datetime import datetime
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('terrafusion_ecosystem_launch.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class TerraFusionEcosystemLauncher:
    def __init__(self):
        self.base_dir = Path(__file__).parent
        self.applications = {
            'TerraFusion Build': {
                'path': 'TerraFusion_Build_PRODUCTION',
                'script': 'terrafusion_build_ENTERPRISE_COMPLETE.py',
                'port': 5000,
                'description': 'Property Assessment Platform with AI Valuation',
                'features': ['AI Valuation Engine', 'Portfolio Analytics', 'Market Intelligence', 'Risk Assessment'],
                'status': 'READY'
            },
            'TerraFlow': {
                'path': 'TerraFlow_PRODUCTION',
                'script': 'app.py',
                'port': 5001,
                'description': 'Workflow Management Engine',
                'features': ['Workflow Automation', 'Task Management', 'Process Optimization'],
                'status': 'READY'
            },
            'TerraFusionSync': {
                'path': 'TerraFusionSync_PRODUCTION',
                'script': 'app.py',
                'port': 5002,
                'description': 'Data Synchronization Hub',
                'features': ['Database Sync', 'Data Export', 'Integration Management'],
                'status': 'READY'
            },
            'TerraAgent': {
                'path': 'TerraAgent_PRODUCTION',
                'script': 'app.py',
                'port': 5003,
                'description': 'AI Management System',
                'features': ['AI Agent Control', 'Smart Analytics', 'Automated Processing'],
                'status': 'READY'
            },
            'TerraFusionAssessor': {
                'path': 'TerraFusionAssessor_PRODUCTION',
                'script': 'app.py',
                'port': 5004,
                'description': 'Enterprise Assessment Platform',
                'features': ['Assessment Tools', 'Valuation Models', 'Report Generation'],
                'status': 'READY'
            },
            'TerraFusionDashboard': {
                'path': 'TerraFusionDashboard_PRODUCTION',
                'script': 'app.py',
                'port': 5005,
                'description': 'Executive Command Center',
                'features': ['Executive Dashboard', 'KPI Monitoring', 'Strategic Analytics'],
                'status': 'READY'
            },
            'TerraMiner': {
                'path': 'TerraMiner_PRODUCTION',
                'script': 'app.py',
                'port': 5006,
                'description': 'Advanced Data Mining & Analytics',
                'features': ['Data Mining', 'Pattern Recognition', 'Predictive Analytics'],
                'status': 'READY'
            },
            'BSIncomeValuation': {
                'path': 'BSIncomeValuation_PRODUCTION',
                'script': 'app.py',
                'port': 5007,
                'description': 'Income-Based Valuation System',
                'features': ['Income Analysis', 'Cash Flow Modeling', 'ROI Calculations'],
                'status': 'READY'
            },
            'TerraFusionPro': {
                'path': 'TerraFusionPro_PRODUCTION',
                'script': 'app.py',
                'port': 5008,
                'description': 'Professional Services Portal',
                'features': ['Professional Tools', 'Advanced Reports', 'Client Management'],
                'status': 'READY'
            },
            'BCBSGISPRO': {
                'path': 'BCBSGISPRO_PRODUCTION',
                'script': 'app.py',
                'port': 5010,
                'description': 'GIS Professional Tools',
                'features': ['GIS Mapping', 'Spatial Analysis', 'Property Visualization'],
                'status': 'READY'
            }
        }
        
        self.processes = {}
        self.health_status = {}

    def print_banner(self):
        """Display TerraFusion ecosystem banner"""
        banner = """
╔══════════════════════════════════════════════════════════════════════════════╗
║                         TerraFusion Enterprise Ecosystem                     ║
║                        Intelligence That Counties Envy                       ║
║                                                                              ║
║    🚀 Tesla Precision  •  🎨 Jobs Elegance  •  ⚡ Musk Scale  •  🏆 Brady Excellence    ║
║                                                                              ║
║                            10 Applications Ready                             ║
║                         Enterprise-Grade Deployment                         ║
╚══════════════════════════════════════════════════════════════════════════════╝
        """
        print(banner)
        logger.info("🚀 TerraFusion Enterprise Ecosystem - Deployment Initiated")

    def check_prerequisites(self):
        """Check system prerequisites"""
        logger.info("🔍 Checking system prerequisites...")
        
        # Check Python
        python_version = sys.version_info
        if python_version.major < 3 or (python_version.major == 3 and python_version.minor < 8):
            logger.error("❌ Python 3.8+ required")
            return False
        
        logger.info(f"✅ Python {python_version.major}.{python_version.minor} detected")
        
        # Check if in correct directory
        if not self.base_dir.exists():
            logger.error("❌ DEPLOYED_APPLICATIONS directory not found")
            return False
        
        logger.info("✅ Deployment directory verified")
        
        # Check application directories
        missing_apps = []
        for app_name, config in self.applications.items():
            app_path = self.base_dir / config['path']
            if not app_path.exists():
                missing_apps.append(app_name)
        
        if missing_apps:
            logger.warning(f"⚠️ Missing applications: {', '.join(missing_apps)}")
        else:
            logger.info("✅ All application directories found")
        
        return True

    def launch_application(self, app_name, config):
        """Launch individual application"""
        try:
            app_path = self.base_dir / config['path']
            script_path = app_path / config['script']
            
            if not script_path.exists():
                logger.error(f"❌ {app_name}: Script not found at {script_path}")
                return False
            
            logger.info(f"🚀 Launching {app_name} on port {config['port']}...")
            
            # Change to application directory and start
            env = os.environ.copy()
            env['FLASK_ENV'] = 'production'
            env['FLASK_DEBUG'] = '0'
            
            process = subprocess.Popen(
                [sys.executable, str(script_path)],
                cwd=str(app_path),
                env=env,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            
            self.processes[app_name] = process
            
            # Wait a moment for startup
            time.sleep(3)
            
            # Check if process is still running
            if process.poll() is None:
                logger.info(f"✅ {app_name} launched successfully (PID: {process.pid})")
                return True
            else:
                stdout, stderr = process.communicate()
                logger.error(f"❌ {app_name} failed to start")
                logger.error(f"   STDOUT: {stdout}")
                logger.error(f"   STDERR: {stderr}")
                return False
                
        except Exception as e:
            logger.error(f"❌ {app_name}: Launch error - {str(e)}")
            return False

    def check_application_health(self, app_name, config):
        """Check application health via HTTP"""
        try:
            url = f"http://localhost:{config['port']}/health"
            response = requests.get(url, timeout=5)
            
            if response.status_code == 200:
                self.health_status[app_name] = {
                    'status': 'HEALTHY',
                    'response_time': response.elapsed.total_seconds() * 1000,
                    'timestamp': datetime.now().isoformat()
                }
                return True
            else:
                self.health_status[app_name] = {
                    'status': 'UNHEALTHY',
                    'error': f"HTTP {response.status_code}",
                    'timestamp': datetime.now().isoformat()
                }
                return False
                
        except requests.exceptions.ConnectionError:
            # Try alternative endpoint
            try:
                url = f"http://localhost:{config['port']}/"
                response = requests.get(url, timeout=5)
                if response.status_code == 200:
                    self.health_status[app_name] = {
                        'status': 'HEALTHY',
                        'response_time': response.elapsed.total_seconds() * 1000,
                        'timestamp': datetime.now().isoformat()
                    }
                    return True
            except:
                pass
                
            self.health_status[app_name] = {
                'status': 'UNREACHABLE',
                'error': 'Connection refused',
                'timestamp': datetime.now().isoformat()
            }
            return False
            
        except Exception as e:
            self.health_status[app_name] = {
                'status': 'ERROR',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
            return False

    def monitor_ecosystem(self):
        """Continuous ecosystem monitoring"""
        while True:
            try:
                time.sleep(30)  # Check every 30 seconds
                
                healthy_count = 0
                total_count = len(self.applications)
                
                for app_name, config in self.applications.items():
                    if self.check_application_health(app_name, config):
                        healthy_count += 1
                
                health_percentage = (healthy_count / total_count) * 100
                
                if health_percentage >= 90:
                    status = "EXCELLENT"
                elif health_percentage >= 70:
                    status = "GOOD"
                else:
                    status = "NEEDS ATTENTION"
                
                logger.info(f"🏥 Ecosystem Health: {health_percentage:.1f}% ({healthy_count}/{total_count}) - {status}")
                
            except KeyboardInterrupt:
                logger.info("🛑 Monitoring stopped by user")
                break
            except Exception as e:
                logger.error(f"❌ Monitoring error: {str(e)}")

    def display_ecosystem_status(self):
        """Display comprehensive ecosystem status"""
        print("\n" + "="*80)
        print("🌐 TERRAFUSION ENTERPRISE ECOSYSTEM STATUS")
        print("="*80)
        
        healthy_apps = 0
        total_apps = len(self.applications)
        
        for app_name, config in self.applications.items():
            print(f"\n📱 {app_name}")
            print(f"   Description: {config['description']}")
            print(f"   Port: {config['port']}")
            print(f"   URL: http://localhost:{config['port']}")
            print(f"   Features: {', '.join(config['features'])}")
            
            # Check if process is running
            if app_name in self.processes:
                process = self.processes[app_name]
                if process.poll() is None:
                    print(f"   Process: ✅ RUNNING (PID: {process.pid})")
                else:
                    print(f"   Process: ❌ STOPPED")
            else:
                print(f"   Process: ⚠️ NOT LAUNCHED")
            
            # Check health status
            if app_name in self.health_status:
                health = self.health_status[app_name]
                if health['status'] == 'HEALTHY':
                    print(f"   Health: ✅ HEALTHY ({health.get('response_time', 0):.0f}ms)")
                    healthy_apps += 1
                else:
                    print(f"   Health: ❌ {health['status']} - {health.get('error', 'Unknown')}")
            else:
                print(f"   Health: ⏳ CHECKING...")
        
        # Overall status
        health_percentage = (healthy_apps / total_apps) * 100
        print(f"\n{'='*80}")
        print(f"🏆 ECOSYSTEM SUMMARY")
        print(f"   Applications: {healthy_apps}/{total_apps} healthy ({health_percentage:.1f}%)")
        print(f"   Status: {'EXCELLENT' if health_percentage >= 90 else 'GOOD' if health_percentage >= 70 else 'NEEDS ATTENTION'}")
        print(f"   Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("="*80)

    def launch_ecosystem(self):
        """Launch the complete TerraFusion ecosystem"""
        self.print_banner()
        
        if not self.check_prerequisites():
            logger.error("❌ Prerequisites check failed")
            return False
        
        logger.info("🚀 Starting TerraFusion Enterprise Ecosystem...")
        
        # Launch applications sequentially with delays
        launched_count = 0
        for app_name, config in self.applications.items():
            if self.launch_application(app_name, config):
                launched_count += 1
                time.sleep(3)  # Stagger launches
            else:
                logger.warning(f"⚠️ {app_name} failed to launch, continuing...")
        
        logger.info(f"🎯 Launch Phase Complete: {launched_count}/{len(self.applications)} applications started")
        
        # Wait for applications to fully initialize
        logger.info("⏳ Waiting for applications to initialize...")
        time.sleep(10)
        
        # Perform health checks
        logger.info("🏥 Performing health checks...")
        for app_name, config in self.applications.items():
            self.check_application_health(app_name, config)
            time.sleep(1)
        
        # Display status
        self.display_ecosystem_status()
        
        # Generate PowerShell access commands
        self.generate_access_commands()
        
        # Start monitoring in background
        logger.info("🔍 Starting continuous monitoring...")
        monitor_thread = threading.Thread(target=self.monitor_ecosystem, daemon=True)
        monitor_thread.start()
        
        return True

    def generate_access_commands(self):
        """Generate PowerShell commands for easy access"""
        print(f"\n{'='*80}")
        print("🖥️ POWERSHELL ACCESS COMMANDS")
        print("="*80)
        
        for app_name, config in self.applications.items():
            url = f"http://localhost:{config['port']}"
            print(f"# {app_name}")
            print(f"Start-Process '{url}'")
            print()
        
        print("# Open All Applications")
        urls = [f"'http://localhost:{config['port']}'" for config in self.applications.values()]
        print(f"Start-Process {', '.join(urls[:5])}")
        if len(urls) > 5:
            print(f"Start-Process {', '.join(urls[5:])}")

    def shutdown_ecosystem(self):
        """Gracefully shutdown all applications"""
        logger.info("🛑 Shutting down TerraFusion Ecosystem...")
        
        for app_name, process in self.processes.items():
            try:
                if process.poll() is None:
                    logger.info(f"🛑 Stopping {app_name}...")
                    process.terminate()
                    process.wait(timeout=10)
                    logger.info(f"✅ {app_name} stopped")
            except Exception as e:
                logger.error(f"❌ Error stopping {app_name}: {str(e)}")
        
        logger.info("🏁 TerraFusion Ecosystem shutdown complete")

def main():
    """Main execution function"""
    launcher = TerraFusionEcosystemLauncher()
    
    try:
        if launcher.launch_ecosystem():
            print("\n🎉 TerraFusion Enterprise Ecosystem is now running!")
            print("📊 Monitor logs in: terrafusion_ecosystem_launch.log")
            print("🌐 Access applications via the URLs shown above")
            print("\n⌨️ Press Ctrl+C to shutdown the ecosystem")
            
            # Keep main thread alive
            while True:
                time.sleep(1)
        else:
            logger.error("❌ Failed to launch ecosystem")
            return 1
            
    except KeyboardInterrupt:
        print("\n\n🛑 Shutdown requested by user")
        launcher.shutdown_ecosystem()
        return 0
    except Exception as e:
        logger.error(f"❌ Unexpected error: {str(e)}")
        launcher.shutdown_ecosystem()
        return 1

if __name__ == '__main__':
    sys.exit(main()) 