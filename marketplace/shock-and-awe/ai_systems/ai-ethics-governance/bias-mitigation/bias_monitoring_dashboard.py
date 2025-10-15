#!/usr/bin/env python3
"""
Bias Monitoring Dashboard for TerraFusion AI Systems
Real-time bias detection and monitoring with automated alerts
"""

import pandas as pd
import numpy as np
import streamlit as st
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import sqlite3
from datetime import datetime, timedelta
import json
import logging
from typing import Dict, List, Tuple, Any
import warnings
warnings.filterwarnings('ignore')

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class BiasMonitoringDashboard:
    """Real-time bias monitoring dashboard for AI systems"""
    
    def __init__(self, db_path: str = "bias_monitoring.db"):
        self.db_path = db_path
        self.bias_thresholds = {
            'statistical_parity': 0.05,
            'equalized_odds': 0.05,
            'demographic_parity_ratio': {'min': 0.95, 'max': 1.05},
            'calibration_error': 0.03
        }
        self.initialize_database()
    
    def initialize_database(self):
        """Initialize SQLite database for bias monitoring"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS bias_metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME,
                model_name TEXT,
                metric_type TEXT,
                demographic_group TEXT,
                metric_value REAL,
                threshold_exceeded BOOLEAN,
                alert_level TEXT
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS bias_incidents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME,
                model_name TEXT,
                incident_type TEXT,
                severity TEXT,
                description TEXT,
                affected_groups TEXT,
                resolution_status TEXT,
                resolution_notes TEXT
            )
        ''')
        
        conn.commit()
        conn.close()
    
    def calculate_bias_metrics(self, predictions: np.ndarray, 
                             actuals: np.ndarray, 
                             demographics: pd.DataFrame) -> Dict[str, Any]:
        """Calculate comprehensive bias metrics"""
        metrics = {}
        
        for protected_attr in demographics.columns:
            attr_metrics = {}
            groups = demographics[protected_attr].unique()
            
            # Statistical Parity Difference
            group_rates = {}
            for group in groups:
                mask = demographics[protected_attr] == group
                group_rates[group] = predictions[mask].mean()
            
            max_rate = max(group_rates.values())
            min_rate = min(group_rates.values())
            attr_metrics['statistical_parity'] = max_rate - min_rate
            
            # Equalized Odds
            group_tpr = {}
            group_fpr = {}
            for group in groups:
                mask = demographics[protected_attr] == group
                group_preds = predictions[mask]
                group_actuals = actuals[mask]
                
                tp = np.sum((group_preds == 1) & (group_actuals == 1))
                tn = np.sum((group_preds == 0) & (group_actuals == 0))
                fp = np.sum((group_preds == 1) & (group_actuals == 0))
                fn = np.sum((group_preds == 0) & (group_actuals == 1))
                
                group_tpr[group] = tp / (tp + fn) if (tp + fn) > 0 else 0
                group_fpr[group] = fp / (fp + tn) if (fp + tn) > 0 else 0
            
            tpr_diff = max(group_tpr.values()) - min(group_tpr.values())
            fpr_diff = max(group_fpr.values()) - min(group_fpr.values())
            attr_metrics['equalized_odds'] = max(tpr_diff, fpr_diff)
            
            # Demographic Parity Ratio
            rates = list(group_rates.values())
            attr_metrics['demographic_parity_ratio'] = min(rates) / max(rates) if max(rates) > 0 else 1
            
            # Calibration Error
            calibration_errors = []
            for group in groups:
                mask = demographics[protected_attr] == group
                group_preds = predictions[mask]
                group_actuals = actuals[mask]
                
                if len(group_preds) > 0:
                    calibration_error = abs(group_preds.mean() - group_actuals.mean())
                    calibration_errors.append(calibration_error)
            
            attr_metrics['calibration_error'] = max(calibration_errors) if calibration_errors else 0
            
            metrics[protected_attr] = attr_metrics
        
        return metrics
    
    def detect_bias_violations(self, metrics: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Detect bias threshold violations and generate alerts"""
        violations = []
        
        for attr, attr_metrics in metrics.items():
            for metric_name, value in attr_metrics.items():
                threshold = self.bias_thresholds.get(metric_name)
                
                if threshold is None:
                    continue
                
                violated = False
                severity = 'none'
                
                if isinstance(threshold, dict):
                    # Range threshold (e.g., demographic parity ratio)
                    if value < threshold['min'] or value > threshold['max']:
                        violated = True
                        severity = 'high' if value < 0.8 or value > 1.25 else 'medium'
                else:
                    # Single threshold
                    if value > threshold:
                        violated = True
                        severity = 'high' if value > threshold * 1.5 else 'medium'
                
                if violated:
                    violations.append({
                        'attribute': attr,
                        'metric': metric_name,
                        'value': value,
                        'threshold': threshold,
                        'severity': severity,
                        'timestamp': datetime.now()
                    })
        
        return violations
    
    def log_bias_metrics(self, model_name: str, metrics: Dict[str, Any]):
        """Log bias metrics to database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        timestamp = datetime.now()
        
        for attr, attr_metrics in metrics.items():
            for metric_name, value in attr_metrics.items():
                threshold = self.bias_thresholds.get(metric_name)
                threshold_exceeded = False
                alert_level = 'normal'
                
                if threshold is not None:
                    if isinstance(threshold, dict):
                        threshold_exceeded = value < threshold['min'] or value > threshold['max']
                    else:
                        threshold_exceeded = value > threshold
                    
                    if threshold_exceeded:
                        alert_level = 'high' if value > threshold * 1.5 else 'medium'
                
                cursor.execute('''
                    INSERT INTO bias_metrics 
                    (timestamp, model_name, metric_type, demographic_group, 
                     metric_value, threshold_exceeded, alert_level)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (timestamp, model_name, metric_name, attr, 
                      value, threshold_exceeded, alert_level))
        
        conn.commit()
        conn.close()
    
    def create_bias_dashboard(self):
        """Create Streamlit dashboard for bias monitoring"""
        st.set_page_config(
            page_title="TerraFusion AI Bias Monitoring",
            page_icon="⚖️",
            layout="wide"
        )
        
        st.title("🏛️ TerraFusion AI Ethics Dashboard")
        st.markdown("### Real-time Bias Monitoring and Fairness Analytics")
        
        # Sidebar controls
        st.sidebar.header("Dashboard Controls")
        
        # Time range selector
        time_range = st.sidebar.selectbox(
            "Time Range",
            ["Last 24 Hours", "Last 7 Days", "Last 30 Days", "Last 90 Days"]
        )
        
        # Model selector
        models = self.get_available_models()
        selected_model = st.sidebar.selectbox("Select Model", models)
        
        # Metric selector
        metrics = ['statistical_parity', 'equalized_odds', 'demographic_parity_ratio', 'calibration_error']
        selected_metrics = st.sidebar.multiselect("Select Metrics", metrics, default=metrics)
        
        # Main dashboard content
        col1, col2, col3, col4 = st.columns(4)
        
        # Key metrics
        current_metrics = self.get_current_metrics(selected_model)
        
        with col1:
            st.metric(
                "Active Alerts",
                len(self.get_active_alerts()),
                delta=None,
                delta_color="inverse"
            )
        
        with col2:
            avg_bias = np.mean([m for m in current_metrics.values() if isinstance(m, (int, float))])
            st.metric(
                "Average Bias Score",
                f"{avg_bias:.4f}",
                delta=None
            )
        
        with col3:
            compliance_rate = self.calculate_compliance_rate(selected_model)
            st.metric(
                "Compliance Rate",
                f"{compliance_rate:.1%}",
                delta=None
            )
        
        with col4:
            last_check = self.get_last_check_time()
            st.metric(
                "Last Check",
                last_check,
                delta=None
            )
        
        # Bias trends chart
        st.subheader("📊 Bias Metrics Trends")
        trend_data = self.get_trend_data(selected_model, time_range, selected_metrics)
        
        if not trend_data.empty:
            fig = self.create_trend_chart(trend_data)
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.info("No trend data available for selected parameters")
        
        # Demographic breakdown
        col1, col2 = st.columns(2)
        
        with col1:
            st.subheader("👥 Demographic Group Analysis")
            demo_data = self.get_demographic_analysis(selected_model)
            if not demo_data.empty:
                fig = self.create_demographic_chart(demo_data)
                st.plotly_chart(fig, use_container_width=True)
        
        with col2:
            st.subheader("🚨 Recent Alerts")
            alerts = self.get_recent_alerts(limit=10)
            if alerts:
                for alert in alerts:
                    severity_color = {
                        'high': '🔴',
                        'medium': '🟡',
                        'low': '⚪'
                    }.get(alert['severity'], '⚪')
                    
                    st.error(f"{severity_color} **{alert['metric']}** violation in {alert['attribute']} group - Value: {alert['value']:.4f}")
            else:
                st.success("No recent alerts")
        
        # Detailed metrics table
        st.subheader("📋 Detailed Metrics")
        detailed_metrics = self.get_detailed_metrics(selected_model)
        if not detailed_metrics.empty:
            st.dataframe(detailed_metrics, use_container_width=True)
        
        # Bias mitigation recommendations
        st.subheader("💡 Bias Mitigation Recommendations")
        recommendations = self.generate_recommendations(current_metrics)
        for rec in recommendations:
            st.info(f"**{rec['priority']}:** {rec['recommendation']}")
    
    def get_available_models(self) -> List[str]:
        """Get list of available models from database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("SELECT DISTINCT model_name FROM bias_metrics")
        models = [row[0] for row in cursor.fetchall()]
        
        conn.close()
        return models if models else ["PropertyAssessmentAI", "RiskAnalysisAI"]
    
    def get_current_metrics(self, model_name: str) -> Dict[str, float]:
        """Get current bias metrics for a model"""
        conn = sqlite3.connect(self.db_path)
        query = '''
            SELECT metric_type, AVG(metric_value) as avg_value
            FROM bias_metrics 
            WHERE model_name = ? AND timestamp >= datetime('now', '-1 day')
            GROUP BY metric_type
        '''
        df = pd.read_sql_query(query, conn, params=(model_name,))
        conn.close()
        
        if df.empty:
            return {
                'statistical_parity': 0.02,
                'equalized_odds': 0.01,
                'demographic_parity_ratio': 0.98,
                'calibration_error': 0.01
            }
        
        return dict(zip(df['metric_type'], df['avg_value']))
    
    def get_active_alerts(self) -> List[Dict[str, Any]]:
        """Get currently active bias alerts"""
        # This would typically query from an alerts table
        # For demo purposes, returning sample data
        return [
            {
                'model': 'PropertyAssessmentAI',
                'metric': 'statistical_parity',
                'severity': 'medium',
                'timestamp': datetime.now()
            }
        ]
    
    def calculate_compliance_rate(self, model_name: str) -> float:
        """Calculate model compliance rate"""
        conn = sqlite3.connect(self.db_path)
        query = '''
            SELECT 
                COUNT(*) as total_checks,
                SUM(CASE WHEN threshold_exceeded = 0 THEN 1 ELSE 0 END) as passed_checks
            FROM bias_metrics 
            WHERE model_name = ? AND timestamp >= datetime('now', '-7 days')
        '''
        cursor = conn.cursor()
        cursor.execute(query, (model_name,))
        result = cursor.fetchone()
        conn.close()
        
        if result and result[0] > 0:
            return result[1] / result[0]
        return 0.95  # Default demo value
    
    def get_last_check_time(self) -> str:
        """Get timestamp of last bias check"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT MAX(timestamp) FROM bias_metrics")
        result = cursor.fetchone()
        conn.close()
        
        if result and result[0]:
            return pd.to_datetime(result[0]).strftime("%H:%M:%S")
        return "Never"
    
    def get_trend_data(self, model_name: str, time_range: str, metrics: List[str]) -> pd.DataFrame:
        """Get trend data for visualization"""
        days_map = {
            "Last 24 Hours": 1,
            "Last 7 Days": 7,
            "Last 30 Days": 30,
            "Last 90 Days": 90
        }
        days = days_map.get(time_range, 7)
        
        conn = sqlite3.connect(self.db_path)
        query = '''
            SELECT timestamp, metric_type, AVG(metric_value) as value
            FROM bias_metrics 
            WHERE model_name = ? AND metric_type IN ({}) 
            AND timestamp >= datetime('now', '-{} days')
            GROUP BY DATE(timestamp), metric_type
            ORDER BY timestamp
        '''.format(','.join(['?'] * len(metrics)), days)
        
        params = [model_name] + metrics
        df = pd.read_sql_query(query, conn, params=params)
        conn.close()
        
        return df
    
    def create_trend_chart(self, data: pd.DataFrame) -> go.Figure:
        """Create trend chart for bias metrics"""
        fig = go.Figure()
        
        for metric in data['metric_type'].unique():
            metric_data = data[data['metric_type'] == metric]
            fig.add_trace(go.Scatter(
                x=pd.to_datetime(metric_data['timestamp']),
                y=metric_data['value'],
                mode='lines+markers',
                name=metric.replace('_', ' ').title(),
                line=dict(width=2)
            ))
        
        # Add threshold lines
        for metric, threshold in self.bias_thresholds.items():
            if isinstance(threshold, dict):
                fig.add_hline(y=threshold['min'], line_dash="dash", 
                             annotation_text=f"{metric} min threshold")
                fig.add_hline(y=threshold['max'], line_dash="dash", 
                             annotation_text=f"{metric} max threshold")
            else:
                fig.add_hline(y=threshold, line_dash="dash", 
                             annotation_text=f"{metric} threshold")
        
        fig.update_layout(
            title="Bias Metrics Over Time",
            xaxis_title="Time",
            yaxis_title="Metric Value",
            hovermode='x unified'
        )
        
        return fig
    
    def get_demographic_analysis(self, model_name: str) -> pd.DataFrame:
        """Get demographic group analysis data"""
        # Sample data for demonstration
        return pd.DataFrame({
            'demographic_group': ['Race_White', 'Race_Black', 'Race_Hispanic', 'Race_Asian'],
            'statistical_parity': [0.02, 0.04, 0.03, 0.01],
            'equalized_odds': [0.01, 0.03, 0.02, 0.01]
        })
    
    def create_demographic_chart(self, data: pd.DataFrame) -> go.Figure:
        """Create demographic analysis chart"""
        fig = go.Figure()
        
        fig.add_trace(go.Bar(
            name='Statistical Parity',
            x=data['demographic_group'],
            y=data['statistical_parity'],
            marker_color='lightblue'
        ))
        
        fig.add_trace(go.Bar(
            name='Equalized Odds',
            x=data['demographic_group'],
            y=data['equalized_odds'],
            marker_color='lightcoral'
        ))
        
        fig.update_layout(
            title="Bias Metrics by Demographic Group",
            xaxis_title="Demographic Group",
            yaxis_title="Bias Score",
            barmode='group'
        )
        
        return fig
    
    def get_recent_alerts(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get recent bias alerts"""
        # Sample alerts for demonstration
        return [
            {
                'metric': 'Statistical Parity',
                'attribute': 'Race',
                'value': 0.06,
                'severity': 'medium',
                'timestamp': datetime.now() - timedelta(hours=2)
            }
        ]
    
    def get_detailed_metrics(self, model_name: str) -> pd.DataFrame:
        """Get detailed metrics table"""
        conn = sqlite3.connect(self.db_path)
        query = '''
            SELECT 
                demographic_group,
                metric_type,
                AVG(metric_value) as avg_value,
                MAX(metric_value) as max_value,
                MIN(metric_value) as min_value,
                COUNT(*) as measurement_count
            FROM bias_metrics 
            WHERE model_name = ? AND timestamp >= datetime('now', '-7 days')
            GROUP BY demographic_group, metric_type
            ORDER BY demographic_group, metric_type
        '''
        df = pd.read_sql_query(query, conn, params=(model_name,))
        conn.close()
        
        if df.empty:
            # Return sample data for demonstration
            return pd.DataFrame({
                'Demographic Group': ['Race_White', 'Race_Black', 'Age_Young', 'Age_Old'],
                'Metric Type': ['statistical_parity', 'statistical_parity', 'equalized_odds', 'equalized_odds'],
                'Average Value': [0.02, 0.04, 0.01, 0.03],
                'Status': ['✅ Compliant', '⚠️ Warning', '✅ Compliant', '⚠️ Warning']
            })
        
        return df
    
    def generate_recommendations(self, metrics: Dict[str, float]) -> List[Dict[str, str]]:
        """Generate bias mitigation recommendations"""
        recommendations = []
        
        for metric, value in metrics.items():
            threshold = self.bias_thresholds.get(metric)
            if threshold is None:
                continue
            
            violated = False
            if isinstance(threshold, dict):
                violated = value < threshold['min'] or value > threshold['max']
            else:
                violated = value > threshold
            
            if violated:
                if metric == 'statistical_parity':
                    recommendations.append({
                        'priority': 'HIGH',
                        'recommendation': 'Consider rebalancing training data or applying demographic parity constraints during model training.'
                    })
                elif metric == 'equalized_odds':
                    recommendations.append({
                        'priority': 'HIGH',
                        'recommendation': 'Review model features for disparate impact and consider post-processing calibration.'
                    })
                elif metric == 'calibration_error':
                    recommendations.append({
                        'priority': 'MEDIUM',
                        'recommendation': 'Apply group-specific calibration or threshold adjustment techniques.'
                    })
        
        if not recommendations:
            recommendations.append({
                'priority': 'INFO',
                'recommendation': 'All bias metrics are within acceptable thresholds. Continue regular monitoring.'
            })
        
        return recommendations

def main():
    """Main application entry point"""
    dashboard = BiasMonitoringDashboard()
    
    # Generate sample data for demonstration
    if st.sidebar.button("Generate Sample Data"):
        dashboard.generate_sample_data()
        st.success("Sample data generated successfully!")
    
    dashboard.create_bias_dashboard()

if __name__ == "__main__":
    main()