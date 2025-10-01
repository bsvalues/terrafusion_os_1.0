# NO HARDCODED PORTS! Use environment variables.
#!/usr/bin/env python3
"""
Trust Fabric Core - The Operating System Itself
TerraFusion Trust Fabric IS the system, not an add-on

The Trust Fabric isn't an add-on, it IS the operating system:
- Services don't 'start' - they're 'born' into the Fabric
- No configuration files exist - only cryptographic proofs
- Everything is discovered, not configured
- All operations are proven, not assumed
- ENFORCEMENT: Trust Fabric OWNS all processes - anything else gets killed
"""

import asyncio
import hashlib
import time
import json
import socket
import secrets
import psutil
import subprocess
import os
import signal
from typing import Dict, List, Optional, Any, Set
from dataclasses import dataclass, asdict
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import ed25519
from cryptography.hazmat.primitives import serialization
import websockets
import uvloop

@dataclass
class ServiceResources:
    """Resources assigned by the Fabric"""
    port: int
    memory: int  # MB
    cpu: float   # CPU percentage
    network_id: str
    storage_quota: int  # MB

@dataclass
class BirthCertificate:
    """Cryptographic proof of service birth"""
    service_hash: str
    born_at: float
    port: int
    memory: int
    cpu: float
    parent: str  # Merkle root of Fabric state
    siblings: List[str]  # Other active service IDs
    fabric_signature: str
    
@dataclass
class ServiceManifest:
    """Complete service identity and proofs"""
    identity: str  # DID
    birth_cert: BirthCertificate
    signature: str
    resources: ServiceResources
    proof_of_assignment: str

class TrustFabric:
    """
    The Trust Fabric IS TerraFusion OS
    Nothing exists outside the Fabric
    """
    
    def __init__(self):
        self.services: Dict[str, ServiceManifest] = {}
        self.proofs: List[Dict[str, Any]] = []
        self.mesh_nodes: Dict[str, Dict] = {}
        self.private_key = ed25519.Ed25519PrivateKey.generate()
        self.public_key = self.private_key.public_key()
        self.fabric_id = self._generate_fabric_did()
        self.merkle_root = None
        self.port_pool = list(range(5000, 6000))  # Dynamic port allocation
        self.allocated_ports: set = set()
        self.managed_pids: Set[int] = set()  # PIDs under Fabric control
        
        print(f"🔐 Trust Fabric initialized")
        print(f"   Fabric ID: {self.fabric_id}")
        print(f"   Port pool: {len(self.port_pool)} ports available")
        
        # ENFORCEMENT: Kill any zombie processes on startup
        self._enforce_fabric_ownership()
        
        # Start continuous enforcement
        asyncio.create_task(self._continuous_enforcement())

    def _enforce_fabric_ownership(self):
        """ENFORCEMENT: Trust Fabric owns ALL TerraFusion processes"""
        print("🔥 TRUST FABRIC ENFORCEMENT: Claiming process ownership")
        
        killed_count = 0
        for proc in psutil.process_iter(['pid', 'name', 'cmdline', 'ppid']):
            try:
                cmdline = ' '.join(proc.info['cmdline'] or []).lower()
                name = (proc.info['name'] or '').lower()
                
                # Kill any TerraFusion-related process not managed by us
                if any(keyword in cmdline or keyword in name for keyword in 
                       ['terrafusion', 'dotnet run', 'npm run dev', 'node server']):
                    if proc.info['pid'] not in self.managed_pids:
                        print(f"💀 Killing zombie process: {proc.info['name']} (PID: {proc.info['pid']})")
                        print(f"   Command: {cmdline[:100]}...")
                        try:
                            proc.terminate()
                            killed_count += 1
                        except (psutil.NoSuchProcess, psutil.AccessDenied):
                            pass
                            
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                continue
                
        print(f"🧹 Enforcement complete: {killed_count} zombie processes terminated")
        
        # Also check for port squatters
        self._enforce_port_ownership()

    def _enforce_port_ownership(self):
        """ENFORCEMENT: Trust Fabric owns its assigned ports"""
        print("🔍 TRUST FABRIC: Auditing port ownership")
        
        fabric_ports = [3000, 3001, 3002, 3003, 5000, 5001, 5002, 5003, 8000]
        
        for port in fabric_ports:
            try:
                # Find process using this port
                for conn in psutil.net_connections(kind='inet'):
                    if conn.laddr.port == port and conn.status == psutil.CONN_LISTEN:
                        if conn.pid not in self.managed_pids:
                            print(f"⚔️  Port {port} occupied by unauthorized PID {conn.pid}")
                            try:
                                proc = psutil.Process(conn.pid)
                                print(f"💀 Killing port squatter: {proc.name()} (PID: {conn.pid})")
                                proc.terminate()
                            except (psutil.NoSuchProcess, psutil.AccessDenied):
                                pass
                        break
            except Exception as e:
                print(f"⚠️  Could not audit port {port}: {e}")

    async def _continuous_enforcement(self):
        """Continuous enforcement - runs every 30 seconds"""
        while True:
            await asyncio.sleep(30)
            print("🔄 Trust Fabric: Continuous enforcement check")
            self._enforce_fabric_ownership()

    def _generate_fabric_did(self) -> str:
        """Generate DID for the Fabric itself"""
        public_bytes = self.public_key.public_bytes(
            encoding=serialization.Encoding.Raw,
            format=serialization.PublicFormat.Raw
        )
        fabric_hash = hashlib.sha256(public_bytes).hexdigest()[:16]
        return f"did:tf:fabric:{fabric_hash}"

    def _generate_did(self) -> str:
        """Generate DID for a service"""
        service_id = secrets.token_hex(16)
        return f"did:tf:service:{service_id}"

    def _allocate_resources(self) -> ServiceResources:
        """Dynamically allocate resources to a new service"""
        # Find available port
        available_ports = [p for p in self.port_pool if p not in self.allocated_ports]
        if not available_ports:
            raise RuntimeError("No available ports in pool")
        
        port = available_ports[0]
        self.allocated_ports.add(port)
        
        # Allocate memory and CPU based on system state
        base_memory = 256  # MB
        base_cpu = 10.0    # %
        
        # Scale based on number of active services
        scale_factor = 1 + (len(self.services) * 0.1)
        
        return ServiceResources(
            port=port,
            memory=int(base_memory * scale_factor),
            cpu=base_cpu * scale_factor,
            network_id=f"fabric-net-{port}",
            storage_quota=1024  # 1GB
        )

    def _sign_birth(self, birth_cert: BirthCertificate) -> str:
        """Sign birth certificate with Fabric's private key"""
        birth_data = json.dumps(asdict(birth_cert), sort_keys=True).encode()
        signature = self.private_key.sign(birth_data)
        return signature.hex()

    def _generate_merkle_root(self) -> str:
        """Generate current Merkle root of all Fabric state"""
        if not self.services:
            return hashlib.sha256(b"genesis_fabric").hexdigest()
        
        service_hashes = []
        for service_id in sorted(self.services.keys()):
            manifest = self.services[service_id]
            service_data = json.dumps(asdict(manifest), sort_keys=True).encode()
            service_hash = hashlib.sha256(service_data).hexdigest()
            service_hashes.append(service_hash)
        
        # Build Merkle tree
        while len(service_hashes) > 1:
            new_level = []
            for i in range(0, len(service_hashes), 2):
                left = service_hashes[i]
                right = service_hashes[i + 1] if i + 1 < len(service_hashes) else left
                combined = hashlib.sha256((left + right).encode()).hexdigest()
                new_level.append(combined)
            service_hashes = new_level
        
        return service_hashes[0] if service_hashes else "genesis"

    def get_merkle_root(self) -> str:
        """Get current Merkle root"""
        if self.merkle_root is None:
            self.merkle_root = self._generate_merkle_root()
        return self.merkle_root

    def _inject_manifest(self, service_code: bytes, manifest: ServiceManifest):
        """Inject manifest into service code (conceptual - would modify service startup)"""
        # In real implementation, this would modify the service's runtime environment
        # to provide the manifest through environment variables or embedded config
        print(f"   📋 Injecting manifest into service")
        print(f"      Identity: {manifest.identity}")
        print(f"      Port: {manifest.resources.port}")
        print(f"      Memory: {manifest.resources.memory}MB")

    def _broadcast_birth(self, manifest: ServiceManifest):
        """Broadcast service birth to mesh"""
        birth_announcement = {
            "type": "service_birth",
            "identity": manifest.identity,
            "timestamp": time.time(),
            "resources": asdict(manifest.resources),
            "fabric_id": self.fabric_id
        }
        
        # Store proof
        self.proofs.append(birth_announcement)
        
        print(f"   📡 Broadcasting birth to mesh")
        print(f"      Announcement: {birth_announcement['type']}")
        print(f"      Mesh nodes: {len(self.mesh_nodes)}")

    def birth_service(self, service_code: bytes) -> ServiceManifest:
        """
        A service doesn't 'start' - it's 'born' into the Fabric
        Returns cryptographically signed manifest with assigned resources
        """
        print(f"\n🔐 BIRTHING SERVICE INTO TRUST FABRIC")
        print(f"════════════════════════════════════")
        
        # Hash the service code itself
        code_hash = hashlib.sha256(service_code).hexdigest()
        print(f"   📝 Service code hash: {code_hash[:16]}...")
        
        # Find resources dynamically
        resources = self._allocate_resources()
        print(f"   🎯 Resources allocated:")
        print(f"      Port: {resources.port}")
        print(f"      Memory: {resources.memory}MB")
        print(f"      CPU: {resources.cpu}%")
        
        # Generate birth certificate
        birth_cert = BirthCertificate(
            service_hash=code_hash,
            born_at=time.time(),
            port=resources.port,
            memory=resources.memory,
            cpu=resources.cpu,
            parent=self.get_merkle_root(),
            siblings=list(self.services.keys()),
            fabric_signature=""  # Will be filled by signing
        )
        
        # Sign the birth
        signature = self._sign_birth(birth_cert)
        birth_cert.fabric_signature = signature
        
        # Generate DID
        service_did = self._generate_did()
        
        # Create immutable service manifest
        manifest = ServiceManifest(
            identity=service_did,
            birth_cert=birth_cert,
            signature=signature,
            resources=resources,
            proof_of_assignment=hashlib.sha256(
                (service_did + signature + code_hash).encode()
            ).hexdigest()
        )
        
        # Register in Fabric
        self.services[service_did] = manifest
        
        # Update Merkle root
        self.merkle_root = self._generate_merkle_root()
        
        # Service doesn't configure itself - Fabric configures it
        self._inject_manifest(service_code, manifest)
        
        # Announce birth to mesh
        self._broadcast_birth(manifest)
        
        print(f"   ✅ Service born successfully!")
        print(f"      Identity: {service_did}")
        print(f"      Proof: {manifest.proof_of_assignment[:16]}...")
        
        return manifest

    def spawn_fabric_service(self, service_type: str, manifest: ServiceManifest) -> int:
        """ENFORCEMENT: Actually spawn the service process under Fabric control"""
        print(f"🚀 TRUST FABRIC: Spawning {service_type} service")
        print(f"   Port: {manifest.resources.port}")
        print(f"   DID: {manifest.identity}")
        
        # Set environment for the spawned process
        env = os.environ.copy()
        env.update({
            'FABRIC_SERVICE_DID': manifest.identity,
            'FABRIC_ASSIGNED_PORT': str(manifest.resources.port),
            'FABRIC_MEMORY_LIMIT': str(manifest.resources.memory),
            'FABRIC_CPU_LIMIT': str(manifest.resources.cpu),
            'FABRIC_PROOF': manifest.proof_of_assignment
        })
        
        # Spawn the actual service process
        if service_type == 'backend':
            cmd = ['dotnet', 'run', '--project', 'backend/TerraFusion.API']
            env['ASPNETCORE_URLS'] = f'http://localhost:{manifest.resources.port}'
            env['ASPNETCORE_ENVIRONMENT'] = 'Development'
        elif service_type == 'frontend':
            cmd = ['npm', 'run', 'dev']
            env['PORT'] = str(manifest.resources.port)
            env['NODE_ENV'] = 'development'
            env['VITE_API_URL'] = f'http://localhost:${TF_STATIC_PORT:-8080}'  # Backend connection
        else:
            raise ValueError(f"Unknown service type: {service_type}")
            
        print(f"   Command: {' '.join(cmd)}")
        
        # Start process
        process = subprocess.Popen(
            cmd,
            env=env,
            cwd=os.getcwd(),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        # Register PID as managed by Fabric
        self.managed_pids.add(process.pid)
        
        print(f"   ✅ Process spawned with PID {process.pid}")
        print(f"   🔐 Process now under Trust Fabric protection")
        
        return process.pid

    async def resolve_service(self, did: str) -> Optional[Dict[str, Any]]:
        """Resolve service location by DID - no hardcoded URLs"""
        if did not in self.services:
            return None
        
        manifest = self.services[did]
        
        # Verify current state
        current_proof = self._verify_service_state(manifest)
        
        return {
            "host": "localhost",  # In production, would be actual host
            "port": manifest.resources.port,
            "proof": current_proof,
            "network_id": manifest.resources.network_id,
            "last_verified": time.time()
        }

    def _verify_service_state(self, manifest: ServiceManifest) -> str:
        """Generate proof of current service state"""
        state_data = {
            "identity": manifest.identity,
            "resources": asdict(manifest.resources),
            "fabric_root": self.get_merkle_root(),
            "timestamp": time.time()
        }
        
        state_json = json.dumps(state_data, sort_keys=True).encode()
        proof = self.private_key.sign(state_json)
        return proof.hex()

    async def heartbeat(self, service_did: str, operation_proof: str) -> bool:
        """Service heartbeat with operational proof"""
        if service_did not in self.services:
            return False
        
        # Verify operational proof
        # In real implementation, would validate the proof cryptographically
        
        # Update service state
        heartbeat_record = {
            "service": service_did,
            "timestamp": time.time(),
            "proof": operation_proof,
            "fabric_state": self.get_merkle_root()
        }
        
        self.proofs.append(heartbeat_record)
        return True

    def get_fabric_status(self) -> Dict[str, Any]:
        """Get complete Fabric status"""
        return {
            "fabric_id": self.fabric_id,
            "active_services": len(self.services),
            "allocated_ports": list(self.allocated_ports),
            "available_ports": len(self.port_pool) - len(self.allocated_ports),
            "merkle_root": self.get_merkle_root(),
            "total_proofs": len(self.proofs),
            "mesh_nodes": len(self.mesh_nodes),
            "services": {
                service_id: {
                    "identity": manifest.identity,
                    "port": manifest.resources.port,
                    "birth_time": manifest.birth_cert.born_at,
                    "proof": manifest.proof_of_assignment[:16] + "..."
                }
                for service_id, manifest in self.services.items()
            }
        }

    async def run_forever(self):
        """The Fabric IS the system - it runs forever"""
        print(f"\n🚀 TRUST FABRIC OPERATING SYSTEM ACTIVE")
        print(f"═══════════════════════════════════════")
        print(f"   Fabric ID: {self.fabric_id}")
        print(f"   Services: {len(self.services)} active")
        print(f"   Ports: {len(self.allocated_ports)} allocated")
        print(f"   Merkle Root: {self.get_merkle_root()[:16]}...")
        
        try:
            while True:
                # Continuous fabric operations
                await asyncio.sleep(5)
                
                # Periodic state verification
                current_root = self._generate_merkle_root()
                if current_root != self.merkle_root:
                    print(f"   🔄 Merkle root updated: {current_root[:16]}...")
                    self.merkle_root = current_root
                
                # Health check all services
                for service_id, manifest in self.services.items():
                    # In real implementation, would ping services
                    pass
                    
        except KeyboardInterrupt:
            print(f"\n🛑 Trust Fabric shutdown initiated")
            print(f"   Final state: {len(self.services)} services")
            print(f"   Total proofs generated: {len(self.proofs)}")

# TerraFusion Service Base Class
class TerraFusionService:
    """
    Base class for all TerraFusion services
    Every service is born from the Fabric
    """
    
    def __init__(self):
        self.fabric = None
        self.manifest = None
        self.server = None

    async def connect_to_fabric(self):
        """Connect to the Trust Fabric"""
        # In real implementation, would connect via WebSocket or gRPC
        self.fabric = TrustFabric()  # Simplified for demo
        
    def get_bytecode(self) -> bytes:
        """Get service bytecode for hashing"""
        # In real implementation, would return actual compiled code
        return b"sample_service_code"

    async def birth_into_fabric(self):
        """Birth this service into the Fabric"""
        if not self.fabric:
            await self.connect_to_fabric()
            
        service_code = self.get_bytecode()
        self.manifest = self.fabric.birth_service(service_code)
        
        print(f"🎯 Service birthed with identity: {self.manifest.identity}")
        print(f"   Assigned port: {self.manifest.resources.port}")
        print(f"   Memory quota: {self.manifest.resources.memory}MB")

    async def start(self):
        """Start service using Fabric-assigned resources"""
        if not self.manifest:
            await self.birth_into_fabric()
        
        port = self.manifest.resources.port
        print(f"🚀 Starting service on port {port} (assigned by Fabric)")
        
        # In real implementation, would start actual server
        # self.server = Server(port=port)
        
        # Send heartbeat with operational proof
        if self.fabric:
            proof = self.generate_operation_proof()
            await self.fabric.heartbeat(self.manifest.identity, proof)

    def generate_operation_proof(self) -> str:
        """Generate proof of current operations"""
        operation_data = {
            "service": self.manifest.identity if self.manifest else "unknown",
            "timestamp": time.time(),
            "status": "operational"
        }
        
        operation_json = json.dumps(operation_data, sort_keys=True)
        return hashlib.sha256(operation_json.encode()).hexdigest()

def test_hsm():
    """Test HSM functionality for validation"""
    try:
        from hsm_interface import HSMInterface
        hsm = HSMInterface()
        if hsm.initialize():
            print("HSM integration test passed")
            return 0
        else:
            print("HSM integration test failed")
            return 1
    except Exception as e:
        print(f"HSM test error: {e}")
        return 1

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == '--test-hsm':
        sys.exit(test_hsm())
    
    # Set high-performance event loop
    asyncio.set_event_loop_policy(uvloop.EventLoopPolicy())
    
    async def demo_fabric():
        """Demonstrate Trust Fabric operation"""
        fabric = TrustFabric()
        
        # Birth multiple services
        services = [
            b"backend_api_service_code",
            b"frontend_shell_service_code", 
            b"ai_swarm_orchestrator_code",
            b"consciousness_service_code",
            b"marketplace_service_code"
        ]
        
        manifests = []
        for service_code in services:
            manifest = fabric.birth_service(service_code)
            manifests.append(manifest)
        
        # Show Fabric status
        status = fabric.get_fabric_status()
        print(f"\n📊 FABRIC STATUS:")
        print(f"════════════════")
        print(json.dumps(status, indent=2))
        
        # Run Fabric
        await fabric.run_forever()
    
    # Run the demo
    asyncio.run(demo_fabric())
