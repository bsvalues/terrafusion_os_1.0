"""
Quality Report Routes

This module provides routes for generating and downloading data quality reports.
"""

import os
import logging
import datetime
from flask import Blueprint, request, jsonify, send_file, render_template, abort, make_response
from io import BytesIO
from werkzeug.exceptions import BadRequest

from app import app, db
from auth import login_required, permission_required
from sync_service.models.data_quality import DataQualityReport
from sync_service.quality_report_generator import report_generator

# Configure logging
logger = logging.getLogger(__name__)

# Create blueprint
quality_report_bp = Blueprint('quality_report', __name__, url_prefix='/data-quality/reports')

@quality_report_bp.route('/', methods=['GET'])
@login_required
def report_dashboard():
    """Render the report dashboard page."""
    # Get recent reports
    reports = []
    try:
        # Get the latest 10 reports
        reports = DataQualityReport.query.order_by(DataQualityReport.created_at.desc()).limit(10).all()
    except Exception as e:
        logger.error(f"Error fetching reports: {str(e)}")
        
    return render_template('data_quality/reports.html', reports=reports)

@quality_report_bp.route('/generate', methods=['GET'])
@login_required
def generate_report_form():
    """Render the report generation form."""
    return render_template('data_quality/generate_report.html')

@quality_report_bp.route('/generate', methods=['POST'])
@login_required
@permission_required('data_quality_reports')
def generate_report():
    """Generate a data quality report based on form parameters."""
    try:
        # Get form parameters
        report_format = request.form.get('format', 'pdf')
        scope = request.form.get('scope', 'latest')
        
        # Get content inclusion preferences
        include_anomalies = request.form.get('include_anomalies') == 'true'
        include_issues = request.form.get('include_issues') == 'true'
        include_recommendations = request.form.get('include_recommendations') == 'true'
        
        # For the latest scope, we don't need a report_id or dates
        report_id = None
        start_date = None
        end_date = None
        
        # If custom date range is selected, parse date parameters
        if scope == 'custom':
            start_date_str = request.form.get('start_date')
            end_date_str = request.form.get('end_date')
            
            if start_date_str:
                try:
                    start_date = datetime.datetime.strptime(start_date_str, '%Y-%m-%d')
                except ValueError:
                    pass
                    
            if end_date_str:
                try:
                    end_date = datetime.datetime.strptime(end_date_str, '%Y-%m-%d')
                    # Set to end of day
                    end_date = end_date.replace(hour=23, minute=59, second=59)
                except ValueError:
                    pass
        
        # Create report options
        report_options = {
            'include_anomalies': include_anomalies,
            'include_issues': include_issues,
            'include_recommendations': include_recommendations
        }
        
        # Generate report based on format
        if report_format == 'pdf':
            try:
                pdf_bytes, filename, new_report_id = report_generator.generate_pdf_report(
                    report_id=report_id,
                    start_date=start_date,
                    end_date=end_date,
                    options=report_options
                )
                
                # Return PDF as downloadable attachment
                response = make_response(pdf_bytes)
                response.headers['Content-Type'] = 'application/pdf'
                response.headers['Content-Disposition'] = f'attachment; filename="{filename}"'
                return response
            except Exception as e:
                logger.exception(f"Error generating PDF report: {str(e)}")
                return render_template('data_quality/generate_report.html', 
                                      error=f"Error generating report: {str(e)}")
        
        # Support for Excel reports
        elif report_format == 'excel':
            try:
                excel_bytes, filename, new_report_id = report_generator.generate_excel_report(
                    report_id=report_id,
                    start_date=start_date,
                    end_date=end_date,
                    options=report_options
                )
                
                # Return Excel as downloadable attachment
                response = make_response(excel_bytes)
                response.headers['Content-Type'] = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                response.headers['Content-Disposition'] = f'attachment; filename="{filename}"'
                return response
            except Exception as e:
                logger.exception(f"Error generating Excel report: {str(e)}")
                return render_template('data_quality/generate_report.html', 
                                    error=f"Error generating Excel report: {str(e)}")
            
        else:
            return render_template('data_quality/generate_report.html', 
                                  error="Unsupported report format.")
            
    except Exception as e:
        logger.exception(f"Error generating report: {str(e)}")
        return render_template('data_quality/generate_report.html', 
                              error=f"Error processing report request: {str(e)}")

@quality_report_bp.route('/api/generate', methods=['POST'])
@login_required
@permission_required('data_quality_reports')
def api_generate_report():
    """API endpoint for generating a report."""
    try:
        # Get JSON parameters
        data = request.get_json() or {}
        
        report_format = data.get('format', 'pdf')
        report_id = data.get('report_id')
        
        # Parse date parameters
        start_date = None
        end_date = None
        
        start_date_str = data.get('start_date')
        end_date_str = data.get('end_date')
        
        if start_date_str:
            try:
                start_date = datetime.datetime.strptime(start_date_str, '%Y-%m-%d')
            except ValueError:
                pass
                
        if end_date_str:
            try:
                end_date = datetime.datetime.strptime(end_date_str, '%Y-%m-%d')
                # Set to end of day
                end_date = end_date.replace(hour=23, minute=59, second=59)
            except ValueError:
                pass
                
        # Get content inclusion preferences
        include_anomalies = data.get('include_anomalies', True)
        include_issues = data.get('include_issues', True)
        include_recommendations = data.get('include_recommendations', True)
        
        # Create report options
        report_options = {
            'include_anomalies': include_anomalies,
            'include_issues': include_issues,
            'include_recommendations': include_recommendations
        }
        
        # Generate PDF report
        if report_format == 'pdf':
            pdf_bytes, filename, new_report_id = report_generator.generate_pdf_report(
                report_id=report_id,
                start_date=start_date,
                end_date=end_date,
                options=report_options
            )
            
            # Return base64 encoded PDF
            import base64
            pdf_base64 = base64.b64encode(pdf_bytes).decode('utf-8')
            
            return jsonify({
                'success': True,
                'filename': filename,
                'report_id': new_report_id,
                'data': pdf_base64,
                'format': 'pdf'
            })
            
        # Support for Excel reports
        elif report_format == 'excel':
            try:
                excel_bytes, filename, new_report_id = report_generator.generate_excel_report(
                    report_id=report_id,
                    start_date=start_date,
                    end_date=end_date,
                    options=report_options
                )
                
                # Return base64 encoded Excel
                import base64
                excel_base64 = base64.b64encode(excel_bytes).decode('utf-8')
                
                return jsonify({
                    'success': True,
                    'filename': filename,
                    'report_id': new_report_id,
                    'data': excel_base64,
                    'format': 'excel'
                })
            except Exception as e:
                logger.exception(f"Error generating Excel report via API: {str(e)}")
                return jsonify({'error': f'Error generating Excel report: {str(e)}'}), 500
            
        else:
            return jsonify({'error': 'Unsupported format'}), 400
            
    except Exception as e:
        logger.exception(f"Error generating report via API: {str(e)}")
        return jsonify({'error': f'Error generating report: {str(e)}'}), 500

@quality_report_bp.route('/api/details/<int:report_id>', methods=['GET'])
@login_required
def get_report_details(report_id):
    """Get details for a specific report."""
    try:
        # Find the report in the database
        report = DataQualityReport.query.get(report_id)
        if not report:
            return jsonify({'error': 'Report not found'}), 404
            
        # Prepare response with report details
        response = {
            'id': report.id,
            'report_name': report.report_name,
            'created_at': report.created_at.isoformat(),
            'report_type': report.report_type,
            'overall_score': report.overall_score,
            'critical_issues': report.critical_issues,
            'high_issues': report.high_issues,
            'medium_issues': report.medium_issues,
            'low_issues': report.low_issues,
            'start_date': report.start_date.isoformat() if report.start_date else None,
            'end_date': report.end_date.isoformat() if report.end_date else None,
            'summary': {}
        }
        
        # Include summary data if available
        if report.report_data:
            try:
                report_data = report.report_data
                
                # Add summary metrics
                if 'summary' in report_data:
                    response['summary'] = report_data['summary']
                
                # Add table metrics if available
                if 'table_metrics' in report_data:
                    response['table_metrics'] = report_data['table_metrics']
                
                # Add recent anomalies if available
                if 'recent_anomalies' in report_data:
                    response['recent_anomalies'] = report_data['recent_anomalies'][:5]  # Limit to 5 most recent
                
                # Add recommendations if available
                if 'recommendations' in report_data:
                    response['recommendations'] = report_data['recommendations']
            except Exception as e:
                logger.error(f"Error parsing report data: {str(e)}")
                
        return jsonify(response)
    except Exception as e:
        logger.exception(f"Error getting report details: {str(e)}")
        return jsonify({'error': f'Error getting report details: {str(e)}'}), 500

@quality_report_bp.route('/download/<int:report_id>', methods=['GET'])
@login_required
def download_report(report_id):
    """Download a previously generated report by ID."""
    try:
        with app.app_context():
            # Find the report in the database
            report = DataQualityReport.query.get(report_id)
            if not report:
                return jsonify({'error': 'Report not found'}), 404
                
            # Check if the report has a stored file
            if report.report_file_path and os.path.exists(report.report_file_path):
                # Determine the correct mimetype based on report format
                mimetype = 'application/pdf'
                if report.report_format == 'excel':
                    mimetype = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                
                # Return the stored file
                return send_file(
                    report.report_file_path,
                    mimetype=mimetype,
                    as_attachment=True,
                    download_name=os.path.basename(report.report_file_path)
                )
            else:
                # If not stored or file missing, regenerate the report
                start_date = report.start_date
                end_date = report.end_date
                
                # Default options to include everything
                report_options = {
                    'include_anomalies': True,
                    'include_issues': True,
                    'include_recommendations': True
                }
                
                # Generate new report based on the original format
                if report.report_format == 'excel':
                    # Generate Excel
                    excel_bytes, filename, _ = report_generator.generate_excel_report(
                        report_id=report_id,
                        start_date=start_date,
                        end_date=end_date,
                        options=report_options,
                        save_to_db=False  # Don't save duplicate entry
                    )
                    
                    # Return Excel as downloadable attachment
                    response = make_response(excel_bytes)
                    response.headers['Content-Type'] = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                    response.headers['Content-Disposition'] = f'attachment; filename="{filename}"'
                    return response
                else:
                    # Default to PDF
                    pdf_bytes, filename, _ = report_generator.generate_pdf_report(
                        report_id=report_id,
                        start_date=start_date,
                        end_date=end_date,
                        options=report_options,
                        save_to_db=False  # Don't save duplicate entry
                    )
                    
                    # Return PDF as downloadable attachment
                    response = make_response(pdf_bytes)
                    response.headers['Content-Type'] = 'application/pdf'
                    response.headers['Content-Disposition'] = f'attachment; filename="{filename}"'
                    return response
    except Exception as e:
        logger.exception(f"Error downloading report: {str(e)}")
        return jsonify({'error': f'Error downloading report: {str(e)}'}), 500

@quality_report_bp.route('/test-report/<format>', methods=['GET'])
def test_report(format='excel'):
    """
    Test endpoint to generate a report without authentication (for development only).
    
    Args:
        format: 'excel' or 'pdf'
    """
    try:
        # Generate dates for the last 30 days
        end_date = datetime.datetime.now()
        start_date = end_date - datetime.timedelta(days=30)
        
        # Set report options
        report_options = {
            'include_anomalies': True,
            'include_issues': True,
            'include_recommendations': True
        }
        
        # Generate report based on requested format
        if format.lower() == 'excel':
            # Generate Excel report
            report_bytes, filename, report_id = report_generator.generate_excel_report(
                start_date=start_date,
                end_date=end_date,
                options=report_options
            )
            
            # Return Excel as downloadable attachment
            response = make_response(report_bytes)
            response.headers['Content-Type'] = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            response.headers['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
        elif format.lower() == 'pdf':
            # Generate PDF report
            report_bytes, filename, report_id = report_generator.generate_pdf_report(
                start_date=start_date,
                end_date=end_date,
                options=report_options
            )
            
            # Return PDF as downloadable attachment
            response = make_response(report_bytes)
            response.headers['Content-Type'] = 'application/pdf'
            response.headers['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
        else:
            return jsonify({'error': 'Invalid format. Use "excel" or "pdf"'}), 400
            
    except Exception as e:
        logger.exception(f"Error generating test report: {str(e)}")
        return jsonify({'error': f'Error generating test report: {str(e)}'}), 500
        
# Add backward compatibility route
@quality_report_bp.route('/test-excel-report', methods=['GET'])
def test_excel_report():
    """Redirect to test-report/excel for backward compatibility."""
    return test_report('excel')

def register_blueprint(app):
    """Register the blueprint with the app."""
    app.register_blueprint(quality_report_bp)
    logger.info("Quality Report blueprint registered")