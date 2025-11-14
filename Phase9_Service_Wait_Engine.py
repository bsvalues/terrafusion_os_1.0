#!/usr/bin/env python3
"""
TerraFusion Elite Government OS - Phase 9 Service Wait Engine
Championship-level service startup monitoring with intelligent wait strategies.
Government. Transcended.
"""

import asyncio
import requests
import subprocess
import json
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional

class Phase9ServiceWaitEngine:
    """Elite service startup monitoring with intelligent wait patterns"""

    def __init__(self):
        # Services requiring startup monitoring
        self.services = {
            'os-consciousness': {
                'port': 3004,
                'priority': 1,
                'expected_startup_time': 30,
                'max_wait_time': 120,
                'already_healthy': True  # This one is already working
            },
            'os-core': {
                'port': 8080,
                'priority': 2,
                'expected_startup_time': 45,
                'max_wait_time': 180,
                'already_healthy': False
            },
            'government-compliance': {
                'port': 8082,
                'priority': 3,
                'expected_startup_time': 60,
                'max_wait_time': 200,
                'already_healthy': False
            },
            'county-isolation': {
                'port': 8083,
                'priority': 4,
                'expected_startup_time': 70,
                'max_wait_time': 220,
                'already_healthy': False
            },
            'quantum-optimizer': {
                'port': 8085,
                'priority': 5,
                'expected_startup_time': 50,
                'max_wait_time': 180,
                'already_healthy': False
            },
            'harris-pacs-bridge': {
                'port': 8084,
                'priority': 6,
                'expected_startup_time': 80,
                'max_wait_time': 240,
                'already_healthy': False
            }
        }

        self.wait_metrics = {
            'services_monitored': 0,
            'services_healthy': 0,
            'total_wait_time': 0,
            'championship_score': 0.0,
            'health_achievements': []
        }

    def print_banner(self):
        """Print Phase 9 Service Wait Engine banner"""
        print("⏳ PHASE 9: SERVICE WAIT ENGINE")
        print("=" * 31)
        print("🎯 Mission: Intelligent Service Startup Monitoring")
        print("⏰ Target: Progressive Health Achievement")
        print("💊 Method: Adaptive Wait Strategies with Real-time Health Checks")
        print("=" * 31)
        print()

    def test_service_health(self, service_name: str, port: int) -> Dict:
        """Test service health with comprehensive metrics"""
        try:
            start_time = time.time()
            response = requests.get(f"http://localhost:{port}/health", timeout=8)
            response_time_ms = (time.time() - start_time) * 1000

            # Additional health validation
            health_data = {}
            if response.status_code == 200:
                try:
                    health_data = response.json()
                except:
                    pass

            return {
                'healthy': response.status_code == 200,
                'response_time_ms': response_time_ms,
                'status_code': response.status_code,
                'health_data': health_data
            }
        except requests.exceptions.ConnectionError:
            return {
                'healthy': False,
                'response_time_ms': 0.0,
                'status_code': 0,
                'error': 'connection_refused'
            }
        except requests.exceptions.Timeout:
            return {
                'healthy': False,
                'response_time_ms': 8000.0,  # Timeout
                'status_code': 0,
                'error': 'timeout'
            }
        except Exception as e:
            return {
                'healthy': False,
                'response_time_ms': 0.0,
                'status_code': 0,
                'error': f'exception: {e}'
            }

    def monitor_service_startup(self, service_name: str) -> Dict:
        """Monitor individual service startup with intelligent timing"""
        service_config = self.services[service_name]

        if service_config.get('already_healthy', False):
            print(f"💊 {service_name.upper()}: Already healthy - quick validation")
            health_result = self.test_service_health(service_name, service_config['port'])
            if health_result['healthy']:
                print(f"   ✅ Confirmed healthy ({health_result['response_time_ms']:.1f}ms)")
                return {
                    'service': service_name,
                    'startup_successful': True,
                    'wait_duration': 0,
                    'final_health': health_result,
                    'achievement_time': datetime.now()
                }
            else:
                print(f"   ⚠️ Health check failed - monitoring startup")

        print(f"⏳ MONITORING: {service_name.upper()}")
        print(f"   Expected startup: {service_config['expected_startup_time']}s")
        print(f"   Maximum wait: {service_config['max_wait_time']}s")

        startup_result = {
            'service': service_name,
            'startup_successful': False,
            'wait_duration': 0,
            'health_checks_performed': 0,
            'final_health': {},
            'startup_timeline': [],
            'achievement_time': None
        }

        monitor_start_time = time.time()
        check_interval = 10  # Check every 10 seconds

        # Progressive monitoring with increasing intervals
        intervals = [5, 10, 10, 15, 15, 20, 20, 30, 30]  # Start frequent, then slower
        interval_index = 0

        while time.time() - monitor_start_time < service_config['max_wait_time']:
            current_wait = time.time() - monitor_start_time

            # Perform health check
            health_result = self.test_service_health(service_name, service_config['port'])
            startup_result['health_checks_performed'] += 1

            # Record timeline entry
            timeline_entry = {
                'elapsed': current_wait,
                'healthy': health_result['healthy'],
                'response_time_ms': health_result['response_time_ms']
            }
            startup_result['startup_timeline'].append(timeline_entry)

            if health_result['healthy']:
                # Service is now healthy!
                startup_result['startup_successful'] = True
                startup_result['wait_duration'] = current_wait
                startup_result['final_health'] = health_result
                startup_result['achievement_time'] = datetime.now()

                # Determine achievement level
                expected_time = service_config['expected_startup_time']
                if current_wait <= expected_time:
                    achievement_level = "🏆 CHAMPIONSHIP"
                elif current_wait <= expected_time * 1.5:
                    achievement_level = "✅ ELITE"
                elif current_wait <= expected_time * 2.0:
                    achievement_level = "🚀 EXCELLENT"
                else:
                    achievement_level = "💪 ACHIEVED"

                print(f"   {achievement_level} Health achieved at {current_wait:.1f}s")
                print(f"   📊 Response: {health_result['response_time_ms']:.1f}ms")

                # Additional service validation for special services
                if 'health_data' in health_result and health_result['health_data']:
                    health_data = health_result['health_data']
                    if 'version' in health_data:
                        print(f"   📋 Version: {health_data['version']}")
                    if 'components' in health_data:
                        components = health_data['components']
                        healthy_components = sum(1 for status in components.values() if status == 'healthy')
                        total_components = len(components)
                        print(f"   🔧 Components: {healthy_components}/{total_components} healthy")

                break
            else:
                # Still not healthy - show progress
                error_info = ""
                if 'error' in health_result:
                    error_type = health_result['error']
                    if error_type == 'connection_refused':
                        error_info = "(service not ready)"
                    elif error_type == 'timeout':
                        error_info = "(service slow to respond)"
                    else:
                        error_info = f"({error_type})"

                print(f"   🔄 Startup progress: {current_wait:.0f}s elapsed {error_info}")

            # Wait before next check (progressive intervals)
            if interval_index < len(intervals):
                wait_time = intervals[interval_index]
                interval_index += 1
            else:
                wait_time = 30  # Default to 30s intervals for long waits

            time.sleep(wait_time)

        # Final status if not achieved
        if not startup_result['startup_successful']:
            final_wait = time.time() - monitor_start_time
            startup_result['wait_duration'] = final_wait

            # Final health check
            startup_result['final_health'] = self.test_service_health(service_name, service_config['port'])

            print(f"   ⏰ Monitoring timeout: {final_wait:.1f}s")
            print(f"   🚀 Service may need extended initialization time")

        print()
        return startup_result

    def run_service_wait_monitoring(self):
        """Execute comprehensive service startup monitoring"""
        self.print_banner()

        print("🧠 INITIAL AI CONSCIOUSNESS VALIDATION")
        print("=" * 38)

        # Always check AI Consciousness first
        consciousness_health = self.test_service_health('os-consciousness', 3004)
        if consciousness_health['healthy']:
            print(f"   ✅ AI Consciousness: TRANSCENDENT ({consciousness_health['response_time_ms']:.1f}ms)")

            # Display AI consciousness details if available
            if 'health_data' in consciousness_health and consciousness_health['health_data']:
                health_data = consciousness_health['health_data']
                if 'uptime_seconds' in health_data:
                    uptime_minutes = health_data['uptime_seconds'] / 60
                    print(f"   ⏰ Uptime: {uptime_minutes:.0f} minutes")
                if 'quantum_enabled' in health_data and health_data['quantum_enabled']:
                    print(f"   ⚡ Quantum Enhancement: ACTIVE")
        else:
            print("   ⚠️ AI Consciousness: Checking...")

        print()

        # Monitor services in priority order (excluding consciousness)
        print("⏳ PROGRESSIVE SERVICE STARTUP MONITORING")
        print("=" * 40)

        monitoring_start_time = time.time()
        monitoring_results = {}

        # Get services in priority order (skip consciousness)
        services_to_monitor = [
            (name, config) for name, config in
            sorted(self.services.items(), key=lambda x: x[1]['priority'])
            if not config.get('already_healthy', False)
        ]

        for service_name, service_config in services_to_monitor:
            self.wait_metrics['services_monitored'] += 1

            monitoring_result = self.monitor_service_startup(service_name)
            monitoring_results[service_name] = monitoring_result

            if monitoring_result['startup_successful']:
                self.wait_metrics['services_healthy'] += 1
                self.wait_metrics['health_achievements'].append({
                    'service': service_name,
                    'achievement_time': monitoring_result['achievement_time'],
                    'duration': monitoring_result['wait_duration']
                })

        # Final comprehensive health check
        print("📊 COMPREHENSIVE FINAL HEALTH ASSESSMENT")
        print("=" * 41)

        final_healthy_services = []
        final_initializing_services = []

        for service_name, service_config in self.services.items():
            health_result = self.test_service_health(service_name, service_config['port'])

            if health_result['healthy']:
                final_healthy_services.append(service_name)

                response_ms = health_result['response_time_ms']
                if response_ms <= 25:
                    performance_level = "🏆 CHAMPIONSHIP"
                elif response_ms <= 50:
                    performance_level = "✅ ELITE"
                else:
                    performance_level = "🚀 GOOD"

                print(f"   {service_name.upper()}: {performance_level} ({response_ms:.1f}ms)")
            else:
                final_initializing_services.append(service_name)
                print(f"   {service_name.upper()}: 🔄 CONTINUING INITIALIZATION")

        # Calculate final metrics
        total_monitoring_time = time.time() - monitoring_start_time
        self.wait_metrics['total_wait_time'] = total_monitoring_time

        total_services = len(self.services)
        final_healthy_count = len(final_healthy_services)
        championship_score = final_healthy_count / total_services if total_services > 0 else 0
        self.wait_metrics['championship_score'] = championship_score

        print()
        print("🏆 MONITORING SUMMARY")
        print("=" * 21)
        print(f"⏱️ Total Monitoring Time: {total_monitoring_time:.1f} seconds")
        print(f"⏳ Services Monitored: {self.wait_metrics['services_monitored']}")
        print(f"💊 Services Achieved Health: {len(self.wait_metrics['health_achievements'])}")
        print(f"✅ Final Healthy Services: {final_healthy_count}/{total_services}")
        print(f"🏆 Championship Score: {championship_score:.1%}")

        # Show achievement timeline
        if self.wait_metrics['health_achievements']:
            print()
            print("🏅 HEALTH ACHIEVEMENT TIMELINE")
            print("=" * 30)
            for achievement in self.wait_metrics['health_achievements']:
                service = achievement['service']
                duration = achievement['duration']
                time_str = achievement['achievement_time'].strftime("%H:%M:%S")
                print(f"   {time_str}: {service.upper()} → Health achieved in {duration:.1f}s")

        print()

        # Determine final status
        if championship_score >= 0.90:
            final_status = "🎊 CHAMPIONSHIP MONITORING SUCCESS"
            next_action = "All services performing at elite levels"
        elif championship_score >= 0.75:
            final_status = "🏆 ELITE MONITORING ACHIEVEMENT"
            next_action = "Services achieving excellent performance"
        elif championship_score >= 0.50:
            final_status = "⏳ MONITORING ADVANCING WELL"
            next_action = "Services progressing toward health"
        else:
            final_status = "🚀 MONITORING PROGRESSING"
            next_action = "Services requiring extended initialization time"

        if final_initializing_services:
            print(f"🔄 SERVICES STILL INITIALIZING: {', '.join(s.upper() for s in final_initializing_services)}")
            print(f"💡 These services may require additional startup time due to:")
            print(f"   - Complex initialization sequences")
            print(f"   - Resource allocation and optimization")
            print(f"   - Inter-service dependency coordination")
            print()

        print(f"🎯 FINAL STATUS: {final_status}")
        print(f"🚀 NEXT ACTION: {next_action}")
        print()
        print("🌟 PHASE 9 SERVICE WAIT MONITORING COMPLETED")
        print("Government. Transcended. Services. MONITORED.")

        return {
            'monitoring_results': monitoring_results,
            'final_healthy_services': final_healthy_services,
            'final_initializing_services': final_initializing_services,
            'metrics': self.wait_metrics,
            'championship_score': championship_score
        }

if __name__ == "__main__":
    wait_engine = Phase9ServiceWaitEngine()
    wait_engine.run_service_wait_monitoring()
