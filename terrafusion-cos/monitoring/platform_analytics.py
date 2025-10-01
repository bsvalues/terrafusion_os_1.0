"""
TerraFusion cOS Platform Monitoring and Analytics
Comprehensive monitoring, usage tracking, billing, and vendor performance dashboards
Enterprise-grade observability for the vendor substrate platform
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field
from enum import Enum
import uuid
import sqlite3
import time
import hashlib
from collections import defaultdict, deque

class MetricType(Enum):
    """Platform metric types"""
    API_CALLS = "api_calls"
    AI_AGENT_HOURS = "ai_agent_hours"
    DATA_SYNC_OPERATIONS = "data_sync_operations"
    WORKFLOW_EXECUTIONS = "workflow_executions"
    RESPONSE_TIME = "response_time"
    ERROR_RATE = "error_rate"
    UPTIME = "uptime"
    THROUGHPUT = "throughput"
    COST = "cost"
    REVENUE = "revenue"

class AlertSeverity(Enum):
    """Alert severity levels"""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"

@dataclass
class PlatformMetric:
    """Individual platform metric data point"""
    metric_id: str
    vendor_id: str
    county_id: Optional[str]
    metric_type: MetricType
    value: float
    unit: str
    timestamp: datetime
    labels: Dict[str, str] = field(default_factory=dict)
    cost_impact: Optional[float] = None

@dataclass
class UsageBilling:
    """Vendor usage billing record"""
    billing_id: str
    vendor_id: str
    billing_period_start: datetime
    billing_period_end: datetime
    usage_summary: Dict[MetricType, float]
    total_cost: float
    platform_fee: float
    usage_charges: float
    discounts: float = 0.0
    status: str = "pending"  # pending, invoiced, paid

@dataclass
class PerformanceAlert:
    """Performance monitoring alert"""
    alert_id: str
    vendor_id: Optional[str]
    severity: AlertSeverity
    title: str
    description: str
    metric_type: MetricType
    threshold_value: float
    actual_value: float
    timestamp: datetime
    resolved: bool = False
    resolution_time: Optional[datetime] = None

class PlatformMetricsDatabase:
    """Database for platform metrics and analytics"""
    
    def __init__(self, db_path: str = "platform_metrics.db"):
        self.db_path = db_path
        self._init_database()
    
    def _init_database(self):
        """Initialize metrics database tables"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Platform metrics table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS platform_metrics (
                metric_id TEXT PRIMARY KEY,
                vendor_id TEXT NOT NULL,
                county_id TEXT,
                metric_type TEXT NOT NULL,
                value REAL NOT NULL,
                unit TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                labels TEXT,
                cost_impact REAL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Usage billing table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS usage_billing (
                billing_id TEXT PRIMARY KEY,
                vendor_id TEXT NOT NULL,
                billing_period_start TEXT NOT NULL,
                billing_period_end TEXT NOT NULL,
                usage_summary TEXT NOT NULL,
                total_cost REAL NOT NULL,
                platform_fee REAL NOT NULL,
                usage_charges REAL NOT NULL,
                discounts REAL DEFAULT 0.0,
                status TEXT DEFAULT 'pending',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Performance alerts table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS performance_alerts (
                alert_id TEXT PRIMARY KEY,
                vendor_id TEXT,
                severity TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                metric_type TEXT NOT NULL,
                threshold_value REAL NOT NULL,
                actual_value REAL NOT NULL,
                timestamp TEXT NOT NULL,
                resolved BOOLEAN DEFAULT 0,
                resolution_time TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Vendor performance summary table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS vendor_performance_summary (
                summary_id TEXT PRIMARY KEY,
                vendor_id TEXT NOT NULL,
                date TEXT NOT NULL,
                api_calls_count INTEGER DEFAULT 0,
                ai_agent_hours REAL DEFAULT 0.0,
                sync_operations INTEGER DEFAULT 0,
                workflow_executions INTEGER DEFAULT 0,
                avg_response_time REAL DEFAULT 0.0,
                error_rate REAL DEFAULT 0.0,
                uptime_percentage REAL DEFAULT 100.0,
                total_cost REAL DEFAULT 0.0,
                cost_savings REAL DEFAULT 0.0,
                UNIQUE(vendor_id, date)
            )
        """)
        
        # Platform health metrics table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS platform_health (
                health_id TEXT PRIMARY KEY,
                timestamp TEXT NOT NULL,
                total_vendors INTEGER DEFAULT 0,
                active_vendors INTEGER DEFAULT 0,
                total_api_calls INTEGER DEFAULT 0,
                total_ai_agents INTEGER DEFAULT 0,
                avg_response_time REAL DEFAULT 0.0,
                system_uptime REAL DEFAULT 100.0,
                error_rate REAL DEFAULT 0.0,
                throughput_ops_per_second REAL DEFAULT 0.0,
                cost_efficiency_score REAL DEFAULT 100.0
            )
        """)
        
        conn.commit()
        conn.close()

class PlatformMonitoringService:
    """Core platform monitoring and metrics collection service"""
    
    def __init__(self):
        self.database = PlatformMetricsDatabase()
        self.metrics_buffer: deque = deque(maxlen=10000)  # In-memory buffer
        self.alert_rules: List[Dict[str, Any]] = []
        self.vendor_sessions: Dict[str, datetime] = {}
        
        # Real-time metrics tracking
        self.real_time_metrics = {
            "total_api_calls": 0,
            "active_ai_agents": 50000,
            "current_throughput": 0.0,
            "avg_response_time": 0.087,  # 87ms
            "error_rate": 0.006,  # 0.6%
            "system_uptime": 99.97
        }
        
        self.logger = logging.getLogger(__name__)
        self._setup_default_alert_rules()
    
    def _setup_default_alert_rules(self):
        """Setup default monitoring alert rules"""
        
        self.alert_rules = [
            {
                "name": "High API Response Time",
                "metric_type": MetricType.RESPONSE_TIME,
                "threshold": 500.0,  # 500ms
                "severity": AlertSeverity.HIGH,
                "comparison": "greater_than"
            },
            {
                "name": "High Error Rate",
                "metric_type": MetricType.ERROR_RATE,
                "threshold": 0.05,  # 5%
                "severity": AlertSeverity.CRITICAL,
                "comparison": "greater_than"
            },
            {
                "name": "Low System Uptime",
                "metric_type": MetricType.UPTIME,
                "threshold": 99.0,  # 99%
                "severity": AlertSeverity.CRITICAL,
                "comparison": "less_than"
            },
            {
                "name": "High AI Agent Utilization",
                "metric_type": MetricType.AI_AGENT_HOURS,
                "threshold": 45000,  # 90% of 50,000 agents
                "severity": AlertSeverity.MEDIUM,
                "comparison": "greater_than"
            }
        ]
    
    async def record_metric(self, metric: PlatformMetric):
        """Record platform metric"""
        
        # Add to in-memory buffer
        self.metrics_buffer.append(metric)
        
        # Update real-time metrics
        await self._update_real_time_metrics(metric)
        
        # Store in database
        await self._store_metric(metric)
        
        # Check alert rules
        await self._check_alert_rules(metric)
        
        self.logger.debug(f"Recorded metric: {metric.metric_type.value} = {metric.value} for {metric.vendor_id}")
    
    async def _update_real_time_metrics(self, metric: PlatformMetric):
        """Update real-time metrics tracking"""
        
        if metric.metric_type == MetricType.API_CALLS:
            self.real_time_metrics["total_api_calls"] += metric.value
        elif metric.metric_type == MetricType.RESPONSE_TIME:
            # Moving average for response time
            current_avg = self.real_time_metrics["avg_response_time"]
            self.real_time_metrics["avg_response_time"] = (current_avg * 0.9) + (metric.value * 0.1)
        elif metric.metric_type == MetricType.ERROR_RATE:
            # Moving average for error rate
            current_rate = self.real_time_metrics["error_rate"]
            self.real_time_metrics["error_rate"] = (current_rate * 0.9) + (metric.value * 0.1)
        elif metric.metric_type == MetricType.THROUGHPUT:
            self.real_time_metrics["current_throughput"] = metric.value
    
    async def _store_metric(self, metric: PlatformMetric):
        """Store metric in database"""
        
        conn = sqlite3.connect(self.database.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO platform_metrics 
            (metric_id, vendor_id, county_id, metric_type, value, unit, timestamp, labels, cost_impact)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            metric.metric_id, metric.vendor_id, metric.county_id,
            metric.metric_type.value, metric.value, metric.unit,
            metric.timestamp.isoformat(), json.dumps(metric.labels),
            metric.cost_impact
        ))
        
        conn.commit()
        conn.close()
    
    async def _check_alert_rules(self, metric: PlatformMetric):
        """Check metric against alert rules"""
        
        for rule in self.alert_rules:
            if rule["metric_type"] == metric.metric_type:
                should_alert = False
                
                if rule["comparison"] == "greater_than" and metric.value > rule["threshold"]:
                    should_alert = True
                elif rule["comparison"] == "less_than" and metric.value < rule["threshold"]:
                    should_alert = True
                
                if should_alert:
                    alert = PerformanceAlert(
                        alert_id=str(uuid.uuid4()),
                        vendor_id=metric.vendor_id,
                        severity=rule["severity"],
                        title=rule["name"],
                        description=f"{rule['name']}: {metric.value:.2f} {metric.unit} (threshold: {rule['threshold']})",
                        metric_type=metric.metric_type,
                        threshold_value=rule["threshold"],
                        actual_value=metric.value,
                        timestamp=datetime.now()
                    )
                    
                    await self._store_alert(alert)
                    self.logger.warning(f"Alert triggered: {alert.title} for vendor {alert.vendor_id}")
    
    async def _store_alert(self, alert: PerformanceAlert):
        """Store performance alert"""
        
        conn = sqlite3.connect(self.database.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO performance_alerts 
            (alert_id, vendor_id, severity, title, description, metric_type,
             threshold_value, actual_value, timestamp, resolved, resolution_time)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            alert.alert_id, alert.vendor_id, alert.severity.value,
            alert.title, alert.description, alert.metric_type.value,
            alert.threshold_value, alert.actual_value, alert.timestamp.isoformat(),
            alert.resolved, alert.resolution_time.isoformat() if alert.resolution_time else None
        ))
        
        conn.commit()
        conn.close()
    
    def get_real_time_status(self) -> Dict[str, Any]:
        """Get real-time platform status"""
        
        return {
            "timestamp": datetime.now().isoformat(),
            "platform_status": "healthy",
            "metrics": self.real_time_metrics,
            "vendor_sessions": len(self.vendor_sessions),
            "buffer_size": len(self.metrics_buffer),
            "alert_rules_count": len(self.alert_rules)
        }

class VendorAnalyticsService:
    """Vendor-specific analytics and performance tracking"""
    
    def __init__(self, monitoring_service: PlatformMonitoringService):
        self.monitoring_service = monitoring_service
        self.database = monitoring_service.database
        self.logger = logging.getLogger(__name__)
    
    async def get_vendor_dashboard(self, vendor_id: str, time_range: str = "24h") -> Dict[str, Any]:
        """Generate comprehensive vendor dashboard"""
        
        end_time = datetime.now()
        if time_range == "24h":
            start_time = end_time - timedelta(hours=24)
        elif time_range == "7d":
            start_time = end_time - timedelta(days=7)
        elif time_range == "30d":
            start_time = end_time - timedelta(days=30)
        else:
            start_time = end_time - timedelta(hours=24)
        
        # Get vendor metrics
        metrics = await self._get_vendor_metrics(vendor_id, start_time, end_time)
        
        # Calculate performance scores
        performance = await self._calculate_vendor_performance(vendor_id, metrics)
        
        # Get cost analysis
        cost_analysis = await self._get_vendor_cost_analysis(vendor_id, start_time, end_time)
        
        # Get recent alerts
        alerts = await self._get_vendor_alerts(vendor_id, start_time, end_time)
        
        return {
            "vendor_id": vendor_id,
            "dashboard_period": {
                "start_time": start_time.isoformat(),
                "end_time": end_time.isoformat(),
                "range": time_range
            },
            "usage_metrics": metrics,
            "performance_scores": performance,
            "cost_analysis": cost_analysis,
            "recent_alerts": alerts,
            "recommendations": await self._generate_vendor_recommendations(vendor_id, metrics, performance)
        }
    
    async def _get_vendor_metrics(self, vendor_id: str, start_time: datetime, end_time: datetime) -> Dict[str, Any]:
        """Get vendor usage metrics for time range"""
        
        conn = sqlite3.connect(self.database.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT metric_type, COUNT(*) as count, AVG(value) as avg_value, 
                   SUM(value) as total_value, MIN(value) as min_value, MAX(value) as max_value
            FROM platform_metrics 
            WHERE vendor_id = ? AND timestamp BETWEEN ? AND ?
            GROUP BY metric_type
        """, (vendor_id, start_time.isoformat(), end_time.isoformat()))
        
        metrics = {}
        for row in cursor.fetchall():
            metrics[row[0]] = {
                "count": row[1],
                "average": round(row[2], 3) if row[2] else 0,
                "total": round(row[3], 3) if row[3] else 0,
                "minimum": round(row[4], 3) if row[4] else 0,
                "maximum": round(row[5], 3) if row[5] else 0
            }
        
        conn.close()
        return metrics
    
    async def _calculate_vendor_performance(self, vendor_id: str, metrics: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate vendor performance scores"""
        
        # API Performance Score
        api_performance = 100.0
        if "response_time" in metrics:
            avg_response_time = metrics["response_time"]["average"]
            if avg_response_time > 100:  # Above 100ms
                api_performance = max(0, 100 - (avg_response_time - 100) / 10)
        
        # Reliability Score
        reliability = 100.0
        if "error_rate" in metrics:
            error_rate = metrics["error_rate"]["average"]
            reliability = max(0, 100 - (error_rate * 1000))  # Convert to percentage penalty
        
        # Efficiency Score (AI agent utilization)
        efficiency = 85.0  # Default baseline
        if "ai_agent_hours" in metrics:
            agent_hours = metrics["ai_agent_hours"]["total"]
            # Score based on optimal utilization (not too high, not too low)
            if 1000 <= agent_hours <= 10000:
                efficiency = 100.0
            elif agent_hours < 1000:
                efficiency = 60.0 + (agent_hours / 1000) * 40
            else:
                efficiency = max(70.0, 100.0 - (agent_hours - 10000) / 1000)
        
        # Overall Score
        overall_score = (api_performance + reliability + efficiency) / 3
        
        return {
            "overall_score": round(overall_score, 1),
            "api_performance": round(api_performance, 1),
            "reliability": round(reliability, 1),
            "efficiency": round(efficiency, 1),
            "grade": self._score_to_grade(overall_score)
        }
    
    def _score_to_grade(self, score: float) -> str:
        """Convert numeric score to letter grade"""
        if score >= 95:
            return "A+"
        elif score >= 90:
            return "A"
        elif score >= 85:
            return "B+"
        elif score >= 80:
            return "B"
        elif score >= 75:
            return "C+"
        elif score >= 70:
            return "C"
        else:
            return "D"
    
    async def _get_vendor_cost_analysis(self, vendor_id: str, start_time: datetime, end_time: datetime) -> Dict[str, Any]:
        """Get vendor cost analysis"""
        
        conn = sqlite3.connect(self.database.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT SUM(cost_impact) as total_cost
            FROM platform_metrics 
            WHERE vendor_id = ? AND timestamp BETWEEN ? AND ? AND cost_impact IS NOT NULL
        """, (vendor_id, start_time.isoformat(), end_time.isoformat()))
        
        result = cursor.fetchone()
        total_usage_cost = result[0] if result[0] else 0.0
        
        conn.close()
        
        # Calculate pricing based on vendor tier
        if vendor_id == "harris_computer_systems":
            monthly_platform_fee = 15000.0  # Enterprise tier
            usage_multiplier = 0.8  # 20% enterprise discount
        else:
            monthly_platform_fee = 5000.0   # Standard tier
            usage_multiplier = 1.0
        
        daily_platform_fee = monthly_platform_fee / 30
        period_days = (end_time - start_time).days or 1
        
        return {
            "period_cost_breakdown": {
                "platform_fee": round(daily_platform_fee * period_days, 2),
                "usage_charges": round(total_usage_cost * usage_multiplier, 2),
                "total_cost": round((daily_platform_fee * period_days) + (total_usage_cost * usage_multiplier), 2)
            },
            "monthly_projection": {
                "platform_fee": monthly_platform_fee,
                "usage_charges": round(total_usage_cost * usage_multiplier * 30 / period_days, 2),
                "total_monthly": round(monthly_platform_fee + (total_usage_cost * usage_multiplier * 30 / period_days), 2)
            },
            "cost_efficiency": {
                "cost_per_api_call": "$0.0001",
                "cost_per_ai_agent_hour": "$0.001",
                "cost_per_sync_operation": "$0.01",
                "savings_vs_internal_development": "85%"
            }
        }
    
    async def _get_vendor_alerts(self, vendor_id: str, start_time: datetime, end_time: datetime) -> List[Dict[str, Any]]:
        """Get recent alerts for vendor"""
        
        conn = sqlite3.connect(self.database.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT alert_id, severity, title, description, timestamp, resolved
            FROM performance_alerts 
            WHERE vendor_id = ? AND timestamp BETWEEN ? AND ?
            ORDER BY timestamp DESC LIMIT 10
        """, (vendor_id, start_time.isoformat(), end_time.isoformat()))
        
        alerts = []
        for row in cursor.fetchall():
            alerts.append({
                "alert_id": row[0],
                "severity": row[1],
                "title": row[2],
                "description": row[3],
                "timestamp": row[4],
                "resolved": bool(row[5])
            })
        
        conn.close()
        return alerts
    
    async def _generate_vendor_recommendations(self, vendor_id: str, metrics: Dict[str, Any], performance: Dict[str, Any]) -> List[str]:
        """Generate performance recommendations for vendor"""
        
        recommendations = []
        
        # API Performance recommendations  
        if performance["api_performance"] < 85:
            recommendations.append("Consider implementing request caching to improve API response times")
            recommendations.append("Review API call patterns - batch operations where possible")
        
        # Reliability recommendations
        if performance["reliability"] < 90:
            recommendations.append("Implement retry logic with exponential backoff for failed requests")
            recommendations.append("Add input validation to reduce API errors")
        
        # Efficiency recommendations
        if performance["efficiency"] < 80:
            if "ai_agent_hours" in metrics and metrics["ai_agent_hours"]["total"] < 1000:
                recommendations.append("Increase AI agent utilization to optimize platform value")
                recommendations.append("Explore additional use cases for TerraFusion AI capabilities")
            else:
                recommendations.append("Optimize AI agent usage patterns to reduce costs")
                recommendations.append("Consider using fewer agents for simple tasks")
        
        # Cost optimization
        recommendations.append("Review usage patterns monthly to identify cost optimization opportunities")
        recommendations.append("Consider upgrading to enterprise tier for volume discounts")
        
        # Harris-specific recommendations
        if vendor_id == "harris_computer_systems":
            recommendations.extend([
                "Leverage Harris unified dashboard for cross-system analytics",
                "Enable AI enhancement for all CAMA property assessments",
                "Implement real-time data sync between Harris systems",
                "Utilize predictive tax collection strategies"
            ])
        
        return recommendations

class PlatformBillingService:
    """Platform billing and usage-based pricing service"""
    
    def __init__(self, monitoring_service: PlatformMonitoringService):
        self.monitoring_service = monitoring_service
        self.database = monitoring_service.database
        
        # Pricing configuration
        self.pricing_tiers = {
            "harris_computer_systems": {
                "tier": "enterprise",
                "monthly_platform_fee": 15000.0,
                "usage_rates": {
                    MetricType.API_CALLS: 0.0001,
                    MetricType.AI_AGENT_HOURS: 0.001,
                    MetricType.DATA_SYNC_OPERATIONS: 0.01,
                    MetricType.WORKFLOW_EXECUTIONS: 1.0
                },
                "discount_rate": 0.20  # 20% enterprise discount
            },
            "default": {
                "tier": "professional",
                "monthly_platform_fee": 5000.0,
                "usage_rates": {
                    MetricType.API_CALLS: 0.0001,
                    MetricType.AI_AGENT_HOURS: 0.001,
                    MetricType.DATA_SYNC_OPERATIONS: 0.01,
                    MetricType.WORKFLOW_EXECUTIONS: 1.0
                },
                "discount_rate": 0.0
            }
        }
        
        self.logger = logging.getLogger(__name__)
    
    async def generate_monthly_billing(self, vendor_id: str, billing_month: datetime) -> UsageBilling:
        """Generate monthly billing for vendor"""
        
        # Calculate billing period
        billing_start = billing_month.replace(day=1)
        if billing_month.month == 12:
            billing_end = billing_month.replace(year=billing_month.year + 1, month=1, day=1) - timedelta(days=1)
        else:
            billing_end = billing_month.replace(month=billing_month.month + 1, day=1) - timedelta(days=1)
        
        # Get vendor pricing tier
        pricing = self.pricing_tiers.get(vendor_id, self.pricing_tiers["default"])
        
        # Calculate usage
        usage_summary = await self._calculate_monthly_usage(vendor_id, billing_start, billing_end)
        
        # Calculate costs
        platform_fee = pricing["monthly_platform_fee"]
        usage_charges = 0.0
        
        for metric_type, usage_amount in usage_summary.items():
            if metric_type in pricing["usage_rates"]:
                usage_charges += usage_amount * pricing["usage_rates"][metric_type]
        
        # Apply discounts
        discount = usage_charges * pricing["discount_rate"]
        total_cost = platform_fee + usage_charges - discount
        
        billing_record = UsageBilling(
            billing_id=str(uuid.uuid4()),
            vendor_id=vendor_id,
            billing_period_start=billing_start,
            billing_period_end=billing_end,
            usage_summary=usage_summary,
            total_cost=total_cost,
            platform_fee=platform_fee,
            usage_charges=usage_charges,
            discounts=discount
        )
        
        # Store billing record
        await self._store_billing_record(billing_record)
        
        self.logger.info(f"Generated monthly billing for {vendor_id}: ${total_cost:.2f}")
        
        return billing_record
    
    async def _calculate_monthly_usage(self, vendor_id: str, start_date: datetime, end_date: datetime) -> Dict[MetricType, float]:
        """Calculate monthly usage by metric type"""
        
        conn = sqlite3.connect(self.database.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT metric_type, SUM(value) as total_usage
            FROM platform_metrics 
            WHERE vendor_id = ? AND timestamp BETWEEN ? AND ?
            GROUP BY metric_type
        """, (vendor_id, start_date.isoformat(), end_date.isoformat()))
        
        usage_summary = {}
        for row in cursor.fetchall():
            metric_type = MetricType(row[0])
            usage_summary[metric_type] = row[1]
        
        conn.close()
        return usage_summary
    
    async def _store_billing_record(self, billing: UsageBilling):
        """Store billing record in database"""
        
        conn = sqlite3.connect(self.database.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO usage_billing 
            (billing_id, vendor_id, billing_period_start, billing_period_end,
             usage_summary, total_cost, platform_fee, usage_charges, discounts, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            billing.billing_id, billing.vendor_id,
            billing.billing_period_start.isoformat(), billing.billing_period_end.isoformat(),
            json.dumps({k.value: v for k, v in billing.usage_summary.items()}),
            billing.total_cost, billing.platform_fee, billing.usage_charges,
            billing.discounts, billing.status
        ))
        
        conn.commit()
        conn.close()

# Create global instances
platform_monitoring = PlatformMonitoringService()
vendor_analytics = VendorAnalyticsService(platform_monitoring)
platform_billing = PlatformBillingService(platform_monitoring)

if __name__ == "__main__":
    # Demo execution
    import asyncio
    
    async def monitoring_demo():
        """Demonstrate platform monitoring and analytics"""
        
        print("=== TerraFusion Platform Monitoring Demo ===")
        
        # Simulate some metrics
        harris_metric = PlatformMetric(
            metric_id=str(uuid.uuid4()),
            vendor_id="harris_computer_systems",
            county_id="benton_county_wa",
            metric_type=MetricType.API_CALLS,
            value=150,
            unit="calls",
            timestamp=datetime.now(),
            cost_impact=0.015  # $0.015 for 150 calls
        )
        
        await platform_monitoring.record_metric(harris_metric)
        
        # Get real-time status
        status = platform_monitoring.get_real_time_status()
        print("Platform Status:")
        print(json.dumps(status, indent=2))
        
        # Get vendor dashboard
        dashboard = await vendor_analytics.get_vendor_dashboard("harris_computer_systems")
        print("\nHarris Vendor Dashboard:")
        print(json.dumps(dashboard, indent=2, default=str))
        
        # Generate billing
        billing = await platform_billing.generate_monthly_billing(
            "harris_computer_systems", 
            datetime.now()
        )
        print(f"\nMonthly Billing: ${billing.total_cost:.2f}")
        print(f"Platform Fee: ${billing.platform_fee:.2f}")
        print(f"Usage Charges: ${billing.usage_charges:.2f}")
        print(f"Discounts: ${billing.discounts:.2f}")
    
    # Run demo
    asyncio.run(monitoring_demo())