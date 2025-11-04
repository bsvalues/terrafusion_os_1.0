"""
Disaster Recovery and Continuity Package

This package implements the disaster recovery and business continuity framework
for Benton County Washington Assessor's Office, ensuring data resilience
and operational continuity in the face of various disruption scenarios.
"""

from disaster_recovery.recovery_manager import RecoveryManager, recovery_manager

__all__ = [
    'RecoveryManager',
    'recovery_manager'
]