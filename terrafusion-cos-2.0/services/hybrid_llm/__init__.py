"""
🧠 TerraFusion Hybrid LLM System
═════════════════════════════════════════════════════════════════

Revolutionary hybrid local/cloud Large Language Model architecture
designed specifically for government security and performance requirements.

Features:
- Local OpenAI OSS models for sensitive data
- Cloud fallback for complex reasoning
- Government-grade security and compliance
- Zero operational costs for basic operations
- Supreme Commander Claude coordination
"""

from .hybrid_llm_service import TerraFusionHybridLLM
from .local_llm_manager import LocalLLMManager
from .cloud_llm_gateway import CloudLLMGateway
from .security_filter import SecurityFilter
from .government_compliance import GovernmentCompliance

__all__ = [
    'TerraFusionHybridLLM',
    'LocalLLMManager', 
    'CloudLLMGateway',
    'SecurityFilter',
    'GovernmentCompliance'
]

__version__ = "1.0.0"
__author__ = "TerraFusion AI Systems"
__description__ = "Government-grade Hybrid LLM Architecture"