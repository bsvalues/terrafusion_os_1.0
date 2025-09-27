# TerraFusion cOS Vendor Substrate Module
# Platform services that vendors integrate with and build upon

__version__ = "1.0.0"
__author__ = "TerraFusion Systems"
__description__ = "Vendor substrate platform APIs"

# from .substrate_main import VendorSubstrate
from .vendor_registration import VendorRegistrationService
from .module_wrapper import ModuleWrapperService
from .compliance_auditor import ComplianceAuditor
from .performance_monitor import PerformanceMonitor
from .resource_allocator import ResourceAllocator
from .api_gateway import TerraFusionAPIGateway

__all__ = [
    'VendorSubstrate',
    'VendorRegistrationService',
    'ModuleWrapperService', 
    'ComplianceAuditor',
    'PerformanceMonitor',
    'ResourceAllocator',
    'APIGateway'
]