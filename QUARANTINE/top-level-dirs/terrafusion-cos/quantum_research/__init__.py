"""
TerraFusion cOS - Quantum AI Research Interface
Elite Immersive Research Environment for Harvard/MIT PhD Researchers

This module provides quantum consciousness visualization, AI swarm monitoring,
and advanced statistical analysis capabilities for government AI research.
"""

from .immersive_research_dashboard import (get_immersive_research_dashboard,
                                           initialize_immersive_dashboard)
from .quantum_consciousness_engine import (ConsciousnessLevel,
                                           ConsciousnessParameters,
                                           get_quantum_consciousness_engine,
                                           initialize_quantum_consciousness)
from .statistical_analysis_workbench import (
    get_statistical_analysis_workbench, initialize_statistical_workbench)

__all__ = [
    'get_quantum_consciousness_engine',
    'initialize_quantum_consciousness',
    'ConsciousnessLevel',
    'ConsciousnessParameters',
    'get_immersive_research_dashboard',
    'initialize_immersive_dashboard',
    'get_statistical_analysis_workbench',
    'initialize_statistical_workbench',
    'initialize_quantum_research_suite'
]

__version__ = '1.0.0'
__author__ = 'TerraFusion Elite Engineering Team'


async def initialize_quantum_research_suite() -> bool:
    """
    Initialize complete Quantum Research Suite for cOS integration

    Returns:
        bool: True if all components initialized successfully
    """
    import logging
    logger = logging.getLogger(__name__)

    try:
        logger.info("[cOS:QuantumResearch] Initializing elite research suite...")

        # Initialize quantum consciousness engine
        consciousness_init = await initialize_quantum_consciousness()

        # Initialize immersive research dashboard
        dashboard_init = await initialize_immersive_dashboard()

        # Initialize statistical analysis workbench
        workbench_init = await initialize_statistical_workbench()

        # All components must initialize successfully
        suite_initialized = consciousness_init and dashboard_init and workbench_init

        if suite_initialized:
            logger.info("[cOS:QuantumResearch] ✅ Elite research suite operational")
        else:
            logger.error("[cOS:QuantumResearch] ❌ Suite initialization failed")

        return suite_initialized

    except Exception as e:
        logger.error(f"[cOS:QuantumResearch] ❌ Suite initialization error: {e}")
        return False
