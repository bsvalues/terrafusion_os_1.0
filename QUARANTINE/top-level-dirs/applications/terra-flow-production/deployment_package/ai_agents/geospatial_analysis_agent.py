"""
Geospatial Analysis Agent for GeoAssessmentPro

This module provides geospatial analysis capabilities using AI and traditional GIS techniques.
"""

import os
import sys
import time
import uuid
import json
import logging
import threading
from typing import Dict, Any, List, Optional, Union, Tuple
from datetime import datetime

# Geospatial libraries
try:
    import geopandas as gpd
    import pandas as pd
    import numpy as np
    from shapely.geometry import shape, Point, Polygon, LineString, mapping
    import shapely
    HAS_GEOSPATIAL = True
except ImportError:
    HAS_GEOSPATIAL = False
    
# OpenAI integration
try:
    import openai
    HAS_OPENAI = True
except ImportError:
    HAS_OPENAI = False

# Import base agent class from MCP
from ai_agents.mcp_core import BaseAgent, TaskPriority, TaskStatus, AgentStatus

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GeospatialAnalysisAgent(BaseAgent):
    """
    Geospatial Analysis Agent for processing spatial data using AI and traditional GIS techniques.
    """
    
    def __init__(self):
        """Initialize the GeospatialAnalysisAgent"""
        super().__init__()
        # Set the agent's capabilities
        self.capabilities = {
            "spatial_join": self._spatial_join,
            "spatial_overlay": self._spatial_overlay,
            "validate_topology": self._validate_topology,
            "cluster_analysis": self._cluster_analysis,
            "nearest_neighbor": self._nearest_neighbor,
            "buffer_analysis": self._buffer_analysis,
            "simplified_geometries": self._simplify_geometries,
            "convex_hull": self._convex_hull,
            "ai_spatial_analysis": self._ai_spatial_analysis
        }
        
        # Initialize database connection (if needed)
        self.conn = None
        self._init_db_connection()
        
        # Check if geospatial libraries are available
        if not HAS_GEOSPATIAL:
            logger.warning("Geospatial libraries not available, some functions will be limited")
        
        # Check if OpenAI integration is available
        if not HAS_OPENAI:
            logger.warning("OpenAI integration not available, AI analysis will be limited")
        else:
            # Initialize OpenAI with API key
            openai.api_key = os.environ.get("OPENAI_API_KEY")
            if not openai.api_key:
                logger.warning("OpenAI API key not set, AI analysis will be unavailable")
        
        logger.info("GeospatialAnalysisAgent initialized")
    
    def _init_db_connection(self):
        """Initialize database connection for spatial operations"""
        try:
            import psycopg2
            
            # Get connection parameters from environment variables
            db_params = {
                "dbname": os.environ.get("PGDATABASE"),
                "user": os.environ.get("PGUSER"),
                "password": os.environ.get("PGPASSWORD"),
                "host": os.environ.get("PGHOST"),
                "port": os.environ.get("PGPORT")
            }
            
            # Create connection with PostGIS support
            self.conn = psycopg2.connect(**db_params)
            logger.info("Database connection initialized for GeospatialAnalysisAgent")
            
        except (ImportError, Exception) as e:
            logger.warning(f"Could not initialize database connection: {str(e)}")
            self.conn = None
    
    def process_task(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process a geospatial analysis task.
        
        Args:
            task_data: Dictionary containing task data
            
        Returns:
            Dictionary containing task result
        """
        start_time = time.time()
        
        if not task_data or "operation" not in task_data:
            return {
                "status": "error", 
                "error": "Invalid task data, missing operation"
            }
        
        operation = task_data["operation"]
        
        if operation not in self.capabilities:
            return {
                "status": "error",
                "error": f"Unsupported operation: {operation}",
                "supported_operations": list(self.capabilities.keys())
            }
        
        try:
            # Call the appropriate handler function
            result = self.capabilities[operation](task_data)
            
            # Add execution time
            execution_time = time.time() - start_time
            result["execution_time"] = execution_time
            
            return result
            
        except Exception as e:
            logger.error(f"Error processing {operation} task: {str(e)}")
            
            return {
                "status": "error",
                "operation": operation,
                "error": str(e),
                "execution_time": time.time() - start_time
            }
    
    def _spatial_join(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Perform a spatial join between two layers.
        
        Args:
            task_data: Dictionary containing:
                - target_layer: Target layer features (GeoJSON or layer name)
                - join_layer: Join layer features (GeoJSON or layer name)
                - join_type: Type of join (intersects, contains, within)
                - columns: Columns to include from join layer
        
        Returns:
            Dictionary with join results
        """
        if not HAS_GEOSPATIAL:
            return {"status": "error", "error": "Geospatial libraries not available"}
        
        # Extract parameters
        target_layer = task_data.get("target_layer")
        join_layer = task_data.get("join_layer")
        join_type = task_data.get("join_type", "intersects")
        columns = task_data.get("columns", None)
        
        # Validate parameters
        if not target_layer or not join_layer:
            return {"status": "error", "error": "Missing required parameters: target_layer, join_layer"}
        
        try:
            # Load layers as GeoDataFrames
            target_gdf = self._load_layer(target_layer)
            join_gdf = self._load_layer(join_layer)
            
            # Filter columns if specified
            if columns:
                join_columns = [c for c in columns if c in join_gdf.columns]
                join_gdf = join_gdf[join_columns + ['geometry']]
            
            # Perform spatial join
            if join_type == "intersects":
                result_gdf = gpd.sjoin(target_gdf, join_gdf, how="inner", predicate="intersects")
            elif join_type == "contains":
                result_gdf = gpd.sjoin(target_gdf, join_gdf, how="inner", predicate="contains")
            elif join_type == "within":
                result_gdf = gpd.sjoin(target_gdf, join_gdf, how="inner", predicate="within")
            else:
                return {"status": "error", "error": f"Unsupported join type: {join_type}"}
            
            # Convert result to GeoJSON
            result_geojson = json.loads(result_gdf.to_json())
            
            # Return result
            return {
                "status": "success",
                "operation": "spatial_join",
                "join_type": join_type,
                "feature_count": len(result_gdf),
                "results": result_geojson
            }
            
        except Exception as e:
            logger.error(f"Error in spatial join: {str(e)}")
            return {"status": "error", "error": str(e)}
    
    def _spatial_overlay(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Perform a spatial overlay operation (intersection, union, difference).
        
        Args:
            task_data: Dictionary containing:
                - target_layer: Target layer features (GeoJSON or layer name)
                - overlay_layer: Overlay layer features (GeoJSON or layer name)
                - operation: Type of overlay (intersection, union, difference, symmetric_difference)
        
        Returns:
            Dictionary with overlay results
        """
        if not HAS_GEOSPATIAL:
            return {"status": "error", "error": "Geospatial libraries not available"}
        
        # Extract parameters
        target_layer = task_data.get("target_layer")
        overlay_layer = task_data.get("overlay_layer")
        operation = task_data.get("overlay_operation", "intersection")
        
        # Validate parameters
        if not target_layer or not overlay_layer:
            return {"status": "error", "error": "Missing required parameters: target_layer, overlay_layer"}
        
        try:
            # Load layers as GeoDataFrames
            target_gdf = self._load_layer(target_layer)
            overlay_gdf = self._load_layer(overlay_layer)
            
            # Perform overlay operation
            if operation == "intersection":
                result_gdf = gpd.overlay(target_gdf, overlay_gdf, how="intersection")
            elif operation == "union":
                result_gdf = gpd.overlay(target_gdf, overlay_gdf, how="union")
            elif operation == "difference":
                result_gdf = gpd.overlay(target_gdf, overlay_gdf, how="difference")
            elif operation == "symmetric_difference":
                result_gdf = gpd.overlay(target_gdf, overlay_gdf, how="symmetric_difference")
            else:
                return {"status": "error", "error": f"Unsupported overlay operation: {operation}"}
            
            # Convert result to GeoJSON
            result_geojson = json.loads(result_gdf.to_json())
            
            # Return result
            return {
                "status": "success",
                "operation": "spatial_overlay",
                "overlay_operation": operation,
                "feature_count": len(result_gdf),
                "results": result_geojson
            }
            
        except Exception as e:
            logger.error(f"Error in spatial overlay: {str(e)}")
            return {"status": "error", "error": str(e)}
    
    def _validate_topology(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate topology of geometries.
        
        Args:
            task_data: Dictionary containing:
                - layer: Layer features (GeoJSON or layer name)
                - checks: List of topology checks to perform
                  (valid, simple, self_intersections, gaps, overlaps)
        
        Returns:
            Dictionary with validation results
        """
        if not HAS_GEOSPATIAL:
            return {"status": "error", "error": "Geospatial libraries not available"}
        
        # Extract parameters
        layer = task_data.get("layer")
        checks = task_data.get("checks", ["valid", "simple"])
        
        # Validate parameters
        if not layer:
            return {"status": "error", "error": "Missing required parameter: layer"}
        
        try:
            # Load layer as GeoDataFrame
            gdf = self._load_layer(layer)
            
            # Initialize results
            validation_results = {
                "feature_count": len(gdf),
                "valid_count": 0,
                "invalid_count": 0,
                "features": []
            }
            
            # Perform validation checks
            for idx, row in gdf.iterrows():
                feature_result = {
                    "id": row.get("id", idx),
                    "valid": True,
                    "issues": []
                }
                
                geom = row.geometry
                
                # Skip null geometries
                if geom is None:
                    feature_result["valid"] = False
                    feature_result["issues"].append("Null geometry")
                    validation_results["invalid_count"] += 1
                    validation_results["features"].append(feature_result)
                    continue
                
                # Check if geometry is valid
                if "valid" in checks and not geom.is_valid:
                    feature_result["valid"] = False
                    feature_result["issues"].append("Invalid geometry")
                
                # Check if geometry is simple
                if "simple" in checks and hasattr(geom, "is_simple") and not geom.is_simple:
                    feature_result["valid"] = False
                    feature_result["issues"].append("Non-simple geometry")
                
                # Check for self-intersections
                if "self_intersections" in checks:
                    # For lines and polygons
                    if geom.geom_type in ["LineString", "MultiLineString", "Polygon", "MultiPolygon"]:
                        # Extract rings/boundaries and check for self-intersections
                        if geom.geom_type in ["Polygon", "MultiPolygon"]:
                            boundaries = shapely.boundary(geom)
                            if not boundaries.is_simple:
                                feature_result["valid"] = False
                                feature_result["issues"].append("Self-intersecting boundary")
                        else:
                            if not geom.is_simple:
                                feature_result["valid"] = False
                                feature_result["issues"].append("Self-intersecting geometry")
                
                # Add feature result to the list
                if feature_result["valid"]:
                    validation_results["valid_count"] += 1
                else:
                    validation_results["invalid_count"] += 1
                
                validation_results["features"].append(feature_result)
            
            # Return result
            return {
                "status": "success",
                "operation": "validate_topology",
                "checks": checks,
                "validation_results": validation_results
            }
            
        except Exception as e:
            logger.error(f"Error in topology validation: {str(e)}")
            return {"status": "error", "error": str(e)}
    
    def _nearest_neighbor(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Perform nearest neighbor analysis.
        
        Args:
            task_data: Dictionary containing:
                - target_layer: Target layer features (GeoJSON or layer name)
                - reference_layer: Reference layer features (GeoJSON or layer name)
                - k: Number of nearest neighbors to find (default: 1)
                - max_distance: Maximum distance to consider (optional)
        
        Returns:
            Dictionary with nearest neighbor results
        """
        if not HAS_GEOSPATIAL:
            return {"status": "error", "error": "Geospatial libraries not available"}
        
        try:
            # Import scipy for spatial distance calculations
            from scipy.spatial import cKDTree
            
            # Extract parameters
            target_layer = task_data.get("target_layer")
            reference_layer = task_data.get("reference_layer")
            k = int(task_data.get("k", 1))
            max_distance = task_data.get("max_distance")
            
            # Validate parameters
            if not target_layer or not reference_layer:
                return {"status": "error", "error": "Missing required parameters: target_layer, reference_layer"}
            
            # Load layers as GeoDataFrames
            target_gdf = self._load_layer(target_layer)
            reference_gdf = self._load_layer(reference_layer)
            
            # Convert to same CRS if different
            if target_gdf.crs != reference_gdf.crs:
                reference_gdf = reference_gdf.to_crs(target_gdf.crs)
            
            # Extract centroids for point-based analysis
            target_centroids = target_gdf.geometry.centroid
            reference_centroids = reference_gdf.geometry.centroid
            
            # Convert to coordinates array
            target_coords = np.array([point.coords[0] for point in target_centroids])
            reference_coords = np.array([point.coords[0] for point in reference_centroids])
            
            # Build KD-Tree for efficient nearest neighbor search
            tree = cKDTree(reference_coords)
            
            # Query KD-Tree for k nearest neighbors
            if max_distance:
                distances, indices = tree.query(target_coords, k=k, distance_upper_bound=max_distance)
            else:
                distances, indices = tree.query(target_coords, k=k)
            
            # Format results
            results = []
            
            for i, (dist, idx) in enumerate(zip(distances, indices)):
                if not isinstance(dist, np.ndarray):
                    # Single nearest neighbor
                    dist = [dist]
                    idx = [idx]
                
                # Skip infinite distances (no neighbors found within max_distance)
                valid_neighbors = [(d, j) for d, j in zip(dist, idx) if d != np.inf and j < len(reference_gdf)]
                
                if not valid_neighbors:
                    neighbors = []
                else:
                    neighbors = [
                        {
                            "id": reference_gdf.iloc[j].get("id", int(j)),
                            "distance": float(d),
                            "properties": {
                                k: v for k, v in reference_gdf.iloc[j].items() 
                                if k != 'geometry' and not isinstance(v, (list, dict))
                            }
                        } 
                        for d, j in valid_neighbors
                    ]
                
                results.append({
                    "id": target_gdf.iloc[i].get("id", int(i)),
                    "neighbors": neighbors,
                    "neighbor_count": len(neighbors)
                })
            
            # Return result
            return {
                "status": "success",
                "operation": "nearest_neighbor",
                "k": k,
                "max_distance": max_distance,
                "results": results
            }
            
        except ImportError:
            return {"status": "error", "error": "SciPy library not available for nearest neighbor analysis"}
            
        except Exception as e:
            logger.error(f"Error in nearest neighbor analysis: {str(e)}")
            return {"status": "error", "error": str(e)}
    
    def _buffer_analysis(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Perform buffer analysis on geometries.
        
        Args:
            task_data: Dictionary containing:
                - layer: Layer features (GeoJSON or layer name)
                - distance: Buffer distance
                - resolution: Number of segments for circular edges
                - dissolve: Whether to dissolve the resulting buffers
        
        Returns:
            Dictionary with buffer results
        """
        if not HAS_GEOSPATIAL:
            return {"status": "error", "error": "Geospatial libraries not available"}
        
        # Extract parameters
        layer = task_data.get("layer")
        distance = task_data.get("distance")
        resolution = int(task_data.get("resolution", 16))
        dissolve = task_data.get("dissolve", False)
        
        # Validate parameters
        if not layer or distance is None:
            return {"status": "error", "error": "Missing required parameters: layer, distance"}
        
        try:
            # Load layer as GeoDataFrame
            gdf = self._load_layer(layer)
            
            # Create buffer
            buffer_gdf = gdf.copy()
            buffer_gdf.geometry = buffer_gdf.geometry.buffer(distance, resolution=resolution)
            
            # Dissolve buffers if requested
            if dissolve:
                buffer_gdf = buffer_gdf.dissolve()
            
            # Convert result to GeoJSON
            result_geojson = json.loads(buffer_gdf.to_json())
            
            # Return result
            return {
                "status": "success",
                "operation": "buffer_analysis",
                "distance": distance,
                "resolution": resolution,
                "dissolve": dissolve,
                "feature_count": len(buffer_gdf),
                "results": result_geojson
            }
            
        except Exception as e:
            logger.error(f"Error in buffer analysis: {str(e)}")
            return {"status": "error", "error": str(e)}
    
    def _simplify_geometries(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Simplify geometries while preserving topology.
        
        Args:
            task_data: Dictionary containing:
                - layer: Layer features (GeoJSON or layer name)
                - tolerance: Simplification tolerance
                - preserve_topology: Whether to preserve topology
        
        Returns:
            Dictionary with simplified geometries
        """
        if not HAS_GEOSPATIAL:
            return {"status": "error", "error": "Geospatial libraries not available"}
        
        # Extract parameters
        layer = task_data.get("layer")
        tolerance = task_data.get("tolerance")
        preserve_topology = task_data.get("preserve_topology", True)
        
        # Validate parameters
        if not layer or tolerance is None:
            return {"status": "error", "error": "Missing required parameters: layer, tolerance"}
        
        try:
            # Load layer as GeoDataFrame
            gdf = self._load_layer(layer)
            
            # Simplify geometries
            simplified_gdf = gdf.copy()
            simplified_gdf.geometry = simplified_gdf.geometry.simplify(tolerance, preserve_topology=preserve_topology)
            
            # Calculate reduction metrics
            original_vertices = gdf.geometry.apply(lambda g: len(shapely.get_coordinates(g)))
            simplified_vertices = simplified_gdf.geometry.apply(lambda g: len(shapely.get_coordinates(g)))
            
            total_original = original_vertices.sum()
            total_simplified = simplified_vertices.sum()
            reduction_percent = (total_original - total_simplified) / total_original * 100 if total_original > 0 else 0
            
            # Convert result to GeoJSON
            result_geojson = json.loads(simplified_gdf.to_json())
            
            # Return result
            return {
                "status": "success",
                "operation": "simplify_geometries",
                "tolerance": tolerance,
                "preserve_topology": preserve_topology,
                "original_vertices": int(total_original),
                "simplified_vertices": int(total_simplified),
                "reduction_percent": float(reduction_percent),
                "feature_count": len(simplified_gdf),
                "results": result_geojson
            }
            
        except Exception as e:
            logger.error(f"Error in geometry simplification: {str(e)}")
            return {"status": "error", "error": str(e)}
    
    def _convex_hull(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate convex hull of geometries.
        
        Args:
            task_data: Dictionary containing:
                - layer: Layer features (GeoJSON or layer name)
                - per_feature: Whether to calculate hull per feature or for all geometries
        
        Returns:
            Dictionary with convex hull results
        """
        if not HAS_GEOSPATIAL:
            return {"status": "error", "error": "Geospatial libraries not available"}
        
        # Extract parameters
        layer = task_data.get("layer")
        per_feature = task_data.get("per_feature", False)
        
        # Validate parameters
        if not layer:
            return {"status": "error", "error": "Missing required parameter: layer"}
        
        try:
            # Load layer as GeoDataFrame
            gdf = self._load_layer(layer)
            
            if per_feature:
                # Calculate convex hull for each feature
                result_gdf = gdf.copy()
                result_gdf.geometry = result_gdf.geometry.convex_hull
            else:
                # Calculate convex hull for all geometries combined
                hull = shapely.unary_union(gdf.geometry.to_list()).convex_hull
                result_gdf = gpd.GeoDataFrame(geometry=[hull], crs=gdf.crs)
            
            # Convert result to GeoJSON
            result_geojson = json.loads(result_gdf.to_json())
            
            # Return result
            return {
                "status": "success",
                "operation": "convex_hull",
                "per_feature": per_feature,
                "feature_count": len(result_gdf),
                "results": result_geojson
            }
            
        except Exception as e:
            logger.error(f"Error in convex hull calculation: {str(e)}")
            return {"status": "error", "error": str(e)}
    
    def _cluster_analysis(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Perform spatial clustering analysis.
        
        Args:
            task_data: Dictionary containing:
                - layer: Layer features (GeoJSON or layer name)
                - algorithm: Clustering algorithm (dbscan, hdbscan, kmeans)
                - params: Algorithm-specific parameters
        
        Returns:
            Dictionary with clustering results
        """
        if not HAS_GEOSPATIAL:
            return {"status": "error", "error": "Geospatial libraries not available"}
        
        # Extract parameters
        layer = task_data.get("layer")
        algorithm = task_data.get("algorithm", "dbscan")
        params = task_data.get("params", {})
        
        # Validate parameters
        if not layer:
            return {"status": "error", "error": "Missing required parameter: layer"}
        
        try:
            # Import clustering algorithms
            from sklearn.cluster import DBSCAN, KMeans
            
            # Load layer as GeoDataFrame
            gdf = self._load_layer(layer)
            
            # Extract coordinates for clustering
            coords = np.array(
                [
                    [point.x, point.y] 
                    for point in gdf.geometry.centroid
                ]
            )
            
            # Apply clustering algorithm
            if algorithm == "dbscan":
                # Default parameters
                eps = params.get("eps", 0.01)
                min_samples = params.get("min_samples", 5)
                
                # Create DBSCAN model
                model = DBSCAN(eps=eps, min_samples=min_samples)
                
                # Fit model
                labels = model.fit_predict(coords)
                
                # Add cluster labels to original data
                gdf["cluster"] = labels
                
                # Count clusters (excluding noise points with label -1)
                n_clusters = len(set(labels)) - (1 if -1 in labels else 0)
                
                # Count noise points
                n_noise = list(labels).count(-1)
                
                # Add algorithm-specific results
                algorithm_results = {
                    "eps": eps,
                    "min_samples": min_samples,
                    "n_clusters": n_clusters,
                    "n_noise": n_noise
                }
                
            elif algorithm == "kmeans":
                # Default parameters
                n_clusters = params.get("n_clusters", 5)
                
                # Create KMeans model
                model = KMeans(n_clusters=n_clusters, random_state=42)
                
                # Fit model
                labels = model.fit_predict(coords)
                
                # Add cluster labels to original data
                gdf["cluster"] = labels
                
                # Add algorithm-specific results
                algorithm_results = {
                    "n_clusters": n_clusters,
                    "inertia": float(model.inertia_)
                }
                
            else:
                return {"status": "error", "error": f"Unsupported clustering algorithm: {algorithm}"}
            
            # Calculate cluster statistics
            cluster_stats = []
            for cluster_id in sorted(set(labels)):
                cluster_gdf = gdf[gdf["cluster"] == cluster_id]
                
                # Calculate centroid of points in cluster
                if len(cluster_gdf) > 0:
                    center = shapely.unary_union(cluster_gdf.geometry.to_list()).centroid
                    
                    # Create convex hull of cluster points
                    if len(cluster_gdf) > 2:
                        hull = shapely.unary_union(cluster_gdf.geometry.to_list()).convex_hull
                    else:
                        hull = None
                    
                    cluster_stats.append({
                        "cluster_id": int(cluster_id),
                        "point_count": len(cluster_gdf),
                        "center": [float(center.x), float(center.y)],
                        "hull": mapping(hull) if hull else None
                    })
            
            # Convert result to GeoJSON with cluster labels
            result_geojson = json.loads(gdf.to_json())
            
            # Return result
            return {
                "status": "success",
                "operation": "cluster_analysis",
                "algorithm": algorithm,
                "params": params,
                "algorithm_results": algorithm_results,
                "cluster_stats": cluster_stats,
                "results": result_geojson
            }
            
        except ImportError:
            return {"status": "error", "error": "Scikit-learn library not available for clustering"}
            
        except Exception as e:
            logger.error(f"Error in cluster analysis: {str(e)}")
            return {"status": "error", "error": str(e)}
    
    def _ai_spatial_analysis(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Perform AI-powered spatial analysis using OpenAI.
        
        Args:
            task_data: Dictionary containing:
                - query: Natural language query describing the analysis
                - layer: Layer features (GeoJSON or layer name)
                - additional_context: Additional context for the analysis
        
        Returns:
            Dictionary with AI analysis results
        """
        if not HAS_OPENAI or not openai.api_key:
            return {"status": "error", "error": "OpenAI integration not available or API key not set"}
        
        # Extract parameters
        query = task_data.get("query")
        layer = task_data.get("layer")
        additional_context = task_data.get("additional_context", "")
        
        # Validate parameters
        if not query or not layer:
            return {"status": "error", "error": "Missing required parameters: query, layer"}
        
        try:
            # Load layer as GeoDataFrame
            gdf = self._load_layer(layer)
            
            # Prepare GeoJSON summary (first 5 features for context)
            sample_features = json.loads(gdf.head().to_json())
            
            # Prepare prompt for OpenAI
            prompt = f"""
            You are an AI spatial analysis assistant. I need you to analyze some geospatial data and provide insights.
            
            Query: {query}
            
            Here is a sample of the geospatial data (first 5 features):
            {json.dumps(sample_features, indent=2)}
            
            Additional context: {additional_context}
            
            Please provide a thorough analysis based on the data and query. Your response should be formatted as valid JSON with the following structure:
            {{
                "analysis": "Your detailed analysis of the spatial data",
                "insights": ["List of key insights from the data"],
                "recommendations": ["List of recommendations based on the analysis"],
                "suggested_visualizations": ["List of suggested visualizations that would be useful"]
            }}
            
            Respond only with valid JSON. Do not add any explanatory text outside the JSON structure.
            """
            
            # Send request to OpenAI
            response = openai.ChatCompletion.create(
                model="gpt-4o",  # the newest OpenAI model is "gpt-4o" which was released May 13, 2024
                messages=[
                    {"role": "system", "content": "You are a geospatial analysis expert."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.2
            )
            
            # Parse response
            ai_analysis = json.loads(response.choices[0].message.content)
            
            # Return result
            return {
                "status": "success",
                "operation": "ai_spatial_analysis",
                "query": query,
                "ai_analysis": ai_analysis
            }
            
        except Exception as e:
            logger.error(f"Error in AI spatial analysis: {str(e)}")
            return {"status": "error", "error": str(e)}
    
    def _load_layer(self, layer_data) -> "gpd.GeoDataFrame":
        """
        Load a layer from various formats into a GeoDataFrame.
        
        Args:
            layer_data: Layer data, which can be:
                - GeoJSON dictionary
                - Layer name (string) to load from database
                - Path to file
        
        Returns:
            GeoDataFrame containing the layer data
        """
        if not HAS_GEOSPATIAL:
            raise ImportError("GeoPandas not available")
        
        # Check if layer_data is already a GeoDataFrame
        if isinstance(layer_data, gpd.GeoDataFrame):
            return layer_data
        
        # Check if layer_data is a GeoJSON dictionary
        elif isinstance(layer_data, dict) and "type" in layer_data:
            if layer_data["type"] == "FeatureCollection":
                return gpd.GeoDataFrame.from_features(layer_data["features"])
            else:
                raise ValueError("Invalid GeoJSON format")
        
        # Check if layer_data is a layer name to load from database
        elif isinstance(layer_data, str):
            if os.path.exists(layer_data):
                # Try to load from file
                return gpd.read_file(layer_data)
            else:
                # Try to load from database
                if self.conn is None:
                    self._init_db_connection()
                    
                if self.conn is None:
                    raise ValueError("Database connection not available")
                
                # Read from PostGIS table
                query = f"SELECT * FROM \"{layer_data}\""
                return gpd.read_postgis(query, self.conn, geom_col="geometry")
        
        # Invalid layer_data format
        else:
            raise ValueError("Invalid layer data format")