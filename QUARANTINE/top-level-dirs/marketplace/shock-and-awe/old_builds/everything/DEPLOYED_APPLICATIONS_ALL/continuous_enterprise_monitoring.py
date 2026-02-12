#!/usr/bin/env python3
"""
TerraFusion Continuous Enterprise Monitoring Service
Automated health monitoring with alerts and reporting
"""

import time
import json
import requests
import logging
from datetime import datetime, timedelta

class ContinuousEnterpriseMonitor:
    def __init__(self):
        self.applications = {
            'TerraFusion_Build': 5000,
            'TerraFlow': 5001,
            'TerraFusionSync': 5002,
            'TerraAgent': 5003,
            'TerraFusionAssessor': 5004,
            'TerraFusionDashboard': 5005,
            'TerraMiner': 5006,
            'BSIncomeValuation': 5007,
            'TerraFusionPro': 5008,
            'BCBSGISPRO': 5010
        }
        
        self.monitoring_interval = 300  # 5 minutes
        self.alert_threshold = 70  # Performance threshold for alerts
        
    def monitor_application(self, app_name, port):
        """Monitor single application health"""
        try:
            response = requests.get(f"http://localhost:{port}/health", timeout=10)
            return {
                'timestamp': datetime.now().isoformat(),
                'application': app_name,
                'status': 'HEALTHY' if response.status_code == 200 else 'UNHEALTHY',
                'response_time': response.elapsed.total_seconds() * 1000,
                'status_code': response.status_code
            }
        except Exception as e:
            return {
                'timestamp': datetime.now().isoformat(),
                'application': app_name,
                'status': 'OFFLINE',
                'error': str(e)
            }
    
    def run_continuous_monitoring(self):
        """Run continuous monitoring loop"""
        print("🔄 Starting TerraFusion Continuous Enterprise Monitoring")
        print("⏰ Monitoring interval: 5 minutes")
        print("🎯 Performance threshold: 70%")
        print("=" * 60)
        
        while True:
            try:
                monitoring_results = []
                healthy_apps = 0
                
                for app_name, port in self.applications.items():
                    result = self.monitor_application(app_name, port)
                    monitoring_results.append(result)
                    
                    if result['status'] == 'HEALTHY':
                        healthy_apps += 1
                        print(f"✅ {app_name}: {result['response_time']:.0f}ms")
                    else:
                        print(f"❌ {app_name}: {result['status']}")
                
                # Calculate health percentage
                health_percentage = (healthy_apps / len(self.applications)) * 100
                
                print(f"📊 Platform Health: {health_percentage:.1f}% ({healthy_apps}/{len(self.applications)})")
                
                # Save monitoring results
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                with open(f'continuous_monitoring_{timestamp}.json', 'w') as f:
                    json.dump({
                        'timestamp': timestamp,
                        'health_percentage': health_percentage,
                        'results': monitoring_results
                    }, f, indent=2)
                
                # Alert if health drops below threshold
                if health_percentage < self.alert_threshold:
                    print(f"🚨 ALERT: Platform health below threshold ({health_percentage:.1f}%)")
                
                print(f"⏰ Next check in {self.monitoring_interval} seconds...")
                print("-" * 60)
                
                time.sleep(self.monitoring_interval)
                
            except KeyboardInterrupt:
                print("\n🛑 Monitoring stopped by user")
                break
            except Exception as e:
                print(f"❌ Monitoring error: {e}")
                time.sleep(60)  # Wait 1 minute before retry

if __name__ == "__main__":
    monitor = ContinuousEnterpriseMonitor()
    monitor.run_continuous_monitoring()
