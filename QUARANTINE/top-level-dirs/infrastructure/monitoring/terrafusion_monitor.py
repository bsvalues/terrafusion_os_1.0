#!/usr/bin/env python3
"""
TerraFusion Advanced Monitoring System
Real-time metrics collection and visualization
"""
import asyncio
import json
import time
import psutil
import requests
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from collections import deque
import statistics

class ServiceMonitor:
    def __init__(self, name: str, url: str, endpoints: List[str]):
        self.name = name
        self.url = url
        self.endpoints = endpoints
        self.metrics_history = deque(maxlen=100)  # Keep last 100 measurements
        self.error_log = deque(maxlen=50)
        self.uptime_start = datetime.now()
        self.total_requests = 0
        self.failed_requests = 0
        
    async def check_health(self) -> Dict[str, Any]:
        """Perform comprehensive health check"""
        start_time = time.time()
        health_status = {
            "service": self.name,
            "timestamp": datetime.now().isoformat(),
            "status": "unknown",
            "response_time_ms": 0,
            "endpoints_status": {},
            "error": None
        }
        
        try:
            # Check main health endpoint
            response = requests.get(f"{self.url}/health", timeout=5)
            response_time = (time.time() - start_time) * 1000
            
            health_status["response_time_ms"] = round(response_time, 2)
            health_status["status"] = "healthy" if response.status_code == 200 else "unhealthy"
            health_status["status_code"] = response.status_code
            
            # Check all endpoints
            for endpoint in self.endpoints:
                ep_start = time.time()
                try:
                    ep_response = requests.get(f"{self.url}{endpoint}", timeout=3)
                    ep_time = (time.time() - ep_start) * 1000
                    health_status["endpoints_status"][endpoint] = {
                        "status": ep_response.status_code,
                        "response_time_ms": round(ep_time, 2),
                        "success": ep_response.status_code == 200
                    }
                except Exception as e:
                    health_status["endpoints_status"][endpoint] = {
                        "status": 0,
                        "response_time_ms": 0,
                        "success": False,
                        "error": str(e)
                    }
            
            self.total_requests += 1
            
        except Exception as e:
            health_status["status"] = "down"
            health_status["error"] = str(e)
            self.failed_requests += 1
            self.error_log.append({
                "timestamp": datetime.now().isoformat(),
                "error": str(e)
            })
        
        # Store metrics
        self.metrics_history.append(health_status)
        return health_status
    
    def get_statistics(self) -> Dict[str, Any]:
        """Calculate service statistics"""
        if not self.metrics_history:
            return {}
        
        response_times = [m["response_time_ms"] for m in self.metrics_history if m["response_time_ms"] > 0]
        uptime_seconds = (datetime.now() - self.uptime_start).total_seconds()
        
        return {
            "avg_response_time_ms": round(statistics.mean(response_times), 2) if response_times else 0,
            "min_response_time_ms": round(min(response_times), 2) if response_times else 0,
            "max_response_time_ms": round(max(response_times), 2) if response_times else 0,
            "p95_response_time_ms": round(statistics.quantiles(response_times, n=20)[18], 2) if len(response_times) > 20 else 0,
            "uptime_seconds": round(uptime_seconds, 2),
            "uptime_percentage": round(((self.total_requests - self.failed_requests) / self.total_requests * 100), 2) if self.total_requests > 0 else 100,
            "total_requests": self.total_requests,
            "failed_requests": self.failed_requests,
            "error_rate": round((self.failed_requests / self.total_requests * 100), 2) if self.total_requests > 0 else 0
        }

class TerraFusionMonitor:
    def __init__(self):
        self.services = {
            "frontend": ServiceMonitor(
                "Frontend", 
                "http://localhost:3002",
                ["/"]
            ),
            "backend": ServiceMonitor(
                "Backend API",
                "http://localhost:8080",
                ["/health", "/api/v1/properties", "/api/v1/quantum/status"]
            ),
            "ai_engine": ServiceMonitor(
                "AI Engine",
                "http://localhost:8001",
                ["/health", "/api/v1/quantum/status", "/api/v1/ml/models"]
            ),
            "rag_service": ServiceMonitor(
                "RAG Service",
                "http://localhost:5003",
                ["/health", "/api/v1/stats"]
            )
        }
        
        self.system_metrics = deque(maxlen=100)
        self.alerts = deque(maxlen=100)
        self.monitoring_start = datetime.now()
        
    async def collect_system_metrics(self) -> Dict[str, Any]:
        """Collect system-level metrics"""
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        network = psutil.net_io_counters()
        
        system_metrics = {
            "timestamp": datetime.now().isoformat(),
            "cpu": {
                "percent": cpu_percent,
                "count": psutil.cpu_count(),
                "freq_mhz": psutil.cpu_freq().current if psutil.cpu_freq() else 0
            },
            "memory": {
                "total_gb": round(memory.total / (1024**3), 2),
                "used_gb": round(memory.used / (1024**3), 2),
                "percent": memory.percent
            },
            "disk": {
                "total_gb": round(disk.total / (1024**3), 2),
                "used_gb": round(disk.used / (1024**3), 2),
                "percent": disk.percent
            },
            "network": {
                "bytes_sent": network.bytes_sent,
                "bytes_recv": network.bytes_recv,
                "packets_sent": network.packets_sent,
                "packets_recv": network.packets_recv
            }
        }
        
        self.system_metrics.append(system_metrics)
        return system_metrics
    
    async def check_all_services(self) -> Dict[str, Any]:
        """Check health of all services"""
        results = {}
        tasks = []
        
        for service_id, monitor in self.services.items():
            task = monitor.check_health()
            tasks.append(task)
        
        health_results = await asyncio.gather(*tasks)
        
        for i, (service_id, monitor) in enumerate(self.services.items()):
            results[service_id] = health_results[i]
            
            # Check for alerts
            if health_results[i]["status"] == "down":
                self.alerts.append({
                    "timestamp": datetime.now().isoformat(),
                    "level": "critical",
                    "service": monitor.name,
                    "message": f"{monitor.name} is down",
                    "details": health_results[i].get("error")
                })
            elif health_results[i]["response_time_ms"] > 5000:
                self.alerts.append({
                    "timestamp": datetime.now().isoformat(),
                    "level": "warning",
                    "service": monitor.name,
                    "message": f"{monitor.name} slow response time",
                    "response_time_ms": health_results[i]["response_time_ms"]
                })
        
        return results
    
    def get_dashboard_data(self) -> Dict[str, Any]:
        """Get comprehensive dashboard data"""
        service_stats = {}
        for service_id, monitor in self.services.items():
            service_stats[service_id] = {
                "current_status": monitor.metrics_history[-1] if monitor.metrics_history else {},
                "statistics": monitor.get_statistics(),
                "recent_errors": list(monitor.error_log)[-5:]
            }
        
        # Calculate overall system health
        total_services = len(self.services)
        healthy_services = sum(1 for s in service_stats.values() 
                             if s["current_status"].get("status") == "healthy")
        
        overall_health = "healthy" if healthy_services == total_services else \
                        "degraded" if healthy_services > 0 else "critical"
        
        # Get recent system metrics
        recent_system_metrics = list(self.system_metrics)[-10:] if self.system_metrics else []
        
        return {
            "timestamp": datetime.now().isoformat(),
            "monitoring_duration_minutes": round((datetime.now() - self.monitoring_start).total_seconds() / 60, 2),
            "overall_health": overall_health,
            "healthy_services": healthy_services,
            "total_services": total_services,
            "services": service_stats,
            "system_metrics": recent_system_metrics[-1] if recent_system_metrics else {},
            "recent_alerts": list(self.alerts)[-10:],
            "alert_count": len(self.alerts)
        }
    
    async def monitor_loop(self, interval_seconds: int = 30):
        """Main monitoring loop"""
        print("TerraFusion Advanced Monitoring System Started")
        print("=" * 60)
        
        while True:
            try:
                # Collect all metrics
                await self.collect_system_metrics()
                await self.check_all_services()
                
                # Get dashboard data
                dashboard = self.get_dashboard_data()
                
                # Save to file
                with open("monitoring_data.json", "w") as f:
                    json.dump(dashboard, f, indent=2)
                
                # Print summary
                print(f"\n[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Monitoring Update")
                print(f"Overall Health: {dashboard['overall_health'].upper()}")
                print(f"Services: {dashboard['healthy_services']}/{dashboard['total_services']} healthy")
                
                if dashboard['system_metrics']:
                    sys_metrics = dashboard['system_metrics']
                    print(f"System: CPU {sys_metrics['cpu']['percent']}% | "
                          f"Memory {sys_metrics['memory']['percent']}% | "
                          f"Disk {sys_metrics['disk']['percent']}%")
                
                if dashboard['recent_alerts']:
                    print(f"\nRecent Alerts ({dashboard['alert_count']} total):")
                    for alert in dashboard['recent_alerts'][-3:]:
                        print(f"  [{alert['level'].upper()}] {alert['service']}: {alert['message']}")
                
                # Service summary
                print("\nService Status:")
                for service_id, data in dashboard['services'].items():
                    status = data['current_status'].get('status', 'unknown')
                    stats = data['statistics']
                    print(f"  {self.services[service_id].name}: {status} | "
                          f"Avg: {stats.get('avg_response_time_ms', 0)}ms | "
                          f"Uptime: {stats.get('uptime_percentage', 0)}%")
                
            except Exception as e:
                print(f"Monitoring error: {e}")
            
            await asyncio.sleep(interval_seconds)

async def main():
    monitor = TerraFusionMonitor()
    await monitor.monitor_loop(interval_seconds=10)

if __name__ == "__main__":
    asyncio.run(main())