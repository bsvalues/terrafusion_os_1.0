"""
API routes for Zillow data.
"""
import logging
from flask import Blueprint, request, jsonify, current_app

from services.zillow_service import ZillowService
from models.zillow_data import ZillowMarketData, ZillowProperty

# Configure logger
logger = logging.getLogger(__name__)

# Create blueprint
zillow_api = Blueprint('zillow_api', __name__, url_prefix='/api/zillow')

@zillow_api.route('/market-data', methods=['GET'])
def get_market_data():
    """
    Get market data for a specific location.
    
    Query parameters:
    - resource_id: The Zillow resource ID for the location (required)
    - beds: Number of bedrooms (default: 0 for any)
    - property_types: Type of properties (default: "house")
    - refresh: Set to "true" to force refresh data from Zillow API
    
    Returns:
        JSON response with market data
    """
    resource_id = request.args.get('resource_id')
    beds = request.args.get('beds', default=0, type=int)
    property_types = request.args.get('property_types', default='house')
    refresh = request.args.get('refresh', 'false').lower() == 'true'
    
    if not resource_id:
        return jsonify({
            "status": "error",
            "message": "resource_id parameter is required"
        }), 400
    
    try:
        zillow_service = ZillowService()
        
        # If refresh requested or no existing data, fetch from Zillow API
        if refresh:
            market_data, is_fresh = zillow_service.get_and_store_market_data(
                resource_id, beds, property_types
            )
        else:
            # Try to find existing data first
            existing_data = ZillowMarketData.query.filter_by(
                resource_id=resource_id,
                beds=beds,
                property_types=property_types
            ).order_by(ZillowMarketData.created_at.desc()).first()
            
            if existing_data:
                market_data, is_fresh = existing_data, False
            else:
                # If no existing data, fetch from Zillow API
                market_data, is_fresh = zillow_service.get_and_store_market_data(
                    resource_id, beds, property_types
                )
        
        if not market_data:
            return jsonify({
                "status": "error",
                "message": f"Failed to retrieve market data for resource ID {resource_id}"
            }), 404
        
        # Get price trends if available
        price_trends = []
        if hasattr(market_data, 'price_trends'):
            price_trends = [trend.to_dict() for trend in market_data.price_trends]
        
        # Format response
        result = market_data.to_dict()
        result['price_trends'] = price_trends
        result['data_source'] = 'fresh' if is_fresh else 'cached'
        
        return jsonify({
            "status": "success",
            "data": result
        })
        
    except Exception as e:
        logger.exception(f"Error in get_market_data: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@zillow_api.route('/property/<zpid>', methods=['GET'])
def get_property(zpid):
    """
    Get property details by Zillow Property ID.
    
    Parameters:
    - zpid: Zillow Property ID (in URL path)
    
    Query parameters:
    - refresh: Set to "true" to force refresh data from Zillow API
    
    Returns:
        JSON response with property details
    """
    refresh = request.args.get('refresh', 'false').lower() == 'true'
    
    try:
        zillow_service = ZillowService()
        
        if refresh:
            property_data, is_fresh = zillow_service.get_property_details(zpid)
        else:
            # Try to find existing data first
            existing_property = ZillowProperty.query.filter_by(zpid=zpid).first()
            
            if existing_property:
                property_data, is_fresh = existing_property, False
            else:
                # If no existing data, fetch from Zillow API
                property_data, is_fresh = zillow_service.get_property_details(zpid)
        
        if not property_data:
            return jsonify({
                "status": "error",
                "message": f"Property not found for ZPID {zpid}"
            }), 404
        
        # Format response
        result = property_data.to_dict()
        result['data_source'] = 'fresh' if is_fresh else 'cached'
        
        return jsonify({
            "status": "success",
            "data": result
        })
        
    except Exception as e:
        logger.exception(f"Error in get_property: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@zillow_api.route('/search', methods=['GET'])
def search_properties():
    """
    Search for properties in a location.
    
    Query parameters:
    - location: Location to search (required)
    - limit: Maximum number of results to return (default: 10)
    
    Returns:
        JSON response with property search results
    """
    location = request.args.get('location')
    limit = request.args.get('limit', default=10, type=int)
    
    if not location:
        return jsonify({
            "status": "error",
            "message": "location parameter is required"
        }), 400
    
    try:
        zillow_service = ZillowService()
        properties = zillow_service.search_properties(location, limit)
        
        if not properties:
            return jsonify({
                "status": "success",
                "message": f"No properties found for location: {location}",
                "data": []
            })
        
        return jsonify({
            "status": "success",
            "count": len(properties),
            "data": properties
        })
        
    except Exception as e:
        logger.exception(f"Error in search_properties: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@zillow_api.route('/locations', methods=['GET'])
def get_available_locations():
    """
    Get list of locations with available market data.
    
    Returns:
        JSON response with list of locations
    """
    try:
        # Get distinct locations from database
        locations = ZillowMarketData.query.with_entities(
            ZillowMarketData.resource_id,
            ZillowMarketData.location_name,
            ZillowMarketData.location_type
        ).distinct().all()
        
        # Format results
        result = []
        for location in locations:
            result.append({
                "resource_id": location.resource_id,
                "name": location.location_name,
                "type": location.location_type
            })
        
        return jsonify({
            "status": "success",
            "count": len(result),
            "data": result
        })
        
    except Exception as e:
        logger.exception(f"Error in get_available_locations: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500