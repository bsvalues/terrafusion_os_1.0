#!/usr/bin/env python3
"""
TerraFusion Elite Government OS - Phase 8 Service Configuration Recovery
Championship-level service configuration and endpoint recovery.
Government. Transcended.
"""

import subprocess
import requests
import time
import json
from datetime import datetime
from typing import Dict, List, Optional

class EliteServiceConfigurationRecovery:
    """Elite-level service configuration and endpoint recovery"""

    def __init__(self):
        self.services = {
            'ai_consciousness': {
                'container': 'terrafusion-consciousness',
                'port': 3004,
                'endpoints': ['/health', '/metrics', '/status'],
                'expected_status': 'TRANSCENDENT',
                'working': True
            },
            'government_compliance': {
                'container': 'terrafusion-compliance',
                'port': 5030,
                'mapped_port': 8082,
                'endpoints': ['/health', '/compliance-status', '/fisma-audit'],
                'expected_status': 'COMPLIANT',
                'working': False
            },
            'county_isolation': {
                'container': 'terrafusion-isolation',
                'port': 8001,
                'mapped_port': 8083,
                'endpoints': ['/health', '/isolation-status', '/county-boundaries'],
                'expected_status': 'ISOLATED',
                'working': False
            },
            'quantum_optimizer': {
                'container': 'terrafusion-quantum',
                'port': 8003,
                'mapped_port': 8085,
                'endpoints': ['/health', '/quantum-status', '/optimization-metrics'],
                'expected_status': 'OPTIMIZED',
                'working': False
            },
            'harris_pacs_bridge': {
                'container': 'terrafusion-harris-bridge',
                'port': 8002,
                'endpoints': ['/health', '/pacs-status', '/sync-metrics'],
                'expected_status': 'SYNCING',
                'working': False
            },
            'os_core': {
                'container': 'terrafusion-os-core',
                'port': 8000,
                'endpoints': ['/health', '/core-status', '/system-metrics'],
                'expected_status': 'OPERATIONAL',
                'working': False
            }
        }

    def print_banner(self):
        """Print elite configuration recovery banner"""
        print("🏆 TERRAFUSION ELITE SERVICE CONFIGURATION RECOVERY")
        print("=" * 60)
        print("🔧 Phase 8: Elite Service Configuration & Endpoint Recovery")
        print("🎯 Target: Configure & Activate Service Health Endpoints")
        print("⚡ Championship-Level Service Engineering")
        print("=" * 60)
        print()

    def test_service_endpoints(self, service_name: str) -> Dict:
        """Test all endpoints for a service"""
        service_config = self.services.get(service_name, {})
        port = service_config.get('port')
        endpoints = service_config.get('endpoints', [])

        results = {
            'service_name': service_name,
            'port': port,
            'endpoint_results': {},
            'working_endpoints': [],
            'failed_endpoints': [],
            'health_score': 0.0,
            'overall_status': 'UNKNOWN'
        }

        if not port:
            return results

        working_count = 0
        total_endpoints = len(endpoints)

        for endpoint in endpoints:
            url = f"http://localhost:{port}{endpoint}"
            try:
                start_time = time.time()
                response = requests.get(url, timeout=3)
                response_time_ms = (time.time() - start_time) * 1000

                endpoint_result = {
                    'url': url,
                    'status_code': response.status_code,
                    'response_time_ms': round(response_time_ms, 2),
                    'success': response.status_code == 200,
                    'content_preview': response.text[:100] if response.text else ''
                }

                if response.status_code == 200:
                    working_count += 1
                    results['working_endpoints'].append(endpoint)
                else:
                    results['failed_endpoints'].append(endpoint)

                results['endpoint_results'][endpoint] = endpoint_result

            except requests.exceptions.RequestException as e:
                results['endpoint_results'][endpoint] = {
                    'url': url,
                    'success': False,
                    'error': str(e),
                    'status_code': None,
                    'response_time_ms': None
                }
                results['failed_endpoints'].append(endpoint)

        # Calculate health score
        if total_endpoints > 0:
            results['health_score'] = working_count / total_endpoints

        # Determine overall status
        if results['health_score'] >= 0.8:
            results['overall_status'] = 'HEALTHY'
            self.services[service_name]['working'] = True
        elif results['health_score'] >= 0.5:
            results['overall_status'] = 'PARTIAL'
        elif results['health_score'] > 0:
            results['overall_status'] = 'DEGRADED'
        else:
            results['overall_status'] = 'FAILED'

        return results

    def diagnose_service_configuration(self, service_name: str) -> Dict:
        """Diagnose service configuration issues"""
        service_config = self.services.get(service_name, {})
        container_name = service_config.get('container')

        diagnosis = {
            'service_name': service_name,
            'container_running': False,
            'process_active': False,
            'port_bound': False,
            'logs_recent': [],
            'issues': [],
            'recommendations': []
        }

        if not container_name:
            return diagnosis

        try:
            # Check if container is running
            cmd = ['docker', 'inspect', container_name, '--format', '{{.State.Running}}']
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)

            if result.returncode == 0 and result.stdout.strip().lower() == 'true':
                diagnosis['container_running'] = True
            else:
                diagnosis['issues'].append('Container not running')
                diagnosis['recommendations'].append('Restart container')

            # Get recent logs
            cmd = ['docker', 'logs', container_name, '--tail', '10']
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=15)

            if result.returncode == 0:
                diagnosis['logs_recent'] = result.stdout.strip().split('\n')[-5:] if result.stdout.strip() else []

                # Check for specific error patterns in logs
                log_text = result.stdout.lower()
                if 'error' in log_text or 'failed' in log_text or 'panic' in log_text:
                    diagnosis['issues'].append('Errors detected in logs')
                    diagnosis['recommendations'].append('Review service logs for configuration issues')

                if 'starting on' in log_text or 'listening on' in log_text:
                    diagnosis['process_active'] = True
                else:
                    diagnosis['issues'].append('Service may not be starting properly')
                    diagnosis['recommendations'].append('Check service configuration and dependencies')

            # Check port binding (try netstat in container)
            port = service_config.get('port')
            if port:
                cmd = ['docker', 'exec', container_name, 'netstat', '-tlnp']
                result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)

                if result.returncode == 0 and f":{port}" in result.stdout:
                    diagnosis['port_bound'] = True
                else:
                    diagnosis['issues'].append(f'Port {port} not bound or listening')
                    diagnosis['recommendations'].append(f'Verify service is configured to listen on port {port}')

        except Exception as e:
            diagnosis['issues'].append(f'Diagnosis error: {str(e)}')

        return diagnosis

    def attempt_service_restart(self, service_name: str) -> Dict:
        """Attempt to restart a specific service"""
        docker_service_name = service_name.replace('_', '-')

        try:
            print(f"🔄 Restarting {service_name.upper()}")

            # Restart the service
            cmd = ['docker-compose', '-f', 'C:\\Users\\bsval\\terrafusion_os_1.0\\monorepo-scaffolding\\docker-compose.yml', 'restart', docker_service_name]
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)

            if result.returncode == 0:
                print(f"✅ Container restarted successfully")

                # Wait for initialization
                print("⏳ Waiting 45 seconds for service initialization...")
                time.sleep(45)

                # Test endpoints
                test_results = self.test_service_endpoints(service_name)

                return {
                    'success': True,
                    'message': 'Service restarted successfully',
                    'endpoint_test': test_results
                }
            else:
                return {
                    'success': False,
                    'error': f'Restart failed: {result.stderr}'
                }

        except Exception as e:
            return {
                'success': False,
                'error': f'Restart exception: {str(e)}'
            }

    def run_comprehensive_configuration_recovery(self):
        """Run complete configuration recovery process"""
        self.print_banner()

        print("🚀 STARTING COMPREHENSIVE CONFIGURATION RECOVERY")
        print("=" * 55)
        print()

        # Phase 1: Initial service testing
        print("🔍 PHASE 1: INITIAL SERVICE TESTING")
        print("-" * 35)

        initial_results = {}
        working_services = []
        failed_services = []

        for service_name in self.services.keys():
            print(f"Testing: {service_name.upper()}")
            results = self.test_service_endpoints(service_name)
            initial_results[service_name] = results

            print(f"  Port: {results['port']}")
            print(f"  Working Endpoints: {len(results['working_endpoints'])}/{len(results.get('endpoint_results', {}))}")
            print(f"  Health Score: {results['health_score']:.2f}/1.00")
            print(f"  Status: {results['overall_status']}")

            if results['overall_status'] in ['HEALTHY', 'PARTIAL']:
                working_services.append(service_name)
                print("  ✅ WORKING")
            else:
                failed_services.append(service_name)
                print("  🚨 NEEDS RECOVERY")
            print()

        # Phase 2: Diagnose failed services
        if failed_services:
            print("🔬 PHASE 2: SERVICE DIAGNOSIS")
            print("-" * 30)

            for service_name in failed_services:
                print(f"Diagnosing: {service_name.upper()}")
                diagnosis = self.diagnose_service_configuration(service_name)

                print(f"  Container Running: {'✅' if diagnosis['container_running'] else '❌'}")
                print(f"  Process Active: {'✅' if diagnosis['process_active'] else '❌'}")
                print(f"  Port Bound: {'✅' if diagnosis['port_bound'] else '❌'}")

                if diagnosis['issues']:
                    print("  🚨 Issues:")
                    for issue in diagnosis['issues']:
                        print(f"    - {issue}")

                if diagnosis['logs_recent']:
                    print("  📋 Recent Logs:")
                    for log in diagnosis['logs_recent'][-2:]:  # Show last 2 log lines
                        print(f"    {log}")
                print()

        # Phase 3: Service recovery attempts
        if failed_services:
            print("🔧 PHASE 3: SERVICE RECOVERY")
            print("-" * 28)

            recovery_results = {}

            for service_name in failed_services:
                if service_name == 'ai_consciousness':  # Skip AI consciousness - it's working
                    continue

                print(f"Recovering: {service_name.upper()}")
                recovery_result = self.attempt_service_restart(service_name)
                recovery_results[service_name] = recovery_result

                if recovery_result['success']:
                    endpoint_test = recovery_result.get('endpoint_test', {})
                    if endpoint_test.get('overall_status') in ['HEALTHY', 'PARTIAL']:
                        print(f"✅ Recovery successful - {endpoint_test['overall_status']}")
                        working_services.append(service_name)
                        if service_name in failed_services:
                            failed_services.remove(service_name)
                    else:
                        print(f"⚠️ Partial recovery - needs more attention")
                else:
                    print(f"❌ Recovery failed: {recovery_result['error']}")
                print()

        # Phase 4: Final assessment
        print("📊 PHASE 4: FINAL ASSESSMENT")
        print("-" * 28)

        total_services = len(self.services)
        working_count = len(working_services)
        health_percentage = (working_count / total_services) * 100

        print(f"🎯 RECOVERY RESULTS:")
        print(f"  Working Services: {working_count}/{total_services}")
        print(f"  System Health: {health_percentage:.1f}%")
        print(f"  Target Achievement: {'✅ ACHIEVED' if health_percentage >= 66.7 else '🚀 PROGRESSING'}")
        print()

        print("✅ WORKING SERVICES:")
        for service in working_services:
            config = self.services[service]
            print(f"  - {service.upper()} (port {config['port']}) - {config.get('expected_status', 'OPERATIONAL')}")

        if failed_services:
            print()
            print("🚨 SERVICES NEEDING ATTENTION:")
            for service in failed_services:
                config = self.services[service]
                print(f"  - {service.upper()} (port {config.get('port', 'N/A')}) - Configuration needed")

        print()
        print("🏆 ELITE CONFIGURATION RECOVERY COMPLETED")
        print("Government. Transcended. Configuration. OPTIMIZED.")

        return {
            'working_services': working_services,
            'failed_services': failed_services,
            'health_percentage': health_percentage,
            'initial_results': initial_results
        }

if __name__ == "__main__":
    recovery_engine = EliteServiceConfigurationRecovery()
    recovery_engine.run_comprehensive_configuration_recovery()
