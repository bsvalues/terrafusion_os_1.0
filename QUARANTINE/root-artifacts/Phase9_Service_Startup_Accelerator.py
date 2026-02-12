#!/usr/bin/env python3
"""
TerraFusion Elite Government OS - Phase 9 Service Startup Accelerator
Intelligent service startup acceleration with government-grade initialization assistance.
Government. Transcended.
"""

import subprocess
import json
import time
import requests
from datetime import datetime

class Phase9ServiceStartupAccelerator:
    """Advanced service startup acceleration and initialization assistance"""

    def __init__(self):
        self.target_services = {
            'terrafusion-os-core': {
                'name': 'OS Core',
                'priority': 'CRITICAL',
                'expected_ports': [8080],
                'dependencies': ['database']
            },
            'terrafusion-compliance': {
                'name': 'Government Compliance',
                'priority': 'CRITICAL',
                'expected_ports': [5030, 8082],
                'dependencies': ['database']
            },
            'terrafusion-isolation': {
                'name': 'County Isolation',
                'priority': 'CRITICAL',
                'expected_ports': [8083],
                'dependencies': ['database']
            },
            'terrafusion-quantum': {
                'name': 'Quantum Optimizer',
                'priority': 'ENHANCED',
                'expected_ports': [8003, 8085],
                'dependencies': []
            },
            'terrafusion-harris-bridge': {
                'name': 'Harris PACS Bridge',
                'priority': 'INTEGRATION',
                'expected_ports': [8084],
                'dependencies': []
            }
        }

    def print_banner(self):
        print("🚀 PHASE 9: SERVICE STARTUP ACCELERATOR")
        print("=" * 39)
        print("🎯 Mission: Accelerate TerraFusion Service Initialization")
        print("🛡️ Method: Intelligent Container Management & Startup Assistance")
        print("⚡ Target: Government-Grade Service Excellence Achievement")
        print("=" * 39)
        print()

    def check_container_status(self, container_name: str) -> dict:
        """Get detailed container status and startup information"""
        try:
            inspect_cmd = ['docker', 'inspect', container_name]
            inspect_result = subprocess.run(inspect_cmd, capture_output=True, text=True, timeout=5)

            if inspect_result.returncode == 0:
                container_info = json.loads(inspect_result.stdout)[0]
                state = container_info['State']

                return {
                    'exists': True,
                    'running': state['Running'],
                    'status': state['Status'],
                    'exit_code': state.get('ExitCode'),
                    'started_at': state.get('StartedAt'),
                    'finished_at': state.get('FinishedAt'),
                    'restart_count': state.get('RestartCount', 0),
                    'error': state.get('Error', ''),
                    'health': state.get('Health', {}).get('Status', 'unknown')
                }
            else:
                return {'exists': False}

        except Exception as e:
            return {'exists': False, 'error': str(e)}

    def get_container_logs(self, container_name: str, lines: int = 20) -> str:
        """Get recent container logs for startup analysis"""
        try:
            logs_cmd = ['docker', 'logs', '--tail', str(lines), container_name]
            logs_result = subprocess.run(logs_cmd, capture_output=True, text=True, timeout=10)

            if logs_result.returncode == 0:
                return logs_result.stdout
            else:
                return f"Failed to get logs: {logs_result.stderr}"

        except Exception as e:
            return f"Error getting logs: {str(e)}"

    def restart_service(self, container_name: str) -> bool:
        """Restart a service with proper timing and validation"""
        print(f"      🔄 Restarting {container_name}...")

        try:
            # Stop the container
            stop_cmd = ['docker', 'stop', container_name]
            stop_result = subprocess.run(stop_cmd, capture_output=True, text=True, timeout=30)

            # Wait a moment for clean shutdown
            time.sleep(2)

            # Start the container
            start_cmd = ['docker', 'start', container_name]
            start_result = subprocess.run(start_cmd, capture_output=True, text=True, timeout=30)

            if start_result.returncode == 0:
                print(f"      ✅ Successfully restarted {container_name}")
                return True
            else:
                print(f"      ❌ Failed to restart {container_name}: {start_result.stderr}")
                return False

        except Exception as e:
            print(f"      ❌ Error restarting {container_name}: {str(e)}")
            return False

    def validate_network_connectivity(self) -> bool:
        """Validate Docker network connectivity"""
        try:
            # Check if terrafusion-os-network exists
            network_cmd = ['docker', 'network', 'inspect', 'terrafusion-os-network']
            network_result = subprocess.run(network_cmd, capture_output=True, text=True, timeout=5)

            if network_result.returncode == 0:
                print("      ✅ TerraFusion OS Network: Connected")
                return True
            else:
                print("      ⚠️ TerraFusion OS Network: Not found, creating...")

                # Create the network
                create_cmd = ['docker', 'network', 'create', 'terrafusion-os-network']
                create_result = subprocess.run(create_cmd, capture_output=True, text=True, timeout=10)

                if create_result.returncode == 0:
                    print("      ✅ Created TerraFusion OS Network")
                    return True
                else:
                    print(f"      ❌ Failed to create network: {create_result.stderr}")
                    return False

        except Exception as e:
            print(f"      ❌ Network validation error: {str(e)}")
            return False

    def run_startup_acceleration(self):
        """Execute intelligent service startup acceleration"""
        self.print_banner()

        acceleration_start_time = time.time()

        print("🔍 STARTUP ACCELERATION DIAGNOSTIC")
        print("=" * 34)

        # Validate network connectivity first
        print("   🌐 Network Connectivity...")
        network_ok = self.validate_network_connectivity()
        print()

        # Check all target services
        services_needing_restart = []
        services_status = {}

        print("   📊 Service Status Analysis...")

        for container_name, config in self.target_services.items():
            service_name = config['name']
            priority = config['priority']

            print(f"      🔍 Analyzing {service_name}...")

            status = self.check_container_status(container_name)
            services_status[container_name] = status

            if not status['exists']:
                print(f"      ⚠️ Container not found: {container_name}")
                continue

            if not status['running']:
                print(f"      🔄 Not running (Status: {status['status']}) [{priority}]")
                services_needing_restart.append(container_name)
            elif status['restart_count'] > 2:
                print(f"      ⚠️ Multiple restarts detected ({status['restart_count']}) [{priority}]")
                # Get logs to analyze the issue
                recent_logs = self.get_container_logs(container_name, 10)
                if "error" in recent_logs.lower() or "failed" in recent_logs.lower():
                    services_needing_restart.append(container_name)
            else:
                print(f"      ✅ Running normally [{priority}]")

        print()

        # Execute startup acceleration for services that need it
        if services_needing_restart:
            print("🚀 EXECUTING STARTUP ACCELERATION")
            print("=" * 33)

            # Sort by priority (Critical first)
            priority_order = {'CRITICAL': 0, 'ENHANCED': 1, 'INTEGRATION': 2}
            services_needing_restart.sort(
                key=lambda x: priority_order.get(self.target_services[x]['priority'], 3)
            )

            restarted_services = []

            for container_name in services_needing_restart:
                service_name = self.target_services[container_name]['name']
                priority = self.target_services[container_name]['priority']

                print(f"   🎯 Accelerating {service_name} [{priority}]...")

                if self.restart_service(container_name):
                    restarted_services.append(container_name)
                    # Give the service time to initialize
                    print(f"      ⏱️ Allowing {service_name} initialization time (5 seconds)...")
                    time.sleep(5)

            print()

            # Validate restart results
            if restarted_services:
                print("🏥 POST-ACCELERATION VALIDATION")
                print("=" * 30)

                time.sleep(5)  # Additional stabilization time

                successful_startups = 0

                for container_name in restarted_services:
                    service_name = self.target_services[container_name]['name']

                    # Check if it's now running
                    post_status = self.check_container_status(container_name)

                    if post_status['running']:
                        print(f"   ✅ {service_name}: Successfully started")
                        successful_startups += 1
                    else:
                        print(f"   🔄 {service_name}: Still initializing...")
                        # Get logs for debugging
                        recent_logs = self.get_container_logs(container_name, 5)
                        if recent_logs.strip():
                            print(f"      📋 Recent activity: {recent_logs.split('\\n')[-2][:80]}...")

                print()

                startup_success_rate = (successful_startups / len(restarted_services)) * 100

                print(f"📈 Startup Success Rate: {startup_success_rate:.1f}%")
                print(f"🎯 Services Accelerated: {len(restarted_services)}")
                print(f"✅ Successful Startups: {successful_startups}")

        else:
            print("✅ NO ACCELERATION NEEDED")
            print("=" * 24)
            print("   All services are running or in normal startup sequence")

        acceleration_duration = time.time() - acceleration_start_time

        print()
        print("🌟 STARTUP ACCELERATION COMPLETED")
        print("=" * 33)
        print(f"⏱️ Acceleration Duration: {acceleration_duration:.1f} seconds")
        print(f"🎯 Services Analyzed: {len(self.target_services)}")

        if services_needing_restart:
            print(f"🚀 Services Accelerated: {len(services_needing_restart)}")
            print("💡 Recommendation: Monitor service health for next 2 minutes")

        print()
        print("🏆 PHASE 9 SERVICE STARTUP ACCELERATION COMPLETED")
        print("Next: Execute championship validation in 60 seconds")

        return {
            'services_analyzed': len(self.target_services),
            'services_accelerated': len(services_needing_restart),
            'duration': acceleration_duration,
            'network_ok': network_ok
        }

if __name__ == "__main__":
    accelerator = Phase9ServiceStartupAccelerator()
    accelerator.run_startup_acceleration()
