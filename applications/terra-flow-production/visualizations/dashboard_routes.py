"""
Real-time Geographic Data Visualization Dashboard Routes

This module provides the web routes and API endpoints for the real-time
geographic data visualization dashboard.
"""

import json
import datetime
import logging
import random
import os
import sys

# Add the parent directory to sys.path to avoid import issues
parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

from flask import Blueprint, render_template, jsonify, request
from sqlalchemy import func, and_, or_, cast, Float, desc
from sqlalchemy.dialects.postgresql import JSONB
from models import db, Property, Anomaly, Assessment, TaxRecord, AnomalyType
from auth import login_required, permission_required

# Configure logger
logger = logging.getLogger(__name__)

# Create blueprint
dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/dashboard')

@dashboard_bp.route('/')
@login_required
def index():
    """Render the dashboard index page."""
    return render_template('visualizations/dashboard.html')

@dashboard_bp.route('/api/dashboard')
@login_required
def dashboard_data():
    """API endpoint for dashboard data.
    
    Returns:
        JSON with properties, anomalies, and statistics
    """
    try:
        # Parse filters from query parameters
        property_type = request.args.get('property_type')
        value_min = request.args.get('value_min', type=float)
        value_max = request.args.get('value_max', type=float)
        
        # Base queries
        property_query = Property.query
        anomaly_query = Anomaly.query.join(Anomaly.property)
        
        # Apply filters
        if property_type and property_type != 'all':
            property_query = property_query.filter(Property.property_type == property_type)
            anomaly_query = anomaly_query.filter(Property.property_type == property_type)
        
        if value_min is not None:
            # Get latest assessment for each property
            latest_assessments = db.session.query(
                Assessment.property_id,
                func.max(Assessment.assessment_date).label('latest_date')
            ).group_by(Assessment.property_id).subquery()
            
            # Join with assessments
            property_query = property_query.join(
                latest_assessments,
                Property.id == latest_assessments.c.property_id
            ).join(
                Assessment,
                and_(
                    Assessment.property_id == latest_assessments.c.property_id,
                    Assessment.assessment_date == latest_assessments.c.latest_date
                )
            ).filter(Assessment.total_value >= value_min)
            
            anomaly_query = anomaly_query.join(
                latest_assessments,
                Property.id == latest_assessments.c.property_id
            ).join(
                Assessment,
                and_(
                    Assessment.property_id == latest_assessments.c.property_id,
                    Assessment.assessment_date == latest_assessments.c.latest_date
                )
            ).filter(Assessment.total_value >= value_min)
        
        if value_max is not None:
            # Only add this join if we haven't already joined for value_min
            if value_min is None:
                # Get latest assessment for each property
                latest_assessments = db.session.query(
                    Assessment.property_id,
                    func.max(Assessment.assessment_date).label('latest_date')
                ).group_by(Assessment.property_id).subquery()
                
                # Join with assessments
                property_query = property_query.join(
                    latest_assessments,
                    Property.id == latest_assessments.c.property_id
                ).join(
                    Assessment,
                    and_(
                        Assessment.property_id == latest_assessments.c.property_id,
                        Assessment.assessment_date == latest_assessments.c.latest_date
                    )
                )
                
                anomaly_query = anomaly_query.join(
                    latest_assessments,
                    Property.id == latest_assessments.c.property_id
                ).join(
                    Assessment,
                    and_(
                        Assessment.property_id == latest_assessments.c.property_id,
                        Assessment.assessment_date == latest_assessments.c.latest_date
                    )
                )
            
            property_query = property_query.filter(Assessment.total_value <= value_max)
            anomaly_query = anomaly_query.filter(Assessment.total_value <= value_max)
        
        # Filter out properties without location
        property_query = property_query.filter(Property.location.isnot(None))
        
        # Limit to most recent anomalies (past 30 days)
        thirty_days_ago = datetime.datetime.utcnow() - datetime.timedelta(days=30)
        anomaly_query = anomaly_query.filter(Anomaly.detected_at >= thirty_days_ago)
        
        # Execute queries
        properties = property_query.limit(1000).all()
        anomalies = anomaly_query.order_by(desc(Anomaly.detected_at)).limit(500).all()
        
        # Calculate statistics
        total_properties = property_query.count()
        total_anomalies = anomaly_query.count()
        
        # Get average property value
        avg_value_query = db.session.query(
            func.avg(Assessment.total_value)
        ).select_from(Assessment).join(
            Property, Assessment.property_id == Property.id
        )
        
        if property_type and property_type != 'all':
            avg_value_query = avg_value_query.filter(Property.property_type == property_type)
        
        avg_value = avg_value_query.scalar() or 0
        
        # Calculate anomaly rate (anomalies per 100 properties)
        anomaly_rate = (total_anomalies / total_properties * 100) if total_properties > 0 else 0
        
        # Prepare the response data
        stats = {
            'total_properties': total_properties,
            'total_anomalies': total_anomalies,
            'average_value': float(avg_value),
            'anomaly_rate': anomaly_rate
        }
        
        # Convert properties to JSON
        property_list = []
        for prop in properties:
            # Get the latest assessment
            assessment = Assessment.query.filter_by(property_id=prop.id).order_by(Assessment.assessment_date.desc()).first()
            
            # Handle the location data properly
            location_data = None
            if prop.location:
                # The location is already a JSONB from PostgreSQL, no need to parse it again
                try:
                    # Just passing the existing dict from JSONB
                    location_data = prop.location
                except Exception as e:
                    logger.error(f"Error processing location data: {str(e)}")
            
            prop_dict = {
                'id': str(prop.id),
                'parcel_id': prop.parcel_id,
                'address': prop.address,
                'property_type': prop.property_type or 'unknown',
                'location': location_data,
                'total_value': float(assessment.total_value) if assessment else 0,
            }
            
            property_list.append(prop_dict)
        
        # Convert anomalies to JSON
        anomaly_list = []
        for anomaly in anomalies:
            anomaly_dict = {
                'id': str(anomaly.id),
                'property_id': str(anomaly.property_id),
                'property_address': anomaly.property.address if anomaly.property else 'Unknown',
                'anomaly_type': anomaly.anomaly_type.name if anomaly.anomaly_type else 'Unknown',
                'severity': anomaly.severity,
                'detected_at': anomaly.detected_at.isoformat(),
                'status': anomaly.status,
                'location': anomaly.property.location if anomaly.property and anomaly.property.location else None
            }
            
            anomaly_list.append(anomaly_dict)
        
        return jsonify({
            'properties': property_list,
            'anomalies': anomaly_list,
            'stats': stats
        })
        
    except Exception as e:
        logger.error(f"Error in dashboard data endpoint: {str(e)}", exc_info=True)
        return jsonify({
            'error': 'An error occurred while fetching dashboard data.',
            'message': str(e)
        }), 500

@dashboard_bp.route('/api/dashboard/trend/<period>')
@login_required
def dashboard_trend(period):
    """API endpoint for anomaly trend data.
    
    Args:
        period: Time period (day, week, month, year)
        
    Returns:
        JSON with trend data
    """
    try:
        now = datetime.datetime.utcnow()
        
        # Determine time range and interval based on period
        if period == 'day':
            start_date = now - datetime.timedelta(days=1)
            interval = 'hour'
            format_string = '%H:%M'
            
            # Generate hourly intervals for the past 24 hours
            intervals = []
            for i in range(24, 0, -1):
                hour_ago = now - datetime.timedelta(hours=i)
                intervals.append(hour_ago)
                
        elif period == 'week':
            start_date = now - datetime.timedelta(weeks=1)
            interval = 'day'
            format_string = '%a'
            
            # Generate daily intervals for the past week
            intervals = []
            for i in range(7, 0, -1):
                day_ago = now - datetime.timedelta(days=i)
                intervals.append(day_ago)
                
        elif period == 'month':
            start_date = now - datetime.timedelta(days=30)
            interval = 'day'
            format_string = '%d %b'
            
            # Generate 5-day intervals for the past month
            intervals = []
            for i in range(30, 0, -5):
                day_ago = now - datetime.timedelta(days=i)
                intervals.append(day_ago)
                
        elif period == 'year':
            start_date = now - datetime.timedelta(days=365)
            interval = 'month'
            format_string = '%b'
            
            # Generate monthly intervals for the past year
            intervals = []
            for i in range(12, 0, -1):
                month_ago = now - datetime.timedelta(days=i*30)
                intervals.append(month_ago)
                
        else:
            return jsonify({'error': 'Invalid period parameter'}), 400
        
        # Query for anomalies in the specified period
        anomalies = Anomaly.query.filter(
            Anomaly.detected_at >= start_date
        ).order_by(Anomaly.detected_at).all()
        
        # Group anomalies by interval
        labels = []
        values = []
        
        for i, interval_start in enumerate(intervals):
            # Determine the end of the current interval
            if i < len(intervals) - 1:
                interval_end = intervals[i+1]
            else:
                if period == 'day':
                    interval_end = now
                elif period == 'week' or period == 'month':
                    interval_end = interval_start + datetime.timedelta(days=1)
                elif period == 'year':
                    interval_end = interval_start + datetime.timedelta(days=30)
            
            # Count anomalies in this interval
            count = sum(1 for a in anomalies if interval_start <= a.detected_at < interval_end)
            
            # Add to lists
            labels.append(interval_start.strftime(format_string))
            values.append(count)
        
        return jsonify({
            'labels': labels,
            'values': values
        })
        
    except Exception as e:
        logger.error(f"Error in dashboard trend endpoint: {str(e)}", exc_info=True)
        return jsonify({
            'error': 'An error occurred while fetching trend data.',
            'message': str(e)
        }), 500

@dashboard_bp.route('/api/dashboard/recent-anomalies')
@login_required
def recent_anomalies():
    """API endpoint for recent anomalies.
    
    Returns:
        JSON list of recent anomalies
    """
    try:
        # Get recent anomalies (past 24 hours)
        yesterday = datetime.datetime.utcnow() - datetime.timedelta(days=1)
        
        anomalies = Anomaly.query.filter(
            Anomaly.detected_at >= yesterday
        ).order_by(
            desc(Anomaly.detected_at)
        ).limit(50).all()
        
        # Convert to JSON
        anomaly_list = []
        for anomaly in anomalies:
            anomaly_dict = {
                'id': str(anomaly.id),
                'property_id': str(anomaly.property_id),
                'property_address': anomaly.property.address if anomaly.property else 'Unknown',
                'anomaly_type': anomaly.anomaly_type.name if anomaly.anomaly_type else 'Unknown',
                'severity': anomaly.severity,
                'detected_at': anomaly.detected_at.isoformat(),
                'status': anomaly.status
            }
            
            anomaly_list.append(anomaly_dict)
        
        return jsonify(anomaly_list)
        
    except Exception as e:
        logger.error(f"Error in recent anomalies endpoint: {str(e)}", exc_info=True)
        return jsonify({
            'error': 'An error occurred while fetching recent anomalies.',
            'message': str(e)
        }), 500

@dashboard_bp.route('/api/properties/<property_id>')
@login_required
def property_details(property_id):
    """API endpoint for property details.
    
    Args:
        property_id: UUID of the property
        
    Returns:
        JSON with property details
    """
    try:
        # Get property
        property = Property.query.get_or_404(property_id)
        
        # Get latest assessment
        assessment = Assessment.query.filter_by(
            property_id=property_id
        ).order_by(
            Assessment.assessment_date.desc()
        ).first()
        
        # Get recent anomalies
        recent_anomalies = Anomaly.query.filter_by(
            property_id=property_id
        ).order_by(
            desc(Anomaly.detected_at)
        ).limit(10).all()
        
        # Convert to dictionary
        property_dict = {
            'id': str(property.id),
            'parcel_id': property.parcel_id,
            'address': property.address,
            'city': property.city,
            'state': property.state,
            'zip_code': property.zip_code,
            'property_type': property.property_type or 'unknown',
            'lot_size': property.lot_size,
            'year_built': property.year_built,
            'bedrooms': property.bedrooms,
            'bathrooms': property.bathrooms,
            'total_area': property.total_area,
            'owner_name': property.owner_name,
            'purchase_date': property.purchase_date.isoformat() if property.purchase_date else None,
            'purchase_price': float(property.purchase_price) if property.purchase_price else None,
            'location': property.location,
            'features': property.features,
        }
        
        # Add assessment data if available
        if assessment:
            property_dict['assessment'] = {
                'assessment_date': assessment.assessment_date.isoformat(),
                'land_value': float(assessment.land_value) if assessment.land_value else 0,
                'improvement_value': float(assessment.improvement_value) if assessment.improvement_value else 0,
                'total_value': float(assessment.total_value) if assessment.total_value else 0,
                'status': assessment.status,
                'valuation_method': assessment.valuation_method
            }
        
        # Add anomalies
        property_dict['anomalies'] = []
        for anomaly in recent_anomalies:
            anomaly_dict = {
                'id': str(anomaly.id),
                'anomaly_type': anomaly.anomaly_type.name if anomaly.anomaly_type else 'Unknown',
                'severity': anomaly.severity,
                'detected_at': anomaly.detected_at.isoformat(),
                'status': anomaly.status,
                'description': anomaly.description
            }
            
            property_dict['anomalies'].append(anomaly_dict)
        
        return jsonify(property_dict)
        
    except Exception as e:
        logger.error(f"Error in property details endpoint: {str(e)}", exc_info=True)
        return jsonify({
            'error': 'An error occurred while fetching property details.',
            'message': str(e)
        }), 500