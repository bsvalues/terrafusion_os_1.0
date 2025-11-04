"""
ETL Routes Module

This module provides Flask routes for ETL operations with enhanced functionality,
including data import/export and field mapping management.
"""

import os
import logging
import json
import datetime
from flask import Blueprint, request, jsonify, render_template, current_app, flash, redirect, url_for, session
from werkzeug.utils import secure_filename
from sqlalchemy import create_engine, text
import pandas as pd
from typing import Dict, List, Any, Optional, Union

from sync_service.enhanced_etl import get_enhanced_etl
from sync_service.chunked_etl import get_chunked_etl_processor
from auth import login_required, permission_required

logger = logging.getLogger(__name__)

# Create blueprint
etl_bp = Blueprint('etl', __name__, url_prefix='/etl')

# Set up upload folder
UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Allowed file extensions
ALLOWED_EXTENSIONS = {'csv', 'xlsx', 'xls', 'json', 'parquet'}

def allowed_file(filename):
    """Check if a file has an allowed extension"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@etl_bp.route('/', methods=['GET'])
@login_required
def etl_dashboard():
    """ETL Dashboard - main page for ETL operations"""
    return render_template('etl/dashboard.html', title="ETL Dashboard")

@etl_bp.route('/import', methods=['GET', 'POST'])
@login_required
@permission_required('import_data')
def import_data():
    """Import data from file or database"""
    if request.method == 'POST':
        # Check if file upload or database import
        import_type = request.form.get('import_type', 'file')
        data_type = request.form.get('data_type', 'property')
        
        if import_type == 'file':
            # File upload
            if 'file' not in request.files:
                flash('No file part', 'error')
                return redirect(request.url)
                
            file = request.files['file']
            
            if file.filename == '':
                flash('No selected file', 'error')
                return redirect(request.url)
                
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                filepath = os.path.join(UPLOAD_FOLDER, filename)
                file.save(filepath)
                
                # Get mapping information
                mapping_name = request.form.get('mapping_name', '')
                target_table = request.form.get('target_table', '')
                
                # Check if chunked processing is requested
                use_chunking = request.form.get('use_chunking') == 'on'
                chunk_size = int(request.form.get('chunk_size', 1000))
                
                if use_chunking:
                    logger.info(f"Using chunked ETL processing with chunk_size={chunk_size}")
                    processor = get_chunked_etl_processor(chunk_size=chunk_size)
                    results = processor.execute_chunked_etl(
                        source_connection=filepath,
                        source_query="",  # Empty query for file import
                        data_type=data_type,
                        source_type='file',
                        mapping_name=mapping_name if mapping_name else None,
                        target_table=target_table if target_table else None
                    )
                else:
                    # Process file using standard ETL
                    logger.info("Using standard ETL processing")
                    etl = get_enhanced_etl()
                    results = etl.execute_etl_pipeline(
                        source_connection=filepath,
                        source_query="",  # Empty query for file import
                        data_type=data_type,
                        source_type='file'
                    )
                
                # Store results in session for display
                session['etl_results'] = results
                
                if results['status'] == 'success':
                    flash(f"Successfully imported {results['load']['records']} {data_type} records", 'success')
                else:
                    flash(f"Import failed: {results['message']}", 'error')
                    
                return redirect(url_for('etl.import_results'))
            else:
                flash(f'File type not allowed. Allowed types: {", ".join(ALLOWED_EXTENSIONS)}', 'error')
                return redirect(request.url)
        
        elif import_type == 'database':
            # Database import
            connection_string = request.form.get('connection_string', '')
            query = request.form.get('query', '')
            
            if not connection_string:
                flash('Connection string is required', 'error')
                return redirect(request.url)
                
            if not query:
                flash('Query is required', 'error')
                return redirect(request.url)
                
            # Get mapping information
            mapping_name = request.form.get('mapping_name', '')
            target_table = request.form.get('target_table', '')
            
            # Check if chunked processing is requested
            use_chunking = request.form.get('dbUseChunking') == 'on'
            chunk_size = int(request.form.get('chunk_size', 1000))
            
            if use_chunking:
                logger.info(f"Using chunked ETL processing with chunk_size={chunk_size} for database import")
                processor = get_chunked_etl_processor(chunk_size=chunk_size)
                results = processor.execute_chunked_etl(
                    source_connection=connection_string,
                    source_query=query,
                    data_type=data_type,
                    source_type='database',
                    mapping_name=mapping_name if mapping_name else None,
                    target_table=target_table if target_table else None
                )
            else:
                # Process database import with standard ETL
                logger.info("Using standard ETL processing for database import")
                etl = get_enhanced_etl()
                results = etl.execute_etl_pipeline(
                    source_connection=connection_string,
                    source_query=query,
                    data_type=data_type,
                    source_type='database'
                )
            
            # Store results in session for display
            session['etl_results'] = results
            
            if results['status'] == 'success':
                flash(f"Successfully imported {results['load']['records']} {data_type} records", 'success')
            else:
                flash(f"Import failed: {results['message']}", 'error')
                
            return redirect(url_for('etl.import_results'))
        
        else:
            flash('Invalid import type', 'error')
            return redirect(request.url)
    
    # GET request - show import form
    return render_template('etl/import.html', title="Import Data", data_types=['property', 'sales', 'valuation', 'tax'])

@etl_bp.route('/import/results', methods=['GET'])
@login_required
def import_results():
    """Display import results"""
    results = session.get('etl_results', {})
    return render_template('etl/import_results.html', title="Import Results", results=results)

@etl_bp.route('/export', methods=['GET', 'POST'])
@login_required
@permission_required('export_data')
def export_data():
    """Export data from the system"""
    if request.method == 'POST':
        data_type = request.form.get('data_type', 'property')
        export_format = request.form.get('format', 'csv')
        
        # Get database engine
        try:
            from app import db
            engine = db.engine
        except ImportError:
            flash('Database engine not available', 'error')
            return redirect(request.url)
        
        # Generate export file path
        exports_dir = os.path.join(os.getcwd(), 'exports', data_type)
        os.makedirs(exports_dir, exist_ok=True)
        
        timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{data_type}_export_{timestamp}.{export_format}"
        filepath = os.path.join(exports_dir, filename)
        
        # Query data
        try:
            query = f"SELECT * FROM {data_type}_data"
            df = pd.read_sql(query, engine)
            
            if df.empty:
                flash(f'No {data_type} data found', 'warning')
                return redirect(request.url)
                
            # Export based on format
            if export_format == 'csv':
                df.to_csv(filepath, index=False)
            elif export_format == 'xlsx':
                df.to_excel(filepath, index=False)
            elif export_format == 'json':
                df.to_json(filepath, orient='records')
            elif export_format == 'parquet':
                df.to_parquet(filepath, index=False)
            else:
                flash('Invalid export format', 'error')
                return redirect(request.url)
                
            # Store export info in session
            session['export_file'] = filepath
            session['export_filename'] = filename
            
            flash(f'Successfully exported {len(df)} {data_type} records to {filename}', 'success')
            return redirect(url_for('etl.export_download'))
            
        except Exception as e:
            flash(f'Export failed: {str(e)}', 'error')
            return redirect(request.url)
    
    # GET request - show export form
    return render_template('etl/export.html', title="Export Data", 
                          data_types=['property', 'sales', 'valuation', 'tax'],
                          formats=['csv', 'xlsx', 'json', 'parquet'])

@etl_bp.route('/export/download', methods=['GET'])
@login_required
def export_download():
    """Download exported file"""
    filepath = session.get('export_file', '')
    filename = session.get('export_filename', '')
    
    if not filepath or not filename or not os.path.exists(filepath):
        flash('Export file not found', 'error')
        return redirect(url_for('etl.export_data'))
        
    return render_template('etl/export_download.html', title="Download Export", 
                          filename=filename, filepath=filepath)

@etl_bp.route('/mappings', methods=['GET', 'POST'])
@login_required
@permission_required('manage_mappings')
def manage_mappings():
    """Manage field mappings for ETL operations"""
    # Get ETL instance to access schemas
    etl = get_enhanced_etl()
    
    if request.method == 'POST':
        # Save mapping
        data_type = request.form.get('data_type', 'property')
        mapping_name = request.form.get('mapping_name', '')
        source_fields = request.form.getlist('source_field')
        target_fields = request.form.getlist('target_field')
        
        if not mapping_name:
            flash('Mapping name is required', 'error')
            return redirect(request.url)
            
        # Create mapping dictionary
        mapping = {}
        for i in range(len(target_fields)):
            if i < len(source_fields) and target_fields[i] and source_fields[i]:
                mapping[target_fields[i]] = source_fields[i]
        
        # Save mapping to file
        mappings_dir = os.path.join(os.getcwd(), 'sync_service', 'mappings')
        os.makedirs(mappings_dir, exist_ok=True)
        
        filepath = os.path.join(mappings_dir, f"{data_type}_{mapping_name}.json")
        with open(filepath, 'w') as f:
            json.dump({
                'name': mapping_name,
                'data_type': data_type,
                'mapping': mapping,
                'created': datetime.datetime.now().isoformat()
            }, f, indent=2)
            
        flash(f'Mapping "{mapping_name}" saved successfully', 'success')
        return redirect(url_for('etl.manage_mappings'))
    
    # GET request - show mappings form
    # Get list of existing mappings
    mappings_dir = os.path.join(os.getcwd(), 'sync_service', 'mappings')
    os.makedirs(mappings_dir, exist_ok=True)
    
    mappings = []
    for filename in os.listdir(mappings_dir):
        if filename.endswith('.json'):
            with open(os.path.join(mappings_dir, filename), 'r') as f:
                try:
                    mapping = json.load(f)
                    mappings.append(mapping)
                except:
                    pass
    
    return render_template('etl/mappings.html', title="Manage Field Mappings", 
                          schemas=etl.schemas,
                          mappings=mappings)

@etl_bp.route('/api/import', methods=['POST'])
@login_required
@permission_required('import_data')
def api_import():
    """API endpoint for importing data"""
    # Parse request
    data = request.get_json()
    
    if not data:
        return jsonify({'status': 'error', 'message': 'No data provided'}), 400
        
    source_type = data.get('source_type', 'database')
    source_connection = data.get('source_connection', '')
    source_query = data.get('source_query', '')
    data_type = data.get('data_type', 'property')
    mapping_name = data.get('mapping_name', '')
    target_table = data.get('target_table', '')
    use_chunking = data.get('use_chunking', False)
    chunk_size = data.get('chunk_size', 1000)
    
    if not source_connection:
        return jsonify({'status': 'error', 'message': 'Source connection is required'}), 400
        
    if source_type == 'database' and not source_query:
        return jsonify({'status': 'error', 'message': 'Query is required for database source'}), 400
    
    # Process import with chunking if requested
    if use_chunking:
        logger.info(f"Using chunked ETL processing with chunk_size={chunk_size}")
        processor = get_chunked_etl_processor(chunk_size=chunk_size)
        results = processor.execute_chunked_etl(
            source_connection=source_connection,
            source_query=source_query,
            data_type=data_type,
            source_type=source_type,
            mapping_name=mapping_name if mapping_name else None,
            target_table=target_table if target_table else None
        )
    else:
        # Use standard ETL processing
        logger.info("Using standard ETL processing")
        etl = get_enhanced_etl()
        results = etl.execute_etl_pipeline(
            source_connection=source_connection,
            source_query=source_query,
            data_type=data_type,
            source_type=source_type
        )
    
    return jsonify(results)

@etl_bp.route('/api/chunked-import', methods=['POST'])
@login_required
@permission_required('import_data')
def api_chunked_import():
    """API endpoint for importing large datasets with chunking"""
    # Parse request
    data = request.get_json()
    
    if not data:
        return jsonify({'status': 'error', 'message': 'No data provided'}), 400
        
    source_type = data.get('source_type', 'file')
    source_connection = data.get('source_connection', '')
    source_query = data.get('source_query', '')
    data_type = data.get('data_type', 'property')
    mapping_name = data.get('mapping_name', '')
    target_table = data.get('target_table', '')
    chunk_size = data.get('chunk_size', 1000)
    
    if not source_connection:
        return jsonify({'status': 'error', 'message': 'Source connection is required'}), 400
        
    if source_type == 'database' and not source_query:
        return jsonify({'status': 'error', 'message': 'Query is required for database source'}), 400
    
    # Use chunked ETL processor
    processor = get_chunked_etl_processor(chunk_size=chunk_size)
    results = processor.execute_chunked_etl(
        source_connection=source_connection,
        source_query=source_query,
        data_type=data_type,
        source_type=source_type,
        mapping_name=mapping_name if mapping_name else None,
        target_table=target_table if target_table else None
    )
    
    return jsonify(results)

@etl_bp.route('/api/validate', methods=['POST'])
@login_required
def api_validate():
    """API endpoint for validating data without importing"""
    # Check if file upload or JSON data
    if 'file' in request.files:
        # File upload
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'status': 'error', 'message': 'No selected file'}), 400
            
        if not allowed_file(file.filename):
            return jsonify({
                'status': 'error', 
                'message': f'File type not allowed. Allowed types: {", ".join(ALLOWED_EXTENSIONS)}'
            }), 400
                
        filename = secure_filename(file.filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        
        # Load data based on file type
        _, ext = os.path.splitext(filepath)
        
        etl = get_enhanced_etl()
        data = etl.extract_from_file(filepath)
        
        if data.empty:
            return jsonify({'status': 'error', 'message': 'No data found in file'}), 400
            
        # Validate data
        data_type = request.form.get('data_type', 'property')
        validation = etl.validate_data(data, data_type)
        
        return jsonify({
            'status': 'success',
            'message': 'Validation complete',
            'validation': validation,
            'file': filename
        })
    
    else:
        # JSON data
        data = request.get_json()
        
        if not data:
            return jsonify({'status': 'error', 'message': 'No data provided'}), 400
            
        records = data.get('records', [])
        data_type = data.get('data_type', 'property')
        
        if not records:
            return jsonify({'status': 'error', 'message': 'No records provided'}), 400
            
        # Convert to DataFrame
        df = pd.DataFrame(records)
        
        # Validate data
        etl = get_enhanced_etl()
        validation = etl.validate_data(df, data_type)
        
        return jsonify({
            'status': 'success',
            'message': 'Validation complete',
            'validation': validation
        })

def register_etl_routes(app):
    """Register ETL routes with the application"""
    app.register_blueprint(etl_bp)
    logger.info("ETL routes registered successfully")