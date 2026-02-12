#!/usr/bin/env python3
"""
TerraFusion Elite Government OS - Phase 8 Service Health Diagnostics
Championship-level service health debugging and recovery analysis.
Government. Transcended.
"""

import requests
import subprocess
import json
import time
from datetime import datetime
from typing import Dict, List, Optional, Tuple

class EliteServiceDiagnostics:
    """Elite-level service health diagnostics and recovery engine"""

    def __init__(self):
        self.services = {
            'ai_consciousness': {
                'port': 3004,
                'endpoints': ['/health', '/metrics', '/status', '/swarm-health'],
                'expected_response_time_ms': 10
            },
            'government_compliance': {
                'port': 8082,
                'alternate_ports': [5030, 8080, 3000],
                'endpoints': ['/health', '/compliance-status', '/fisma-audit'],
                'expected_response_time_ms': 50
            },
            'county_isolation': {
                'port': 8083,
                'alternate_ports': [5031, 8001, 3001],
                'endpoints': ['/health', '/isolation-status', '/county-boundaries'],
                'expected_response_time_ms': 50
            },
            'quantum_optimizer': {
                'port': 8085,
                'alternate_ports': [5033, 8003, 3003],
                'endpoints': ['/health', '/quantum-status', '/optimization-metrics'],
                'expected_response_time_ms': 50
            },
            'harris_pacs_bridge': {
                'port': 8002,
                'alternate_ports': [5032, 8004, 3005],
                'endpoints': ['/health', '/pacs-status', '/sync-metrics'],
                'expected_response_time_ms': 100
            },
            'os_core': {
                'port': 8000,
                'alternate_ports': [5034, 8005, 3006],
                'endpoints': ['/health', '/core-status', '/system-metrics'],
                'expected_response_time_ms': 50
            }
        }

        self.container_names = {
            'ai_consciousness': 'terrafusion-consciousness',
            'government_compliance': 'terrafusion-compliance',
            'county_isolation': 'terrafusion-isolation',
            'quantum_optimizer': 'terrafusion-quantum',
            'harris_pacs_bridge': 'terrafusion-harris-bridge',
            'os_core': 'terrafusion-os-core'
        }

    def print_banner(self):
        """Print championship diagnostic banner"""
        print("🏆 TERRAFUSION ELITE SERVICE DIAGNOSTICS")
        print("=" * 50)
        print("🔬 Phase 8: Elite Service Health Diagnostics")
        print("🎯 Target: Identify & Resolve Service Health Issues")
        print("⚡ Championship-Level Problem Resolution")
        print("=" * 50)
        print()

    def get_container_status(self, service_name: str) -> Dict:
        """Get detailed Docker container status"""
        container_name = self.container_names.get(service_name)
        if not container_name:
            return {'status': 'UNKNOWN', 'error': 'Container name not found'}

        try:
            # Get container status
            cmd = ['docker', 'inspect', container_name, '--format', '{{json .State}}']
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)

            if result.returncode == 0:
                state_json = json.loads(result.stdout.strip())

                # Get health check status if available
                health_cmd = ['docker', 'inspect', container_name, '--format', '{{json .State.Health}}']
                health_result = subprocess.run(health_cmd, capture_output=True, text=True, timeout=10)

                health_status = 'no-healthcheck'
                if health_result.returncode == 0 and health_result.stdout.strip() != 'null':
                    health_json = json.loads(health_result.stdout.strip())
                    health_status = health_json.get('Status', 'unknown')

                return {
                    'status': state_json.get('Status', 'unknown'),
                    'running': state_json.get('Running', False),
                    'health': health_status,
                    'started_at': state_json.get('StartedAt', 'unknown'),
                    'exit_code': state_json.get('ExitCode', 0),
                    'error': state_json.get('Error', ''),
                    'restart_count': state_json.get('RestartCount', 0)
                }
            else:
                return {'status': 'NOT_FOUND', 'error': result.stderr}

        except Exception as e:
            return {'status': 'ERROR', 'error': str(e)}

    def test_service_endpoints(self, service_name: str) -> Dict:
        """Test all endpoints for a service across multiple ports"""
        service_config = self.services.get(service_name, {})
        primary_port = service_config.get('port')
        alternate_ports = service_config.get('alternate_ports', [])
        endpoints = service_config.get('endpoints', ['/health'])

        results = {
            'primary_port': primary_port,
            'working_ports': [],
            'failed_ports': [],
            'endpoint_results': {},
            'best_response_time_ms': None,
            'best_port': None
        }

        all_ports = [primary_port] + alternate_ports if primary_port else alternate_ports

        for port in all_ports:
            port_working = False
            port_results = {}

            for endpoint in endpoints:
                url = f"http://localhost:{port}{endpoint}"
                try:
                    start_time = time.time()
                    response = requests.get(url, timeout=5)
                    response_time_ms = (time.time() - start_time) * 1000

                    port_results[endpoint] = {
                        'status_code': response.status_code,
                        'response_time_ms': round(response_time_ms, 2),
                        'success': response.status_code == 200,
                        'content_length': len(response.text) if response.text else 0
                    }

                    if response.status_code == 200:
                        port_working = True
                        if results['best_response_time_ms'] is None or response_time_ms < results['best_response_time_ms']:
                            results['best_response_time_ms'] = round(response_time_ms, 2)
                            results['best_port'] = port

                except requests.exceptions.RequestException as e:
                    port_results[endpoint] = {
                        'success': False,
                        'error': str(e),
                        'response_time_ms': None,
                        'status_code': None
                    }

            results['endpoint_results'][port] = port_results

            if port_working:
                results['working_ports'].append(port)
            else:
                results['failed_ports'].append(port)

        return results

    def get_service_logs(self, service_name: str, lines: int = 20) -> List[str]:
        """Get recent service logs from Docker container"""
        container_name = self.container_names.get(service_name)
        if not container_name:
            return ['Container name not found']

        try:
            cmd = ['docker', 'logs', container_name, '--tail', str(lines)]
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=15)

            if result.returncode == 0:
                return result.stdout.strip().split('\n') if result.stdout.strip() else ['No logs available']
            else:
                return [f"Error getting logs: {result.stderr}"]

        except Exception as e:
            return [f"Exception getting logs: {str(e)}"]

    def analyze_service_health(self, service_name: str) -> Dict:
        """Comprehensive service health analysis"""
        print(f"🔍 ANALYZING SERVICE: {service_name.upper()}")
        print("-" * 40)

        analysis = {
            'service_name': service_name,
            'container_status': self.get_container_status(service_name),
            'endpoint_tests': self.test_service_endpoints(service_name),
            'recent_logs': self.get_service_logs(service_name, 10),
            'health_score': 0.0,
            'issues': [],
            'recommendations': []
        }

        # Calculate health score based on multiple factors
        score = 0.0

        # Container status (40% of score)
        container_status = analysis['container_status']
        if container_status.get('running'):
            score += 0.2
        if container_status.get('health') == 'healthy':
            score += 0.2
        elif container_status.get('status') == 'running':
            score += 0.1  # Running but no health check

        # Endpoint accessibility (40% of score)
        endpoint_tests = analysis['endpoint_tests']
        if endpoint_tests['working_ports']:
            score += 0.3
            if endpoint_tests['best_response_time_ms'] and endpoint_tests['best_response_time_ms'] < 100:
                score += 0.1  # Good response time bonus

        # Log analysis (20% of score)
        recent_logs = analysis['recent_logs']
        error_keywords = ['error', 'fail', 'panic', 'crash', 'exception']
        error_count = sum(1 for log in recent_logs for keyword in error_keywords if keyword.lower() in log.lower())

        if error_count == 0 and len(recent_logs) > 1:
            score += 0.2
        elif error_count < 3:
            score += 0.1

        analysis['health_score'] = min(1.0, score)

        # Generate issues and recommendations
        if not container_status.get('running'):
            analysis['issues'].append("Container is not running")
            analysis['recommendations'].append("Restart the container")

        if not endpoint_tests['working_ports']:
            analysis['issues'].append("No working endpoints found")
            analysis['recommendations'].append("Check service configuration and port bindings")

        if container_status.get('restart_count', 0) > 5:
            analysis['issues'].append(f"High restart count: {container_status['restart_count']}")
            analysis['recommendations'].append("Investigate recurring crashes")

        if error_count > 5:
            analysis['issues'].append(f"Many errors in recent logs: {error_count}")
            analysis['recommendations'].append("Review error logs for root cause")

        # Print analysis results
        print(f"📊 Container Status: {container_status.get('status', 'UNKNOWN')}")
        print(f"🏥 Health Check: {container_status.get('health', 'N/A')}")
        print(f"🔗 Working Ports: {endpoint_tests['working_ports']}")
        print(f"🎯 Health Score: {analysis['health_score']:.2f}/1.00")

        if analysis['issues']:
            print("🚨 Issues Found:")
            for issue in analysis['issues']:
                print(f"   - {issue}")

        if analysis['recommendations']:
            print("💡 Recommendations:")
            for rec in analysis['recommendations']:
                print(f"   - {rec}")

        print()
        return analysis

    def generate_recovery_plan(self, service_analyses: Dict) -> Dict:
        """Generate comprehensive recovery plan based on service analyses"""
        recovery_plan = {
            'priority_services': [],
            'recovery_actions': [],
            'estimated_recovery_time_minutes': 0,
            'success_probability': 0.0
        }

        # Sort services by health score (lowest first = highest priority)
        sorted_services = sorted(
            service_analyses.items(),
            key=lambda x: x[1]['health_score']
        )

        for service_name, analysis in sorted_services:
            if analysis['health_score'] < 0.5:  # Needs attention
                recovery_plan['priority_services'].append({
                    'name': service_name,
                    'health_score': analysis['health_score'],
                    'issues': analysis['issues'],
                    'recommendations': analysis['recommendations']
                })

                # Add recovery actions
                if not analysis['container_status'].get('running'):
                    recovery_plan['recovery_actions'].append(f"docker-compose restart {service_name.replace('_', '-')}")
                    recovery_plan['estimated_recovery_time_minutes'] += 2

                if not analysis['endpoint_tests']['working_ports']:
                    recovery_plan['recovery_actions'].append(f"Check port configuration for {service_name}")
                    recovery_plan['estimated_recovery_time_minutes'] += 5

        # Calculate success probability based on issue complexity
        total_services = len(service_analyses)
        healthy_services = sum(1 for analysis in service_analyses.values() if analysis['health_score'] >= 0.8)

        recovery_plan['success_probability'] = min(0.95, 0.5 + (healthy_services / total_services) * 0.4)

        return recovery_plan

    def run_comprehensive_diagnostics(self):
        """Run complete diagnostic analysis on all services"""
        self.print_banner()

        print("🚀 STARTING COMPREHENSIVE SERVICE DIAGNOSTICS")
        print("=" * 50)
        print()

        service_analyses = {}

        for service_name in self.services.keys():
            analysis = self.analyze_service_health(service_name)
            service_analyses[service_name] = analysis
            time.sleep(1)  # Brief pause between services

        print("📋 GENERATING RECOVERY PLAN")
        print("=" * 50)

        recovery_plan = self.generate_recovery_plan(service_analyses)

        print(f"🎯 Priority Services: {len(recovery_plan['priority_services'])}")
        print(f"⚡ Recovery Actions: {len(recovery_plan['recovery_actions'])}")
        print(f"⏱️  Estimated Time: {recovery_plan['estimated_recovery_time_minutes']} minutes")
        print(f"🎲 Success Probability: {recovery_plan['success_probability']:.1%}")
        print()

        if recovery_plan['recovery_actions']:
            print("🛠️ RECOMMENDED RECOVERY ACTIONS:")
            for i, action in enumerate(recovery_plan['recovery_actions'], 1):
                print(f"   {i}. {action}")
        else:
            print("✅ No immediate recovery actions needed")

        print()
        print("🏆 ELITE SERVICE DIAGNOSTICS COMPLETED")
        print("Government. Transcended. Services. Diagnosed.")

        return service_analyses, recovery_plan

if __name__ == "__main__":
    diagnostics = EliteServiceDiagnostics()
    diagnostics.run_comprehensive_diagnostics()
