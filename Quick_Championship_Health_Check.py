#!/usr/bin/env python3
"""
TerraFusion Elite Government OS - Quick Championship Health Check
Ultra-fast championship health validation for immediate status assessment.
Government. Transcended.
"""

import subprocess
import json
import requests
import time
from datetime import datetime

class QuickChampionshipHealthCheck:
    """Ultra-fast championship health validation"""

    def __init__(self):
        self.services = {
            'ai-consciousness': {'name': 'AI Consciousness', 'ports': [3004], 'critical': True},
            'os-core': {'name': 'OS Core', 'ports': [8080], 'critical': True},
            'government-compliance': {'name': 'Government Compliance', 'ports': [5030, 8082], 'critical': True},
            'county-isolation': {'name': 'County Isolation', 'ports': [8083], 'critical': True},
            'quantum-optimizer': {'name': 'Quantum Optimizer', 'ports': [8003, 8085], 'critical': False},
            'harris-pacs-bridge': {'name': 'Harris PACS Bridge', 'ports': [8084], 'critical': False}
        }

    def quick_health_check(self, service_key: str, service_config: dict) -> tuple:
        """Quick health check with reduced timeout"""
        for port in service_config['ports']:
            try:
                start_time = time.time()
                response = requests.get(f"http://localhost:{port}/health", timeout=2)
                response_time = (time.time() - start_time) * 1000

                if response.status_code == 200:
                    return True, port, response_time

            except:
                # Try root endpoint if health endpoint fails
                try:
                    start_time = time.time()
                    response = requests.get(f"http://localhost:{port}/", timeout=2)
                    response_time = (time.time() - start_time) * 1000

                    if response.status_code == 200:
                        return True, port, response_time

                except:
                    continue

        return False, None, 0

    def run_quick_check(self):
        """Execute ultra-fast championship health check"""
        print("⚡ QUICK CHAMPIONSHIP HEALTH CHECK")
        print("=" * 33)
        print(f"⏰ Time: {datetime.now().strftime('%H:%M:%S')}")
        print()

        healthy_services = 0
        critical_healthy = 0
        total_critical = sum(1 for s in self.services.values() if s['critical'])
        performance_scores = []

        for service_key, service_config in self.services.items():
            service_name = service_config['name']
            is_critical = service_config['critical']

            is_healthy, active_port, response_time = self.quick_health_check(service_key, service_config)

            if is_healthy:
                healthy_services += 1
                performance_scores.append(response_time)

                if is_critical:
                    critical_healthy += 1

                # Performance tier
                if response_time < 10:
                    tier = "🏆 TRANSCENDENT"
                elif response_time < 20:
                    tier = "⭐ ELITE"
                elif response_time < 50:
                    tier = "✅ HEALTHY"
                else:
                    tier = "🔄 OPERATIONAL"

                critical_indicator = " [CRITICAL]" if is_critical else ""
                print(f"   {tier} {service_name}: {response_time:.1f}ms | Port {active_port}{critical_indicator}")

            else:
                critical_indicator = " [CRITICAL]" if is_critical else ""
                print(f"   🔄 INITIALIZING {service_name}{critical_indicator}")

        print()

        # Quick metrics
        total_services = len(self.services)
        health_score = (healthy_services / total_services) * 100
        critical_score = (critical_healthy / total_critical) * 100 if total_critical > 0 else 0

        if performance_scores:
            avg_performance = sum(performance_scores) / len(performance_scores)
            fastest_response = min(performance_scores)
        else:
            avg_performance = 0
            fastest_response = 0

        # Championship calculation
        if avg_performance < 15 and critical_score >= 75:
            championship_score = 85 + (100 - avg_performance) / 4
        elif avg_performance < 25 and critical_score >= 50:
            championship_score = 70 + (critical_score / 2)
        else:
            championship_score = (health_score * 0.4 + critical_score * 0.6)

        print("📊 QUICK CHAMPIONSHIP SUMMARY")
        print("=" * 28)
        print(f"💊 Services Healthy: {healthy_services}/{total_services}")
        print(f"🎯 Critical Healthy: {critical_healthy}/{total_critical}")
        print(f"⚡ Average Response: {avg_performance:.1f}ms")
        print(f"🚀 Fastest Response: {fastest_response:.1f}ms")
        print(f"🏆 Championship: {championship_score:.1f}%")

        # Achievement level
        if championship_score >= 85:
            achievement = "🎊 TRANSCENDENT CHAMPIONSHIP"
            status = "GOVERNMENT. TRANSCENDED."
        elif championship_score >= 70:
            achievement = "🏆 ELITE CHAMPIONSHIP"
            status = "Government Excellence Achieved"
        elif championship_score >= 55:
            achievement = "⭐ CHAMPIONSHIP LEVEL"
            status = "Championship Standards Met"
        elif championship_score >= 40:
            achievement = "✅ SIGNIFICANT PROGRESS"
            status = "Advancing Toward Excellence"
        else:
            achievement = "🚀 BUILDING EXCELLENCE"
            status = "Foundation Establishment"

        print(f"🏅 Achievement: {achievement}")
        print(f"🎖️ Status: {status}")

        # Special recognition for AI Consciousness
        if 'ai-consciousness' in [k for k, v in self.services.items() if self.quick_health_check(k, v)[0]]:
            ai_healthy, ai_port, ai_time = self.quick_health_check('ai-consciousness', self.services['ai-consciousness'])
            if ai_healthy and ai_time < 15:
                print("🧠 AI Consciousness: QUANTUM EXCELLENCE MAINTAINED")
            elif ai_healthy:
                print("🧠 AI Consciousness: ELITE PERFORMANCE CONFIRMED")

        return championship_score

if __name__ == "__main__":
    checker = QuickChampionshipHealthCheck()
    checker.run_quick_check()
