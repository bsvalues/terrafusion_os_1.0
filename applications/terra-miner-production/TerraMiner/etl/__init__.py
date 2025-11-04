"""
ETL package for TerraMiner's modular data ingestion framework.

This package contains the BaseETL interface and specific ETL plugins
for different data sources.
"""

from etl.base import BaseETL

__all__ = ['BaseETL']