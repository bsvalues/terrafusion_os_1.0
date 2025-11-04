"""
Geospatial Anomaly Visualization

This module provides routes and handlers for visualizing data anomalies
on a geographic map, offering real-time insights into spatial patterns
of data quality issues in property assessment data.
"""

import os
import logging
import json
import datetime
from typing import Dict, List, Any, Optional

# These imports are already available in the Flask app context
# No need to install them separately
from flask import Blueprint, render_template, jsonify, request
from sqlalchemy import text

# Initialize logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

# Import required modules
try:
    # Import security monitoring
    from security.security_monitoring import security_monitoring_manager
    from security.audit_logging import audit_logger
    
    # Import data stability framework
    try:
        import data_stability_framework
        logger.info("Successfully imported data_stability_framework")
    except ImportError as e:
        logger.warning(f"Could not import data_stability_framework: {str(e)}")
        # Create a simple placeholder if the framework is not available
        class DummyFramework:
            def __init__(self):
                self.name = "DummyFramework"
            
            def detect_anomalies(self, *args, **kwargs):
                return []
                
        data_stability_framework = DummyFramework()
        logger.warning("Created dummy data stability framework")
    
    logger.info("Successfully initialized required modules")
except ImportError as e:
    logger.error(f"Failed to import required modules: {str(e)}")

logger.info("anomaly_map module initialized")

# Create blueprint
anomaly_map_bp = Blueprint('anomaly_map', __name__, template_folder='templates')

@anomaly_map_bp.route('/visualizations/anomaly-map')
def anomaly_map_view():
    """
    Render the anomaly map visualization page.
    
    This page displays a map of Benton County with property parcels,
    highlighting anomalies detected by the data stability framework.
    """
    return render_template('visualizations/anomaly_map.html')

@anomaly_map_bp.route('/api/anomalies/geospatial')
def anomalies_geospatial_api():
    """
    API endpoint for retrieving geospatial anomaly data.
    
    Returns:
        JSON with anomaly data including geospatial information
    """
    try:
        # Get query parameters
        severity = request.args.get('severity', 'all')
        anomaly_type = request.args.get('type', 'all')
        days = int(request.args.get('days', 7))
        table = request.args.get('table', 'parcels')
        limit = int(request.args.get('limit', 1000))
        
        # Get anomalies with geospatial data
        anomalies = get_geospatial_anomalies(
            severity=severity,
            anomaly_type=anomaly_type,
            days=days,
            table=table,
            limit=limit
        )
        
        return jsonify({
            'status': 'success',
            'count': len(anomalies),
            'anomalies': anomalies
        })
    
    except Exception as e:
        logger.error(f"Error getting geospatial anomalies: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f"Error getting anomalies: {str(e)}"
        }), 500

@anomaly_map_bp.route('/api/anomalies/stats')
def anomalies_stats_api():
    """
    API endpoint for retrieving anomaly statistics.
    
    Returns:
        JSON with anomaly statistics by type and severity
    """
    try:
        # Get query parameters
        days = int(request.args.get('days', 7))
        
        # Get anomaly statistics
        stats = get_anomaly_stats(days=days)
        
        return jsonify({
            'status': 'success',
            'stats': stats
        })
    
    except Exception as e:
        logger.error(f"Error getting anomaly statistics: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f"Error getting statistics: {str(e)}"
        }), 500

@anomaly_map_bp.route('/api/anomalies/real-time')
def anomalies_real_time_api():
    """
    API endpoint for retrieving real-time anomaly updates.
    
    Returns:
        JSON with recent anomalies for real-time updates
    """
    try:
        # Get query parameters
        since = request.args.get('since')
        limit = int(request.args.get('limit', 50))
        
        # Parse timestamp if provided
        since_time = None
        if since:
            try:
                since_time = datetime.datetime.fromisoformat(since)
            except ValueError:
                since_time = datetime.datetime.now() - datetime.timedelta(minutes=5)
        else:
            since_time = datetime.datetime.now() - datetime.timedelta(minutes=5)
        
        # Get recent anomalies
        anomalies = get_real_time_anomalies(since=since_time, limit=limit)
        
        return jsonify({
            'status': 'success',
            'count': len(anomalies),
            'anomalies': anomalies,
            'timestamp': datetime.datetime.now().isoformat()
        })
    
    except Exception as e:
        logger.error(f"Error getting real-time anomalies: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f"Error getting anomalies: {str(e)}"
        }), 500

def get_geospatial_anomalies(severity='all', anomaly_type='all', days=7, table='parcels', limit=1000):
    """
    Get anomalies with geospatial data.
    
    Args:
        severity: Anomaly severity filter ('all', 'low', 'medium', 'high', 'critical')
        anomaly_type: Anomaly type filter ('all', 'outlier', 'pattern', 'rule', etc.)
        days: Number of days to look back
        table: Database table to query
        limit: Maximum number of anomalies to return
        
    Returns:
        List of anomalies with geospatial data
    """
    from app import db
    
    # Calculate date threshold
    date_threshold = datetime.datetime.now() - datetime.timedelta(days=days)
    
    # Build query filters
    filters = []
    params = {}
    
    # Base filters
    filters.append("a.detected_at >= :date_threshold")
    params["date_threshold"] = date_threshold
    
    # Table filter
    if table != 'all':
        filters.append("a.table_name = :table_name")
        params["table_name"] = table
    
    # Severity filter
    if severity != 'all':
        # Handle multiple severity levels
        if ',' in severity:
            severities = [s.strip() for s in severity.split(',')]
            severity_placeholders = [f":severity_{i}" for i in range(len(severities))]
            filters.append(f"a.severity IN ({', '.join(severity_placeholders)})")
            for i, sev in enumerate(severities):
                params[f"severity_{i}"] = sev
        else:
            filters.append("a.severity = :severity")
            params["severity"] = severity
    
    # Type filter
    if anomaly_type != 'all':
        # Handle multiple types
        if ',' in anomaly_type:
            types = [t.strip() for t in anomaly_type.split(',')]
            type_placeholders = [f":type_{i}" for i in range(len(types))]
            filters.append(f"a.anomaly_type IN ({', '.join(type_placeholders)})")
            for i, atype in enumerate(types):
                params[f"type_{i}"] = atype
        else:
            filters.append("a.anomaly_type = :anomaly_type")
            params["anomaly_type"] = anomaly_type
    
    # Combine filters
    where_clause = " AND ".join(filters)
    
    # Build query
    query = f"""
        SELECT 
            a.id, a.table_name, a.field_name, a.record_id, a.anomaly_type,
            a.anomaly_details, a.anomaly_score, a.severity, a.status,
            a.detected_at, p.parcel_id, p.geometry, p.address, p.property_type,
            p.total_value
        FROM 
            data_anomaly a
        JOIN 
            parcels p ON a.record_id = p.id
        WHERE 
            {where_clause}
        ORDER BY 
            a.detected_at DESC
        LIMIT :limit
    """
    
    params["limit"] = limit
    
    try:
        # Execute query
        result = db.session.execute(text(query), params)
        rows = result.fetchall()
        
        # Process results
        anomalies = []
        for row in rows:
            # Convert to dictionary
            anomaly = dict(zip(result.keys(), row))
            
            # Convert datetime to string
            if anomaly.get('detected_at'):
                anomaly['detected_at'] = anomaly['detected_at'].isoformat()
            
            # Parse anomaly details
            if anomaly.get('anomaly_details'):
                try:
                    anomaly['anomaly_details'] = json.loads(anomaly['anomaly_details'])
                except (json.JSONDecodeError, TypeError):
                    pass
            
            # Convert geometry to GeoJSON if it's in WKB format
            if anomaly.get('geometry'):
                try:
                    # Using PostGIS ST_AsGeoJSON to get GeoJSON
                    geojson_query = """
                        SELECT ST_AsGeoJSON(geometry) AS geojson
                        FROM parcels
                        WHERE id = :record_id
                    """
                    
                    geojson_result = db.session.execute(
                        text(geojson_query),
                        {"record_id": anomaly.get('record_id')}
                    )
                    geojson_row = geojson_result.fetchone()
                    
                    if geojson_row and geojson_row[0]:
                        anomaly['geometry'] = json.loads(geojson_row[0])
                    else:
                        # If ST_AsGeoJSON fails, set a placeholder
                        anomaly['geometry'] = None
                except Exception as e:
                    logger.error(f"Error converting geometry to GeoJSON: {str(e)}")
                    anomaly['geometry'] = None
            
            anomalies.append(anomaly)
        
        return anomalies
    
    except Exception as e:
        logger.error(f"Error querying geospatial anomalies: {str(e)}")
        raise

def get_anomaly_stats(days=7):
    """
    Get anomaly statistics.
    
    Args:
        days: Number of days to look back
        
    Returns:
        Dictionary with anomaly statistics
    """
    from app import db
    
    # Calculate date threshold
    date_threshold = datetime.datetime.now() - datetime.timedelta(days=days)
    
    # Query for anomaly counts by severity
    severity_query = """
        SELECT 
            severity, COUNT(*) as count
        FROM 
            data_anomaly
        WHERE 
            detected_at >= :date_threshold
        GROUP BY 
            severity
    """
    
    # Query for anomaly counts by type
    type_query = """
        SELECT 
            anomaly_type, COUNT(*) as count
        FROM 
            data_anomaly
        WHERE 
            detected_at >= :date_threshold
        GROUP BY 
            anomaly_type
    """
    
    # Query for anomaly counts by table
    table_query = """
        SELECT 
            table_name, COUNT(*) as count
        FROM 
            data_anomaly
        WHERE 
            detected_at >= :date_threshold
        GROUP BY 
            table_name
    """
    
    # Query for daily anomaly counts
    daily_query = """
        SELECT 
            DATE(detected_at) as date, COUNT(*) as count
        FROM 
            data_anomaly
        WHERE 
            detected_at >= :date_threshold
        GROUP BY 
            DATE(detected_at)
        ORDER BY
            date ASC
    """
    
    try:
        # Execute queries
        severity_result = db.session.execute(
            text(severity_query),
            {"date_threshold": date_threshold}
        )
        severity_rows = severity_result.fetchall()
        
        type_result = db.session.execute(
            text(type_query),
            {"date_threshold": date_threshold}
        )
        type_rows = type_result.fetchall()
        
        table_result = db.session.execute(
            text(table_query),
            {"date_threshold": date_threshold}
        )
        table_rows = table_result.fetchall()
        
        daily_result = db.session.execute(
            text(daily_query),
            {"date_threshold": date_threshold}
        )
        daily_rows = daily_result.fetchall()
        
        # Process results
        severity_stats = {row[0]: row[1] for row in severity_rows}
        type_stats = {row[0]: row[1] for row in type_rows}
        table_stats = {row[0]: row[1] for row in table_rows}
        daily_stats = [{"date": row[0].isoformat(), "count": row[1]} for row in daily_rows]
        
        # Total count
        total_count = sum(severity_stats.values())
        
        return {
            "total_count": total_count,
            "by_severity": severity_stats,
            "by_type": type_stats,
            "by_table": table_stats,
            "daily": daily_stats
        }
    
    except Exception as e:
        logger.error(f"Error querying anomaly statistics: {str(e)}")
        raise

def get_real_time_anomalies(since=None, limit=50):
    """
    Get real-time anomaly updates.
    
    Args:
        since: Datetime threshold for recent anomalies
        limit: Maximum number of anomalies to return
        
    Returns:
        List of recent anomalies
    """
    from app import db
    
    # Use provided threshold or default to 5 minutes ago
    if since is None:
        since = datetime.datetime.now() - datetime.timedelta(minutes=5)
    
    # Query for recent anomalies
    query = """
        SELECT 
            a.id, a.table_name, a.field_name, a.record_id, a.anomaly_type,
            a.anomaly_details, a.anomaly_score, a.severity, a.status,
            a.detected_at, p.parcel_id, p.geometry, p.address, p.property_type,
            p.total_value
        FROM 
            data_anomaly a
        LEFT JOIN 
            parcels p ON a.record_id = p.id AND a.table_name = 'parcels'
        WHERE 
            a.detected_at >= :since
        ORDER BY 
            a.detected_at DESC
        LIMIT :limit
    """
    
    try:
        # Execute query
        result = db.session.execute(
            text(query),
            {"since": since, "limit": limit}
        )
        rows = result.fetchall()
        
        # Process results
        anomalies = []
        for row in rows:
            # Convert to dictionary
            anomaly = dict(zip(result.keys(), row))
            
            # Convert datetime to string
            if anomaly.get('detected_at'):
                anomaly['detected_at'] = anomaly['detected_at'].isoformat()
            
            # Parse anomaly details
            if anomaly.get('anomaly_details'):
                try:
                    anomaly['anomaly_details'] = json.loads(anomaly['anomaly_details'])
                except (json.JSONDecodeError, TypeError):
                    pass
            
            # Convert geometry to GeoJSON if available
            if anomaly.get('geometry'):
                try:
                    # Using PostGIS ST_AsGeoJSON to get GeoJSON
                    geojson_query = """
                        SELECT ST_AsGeoJSON(geometry) AS geojson
                        FROM parcels
                        WHERE id = :record_id
                    """
                    
                    geojson_result = db.session.execute(
                        text(geojson_query),
                        {"record_id": anomaly.get('record_id')}
                    )
                    geojson_row = geojson_result.fetchone()
                    
                    if geojson_row and geojson_row[0]:
                        anomaly['geometry'] = json.loads(geojson_row[0])
                    else:
                        anomaly['geometry'] = None
                except Exception as e:
                    logger.error(f"Error converting geometry to GeoJSON: {str(e)}")
                    anomaly['geometry'] = None
            
            anomalies.append(anomaly)
        
        return anomalies
    
    except Exception as e:
        logger.error(f"Error querying real-time anomalies: {str(e)}")
        raise