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
                    if value < threshold['min'] or value > threshold['max']:
                        violated = True
                        severity = 'high' if value < 0.8 or value > 1.25 else 'medium'
                else:
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


def main():
    """Main application entry point"""
    dashboard = BiasMonitoringDashboard()
    dashboard.create_bias_dashboard()

if __name__ == "__main__":
    main()
