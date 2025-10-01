# NO HARDCODED PORTS! Use environment variables.
#!/usr/bin/env python3
"""
TerraFusion Command Center - Unified Government Operations Interface
Real-time command and control for all TerraFusion OS services

This service provides:
- Unified dashboard for all government operations
- Real-time monitoring of all services
- Command execution across the entire OS
- Harris PACS integration status
- Trust Fabric oversight
- Emergency coordination capabilities
"""

import asyncio
import aiohttp
from aiohttp import web
import json
import time
import logging
import sqlite3
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
import hashlib
from pathlib import Path
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class ServiceStatus:
    """Service status information"""
    service_name: str
    port: int
    status: str
    trust_score: float
    last_check: float
    response_time: float

@dataclass
class SystemCommand:
    """System command definition"""
    command_id: str
    command_name: str
    target_services: List[int]
    command_type: str
    executed_at: float
    result: str

@dataclass
class CommandCenterStatus:
    """TerraFusion Command Center status"""
    service: str
    status: str
    services_monitored: int
    services_operational: int
    harris_pacs_status: str
    trust_fabric_status: str
    ai_consciousness_status: str
    analytics_status: str
    orchestrator_status: str
    last_system_health_check: float

class TerraFusionCommandCenter:
    """TerraFusion Command Center for Benton County"""
    
    def __init__(self, port: int = 5060):
        self.port = port
        self.service_start_time = time.time()
        self.command_db = self._init_command_db()
        self.benton_config = self._load_benton_config()
        
        # Service registry
        self.monitored_services = {
            5000: "Trust Fabric Core Engine",
            5001: "Trust Fabric API Gateway", 
            5010: "TerraFusionSync",
            5030: "AI Consciousness Service",
            5040: "Government Service Orchestrator",
            5050: "TerraFusion Analytics Engine",
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
        
        self.service_statuses: Dict[int, ServiceStatus] = {}
        self.system_commands: Dict[str, SystemCommand] = {}
        
        # Start continuous monitoring
        asyncio.create_task(self._continuous_health_monitoring())
        
        logger.info(f"🎯 TerraFusion Command Center initialized")
        logger.info(f"📍 Deployment: Benton County, Washington")
        logger.info(f"👁️ Monitoring: {len(self.monitored_services)} services")
        logger.info(f"⚡ Command port: {self.port}")
    
    def _load_benton_config(self) -> Dict[str, Any]:
        """Load real Benton County configuration"""
        config_path = "/workspaces/terrafusion_os_1.0/benton-county-config.json"
        try:
            with open(config_path, 'r') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Failed to load Benton County config: {e}")
            return {'county': 'benton', 'state': 'washington', 'parcels': 89247}
    
    def _init_command_db(self) -> sqlite3.Connection:
        """Initialize TerraFusion Command Center database"""
        db_path = "/workspaces/terrafusion_os_1.0/trust-fabric/command_center.db"
        conn = sqlite3.connect(db_path)
        
        # Service statuses table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS service_statuses (
                port INTEGER PRIMARY KEY,
                service_name TEXT NOT NULL,
                status TEXT NOT NULL,
                trust_score REAL NOT NULL,
                last_check REAL NOT NULL,
                response_time REAL NOT NULL
            )
        """)
        
        # System commands table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS system_commands (
                command_id TEXT PRIMARY KEY,
                command_name TEXT NOT NULL,
                target_services TEXT NOT NULL,
                command_type TEXT NOT NULL,
                executed_at REAL NOT NULL,
                result TEXT NOT NULL
            )
        """)
        
        # System health history
        conn.execute("""
            CREATE TABLE IF NOT EXISTS health_history (
                timestamp REAL PRIMARY KEY,
                total_services INTEGER NOT NULL,
                operational_services INTEGER NOT NULL,
                avg_trust_score REAL NOT NULL,
                avg_response_time REAL NOT NULL,
                system_health_score REAL NOT NULL
            )
        """)
        
        # Command execution log
        conn.execute("""
            CREATE TABLE IF NOT EXISTS command_log (
                log_id TEXT PRIMARY KEY,
                timestamp REAL NOT NULL,
                command_type TEXT NOT NULL,
                target_service INTEGER,
                execution_result TEXT NOT NULL,
                execution_time REAL NOT NULL
            )
        """)
        
        conn.commit()
        return conn
    
    async def _continuous_health_monitoring(self):
        """Continuous health monitoring of all services"""
        while True:
            try:
                await self._perform_system_health_check()
                await asyncio.sleep(30)  # Check every 30 seconds
            except Exception as e:
                logger.error(f"Health monitoring error: {e}")
                await asyncio.sleep(30)
    
    async def _perform_system_health_check(self):
        """Perform comprehensive system health check"""
        health_start = time.time()
        operational_count = 0
        total_trust_score = 0.0
        total_response_time = 0.0
        
        for port, service_name in self.monitored_services.items():
            try:
                check_start = time.time()
                async with aiohttp.ClientSession() as session:
                    async with session.get(f'http://localhost:{port}/', timeout=5) as response:
                        response_time = time.time() - check_start
                        
                        if response.status == 200:
                            trust_score = await self._get_service_trust_score(port)
                            status = ServiceStatus(
                                service_name=service_name,
                                port=port,
                                status="OPERATIONAL",
                                trust_score=trust_score,
                                last_check=time.time(),
                                response_time=response_time
                            )
                            operational_count += 1
                            total_trust_score += trust_score
                            total_response_time += response_time
                        else:
                            status = ServiceStatus(
                                service_name=service_name,
                                port=port,
                                status="DOWN",
                                trust_score=0.0,
                                last_check=time.time(),
                                response_time=response_time
                            )
                
                self.service_statuses[port] = status
                await self._store_service_status(status)
                
            except Exception as e:
                logger.warning(f"Health check failed for {service_name} (port {port}): {e}")
                status = ServiceStatus(
                    service_name=service_name,
                    port=port,
                    status="UNREACHABLE",
                    trust_score=0.0,
                    last_check=time.time(),
                    response_time=5.0
                )
                self.service_statuses[port] = status
                await self._store_service_status(status)
        
        # Calculate system health metrics
        avg_trust_score = total_trust_score / max(operational_count, 1)
        avg_response_time = total_response_time / max(operational_count, 1)
        system_health_score = (operational_count / len(self.monitored_services)) * avg_trust_score
        
        # Store health history
        await self._store_health_history(len(self.monitored_services), operational_count, 
                                       avg_trust_score, avg_response_time, system_health_score)
        
        logger.info(f"🏥 Health check complete: {operational_count}/{len(self.monitored_services)} services operational")
    
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
        return 0.7  # Default trust score
    
    async def _store_service_status(self, status: ServiceStatus):
        """Store service status in database"""
        cursor = self.command_db.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO service_statuses VALUES (?, ?, ?, ?, ?, ?)
        """, (
            status.port,
            status.service_name,
            status.status,
            status.trust_score,
            status.last_check,
            status.response_time
        ))
        self.command_db.commit()
    
    async def _store_health_history(self, total: int, operational: int, avg_trust: float, 
                                  avg_response: float, health_score: float):
        """Store system health history"""
        cursor = self.command_db.cursor()
        cursor.execute("""
            INSERT INTO health_history VALUES (?, ?, ?, ?, ?, ?)
        """, (time.time(), total, operational, avg_trust, avg_response, health_score))
        self.command_db.commit()
    
    async def execute_system_command(self, command_name: str, target_services: List[int], 
                                   command_type: str) -> SystemCommand:
        """Execute system-wide command"""
        command_id = hashlib.sha256(f"cmd_{command_name}_{time.time()}".encode()).hexdigest()[:12]
        execution_start = time.time()
        
        logger.info(f"⚡ Executing system command: {command_name}")
        
        results = []
        for port in target_services:
            if port in self.monitored_services:
                try:
                    if command_type == "HEALTH_CHECK":
                        result = await self._execute_health_check_command(port)
                    elif command_type == "STATUS_QUERY":
                        result = await self._execute_status_query_command(port)
                    elif command_type == "TRUST_VALIDATION":
                        result = await self._execute_trust_validation_command(port)
                    else:
                        result = f"Unknown command type: {command_type}"
                    
                    results.append(f"Port {port}: {result}")
                    
                except Exception as e:
                    results.append(f"Port {port}: FAILED - {str(e)}")
        
        command = SystemCommand(
            command_id=command_id,
            command_name=command_name,
            target_services=target_services,
            command_type=command_type,
            executed_at=execution_start,
            result="; ".join(results)
        )
        
        self.system_commands[command_id] = command
        await self._store_system_command(command)
        
        execution_time = time.time() - execution_start
        await self._log_command_execution(command_type, len(target_services), 
                                        "SUCCESS", execution_time)
        
        logger.info(f"✅ System command completed: {command_name} ({execution_time:.2f}s)")
        return command
    
    async def _execute_health_check_command(self, port: int) -> str:
        """Execute health check command on service"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f'http://localhost:{port}/', timeout=3) as response:
                    if response.status == 200:
                        return "HEALTHY"
                    else:
                        return f"UNHEALTHY (HTTP {response.status})"
        except Exception as e:
            return f"UNREACHABLE ({str(e)})"
    
    async def _execute_status_query_command(self, port: int) -> str:
        """Execute status query command on service"""
        try:
            async with aiohttp.ClientSession() as session:
                # Try multiple status endpoints
                endpoints = ["/api/status", "/status", "/api/health", "/"]
                for endpoint in endpoints:
                    try:
                        async with session.get(f'http://localhost:{port}{endpoint}', timeout=3) as response:
                            if response.status == 200:
                                data = await response.json()
                                return f"STATUS_OK - {data.get('status', 'UNKNOWN')}"
                    except:
                        continue
                return "NO_STATUS_ENDPOINT"
        except Exception as e:
            return f"STATUS_QUERY_FAILED ({str(e)})"
    
    async def _execute_trust_validation_command(self, port: int) -> str:
        """Execute trust validation command"""
        try:
            trust_score = await self._get_service_trust_score(port)
            if trust_score >= 0.8:
                return f"TRUST_HIGH ({trust_score:.3f})"
            elif trust_score >= 0.6:
                return f"TRUST_MEDIUM ({trust_score:.3f})"
            else:
                return f"TRUST_LOW ({trust_score:.3f})"
        except Exception as e:
            return f"TRUST_VALIDATION_FAILED ({str(e)})"
    
    async def _store_system_command(self, command: SystemCommand):
        """Store system command in database"""
        cursor = self.command_db.cursor()
        cursor.execute("""
            INSERT INTO system_commands VALUES (?, ?, ?, ?, ?, ?)
        """, (
            command.command_id,
            command.command_name,
            json.dumps(command.target_services),
            command.command_type,
            command.executed_at,
            command.result
        ))
        self.command_db.commit()
    
    async def _log_command_execution(self, command_type: str, target_count: int, 
                                   result: str, execution_time: float):
        """Log command execution"""
        log_id = hashlib.sha256(f"log_{command_type}_{time.time()}".encode()).hexdigest()[:12]
        cursor = self.command_db.cursor()
        cursor.execute("""
            INSERT INTO command_log VALUES (?, ?, ?, ?, ?, ?)
        """, (log_id, time.time(), command_type, target_count, result, execution_time))
        self.command_db.commit()
    
    async def get_system_overview(self) -> Dict[str, Any]:
        """Get comprehensive system overview"""
        # Service status summary
        operational_services = sum(1 for status in self.service_statuses.values() 
                                 if status.status == "OPERATIONAL")
        
        # Get Trust Fabric status
        trust_fabric_status = "UNKNOWN"
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get('http://localhost:${TF_STATIC_PORT:-8080}/api/trust-fabric/status', timeout=3) as response:
                    if response.status == 200:
                        data = await response.json()
                        trust_fabric_status = data.get('status', 'UNKNOWN')
        except:
            pass
        
        # Get Harris PACS status
        harris_status = "UNKNOWN"
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get('http://localhost:${TF_STATIC_PORT:-8080}/api/sync/status', timeout=3) as response:
                    if response.status == 200:
                        data = await response.json()
                        harris_status = data.get('harris_connection', 'UNKNOWN')
        except:
            pass
        
        # Get AI Consciousness status
        ai_status = "UNKNOWN"
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get('http://localhost:${TF_STATIC_PORT:-8080}/api/consciousness/status', timeout=3) as response:
                    if response.status == 200:
                        data = await response.json()
                        ai_status = data.get('status', 'UNKNOWN')
        except:
            pass
        
        # Get Analytics status
        analytics_status = "UNKNOWN"
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get('http://localhost:${TF_STATIC_PORT:-8080}/api/analytics/status', timeout=3) as response:
                    if response.status == 200:
                        data = await response.json()
                        analytics_status = data.get('status', 'UNKNOWN')
        except:
            pass
        
        # Get recent commands
        cursor = self.command_db.cursor()
        cursor.execute("SELECT * FROM system_commands ORDER BY executed_at DESC LIMIT 5")
        recent_commands = []
        for row in cursor.fetchall():
            recent_commands.append({
                'command_id': row[0],
                'command_name': row[1],
                'command_type': row[3],
                'executed_at': row[4],
                'result': row[5][:100] + "..." if len(row[5]) > 100 else row[5]
            })
        
        return {
            'terrafusion_os_status': 'OPERATIONAL',
            'benton_county_deployment': self.benton_config,
            'services_monitored': len(self.monitored_services),
            'services_operational': operational_services,
            'system_health_percentage': (operational_services / len(self.monitored_services)) * 100,
            'harris_pacs_status': harris_status,
            'trust_fabric_status': trust_fabric_status,
            'ai_consciousness_status': ai_status,
            'analytics_engine_status': analytics_status,
            'recent_commands': recent_commands,
            'uptime_seconds': time.time() - self.service_start_time,
            'last_health_check': max([s.last_check for s in self.service_statuses.values()], default=0)
        }
    
    async def get_command_center_status(self) -> CommandCenterStatus:
        """Get Command Center status"""
        operational_services = sum(1 for status in self.service_statuses.values() 
                                 if status.status == "OPERATIONAL")
        
        # Check key services
        harris_status = "DISCONNECTED"
        trust_fabric_status = "DISCONNECTED"
        ai_status = "DISCONNECTED"
        analytics_status = "DISCONNECTED"
        orchestrator_status = "DISCONNECTED"
        
        if 5010 in self.service_statuses and self.service_statuses[5010].status == "OPERATIONAL":
            harris_status = "CONNECTED"
        if 5000 in self.service_statuses and self.service_statuses[5000].status == "OPERATIONAL":
            trust_fabric_status = "CONNECTED"
        if 5030 in self.service_statuses and self.service_statuses[5030].status == "OPERATIONAL":
            ai_status = "CONNECTED"
        if 5050 in self.service_statuses and self.service_statuses[5050].status == "OPERATIONAL":
            analytics_status = "CONNECTED"
        if 5040 in self.service_statuses and self.service_statuses[5040].status == "OPERATIONAL":
            orchestrator_status = "CONNECTED"
        
        return CommandCenterStatus(
            service="TerraFusion Command Center",
            status="OPERATIONAL",
            services_monitored=len(self.monitored_services),
            services_operational=operational_services,
            harris_pacs_status=harris_status,
            trust_fabric_status=trust_fabric_status,
            ai_consciousness_status=ai_status,
            analytics_status=analytics_status,
            orchestrator_status=orchestrator_status,
            last_system_health_check=max([s.last_check for s in self.service_statuses.values()], default=0)
        )
    
    # HTTP API Endpoints
    async def handle_status(self, request):
        """GET /api/command/status"""
        status = await self.get_command_center_status()
        return web.json_response(asdict(status))
    
    async def handle_overview(self, request):
        """GET /api/command/overview"""
        overview = await self.get_system_overview()
        return web.json_response(overview)
    
    async def handle_services(self, request):
        """GET /api/command/services"""
        services = [asdict(status) for status in self.service_statuses.values()]
        return web.json_response({'services': services, 'count': len(services)})
    
    async def handle_execute_command(self, request):
        """POST /api/command/execute"""
        data = await request.json()
        command_name = data.get('command_name', 'System Command')
        target_services = data.get('target_services', list(self.monitored_services.keys()))
        command_type = data.get('command_type', 'HEALTH_CHECK')
        
        try:
            command = await self.execute_system_command(command_name, target_services, command_type)
            return web.json_response(asdict(command))
        except Exception as e:
            return web.json_response({'error': str(e)}, status=500)
    
    async def handle_commands_history(self, request):
        """GET /api/command/history"""
        cursor = self.command_db.cursor()
        cursor.execute("SELECT * FROM system_commands ORDER BY executed_at DESC LIMIT 20")
        commands = []
        for row in cursor.fetchall():
            commands.append({
                'command_id': row[0],
                'command_name': row[1],
                'target_services': json.loads(row[2]),
                'command_type': row[3],
                'executed_at': row[4],
                'result': row[5]
            })
        return web.json_response({'commands': commands, 'count': len(commands)})
    
    async def handle_root(self, request):
        """GET / - Service info"""
        return web.json_response({
            'service': 'TerraFusion Command Center',
            'version': '1.0.0',
            'description': 'Unified Government Operations Interface for TerraFusion OS',
            'county': 'Benton County, Washington',
            'services_monitored': len(self.monitored_services),
            'command_center_status': 'OPERATIONAL'
        })
    
    async def start_service(self):
        """Start the TerraFusion Command Center"""
        # Create web application
        app = web.Application()
        
        # Add routes
        app.router.add_get('/', self.handle_root)
        app.router.add_get('/api/command/status', self.handle_status)
        app.router.add_get('/api/command/overview', self.handle_overview)
        app.router.add_get('/api/command/services', self.handle_services)
        app.router.add_post('/api/command/execute', self.handle_execute_command)
        app.router.add_get('/api/command/history', self.handle_commands_history)
        
        # Register with Trust Fabric
        asyncio.create_task(self._register_with_trust_fabric_delayed())
        
        # Start HTTP server
        runner = web.AppRunner(app)
        await runner.setup()
        site = web.TCPSite(runner, 'localhost', self.port)
        await site.start()
        
        logger.info(f"🚀 TerraFusion Command Center started on http://localhost:{self.port}")
        logger.info(f"🎯 Unified government operations interface active")
        
        return runner
    
    async def _register_with_trust_fabric_delayed(self):
        """Register with Trust Fabric after startup delay"""
        await asyncio.sleep(15)
        try:
            registration_data = {
                'service_name': 'TerraFusion Command Center',
                'port': self.port,
                'validation_proofs': ['command_and_control', 'system_monitoring', 'unified_operations']
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
    """Start TerraFusion Command Center"""
    print("🎯 TERRAFUSION COMMAND CENTER - UNIFIED GOVERNMENT OPERATIONS")
    print("=" * 70)
    print("🏛️ Complete government operating system oversight")
    print("📊 Real-time monitoring of all services")
    print("⚡ System-wide command execution")
    print("🔐 Trust Fabric integration")
    print("🧠 AI Consciousness coordination")
    print()
    
    try:
        command_center = TerraFusionCommandCenter()
        runner = await command_center.start_service()
        
        # Keep service running
        try:
            while True:
                await asyncio.sleep(1)
        except KeyboardInterrupt:
            logger.info("🛑 Stopping TerraFusion Command Center...")
            await runner.cleanup()
            
    except Exception as e:
        logger.error(f"❌ TerraFusion Command Center startup failed: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    asyncio.run(main())
