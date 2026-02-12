"""
Spatial Microservice for GeoAssessmentPro

This module provides RESTful API endpoints for geospatial data processing, 
including vector tile serving, spatial queries, and geospatial operations.
"""

import os
import json
import logging
import time
from datetime import datetime
from typing import Dict, Any, List, Optional, Union
from functools import lru_cache

from flask import Blueprint, request, jsonify, current_app, send_file
from flask import Response, stream_with_context
import geopandas as gpd
import pandas as pd
import shapely
from shapely.geometry import shape, Point, Polygon, LineString, mapping
import psycopg2
from psycopg2 import sql
from psycopg2.extras import RealDictCursor

from ai_agents.mcp_core import get_mcp, TaskPriority

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Blueprint
spatial_bp = Blueprint("geo_spatial", __name__, url_prefix="/api/v1/spatial")

# Database connection pool
db_pool = None

def get_db_connection():
    """
    Get a connection from the database pool.
    
    Returns:
        Database connection
    """
    global db_pool
    
    # Initialize pool if not already created
    if db_pool is None:
        import psycopg2.pool
        
        # Get connection parameters from environment variables
        db_params = {
            "dbname": os.environ.get("PGDATABASE"),
            "user": os.environ.get("PGUSER"),
            "password": os.environ.get("PGPASSWORD"),
            "host": os.environ.get("PGHOST"),
            "port": os.environ.get("PGPORT")
        }
        
        # Create connection pool
        db_pool = psycopg2.pool.SimpleConnectionPool(1, 20, **db_params)
        logger.info("Database connection pool initialized")
    
    # Get connection from pool
    conn = db_pool.getconn()
    
    return conn

def release_db_connection(conn):
    """
    Release a connection back to the pool.
    
    Args:
        conn: Database connection to release
    """
    global db_pool
    if db_pool is not None:
        db_pool.putconn(conn)

@spatial_bp.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "spatial_microservice"
    })

@spatial_bp.route("/layers", methods=["GET"])
def get_layers():
    """
    Get available spatial layers.
    
    Returns:
        JSON list of available layers
    """
    try:
        conn = get_db_connection()
        
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            # Query to get all public spatial tables with geometry columns
            cursor.execute("""
                SELECT
                    f_table_schema as schema,
                    f_table_name as table_name,
                    f_geometry_column as geometry_column,
                    srid,
                    type as geometry_type
                FROM
                    geometry_columns
                WHERE
                    f_table_schema = 'public'
                ORDER BY
                    f_table_name
            """)
            
            layers = cursor.fetchall()
            
            # Add feature count for each layer
            for layer in layers:
                try:
                    count_query = sql.SQL("SELECT COUNT(*) FROM {}.{}").format(
                        sql.Identifier(layer["schema"]),
                        sql.Identifier(layer["table_name"])
                    )
                    cursor.execute(count_query)
                    layer["feature_count"] = cursor.fetchone()["count"]
                except Exception as e:
                    layer["feature_count"] = -1
                    logger.warning(f"Error getting feature count for {layer['table_name']}: {str(e)}")
        
        release_db_connection(conn)
        
        return jsonify({
            "layers": layers,
            "count": len(layers)
        })
        
    except Exception as e:
        logger.error(f"Error fetching layers: {str(e)}")
        
        if 'conn' in locals():
            release_db_connection(conn)
        
        return jsonify({
            "error": "Error fetching layers",
            "message": str(e)
        }), 500

@spatial_bp.route("/layer/<layer_name>/info", methods=["GET"])
def get_layer_info(layer_name):
    """
    Get detailed information about a specific layer.
    
    Args:
        layer_name: Name of the layer
        
    Returns:
        JSON with layer details
    """
    try:
        conn = get_db_connection()
        
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            # Get geometry column information
            cursor.execute("""
                SELECT
                    f_table_schema as schema,
                    f_table_name as table_name,
                    f_geometry_column as geometry_column,
                    srid,
                    type as geometry_type
                FROM
                    geometry_columns
                WHERE
                    f_table_schema = 'public' AND
                    f_table_name = %s
            """, (layer_name,))
            
            geometry_info = cursor.fetchone()
            
            if not geometry_info:
                release_db_connection(conn)
                return jsonify({
                    "error": "Layer not found",
                    "message": f"Layer {layer_name} does not exist or is not a spatial layer"
                }), 404
            
            # Get column information
            cursor.execute("""
                SELECT
                    column_name,
                    data_type,
                    is_nullable
                FROM
                    information_schema.columns
                WHERE
                    table_schema = 'public' AND
                    table_name = %s
                ORDER BY
                    ordinal_position
            """, (layer_name,))
            
            columns = cursor.fetchall()
            
            # Get feature count
            count_query = sql.SQL("SELECT COUNT(*) FROM {}").format(
                sql.Identifier(layer_name)
            )
            cursor.execute(count_query)
            feature_count = cursor.fetchone()["count"]
            
            # Get bounding box
            bbox_query = sql.SQL("""
                SELECT
                    ST_XMin(ST_Extent({geom})) as min_x,
                    ST_YMin(ST_Extent({geom})) as min_y,
                    ST_XMax(ST_Extent({geom})) as max_x,
                    ST_YMax(ST_Extent({geom})) as max_y
                FROM
                    {}
            """).format(
                sql.Identifier(layer_name),
                geom=sql.Identifier(geometry_info["geometry_column"])
            )
            cursor.execute(bbox_query)
            bbox = cursor.fetchone()
        
        release_db_connection(conn)
        
        return jsonify({
            "layer": layer_name,
            "geometry": geometry_info,
            "columns": columns,
            "feature_count": feature_count,
            "bbox": bbox
        })
        
    except Exception as e:
        logger.error(f"Error fetching layer info: {str(e)}")
        
        if 'conn' in locals():
            release_db_connection(conn)
        
        return jsonify({
            "error": "Error fetching layer info",
            "message": str(e)
        }), 500

@spatial_bp.route("/layer/<layer_name>/features", methods=["GET"])
def get_layer_features(layer_name):
    """
    Get features from a layer with filtering and pagination.
    
    Args:
        layer_name: Name of the layer
        
    Query parameters:
        bbox: Bounding box filter (minx,miny,maxx,maxy)
        limit: Maximum number of features to return
        offset: Offset for pagination
        fields: Comma-separated list of fields to include
        where: SQL WHERE clause for filtering
        
    Returns:
        GeoJSON FeatureCollection
    """
    try:
        # Get query parameters
        bbox = request.args.get("bbox")
        limit = request.args.get("limit", default=1000, type=int)
        offset = request.args.get("offset", default=0, type=int)
        fields = request.args.get("fields")
        where_clause = request.args.get("where")
        
        conn = get_db_connection()
        
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            # Get geometry column information
            cursor.execute("""
                SELECT
                    f_geometry_column as geometry_column,
                    srid
                FROM
                    geometry_columns
                WHERE
                    f_table_schema = 'public' AND
                    f_table_name = %s
            """, (layer_name,))
            
            geometry_info = cursor.fetchone()
            
            if not geometry_info:
                release_db_connection(conn)
                return jsonify({
                    "error": "Layer not found",
                    "message": f"Layer {layer_name} does not exist or is not a spatial layer"
                }), 404
            
            # Determine fields to include
            if fields:
                field_list = [field.strip() for field in fields.split(",")]
                field_list.append(geometry_info["geometry_column"])  # Always include geometry
                field_sql = sql.SQL(", ").join(map(sql.Identifier, field_list))
            else:
                field_sql = sql.SQL("*")
            
            # Build query
            query = sql.SQL("SELECT {fields} FROM {table}").format(
                fields=field_sql,
                table=sql.Identifier(layer_name)
            )
            
            query_params = []
            where_clauses = []
            
            # Add bounding box filter if provided
            if bbox:
                try:
                    minx, miny, maxx, maxy = map(float, bbox.split(","))
                    bbox_clause = sql.SQL("ST_Intersects({geom}, ST_MakeEnvelope(%s, %s, %s, %s, %s))").format(
                        geom=sql.Identifier(geometry_info["geometry_column"])
                    )
                    where_clauses.append(bbox_clause)
                    query_params.extend([minx, miny, maxx, maxy, geometry_info["srid"]])
                except ValueError:
                    release_db_connection(conn)
                    return jsonify({
                        "error": "Invalid bbox parameter",
                        "message": "bbox should be in format: minx,miny,maxx,maxy"
                    }), 400
            
            # Add custom WHERE clause if provided
            if where_clause:
                where_clauses.append(sql.SQL(where_clause))
            
            # Combine WHERE clauses
            if where_clauses:
                query = sql.SQL("{} WHERE {}").format(
                    query,
                    sql.SQL(" AND ").join(where_clauses)
                )
            
            # Add limit and offset
            query = sql.SQL("{} LIMIT %s OFFSET %s").format(
                query
            )
            query_params.extend([limit, offset])
            
            # Execute query
            cursor.execute(query, query_params)
            features = cursor.fetchall()
            
            # Get total count (without limit/offset)
            count_query = sql.SQL("SELECT COUNT(*) FROM {table}").format(
                table=sql.Identifier(layer_name)
            )
            
            if where_clauses:
                count_query = sql.SQL("{} WHERE {}").format(
                    count_query,
                    sql.SQL(" AND ").join(where_clauses)
                )
            
            cursor.execute(count_query, query_params[:-2] if query_params else None)
            total_count = cursor.fetchone()["count"]
            
            # Convert to GeoJSON
            geojson_features = []
            for feature in features:
                geom_data = feature[geometry_info["geometry_column"]]
                
                # Skip features with null geometry
                if geom_data is None:
                    continue
                
                # Create GeoJSON feature
                geojson_feature = {
                    "type": "Feature",
                    "geometry": json.loads(geom_data),
                    "properties": {k: v for k, v in feature.items() if k != geometry_info["geometry_column"]}
                }
                
                geojson_features.append(geojson_feature)
        
        release_db_connection(conn)
        
        return jsonify({
            "type": "FeatureCollection",
            "features": geojson_features,
            "totalFeatures": total_count,
            "numberReturned": len(geojson_features),
            "layer": layer_name
        })
        
    except Exception as e:
        logger.error(f"Error fetching features: {str(e)}")
        
        if 'conn' in locals():
            release_db_connection(conn)
        
        return jsonify({
            "error": "Error fetching features",
            "message": str(e)
        }), 500

@spatial_bp.route("/tiles/<layer_name>/<int:z>/<int:x>/<int:y>.mvt", methods=["GET"])
@lru_cache(maxsize=512)
def get_vector_tile(layer_name, z, x, y):
    """
    Get a Mapbox Vector Tile for a specific layer and tile coordinates.
    
    Args:
        layer_name: Name of the layer
        z: Zoom level
        x: Tile x coordinate
        y: Tile y coordinate
        
    Returns:
        Mapbox Vector Tile (MVT)
    """
    try:
        conn = get_db_connection()
        
        with conn.cursor() as cursor:
            # Get geometry column information
            cursor.execute("""
                SELECT
                    f_geometry_column as geometry_column,
                    srid
                FROM
                    geometry_columns
                WHERE
                    f_table_schema = 'public' AND
                    f_table_name = %s
            """, (layer_name,))
            
            geometry_info = cursor.fetchone()
            
            if not geometry_info:
                release_db_connection(conn)
                return jsonify({
                    "error": "Layer not found",
                    "message": f"Layer {layer_name} does not exist or is not a spatial layer"
                }), 404
            
            # Calculate tile bounds
            # Convert tile coordinates to mercator bounds (XYZ to EPSG:3857)
            tile_size = 256
            merc_max = 20037508.34
            res = (2 * merc_max) / (tile_size * 2**z)
            
            # Calculate pixel bounds
            min_x = -merc_max + (x * tile_size * res)
            min_y = merc_max - ((y + 1) * tile_size * res)
            max_x = -merc_max + ((x + 1) * tile_size * res)
            max_y = merc_max - (y * tile_size * res)
            
            # Generate MVT
            mvt_query = """
                WITH
                bounds AS (
                    SELECT ST_TileEnvelope(%s, %s, %s) AS geom
                ),
                mvtgeom AS (
                    SELECT
                        ST_AsMVTGeom(
                            ST_Transform(t.{geom}, 3857),
                            bounds.geom
                        ) AS geom,
                        *
                    FROM
                        {table} t,
                        bounds
                    WHERE
                        ST_Intersects(
                            ST_Transform(t.{geom}, 3857),
                            bounds.geom
                        )
                    LIMIT 10000
                )
                SELECT ST_AsMVT(mvtgeom.*, %s)
            """
            
            # Format the query with proper parameter handling
            formatted_query = sql.SQL(mvt_query).format(
                geom=sql.Identifier(geometry_info["geometry_column"]),
                table=sql.Identifier(layer_name)
            )
            
            # Execute query
            cursor.execute(formatted_query, (z, x, y, layer_name))
            mvt_data = cursor.fetchone()[0]
        
        release_db_connection(conn)
        
        # Return the MVT
        response = Response(mvt_data, mimetype="application/vnd.mapbox-vector-tile")
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Cache-Control"] = "public, max-age=86400"
        
        return response
        
    except Exception as e:
        logger.error(f"Error generating vector tile: {str(e)}")
        
        if 'conn' in locals():
            release_db_connection(conn)
        
        return jsonify({
            "error": "Error generating vector tile",
            "message": str(e)
        }), 500

@spatial_bp.route("/analyze", methods=["POST"])
def analyze_spatial_data():
    """
    Analyze spatial data using the GeospatialAnalysisAgent.
    
    Request body should contain:
    {
        "operation": "spatial_join|spatial_overlay|validate_topology|...",
        "parameters": {
            // Operation-specific parameters
        },
        "priority": "low|normal|high|critical",
        "wait": true|false
    }
    
    Returns:
        Analysis results or task ID
    """
    try:
        # Parse request JSON
        request_data = request.get_json()
        
        if not request_data:
            return jsonify({
                "error": "Invalid request",
                "message": "Request body must be valid JSON"
            }), 400
        
        # Extract parameters
        operation = request_data.get("operation")
        parameters = request_data.get("parameters", {})
        priority_str = request_data.get("priority", "normal")
        wait = request_data.get("wait", False)
        
        if not operation:
            return jsonify({
                "error": "Missing parameter",
                "message": "Operation must be specified"
            }), 400
        
        # Convert priority string to TaskPriority enum
        priority_map = {
            "low": TaskPriority.LOW,
            "normal": TaskPriority.NORMAL,
            "high": TaskPriority.HIGH,
            "critical": TaskPriority.CRITICAL
        }
        priority = priority_map.get(priority_str.lower(), TaskPriority.NORMAL)
        
        # Create task data
        task_data = {
            "operation": operation,
            **parameters
        }
        
        # Get MCP and dispatch task
        mcp = get_mcp()
        
        # Set timeout for waiting tasks
        timeout = 60 if wait else None
        
        # Dispatch task to GeospatialAnalysisAgent
        result = mcp.dispatch_task(
            agent_type="GeospatialAnalysisAgent",
            task_data=task_data,
            priority=priority,
            wait=wait,
            timeout=timeout
        )
        
        # Return result or task ID
        if wait:
            return jsonify({
                "status": "success",
                "operation": operation,
                "result": result
            })
        else:
            return jsonify({
                "status": "pending",
                "operation": operation,
                "task_id": result,
                "message": "Task dispatched successfully"
            })
        
    except Exception as e:
        logger.error(f"Error analyzing spatial data: {str(e)}")
        
        return jsonify({
            "error": "Error analyzing spatial data",
            "message": str(e)
        }), 500

@spatial_bp.route("/task/<task_id>", methods=["GET"])
def get_task_status(task_id):
    """
    Get status of a spatial analysis task.
    
    Args:
        task_id: ID of the task
        
    Returns:
        Task status and results if available
    """
    try:
        # Get MCP
        mcp = get_mcp()
        
        # Get task status
        status = mcp.get_task_status(task_id)
        
        # If task is completed, get the result
        if status["status"] == "completed":
            try:
                result = mcp.get_task_result(task_id)
                return jsonify({
                    "status": "completed",
                    "task_id": task_id,
                    "result": result
                })
            except Exception as e:
                return jsonify({
                    "status": "error",
                    "task_id": task_id,
                    "error": str(e)
                }), 500
        
        # Return task status
        return jsonify({
            "status": status["status"],
            "task_id": task_id,
            "created_at": status["created_at"],
            "updated_at": status["updated_at"]
        })
        
    except ValueError as e:
        return jsonify({
            "error": "Task not found",
            "message": str(e)
        }), 404
    except Exception as e:
        logger.error(f"Error getting task status: {str(e)}")
        
        return jsonify({
            "error": "Error getting task status",
            "message": str(e)
        }), 500

@spatial_bp.route("/agents", methods=["GET"])
def get_active_agents():
    """
    Get information about active spatial analysis agents.
    
    Returns:
        List of active agents
    """
    try:
        # Get MCP
        mcp = get_mcp()
        
        # Get active agents of type GeospatialAnalysisAgent
        agents = mcp.get_active_agents(agent_type="GeospatialAnalysisAgent")
        
        return jsonify({
            "agent_count": len(agents),
            "agents": agents
        })
        
    except Exception as e:
        logger.error(f"Error getting active agents: {str(e)}")
        
        return jsonify({
            "error": "Error getting active agents",
            "message": str(e)
        }), 500

@spatial_bp.route("/buffer", methods=["POST"])
def buffer_geometry():
    """
    Generate buffer around a geometry.
    
    Request body should contain:
    {
        "geometry": GeoJSON geometry,
        "distance": Buffer distance,
        "options": {
            "cap_style": "round|flat|square",
            "join_style": "round|mitre|bevel",
            "mitre_limit": number,
            "segments": number,
            "single_sided": boolean
        }
    }
    
    Returns:
        GeoJSON geometry of buffer
    """
    try:
        # Parse request JSON
        request_data = request.get_json()
        
        if not request_data:
            return jsonify({
                "error": "Invalid request",
                "message": "Request body must be valid JSON"
            }), 400
        
        # Extract parameters
        geometry = request_data.get("geometry")
        distance = request_data.get("distance")
        options = request_data.get("options", {})
        
        if not geometry:
            return jsonify({
                "error": "Missing parameter",
                "message": "Geometry must be specified"
            }), 400
        
        if distance is None:
            return jsonify({
                "error": "Missing parameter",
                "message": "Distance must be specified"
            }), 400
        
        # Parse geometry
        try:
            geom = shape(geometry)
        except Exception as e:
            return jsonify({
                "error": "Invalid geometry",
                "message": str(e)
            }), 400
        
        # Extract buffer options
        cap_style_map = {
            "round": 1,
            "flat": 2,
            "square": 3
        }
        join_style_map = {
            "round": 1,
            "mitre": 2,
            "bevel": 3
        }
        
        cap_style = cap_style_map.get(options.get("cap_style", "round"), 1)
        join_style = join_style_map.get(options.get("join_style", "round"), 1)
        mitre_limit = options.get("mitre_limit", 5.0)
        segments = options.get("segments", 16)
        single_sided = options.get("single_sided", False)
        
        # Generate buffer
        buffer_geom = geom.buffer(
            distance, 
            cap_style=cap_style, 
            join_style=join_style, 
            mitre_limit=mitre_limit, 
            resolution=segments, 
            single_sided=single_sided
        )
        
        # Convert to GeoJSON
        buffer_geojson = mapping(buffer_geom)
        
        return jsonify({
            "type": "Feature",
            "geometry": buffer_geojson,
            "properties": {
                "distance": distance,
                "original_type": geom.geom_type
            }
        })
        
    except Exception as e:
        logger.error(f"Error generating buffer: {str(e)}")
        
        return jsonify({
            "error": "Error generating buffer",
            "message": str(e)
        }), 500

@spatial_bp.route("/simplify", methods=["POST"])
def simplify_geometry():
    """
    Simplify a geometry.
    
    Request body should contain:
    {
        "geometry": GeoJSON geometry,
        "tolerance": Simplification tolerance,
        "preserve_topology": boolean
    }
    
    Returns:
        GeoJSON geometry of simplified geometry
    """
    try:
        # Parse request JSON
        request_data = request.get_json()
        
        if not request_data:
            return jsonify({
                "error": "Invalid request",
                "message": "Request body must be valid JSON"
            }), 400
        
        # Extract parameters
        geometry = request_data.get("geometry")
        tolerance = request_data.get("tolerance", 0.001)
        preserve_topology = request_data.get("preserve_topology", True)
        
        if not geometry:
            return jsonify({
                "error": "Missing parameter",
                "message": "Geometry must be specified"
            }), 400
        
        # Parse geometry
        try:
            geom = shape(geometry)
        except Exception as e:
            return jsonify({
                "error": "Invalid geometry",
                "message": str(e)
            }), 400
        
        # Simplify geometry
        simplified_geom = geom.simplify(tolerance, preserve_topology)
        
        # Get vertex counts
        original_vertices = len(geom.wkt.split(','))
        simplified_vertices = len(simplified_geom.wkt.split(','))
        
        # Convert to GeoJSON
        simplified_geojson = mapping(simplified_geom)
        
        return jsonify({
            "type": "Feature",
            "geometry": simplified_geojson,
            "properties": {
                "tolerance": tolerance,
                "preserve_topology": preserve_topology,
                "original_vertices": original_vertices,
                "simplified_vertices": simplified_vertices,
                "reduction_percent": round(100 * (original_vertices - simplified_vertices) / original_vertices, 2) if original_vertices > 0 else 0
            }
        })
        
    except Exception as e:
        logger.error(f"Error simplifying geometry: {str(e)}")
        
        return jsonify({
            "error": "Error simplifying geometry",
            "message": str(e)
        }), 500

def register_blueprint(app):
    """Register the blueprint with the Flask app"""
    app.register_blueprint(spatial_bp)
    
    # Register the GeospatialAnalysisAgent with the MCP
    from ai_agents.geospatial_analysis_agent import GeospatialAnalysisAgent
    
    mcp = get_mcp()
    mcp.register_agent_type("GeospatialAnalysisAgent", GeospatialAnalysisAgent)
    
    # Create an agent pool
    pool_size = int(os.environ.get("SPATIAL_AGENT_POOL_SIZE", "2"))
    try:
        mcp.create_agent_pool("GeospatialAnalysisAgent", pool_size, "spatial_analysis_pool")
        logger.info(f"Created GeospatialAnalysisAgent pool with {pool_size} agents")
    except Exception as e:
        logger.error(f"Error creating agent pool: {str(e)}")
    
    logger.info("Registered spatial microservice blueprint")