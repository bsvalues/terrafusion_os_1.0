"""
API endpoints for AI-powered property recommendation engine.

This module provides endpoints for fetching personalized property recommendations,
property matching scores, and related functionality.
"""

import json
import logging
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional

from flask import Blueprint, request, jsonify, current_app, g, session
from openai import RateLimitError

from ai.property_recommender import PropertyRecommender

# Configure logger
logger = logging.getLogger(__name__)

# Create blueprint
property_rec_api = Blueprint('property_recommendations_api', __name__)

# Initialize recommendation engine
recommender = PropertyRecommender()


@property_rec_api.route('/api/property-recommendations', methods=['GET'])
def get_property_recommendations():
    """
    Get personalized property recommendations for the current user.
    
    Query Parameters:
        limit (int): Maximum number of recommendations to return
        location (str): Filter by location
        property_type (str): Filter by property type
        min_price (int): Minimum price
        max_price (int): Maximum price
        
    Returns:
        JSON response with recommended properties and match explanations
    """
    try:
        # Generate request ID for tracking
        request_id = str(uuid.uuid4())
        logger.info(f"Property recommendation request (ID: {request_id})")
        
        # Parse query parameters
        try:
            limit = min(int(request.args.get('limit', 5)), 10)  # Cap at 10 recommendations
        except (ValueError, TypeError):
            limit = 5
            
        # Get user preferences from query parameters or session
        user_preferences = _get_user_preferences(request)
        
        # Get user history (simplified in this implementation)
        user_history = _get_user_history()
        
        # Get available properties (sample implementation - would normally query database)
        available_properties = _get_available_properties(filters=user_preferences)
        
        # If no properties are available, return empty response
        if not available_properties:
            return jsonify({
                "recommendations": [],
                "message": "No properties available matching your criteria.",
                "request_id": request_id
            }), 200
        
        try:
            # Try to generate personalized recommendations using AI
            recommendations, error = recommender.get_recommendations(
                user_preferences=user_preferences,
                user_history=user_history,
                available_properties=available_properties,
                num_recommendations=limit
            )
            
            if error:
                logger.warning(f"Error generating recommendations (ID: {request_id}): {error}")
                # Fallback to sample properties if AI service is unavailable
                if "AI recommendation service is currently unavailable" in error or "rate limit" in error.lower():
                    logger.info(f"Falling back to sample properties (ID: {request_id})")
                    # Use the available properties as recommendations with basic match scoring
                    recommendations = []
                    for prop in available_properties[:limit]:
                        # Add match score and match reasons
                        prop['match_score'] = 0.75  # Default match score
                        prop['match_reasons'] = [
                            f"This property matches your location preference",
                            f"This {prop.get('property_type', 'property')} is within your price range"
                        ]
                        recommendations.append(prop)
                    
                    return jsonify({
                        "recommendations": recommendations,
                        "timestamp": datetime.now().isoformat(),
                        "message": "Here are some properties that match your criteria.",
                        "request_id": request_id
                    }), 200
                else:
                    return jsonify({
                        "recommendations": [],
                        "message": error,
                        "request_id": request_id
                    }), 200
        except RateLimitError:
            logger.warning(f"OpenAI rate limit exceeded (ID: {request_id})")
            # Fallback to sample properties when rate limited
            recommendations = []
            for prop in available_properties[:limit]:
                # Add match score and match reasons
                prop['match_score'] = 0.75  # Default match score
                prop['match_reasons'] = [
                    f"This property matches your location preference",
                    f"This {prop.get('property_type', 'property')} is within your price range"
                ]
                recommendations.append(prop)
            
            return jsonify({
                "recommendations": recommendations,
                "timestamp": datetime.now().isoformat(),
                "message": "Here are some properties that match your criteria.",
                "request_id": request_id
            }), 200
        
        # Log the results
        logger.info(f"Generated {len(recommendations)} property recommendations (ID: {request_id})")
        
        # Return the recommendations
        return jsonify({
            "recommendations": recommendations,
            "timestamp": datetime.now().isoformat(),
            "request_id": request_id
        }), 200
        
    except Exception as e:
        # Generate an error ID for tracking
        error_id = str(uuid.uuid4())
        logger.error(f"Unhandled exception in property recommendations (ID: {error_id}): {str(e)}", exc_info=True)
        
        return jsonify({
            "error": "An unexpected error occurred while processing your recommendations.",
            "error_id": error_id
        }), 500


@property_rec_api.route('/api/property-match-score', methods=['POST'])
def get_property_match_score():
    """
    Calculate a match score between user preferences and a specific property.
    
    Expects a JSON payload with:
        preferences (dict): User's property preferences
        property (dict): Property to evaluate
        
    Returns:
        JSON response with match score and matching reasons
    """
    try:
        # Generate request ID for tracking
        request_id = str(uuid.uuid4())
        logger.info(f"Property match score request (ID: {request_id})")
        
        # Check if request is JSON
        if not request.is_json:
            logger.warning(f"Non-JSON request received (ID: {request_id})")
            return jsonify({
                "error": "Invalid request format. JSON required.",
                "request_id": request_id
            }), 400
            
        # Parse request data
        data = request.get_json()
        
        user_preferences = data.get('preferences', {})
        property_data = data.get('property', {})
        
        # Validate required fields
        if not property_data:
            return jsonify({
                "error": "Property data is required.",
                "request_id": request_id
            }), 400
        
        # If preferences are not provided, use session preferences or defaults
        if not user_preferences:
            user_preferences = _get_user_preferences(request)
        
        # Calculate match score
        match_score, match_reasons = recommender.get_property_match_score(
            user_preferences=user_preferences,
            property_data=property_data
        )
        
        # Return the match score and reasons
        return jsonify({
            "property_id": property_data.get('id', 'unknown'),
            "match_score": match_score,
            "match_reasons": match_reasons,
            "timestamp": datetime.now().isoformat(),
            "request_id": request_id
        }), 200
        
    except Exception as e:
        # Generate an error ID for tracking
        error_id = str(uuid.uuid4())
        logger.error(f"Unhandled exception in property match score (ID: {error_id}): {str(e)}", exc_info=True)
        
        return jsonify({
            "error": "An unexpected error occurred while calculating the match score.",
            "error_id": error_id
        }), 500


@property_rec_api.route('/api/save-preferences', methods=['POST'])
def save_user_preferences():
    """
    Save user property preferences to the session.
    
    Expects a JSON payload with property preferences.
    
    Returns:
        JSON acknowledgment of saved preferences
    """
    try:
        # Check if request is JSON
        if not request.is_json:
            return jsonify({
                "error": "Invalid request format. JSON required."
            }), 400
            
        # Get preferences from the request
        preferences = request.get_json()
        
        # Validate preferences
        if not isinstance(preferences, dict):
            return jsonify({
                "error": "Invalid preferences format. Expected an object."
            }), 400
        
        # Save to session
        session['property_preferences'] = preferences
        
        # Save to database if user is logged in (example implementation)
        if hasattr(g, 'user') and g.user:
            try:
                # This is a placeholder - implementation depends on your database model
                # user_preferences = UserPreferences.query.filter_by(user_id=g.user.id).first()
                # if user_preferences:
                #     user_preferences.preferences = json.dumps(preferences)
                # else:
                #     user_preferences = UserPreferences(user_id=g.user.id, preferences=json.dumps(preferences))
                # db_session.add(user_preferences)
                # db_session.commit()
                logger.info(f"User preferences saved to session for user: {g.user.id if g.user else 'unknown'}")
            except Exception as e:
                logger.error(f"Failed to save user preferences to database: {str(e)}")
        
        return jsonify({
            "message": "Preferences saved successfully.",
            "preferences": preferences
        }), 200
        
    except Exception as e:
        logger.error(f"Error saving user preferences: {str(e)}")
        return jsonify({
            "error": "An error occurred while saving your preferences."
        }), 500


# Helper functions
def _get_user_preferences(request) -> Dict[str, Any]:
    """
    Get user preferences from query parameters, session, or defaults.
    
    Args:
        request: Flask request object
        
    Returns:
        Dict[str, Any]: User preferences
    """
    # Try to get preferences from session
    session_prefs = session.get('property_preferences', {})
    
    # Extract query parameters
    query_prefs = {}
    for key in ['location', 'property_type', 'min_price', 'max_price', 'min_bedrooms', 'max_bedrooms']:
        if key in request.args:
            query_prefs[key] = request.args.get(key)
    
    # If query parameters are provided, they override session preferences
    if query_prefs:
        # Combine with session preferences, with query parameters taking precedence
        preferences = {**session_prefs, **query_prefs}
    else:
        preferences = session_prefs
    
    # If user is logged in, try to get their saved preferences from database
    if hasattr(g, 'user') and g.user:
        try:
            # This is a placeholder - implementation depends on your database model
            # user_preferences = UserPreferences.query.filter_by(user_id=g.user.id).first()
            # if user_preferences and user_preferences.preferences:
            #     saved_prefs = json.loads(user_preferences.preferences)
            #     # Combine with query preferences and session preferences
            #     preferences = {**saved_prefs, **preferences}
            pass
        except Exception as e:
            logger.error(f"Failed to retrieve user preferences from database: {str(e)}")
    
    # Convert numeric values to appropriate types
    for key in ['min_price', 'max_price', 'min_bedrooms', 'max_bedrooms', 'min_bathrooms', 'max_bathrooms']:
        if key in preferences and preferences[key]:
            try:
                preferences[key] = int(preferences[key])
            except (ValueError, TypeError):
                # If conversion fails, remove the invalid value
                preferences.pop(key)
    
    return preferences


def _get_user_history() -> List[Dict[str, Any]]:
    """
    Get the user's search and viewing history.
    This is a simplified implementation - would normally query database.
    
    Returns:
        List[Dict[str, Any]]: User history items
    """
    # Check if user is logged in and try to get their history
    if hasattr(g, 'user') and g.user:
        try:
            # This is a placeholder - implementation depends on your database model
            # search_history = SearchHistory.query.filter_by(user_id=g.user.id).order_by(SearchHistory.timestamp.desc()).limit(20).all()
            # view_history = PropertyView.query.filter_by(user_id=g.user.id).order_by(PropertyView.timestamp.desc()).limit(20).all()
            # 
            # history = []
            # 
            # for search in search_history:
            #     history.append({
            #         'type': 'search',
            #         'search_query': search.query,
            #         'filters': json.loads(search.filters) if search.filters else {},
            #         'timestamp': search.timestamp.isoformat()
            #     })
            # 
            # for view in view_history:
            #     history.append({
            #         'type': 'view',
            #         'property_id': view.property_id,
            #         'timestamp': view.timestamp.isoformat()
            #     })
            # 
            # return sorted(history, key=lambda x: x['timestamp'], reverse=True)
            pass
        except Exception as e:
            logger.error(f"Failed to retrieve user history from database: {str(e)}")
    
    # Return an empty history if no user is logged in or if there was an error
    return []


def _get_available_properties(filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """
    Get available properties based on provided filters.
    This is a simplified implementation - would normally query database.
    
    Args:
        filters (Dict[str, Any], optional): Property filters to apply
        
    Returns:
        List[Dict[str, Any]]: Available properties
    """
    try:
        # This is a placeholder - implementation depends on your database model
        # query = Property.query
        # 
        # if filters:
        #     if 'location' in filters and filters['location']:
        #         query = query.filter(Property.location.ilike(f"%{filters['location']}%"))
        #     
        #     if 'property_type' in filters and filters['property_type']:
        #         query = query.filter_by(property_type=filters['property_type'])
        #     
        #     if 'min_price' in filters and filters['min_price']:
        #         query = query.filter(Property.price >= filters['min_price'])
        #     
        #     if 'max_price' in filters and filters['max_price']:
        #         query = query.filter(Property.price <= filters['max_price'])
        #     
        #     if 'min_bedrooms' in filters and filters['min_bedrooms']:
        #         query = query.filter(Property.bedrooms >= filters['min_bedrooms'])
        #     
        #     if 'max_bedrooms' in filters and filters['max_bedrooms']:
        #         query = query.filter(Property.bedrooms <= filters['max_bedrooms'])
        # 
        # properties = query.limit(50).all()
        # 
        # return [p.to_dict() for p in properties]
        
        # For now, use a test function to get sample properties for development
        return _get_sample_properties(filters)
        
    except Exception as e:
        logger.error(f"Error fetching available properties: {str(e)}")
        return []


def _get_sample_properties(filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """
    Get sample property data for testing.
    This would be replaced with actual database queries in production.
    
    Args:
        filters (Dict[str, Any], optional): Property filters to apply
        
    Returns:
        List[Dict[str, Any]]: Sample properties
    """
    import random
    
    # Create a list of sample properties
    properties = []
    
    # Define some sample locations
    locations = [
        "Seattle, WA", "Bellevue, WA", "Redmond, WA", "Kirkland, WA", 
        "San Francisco, CA", "San Jose, CA", "Oakland, CA", 
        "Portland, OR", "Beaverton, OR",
        "Austin, TX", "Dallas, TX", "Houston, TX"
    ]
    
    # Define some sample property types
    property_types = ["House", "Condo", "Townhouse", "Apartment", "Land"]
    
    # Define sample features
    all_features = [
        "Garage", "Pool", "Fireplace", "Central AC", "Renovated Kitchen",
        "Hardwood Floors", "Deck", "Patio", "Fenced Yard", "Walk-in Closet",
        "Stainless Appliances", "Granite Countertops", "Smart Home",
        "Solar Panels", "Garden", "High Ceilings", "Open Floor Plan",
        "Mountain View", "Water View", "Near Transit", "Near Schools",
        "HOA", "Gated Community", "Corner Lot", "Basement"
    ]
    
    # Generate 20 sample properties
    for i in range(1, 21):
        # Property ID
        prop_id = f"PROP-{10000 + i}"
        
        # Location
        location = random.choice(locations)
        
        # Property type
        property_type = random.choice(property_types)
        
        # Price (between $200,000 and $1,500,000)
        price = random.randint(200, 1500) * 1000
        
        # Bedrooms (1-6)
        bedrooms = random.randint(1, 6)
        
        # Bathrooms (1-4.5)
        bathroom_options = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5]
        bathrooms = random.choice(bathroom_options)
        
        # Square feet (800-4000)
        square_feet = random.randint(800, 4000)
        
        # Year built (1950-2024)
        year_built = random.randint(1950, 2024)
        
        # Features (3-8 random features)
        num_features = random.randint(3, 8)
        features = random.sample(all_features, num_features)
        
        # Address
        street_names = ["Maple St", "Oak Ave", "Pine Rd", "Elm Blvd", "Cedar Ln"]
        street_number = random.randint(100, 9999)
        street = random.choice(street_names)
        address = f"{street_number} {street}, {location}"
        
        # Description
        descriptions = [
            f"Beautiful {property_type.lower()} in the heart of {location}.",
            f"Charming {property_type.lower()} with great amenities and location.",
            f"Spacious {property_type.lower()} perfect for families or entertaining.",
            f"Cozy {property_type.lower()} in a quiet neighborhood near shops and restaurants.",
            f"Modern {property_type.lower()} with lots of natural light and updated features."
        ]
        description = random.choice(descriptions)
        
        # Create the property object
        property_obj = {
            "id": prop_id,
            "address": address,
            "location": location,
            "property_type": property_type,
            "price": price,
            "bedrooms": bedrooms,
            "bathrooms": bathrooms,
            "square_feet": square_feet,
            "year_built": year_built,
            "features": features,
            "description": description,
            "listed_date": f"2025-{random.randint(1, 5)}-{random.randint(1, 28)}"
        }
        
        properties.append(property_obj)
    
    # Apply filters if provided
    if filters:
        filtered_properties = []
        
        for prop in properties:
            include = True
            
            if 'location' in filters and filters['location']:
                if filters['location'].lower() not in prop['location'].lower():
                    include = False
                    
            if 'property_type' in filters and filters['property_type']:
                if filters['property_type'].lower() != prop['property_type'].lower():
                    include = False
                    
            if 'min_price' in filters and filters['min_price']:
                if prop['price'] < int(filters['min_price']):
                    include = False
                    
            if 'max_price' in filters and filters['max_price']:
                if prop['price'] > int(filters['max_price']):
                    include = False
                    
            if 'min_bedrooms' in filters and filters['min_bedrooms']:
                if prop['bedrooms'] < int(filters['min_bedrooms']):
                    include = False
                    
            if 'max_bedrooms' in filters and filters['max_bedrooms']:
                if prop['bedrooms'] > int(filters['max_bedrooms']):
                    include = False
            
            if include:
                filtered_properties.append(prop)
                
        return filtered_properties
    
    return properties