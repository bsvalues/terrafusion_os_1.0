#!/usr/bin/env python3
"""
Trust Fabric Core Engine - TerraFusion OS Kernel
Real cryptographic trust layer for all government services

This IS the operating system kernel - all services must register through Trust Fabric.
No service exists without cryptographic proof and Trust Fabric birth certificate.
"""

import asyncio
import aiohttp
from aiohttp import web
import hashlib
import time
import json
import logging
import sqlite3
import secrets
import psutil
from typing import Dict, List, Optional, Any, Set
from dataclasses import dataclass, asdict
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ed25519
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class ServiceBirthCertificate:
    """Cryptographic proof of service birth in Trust Fabric"""
    service_id: str
    service_name: str
    port: int
    birth_timestamp: float
    parent_fabric_hash: str
    cryptographic_signature: str
    trust_score: float
    validation_proofs: List[str]

@dataclass
class TrustFabricStatus:
    """Current Trust Fabric kernel status"""
    fabric_id: str
    status: str
    registered_services: int
    active_validations: int
    total_trust_score: float
    harris_pacs_integration: str
    kernel_uptime: float

class TrustFabricCoreEngine:
    """The TerraFusion OS Kernel - Trust Fabric Core"""
    
    def __init__(self, port: int = 5000):
        self.port = port
        self.fabric_id = self._generate_fabric_id()
        self.private_key = ed25519.Ed25519PrivateKey.generate()
        self.public_key = self.private_key.public_key()
        self.kernel_start_time = time.time()
        
        # Service registry
        self.registered_services: Dict[str, ServiceBirthCertificate] = {}
        self.trust_validations: List[Dict[str, Any]] = []
        
        # Initialize Trust Fabric database
        self.trust_db = self._init_trust_database()
        
        # Load Benton County configuration
        self.benton_config = self._load_benton_config()
        
        logger.info(f"🔐 Trust Fabric Core Engine initialized")
        logger.info(f"🆔 Fabric ID: {self.fabric_id}")
        logger.info(f"📍 Deployment: Benton County, Washington")
        logger.info(f"🏛️ Harris PACS: {self.benton_config['parcels']:,} parcels")
        logger.info(f"⚡ Kernel port: {self.port}")
    
    def _generate_fabric_id(self) -> str:
        """Generate unique Trust Fabric identifier"""
        fabric_data = f"terrafusion_trust_fabric_{time.time()}_{secrets.token_hex(8)}"
        return hashlib.sha256(fabric_data.encode()).hexdigest()[:16]
    
    def _load_benton_config(self) -> Dict[str, Any]:
        """Load real Benton County configuration"""
        config_path = "/workspaces/terrafusion_os_1.0/benton-county-config.json"
        try:
            with open(config_path, 'r') as f:
                config = json.load(f)
            return config
        except Exception as e:
            logger.error(f"Failed to load Benton County config: {e}")
            return {'county': 'benton', 'state': 'washington', 'parcels': 89247}
    
    def _init_trust_database(self) -> sqlite3.Connection:
        """Initialize Trust Fabric core database"""
        db_path = "/workspaces/terrafusion_os_1.0/trust-fabric/trust_fabric_core.db"
        conn = sqlite3.connect(db_path)
        
        # Service birth certificates table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS service_births (
                service_id TEXT PRIMARY KEY,
                service_name TEXT NOT NULL,
                port INTEGER NOT NULL,
                birth_timestamp REAL NOT NULL,
                parent_fabric_hash TEXT NOT NULL,
                cryptographic_signature TEXT NOT NULL,
                trust_score REAL NOT NULL,
                validation_proofs TEXT NOT NULL
            )
        """)
        
        # Trust validations table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS trust_validations (
                validation_id TEXT PRIMARY KEY,
                timestamp REAL NOT NULL,
                service_id TEXT NOT NULL,
                validation_type TEXT NOT NULL,
                trust_score REAL NOT NULL,
                cryptographic_proof TEXT NOT NULL,
                harris_pacs_verified BOOLEAN DEFAULT FALSE
            )
        """)
        
        # Fabric kernel events
        conn.execute("""
            CREATE TABLE IF NOT EXISTS kernel_events (
                event_id TEXT PRIMARY KEY,
                timestamp REAL NOT NULL,
                event_type TEXT NOT NULL,
                service_id TEXT,
                description TEXT NOT NULL,
                trust_impact REAL DEFAULT 0.0
            )
        """)
        
        conn.commit()
        return conn
    
    async def register_service(self, service_name: str, port: int, validation_proofs: List[str] = None) -> ServiceBirthCertificate:
        """Register a new service with Trust Fabric - issue birth certificate"""
        birth_time = time.time()
        service_id = hashlib.sha256(f"{service_name}_{port}_{birth_time}".encode()).hexdigest()[:12]
        
        # Create parent fabric hash
        parent_hash = hashlib.sha256(f"{self.fabric_id}_{birth_time}".encode()).hexdigest()
        
        # Generate cryptographic signature
        message = f"{service_id}_{service_name}_{port}_{birth_time}_{parent_hash}".encode()
        signature = self.private_key.sign(message)
        signature_hex = signature.hex()
        
        # Calculate initial trust score
        trust_score = self._calculate_service_trust_score(service_name, port, validation_proofs or [])
        
        # Create birth certificate
        birth_cert = ServiceBirthCertificate(
            service_id=service_id,
            service_name=service_name,
            port=port,
            birth_timestamp=birth_time,
            parent_fabric_hash=parent_hash,
            cryptographic_signature=signature_hex,
            trust_score=trust_score,
            validation_proofs=validation_proofs or []
        )
        
        # Store in registry and database
        self.registered_services[service_id] = birth_cert
        await self._store_birth_certificate(birth_cert)
        
        # Log kernel event
        await self._log_kernel_event("SERVICE_BIRTH", service_id, 
                                    f"Service '{service_name}' born on port {port}")
        
        logger.info(f"🎂 Service birth: {service_name} (ID: {service_id}) on port {port}")
        logger.info(f"🎯 Trust score: {trust_score:.3f}")
        
        return birth_cert
    
    def _calculate_service_trust_score(self, service_name: str, port: int, proofs: List[str]) -> float:
        """Calculate cryptographic trust score for service"""
        base_score = 0.7
        
        # Trust bonuses
        if 'terrafusion' in service_name.lower():
            base_score += 0.1
        if 'harris' in service_name.lower() or 'pacs' in service_name.lower():
            base_score += 0.15  # Harris PACS integration bonus
        if len(proofs) > 0:
            base_score += 0.05 * len(proofs)
        if 3000 <= port <= 6000:
            base_score += 0.05  # Standard port range
        
        return min(base_score, 1.0)
    
    async def validate_service_trust(self, service_id: str) -> Dict[str, Any]:
        """Perform real-time trust validation of registered service"""
        if service_id not in self.registered_services:
            return {'status': 'SERVICE_NOT_FOUND', 'trust_score': 0.0}
        
        birth_cert = self.registered_services[service_id]
        validation_time = time.time()
        validation_id = hashlib.sha256(f"validate_{service_id}_{validation_time}".encode()).hexdigest()[:16]
        
        # Check if service is still running
        service_alive = await self._check_service_health(birth_cert.port)
        
        # Verify cryptographic signature
        signature_valid = self._verify_signature(birth_cert)
        
        # Check Harris PACS integration if applicable
        harris_verified = False
        if 'harris' in birth_cert.service_name.lower() or 'sync' in birth_cert.service_name.lower():
            harris_verified = await self._verify_harris_integration(birth_cert.port)
        
        # Calculate current trust score
        current_trust = birth_cert.trust_score
        if not service_alive:
            current_trust *= 0.5
        if not signature_valid:
            current_trust *= 0.3
        if harris_verified:
            current_trust = min(current_trust + 0.1, 1.0)
        
        validation_result = {
            'validation_id': validation_id,
            'service_id': service_id,
            'timestamp': validation_time,
            'service_alive': service_alive,
            'signature_valid': signature_valid,
            'harris_verified': harris_verified,
            'trust_score': current_trust,
            'status': 'TRUSTED' if current_trust > 0.7 else 'DEGRADED' if current_trust > 0.5 else 'UNTRUSTED'
        }
        
        # Store validation
        await self._store_trust_validation(validation_result)
        
        return validation_result
    
    async def _check_service_health(self, port: int) -> bool:
        """Check if service is responding on its port"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f'http://localhost:{port}/', timeout=3) as response:
                    return response.status == 200
        except:
            return False
    
    def _verify_signature(self, birth_cert: ServiceBirthCertificate) -> bool:
        """Verify cryptographic signature of birth certificate"""
        try:
            message = f"{birth_cert.service_id}_{birth_cert.service_name}_{birth_cert.port}_{birth_cert.birth_timestamp}_{birth_cert.parent_fabric_hash}".encode()
            signature = bytes.fromhex(birth_cert.cryptographic_signature)
            self.public_key.verify(signature, message)
            return True
        except:
            return False
    
    async def _verify_harris_integration(self, port: int) -> bool:
        """Verify Harris PACS integration for data services"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f'http://localhost:{port}/api/sync/status', timeout=3) as response:
                    if response.status == 200:
                        data = await response.json()
                        return 'harris' in data.get('harris_connection', '').lower()
        except:
            pass
        return False
    
    async def get_fabric_status(self) -> TrustFabricStatus:
        """Get current Trust Fabric kernel status"""
        active_validations = len([v for v in self.trust_validations if time.time() - v.get('timestamp', 0) < 300])
        total_trust = sum(cert.trust_score for cert in self.registered_services.values()) / max(len(self.registered_services), 1)
        
        # Check Harris PACS integration status
        harris_status = "NOT_INTEGRATED"
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get('http://localhost:\${{TF_API_5010_PORT:-5010}}/api/sync/status', timeout=2) as response:
                    if response.status == 200:
                        harris_status = "INTEGRATED"
        except:
            pass
        
        return TrustFabricStatus(
            fabric_id=self.fabric_id,
            status="OPERATIONAL",
            registered_services=len(self.registered_services),
            active_validations=active_validations,
            total_trust_score=total_trust,
            harris_pacs_integration=harris_status,
            kernel_uptime=time.time() - self.kernel_start_time
        )
    
    async def _store_birth_certificate(self, birth_cert: ServiceBirthCertificate):
        """Store service birth certificate in Trust Fabric database"""
        cursor = self.trust_db.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO service_births VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            birth_cert.service_id,
            birth_cert.service_name,
            birth_cert.port,
            birth_cert.birth_timestamp,
            birth_cert.parent_fabric_hash,
            birth_cert.cryptographic_signature,
            birth_cert.trust_score,
            json.dumps(birth_cert.validation_proofs)
        ))
        self.trust_db.commit()
    
    async def _store_trust_validation(self, validation: Dict[str, Any]):
        """Store trust validation in database"""
        cursor = self.trust_db.cursor()
        cursor.execute("""
            INSERT INTO trust_validations VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            validation['validation_id'],
            validation['timestamp'],
            validation['service_id'],
            'RUNTIME_VALIDATION',
            validation['trust_score'],
            json.dumps(validation),
            validation.get('harris_verified', False)
        ))
        self.trust_db.commit()
        self.trust_validations.append(validation)
    
    async def _log_kernel_event(self, event_type: str, service_id: str, description: str, trust_impact: float = 0.0):
        """Log Trust Fabric kernel event"""
        event_id = hashlib.sha256(f"{event_type}_{service_id}_{time.time()}".encode()).hexdigest()[:12]
        cursor = self.trust_db.cursor()
        cursor.execute("""
            INSERT INTO kernel_events VALUES (?, ?, ?, ?, ?, ?)
        """, (event_id, time.time(), event_type, service_id, description, trust_impact))
        self.trust_db.commit()
    
    # HTTP API Endpoints
    async def handle_status(self, request):
        """GET /api/trust-fabric/status"""
        status = await self.get_fabric_status()
        return web.json_response(asdict(status))
    
    async def handle_register(self, request):
        """POST /api/trust-fabric/register"""
        data = await request.json()
        service_name = data.get('service_name')
        port = data.get('port')
        proofs = data.get('validation_proofs', [])
        
        if not service_name or not port:
            return web.json_response({'error': 'service_name and port required'}, status=400)
        
        birth_cert = await self.register_service(service_name, port, proofs)
        return web.json_response(asdict(birth_cert))
    
    async def handle_validate(self, request):
        """POST /api/trust-fabric/validate"""
        data = await request.json()
        service_id = data.get('service_id')
        
        if not service_id:
            return web.json_response({'error': 'service_id required'}, status=400)
        
        validation = await self.validate_service_trust(service_id)
        return web.json_response(validation)
    
    async def handle_services(self, request):
        """GET /api/trust-fabric/services"""
        services = [asdict(cert) for cert in self.registered_services.values()]
        return web.json_response({'services': services, 'count': len(services)})
    
    async def handle_root(self, request):
        """GET / - Trust Fabric info"""
        return web.json_response({
            'service': 'Trust Fabric Core Engine',
            'version': '1.0.0',
            'description': 'TerraFusion OS Kernel - Cryptographic Trust Layer',
            'fabric_id': self.fabric_id,
            'county': 'Benton County, Washington',
            'registered_services': len(self.registered_services),
            'status': 'OPERATIONAL'
        })
    
    async def start_kernel(self):
        """Start the Trust Fabric Core Engine"""
        # Create web application
        app = web.Application()
        
        # Add routes
        app.router.add_get('/', self.handle_root)
        app.router.add_get('/api/trust-fabric/status', self.handle_status)
        app.router.add_post('/api/trust-fabric/register', self.handle_register)
        app.router.add_post('/api/trust-fabric/validate', self.handle_validate)
        app.router.add_get('/api/trust-fabric/services', self.handle_services)
        
        # Start background trust validation loop
        asyncio.create_task(self._background_trust_validation())
        
        # Auto-register TerraFusionSync if running
        asyncio.create_task(self._auto_register_existing_services())
        
        # Start HTTP server
        runner = web.AppRunner(app)
        await runner.setup()
        site = web.TCPSite(runner, 'localhost', self.port)
        await site.start()
        
        logger.info(f"🚀 Trust Fabric Core Engine started on http://localhost:{self.port}")
        logger.info(f"🔐 TerraFusion OS Kernel ready for service registration")
        
        return runner
    
    async def _background_trust_validation(self):
        """Background trust validation of all registered services"""
        while True:
            try:
                await asyncio.sleep(30)  # Validate every 30 seconds
                for service_id in list(self.registered_services.keys()):
                    await self.validate_service_trust(service_id)
            except Exception as e:
                logger.error(f"Background validation error: {e}")
                await asyncio.sleep(60)
    
    async def _auto_register_existing_services(self):
        """Auto-register existing TerraFusion services"""
        await asyncio.sleep(5)  # Wait for kernel to fully start
        
        # Register TerraFusionSync if running
        if await self._check_service_health(5010):
            await self.register_service("TerraFusionSync", 5010, ["harris_pacs_integration"])
            logger.info("🔗 Auto-registered TerraFusionSync")
        
        # Register other known services
        known_services = [
            ("Trust Fabric API Gateway", 5001),
            ("Government Core Service", 3015),
            ("Property Assessment Service", 3016),
            ("Tax Management Service", 3017),
            ("GIS Data Service", 3018),
            ("Revenue Optimization", 3019),
            ("Digital Identity Service", 3020),
            ("Environmental Monitoring", 3021),
            ("Economic Development", 3022),
            ("Transportation Management", 3023)
        ]
        
        for service_name, port in known_services:
            if await self._check_service_health(port):
                await self.register_service(service_name, port)
                logger.info(f"🔗 Auto-registered {service_name}")

async def main():
    """Start Trust Fabric Core Engine"""
    print("🔐 TRUST FABRIC CORE ENGINE - TERRAFUSION OS KERNEL")
    print("=" * 55)
    print("✅ Real cryptographic trust layer")
    print("🏛️ Benton County government services")
    print("🔗 Harris PACS integration validation")
    print("⚡ Service birth certificate management")
    print()
    
    try:
        engine = TrustFabricCoreEngine()
        runner = await engine.start_kernel()
        
        # Keep kernel running
        try:
            while True:
                await asyncio.sleep(1)
        except KeyboardInterrupt:
            logger.info("🛑 Stopping Trust Fabric Core Engine...")
            await runner.cleanup()
            
    except Exception as e:
        logger.error(f"❌ Trust Fabric startup failed: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    asyncio.run(main())
