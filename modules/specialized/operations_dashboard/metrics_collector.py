#!/usr/bin/env python3
"""
Background metrics collector for dashboard
"""

import time
import psutil
import psycopg2
import redis
import requests
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import threading
from collections import deque
import json

from config import Config

class MetricsCollector:
    """Collects and stores system and service metrics"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        
        # Initialize storage
        self.metrics_store = {
            'system': deque(maxlen=Config.MAX_METRICS_POINTS),
            'services': {},
            'database': deque(maxlen=Config.MAX_METRICS_POINTS),
            'cache': deque(maxlen=Config.MAX_METRICS_POINTS),
            'alerts': deque(maxlen=100)
        }
        
        # Initialize service health tracking
        for service_id in Config.SERVICES:
            self.metrics_store['services'][service_id] = {
                'health_history': deque(maxlen=100),
                'response_times': deque(maxlen=100),
                'error_count': 0,
                'last_check': None
            }
        
        # Redis connection
        try:
            self.redis_client = redis.from_url(Config.REDIS_URL)
            self.redis_client.ping()
        except Exception as e:
            self.logger.error(f"Failed to connect to Redis: {e}")
            self.redis_client = None
    
    def collect_system_metrics(self) -> Dict:
        """Collect system-level metrics"""
        try:
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            network = psutil.net_io_counters()
            
            metrics = {
                'timestamp': datetime.now().isoformat(),
                'cpu_percent': cpu_percent,
                'memory_percent': memory.percent,
                'memory_used_gb': memory.used / (1024**3),
                'memory_total_gb': memory.total / (1024**3),
                'disk_percent': disk.percent,
                'disk_used_gb': disk.used / (1024**3),
                'disk_total_gb': disk.total / (1024**3),
                'network_sent_mb': network.bytes_sent / (1024**2),
                'network_recv_mb': network.bytes_recv / (1024**2),
                'load_average': psutil.getloadavg()[0] if hasattr(psutil, 'getloadavg') else 0
            }
            
            # Check for alerts
            self._check_system_alerts(metrics)
            
            return metrics
            
        except Exception as e:
            self.logger.error(f"Failed to collect system metrics: {e}")
            return {}
    
    def collect_service_metrics(self) -> Dict:
        """Collect metrics for all services"""
        results = {}
        
        for service_id, config in Config.SERVICES.items():
            try:
                # Health check
                start_time = time.time()
                health_url = f"http://localhost:{config['port']}{config['health_endpoint']}"
                
                try:
                    response = requests.get(health_url, timeout=5)
                    response_time = (time.time() - start_time) * 1000  # ms
                    
                    health_status = 'healthy' if response.status_code == 200 else 'unhealthy'
                    
                    # Try to get additional metrics
                    metrics_data = {}
                    if config.get('metrics_endpoint'):
                        metrics_url = f"http://localhost:{config['port']}{config['metrics_endpoint']}"
                        try:
                            metrics_response = requests.get(metrics_url, timeout=3)
                            if metrics_response.status_code == 200:
                                metrics_data = metrics_response.json()
                        except:
                            pass
                    
                    results[service_id] = {
                        'status': health_status,
                        'response_time': response_time,
                        'status_code': response.status_code,
                        'metrics': metrics_data,
                        'last_check': datetime.now().isoformat()
                    }
                    
                except requests.exceptions.RequestException:
                    results[service_id] = {
                        'status': 'down',
                        'response_time': 0,
                        'status_code': 0,
                        'metrics': {},
                        'last_check': datetime.now().isoformat()
                    }
                    self.metrics_store['services'][service_id]['error_count'] += 1
                
                # Update history
                self.metrics_store['services'][service_id]['health_history'].append({
                    'timestamp': datetime.now().isoformat(),
                    'status': results[service_id]['status']
                })
                
                self.metrics_store['services'][service_id]['response_times'].append(
                    results[service_id]['response_time']
                )
                
            except Exception as e:
                self.logger.error(f"Failed to collect metrics for {service_id}: {e}")
        
        return results
    
    def collect_database_metrics(self) -> Dict:
        """Collect PostgreSQL metrics"""
        try:
            conn = psycopg2.connect(Config.DATABASE_URL)
            cursor = conn.cursor()
            
            # Connection count
            cursor.execute("SELECT count(*) FROM pg_stat_activity;")
            connection_count = cursor.fetchone()[0]
            
            # Database size
            cursor.execute("""
                SELECT pg_database_size(current_database()) / 1024 / 1024 as size_mb;
            """)
            db_size_mb = cursor.fetchone()[0]
            
            # Cache hit ratio
            cursor.execute("""
                SELECT 
                    sum(blks_hit)::float / (sum(blks_hit) + sum(blks_read)) * 100 as cache_hit_ratio
                FROM pg_stat_database
                WHERE datname = current_database();
            """)
            cache_hit_ratio = cursor.fetchone()[0] or 0
            
            # Active queries
            cursor.execute("""
                SELECT count(*) 
                FROM pg_stat_activity 
                WHERE state = 'active' AND query NOT LIKE '%pg_stat_activity%';
            """)
            active_queries = cursor.fetchone()[0]
            
            # Longest query
            cursor.execute("""
                SELECT EXTRACT(EPOCH FROM (now() - query_start))::int as duration
                FROM pg_stat_activity
                WHERE state = 'active' AND query NOT LIKE '%pg_stat_activity%'
                ORDER BY query_start
                LIMIT 1;
            """)
            result = cursor.fetchone()
            longest_query_duration = result[0] if result else 0
            
            cursor.close()
            conn.close()
            
            metrics = {
                'timestamp': datetime.now().isoformat(),
                'connection_count': connection_count,
                'size_mb': db_size_mb,
                'cache_hit_ratio': cache_hit_ratio,
                'active_queries': active_queries,
                'longest_query_seconds': longest_query_duration,
                'status': 'healthy'
            }
            
            return metrics
            
        except Exception as e:
            self.logger.error(f"Failed to collect database metrics: {e}")
            return {
                'timestamp': datetime.now().isoformat(),
                'status': 'error',
                'error': str(e)
            }
    
    def collect_cache_metrics(self) -> Dict:
        """Collect Redis cache metrics"""
        if not self.redis_client:
            return {'status': 'disconnected'}
        
        try:
            info = self.redis_client.info()
            
            metrics = {
                'timestamp': datetime.now().isoformat(),
                'used_memory_mb': info.get('used_memory', 0) / (1024**2),
                'used_memory_peak_mb': info.get('used_memory_peak', 0) / (1024**2),
                'connected_clients': info.get('connected_clients', 0),
                'total_commands_processed': info.get('total_commands_processed', 0),
                'instantaneous_ops_per_sec': info.get('instantaneous_ops_per_sec', 0),
                'hit_rate': self._calculate_hit_rate(info),
                'evicted_keys': info.get('evicted_keys', 0),
                'status': 'healthy'
            }
            
            return metrics
            
        except Exception as e:
            self.logger.error(f"Failed to collect cache metrics: {e}")
            return {
                'timestamp': datetime.now().isoformat(),
                'status': 'error',
                'error': str(e)
            }
    
    def _calculate_hit_rate(self, info: Dict) -> float:
        """Calculate Redis cache hit rate"""
        hits = info.get('keyspace_hits', 0)
        misses = info.get('keyspace_misses', 0)
        total = hits + misses
        
        if total == 0:
            return 0.0
        
        return (hits / total) * 100
    
    def _check_system_alerts(self, metrics: Dict):
        """Check system metrics against thresholds"""
        alerts = []
        
        if metrics.get('cpu_percent', 0) > Config.ALERT_THRESHOLDS['cpu_percent']:
            alerts.append({
                'type': 'system',
                'severity': 'warning',
                'metric': 'cpu_percent',
                'value': metrics['cpu_percent'],
                'threshold': Config.ALERT_THRESHOLDS['cpu_percent'],
                'message': f"CPU usage high: {metrics['cpu_percent']:.1f}%"
            })
        
        if metrics.get('memory_percent', 0) > Config.ALERT_THRESHOLDS['memory_percent']:
            alerts.append({
                'type': 'system',
                'severity': 'critical',
                'metric': 'memory_percent',
                'value': metrics['memory_percent'],
                'threshold': Config.ALERT_THRESHOLDS['memory_percent'],
                'message': f"Memory usage critical: {metrics['memory_percent']:.1f}%"
            })
        
        if metrics.get('disk_percent', 0) > Config.ALERT_THRESHOLDS['disk_percent']:
            alerts.append({
                'type': 'system',
                'severity': 'critical',
                'metric': 'disk_percent',
                'value': metrics['disk_percent'],
                'threshold': Config.ALERT_THRESHOLDS['disk_percent'],
                'message': f"Disk usage critical: {metrics['disk_percent']:.1f}%"
            })
        
        # Add alerts to store
        for alert in alerts:
            alert['timestamp'] = datetime.now().isoformat()
            self.metrics_store['alerts'].append(alert)
    
    def run_collection_cycle(self):
        """Run one complete metrics collection cycle"""
        try:
            # Collect all metrics
            system_metrics = self.collect_system_metrics()
            if system_metrics:
                self.metrics_store['system'].append(system_metrics)
            
            service_metrics = self.collect_service_metrics()
            
            db_metrics = self.collect_database_metrics()
            if db_metrics:
                self.metrics_store['database'].append(db_metrics)
            
            cache_metrics = self.collect_cache_metrics()
            if cache_metrics:
                self.metrics_store['cache'].append(cache_metrics)
            
            # Store in Redis for persistence
            if self.redis_client:
                try:
                    self.redis_client.setex(
                        'dashboard:metrics:latest',
                        300,  # 5 minute TTL
                        json.dumps({
                            'system': system_metrics,
                            'services': service_metrics,
                            'database': db_metrics,
                            'cache': cache_metrics,
                            'timestamp': datetime.now().isoformat()
                        })
                    )
                except Exception as e:
                    self.logger.error(f"Failed to store metrics in Redis: {e}")
            
        except Exception as e:
            self.logger.error(f"Collection cycle failed: {e}")
    
    def get_metrics_summary(self) -> Dict:
        """Get summary of current metrics"""
        # System averages
        system_avg = {'cpu': 0, 'memory': 0, 'disk': 0}
        if self.metrics_store['system']:
            recent_system = list(self.metrics_store['system'])[-10:]
            system_avg['cpu'] = sum(m.get('cpu_percent', 0) for m in recent_system) / len(recent_system)
            system_avg['memory'] = sum(m.get('memory_percent', 0) for m in recent_system) / len(recent_system)
            system_avg['disk'] = sum(m.get('disk_percent', 0) for m in recent_system) / len(recent_system)
        
        # Service health
        services_healthy = 0
        services_total = len(Config.SERVICES)
        
        for service_id, data in self.metrics_store['services'].items():
            if data['health_history']:
                latest = data['health_history'][-1]
                if latest['status'] == 'healthy':
                    services_healthy += 1
        
        # Recent alerts
        recent_alerts = list(self.metrics_store['alerts'])[-10:]
        
        return {
            'timestamp': datetime.now().isoformat(),
            'system': system_avg,
            'services': {
                'healthy': services_healthy,
                'total': services_total,
                'health_percentage': (services_healthy / services_total * 100) if services_total > 0 else 0
            },
            'alerts': {
                'count': len(recent_alerts),
                'recent': recent_alerts
            }
        }
    
    def start_collection_loop(self):
        """Start the metrics collection loop"""
        self.logger.info("Starting metrics collection loop")
        
        while True:
            try:
                self.run_collection_cycle()
                time.sleep(Config.METRICS_COLLECTION_INTERVAL)
            except Exception as e:
                self.logger.error(f"Collection loop error: {e}")
                time.sleep(Config.METRICS_COLLECTION_INTERVAL)