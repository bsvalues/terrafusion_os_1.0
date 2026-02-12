#!/usr/bin/env python3
"""
TerraFusion Health Checker

This script performs health checks on the TerraFusion application and related services.
It reports the health status to monitoring systems and can optionally alert on issues.
"""

import argparse
import json
import logging
import os
import random
import sys
import time
from datetime import datetime
from typing import Dict, List, Optional, Union

import psutil
import requests
import sqlalchemy as sa
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(os.path.join('logs', 'health_checker.log'))
    ]
)
logger = logging.getLogger('health_checker')

# Health check endpoints
HEALTH_ENDPOINTS = {
    'app': 'http://localhost:5000/api/health',
    'sync_service': 'http://localhost:5000/api/sync/health',
    'map_service': 'http://localhost:5000/api/map/health',
}

# Prometheus metrics endpoint
PROMETHEUS_METRICS_PATH = '/tmp/terrafusion_health_metrics.prom'

class HealthChecker:
    """Health checker for TerraFusion application and related services."""

    def __init__(self, args: argparse.Namespace) -> None:
        """Initialize the health checker."""
        self.args = args
        self.results = {}
        self.prometheus_metrics = []
        
        # Create logs directory if it doesn't exist
        os.makedirs('logs', exist_ok=True)

    def check_all(self) -> Dict[str, Dict]:
        """Run all health checks."""
        self.results = {}
        
        # Check system health
        self.results['system'] = self.check_system_health()
        
        # Check database
        self.results['database'] = self.check_database()
        
        # Check API endpoints
        for service, url in HEALTH_ENDPOINTS.items():
            self.results[service] = self.check_endpoint(service, url)
        
        # Check AI agents
        self.results['ai_agents'] = self.check_ai_agents()
        
        # Generate Prometheus metrics
        self.generate_prometheus_metrics()
        
        return self.results

    def check_system_health(self) -> Dict[str, Union[float, str, bool]]:
        """Check system health (CPU, memory, disk)."""
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        # Get process info if running
        process_info = {'running': False}
        for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
            if any('gunicorn' in arg for arg in proc.info['cmdline'] if arg):
                process_info = {
                    'running': True,
                    'pid': proc.info['pid'],
                    'memory_percent': proc.memory_percent(),
                    'cpu_percent': proc.cpu_percent(interval=0.1),
                    'uptime': time.time() - proc.create_time()
                }
                break
        
        return {
            'cpu_percent': cpu_percent,
            'memory_percent': memory.percent,
            'memory_available_mb': memory.available / (1024 * 1024),
            'disk_percent': disk.percent,
            'disk_free_gb': disk.free / (1024 * 1024 * 1024),
            'process': process_info,
            'status': 'healthy' if cpu_percent < 80 and memory.percent < 80 and disk.percent < 80 else 'unhealthy'
        }

    def check_database(self) -> Dict[str, Union[str, bool, float]]:
        """Check database connectivity and health."""
        try:
            # Create database connection
            database_url = os.environ.get('DATABASE_URL')
            if not database_url:
                return {
                    'status': 'error',
                    'message': 'DATABASE_URL environment variable not set',
                    'connected': False
                }
            
            engine = sa.create_engine(database_url)
            
            # Check connection
            start_time = time.time()
            with engine.connect() as conn:
                # Execute a simple query
                result = conn.execute(text('SELECT 1'))
                assert result.scalar() == 1
                
                # Check PostgreSQL version
                version = conn.execute(text('SHOW server_version')).scalar()
                
                # Check if PostGIS is installed
                postgis_enabled = False
                try:
                    postgis_version = conn.execute(text('SELECT PostGIS_Version()')).scalar()
                    postgis_enabled = True
                except:
                    postgis_version = None
                
                # Get some basic database stats
                db_stats_query = text('''
                    SELECT 
                        numbackends as active_connections,
                        xact_commit as transactions_committed,
                        xact_rollback as transactions_rollback,
                        blks_read as blocks_read,
                        blks_hit as blocks_hit,
                        tup_returned as rows_returned,
                        tup_fetched as rows_fetched,
                        tup_inserted as rows_inserted,
                        tup_updated as rows_updated,
                        tup_deleted as rows_deleted
                    FROM pg_stat_database
                    WHERE datname = current_database()
                ''')
                db_stats = dict(conn.execute(db_stats_query).mappings().first())
                
                # Calculate cache hit ratio
                if db_stats['blocks_read'] + db_stats['blocks_hit'] > 0:
                    cache_hit_ratio = db_stats['blocks_hit'] / (db_stats['blocks_read'] + db_stats['blocks_hit'])
                else:
                    cache_hit_ratio = 0
                
            query_time = time.time() - start_time
            
            return {
                'status': 'healthy',
                'connected': True,
                'version': version,
                'postgis_enabled': postgis_enabled,
                'postgis_version': postgis_version,
                'query_time_ms': query_time * 1000,
                'active_connections': db_stats['active_connections'],
                'cache_hit_ratio': cache_hit_ratio,
                'transactions': {
                    'committed': db_stats['transactions_committed'],
                    'rollback': db_stats['transactions_rollback'],
                },
                'rows': {
                    'returned': db_stats['rows_returned'],
                    'fetched': db_stats['rows_fetched'],
                    'inserted': db_stats['rows_inserted'],
                    'updated': db_stats['rows_updated'],
                    'deleted': db_stats['rows_deleted']
                }
            }
        except SQLAlchemyError as e:
            logger.error(f"Database check failed: {str(e)}")
            return {
                'status': 'error',
                'message': str(e),
                'connected': False
            }
        except Exception as e:
            logger.error(f"Unexpected error in database check: {str(e)}")
            return {
                'status': 'error',
                'message': str(e),
                'connected': False
            }

    def check_endpoint(self, service: str, url: str) -> Dict[str, Union[str, bool, float]]:
        """Check health of an API endpoint."""
        try:
            start_time = time.time()
            response = requests.get(url, timeout=5)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                # Try to parse response as JSON
                try:
                    data = response.json()
                    status = data.get('status', 'unknown')
                except:
                    status = 'healthy'  # Assume healthy if we get 200 but not JSON
                
                return {
                    'status': status,
                    'response_time_ms': response_time * 1000,
                    'status_code': response.status_code,
                    'available': True
                }
            else:
                return {
                    'status': 'unhealthy',
                    'response_time_ms': response_time * 1000,
                    'status_code': response.status_code,
                    'available': False,
                    'message': f"Unexpected status code: {response.status_code}"
                }
        except requests.RequestException as e:
            logger.warning(f"Failed to connect to {service} at {url}: {str(e)}")
            return {
                'status': 'unavailable',
                'available': False,
                'message': str(e)
            }

    def check_ai_agents(self) -> Dict[str, Union[str, List[Dict]]]:
        """Check health of AI agents."""
        try:
            # Try to get agent statuses from the agent manager API
            url = 'http://localhost:5000/api/agent/status'
            response = requests.get(url, timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                agents = data.get('agents', [])
                
                # Check if there are any unhealthy agents
                unhealthy_agents = [
                    agent for agent in agents 
                    if agent.get('status') not in ('healthy', 'active', 'idle')
                ]
                
                status = 'healthy' if not unhealthy_agents else 'unhealthy'
                
                return {
                    'status': status,
                    'agents': agents,
                    'agent_count': len(agents),
                    'unhealthy_count': len(unhealthy_agents),
                    'unhealthy_agents': [
                        agent['name'] for agent in unhealthy_agents
                    ] if unhealthy_agents else []
                }
            else:
                # API call failed, see if we can find agent processes
                agent_procs = []
                for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
                    if any('agent.py' in arg for arg in proc.info['cmdline'] if arg):
                        agent_procs.append({
                            'pid': proc.info['pid'],
                            'cmdline': ' '.join(proc.info['cmdline']),
                            'cpu_percent': proc.cpu_percent(interval=0.1),
                            'memory_percent': proc.memory_percent()
                        })
                
                status = 'unknown' if agent_procs else 'unavailable'
                
                return {
                    'status': status,
                    'message': f"Agent API unavailable. Found {len(agent_procs)} agent processes.",
                    'agent_processes': agent_procs,
                    'agent_count': len(agent_procs)
                }
        except Exception as e:
            logger.error(f"Error checking AI agents: {str(e)}")
            return {
                'status': 'error',
                'message': str(e)
            }

    def generate_prometheus_metrics(self) -> None:
        """Generate Prometheus metrics from health check results."""
        self.prometheus_metrics = []
        timestamp = int(time.time() * 1000)
        
        # System metrics
        if 'system' in self.results:
            system = self.results['system']
            self.prometheus_metrics.extend([
                f'# HELP terrafusion_system_cpu_percent System CPU usage percentage',
                f'# TYPE terrafusion_system_cpu_percent gauge',
                f'terrafusion_system_cpu_percent {system["cpu_percent"]} {timestamp}',
                f'# HELP terrafusion_system_memory_percent System memory usage percentage',
                f'# TYPE terrafusion_system_memory_percent gauge',
                f'terrafusion_system_memory_percent {system["memory_percent"]} {timestamp}',
                f'# HELP terrafusion_system_disk_percent System disk usage percentage',
                f'# TYPE terrafusion_system_disk_percent gauge',
                f'terrafusion_system_disk_percent {system["disk_percent"]} {timestamp}',
            ])
            
            # Process metrics
            if system['process']['running']:
                self.prometheus_metrics.extend([
                    f'# HELP terrafusion_process_memory_percent Process memory usage percentage',
                    f'# TYPE terrafusion_process_memory_percent gauge',
                    f'terrafusion_process_memory_percent {system["process"]["memory_percent"]} {timestamp}',
                    f'# HELP terrafusion_process_cpu_percent Process CPU usage percentage',
                    f'# TYPE terrafusion_process_cpu_percent gauge',
                    f'terrafusion_process_cpu_percent {system["process"]["cpu_percent"]} {timestamp}',
                    f'# HELP terrafusion_process_uptime_seconds Process uptime in seconds',
                    f'# TYPE terrafusion_process_uptime_seconds counter',
                    f'terrafusion_process_uptime_seconds {system["process"]["uptime"]} {timestamp}',
                ])
        
        # Database metrics
        if 'database' in self.results and self.results['database'].get('connected', False):
            db = self.results['database']
            self.prometheus_metrics.extend([
                f'# HELP terrafusion_database_query_time_ms Database query response time in milliseconds',
                f'# TYPE terrafusion_database_query_time_ms gauge',
                f'terrafusion_database_query_time_ms {db["query_time_ms"]} {timestamp}',
                f'# HELP terrafusion_database_connections Number of active database connections',
                f'# TYPE terrafusion_database_connections gauge',
                f'terrafusion_database_connections {db["active_connections"]} {timestamp}',
                f'# HELP terrafusion_database_cache_hit_ratio Database cache hit ratio',
                f'# TYPE terrafusion_database_cache_hit_ratio gauge',
                f'terrafusion_database_cache_hit_ratio {db["cache_hit_ratio"]} {timestamp}',
            ])
        
        # API endpoint metrics
        for service, data in self.results.items():
            if service in HEALTH_ENDPOINTS:
                available = int(data.get('available', False))
                self.prometheus_metrics.extend([
                    f'# HELP terrafusion_service_{service}_available Service availability (1=available, 0=unavailable)',
                    f'# TYPE terrafusion_service_{service}_available gauge',
                    f'terrafusion_service_{service}_available {available} {timestamp}',
                ])
                
                if data.get('available', False) and 'response_time_ms' in data:
                    self.prometheus_metrics.extend([
                        f'# HELP terrafusion_service_{service}_response_time_ms Service response time in milliseconds',
                        f'# TYPE terrafusion_service_{service}_response_time_ms gauge',
                        f'terrafusion_service_{service}_response_time_ms {data["response_time_ms"]} {timestamp}',
                    ])
        
        # AI Agents metrics
        if 'ai_agents' in self.results:
            agents = self.results['ai_agents']
            agent_count = agents.get('agent_count', 0)
            unhealthy_count = agents.get('unhealthy_count', 0)
            
            self.prometheus_metrics.extend([
                f'# HELP terrafusion_agents_total Total number of AI agents',
                f'# TYPE terrafusion_agents_total gauge',
                f'terrafusion_agents_total {agent_count} {timestamp}',
                f'# HELP terrafusion_agents_unhealthy Number of unhealthy AI agents',
                f'# TYPE terrafusion_agents_unhealthy gauge',
                f'terrafusion_agents_unhealthy {unhealthy_count} {timestamp}',
            ])
        
        # Write metrics to file for Prometheus Node Exporter
        if self.args.write_metrics:
            self.write_prometheus_metrics()

    def write_prometheus_metrics(self) -> None:
        """Write Prometheus metrics to a file for node_exporter textfile collector."""
        try:
            with open(PROMETHEUS_METRICS_PATH, 'w') as f:
                f.write('\n'.join(self.prometheus_metrics))
            logger.info(f"Wrote Prometheus metrics to {PROMETHEUS_METRICS_PATH}")
        except Exception as e:
            logger.error(f"Failed to write Prometheus metrics: {str(e)}")

    def print_report(self) -> None:
        """Print a human-readable health report."""
        print("\n===== TerraFusion Health Report =====")
        print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("\n=== System Health ===")
        system = self.results['system']
        print(f"CPU Usage:    {system['cpu_percent']:.1f}%")
        print(f"Memory Usage: {system['memory_percent']:.1f}%")
        print(f"Disk Usage:   {system['disk_percent']:.1f}%")
        print(f"Process:      {'Running' if system['process']['running'] else 'Not running'}")
        
        print("\n=== Database ===")
        db = self.results['database']
        print(f"Status:       {db['status']}")
        if db.get('connected', False):
            print(f"Version:      {db['version']}")
            print(f"PostGIS:      {'Enabled' if db['postgis_enabled'] else 'Not enabled'}")
            print(f"Query Time:   {db['query_time_ms']:.2f}ms")
            print(f"Connections:  {db['active_connections']}")
            
        print("\n=== Services ===")
        for service, url in HEALTH_ENDPOINTS.items():
            data = self.results.get(service, {})
            status = data.get('status', 'unknown')
            available = data.get('available', False)
            response_time = data.get('response_time_ms', 0)
            
            if available:
                print(f"{service:12} {status} ({response_time:.2f}ms)")
            else:
                message = data.get('message', 'unavailable')
                print(f"{service:12} {status} - {message}")
        
        print("\n=== AI Agents ===")
        agents = self.results['ai_agents']
        if 'agents' in agents:
            print(f"Total Agents: {agents['agent_count']}")
            print(f"Unhealthy:    {agents['unhealthy_count']}")
            if agents['unhealthy_count'] > 0:
                print("Unhealthy Agents:")
                for agent_name in agents['unhealthy_agents']:
                    print(f"  - {agent_name}")
        else:
            print(f"Status: {agents['status']}")
            if 'message' in agents:
                print(f"Info: {agents['message']}")
        
        print("\n====================================")

def parse_args() -> argparse.Namespace:
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description='TerraFusion Health Checker')
    parser.add_argument('-o', '--output', choices=['text', 'json'], default='text',
                        help='Output format (default: text)')
    parser.add_argument('-j', '--json-file', metavar='FILE',
                        help='Write JSON output to file')
    parser.add_argument('-p', '--write-metrics', action='store_true',
                        help='Write Prometheus metrics to file')
    parser.add_argument('-v', '--verbose', action='store_true',
                        help='Enable verbose output')
    return parser.parse_args()

def main() -> None:
    """Main function."""
    args = parse_args()
    
    if args.verbose:
        logger.setLevel(logging.DEBUG)
    
    checker = HealthChecker(args)
    results = checker.check_all()
    
    if args.output == 'text':
        checker.print_report()
    else:  # json
        print(json.dumps(results, indent=2))
    
    if args.json_file:
        try:
            with open(args.json_file, 'w') as f:
                json.dump(results, f, indent=2)
            logger.info(f"Wrote JSON output to {args.json_file}")
        except Exception as e:
            logger.error(f"Failed to write JSON output: {str(e)}")
    
    # Exit with non-zero code if any service is unhealthy
    for service, data in results.items():
        if data.get('status') in ('error', 'unhealthy'):
            sys.exit(1)
    
    sys.exit(0)

if __name__ == '__main__':
    main()