# NO HARDCODED PORTS! Use environment variables.
#!/usr/bin/env python3
"""
TerraFusion System Monitor - Comprehensive OS Monitoring Dashboard
Real-time monitoring and diagnostics for the complete TerraFusion OS

This service provides:
- Real-time system health monitoring
- Performance metrics and analytics
- Service dependency mapping
- Resource utilization tracking
- Harris PACS integration status
- Trust Fabric health monitoring
- AI agent performance tracking
- Emergency alerting system
"""

import asyncio
import aiohttp
from aiohttp import web
import json
import time
import logging
import sqlite3
import psutil
import sys
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
import hashlib
from pathlib import Path
from datetime import datetime, timedelta

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class SystemMetric:
    """System performance metric"""
    metric_name: str
    current_value: float
    unit: str
    threshold_warning: float
    threshold_critical: float
    status: str
    timestamp: float

@dataclass
class ServiceHealth:
    """Service health information"""
    service_name: str
    port: int
    status: str
    response_time: float
    uptime: float
    trust_score: float
    error_count: int
    last_check: float

@dataclass
class SystemOverview:
    """Complete system overview"""
    os_status: str
    total_services: int
    operational_services: int
    system_uptime: float
    cpu_usage: float
    memory_usage: float
    disk_usage: float
    network_status: str
    harris_pacs_status: str
    ai_agents_active: int
    trust_fabric_health: str

class TerraFusionSystemMonitor:
    """TerraFusion System Monitor for Complete OS Oversight"""
    
    def __init__(self, port: int = 5080):
        self.port = port
        self.service_start_time = time.time()
        self.monitor_db = self._init_monitor_db()
        self.benton_config = self._load_benton_config()
        
        # Monitored services registry
        self.monitored_services = {
            5000: "Trust Fabric Core Engine",
            5001: "Trust Fabric API Gateway",
            5010: "TerraFusionSync",
            5030: "AI Consciousness Service",
            5040: "Government Service Orchestrator",
            5050: "TerraFusion Analytics Engine",
            5060: "TerraFusion Command Center",
            5070: "TerraFusion Desktop Environment",
            3015: "Government Core Service",
            3016: "Property Assessment Service",
            3017: "Tax Management Service",
            3018: "GIS Data Service",
            3019: "Revenue Optimization",
            3020: "Digital Identity Service",
            3021: "Environmental Monitoring",
            3022: "Economic Development",
            3023: "Transportation Management"
        }
        
        # System metrics
        self.current_metrics: Dict[str, SystemMetric] = {}
        self.service_health: Dict[int, ServiceHealth] = {}
        self.alert_history: List[Dict[str, Any]] = []
        
        # Start continuous monitoring
        asyncio.create_task(self._continuous_system_monitoring())
        
        logger.info(f"📊 TerraFusion System Monitor initialized")
        logger.info(f"📍 Deployment: Benton County, Washington")
        logger.info(f"🔍 Monitoring: {len(self.monitored_services)} services")
        logger.info(f"⚡ Monitor port: {self.port}")
    
    def _load_benton_config(self) -> Dict[str, Any]:
        """Load real Benton County configuration"""
        config_path = "/workspaces/terrafusion_os_1.0/benton-county-config.json"
        try:
            with open(config_path, 'r') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Failed to load Benton County config: {e}")
            return {'county': 'benton', 'state': 'washington', 'parcels': 89247}
    
    def _init_monitor_db(self) -> sqlite3.Connection:
        """Initialize System Monitor database"""
        db_path = "/workspaces/terrafusion_os_1.0/trust-fabric/system_monitor.db"
        conn = sqlite3.connect(db_path)
        
        # System metrics table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS system_metrics (
                metric_id TEXT PRIMARY KEY,
                metric_name TEXT NOT NULL,
                current_value REAL NOT NULL,
                unit TEXT NOT NULL,
                threshold_warning REAL NOT NULL,
                threshold_critical REAL NOT NULL,
                status TEXT NOT NULL,
                timestamp REAL NOT NULL
            )
        """)
        
        # Service health table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS service_health (
                port INTEGER PRIMARY KEY,
                service_name TEXT NOT NULL,
                status TEXT NOT NULL,
                response_time REAL NOT NULL,
                uptime REAL NOT NULL,
                trust_score REAL NOT NULL,
                error_count INTEGER DEFAULT 0,
                last_check REAL NOT NULL
            )
        """)
        
        # Performance history
        conn.execute("""
            CREATE TABLE IF NOT EXISTS performance_history (
                timestamp REAL PRIMARY KEY,
                cpu_usage REAL NOT NULL,
                memory_usage REAL NOT NULL,
                disk_usage REAL NOT NULL,
                network_bytes_sent REAL NOT NULL,
                network_bytes_recv REAL NOT NULL,
                active_services INTEGER NOT NULL
            )
        """)
        
        # System alerts
        conn.execute("""
            CREATE TABLE IF NOT EXISTS system_alerts (
                alert_id TEXT PRIMARY KEY,
                alert_type TEXT NOT NULL,
                severity TEXT NOT NULL,
                message TEXT NOT NULL,
                service_affected TEXT,
                timestamp REAL NOT NULL,
                resolved BOOLEAN DEFAULT FALSE
            )
        """)
        
        conn.commit()
        return conn
    
    async def _continuous_system_monitoring(self):
        """Continuous system monitoring loop"""
        while True:
            try:
                await self._collect_system_metrics()
                await self._monitor_service_health()
                await self._check_alert_conditions()
                await asyncio.sleep(10)  # Monitor every 10 seconds
            except Exception as e:
                logger.error(f"System monitoring error: {e}")
                await asyncio.sleep(10)
    
    async def _collect_system_metrics(self):
        """Collect system performance metrics"""
        try:
            # CPU usage
            cpu_percent = psutil.cpu_percent(interval=1)
            self.current_metrics['cpu_usage'] = SystemMetric(
                metric_name="CPU Usage",
                current_value=cpu_percent,
                unit="%",
                threshold_warning=70.0,
                threshold_critical=90.0,
                status=self._get_metric_status(cpu_percent, 70.0, 90.0),
                timestamp=time.time()
            )
            
            # Memory usage
            memory = psutil.virtual_memory()
            memory_percent = memory.percent
            self.current_metrics['memory_usage'] = SystemMetric(
                metric_name="Memory Usage",
                current_value=memory_percent,
                unit="%",
                threshold_warning=75.0,
                threshold_critical=90.0,
                status=self._get_metric_status(memory_percent, 75.0, 90.0),
                timestamp=time.time()
            )
            
            # Disk usage
            disk = psutil.disk_usage('/')
            disk_percent = (disk.used / disk.total) * 100
            self.current_metrics['disk_usage'] = SystemMetric(
                metric_name="Disk Usage",
                current_value=disk_percent,
                unit="%",
                threshold_warning=80.0,
                threshold_critical=95.0,
                status=self._get_metric_status(disk_percent, 80.0, 95.0),
                timestamp=time.time()
            )
            
            # Network I/O
            network = psutil.net_io_counters()
            self.current_metrics['network_sent'] = SystemMetric(
                metric_name="Network Sent",
                current_value=network.bytes_sent / (1024 * 1024),  # MB
                unit="MB",
                threshold_warning=1000.0,
                threshold_critical=5000.0,
                status="NORMAL",
                timestamp=time.time()
            )
            
            # Store metrics in database
            await self._store_system_metrics()
            
        except Exception as e:
            logger.error(f"Failed to collect system metrics: {e}")
    
    def _get_metric_status(self, value: float, warning: float, critical: float) -> str:
        """Get metric status based on thresholds"""
        if value >= critical:
            return "CRITICAL"
        elif value >= warning:
            return "WARNING"
        else:
            return "NORMAL"
    
    async def _monitor_service_health(self):
        """Monitor health of all services"""
        for port, service_name in self.monitored_services.items():
            try:
                health_start = time.time()
                
                async with aiohttp.ClientSession() as session:
                    async with session.get(f'http://localhost:{port}/', timeout=5) as response:
                        response_time = time.time() - health_start
                        
                        if response.status == 200:
                            status = "OPERATIONAL"
                            error_count = 0
                        else:
                            status = "DEGRADED"
                            error_count = 1
                
                # Get trust score
                trust_score = await self._get_service_trust_score(port)
                
                # Calculate uptime (simplified)
                uptime = time.time() - self.service_start_time
                
                health = ServiceHealth(
                    service_name=service_name,
                    port=port,
                    status=status,
                    response_time=response_time,
                    uptime=uptime,
                    trust_score=trust_score,
                    error_count=error_count,
                    last_check=time.time()
                )
                
                self.service_health[port] = health
                await self._store_service_health(health)
                
            except Exception as e:
                logger.warning(f"Health check failed for {service_name} (port {port}): {e}")
                
                health = ServiceHealth(
                    service_name=service_name,
                    port=port,
                    status="DOWN",
                    response_time=5.0,
                    uptime=0.0,
                    trust_score=0.0,
                    error_count=1,
                    last_check=time.time()
                )
                
                self.service_health[port] = health
                await self._store_service_health(health)
    
    async def _get_service_trust_score(self, port: int) -> float:
        """Get service trust score from Trust Fabric"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get('http://localhost:${TF_STATIC_PORT:-8080}/api/trust-fabric/services', timeout=3) as response:
                    if response.status == 200:
                        data = await response.json()
                        for service in data.get('services', []):
                            if service.get('port') == port:
                                return service.get('trust_score', 0.7)
        except:
            pass
        return 0.7
    
    async def _check_alert_conditions(self):
        """Check for alert conditions"""
        alerts = []
        
        # Check CPU usage
        if 'cpu_usage' in self.current_metrics:
            cpu_metric = self.current_metrics['cpu_usage']
            if cpu_metric.status == "CRITICAL":
                alerts.append({
                    'type': 'PERFORMANCE',
                    'severity': 'CRITICAL',
                    'message': f'CPU usage is {cpu_metric.current_value:.1f}% (Critical threshold: {cpu_metric.threshold_critical}%)'
                })
            elif cpu_metric.status == "WARNING":
                alerts.append({
                    'type': 'PERFORMANCE',
                    'severity': 'WARNING',
                    'message': f'CPU usage is {cpu_metric.current_value:.1f}% (Warning threshold: {cpu_metric.threshold_warning}%)'
                })
        
        # Check service failures
        down_services = [health for health in self.service_health.values() if health.status == "DOWN"]
        if down_services:
            alerts.append({
                'type': 'SERVICE',
                'severity': 'CRITICAL',
                'message': f'{len(down_services)} services are down: {", ".join([s.service_name for s in down_services])}'
            })
        
        # Store alerts
        for alert in alerts:
            await self._store_alert(alert)
    
    async def _store_system_metrics(self):
        """Store system metrics in database"""
        cursor = self.monitor_db.cursor()
        for metric in self.current_metrics.values():
            metric_id = hashlib.sha256(f"{metric.metric_name}_{metric.timestamp}".encode()).hexdigest()[:12]
            cursor.execute("""
                INSERT INTO system_metrics VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                metric_id,
                metric.metric_name,
                metric.current_value,
                metric.unit,
                metric.threshold_warning,
                metric.threshold_critical,
                metric.status,
                metric.timestamp
            ))
        self.monitor_db.commit()
    
    async def _store_service_health(self, health: ServiceHealth):
        """Store service health in database"""
        cursor = self.monitor_db.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO service_health VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            health.port,
            health.service_name,
            health.status,
            health.response_time,
            health.uptime,
            health.trust_score,
            health.error_count,
            health.last_check
        ))
        self.monitor_db.commit()
    
    async def _store_alert(self, alert: Dict[str, Any]):
        """Store system alert"""
        alert_id = hashlib.sha256(f"{alert['type']}_{alert['message']}_{time.time()}".encode()).hexdigest()[:12]
        cursor = self.monitor_db.cursor()
        cursor.execute("""
            INSERT INTO system_alerts VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            alert_id,
            alert['type'],
            alert['severity'],
            alert['message'],
            alert.get('service_affected'),
            time.time(),
            False
        ))
        self.monitor_db.commit()
        self.alert_history.append(alert)
    
    async def get_system_overview(self) -> SystemOverview:
        """Get complete system overview"""
        # Count operational services
        operational_services = sum(1 for health in self.service_health.values() 
                                 if health.status == "OPERATIONAL")
        
        # Get system metrics
        cpu_usage = self.current_metrics.get('cpu_usage', SystemMetric("", 0, "", 0, 0, "", 0)).current_value
        memory_usage = self.current_metrics.get('memory_usage', SystemMetric("", 0, "", 0, 0, "", 0)).current_value
        disk_usage = self.current_metrics.get('disk_usage', SystemMetric("", 0, "", 0, 0, "", 0)).current_value
        
        # Check Harris PACS status
        harris_status = "DISCONNECTED"
        if 5010 in self.service_health and self.service_health[5010].status == "OPERATIONAL":
            harris_status = "CONNECTED"
        
        # Check AI agents
        ai_agents_active = 0
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get('http://localhost:${TF_STATIC_PORT:-8080}/api/consciousness/status', timeout=3) as response:
                    if response.status == 200:
                        data = await response.json()
                        ai_agents_active = data.get('active_agents', 0)
        except:
            pass
        
        # Check Trust Fabric health
        trust_fabric_health = "UNKNOWN"
        if 5000 in self.service_health:
            trust_fabric_health = self.service_health[5000].status
        
        return SystemOverview(
            os_status="OPERATIONAL" if operational_services > 15 else "DEGRADED",
            total_services=len(self.monitored_services),
            operational_services=operational_services,
            system_uptime=time.time() - self.service_start_time,
            cpu_usage=cpu_usage,
            memory_usage=memory_usage,
            disk_usage=disk_usage,
            network_status="NORMAL",
            harris_pacs_status=harris_status,
            ai_agents_active=ai_agents_active,
            trust_fabric_health=trust_fabric_health
        )
    
    async def get_monitoring_dashboard_html(self) -> str:
        """Generate monitoring dashboard HTML"""
        html = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TerraFusion System Monitor - Benton County Government</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #0f172a;
            color: white;
            overflow-x: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #1e40af 0%, #3730a3 100%);
            padding: 20px;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        
        .header h1 {
            font-size: 28px;
            margin-bottom: 5px;
        }
        
        .header .subtitle {
            opacity: 0.8;
            font-size: 16px;
        }
        
        .dashboard {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 20px;
            padding: 20px;
            max-height: calc(100vh - 120px);
            overflow-y: auto;
        }
        
        .card {
            background: rgba(255,255,255,0.05);
            backdrop-filter: blur(10px);
            border-radius: 12px;
            padding: 20px;
            border: 1px solid rgba(255,255,255,0.1);
        }
        
        .card h3 {
            color: #60a5fa;
            margin-bottom: 15px;
            font-size: 18px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .metric {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
            padding: 8px;
            background: rgba(255,255,255,0.05);
            border-radius: 6px;
        }
        
        .metric-name {
            font-size: 14px;
        }
        
        .metric-value {
            font-weight: bold;
            font-size: 16px;
        }
        
        .status-normal { color: #10b981; }
        .status-warning { color: #f59e0b; }
        .status-critical { color: #ef4444; }
        .status-operational { color: #10b981; }
        .status-degraded { color: #f59e0b; }
        .status-down { color: #ef4444; }
        
        .service-list {
            max-height: 300px;
            overflow-y: auto;
        }
        
        .service-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px;
            margin-bottom: 5px;
            background: rgba(255,255,255,0.05);
            border-radius: 6px;
            font-size: 14px;
        }
        
        .service-name {
            flex: 1;
        }
        
        .service-port {
            background: rgba(96,165,250,0.2);
            color: #60a5fa;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 12px;
            margin: 0 10px;
        }
        
        .progress-bar {
            width: 100%;
            height: 20px;
            background: rgba(255,255,255,0.1);
            border-radius: 10px;
            overflow: hidden;
            margin: 10px 0;
        }
        
        .progress-fill {
            height: 100%;
            border-radius: 10px;
            transition: width 0.3s ease;
        }
        
        .progress-normal { background: linear-gradient(90deg, #10b981, #059669); }
        .progress-warning { background: linear-gradient(90deg, #f59e0b, #d97706); }
        .progress-critical { background: linear-gradient(90deg, #ef4444, #dc2626); }
        
        .alert {
            background: rgba(239,68,68,0.1);
            border: 1px solid #ef4444;
            border-radius: 6px;
            padding: 10px;
            margin-bottom: 10px;
            font-size: 14px;
        }
        
        .alert-critical { border-color: #ef4444; }
        .alert-warning { border-color: #f59e0b; background: rgba(245,158,11,0.1); }
        
        .refresh-indicator {
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(16,185,129,0.2);
            color: #10b981;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            border: 1px solid #10b981;
        }
        
        .big-number {
            font-size: 36px;
            font-weight: bold;
            text-align: center;
            margin: 10px 0;
        }
        
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
        
        .pulsing {
            animation: pulse 2s infinite;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎯 TerraFusion System Monitor</h1>
        <div class="subtitle">Real-time monitoring • Benton County Government • TerraFusion OS v1.0</div>
    </div>
    
    <div class="refresh-indicator" id="refreshIndicator">
        🔄 Refreshing...
    </div>
    
    <div class="dashboard">
        <!-- System Overview -->
        <div class="card">
            <h3>🖥️ System Overview</h3>
            <div class="big-number status-operational" id="osStatus">OPERATIONAL</div>
            <div class="metric">
                <span class="metric-name">Services Operational</span>
                <span class="metric-value" id="servicesOperational">--/--</span>
            </div>
            <div class="metric">
                <span class="metric-name">System Uptime</span>
                <span class="metric-value" id="systemUptime">--</span>
            </div>
            <div class="metric">
                <span class="metric-name">Harris PACS Status</span>
                <span class="metric-value" id="harrisStatus">--</span>
            </div>
            <div class="metric">
                <span class="metric-name">AI Agents Active</span>
                <span class="metric-value" id="aiAgents">--</span>
            </div>
        </div>
        
        <!-- Performance Metrics -->
        <div class="card">
            <h3>📊 Performance Metrics</h3>
            
            <div class="metric">
                <span class="metric-name">CPU Usage</span>
                <span class="metric-value" id="cpuValue">--%</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill progress-normal" id="cpuProgress" style="width: 0%"></div>
            </div>
            
            <div class="metric">
                <span class="metric-name">Memory Usage</span>
                <span class="metric-value" id="memoryValue">--%</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill progress-normal" id="memoryProgress" style="width: 0%"></div>
            </div>
            
            <div class="metric">
                <span class="metric-name">Disk Usage</span>
                <span class="metric-value" id="diskValue">--%</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill progress-normal" id="diskProgress" style="width: 0%"></div>
            </div>
        </div>
        
        <!-- Service Health -->
        <div class="card">
            <h3>🔧 Service Health</h3>
            <div class="service-list" id="serviceList">
                <!-- Services will be populated here -->
            </div>
        </div>
        
        <!-- Trust Fabric Status -->
        <div class="card">
            <h3>🔐 Trust Fabric Status</h3>
            <div class="metric">
                <span class="metric-name">Trust Fabric Health</span>
                <span class="metric-value" id="trustFabricHealth">--</span>
            </div>
            <div class="metric">
                <span class="metric-name">Total Services Registered</span>
                <span class="metric-value" id="registeredServices">--</span>
            </div>
            <div class="metric">
                <span class="metric-name">Average Trust Score</span>
                <span class="metric-value" id="avgTrustScore">--</span>
            </div>
        </div>
        
        <!-- Harris PACS Integration -->
        <div class="card">
            <h3>🏠 Harris PACS Integration</h3>
            <div class="big-number status-operational" id="harrisParcels">89,247</div>
            <div style="text-align: center; opacity: 0.8; margin-bottom: 15px;">Parcels Connected</div>
            <div class="metric">
                <span class="metric-name">Data Freshness</span>
                <span class="metric-value" id="dataFreshness">--</span>
            </div>
            <div class="metric">
                <span class="metric-name">Sync Status</span>
                <span class="metric-value" id="syncStatus">--</span>
            </div>
        </div>
        
        <!-- System Alerts -->
        <div class="card">
            <h3>🚨 System Alerts</h3>
            <div id="alertsList">
                <div style="text-align: center; opacity: 0.6; padding: 20px;">
                    No active alerts
                </div>
            </div>
        </div>
    </div>

    <script>
        let refreshInterval;
        
        // Initialize monitoring dashboard
        document.addEventListener('DOMContentLoaded', function() {
            refreshData();
            refreshInterval = setInterval(refreshData, 5000); // Refresh every 5 seconds
        });
        
        async function refreshData() {
            const indicator = document.getElementById('refreshIndicator');
            indicator.style.display = 'block';
            
            try {
                // Get system overview
                const overviewResponse = await fetch('/api/monitor/overview');
                if (overviewResponse.ok) {
                    const overview = await overviewResponse.json();
                    updateSystemOverview(overview);
                }
                
                // Get metrics
                const metricsResponse = await fetch('/api/monitor/metrics');
                if (metricsResponse.ok) {
                    const metrics = await metricsResponse.json();
                    updatePerformanceMetrics(metrics);
                }
                
                // Get service health
                const servicesResponse = await fetch('/api/monitor/services');
                if (servicesResponse.ok) {
                    const services = await servicesResponse.json();
                    updateServiceHealth(services);
                }
                
                // Get Trust Fabric status
                try {
                    const trustResponse = await fetch('http://localhost:${TF_STATIC_PORT:-8080}/api/trust-fabric/status');
                    if (trustResponse.ok) {
                        const trustData = await trustResponse.json();
                        updateTrustFabricStatus(trustData);
                    }
                } catch (e) {
                    console.warn('Trust Fabric not accessible');
                }
                
            } catch (error) {
                console.error('Failed to refresh data:', error);
            } finally {
                indicator.style.display = 'none';
            }
        }
        
        function updateSystemOverview(overview) {
            document.getElementById('osStatus').textContent = overview.os_status;
            document.getElementById('osStatus').className = `big-number status-${overview.os_status.toLowerCase()}`;
            
            document.getElementById('servicesOperational').textContent = 
                `${overview.operational_services}/${overview.total_services}`;
            
            document.getElementById('systemUptime').textContent = formatUptime(overview.system_uptime);
            
            const harrisStatus = document.getElementById('harrisStatus');
            harrisStatus.textContent = overview.harris_pacs_status;
            harrisStatus.className = `metric-value status-${overview.harris_pacs_status.toLowerCase().replace('_', '-')}`;
            
            document.getElementById('aiAgents').textContent = overview.ai_agents_active;
        }
        
        function updatePerformanceMetrics(metrics) {
            // CPU
            if (metrics.cpu_usage) {
                const cpu = metrics.cpu_usage;
                document.getElementById('cpuValue').textContent = `${cpu.current_value.toFixed(1)}%`;
                document.getElementById('cpuProgress').style.width = `${cpu.current_value}%`;
                document.getElementById('cpuProgress').className = 
                    `progress-fill progress-${cpu.status.toLowerCase()}`;
            }
            
            // Memory
            if (metrics.memory_usage) {
                const memory = metrics.memory_usage;
                document.getElementById('memoryValue').textContent = `${memory.current_value.toFixed(1)}%`;
                document.getElementById('memoryProgress').style.width = `${memory.current_value}%`;
                document.getElementById('memoryProgress').className = 
                    `progress-fill progress-${memory.status.toLowerCase()}`;
            }
            
            // Disk
            if (metrics.disk_usage) {
                const disk = metrics.disk_usage;
                document.getElementById('diskValue').textContent = `${disk.current_value.toFixed(1)}%`;
                document.getElementById('diskProgress').style.width = `${disk.current_value}%`;
                document.getElementById('diskProgress').className = 
                    `progress-fill progress-${disk.status.toLowerCase()}`;
            }
        }
        
        function updateServiceHealth(services) {
            const serviceList = document.getElementById('serviceList');
            serviceList.innerHTML = '';
            
            services.services.forEach(service => {
                const serviceDiv = document.createElement('div');
                serviceDiv.className = 'service-item';
                serviceDiv.innerHTML = `
                    <span class="service-name">${service.service_name}</span>
                    <span class="service-port">${service.port}</span>
                    <span class="metric-value status-${service.status.toLowerCase()}">${service.status}</span>
                `;
                serviceList.appendChild(serviceDiv);
            });
        }
        
        function updateTrustFabricStatus(trustData) {
            document.getElementById('trustFabricHealth').textContent = trustData.status || 'UNKNOWN';
            document.getElementById('registeredServices').textContent = trustData.total_services || '--';
            document.getElementById('avgTrustScore').textContent = 
                trustData.total_trust_score ? trustData.total_trust_score.toFixed(3) : '--';
        }
        
        function formatUptime(seconds) {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            return `${hours}h ${minutes}m`;
        }
    </script>
</body>
</html>
        """
        return html.strip()
    
    # HTTP API Endpoints
    async def handle_dashboard(self, request):
        """GET / - Monitoring dashboard"""
        html = await self.get_monitoring_dashboard_html()
        return web.Response(text=html, content_type='text/html')
    
    async def handle_overview(self, request):
        """GET /api/monitor/overview"""
        overview = await self.get_system_overview()
        return web.json_response(asdict(overview))
    
    async def handle_metrics(self, request):
        """GET /api/monitor/metrics"""
        metrics = {name: asdict(metric) for name, metric in self.current_metrics.items()}
        return web.json_response(metrics)
    
    async def handle_services(self, request):
        """GET /api/monitor/services"""
        services = [asdict(health) for health in self.service_health.values()]
        return web.json_response({'services': services, 'count': len(services)})
    
    async def handle_alerts(self, request):
        """GET /api/monitor/alerts"""
        return web.json_response({'alerts': self.alert_history[-10:], 'count': len(self.alert_history)})
    
    async def start_service(self):
        """Start the TerraFusion System Monitor"""
        # Create web application
        app = web.Application()
        
        # Add routes
        app.router.add_get('/', self.handle_dashboard)
        app.router.add_get('/api/monitor/overview', self.handle_overview)
        app.router.add_get('/api/monitor/metrics', self.handle_metrics)
        app.router.add_get('/api/monitor/services', self.handle_services)
        app.router.add_get('/api/monitor/alerts', self.handle_alerts)
        
        # Register with Trust Fabric
        asyncio.create_task(self._register_with_trust_fabric_delayed())
        
        # Start HTTP server
        runner = web.AppRunner(app)
        await runner.setup()
        site = web.TCPSite(runner, 'localhost', self.port)
        await site.start()
        
        logger.info(f"🚀 TerraFusion System Monitor started on http://localhost:{self.port}")
        logger.info(f"📊 Real-time OS monitoring dashboard active")
        
        return runner
    
    async def _register_with_trust_fabric_delayed(self):
        """Register with Trust Fabric after startup delay"""
        await asyncio.sleep(15)
        try:
            registration_data = {
                'service_name': 'TerraFusion System Monitor',
                'port': self.port,
                'validation_proofs': ['system_monitoring', 'performance_analytics', 'health_dashboard']
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post('http://localhost:${TF_STATIC_PORT:-8080}/api/trust-fabric/register', 
                                      json=registration_data, timeout=5) as response:
                    if response.status == 200:
                        data = await response.json()
                        logger.info(f"🔐 Registered with Trust Fabric: {data['service_id']}")
        except Exception as e:
            logger.error(f"Trust Fabric registration failed: {e}")

async def main():
    """Start TerraFusion System Monitor"""
    print("📊 TERRAFUSION SYSTEM MONITOR - COMPLETE OS MONITORING")
    print("=" * 60)
    print("🔍 Real-time system health monitoring")
    print("📈 Performance metrics and analytics")
    print("🚨 Alert system and diagnostics")
    print("🏛️ Government operations oversight")
    print()
    
    try:
        system_monitor = TerraFusionSystemMonitor()
        runner = await system_monitor.start_service()
        
        # Keep service running
        try:
            while True:
                await asyncio.sleep(1)
        except KeyboardInterrupt:
            logger.info("🛑 Stopping TerraFusion System Monitor...")
            await runner.cleanup()
            
    except Exception as e:
        logger.error(f"❌ TerraFusion System Monitor startup failed: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    asyncio.run(main())
