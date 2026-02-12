"""
Data Processing Agent Module

This module implements a specialized agent for GIS data processing tasks
including format conversion, standardization, and metadata extraction.
"""

import logging
import time
import os
import json
from typing import Dict, List, Any, Optional

from .base_agent import BaseAgent
from ..core import mcp_instance

# Import GIS libraries only if available
try:
    import geopandas as gpd
    import fiona
    from shapely.geometry import mapping
    HAS_GIS_LIBS = True
except ImportError:
    HAS_GIS_LIBS = False
    # Create dummy functions/classes for type checking
    gpd = None
    class GeoDataFrameMock:
        def __init__(self, *args, **kwargs):
            pass
        def to_file(self, *args, **kwargs):
            pass

class DataProcessingAgent(BaseAgent):
    """
    Agent responsible for GIS data processing tasks
    """
    
    def __init__(self):
        """Initialize the data processing agent"""
        super().__init__()
        self.capabilities = [
            "format_conversion",
            "metadata_extraction",
            "data_validation",
            "feature_extraction"
        ]
        self.supported_formats = {
            "input": ["geojson", "shp", "kml", "gpkg", "csv", "json"],
            "output": ["geojson", "shp", "gpkg", "csv"]
        }
        self.logger.info("Data Processing Agent initialized")
    
    def process_task(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process a data-related task"""
        self.last_activity = time.time()
        
        if not task_data or "task_type" not in task_data:
            return {"error": "Invalid task data, missing task_type"}
        
        task_type = task_data["task_type"]
        
        if task_type == "format_conversion":
            return self.convert_format(task_data)
        elif task_type == "metadata_extraction":
            return self.extract_metadata(task_data)
        elif task_type == "data_validation":
            return self.validate_data(task_data)
        elif task_type == "feature_extraction":
            return self.extract_features(task_data)
        else:
            return {"error": f"Unsupported task type: {task_type}"}
    
    def convert_format(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Convert GIS data from one format to another"""
        self.set_status("converting")
        
        # Required parameters
        if "input_file" not in task_data or "output_format" not in task_data:
            return {"error": "Missing required parameters for format conversion"}
        
        input_file = task_data["input_file"]
        output_format = task_data["output_format"].lower()
        
        # Optional parameters
        output_file = task_data.get("output_file")
        if not output_file:
            base_name = os.path.splitext(input_file)[0]
            output_file = f"{base_name}.{output_format}"
        
        # Validate parameters
        if not os.path.exists(input_file):
            return {"error": f"Input file does not exist: {input_file}"}
        
        if output_format not in self.supported_formats["output"]:
            return {"error": f"Unsupported output format: {output_format}"}
        
        # Perform conversion
        try:
            start_time = time.time()
            
            # Read the input data
            gdf = gpd.read_file(input_file)
            
            # Write to the output format
            if output_format == "geojson":
                gdf.to_file(output_file, driver="GeoJSON")
            elif output_format == "shp":
                gdf.to_file(output_file)
            elif output_format == "gpkg":
                gdf.to_file(output_file, driver="GPKG")
            elif output_format == "csv":
                # For CSV, we need to convert geometry to WKT
                gdf["geometry_wkt"] = gdf["geometry"].apply(lambda g: g.wkt)
                # Drop the geometry column for CSV output
                gdf_no_geom = gdf.drop(columns=["geometry"])
                gdf_no_geom.to_csv(output_file, index=False)
            
            end_time = time.time()
            processing_time = end_time - start_time
            
            return {
                "status": "success",
                "output_file": output_file,
                "processing_time": processing_time,
                "feature_count": len(gdf)
            }
            
        except Exception as e:
            self.logger.error(f"Format conversion error: {str(e)}")
            return {"error": f"Format conversion failed: {str(e)}"}
        finally:
            self.set_status("idle")
    
    def extract_metadata(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract metadata from a GIS file"""
        self.set_status("extracting_metadata")
        
        # Required parameters
        if "input_file" not in task_data:
            return {"error": "Missing required parameter: input_file"}
        
        input_file = task_data["input_file"]
        
        # Validate parameters
        if not os.path.exists(input_file):
            return {"error": f"Input file does not exist: {input_file}"}
        
        # Perform metadata extraction
        try:
            start_time = time.time()
            
            # Read the input data
            gdf = gpd.read_file(input_file)
            
            # Basic metadata
            metadata = {
                "file_name": os.path.basename(input_file),
                "file_size": os.path.getsize(input_file),
                "feature_count": len(gdf),
                "crs": str(gdf.crs),
                "geometry_types": list(gdf.geometry.type.unique()),
                "property_names": list(gdf.columns),
                "bounds": {
                    "minx": gdf.total_bounds[0],
                    "miny": gdf.total_bounds[1],
                    "maxx": gdf.total_bounds[2],
                    "maxy": gdf.total_bounds[3]
                }
            }
            
            # Sample properties analysis
            if "properties_analysis" in task_data and task_data["properties_analysis"]:
                props_analysis = {}
                for col in gdf.columns:
                    if col != "geometry":
                        props_analysis[col] = {
                            "type": str(gdf[col].dtype),
                            "unique_values": len(gdf[col].unique()),
                            "null_count": gdf[col].isna().sum()
                        }
                metadata["properties_analysis"] = props_analysis
            
            end_time = time.time()
            processing_time = end_time - start_time
            
            metadata["processing_time"] = processing_time
            
            return {
                "status": "success",
                "metadata": metadata
            }
            
        except Exception as e:
            self.logger.error(f"Metadata extraction error: {str(e)}")
            return {"error": f"Metadata extraction failed: {str(e)}"}
        finally:
            self.set_status("idle")
    
    def validate_data(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate GIS data for quality and standards compliance"""
        self.set_status("validating")
        
        # Required parameters
        if "input_file" not in task_data:
            return {"error": "Missing required parameter: input_file"}
        
        input_file = task_data["input_file"]
        
        # Validate parameters
        if not os.path.exists(input_file):
            return {"error": f"Input file does not exist: {input_file}"}
        
        validation_rules = task_data.get("validation_rules", [])
        
        # Perform validation
        try:
            start_time = time.time()
            
            # Read the input data
            gdf = gpd.read_file(input_file)
            
            # Basic validation checks
            validation_results = {
                "feature_count": len(gdf),
                "has_geometry": all(not g.is_empty for g in gdf.geometry),
                "has_valid_geometry": all(g.is_valid for g in gdf.geometry),
                "issues": []
            }
            
            # Check for empty geometries
            empty_geoms = [i for i, g in enumerate(gdf.geometry) if g.is_empty]
            if empty_geoms:
                validation_results["issues"].append({
                    "type": "empty_geometry",
                    "count": len(empty_geoms),
                    "feature_indices": empty_geoms[:10]  # Limit to first 10
                })
            
            # Check for invalid geometries
            invalid_geoms = [i for i, g in enumerate(gdf.geometry) if not g.is_valid]
            if invalid_geoms:
                validation_results["issues"].append({
                    "type": "invalid_geometry",
                    "count": len(invalid_geoms),
                    "feature_indices": invalid_geoms[:10]  # Limit to first 10
                })
            
            # Apply custom validation rules if provided
            for rule in validation_rules:
                if rule["type"] == "required_properties":
                    for prop in rule["properties"]:
                        if prop not in gdf.columns:
                            validation_results["issues"].append({
                                "type": "missing_property",
                                "property": prop
                            })
                elif rule["type"] == "property_values":
                    prop = rule["property"]
                    if prop in gdf.columns:
                        if rule["rule"] == "not_null":
                            null_count = gdf[prop].isna().sum()
                            if null_count > 0:
                                validation_results["issues"].append({
                                    "type": "null_values",
                                    "property": prop,
                                    "count": int(null_count)
                                })
            
            end_time = time.time()
            processing_time = end_time - start_time
            
            validation_results["processing_time"] = processing_time
            validation_results["status"] = "valid" if not validation_results["issues"] else "issues_found"
            
            return {
                "status": "success",
                "validation": validation_results
            }
            
        except Exception as e:
            self.logger.error(f"Data validation error: {str(e)}")
            return {"error": f"Data validation failed: {str(e)}"}
        finally:
            self.set_status("idle")
    
    def extract_features(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract specific features from a GIS dataset"""
        self.set_status("extracting_features")
        
        # Required parameters
        if "input_file" not in task_data or "filter_criteria" not in task_data:
            return {"error": "Missing required parameters for feature extraction"}
        
        input_file = task_data["input_file"]
        filter_criteria = task_data["filter_criteria"]
        output_file = task_data.get("output_file")
        
        # Validate parameters
        if not os.path.exists(input_file):
            return {"error": f"Input file does not exist: {input_file}"}
        
        if not output_file:
            base_name = os.path.splitext(input_file)[0]
            output_file = f"{base_name}_filtered.geojson"
        
        # Perform feature extraction
        try:
            start_time = time.time()
            
            # Read the input data
            gdf = gpd.read_file(input_file)
            
            # Apply filters
            filtered_gdf = gdf
            
            for criterion in filter_criteria:
                property_name = criterion.get("property")
                operator = criterion.get("operator")
                value = criterion.get("value")
                
                if not property_name or not operator:
                    continue
                
                if property_name not in gdf.columns:
                    continue
                
                if operator == "equals":
                    filtered_gdf = filtered_gdf[filtered_gdf[property_name] == value]
                elif operator == "not_equals":
                    filtered_gdf = filtered_gdf[filtered_gdf[property_name] != value]
                elif operator == "greater_than":
                    filtered_gdf = filtered_gdf[filtered_gdf[property_name] > value]
                elif operator == "less_than":
                    filtered_gdf = filtered_gdf[filtered_gdf[property_name] < value]
                elif operator == "contains":
                    filtered_gdf = filtered_gdf[filtered_gdf[property_name].astype(str).str.contains(str(value))]
            
            # Save the filtered dataset
            filtered_gdf.to_file(output_file, driver="GeoJSON")
            
            end_time = time.time()
            processing_time = end_time - start_time
            
            return {
                "status": "success",
                "output_file": output_file,
                "processing_time": processing_time,
                "feature_count": len(filtered_gdf),
                "original_count": len(gdf)
            }
            
        except Exception as e:
            self.logger.error(f"Feature extraction error: {str(e)}")
            return {"error": f"Feature extraction failed: {str(e)}"}
        finally:
            self.set_status("idle")

# Register this agent with the MCP
mcp_instance.register_agent("data_processing", DataProcessingAgent())