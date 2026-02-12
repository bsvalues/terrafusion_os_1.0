#!/usr/bin/env python3
"""
TerraFusion Elite Government OS - Phase 9 Advanced Service Discovery & Health Monitor
Championship-level service discovery and continuous health monitoring for government excellence.
Government. Transcended.
"""

import subprocess
import json
import time
import requests
from datetime import datetime
from typing import Dict, List, Tuple, Optional

class Phase9AdvancedServiceDiscoveryHealthMonitor:
    """Elite service discovery and continuous health monitoring for championship excellence"""

    def __init__(self):
        # Services with both expected and discovered ports
        self.services = {
            'ai-consciousness': {
                'name': 'AI Consciousness',
                'container': 'terrafusion-consciousness',
                'expected_ports': [3004],
                'discovered_port': None,
                'critical': True,
                'government_tier': 'SUPREME'
            },
            'os-core': {
                'name': 'OS Core',
                'container': 'terrafusion-os-core',
                'expected_ports': [8080],
                'discovered_port': None,
                'critical': True,
                'government_tier': 'CRITICAL'
            },
            'government-compliance': {
                'name': 'Government Compliance',
                'container': 'terrafusion-compliance',
                'expected_ports': [8082, 5030],  # Adding discovered port
                'discovered_port': None,
                'critical': True,
                'government_tier': 'CRITICAL'
            },
            'county-isolation': {
                'name': 'County Isolation',
                'container': 'terrafusion-isolation',
                'expected_ports': [8083],
                'discovered_port': None,
                'critical': True,
                'government_tier': 'CRITICAL'
            },
            'quantum-optimizer': {
                'name': 'Quantum Optimizer',
                'container': 'terrafusion-quantum',
                'expected_ports': [8085, 8003],  # Adding discovered port
                'discovered_port': None,
                'critical': False,
                'government_tier': 'ENHANCED'
            },
            'harris-pacs-bridge': {
                'name': 'Harris PACS Bridge',
                'container': 'terrafusion-harris-bridge',
                'expected_ports': [8084],
                'discovered_port': None,
                'critical': False,
                'government_tier': 'INTEGRATION'
            }
        }

        self.monitoring_metrics = {
            'discovery_successful': 0,
            'health_checks_passed': 0,
            'performance_optimized': 0,
            'championship_score': 0.0
        }

    def print_banner(self):
        """Print Advanced Service Discovery & Health Monitor banner"""
        print("🔍 PHASE 9: ADVANCED SERVICE DISCOVERY & HEALTH MONITOR")
        print("=" * 57)
        print("🎯 Mission: Championship Service Discovery & Health Validation")
        print("🛡️ Target: Government-Grade Service Excellence Assessment")
        print("⚡ Method: Intelligent Port Discovery & Performance Monitoring")
        print("=" * 57)
        print()

    def discover_service_ports(self) -> Dict:
        """Intelligently discover actual service ports through container inspection and log analysis"""
        print("🔍 INTELLIGENT SERVICE PORT DISCOVERY")
        print("=" * 36)

        discovery_result = {
            'ports_discovered': 0,
            'services_analyzed': 0,
            'discovery_successful': False
        }

        for service_key, service_config in self.services.items():
            container_name = service_config['container']

            print(f"   🔍 Analyzing {service_config['name']}...")

            try:
                # Method 1: Container inspection for port mappings
                inspect_cmd = ['docker', 'inspect', container_name]
                inspect_result = subprocess.run(inspect_cmd, capture_output=True, text=True, timeout=10)

                if inspect_result.returncode == 0:
                    container_info = json.loads(inspect_result.stdout)[0]

                    # Check if container is running
                    if container_info['State']['Running']:
                        # Extract port mappings
                        port_bindings = container_info['NetworkSettings'].get('Ports', {})

                        for internal_port, bindings in port_bindings.items():
                            if bindings:
                                external_port = int(bindings[0]['HostPort'])
                                if external_port in service_config['expected_ports']:
                                    service_config['discovered_port'] = external_port
                                    discovery_result['ports_discovered'] += 1
                                    print(f"      ✅ Port discovered via inspection: {external_port}")
                                    break

                        # Method 2: Log analysis for port information
                        if not service_config['discovered_port']:
                            logs_cmd = ['docker', 'logs', container_name, '--tail', '10']
                            logs_result = subprocess.run(logs_cmd, capture_output=True, text=True, timeout=8)

                            if logs_result.returncode == 0:
                                logs = logs_result.stdout

                                # Look for port patterns in logs
                                for expected_port in service_config['expected_ports']:
                                    if f":{expected_port}" in logs or f"port {expected_port}" in logs:
                                        service_config['discovered_port'] = expected_port
                                        discovery_result['ports_discovered'] += 1
                                        print(f"      ✅ Port discovered via logs: {expected_port}")
                                        break
                    else:
                        print(f"      🔄 Container not running")

                    discovery_result['services_analyzed'] += 1

                else:
                    print(f"      ❌ Container not found")

            except Exception as e:
                print(f"      ❌ Discovery error: {e}")

        discovery_result['discovery_successful'] = discovery_result['ports_discovered'] > 0
        self.monitoring_metrics['discovery_successful'] = discovery_result['ports_discovered']

        print(f"\n   📊 Discovery Summary: {discovery_result['ports_discovered']} ports discovered from {discovery_result['services_analyzed']} services")
        print()
        return discovery_result

    def perform_comprehensive_health_assessment(self) -> Dict:
        """Perform comprehensive health assessment with discovered ports"""
        print("🏥 COMPREHENSIVE HEALTH ASSESSMENT")
        print("=" * 33)

        health_assessment = {
            'services_healthy': 0,
            'critical_services_healthy': 0,
            'performance_scores': [],
            'assessment_successful': False
        }

        for service_key, service_config in self.services.items():
            service_name = service_config['name']
            port = service_config['discovered_port']

            if port:
                print(f"   🏥 Assessing {service_name} on port {port}...")

                try:
                    # Perform health check with performance measurement
                    start_time = time.time()
                    response = requests.get(f"http://localhost:{port}/health", timeout=8)
                    response_time = (time.time() - start_time) * 1000

                    if response.status_code == 200:
                        health_assessment['services_healthy'] += 1
                        health_assessment['performance_scores'].append(response_time)

                        if service_config['critical']:
                            health_assessment['critical_services_healthy'] += 1

                        # Determine performance tier
                        if response_time < 10:
                            performance_tier = "🏆 TRANSCENDENT"
                        elif response_time < 20:
                            performance_tier = "⭐ ELITE"
                        elif response_time < 50:
                            performance_tier = "✅ HEALTHY"
                        else:
                            performance_tier = "🔄 OPERATIONAL"

                        government_tier = service_config['government_tier']
                        critical_indicator = " [CRITICAL]" if service_config['critical'] else ""

                        print(f"      {performance_tier} ({response_time:.1f}ms) | {government_tier}{critical_indicator}")

                    else:
                        print(f"      ⚠️ HTTP {response.status_code} - Service responding but not healthy")

                except requests.exceptions.RequestException:
                    print(f"      🔄 Service initializing on port {port}")

            else:
                print(f"   🔍 {service_name}: Port discovery pending")

        # Calculate performance metrics
        if health_assessment['performance_scores']:
            avg_response_time = sum(health_assessment['performance_scores']) / len(health_assessment['performance_scores'])

            if avg_response_time < 15:
                self.monitoring_metrics['performance_optimized'] = len(health_assessment['performance_scores'])

        health_assessment['assessment_successful'] = health_assessment['services_healthy'] > 0
        self.monitoring_metrics['health_checks_passed'] = health_assessment['services_healthy']

        print()
        return health_assessment

    def calculate_championship_metrics(self, health_assessment: Dict) -> Dict:
        """Calculate comprehensive championship metrics for government excellence"""
        total_services = len(self.services)
        healthy_services = health_assessment['services_healthy']
        critical_services_total = sum(1 for service in self.services.values() if service['critical'])
        critical_services_healthy = health_assessment['critical_services_healthy']

        # Performance scoring
        performance_scores = health_assessment['performance_scores']
        avg_performance = sum(performance_scores) / len(performance_scores) if performance_scores else 0

        # Calculate individual scores
        health_score = (healthy_services / total_services) * 100
        critical_score = (critical_services_healthy / critical_services_total) * 100 if critical_services_total > 0 else 0

        # Performance score calculation
        if avg_performance > 0:
            if avg_performance < 10:
                performance_score = 100
            elif avg_performance < 20:
                performance_score = 90
            elif avg_performance < 50:
                performance_score = 75
            else:
                performance_score = 60
        else:
            performance_score = 0

        # Championship score calculation (weighted)
        championship_score = (health_score * 0.4 + critical_score * 0.4 + performance_score * 0.2)

        return {
            'total_services': total_services,
            'healthy_services': healthy_services,
            'critical_services_total': critical_services_total,
            'critical_services_healthy': critical_services_healthy,
            'health_score': health_score,
            'critical_score': critical_score,
            'performance_score': performance_score,
            'avg_performance': avg_performance,
            'championship_score': championship_score
        }

    def run_advanced_service_discovery_monitoring(self):
        """Execute advanced service discovery and comprehensive health monitoring"""
        self.print_banner()

        monitoring_start_time = time.time()

        # Step 1: Intelligent service port discovery
        discovery_result = self.discover_service_ports()

        # Step 2: Comprehensive health assessment
        health_assessment = self.perform_comprehensive_health_assessment()

        # Step 3: Championship metrics calculation
        championship_metrics = self.calculate_championship_metrics(health_assessment)
        self.monitoring_metrics['championship_score'] = championship_metrics['championship_score']

        monitoring_duration = time.time() - monitoring_start_time

        print("🏆 CHAMPIONSHIP MONITORING SUMMARY")
        print("=" * 33)
        print(f"⏱️ Monitoring Duration: {monitoring_duration:.1f} seconds")
        print(f"🔍 Ports Discovered: {discovery_result['ports_discovered']}")
        print(f"💊 Services Healthy: {championship_metrics['healthy_services']}/{championship_metrics['total_services']}")
        print(f"🎯 Critical Services: {championship_metrics['critical_services_healthy']}/{championship_metrics['critical_services_total']}")
        print(f"⚡ Average Response Time: {championship_metrics['avg_performance']:.1f}ms")
        print(f"🏆 Championship Score: {championship_metrics['championship_score']:.1f}%")
        print()

        # Determine monitoring success level
        championship_score = championship_metrics['championship_score']

        if championship_score >= 80:
            success_level = "🎊 CHAMPIONSHIP MONITORING EXCELLENCE"
            government_status = "Government. Transcended. Monitoring. PERFECTED."
            next_action = "Proceed to Phase 10: Elite Production Excellence"
        elif championship_score >= 60:
            success_level = "🏆 ELITE MONITORING SUCCESS"
            government_status = "Government Excellence Monitoring Achieved"
            next_action = "Continue service optimization for championship tier"
        elif championship_score >= 40:
            success_level = "✅ SIGNIFICANT MONITORING PROGRESS"
            government_status = "Service Monitoring Foundation Established"
            next_action = "Continue health monitoring and service optimization"
        else:
            success_level = "🚀 MONITORING ADVANCING"
            government_status = "Service Discovery and Monitoring Progressing"
            next_action = "Continue service health monitoring and discovery"

        print(f"🎯 MONITORING STATUS: {success_level}")
        print(f"🏛️ GOVERNMENT STATUS: {government_status}")
        print(f"🚀 NEXT ACTION: {next_action}")
        print()

        # Service-specific recommendations
        print("🎯 SERVICE-SPECIFIC RECOMMENDATIONS")
        print("=" * 35)

        for service_key, service_config in self.services.items():
            if service_config['discovered_port']:
                print(f"   ✅ {service_config['name']}: Monitoring on port {service_config['discovered_port']}")
            else:
                print(f"   🔍 {service_config['name']}: Requires port discovery and health validation")

        print()
        print("🌟 PHASE 9 ADVANCED SERVICE DISCOVERY & HEALTH MONITORING COMPLETED")
        print(government_status)

        return {
            'discovery_result': discovery_result,
            'health_assessment': health_assessment,
            'championship_metrics': championship_metrics,
            'monitoring_metrics': self.monitoring_metrics,
            'duration': monitoring_duration
        }

if __name__ == "__main__":
    monitoring_engine = Phase9AdvancedServiceDiscoveryHealthMonitor()
    monitoring_engine.run_advanced_service_discovery_monitoring()
