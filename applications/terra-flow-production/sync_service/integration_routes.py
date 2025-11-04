"""
Integration Hub Routes for GeoAssessmentPro

This module provides Flask routes for interacting with the Assessment Data
Integration Hub, allowing users to configure data sources, manage synchronization,
and access integrated assessment data.
"""

import os
import logging
import datetime
import json
from flask import Blueprint, request, jsonify, render_template, redirect, url_for, send_file
from flask import current_app
from werkzeug.utils import secure_filename
import pandas as pd

from sync_service.integration_hub import integration_hub, DataSourceConfig
from sync_service.auth_utils import login_required, admin_required

# Configure logging
logger = logging.getLogger(__name__)

# Create blueprint
integration_bp = Blueprint('integration', __name__, url_prefix='/integration')

@integration_bp.route('/')
@login_required
def index():
    """Integration Hub dashboard"""
    return render_template(
        'integration/dashboard.html',
        data_sources=integration_hub.data_sources,
        page_title="Assessment Data Integration Hub"
    )

@integration_bp.route('/sources')
@login_required
def list_sources():
    """List data sources"""
    return render_template(
        'integration/sources.html',
        data_sources=integration_hub.data_sources,
        page_title="Data Sources"
    )

@integration_bp.route('/sources/add', methods=['GET', 'POST'])
@admin_required
def add_source():
    """Add a new data source"""
    if request.method == 'POST':
        # Extract form data
        source_id = request.form.get('source_id')
        source_type = request.form.get('source_type')
        connection_string = request.form.get('connection_string')
        refresh_interval = int(request.form.get('refresh_interval', 60))
        enabled = request.form.get('enabled') == 'on'
        metadata = request.form.get('metadata', '{}')
        
        try:
            # Parse metadata JSON
            metadata_dict = json.loads(metadata)
            
            # Create config
            config = DataSourceConfig(
                source_id=source_id,
                source_type=source_type,
                connection_string=connection_string,
                refresh_interval=refresh_interval,
                enabled=enabled,
                metadata=metadata_dict
            )
            
            # Add to integration hub
            if integration_hub.add_data_source(config):
                return redirect(url_for('integration.list_sources'))
            else:
                return render_template(
                    'integration/add_source.html',
                    error="Failed to add data source",
                    page_title="Add Data Source"
                )
                
        except Exception as e:
            logger.error(f"Error adding data source: {str(e)}")
            return render_template(
                'integration/add_source.html',
                error=f"Error: {str(e)}",
                page_title="Add Data Source"
            )
    
    return render_template(
        'integration/add_source.html',
        page_title="Add Data Source"
    )

@integration_bp.route('/sources/<source_id>')
@login_required
def view_source(source_id):
    """View a data source"""
    if source_id not in integration_hub.data_sources:
        return redirect(url_for('integration.list_sources'))
    
    # Get metadata
    metadata = integration_hub.get_source_metadata(source_id)
    
    return render_template(
        'integration/view_source.html',
        source=integration_hub.data_sources[source_id],
        metadata=metadata,
        page_title=f"Data Source: {source_id}"
    )

@integration_bp.route('/sources/<source_id>/edit', methods=['GET', 'POST'])
@admin_required
def edit_source(source_id):
    """Edit a data source"""
    if source_id not in integration_hub.data_sources:
        return redirect(url_for('integration.list_sources'))
    
    if request.method == 'POST':
        # Extract form data
        source_type = request.form.get('source_type')
        connection_string = request.form.get('connection_string')
        refresh_interval = int(request.form.get('refresh_interval', 60))
        enabled = request.form.get('enabled') == 'on'
        metadata = request.form.get('metadata', '{}')
        
        try:
            # Parse metadata JSON
            metadata_dict = json.loads(metadata)
            
            # Create config
            config = DataSourceConfig(
                source_id=source_id,
                source_type=source_type,
                connection_string=connection_string,
                refresh_interval=refresh_interval,
                enabled=enabled,
                metadata=metadata_dict
            )
            
            # Update in integration hub
            if integration_hub.update_data_source(config):
                return redirect(url_for('integration.view_source', source_id=source_id))
            else:
                return render_template(
                    'integration/edit_source.html',
                    source=integration_hub.data_sources[source_id],
                    error="Failed to update data source",
                    page_title=f"Edit Data Source: {source_id}"
                )
                
        except Exception as e:
            logger.error(f"Error updating data source: {str(e)}")
            return render_template(
                'integration/edit_source.html',
                source=integration_hub.data_sources[source_id],
                error=f"Error: {str(e)}",
                page_title=f"Edit Data Source: {source_id}"
            )
    
    return render_template(
        'integration/edit_source.html',
        source=integration_hub.data_sources[source_id],
        page_title=f"Edit Data Source: {source_id}"
    )

@integration_bp.route('/sources/<source_id>/delete', methods=['POST'])
@admin_required
def delete_source(source_id):
    """Delete a data source"""
    if source_id not in integration_hub.data_sources:
        return jsonify({"status": "error", "message": "Data source not found"})
    
    if integration_hub.remove_data_source(source_id):
        return jsonify({"status": "success"})
    else:
        return jsonify({"status": "error", "message": "Failed to delete data source"})

@integration_bp.route('/sources/<source_id>/test', methods=['POST'])
@admin_required
def test_source(source_id):
    """Test connection to a data source"""
    if source_id not in integration_hub.data_sources:
        return jsonify({"status": "error", "message": "Data source not found"})
    
    connection = integration_hub.get_connection(source_id)
    if connection and connection.connected:
        return jsonify({
            "status": "success",
            "message": "Successfully connected to data source"
        })
    else:
        return jsonify({
            "status": "error",
            "message": f"Failed to connect: {connection.error if connection else 'Unknown error'}"
        })

@integration_bp.route('/sync/property', methods=['GET', 'POST'])
@admin_required
def sync_property():
    """Synchronize property data"""
    if request.method == 'POST':
        source_id = request.form.get('source_id')
        target_id = request.form.get('target_id') or None
        
        if source_id not in integration_hub.data_sources:
            return jsonify({"status": "error", "message": "Source not found"})
            
        if target_id and target_id not in integration_hub.data_sources:
            return jsonify({"status": "error", "message": "Target not found"})
            
        result = integration_hub.sync_property_data(source_id, target_id)
        
        return jsonify(result)
    
    return render_template(
        'integration/sync_property.html',
        data_sources=integration_hub.data_sources,
        page_title="Synchronize Property Data"
    )

@integration_bp.route('/sync/sales', methods=['GET', 'POST'])
@admin_required
def sync_sales():
    """Synchronize sales data"""
    if request.method == 'POST':
        source_id = request.form.get('source_id')
        target_id = request.form.get('target_id') or None
        
        if source_id not in integration_hub.data_sources:
            return jsonify({"status": "error", "message": "Source not found"})
            
        if target_id and target_id not in integration_hub.data_sources:
            return jsonify({"status": "error", "message": "Target not found"})
            
        result = integration_hub.sync_sales_data(source_id, target_id)
        
        return jsonify(result)
    
    return render_template(
        'integration/sync_sales.html',
        data_sources=integration_hub.data_sources,
        page_title="Synchronize Sales Data"
    )

@integration_bp.route('/sync/valuation', methods=['GET', 'POST'])
@admin_required
def sync_valuation():
    """Synchronize valuation data"""
    if request.method == 'POST':
        source_id = request.form.get('source_id')
        target_id = request.form.get('target_id') or None
        
        if source_id not in integration_hub.data_sources:
            return jsonify({"status": "error", "message": "Source not found"})
            
        if target_id and target_id not in integration_hub.data_sources:
            return jsonify({"status": "error", "message": "Target not found"})
            
        result = integration_hub.sync_valuation_data(source_id, target_id)
        
        return jsonify(result)
    
    return render_template(
        'integration/sync_valuation.html',
        data_sources=integration_hub.data_sources,
        page_title="Synchronize Valuation Data"
    )

@integration_bp.route('/exports')
@login_required
def exports():
    """List exports"""
    export_dir = os.path.join(current_app.root_path, "exports")
    
    if not os.path.exists(export_dir):
        os.makedirs(export_dir, exist_ok=True)
    
    exports = []
    
    # Look for exported files
    for root, dirs, files in os.walk(export_dir):
        for file in files:
            file_path = os.path.join(root, file)
            rel_path = os.path.relpath(file_path, current_app.root_path)
            
            # Get file stats
            stat = os.stat(file_path)
            
            # Determine data type from directory
            data_type = os.path.basename(os.path.dirname(file_path))
            
            # Get file extension
            _, ext = os.path.splitext(file)
            
            exports.append({
                "filename": file,
                "path": rel_path,
                "size": stat.st_size,
                "created": datetime.datetime.fromtimestamp(stat.st_ctime),
                "data_type": data_type,
                "format": ext[1:] if ext else ""
            })
    
    # Sort by creation time (newest first)
    exports.sort(key=lambda x: x["created"], reverse=True)
    
    return render_template(
        'integration/exports.html',
        exports=exports,
        page_title="Exports"
    )

@integration_bp.route('/export', methods=['GET', 'POST'])
@login_required
def export():
    """Export data"""
    if request.method == 'POST':
        data_type = request.form.get('data_type')
        export_format = request.form.get('export_format')
        
        # Collect filters
        filters = {}
        
        filter_fields = request.form.getlist('filter_field')
        filter_operators = request.form.getlist('filter_operator')
        filter_values = request.form.getlist('filter_value')
        
        for field, operator, value in zip(filter_fields, filter_operators, filter_values):
            if not field or not value:
                continue
                
            if operator == "equals":
                filters[field] = value
            elif operator == "in":
                # Split comma-separated values
                values = [v.strip() for v in value.split(",")]
                filters[field] = values
            elif operator == "min":
                if field not in filters:
                    filters[field] = {}
                filters[field]["min"] = value
            elif operator == "max":
                if field not in filters:
                    filters[field] = {}
                filters[field]["max"] = value
            elif operator == "like":
                if field not in filters:
                    filters[field] = {}
                filters[field]["like"] = value
            elif operator == "not":
                if field not in filters:
                    filters[field] = {}
                filters[field]["not"] = value
        
        # Execute export
        result = integration_hub.export_data(data_type, export_format, filters)
        
        if result["status"] == "success":
            return jsonify(result)
        else:
            return jsonify(result)
    
    return render_template(
        'integration/export.html',
        schemas=integration_hub.schemas,
        page_title="Export Data"
    )

@integration_bp.route('/exports/<path:export_path>')
@login_required
def download_export(export_path):
    """Download an exported file"""
    file_path = os.path.join(current_app.root_path, export_path)
    
    if not os.path.exists(file_path):
        return "File not found", 404
    
    return send_file(
        file_path,
        as_attachment=True,
        download_name=os.path.basename(file_path)
    )

@integration_bp.route('/query', methods=['GET', 'POST'])
@login_required
def query():
    """Execute a custom query"""
    if request.method == 'POST':
        source_id = request.form.get('source_id')
        query_text = request.form.get('query')
        
        if not source_id or not query_text:
            return jsonify({
                "status": "error",
                "message": "Source ID and query are required"
            })
            
        if source_id not in integration_hub.data_sources:
            return jsonify({
                "status": "error",
                "message": "Source not found"
            })
            
        try:
            # Execute query
            result = integration_hub.query_data_source(source_id, query_text)
            
            if result is None:
                return jsonify({
                    "status": "error",
                    "message": "Query failed"
                })
                
            # Convert to list of records
            records = result.to_dict(orient="records")
            
            # Limit the number of records returned
            max_records = 100
            truncated = len(records) > max_records
            
            if truncated:
                records = records[:max_records]
            
            return jsonify({
                "status": "success",
                "records": records,
                "total_records": len(result),
                "truncated": truncated,
                "columns": list(result.columns)
            })
                
        except Exception as e:
            logger.error(f"Error executing query: {str(e)}")
            return jsonify({
                "status": "error",
                "message": f"Error: {str(e)}"
            })
    
    return render_template(
        'integration/query.html',
        data_sources=integration_hub.data_sources,
        page_title="Custom Query"
    )

@integration_bp.route('/api/sources')
@login_required
def api_list_sources():
    """API: List data sources"""
    sources = {
        source_id: config.to_dict()
        for source_id, config in integration_hub.data_sources.items()
    }
    
    return jsonify({
        "status": "success",
        "sources": sources
    })

@integration_bp.route('/api/sources/<source_id>')
@login_required
def api_get_source(source_id):
    """API: Get a data source"""
    if source_id not in integration_hub.data_sources:
        return jsonify({
            "status": "error",
            "message": "Data source not found"
        })
    
    # Get metadata
    metadata = integration_hub.get_source_metadata(source_id)
    
    return jsonify(metadata)

@integration_bp.route('/api/sync/property', methods=['POST'])
@admin_required
def api_sync_property():
    """API: Synchronize property data"""
    data = request.get_json()
    
    source_id = data.get('source_id')
    target_id = data.get('target_id')
    
    if not source_id:
        return jsonify({
            "status": "error",
            "message": "Source ID is required"
        })
        
    if source_id not in integration_hub.data_sources:
        return jsonify({
            "status": "error",
            "message": "Source not found"
        })
        
    if target_id and target_id not in integration_hub.data_sources:
        return jsonify({
            "status": "error",
            "message": "Target not found"
        })
        
    result = integration_hub.sync_property_data(source_id, target_id)
    
    return jsonify(result)

@integration_bp.route('/api/sync/sales', methods=['POST'])
@admin_required
def api_sync_sales():
    """API: Synchronize sales data"""
    data = request.get_json()
    
    source_id = data.get('source_id')
    target_id = data.get('target_id')
    
    if not source_id:
        return jsonify({
            "status": "error",
            "message": "Source ID is required"
        })
        
    if source_id not in integration_hub.data_sources:
        return jsonify({
            "status": "error",
            "message": "Source not found"
        })
        
    if target_id and target_id not in integration_hub.data_sources:
        return jsonify({
            "status": "error",
            "message": "Target not found"
        })
        
    result = integration_hub.sync_sales_data(source_id, target_id)
    
    return jsonify(result)

@integration_bp.route('/api/sync/valuation', methods=['POST'])
@admin_required
def api_sync_valuation():
    """API: Synchronize valuation data"""
    data = request.get_json()
    
    source_id = data.get('source_id')
    target_id = data.get('target_id')
    
    if not source_id:
        return jsonify({
            "status": "error",
            "message": "Source ID is required"
        })
        
    if source_id not in integration_hub.data_sources:
        return jsonify({
            "status": "error",
            "message": "Source not found"
        })
        
    if target_id and target_id not in integration_hub.data_sources:
        return jsonify({
            "status": "error",
            "message": "Target not found"
        })
        
    result = integration_hub.sync_valuation_data(source_id, target_id)
    
    return jsonify(result)

@integration_bp.route('/api/export', methods=['POST'])
@login_required
def api_export():
    """API: Export data"""
    data = request.get_json()
    
    data_type = data.get('data_type')
    export_format = data.get('export_format')
    filters = data.get('filters', {})
    
    if not data_type or not export_format:
        return jsonify({
            "status": "error",
            "message": "Data type and export format are required"
        })
        
    result = integration_hub.export_data(data_type, export_format, filters)
    
    return jsonify(result)

def register_integration_blueprint(app):
    """Register the integration blueprint with the Flask app"""
    app.register_blueprint(integration_bp)
    
    # Create export directory if it doesn't exist
    export_dir = os.path.join(app.root_path, "exports")
    if not os.path.exists(export_dir):
        os.makedirs(export_dir, exist_ok=True)
        
    logger.info("Integration Hub blueprint registered")