"""
Map Routes Module

This module provides Flask routes for the map functionality in TerraFlow.
"""
import os
import json
import logging
from flask import render_template, jsonify, request, flash, redirect, url_for, session
from app import app
from auth import login_required, permission_required
from map_config_parser import generate_map_config_from_files, is_configured, process_xml_files

# Configure logging
logger = logging.getLogger(__name__)

# Ensure map configuration is processed
if not is_configured():
    try:
        logger.info("Processing map configuration XML files")
        success = process_xml_files()
        if success:
            logger.info("Map configuration XML files processed successfully")
        else:
            logger.error("Failed to process map configuration XML files")
    except Exception as e:
        logger.error(f"Error processing map configuration: {str(e)}")

@app.route('/maps/property-viewer')
@login_required
def property_map_viewer():
    """Display the main property map viewer page"""
    return render_template('map/property_viewer.html')

@app.route('/maps/config')
@login_required
@permission_required('admin.maps.configure')
def map_config():
    """Display the map configuration page"""
    return render_template('map/esri_config.html')

@app.route('/maps/database-config')
@login_required
@permission_required('admin.database.configure')
def database_config():
    """Display the database configuration page"""
    return render_template('map/database_config.html')

@app.route('/maps/config/save', methods=['POST'])
@login_required
@permission_required('admin.maps.configure')
def save_map_config():
    """Save map configuration settings"""
    config_type = request.form.get('config_type')
    
    if config_type == 'esri':
        # Process ESRI Map config
        config = {
            'base_layers': request.form.getlist('base_layers[]'),
            'viewable_layers': request.form.getlist('viewable_layers[]'),
            'pin_field': request.form.get('pin_field'),
            'spatial_filter': request.form.get('spatial_filter'),
            'selection_fill_opacity': request.form.get('selection_fill_opacity'),
            'selection_border_thickness': request.form.get('selection_border_thickness'),
            'selection_border_color': request.form.get('selection_border_color'),
            'show_scale_bar': 'show_scale_bar' in request.form,
            'show_legal_text': 'show_legal_text' in request.form,
            'legal_text': request.form.get('legal_text')
        }
        # Save config to file or database
        try:
            with open('config/esri_map_config.json', 'w') as f:
                json.dump(config, f, indent=2)
            flash('ESRI Map configuration saved successfully', 'success')
        except Exception as e:
            flash(f'Error saving ESRI Map configuration: {str(e)}', 'danger')
    
    elif config_type == 'google':
        # Process Google Maps config
        config = {
            'api_key': request.form.get('google_api_key'),
            'allow_dev_tools': 'allow_dev_tools' in request.form
        }
        # Save config to file or database
        try:
            with open('config/google_map_config.json', 'w') as f:
                json.dump(config, f, indent=2)
            flash('Google Maps configuration saved successfully', 'success')
        except Exception as e:
            flash(f'Error saving Google Maps configuration: {str(e)}', 'danger')
    
    return redirect(url_for('map_config'))

@app.route('/maps/module-config/save', methods=['POST'])
@login_required
@permission_required('admin.maps.configure')
def save_module_config():
    """Save map module configuration settings"""
    modules = request.form.getlist('modules[]')
    
    # Save config to file or database
    try:
        config = {
            'modules': modules
        }
        with open('config/map_modules_config.json', 'w') as f:
            json.dump(config, f, indent=2)
        flash('Module configuration saved successfully', 'success')
    except Exception as e:
        flash(f'Error saving module configuration: {str(e)}', 'danger')
    
    return redirect(url_for('map_config'))

@app.route('/maps/db-config/save', methods=['POST'])
@login_required
@permission_required('admin.database.configure')
def save_db_config():
    """Save database configuration settings"""
    config_type = request.form.get('config_type')
    
    if config_type == 'pacs':
        # Process PACS Database config
        config = {
            'connection_name': request.form.get('connection_name'),
            'connection_type': request.form.get('connection_type'),
            'connection_path': request.form.get('connection_path'),
            'key_field': request.form.get('key_field'),
            'search_fetch_size': int(request.form.get('search_fetch_size')),
            'max_data_records': int(request.form.get('max_data_records')),
            'queries': [
                {
                    'name': request.form.get('query_property_name'),
                    'description': request.form.get('query_property_desc'),
                    'sql': request.form.get('query_property_sql'),
                    'execute_immediate': 'query_property_immediate' in request.form
                },
                {
                    'name': request.form.get('query_sales_name'),
                    'description': request.form.get('query_sales_desc'),
                    'sql': request.form.get('query_sales_sql'),
                    'execute_immediate': 'query_sales_immediate' in request.form
                }
            ]
        }
        # Save config to file or database
        try:
            # Create config directory if it doesn't exist
            os.makedirs('config', exist_ok=True)
            
            with open('config/pacs_db_config.json', 'w') as f:
                json.dump(config, f, indent=2)
            flash('Database configuration saved successfully', 'success')
        except Exception as e:
            flash(f'Error saving database configuration: {str(e)}', 'danger')
    
    return redirect(url_for('database_config'))

@app.route('/api/properties')
@login_required
def api_properties():
    """API endpoint to get property data for the map"""
    # This would normally fetch from the database
    # For now, return sample data
    properties = [
        {
            'prop_id': '1234567890',
            'situs_display': '123 Main St',
            'owner': 'John Doe',
            'prop_type_cd': 'RES',
            'living_area': 2200,
            'land_acres': 0.25,
            'yr_blt': 1998,
            'appraised_val': 450000,
            'land_val': 125000,
            'latitude': 46.2506,
            'longitude': -119.2844
        },
        {
            'prop_id': '0987654321',
            'situs_display': '456 Elm St',
            'owner': 'Jane Smith',
            'prop_type_cd': 'COM',
            'living_area': 5000,
            'land_acres': 0.75,
            'yr_blt': 2005,
            'appraised_val': 950000,
            'land_val': 350000,
            'latitude': 46.2508,
            'longitude': -119.2850
        }
    ]
    
    return jsonify(properties)

@app.route('/api/property/<prop_id>')
@login_required
def api_property(prop_id):
    """API endpoint to get details for a specific property"""
    # This would normally fetch from the database
    # For now, return sample data
    if prop_id == '1234567890':
        property_data = {
            'prop_id': '1234567890',
            'situs_display': '123 Main St',
            'owner': 'John Doe',
            'prop_type_cd': 'RES',
            'living_area': 2200,
            'land_acres': 0.25,
            'yr_blt': 1998,
            'appraised_val': 450000,
            'land_val': 125000,
            'latitude': 46.2506,
            'longitude': -119.2844,
            'neighborhood': 'Downtown',
            'school_district': 'Benton School District',
            'zoning': 'Residential',
            'assessments': [
                {'year': 2025, 'land_val': 125000, 'improvement_val': 325000, 'total_val': 450000},
                {'year': 2024, 'land_val': 120000, 'improvement_val': 310000, 'total_val': 430000},
                {'year': 2023, 'land_val': 115000, 'improvement_val': 300000, 'total_val': 415000},
                {'year': 2022, 'land_val': 110000, 'improvement_val': 290000, 'total_val': 400000},
                {'year': 2021, 'land_val': 105000, 'improvement_val': 280000, 'total_val': 385000}
            ]
        }
    else:
        property_data = {
            'prop_id': '0987654321',
            'situs_display': '456 Elm St',
            'owner': 'Jane Smith',
            'prop_type_cd': 'COM',
            'living_area': 5000,
            'land_acres': 0.75,
            'yr_blt': 2005,
            'appraised_val': 950000,
            'land_val': 350000,
            'latitude': 46.2508,
            'longitude': -119.2850,
            'neighborhood': 'Commercial District',
            'school_district': 'Benton School District',
            'zoning': 'Commercial',
            'assessments': [
                {'year': 2025, 'land_val': 350000, 'improvement_val': 600000, 'total_val': 950000},
                {'year': 2024, 'land_val': 340000, 'improvement_val': 580000, 'total_val': 920000},
                {'year': 2023, 'land_val': 330000, 'improvement_val': 570000, 'total_val': 900000},
                {'year': 2022, 'land_val': 320000, 'improvement_val': 560000, 'total_val': 880000},
                {'year': 2021, 'land_val': 310000, 'improvement_val': 550000, 'total_val': 860000}
            ]
        }
    
    return jsonify(property_data)

@app.route('/api/saved-locations')
@login_required
def api_saved_locations():
    """API endpoint to get saved map locations"""
    # This would normally fetch from the database
    # For now, return sample data
    locations = [
        {
            'id': 1,
            'name': 'Commercial Properties',
            'description': 'Commercial area with high-value properties',
            'spatial_reference': 3857,
            'x_min': -10738725.944775187,
            'y_min': 3882813.8569813273,
            'x_max': -10735182.498742506,
            'y_max': 3885022.3251543227
        },
        {
            'id': 2,
            'name': 'New Development',
            'description': 'Area with recent construction activity',
            'spatial_reference': 3857,
            'x_min': -10730123.681273649,
            'y_min': 3888224.9166373555,
            'x_max': -10729012.804349972,
            'y_max': 3889582.19584521
        }
    ]
    
    return jsonify(locations)

@app.route('/api/save-location', methods=['POST'])
@login_required
def api_save_location():
    """API endpoint to save a map location"""
    data = request.json
    
    # This would normally save to the database
    # For now, just return success
    return jsonify({'success': True, 'id': 3, 'message': 'Location saved successfully'})


@app.route('/api/map-config')
@login_required
def api_map_config():
    """API endpoint to get map configuration"""
    try:
        # Generate current map configuration
        map_config = generate_map_config_from_files()
        return jsonify(map_config)
    except Exception as e:
        logger.error(f"Error retrieving map configuration: {str(e)}")
        return jsonify({'error': 'Failed to retrieve map configuration'}), 500


@app.route('/api/process-xml-config', methods=['POST'])
@login_required
@permission_required('admin.maps.configure')
def api_process_xml_config():
    """API endpoint to process XML configuration files"""
    try:
        # Process XML files
        success = process_xml_files()
        if success:
            # Generate configuration
            map_config = generate_map_config_from_files()
            return jsonify({
                'success': True, 
                'message': 'XML configuration processed successfully',
                'config': map_config
            })
        else:
            return jsonify({
                'success': False, 
                'message': 'Failed to process XML configuration files'
            }), 500
    except Exception as e:
        logger.error(f"Error processing XML configuration: {str(e)}")
        return jsonify({
            'success': False, 
            'message': f'Error processing XML configuration: {str(e)}'
        }), 500


@app.route('/api/map-layers')
@login_required
def api_map_layers():
    """API endpoint to get map layers for the property viewer"""
    try:
        # Generate current map configuration
        map_config = generate_map_config_from_files()
        
        # Extract layers
        base_layers = map_config.get('baseLayers', [])
        feature_layers = map_config.get('viewableLayers', [])
        
        return jsonify({
            'baseLayers': base_layers,
            'featureLayers': feature_layers
        })
    except Exception as e:
        logger.error(f"Error retrieving map layers: {str(e)}")
        return jsonify({'error': 'Failed to retrieve map layers'}), 500