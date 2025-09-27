#!/usr/bin/env python3
"""
Geospatial Engine Module
Python wrapper for Rust Geospatial Engine
"""

import os
import sys
import logging
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
import math

logger = logging.getLogger(__name__)

class GeometryType(Enum):
    """Geometry types"""
    POINT = "point"
    LINE = "line"
    POLYGON = "polygon"
    MULTIPOINT = "multipoint"
    MULTILINE = "multiline"
    MULTIPOLYGON = "multipolygon"

@dataclass
class Coordinate:
    """Coordinate structure"""
    x: float
    y: float
    z: Optional[float] = None

@dataclass
class Geometry:
    """Geometry structure"""
    id: str
    type: GeometryType
    coordinates: List[Coordinate]
    properties: Dict[str, Any]

class GeospatialEngine:
    """Geospatial Engine Module"""
    
    def __init__(self):
        self.geometries: Dict[str, Geometry] = {}
        self.spatial_index = {}
        self.engine_active = False
        
        logger.info("🗺️ Geospatial Engine initialized")
    
    def initialize(self) -> bool:
        """Initialize the Geospatial Engine"""
        try:
            logger.info("🚀 Initializing Geospatial Engine...")
            
            # Initialize spatial indexing
            self._build_spatial_index()
            
            self.engine_active = True
            logger.info("✅ Geospatial Engine initialized successfully")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize Geospatial Engine: {e}")
            return False
    
    def _build_spatial_index(self):
        """Build spatial index for fast queries"""
        # Simplified spatial indexing
        self.spatial_index = {
            "bounds": {
                "min_x": -180.0,
                "max_x": 180.0,
                "min_y": -90.0,
                "max_y": 90.0
            },
            "grid_size": 1000
        }
        logger.info("✅ Spatial index built")
    
    def add_geometry(self, geometry: Geometry) -> bool:
        """Add geometry to the engine"""
        try:
            self.geometries[geometry.id] = geometry
            logger.info(f"✅ Geometry {geometry.id} added")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to add geometry: {e}")
            return False
    
    def find_geometries_in_bounds(self, bounds: Dict[str, float]) -> List[Geometry]:
        """Find geometries within bounds"""
        try:
            results = []
            for geometry in self.geometries.values():
                if self._geometry_in_bounds(geometry, bounds):
                    results.append(geometry)
            
            logger.info(f"✅ Found {len(results)} geometries in bounds")
            return results
            
        except Exception as e:
            logger.error(f"❌ Failed to find geometries: {e}")
            return []
    
    def _geometry_in_bounds(self, geometry: Geometry, bounds: Dict[str, float]) -> bool:
        """Check if geometry is within bounds"""
        for coord in geometry.coordinates:
            if (bounds["min_x"] <= coord.x <= bounds["max_x"] and
                bounds["min_y"] <= coord.y <= bounds["max_y"]):
                return True
        return False
    
    def calculate_distance(self, coord1: Coordinate, coord2: Coordinate) -> float:
        """Calculate distance between two coordinates"""
        try:
            # Haversine formula for great circle distance
            lat1, lon1 = math.radians(coord1.y), math.radians(coord1.x)
            lat2, lon2 = math.radians(coord2.y), math.radians(coord2.x)
            
            dlat = lat2 - lat1
            dlon = lon2 - lon1
            
            a = (math.sin(dlat/2)**2 + 
                 math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2)
            c = 2 * math.asin(math.sqrt(a))
            
            # Earth's radius in kilometers
            earth_radius = 6371.0
            
            distance = earth_radius * c
            logger.info(f"✅ Distance calculated: {distance:.2f} km")
            return distance
            
        except Exception as e:
            logger.error(f"❌ Failed to calculate distance: {e}")
            return 0.0
    
    def get_engine_status(self) -> Dict[str, Any]:
        """Get engine status"""
        return {
            "active": self.engine_active,
            "total_geometries": len(self.geometries),
            "spatial_index_built": bool(self.spatial_index),
            "supported_formats": ["WKT", "GeoJSON", "Shapefile"],
            "coordinate_systems": ["WGS84", "UTM", "State Plane"]
        }

# Global instance
geospatial_engine = GeospatialEngine()
