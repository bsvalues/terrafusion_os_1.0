#!/usr/bin/env python3
"""
TerraFusion Health Monitor
Phase 6: The Dynasty Continues - Sustained Excellence

Bill Belichick says: "Do your job. Check every service. No excuses."
"""

import requests
import time
import json
import logging
import subprocess
import psutil
import os
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import smtplib
from email.mime.text import MimeText
from email.mime.multipart import MimeMultipart

class TerraFusionMonitor:
    def __init__(self, config_file: str = 'monitoring/config/monitor_config.json'):
        """
        Initialize the TerraFusion Health Monitor
        The Brady Standard: Precision, preparation, execution
        """
        self.config = self._load_config(config_file)
        self.services = {
            'costforge': 'http://localhost:\${{TF_SHELL_PORT:-3001}}/health',
            'propertyworkbench': 'http://localhost:\${{TF_SHELL_PORT:-3001}}/health', 
            'terrainsight': 'http://localhost:\${{TF_SHELL_PORT:-3001}}/health',
            'postgres': 'postgresql://localhost:\${{TF_SHELL_PORT:-3001}}',
            'redis': 'redis://localhost:\${{TF_SHELL_PORT:-3001}}',
            'nginx': 'http://localhost:80/health',
            'prometheus': 'http://localhost:\${{TF_SHELL_PORT:-3001}}/-/healthy',
            'grafana': 'http://localhost:\${{TF_SHELL_PORT:-3001}}/api/health'
        }
        self.status_file = 'monitoring/logs/terrafusion_status.json'
        self.alert_history_file = 'monitoring/logs/alert_history.json'
        self.setup_logging()
        
    def _load_config(self, config_file: str) -> Dict[str, Any]:
        """Load monitoring configuration"""
        default_config = {
            "check_interval": 60,
            "alert_threshold": 3,
            "email_notifications": True,
            "slack_notifications": False,
            "auto_recovery": True,
            "system_metrics": True,
            "log_retention_days": 30
        }
        
        try:
            if os.path.exists(config_file):
                with open(config_file, 'r') as f:
                    config = json.load(f)
                    return {**default_config, **config}
        except Exception as e:
            print(f"Error loading config: {e}. Using defaults.")
        
        return default_config

    def setup_logging(self):
        """Setup logging - The Patriot Way"""
        os.makedirs('monitoring/logs', exist_ok=True)
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('monitoring/logs/health_monitor.log'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)

    def check_service(self, name: str, url: str) -> Dict[str, Any]:
        """
        Check individual service health
        No shortcuts, no excuses - just results
        """
        try:
            start_time = time.time()
            
            if name == 'postgres':
                return self._check_postgres()
            elif name == 'redis':
                return self._check_redis()
            else:
                response = requests.get(url, timeout=5)
                response_time = time.time() - start_time
                
                return {
                    'status': 'healthy' if response.status_code == 200 else 'unhealthy',
                    'response_time': round(response_time, 3),
                    'status_code': response.status_code,
                    'message': response.text[:200] if response.text else '',
                    'timestamp': datetime.now().isoformat()
                }
        except requests.exceptions.ConnectionError:
            return {
                'status': 'down',
                'response_time': None,
                'status_code': None,
                'message': 'Connection refused',
                'timestamp': datetime.now().isoformat()
            }
        except requests.exceptions.Timeout:
            return {
                'status': 'timeout',
                'response_time': None,
                'status_code': None,
                'message': 'Request timeout',
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            return {
                'status': 'error',
                'response_time': None,
                'status_code': None,
                'message': str(e),
                'timestamp': datetime.now().isoformat()
            }

    def _check_postgres(self) -> Dict[str, Any]:
        """Check PostgreSQL health"""
        try:
            result = subprocess.run(['docker', 'exec', 'terrafusion-postgres', 'pg_isready', '-U', 'terrafusion'], 
                                  capture_output=True, text=True, timeout=5)
            if result.returncode == 0:
                return {
                    'status': 'healthy',
                    'response_time': 0.1,
                    'status_code': 200,
                    'message': 'PostgreSQL is ready',
                    'timestamp': datetime.now().isoformat()
                }
            else:
                return {
                    'status': 'unhealthy',
                    'response_time': None,
                    'status_code': 500,
                    'message': result.stderr,
                    'timestamp': datetime.now().isoformat()
                }
        except Exception as e:
            return {
                'status': 'down',
                'response_time': None,
                'status_code': None,
                'message': str(e),
                'timestamp': datetime.now().isoformat()
            }

    def _check_redis(self) -> Dict[str, Any]:
        """Check Redis health"""
        try:
            result = subprocess.run(['docker', 'exec', 'terrafusion-redis', 'redis-cli', 'ping'], 
                                  capture_output=True, text=True, timeout=5)
            if result.returncode == 0 and 'PONG' in result.stdout:
                return {
                    'status': 'healthy',
                    'response_time': 0.05,
                    'status_code': 200,
                    'message': 'Redis is responding',
                    'timestamp': datetime.now().isoformat()
                }
            else:
                return {
                    'status': 'unhealthy',
                    'response_time': None,
                    'status_code': 500,
                    'message': result.stderr,
                    'timestamp': datetime.now().isoformat()
                }
        except Exception as e:
            return {
                'status': 'down',
                'response_time': None,
                'status_code': None,
                'message': str(e),
                'timestamp': datetime.now().isoformat()
            }

    def get_system_metrics(self) -> Dict[str, Any]:
        """
        Gather system metrics
        Know your fundamentals - Belichick principle
        """
        try:
            return {
                'cpu_percent': psutil.cpu_percent(interval=1),
                'memory_percent': psutil.virtual_memory().percent,
                'disk_usage': psutil.disk_usage('/').percent,
                'load_average': os.getloadavg(),
                'docker_containers': self._get_docker_stats(),
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            self.logger.error(f"Error gathering system metrics: {e}")
            return {'error': str(e)}

    def _get_docker_stats(self) -> Dict[str, Any]:
        """Get Docker container statistics"""
        try:
            result = subprocess.run(['docker', 'ps', '--format', 'json'], 
                                  capture_output=True, text=True)
            if result.returncode == 0:
                containers = []
                for line in result.stdout.strip().split('\n'):
                    if line:
                        containers.append(json.loads(line))
                return {
                    'total_containers': len(containers),
                    'running_containers': len([c for c in containers if 'Up' in c.get('Status', '')]),
                    'containers': containers
                }
        except Exception as e:
            self.logger.error(f"Error getting Docker stats: {e}")
        
        return {'error': 'Unable to get Docker stats'}

    def run_checks(self) -> Dict[str, Any]:
        """
        Run all health checks
        The Patriot Way: Comprehensive, consistent, accountable
        """
        results = {
            'timestamp': datetime.now().isoformat(),
            'services': {},
            'system_metrics': {},
            'overall_status': 'healthy'
        }
        
        # Check all services
        failed_services = []
        for name, url in self.services.items():
            service_result = self.check_service(name, url)
            results['services'][name] = service_result
            
            if service_result['status'] not in ['healthy']:
                failed_services.append(name)
        
        # Get system metrics
        if self.config.get('system_metrics', True):
            results['system_metrics'] = self.get_system_metrics()
        
        # Determine overall status
        if failed_services:
            results['overall_status'] = 'degraded' if len(failed_services) < len(self.services) / 2 else 'critical'
            results['failed_services'] = failed_services
        
        # Save results
        self._save_results(results)
        
        # Handle alerts
        if failed_services:
            self._handle_alerts(results)
            
            # Auto-recovery if enabled
            if self.config.get('auto_recovery', True):
                self._attempt_recovery(failed_services)
        
        # Log status
        status_msg = f"Health check complete. Status: {results['overall_status']}"
        if failed_services:
            status_msg += f". Failed services: {', '.join(failed_services)}"
        
        if results['overall_status'] == 'healthy':
            self.logger.info(status_msg)
        else:
            self.logger.warning(status_msg)
        
        return results

    def _save_results(self, results: Dict[str, Any]):
        """Save monitoring results"""
        try:
            os.makedirs(os.path.dirname(self.status_file), exist_ok=True)
            with open(self.status_file, 'w') as f:
                json.dump(results, f, indent=2)
                
            # Also save historical data
            history_file = f"monitoring/logs/status_history_{datetime.now().strftime('%Y%m%d')}.json"
            history_entry = {
                'timestamp': results['timestamp'],
                'overall_status': results['overall_status'],
                'failed_services': results.get('failed_services', [])
            }
            
            history = []
            if os.path.exists(history_file):
                with open(history_file, 'r') as f:
                    history = json.load(f)
            
            history.append(history_entry)
            
            # Keep only last 1000 entries per day
            if len(history) > 1000:
                history = history[-1000:]
                
            with open(history_file, 'w') as f:
                json.dump(history, f, indent=2)
                
        except Exception as e:
            self.logger.error(f"Error saving results: {e}")

    def _handle_alerts(self, results: Dict[str, Any]):
        """
        Handle alerting for failed services
        Champions communicate - no surprises
        """
        try:
            alert = {
                'timestamp': datetime.now().isoformat(),
                'status': results['overall_status'],
                'failed_services': results.get('failed_services', []),
                'details': {name: results['services'][name] for name in results.get('failed_services', [])}
            }
            
            # Send notifications
            if self.config.get('email_notifications', True):
                self._send_email_alert(alert)
            
            if self.config.get('slack_notifications', False):
                self._send_slack_alert(alert)
            
            # Save alert history
            self._save_alert_history(alert)
            
        except Exception as e:
            self.logger.error(f"Error handling alerts: {e}")

    def _send_email_alert(self, alert: Dict[str, Any]):
        """Send email alert"""
        # This would need SMTP configuration
        self.logger.info(f"EMAIL ALERT: {alert['status']} - Services: {', '.join(alert['failed_services'])}")

    def _send_slack_alert(self, alert: Dict[str, Any]):
        """Send Slack alert"""
        # This would need Slack webhook configuration
        self.logger.info(f"SLACK ALERT: {alert['status']} - Services: {', '.join(alert['failed_services'])}")

    def _save_alert_history(self, alert: Dict[str, Any]):
        """Save alert to history"""
        try:
            alerts = []
            if os.path.exists(self.alert_history_file):
                with open(self.alert_history_file, 'r') as f:
                    alerts = json.load(f)
            
            alerts.append(alert)
            
            # Keep only last 1000 alerts
            if len(alerts) > 1000:
                alerts = alerts[-1000:]
            
            with open(self.alert_history_file, 'w') as f:
                json.dump(alerts, f, indent=2)
                
        except Exception as e:
            self.logger.error(f"Error saving alert history: {e}")

    def _attempt_recovery(self, failed_services: List[str]):
        """
        Attempt automatic recovery
        Next man up - always have a backup plan
        """
        for service in failed_services:
            try:
                self.logger.info(f"Attempting recovery for service: {service}")
                
                if service in ['postgres', 'redis', 'nginx']:
                    # Try restarting the Docker container
                    container_name = f"terrafusion-{service}"
                    result = subprocess.run(['docker', 'restart', container_name], 
                                          capture_output=True, text=True)
                    if result.returncode == 0:
                        self.logger.info(f"Successfully restarted {container_name}")
                    else:
                        self.logger.error(f"Failed to restart {container_name}: {result.stderr}")
                
                elif service in ['costforge', 'propertyworkbench', 'terrainsight']:
                    # Try restarting the service container
                    result = subprocess.run(['docker-compose', 'restart', service], 
                                          capture_output=True, text=True)
                    if result.returncode == 0:
                        self.logger.info(f"Successfully restarted {service}")
                    else:
                        self.logger.error(f"Failed to restart {service}: {result.stderr}")
                
            except Exception as e:
                self.logger.error(f"Error during recovery attempt for {service}: {e}")

    def cleanup_old_logs(self):
        """Clean up old log files"""
        try:
            cutoff_date = datetime.now() - timedelta(days=self.config.get('log_retention_days', 30))
            log_dir = 'monitoring/logs'
            
            if os.path.exists(log_dir):
                for filename in os.listdir(log_dir):
                    if filename.startswith('status_history_'):
                        file_path = os.path.join(log_dir, filename)
                        file_mtime = datetime.fromtimestamp(os.path.getmtime(file_path))
                        
                        if file_mtime < cutoff_date:
                            os.remove(file_path)
                            self.logger.info(f"Cleaned up old log file: {filename}")
                            
        except Exception as e:
            self.logger.error(f"Error cleaning up logs: {e}")

    def run_continuous(self):
        """
        Run continuous monitoring
        Sustained excellence - The Dynasty Way
        """
        self.logger.info("Starting TerraFusion Health Monitor")
        self.logger.info("The Belichick Standard: Do your job, every minute, every day")
        
        check_interval = self.config.get('check_interval', 60)
        
        try:
            while True:
                results = self.run_checks()
                
                # Print status summary
                print(f"\n=== TerraFusion Health Status - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} ===")
                print(f"Overall Status: {results['overall_status'].upper()}")
                
                for service, status in results['services'].items():
                    status_icon = "✓" if status['status'] == 'healthy' else "✗"
                    print(f"{status_icon} {service}: {status['status']}")
                
                if 'system_metrics' in results:
                    metrics = results['system_metrics']
                    print(f"\nSystem: CPU {metrics.get('cpu_percent', 0)}% | "
                          f"Memory {metrics.get('memory_percent', 0)}% | "
                          f"Disk {metrics.get('disk_usage', 0)}%")
                
                print("=" * 60)
                
                # Cleanup old logs periodically (once per day)
                if datetime.now().hour == 0 and datetime.now().minute < 5:
                    self.cleanup_old_logs()
                
                time.sleep(check_interval)
                
        except KeyboardInterrupt:
            self.logger.info("Health monitor stopped by user")
        except Exception as e:
            self.logger.error(f"Fatal error in monitoring loop: {e}")
            raise

def main():
    """
    Main entry point
    Winners execute. Champions sustain.
    """
    monitor = TerraFusionMonitor()
    
    # Check if running in one-shot mode
    if len(os.sys.argv) > 1 and os.sys.argv[1] == '--once':
        results = monitor.run_checks()
        print(json.dumps(results, indent=2))
    else:
        monitor.run_continuous()

if __name__ == '__main__':
    main()