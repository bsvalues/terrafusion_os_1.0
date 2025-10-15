#!/usr/bin/env python3
"""
AI Ethics Monitoring System for TerraFusion Government AI
Real-time monitoring, alerting, and reporting for ethical AI operations
"""

import sqlite3
import json
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import logging
import smtplib
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import streamlit as st
from threading import Thread
import time
import asyncio

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AlertSeverity(Enum):
    """Alert severity levels"""
    INFO = "info"
    WARNING = "warning"
    HIGH = "high"
    CRITICAL = "critical"

class MonitoringStatus(Enum):
    """System monitoring status"""
    HEALTHY = "healthy"
    WARNING = "warning"
    CRITICAL = "critical"
    OFFLINE = "offline"

@dataclass
class EthicsMetrics:
    """Ethics monitoring metrics data structure"""
    timestamp: datetime
    ai_system_name: str
    decision_id: str
    bias_score: float
    fairness_score: float
    transparency_score: float
    compliance_score: float
    performance_score: float
    citizen_satisfaction_score: Optional[float] = None
    human_override_flag: bool = False
    appeal_flag: bool = False

@dataclass
class Alert:
    """Alert data structure"""
    alert_id: str
    alert_type: str
    severity: AlertSeverity
    ai_system_name: str
    description: str
    timestamp: datetime
    metrics_data: Dict[str, Any]
    status: str = "active"
    assigned_to: Optional[str] = None
    resolution_notes: Optional[str] = None
    resolved_timestamp: Optional[datetime] = None

class EthicsMonitoringSystem:
    """Comprehensive AI ethics monitoring system"""
    
    def __init__(self, db_path: str = "ethics_monitoring.db", config: Dict[str, Any] = None):
        self.db_path = db_path
        self.config = config or self.get_default_config()
        self.alert_rules = []
        self.notification_channels = []
        self.monitoring_active = False
        
        self.initialize_database()
        self.setup_alert_rules()
        self.setup_notification_channels()
    
    def get_default_config(self) -> Dict[str, Any]:
        """Get default monitoring configuration"""
        return {
            'bias_thresholds': {
                'statistical_parity': 0.05,
                'equalized_odds': 0.05,
                'demographic_parity_ratio': {'min': 0.95, 'max': 1.05}
            },
            'performance_thresholds': {
                'accuracy': 0.85,
                'precision': 0.80,
                'recall': 0.80
            },
            'compliance_thresholds': {
                'overall_compliance': 0.95,
                'critical_violations': 0
            },
            'monitoring_intervals': {
                'real_time': 1,      # seconds
                'metrics_update': 300, # 5 minutes
                'report_generation': 3600  # 1 hour
            },
            'alert_escalation': {
                'warning_threshold': 2,    # violations before warning
                'critical_threshold': 5    # violations before critical
            }
        }
    
    def initialize_database(self):
        """Initialize monitoring database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Ethics metrics table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS ethics_metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME,
                ai_system_name TEXT,
                decision_id TEXT,
                bias_score REAL,
                fairness_score REAL,
                transparency_score REAL,
                compliance_score REAL,
                performance_score REAL,
                citizen_satisfaction_score REAL,
                human_override_flag BOOLEAN,
                appeal_flag BOOLEAN,
                metrics_data TEXT
            )
        ''')
        
        # Alerts table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS alerts (
                alert_id TEXT PRIMARY KEY,
                alert_type TEXT,
                severity TEXT,
                ai_system_name TEXT,
                description TEXT,
                timestamp DATETIME,
                metrics_data TEXT,
                status TEXT DEFAULT 'active',
                assigned_to TEXT,
                resolution_notes TEXT,
                resolved_timestamp DATETIME
            )
        ''')
        
        # Daily summaries table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS daily_summaries (
                summary_date DATE PRIMARY KEY,
                ai_system_name TEXT,
                total_decisions INTEGER,
                avg_bias_score REAL,
                avg_fairness_score REAL,
                avg_compliance_score REAL,
                total_alerts INTEGER,
                critical_alerts INTEGER,
                appeals_received INTEGER,
                human_overrides INTEGER,
                summary_data TEXT
            )
        ''')
        
        # System health table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS system_health (
                health_id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME,
                ai_system_name TEXT,
                status TEXT,
                uptime_percentage REAL,
                response_time_ms REAL,
                error_rate REAL,
                health_data TEXT
            )
        ''')
        
        conn.commit()
        conn.close()
        logger.info("Ethics monitoring database initialized")
    
    def setup_alert_rules(self):
        """Setup alert rules for monitoring"""
        self.alert_rules = [
            {
                'name': 'bias_threshold_exceeded',
                'description': 'Bias metrics exceed acceptable thresholds',
                'severity': AlertSeverity.HIGH,
                'condition': lambda metrics: any(
                    abs(metrics.get('bias_metrics', {}).get(metric, 0)) > threshold
                    for metric, threshold in self.config['bias_thresholds'].items()
                    if isinstance(threshold, (int, float))
                )
            },
            {
                'name': 'performance_degradation',
                'description': 'AI system performance below minimum standards',
                'severity': AlertSeverity.WARNING,
                'condition': lambda metrics: any(
                    metrics.get('performance_metrics', {}).get(metric, 1.0) < threshold
                    for metric, threshold in self.config['performance_thresholds'].items()
                )
            },
            {
                'name': 'compliance_violation',
                'description': 'Regulatory compliance violation detected',
                'severity': AlertSeverity.CRITICAL,
                'condition': lambda metrics: (
                    metrics.get('compliance_score', 1.0) < self.config['compliance_thresholds']['overall_compliance']
                )
            },
            {
                'name': 'high_appeal_rate',
                'description': 'Unusually high rate of citizen appeals',
                'severity': AlertSeverity.WARNING,
                'condition': lambda metrics: self.check_appeal_rate_threshold(metrics)
            },
            {
                'name': 'system_unavailable',
                'description': 'AI system experiencing availability issues',
                'severity': AlertSeverity.CRITICAL,
                'condition': lambda metrics: metrics.get('system_availability', 1.0) < 0.95
            }
        ]
    
    def setup_notification_channels(self):
        """Setup notification channels for alerts"""
        self.notification_channels = [
            {
                'name': 'email_alerts',
                'type': 'email',
                'enabled': True,
                'recipients': ['ethics@terrafusion.gov', 'compliance@terrafusion.gov'],
                'severity_filter': [AlertSeverity.HIGH, AlertSeverity.CRITICAL]
            },
            {
                'name': 'dashboard_notifications',
                'type': 'dashboard',
                'enabled': True,
                'severity_filter': [AlertSeverity.WARNING, AlertSeverity.HIGH, AlertSeverity.CRITICAL]
            },
            {
                'name': 'sms_critical',
                'type': 'sms',
                'enabled': True,
                'recipients': ['+1234567890'],  # Emergency contact numbers
                'severity_filter': [AlertSeverity.CRITICAL]
            }
        ]
    
    def record_ethics_metrics(self, metrics: EthicsMetrics):
        """Record ethics metrics to database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO ethics_metrics (
                timestamp, ai_system_name, decision_id, bias_score,
                fairness_score, transparency_score, compliance_score,
                performance_score, citizen_satisfaction_score,
                human_override_flag, appeal_flag, metrics_data
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            metrics.timestamp,
            metrics.ai_system_name,
            metrics.decision_id,
            metrics.bias_score,
            metrics.fairness_score,
            metrics.transparency_score,
            metrics.compliance_score,
            metrics.performance_score,
            metrics.citizen_satisfaction_score,
            metrics.human_override_flag,
            metrics.appeal_flag,
            json.dumps(asdict(metrics), default=str)
        ))
        
        conn.commit()
        conn.close()
        
        # Check for alert conditions
        self.evaluate_alerts(metrics)
    
    def evaluate_alerts(self, metrics: EthicsMetrics):
        """Evaluate metrics against alert rules"""
        metrics_dict = asdict(metrics)
        
        for rule in self.alert_rules:
            try:
                if rule['condition'](metrics_dict):
                    alert = Alert(
                        alert_id=self.generate_alert_id(),
                        alert_type=rule['name'],
                        severity=rule['severity'],
                        ai_system_name=metrics.ai_system_name,
                        description=rule['description'],
                        timestamp=datetime.now(),
                        metrics_data=metrics_dict
                    )
                    
                    self.record_alert(alert)
                    self.dispatch_alert(alert)
                    
            except Exception as e:
                logger.error(f"Error evaluating alert rule {rule['name']}: {e}")
    
    def generate_alert_id(self) -> str:
        """Generate unique alert ID"""
        import uuid
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        return f"ALERT-{timestamp}-{str(uuid.uuid4())[:8].upper()}"
    
    def record_alert(self, alert: Alert):
        """Record alert to database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO alerts (
                alert_id, alert_type, severity, ai_system_name,
                description, timestamp, metrics_data, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            alert.alert_id,
            alert.alert_type,
            alert.severity.value,
            alert.ai_system_name,
            alert.description,
            alert.timestamp,
            json.dumps(alert.metrics_data, default=str),
            alert.status
        ))
        
        conn.commit()
        conn.close()
        
        logger.warning(f"Alert recorded: {alert.alert_type} - {alert.description}")
    
    def dispatch_alert(self, alert: Alert):
        """Dispatch alert through appropriate channels"""
        for channel in self.notification_channels:
            if (channel['enabled'] and 
                alert.severity in channel['severity_filter']):
                
                try:
                    if channel['type'] == 'email':
                        self.send_email_alert(alert, channel)
                    elif channel['type'] == 'sms':
                        self.send_sms_alert(alert, channel)
                    elif channel['type'] == 'dashboard':
                        self.update_dashboard_alert(alert)
                        
                except Exception as e:
                    logger.error(f"Failed to dispatch alert via {channel['name']}: {e}")
    
    def send_email_alert(self, alert: Alert, channel: Dict[str, Any]):
        """Send email alert notification"""
        subject = f"TerraFusion AI Ethics Alert - {alert.severity.value.upper()}"
        
        body = f"""
        AI Ethics Alert
        ===============
        
        Alert ID: {alert.alert_id}
        Type: {alert.alert_type}
        Severity: {alert.severity.value.upper()}
        AI System: {alert.ai_system_name}
        Timestamp: {alert.timestamp}
        
        Description: {alert.description}
        
        Recommended Actions:
        {self.get_recommended_actions(alert)}
        
        Dashboard Link: https://terrafusion.gov/ethics-dashboard
        
        This is an automated alert from the TerraFusion AI Ethics Monitoring System.
        """
        
        # In production, this would use actual email service
        logger.info(f"Email alert sent: {subject}")
        print(f"EMAIL ALERT: {subject}\n{body}")
    
    def get_recommended_actions(self, alert: Alert) -> str:
        """Get recommended actions for alert"""
        action_map = {
            'bias_threshold_exceeded': [
                "1. Immediately review bias metrics for affected demographic groups",
                "2. Implement temporary bias mitigation measures",
                "3. Conduct root cause analysis of bias increase",
                "4. Consider temporary human override for affected decisions"
            ],
            'performance_degradation': [
                "1. Investigate root causes of performance degradation",
                "2. Check data quality and model drift indicators",
                "3. Consider model retraining if drift is confirmed",
                "4. Implement additional validation measures"
            ],
            'compliance_violation': [
                "1. Immediately assess scope and impact of violation",
                "2. Implement emergency compliance measures",
                "3. Notify appropriate regulatory bodies if required",
                "4. Document violation and remediation steps"
            ],
            'high_appeal_rate': [
                "1. Analyze common factors in recent appeals",
                "2. Review explanation quality and citizen communication",
                "3. Consider additional human review for borderline decisions",
                "4. Enhance citizen education and support materials"
            ],
            'system_unavailable': [
                "1. Implement emergency failover procedures",
                "2. Investigate and resolve system issues",
                "3. Notify affected citizens of service disruption",
                "4. Document incident for post-mortem analysis"
            ]
        }
        
        actions = action_map.get(alert.alert_type, ["1. Review alert details and determine appropriate response"])
        return "\n".join(actions)
    
    def check_appeal_rate_threshold(self, metrics: Dict[str, Any]) -> bool:
        """Check if appeal rate exceeds threshold"""
        # Get recent appeal rate for this system
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Calculate appeal rate over last 24 hours
        cursor.execute('''
            SELECT 
                COUNT(*) as total_decisions,
                SUM(CASE WHEN appeal_flag = 1 THEN 1 ELSE 0 END) as appeals
            FROM ethics_metrics
            WHERE ai_system_name = ? 
            AND timestamp >= datetime('now', '-1 day')
        ''', (metrics.get('ai_system_name', ''),))
        
        result = cursor.fetchone()
        conn.close()
        
        if result and result[0] > 0:
            appeal_rate = result[1] / result[0]
            return appeal_rate > 0.1  # 10% appeal rate threshold
        
        return False
    
    def generate_daily_summary(self, date: datetime, ai_system_name: str = None) -> Dict[str, Any]:
        """Generate daily summary of ethics metrics"""
        conn = sqlite3.connect(self.db_path)
        
        # Build query
        where_clause = "DATE(timestamp) = ?"
        params = [date.date()]
        
        if ai_system_name:
            where_clause += " AND ai_system_name = ?"
            params.append(ai_system_name)
        
        # Get metrics summary
        query = f'''
            SELECT 
                ai_system_name,
                COUNT(*) as total_decisions,
                AVG(bias_score) as avg_bias_score,
                AVG(fairness_score) as avg_fairness_score,
                AVG(transparency_score) as avg_transparency_score,
                AVG(compliance_score) as avg_compliance_score,
                AVG(performance_score) as avg_performance_score,
                SUM(CASE WHEN human_override_flag = 1 THEN 1 ELSE 0 END) as human_overrides,
                SUM(CASE WHEN appeal_flag = 1 THEN 1 ELSE 0 END) as appeals
            FROM ethics_metrics
            WHERE {where_clause}
            GROUP BY ai_system_name
        '''
        
        metrics_df = pd.read_sql_query(query, conn, params=params)
        
        # Get alerts summary
        alert_query = f'''
            SELECT 
                COUNT(*) as total_alerts,
                SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical_alerts,
                SUM(CASE WHEN severity = 'high' THEN 1 ELSE 0 END) as high_alerts,
                SUM(CASE WHEN severity = 'warning' THEN 1 ELSE 0 END) as warning_alerts
            FROM alerts
            WHERE DATE(timestamp) = ?
        '''
        
        alert_params = [date.date()]
        if ai_system_name:
            alert_query += " AND ai_system_name = ?"
            alert_params.append(ai_system_name)
        
        alerts_df = pd.read_sql_query(alert_query, conn, params=alert_params)
        
        conn.close()
        
        # Compile summary
        summary = {
            'date': date.date(),
            'ai_system': ai_system_name or 'All Systems',
            'metrics_summary': metrics_df.to_dict('records') if not metrics_df.empty else [],
            'alerts_summary': alerts_df.to_dict('records')[0] if not alerts_df.empty else {},
            'overall_health': self.calculate_overall_health(metrics_df, alerts_df),
            'key_insights': self.generate_key_insights(metrics_df, alerts_df),
            'recommended_actions': self.generate_daily_recommendations(metrics_df, alerts_df)
        }
        
        # Store summary
        self.store_daily_summary(summary)
        
        return summary
    
    def calculate_overall_health(self, metrics_df: pd.DataFrame, alerts_df: pd.DataFrame) -> Dict[str, Any]:
        """Calculate overall system health"""
        if metrics_df.empty:
            return {'status': 'no_data', 'score': 0.0}
        
        # Calculate weighted health score
        avg_scores = {
            'bias': metrics_df['avg_bias_score'].mean(),
            'fairness': metrics_df['avg_fairness_score'].mean(),
            'transparency': metrics_df['avg_transparency_score'].mean(),
            'compliance': metrics_df['avg_compliance_score'].mean(),
            'performance': metrics_df['avg_performance_score'].mean()
        }
        
        # Weight different aspects
        weights = {'bias': 0.25, 'fairness': 0.25, 'compliance': 0.25, 'performance': 0.15, 'transparency': 0.10}
        weighted_score = sum(avg_scores[aspect] * weight for aspect, weight in weights.items())
        
        # Adjust for alerts
        if not alerts_df.empty and alerts_df.iloc[0]['critical_alerts'] > 0:
            weighted_score *= 0.7  # Significant penalty for critical alerts
        elif not alerts_df.empty and alerts_df.iloc[0]['high_alerts'] > 0:
            weighted_score *= 0.85  # Moderate penalty for high alerts
        
        # Determine status
        if weighted_score >= 0.95:
            status = 'excellent'
        elif weighted_score >= 0.85:
            status = 'good'
        elif weighted_score >= 0.70:
            status = 'acceptable'
        elif weighted_score >= 0.50:
            status = 'concerning'
        else:
            status = 'critical'
        
        return {
            'status': status,
            'score': weighted_score,
            'component_scores': avg_scores
        }
    
    def generate_key_insights(self, metrics_df: pd.DataFrame, alerts_df: pd.DataFrame) -> List[str]:
        """Generate key insights from daily data"""
        insights = []
        
        if metrics_df.empty:
            insights.append("No decision data available for analysis")
            return insights
        
        # Analyze metrics trends
        total_decisions = metrics_df['total_decisions'].sum()
        insights.append(f"Processed {total_decisions} AI decisions today")
        
        # Bias analysis
        avg_bias = metrics_df['avg_bias_score'].mean()
        if avg_bias > 0.95:
            insights.append("Bias metrics are within excellent range")
        elif avg_bias > 0.85:
            insights.append("Bias metrics are acceptable but should be monitored")
        else:
            insights.append("Bias metrics indicate need for immediate attention")
        
        # Appeal rate analysis
        total_appeals = metrics_df['appeals'].sum()
        appeal_rate = total_appeals / total_decisions if total_decisions > 0 else 0
        if appeal_rate > 0.10:
            insights.append(f"High appeal rate ({appeal_rate:.1%}) suggests citizen satisfaction issues")
        elif appeal_rate > 0.05:
            insights.append(f"Moderate appeal rate ({appeal_rate:.1%}) within normal range")
        else:
            insights.append(f"Low appeal rate ({appeal_rate:.1%}) indicates good citizen acceptance")
        
        # Alert analysis
        if not alerts_df.empty:
            alert_data = alerts_df.iloc[0]
            if alert_data['critical_alerts'] > 0:
                insights.append(f"{alert_data['critical_alerts']} critical alerts require immediate attention")
            if alert_data['high_alerts'] > 0:
                insights.append(f"{alert_data['high_alerts']} high-priority alerts need resolution")
        
        return insights
    
    def generate_daily_recommendations(self, metrics_df: pd.DataFrame, alerts_df: pd.DataFrame) -> List[str]:
        """Generate daily recommendations"""
        recommendations = []
        
        if metrics_df.empty:
            recommendations.append("Investigate system issues causing lack of decision data")
            return recommendations
        
        # Performance-based recommendations
        avg_performance = metrics_df['avg_performance_score'].mean()
        if avg_performance < 0.85:
            recommendations.append("Conduct performance analysis and consider model improvements")
        
        # Compliance recommendations
        avg_compliance = metrics_df['avg_compliance_score'].mean()
        if avg_compliance < 0.95:
            recommendations.append("Review compliance procedures and implement corrective measures")
        
        # Human override analysis
        total_overrides = metrics_df['human_overrides'].sum()
        total_decisions = metrics_df['total_decisions'].sum()
        override_rate = total_overrides / total_decisions if total_decisions > 0 else 0
        
        if override_rate > 0.15:
            recommendations.append("High human override rate suggests need for model refinement")
        elif override_rate < 0.02:
            recommendations.append("Very low override rate - verify human oversight is functioning properly")
        
        # Alert-based recommendations
        if not alerts_df.empty:
            alert_data = alerts_df.iloc[0]
            if alert_data['total_alerts'] > 10:
                recommendations.append("High alert volume indicates systematic issues requiring investigation")
        
        if not recommendations:
            recommendations.append("Continue current monitoring and maintain operational excellence")
        
        return recommendations
    
    def store_daily_summary(self, summary: Dict[str, Any]):
        """Store daily summary in database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Store summary for each system
        for system_metrics in summary.get('metrics_summary', []):
            cursor.execute('''
                INSERT OR REPLACE INTO daily_summaries (
                    summary_date, ai_system_name, total_decisions,
                    avg_bias_score, avg_fairness_score, avg_compliance_score,
                    total_alerts, critical_alerts, appeals_received,
                    human_overrides, summary_data
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                summary['date'],
                system_metrics['ai_system_name'],
                system_metrics['total_decisions'],
                system_metrics['avg_bias_score'],
                system_metrics['avg_fairness_score'],
                system_metrics['avg_compliance_score'],
                summary['alerts_summary'].get('total_alerts', 0),
                summary['alerts_summary'].get('critical_alerts', 0),
                system_metrics['appeals'],
                system_metrics['human_overrides'],
                json.dumps(summary, default=str)
            ))
        
        conn.commit()
        conn.close()
    
    def create_monitoring_dashboard(self):
        """Create Streamlit monitoring dashboard"""
        st.set_page_config(
            page_title="TerraFusion AI Ethics Monitor",
            page_icon="🛡️",
            layout="wide"
        )
        
        st.title("🛡️ TerraFusion AI Ethics Monitoring Dashboard")
        st.markdown("### Real-time Ethics, Compliance, and Performance Monitoring")
        
        # Sidebar controls
        st.sidebar.header("Dashboard Controls")
        
        # System selector
        systems = self.get_available_systems()
        selected_system = st.sidebar.selectbox("AI System", ["All Systems"] + systems)
        
        # Time range selector
        time_range = st.sidebar.selectbox(
            "Time Range",
            ["Last 24 Hours", "Last 7 Days", "Last 30 Days"]
        )
        
        # Refresh dashboard
        if st.sidebar.button("Refresh Dashboard"):
            st.experimental_rerun()
        
        # Main dashboard content
        self.render_dashboard_content(selected_system, time_range)
    
    def render_dashboard_content(self, selected_system: str, time_range: str):
        """Render main dashboard content"""
        # System health overview
        col1, col2, col3, col4 = st.columns(4)
        
        health_data = self.get_current_health_metrics(selected_system)
        
        with col1:
            st.metric(
                "Overall Health",
                health_data.get('status', 'Unknown').title(),
                delta=f"{health_data.get('score', 0):.1%}"
            )
        
        with col2:
            active_alerts = self.get_active_alerts_count(selected_system)
            st.metric(
                "Active Alerts",
                active_alerts,
                delta=None,
                delta_color="inverse"
            )
        
        with col3:
            compliance_score = health_data.get('component_scores', {}).get('compliance', 0)
            st.metric(
                "Compliance Score",
                f"{compliance_score:.1%}",
                delta=None
            )
        
        with col4:
            bias_score = health_data.get('component_scores', {}).get('bias', 0)
            st.metric(
                "Bias Score",
                f"{bias_score:.1%}",
                delta=None
            )
        
        # Charts and visualizations
        col1, col2 = st.columns(2)
        
        with col1:
            st.subheader("📊 Ethics Metrics Trends")
            trends_chart = self.create_trends_chart(selected_system, time_range)
            if trends_chart:
                st.plotly_chart(trends_chart, use_container_width=True)
        
        with col2:
            st.subheader("🚨 Alert Distribution")
            alerts_chart = self.create_alerts_chart(selected_system, time_range)
            if alerts_chart:
                st.plotly_chart(alerts_chart, use_container_width=True)
        
        # Recent alerts table
        st.subheader("🔔 Recent Alerts")
        recent_alerts = self.get_recent_alerts(selected_system, limit=10)
        if recent_alerts:
            alerts_df = pd.DataFrame(recent_alerts)
            st.dataframe(alerts_df[['timestamp', 'alert_type', 'severity', 'description']], use_container_width=True)
        else:
            st.info("No recent alerts")
        
        # Daily insights
        st.subheader("💡 Today's Key Insights")
        daily_summary = self.generate_daily_summary(datetime.now(), 
                                                   selected_system if selected_system != "All Systems" else None)
        
        for insight in daily_summary.get('key_insights', []):
            st.info(insight)
        
        # Recommendations
        st.subheader("🎯 Recommended Actions")
        for recommendation in daily_summary.get('recommended_actions', []):
            st.warning(recommendation)
    
    def get_available_systems(self) -> List[str]:
        """Get list of available AI systems"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("SELECT DISTINCT ai_system_name FROM ethics_metrics ORDER BY ai_system_name")
        systems = [row[0] for row in cursor.fetchall()]
        
        conn.close()
        return systems if systems else ["PropertyAssessmentAI", "RiskAnalysisAI"]
    
    def get_current_health_metrics(self, system_name: str) -> Dict[str, Any]:
        """Get current health metrics for system"""
        # In a real implementation, this would query recent data
        return {
            'status': 'good',
            'score': 0.87,
            'component_scores': {
                'bias': 0.92,
                'fairness': 0.89,
                'compliance': 0.95,
                'performance': 0.85,
                'transparency': 0.88
            }
        }
    
    def get_active_alerts_count(self, system_name: str) -> int:
        """Get count of active alerts"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        query = "SELECT COUNT(*) FROM alerts WHERE status = 'active'"
        params = []
        
        if system_name != "All Systems":
            query += " AND ai_system_name = ?"
            params.append(system_name)
        
        cursor.execute(query, params)
        count = cursor.fetchone()[0]
        
        conn.close()
        return count
    
    def create_trends_chart(self, system_name: str, time_range: str):
        """Create trends chart for ethics metrics"""
        # Sample data for demonstration
        dates = pd.date_range(start='2025-07-01', end='2025-08-03', freq='D')
        
        fig = go.Figure()
        
        # Add trend lines for different metrics
        metrics = ['Bias Score', 'Fairness Score', 'Compliance Score', 'Performance Score']
        colors = ['blue', 'green', 'red', 'orange']
        
        for metric, color in zip(metrics, colors):
            # Generate sample trend data
            values = np.random.normal(0.85, 0.05, len(dates))
            values = np.clip(values, 0, 1)
            
            fig.add_trace(go.Scatter(
                x=dates,
                y=values,
                mode='lines+markers',
                name=metric,
                line=dict(color=color, width=2)
            ))
        
        fig.update_layout(
            title="Ethics Metrics Trends",
            xaxis_title="Date",
            yaxis_title="Score",
            yaxis=dict(range=[0, 1]),
            hovermode='x unified'
        )
        
        return fig
    
    def create_alerts_chart(self, system_name: str, time_range: str):
        """Create alerts distribution chart"""
        # Sample data for demonstration
        alert_types = ['Bias Threshold', 'Performance', 'Compliance', 'High Appeals', 'System Issues']
        counts = [3, 1, 2, 4, 1]
        
        fig = go.Figure(data=[
            go.Bar(x=alert_types, y=counts, marker_color='lightcoral')
        ])
        
        fig.update_layout(
            title="Alert Distribution by Type",
            xaxis_title="Alert Type",
            yaxis_title="Count"
        )
        
        return fig
    
    def get_recent_alerts(self, system_name: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Get recent alerts"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        query = '''
            SELECT alert_id, alert_type, severity, ai_system_name, 
                   description, timestamp, status
            FROM alerts
            ORDER BY timestamp DESC
            LIMIT ?
        '''
        params = [limit]
        
        if system_name != "All Systems":
            query = query.replace('ORDER BY', 'WHERE ai_system_name = ? ORDER BY')
            params = [system_name] + params
        
        cursor.execute(query, params)
        alerts = []
        
        for row in cursor.fetchall():
            alerts.append({
                'alert_id': row[0],
                'alert_type': row[1],
                'severity': row[2],
                'ai_system_name': row[3],
                'description': row[4],
                'timestamp': row[5],
                'status': row[6]
            })
        
        conn.close()
        return alerts

# Example usage and testing
def main():
    """Example usage of ethics monitoring system"""
    
    # Initialize monitoring system
    monitor = EthicsMonitoringSystem()
    
    # Simulate recording ethics metrics
    print("Recording sample ethics metrics...")
    
    for i in range(10):
        metrics = EthicsMetrics(
            timestamp=datetime.now() - timedelta(hours=i),
            ai_system_name="PropertyAssessmentAI",
            decision_id=f"DECISION_{1000+i}",
            bias_score=np.random.normal(0.92, 0.05),
            fairness_score=np.random.normal(0.88, 0.05),
            transparency_score=np.random.normal(0.85, 0.05),
            compliance_score=np.random.normal(0.94, 0.03),
            performance_score=np.random.normal(0.87, 0.04),
            human_override_flag=np.random.random() < 0.05,
            appeal_flag=np.random.random() < 0.08
        )
        
        monitor.record_ethics_metrics(metrics)
    
    print("Sample metrics recorded successfully")
    
    # Generate daily summary
    print("\nGenerating daily summary...")
    summary = monitor.generate_daily_summary(datetime.now())
    
    print(f"Daily Summary for {summary['date']}:")
    print(f"Overall Health: {summary['overall_health']['status']} ({summary['overall_health']['score']:.1%})")
    
    print("\nKey Insights:")
    for insight in summary['key_insights']:
        print(f"- {insight}")
    
    print("\nRecommendations:")
    for rec in summary['recommended_actions']:
        print(f"- {rec}")

if __name__ == "__main__":
    main()