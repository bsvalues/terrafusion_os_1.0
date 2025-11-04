import requests
import time
import json
import logging
from datetime import datetime
import psutil
import sqlite3
import os

class TerraFusionHealthMonitor:
    def __init__(self):
        self.services = {
            'TerraFlow': 'http://localhost:5001/',
            'TerraAgent': 'http://localhost:5004/',
            'TerraMiner': 'http://localhost:5006/',
            'TerraFusionDashboard': 'http://localhost:5005/',
            'TerraFusionPro': 'http://localhost:5008/',
            'Enterprise_Launcher': 'http://localhost:3001/',
            'Additional_Platform': 'http://localhost:8001/'
        }
        self.setup_logging()
        self.setup_database()
    
    def setup_logging(self):
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('health_monitor.log'),
                logging.StreamHandler()
            ]
        )
    
    def setup_database(self):
        conn = sqlite3.connect('health_metrics.db')
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS health_checks (
                timestamp TEXT,
                service TEXT,
                status TEXT,
                response_time REAL,
                cpu_usage REAL,
                memory_usage REAL,
                details TEXT
            )
        ''')
        conn.commit()
        conn.close()
    
    def check_service_health(self, service_name, url):
        try:
            start_time = time.time()
            response = requests.get(url, timeout=10)
            response_time = time.time() - start_time
            
            status = 'HEALTHY' if response.status_code == 200 else 'UNHEALTHY'
            
            cpu_usage = psutil.cpu_percent()
            memory_usage = psutil.virtual_memory().percent
            
            self.log_health_check(service_name, status, response_time, cpu_usage, memory_usage, str(response.status_code))
            
            return {
                'service': service_name,
                'status': status,
                'response_time': response_time,
                'cpu_usage': cpu_usage,
                'memory_usage': memory_usage,
                'status_code': response.status_code
            }
        except Exception as e:
            self.log_health_check(service_name, 'ERROR', 0, 0, 0, str(e))
            return {
                'service': service_name,
                'status': 'ERROR',
                'error': str(e)
            }
    
    def log_health_check(self, service, status, response_time, cpu, memory, details):
        conn = sqlite3.connect('health_metrics.db')
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO health_checks (timestamp, service, status, response_time, cpu_usage, memory_usage, details)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (datetime.now().isoformat(), service, status, response_time, cpu, memory, details))
        conn.commit()
        conn.close()
    
    def monitor_all_services(self):
        results = []
        for service_name, url in self.services.items():
            result = self.check_service_health(service_name, url)
            results.append(result)
            logging.info(f"{service_name}: {result['status']}")
        return results
    
    def generate_health_report(self):
        results = self.monitor_all_services()
        
        healthy_count = sum(1 for r in results if r['status'] == 'HEALTHY')
        total_count = len(results)
        health_percentage = (healthy_count / total_count) * 100
        
        report = {
            'timestamp': datetime.now().isoformat(),
            'overall_health': f"{health_percentage:.1f}%",
            'healthy_services': healthy_count,
            'total_services': total_count,
            'services': results
        }
        
        with open(f'health_report_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json', 'w') as f:
            json.dump(report, f, indent=2)
        
        return report

if __name__ == "__main__":
    monitor = TerraFusionHealthMonitor()
    
    print("🚨 TerraFusion Health Monitor - ALL HANDS ON DECK")
    print("🎯 Monitoring Benton County Production Services")
    
    while True:
        report = monitor.generate_health_report()
        print(f"🏥 System Health: {report['overall_health']} ({report['healthy_services']}/{report['total_services']} services)")
        
        for service in report['services']:
            status_icon = "✅" if service['status'] == 'HEALTHY' else "❌"
            if 'response_time' in service:
                print(f"  {status_icon} {service['service']}: {service['status']} ({service['response_time']:.3f}s)")
            else:
                print(f"  {status_icon} {service['service']}: {service['status']}")
        
        print("=" * 60)
        time.sleep(60) 