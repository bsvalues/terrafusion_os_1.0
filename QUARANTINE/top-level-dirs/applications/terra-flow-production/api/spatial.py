"""
Spatial API Module

This module provides endpoints for accessing and working with spatial data,
including GIS layers, features, and related functionality.
"""

import json
import logging
import os
from typing import Dict, List, Optional, Any

from flask import Blueprint, jsonify, request, send_file, current_app, Response

from api.gateway import api_login_required
from models import File, GISProject, db
from gis_utils import extract_gis_metadata, validate_geojson

logger = logging.getLogger(__name__)

# Create blueprint
spatial_bp = Blueprint('spatial', __name__, url_prefix='/spatial')

@spatial_bp.route('/layers')
@api_login_required
def list_layers():
    """List available GIS layers"""
    try:
        # Get query parameters
        layer_type = request.args.get('type')
        project_id = request.args.get('project_id')
        
        # Build query
        query = File.query.filter(File.file_metadata.isnot(None))
        
        # Filter by layer type if specified
        if layer_type:
            query = query.filter(File.file_type == layer_type)
            
        # Filter by project if specified
        if project_id:
            try:
                project_id = int(project_id)
                query = query.filter(File.project_id == project_id)
            except ValueError:
                return jsonify({'error': 'Invalid project_id parameter'}), 400
        
        # Execute query
        files = query.all()
        
        # Convert to layer list
        layers = []
        for file in files:
            layer = {
                'id': file.id,
                'name': file.original_filename,
                'type': file.file_type,
                'upload_date': file.upload_date.isoformat(),
                'description': file.description,
                'metadata': file.file_metadata
            }
            
            # Add project info if available
            if file.project:
                layer['project'] = {
                    'id': file.project.id,
                    'name': file.project.name
                }
                
            layers.append(layer)
            
        return jsonify({'layers': layers})
    except Exception as e:
        logger.error(f"Error listing layers: {str(e)}")
        return jsonify({'error': f'Error listing layers: {str(e)}'}), 500

@spatial_bp.route('/layers/<int:layer_id>')
@api_login_required
def get_layer(layer_id):
    """Get information about a specific GIS layer"""
    try:
        file = File.query.get(layer_id)
        
        if not file:
            return jsonify({'error': 'Layer not found'}), 404
            
        layer = {
            'id': file.id,
            'name': file.original_filename,
            'type': file.file_type,
            'upload_date': file.upload_date.isoformat(),
            'description': file.description,
            'metadata': file.file_metadata,
            'file_path': file.file_path,
            'size': file.file_size
        }
        
        # Add project info if available
        if file.project:
            layer['project'] = {
                'id': file.project.id,
                'name': file.project.name
            }
            
        return jsonify(layer)
    except Exception as e:
        logger.error(f"Error getting layer: {str(e)}")
        return jsonify({'error': f'Error getting layer: {str(e)}'}), 500

@spatial_bp.route('/layers/<int:layer_id>/data')
@api_login_required
def get_layer_data(layer_id):
    """Get the data for a specific GIS layer"""
    try:
        file = File.query.get(layer_id)
        
        if not file:
            return jsonify({'error': 'Layer not found'}), 404
            
        # Check if file exists
        if not os.path.exists(file.file_path):
            return jsonify({'error': 'Layer file not found'}), 404
            
        # Get format parameter
        format_param = request.args.get('format', 'json').lower()
        
        if format_param == 'file':
            # Return the original file
            return send_file(file.file_path, 
                            download_name=file.original_filename,
                            as_attachment=True)
        elif format_param == 'json':
            # Return the data as JSON
            if file.file_type == 'application/geo+json':
                # For GeoJSON, read and return directly
                with open(file.file_path, 'r') as f:
                    data = json.load(f)
                return jsonify(data)
            else:
                # For other formats, attempt to convert to GeoJSON
                try:
                    import geopandas as gpd
                    
                    # Read file with GeoPandas
                    gdf = gpd.read_file(file.file_path)
                    
                    # Convert to GeoJSON
                    geojson_data = json.loads(gdf.to_json())
                    return jsonify(geojson_data)
                except Exception as e:
                    logger.error(f"Error converting layer to GeoJSON: {str(e)}")
                    return jsonify({
                        'error': 'Unable to convert this layer format to JSON. Try using format=file instead.'
                    }), 400
        else:
            return jsonify({'error': f'Unsupported format: {format_param}'}), 400
    except Exception as e:
        logger.error(f"Error getting layer data: {str(e)}")
        return jsonify({'error': f'Error getting layer data: {str(e)}'}), 500

@spatial_bp.route('/layers/<int:layer_id>/metadata')
@api_login_required
def get_layer_metadata(layer_id):
    """Get metadata for a specific GIS layer"""
    try:
        file = File.query.get(layer_id)
        
        if not file:
            return jsonify({'error': 'Layer not found'}), 404
            
        # Return stored metadata if available
        if file.file_metadata:
            return jsonify(file.file_metadata)
            
        # Otherwise, try to extract metadata
        if os.path.exists(file.file_path):
            metadata = extract_gis_metadata(file.file_path, file.file_type)
            
            if metadata:
                # Update the file record with the metadata
                file.file_metadata = metadata
                db.session.commit()
                
                return jsonify(metadata)
            else:
                return jsonify({'error': 'Unable to extract metadata from this file type'}), 400
        else:
            return jsonify({'error': 'Layer file not found'}), 404
    except Exception as e:
        logger.error(f"Error getting layer metadata: {str(e)}")
        return jsonify({'error': f'Error getting layer metadata: {str(e)}'}), 500

@spatial_bp.route('/projects')
@api_login_required
def list_projects():
    """List GIS projects"""
    try:
        # Get query parameters
        user_id = request.args.get('user_id')
        
        # Build query
        query = GISProject.query
        
        # Filter by user if specified
        if user_id:
            try:
                user_id = int(user_id)
                query = query.filter(GISProject.user_id == user_id)
            except ValueError:
                return jsonify({'error': 'Invalid user_id parameter'}), 400
        
        # Execute query
        projects = query.all()
        
        # Convert to project list
        project_list = []
        for project in projects:
            project_data = {
                'id': project.id,
                'name': project.name,
                'description': project.description,
                'created_at': project.created_at.isoformat(),
                'updated_at': project.updated_at.isoformat(),
                'user_id': project.user_id,
                'file_count': project.files.count()
            }
            project_list.append(project_data)
            
        return jsonify({'projects': project_list})
    except Exception as e:
        logger.error(f"Error listing projects: {str(e)}")
        return jsonify({'error': f'Error listing projects: {str(e)}'}), 500

@spatial_bp.route('/projects/<int:project_id>')
@api_login_required
def get_project(project_id):
    """Get information about a specific GIS project"""
    try:
        project = GISProject.query.get(project_id)
        
        if not project:
            return jsonify({'error': 'Project not found'}), 404
            
        # Get project files
        files = project.files.all()
        file_list = []
        
        for file in files:
            file_data = {
                'id': file.id,
                'name': file.original_filename,
                'type': file.file_type,
                'upload_date': file.upload_date.isoformat(),
                'description': file.description
            }
            file_list.append(file_data)
            
        project_data = {
            'id': project.id,
            'name': project.name,
            'description': project.description,
            'created_at': project.created_at.isoformat(),
            'updated_at': project.updated_at.isoformat(),
            'user_id': project.user_id,
            'files': file_list
        }
            
        return jsonify(project_data)
    except Exception as e:
        logger.error(f"Error getting project: {str(e)}")
        return jsonify({'error': f'Error getting project: {str(e)}'}), 500