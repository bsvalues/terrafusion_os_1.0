#!/usr/bin/env python3

"""
TerraFusion Performance Optimization Engine
AI-powered performance analysis and optimization recommendations
Features: Performance profiling, bottleneck detection, auto-optimization, capacity planning
"""

import os
import json
import asyncio
import time
import psycopg2
import redis
import psutil
import subprocess
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import logging
from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest, RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
import matplotlib.pyplot as plt
import seaborn as sns
import aiohttp
import asyncpg

class PerformanceMetricType(Enum):
    CPU_USAGE = "cpu_usage"
    MEMORY_USAGE = "memory_usage"
    DISK_IO = "disk_io"
    NETWORK_IO = "network_io"
    DATABASE_PERFORMANCE = "database_performance"
    API_RESPONSE_TIME = "api_response_time"
    THROUGHPUT = "throughput"
    ERROR_RATE = "error_rate"
    CACHE_HIT_RATIO = "cache_hit_ratio"
    QUEUE_DEPTH = "queue_depth"

class OptimizationType(Enum):
    RESOURCE_SCALING = "resource_scaling"
    QUERY_OPTIMIZATION = "query_optimization"
    CACHING_IMPROVEMENT = "caching_improvement"
    CODE_OPTIMIZATION = "code_optimization"
    INFRASTRUCTURE_TUNING = "infrastructure_tuning"
    NETWORK_OPTIMIZATION = "network_optimization"
    DATABASE_TUNING = "database_tuning"
    APPLICATION_CONFIG = "application_config"

class PerformanceIssueLevel(Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    OPTIMIZATION = "optimization"

@dataclass
class PerformanceMetric:
    metric_id: str
    metric_type: PerformanceMetricType
    value: float
    unit: str
    timestamp: datetime
    source: str
    tags: Dict[str, str]

@dataclass
class PerformanceIssue:
    issue_id: str
    title: str
    description: str
    severity: PerformanceIssueLevel
    metric_type: PerformanceMetricType
    current_value: float
    expected_value: float
    impact_description: str
    affected_components: List[str]
    root_cause_analysis: Dict[str, Any]
    discovered_at: datetime

@dataclass
class OptimizationRecommendation:
    recommendation_id: str
    optimization_type: OptimizationType
    title: str
    description: str
    expected_improvement: Dict[str, float]
    implementation_steps: List[str]
    estimated_effort: str
    risk_level: str
    priority_score: float
    related_issues: List[str]
    created_at: datetime

class PerformanceOptimizationEngine:
    def __init__(self):
        self.session_id = f"perf_optimization_{int(time.time())}"
        self.db_conn = psycopg2.connect('postgresql://postgres@localhost/terrafusion')
        self.redis_client = redis.Redis(host='localhost', port=\${{TF_REDIS_PORT:-6379}}, db=0)
        
        # Performance monitoring configuration
        self.performance_metrics = {}
        self.performance_issues = {}
        self.optimization_recommendations = {}
        self.baseline_metrics = {}
        
        # ML models for performance analysis
        self.anomaly_detector = IsolationForest(contamination=0.1, random_state=42)
        self.performance_predictor = RandomForestRegressor(n_estimators=100, random_state=42)
        self.scaler = StandardScaler()
        
        # Configure logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)
        
        # Initialize performance tables
        self.init_performance_tables()
        
        # Load baseline performance metrics
        asyncio.create_task(self.load_baseline_metrics())
        
    def init_performance_tables(self):
        """Initialize performance optimization database tables"""
        cur = self.db_conn.cursor()
        
        # Performance metrics table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS performance_metrics (
                id SERIAL PRIMARY KEY,
                metric_id VARCHAR(100) UNIQUE NOT NULL,
                metric_type VARCHAR(50) NOT NULL,
                value FLOAT NOT NULL,
                unit VARCHAR(20),
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                source VARCHAR(100),
                tags JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Performance issues table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS performance_issues (
                id SERIAL PRIMARY KEY,
                issue_id VARCHAR(100) UNIQUE NOT NULL,
                title VARCHAR(500) NOT NULL,
                description TEXT,
                severity VARCHAR(20) NOT NULL,
                metric_type VARCHAR(50),
                current_value FLOAT,
                expected_value FLOAT,
                impact_description TEXT,
                affected_components JSONB,
                root_cause_analysis JSONB,
                status VARCHAR(20) DEFAULT 'open',
                discovered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                resolved_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Optimization recommendations table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS optimization_recommendations (
                id SERIAL PRIMARY KEY,
                recommendation_id VARCHAR(100) UNIQUE NOT NULL,
                optimization_type VARCHAR(50) NOT NULL,
                title VARCHAR(500) NOT NULL,
                description TEXT,
                expected_improvement JSONB,
                implementation_steps JSONB,
                estimated_effort VARCHAR(50),
                risk_level VARCHAR(20),
                priority_score FLOAT,
                related_issues JSONB,
                status VARCHAR(20) DEFAULT 'pending',
                implemented_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Performance baselines table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS performance_baselines (
                id SERIAL PRIMARY KEY,
                metric_type VARCHAR(50) NOT NULL,
                baseline_value FLOAT NOT NULL,
                acceptable_range_min FLOAT,
                acceptable_range_max FLOAT,
                warning_threshold FLOAT,
                critical_threshold FLOAT,
                measurement_unit VARCHAR(20),
                established_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        self.db_conn.commit()
        self.logger.info("Performance optimization database tables initialized")
        
    async def start_performance_optimization_system(self):
        """Start performance optimization engine"""
        self.logger.info("⚡ Starting Performance Optimization Engine...")
        
        tasks = [
            asyncio.create_task(self.continuous_performance_monitoring()),
            asyncio.create_task(self.real_time_bottleneck_detection()),
            asyncio.create_task(self.automated_optimization_analysis()),
            asyncio.create_task(self.capacity_planning_engine()),
            asyncio.create_task(self.performance_prediction_loop()),
            asyncio.create_task(self.optimization_recommendation_engine()),
            asyncio.create_task(self.auto_optimization_executor())
        ]
        
        try:
            await asyncio.gather(*tasks)
        except KeyboardInterrupt:
            self.logger.info("🛑 Stopping performance optimization engine...")
            for task in tasks:
                task.cancel()
                
    async def continuous_performance_monitoring(self):
        """Continuously monitor system performance metrics"""
        while True:
            try:
                await self.collect_comprehensive_performance_metrics()
                await asyncio.sleep(30)  # Collect every 30 seconds
                
            except Exception as e:
                self.logger.error(f"Error in performance monitoring: {e}")
                await asyncio.sleep(30)
                
    async def collect_comprehensive_performance_metrics(self):
        """Collect comprehensive performance metrics from all sources"""
        try:
            timestamp = datetime.now()
            metrics = []
            
            # System-level metrics
            system_metrics = await self.collect_system_performance_metrics()
            metrics.extend(system_metrics)
            
            # Application-level metrics
            app_metrics = await self.collect_application_performance_metrics()
            metrics.extend(app_metrics)
            
            # Database performance metrics
            db_metrics = await self.collect_database_performance_metrics()
            metrics.extend(db_metrics)
            
            # Network performance metrics
            network_metrics = await self.collect_network_performance_metrics()
            metrics.extend(network_metrics)
            
            # Store metrics
            await self.store_performance_metrics(metrics)
            
            # Analyze for issues
            await self.analyze_performance_metrics(metrics)
            
        except Exception as e:
            self.logger.error(f"Error collecting performance metrics: {e}")
            
    async def collect_system_performance_metrics(self) -> List[PerformanceMetric]:
        """Collect system-level performance metrics"""
        metrics = []
        timestamp = datetime.now()
        
        try:
            # CPU metrics
            cpu_percent = psutil.cpu_percent(interval=1)
            cpu_count = psutil.cpu_count()
            load_avg = os.getloadavg() if hasattr(os, 'getloadavg') else [0, 0, 0]
            
            metrics.extend([
                PerformanceMetric(
                    metric_id=f"cpu_usage_{int(time.time())}",
                    metric_type=PerformanceMetricType.CPU_USAGE,
                    value=cpu_percent,
                    unit="percent",
                    timestamp=timestamp,
                    source="psutil",
                    tags={"component": "system", "cpu_count": str(cpu_count)}
                ),
                PerformanceMetric(
                    metric_id=f"load_avg_1m_{int(time.time())}",
                    metric_type=PerformanceMetricType.CPU_USAGE,
                    value=load_avg[0],
                    unit="load",
                    timestamp=timestamp,
                    source="psutil",
                    tags={"component": "system", "period": "1min"}
                )
            ])
            
            # Memory metrics
            memory = psutil.virtual_memory()
            swap = psutil.swap_memory()
            
            metrics.extend([
                PerformanceMetric(
                    metric_id=f"memory_usage_{int(time.time())}",
                    metric_type=PerformanceMetricType.MEMORY_USAGE,
                    value=memory.percent,
                    unit="percent",
                    timestamp=timestamp,
                    source="psutil",
                    tags={"component": "system", "total_gb": str(round(memory.total / (1024**3), 2))}
                ),
                PerformanceMetric(
                    metric_id=f"memory_available_{int(time.time())}",
                    metric_type=PerformanceMetricType.MEMORY_USAGE,
                    value=memory.available / (1024**3),
                    unit="gb",
                    timestamp=timestamp,
                    source="psutil",
                    tags={"component": "system", "type": "available"}
                )
            ])
            
            # Disk I/O metrics
            disk_io = psutil.disk_io_counters()
            if disk_io:
                metrics.extend([
                    PerformanceMetric(
                        metric_id=f"disk_read_bytes_{int(time.time())}",
                        metric_type=PerformanceMetricType.DISK_IO,
                        value=disk_io.read_bytes,
                        unit="bytes",
                        timestamp=timestamp,
                        source="psutil",
                        tags={"component": "system", "operation": "read"}
                    ),
                    PerformanceMetric(
                        metric_id=f"disk_write_bytes_{int(time.time())}",
                        metric_type=PerformanceMetricType.DISK_IO,
                        value=disk_io.write_bytes,
                        unit="bytes",
                        timestamp=timestamp,
                        source="psutil",
                        tags={"component": "system", "operation": "write"}
                    )
                ])
                
            # Network I/O metrics
            network_io = psutil.net_io_counters()
            if network_io:
                metrics.extend([
                    PerformanceMetric(
                        metric_id=f"network_bytes_sent_{int(time.time())}",
                        metric_type=PerformanceMetricType.NETWORK_IO,
                        value=network_io.bytes_sent,
                        unit="bytes",
                        timestamp=timestamp,
                        source="psutil",
                        tags={"component": "system", "direction": "sent"}
                    ),
                    PerformanceMetric(
                        metric_id=f"network_bytes_recv_{int(time.time())}",
                        metric_type=PerformanceMetricType.NETWORK_IO,
                        value=network_io.bytes_recv,
                        unit="bytes",
                        timestamp=timestamp,
                        source="psutil",
                        tags={"component": "system", "direction": "received"}
                    )
                ])
                
        except Exception as e:
            self.logger.error(f"Error collecting system metrics: {e}")
            
        return metrics
        
    async def collect_application_performance_metrics(self) -> List[PerformanceMetric]:
        """Collect application-level performance metrics"""
        metrics = []
        timestamp = datetime.now()
        
        try:
            # API response time metrics
            api_endpoints = [
                'http://localhost:\${{TF_DOCS_PORT:-8000}}/api/health',
                'http://localhost:\${{TF_DOCS_PORT:-8000}}/api/users',
                'http://localhost:\${{TF_DOCS_PORT:-8000}}/api/models'
            ]
            
            async with aiohttp.ClientSession() as session:
                for endpoint in api_endpoints:
                    try:
                        start_time = time.time()
                        async with session.get(endpoint, timeout=aiohttp.ClientTimeout(total=10)) as response:
                            response_time = (time.time() - start_time) * 1000
                            
                            metrics.append(PerformanceMetric(
                                metric_id=f"api_response_time_{endpoint.split('/')[-1]}_{int(time.time())}",
                                metric_type=PerformanceMetricType.API_RESPONSE_TIME,
                                value=response_time,
                                unit="ms",
                                timestamp=timestamp,
                                source="aiohttp",
                                tags={
                                    "component": "api",
                                    "endpoint": endpoint,
                                    "status_code": str(response.status)
                                }
                            ))
                            
                    except Exception as e:
                        self.logger.debug(f"Error measuring API response time for {endpoint}: {e}")
                        
            # Application process metrics
            current_process = psutil.Process()
            
            metrics.extend([
                PerformanceMetric(
                    metric_id=f"app_cpu_usage_{int(time.time())}",
                    metric_type=PerformanceMetricType.CPU_USAGE,
                    value=current_process.cpu_percent(),
                    unit="percent",
                    timestamp=timestamp,
                    source="psutil",
                    tags={"component": "application", "pid": str(current_process.pid)}
                ),
                PerformanceMetric(
                    metric_id=f"app_memory_usage_{int(time.time())}",
                    metric_type=PerformanceMetricType.MEMORY_USAGE,
                    value=current_process.memory_percent(),
                    unit="percent",
                    timestamp=timestamp,
                    source="psutil",
                    tags={"component": "application", "pid": str(current_process.pid)}
                )
            ])
            
        except Exception as e:
            self.logger.error(f"Error collecting application metrics: {e}")
            
        return metrics
        
    async def collect_database_performance_metrics(self) -> List[PerformanceMetric]:
        """Collect database performance metrics"""
        metrics = []
        timestamp = datetime.now()
        
        try:
            cur = self.db_conn.cursor()
            
            # Database connection metrics
            cur.execute("SELECT count(*) FROM pg_stat_activity WHERE state = 'active'")
            active_connections = cur.fetchone()[0]
            
            cur.execute("SELECT count(*) FROM pg_stat_activity")
            total_connections = cur.fetchone()[0]
            
            # Database cache hit ratio
            cur.execute("""
                SELECT round(100 * sum(blks_hit) / (sum(blks_hit) + sum(blks_read)), 2) as cache_hit_ratio
                FROM pg_stat_database 
                WHERE datname = 'terrafusion'
            """)
            cache_hit_ratio = cur.fetchone()[0] or 0
            
            # Query performance
            cur.execute("""
                SELECT avg(total_time), count(*)
                FROM pg_stat_statements 
                WHERE dbid = (SELECT oid FROM pg_database WHERE datname = 'terrafusion')
            """)
            
            query_stats = cur.fetchone()
            avg_query_time = query_stats[0] if query_stats and query_stats[0] else 0
            total_queries = query_stats[1] if query_stats else 0
            
            metrics.extend([
                PerformanceMetric(
                    metric_id=f"db_active_connections_{int(time.time())}",
                    metric_type=PerformanceMetricType.DATABASE_PERFORMANCE,
                    value=active_connections,
                    unit="count",
                    timestamp=timestamp,
                    source="postgresql",
                    tags={"component": "database", "metric": "active_connections"}
                ),
                PerformanceMetric(
                    metric_id=f"db_cache_hit_ratio_{int(time.time())}",
                    metric_type=PerformanceMetricType.CACHE_HIT_RATIO,
                    value=cache_hit_ratio,
                    unit="percent",
                    timestamp=timestamp,
                    source="postgresql",
                    tags={"component": "database", "metric": "cache_hit_ratio"}
                ),
                PerformanceMetric(
                    metric_id=f"db_avg_query_time_{int(time.time())}",
                    metric_type=PerformanceMetricType.DATABASE_PERFORMANCE,
                    value=avg_query_time,
                    unit="ms",
                    timestamp=timestamp,
                    source="postgresql",
                    tags={"component": "database", "metric": "avg_query_time"}
                )
            ])
            
        except Exception as e:
            self.logger.error(f"Error collecting database metrics: {e}")
            
        return metrics
        
    async def collect_network_performance_metrics(self) -> List[PerformanceMetric]:
        """Collect network performance metrics"""
        metrics = []
        timestamp = datetime.now()
        
        try:
            # Network latency test
            latency_targets = ['8.8.8.8', '1.1.1.1']
            
            for target in latency_targets:
                try:
                    result = await asyncio.create_subprocess_exec(
                        'ping', '-c', '1', target,
                        stdout=asyncio.subprocess.PIPE,
                        stderr=asyncio.subprocess.PIPE
                    )
                    
                    stdout, stderr = await result.communicate()
                    
                    if result.returncode == 0:
                        # Parse ping output for latency
                        output = stdout.decode()
                        for line in output.split('\n'):
                            if 'time=' in line:
                                time_part = line.split('time=')[1].split(' ')[0]
                                latency = float(time_part)
                                
                                metrics.append(PerformanceMetric(
                                    metric_id=f"network_latency_{target.replace('.', '_')}_{int(time.time())}",
                                    metric_type=PerformanceMetricType.NETWORK_IO,
                                    value=latency,
                                    unit="ms",
                                    timestamp=timestamp,
                                    source="ping",
                                    tags={"component": "network", "target": target}
                                ))
                                break
                                
                except Exception as e:
                    self.logger.debug(f"Error measuring network latency to {target}: {e}")
                    
        except Exception as e:
            self.logger.error(f"Error collecting network metrics: {e}")
            
        return metrics

async def main():
    """Main function to start performance optimization engine"""
    print("⚡ Starting TerraFusion Performance Optimization Engine...")
    print("=" * 70)
    print("Capabilities:")
    print("  • Real-time performance monitoring")
    print("  • AI-powered bottleneck detection")
    print("  • Automated optimization recommendations")
    print("  • Predictive performance analysis")
    print("  • Capacity planning and forecasting")
    print("  • Auto-scaling recommendations")
    print("  • Code and query optimization")
    print("  • Infrastructure tuning")
    print("=" * 70)
    
    optimization_engine = PerformanceOptimizationEngine()
    
    try:
        # Demo: Collect initial metrics
        print("\n📊 Collecting initial performance baseline...")
        await optimization_engine.collect_comprehensive_performance_metrics()
        
        # Start optimization engine
        await optimization_engine.start_performance_optimization_system()
        
    except KeyboardInterrupt:
        print("\n🛑 Shutting down performance optimization engine...")
    except Exception as e:
        print(f"\n❌ Error in performance optimization engine: {e}")
        raise

if __name__ == '__main__':
    asyncio.run(main())