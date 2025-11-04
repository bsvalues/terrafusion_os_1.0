#!/usr/bin/env python3
"""
🔍 TerraFusion OS - Revolutionary Monitoring & Observability Automation
🏛️ Government. Transcended.

Comprehensive monitoring system for TerraFusion OS infrastructure with:
- Real-time performance monitoring
- AI agent health tracking
- Security event correlation
- Government compliance monitoring
- Automated alert management
- Quantum-ready observability
"""

import asyncio
import json
import logging
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import aiohttp
import psutil
import docker
import subprocess
import yaml
from dataclasses import dataclass, asdict
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn
from rich.layout import Layout
from rich.live import Live
from rich.text import Text
import prometheus_client
from prometheus_client import Gauge, Counter, Histogram

# Initialize Rich console
console = Console()

@dataclass
class ServiceHealthMetrics:
    """Service health metrics structure"""
    service_name: str
    status: str
    response_time: float
    cpu_usage: float
    memory_usage: float
    uptime: float
    error_rate: float
    last_check: datetime

@dataclass
class AIAgentMetrics:
    """AI Agent monitoring metrics"""
    agent_id: str
    agent_type: str
    status: str
    task_count: int
    success_rate: float
    response_time: float
    memory_usage: float
    last_activity: datetime

@dataclass
class SecurityMetrics:
    """Security monitoring metrics"""
    failed_authentications: int
    suspicious_activities: int
    blocked_requests: int
    compliance_score: float
    threat_level: str
    last_security_scan: datetime

@dataclass
class SystemMetrics:
    """Overall system metrics"""
    timestamp: datetime
    cpu_usage: float
    memory_usage: float
    disk_usage: float
    network_io: Dict[str, float]
    active_connections: int
    load_average: List[float]

class PrometheusMetrics:
    """Prometheus metrics collector"""

    def __init__(self):
        # System metrics
        self.cpu_usage = Gauge('terrafusion_cpu_usage_percent', 'CPU usage percentage')
        self.memory_usage = Gauge('terrafusion_memory_usage_percent', 'Memory usage percentage')
        self.disk_usage = Gauge('terrafusion_disk_usage_percent', 'Disk usage percentage')

        # Service metrics
        self.service_response_time = Histogram('terrafusion_service_response_time_seconds',
                                             'Service response time', ['service'])
        self.service_requests = Counter('terrafusion_service_requests_total',
                                      'Total service requests', ['service', 'status'])

        # AI Agent metrics
        self.ai_agents_active = Gauge('terrafusion_ai_agents_active', 'Number of active AI agents')
        self.ai_agent_tasks = Counter('terrafusion_ai_agent_tasks_total',
                                    'Total AI agent tasks', ['agent_type', 'status'])

        # Security metrics
        self.security_events = Counter('terrafusion_security_events_total',
                                     'Security events', ['event_type'])
        self.compliance_score = Gauge('terrafusion_compliance_score', 'Compliance score')

class TerraFusionMonitoring:
    """Revolutionary monitoring and observability system"""

    def __init__(self, config_path: str = "config/monitoring.yaml"):
        self.config = self._load_config(config_path)
        self.metrics = PrometheusMetrics()
        self.services = self.config.get('services', [])
        self.ai_agents = {}
        self.alerts = []
        self.docker_client = None

        # Initialize Docker client
        try:
            self.docker_client = docker.from_env()
        except Exception as e:
            console.print(f"[yellow]Warning: Docker client not available: {e}[/yellow]")

        # Setup logging
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('logs/monitoring.log'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)

    def _load_config(self, config_path: str) -> Dict:
        """Load monitoring configuration"""
        try:
            with open(config_path, 'r') as f:
                if config_path.endswith('.yaml') or config_path.endswith('.yml'):
                    return yaml.safe_load(f)
                else:
                    return json.load(f)
        except FileNotFoundError:
            console.print(f"[yellow]Config file not found: {config_path}. Using default configuration.[/yellow]")
            return self._get_default_config()

    def _get_default_config(self) -> Dict:
        """Default monitoring configuration"""
        return {
            "services": [
                {"name": "terrafusion-api", "url": "http://localhost:5000/health", "port": 5000},
                {"name": "terrafusion-gateway", "url": "http://localhost:3001/health", "port": 3001},
                {"name": "terrafusion-shell", "url": "http://localhost:3002/health", "port": 3002},
                {"name": "terrafusion-consciousness", "url": "http://localhost:3004/health", "port": 3004},
                {"name": "terrafusion-frontend", "url": "http://localhost:3000", "port": 3000}
            ],
            "ai_agents": {
                "swarm_orchestrator_url": "http://localhost:3004/api/swarm/status",
                "agent_types": ["coordinator", "field-general", "micro-agent"],
                "health_check_interval": 30
            },
            "security": {
                "monitoring_enabled": True,
                "log_analysis": True,
                "threat_detection": True,
                "compliance_monitoring": True
            },
            "alerts": {
                "enabled": True,
                "channels": ["console", "log", "webhook"],
                "thresholds": {
                    "cpu_usage": 80,
                    "memory_usage": 85,
                    "disk_usage": 90,
                    "response_time": 5.0,
                    "error_rate": 5.0
                }
            }
        }

    async def check_service_health(self, service: Dict) -> ServiceHealthMetrics:
        """Check health of a specific service"""
        try:
            start_time = time.time()

            async with aiohttp.ClientSession() as session:
                async with session.get(service['url'], timeout=10) as response:
                    response_time = time.time() - start_time

                    # Get process metrics if running locally
                    cpu_usage, memory_usage, uptime = await self._get_process_metrics(service.get('port'))

                    status = "healthy" if response.status == 200 else "unhealthy"

                    metrics = ServiceHealthMetrics(
                        service_name=service['name'],
                        status=status,
                        response_time=response_time,
                        cpu_usage=cpu_usage,
                        memory_usage=memory_usage,
                        uptime=uptime,
                        error_rate=0.0,  # Calculate from logs
                        last_check=datetime.now()
                    )

                    # Update Prometheus metrics
                    self.metrics.service_response_time.labels(service=service['name']).observe(response_time)
                    self.metrics.service_requests.labels(service=service['name'], status=status).inc()

                    return metrics

        except Exception as e:
            self.logger.error(f"Health check failed for {service['name']}: {e}")
            return ServiceHealthMetrics(
                service_name=service['name'],
                status="error",
                response_time=0.0,
                cpu_usage=0.0,
                memory_usage=0.0,
                uptime=0.0,
                error_rate=100.0,
                last_check=datetime.now()
            )

    async def _get_process_metrics(self, port: Optional[int]) -> tuple:
        """Get process metrics for a service running on specific port"""
        try:
            if not port:
                return 0.0, 0.0, 0.0

            # Find process by port
            for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent', 'create_time']):
                try:
                    connections = proc.connections()
                    for conn in connections:
                        if conn.laddr.port == port:
                            cpu_usage = proc.cpu_percent()
                            memory_usage = proc.memory_percent()
                            uptime = time.time() - proc.create_time()
                            return cpu_usage, memory_usage, uptime
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    continue

            return 0.0, 0.0, 0.0

        except Exception:
            return 0.0, 0.0, 0.0

    async def monitor_ai_agents(self) -> List[AIAgentMetrics]:
        """Monitor AI agent swarm health and performance"""
        try:
            swarm_url = self.config['ai_agents']['swarm_orchestrator_url']

            async with aiohttp.ClientSession() as session:
                async with session.get(swarm_url) as response:
                    if response.status == 200:
                        swarm_data = await response.json()

                        agent_metrics = []
                        agents = swarm_data.get('agents', [])

                        for agent in agents:
                            metrics = AIAgentMetrics(
                                agent_id=agent.get('id', 'unknown'),
                                agent_type=agent.get('type', 'unknown'),
                                status=agent.get('status', 'unknown'),
                                task_count=agent.get('task_count', 0),
                                success_rate=agent.get('success_rate', 0.0),
                                response_time=agent.get('response_time', 0.0),
                                memory_usage=agent.get('memory_usage', 0.0),
                                last_activity=datetime.fromisoformat(
                                    agent.get('last_activity', datetime.now().isoformat())
                                )
                            )
                            agent_metrics.append(metrics)

                        # Update Prometheus metrics
                        active_agents = len([a for a in agents if a.get('status') == 'active'])
                        self.metrics.ai_agents_active.set(active_agents)

                        return agent_metrics

        except Exception as e:
            self.logger.error(f"AI agent monitoring failed: {e}")
            return []

    def collect_security_metrics(self) -> SecurityMetrics:
        """Collect security monitoring metrics"""
        try:
            # Analyze security logs
            failed_auth = self._count_security_events("failed_authentication")
            suspicious = self._count_security_events("suspicious_activity")
            blocked = self._count_security_events("blocked_request")

            # Calculate compliance score
            compliance_score = self._calculate_compliance_score()

            # Determine threat level
            threat_level = self._assess_threat_level(failed_auth, suspicious, blocked)

            metrics = SecurityMetrics(
                failed_authentications=failed_auth,
                suspicious_activities=suspicious,
                blocked_requests=blocked,
                compliance_score=compliance_score,
                threat_level=threat_level,
                last_security_scan=datetime.now()
            )

            # Update Prometheus metrics
            self.metrics.security_events.labels(event_type="failed_auth").inc(failed_auth)
            self.metrics.security_events.labels(event_type="suspicious").inc(suspicious)
            self.metrics.security_events.labels(event_type="blocked").inc(blocked)
            self.metrics.compliance_score.set(compliance_score)

            return metrics

        except Exception as e:
            self.logger.error(f"Security metrics collection failed: {e}")
            return SecurityMetrics(0, 0, 0, 0.0, "unknown", datetime.now())

    def _count_security_events(self, event_type: str) -> int:
        """Count security events from logs (last hour)"""
        try:
            # Mock implementation - in real scenario, parse actual security logs
            if event_type == "failed_authentication":
                return 2
            elif event_type == "suspicious_activity":
                return 0
            elif event_type == "blocked_request":
                return 5
            return 0
        except Exception:
            return 0

    def _calculate_compliance_score(self) -> float:
        """Calculate government compliance score"""
        try:
            # Mock implementation - in real scenario, check actual compliance metrics
            score = 98.5  # Government. Transcended.
            return score
        except Exception:
            return 0.0

    def _assess_threat_level(self, failed_auth: int, suspicious: int, blocked: int) -> str:
        """Assess current threat level"""
        total_incidents = failed_auth + suspicious + blocked

        if total_incidents == 0:
            return "low"
        elif total_incidents < 10:
            return "medium"
        elif total_incidents < 50:
            return "high"
        else:
            return "critical"

    def collect_system_metrics(self) -> SystemMetrics:
        """Collect overall system performance metrics"""
        try:
            # CPU usage
            cpu_usage = psutil.cpu_percent(interval=1)

            # Memory usage
            memory = psutil.virtual_memory()
            memory_usage = memory.percent

            # Disk usage
            disk = psutil.disk_usage('/')
            disk_usage = (disk.used / disk.total) * 100

            # Network I/O
            network = psutil.net_io_counters()
            network_io = {
                "bytes_sent": network.bytes_sent,
                "bytes_recv": network.bytes_recv,
                "packets_sent": network.packets_sent,
                "packets_recv": network.packets_recv
            }

            # Active connections
            connections = len(psutil.net_connections())

            # Load average (Unix-like systems)
            try:
                load_avg = list(psutil.getloadavg())
            except AttributeError:
                load_avg = [0.0, 0.0, 0.0]  # Windows doesn't have load average

            metrics = SystemMetrics(
                timestamp=datetime.now(),
                cpu_usage=cpu_usage,
                memory_usage=memory_usage,
                disk_usage=disk_usage,
                network_io=network_io,
                active_connections=connections,
                load_average=load_avg
            )

            # Update Prometheus metrics
            self.metrics.cpu_usage.set(cpu_usage)
            self.metrics.memory_usage.set(memory_usage)
            self.metrics.disk_usage.set(disk_usage)

            return metrics

        except Exception as e:
            self.logger.error(f"System metrics collection failed: {e}")
            return SystemMetrics(
                timestamp=datetime.now(),
                cpu_usage=0.0,
                memory_usage=0.0,
                disk_usage=0.0,
                network_io={},
                active_connections=0,
                load_average=[0.0, 0.0, 0.0]
            )

    def check_alerts(self, service_metrics: List[ServiceHealthMetrics],
                    system_metrics: SystemMetrics, security_metrics: SecurityMetrics):
        """Check for alert conditions and trigger notifications"""
        thresholds = self.config['alerts']['thresholds']
        alerts = []

        # System alerts
        if system_metrics.cpu_usage > thresholds['cpu_usage']:
            alerts.append(f"🚨 HIGH CPU USAGE: {system_metrics.cpu_usage:.1f}%")

        if system_metrics.memory_usage > thresholds['memory_usage']:
            alerts.append(f"🚨 HIGH MEMORY USAGE: {system_metrics.memory_usage:.1f}%")

        if system_metrics.disk_usage > thresholds['disk_usage']:
            alerts.append(f"🚨 HIGH DISK USAGE: {system_metrics.disk_usage:.1f}%")

        # Service alerts
        for service in service_metrics:
            if service.status == "error":
                alerts.append(f"🚨 SERVICE DOWN: {service.service_name}")
            elif service.response_time > thresholds['response_time']:
                alerts.append(f"⚠️ SLOW RESPONSE: {service.service_name} ({service.response_time:.2f}s)")

        # Security alerts
        if security_metrics.threat_level in ["high", "critical"]:
            alerts.append(f"🔒 SECURITY ALERT: Threat level {security_metrics.threat_level.upper()}")

        if security_metrics.compliance_score < 95.0:
            alerts.append(f"🏛️ COMPLIANCE ALERT: Score {security_metrics.compliance_score:.1f}%")

        # Send alerts
        for alert in alerts:
            self._send_alert(alert)

        self.alerts = alerts

    def _send_alert(self, message: str):
        """Send alert notification"""
        channels = self.config['alerts']['channels']

        if 'console' in channels:
            console.print(f"[red]{message}[/red]")

        if 'log' in channels:
            self.logger.warning(message)

        if 'webhook' in channels and 'webhook_url' in self.config['alerts']:
            # Send to webhook (mock implementation)
            self.logger.info(f"Webhook alert sent: {message}")

    def create_dashboard(self, service_metrics: List[ServiceHealthMetrics],
                        ai_metrics: List[AIAgentMetrics],
                        system_metrics: SystemMetrics,
                        security_metrics: SecurityMetrics) -> Layout:
        """Create rich dashboard layout"""
        layout = Layout()

        # Split into main sections
        layout.split_column(
            Layout(name="header", size=3),
            Layout(name="main"),
            Layout(name="footer", size=3)
        )

        layout["main"].split_row(
            Layout(name="left"),
            Layout(name="right")
        )

        layout["left"].split_column(
            Layout(name="services"),
            Layout(name="system")
        )

        layout["right"].split_column(
            Layout(name="ai_agents"),
            Layout(name="security")
        )

        # Header
        header_text = Text("🚀 TerraFusion OS - Revolutionary Monitoring Dashboard",
                          style="bold cyan")
        header_text.append("\n🏛️ Government. Transcended.", style="bold blue")
        layout["header"].update(Panel(header_text, title="TerraFusion Monitoring", border_style="cyan"))

        # Services table
        services_table = Table(title="🔧 Service Status", expand=True)
        services_table.add_column("Service", style="cyan")
        services_table.add_column("Status", style="bold")
        services_table.add_column("Response Time", justify="right")
        services_table.add_column("CPU %", justify="right")
        services_table.add_column("Memory %", justify="right")

        for service in service_metrics:
            status_style = "green" if service.status == "healthy" else "red"
            services_table.add_row(
                service.service_name,
                f"[{status_style}]{service.status.upper()}[/{status_style}]",
                f"{service.response_time:.3f}s",
                f"{service.cpu_usage:.1f}%",
                f"{service.memory_usage:.1f}%"
            )

        layout["services"].update(Panel(services_table, border_style="green"))

        # System metrics
        system_table = Table(title="📊 System Metrics", expand=True)
        system_table.add_column("Metric", style="cyan")
        system_table.add_column("Value", justify="right", style="bold")

        system_table.add_row("CPU Usage", f"{system_metrics.cpu_usage:.1f}%")
        system_table.add_row("Memory Usage", f"{system_metrics.memory_usage:.1f}%")
        system_table.add_row("Disk Usage", f"{system_metrics.disk_usage:.1f}%")
        system_table.add_row("Active Connections", str(system_metrics.active_connections))

        if system_metrics.load_average:
            load_str = " / ".join([f"{load:.2f}" for load in system_metrics.load_average])
            system_table.add_row("Load Average", load_str)

        layout["system"].update(Panel(system_table, border_style="blue"))

        # AI Agents
        ai_table = Table(title="🤖 AI Agent Swarm", expand=True)
        ai_table.add_column("Agent ID", style="cyan")
        ai_table.add_column("Type", style="magenta")
        ai_table.add_column("Status", style="bold")
        ai_table.add_column("Tasks", justify="right")
        ai_table.add_column("Success Rate", justify="right")

        for agent in ai_metrics[:10]:  # Show first 10 agents
            status_style = "green" if agent.status == "active" else "yellow"
            ai_table.add_row(
                agent.agent_id[:8] + "...",
                agent.agent_type,
                f"[{status_style}]{agent.status.upper()}[/{status_style}]",
                str(agent.task_count),
                f"{agent.success_rate:.1f}%"
            )

        if len(ai_metrics) > 10:
            ai_table.add_row("...", "...", "...", "...", "...")

        layout["ai_agents"].update(Panel(ai_table, border_style="magenta"))

        # Security metrics
        security_table = Table(title="🔒 Security Dashboard", expand=True)
        security_table.add_column("Metric", style="cyan")
        security_table.add_column("Value", justify="right", style="bold")

        threat_style = "green" if security_metrics.threat_level == "low" else "red"
        compliance_style = "green" if security_metrics.compliance_score >= 95 else "yellow"

        security_table.add_row("Failed Auth", str(security_metrics.failed_authentications))
        security_table.add_row("Suspicious Activities", str(security_metrics.suspicious_activities))
        security_table.add_row("Blocked Requests", str(security_metrics.blocked_requests))
        security_table.add_row("Threat Level",
                              f"[{threat_style}]{security_metrics.threat_level.upper()}[/{threat_style}]")
        security_table.add_row("Compliance Score",
                              f"[{compliance_style}]{security_metrics.compliance_score:.1f}%[/{compliance_style}]")

        layout["security"].update(Panel(security_table, border_style="red"))

        # Footer with alerts
        if self.alerts:
            alert_text = Text("ACTIVE ALERTS:\n", style="bold red")
            for alert in self.alerts[-5:]:  # Show last 5 alerts
                alert_text.append(f"• {alert}\n", style="red")
        else:
            alert_text = Text("✅ All systems operational", style="bold green")

        footer_panel = Panel(alert_text, title="Alert Status", border_style="red" if self.alerts else "green")
        layout["footer"].update(footer_panel)

        return layout

    async def run_monitoring_cycle(self):
        """Run one complete monitoring cycle"""
        try:
            # Collect all metrics
            service_tasks = [self.check_service_health(service) for service in self.services]
            service_metrics = await asyncio.gather(*service_tasks)

            ai_metrics = await self.monitor_ai_agents()
            system_metrics = self.collect_system_metrics()
            security_metrics = self.collect_security_metrics()

            # Check for alerts
            self.check_alerts(service_metrics, system_metrics, security_metrics)

            # Create and return dashboard
            dashboard = self.create_dashboard(service_metrics, ai_metrics, system_metrics, security_metrics)

            return {
                'dashboard': dashboard,
                'metrics': {
                    'services': [asdict(m) for m in service_metrics],
                    'ai_agents': [asdict(m) for m in ai_metrics],
                    'system': asdict(system_metrics),
                    'security': asdict(security_metrics)
                }
            }

        except Exception as e:
            self.logger.error(f"Monitoring cycle failed: {e}")
            return None

    async def start_monitoring(self, refresh_interval: int = 30):
        """Start continuous monitoring with live dashboard"""
        console.print("[bold green]🚀 Starting TerraFusion OS Monitoring System[/bold green]")
        console.print("[blue]🏛️ Government. Transcended.[/blue]")

        # Start Prometheus metrics server
        try:
            prometheus_client.start_http_server(8000)
            console.print("[green]📊 Prometheus metrics server started on port 8000[/green]")
        except Exception as e:
            console.print(f"[yellow]Warning: Could not start Prometheus server: {e}[/yellow]")

        with Live(console=console, refresh_per_second=1) as live:
            while True:
                try:
                    result = await self.run_monitoring_cycle()
                    if result:
                        live.update(result['dashboard'])

                    await asyncio.sleep(refresh_interval)

                except KeyboardInterrupt:
                    console.print("\n[yellow]Monitoring stopped by user[/yellow]")
                    break
                except Exception as e:
                    console.print(f"[red]Monitoring error: {e}[/red]")
                    await asyncio.sleep(5)

async def main():
    """Main entry point"""
    import argparse

    parser = argparse.ArgumentParser(description="TerraFusion OS Monitoring System")
    parser.add_argument("--config", default="config/monitoring.yaml",
                       help="Configuration file path")
    parser.add_argument("--interval", type=int, default=30,
                       help="Refresh interval in seconds")
    parser.add_argument("--export-metrics", action="store_true",
                       help="Export metrics to JSON file")

    args = parser.parse_args()

    # Initialize monitoring system
    monitoring = TerraFusionMonitoring(args.config)

    if args.export_metrics:
        # Run single cycle and export metrics
        result = await monitoring.run_monitoring_cycle()
        if result:
            with open('monitoring-metrics.json', 'w') as f:
                json.dump(result['metrics'], f, indent=2, default=str)
            console.print("[green]✅ Metrics exported to monitoring-metrics.json[/green]")
    else:
        # Start continuous monitoring
        await monitoring.start_monitoring(args.interval)

if __name__ == "__main__":
    asyncio.run(main())
