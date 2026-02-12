"""
TerraFusion cOS - Service Registry
Auto-discovers and registers all core services

This registry manages the 7 core services that make up the cOS infrastructure.
"""

import logging
from typing import Dict, List, Optional, Any
from pathlib import Path
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger(__name__)


class ServiceStatus(Enum):
    """Service status enumeration"""
    DISCOVERED = "discovered"
    INITIALIZING = "initializing"
    RUNNING = "running"
    STOPPED = "stopped"
    ERROR = "error"


@dataclass
class ServiceInfo:
    """Service information structure"""
    name: str
    type: str
    location: str
    port: Optional[int]
    status: ServiceStatus
    version: str
    description: str
    dependencies: List[str]
    health_endpoint: Optional[str] = None


class ServiceRegistry:
    """
    Service Registry for TerraFusion cOS
    
    Manages the 7 core services:
    1. Base OS Kernel
    2. Security Mesh
    3. TerraFusion Sync
    4. Hybrid LLM
    5. AI Swarm (Supreme Commander Claude)
    6. TerraFlow
    7. CostForge AI
    """
    
    def __init__(self, workspace_root: Optional[str] = None):
        self.workspace_root = workspace_root or self._find_workspace_root()
        self.services: Dict[str, ServiceInfo] = {}
        
        logger.info(f"Service Registry initialized: {self.workspace_root}")
    
    def _find_workspace_root(self) -> str:
        """Find TerraFusion workspace root"""
        current = Path.cwd()
        for _ in range(10):
            if (current / "terrafusion-cos").exists() or (current / "ai-swarm-supreme-commander").exists():
                return str(current)
            if current.parent == current:
                break
            current = current.parent
        return str(Path.cwd())
    
    def discover_services(self) -> Dict[str, ServiceInfo]:
        """
        Discover all core services
        
        Returns:
            Dictionary of service_name: ServiceInfo
        """
        logger.info("🔍 Discovering cOS core services...")
        
        # Define core services with their locations
        service_definitions = {
            "hybrid_llm": {
                "name": "Hybrid LLM",
                "type": "ai-orchestration",
                "location": "terrafusion-cos/services/hybrid_llm/",
                "port": None,
                "version": "1.0.0",
                "description": "AI model orchestration and intelligent routing",
                "dependencies": [],
                "health_endpoint": None
            },
            "costforge_ai": {
                "name": "CostForge AI",
                "type": "financial-intelligence",
                "location": "terrafusion-cos/services/costforge_ai/",
                "port": None,
                "version": "1.0.0",
                "description": "Financial intelligence and budget optimization",
                "dependencies": ["hybrid_llm"],
                "health_endpoint": None
            },
            "api_server": {
                "name": "API Server",
                "type": "backend",
                "location": "terrafusion-cos/api_server.py",
                "port": 8090,
                "version": "1.0.0",
                "description": "FastAPI backend for cOS desktop",
                "dependencies": ["hybrid_llm", "costforge_ai"],
                "health_endpoint": "http://localhost:8090/health"
            },
            "supreme_commander": {
                "name": "Supreme Commander Claude",
                "type": "ai-swarm",
                "location": "ai-swarm-supreme-commander/",
                "port": None,
                "version": "1.0.0",
                "description": "50,000+ AI agent coordination",
                "dependencies": ["hybrid_llm"],
                "health_endpoint": None
            },
            "workspace_companion": {
                "name": "AI Workspace Companion",
                "type": "ai-assistant",
                "location": "ai-workspace-companion/",
                "port": None,
                "version": "1.0.0",
                "description": "Intelligent workspace assistance",
                "dependencies": ["hybrid_llm"],
                "health_endpoint": None
            },
            "terrafusion_sync": {
                "name": "TerraFusion Sync",
                "type": "data-synchronization",
                "location": "modules/government-core/terra-fusion-sync/",
                "port": None,
                "version": "1.0.0",
                "description": "Multi-master data replication",
                "dependencies": [],
                "health_endpoint": None
            },
            "terraflow": {
                "name": "TerraFlow",
                "type": "workflow-automation",
                "location": "modules/government-core/terra-flow/",
                "port": None,
                "version": "1.0.0",
                "description": "Visual workflow designer and automation",
                "dependencies": [],
                "health_endpoint": None
            },
            "security_mesh": {
                "name": "Security Mesh",
                "type": "security",
                "location": "terrafusion-cos/services/security_mesh/",
                "port": None,
                "version": "1.0.0",
                "description": "Zero-trust security and compliance",
                "dependencies": [],
                "health_endpoint": None
            }
        }
        
        # Check which services actually exist
        workspace_path = Path(self.workspace_root)
        
        for service_id, service_def in service_definitions.items():
            service_path = workspace_path / service_def["location"]
            
            if service_path.exists():
                status = ServiceStatus.DISCOVERED
                logger.info(f"  ✅ Found: {service_def['name']}")
            else:
                status = ServiceStatus.ERROR
                logger.warning(f"  ⚠️ Not found: {service_def['name']} at {service_path}")
            
            self.services[service_id] = ServiceInfo(
                name=service_def["name"],
                type=service_def["type"],
                location=service_def["location"],
                port=service_def["port"],
                status=status,
                version=service_def["version"],
                description=service_def["description"],
                dependencies=service_def["dependencies"],
                health_endpoint=service_def.get("health_endpoint")
            )
        
        discovered_count = len([s for s in self.services.values() if s.status == ServiceStatus.DISCOVERED])
        logger.info(f"✅ Discovered {discovered_count}/{len(self.services)} core services")
        
        return self.services
    
    def get_service(self, service_id: str) -> Optional[ServiceInfo]:
        """Get information about a specific service"""
        return self.services.get(service_id)
    
    def get_all_services(self) -> List[ServiceInfo]:
        """Get list of all services"""
        return list(self.services.values())
    
    def get_services_by_type(self, service_type: str) -> List[ServiceInfo]:
        """Get services filtered by type"""
        return [
            service for service in self.services.values()
            if service.type == service_type
        ]
    
    def get_services_by_status(self, status: ServiceStatus) -> List[ServiceInfo]:
        """Get services filtered by status"""
        return [
            service for service in self.services.values()
            if service.status == status
        ]
    
    def update_service_status(self, service_id: str, status: ServiceStatus):
        """Update the status of a service"""
        if service_id in self.services:
            self.services[service_id].status = status
            logger.info(f"Service {service_id} status updated to {status.value}")
    
    def get_registry_status(self) -> Dict[str, Any]:
        """
        Get overall registry status
        
        Returns:
            Status dictionary with service statistics
        """
        status_counts = {}
        for status in ServiceStatus:
            status_counts[status.value] = len([
                s for s in self.services.values() if s.status == status
            ])
        
        return {
            "total_services": len(self.services),
            "status_breakdown": status_counts,
            "services": {
                service_id: {
                    "name": service.name,
                    "type": service.type,
                    "status": service.status.value,
                    "version": service.version,
                    "location": service.location,
                    "port": service.port,
                    "dependencies": service.dependencies
                }
                for service_id, service in self.services.items()
            }
        }
    
    def get_boot_order(self) -> List[str]:
        """
        Get optimal service boot order based on dependencies
        
        Returns:
            List of service IDs in boot order
        """
        boot_order = []
        booted = set()
        
        def can_boot(service_id: str) -> bool:
            """Check if service dependencies are satisfied"""
            service = self.services[service_id]
            return all(dep in booted for dep in service.dependencies)
        
        # Boot services in dependency order
        remaining = set(self.services.keys())
        
        while remaining:
            # Find services that can be booted
            bootable = [sid for sid in remaining if can_boot(sid)]
            
            if not bootable:
                # Circular dependency or error - boot remaining anyway
                bootable = list(remaining)
            
            for service_id in bootable:
                boot_order.append(service_id)
                booted.add(service_id)
                remaining.remove(service_id)
        
        return boot_order


# Singleton instance
_service_registry_instance: Optional[ServiceRegistry] = None


def get_service_registry(workspace_root: Optional[str] = None) -> ServiceRegistry:
    """Get the singleton service registry instance"""
    global _service_registry_instance
    if _service_registry_instance is None:
        _service_registry_instance = ServiceRegistry(workspace_root)
    return _service_registry_instance


# CLI entry point for testing
if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s'
    )
    
    print("🏛️ TerraFusion cOS - Service Registry Test")
    print("=" * 60)
    
    registry = get_service_registry()
    services = registry.discover_services()
    
    print(f"\n📊 Service Discovery Complete:")
    print(f"   Total Services: {len(services)}")
    
    print(f"\n📋 Core Services:")
    for service_id, service in services.items():
        status_icon = "✅" if service.status == ServiceStatus.DISCOVERED else "⚠️"
        print(f"   {status_icon} {service.name}")
        print(f"      Type: {service.type}")
        print(f"      Location: {service.location}")
        print(f"      Status: {service.status.value}")
        if service.port:
            print(f"      Port: {service.port}")
        print()
    
    # Display status
    status = registry.get_registry_status()
    print(f"\n🎯 Service Registry Status:")
    print(f"   Total Services: {status['total_services']}")
    for status_type, count in status['status_breakdown'].items():
        print(f"   {status_type}: {count}")
    
    # Show boot order
    boot_order = registry.get_boot_order()
    print(f"\n🚀 Optimal Boot Order:")
    for i, service_id in enumerate(boot_order, 1):
        service = registry.get_service(service_id)
        if service:
            print(f"   {i}. {service.name}")

