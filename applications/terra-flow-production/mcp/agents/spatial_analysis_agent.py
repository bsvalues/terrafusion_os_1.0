"""
Spatial Analysis Agent

This agent provides specialized GIS and spatial analysis functionality.
It can convert between GIS formats, perform spatial operations and analysis.
"""

import os
import json
import time
import tempfile
import logging
import uuid
from typing import Dict, Any, List, Optional, Union, Tuple

from mcp.agents.base_agent import BaseAgent

# Setup logging
logging.basicConfig(level=logging.INFO,
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class SpatialAnalysisAgent(BaseAgent):
    """Agent for GIS and spatial analysis"""
    
    def __init__(self):
        super().__init__()
        self.capabilities = [
            "convert_format",
            "spatial_analysis",
            "geo_processing",
            "visualization"
        ]
        self.agent_id = f"SpatialAnalysisAgent_{uuid.uuid4().hex[:8]}"
        self.status = "ready"
        logger.info(f"Agent {self.agent_id} initialized")
    
    def process_task(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process a spatial analysis task"""
        self.last_activity = time.time()
        self.status = "processing"
        logger.info(f"Agent {self.agent_id} status changed to: {self.status}")
        
        if not task_data or "task_type" not in task_data:
            self.status = "error"
            return {
                "status": "error",
                "message": "Invalid task data, missing task_type"
            }
        
        task_type = task_data["task_type"]
        
        try:
            # Route to the appropriate handler based on task type
            if task_type == "convert_format":
                result = self._convert_format(task_data)
            elif task_type == "analyze":
                result = self._analyze_spatial_data(task_data)
            elif task_type == "convert_to_geojson":
                result = self._convert_to_geojson(task_data)
            else:
                result = {
                    "status": "error",
                    "message": f"Unsupported task type: {task_type}"
                }
        except Exception as e:
            logger.error(f"Error processing task: {str(e)}")
            result = {
                "status": "error",
                "message": f"Error processing task: {str(e)}"
            }
        
        self.status = "ready"
        logger.info(f"Agent {self.agent_id} status changed to: {self.status}")
        return result
    
    def _convert_format(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Convert a GIS file to another format"""
        file_id = task_data.get("file_id")
        output_format = task_data.get("output_format", "geojson").lower()
        
        if not file_id:
            return {
                "status": "error",
                "message": "Missing file_id parameter"
            }
        
        # Get the file information
        from app import app, db
        from models import File
        import os
        
        file_record = File.query.get(file_id)
        if not file_record:
            return {
                "status": "error",
                "message": f"File not found: {file_id}"
            }
        
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], 
                                str(file_id), 
                                file_record.filename)
        
        if not os.path.exists(file_path):
            return {
                "status": "error",
                "message": f"File does not exist: {file_path}"
            }
        
        # Use geopandas for conversion if available
        try:
            import geopandas as gpd
            
            # Read the file with GeoPandas
            gdf = gpd.read_file(file_path)
            
            if output_format == "geojson":
                # Convert to GeoJSON
                geojson_data = json.loads(gdf.to_json())
                
                return {
                    "status": "success",
                    "data": geojson_data,
                    "metadata": {
                        "crs": str(gdf.crs),
                        "feature_count": len(gdf),
                        "geometry_type": str(gdf.geometry.type.iloc[0]) if len(gdf) > 0 else None,
                        "bounds": gdf.total_bounds.tolist() if len(gdf) > 0 else None
                    }
                }
            elif output_format in ["shp", "shapefile"]:
                # Need to write to a temporary file
                with tempfile.TemporaryDirectory() as tmpdir:
                    output_path = os.path.join(tmpdir, "output.shp")
                    gdf.to_file(output_path)
                    
                    # Return the file path
                    return {
                        "status": "success",
                        "file_path": output_path,
                        "metadata": {
                            "crs": str(gdf.crs),
                            "feature_count": len(gdf)
                        }
                    }
            else:
                return {
                    "status": "error",
                    "message": f"Unsupported output format: {output_format}"
                }
                
        except ImportError:
            logger.warning("GeoPandas not available for conversion")
            return {
                "status": "error",
                "message": "GeoPandas not available for conversion"
            }
        except Exception as e:
            logger.error(f"Error converting file: {str(e)}")
            return {
                "status": "error",
                "message": f"Error converting file: {str(e)}"
            }
    
    def _convert_to_geojson(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Convert a file to GeoJSON format"""
        file_id = task_data.get("file_id")
        
        if not file_id:
            return {
                "status": "error",
                "message": "Missing file_id parameter"
            }
        
        # This is just a wrapper around _convert_format
        return self._convert_format({
            "file_id": file_id,
            "output_format": "geojson"
        })
    
    def _analyze_spatial_data(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Perform spatial analysis on GIS data"""
        file_id = task_data.get("file_id")
        analysis_type = task_data.get("analysis_type")
        parameters = task_data.get("parameters", {})
        
        if not file_id:
            return {
                "status": "error",
                "message": "Missing file_id parameter"
            }
        
        if not analysis_type:
            return {
                "status": "error",
                "message": "Missing analysis_type parameter"
            }
        
        # Get the file information
        from app import app, db
        from models import File
        import os
        
        file_record = File.query.get(file_id)
        if not file_record:
            return {
                "status": "error",
                "message": f"File not found: {file_id}"
            }
        
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], 
                                str(file_id), 
                                file_record.filename)
        
        if not os.path.exists(file_path):
            return {
                "status": "error",
                "message": f"File does not exist: {file_path}"
            }
        
        # Use geopandas for analysis if available
        try:
            import geopandas as gpd
            
            # Read the file with GeoPandas
            gdf = gpd.read_file(file_path)
            
            # Perform the analysis
            if analysis_type == "buffer":
                # Buffer analysis
                distance = parameters.get("distance", 1.0)
                gdf['geometry'] = gdf.geometry.buffer(distance)
                
                # Convert to GeoJSON
                geojson_data = json.loads(gdf.to_json())
                
                return {
                    "status": "success",
                    "result": {
                        "type": "buffer",
                        "data": geojson_data
                    }
                }
            elif analysis_type == "centroid":
                # Centroid analysis
                gdf['geometry'] = gdf.geometry.centroid
                
                # Convert to GeoJSON
                geojson_data = json.loads(gdf.to_json())
                
                return {
                    "status": "success",
                    "result": {
                        "type": "centroid",
                        "data": geojson_data
                    }
                }
            elif analysis_type == "summary":
                # Summary statistics
                area = gdf.geometry.area
                length = gdf.geometry.length
                
                return {
                    "status": "success",
                    "result": {
                        "type": "summary",
                        "feature_count": len(gdf),
                        "geometry_type": str(gdf.geometry.type.iloc[0]) if len(gdf) > 0 else None,
                        "bounds": gdf.total_bounds.tolist() if len(gdf) > 0 else None,
                        "total_area": float(area.sum()),
                        "mean_area": float(area.mean()),
                        "total_length": float(length.sum()),
                        "mean_length": float(length.mean())
                    }
                }
            else:
                return {
                    "status": "error",
                    "message": f"Unsupported analysis type: {analysis_type}"
                }
                
        except ImportError:
            logger.warning("GeoPandas not available for analysis")
            return {
                "status": "error",
                "message": "GeoPandas not available for analysis"
            }
        except Exception as e:
            logger.error(f"Error analyzing file: {str(e)}")
            return {
                "status": "error",
                "message": f"Error analyzing file: {str(e)}"
            }