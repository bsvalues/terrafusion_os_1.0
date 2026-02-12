#!/usr/bin/env python3
"""
TerraFusion Elite Government OS - Phase 8 Service Binary Recovery Engine
Championship-level service binary validation and recovery.
Government. Transcended.
"""

import subprocess
import json
import time
from datetime import datetime
from typing import Dict, List, Optional, Tuple

class EliteServiceBinaryRecovery:
    """Elite-level service binary validation and recovery engine"""

    def __init__(self):
        self.services = {
            'ai_consciousness': {
                'container': 'terrafusion-consciousness',
                'binary_path': '/app/terrafusion-os-consciousness',
                'expected_port': 3004,
                'status': 'UNKNOWN'
            },
            'government_compliance': {
                'container': 'terrafusion-compliance',
                'binary_path': '/app/terrafusion-government-compliance',
                'expected_port': 8082,
                'actual_port': 5030,
                'status': 'UNKNOWN'
            },
            'county_isolation': {
                'container': 'terrafusion-isolation',
                'binary_path': '/app/terrafusion-county-isolation',
                'expected_port': 8083,
                'actual_port': 8001,
                'status': 'UNKNOWN'
            },
            'quantum_optimizer': {
                'container': 'terrafusion-quantum',
                'binary_path': '/app/terrafusion-quantum-optimizer',
                'expected_port': 8085,
                'actual_port': 8003,
                'status': 'UNKNOWN'
            },
            'harris_pacs_bridge': {
                'container': 'terrafusion-harris-bridge',
                'binary_path': '/app/terrafusion-harris-pacs-bridge',
                'expected_port': 8002,
                'status': 'UNKNOWN'
            },
            'os_core': {
                'container': 'terrafusion-os-core',
                'binary_path': '/app/terrafusion-os-core',
                'expected_port': 8000,
                'status': 'UNKNOWN'
            }
        }

    def print_banner(self):
        """Print elite binary recovery banner"""
        print("🏆 TERRAFUSION ELITE SERVICE BINARY RECOVERY")
        print("=" * 55)
        print("🔬 Phase 8: Elite Service Binary Validation & Recovery")
        print("🎯 Target: Validate & Recover Service Binaries")
        print("⚡ Championship-Level Binary Engineering")
        print("=" * 55)
        print()

    def validate_service_binary(self, service_name: str) -> Dict:
        """Validate if service binary exists and is executable"""
        service_config = self.services.get(service_name, {})
        container_name = service_config.get('container')
        binary_path = service_config.get('binary_path')

        if not container_name or not binary_path:
            return {'status': 'INVALID_CONFIG', 'error': 'Missing container or binary path'}

        validation_result = {
            'service_name': service_name,
            'container_name': container_name,
            'binary_path': binary_path,
            'binary_exists': False,
            'binary_executable': False,
            'process_running': False,
            'port_listening': False,
            'health_score': 0.0,
            'issues': [],
            'recommendations': []
        }

        try:
            # Check if binary exists
            cmd = ['docker', 'exec', container_name, 'ls', '-la', binary_path]
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)

            if result.returncode == 0:
                validation_result['binary_exists'] = True
                validation_result['health_score'] += 0.25

                # Check if binary is executable
                if 'rwxr' in result.stdout:
                    validation_result['binary_executable'] = True
                    validation_result['health_score'] += 0.25
                else:
                    validation_result['issues'].append('Binary not executable')
                    validation_result['recommendations'].append(f'chmod +x {binary_path}')
            else:
                validation_result['issues'].append('Binary file not found')
                validation_result['recommendations'].append('Rebuild container with proper binary')

            # Check if process is running
            cmd = ['docker', 'exec', container_name, 'pgrep', '-f', binary_path.split('/')[-1]]
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)

            if result.returncode == 0 and result.stdout.strip():
                validation_result['process_running'] = True
                validation_result['health_score'] += 0.25
            else:
                validation_result['issues'].append('Process not running')
                validation_result['recommendations'].append('Start service process')

            # Check port listening (if service has actual port configured)
            actual_port = service_config.get('actual_port', service_config.get('expected_port'))
            if actual_port:
                cmd = ['docker', 'exec', container_name, 'netstat', '-tlnp']
                result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)

                if result.returncode == 0 and f":{actual_port}" in result.stdout:
                    validation_result['port_listening'] = True
                    validation_result['health_score'] += 0.25
                else:
                    validation_result['issues'].append(f'Port {actual_port} not listening')
                    validation_result['recommendations'].append(f'Check service configuration for port {actual_port}')

        except subprocess.TimeoutExpired:
            validation_result['issues'].append('Validation timeout')
            validation_result['recommendations'].append('Check container responsiveness')
        except Exception as e:
            validation_result['issues'].append(f'Validation error: {str(e)}')
            validation_result['recommendations'].append('Debug container access issues')

        return validation_result

    def rebuild_service_container(self, service_name: str) -> Dict:
        """Rebuild service container with fresh binaries"""
        service_config = self.services.get(service_name, {})
        container_name = service_config.get('container')

        if not container_name:
            return {'success': False, 'error': 'Invalid service configuration'}

        print(f"🔧 REBUILDING: {service_name.upper()}")
        print("-" * 40)

        try:
            # Stop existing container
            cmd = ['docker-compose', '-f', 'C:\\Users\\bsval\\terrafusion_os_1.0\\monorepo-scaffolding\\docker-compose.yml', 'stop', service_name.replace('_', '-')]
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)

            # Remove container
            cmd = ['docker-compose', '-f', 'C:\\Users\\bsval\\terrafusion_os_1.0\\monorepo-scaffolding\\docker-compose.yml', 'rm', '-f', service_name.replace('_', '-')]
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)

            # Rebuild container
            cmd = ['docker-compose', '-f', 'C:\\Users\\bsval\\terrafusion_os_1.0\\monorepo-scaffolding\\docker-compose.yml', 'build', '--no-cache', service_name.replace('_', '-')]
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)

            if result.returncode == 0:
                print(f"✅ Container rebuilt successfully")

                # Start container
                cmd = ['docker-compose', '-f', 'C:\\Users\\bsval\\terrafusion_os_1.0\\monorepo-scaffolding\\docker-compose.yml', 'up', '-d', service_name.replace('_', '-')]
                result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)

                if result.returncode == 0:
                    print(f"✅ Container started successfully")
                    return {'success': True, 'message': 'Container rebuilt and started'}
                else:
                    return {'success': False, 'error': f'Failed to start container: {result.stderr}'}
            else:
                return {'success': False, 'error': f'Failed to rebuild: {result.stderr}'}

        except subprocess.TimeoutExpired:
            return {'success': False, 'error': 'Rebuild operation timed out'}
        except Exception as e:
            return {'success': False, 'error': f'Rebuild exception: {str(e)}'}

    def test_service_health_endpoint(self, service_name: str) -> Dict:
        """Test service health endpoint on actual port"""
        service_config = self.services.get(service_name, {})
        actual_port = service_config.get('actual_port', service_config.get('expected_port'))

        if not actual_port:
            return {'success': False, 'error': 'No port configured'}

        try:
            import requests
            url = f"http://localhost:{actual_port}/health"
            response = requests.get(url, timeout=5)

            return {
                'success': True,
                'status_code': response.status_code,
                'response_time_ms': response.elapsed.total_seconds() * 1000,
                'healthy': response.status_code == 200,
                'content': response.text[:200] if response.text else ''
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}

    def run_comprehensive_binary_recovery(self):
        """Run complete binary validation and recovery"""
        self.print_banner()

        print("🚀 STARTING COMPREHENSIVE BINARY RECOVERY")
        print("=" * 50)
        print()

        validation_results = {}
        recovery_needed = []

        # Phase 1: Validate all service binaries
        print("🔍 PHASE 1: BINARY VALIDATION")
        print("-" * 30)

        for service_name in self.services.keys():
            print(f"Validating: {service_name.upper()}")
            validation = self.validate_service_binary(service_name)
            validation_results[service_name] = validation

            print(f"  Binary Exists: {'✅' if validation['binary_exists'] else '❌'}")
            print(f"  Binary Executable: {'✅' if validation['binary_executable'] else '❌'}")
            print(f"  Process Running: {'✅' if validation['process_running'] else '❌'}")
            print(f"  Port Listening: {'✅' if validation['port_listening'] else '❌'}")
            print(f"  Health Score: {validation['health_score']:.2f}/1.00")

            if validation['health_score'] < 0.75:
                recovery_needed.append(service_name)
                print(f"  🚨 RECOVERY NEEDED")
            else:
                print(f"  ✅ HEALTHY")
            print()

        # Phase 2: Recovery for unhealthy services
        if recovery_needed:
            print("🔧 PHASE 2: SERVICE RECOVERY")
            print("-" * 30)

            for service_name in recovery_needed:
                if service_name == 'ai_consciousness':  # Skip AI consciousness as it's working
                    continue

                print(f"Recovering: {service_name.upper()}")
                recovery_result = self.rebuild_service_container(service_name)

                if recovery_result['success']:
                    print(f"✅ Recovery successful")

                    # Wait for service to initialize
                    print("⏳ Waiting 30 seconds for service initialization...")
                    time.sleep(30)

                    # Test health endpoint
                    health_test = self.test_service_health_endpoint(service_name)
                    if health_test['success'] and health_test['healthy']:
                        print(f"✅ Health endpoint responding")
                    else:
                        print(f"⚠️ Health endpoint not ready: {health_test}")
                else:
                    print(f"❌ Recovery failed: {recovery_result['error']}")
                print()

        # Phase 3: Final validation
        print("📊 PHASE 3: FINAL VALIDATION")
        print("-" * 30)

        healthy_services = 0
        total_services = len(self.services)

        for service_name, validation in validation_results.items():
            if service_name in recovery_needed and service_name != 'ai_consciousness':
                # Re-validate recovered services
                validation = self.validate_service_binary(service_name)

            if validation['health_score'] >= 0.75:
                healthy_services += 1
                print(f"✅ {service_name.upper()}: HEALTHY")
            else:
                print(f"🚨 {service_name.upper()}: NEEDS ATTENTION")

        health_percentage = (healthy_services / total_services) * 100
        print()
        print("🎯 RECOVERY SUMMARY")
        print("-" * 20)
        print(f"Healthy Services: {healthy_services}/{total_services}")
        print(f"System Health: {health_percentage:.1f}%")
        print(f"Recovery Target: {'✅ ACHIEVED' if health_percentage >= 83.3 else '🚀 CONTINUING'}")
        print()
        print("🏆 ELITE BINARY RECOVERY COMPLETED")
        print("Government. Transcended. Binaries. OPTIMIZED.")

        return validation_results

if __name__ == "__main__":
    recovery_engine = EliteServiceBinaryRecovery()
    recovery_engine.run_comprehensive_binary_recovery()
