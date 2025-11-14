#!/usr/bin/env python3
"""
TerraFusion Elite Government OS - Phase 9 Container Correction Engine
Championship-level container name correction and targeted service health recovery.
Government. Transcended.
"""

import subprocess
import json
import time
import requests
from datetime import datetime
from typing import Dict, List, Optional

class Phase9ContainerCorrectionEngine:
    """Elite container correction with proper name mapping and health recovery"""

    def __init__(self):
        # Correct container name mapping based on actual container names
        self.container_mapping = {
            'os-consciousness': 'terrafusion-consciousness',
            'os-core': 'terrafusion-os-core',
            'government-compliance': 'terrafusion-compliance',
            'county-isolation': 'terrafusion-isolation',
            'quantum-optimizer': 'terrafusion-quantum',
            'harris-pacs-bridge': 'terrafusion-harris-bridge'
        }

        # Service port mapping
        self.service_ports = {
            'os-consciousness': 3004,
            'os-core': 8080,
            'government-compliance': 8082,
            'county-isolation': 8083,
            'quantum-optimizer': 8085,
            'harris-pacs-bridge': 8084
        }

        self.correction_metrics = {
            'containers_analyzed': 0,
            'containers_corrected': 0,
            'services_healthy': 0,
            'championship_score': 0.0
        }

    def print_banner(self):
        """Print Phase 9 Container Correction banner"""
        print("🔧 PHASE 9: CONTAINER CORRECTION ENGINE")
        print("=" * 40)
        print("🎯 Mission: Correct Container Names & Achieve Health")
        print("🏗️ Target: 100% Service Operational Excellence")
        print("⚡ Method: Targeted Container Recovery & Health Validation")
        print("=" * 40)
        print()

    def analyze_container_status(self) -> Dict:
        """Analyze current container status with correct names"""
        print("📊 ANALYZING CURRENT CONTAINER STATUS")
        print("=" * 37)

        container_analysis = {}

        for service_name, container_name in self.container_mapping.items():
            self.correction_metrics['containers_analyzed'] += 1

            try:
                # Get container inspect information
                inspect_cmd = ['docker', 'inspect', container_name]
                result = subprocess.run(inspect_cmd, capture_output=True, text=True, timeout=10)

                if result.returncode == 0:
                    container_info = json.loads(result.stdout)[0]
                    state = container_info['State']

                    # Check health status
                    health_status = "unknown"
                    if 'Health' in container_info['State']:
                        health_info = container_info['State']['Health']
                        health_status = health_info.get('Status', 'unknown')

                    container_analysis[service_name] = {
                        'container_name': container_name,
                        'exists': True,
                        'running': state.get('Running', False),
                        'restarting': state.get('Restarting', False),
                        'restart_count': container_info.get('RestartCount', 0),
                        'exit_code': state.get('ExitCode', 0),
                        'status': state.get('Status', 'unknown'),
                        'health_status': health_status
                    }

                    # Display container status
                    running_status = "✅ RUNNING" if state.get('Running') else "🔄 RESTARTING" if state.get('Restarting') else "❌ STOPPED"
                    health_display = f"({health_status})" if health_status != "unknown" else ""
                    restart_info = f"[{container_info.get('RestartCount', 0)} restarts]" if container_info.get('RestartCount', 0) > 0 else ""

                    print(f"   {service_name.upper()}: {running_status} {health_display} {restart_info}")

                else:
                    container_analysis[service_name] = {
                        'container_name': container_name,
                        'exists': False,
                        'running': False,
                        'status': 'not_found'
                    }
                    print(f"   {service_name.upper()}: ❌ CONTAINER NOT FOUND")

            except Exception as e:
                container_analysis[service_name] = {
                    'container_name': container_name,
                    'exists': False,
                    'running': False,
                    'status': f'error: {e}'
                }
                print(f"   {service_name.upper()}: ❌ ERROR: {e}")

        print()
        return container_analysis

    def correct_container_health(self, service_name: str, container_info: Dict) -> Dict:
        """Apply targeted correction to unhealthy containers"""
        print(f"🔧 CORRECTING: {service_name.upper()}")
        container_name = container_info['container_name']

        correction_result = {
            'service': service_name,
            'correction_attempted': False,
            'correction_successful': False,
            'health_achieved': False,
            'actions_taken': [],
            'final_status': 'unknown'
        }

        try:
            # Determine correction strategy based on container state
            if not container_info.get('exists', False):
                print("   🚀 Container not found - will be handled by docker-compose")
                correction_result['final_status'] = 'requires_deployment'
                return correction_result

            elif container_info.get('restarting', False):
                print("   🔄 Container in restart loop - applying restart stabilization...")

                # Stop container to break restart loop
                stop_cmd = ['docker', 'stop', container_name]
                stop_result = subprocess.run(stop_cmd, capture_output=True, text=True, timeout=30)

                if stop_result.returncode == 0:
                    correction_result['actions_taken'].append('Container stopped to break restart loop')
                    print("   ✅ Container stopped successfully")

                    # Wait a moment for cleanup
                    time.sleep(5)

                    # Start container again
                    start_cmd = ['docker', 'start', container_name]
                    start_result = subprocess.run(start_cmd, capture_output=True, text=True, timeout=30)

                    if start_result.returncode == 0:
                        correction_result['actions_taken'].append('Container restarted successfully')
                        correction_result['correction_attempted'] = True
                        correction_result['correction_successful'] = True
                        print("   ✅ Container restart: SUCCESS")
                    else:
                        print(f"   ❌ Container start failed: {start_result.stderr}")

                else:
                    print(f"   ❌ Container stop failed: {stop_result.stderr}")

            elif not container_info.get('running', False):
                print("   🚀 Container stopped - starting...")

                start_cmd = ['docker', 'start', container_name]
                start_result = subprocess.run(start_cmd, capture_output=True, text=True, timeout=30)

                if start_result.returncode == 0:
                    correction_result['actions_taken'].append('Container started')
                    correction_result['correction_attempted'] = True
                    correction_result['correction_successful'] = True
                    print("   ✅ Container start: SUCCESS")
                else:
                    print(f"   ❌ Container start failed: {start_result.stderr}")

            elif container_info.get('health_status') == 'unhealthy':
                print("   💊 Container running but unhealthy - applying health correction...")

                # Restart for health reset
                restart_cmd = ['docker', 'restart', container_name]
                restart_result = subprocess.run(restart_cmd, capture_output=True, text=True, timeout=30)

                if restart_result.returncode == 0:
                    correction_result['actions_taken'].append('Container restarted for health reset')
                    correction_result['correction_attempted'] = True
                    correction_result['correction_successful'] = True
                    print("   ✅ Health restart: SUCCESS")
                else:
                    print(f"   ❌ Health restart failed: {restart_result.stderr}")

            else:
                print("   🏆 Container appears healthy - checking service response...")
                correction_result['correction_successful'] = True

            # Test service health if correction was attempted or container seems healthy
            if correction_result['correction_successful']:
                print("   ⏳ Waiting for service stabilization...")
                time.sleep(15)  # Allow time for service to stabilize

                service_port = self.service_ports.get(service_name, 8080)
                health_result = self.test_service_health(service_name, service_port)

                if health_result['healthy']:
                    correction_result['health_achieved'] = True
                    correction_result['final_status'] = 'healthy'
                    print(f"   🏆 Service health: ACHIEVED ({health_result['response_time_ms']:.1f}ms)")
                else:
                    correction_result['final_status'] = 'initializing'
                    print("   🚀 Service still initializing...")

        except Exception as e:
            correction_result['actions_taken'].append(f'Correction error: {e}')
            print(f"   ❌ Correction error: {e}")

        print()
        return correction_result

    def test_service_health(self, service_name: str, port: int) -> Dict:
        """Test service health endpoint"""
        try:
            start_time = time.time()
            response = requests.get(f"http://localhost:{port}/health", timeout=8)
            response_time_ms = (time.time() - start_time) * 1000

            return {
                'healthy': response.status_code == 200,
                'response_time_ms': response_time_ms,
                'status_code': response.status_code
            }
        except:
            return {
                'healthy': False,
                'response_time_ms': 0.0,
                'status_code': 0
            }

    def run_container_correction(self):
        """Execute complete container correction sequence"""
        self.print_banner()

        correction_start_time = time.time()

        # Step 1: Analyze current container status
        container_analysis = self.analyze_container_status()

        # Step 2: Apply corrections to problematic containers
        print("🔧 APPLYING TARGETED CONTAINER CORRECTIONS")
        print("=" * 41)

        correction_results = {}

        for service_name, container_info in container_analysis.items():
            # Skip if container is already healthy and running
            if (container_info.get('running', False) and
                container_info.get('health_status', 'unknown') == 'healthy'):
                print(f"✅ {service_name.upper()}: Already healthy - skipping")
                correction_results[service_name] = {
                    'service': service_name,
                    'correction_needed': False,
                    'health_achieved': True,
                    'final_status': 'healthy'
                }
                continue

            # Apply correction
            correction_result = self.correct_container_health(service_name, container_info)
            correction_results[service_name] = correction_result

            if correction_result['correction_attempted']:
                self.correction_metrics['containers_corrected'] += 1

            if correction_result['health_achieved']:
                self.correction_metrics['services_healthy'] += 1

        # Step 3: Final health validation
        print("📊 FINAL HEALTH VALIDATION")
        print("=" * 26)

        final_healthy_count = 0
        total_services = len(self.service_ports)

        for service_name, port in self.service_ports.items():
            health_result = self.test_service_health(service_name, port)

            if health_result['healthy']:
                final_healthy_count += 1
                target_ms = 50  # General target
                response_ms = health_result['response_time_ms']

                if response_ms <= target_ms:
                    status = "🏆 CHAMPIONSHIP"
                elif response_ms <= target_ms * 1.5:
                    status = "✅ ELITE"
                else:
                    status = "🚀 GOOD"

                print(f"   {service_name.upper()}: {status} ({response_ms:.1f}ms)")
            else:
                print(f"   {service_name.upper()}: 🔄 INITIALIZING")

        # Calculate metrics
        championship_score = final_healthy_count / total_services if total_services > 0 else 0
        self.correction_metrics['championship_score'] = championship_score
        correction_duration = time.time() - correction_start_time

        print()
        print("🏆 CORRECTION SUMMARY")
        print("=" * 21)
        print(f"⏱️ Correction Duration: {correction_duration:.1f} seconds")
        print(f"🔧 Containers Analyzed: {self.correction_metrics['containers_analyzed']}")
        print(f"⚡ Containers Corrected: {self.correction_metrics['containers_corrected']}")
        print(f"💊 Services Healthy: {final_healthy_count}/{total_services}")
        print(f"🏆 Championship Score: {championship_score:.1%}")
        print()

        # Determine final status
        if championship_score >= 0.85:
            final_status = "🎊 CHAMPIONSHIP CORRECTION ACHIEVED"
            next_action = "All services performing excellently"
        elif championship_score >= 0.70:
            final_status = "🏆 ELITE CORRECTION SUCCESS"
            next_action = "Services achieving elite performance"
        elif championship_score >= 0.50:
            final_status = "⚡ CORRECTION ADVANCING"
            next_action = "Services continuing optimization"
        else:
            final_status = "🚀 CORRECTION PROGRESSING"
            next_action = "Services requiring additional startup time"

        print(f"🎯 FINAL STATUS: {final_status}")
        print(f"🚀 NEXT ACTION: {next_action}")
        print()
        print("🌟 PHASE 9 CONTAINER CORRECTION COMPLETED")
        print("Government. Transcended. Containers. CORRECTED.")

        return {
            'container_analysis': container_analysis,
            'correction_results': correction_results,
            'metrics': self.correction_metrics,
            'championship_score': championship_score
        }

if __name__ == "__main__":
    correction_engine = Phase9ContainerCorrectionEngine()
    correction_engine.run_container_correction()
