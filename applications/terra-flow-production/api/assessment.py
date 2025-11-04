"""
Assessment API Blueprint

This module provides API endpoints for assessment map data visualization.
"""

import uuid
import logging
import json
from datetime import datetime, date
from decimal import Decimal
import random
from typing import Dict, List, Any, Optional, Tuple, Union

from flask import Blueprint, jsonify, request, current_app
from sqlalchemy import func, desc, asc
from shapely.geometry import Point, shape
import geopandas as gpd

from app import db
from auth import permission_required
from models import Property, Assessment, TaxRecord

# Configure logging
logger = logging.getLogger(__name__)

# Create blueprint
assessment_bp = Blueprint('assessment_api', __name__, url_prefix='/api/assessment')

# Custom JSON encoder for handling dates and UUID objects
class AssessmentJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (date, datetime)):
            return obj.isoformat()
        elif isinstance(obj, Decimal):
            return float(obj)
        elif isinstance(obj, uuid.UUID):
            return str(obj)
        return json.JSONEncoder.default(self, obj)

# Routes
@assessment_bp.route('/properties', methods=['GET'])
def get_properties():
    """Get all properties with assessment data"""
    try:
        # Get query parameters
        search = request.args.get('search', '')
        limit = int(request.args.get('limit', 100))
        offset = int(request.args.get('offset', 0))
        
        # Query database
        query = db.session.query(Property).order_by(Property.address)
        
        # Apply search filter if provided
        if search:
            query = query.filter(
                db.or_(
                    Property.address.ilike(f'%{search}%'),
                    Property.parcel_id.ilike(f'%{search}%'),
                    Property.owner_name.ilike(f'%{search}%')
                )
            )
        
        # Get total count (for pagination)
        total_count = query.count()
        
        # Apply limit and offset
        properties = query.limit(limit).offset(offset).all()
        
        # Transform to list of dictionaries
        result = []
        for prop in properties:
            # Get the latest assessment for the property
            latest_assessment = Assessment.query.filter_by(property_id=prop.id).order_by(Assessment.assessment_date.desc()).first()
            
            # Calculate assessed value
            assessed_value = latest_assessment.total_value if latest_assessment else None
            
            # Get property location coordinates
            lat, lng = None, None
            if prop.location and prop.location.get('coordinates'):
                lng, lat = prop.location.get('coordinates')
            
            # Create property object
            property_data = {
                'id': str(prop.id),
                'parcel_id': prop.parcel_id,
                'address': prop.address,
                'city': prop.city,
                'state': prop.state,
                'zip_code': prop.zip_code,
                'property_type': prop.property_type,
                'assessed_value': float(assessed_value) if assessed_value else None,
                'lat': lat,
                'lng': lng
            }
            
            result.append(property_data)
        
        return jsonify({
            'success': True,
            'properties': result,
            'total_count': total_count,
            'limit': limit,
            'offset': offset
        })
    except Exception as e:
        logger.error(f"Error getting properties: {str(e)}")
        return jsonify({
            'success': False,
            'message': f"Error getting properties: {str(e)}"
        }), 500

@assessment_bp.route('/properties/<property_id>', methods=['GET'])
def get_property(property_id):
    """Get property details by ID"""
    try:
        # Query database
        prop = Property.query.get(property_id)
        
        if not prop:
            # In demo mode, generate mock property data
            if request.args.get('demo') == 'true':
                return get_demo_property(property_id)
            
            return jsonify({
                'success': False,
                'message': 'Property not found'
            }), 404
        
        # Get the latest assessment for the property
        latest_assessment = Assessment.query.filter_by(property_id=prop.id).order_by(Assessment.assessment_date.desc()).first()
        
        # Create property object
        property_data = {
            'id': str(prop.id),
            'parcel_id': prop.parcel_id,
            'address': prop.address,
            'city': prop.city,
            'state': prop.state,
            'zip_code': prop.zip_code,
            'property_type': prop.property_type,
            'lot_size': prop.lot_size,
            'year_built': prop.year_built,
            'bedrooms': prop.bedrooms,
            'bathrooms': prop.bathrooms,
            'total_area': prop.total_area,
            'owner_name': prop.owner_name,
            'owner_address': prop.owner_address,
            'purchase_date': prop.purchase_date,
            'purchase_price': prop.purchase_price,
            'assessed_value': latest_assessment.total_value if latest_assessment else None,
            'location': prop.location,
            'features': prop.features,
            'property_metadata': prop.property_metadata
        }
        
        return jsonify({
            'success': True,
            'property': property_data
        })
    except Exception as e:
        logger.error(f"Error getting property: {str(e)}")
        return jsonify({
            'success': False,
            'message': f"Error getting property: {str(e)}"
        }), 500

@assessment_bp.route('/valuation/<property_id>', methods=['GET'])
def get_valuation_history(property_id):
    """Get valuation history for a property"""
    try:
        # Query database
        property_exists = Property.query.get(property_id) is not None
        
        if not property_exists:
            # In demo mode, generate mock valuation history
            if request.args.get('demo') == 'true':
                return get_demo_valuation_history(property_id)
            
            return jsonify({
                'success': False,
                'message': 'Property not found'
            }), 404
        
        # Get assessments for the property
        assessments = Assessment.query.filter_by(property_id=property_id).order_by(Assessment.assessment_date.asc()).all()
        
        # Transform to list of dictionaries
        result = []
        for assessment in assessments:
            year = assessment.assessment_date.year
            
            valuation_data = {
                'year': year,
                'assessed_value': float(assessment.total_value) if assessment.total_value else None,
                'land_value': float(assessment.land_value) if assessment.land_value else None,
                'improvement_value': float(assessment.improvement_value) if assessment.improvement_value else None
            }
            
            result.append(valuation_data)
        
        return jsonify({
            'success': True,
            'valuation_history': result
        })
    except Exception as e:
        logger.error(f"Error getting valuation history: {str(e)}")
        return jsonify({
            'success': False,
            'message': f"Error getting valuation history: {str(e)}"
        }), 500

@assessment_bp.route('/comparable-properties/<property_id>', methods=['GET'])
def get_comparable_properties(property_id):
    """Get comparable properties for a given property"""
    try:
        # Query database
        prop = Property.query.get(property_id)
        
        if not prop:
            # In demo mode, generate mock comparable properties
            if request.args.get('demo') == 'true':
                return get_demo_comparable_properties(property_id)
            
            return jsonify({
                'success': False,
                'message': 'Property not found'
            }), 404
        
        # Find properties with similar characteristics
        similar_props = Property.query.filter(
            Property.id != property_id,
            Property.property_type == prop.property_type,
            Property.city == prop.city
        ).limit(5).all()
        
        # Transform to list of dictionaries
        result = []
        for similar_prop in similar_props:
            # Get the latest assessment for the property
            latest_assessment = Assessment.query.filter_by(property_id=similar_prop.id).order_by(Assessment.assessment_date.desc()).first()
            
            # Calculate assessed value
            assessed_value = latest_assessment.total_value if latest_assessment else None
            
            # Create property object
            property_data = {
                'id': str(similar_prop.id),
                'parcel_id': similar_prop.parcel_id,
                'address': similar_prop.address,
                'city': similar_prop.city,
                'property_type': similar_prop.property_type,
                'lot_size': similar_prop.lot_size,
                'year_built': similar_prop.year_built,
                'assessed_value': float(assessed_value) if assessed_value else None,
            }
            
            result.append(property_data)
        
        return jsonify({
            'success': True,
            'comparable_properties': result
        })
    except Exception as e:
        logger.error(f"Error getting comparable properties: {str(e)}")
        return jsonify({
            'success': False,
            'message': f"Error getting comparable properties: {str(e)}"
        }), 500

@assessment_bp.route('/spatial-query', methods=['POST'])
def spatial_query():
    """Perform a spatial query for properties"""
    try:
        data = request.json
        
        # Get query parameters
        bounds = data.get('bounds', {})
        property_type = data.get('property_type')
        
        # Extract bounds coordinates
        north = bounds.get('north')
        south = bounds.get('south')
        east = bounds.get('east')
        west = bounds.get('west')
        
        if not all([north, south, east, west]):
            return jsonify({
                'success': False,
                'message': 'Invalid bounds parameters'
            }), 400
        
        # Query database for properties within bounds
        # This is a simplified approach using PostgreSQL's jsonb functions
        # For production, use PostGIS for more efficient spatial queries
        properties = Property.query.filter(
            func.json_extract_path_text(Property.location, 'coordinates', '0').cast(db.Float) >= west,
            func.json_extract_path_text(Property.location, 'coordinates', '0').cast(db.Float) <= east,
            func.json_extract_path_text(Property.location, 'coordinates', '1').cast(db.Float) >= south,
            func.json_extract_path_text(Property.location, 'coordinates', '1').cast(db.Float) <= north
        )
        
        # Filter by property type if provided
        if property_type:
            properties = properties.filter(Property.property_type == property_type)
        
        # Apply limit
        properties = properties.limit(100).all()
        
        # Transform to list of dictionaries
        result = []
        for prop in properties:
            # Get the latest assessment for the property
            latest_assessment = Assessment.query.filter_by(property_id=prop.id).order_by(Assessment.assessment_date.desc()).first()
            
            # Calculate assessed value
            assessed_value = latest_assessment.total_value if latest_assessment else None
            
            # Get property location coordinates
            lat, lng = None, None
            if prop.location and prop.location.get('coordinates'):
                lng, lat = prop.location.get('coordinates')
            
            # Create property object
            property_data = {
                'id': str(prop.id),
                'parcel_id': prop.parcel_id,
                'address': prop.address,
                'property_type': prop.property_type,
                'assessed_value': float(assessed_value) if assessed_value else None,
                'lat': lat,
                'lng': lng
            }
            
            result.append(property_data)
        
        return jsonify({
            'success': True,
            'properties': result,
            'total_count': len(result)
        })
    except Exception as e:
        logger.error(f"Error performing spatial query: {str(e)}")
        return jsonify({
            'success': False,
            'message': f"Error performing spatial query: {str(e)}"
        }), 500

# Helper functions for demo mode
def get_demo_property(property_id):
    """Generate a demo property for testing"""
    property_types = {
        '1': 'residential',
        '2': 'residential',
        '3': 'commercial',
        '4': 'agricultural'
    }
    
    property_type = property_types.get(property_id, 'residential')
    
    # Generate mock property data based on property type
    if property_type == 'residential':
        return jsonify({
            'success': True,
            'property': {
                'id': property_id,
                'parcel_id': f'R{property_id}12345',
                'address': f'{property_id}23 Main St',
                'city': 'Kennewick',
                'state': 'WA',
                'zip_code': '99336',
                'property_type': 'residential',
                'lot_size': 8500.0,
                'year_built': 1995,
                'bedrooms': 3,
                'bathrooms': 2.0,
                'total_area': 2100.0,
                'owner_name': 'John Smith',
                'owner_address': '789 Oak Ave',
                'purchase_date': '2015-06-15',
                'purchase_price': 285000.0,
                'assessed_value': 320000.0,
                'location': {
                    'type': 'Point',
                    'coordinates': [-119.210, 46.226]
                },
                'features': {
                    'bedrooms': 3,
                    'bathrooms': 2,
                    'garage': '2 car attached',
                    'amenities': ['Fireplace', 'Deck']
                },
                'property_metadata': {
                    'zoning': 'R1 - Residential',
                    'school_district': 'Kennewick School District',
                    'flood_zone': 'None'
                }
            }
        })
    elif property_type == 'commercial':
        return jsonify({
            'success': True,
            'property': {
                'id': property_id,
                'parcel_id': f'C{property_id}12345',
                'address': f'{property_id}89 Commerce Blvd',
                'city': 'Kennewick',
                'state': 'WA',
                'zip_code': '99336',
                'property_type': 'commercial',
                'lot_size': 25000.0,
                'year_built': 2000,
                'total_area': 15000.0,
                'owner_name': 'Tri-Cities Properties LLC',
                'owner_address': '100 Business Plaza',
                'purchase_date': '2010-08-10',
                'purchase_price': 950000.0,
                'assessed_value': 1250000.0,
                'location': {
                    'type': 'Point',
                    'coordinates': [-119.235, 46.215]
                },
                'features': {
                    'building_type': 'Retail',
                    'building_area': 15000,
                    'parking_spaces': 50,
                    'amenities': ['Corner Lot', 'Highway Access']
                },
                'property_metadata': {
                    'zoning': 'C1 - Commercial',
                    'property_class': 'B',
                    'flood_zone': 'None'
                }
            }
        })
    else:  # agricultural
        return jsonify({
            'success': True,
            'property': {
                'id': property_id,
                'parcel_id': f'A{property_id}12345',
                'address': f'{property_id}00 Farm Rd',
                'city': 'Prosser',
                'state': 'WA',
                'zip_code': '99350',
                'property_type': 'agricultural',
                'lot_size': 2000000.0,
                'year_built': 1975,
                'owner_name': 'Washington Wine Growers',
                'owner_address': '300 Farm Road',
                'purchase_date': '2005-03-15',
                'purchase_price': 680000.0,
                'assessed_value': 780000.0,
                'location': {
                    'type': 'Point',
                    'coordinates': [-119.310, 46.180]
                },
                'features': {
                    'land_type': 'Vineyard',
                    'water_rights': True,
                    'acres': 45.9,
                    'amenities': ['Irrigation', 'Outbuildings']
                },
                'property_metadata': {
                    'zoning': 'AG - Agricultural',
                    'flood_zone': 'None'
                }
            }
        })

def get_demo_valuation_history(property_id):
    """Generate demo valuation history for testing"""
    # Generate random valuation history for the last 5 years
    current_year = datetime.now().year
    history = []
    
    # Base value depends on property ID
    base_value = 300000 if property_id == '1' else 400000 if property_id == '2' else 1000000 if property_id == '3' else 700000
    
    for year in range(current_year - 4, current_year + 1):
        # Add some variation to the values
        year_factor = (year - (current_year - 4)) / 4  # 0.0 to 1.0
        total_value = base_value * (1 + year_factor * 0.2)  # 0% to 20% increase
        
        # Add some random variation
        total_value *= (1 + (random.random() - 0.5) * 0.1)  # -5% to +5% variation
        
        # Split into land and improvement values
        if property_id == '3':  # Commercial
            land_ratio = 0.25
        elif property_id == '4':  # Agricultural
            land_ratio = 0.8
        else:  # Residential
            land_ratio = 0.3
            
        land_value = total_value * land_ratio
        improvement_value = total_value - land_value
        
        history.append({
            'year': year,
            'assessed_value': round(total_value),
            'land_value': round(land_value),
            'improvement_value': round(improvement_value)
        })
    
    return jsonify({
        'success': True,
        'valuation_history': history
    })

def get_demo_comparable_properties(property_id):
    """Generate demo comparable properties for testing"""
    property_types = {
        '1': 'residential',
        '2': 'residential',
        '3': 'commercial',
        '4': 'agricultural'
    }
    
    property_type = property_types.get(property_id, 'residential')
    
    # Generate mock comparable properties based on property type
    comparables = []
    
    if property_type == 'residential':
        comparables = [
            {
                'id': '101',
                'parcel_id': 'R987612345',
                'address': '125 Maple St, Kennewick',
                'city': 'Kennewick',
                'property_type': 'residential',
                'lot_size': 7900.0,
                'year_built': 1994,
                'assessed_value': 315000.0,
            },
            {
                'id': '102',
                'parcel_id': 'R876523456',
                'address': '789 Elm Ave, Kennewick',
                'city': 'Kennewick',
                'property_type': 'residential',
                'lot_size': 8200.0,
                'year_built': 1997,
                'assessed_value': 330000.0,
            },
            {
                'id': '103',
                'parcel_id': 'R765434567',
                'address': '456 Cedar Dr, Kennewick',
                'city': 'Kennewick',
                'property_type': 'residential',
                'lot_size': 8800.0,
                'year_built': 1992,
                'assessed_value': 298000.0,
            }
        ]
    elif property_type == 'commercial':
        comparables = [
            {
                'id': '201',
                'parcel_id': 'C987612345',
                'address': '250 Business Way, Kennewick',
                'city': 'Kennewick',
                'property_type': 'commercial',
                'lot_size': 20000.0,
                'year_built': 2002,
                'assessed_value': 1150000.0,
            },
            {
                'id': '202',
                'parcel_id': 'C876523456',
                'address': '780 Commerce St, Kennewick',
                'city': 'Kennewick',
                'property_type': 'commercial',
                'lot_size': 30000.0,
                'year_built': 1999,
                'assessed_value': 1350000.0,
            }
        ]
    else:  # agricultural
        comparables = [
            {
                'id': '301',
                'parcel_id': 'A987612345',
                'address': '200 Vineyard Rd, Prosser',
                'city': 'Prosser',
                'property_type': 'agricultural',
                'lot_size': 1800000.0,
                'year_built': 1980,
                'assessed_value': 750000.0,
            },
            {
                'id': '302',
                'parcel_id': 'A876523456',
                'address': '350 Orchard Ave, Prosser',
                'city': 'Prosser',
                'property_type': 'agricultural',
                'lot_size': 2200000.0,
                'year_built': 1965,
                'assessed_value': 820000.0,
            }
        ]
    
    return jsonify({
        'success': True,
        'comparable_properties': comparables
    })