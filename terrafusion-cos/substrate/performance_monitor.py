"""
TerraFusion cOS Performance Monitor
Performance analytics and monitoring for vendor substrate
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
from enum import Enum
import statistics
import time

class MetricType(Enum):
    """Types of performance metrics"""
    API_RESPONSE_TIME = "api_response_time"
    API_CALL_COUNT = "api_call_count"
    MODULE_PERFORMANCE = "module_performance"
    RESOURCE_USAGE = "resource_usage"
    ERROR_RATE = "error_rate"
    THROUGHPUT = "throughput"

@dataclass
class PerformanceMetric:
    """Individual performance metric"""
    metric_id: str
    metric_type: MetricType
    vendor_id: Optional[str]
    value: float
    unit: str
    timestamp: datetime
    metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass
class APICallMetric:
    """API call performance metric"""
    call_id: str
    vendor_id: str
    endpoint: str
    method: str
    status_code: int
    response_time: float
    timestamp: datetime
    payload_size: Optional[int] = None
    error_message: Optional[str] = None

class MetricsCollector:
    """Collects and stores performance metrics"""
    
    def __init__(self):
        self.metrics: List[PerformanceMetric] = []
        self.api_calls: List[APICallMetric] = []
        self.max_metrics = 100000  # Keep last 100k metrics
        
    async def record_metric(self, metric: PerformanceMetric):
        """Record a performance metric"""
        self.metrics.append(metric)
        
        # Cleanup old metrics
        if len(self.metrics) > self.max_metrics:
            self.metrics = self.metrics[-self.max_metrics:]
            
        logging.debug(f"Recorded metric: {metric.metric_type.value} = {metric.value} {metric.unit}")
        
    async def record_api_call(self, endpoint: str, method: str, status_code: int, 
                            response_time: float, vendor_id: str = "system"):
        """Record API call performance"""
        call_metric = APICallMetric(
            call_id=f"api_{int(time.time() * 1000)}",
            vendor_id=vendor_id,
            endpoint=endpoint,
            method=method,
            status_code=status_code,
            response_time=response_time,
            timestamp=datetime.now()
        )
        
        self.api_calls.append(call_metric)
        
        # Also record as general metric
        metric = PerformanceMetric(
            metric_id=f"api_response_{call_metric.call_id}",
            metric_type=MetricType.API_RESPONSE_TIME,
            vendor_id=vendor_id,
            value=response_time,
            unit="seconds",
            timestamp=datetime.now(),
            metadata={
                "endpoint": endpoint,
                "method": method,
                "status_code": status_code
            }
        )
        
        await self.record_metric(metric)
        
        # Cleanup old API calls
        if len(self.api_calls) > 50000:
            self.api_calls = self.api_calls[-50000:]
            
    def get_metrics_by_type(self, metric_type: MetricType, 
                          hours: int = 24, vendor_id: Optional[str] = None) -> List[PerformanceMetric]:
        """Get metrics filtered by type and time range"""
        cutoff_time = datetime.now() - timedelta(hours=hours)
        
        filtered_metrics = [
            metric for metric in self.metrics
            if (metric.metric_type == metric_type and 
                metric.timestamp > cutoff_time and
                (vendor_id is None or metric.vendor_id == vendor_id))
        ]
        
        return sorted(filtered_metrics, key=lambda x: x.timestamp)
        
    def get_api_calls_by_vendor(self, vendor_id: str, hours: int = 24) -> List[APICallMetric]:
        """Get API calls for specific vendor"""
        cutoff_time = datetime.now() - timedelta(hours=hours)
        
        return [
            call for call in self.api_calls
            if call.vendor_id == vendor_id and call.timestamp > cutoff_time
        ]

class PerformanceAnalyzer:
    """Analyzes performance metrics and generates insights"""
    
    def __init__(self, metrics_collector: MetricsCollector):
        self.collector = metrics_collector
        
    async def analyze_api_performance(self, vendor_id: str, hours: int = 24) -> Dict[str, Any]:
        """Analyze API performance for vendor"""
        api_calls = self.collector.get_api_calls_by_vendor(vendor_id, hours)
        
        if not api_calls:
            return {
                "vendor_id": vendor_id,
                "period_hours": hours,
                "total_calls": 0,
                "analysis": "No API calls found for this period"
            }
            
        # Calculate statistics
        response_times = [call.response_time for call in api_calls]
        status_codes = [call.status_code for call in api_calls]
        
        # Group by endpoint
        endpoint_stats = {}
        for call in api_calls:
            if call.endpoint not in endpoint_stats:
                endpoint_stats[call.endpoint] = {
                    "calls": 0,
                    "avg_response_time": 0,
                    "response_times": []
                }
            endpoint_stats[call.endpoint]["calls"] += 1
            endpoint_stats[call.endpoint]["response_times"].append(call.response_time)
            
        # Calculate endpoint averages
        for endpoint, stats in endpoint_stats.items():
            stats["avg_response_time"] = statistics.mean(stats["response_times"])
            stats["min_response_time"] = min(stats["response_times"])
            stats["max_response_time"] = max(stats["response_times"])
            del stats["response_times"]  # Remove raw data
            
        return {
            "vendor_id": vendor_id,
            "period_hours": hours,
            "total_calls": len(api_calls),
            "avg_response_time": statistics.mean(response_times),
            "min_response_time": min(response_times),
            "max_response_time": max(response_times),
            "p95_response_time": self._calculate_percentile(response_times, 95),
            "error_rate": len([s for s in status_codes if s >= 400]) / len(status_codes) * 100,
            "success_rate": len([s for s in status_codes if s < 400]) / len(status_codes) * 100,
            "calls_per_hour": len(api_calls) / hours,
            "endpoint_breakdown": endpoint_stats
        }
        
    def _calculate_percentile(self, values: List[float], percentile: int) -> float:
        """Calculate percentile value"""
        if not values:
            return 0.0
        sorted_values = sorted(values)
        index = int((percentile / 100) * len(sorted_values))
        if index >= len(sorted_values):
            index = len(sorted_values) - 1
        return sorted_values[index]
        
    async def analyze_resource_usage(self, vendor_id: str, hours: int = 24) -> Dict[str, Any]:
        """Analyze resource usage patterns"""
        resource_metrics = self.collector.get_metrics_by_type(
            MetricType.RESOURCE_USAGE, hours, vendor_id
        )
        
        if not resource_metrics:
            return {
                "vendor_id": vendor_id,
                "period_hours": hours,
                "cpu_usage": {"avg": 0, "max": 0},
                "memory_usage": {"avg": 0, "max": 0},
                "storage_usage": {"avg": 0, "max": 0}
            }
            
        # Separate metrics by resource type
        cpu_metrics = [m for m in resource_metrics if m.metadata.get("resource") == "cpu"]
        memory_metrics = [m for m in resource_metrics if m.metadata.get("resource") == "memory"]
        storage_metrics = [m for m in resource_metrics if m.metadata.get("resource") == "storage"]
        
        def calculate_stats(metrics):
            if not metrics:
                return {"avg": 0, "max": 0, "min": 0}
            values = [m.value for m in metrics]
            return {
                "avg": statistics.mean(values),
                "max": max(values),
                "min": min(values)
            }
            
        return {
            "vendor_id": vendor_id,
            "period_hours": hours,
            "cpu_usage": calculate_stats(cpu_metrics),
            "memory_usage": calculate_stats(memory_metrics),
            "storage_usage": calculate_stats(storage_metrics),
            "total_data_points": len(resource_metrics)
        }
        
    async def detect_performance_issues(self, vendor_id: str) -> List[Dict[str, Any]]:
        """Detect performance issues and anomalies"""
        issues = []
        
        # Analyze recent API performance
        api_analysis = await self.analyze_api_performance(vendor_id, 1)  # Last hour
        
        # Check for high response times
        if api_analysis.get("avg_response_time", 0) > 2.0:  # > 2 seconds
            issues.append({
                "type": "high_response_time",
                "severity": "high",
                "description": f"Average API response time is {api_analysis['avg_response_time']:.2f}s",
                "recommendation": "Optimize API endpoints or scale resources"
            })
            
        # Check for high error rates
        if api_analysis.get("error_rate", 0) > 5.0:  # > 5%
            issues.append({
                "type": "high_error_rate",
                "severity": "critical",
                "description": f"API error rate is {api_analysis['error_rate']:.1f}%",
                "recommendation": "Investigate API errors and fix underlying issues"
            })
            
        # Check resource usage
        resource_analysis = await self.analyze_resource_usage(vendor_id, 1)
        
        if resource_analysis.get("cpu_usage", {}).get("avg", 0) > 80:  # > 80%
            issues.append({
                "type": "high_cpu_usage",
                "severity": "medium",
                "description": f"CPU usage is {resource_analysis['cpu_usage']['avg']:.1f}%",
                "recommendation": "Consider scaling up compute resources"
            })
            
        return issues

class PerformanceMonitor:
    """Main performance monitoring service"""
    
    def __init__(self):
        self.collector = MetricsCollector()
        self.analyzer = PerformanceAnalyzer(self.collector)
        self.is_monitoring = False
        self.alert_thresholds = {
            "response_time": 3.0,  # seconds
            "error_rate": 10.0,    # percentage
            "cpu_usage": 85.0      # percentage
        }
        
    async def start_monitoring(self):
        """Start performance monitoring service"""
        logging.info("Starting TerraFusion Performance Monitor...")
        self.is_monitoring = True
        
        # Start background monitoring tasks
        asyncio.create_task(self._collect_system_metrics())
        asyncio.create_task(self._monitor_performance_alerts())
        
    async def _collect_system_metrics(self):
        """Background task to collect system metrics"""
        while self.is_monitoring:
            try:
                # Simulate system metric collection
                await self._collect_cpu_metrics()
                await self._collect_memory_metrics()
                await self._collect_storage_metrics()
                
                await asyncio.sleep(30)  # Collect every 30 seconds
                
            except Exception as e:
                logging.error(f"System metrics collection error: {str(e)}")
                await asyncio.sleep(60)  # Retry after 1 minute
                
    async def _collect_cpu_metrics(self):
        """Collect CPU usage metrics"""
        # Simulate CPU usage data
        import random
        cpu_usage = random.uniform(20, 90)
        
        metric = PerformanceMetric(
            metric_id=f"cpu_{int(time.time())}",
            metric_type=MetricType.RESOURCE_USAGE,
            vendor_id="system",
            value=cpu_usage,
            unit="percent",
            timestamp=datetime.now(),
            metadata={"resource": "cpu"}
        )
        
        await self.collector.record_metric(metric)
        
    async def _collect_memory_metrics(self):
        """Collect memory usage metrics"""
        # Simulate memory usage data
        import random
        memory_usage = random.uniform(30, 85)
        
        metric = PerformanceMetric(
            metric_id=f"memory_{int(time.time())}",
            metric_type=MetricType.RESOURCE_USAGE,
            vendor_id="system",
            value=memory_usage,
            unit="percent",
            timestamp=datetime.now(),
            metadata={"resource": "memory"}
        )
        
        await self.collector.record_metric(metric)
        
    async def _collect_storage_metrics(self):
        """Collect storage usage metrics"""
        # Simulate storage usage data
        import random
        storage_usage = random.uniform(40, 75)
        
        metric = PerformanceMetric(
            metric_id=f"storage_{int(time.time())}",
            metric_type=MetricType.RESOURCE_USAGE,
            vendor_id="system",
            value=storage_usage,
            unit="percent",  
            timestamp=datetime.now(),
            metadata={"resource": "storage"}
        )
        
        await self.collector.record_metric(metric)
        
    async def _monitor_performance_alerts(self):
        """Background task to monitor for performance alerts"""
        while self.is_monitoring:
            try:
                # Check all vendors for performance issues
                # This would iterate through registered vendors
                # For now, simulate with system vendor
                issues = await self.analyzer.detect_performance_issues("system")
                
                for issue in issues:
                    logging.warning(f"Performance Alert: {issue['type']} - {issue['description']}")
                    
                await asyncio.sleep(300)  # Check every 5 minutes
                
            except Exception as e:
                logging.error(f"Performance alert monitoring error: {str(e)}")
                await asyncio.sleep(300)
                
    async def record_api_call(self, endpoint: str, method: str, status_code: int, 
                            response_time: float, vendor_id: str = "system"):
        """Record API call performance metric"""
        await self.collector.record_api_call(endpoint, method, status_code, response_time, vendor_id)
        
    async def get_vendor_analytics(self, vendor_id: str, days: int = 7) -> Dict[str, Any]:
        """Get comprehensive performance analytics for vendor"""
        hours = days * 24
        
        api_analysis = await self.analyzer.analyze_api_performance(vendor_id, hours)
        resource_analysis = await self.analyzer.analyze_resource_usage(vendor_id, hours)
        performance_issues = await self.analyzer.detect_performance_issues(vendor_id)
        
        return {
            "vendor_id": vendor_id,
            "analysis_period": f"{days} days",
            "api_performance": api_analysis,
            "resource_usage": resource_analysis,
            "performance_issues": performance_issues,
            "recommendations": self._generate_recommendations(api_analysis, resource_analysis, performance_issues),
            "last_updated": datetime.now().isoformat()
        }
        
    def _generate_recommendations(self, api_analysis: Dict, resource_analysis: Dict, 
                                issues: List[Dict]) -> List[str]:
        """Generate performance improvement recommendations"""
        recommendations = []
        
        if api_analysis.get("avg_response_time", 0) > 1.0:
            recommendations.append("Consider optimizing slow API endpoints")
            
        if api_analysis.get("error_rate", 0) > 2.0:
            recommendations.append("Investigate and fix API errors")
            
        if resource_analysis.get("cpu_usage", {}).get("avg", 0) > 70:
            recommendations.append("Monitor CPU usage and consider scaling")
            
        if len(issues) > 0:
            recommendations.append("Address critical performance issues immediately")
            
        if not recommendations:
            recommendations.append("Performance is within acceptable ranges")
            
        return recommendations
        
    def get_daily_api_calls(self) -> int:
        """Get total API calls for today"""
        today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        today_calls = [
            call for call in self.collector.api_calls
            if call.timestamp >= today_start
        ]
        return len(today_calls)
        
    def get_performance_dashboard_data(self) -> Dict[str, Any]:
        """Get performance dashboard data for management interface"""
        return {
            "service_name": "Performance Monitor",
            "monitoring_active": self.is_monitoring,
            "total_metrics_collected": len(self.collector.metrics),
            "api_calls_today": self.get_daily_api_calls(),
            "avg_response_time_24h": self._get_avg_response_time_24h(),
            "system_health": {
                "cpu_usage": self._get_latest_cpu_usage(),
                "memory_usage": self._get_latest_memory_usage(),
                "storage_usage": self._get_latest_storage_usage()
            },
            "alert_thresholds": self.alert_thresholds
        }
        
    def _get_avg_response_time_24h(self) -> float:
        """Get average response time for last 24 hours"""
        api_metrics = self.collector.get_metrics_by_type(MetricType.API_RESPONSE_TIME, 24)
        if not api_metrics:
            return 0.0
        return statistics.mean([m.value for m in api_metrics])
        
    def _get_latest_cpu_usage(self) -> float:
        """Get latest CPU usage metric"""
        cpu_metrics = self.collector.get_metrics_by_type(MetricType.RESOURCE_USAGE, 1)
        cpu_metrics = [m for m in cpu_metrics if m.metadata.get("resource") == "cpu"]
        return cpu_metrics[-1].value if cpu_metrics else 0.0
        
    def _get_latest_memory_usage(self) -> float:
        """Get latest memory usage metric"""
        memory_metrics = self.collector.get_metrics_by_type(MetricType.RESOURCE_USAGE, 1)
        memory_metrics = [m for m in memory_metrics if m.metadata.get("resource") == "memory"]
        return memory_metrics[-1].value if memory_metrics else 0.0
        
    def _get_latest_storage_usage(self) -> float:
        """Get latest storage usage metric"""
        storage_metrics = self.collector.get_metrics_by_type(MetricType.RESOURCE_USAGE, 1)
        storage_metrics = [m for m in storage_metrics if m.metadata.get("resource") == "storage"]
        return storage_metrics[-1].value if storage_metrics else 0.0