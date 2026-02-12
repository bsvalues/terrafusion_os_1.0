"""
Sales GIS Data Validator

This module provides utilities for validating GIS data associated with sales records.
It integrates with external GIS services to ensure data consistency and quality.
"""

import os
import logging
import json
import datetime
from typing import Dict, List, Any, Optional, Tuple, Union
import pandas as pd
import numpy as np
try:
    import geopandas as gpd
    from shapely.geometry import shape, mapping
    from shapely.validation import explain_validity
    HAS_GIS_LIBS = True
except ImportError:
    HAS_GIS_LIBS = False

from app import db
from sync_service.notification_system import SyncNotificationManager

# Configure logging
logger = logging.getLogger(__name__)

class SalesGISValidator:
    """
    Validator for GIS data associated with sales records
    
    This class provides utilities for validating spatial data associated with 
    property sales, ensuring data consistency between sales records and GIS data.
    """
    
    def __init__(self):
        """Initialize the Sales GIS Validator"""
        self.notification_manager = SyncNotificationManager()
        self.gis_connection_params = self._load_gis_connection_params()
        logger.info("Sales GIS Validator initialized")
    
    def _load_gis_connection_params(self) -> Dict[str, Any]:
        """
        Load GIS connection parameters
        
        Returns:
            GIS connection parameters dictionary
        """
        # In production, these would be loaded from configuration or database
        # For development, use placeholder values
        return {
            "gis_server": os.environ.get("GIS_SERVER", "gis.example.com"),
            "gis_database": os.environ.get("GIS_DATABASE", "gis_database"),
            "gis_username": os.environ.get("GIS_USERNAME", "gis_user"),
            "gis_password": os.environ.get("GIS_PASSWORD", ""),
            "gis_port": os.environ.get("GIS_PORT", "5432")
        }
    
    def validate_parcel_geometry(self, parcel_id: str) -> Dict[str, Any]:
        """
        Validate a parcel's geometry from GIS data
        
        Args:
            parcel_id: The parcel identifier
            
        Returns:
            Validation result including geometry validity status
        """
        if not HAS_GIS_LIBS:
            logger.warning("GIS libraries not available - geometry validation skipped")
            return {
                "valid": None,
                "error": "GIS libraries not available",
                "message": "Install geopandas and shapely for geometry validation"
            }
        
        try:
            # This would make a real query to GIS database in production
            # For development, simulate the query result
            parcel_data = self._query_parcel_data(parcel_id)
            
            if not parcel_data:
                return {
                    "valid": False,
                    "error": "Parcel not found in GIS database",
                    "parcel_id": parcel_id
                }
            
            # Validate geometry if available
            if "geometry" in parcel_data:
                geometry = parcel_data["geometry"]
                if isinstance(geometry, str):
                    try:
                        # Convert GeoJSON string to Shapely geometry
                        geometry_obj = shape(json.loads(geometry))
                    except Exception as e:
                        return {
                            "valid": False,
                            "error": f"Invalid geometry format: {str(e)}",
                            "parcel_id": parcel_id
                        }
                else:
                    # Assume it's already a geometry-like object
                    geometry_obj = geometry
                
                # Check if geometry is valid
                is_valid = geometry_obj.is_valid
                validity_reason = explain_validity(geometry_obj) if not is_valid else None
                
                return {
                    "valid": is_valid,
                    "error": validity_reason,
                    "parcel_id": parcel_id,
                    "area": geometry_obj.area if is_valid else None,
                    "geometry_type": geometry_obj.geom_type if is_valid else None
                }
            else:
                return {
                    "valid": False,
                    "error": "No geometry data available for parcel",
                    "parcel_id": parcel_id
                }
        except Exception as e:
            logger.error(f"Error validating parcel geometry: {str(e)}")
            return {
                "valid": False,
                "error": f"Validation error: {str(e)}",
                "parcel_id": parcel_id
            }
    
    def validate_spatial_attributes(self, sale_data: Dict[str, Any], gis_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate spatial attributes for a sale
        
        Args:
            sale_data: The sale record data
            gis_data: The associated GIS data
            
        Returns:
            Validation result for spatial attributes
        """
        validation_issues = []
        
        # Check parcel ID consistency
        if "parcel_number" in sale_data and "parcel_id" in gis_data:
            if sale_data["parcel_number"] != gis_data["parcel_id"]:
                validation_issues.append(
                    f"Parcel ID mismatch: Sale={sale_data['parcel_number']}, GIS={gis_data['parcel_id']}"
                )
        
        # Check address consistency if available
        if "property_address" in sale_data and "address" in gis_data:
            # Normalize addresses for comparison (remove spaces, lowercase)
            sale_address = self._normalize_address(sale_data["property_address"])
            gis_address = self._normalize_address(gis_data["address"])
            
            if sale_address != gis_address:
                # Check if the difference is just minor formatting
                if self._address_similarity(sale_address, gis_address) < 0.8:
                    validation_issues.append(
                        f"Address mismatch: Sale={sale_data['property_address']}, GIS={gis_data['address']}"
                    )
        
        # Check property attributes consistency
        for attr in ["acres", "square_feet", "lot_size"]:
            sale_attr = None
            gis_attr = None
            
            # Extract sale attribute
            if attr in sale_data:
                sale_attr = sale_data[attr]
            elif attr == "square_feet" and "sqft" in sale_data:
                sale_attr = sale_data["sqft"]
            elif attr == "lot_size" and "lot_area" in sale_data:
                sale_attr = sale_data["lot_area"]
            
            # Extract GIS attribute
            if attr in gis_data:
                gis_attr = gis_data[attr]
            elif attr == "square_feet" and "sqft" in gis_data:
                gis_attr = gis_data["sqft"]
            elif attr == "lot_size" and "lot_area" in gis_data:
                gis_attr = gis_data["lot_area"]
            elif attr == "acres" and "acreage" in gis_data:
                gis_attr = gis_data["acreage"]
            
            # Compare if both attributes are available
            if sale_attr is not None and gis_attr is not None:
                try:
                    # Convert to float for comparison
                    sale_attr = float(sale_attr)
                    gis_attr = float(gis_attr)
                    
                    # Allow for small differences (within 5%)
                    if abs(sale_attr - gis_attr) / max(sale_attr, gis_attr) > 0.05:
                        validation_issues.append(
                            f"{attr.capitalize()} mismatch: Sale={sale_attr}, GIS={gis_attr}"
                        )
                except (ValueError, TypeError):
                    # Not comparable as numbers
                    if str(sale_attr) != str(gis_attr):
                        validation_issues.append(
                            f"{attr.capitalize()} mismatch: Sale={sale_attr}, GIS={gis_attr}"
                        )
        
        return {
            "valid": len(validation_issues) == 0,
            "issues": validation_issues,
            "sale_id": sale_data.get("sale_id"),
            "parcel_id": sale_data.get("parcel_number")
        }
    
    def verify_location_attributes(self, parcel_id: str) -> Dict[str, Any]:
        """
        Verify location attributes for a parcel
        
        Args:
            parcel_id: The parcel identifier
            
        Returns:
            Location attributes including zoning, jurisdiction, school district, etc.
        """
        try:
            # This would query the GIS system for location attributes in production
            # For development, return sample attributes
            return {
                "status": "success",
                "parcel_id": parcel_id,
                "attributes": {
                    "zoning": "R-1",
                    "jurisdiction": "Kennewick",
                    "school_district": "Kennewick School District",
                    "census_tract": "9501.00",
                    "flood_zone": "X",
                    "watershed": "Middle Columbia-Lake Wallula",
                    "neighborhood_code": "1045"
                }
            }
        except Exception as e:
            logger.error(f"Error retrieving location attributes: {str(e)}")
            return {
                "status": "error",
                "parcel_id": parcel_id,
                "message": f"Error retrieving location attributes: {str(e)}"
            }
    
    def _query_parcel_data(self, parcel_id: str) -> Optional[Dict[str, Any]]:
        """
        Query parcel data from GIS database
        
        Args:
            parcel_id: The parcel identifier
            
        Returns:
            Parcel data dictionary if found, None otherwise
        """
        # This would make an actual database query in production
        # For development, simulate a response
        
        # Mock successful response for development
        return {
            "parcel_id": parcel_id,
            "address": "123 Sample St, Kennewick, WA 99336",
            "acres": 0.25,
            "square_feet": 10890,
            "zoning": "R-1",
            "geometry": '{"type": "Polygon", "coordinates": [[[0, 0], [0, 100], [100, 100], [100, 0], [0, 0]]]}'
        }
    
    def _normalize_address(self, address: str) -> str:
        """
        Normalize an address for comparison
        
        Args:
            address: The address to normalize
            
        Returns:
            Normalized address
        """
        if not address:
            return ""
        
        # Convert to lowercase
        address = address.lower()
        
        # Remove common terms and punctuation
        for term in ["street", "avenue", "road", "drive", "lane", "way", "court", "plaza", "boulevard", "st", "ave", "rd", "dr", "ln", "ct", "pl", "blvd"]:
            address = address.replace(f" {term} ", " ")
            address = address.replace(f" {term},", ",")
            address = address.replace(f" {term}.", ".")
        
        # Remove punctuation
        for char in [',', '.', '#', '-', '/', '\\']:
            address = address.replace(char, ' ')
        
        # Normalize whitespace
        while '  ' in address:
            address = address.replace('  ', ' ')
        
        return address.strip()
    
    def _address_similarity(self, addr1: str, addr2: str) -> float:
        """
        Calculate similarity between two addresses (0.0 to 1.0)
        
        Args:
            addr1: First address
            addr2: Second address
            
        Returns:
            Similarity score (0.0 to 1.0)
        """
        # Simple token-based similarity
        if not addr1 or not addr2:
            return 0.0
        
        tokens1 = set(addr1.split())
        tokens2 = set(addr2.split())
        
        if not tokens1 or not tokens2:
            return 0.0
        
        # Jaccard similarity: intersection / union
        intersection = tokens1.intersection(tokens2)
        union = tokens1.union(tokens2)
        
        return len(intersection) / len(union)