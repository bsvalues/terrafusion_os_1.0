"""
Report Routes Module

This module provides Flask routes for the report management system, including
template creation, report generation, and export functionality.
"""

import os
import uuid
import json
import datetime
from typing import Dict, Any, List, Optional, Tuple

from flask import Blueprint, render_template, request, jsonify, redirect
from flask import url_for, send_file, flash, current_app, abort
from werkzeug.utils import secure_filename

from reports.report_generator import report_generator
from reports.report_templates import get_template, get_templates, create_template
from reports.report_templates import update_template, delete_template, clone_template
from reports.report_templates import TEMPLATE_TYPES

# Create a Blueprint for report routes
reports_bp = Blueprint('reports', __name__, url_prefix='/reports')

# -----------------------------------------------------------------------------
# View Routes
# -----------------------------------------------------------------------------

@reports_bp.route('/')
def reports_dashboard():
    """
    Report management dashboard.
    """
    # Get recent templates
    templates = get_templates(limit=5)
    
    # Get recent reports (placeholder until we implement report storage)
    reports = []
    
    # Calculate statistics
    stats = {
        "total_templates": len(get_templates()),
        "generated_reports": len(reports),
        "geospatial_reports": 0,
        "anomaly_reports": 0,
        "type_counts": {
            "property_assessment": 0,
            "geospatial_analysis": 0,
            "anomaly_report": 0
        },
        "type_percentages": {
            "property_assessment": 0,
            "geospatial_analysis": 0,
            "anomaly_report": 0
        }
    }
    
    # Calculate template type counts and percentages
    all_templates = get_templates()
    total = len(all_templates)
    
    if total > 0:
        for template_type in TEMPLATE_TYPES:
            count = len([t for t in all_templates if t["template_type"] == template_type])
            stats["type_counts"][template_type] = count
            stats["type_percentages"][template_type] = int((count / total) * 100) if total > 0 else 0
            
            if template_type == "geospatial_analysis":
                stats["geospatial_reports"] = count
            elif template_type == "anomaly_report":
                stats["anomaly_reports"] = count
    
    return render_template('reports/dashboard.html', 
                           recent_templates=templates,
                           recent_reports=reports,
                           stats=stats)

@reports_bp.route('/templates')
def list_templates():
    """
    List all report templates.
    """
    templates = get_templates()
    return render_template('reports/templates.html', templates=templates)

@reports_bp.route('/templates/create', methods=['GET', 'POST'])
def create_template_route():
    """
    Create a new report template.
    
    GET: Display template creation form
    POST: Process template creation
    """
    if request.method == 'POST':
        # Extract form data
        name = request.form.get('name')
        description = request.form.get('description', '')
        template_type = request.form.get('template_type')
        
        # Validate required fields
        if not name or not template_type:
            flash('Name and template type are required.', 'error')
            return redirect(url_for('reports.create_template'))
        
        # Create sections from form data
        sections = []
        section_count = int(request.form.get('section_count', 0))
        
        for i in range(section_count):
            section_type = request.form.get(f'section_{i}_type')
            section_title = request.form.get(f'section_{i}_title')
            section_content = {}
            
            # Build content based on section type
            if section_type == 'text':
                section_content['text'] = request.form.get(f'section_{i}_text', '')
            elif section_type == 'property_info':
                fields = request.form.get(f'section_{i}_fields', '').split(',')
                section_content['fields'] = [f.strip() for f in fields if f.strip()]
            elif section_type == 'table':
                columns = request.form.get(f'section_{i}_columns', '').split(',')
                section_content['columns'] = [c.strip() for c in columns if c.strip()]
                section_content['data_key'] = request.form.get(f'section_{i}_data_key', '')
            # Add other section types as needed
            
            if section_type and section_title:
                sections.append({
                    'section_type': section_type,
                    'title': section_title,
                    'content': section_content
                })
        
        # Create metadata
        metadata = {
            'created_at': datetime.datetime.utcnow().isoformat(),
            'modified_at': datetime.datetime.utcnow().isoformat(),
            'created_by': 'system',  # Replace with actual user in the future
            'version': '1.0',
            'tags': request.form.get('tags', '').split(',')
        }
        
        # Create template
        template_id = create_template(
            name=name,
            description=description,
            template_type=template_type,
            sections=sections,
            metadata=metadata
        )
        
        flash('Template created successfully.', 'success')
        return redirect(url_for('reports.view_template', template_id=template_id))
    
    # GET request - render template creation form
    return render_template('reports/template_form.html', template=None, section_types=SECTION_TYPES)

@reports_bp.route('/templates/<template_id>')
def view_template(template_id):
    """
    View a report template.
    """
    template = get_template(template_id)
    if not template:
        abort(404)
    
    return render_template('reports/template_detail.html', template=template)

@reports_bp.route('/templates/<template_id>/edit', methods=['GET', 'POST'])
def edit_template(template_id):
    """
    Edit a report template.
    
    GET: Display template edit form
    POST: Process template update
    """
    template = get_template(template_id)
    if not template:
        abort(404)
    
    if request.method == 'POST':
        # Extract form data
        name = request.form.get('name')
        description = request.form.get('description', '')
        template_type = request.form.get('template_type')
        
        # Validate required fields
        if not name or not template_type:
            flash('Name and template type are required.', 'error')
            return redirect(url_for('reports.edit_template', template_id=template_id))
        
        # Create sections from form data
        sections = []
        section_count = int(request.form.get('section_count', 0))
        
        for i in range(section_count):
            section_type = request.form.get(f'section_{i}_type')
            section_title = request.form.get(f'section_{i}_title')
            section_content = {}
            
            # Build content based on section type
            if section_type == 'text':
                section_content['text'] = request.form.get(f'section_{i}_text', '')
            elif section_type == 'property_info':
                fields = request.form.get(f'section_{i}_fields', '').split(',')
                section_content['fields'] = [f.strip() for f in fields if f.strip()]
            elif section_type == 'table':
                columns = request.form.get(f'section_{i}_columns', '').split(',')
                section_content['columns'] = [c.strip() for c in columns if c.strip()]
                section_content['data_key'] = request.form.get(f'section_{i}_data_key', '')
            # Add other section types as needed
            
            if section_type and section_title:
                sections.append({
                    'section_type': section_type,
                    'title': section_title,
                    'content': section_content
                })
        
        # Update metadata
        metadata = template.get('metadata', {})
        metadata['modified_at'] = datetime.datetime.utcnow().isoformat()
        metadata['tags'] = request.form.get('tags', '').split(',')
        
        # Update template
        update_template(
            template_id=template_id,
            name=name,
            description=description,
            template_type=template_type,
            sections=sections,
            metadata=metadata
        )
        
        flash('Template updated successfully.', 'success')
        return redirect(url_for('reports.view_template', template_id=template_id))
    
    # GET request - render template edit form
    return render_template('reports/template_form.html', template=template, section_types=SECTION_TYPES)

@reports_bp.route('/templates/<template_id>/delete', methods=['POST'])
def delete_template_route(template_id):
    """
    Delete a report template.
    """
    success = delete_template(template_id)
    
    if success:
        flash('Template deleted successfully.', 'success')
    else:
        flash('Failed to delete template.', 'error')
    
    return redirect(url_for('reports.list_templates'))

@reports_bp.route('/templates/<template_id>/clone', methods=['POST'])
def clone_template_route(template_id):
    """
    Clone a report template.
    """
    new_name = request.form.get('new_name')
    if not new_name:
        flash('New template name is required.', 'error')
        return redirect(url_for('reports.view_template', template_id=template_id))
    
    new_template_id = clone_template(template_id, new_name)
    
    if new_template_id:
        flash('Template cloned successfully.', 'success')
        return redirect(url_for('reports.view_template', template_id=new_template_id))
    else:
        flash('Failed to clone template.', 'error')
        return redirect(url_for('reports.view_template', template_id=template_id))

@reports_bp.route('/generate')
def generate_report():
    """
    Generate a report from a template.
    
    GET: Display report generation form
    POST: Process report generation
    """
    templates = get_templates()
    return render_template('reports/generate_report.html', templates=templates)

@reports_bp.route('/exports')
def export_history():
    """
    View report export history.
    """
    # For now, just return an empty export history page
    return render_template('reports/export_history.html', exports=[])

# -----------------------------------------------------------------------------
# API Routes
# -----------------------------------------------------------------------------

@reports_bp.route('/api/templates', methods=['GET'])
def api_list_templates():
    """
    API to get all templates.
    """
    templates = get_templates()
    return jsonify({'templates': templates})

@reports_bp.route('/api/templates/<template_id>', methods=['GET'])
def api_get_template(template_id):
    """
    API to get a specific template.
    """
    template = get_template(template_id)
    if not template:
        return jsonify({'error': 'Template not found'}), 404
    
    return jsonify({'template': template})

@reports_bp.route('/api/reports/generate', methods=['POST'])
def api_generate_report():
    """
    API to generate a report.
    
    Expected JSON body:
    {
        "template_id": "template-uuid",
        "data": {...},
        "export_format": "pdf",
        "report_title": "My Report"
    }
    """
    # Extract request data
    data = request.json
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    template_id = data.get('template_id')
    report_data = data.get('data', {})
    export_format = data.get('export_format', 'pdf')
    report_title = data.get('report_title', f'Report {datetime.datetime.now().isoformat()}')
    
    # Get template
    template = get_template(template_id)
    if not template:
        return jsonify({'error': 'Template not found'}), 404
    
    # Generate report
    try:
        result = report_generator.generate_report(
            template_id=template_id,
            data=report_data,
            export_format=export_format,
            report_title=report_title
        )
        
        return jsonify({
            'success': True,
            'report_id': result.get('report_id'),
            'file_path': result.get('file_path'),
            'download_url': url_for('reports.download_report', report_id=result.get('report_id'))
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@reports_bp.route('/downloads/<report_id>')
def download_report(report_id):
    """
    Download a generated report.
    """
    # This is placeholder functionality until we implement proper report storage
    report_path = os.path.join(report_generator.output_directory, f"{report_id}.pdf")
    
    if not os.path.exists(report_path):
        # Try other formats
        for ext in ['html', 'csv', 'json', 'xlsx', 'geojson']:
            alt_path = os.path.join(report_generator.output_directory, f"{report_id}.{ext}")
            if os.path.exists(alt_path):
                report_path = alt_path
                break
        else:
            abort(404)
    
    return send_file(report_path, as_attachment=True)

# -----------------------------------------------------------------------------
# Constants
# -----------------------------------------------------------------------------

SECTION_TYPES = [
    {
        'id': 'header',
        'name': 'Header',
        'description': 'Report header with title and subtitle'
    },
    {
        'id': 'text',
        'name': 'Text',
        'description': 'Text content'
    },
    {
        'id': 'property_info',
        'name': 'Property Information',
        'description': 'Display property details in a formatted layout'
    },
    {
        'id': 'valuation',
        'name': 'Valuation Summary',
        'description': 'Property valuation details'
    },
    {
        'id': 'map',
        'name': 'Map',
        'description': 'Geospatial map of property or area'
    },
    {
        'id': 'table',
        'name': 'Table',
        'description': 'Tabular data'
    },
    {
        'id': 'chart',
        'name': 'Chart',
        'description': 'Visual chart or graph'
    },
    {
        'id': 'comparable_properties',
        'name': 'Comparable Properties',
        'description': 'Properties with similar characteristics'
    },
    {
        'id': 'footer',
        'name': 'Footer',
        'description': 'Report footer with page information'
    }
]