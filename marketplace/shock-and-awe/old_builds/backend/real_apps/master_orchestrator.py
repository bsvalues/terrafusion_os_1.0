#!/usr/bin/env python3
"""
TerraFusion Master Orchestrator Dashboard
Single point of control for the entire TerraFusion ecosystem
"""

import asyncio
import aiohttp
import json
import time
from typing import Dict, List
from datetime import datetime


class TerraFusionMasterOrchestrator:
    def __init__(self):
        self.applications = {
            "terrafusion-build": {"port": 5000, "status": "unknown", "last_check": None},
            "terraflow": {"port": 5001, "status": "unknown", "last_check": None},
            "terrafusion-sync": {"port": 5002, "status": "unknown", "last_check": None},
            "terraagent": {"port": 5003, "status": "unknown", "last_check": None},
            "terrafusion-assessor": {"port": 5004, "status": "unknown", "last_check": None},
            "terrafusion-dashboard": {"port": 5005, "status": "unknown", "last_check": None},
            "terraminer": {"port": 5006, "status": "unknown", "last_check": None},
            "bs-income-valuation": {"port": 5007, "status": "unknown", "last_check": None},
            "terrafusion-pro": {"port": 5008, "status": "unknown", "last_check": None},
            "bcbs-gis-pro": {"port": 5010, "status": "unknown", "last_check": None},
            "bcbs-levy": {"port": 5009, "status": "unknown", "last_check": None},
            "terrafusion-assistant": {"port": 5011, "status": "unknown", "last_check": None},
            "terrafusion-pro-plus": {"port": 5012, "status": "unknown", "last_check": None},
            "terrafusion-permit": {"port": 5013, "status": "unknown", "last_check": None},
            "terrafusion-pilt": {"port": 5014, "status": "unknown", "last_check": None},
            "rag-system": {"port": 8001, "status": "unknown", "last_check": None}
        }

        self.start_time = datetime.now()
        self.check_count = 0

    async def check_all_applications(self):
        """Check health of all applications concurrently"""
        print(f"🔍 Checking {len(self.applications)} applications...")

        tasks = []
        for app_name, config in self.applications.items():
            task = self.check_application_health(app_name, config["port"])
            tasks.append(task)

        results = await asyncio.gather(*tasks, return_exceptions=True)

        for i, (app_name, config) in enumerate(self.applications.items()):
            if isinstance(results[i], Exception):
                config["status"] = "error"
                config["error"] = str(results[i])
                config["last_check"] = datetime.now()
            else:
                config["status"] = results[i]["status"]
                config["details"] = results[i]
                config["last_check"] = datetime.now()

        self.check_count += 1

    async def check_application_health(self, app_name: str, port: int):
        """Check individual application health"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"http://localhost:{port}/health", timeout=5) as response:
                    if response.status == 200:
                        data = await response.json()
                        return {"status": "healthy", "data": data}
                    else:
                        return {"status": "unhealthy", "code": response.status}
        except Exception as e:
            return {"status": "down", "error": str(e)}

    def generate_status_report(self):
        """Generate comprehensive status report"""
        healthy_count = sum(
            1 for app in self.applications.values() if app["status"] == "healthy")
        total_count = len(self.applications)
        uptime_percentage = (healthy_count / total_count) * 100

        # Determine overall status
        if healthy_count == total_count:
            overall_status = "🟢 HEALTHY"
        elif healthy_count > total_count * 0.8:
            overall_status = "🟡 DEGRADED"
        else:
            overall_status = "🔴 CRITICAL"

        report = {
            "timestamp": datetime.now().isoformat(),
            "overall_status": overall_status,
            "healthy_applications": healthy_count,
            "total_applications": total_count,
            "uptime_percentage": round(uptime_percentage, 2),
            "uptime": str(datetime.now() - self.start_time),
            "check_count": self.check_count,
            "applications": self.applications
        }

        return report

    def print_status_report(self):
        """Print formatted status report to console"""
        report = self.generate_status_report()

        print("\n" + "="*80)
        print("🏛️ TERRAFUSION MASTER ORCHESTRATOR DASHBOARD")
        print("="*80)
        print(f"📊 Overall Status: {report['overall_status']}")
        print(
            f"📈 Health: {report['healthy_applications']}/{report['total_applications']} applications")
        print(f"📊 Uptime: {report['uptime_percentage']}%")
        print(f"⏱️ Running Time: {report['uptime']}")
        print(f"🔍 Checks Performed: {report['check_count']}")
        print(f"🕐 Last Update: {report['timestamp']}")
        print("-"*80)

        # Group applications by status
        healthy_apps = []
        degraded_apps = []
        down_apps = []

        for app_name, config in self.applications.items():
            if config["status"] == "healthy":
                healthy_apps.append(app_name)
            elif config["status"] in ["unhealthy", "error"]:
                degraded_apps.append(app_name)
            else:
                down_apps.append(app_name)

        # Print healthy applications
        if healthy_apps:
            print(f"🟢 HEALTHY ({len(healthy_apps)}):")
            for app in healthy_apps:
                port = self.applications[app]["port"]
                print(f"   ✅ {app:<25} (Port {port})")

        # Print degraded applications
        if degraded_apps:
            print(f"\n🟡 DEGRADED ({len(degraded_apps)}):")
            for app in degraded_apps:
                port = self.applications[app]["port"]
                error = self.applications[app].get("error", "Unknown error")
                print(f"   ⚠️ {app:<25} (Port {port}) - {error}")

        # Print down applications
        if down_apps:
            print(f"\n🔴 DOWN ({len(down_apps)}):")
            for app in down_apps:
                port = self.applications[app]["port"]
                print(f"   ❌ {app:<25} (Port {port})")

        print("="*80)

        # Quick access URLs
        print("\n🌐 Quick Access URLs:")
        for app_name, config in self.applications.items():
            if config["status"] == "healthy":
                print(f"   {app_name}: http://localhost:{config['port']}")

        print("\n" + "="*80)

    async def continuous_monitoring(self, interval_seconds: int = 30):
        """Continuously monitor all applications"""
        print("🚀 Starting continuous monitoring...")
        print(f"📊 Check interval: {interval_seconds} seconds")
        print("Press Ctrl+C to stop monitoring\n")

        try:
            while True:
                await self.check_all_applications()
                self.print_status_report()
                await asyncio.sleep(interval_seconds)
        except KeyboardInterrupt:
            print("\n🛑 Monitoring stopped by user")

    def save_report(self, filename: str = None):
        """Save status report to JSON file"""
        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"terrafusion_status_{timestamp}.json"

        report = self.generate_status_report()

        with open(filename, 'w') as f:
            json.dump(report, f, indent=2, default=str)

        print(f"📄 Status report saved to: {filename}")


def main():
    """Main function"""
    import sys

    orchestrator = TerraFusionMasterOrchestrator()

    if len(sys.argv) > 1:
        command = sys.argv[1].lower()

        if command == "monitor":
            # Continuous monitoring
            interval = int(sys.argv[2]) if len(sys.argv) > 2 else 30
            asyncio.run(orchestrator.continuous_monitoring(interval))

        elif command == "save":
            # Save report to file
            filename = sys.argv[2] if len(sys.argv) > 2 else None
            asyncio.run(orchestrator.check_all_applications())
            orchestrator.save_report(filename)

        elif command == "json":
            # Output JSON format
            asyncio.run(orchestrator.check_all_applications())
            report = orchestrator.generate_status_report()
            print(json.dumps(report, indent=2))

        else:
            print("Usage:")
            print(
                "  python master_orchestrator.py              # Single check with formatted output")
            print(
                "  python master_orchestrator.py monitor [30] # Continuous monitoring")
            print(
                "  python master_orchestrator.py save [file]  # Save report to JSON file")
            print("  python master_orchestrator.py json         # Output JSON format")

    else:
        # Single check with formatted output
        asyncio.run(orchestrator.check_all_applications())
        orchestrator.print_status_report()


if __name__ == "__main__":
    main()
