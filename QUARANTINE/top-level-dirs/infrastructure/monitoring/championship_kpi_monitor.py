#!/usr/bin/env python3
"""
TerraFusion Championship KPI Monitor
Automated monitoring and alerting for championship-level performance thresholds
"""

import asyncio
import json
import logging
import smtplib
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dataclasses import dataclass
import sqlite3
import os

@dataclass
class ChampionshipKPI:
    """Championship KPI definition"""
    name: str
    metric_path: str
    target_value: float
    comparison: str  # 'lt', 'gt', 'eq'
    unit: str
    criticality: str  # 'critical', 'warning', 'info'
    alert_threshold: float
    escalation_minutes: int

@dataclass
class KPIAlert:
    """KPI alert structure"""
    kpi_name: str
    current_value: float
    target_value: float
    deviation_percent: float
    severity: str
    message: str
    timestamp: str
    escalation_level: int

class ChampionshipKPIMonitor:
    """Monitor and enforce championship-level KPIs"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.start_time = datetime.utcnow()
        
        # KPI definitions for championship performance
        self.championship_kpis = {
            "response_time_championship": ChampionshipKPI(
                name="Response Time Championship",
                metric_path="response_time_ms",
                target_value=1.0,
                comparison="lt",
                unit="ms",
                criticality="critical",
                alert_threshold=1.5,  # Alert if >1.5ms
                escalation_minutes=5
            ),
            "uptime_dynasty": ChampionshipKPI(
                name="Uptime Dynasty",
                metric_path="uptime_percent",
                target_value=99.99,
                comparison="gt",
                unit="%",
                criticality="critical",
                alert_threshold=99.95,  # Alert if <99.95%
                escalation_minutes=1
            ),
            "error_rate_excellence": ChampionshipKPI(
                name="Error Rate Excellence",
                metric_path="error_rate_percent",
                target_value=0.01,
                comparison="lt",
                unit="%",
                criticality="critical",
                alert_threshold=0.05,  # Alert if >0.05%
                escalation_minutes=2
            ),
            "user_satisfaction_champion": ChampionshipKPI(
                name="User Satisfaction Championship",
                metric_path="user_satisfaction_score",
                target_value=95.0,
                comparison="gt",
                unit="%",
                criticality="warning",
                alert_threshold=90.0,  # Alert if <90%
                escalation_minutes=30
            ),
            "system_efficiency_dynasty": ChampionshipKPI(
                name="System Efficiency Dynasty",
                metric_path="efficiency_score",
                target_value=98.0,
                comparison="gt",
                unit="%",
                criticality="warning",
                alert_threshold=95.0,  # Alert if <95%
                escalation_minutes=15
            ),
            "revenue_growth_velocity": ChampionshipKPI(
                name="Revenue Growth Velocity",
                metric_path="revenue_growth_percent",
                target_value=150.0,
                comparison="gt",
                unit="%",
                criticality="info",
                alert_threshold=120.0,  # Alert if <120%
                escalation_minutes=60
            )
        }
        
        # Alert tracking
        self.active_alerts: Dict[str, KPIAlert] = {}
        self.alert_history = []
        self.escalation_tracking = {}
        
        # Database for KPI history
        self.db_path = "/mnt/e/TerraFusion_Master_Workspace/monitoring/championship_kpi.db"
        self.initialize_kpi_database()
        
        # Configure logging
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.StreamHandler(),
                logging.FileHandler('/mnt/e/TerraFusion_Master_Workspace/monitoring/championship_kpi.log')
            ]
        )
        self.logger = logging.getLogger(__name__)
        self.logger.info("Championship KPI Monitor initialized")
    
    def initialize_kpi_database(self):
        """Initialize KPI tracking database"""
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # KPI measurements table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS kpi_measurements (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT NOT NULL,
                    kpi_name TEXT NOT NULL,
                    current_value REAL,
                    target_value REAL,
                    championship_achieved BOOLEAN,
                    deviation_percent REAL
                )
            ''')
            
            # KPI alerts table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS kpi_alerts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT NOT NULL,
                    kpi_name TEXT NOT NULL,
                    current_value REAL,
                    target_value REAL,
                    deviation_percent REAL,
                    severity TEXT,
                    message TEXT,
                    escalation_level INTEGER,
                    resolved_timestamp TEXT
                )
            ''')
            
            # KPI targets tracking
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS kpi_targets (
                    kpi_name TEXT PRIMARY KEY,
                    target_value REAL,
                    alert_threshold REAL,
                    last_updated TEXT
                )
            ''')
            
            conn.commit()
    
    async def monitor_championship_kpis(self, metrics_data: Dict[str, Any]) -> List[KPIAlert]:
        """Monitor all championship KPIs and generate alerts"""
        self.logger.info("🎯 Monitoring Championship KPIs...")
        
        alerts = []
        current_time = datetime.utcnow()
        
        for kpi_name, kpi_def in self.championship_kpis.items():
            try:
                # Extract current value from metrics data
                current_value = self.extract_metric_value(metrics_data, kpi_def.metric_path)
                
                if current_value is None:
                    continue
                
                # Check if KPI is met
                championship_achieved = self.evaluate_kpi(current_value, kpi_def)
                
                # Calculate deviation
                if kpi_def.comparison in ['gt']:
                    deviation_percent = ((kpi_def.target_value - current_value) / kpi_def.target_value) * 100
                else:  # 'lt'
                    deviation_percent = ((current_value - kpi_def.target_value) / kpi_def.target_value) * 100
                
                # Store measurement
                await self.store_kpi_measurement(kpi_name, current_value, kpi_def.target_value, championship_achieved, deviation_percent)
                
                # Check for alerts
                alert_triggered = self.check_alert_condition(current_value, kpi_def)
                
                if alert_triggered:
                    alert = await self.create_kpi_alert(kpi_name, kpi_def, current_value, deviation_percent)
                    alerts.append(alert)
                    self.active_alerts[kpi_name] = alert
                    
                    self.logger.warning(f"🚨 KPI Alert: {alert.message}")
                else:
                    # Resolve alert if it was previously active
                    if kpi_name in self.active_alerts:
                        await self.resolve_kpi_alert(kpi_name)
                        del self.active_alerts[kpi_name]
                        self.logger.info(f"✅ KPI Alert Resolved: {kpi_name}")
                
            except Exception as e:
                self.logger.error(f"Error monitoring KPI {kpi_name}: {e}")
        
        return alerts
    
    def extract_metric_value(self, metrics_data: Dict[str, Any], metric_path: str) -> Optional[float]:
        """Extract metric value from nested data structure"""
        try:
            # Handle specific metric paths
            if metric_path == "response_time_ms":
                # Average response time across all services
                victory_metrics = metrics_data.get("victory_metrics", {})
                response_times = [v["current_value"] for k, v in victory_metrics.items() if "response_time" in k]
                return sum(response_times) / len(response_times) if response_times else None
            
            elif metric_path == "uptime_percent":
                # Average uptime across all services
                victory_metrics = metrics_data.get("victory_metrics", {})
                uptimes = [v["current_value"] for k, v in victory_metrics.items() if "uptime" in k]
                return sum(uptimes) / len(uptimes) if uptimes else None
            
            elif metric_path == "error_rate_percent":
                # Average error rate across all services
                victory_metrics = metrics_data.get("victory_metrics", {})
                error_rates = [v["current_value"] for k, v in victory_metrics.items() if "error_rate" in k]
                return sum(error_rates) / len(error_rates) if error_rates else None
            
            elif metric_path == "user_satisfaction_score":
                return metrics_data.get("user_satisfaction", {}).get("current_score")
            
            elif metric_path == "efficiency_score":
                return metrics_data.get("system_efficiency", {}).get("current_score")
            
            elif metric_path == "revenue_growth_percent":
                return metrics_data.get("revenue_impact", {}).get("adjusted_growth_percent")
            
            else:
                return None
                
        except Exception as e:
            self.logger.error(f"Error extracting metric {metric_path}: {e}")
            return None
    
    def evaluate_kpi(self, current_value: float, kpi_def: ChampionshipKPI) -> bool:
        """Evaluate if KPI meets championship standards"""
        if kpi_def.comparison == "lt":
            return current_value < kpi_def.target_value
        elif kpi_def.comparison == "gt":
            return current_value > kpi_def.target_value
        elif kpi_def.comparison == "eq":
            return abs(current_value - kpi_def.target_value) < 0.01
        else:
            return False
    
    def check_alert_condition(self, current_value: float, kpi_def: ChampionshipKPI) -> bool:
        """Check if alert condition is met"""
        if kpi_def.comparison == "lt":
            return current_value > kpi_def.alert_threshold
        elif kpi_def.comparison == "gt":
            return current_value < kpi_def.alert_threshold
        else:
            return False
    
    async def create_kpi_alert(self, kpi_name: str, kpi_def: ChampionshipKPI, current_value: float, deviation_percent: float) -> KPIAlert:
        """Create KPI alert"""
        current_time = datetime.utcnow()
        
        # Determine escalation level
        escalation_level = 1
        if kpi_name in self.escalation_tracking:
            time_diff = (current_time - self.escalation_tracking[kpi_name]).total_seconds() / 60
            if time_diff > kpi_def.escalation_minutes:
                escalation_level = 2
            if time_diff > kpi_def.escalation_minutes * 2:
                escalation_level = 3
        else:
            self.escalation_tracking[kpi_name] = current_time
        
        # Create alert message
        message = self.generate_alert_message(kpi_name, kpi_def, current_value, deviation_percent, escalation_level)
        
        alert = KPIAlert(
            kpi_name=kpi_name,
            current_value=current_value,
            target_value=kpi_def.target_value,
            deviation_percent=deviation_percent,
            severity=kpi_def.criticality,
            message=message,
            timestamp=current_time.isoformat(),
            escalation_level=escalation_level
        )
        
        # Store alert in database
        await self.store_kpi_alert(alert)
        
        # Send alert notifications
        await self.send_alert_notifications(alert, kpi_def)
        
        return alert
    
    def generate_alert_message(self, kpi_name: str, kpi_def: ChampionshipKPI, current_value: float, deviation_percent: float, escalation_level: int) -> str:
        """Generate alert message"""
        escalation_emoji = "🚨" if escalation_level >= 3 else "⚠️" if escalation_level >= 2 else "📊"
        
        direction = "below" if kpi_def.comparison == "gt" else "above"
        
        message = f"{escalation_emoji} {kpi_def.name} {direction} championship threshold! "
        message += f"Current: {current_value:.2f}{kpi_def.unit}, "
        message += f"Target: {kpi_def.target_value:.2f}{kpi_def.unit}, "
        message += f"Deviation: {abs(deviation_percent):.1f}%"
        
        if escalation_level >= 2:
            message += f" [ESCALATED - Level {escalation_level}]"
        
        return message
    
    async def store_kpi_measurement(self, kpi_name: str, current_value: float, target_value: float, championship_achieved: bool, deviation_percent: float):
        """Store KPI measurement in database"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO kpi_measurements 
                (timestamp, kpi_name, current_value, target_value, championship_achieved, deviation_percent)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                datetime.utcnow().isoformat(),
                kpi_name,
                current_value,
                target_value,
                championship_achieved,
                deviation_percent
            ))
            conn.commit()
    
    async def store_kpi_alert(self, alert: KPIAlert):
        """Store KPI alert in database"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO kpi_alerts 
                (timestamp, kpi_name, current_value, target_value, deviation_percent, severity, message, escalation_level)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                alert.timestamp,
                alert.kpi_name,
                alert.current_value,
                alert.target_value,
                alert.deviation_percent,
                alert.severity,
                alert.message,
                alert.escalation_level
            ))
            conn.commit()
    
    async def resolve_kpi_alert(self, kpi_name: str):
        """Resolve KPI alert"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                UPDATE kpi_alerts 
                SET resolved_timestamp = ?
                WHERE kpi_name = ? AND resolved_timestamp IS NULL
            ''', (datetime.utcnow().isoformat(), kpi_name))
            conn.commit()
        
        # Remove from escalation tracking
        if kpi_name in self.escalation_tracking:
            del self.escalation_tracking[kpi_name]
    
    async def send_alert_notifications(self, alert: KPIAlert, kpi_def: ChampionshipKPI):
        """Send alert notifications via configured channels"""
        try:
            # Console notification
            print(f"\n🚨 CHAMPIONSHIP KPI ALERT: {alert.message}")
            
            # Email notification (if configured)
            if self.config.get("email_alerts", {}).get("enabled", False):
                await self.send_email_alert(alert, kpi_def)
            
            # Webhook notification (if configured)
            if self.config.get("webhook_alerts", {}).get("enabled", False):
                await self.send_webhook_alert(alert, kpi_def)
            
            # Write to alert file
            alert_file = "/mnt/e/TerraFusion_Master_Workspace/monitoring/active_alerts.json"
            with open(alert_file, 'w') as f:
                json.dump([alert.__dict__ for alert in self.active_alerts.values()], f, indent=2)
                
        except Exception as e:
            self.logger.error(f"Error sending alert notifications: {e}")
    
    async def send_email_alert(self, alert: KPIAlert, kpi_def: ChampionshipKPI):
        """Send email alert notification"""
        try:
            email_config = self.config.get("email_alerts", {})
            
            msg = MIMEMultipart()
            msg['From'] = email_config.get("from_email", "alerts@terrafusion.ai")
            msg['To'] = email_config.get("to_email", "admin@terrafusion.ai")
            msg['Subject'] = f"🚨 TerraFusion Championship KPI Alert: {kpi_def.name}"
            
            body = f"""
TerraFusion Championship KPI Alert

Alert: {alert.message}
Severity: {alert.severity.upper()}
Time: {alert.timestamp}
Escalation Level: {alert.escalation_level}

Current Performance:
- Value: {alert.current_value:.2f}{kpi_def.unit}
- Target: {alert.target_value:.2f}{kpi_def.unit}
- Deviation: {abs(alert.deviation_percent):.1f}%

Action Required:
{'IMMEDIATE ATTENTION' if alert.severity == 'critical' else 'Review and Monitor'}

Dashboard: http://localhost:3000/monitoring/championship
            """
            
            msg.attach(MIMEText(body, 'plain'))
            
            # Note: Email sending would require SMTP configuration
            self.logger.info(f"Email alert prepared for {kpi_def.name}")
            
        except Exception as e:
            self.logger.error(f"Error sending email alert: {e}")
    
    async def send_webhook_alert(self, alert: KPIAlert, kpi_def: ChampionshipKPI):
        """Send webhook alert notification"""
        try:
            webhook_config = self.config.get("webhook_alerts", {})
            webhook_url = webhook_config.get("url")
            
            if webhook_url:
                payload = {
                    "alert_type": "championship_kpi",
                    "kpi_name": alert.kpi_name,
                    "message": alert.message,
                    "severity": alert.severity,
                    "current_value": alert.current_value,
                    "target_value": alert.target_value,
                    "deviation_percent": alert.deviation_percent,
                    "timestamp": alert.timestamp,
                    "escalation_level": alert.escalation_level
                }
                
                # Note: Webhook sending would require HTTP client
                self.logger.info(f"Webhook alert prepared for {kpi_def.name}")
                
        except Exception as e:
            self.logger.error(f"Error sending webhook alert: {e}")
    
    async def generate_kpi_status_report(self) -> Dict[str, Any]:
        """Generate comprehensive KPI status report"""
        self.logger.info("📊 Generating Championship KPI Status Report...")
        
        report = {
            "timestamp": datetime.utcnow().isoformat(),
            "monitoring_duration_hours": (datetime.utcnow() - self.start_time).total_seconds() / 3600,
            "total_kpis": len(self.championship_kpis),
            "active_alerts": len(self.active_alerts),
            "kpi_status": {},
            "alert_summary": {
                "critical": 0,
                "warning": 0,
                "info": 0
            },
            "championship_score": 0
        }
        
        # Get latest measurements for each KPI
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            championship_count = 0
            
            for kpi_name, kpi_def in self.championship_kpis.items():
                cursor.execute('''
                    SELECT current_value, championship_achieved, deviation_percent
                    FROM kpi_measurements 
                    WHERE kpi_name = ? 
                    ORDER BY timestamp DESC 
                    LIMIT 1
                ''', (kpi_name,))
                
                result = cursor.fetchone()
                
                if result:
                    current_value, championship_achieved, deviation_percent = result
                    
                    report["kpi_status"][kpi_name] = {
                        "name": kpi_def.name,
                        "current_value": current_value,
                        "target_value": kpi_def.target_value,
                        "unit": kpi_def.unit,
                        "championship_achieved": bool(championship_achieved),
                        "deviation_percent": deviation_percent,
                        "alert_active": kpi_name in self.active_alerts
                    }
                    
                    if championship_achieved:
                        championship_count += 1
        
        # Calculate championship score
        report["championship_score"] = (championship_count / len(self.championship_kpis)) * 100
        
        # Count alerts by severity
        for alert in self.active_alerts.values():
            report["alert_summary"][alert.severity] += 1
        
        return report

async def main():
    """Main entry point for Championship KPI Monitor"""
    config = {
        "monitoring_interval": 30,  # 30 seconds
        "email_alerts": {
            "enabled": False,  # Set to True when SMTP is configured
            "from_email": "alerts@terrafusion.ai",
            "to_email": "admin@terrafusion.ai"
        },
        "webhook_alerts": {
            "enabled": False,  # Set to True when webhook is configured
            "url": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
        }
    }
    
    monitor = ChampionshipKPIMonitor(config)
    
    print("🎯 TerraFusion Championship KPI Monitor - ACTIVE!")
    print("=" * 60)
    
    try:
        while True:
            # Mock metrics data (in production, integrate with actual analytics platform)
            mock_metrics = {
                "victory_metrics": {
                    "CostForge_response_time": {"current_value": 0.8},
                    "CostForge_uptime": {"current_value": 99.98},
                    "CostForge_error_rate": {"current_value": 0.003},
                    "PropertyWorkbench_response_time": {"current_value": 1.2},
                    "PropertyWorkbench_uptime": {"current_value": 99.99},
                    "PropertyWorkbench_error_rate": {"current_value": 0.001},
                },
                "user_satisfaction": {"current_score": 96.2},
                "system_efficiency": {"current_score": 97.8},
                "revenue_impact": {"adjusted_growth_percent": 148.5}
            }
            
            # Monitor KPIs
            alerts = await monitor.monitor_championship_kpis(mock_metrics)
            
            # Generate status report
            status_report = await monitor.generate_kpi_status_report()
            
            print(f"\n[{datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}] KPI STATUS")
            print(f"🏆 Championship Score: {status_report['championship_score']:.1f}%")
            print(f"🚨 Active Alerts: {status_report['active_alerts']}")
            
            if alerts:
                print("📊 Recent Alerts:")
                for alert in alerts[-3:]:  # Show last 3 alerts
                    print(f"  {alert.severity.upper()}: {alert.message}")
            
            await asyncio.sleep(config["monitoring_interval"])
            
    except KeyboardInterrupt:
        print("\n🏁 Championship KPI Monitor shutting down...")
        monitor.logger.info("Championship KPI Monitor shutdown completed")

if __name__ == "__main__":
    asyncio.run(main())