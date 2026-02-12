#!/usr/bin/env python3

"""
TerraFusion Complete Audit System Launcher
Orchestrates the entire audit ecosystem with all specialized subagents
"""

import asyncio
import subprocess
import sys
import time
import json
from datetime import datetime
from pathlib import Path

class TerraFusionAuditSystemLauncher:
    def __init__(self):
        self.script_dir = Path(__file__).parent
        self.components = [
            {
                'name': 'Comprehensive Audit System',
                'script': 'comprehensive-audit-system.sh',
                'description': 'Core audit infrastructure and UX agent',
                'type': 'shell'
            },
            {
                'name': 'Data Workflow Audit Agent',
                'script': 'data-workflow-audit-agent.py',
                'description': 'Data pipeline and workflow validation',
                'type': 'python'
            },
            {
                'name': 'Testing Coverage Audit Agent',
                'script': 'testing-coverage-audit-agent.py',
                'description': 'Test coverage analysis and validation',
                'type': 'python'
            },
            {
                'name': 'Integration Audit Agent',
                'script': 'integration-audit-agent.py',
                'description': 'System integration health checks',
                'type': 'python'
            },
            {
                'name': 'Audit Orchestrator',
                'script': 'audit-orchestrator.py',
                'description': 'Master coordinator for all audit agents',
                'type': 'python'
            },
            {
                'name': 'Continuous Audit Monitor',
                'script': 'continuous-audit-monitor.py',
                'description': '24/7 real-time monitoring and alerting',
                'type': 'python'
            },
            {
                'name': 'Automated Remediation System',
                'script': 'automated-remediation-system.py',
                'description': 'Self-healing and automated issue resolution',
                'type': 'python'
            },
            {
                'name': 'ML Analytics System',
                'script': 'ml-audit-analytics.py',
                'description': 'Machine learning powered insights and predictions',
                'type': 'python'
            },
            {
                'name': 'Audit API Server',
                'script': 'audit-api-server.py',
                'description': 'RESTful API and webhook integrations',
                'type': 'python'
            },
            {
                'name': 'Compliance Certification System',
                'script': 'compliance-certification-system.py',
                'description': 'Multi-framework compliance and certification',
                'type': 'python'
            }
        ]
        
    def print_banner(self):
        print("=" * 80)
        print("🚀 TerraFusion Complete Audit System")
        print("=" * 80)
        print("Advanced multi-agent audit system with comprehensive coverage:")
        print("")
        print("✅ User Experience Auditing")
        print("✅ Data Workflow Validation") 
        print("✅ Feature Implementation Verification")
        print("✅ Testing Coverage Analysis")
        print("✅ Integration Health Monitoring")
        print("✅ Real-time Continuous Monitoring")
        print("✅ Automated Remediation & Self-Healing")
        print("✅ ML-Powered Analytics & Insights")
        print("✅ RESTful API & Webhook Integrations")
        print("✅ Multi-Framework Compliance Certification")
        print("")
        print("=" * 80)
        print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 80)
        print("")
        
    def check_dependencies(self):
        """Check if required dependencies are available"""
        print("🔍 Checking system dependencies...")
        
        required_commands = ['python3', 'psql', 'redis-cli']
        missing_deps = []
        
        for cmd in required_commands:
            try:
                result = subprocess.run(['which', cmd], capture_output=True, text=True)
                if result.returncode == 0:
                    print(f"   ✅ {cmd} found: {result.stdout.strip()}")
                else:
                    missing_deps.append(cmd)
                    print(f"   ❌ {cmd} not found")
            except Exception as e:
                missing_deps.append(cmd)
                print(f"   ❌ {cmd} check failed: {e}")
                
        if missing_deps:
            print(f"\n⚠️  Missing dependencies: {', '.join(missing_deps)}")
            print("Please install the missing dependencies before proceeding.")
            return False
            
        print("✅ All dependencies satisfied\n")
        return True
        
    def show_component_menu(self):
        """Show interactive component selection menu"""
        print("📋 Available Audit System Components:")
        print("")
        
        for i, component in enumerate(self.components, 1):
            print(f"{i:2d}. {component['name']}")
            print(f"     {component['description']}")
            print("")
            
        print("🎯 Quick Actions:")
        print("11. Run Complete System Assessment")
        print("12. Start Continuous Monitoring")
        print("13. Generate Compliance Certification")
        print("14. Launch API Server")
        print("15. System Health Check")
        print("")
        print(" 0. Exit")
        print("")
        
    async def run_component(self, component):
        """Run a specific audit component"""
        script_path = self.script_dir / component['script']
        
        if not script_path.exists():
            print(f"❌ Script not found: {script_path}")
            return False
            
        print(f"🚀 Starting {component['name']}...")
        print(f"📄 Script: {component['script']}")
        print("")
        
        try:
            if component['type'] == 'python':
                # Run Python script
                process = await asyncio.create_subprocess_exec(
                    sys.executable, str(script_path),
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
                
                stdout, stderr = await process.communicate()
                
                if process.returncode == 0:
                    print("✅ Component completed successfully")
                    if stdout:
                        print("Output:")
                        print(stdout.decode())
                else:
                    print("❌ Component failed")
                    if stderr:
                        print("Error:")
                        print(stderr.decode())
                        
            elif component['type'] == 'shell':
                # Run shell script
                process = await asyncio.create_subprocess_exec(
                    'bash', str(script_path),
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
                
                stdout, stderr = await process.communicate()
                
                if process.returncode == 0:
                    print("✅ Component completed successfully")
                    if stdout:
                        print("Output:")
                        print(stdout.decode())
                else:
                    print("❌ Component failed")
                    if stderr:
                        print("Error:")
                        print(stderr.decode())
                        
            return process.returncode == 0
            
        except Exception as e:
            print(f"❌ Error running component: {e}")
            return False
            
    async def run_complete_assessment(self):
        """Run complete system assessment"""
        print("🎯 Running Complete TerraFusion System Assessment")
        print("=" * 60)
        
        assessment_results = {
            'started_at': datetime.now(),
            'components': {},
            'overall_success': True
        }
        
        # Run key assessment components in sequence
        key_components = [
            'comprehensive-audit-system.sh',
            'audit-orchestrator.py',
            'continuous-audit-monitor.py'
        ]
        
        for script_name in key_components:
            component = next((c for c in self.components if c['script'] == script_name), None)
            
            if component:
                print(f"\\n📊 Running {component['name']}...")
                success = await self.run_component(component)
                assessment_results['components'][component['name']] = {
                    'success': success,
                    'timestamp': datetime.now()
                }
                
                if not success:
                    assessment_results['overall_success'] = False
                    
                time.sleep(2)  # Brief pause between components
                
        assessment_results['completed_at'] = datetime.now()
        assessment_results['duration'] = (assessment_results['completed_at'] - assessment_results['started_at']).total_seconds()
        
        # Display results
        print("\\n" + "=" * 60)
        print("📊 Assessment Results Summary")
        print("=" * 60)
        
        successful_components = sum(1 for result in assessment_results['components'].values() if result['success'])
        total_components = len(assessment_results['components'])
        
        print(f"Total Components: {total_components}")
        print(f"Successful: {successful_components}")
        print(f"Failed: {total_components - successful_components}")
        print(f"Success Rate: {successful_components/total_components*100:.1f}%")
        print(f"Duration: {assessment_results['duration']:.1f} seconds")
        
        if assessment_results['overall_success']:
            print("\\n✅ COMPLETE ASSESSMENT SUCCESSFUL")
            print("🎉 All TerraFusion features and functions have been validated!")
        else:
            print("\\n⚠️  ASSESSMENT COMPLETED WITH ISSUES")
            print("Some components require attention.")
            
        return assessment_results
        
    async def start_monitoring_mode(self):
        """Start continuous monitoring mode"""
        print("🔄 Starting Continuous Monitoring Mode")
        print("=" * 50)
        
        monitoring_components = [
            'continuous-audit-monitor.py',
            'automated-remediation-system.py',
            'ml-audit-analytics.py'
        ]
        
        tasks = []
        
        for script_name in monitoring_components:
            component = next((c for c in self.components if c['script'] == script_name), None)
            
            if component:
                print(f"🚀 Starting {component['name']}...")
                task = asyncio.create_task(self.run_component(component))
                tasks.append(task)
                
        print("\\n✅ All monitoring components started")
        print("Press Ctrl+C to stop monitoring...")
        
        try:
            await asyncio.gather(*tasks)
        except KeyboardInterrupt:
            print("\\n🛑 Stopping monitoring mode...")
            for task in tasks:
                task.cancel()
                
    async def generate_certification(self):
        """Generate compliance certification"""
        print("📜 Generating Compliance Certification")
        print("=" * 40)
        
        # Run compliance certification system
        component = next((c for c in self.components if c['script'] == 'compliance-certification-system.py'), None)
        
        if component:
            success = await self.run_component(component)
            
            if success:
                print("\\n✅ Compliance certification generated successfully!")
                print("📁 Check the certificates/ directory for generated documents")
            else:
                print("\\n❌ Certification generation failed")
                
        return success
        
    async def launch_api_server(self):
        """Launch the audit API server"""
        print("🌐 Launching Audit API Server")
        print("=" * 30)
        
        component = next((c for c in self.components if c['script'] == 'audit-api-server.py'), None)
        
        if component:
            print("🚀 Starting API server on http://localhost:8080")
            print("📚 API Documentation: http://localhost:8080/docs")
            print("🔌 WebSocket endpoint: ws://localhost:8765")
            print("\\nPress Ctrl+C to stop the server...")
            
            await self.run_component(component)
            
    async def system_health_check(self):
        """Perform system health check"""
        print("🏥 System Health Check")
        print("=" * 25)
        
        health_status = {
            'database': False,
            'redis': False,
            'scripts': 0,
            'directories': 0
        }
        
        # Check database connectivity
        try:
            result = subprocess.run(['psql', '-h', 'localhost', '-U', 'postgres', '-d', 'terrafusion', '-c', 'SELECT 1;'], 
                                  capture_output=True, text=True, timeout=5)
            health_status['database'] = result.returncode == 0
            print(f"📊 Database: {'✅ Connected' if health_status['database'] else '❌ Connection failed'}")
        except Exception as e:
            print(f"📊 Database: ❌ Check failed - {e}")
            
        # Check Redis connectivity
        try:
            result = subprocess.run(['redis-cli', 'ping'], capture_output=True, text=True, timeout=5)
            health_status['redis'] = result.returncode == 0 and 'PONG' in result.stdout
            print(f"💾 Redis: {'✅ Connected' if health_status['redis'] else '❌ Connection failed'}")
        except Exception as e:
            print(f"💾 Redis: ❌ Check failed - {e}")
            
        # Check script availability
        available_scripts = 0
        for component in self.components:
            script_path = self.script_dir / component['script']
            if script_path.exists():
                available_scripts += 1
                
        health_status['scripts'] = available_scripts
        print(f"📄 Scripts: {available_scripts}/{len(self.components)} available")
        
        # Check directories
        required_dirs = ['reports', 'certificates', 'models']
        available_dirs = 0
        
        for dir_name in required_dirs:
            dir_path = self.script_dir.parent / dir_name
            if dir_path.exists():
                available_dirs += 1
                
        health_status['directories'] = available_dirs
        print(f"📁 Directories: {available_dirs}/{len(required_dirs)} available")
        
        # Overall health score
        total_checks = 4
        passed_checks = sum([
            health_status['database'],
            health_status['redis'],
            health_status['scripts'] == len(self.components),
            health_status['directories'] == len(required_dirs)
        ])
        
        health_score = passed_checks / total_checks * 100
        
        print(f"\\n🏥 Overall Health Score: {health_score:.1f}%")
        
        if health_score >= 75:
            print("✅ System is healthy and ready for auditing")
        elif health_score >= 50:
            print("⚠️  System has some issues but can operate")
        else:
            print("❌ System has significant issues requiring attention")
            
        return health_status
        
    async def interactive_mode(self):
        """Run interactive mode"""
        while True:
            self.show_component_menu()
            
            try:
                choice = input("Enter your choice (0-15): ").strip()
                
                if choice == '0':
                    print("\\n👋 Goodbye!")
                    break
                elif choice == '11':
                    await self.run_complete_assessment()
                elif choice == '12':
                    await self.start_monitoring_mode()
                elif choice == '13':
                    await self.generate_certification()
                elif choice == '14':
                    await self.launch_api_server()
                elif choice == '15':
                    await self.system_health_check()
                elif choice.isdigit() and 1 <= int(choice) <= len(self.components):
                    component = self.components[int(choice) - 1]
                    await self.run_component(component)
                else:
                    print("❌ Invalid choice. Please try again.\\n")
                    
                input("\\nPress Enter to continue...")
                print("\\n")
                
            except KeyboardInterrupt:
                print("\\n\\n👋 Goodbye!")
                break
            except Exception as e:
                print(f"❌ Error: {e}\\n")

async def main():
    """Main function"""
    launcher = TerraFusionAuditSystemLauncher()
    
    launcher.print_banner()
    
    # Check system dependencies
    if not launcher.check_dependencies():
        return 1
        
    # Check command line arguments
    if len(sys.argv) > 1:
        command = sys.argv[1].lower()
        
        if command == 'assess':
            await launcher.run_complete_assessment()
        elif command == 'monitor':
            await launcher.start_monitoring_mode()
        elif command == 'certify':
            await launcher.generate_certification()
        elif command == 'api':
            await launcher.launch_api_server()
        elif command == 'health':
            await launcher.system_health_check()
        else:
            print(f"❌ Unknown command: {command}")
            print("Available commands: assess, monitor, certify, api, health")
            return 1
    else:
        # Interactive mode
        await launcher.interactive_mode()
        
    return 0

if __name__ == '__main__':
    try:
        exit_code = asyncio.run(main())
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print("\\n\\n👋 System interrupted by user")
        sys.exit(130)
    except Exception as e:
        print(f"\\n❌ Unexpected error: {e}")
        sys.exit(1)