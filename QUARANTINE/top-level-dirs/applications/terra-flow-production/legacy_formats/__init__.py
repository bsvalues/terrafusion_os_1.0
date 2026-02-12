"""
Legacy Format Handlers for GeoAssessmentPro

This package contains handlers for various legacy data formats
used in property assessment systems.
"""

from typing import Dict, Type, Any

def register_formats(registry: Dict[str, Any]) -> None:
    """
    Register all available format handlers
    
    Args:
        registry: Format registry to update
    """
    # Import all format handlers
    from .csv_handler import CSVHandler
    from .dbf_handler import DBFHandler
    from .excel_handler import ExcelHandler
    from .fixed_width_handler import FixedWidthHandler
    from .xml_handler import XMLHandler
    
    # Register handlers
    registry["csv"] = CSVHandler
    registry["pipe_delimited"] = CSVHandler  # Use CSV handler for pipe-delimited
    registry["tab_delimited"] = CSVHandler   # Use CSV handler for tab-delimited
    registry["dbf"] = DBFHandler
    registry["excel"] = ExcelHandler
    registry["fixed_width"] = FixedWidthHandler
    registry["xml"] = XMLHandler