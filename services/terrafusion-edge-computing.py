# NO HARDCODED PORTS! Use environment variables.
#!/usr/bin/env python3
"""
TerraFusion Edge Computing Service - Government Edge Infrastructure
Bringing TerraFusion OS to the edge for local government operations

This service provides:
- Edge computing nodes for local government offices
- Low-latency government services
- Offline-capable operations
- Edge data synchronization
- Local disaster response capabilities
- Mobile government units support
- Rural connectivity solutions
- Real-time field operations
"""

import asyncio
import aiohttp
from aiohttp import web
import json
import time
import logging
import sqlite3
import psutil
import subprocess
import hashlib
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
import struct
import socket

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class EdgeNode:
    """Edge computing node configuration"""
    node_id: str
    node_name: str
    location: str
    node_type: str  # "office", "mobile", "field", "emergency"
    status: str
    ip_address: str
    cpu_cores: int
    memory_gb: float
    storage_gb: float
    services_running: List[str]
    last_sync: float
    connectivity_status: str
    battery_level: Optional[float] = None

@dataclass
class EdgeService:
    """Edge service deployment"""
    service_id: str
    service_name: str
    edge_nodes: List[str]
    replication_factor: int
    sync_priority: str  # "critical", "high", "normal", "low"
    offline_capable: bool
    last_deployment: float
    status: str

@dataclass
class EdgeSyncTask:
    """Edge data synchronization task"""
    task_id: str
    source_node: str
    target_node: str
    data_type: str
    sync_status: str
    started_at: float
    completed_at: Optional[float]
    data_size_mb: float
    priority: str

@dataclass
class EdgeComputingStatus:
    """TerraFusion Edge Computing status"""
    service: str
    status: str
    total_edge_nodes: int
    active_nodes: int
    services_deployed: int
    sync_tasks_active: int
    total_capacity_ghz: float
    total_storage_tb: float
    offline_ready_nodes: int

class TerraFusionEdgeComputing:
    """TerraFusion Edge Computing Service"""
    
    def __init__(self, port: int = 5100):
        self.port = port
        self.service_start_time = time.time()
        self.edge_db = self._init_edge_db()
        self.benton_config = self._load_benton_config()
        
        # Edge computing state
        self.edge_nodes: Dict[str, EdgeNode] = {}
        self.edge_services: Dict[str, EdgeService] = {}
        self.sync_tasks: Dict[str, EdgeSyncTask] = {}
        
        # Edge node types and their capabilities
        self.node_types = {
            'office': {
                'description': 'County office edge node',
                'typical_specs': '8 cores, 32GB RAM, 1TB storage',
                'services': ['citizen_portal', 'document_processing', 'local_cache']
            },
            'mobile': {
                'description': 'Mobile government unit',
                'typical_specs': '4 cores, 16GB RAM, 500GB storage, battery',
                'services': ['field_assessments', 'emergency_response', 'data_collection']
            },
            'field': {
                'description': 'Field operations unit',
                'typical_specs': '2 cores, 8GB RAM, 250GB storage, rugged',
                'services': ['survey_tools', 'inspection_apps', 'offline_maps']
            },
            'emergency': {
                'description': 'Emergency response node',
                'typical_specs': '6 cores, 24GB RAM, 750GB storage, redundant power',
                'services': ['crisis_management', 'communication_hub', 'resource_coordination']
            }
        }
        
        # Initialize Benton County edge nodes
        self._initialize_benton_edge_nodes()
        
        # Start edge monitoring
        asyncio.create_task(self._continuous_edge_monitoring())
        asyncio.create_task(self._edge_sync_orchestrator())
        
        logger.info(f"🌐 TerraFusion Edge Computing initialized")
        logger.info(f"📍 Deployment: Benton County Edge Network")
        logger.info(f"🏢 Edge nodes: {len(self.edge_nodes)} configured")
        logger.info(f"⚡ Edge port: {self.port}")
    
    def _load_benton_config(self) -> Dict[str, Any]:
        """Load real Benton County configuration"""
        config_path = "/workspaces/terrafusion_os_1.0/benton-county-config.json"
        try:
            with open(config_path, 'r') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Failed to load Benton County config: {e}")
            return {'county': 'benton', 'state': 'washington', 'population': 206873}
    
    def _init_edge_db(self) -> sqlite3.Connection:
        """Initialize Edge Computing database"""
        db_path = "/workspaces/terrafusion_os_1.0/trust-fabric/edge_computing.db"
        conn = sqlite3.connect(db_path)
        
        # Edge nodes table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS edge_nodes (
                node_id TEXT PRIMARY KEY,
                node_name TEXT NOT NULL,
                location TEXT NOT NULL,
                node_type TEXT NOT NULL,
                status TEXT NOT NULL,
                ip_address TEXT NOT NULL,
                cpu_cores INTEGER NOT NULL,
                memory_gb REAL NOT NULL,
                storage_gb REAL NOT NULL,
                services_running TEXT NOT NULL,
                last_sync REAL NOT NULL,
                connectivity_status TEXT NOT NULL,
                battery_level REAL,
                created_at REAL NOT NULL
            )
        """)
        
        # Edge services table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS edge_services (
                service_id TEXT PRIMARY KEY,
                service_name TEXT NOT NULL,
                edge_nodes TEXT NOT NULL,
                replication_factor INTEGER NOT NULL,
                sync_priority TEXT NOT NULL,
                offline_capable BOOLEAN NOT NULL,
                last_deployment REAL NOT NULL,
                status TEXT NOT NULL
            )
        """)
        
        # Sync tasks table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS sync_tasks (
                task_id TEXT PRIMARY KEY,
                source_node TEXT NOT NULL,
                target_node TEXT NOT NULL,
                data_type TEXT NOT NULL,
                sync_status TEXT NOT NULL,
                started_at REAL NOT NULL,
                completed_at REAL,
                data_size_mb REAL NOT NULL,
                priority TEXT NOT NULL
            )
        """)
        
        # Edge telemetry
        conn.execute("""
            CREATE TABLE IF NOT EXISTS edge_telemetry (
                telemetry_id TEXT PRIMARY KEY,
                node_id TEXT NOT NULL,
                cpu_usage REAL NOT NULL,
                memory_usage REAL NOT NULL,
                storage_usage REAL NOT NULL,
                network_latency REAL NOT NULL,
                timestamp REAL NOT NULL
            )
        """)
        
        conn.commit()
        return conn
    
    def _initialize_benton_edge_nodes(self):
        """Initialize Benton County edge computing nodes"""
        # Main county office nodes
        county_nodes = [
            EdgeNode(
                node_id="benton_main_office",
                node_name="Benton County Administration",
                location="Prosser, WA - Main Office",
                node_type="office",
                status="ACTIVE",
                ip_address="192.168.1.10",
                cpu_cores=12,
                memory_gb=64.0,
                storage_gb=2000.0,
                services_running=["trust_fabric_edge", "harris_sync_cache", "citizen_portal"],
                last_sync=time.time(),
                connectivity_status="ONLINE"
            ),
            EdgeNode(
                node_id="benton_assessor_office",
                node_name="Assessor's Office Edge Node",
                location="Prosser, WA - Assessor Building",
                node_type="office",
                status="ACTIVE",
                ip_address="192.168.1.11",
                cpu_cores=8,
                memory_gb=32.0,
                storage_gb=1000.0,
                services_running=["harris_pacs_edge", "property_analytics", "tax_calculation"],
                last_sync=time.time(),
                connectivity_status="ONLINE"
            ),
            EdgeNode(
                node_id="benton_planning_office",
                node_name="Planning Department Edge",
                location="Kennewick, WA - Planning Office",
                node_type="office",
                status="ACTIVE",
                ip_address="192.168.1.12",
                cpu_cores=6,
                memory_gb=24.0,
                storage_gb=750.0,
                services_running=["permit_processing", "zoning_maps", "gis_services"],
                last_sync=time.time(),
                connectivity_status="ONLINE"
            )
        ]
        
        # Mobile units for field operations
        mobile_nodes = [
            EdgeNode(
                node_id="benton_mobile_01",
                node_name="Mobile Assessment Unit 1",
                location="Field Operations - Mobile",
                node_type="mobile",
                status="ACTIVE",
                ip_address="192.168.2.101",
                cpu_cores=4,
                memory_gb=16.0,
                storage_gb=500.0,
                services_running=["field_assessments", "offline_harris", "mobile_sync"],
                last_sync=time.time() - 300,  # 5 minutes ago
                connectivity_status="INTERMITTENT",
                battery_level=87.5
            ),
            EdgeNode(
                node_id="benton_mobile_02",
                node_name="Emergency Response Unit",
                location="Emergency Operations - Mobile",
                node_type="emergency",
                status="STANDBY",
                ip_address="192.168.2.102",
                cpu_cores=6,
                memory_gb=24.0,
                storage_gb=750.0,
                services_running=["crisis_management", "communication_hub", "backup_systems"],
                last_sync=time.time() - 120,  # 2 minutes ago
                connectivity_status="ONLINE",
                battery_level=95.2
            )
        ]
        
        # Rural field nodes
        field_nodes = [
            EdgeNode(
                node_id="benton_field_west",
                node_name="West County Field Station",
                location="Rural West Benton County",
                node_type="field",
                status="ACTIVE",
                ip_address="192.168.3.201",
                cpu_cores=2,
                memory_gb=8.0,
                storage_gb=250.0,
                services_running=["survey_tools", "offline_maps", "data_collection"],
                last_sync=time.time() - 1800,  # 30 minutes ago
                connectivity_status="OFFLINE"
            ),
            EdgeNode(
                node_id="benton_field_east",
                node_name="East County Field Station",
                location="Rural East Benton County",
                node_type="field",
                status="ACTIVE",
                ip_address="192.168.3.202",
                cpu_cores=2,
                memory_gb=8.0,
                storage_gb=250.0,
                services_running=["agricultural_monitoring", "environmental_sensors"],
                last_sync=time.time() - 900,  # 15 minutes ago
                connectivity_status="LIMITED"
            )
        ]
        
        # Register all edge nodes
        all_nodes = county_nodes + mobile_nodes + field_nodes
        for node in all_nodes:
            self.edge_nodes[node.node_id] = node
            asyncio.create_task(self._store_edge_node(node))
        
        logger.info(f"🏢 Initialized {len(county_nodes)} office nodes")
        logger.info(f"🚐 Initialized {len(mobile_nodes)} mobile units")
        logger.info(f"🌾 Initialized {len(field_nodes)} field stations")
        
        # Initialize edge services
        self._initialize_edge_services()
    
    def _initialize_edge_services(self):
        """Initialize edge service deployments"""
        edge_services = [
            EdgeService(
                service_id="trust_fabric_edge",
                service_name="Trust Fabric Edge Cache",
                edge_nodes=["benton_main_office", "benton_assessor_office", "benton_mobile_01"],
                replication_factor=3,
                sync_priority="critical",
                offline_capable=True,
                last_deployment=time.time(),
                status="DEPLOYED"
            ),
            EdgeService(
                service_id="harris_pacs_edge",
                service_name="Harris PACS Edge Cache",
                edge_nodes=["benton_main_office", "benton_assessor_office", "benton_mobile_01", "benton_mobile_02"],
                replication_factor=4,
                sync_priority="high",
                offline_capable=True,
                last_deployment=time.time(),
                status="DEPLOYED"
            ),
            EdgeService(
                service_id="citizen_services_edge",
                service_name="Citizen Services Portal Edge",
                edge_nodes=["benton_main_office", "benton_planning_office"],
                replication_factor=2,
                sync_priority="normal",
                offline_capable=False,
                last_deployment=time.time(),
                status="DEPLOYED"
            ),
            EdgeService(
                service_id="field_operations_edge",
                service_name="Field Operations Suite",
                edge_nodes=["benton_mobile_01", "benton_field_west", "benton_field_east"],
                replication_factor=3,
                sync_priority="high",
                offline_capable=True,
                last_deployment=time.time(),
                status="DEPLOYED"
            ),
            EdgeService(
                service_id="emergency_response_edge",
                service_name="Emergency Response System",
                edge_nodes=["benton_mobile_02", "benton_main_office"],
                replication_factor=2,
                sync_priority="critical",
                offline_capable=True,
                last_deployment=time.time(),
                status="DEPLOYED"
            )
        ]
        
        for service in edge_services:
            self.edge_services[service.service_id] = service
            asyncio.create_task(self._store_edge_service(service))
        
        logger.info(f"🚀 Deployed {len(edge_services)} edge services")
    
    async def _continuous_edge_monitoring(self):
        """Continuous edge node monitoring"""
        while True:
            try:
                await self._monitor_edge_nodes()
                await self._check_connectivity()
                await self._optimize_edge_placement()
                await asyncio.sleep(30)  # Monitor every 30 seconds
            except Exception as e:
                logger.error(f"Edge monitoring error: {e}")
                await asyncio.sleep(30)
    
    async def _edge_sync_orchestrator(self):
        """Orchestrate data synchronization between edge nodes"""
        while True:
            try:
                await self._create_sync_tasks()
                await self._execute_sync_tasks()
                await self._cleanup_completed_syncs()
                await asyncio.sleep(60)  # Sync orchestration every minute
            except Exception as e:
                logger.error(f"Edge sync orchestration error: {e}")
                await asyncio.sleep(60)
    
    async def _monitor_edge_nodes(self):
        """Monitor edge node performance and status"""
        for node in self.edge_nodes.values():
            try:
                # Simulate edge node monitoring
                # In production, this would connect to actual edge node APIs
                
                # Update node status based on connectivity and last sync
                time_since_sync = time.time() - node.last_sync
                
                if time_since_sync > 3600:  # 1 hour
                    node.status = "DEGRADED"
                elif time_since_sync > 7200:  # 2 hours
                    node.status = "OFFLINE"
                elif node.connectivity_status == "OFFLINE":
                    node.status = "OFFLINE"
                else:
                    node.status = "ACTIVE"
                
                # Log telemetry data
                await self._store_edge_telemetry(node)
                
            except Exception as e:
                logger.error(f"Edge node monitoring failed for {node.node_id}: {e}")
    
    async def _check_connectivity(self):
        """Check connectivity status of edge nodes"""
        for node in self.edge_nodes.values():
            try:
                # Simulate connectivity check
                # In production, this would ping edge nodes or check heartbeats
                
                import random
                connectivity_states = ["ONLINE", "INTERMITTENT", "LIMITED", "OFFLINE"]
                
                # Bias towards better connectivity for office nodes
                if node.node_type == "office":
                    weights = [0.85, 0.10, 0.04, 0.01]
                elif node.node_type == "mobile":
                    weights = [0.60, 0.25, 0.10, 0.05]
                elif node.node_type == "field":
                    weights = [0.40, 0.30, 0.20, 0.10]
                else:  # emergency
                    weights = [0.75, 0.15, 0.08, 0.02]
                
                node.connectivity_status = random.choices(connectivity_states, weights=weights)[0]
                
                # Update last sync time for online nodes
                if node.connectivity_status in ["ONLINE", "INTERMITTENT"]:
                    node.last_sync = time.time()
                
            except Exception as e:
                logger.error(f"Connectivity check failed for {node.node_id}: {e}")
    
    async def _optimize_edge_placement(self):
        """Optimize service placement across edge nodes"""
        try:
            # Analyze current edge service distribution
            placement_analysis = {}
            
            for service in self.edge_services.values():
                active_nodes = []
                for node_id in service.edge_nodes:
                    node = self.edge_nodes.get(node_id)
                    if node and node.status == "ACTIVE":
                        active_nodes.append(node_id)
                
                placement_analysis[service.service_id] = {
                    'total_nodes': len(service.edge_nodes),
                    'active_nodes': len(active_nodes),
                    'replication_met': len(active_nodes) >= service.replication_factor,
                    'needs_optimization': len(active_nodes) < service.replication_factor
                }
            
            # Log optimization opportunities
            needs_optimization = [s for s, a in placement_analysis.items() if a['needs_optimization']]
            if needs_optimization:
                logger.info(f"🔄 Edge optimization needed for {len(needs_optimization)} services")
        
        except Exception as e:
            logger.error(f"Edge placement optimization failed: {e}")
    
    async def _create_sync_tasks(self):
        """Create data synchronization tasks"""
        try:
            # Create sync tasks for services with critical priority
            critical_services = [s for s in self.edge_services.values() if s.sync_priority == "critical"]
            
            for service in critical_services:
                online_nodes = [
                    node_id for node_id in service.edge_nodes 
                    if self.edge_nodes.get(node_id) and 
                       self.edge_nodes[node_id].connectivity_status in ["ONLINE", "INTERMITTENT"]
                ]
                
                # Create sync tasks between online nodes
                for i, source_node in enumerate(online_nodes):
                    for target_node in online_nodes[i+1:]:
                        task_id = hashlib.sha256(f"sync_{source_node}_{target_node}_{time.time()}".encode()).hexdigest()[:12]
                        
                        sync_task = EdgeSyncTask(
                            task_id=task_id,
                            source_node=source_node,
                            target_node=target_node,
                            data_type=service.service_name,
                            sync_status="PENDING",
                            started_at=time.time(),
                            completed_at=None,
                            data_size_mb=random.uniform(10, 500),  # Simulate data size
                            priority=service.sync_priority
                        )
                        
                        self.sync_tasks[task_id] = sync_task
                        await self._store_sync_task(sync_task)
        
        except Exception as e:
            logger.error(f"Sync task creation failed: {e}")
    
    async def _execute_sync_tasks(self):
        """Execute pending synchronization tasks"""
        pending_tasks = [t for t in self.sync_tasks.values() if t.sync_status == "PENDING"]
        
        for task in pending_tasks[:5]:  # Limit concurrent syncs
            try:
                task.sync_status = "RUNNING"
                await self._store_sync_task(task)
                
                # Simulate sync execution
                await asyncio.sleep(random.uniform(1, 5))  # Simulate sync time
                
                task.sync_status = "COMPLETED"
                task.completed_at = time.time()
                await self._store_sync_task(task)
                
                logger.info(f"✅ Sync completed: {task.source_node} → {task.target_node} ({task.data_type})")
                
            except Exception as e:
                task.sync_status = "FAILED"
                await self._store_sync_task(task)
                logger.error(f"❌ Sync failed: {task.task_id} - {e}")
    
    async def _cleanup_completed_syncs(self):
        """Clean up old completed sync tasks"""
        cutoff_time = time.time() - 3600  # 1 hour ago
        completed_tasks = [
            t for t in self.sync_tasks.values() 
            if t.sync_status in ["COMPLETED", "FAILED"] and 
               (t.completed_at or t.started_at) < cutoff_time
        ]
        
        for task in completed_tasks:
            del self.sync_tasks[task.task_id]
    
    async def deploy_edge_service(self, service_config: Dict[str, Any]) -> EdgeService:
        """Deploy service to edge nodes"""
        service_id = hashlib.sha256(f"edge_{service_config['name']}_{time.time()}".encode()).hexdigest()[:12]
        
        edge_service = EdgeService(
            service_id=service_id,
            service_name=service_config['name'],
            edge_nodes=service_config.get('target_nodes', []),
            replication_factor=service_config.get('replication_factor', 2),
            sync_priority=service_config.get('priority', 'normal'),
            offline_capable=service_config.get('offline_capable', False),
            last_deployment=time.time(),
            status="DEPLOYING"
        )
        
        # Simulate deployment process
        await asyncio.sleep(3)
        edge_service.status = "DEPLOYED"
        
        self.edge_services[service_id] = edge_service
        await self._store_edge_service(edge_service)
        
        logger.info(f"🚀 Edge service deployed: {edge_service.service_name} ({service_id})")
        return edge_service
    
    async def get_edge_computing_status(self) -> EdgeComputingStatus:
        """Get edge computing status"""
        active_nodes = len([n for n in self.edge_nodes.values() if n.status == "ACTIVE"])
        services_deployed = len(self.edge_services)
        sync_tasks_active = len([t for t in self.sync_tasks.values() if t.sync_status in ["PENDING", "RUNNING"]])
        
        # Calculate total capacity
        total_capacity_ghz = sum(n.cpu_cores * 2.5 for n in self.edge_nodes.values()) / 1000  # Estimate 2.5 GHz per core
        total_storage_tb = sum(n.storage_gb for n in self.edge_nodes.values()) / 1000
        
        # Count offline-ready nodes
        offline_ready_nodes = len([
            n for n in self.edge_nodes.values() 
            if any(s.offline_capable for s in self.edge_services.values() if n.node_id in s.edge_nodes)
        ])
        
        return EdgeComputingStatus(
            service="TerraFusion Edge Computing",
            status="OPERATIONAL",
            total_edge_nodes=len(self.edge_nodes),
            active_nodes=active_nodes,
            services_deployed=services_deployed,
            sync_tasks_active=sync_tasks_active,
            total_capacity_ghz=total_capacity_ghz,
            total_storage_tb=total_storage_tb,
            offline_ready_nodes=offline_ready_nodes
        )
    
    async def _store_edge_node(self, node: EdgeNode):
        """Store edge node in database"""
        cursor = self.edge_db.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO edge_nodes VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            node.node_id, node.node_name, node.location, node.node_type, node.status,
            node.ip_address, node.cpu_cores, node.memory_gb, node.storage_gb,
            json.dumps(node.services_running), node.last_sync, node.connectivity_status,
            node.battery_level, time.time()
        ))
        self.edge_db.commit()
    
    async def _store_edge_service(self, service: EdgeService):
        """Store edge service in database"""
        cursor = self.edge_db.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO edge_services VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            service.service_id, service.service_name, json.dumps(service.edge_nodes),
            service.replication_factor, service.sync_priority, service.offline_capable,
            service.last_deployment, service.status
        ))
        self.edge_db.commit()
    
    async def _store_sync_task(self, task: EdgeSyncTask):
        """Store sync task in database"""
        cursor = self.edge_db.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO sync_tasks VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            task.task_id, task.source_node, task.target_node, task.data_type,
            task.sync_status, task.started_at, task.completed_at,
            task.data_size_mb, task.priority
        ))
        self.edge_db.commit()
    
    async def _store_edge_telemetry(self, node: EdgeNode):
        """Store edge node telemetry"""
        telemetry_id = hashlib.sha256(f"telemetry_{node.node_id}_{time.time()}".encode()).hexdigest()[:12]
        
        # Simulate telemetry data
        import random
        cpu_usage = random.uniform(20, 85)
        memory_usage = random.uniform(30, 90)
        storage_usage = random.uniform(40, 80)
        network_latency = random.uniform(5, 150)
        
        cursor = self.edge_db.cursor()
        cursor.execute("""
            INSERT INTO edge_telemetry VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (telemetry_id, node.node_id, cpu_usage, memory_usage, storage_usage, network_latency, time.time()))
        self.edge_db.commit()
    
    # HTTP API Endpoints
    async def handle_status(self, request):
        """GET /api/edge/status"""
        status = await self.get_edge_computing_status()
        return web.json_response(asdict(status))
    
    async def handle_nodes(self, request):
        """GET /api/edge/nodes"""
        nodes = [asdict(n) for n in self.edge_nodes.values()]
        return web.json_response({'nodes': nodes, 'count': len(nodes)})
    
    async def handle_services(self, request):
        """GET /api/edge/services"""
        services = [asdict(s) for s in self.edge_services.values()]
        return web.json_response({'services': services, 'count': len(services)})
    
    async def handle_sync_tasks(self, request):
        """GET /api/edge/sync"""
        tasks = [asdict(t) for t in self.sync_tasks.values()]
        return web.json_response({'sync_tasks': tasks, 'count': len(tasks)})
    
    async def handle_deploy_service(self, request):
        """POST /api/edge/deploy"""
        data = await request.json()
        
        try:
            service = await self.deploy_edge_service(data)
            return web.json_response(asdict(service))
        except Exception as e:
            return web.json_response({'error': str(e)}, status=500)
    
    async def handle_node_types(self, request):
        """GET /api/edge/node-types"""
        return web.json_response({'node_types': self.node_types})
    
    async def handle_root(self, request):
        """GET / - Service info"""
        return web.json_response({
            'service': 'TerraFusion Edge Computing',
            'version': '1.0.0',
            'description': 'Government Edge Infrastructure for TerraFusion OS',
            'county': 'Benton County, Washington',
            'edge_nodes': len(self.edge_nodes),
            'edge_services': len(self.edge_services),
            'status': 'OPERATIONAL'
        })
    
    async def start_service(self):
        """Start the TerraFusion Edge Computing Service"""
        # Create web application
        app = web.Application()
        
        # Add routes
        app.router.add_get('/', self.handle_root)
        app.router.add_get('/api/edge/status', self.handle_status)
        app.router.add_get('/api/edge/nodes', self.handle_nodes)
        app.router.add_get('/api/edge/services', self.handle_services)
        app.router.add_get('/api/edge/sync', self.handle_sync_tasks)
        app.router.add_post('/api/edge/deploy', self.handle_deploy_service)
        app.router.add_get('/api/edge/node-types', self.handle_node_types)
        
        # Register with Trust Fabric
        asyncio.create_task(self._register_with_trust_fabric_delayed())
        
        # Start HTTP server
        runner = web.AppRunner(app)
        await runner.setup()
        site = web.TCPSite(runner, 'localhost', self.port)
        await site.start()
        
        logger.info(f"🚀 TerraFusion Edge Computing started on http://localhost:{self.port}")
        logger.info(f"🌐 Government edge network active")
        
        return runner
    
    async def _register_with_trust_fabric_delayed(self):
        """Register with Trust Fabric after startup delay"""
        await asyncio.sleep(15)
        try:
            registration_data = {
                'service_name': 'TerraFusion Edge Computing',
                'port': self.port,
                'validation_proofs': ['edge_orchestration', 'offline_operations', 'field_deployment']
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
    """Start TerraFusion Edge Computing Service"""
    print("🌐 TERRAFUSION EDGE COMPUTING - GOVERNMENT EDGE INFRASTRUCTURE")
    print("=" * 70)
    print("🏢 County office edge nodes")
    print("🚐 Mobile government units")
    print("🌾 Rural field stations")
    print("🔄 Real-time data synchronization")
    print("📱 Offline-capable operations")
    print()
    
    try:
        edge_computing = TerraFusionEdgeComputing()
        runner = await edge_computing.start_service()
        
        # Keep service running
        try:
            while True:
                await asyncio.sleep(1)
        except KeyboardInterrupt:
            logger.info("🛑 Stopping TerraFusion Edge Computing...")
            await runner.cleanup()
            
    except Exception as e:
        logger.error(f"❌ TerraFusion Edge Computing startup failed: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    asyncio.run(main())
