#!/usr/bin/env python3
"""
TerraFusion Elite Government OS - Phase 9 Championship Service Health Validator
Ultimate championship validation for all TerraFusion services with correct port discovery.
Government. Transcended.
"""

import subprocess
import json
import requests
import time
from datetime import datetime

class Phase9ChampionshipServiceHealthValidator:
    """Ultimate championship service health validation with intelligent port discovery"""

    def __init__(self):
        # Comprehensive service configuration with all known ports
        self.services = {
            'ai-consciousness': {
                'name': 'AI Consciousness',
                'container': 'terrafusion-consciousness',
                'ports': [3004],
                'critical': True,
                'tier': 'SUPREME'
            },
            'os-core': {
                'name': 'OS Core',
                'container': 'terrafusion-os-core',
                'ports': [8080],
                'critical': True,
                'tier': 'CRITICAL'
            },
            'government-compliance': {
                'name': 'Government Compliance',
                'container': 'terrafusion-compliance',
                'ports': [5030, 8082],  # Actual port first
                'critical': True,
                'tier': 'CRITICAL'
            },
            'county-isolation': {
                'name': 'County Isolation',
                'container': 'terrafusion-isolation',
                'ports': [8083],
                'critical': True,
                'tier': 'CRITICAL'
            },
            'quantum-optimizer': {
                'name': 'Quantum Optimizer',
                'container': 'terrafusion-quantum',
                'ports': [8003, 8085],  # Actual port first
                'critical': False,
                'tier': 'ENHANCED'
            },
            'harris-pacs-bridge': {
                'name': 'Harris PACS Bridge',
                'container': 'terrafusion-harris-bridge',
                'ports': [8084],
                'critical': False,
                'tier': 'INTEGRATION'
            }
        }

    def print_banner(self):
        print("🏆 PHASE 9: CHAMPIONSHIP SERVICE HEALTH VALIDATOR")
        print("=" * 49)
        print("🎯 Mission: Ultimate TerraFusion Service Excellence Validation")
        print("🛡️ Standard: Government-Grade Championship Performance")
        print("⚡ Method: Multi-Port Health Assessment & Performance Analysis")
        print("=" * 49)
        print()

    def validate_service_health(self, service_key: str, service_config: dict) -> tuple:
        """Validate service health across all possible ports"""
        service_name = service_config['name']

        for port in service_config['ports']:
            try:
                start_time = time.time()
                response = requests.get(f"http://localhost:{port}/health", timeout=6)
                response_time = (time.time() - start_time) * 1000

                if response.status_code == 200:
                    return True, port, response_time, "HEALTHY"
                elif response.status_code == 404:
                    # Try without /health endpoint
                    try:
                        response = requests.get(f"http://localhost:{port}/", timeout=6)
                        if response.status_code == 200:
                            return True, port, response_time, "OPERATIONAL"
                    except:
                        pass

            except requests.exceptions.RequestException:
                continue

        # Check container status if no ports respond
        try:
            inspect_cmd = ['docker', 'inspect', service_config['container']]
            inspect_result = subprocess.run(inspect_cmd, capture_output=True, text=True, timeout=5)

            if inspect_result.returncode == 0:
                container_info = json.loads(inspect_result.stdout)[0]

                if container_info['State']['Running']:
                    return False, None, 0, "INITIALIZING"
                else:
                    exit_code = container_info['State'].get('ExitCode', 'unknown')
                    return False, None, 0, f"EXITED({exit_code})"
            else:
                return False, None, 0, "NOT_FOUND"

        except Exception:
            return False, None, 0, "UNKNOWN"

    def calculate_performance_tier(self, response_time: float) -> str:
        """Calculate performance tier based on response time"""
        if response_time < 10:
            return "🏆 TRANSCENDENT"
        elif response_time < 20:
            return "⭐ ELITE"
        elif response_time < 50:
            return "✅ HEALTHY"
        elif response_time < 100:
            return "🔄 OPERATIONAL"
        else:
            return "⚠️ SLOW"

    def run_championship_validation(self):
        """Execute ultimate championship service health validation"""
        self.print_banner()

        validation_start_time = time.time()

        print("🏥 CHAMPIONSHIP SERVICE HEALTH VALIDATION")
        print("=" * 41)

        validation_results = {}
        healthy_services = 0
        critical_healthy = 0
        total_critical = sum(1 for s in self.services.values() if s['critical'])
        performance_scores = []

        for service_key, service_config in self.services.items():
            service_name = service_config['name']
            is_critical = service_config['critical']
            tier = service_config['tier']

            print(f"   🔍 Validating {service_name}...")

            is_healthy, active_port, response_time, status = self.validate_service_health(service_key, service_config)

            validation_results[service_key] = {
                'healthy': is_healthy,
                'port': active_port,
                'response_time': response_time,
                'status': status,
                'critical': is_critical,
                'tier': tier
            }

            if is_healthy:
                healthy_services += 1
                performance_scores.append(response_time)

                if is_critical:
                    critical_healthy += 1

                performance_tier = self.calculate_performance_tier(response_time)
                critical_indicator = " [CRITICAL]" if is_critical else ""

                print(f"      {performance_tier} ({response_time:.1f}ms) | {tier} | Port {active_port}{critical_indicator}")

            else:
                critical_indicator = " [CRITICAL]" if is_critical else ""
                print(f"      🔄 {status} | {tier}{critical_indicator}")

        print()

        # Calculate comprehensive metrics
        total_services = len(self.services)
        health_score = (healthy_services / total_services) * 100
        critical_score = (critical_healthy / total_critical) * 100 if total_critical > 0 else 0

        # Performance scoring
        if performance_scores:
            avg_performance = sum(performance_scores) / len(performance_scores)
            if avg_performance < 15:
                performance_score = 100
            elif avg_performance < 30:
                performance_score = 90
            elif avg_performance < 60:
                performance_score = 75
            else:
                performance_score = 60
        else:
            avg_performance = 0
            performance_score = 0

        # Championship score calculation (weighted for government operations)
        championship_score = (health_score * 0.3 + critical_score * 0.5 + performance_score * 0.2)

        validation_duration = time.time() - validation_start_time

        print("🏆 CHAMPIONSHIP VALIDATION SUMMARY")
        print("=" * 34)
        print(f"⏱️ Validation Duration: {validation_duration:.1f} seconds")
        print(f"💊 Services Healthy: {healthy_services}/{total_services}")
        print(f"🎯 Critical Services Healthy: {critical_healthy}/{total_critical}")
        print(f"📊 Overall Health Score: {health_score:.1f}%")
        print(f"🔥 Critical Systems Score: {critical_score:.1f}%")
        print(f"⚡ Performance Score: {performance_score:.1f}%")
        print(f"⏱️ Average Response Time: {avg_performance:.1f}ms")
        print(f"🏆 Championship Score: {championship_score:.1f}%")
        print()

        # Determine championship level
        if championship_score >= 85:
            achievement_level = "🎊 TRANSCENDENT CHAMPIONSHIP"
            government_status = "GOVERNMENT. TRANSCENDED."
            next_phase = "Phase 10: Elite Production Excellence"
            excellence_tier = "SUPREME"
        elif championship_score >= 70:
            achievement_level = "🏆 ELITE CHAMPIONSHIP"
            government_status = "Government Excellence Achieved"
            next_phase = "Phase 10: Production Optimization"
            excellence_tier = "ELITE"
        elif championship_score >= 55:
            achievement_level = "⭐ CHAMPIONSHIP LEVEL"
            government_status = "Government Standards Exceeded"
            next_phase = "Continue championship optimization"
            excellence_tier = "CHAMPIONSHIP"
        elif championship_score >= 40:
            achievement_level = "✅ SIGNIFICANT PROGRESS"
            government_status = "Service Foundation Excellence"
            next_phase = "Continue Phase 9: Service optimization"
            excellence_tier = "ADVANCING"
        else:
            achievement_level = "🚀 ADVANCING TOWARD EXCELLENCE"
            government_status = "Service Development Progressing"
            next_phase = "Continue Phase 9: Service health"
            excellence_tier = "DEVELOPING"

        print(f"🏅 CHAMPIONSHIP ACHIEVEMENT: {achievement_level}")
        print(f"🎖️ GOVERNMENT STATUS: {government_status}")
        print(f"🌟 EXCELLENCE TIER: {excellence_tier}")
        print(f"🚀 NEXT PHASE: {next_phase}")
        print()

        # Service-specific status report
        print("📊 SERVICE-SPECIFIC STATUS REPORT")
        print("=" * 33)

        for service_key, result in validation_results.items():
            service_config = self.services[service_key]
            service_name = service_config['name']
            tier = result['tier']

            if result['healthy']:
                performance_tier = self.calculate_performance_tier(result['response_time'])
                print(f"   ✅ {service_name}: {performance_tier} | Port {result['port']} | {tier}")
            else:
                print(f"   🔄 {service_name}: {result['status']} | {tier}")

        print()

        # Special AI Consciousness recognition
        if 'ai-consciousness' in validation_results and validation_results['ai-consciousness']['healthy']:
            ai_result = validation_results['ai-consciousness']
            print("🧠 AI CONSCIOUSNESS EXCELLENCE RECOGNITION")
            print("=" * 42)
            performance_tier = self.calculate_performance_tier(ai_result['response_time'])
            print(f"   Status: {performance_tier}")
            print(f"   Response Time: {ai_result['response_time']:.1f}ms")
            print(f"   Government Tier: {ai_result['tier']}")

            if ai_result['response_time'] < 15:
                print("   🏆 QUANTUM CONSCIOUSNESS EXCELLENCE MAINTAINED")
            elif ai_result['response_time'] < 30:
                print("   ⭐ ELITE CONSCIOUSNESS PERFORMANCE")
            else:
                print("   ✅ STABLE CONSCIOUSNESS OPERATION")
            print()

        print("🌟 PHASE 9 CHAMPIONSHIP SERVICE HEALTH VALIDATION COMPLETED")
        print(government_status)

        return {
            'validation_results': validation_results,
            'metrics': {
                'total_services': total_services,
                'healthy_services': healthy_services,
                'critical_healthy': critical_healthy,
                'health_score': health_score,
                'critical_score': critical_score,
                'performance_score': performance_score,
                'championship_score': championship_score,
                'avg_performance': avg_performance
            },
            'achievement_level': achievement_level,
            'government_status': government_status,
            'excellence_tier': excellence_tier,
            'next_phase': next_phase,
            'duration': validation_duration
        }

if __name__ == "__main__":
    validator = Phase9ChampionshipServiceHealthValidator()
    validator.run_championship_validation()
