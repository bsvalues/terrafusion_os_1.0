#!/usr/bin/env python3
"""
TerraFusion Auto-Recovery System
Monitors services and automatically restarts failed components
"""
import asyncio
import subprocess
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import requests
import smtplib
from email.mime.text import MIMEText
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('AutoRecovery')

class ServiceRecovery:
    def __init__(self, name: str, config: Dict[str, Any]):
        self.name = name
        self.url = config['url']
        self.health_endpoint = config.get('health_endpoint', '/health')
        self.start_command = config['start_command']
        self.stop_command = config.get('stop_command')
        self.restart_command = config.get('restart_command')
        self.max_retries = config.get('max_retries', 3)
        self.retry_delay = config.get('retry_delay', 30)
        self.cooldown_period = config.get('cooldown_period', 300)
        
        self.failure_count = 0
        self.last_restart_time = None
        self.consecutive_failures = 0
        self.total_restarts = 0
        
    async def check_health(self) -> bool:
        """Check if service is healthy"""
        try:
            response = requests.get(
                f"{self.url}{self.health_endpoint}",
                timeout=10
            )
            return response.status_code == 200
        except Exception as e:
            logger.warning(f"{self.name} health check failed: {e}")
            return False
    
    def can_restart(self) -> bool:
        """Check if service can be restarted based on cooldown"""
        if self.last_restart_time is None:
            return True
        
        time_since_restart = datetime.now() - self.last_restart_time
        return time_since_restart.total_seconds() > self.cooldown_period
    
    async def restart_service(self) -> bool:
        """Attempt to restart the service"""
        if not self.can_restart():
            logger.info(f"{self.name} is in cooldown period, skipping restart")
            return False
        
        logger.warning(f"Attempting to restart {self.name}")
        
        try:
            # Try restart command first
            if self.restart_command:
                result = subprocess.run(
                    self.restart_command,
                    shell=True,
                    capture_output=True,
                    text=True
                )
                success = result.returncode == 0
            else:
                # Stop and start
                if self.stop_command:
                    subprocess.run(
                        self.stop_command,
                        shell=True,
                        capture_output=True
                    )
                    await asyncio.sleep(5)
                
                result = subprocess.run(
                    self.start_command,
                    shell=True,
                    capture_output=True,
                    text=True
                )
                success = result.returncode == 0
            
            if success:
                logger.info(f"Successfully restarted {self.name}")
                self.last_restart_time = datetime.now()
                self.total_restarts += 1
                self.consecutive_failures = 0
                return True
            else:
                logger.error(f"Failed to restart {self.name}: {result.stderr}")
                return False
                
        except Exception as e:
            logger.error(f"Exception while restarting {self.name}: {e}")
            return False

class AutoRecoverySystem:
    def __init__(self, config_file: str = "recovery_config.json"):
        self.config = self.load_config(config_file)
        self.services = {}
        self.alerts_sent = {}
        self.monitoring_enabled = True
        
        # Initialize services
        for service_name, service_config in self.config['services'].items():
            self.services[service_name] = ServiceRecovery(service_name, service_config)
    
    def load_config(self, config_file: str) -> Dict[str, Any]:
        """Load recovery configuration"""
        default_config = {
            "services": {
                "backend": {
                    "url": "http://localhost:\${{TF_ADMIN_PORT:-8080}}",
                    "health_endpoint": "/health",
                    "start_command": "cd backend && start /B cargo run --release --bin minimal_backend",
                    "restart_command": None,
                    "max_retries": 3,
                    "cooldown_period": 300
                },
                "ai_engine": {
                    "url": "http://localhost:\${{TF_ADMIN_PORT:-8080}}",
                    "health_endpoint": "/health",
                    "start_command": "cd ai && start /B python simple_ai_service.py",
                    "restart_command": None,
                    "max_retries": 3,
                    "cooldown_period": 300
                },
                "rag_service": {
                    "url": "http://localhost:\${{TF_ADMIN_PORT:-8080}}",
                    "health_endpoint": "/health",
                    "start_command": "cd ai && start /B python simple_rag_service.py",
                    "restart_command": None,
                    "max_retries": 3,
                    "cooldown_period": 300
                },
                "frontend": {
                    "url": "http://localhost:\${{TF_ADMIN_PORT:-8080}}",
                    "health_endpoint": "/",
                    "start_command": "cd frontend && start /B npm run dev",
                    "restart_command": None,
                    "max_retries": 3,
                    "cooldown_period": 300
                }
            },
            "monitoring": {
                "check_interval": 60,
                "alert_threshold": 3,
                "email_alerts": False,
                "slack_webhook": None
            },
            "recovery_rules": {
                "max_total_restarts": 10,
                "escalation_threshold": 5
            }
        }
        
        try:
            with open(config_file, 'r') as f:
                loaded_config = json.load(f)
                # Merge with defaults
                default_config.update(loaded_config)
                return default_config
        except FileNotFoundError:
            logger.info(f"Config file not found, using defaults")
            # Save default config
            with open(config_file, 'w') as f:
                json.dump(default_config, f, indent=2)
            return default_config
    
    async def check_and_recover(self, service_name: str, service: ServiceRecovery) -> Dict[str, Any]:
        """Check service health and attempt recovery if needed"""
        is_healthy = await service.check_health()
        
        result = {
            "service": service_name,
            "timestamp": datetime.now().isoformat(),
            "healthy": is_healthy,
            "action": None,
            "consecutive_failures": service.consecutive_failures,
            "total_restarts": service.total_restarts
        }
        
        if is_healthy:
            service.consecutive_failures = 0
            result["action"] = "none"
        else:
            service.consecutive_failures += 1
            logger.warning(f"{service_name} is unhealthy (failure #{service.consecutive_failures})")
            
            # Check if we should attempt recovery
            if service.consecutive_failures >= self.config['monitoring']['alert_threshold']:
                if service.total_restarts < self.config['recovery_rules']['max_total_restarts']:
                    # Attempt restart
                    restart_success = await service.restart_service()
                    
                    if restart_success:
                        result["action"] = "restarted"
                        await self.send_alert(
                            f"{service_name} Restarted",
                            f"Service {service_name} was successfully restarted after {service.consecutive_failures} failures"
                        )
                    else:
                        result["action"] = "restart_failed"
                        await self.send_alert(
                            f"{service_name} Recovery Failed",
                            f"Failed to restart {service_name} after {service.consecutive_failures} failures",
                            level="critical"
                        )
                else:
                    result["action"] = "max_restarts_reached"
                    if service_name not in self.alerts_sent:
                        await self.send_alert(
                            f"{service_name} Max Restarts Reached",
                            f"Service {service_name} has reached maximum restart limit ({service.total_restarts})",
                            level="critical"
                        )
                        self.alerts_sent[service_name] = datetime.now()
        
        return result
    
    async def send_alert(self, subject: str, message: str, level: str = "warning"):
        """Send alert via configured channels"""
        logger.info(f"ALERT [{level.upper()}]: {subject} - {message}")
        
        # Email alerts
        if self.config['monitoring'].get('email_alerts'):
            # Implement email sending
            pass
        
        # Slack webhook
        if self.config['monitoring'].get('slack_webhook'):
            try:
                requests.post(
                    self.config['monitoring']['slack_webhook'],
                    json={
                        "text": f"*{subject}*\n{message}",
                        "color": "danger" if level == "critical" else "warning"
                    }
                )
            except Exception as e:
                logger.error(f"Failed to send Slack alert: {e}")
    
    async def monitor_loop(self):
        """Main monitoring and recovery loop"""
        logger.info("Auto-Recovery System Started")
        logger.info(f"Monitoring {len(self.services)} services")
        
        while self.monitoring_enabled:
            try:
                recovery_results = []
                
                # Check all services
                for service_name, service in self.services.items():
                    result = await self.check_and_recover(service_name, service)
                    recovery_results.append(result)
                
                # Save recovery status
                status = {
                    "timestamp": datetime.now().isoformat(),
                    "services": recovery_results,
                    "summary": {
                        "healthy": sum(1 for r in recovery_results if r["healthy"]),
                        "unhealthy": sum(1 for r in recovery_results if not r["healthy"]),
                        "total_restarts": sum(s.total_restarts for s in self.services.values())
                    }
                }
                
                with open("recovery_status.json", "w") as f:
                    json.dump(status, f, indent=2)
                
                # Log summary
                logger.info(
                    f"Status: {status['summary']['healthy']}/{len(self.services)} healthy, "
                    f"Total restarts: {status['summary']['total_restarts']}"
                )
                
                # Check for escalation
                if status['summary']['total_restarts'] >= self.config['recovery_rules']['escalation_threshold']:
                    if 'escalation_sent' not in self.alerts_sent:
                        await self.send_alert(
                            "TerraFusion System Instability",
                            f"Multiple services have been restarted {status['summary']['total_restarts']} times. "
                            "Manual intervention may be required.",
                            level="critical"
                        )
                        self.alerts_sent['escalation_sent'] = datetime.now()
                
            except Exception as e:
                logger.error(f"Error in monitoring loop: {e}")
            
            # Wait for next check
            await asyncio.sleep(self.config['monitoring']['check_interval'])
    
    def get_status(self) -> Dict[str, Any]:
        """Get current recovery system status"""
        return {
            "monitoring_enabled": self.monitoring_enabled,
            "services": {
                name: {
                    "consecutive_failures": service.consecutive_failures,
                    "total_restarts": service.total_restarts,
                    "last_restart": service.last_restart_time.isoformat() if service.last_restart_time else None
                }
                for name, service in self.services.items()
            }
        }

async def main():
    recovery_system = AutoRecoverySystem()
    
    # Start monitoring
    try:
        await recovery_system.monitor_loop()
    except KeyboardInterrupt:
        logger.info("Auto-Recovery System stopped by user")

if __name__ == "__main__":
    asyncio.run(main())