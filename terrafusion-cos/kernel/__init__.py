# TerraFusion cOS Kernel Module
# Core operating system services and resource management

__version__ = "1.0.0"
__author__ = "TerraFusion Systems"
__description__ = "Vendor substrate operating system kernel"

from .main import TerraFusionKernel
# from .process_manager import ProcessManager
# from .memory_manager import MemoryManager
# from .io_manager import IOManager
# from .filesystem import FileSystemManager
# from .network_stack import NetworkStack
# from .security_primitives import SecurityPrimitives

__all__ = [
    'TerraFusionKernel',
    'ProcessManager', 
    'MemoryManager',
    'IOManager',
    'FileSystemManager',
    'NetworkStack',
    'SecurityPrimitives'
]