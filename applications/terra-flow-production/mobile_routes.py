"""
Mobile Routes Module for GeoAssessmentPro

This module contains the routes for the mobile interface of the GeoAssessmentPro application.
It provides a responsive, touch-friendly interface optimized for mobile devices.
"""

import os
import json
import datetime
from typing import Dict, List, Any, Optional

import flask
from flask import render_template, request, jsonify, redirect, url_for, flash, session
from flask_login import login_required, current_user

from auth import permission_required
from models import Property, Assessment, Anomaly, AnomalyType, User, Role, UserRole
from app import db


def register_mobile_routes(app):
    """Register all mobile routes with the Flask app"""
    
    @app.route('/mobile')
    @app.route('/mobile/')
    @login_required
    def mobile_index():
        """Mobile dashboard view"""
        # Count properties, anomalies, and users
        property_count = Property.query.count()
        anomaly_count = Anomaly.query.count()
        user_count = User.query.count()
        
        # Get recent anomalies
        recent_anomalies = Anomaly.query.order_by(Anomaly.detected_at.desc()).limit(5).all()
        
        # Get anomaly counts by type
        anomaly_types = db.session.query(
            AnomalyType.name, 
            db.func.count(Anomaly.id)
        ).join(
            Anomaly, 
            Anomaly.type_id == AnomalyType.id
        ).group_by(
            AnomalyType.name
        ).all()
        
        anomaly_type_counts = {name: count for name, count in anomaly_types}
        
        # Get property value trend
        value_data = db.session.query(
            db.func.date_trunc('month', Assessment.assessment_date).label('month'),
            db.func.avg(Assessment.assessed_value).label('avg_value')
        ).group_by(
            'month'
        ).order_by(
            'month'
        ).limit(6).all()
        
        value_trend = {
            'labels': [item.month.strftime('%b %Y') for item in value_data],
            'values': [float(item.avg_value) for item in value_data]
        }
        
        return render_template(
            'mobile/index.html',
            property_count=property_count,
            anomaly_count=anomaly_count,
            user_count=user_count,
            recent_anomalies=recent_anomalies,
            anomaly_type_counts=anomaly_type_counts,
            value_trend=value_trend
        )
    
    @app.route('/mobile/properties')
    @login_required
    def mobile_properties():
        """Mobile properties view"""
        # Get query parameters for filtering
        property_type = request.args.get('type', None)
        min_value = request.args.get('min_value', None)
        max_value = request.args.get('max_value', None)
        
        # Start with base query
        query = Property.query
        
        # Apply filters if provided
        if property_type:
            query = query.filter(Property.property_type == property_type)
        
        # Get the latest assessment for each property
        properties = query.all()
        
        # Filter by value if needed (requires assessment join)
        if min_value or max_value:
            filtered_properties = []
            for prop in properties:
                # Get latest assessment
                latest_assessment = Assessment.query.filter(
                    Assessment.property_id == prop.id
                ).order_by(
                    Assessment.assessment_date.desc()
                ).first()
                
                if not latest_assessment:
                    continue
                
                # Apply value filters
                if min_value and latest_assessment.assessed_value < float(min_value):
                    continue
                if max_value and latest_assessment.assessed_value > float(max_value):
                    continue
                
                filtered_properties.append(prop)
            
            properties = filtered_properties
        
        # Get property types for the filter dropdown
        property_types = db.session.query(
            Property.property_type
        ).distinct().all()
        
        property_types = [p[0] for p in property_types if p[0]]
        
        return render_template(
            'mobile/properties.html',
            properties=properties,
            property_types=property_types,
            current_type=property_type
        )
    
    @app.route('/mobile/property/<property_id>')
    @login_required
    def mobile_property_detail(property_id):
        """Mobile property detail view"""
        property_obj = Property.query.get_or_404(property_id)
        
        # Get assessments for this property
        assessments = Assessment.query.filter(
            Assessment.property_id == property_id
        ).order_by(
            Assessment.assessment_date.desc()
        ).all()
        
        # Get anomalies for this property
        anomalies = Anomaly.query.filter(
            Anomaly.property_id == property_id
        ).order_by(
            Anomaly.detected_at.desc()
        ).all()
        
        # Format assessment data for charts
        assessment_dates = [a.assessment_date.strftime('%b %Y') for a in assessments]
        assessment_values = [float(a.assessed_value) for a in assessments]
        
        # Reverse the lists because we're displaying the chart in chronological order
        assessment_dates.reverse()
        assessment_values.reverse()
        
        return render_template(
            'mobile/property_detail.html',
            property=property_obj,
            assessments=assessments,
            anomalies=anomalies,
            assessment_dates=json.dumps(assessment_dates),
            assessment_values=json.dumps(assessment_values)
        )
    
    @app.route('/mobile/anomalies')
    @login_required
    def mobile_anomalies():
        """Mobile anomalies view"""
        # Get query parameters for filtering
        anomaly_type = request.args.get('type', None)
        severity = request.args.get('severity', None)
        status = request.args.get('status', None)
        
        # Start with base query
        query = Anomaly.query
        
        # Apply filters if provided
        if anomaly_type:
            anomaly_type_obj = AnomalyType.query.filter(AnomalyType.name == anomaly_type).first()
            if anomaly_type_obj:
                query = query.filter(Anomaly.type_id == anomaly_type_obj.id)
        
        if severity:
            query = query.filter(Anomaly.severity == severity)
        
        if status:
            query = query.filter(Anomaly.status == status)
        
        # Get anomalies with applied filters
        anomalies = query.order_by(Anomaly.detected_at.desc()).all()
        
        # Get anomaly types for the filter dropdown
        anomaly_types = AnomalyType.query.all()
        
        return render_template(
            'mobile/anomalies.html',
            anomalies=anomalies,
            anomaly_types=anomaly_types,
            current_type=anomaly_type,
            current_severity=severity,
            current_status=status
        )
    
    @app.route('/mobile/anomaly/<anomaly_id>')
    @login_required
    def mobile_anomaly_detail(anomaly_id):
        """Mobile anomaly detail view"""
        anomaly = Anomaly.query.get_or_404(anomaly_id)
        
        # Get the property associated with this anomaly
        property_obj = Property.query.get(anomaly.property_id) if anomaly.property_id else None
        
        # Get anomaly type
        anomaly_type = AnomalyType.query.get(anomaly.type_id) if anomaly.type_id else None
        
        return render_template(
            'mobile/anomaly_detail.html',
            anomaly=anomaly,
            property=property_obj,
            anomaly_type=anomaly_type
        )
    
    @app.route('/mobile/search')
    @login_required
    def mobile_search():
        """Mobile search view"""
        # Get search query
        query = request.args.get('q', '')
        
        # Get filter parameters
        property_type = request.args.get('property_type', None)
        min_value = request.args.get('min_value', None)
        max_value = request.args.get('max_value', None)
        min_date = request.args.get('min_date', None)
        max_date = request.args.get('max_date', None)
        anomaly_type = request.args.get('anomaly_type', None)
        anomaly_severity = request.args.get('anomaly_severity', None)
        
        return render_template(
            'mobile/search.html',
            query=query
        )
    
    @app.route('/mobile/settings')
    @login_required
    def mobile_settings():
        """Mobile settings view"""
        return render_template('mobile/settings.html')
    
    @app.route('/mobile/api/properties')
    @login_required
    def mobile_api_properties():
        """Mobile API to get properties with filters"""
        # Get query parameters for filtering
        property_type = request.args.get('type', None)
        min_value = request.args.get('min_value', None)
        max_value = request.args.get('max_value', None)
        limit = request.args.get('limit', 50)
        offset = request.args.get('offset', 0)
        
        # Start with base query
        query = db.session.query(
            Property.id,
            Property.parcel_id,
            Property.address,
            Property.property_type,
            Property.owner_name,
            db.func.ST_AsGeoJSON(Property.geometry).label('geometry')
        )
        
        # Apply filters if provided
        if property_type:
            query = query.filter(Property.property_type == property_type)
        
        # Apply pagination
        query = query.limit(limit).offset(offset)
        
        # Execute the query
        properties = query.all()
        
        # Convert to list of dictionaries
        result = []
        for p in properties:
            prop_dict = {
                'id': p.id,
                'parcel_id': p.parcel_id,
                'address': p.address,
                'property_type': p.property_type,
                'owner_name': p.owner_name,
                'geometry': json.loads(p.geometry) if p.geometry else None
            }
            
            # Get latest assessment
            latest_assessment = Assessment.query.filter(
                Assessment.property_id == p.id
            ).order_by(
                Assessment.assessment_date.desc()
            ).first()
            
            if latest_assessment:
                prop_dict['assessed_value'] = float(latest_assessment.assessed_value)
                prop_dict['assessment_date'] = latest_assessment.assessment_date.isoformat()
            
            # Apply value filters
            if min_value and (
                'assessed_value' not in prop_dict or 
                prop_dict['assessed_value'] < float(min_value)
            ):
                continue
            
            if max_value and (
                'assessed_value' not in prop_dict or 
                prop_dict['assessed_value'] > float(max_value)
            ):
                continue
            
            result.append(prop_dict)
        
        # Return JSON response
        return jsonify({
            'count': len(result),
            'properties': result
        })
    
    @app.route('/mobile/api/anomalies')
    @login_required
    def mobile_api_anomalies():
        """Mobile API to get anomalies with filters"""
        # Get query parameters for filtering
        anomaly_type = request.args.get('type', None)
        severity = request.args.get('severity', None)
        status = request.args.get('status', None)
        limit = request.args.get('limit', 50)
        offset = request.args.get('offset', 0)
        
        # Start with base query
        query = db.session.query(
            Anomaly.id,
            Anomaly.description,
            Anomaly.severity,
            Anomaly.status,
            Anomaly.detected_at,
            Anomaly.property_id,
            AnomalyType.name.label('type_name')
        ).join(
            AnomalyType,
            Anomaly.type_id == AnomalyType.id
        )
        
        # Apply filters if provided
        if anomaly_type:
            query = query.filter(AnomalyType.name == anomaly_type)
        
        if severity:
            query = query.filter(Anomaly.severity == severity)
        
        if status:
            query = query.filter(Anomaly.status == status)
        
        # Apply pagination
        query = query.limit(limit).offset(offset)
        
        # Execute the query
        anomalies = query.all()
        
        # Convert to list of dictionaries
        result = []
        for a in anomalies:
            # Get property information
            property_info = None
            if a.property_id:
                prop = Property.query.get(a.property_id)
                if prop:
                    property_info = {
                        'id': prop.id,
                        'parcel_id': prop.parcel_id,
                        'address': prop.address,
                        'property_type': prop.property_type
                    }
            
            anomaly_dict = {
                'id': a.id,
                'description': a.description,
                'severity': a.severity,
                'status': a.status,
                'detected_at': a.detected_at.isoformat(),
                'type': a.type_name,
                'property': property_info
            }
            
            result.append(anomaly_dict)
        
        # Return JSON response
        return jsonify({
            'count': len(result),
            'anomalies': result
        })
    
    @app.route('/mobile/api/map/anomalies')
    @login_required
    def mobile_api_map_anomalies():
        """Mobile API to get anomalies for map visualization"""
        # Get query parameters for filtering
        anomaly_type = request.args.get('type', None)
        severity = request.args.get('severity', None)
        bounds = request.args.get('bounds', None)
        
        # Parse bounds if provided (format: "minLng,minLat,maxLng,maxLat")
        if bounds:
            try:
                min_lng, min_lat, max_lng, max_lat = map(float, bounds.split(','))
                bounds_wkt = f"POLYGON(({min_lng} {min_lat}, {max_lng} {min_lat}, {max_lng} {max_lat}, {min_lng} {max_lat}, {min_lng} {min_lat}))"
            except:
                bounds = None
        
        # Start with base query joining anomalies to properties
        query = db.session.query(
            Anomaly.id,
            Anomaly.description,
            Anomaly.severity,
            Anomaly.detected_at,
            Property.id.label('property_id'),
            Property.address,
            Property.parcel_id,
            AnomalyType.name.label('type_name'),
            db.func.ST_AsGeoJSON(Property.geometry).label('geometry')
        ).join(
            Property,
            Anomaly.property_id == Property.id
        ).join(
            AnomalyType,
            Anomaly.type_id == AnomalyType.id
        )
        
        # Apply filters if provided
        if anomaly_type:
            query = query.filter(AnomalyType.name == anomaly_type)
        
        if severity:
            query = query.filter(Anomaly.severity == severity)
        
        if bounds:
            # Filter properties within the map bounds
            bounds_geom = db.func.ST_GeomFromText(bounds_wkt, 4326)
            query = query.filter(db.func.ST_Intersects(Property.geometry, bounds_geom))
        
        # Execute the query
        anomalies = query.all()
        
        # Convert to GeoJSON format
        features = []
        for a in anomalies:
            if not a.geometry:
                continue
                
            geometry = json.loads(a.geometry)
            
            # Create feature
            feature = {
                'type': 'Feature',
                'geometry': geometry,
                'properties': {
                    'id': a.id,
                    'description': a.description,
                    'severity': a.severity,
                    'detected_at': a.detected_at.isoformat(),
                    'property_id': a.property_id,
                    'address': a.address,
                    'parcel_id': a.parcel_id,
                    'type': a.type_name
                }
            }
            
            features.append(feature)
        
        geojson = {
            'type': 'FeatureCollection',
            'features': features
        }
        
        # Return GeoJSON response
        return jsonify(geojson)
    
    @app.route('/mobile/api/map/properties')
    @login_required
    def mobile_api_map_properties():
        """Mobile API to get properties for map visualization"""
        # Get query parameters for filtering
        property_type = request.args.get('type', None)
        bounds = request.args.get('bounds', None)
        
        # Parse bounds if provided (format: "minLng,minLat,maxLng,maxLat")
        if bounds:
            try:
                min_lng, min_lat, max_lng, max_lat = map(float, bounds.split(','))
                bounds_wkt = f"POLYGON(({min_lng} {min_lat}, {max_lng} {min_lat}, {max_lng} {max_lat}, {min_lng} {max_lat}, {min_lng} {min_lat}))"
            except:
                bounds = None
        
        # Start with base query
        query = db.session.query(
            Property.id,
            Property.parcel_id,
            Property.address,
            Property.property_type,
            Property.owner_name,
            db.func.ST_AsGeoJSON(Property.geometry).label('geometry')
        )
        
        # Apply filters if provided
        if property_type:
            query = query.filter(Property.property_type == property_type)
        
        if bounds:
            # Filter properties within the map bounds
            bounds_geom = db.func.ST_GeomFromText(bounds_wkt, 4326)
            query = query.filter(db.func.ST_Intersects(Property.geometry, bounds_geom))
        else:
            # Limit to 100 properties if no bounds provided
            query = query.limit(100)
        
        # Execute the query
        properties = query.all()
        
        # Convert to GeoJSON format
        features = []
        for p in properties:
            if not p.geometry:
                continue
                
            geometry = json.loads(p.geometry)
            
            # Get latest assessment
            latest_assessment = Assessment.query.filter(
                Assessment.property_id == p.id
            ).order_by(
                Assessment.assessment_date.desc()
            ).first()
            
            assessed_value = None
            assessment_date = None
            if latest_assessment:
                assessed_value = float(latest_assessment.assessed_value)
                assessment_date = latest_assessment.assessment_date.isoformat()
            
            # Create feature
            feature = {
                'type': 'Feature',
                'geometry': geometry,
                'properties': {
                    'id': p.id,
                    'parcel_id': p.parcel_id,
                    'address': p.address,
                    'property_type': p.property_type,
                    'owner_name': p.owner_name,
                    'assessed_value': assessed_value,
                    'assessment_date': assessment_date
                }
            }
            
            features.append(feature)
        
        geojson = {
            'type': 'FeatureCollection',
            'features': features
        }
        
        # Return GeoJSON response
        return jsonify(geojson)
    
    @app.route('/mobile/api/dashboard/stats')
    @login_required
    def mobile_api_dashboard_stats():
        """Mobile API to get dashboard statistics"""
        # Count properties, anomalies, and users
        property_count = Property.query.count()
        anomaly_count = Anomaly.query.count()
        user_count = User.query.count()
        
        # Get anomaly counts by type
        anomaly_types = db.session.query(
            AnomalyType.name, 
            db.func.count(Anomaly.id)
        ).join(
            Anomaly, 
            Anomaly.type_id == AnomalyType.id
        ).group_by(
            AnomalyType.name
        ).all()
        
        anomaly_type_counts = {name: count for name, count in anomaly_types}
        
        # Get property value trend
        value_data = db.session.query(
            db.func.date_trunc('month', Assessment.assessment_date).label('month'),
            db.func.avg(Assessment.assessed_value).label('avg_value')
        ).group_by(
            'month'
        ).order_by(
            'month'
        ).limit(6).all()
        
        value_trend = {
            'labels': [item.month.strftime('%b %Y') for item in value_data],
            'values': [float(item.avg_value) for item in value_data]
        }
        
        # Get recent anomalies
        recent_anomalies = []
        for anomaly in Anomaly.query.order_by(Anomaly.detected_at.desc()).limit(5).all():
            # Get property information
            property_info = None
            if anomaly.property_id:
                prop = Property.query.get(anomaly.property_id)
                if prop:
                    property_info = {
                        'id': prop.id,
                        'parcel_id': prop.parcel_id,
                        'address': prop.address
                    }
            
            # Get anomaly type
            anomaly_type = AnomalyType.query.get(anomaly.type_id)
            type_name = anomaly_type.name if anomaly_type else "Unknown"
            
            recent_anomalies.append({
                'id': anomaly.id,
                'description': anomaly.description,
                'severity': anomaly.severity,
                'detected_at': anomaly.detected_at.isoformat(),
                'type': type_name,
                'property': property_info
            })
        
        # Return statistics
        return jsonify({
            'counts': {
                'properties': property_count,
                'anomalies': anomaly_count,
                'users': user_count
            },
            'anomaly_types': anomaly_type_counts,
            'value_trend': value_trend,
            'recent_anomalies': recent_anomalies
        })
    
    # Return the route functions to make them available for testing
    return {
        'mobile_index': mobile_index,
        'mobile_properties': mobile_properties,
        'mobile_property_detail': mobile_property_detail,
        'mobile_anomalies': mobile_anomalies,
        'mobile_anomaly_detail': mobile_anomaly_detail,
        'mobile_search': mobile_search,
        'mobile_settings': mobile_settings,
        'mobile_api_properties': mobile_api_properties,
        'mobile_api_anomalies': mobile_api_anomalies,
        'mobile_api_map_anomalies': mobile_api_map_anomalies,
        'mobile_api_map_properties': mobile_api_map_properties,
        'mobile_api_dashboard_stats': mobile_api_dashboard_stats
    }