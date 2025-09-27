"""
TerraFusion cOS Resource Allocator
Resource management and scaling for vendor operations
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
from enum import Enum
import math

class ResourceType(Enum):
    """Types of allocatable resources"""
    CPU_CORES = "cpu_cores"
    MEMORY_GB = "memory_gb"
    STORAGE_GB = "storage_gb"
    NETWORK_BANDWIDTH = "network_bandwidth"
    API_CALLS = "api_calls"
    CONCURRENT_USERS = "concurrent_users"

class AllocationStatus(Enum):
    """Resource allocation status"""
    ACTIVE = "active"
    PENDING = "pending"
    SCALING = "scaling"
    SUSPENDED = "suspended"
    EXCEEDED = "exceeded"

class ResourcePriority(Enum):
    """Resource allocation priority"""
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    CRITICAL = "critical"

@dataclass
class ResourceQuota:
    """Resource quota definition"""
    resource_type: ResourceType
    allocated_amount: float
    used_amount: float = 0.0
    max_burst: Optional[float] = None
    unit: str = ""
    
    @property
    def utilization_percent(self) -> float:
        """Calculate resource utilization percentage"""
        if self.allocated_amount == 0:
            return 0.0
        return (self.used_amount / self.allocated_amount) * 100
        
    @property
    def available_amount(self) -> float:
        """Calculate available resource amount"""
        return max(0, self.allocated_amount - self.used_amount)

@dataclass 
class VendorAllocation:
    """Complete resource allocation for a vendor"""
    vendor_id: str
    tier: str
    quotas: Dict[ResourceType, ResourceQuota] = field(default_factory=dict)
    allocation_date: datetime = field(default_factory=datetime.now)
    last_updated: datetime = field(default_factory=datetime.now)
    status: AllocationStatus = AllocationStatus.ACTIVE
    priority: ResourcePriority = ResourcePriority.NORMAL
    auto_scaling: bool = True
    
@dataclass
class ResourceRequest:
    """Resource allocation request"""
    request_id: str
    vendor_id: str
    resource_type: ResourceType
    requested_amount: float
    current_amount: float
    justification: str
    priority: ResourcePriority
    requested_at: datetime = field(default_factory=datetime.now)
    approved: Optional[bool] = None
    approved_at: Optional[datetime] = None
    approved_by: Optional[str] = None

class TierManager:
    """Manages resource allocations by vendor tier"""
    
    def __init__(self):
        self.tier_configurations = {
            "certified": {
                ResourceType.CPU_CORES: {"base": 2, "max": 8, "burst": 4},
                ResourceType.MEMORY_GB: {"base": 4, "max": 16, "burst": 8},
                ResourceType.STORAGE_GB: {"base": 50, "max": 200, "burst": 100},
                ResourceType.API_CALLS: {"base": 1000, "max": 5000, "burst": 2000},
                ResourceType.CONCURRENT_USERS: {"base": 100, "max": 500, "burst": 200}
            },
            "enterprise": {
                ResourceType.CPU_CORES: {"base": 4, "max": 16, "burst": 8},
                ResourceType.MEMORY_GB: {"base": 8, "max": 32, "burst": 16},
                ResourceType.STORAGE_GB: {"base": 100, "max": 500, "burst": 250},
                ResourceType.API_CALLS: {"base": 2500, "max": 10000, "burst": 5000},
                ResourceType.CONCURRENT_USERS: {"base": 250, "max": 1000, "burst": 500}
            },
            "strategic": {
                ResourceType.CPU_CORES: {"base": 8, "max": 32, "burst": 16},
                ResourceType.MEMORY_GB: {"base": 16, "max": 64, "burst": 32},
                ResourceType.STORAGE_GB: {"base": 250, "max": 1000, "burst": 500},
                ResourceType.API_CALLS: {"base": 5000, "max": 25000, "burst": 10000},
                ResourceType.CONCURRENT_USERS: {"base": 500, "max": 2500, "burst": 1000}
            },
            "premier": {
                ResourceType.CPU_CORES: {"base": 16, "max": 64, "burst": 32},
                ResourceType.MEMORY_GB: {"base": 32, "max": 128, "burst": 64},
                ResourceType.STORAGE_GB: {"base": 500, "max": 2000, "burst": 1000},
                ResourceType.API_CALLS: {"base": 10000, "max": 50000, "burst": 20000},
                ResourceType.CONCURRENT_USERS: {"base": 1000, "max": 5000, "burst": 2500}
            }
        }
        
    def create_allocation_for_tier(self, vendor_id: str, tier: str) -> VendorAllocation:
        """Create resource allocation based on vendor tier"""
        tier_config = self.tier_configurations.get(tier.lower())
        if not tier_config:
            tier_config = self.tier_configurations["certified"]  # Default to certified
            
        allocation = VendorAllocation(
            vendor_id=vendor_id,
            tier=tier,
            priority=self._get_priority_for_tier(tier)
        )
        
        # Create quotas for each resource type
        for resource_type, config in tier_config.items():
            quota = ResourceQuota(
                resource_type=resource_type,
                allocated_amount=config["base"],
                max_burst=config["burst"],
                unit=self._get_unit_for_resource(resource_type)
            )
            allocation.quotas[resource_type] = quota
            
        return allocation
        
    def _get_priority_for_tier(self, tier: str) -> ResourcePriority:
        """Get resource priority based on tier"""
        priority_map = {
            "premier": ResourcePriority.CRITICAL,
            "strategic": ResourcePriority.HIGH,
            "enterprise": ResourcePriority.NORMAL,
            "certified": ResourcePriority.LOW
        }
        return priority_map.get(tier.lower(), ResourcePriority.LOW)
        
    def _get_unit_for_resource(self, resource_type: ResourceType) -> str:
        """Get unit for resource type"""
        unit_map = {
            ResourceType.CPU_CORES: "cores",
            ResourceType.MEMORY_GB: "GB",
            ResourceType.STORAGE_GB: "GB", 
            ResourceType.API_CALLS: "calls/hour",
            ResourceType.CONCURRENT_USERS: "users"
        }
        return unit_map.get(resource_type, "units")

class AutoScaler:
    """Automatic resource scaling based on usage patterns"""
    
    def __init__(self):
        self.scaling_thresholds = {
            "scale_up": 80.0,    # Scale up at 80% utilization
            "scale_down": 30.0,  # Scale down at 30% utilization
            "cooldown_minutes": 15  # Wait 15 minutes between scaling operations
        }
        self.scaling_history: Dict[str, List[Dict]] = {}
        
    async def evaluate_scaling(self, allocation: VendorAllocation) -> List[Dict[str, Any]]:
        """Evaluate if scaling is needed for vendor allocation"""
        if not allocation.auto_scaling:
            return []
            
        scaling_actions = []
        
        for resource_type, quota in allocation.quotas.items():
            if quota.utilization_percent >= self.scaling_thresholds["scale_up"]:
                # Scale up needed
                scale_action = await self._calculate_scale_up(allocation.vendor_id, resource_type, quota)
                if scale_action:
                    scaling_actions.append(scale_action)
                    
            elif quota.utilization_percent <= self.scaling_thresholds["scale_down"]:
                # Scale down possible
                scale_action = await self._calculate_scale_down(allocation.vendor_id, resource_type, quota)
                if scale_action:
                    scaling_actions.append(scale_action)
                    
        return scaling_actions
        
    async def _calculate_scale_up(self, vendor_id: str, resource_type: ResourceType, 
                                quota: ResourceQuota) -> Optional[Dict[str, Any]]:
        """Calculate scale up action"""
        # Check cooldown period
        if not self._can_scale(vendor_id, resource_type):
            return None
            
        # Calculate new allocation (increase by 50% or to max burst)
        current_allocation = quota.allocated_amount
        proposed_allocation = min(
            current_allocation * 1.5,
            quota.max_burst if quota.max_burst else current_allocation * 2
        )
        
        if proposed_allocation <= current_allocation:
            return None  # No meaningful increase possible
            
        return {
            "action": "scale_up",
            "vendor_id": vendor_id,
            "resource_type": resource_type.value,
            "current_allocation": current_allocation,
            "new_allocation": proposed_allocation,
            "reason": f"Utilization at {quota.utilization_percent:.1f}%",
            "estimated_cost_increase": self._calculate_cost_impact(resource_type, proposed_allocation - current_allocation)
        }
        
    async def _calculate_scale_down(self, vendor_id: str, resource_type: ResourceType,
                                  quota: ResourceQuota) -> Optional[Dict[str, Any]]:
        """Calculate scale down action"""
        # Check cooldown period
        if not self._can_scale(vendor_id, resource_type):
            return None
            
        # Only scale down if usage has been consistently low
        if quota.utilization_percent > self.scaling_thresholds["scale_down"]:
            return None
            
        # Calculate new allocation (decrease by 25%)
        current_allocation = quota.allocated_amount
        proposed_allocation = max(
            current_allocation * 0.75,
            quota.used_amount * 1.2  # Leave 20% headroom
        )
        
        if proposed_allocation >= current_allocation:
            return None  # No meaningful decrease possible
            
        return {
            "action": "scale_down",
            "vendor_id": vendor_id,
            "resource_type": resource_type.value,
            "current_allocation": current_allocation,
            "new_allocation": proposed_allocation,
            "reason": f"Utilization at {quota.utilization_percent:.1f}%",
            "estimated_cost_savings": self._calculate_cost_impact(resource_type, current_allocation - proposed_allocation)
        }
        
    def _can_scale(self, vendor_id: str, resource_type: ResourceType) -> bool:
        """Check if scaling is allowed (cooldown period)"""
        if vendor_id not in self.scaling_history:
            return True
            
        recent_scaling = [
            action for action in self.scaling_history[vendor_id]
            if (action["resource_type"] == resource_type.value and
                datetime.fromisoformat(action["timestamp"]) > 
                datetime.now() - timedelta(minutes=self.scaling_thresholds["cooldown_minutes"]))
        ]
        
        return len(recent_scaling) == 0
        
    def _calculate_cost_impact(self, resource_type: ResourceType, amount: float) -> float:
        """Calculate estimated cost impact of resource change"""
        # Simplified cost calculation
        cost_per_unit = {
            ResourceType.CPU_CORES: 0.05,    # $0.05 per core per hour
            ResourceType.MEMORY_GB: 0.01,    # $0.01 per GB per hour
            ResourceType.STORAGE_GB: 0.001,  # $0.001 per GB per hour
            ResourceType.API_CALLS: 0.0001,  # $0.0001 per call
            ResourceType.CONCURRENT_USERS: 0.02  # $0.02 per user per hour
        }
        
        return amount * cost_per_unit.get(resource_type, 0.01) * 24 * 30  # Monthly estimate

class ResourceAllocator:
    """Main resource allocation and management service"""
    
    def __init__(self):
        self.tier_manager = TierManager()
        self.auto_scaler = AutoScaler()
        self.vendor_allocations: Dict[str, VendorAllocation] = {}
        self.resource_requests: Dict[str, ResourceRequest] = {}
        self.system_capacity = {
            ResourceType.CPU_CORES: 1000,
            ResourceType.MEMORY_GB: 2000,
            ResourceType.STORAGE_GB: 10000,
            ResourceType.API_CALLS: 1000000,
            ResourceType.CONCURRENT_USERS: 10000
        }
        self.is_running = False
        
    async def start_resource_allocator(self):
        """Start the resource allocation service"""
        logging.info("Starting TerraFusion Resource Allocator...")
        self.is_running = True
        
        # Start background tasks
        asyncio.create_task(self._monitor_resource_usage())
        asyncio.create_task(self._auto_scaling_evaluator())
        
    async def allocate_resources_for_vendor(self, vendor_id: str, tier: str) -> VendorAllocation:
        """Allocate resources for new vendor based on tier"""
        allocation = self.tier_manager.create_allocation_for_tier(vendor_id, tier)
        self.vendor_allocations[vendor_id] = allocation
        
        logging.info(f"Allocated resources for vendor {vendor_id} (tier: {tier})")
        return allocation
        
    async def update_resource_usage(self, vendor_id: str, resource_type: ResourceType, 
                                  used_amount: float):
        """Update resource usage for vendor"""
        allocation = self.vendor_allocations.get(vendor_id)
        if not allocation:
            logging.warning(f"No allocation found for vendor {vendor_id}")
            return
            
        if resource_type in allocation.quotas:
            allocation.quotas[resource_type].used_amount = used_amount
            allocation.last_updated = datetime.now()
            
            # Check for quota violations
            if used_amount > allocation.quotas[resource_type].allocated_amount:
                await self._handle_quota_violation(vendor_id, resource_type, used_amount)
                
    async def _handle_quota_violation(self, vendor_id: str, resource_type: ResourceType, 
                                    used_amount: float):
        """Handle resource quota violations"""
        allocation = self.vendor_allocations[vendor_id]
        quota = allocation.quotas[resource_type]
        
        # Check if burst capacity is available
        if quota.max_burst and used_amount <= quota.max_burst:
            logging.info(f"Vendor {vendor_id} using burst capacity for {resource_type.value}")
            return
            
        # Quota violation - log and potentially throttle
        logging.warning(f"Quota violation: Vendor {vendor_id} exceeded {resource_type.value} quota")
        allocation.status = AllocationStatus.EXCEEDED
        
        # Auto-scaling might handle this
        scaling_actions = await self.auto_scaler.evaluate_scaling(allocation)
        if scaling_actions:
            for action in scaling_actions:
                if action["action"] == "scale_up":
                    await self._apply_scaling_action(action)
                    
    async def process_resource_request(self, vendor_id: str, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process vendor resource request"""
        try:
            request_id = f"req_{vendor_id}_{int(datetime.now().timestamp())}"
            
            resource_request = ResourceRequest(
                request_id=request_id,
                vendor_id=vendor_id,
                resource_type=ResourceType(request_data["resource_type"]),
                requested_amount=request_data["requested_amount"],
                current_amount=request_data.get("current_amount", 0),
                justification=request_data.get("justification", ""),
                priority=ResourcePriority(request_data.get("priority", "normal"))
            )
            
            self.resource_requests[request_id] = resource_request
            
            # Auto-approve certain requests based on tier and availability
            approval_result = await self._evaluate_resource_request(resource_request)
            
            return {
                "request_id": request_id,
                "status": "approved" if approval_result["approved"] else "pending",
                "message": approval_result["message"],
                "estimated_implementation": "immediate" if approval_result["approved"] else "manual_review"
            }
            
        except Exception as e:
            logging.error(f"Resource request processing failed: {str(e)}")
            return {
                "request_id": None,
                "status": "failed",
                "message": f"Request processing error: {str(e)}"
            }
            
    async def _evaluate_resource_request(self, request: ResourceRequest) -> Dict[str, Any]:
        """Evaluate resource request for approval"""
        allocation = self.vendor_allocations.get(request.vendor_id)
        if not allocation:
            return {"approved": False, "message": "No allocation found for vendor"}
            
        # Check system capacity
        total_allocated = sum(
            alloc.quotas.get(request.resource_type, ResourceQuota(request.resource_type, 0)).allocated_amount
            for alloc in self.vendor_allocations.values()
        )
        
        system_capacity = self.system_capacity.get(request.resource_type, 0)
        if total_allocated + request.requested_amount > system_capacity * 0.9:  # 90% capacity limit
            return {"approved": False, "message": "Insufficient system capacity"}
            
        # Check tier limits
        tier_config = self.tier_manager.tier_configurations.get(allocation.tier.lower(), {})
        resource_config = tier_config.get(request.resource_type, {})
        max_allowed = resource_config.get("max", request.requested_amount)
        
        if request.requested_amount > max_allowed:
            return {"approved": False, "message": f"Exceeds tier limit ({max_allowed})"}
            
        # Auto-approve reasonable requests
        current_quota = allocation.quotas.get(request.resource_type)
        if current_quota and request.requested_amount <= current_quota.allocated_amount * 2:
            # Approve up to 2x current allocation
            request.approved = True
            request.approved_at = datetime.now()
            request.approved_by = "auto_approval_system"
            
            # Apply the allocation
            await self._apply_resource_allocation(request.vendor_id, request.resource_type, request.requested_amount)
            
            return {"approved": True, "message": "Request auto-approved and applied"}
        else:
            return {"approved": False, "message": "Request requires manual review"}
            
    async def _apply_resource_allocation(self, vendor_id: str, resource_type: ResourceType, new_amount: float):
        """Apply approved resource allocation"""
        allocation = self.vendor_allocations.get(vendor_id)
        if allocation and resource_type in allocation.quotas:
            allocation.quotas[resource_type].allocated_amount = new_amount
            allocation.last_updated = datetime.now()
            allocation.status = AllocationStatus.ACTIVE
            
            logging.info(f"Applied resource allocation: {vendor_id} {resource_type.value} = {new_amount}")
            
    async def _monitor_resource_usage(self):
        """Background task to monitor resource usage"""
        while self.is_running:
            try:
                # Simulate resource usage updates
                for vendor_id, allocation in self.vendor_allocations.items():
                    await self._simulate_resource_usage(vendor_id, allocation)
                    
                await asyncio.sleep(60)  # Check every minute
                
            except Exception as e:
                logging.error(f"Resource monitoring error: {str(e)}")
                await asyncio.sleep(300)  # Retry after 5 minutes
                
    async def _simulate_resource_usage(self, vendor_id: str, allocation: VendorAllocation):
        """Simulate resource usage for testing"""
        import random
        
        for resource_type, quota in allocation.quotas.items():
            # Simulate usage between 10% and 95% of allocated
            usage_percent = random.uniform(0.1, 0.95)
            simulated_usage = quota.allocated_amount * usage_percent
            
            await self.update_resource_usage(vendor_id, resource_type, simulated_usage)
            
    async def _auto_scaling_evaluator(self):
        """Background task to evaluate auto-scaling needs"""
        while self.is_running:
            try:
                for vendor_id, allocation in self.vendor_allocations.items():
                    scaling_actions = await self.auto_scaler.evaluate_scaling(allocation)
                    
                    for action in scaling_actions:
                        logging.info(f"Auto-scaling recommendation: {action}")
                        # In production, this would trigger scaling operations
                        
                await asyncio.sleep(300)  # Evaluate every 5 minutes
                
            except Exception as e:
                logging.error(f"Auto-scaling evaluation error: {str(e)}")
                await asyncio.sleep(300)
                
    async def _apply_scaling_action(self, action: Dict[str, Any]):
        """Apply auto-scaling action"""
        vendor_id = action["vendor_id"]
        resource_type = ResourceType(action["resource_type"])
        new_allocation = action["new_allocation"]
        
        await self._apply_resource_allocation(vendor_id, resource_type, new_allocation)
        
        # Record scaling history
        if vendor_id not in self.auto_scaler.scaling_history:
            self.auto_scaler.scaling_history[vendor_id] = []
            
        self.auto_scaler.scaling_history[vendor_id].append({
            **action,
            "timestamp": datetime.now().isoformat(),
            "applied": True
        })
        
    async def get_vendor_allocation(self, vendor_id: str) -> Dict[str, Any]:
        """Get current resource allocation for vendor"""
        allocation = self.vendor_allocations.get(vendor_id)
        if not allocation:
            return {"error": "No allocation found for vendor"}
            
        quota_summary = {}
        for resource_type, quota in allocation.quotas.items():
            quota_summary[resource_type.value] = {
                "allocated": quota.allocated_amount,
                "used": quota.used_amount,
                "available": quota.available_amount,
                "utilization_percent": quota.utilization_percent,
                "unit": quota.unit,
                "max_burst": quota.max_burst
            }
            
        return {
            "vendor_id": vendor_id,
            "tier": allocation.tier,
            "status": allocation.status.value,
            "priority": allocation.priority.value,
            "auto_scaling": allocation.auto_scaling,
            "quotas": quota_summary,
            "last_updated": allocation.last_updated.isoformat()
        }
        
    def get_system_resource_summary(self) -> Dict[str, Any]:
        """Get system-wide resource allocation summary"""
        total_allocated = {}
        total_used = {}
        
        for resource_type in ResourceType:
            total_allocated[resource_type.value] = sum(
                allocation.quotas.get(resource_type, ResourceQuota(resource_type, 0)).allocated_amount
                for allocation in self.vendor_allocations.values()
            )
            total_used[resource_type.value] = sum(
                allocation.quotas.get(resource_type, ResourceQuota(resource_type, 0)).used_amount
                for allocation in self.vendor_allocations.values()
            )
            
        return {
            "system_capacity": {rt.value: capacity for rt, capacity in self.system_capacity.items()},
            "total_allocated": total_allocated,
            "total_used": total_used,
            "capacity_utilization": {
                rt.value: (total_allocated.get(rt.value, 0) / self.system_capacity.get(rt, 1)) * 100
                for rt in ResourceType
            },
            "active_vendors": len(self.vendor_allocations),
            "pending_requests": len([r for r in self.resource_requests.values() if r.approved is None])
        }