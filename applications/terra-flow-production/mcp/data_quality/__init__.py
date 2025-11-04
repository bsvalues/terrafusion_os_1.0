"""
Data Quality Module

This module provides data quality management functionality for 
the GeoAssessmentPro platform.
"""

from mcp.data_quality.alerts import alert_manager, QualityAlert

__all__ = [
    'alert_manager',
    'QualityAlert'
]