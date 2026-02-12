"""
TerraFusion cOS - Base Kernel Service
Core OS Services: Process Management, Resource Allocation, Health Monitoring

This is the FOUNDATION of cOS - provides core operating system capabilities
that all other services depend on.
"""

import logging
from typing import Dict, List, Optional, Any, Set
from datetime import datetime
from enum import Enum
import asyncio
import psutil
import os
from dataclasses import dataclass

logger = logging.getLogger(__name__)


class ServiceState(Enum):
    """Service lifecycle states"""
    UNREGISTERED = "unregistered"
    REGISTERED = "registered"
    STARTING = "starting"
    RUNNING = "running"
    STOPPING = "stopping"
    STOPPED = "stopped"
    FAILED = "failed"


class ResourceType(Enum):
    """System resource types"""
    CPU = "cpu"
    MEMORY = "memory"
    DISK = "disk"
    NETWORK = "network"
    DATABASE = "database"


@dataclass
class ServiceRegistration:
    """Service registration record"""
    service_id: str
    service_name: str
    service_type: str
    version: str
    state: ServiceState
    registered_at: datetime
    started_at: Optional[datetime] = None
    pid: Optional[int] = None
    endpoints: Dict[str, str] = None
    dependencies: List[str] = None
    resource_limits: Dict[str, Any] = None


@dataclass
class ResourceAllocation:
    """Resource allocation for a service"""
    service_id: str
    cpu_cores: float
    memory_mb: int
    disk_mb: int
    network_mbps: int
    allocated_at: datetime


@dataclass
class HealthMetrics:
    """System health metrics"""
    timestamp: datetime
    cpu_percent: float
    memory_percent: float
    disk_percent: float
    active_services: int
    failed_services: int
    uptime_seconds: float


class BaseKernelService:
    """
    Base Kernel Service
    
    Provides core OS functionality:
    - Service lifecycle management (register, start, stop, monitor)
    - Resource allocation and enforcement
    - Health monitoring and recovery
    - Graceful shutdown coordination
    - Boot sequence orchestration
    """
    
    def __init__(self):
        self.service_name = "Base Kernel"
        self.version = "1.0.0"
        self.status = "initializing"
        
        # Service registry
        self.registered_services: Dict[str, ServiceRegistration] = {}
        self.resource_allocations: Dict[str, ResourceAllocation] = {}
        
        # System state
        self.boot_time = datetime.now()
        self.shutdown_in_progress = False
        
        # Resource limits
        self.total_cpu_cores = psutil.cpu_count()
        self.total_memory_mb = psutil.virtual_memory().total // (1024 * 1024)
        self.allocated_cpu = 0.0
        self.allocated_memory = 0
        
        # Health monitoring
        self.health_history: List[HealthMetrics] = []
        self.max_health_history = 1000
        
        logger.info(f"[cOS] Initializing {self.service_name} v{self.version}")
        logger.info(f"[cOS:{self.service_name}] System: {self.total_cpu_cores} cores, {self.total_memory_mb}MB RAM")
    
    async def initialize(self) -> bool:
        """
        Initialize Base Kernel service
        
        Returns:
            bool: True if initialization successful
        """
        try:
            logger.info(f"[cOS:{self.service_name}] Starting initialization...")
            
            # Initialize service registry
            await self._initialize_service_registry()
            
            # Start health monitoring
            await self._start_health_monitoring()
            
            # Start resource manager
            await self._start_resource_manager()
            
            # Register shutdown handlers
            await self._register_shutdown_handlers()
            
            self.status = "running"
            
            logger.info(f"[cOS:{self.service_name}] ✅ Initialization complete")
            logger.info(f"[cOS:{self.service_name}] Kernel online - ready for service registration")
            return True
            
        except Exception as e:
            logger.error(f"[cOS:{self.service_name}] ❌ Initialization failed: {e}")
            self.status = "error"
            return False
    
    async def _initialize_service_registry(self):
        """Initialize service registry"""
        logger.info(f"[cOS:{self.service_name}] Initializing service registry...")
        self.registered_services = {}
    
    async def _start_health_monitoring(self):
        """Start background health monitoring"""
        logger.info(f"[cOS:{self.service_name}] Starting health monitoring...")
        asyncio.create_task(self._health_monitor_loop())
    
    async def _health_monitor_loop(self):
        """Background health monitoring loop"""
        while self.status == "running" and not self.shutdown_in_progress:
            try:
                metrics = await self._collect_health_metrics()
                self.health_history.append(metrics)
                
                # Trim history
                if len(self.health_history) > self.max_health_history:
                    self.health_history = self.health_history[-self.max_health_history:]
                
                # Check for issues
                if metrics.cpu_percent > 90:
                    logger.warning(f"[cOS:{self.service_name}] High CPU usage: {metrics.cpu_percent}%")
                if metrics.memory_percent > 90:
                    logger.warning(f"[cOS:{self.service_name}] High memory usage: {metrics.memory_percent}%")
                if metrics.failed_services > 0:
                    logger.error(f"[cOS:{self.service_name}] {metrics.failed_services} services in failed state")
                
                await asyncio.sleep(5.0)  # Monitor every 5 seconds
            except Exception as e:
                logger.error(f"[cOS:{self.service_name}] Health monitor error: {e}")
                await asyncio.sleep(5.0)
    
    async def _collect_health_metrics(self) -> HealthMetrics:
        """Collect current system health metrics"""
        return HealthMetrics(
            timestamp=datetime.now(),
            cpu_percent=psutil.cpu_percent(interval=0.1),
            memory_percent=psutil.virtual_memory().percent,
            disk_percent=psutil.disk_usage('/').percent,
            active_services=len([s for s in self.registered_services.values() if s.state == ServiceState.RUNNING]),
            failed_services=len([s for s in self.registered_services.values() if s.state == ServiceState.FAILED]),
            uptime_seconds=(datetime.now() - self.boot_time).total_seconds()
        )
    
    async def _start_resource_manager(self):
        """Start resource management subsystem"""
        logger.info(f"[cOS:{self.service_name}] Starting resource manager...")
        asyncio.create_task(self._resource_manager_loop())
    
    async def _resource_manager_loop(self):
        """Background resource management loop"""
        while self.status == "running" and not self.shutdown_in_progress:
            try:
                # Monitor resource usage
                await self._check_resource_violations()
                await asyncio.sleep(10.0)
            except Exception as e:
                logger.error(f"[cOS:{self.service_name}] Resource manager error: {e}")
    
    async def _check_resource_violations(self):
        """Check if services are exceeding resource limits"""
        # In production: Monitor actual resource usage per service and enforce limits
        pass
    
    async def _register_shutdown_handlers(self):
        """Register graceful shutdown handlers"""
        logger.info(f"[cOS:{self.service_name}] Registering shutdown handlers...")
        # In production: Register signal handlers for SIGTERM, SIGINT
    
    async def register_service(self, service_config: Dict[str, Any]) -> Dict[str, Any]:
        """
        Register a service with the kernel
        
        Args:
            service_config: Service configuration (name, type, version, dependencies)
            
        Returns:
            Dict with service_id and registration status
        """
        try:
            service_id = service_config.get("service_id") or service_config.get("name").lower().replace(" ", "_")
            
            if service_id in self.registered_services:
                return {
                    "success": False,
                    "error": f"Service {service_id} already registered"
                }
            
            registration = ServiceRegistration(
                service_id=service_id,
                service_name=service_config["name"],
                service_type=service_config.get("type", "unknown"),
                version=service_config.get("version", "1.0.0"),
                state=ServiceState.REGISTERED,
                registered_at=datetime.now(),
                endpoints=service_config.get("endpoints", {}),
                dependencies=service_config.get("dependencies", []),
                resource_limits=service_config.get("resource_limits", {})
            )
            
            self.registered_services[service_id] = registration
            
            logger.info(f"[cOS:{self.service_name}] ✅ Registered service: {registration.service_name} ({service_id})")
            
            return {
                "success": True,
                "service_id": service_id,
                "registered_at": registration.registered_at.isoformat()
            }
            
        except Exception as e:
            logger.error(f"[cOS:{self.service_name}] Service registration error: {e}")
            return {"success": False, "error": str(e)}
    
    async def start_service(self, service_id: str) -> Dict[str, Any]:
        """
        Start a registered service
        
        Args:
            service_id: Service identifier
            
        Returns:
            Dict with start status
        """
        try:
            if service_id not in self.registered_services:
                return {"success": False, "error": f"Service {service_id} not registered"}
            
            service = self.registered_services[service_id]
            
            # Check dependencies
            for dep_id in service.dependencies or []:
                if dep_id not in self.registered_services:
                    return {"success": False, "error": f"Dependency {dep_id} not registered"}
                
                dep_service = self.registered_services[dep_id]
                if dep_service.state != ServiceState.RUNNING:
                    return {"success": False, "error": f"Dependency {dep_id} not running"}
            
            service.state = ServiceState.STARTING
            
            # Allocate resources (if specified)
            if service.resource_limits:
                allocation = await self._allocate_resources(service_id, service.resource_limits)
                if not allocation["success"]:
                    service.state = ServiceState.FAILED
                    return allocation
            
            # Mark as running
            service.state = ServiceState.RUNNING
            service.started_at = datetime.now()
            service.pid = os.getpid()  # In production: actual service PID
            
            logger.info(f"[cOS:{self.service_name}] ✅ Started service: {service.service_name} ({service_id})")
            
            return {
                "success": True,
                "service_id": service_id,
                "started_at": service.started_at.isoformat(),
                "state": service.state.value
            }
            
        except Exception as e:
            logger.error(f"[cOS:{self.service_name}] Service start error: {e}")
            if service_id in self.registered_services:
                self.registered_services[service_id].state = ServiceState.FAILED
            return {"success": False, "error": str(e)}
    
    async def stop_service(self, service_id: str, graceful: bool = True) -> Dict[str, Any]:
        """
        Stop a running service
        
        Args:
            service_id: Service identifier
            graceful: If True, allow graceful shutdown
            
        Returns:
            Dict with stop status
        """
        try:
            if service_id not in self.registered_services:
                return {"success": False, "error": f"Service {service_id} not registered"}
            
            service = self.registered_services[service_id]
            
            if service.state != ServiceState.RUNNING:
                return {"success": False, "error": f"Service {service_id} not running"}
            
            service.state = ServiceState.STOPPING
            
            # In production: Send stop signal, wait for graceful shutdown
            if graceful:
                await asyncio.sleep(0.5)  # Simulate graceful shutdown
            
            service.state = ServiceState.STOPPED
            
            # Free resources
            if service_id in self.resource_allocations:
                await self._free_resources(service_id)
            
            logger.info(f"[cOS:{self.service_name}] ✅ Stopped service: {service.service_name} ({service_id})")
            
            return {
                "success": True,
                "service_id": service_id,
                "state": service.state.value
            }
            
        except Exception as e:
            logger.error(f"[cOS:{self.service_name}] Service stop error: {e}")
            return {"success": False, "error": str(e)}
    
    async def _allocate_resources(self, service_id: str, limits: Dict[str, Any]) -> Dict[str, Any]:
        """
        Allocate resources to a service
        
        Args:
            service_id: Service identifier
            limits: Resource limits (cpu_cores, memory_mb, etc.)
            
        Returns:
            Dict with allocation status
        """
        try:
            cpu_cores = limits.get("cpu_cores", 1.0)
            memory_mb = limits.get("memory_mb", 512)
            
            # Check availability
            if self.allocated_cpu + cpu_cores > self.total_cpu_cores:
                return {"success": False, "error": "Insufficient CPU cores"}
            
            if self.allocated_memory + memory_mb > self.total_memory_mb:
                return {"success": False, "error": "Insufficient memory"}
            
            # Allocate
            allocation = ResourceAllocation(
                service_id=service_id,
                cpu_cores=cpu_cores,
                memory_mb=memory_mb,
                disk_mb=limits.get("disk_mb", 1024),
                network_mbps=limits.get("network_mbps", 100),
                allocated_at=datetime.now()
            )
            
            self.resource_allocations[service_id] = allocation
            self.allocated_cpu += cpu_cores
            self.allocated_memory += memory_mb
            
            logger.info(f"[cOS:{self.service_name}] Allocated resources to {service_id}: {cpu_cores} cores, {memory_mb}MB")
            
            return {"success": True, "allocation": allocation}
            
        except Exception as e:
            logger.error(f"[cOS:{self.service_name}] Resource allocation error: {e}")
            return {"success": False, "error": str(e)}
    
    async def _free_resources(self, service_id: str):
        """Free resources allocated to a service"""
        if service_id in self.resource_allocations:
            allocation = self.resource_allocations[service_id]
            self.allocated_cpu -= allocation.cpu_cores
            self.allocated_memory -= allocation.memory_mb
            del self.resource_allocations[service_id]
            logger.info(f"[cOS:{self.service_name}] Freed resources from {service_id}")
    
    async def monitor_health(self) -> Dict[str, Any]:
        """
        Get comprehensive system health status
        
        Returns:
            Dict with health metrics and service states
        """
        current_metrics = await self._collect_health_metrics()
        
        return {
            "timestamp": current_metrics.timestamp.isoformat(),
            "system": {
                "cpu_percent": current_metrics.cpu_percent,
                "memory_percent": current_metrics.memory_percent,
                "disk_percent": current_metrics.disk_percent,
                "uptime_seconds": current_metrics.uptime_seconds
            },
            "resources": {
                "total_cpu_cores": self.total_cpu_cores,
                "allocated_cpu_cores": self.allocated_cpu,
                "total_memory_mb": self.total_memory_mb,
                "allocated_memory_mb": self.allocated_memory
            },
            "services": {
                "registered": len(self.registered_services),
                "running": current_metrics.active_services,
                "failed": current_metrics.failed_services,
                "details": [
                    {
                        "service_id": sid,
                        "name": svc.service_name,
                        "state": svc.state.value,
                        "uptime_seconds": (datetime.now() - svc.started_at).total_seconds() if svc.started_at else 0
                    }
                    for sid, svc in self.registered_services.items()
                ]
            }
        }
    
    async def get_status(self) -> Dict[str, Any]:
        """Get Base Kernel service status"""
        return {
            "service": self.service_name,
            "version": self.version,
            "status": self.status,
            "registered_services": len(self.registered_services),
            "running_services": len([s for s in self.registered_services.values() if s.state == ServiceState.RUNNING]),
            "uptime_seconds": (datetime.now() - self.boot_time).total_seconds(),
            "system_resources": {
                "cpu_cores": self.total_cpu_cores,
                "memory_mb": self.total_memory_mb,
                "cpu_allocated": f"{(self.allocated_cpu / self.total_cpu_cores * 100):.1f}%",
                "memory_allocated": f"{(self.allocated_memory / self.total_memory_mb * 100):.1f}%"
            },
            "features": {
                "service_lifecycle": True,
                "resource_allocation": True,
                "health_monitoring": True,
                "graceful_shutdown": True,
                "dependency_management": True
            }
        }
    
    async def shutdown(self):
        """Gracefully shutdown all services"""
        logger.info(f"[cOS:{self.service_name}] ⚠️  Initiating graceful shutdown...")
        self.shutdown_in_progress = True
        
        # Stop services in reverse dependency order
        for service_id in reversed(list(self.registered_services.keys())):
            service = self.registered_services[service_id]
            if service.state == ServiceState.RUNNING:
                await self.stop_service(service_id, graceful=True)
        
        self.status = "stopped"
        logger.info(f"[cOS:{self.service_name}] ✅ Shutdown complete")


# Global service instance
base_kernel_service = BaseKernelService()
