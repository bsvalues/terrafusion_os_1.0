#!/usr/bin/env python3
"""
TerraFusion Monitoring Pipeline Test Suite
Phase 6: The Dynasty Continues - Monitoring Excellence Test
"""

import asyncio
import requests
import json
import time
from datetime import datetime
from typing import Dict, List, Any

class MonitoringPipelineTest:
    """Test suite for the complete monitoring pipeline"""
    
    def __init__(self):
        self.prometheus_url = "http://localhost:9090"
        self.grafana_url = "http://localhost:3000"
        self.alertmanager_url = "http://localhost:9093"
        self.test_results = []
        
    def log_test(self, test_name: str, status: str, details: str = ""):
        """Log test results"""
        result = {
            "test": test_name,
            "status": status,
            "timestamp": datetime.utcnow().isoformat(),
            "details": details
        }
        self.test_results.append(result)
        print(f"[{status.upper()}] {test_name}: {details}")
        
    def test_prometheus_health(self) -> bool:
        """Test Prometheus health and readiness"""
        try:
            # Test readiness
            response = requests.get(f"{self.prometheus_url}/-/ready", timeout=5)
            if response.status_code == 200:
                self.log_test("Prometheus Readiness", "PASS", "Prometheus is ready")
            else:
                self.log_test("Prometheus Readiness", "FAIL", f"Status: {response.status_code}")
                return False
                
            # Test API query
            response = requests.get(f"{self.prometheus_url}/api/v1/query?query=up", timeout=5)
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "success":
                    results = data.get("data", {}).get("result", [])
                    self.log_test("Prometheus API Query", "PASS", f"Retrieved {len(results)} metrics")
                else:
                    self.log_test("Prometheus API Query", "FAIL", "Invalid response format")
                    return False
            else:
                self.log_test("Prometheus API Query", "FAIL", f"Status: {response.status_code}")
                return False
                
            return True
        except Exception as e:
            self.log_test("Prometheus Health", "FAIL", str(e))
            return False
            
    def test_grafana_health(self) -> bool:
        """Test Grafana health and API"""
        try:
            # Test health endpoint
            response = requests.get(f"{self.grafana_url}/api/health", timeout=5)
            if response.status_code == 200:
                health_data = response.json()
                if health_data.get("database") == "ok":
                    self.log_test("Grafana Health", "PASS", f"Version: {health_data.get('version')}")
                else:
                    self.log_test("Grafana Health", "FAIL", "Database not healthy")
                    return False
            else:
                self.log_test("Grafana Health", "FAIL", f"Status: {response.status_code}")
                return False
                
            return True
        except Exception as e:
            self.log_test("Grafana Health", "FAIL", str(e))
            return False
            
    def test_alertmanager_health(self) -> bool:
        """Test Alertmanager health"""
        try:
            response = requests.get(f"{self.alertmanager_url}/-/ready", timeout=5)
            if response.status_code == 200:
                self.log_test("Alertmanager Health", "PASS", "Alertmanager is ready")
            else:
                self.log_test("Alertmanager Health", "FAIL", f"Status: {response.status_code}")
                return False
                
            # Test API
            response = requests.get(f"{self.alertmanager_url}/api/v1/status", timeout=5)
            if response.status_code == 200:
                self.log_test("Alertmanager API", "PASS", "API accessible")
            else:
                self.log_test("Alertmanager API", "FAIL", f"Status: {response.status_code}")
                return False
                
            return True
        except Exception as e:
            self.log_test("Alertmanager Health", "FAIL", str(e))
            return False
            
    def test_service_discovery(self) -> bool:
        """Test Prometheus service discovery"""
        try:
            response = requests.get(f"{self.prometheus_url}/api/v1/targets", timeout=5)
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "success":
                    targets = data.get("data", {}).get("activeTargets", [])
                    healthy_targets = [t for t in targets if t.get("health") == "up"]
                    self.log_test("Service Discovery", "PASS", 
                                f"Found {len(targets)} targets, {len(healthy_targets)} healthy")
                    
                    # Log details of discovered services
                    for target in targets:
                        job = target.get("labels", {}).get("job", "unknown")
                        health = target.get("health", "unknown")
                        instance = target.get("labels", {}).get("instance", "unknown")
                        self.log_test(f"Target: {job}", 
                                    "UP" if health == "up" else "DOWN", 
                                    f"Instance: {instance}")
                else:
                    self.log_test("Service Discovery", "FAIL", "Invalid response format")
                    return False
            else:
                self.log_test("Service Discovery", "FAIL", f"Status: {response.status_code}")
                return False
                
            return True
        except Exception as e:
            self.log_test("Service Discovery", "FAIL", str(e))
            return False
            
    def test_alert_rules(self) -> bool:
        """Test alert rules configuration"""
        try:
            response = requests.get(f"{self.prometheus_url}/api/v1/rules", timeout=5)
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "success":
                    groups = data.get("data", {}).get("groups", [])
                    total_rules = sum(len(group.get("rules", [])) for group in groups)
                    self.log_test("Alert Rules", "PASS", 
                                f"Loaded {len(groups)} rule groups with {total_rules} total rules")
                    
                    # Check for TerraFusion specific rule groups
                    terrafusion_groups = [g for g in groups if "terrafusion" in g.get("name", "").lower()]
                    if terrafusion_groups:
                        self.log_test("TerraFusion Rules", "PASS", 
                                    f"Found {len(terrafusion_groups)} TerraFusion rule groups")
                    else:
                        self.log_test("TerraFusion Rules", "WARN", "No TerraFusion specific rules found")
                else:
                    self.log_test("Alert Rules", "FAIL", "Invalid response format")
                    return False
            else:
                self.log_test("Alert Rules", "FAIL", f"Status: {response.status_code}")
                return False
                
            return True
        except Exception as e:
            self.log_test("Alert Rules", "FAIL", str(e))
            return False
            
    def test_metrics_collection(self) -> bool:
        """Test basic metrics collection"""
        try:
            # Test node exporter metrics
            response = requests.get(f"{self.prometheus_url}/api/v1/query?query=node_cpu_seconds_total", timeout=5)
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "success":
                    results = data.get("data", {}).get("result", [])
                    if results:
                        self.log_test("Node Metrics", "PASS", f"Collecting CPU metrics from {len(results)} cores")
                    else:
                        self.log_test("Node Metrics", "FAIL", "No CPU metrics found")
                        return False
                        
            # Test container metrics
            response = requests.get(f"{self.prometheus_url}/api/v1/query?query=container_memory_usage_bytes", timeout=5)
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "success":
                    results = data.get("data", {}).get("result", [])
                    if results:
                        self.log_test("Container Metrics", "PASS", f"Collecting memory metrics from {len(results)} containers")
                    else:
                        self.log_test("Container Metrics", "WARN", "No container metrics found")
                        
            return True
        except Exception as e:
            self.log_test("Metrics Collection", "FAIL", str(e))
            return False
            
    def test_dashboard_accessibility(self) -> bool:
        """Test Grafana dashboard accessibility"""
        try:
            # Test login page access (will redirect to login if not authenticated)
            response = requests.get(f"{self.grafana_url}/login", timeout=5)
            if response.status_code == 200:
                self.log_test("Grafana Login Page", "PASS", "Login page accessible")
            else:
                self.log_test("Grafana Login Page", "FAIL", f"Status: {response.status_code}")
                return False
                
            # Test API access (should get 401 without auth)
            response = requests.get(f"{self.grafana_url}/api/dashboards/home", timeout=5)
            if response.status_code in [200, 401]:
                self.log_test("Grafana API", "PASS", "API endpoint accessible")
            else:
                self.log_test("Grafana API", "FAIL", f"Status: {response.status_code}")
                return False
                
            return True
        except Exception as e:
            self.log_test("Dashboard Accessibility", "FAIL", str(e))
            return False
            
    async def run_application_monitoring_test(self) -> bool:
        """Test application monitoring agent integration"""
        try:
            import subprocess
            import os
            
            # Change to the correct directory
            os.chdir("/mnt/e/TerraFusion_Master_Workspace")
            
            # Run the application monitoring agent
            result = subprocess.run([
                "python3", "monitoring/application/agents/application_monitoring_agent.py"
            ], capture_output=True, text=True, timeout=30)
            
            if result.returncode == 0:
                self.log_test("Application Monitoring Agent", "PASS", "Agent executed successfully")
                
                # Check if report was generated
                if "Application Monitoring Report" in result.stdout:
                    self.log_test("Monitoring Report Generation", "PASS", "Report generated successfully")
                else:
                    self.log_test("Monitoring Report Generation", "WARN", "Report format may be different")
                    
            else:
                self.log_test("Application Monitoring Agent", "FAIL", f"Exit code: {result.returncode}")
                return False
                
            return True
        except Exception as e:
            self.log_test("Application Monitoring Test", "FAIL", str(e))
            return False
            
    def run_comprehensive_test(self) -> Dict[str, Any]:
        """Run comprehensive monitoring pipeline test"""
        print("🚀 Starting TerraFusion Monitoring Pipeline Test Suite")
        print("=" * 70)
        
        start_time = time.time()
        
        # Run all tests
        tests = [
            ("Prometheus Health", self.test_prometheus_health),
            ("Grafana Health", self.test_grafana_health),
            ("Alertmanager Health", self.test_alertmanager_health),
            ("Service Discovery", self.test_service_discovery),
            ("Alert Rules", self.test_alert_rules),
            ("Metrics Collection", self.test_metrics_collection),
            ("Dashboard Accessibility", self.test_dashboard_accessibility),
        ]
        
        results = {}
        for test_name, test_func in tests:
            print(f"\n🔍 Running {test_name}...")
            results[test_name] = test_func()
            
        # Run async test
        print(f"\n🔍 Running Application Monitoring Agent Test...")
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        results["Application Monitoring"] = loop.run_until_complete(self.run_application_monitoring_test())
        loop.close()
        
        end_time = time.time()
        
        # Generate summary
        total_tests = len(results)
        passed_tests = sum(1 for r in results.values() if r)
        failed_tests = total_tests - passed_tests
        
        print("\n" + "=" * 70)
        print("📊 TEST SUMMARY")
        print("=" * 70)
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        print(f"Execution Time: {end_time - start_time:.2f} seconds")
        
        # Access information
        print("\n🌐 ACCESS INFORMATION")
        print("=" * 70)
        print(f"Prometheus: {self.prometheus_url}")
        print(f"Grafana: {self.grafana_url} (admin/admin)")
        print(f"Alertmanager: {self.alertmanager_url}")
        print("Node Exporter: http://localhost:9100")
        print("cAdvisor: http://localhost:8080")
        
        if failed_tests == 0:
            print("\n🎉 ALL TESTS PASSED! Monitoring pipeline is operational.")
            print("The Belichick Standard: Championship-level monitoring deployed!")
        else:
            print(f"\n⚠️  {failed_tests} test(s) failed. Check logs above for details.")
            
        return {
            "summary": {
                "total_tests": total_tests,
                "passed": passed_tests,
                "failed": failed_tests,
                "success_rate": (passed_tests/total_tests)*100,
                "execution_time": end_time - start_time
            },
            "results": results,
            "test_details": self.test_results,
            "access_urls": {
                "prometheus": self.prometheus_url,
                "grafana": self.grafana_url,
                "alertmanager": self.alertmanager_url,
                "node_exporter": "http://localhost:9100",
                "cadvisor": "http://localhost:8080"
            }
        }

def main():
    """Main entry point"""
    tester = MonitoringPipelineTest()
    results = tester.run_comprehensive_test()
    
    # Save results to file
    with open("/mnt/e/TerraFusion_Master_Workspace/monitoring/test_results.json", "w") as f:
        json.dump(results, f, indent=2)
        
    print(f"\n📄 Full test results saved to: monitoring/test_results.json")

if __name__ == "__main__":
    main()