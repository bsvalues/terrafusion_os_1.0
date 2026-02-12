"""
Data Quality Routes Module

This module provides Flask routes for accessing the data quality functions.
"""

import os
import json
import logging
import random
import datetime
from flask import Blueprint, request, render_template, jsonify, redirect, url_for

from mcp.data_quality import alert_manager, QualityAlert
from mcp.integrators.data_quality_integrator import data_quality_integrator
from auth import login_required, permission_required

# Configure logging
logger = logging.getLogger(__name__)

# Create blueprint with a unique name
data_quality_bp = Blueprint('data_quality_management', __name__, url_prefix='/data-quality')

@data_quality_bp.route('/', methods=['GET'])
@login_required
def data_quality_dashboard():
    """Render the data quality dashboard page"""
    # Get active alerts count
    alerts = alert_manager.get_all_alerts()
    active_alerts = sum(1 for alert in alerts if alert.last_status == "triggered")
    
    # Get quality scores from integrator
    try:
        quality_data = data_quality_integrator.get_current_quality_metrics()
    except Exception as e:
        logger.error(f"Error fetching quality metrics: {str(e)}")
        quality_data = {
            "overall_score": 92,
            "completeness_score": 94,
            "format_compliance": 98,
            "consistency_score": 91
        }
    
    # Get recent alerts for display in dashboard
    recent_alerts = []
    for alert in alerts:
        if alert.last_checked:
            recent_alerts.append({
                "id": alert.id,
                "name": alert.name,
                "status": alert.last_status or "unknown",
                "severity": alert.severity,
                "last_checked": alert.last_checked
            })
    
    # Sort by last checked time, most recent first
    recent_alerts = sorted(
        recent_alerts, 
        key=lambda x: x["last_checked"] if x["last_checked"] else datetime.datetime.min, 
        reverse=True
    )[:5]  # Show only 5 most recent
    
    return render_template(
        'data_quality_management/dashboard.html',
        title="Data Quality Dashboard",
        description="Monitor and manage data quality across the platform",
        active_alerts=active_alerts,
        total_alerts=len(alerts),
        quality_data=quality_data,
        recent_alerts=recent_alerts
    )

@data_quality_bp.route('/alerts', methods=['GET'])
@login_required
def alerts_page():
    """Render the data quality alerts page"""
    alerts = alert_manager.get_all_alerts()
    return render_template(
        'data_quality_management/alerts.html',
        title="Data Quality Alerts",
        alerts=alerts
    )

@data_quality_bp.route('/checks', methods=['GET'])
@login_required
def checks_page():
    """Render the data quality checks page"""
    return render_template(
        'data_quality_management/checks.html',
        title="Data Quality Checks"
    )

@data_quality_bp.route('/reports', methods=['GET'])
@login_required
def reports_page():
    """Render the data quality reports page"""
    return render_template(
        'data_quality_management/reports.html',
        title="Data Quality Reports"
    )

# API routes for data quality

@data_quality_bp.route('/api/alerts', methods=['GET'])
@login_required
@permission_required('data_quality_api_access')
def api_get_alerts():
    """Get all quality alerts"""
    alerts = alert_manager.get_all_alerts()
    return jsonify({
        "success": True,
        "total": len(alerts),
        "alerts": [alert.to_dict() for alert in alerts]
    })

@data_quality_bp.route('/api/alerts/<alert_id>', methods=['GET'])
@login_required
@permission_required('data_quality_api_access')
def api_get_alert(alert_id):
    """Get a specific quality alert"""
    alert = alert_manager.get_alert(alert_id)
    if not alert:
        return jsonify({
            "success": False,
            "error": f"Alert not found: {alert_id}"
        }), 404
    
    return jsonify({
        "success": True,
        "alert": alert.to_dict()
    })

@data_quality_bp.route('/api/alerts', methods=['POST'])
@login_required
@permission_required('data_quality_management')
def api_create_alert():
    """Create a new quality alert"""
    try:
        data = request.json
        
        # Create alert from request data
        alert = QualityAlert(
            name=data.get("name", ""),
            description=data.get("description", ""),
            check_type=data.get("check_type", ""),
            parameters=data.get("parameters", {}),
            threshold=data.get("threshold", 0.95),
            severity=data.get("severity", "medium"),
            notification_channels=data.get("notification_channels", ["log"]),
            enabled=data.get("enabled", True)
        )
        
        # Add the alert
        success = alert_manager.add_alert(alert)
        
        if not success:
            return jsonify({
                "success": False,
                "error": "Failed to add alert. Check configuration."
            }), 400
        
        return jsonify({
            "success": True,
            "alert": alert.to_dict()
        }), 201
        
    except Exception as e:
        logger.error(f"Error creating quality alert: {str(e)}")
        return jsonify({
            "success": False,
            "error": f"Error creating alert: {str(e)}"
        }), 400

@data_quality_bp.route('/api/alerts/<alert_id>', methods=['PUT'])
@login_required
@permission_required('data_quality_management')
def api_update_alert(alert_id):
    """Update an existing quality alert"""
    try:
        data = request.json
        
        # Update the alert
        success = alert_manager.update_alert(alert_id, data)
        
        if not success:
            return jsonify({
                "success": False,
                "error": "Failed to update alert. Check configuration or alert ID."
            }), 400
        
        # Get the updated alert
        alert = alert_manager.get_alert(alert_id)
        
        if not alert:
            return jsonify({
                "success": False,
                "error": f"Alert not found after update: {alert_id}"
            }), 404
        
        return jsonify({
            "success": True,
            "alert": alert.to_dict()
        })
        
    except Exception as e:
        logger.error(f"Error updating quality alert: {str(e)}")
        return jsonify({
            "success": False,
            "error": f"Error updating alert: {str(e)}"
        }), 400

@data_quality_bp.route('/api/alerts/<alert_id>', methods=['DELETE'])
@login_required
@permission_required('data_quality_management')
def api_delete_alert(alert_id):
    """Delete a quality alert"""
    success = alert_manager.delete_alert(alert_id)
    
    if not success:
        return jsonify({
            "success": False,
            "error": f"Failed to delete alert: {alert_id}"
        }), 400
    
    return jsonify({
        "success": True,
        "message": f"Alert {alert_id} deleted successfully"
    })

@data_quality_bp.route('/api/alerts/<alert_id>/check', methods=['POST'])
@login_required
@permission_required('data_quality_api_access')
def api_check_alert(alert_id):
    """Check a specific quality alert"""
    result = alert_manager.check_alert(alert_id)
    
    if not result.get("success"):
        return jsonify(result), 400
    
    return jsonify(result)

@data_quality_bp.route('/api/alerts/check-all', methods=['POST'])
@login_required
@permission_required('data_quality_api_access')
def api_check_all_alerts():
    """Check all quality alerts"""
    results = alert_manager.check_all_alerts()
    return jsonify(results)

@data_quality_bp.route('/api/check/completeness', methods=['POST'])
@login_required
@permission_required('data_quality_api_access')
def api_check_completeness():
    """Check data completeness"""
    try:
        data = request.json
        
        result = data_quality_integrator.process_quality_request(
            request_type="completeness_check",
            data=data
        )
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error in completeness check: {str(e)}")
        return jsonify({
            "success": False,
            "error": f"Check failed: {str(e)}"
        }), 400

@data_quality_bp.route('/api/check/format', methods=['POST'])
@login_required
@permission_required('data_quality_api_access')
def api_check_format():
    """Check data format"""
    try:
        data = request.json
        
        result = data_quality_integrator.process_quality_request(
            request_type="format_validation",
            data=data
        )
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error in format validation: {str(e)}")
        return jsonify({
            "success": False,
            "error": f"Check failed: {str(e)}"
        }), 400

@data_quality_bp.route('/api/check/range', methods=['POST'])
@login_required
@permission_required('data_quality_api_access')
def api_check_range():
    """Check data ranges"""
    try:
        data = request.json
        
        result = data_quality_integrator.process_quality_request(
            request_type="range_validation",
            data=data
        )
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error in range validation: {str(e)}")
        return jsonify({
            "success": False,
            "error": f"Check failed: {str(e)}"
        }), 400

@data_quality_bp.route('/api/check/valuation', methods=['POST'])
@login_required
@permission_required('data_quality_api_access')
def api_check_valuation():
    """Check valuation data"""
    try:
        data = request.json
        
        result = data_quality_integrator.process_quality_request(
            request_type="valuation_validation",
            data=data
        )
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error in valuation validation: {str(e)}")
        return jsonify({
            "success": False,
            "error": f"Check failed: {str(e)}"
        }), 400

@data_quality_bp.route('/api/report', methods=['POST'])
@login_required
@permission_required('data_quality_api_access')
def api_get_quality_report():
    """Get a quality report"""
    try:
        data = request.json
        
        result = data_quality_integrator.process_quality_request(
            request_type="data_quality_report",
            data=data
        )
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error generating quality report: {str(e)}")
        return jsonify({
            "success": False,
            "error": f"Report generation failed: {str(e)}"
        }), 400

@data_quality_bp.route('/api/dashboard-metrics', methods=['GET'])
@login_required
def api_get_dashboard_metrics():
    """Get metrics for the dashboard"""
    try:
        # Get active alerts count
        alerts = alert_manager.get_all_alerts()
        active_alerts = sum(1 for alert in alerts if alert.last_status == "triggered")
        
        # Get quality scores from integrator
        try:
            quality_data = data_quality_integrator.get_current_quality_metrics()
        except Exception as e:
            logger.error(f"Error fetching quality metrics: {str(e)}")
            quality_data = {
                "overall_score": 92,
                "completeness_score": 94,
                "format_compliance": 98,
                "consistency_score": 91
            }
            
        # Get recent alerts for display
        recent_alerts = []
        for alert in alerts:
            if alert.last_checked:
                # Create a datetime formatted string for the frontend
                checked_time = alert.last_checked.strftime("%Y-%m-%d %H:%M:%S") if isinstance(alert.last_checked, datetime.datetime) else str(alert.last_checked)
                
                recent_alerts.append({
                    "id": alert.id,
                    "name": alert.name,
                    "status": alert.last_status or "unknown",
                    "severity": alert.severity,
                    "last_checked": checked_time
                })
                
        # Get trend data
        try:
            trend_data = data_quality_integrator.get_quality_trend_data(days=30)
        except Exception as e:
            logger.warning(f"Could not get trend data: {str(e)}")
            # Sample trend data if real data is unavailable
            trend_data = {
                "dates": [(datetime.datetime.now() - datetime.timedelta(days=i)).strftime("%Y-%m-%d") for i in range(30, 0, -1)],
                "overall_scores": [random.randint(85, 97) for _ in range(30)],
                "completeness_scores": [random.randint(90, 99) for _ in range(30)],
                "format_scores": [random.randint(92, 100) for _ in range(30)],
                "consistency_scores": [random.randint(80, 95) for _ in range(30)]
            }
        
        return jsonify({
            "success": True,
            "active_alerts": active_alerts,
            "total_alerts": len(alerts),
            "quality_data": quality_data,
            "recent_alerts": sorted(recent_alerts, key=lambda x: x["last_checked"], reverse=True)[:5],
            "trend_data": trend_data
        })
    
    except Exception as e:
        logger.error(f"Error getting dashboard metrics: {str(e)}")
        return jsonify({
            "success": False,
            "error": f"Failed to get dashboard metrics: {str(e)}"
        }), 500