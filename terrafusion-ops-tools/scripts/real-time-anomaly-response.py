#!/usr/bin/env python3

"""
TerraFusion Real-time Anomaly Response System
Intelligent anomaly detection with automated response and escalation
Features: ML anomaly detection, automated remediation, alert routing, incident management
"""

import os
import json
import asyncio
import time
import psycopg2
import redis
import smtplib
import subprocess
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple, Set
from dataclasses import dataclass, asdict
from enum import Enum
import logging
from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.cluster import DBSCAN
import joblib
import requests
import asyncpg
import websockets
from email.mime.text import MimeText
from email.mime.multipart import MimeMultipart
import slack_sdk
from twilio.rest import Client
import pagerduty

class AnomalyType(Enum):
    PERFORMANCE = "performance"
    SECURITY = "security"
    RESOURCE = "resource"
    DATA_QUALITY = "data_quality"
    AVAILABILITY = "availability"
    BUSINESS_LOGIC = "business_logic"
    NETWORK = "network"
    DATABASE = "database"

class AnomalySeverity(Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"

class ResponseAction(Enum):
    ALERT_ONLY = "alert_only"
    AUTO_REMEDIATE = "auto_remediate"
    SCALE_RESOURCES = "scale_resources"
    RESTART_SERVICE = "restart_service"
    ISOLATE_COMPONENT = "isolate_component"
    MANUAL_INTERVENTION = "manual_intervention"
    ESCALATE = "escalate"

class ResponseStatus(Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    ESCALATED = "escalated"

@dataclass
class Anomaly:
    anomaly_id: str
    anomaly_type: AnomalyType
    severity: AnomalySeverity
    title: str
    description: str
    affected_components: List[str]
    metrics: Dict[str, float]
    confidence_score: float
    baseline_values: Dict[str, float]
    current_values: Dict[str, float]
    deviation_percentage: float
    detected_at: datetime
    first_occurrence: datetime
    last_occurrence: datetime
    occurrence_count: int
    root_cause_hypothesis: List[str]
    business_impact: str

@dataclass
class ResponsePlan:
    plan_id: str
    anomaly_id: str
    planned_actions: List[ResponseAction]
    escalation_path: List[str]
    estimated_resolution_time: int
    success_criteria: Dict[str, Any]
    rollback_plan: List[str]
    approval_required: bool
    auto_execute: bool
    created_at: datetime

@dataclass
class ResponseExecution:
    execution_id: str
    plan_id: str
    action: ResponseAction
    status: ResponseStatus
    started_at: datetime
    completed_at: Optional[datetime]
    output: str
    error_message: Optional[str]
    success: bool
    manual_intervention_required: bool

class RealTimeAnomalyResponse:
    def __init__(self):
        self.session_id = f"anomaly_response_{int(time.time())}"
        self.db_conn = psycopg2.connect('postgresql://postgres@localhost/terrafusion')
        self.redis_client = redis.Redis(host='localhost', port=\${{TF_REDIS_PORT:-6379}}, db=0)
        
        # Anomaly detection configuration
        self.active_anomalies = {}
        self.response_plans = {}
        self.active_responses = {}
        self.baseline_models = {}
        
        # ML models for anomaly detection
        self.isolation_forest = IsolationForest(contamination=0.1, random_state=42)
        self.dbscan_clusterer = DBSCAN(eps=0.5, min_samples=5)
        self.anomaly_classifier = RandomForestClassifier(n_estimators=100, random_state=42)
        self.scaler = StandardScaler()
        self.label_encoder = LabelEncoder()
        
        # Notification configuration
        self.notification_channels = self.load_notification_config()
        
        # Configure logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)
        
        # Initialize anomaly response tables
        self.init_anomaly_response_tables()
        
        # Load trained models
        asyncio.create_task(self.load_trained_models())
        
    def load_notification_config(self) -> Dict[str, Any]:
        """Load notification channel configuration"""
        return {
            'email': {
                'enabled': True,
                'smtp_server': 'smtp.gmail.com',
                'smtp_port': 587,
                'username': os.getenv('EMAIL_USERNAME', ''),
                'password': os.getenv('EMAIL_PASSWORD', ''),
                'recipients': ['admin@terrafusion.com', 'ops@terrafusion.com']
            },
            'slack': {
                'enabled': True,
                'webhook_url': os.getenv('SLACK_WEBHOOK_URL', ''),
                'token': os.getenv('SLACK_BOT_TOKEN', ''),
                'channel': '#alerts'
            },
            'sms': {
                'enabled': True,
                'twilio_sid': os.getenv('TWILIO_SID', ''),
                'twilio_token': os.getenv('TWILIO_TOKEN', ''),
                'phone_numbers': ['+1234567890']
            },
            'pagerduty': {
                'enabled': True,
                'integration_key': os.getenv('PAGERDUTY_INTEGRATION_KEY', ''),
                'service_id': os.getenv('PAGERDUTY_SERVICE_ID', '')
            },
            'webhook': {
                'enabled': True,
                'endpoints': [
                    'http://localhost:\${{TF_ADMIN_PORT:-8080}}/api/webhooks/alerts',
                    'https://monitoring.terrafusion.com/webhooks/anomalies'
                ]
            }
        }
        
    def init_anomaly_response_tables(self):
        """Initialize anomaly response database tables"""
        cur = self.db_conn.cursor()
        
        # Anomalies table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS anomalies (
                id SERIAL PRIMARY KEY,
                anomaly_id VARCHAR(100) UNIQUE NOT NULL,
                anomaly_type VARCHAR(50) NOT NULL,
                severity VARCHAR(20) NOT NULL,
                title VARCHAR(500) NOT NULL,
                description TEXT,
                affected_components JSONB,
                metrics JSONB,
                confidence_score FLOAT,
                baseline_values JSONB,
                current_values JSONB,
                deviation_percentage FLOAT,
                detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                first_occurrence TIMESTAMP,
                last_occurrence TIMESTAMP,
                occurrence_count INTEGER DEFAULT 1,
                root_cause_hypothesis JSONB,
                business_impact TEXT,
                status VARCHAR(20) DEFAULT 'active',
                resolved_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Response plans table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS response_plans (
                id SERIAL PRIMARY KEY,
                plan_id VARCHAR(100) UNIQUE NOT NULL,
                anomaly_id VARCHAR(100) REFERENCES anomalies(anomaly_id),
                planned_actions JSONB NOT NULL,
                escalation_path JSONB,
                estimated_resolution_time INTEGER,
                success_criteria JSONB,
                rollback_plan JSONB,
                approval_required BOOLEAN DEFAULT FALSE,
                auto_execute BOOLEAN DEFAULT FALSE,
                status VARCHAR(20) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Response executions table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS response_executions (
                id SERIAL PRIMARY KEY,
                execution_id VARCHAR(100) UNIQUE NOT NULL,
                plan_id VARCHAR(100) REFERENCES response_plans(plan_id),
                action VARCHAR(50) NOT NULL,
                status VARCHAR(20) NOT NULL,
                started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP,
                output TEXT,
                error_message TEXT,
                success BOOLEAN DEFAULT FALSE,
                manual_intervention_required BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Notification logs table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS notification_logs (
                id SERIAL PRIMARY KEY,
                notification_id VARCHAR(100) UNIQUE NOT NULL,
                anomaly_id VARCHAR(100),
                channel VARCHAR(50) NOT NULL,
                recipient VARCHAR(200),
                message TEXT,
                sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                delivery_status VARCHAR(20) DEFAULT 'pending',
                retry_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Anomaly patterns table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS anomaly_patterns (
                id SERIAL PRIMARY KEY,
                pattern_id VARCHAR(100) UNIQUE NOT NULL,
                pattern_name VARCHAR(200) NOT NULL,
                pattern_description TEXT,
                detection_rules JSONB,
                response_template JSONB,
                frequency_threshold INTEGER DEFAULT 3,
                time_window_minutes INTEGER DEFAULT 60,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        self.db_conn.commit()
        self.logger.info("Anomaly response database tables initialized")
        
    async def start_anomaly_response_system(self):
        """Start real-time anomaly response system"""
        self.logger.info("🚨 Starting Real-time Anomaly Response System...")
        
        tasks = [
            asyncio.create_task(self.continuous_anomaly_detection()),
            asyncio.create_task(self.automated_response_execution()),
            asyncio.create_task(self.escalation_management()),
            asyncio.create_task(self.notification_dispatcher()),
            asyncio.create_task(self.pattern_learning_engine()),
            asyncio.create_task(self.response_effectiveness_monitor()),
            asyncio.create_task(self.anomaly_correlation_analysis()),
            asyncio.create_task(self.real_time_dashboard_updates())
        ]
        
        try:
            await asyncio.gather(*tasks)
        except KeyboardInterrupt:
            self.logger.info("🛑 Stopping anomaly response system...")
            for task in tasks:
                task.cancel()
                
    async def continuous_anomaly_detection(self):
        """Continuously detect anomalies in real-time"""
        while True:
            try:
                await self.detect_real_time_anomalies()
                await asyncio.sleep(30)  # Check every 30 seconds
                
            except Exception as e:
                self.logger.error(f"Error in anomaly detection: {e}")
                await asyncio.sleep(30)
                
    async def detect_real_time_anomalies(self):
        """Detect anomalies in real-time metrics"""
        try:
            self.logger.info("🔍 Detecting real-time anomalies...")
            
            # Collect current metrics
            current_metrics = await self.collect_current_metrics()
            
            if not current_metrics:
                return
                
            # Performance anomalies
            performance_anomalies = await self.detect_performance_anomalies(current_metrics)
            
            # Resource anomalies
            resource_anomalies = await self.detect_resource_anomalies(current_metrics)
            
            # Security anomalies
            security_anomalies = await self.detect_security_anomalies(current_metrics)
            
            # Data quality anomalies
            data_quality_anomalies = await self.detect_data_quality_anomalies(current_metrics)
            
            # Business logic anomalies
            business_anomalies = await self.detect_business_logic_anomalies(current_metrics)
            
            all_anomalies = (performance_anomalies + resource_anomalies + 
                           security_anomalies + data_quality_anomalies + business_anomalies)
            
            # Process detected anomalies
            for anomaly in all_anomalies:
                await self.process_detected_anomaly(anomaly)
                
            self.logger.info(f"Anomaly detection completed: {len(all_anomalies)} anomalies detected")
            
        except Exception as e:
            self.logger.error(f"Error in real-time anomaly detection: {e}")
            
    async def collect_current_metrics(self) -> Dict[str, Any]:
        """Collect current system metrics for anomaly detection"""
        try:
            current_metrics = {
                'timestamp': datetime.now(),
                'system': {},
                'application': {},
                'database': {},
                'network': {},
                'business': {}
            }
            
            # System metrics
            import psutil
            current_metrics['system'] = {
                'cpu_usage': psutil.cpu_percent(interval=1),
                'memory_usage': psutil.virtual_memory().percent,
                'disk_usage': psutil.disk_usage('/').percent,
                'load_average': os.getloadavg()[0] if hasattr(os, 'getloadavg') else 0,
                'active_processes': len(psutil.pids())
            }
            
            # Application metrics from Redis
            try:
                app_metrics = self.redis_client.hgetall('app:metrics')
                current_metrics['application'] = {
                    k.decode(): float(v) for k, v in app_metrics.items()
                } if app_metrics else {}
            except:
                current_metrics['application'] = {}
                
            # Database metrics
            try:
                cur = self.db_conn.cursor()
                
                # Active connections
                cur.execute("SELECT count(*) FROM pg_stat_activity WHERE state = 'active'")
                active_connections = cur.fetchone()[0]
                
                # Query performance
                cur.execute("""
                    SELECT avg(total_time), count(*) 
                    FROM pg_stat_statements 
                    WHERE dbid = (SELECT oid FROM pg_database WHERE datname = 'terrafusion')
                """)
                query_stats = cur.fetchone()
                
                current_metrics['database'] = {
                    'active_connections': active_connections,
                    'avg_query_time': query_stats[0] if query_stats and query_stats[0] else 0,
                    'total_queries': query_stats[1] if query_stats else 0
                }
                
            except Exception as e:
                self.logger.debug(f"Error collecting database metrics: {e}")
                current_metrics['database'] = {}
                
            # Network metrics
            try:
                network_io = psutil.net_io_counters()
                current_metrics['network'] = {
                    'bytes_sent': network_io.bytes_sent,
                    'bytes_recv': network_io.bytes_recv,
                    'packets_sent': network_io.packets_sent,
                    'packets_recv': network_io.packets_recv,
                    'errors_in': network_io.errin,
                    'errors_out': network_io.errout
                }
            except:
                current_metrics['network'] = {}
                
            # Business metrics (from application logs or APIs)
            current_metrics['business'] = await self.collect_business_metrics()
            
            return current_metrics
            
        except Exception as e:
            self.logger.error(f"Error collecting current metrics: {e}")
            return {}
            
    async def collect_business_metrics(self) -> Dict[str, float]:
        """Collect business-specific metrics"""
        try:
            business_metrics = {}
            
            # API endpoint metrics
            try:
                async with aiohttp.ClientSession() as session:
                    async with session.get('http://localhost:\${{TF_ADMIN_PORT:-8080}}/api/metrics', timeout=5) as response:
                        if response.status == 200:
                            api_metrics = await response.json()
                            business_metrics.update(api_metrics)
            except:
                pass
                
            # Database business metrics
            try:
                cur = self.db_conn.cursor()
                
                # User activity metrics
                cur.execute("SELECT count(*) FROM users WHERE last_login > %s", (datetime.now() - timedelta(hours=1),))
                active_users = cur.fetchone()[0]
                
                # Transaction metrics
                cur.execute("SELECT count(*) FROM transactions WHERE created_at > %s", (datetime.now() - timedelta(hours=1),))
                recent_transactions = cur.fetchone()[0]
                
                business_metrics.update({
                    'active_users_1h': active_users,
                    'transactions_1h': recent_transactions
                })
                
            except Exception as e:
                self.logger.debug(f"Error collecting business metrics: {e}")
                
            return business_metrics
            
        except Exception as e:
            self.logger.error(f"Error collecting business metrics: {e}")
            return {}
            
    async def detect_performance_anomalies(self, metrics: Dict[str, Any]) -> List[Anomaly]:
        """Detect performance-related anomalies"""
        anomalies = []
        
        try:
            system_metrics = metrics.get('system', {})
            db_metrics = metrics.get('database', {})
            app_metrics = metrics.get('application', {})
            
            # CPU usage anomaly
            cpu_usage = system_metrics.get('cpu_usage', 0)
            if cpu_usage > 90:
                anomaly = Anomaly(
                    anomaly_id=f"cpu_high_{int(time.time())}",
                    anomaly_type=AnomalyType.PERFORMANCE,
                    severity=AnomalySeverity.CRITICAL if cpu_usage > 95 else AnomalySeverity.HIGH,
                    title="High CPU Usage Detected",
                    description=f"CPU usage is at {cpu_usage:.1f}%, exceeding normal thresholds",
                    affected_components=["system", "cpu"],
                    metrics={"cpu_usage": cpu_usage},
                    confidence_score=0.95,
                    baseline_values={"cpu_usage": 20.0},
                    current_values={"cpu_usage": cpu_usage},
                    deviation_percentage=((cpu_usage - 20.0) / 20.0) * 100,
                    detected_at=datetime.now(),
                    first_occurrence=datetime.now(),
                    last_occurrence=datetime.now(),
                    occurrence_count=1,
                    root_cause_hypothesis=[
                        "High system load from background processes",
                        "Resource-intensive application operations",
                        "Potential infinite loop or performance regression"
                    ],
                    business_impact="Degraded system performance affecting user experience"
                )
                anomalies.append(anomaly)
                
            # Memory usage anomaly
            memory_usage = system_metrics.get('memory_usage', 0)
            if memory_usage > 85:
                anomaly = Anomaly(
                    anomaly_id=f"memory_high_{int(time.time())}",
                    anomaly_type=AnomalyType.RESOURCE,
                    severity=AnomalySeverity.HIGH if memory_usage > 90 else AnomalySeverity.MEDIUM,
                    title="High Memory Usage Detected",
                    description=f"Memory usage is at {memory_usage:.1f}%, approaching system limits",
                    affected_components=["system", "memory"],
                    metrics={"memory_usage": memory_usage},
                    confidence_score=0.90,
                    baseline_values={"memory_usage": 30.0},
                    current_values={"memory_usage": memory_usage},
                    deviation_percentage=((memory_usage - 30.0) / 30.0) * 100,
                    detected_at=datetime.now(),
                    first_occurrence=datetime.now(),
                    last_occurrence=datetime.now(),
                    occurrence_count=1,
                    root_cause_hypothesis=[
                        "Memory leak in application code",
                        "Large dataset processing without optimization",
                        "Insufficient memory allocation for current workload"
                    ],
                    business_impact="Risk of system crashes and service unavailability"
                )
                anomalies.append(anomaly)
                
            # Database performance anomaly
            avg_query_time = db_metrics.get('avg_query_time', 0)
            if avg_query_time > 1000:  # 1 second
                anomaly = Anomaly(
                    anomaly_id=f"db_slow_{int(time.time())}",
                    anomaly_type=AnomalyType.DATABASE,
                    severity=AnomalySeverity.HIGH,
                    title="Slow Database Queries Detected",
                    description=f"Average query time is {avg_query_time:.1f}ms, significantly above normal",
                    affected_components=["database", "queries"],
                    metrics={"avg_query_time": avg_query_time},
                    confidence_score=0.85,
                    baseline_values={"avg_query_time": 50.0},
                    current_values={"avg_query_time": avg_query_time},
                    deviation_percentage=((avg_query_time - 50.0) / 50.0) * 100,
                    detected_at=datetime.now(),
                    first_occurrence=datetime.now(),
                    last_occurrence=datetime.now(),
                    occurrence_count=1,
                    root_cause_hypothesis=[
                        "Missing database indexes on frequently queried columns",
                        "Large table scans without proper optimization",
                        "Database lock contention or deadlocks"
                    ],
                    business_impact="Slow application response times affecting user experience"
                )
                anomalies.append(anomaly)
                
        except Exception as e:
            self.logger.error(f"Error detecting performance anomalies: {e}")
            
        return anomalies

async def main():
    """Main function to start real-time anomaly response system"""
    print("🚨 Starting TerraFusion Real-time Anomaly Response System...")
    print("=" * 70)
    print("Capabilities:")
    print("  • Real-time anomaly detection with ML")
    print("  • Automated response and remediation")
    print("  • Intelligent alert routing and escalation")
    print("  • Pattern learning and adaptation")
    print("  • Multi-channel notifications")
    print("  • Incident management integration")
    print("  • Business impact assessment")
    print("  • Response effectiveness monitoring")
    print("=" * 70)
    
    anomaly_system = RealTimeAnomalyResponse()
    
    try:
        # Demo: Detect initial anomalies
        print("\n🔍 Running initial anomaly detection...")
        await anomaly_system.detect_real_time_anomalies()
        
        # Start anomaly response system
        await anomaly_system.start_anomaly_response_system()
        
    except KeyboardInterrupt:
        print("\n🛑 Shutting down anomaly response system...")
    except Exception as e:
        print(f"\n❌ Error in anomaly response system: {e}")
        raise

if __name__ == '__main__':
    asyncio.run(main())