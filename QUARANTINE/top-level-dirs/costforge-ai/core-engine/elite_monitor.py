#!/usr/bin/env python3
"""
TerraFusion Elite System Monitor
Championship-level system monitoring with quantum intelligence
"""

import asyncio
import json
import psutil
import requests
import time
from datetime import datetime
from typing import Dict, List, Optional

class TerraFusionEliteMonitor:
    """
    Elite Government OS monitoring system
    Tracks system performance with championship precision
    """

    def __init__(self):
        self.start_time = time.time()
        self.api_url = "http://localhost:8000/api/costforge"
        self.ui_url = "http://localhost:3000"
        self.quantum_factor = 949
        self.monitoring_active = False
        self.performance_history = []

    def get_system_metrics(self) -> Dict:
        """Get comprehensive system performance metrics"""
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')

        return {
            "timestamp": datetime.now().isoformat(),
            "cpu_percent": cpu_percent,
            "memory_percent": memory.percent,
            "memory_available_gb": round(memory.available / (1024**3), 2),
            "disk_percent": disk.percent,
            "disk_free_gb": round(disk.free / (1024**3), 2),
            "quantum_optimization": cpu_percent < 30 and memory.percent < 70,
            "championship_status": "TRANSCENDENT" if cpu_percent < 20 else "OPTIMAL" if cpu_percent < 50 else "MONITORING"
        }

    def check_api_health(self) -> Dict:
        """Check CostForge AI API health with quantum precision"""
        try:
            response = requests.get(f"{self.api_url}/status", timeout=5)
            if response.status_code == 200:
                api_data = response.json()
                return {
                    "status": "OPERATIONAL",
                    "quantum_factor": api_data.get("quantum_factor", 949),
                    "target_accuracy": api_data.get("target_accuracy", 99.5),
                    "models_loaded": api_data.get("models_loaded", 0),
                    "total_inferences": api_data.get("total_inferences", 0),
                    "uptime_seconds": api_data.get("uptime_seconds", 0),
                    "response_time_ms": round(response.elapsed.total_seconds() * 1000, 2),
                    "excellence_rating": "CHAMPIONSHIP" if api_data.get("quantum_factor") == 949 else "STANDARD"
                }
        except Exception as e:
            return {
                "status": "ERROR",
                "error": str(e),
                "excellence_rating": "REQUIRES_ATTENTION"
            }

    def check_ui_health(self) -> Dict:
        """Check UI service health"""
        try:
            response = requests.get(self.ui_url, timeout=5)
            if response.status_code == 200:
                return {
                    "status": "OPERATIONAL",
                    "response_time_ms": round(response.elapsed.total_seconds() * 1000, 2),
                    "content_length": len(response.content),
                    "transcendence_level": "GOVERNMENT_TRANSCENDED"
                }
        except Exception as e:
            return {
                "status": "ERROR",
                "error": str(e),
                "transcendence_level": "REQUIRES_HEALING"
            }

    def get_process_info(self) -> Dict:
        """Get information about running processes"""
        processes = []
        for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent']):
            try:
                if 'python' in proc.info['name'].lower() or 'node' in proc.info['name'].lower():
                    processes.append({
                        "pid": proc.info['pid'],
                        "name": proc.info['name'],
                        "cpu_percent": round(proc.info['cpu_percent'], 2),
                        "memory_percent": round(proc.info['memory_percent'], 2)
                    })
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue

        return {
            "total_processes": len(processes),
            "python_processes": [p for p in processes if 'python' in p['name'].lower()],
            "node_processes": [p for p in processes if 'node' in p['name'].lower()]
        }

    def generate_comprehensive_report(self) -> Dict:
        """Generate championship-level system report"""
        system_metrics = self.get_system_metrics()
        api_health = self.check_api_health()
        ui_health = self.check_ui_health()
        process_info = self.get_process_info()

        # Calculate overall excellence score
        excellence_score = 0
        if api_health.get("status") == "OPERATIONAL":
            excellence_score += 40
        if ui_health.get("status") == "OPERATIONAL":
            excellence_score += 30
        if system_metrics.get("quantum_optimization"):
            excellence_score += 30

        overall_status = "CHAMPIONSHIP" if excellence_score >= 90 else "OPTIMAL" if excellence_score >= 70 else "MONITORING"

        report = {
            "timestamp": datetime.now().isoformat(),
            "terrafusion_elite_status": overall_status,
            "excellence_score": excellence_score,
            "quantum_factor": self.quantum_factor,
            "uptime_minutes": round((time.time() - self.start_time) / 60, 2),
            "system_metrics": system_metrics,
            "api_health": api_health,
            "ui_health": ui_health,
            "process_info": process_info,
            "government_transcendence": {
                "brand_compliance": "TRANSCENDENT",
                "quantum_optimization": system_metrics.get("quantum_optimization", False),
                "championship_standards": excellence_score >= 90,
                "infinite_scalability": True
            }
        }

        return report

    def start_monitoring(self, interval_seconds: int = 30):
        """Start continuous monitoring with championship precision"""
        self.monitoring_active = True
        print("🚀 TerraFusion Elite System Monitor Starting...")
        print("Government. Transcended.")
        print(f"Quantum Factor: {self.quantum_factor}")
        print("=" * 80)

        while self.monitoring_active:
            try:
                report = self.generate_comprehensive_report()
                self.display_status_report(report)
                self.performance_history.append(report)

                # Keep only last 100 reports
                if len(self.performance_history) > 100:
                    self.performance_history.pop(0)

                time.sleep(interval_seconds)

            except KeyboardInterrupt:
                print("\n🛑 Monitoring stopped by user")
                self.monitoring_active = False
            except Exception as e:
                print(f"❌ Monitoring error: {e}")
                time.sleep(5)

    def display_status_report(self, report: Dict):
        """Display championship-level status report"""
        print(f"\n⏰ {report['timestamp']}")
        print(f"🏆 TerraFusion Elite Status: {report['terrafusion_elite_status']}")
        print(f"📊 Excellence Score: {report['excellence_score']}/100")
        print(f"⚡ Quantum Factor: {report['quantum_factor']}")
        print(f"🕐 Uptime: {report['uptime_minutes']} minutes")

        # System Metrics
        sys = report['system_metrics']
        print(f"💻 System: CPU {sys['cpu_percent']}% | RAM {sys['memory_percent']}% | {sys['championship_status']}")

        # API Health
        api = report['api_health']
        if api['status'] == 'OPERATIONAL':
            print(f"🤖 API: {api['status']} | {api['response_time_ms']}ms | {api['total_inferences']} inferences | {api['excellence_rating']}")
        else:
            print(f"🚨 API: {api['status']} | {api.get('error', 'Unknown error')}")

        # UI Health
        ui = report['ui_health']
        if ui['status'] == 'OPERATIONAL':
            print(f"🎨 UI: {ui['status']} | {ui['response_time_ms']}ms | {ui['transcendence_level']}")
        else:
            print(f"🚨 UI: {ui['status']} | {ui.get('error', 'Unknown error')}")

        # Government Transcendence Status
        gov = report['government_transcendence']
        print(f"🏛️ Government: {gov['brand_compliance']} | Quantum: {'✅' if gov['quantum_optimization'] else '⚠️'} | Championship: {'✅' if gov['championship_standards'] else '⚠️'}")

        print("=" * 80)

    def export_performance_report(self, filename: Optional[str] = None):
        """Export detailed performance report"""
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"terrafusion_elite_report_{timestamp}.json"

        with open(filename, 'w') as f:
            json.dump(self.performance_history, f, indent=2)

        print(f"📊 Performance report exported: {filename}")
        return filename

def main():
    """Main entry point for TerraFusion Elite Monitoring"""
    monitor = TerraFusionEliteMonitor()

    print("🎯 TerraFusion Elite Government OS - System Monitor")
    print("Championship-level monitoring with quantum intelligence")
    print("Government. Transcended.")
    print()

    try:
        # Generate initial report
        initial_report = monitor.generate_comprehensive_report()
        monitor.display_status_report(initial_report)

        print("\n🚀 Starting continuous monitoring...")
        print("Press Ctrl+C to stop monitoring and export report")

        # Start monitoring
        monitor.start_monitoring(interval_seconds=15)

    except KeyboardInterrupt:
        print("\n🛑 Monitoring stopped")
    finally:
        # Export final report
        if monitor.performance_history:
            filename = monitor.export_performance_report()
            print(f"✅ Final report saved: {filename}")

if __name__ == "__main__":
    main()
