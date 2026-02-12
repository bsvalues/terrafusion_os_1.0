"""
Simplified controller for AI-powered property recommendations.

This module provides a basic implementation that doesn't rely on AI
but still demonstrates the UI and functionality.
"""

import logging
import random
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional

from flask import Blueprint, render_template, request, redirect, url_for, jsonify, g, session

from app import render_template_with_fallback

# Configure logger
logger = logging.getLogger(__name__)

# Create blueprint
property_rec_controller = Blueprint('property_recommendations', __name__)


@property_rec_controller.route('/property-recommendations')
def property_recommendations_page():
    """
    Render the AI-powered property recommendations page.
    
    This page showcases personalized property recommendations for users based on
    their preferences, search history, and property characteristics.
    
    Returns:
        Rendered template for the property recommendations page
    """
    try:
        # Generate page ID for tracking
        page_id = str(uuid.uuid4())
        logger.info(f"Property recommendations page accessed (ID: {page_id})")
        
        # Get any query parameters to pre-fill the preferences form
        location = request.args.get('location', '')
        property_type = request.args.get('property_type', '')
        min_price = request.args.get('min_price', '')
        max_price = request.args.get('max_price', '')
        min_bedrooms = request.args.get('min_bedrooms', '')
        address = request.args.get('address', '')
        
        return render_template_with_fallback('property_recommendations.html', 
            page_title="AI Property Recommendations",
            meta_description="Get personalized property recommendations based on your preferences and search history.",
            page_id=page_id,
            location=location,
            property_type=property_type,
            min_price=min_price,
            max_price=max_price,
            min_bedrooms=min_bedrooms,
            address=address
        )
    except Exception as e:
        # Generate error ID for tracking
        error_id = str(uuid.uuid4())
        logger.error(f"Error rendering property recommendations page (ID: {error_id}): {str(e)}", exc_info=True)
        
        # Render error page with tracking ID
        return render_template_with_fallback('error.html',
            error_title="Property Recommendations Unavailable",
            error_message="We're sorry, but the property recommendations feature is currently unavailable. Please try again later.",
            error_id=error_id,
            page_title="Error - Property Recommendations"
        ), 500


@property_rec_controller.route('/api/property-recommendations', methods=['GET'])
def get_property_recommendations():
    """
    API endpoint for getting personalized property recommendations.
    
    This implementation returns sample properties without using AI
    to demonstrate the functionality.
    
    Returns:
        JSON response with property recommendations
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
        
        # Extract other filter parameters
        location = request.args.get('location', '')
        property_type = request.args.get('property_type', '')
        min_price = request.args.get('min_price', '')
        max_price = request.args.get('max_price', '')
        address = request.args.get('address', '')  # Added address search parameter
        features = request.args.get('features', '')
        
        # Parse features into a list if provided
        feature_list = []
        if features:
            feature_list = features.split(',')
        
        # Generate sample properties
        logger.info(f"Querying properties with: location={location}, property_type={property_type}, price={min_price}-{max_price}, address={address}, features={feature_list}")
        
        recommendations = _get_sample_properties(
            location=location,
            property_type=property_type,
            min_price=min_price,
            max_price=max_price,
            address=address,
            features=feature_list,
            limit=limit
        )
        
        logger.info(f"Found {len(recommendations)} matching properties")
        
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


@property_rec_controller.route('/api/save-preferences', methods=['POST'])
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
        
        return jsonify({
            "message": "Preferences saved successfully.",
            "preferences": preferences
        }), 200
        
    except Exception as e:
        logger.error(f"Error saving user preferences: {str(e)}")
        return jsonify({
            "error": "An error occurred while saving your preferences."
        }), 500


def _get_sample_properties(location='', property_type='', min_price='', max_price='', address='', features=None, limit=5):
    """
    Generate sample property data for demonstration.
    
    Args:
        location (str): Location filter
        property_type (str): Property type filter
        min_price (str): Minimum price filter
        max_price (str): Maximum price filter
        address (str): Address search filter
        features (list): List of desired property features
        limit (int): Maximum number of properties to return
        
    Returns:
        List[Dict[str, Any]]: Sample properties
    """
    if features is None:
        features = []
        
    # Convert price parameters to integers if provided
    try:
        min_price_value = int(min_price) if min_price else 0
    except ValueError:
        min_price_value = 0
        
    try:
        max_price_value = int(max_price) if max_price else 10000000
    except ValueError:
        max_price_value = 10000000
    
    # Define realistic locations with ZIP codes
    locations = [
        {"city": "Seattle", "state": "WA", "zip": "98101", "full": "Seattle, WA 98101"},
        {"city": "Seattle", "state": "WA", "zip": "98109", "full": "Seattle, WA 98109"},
        {"city": "Bellevue", "state": "WA", "zip": "98004", "full": "Bellevue, WA 98004"},
        {"city": "Redmond", "state": "WA", "zip": "98052", "full": "Redmond, WA 98052"},
        {"city": "Kirkland", "state": "WA", "zip": "98033", "full": "Kirkland, WA 98033"},
        {"city": "San Francisco", "state": "CA", "zip": "94107", "full": "San Francisco, CA 94107"},
        {"city": "San Jose", "state": "CA", "zip": "95112", "full": "San Jose, CA 95112"},
        {"city": "Oakland", "state": "CA", "zip": "94607", "full": "Oakland, CA 94607"},
        {"city": "Portland", "state": "OR", "zip": "97204", "full": "Portland, OR 97204"},
        {"city": "Beaverton", "state": "OR", "zip": "97005", "full": "Beaverton, OR 97005"},
        {"city": "Austin", "state": "TX", "zip": "78701", "full": "Austin, TX 78701"},
        {"city": "Dallas", "state": "TX", "zip": "75201", "full": "Dallas, TX 75201"},
        {"city": "Houston", "state": "TX", "zip": "77002", "full": "Houston, TX 77002"},
        {"city": "Kennewick", "state": "WA", "zip": "99336", "full": "Kennewick, WA 99336"},
        {"city": "Pasco", "state": "WA", "zip": "99301", "full": "Pasco, WA 99301"},
        {"city": "Richland", "state": "WA", "zip": "99352", "full": "Richland, WA 99352"},
        {"city": "Walla Walla", "state": "WA", "zip": "99362", "full": "Walla Walla, WA 99362"}
    ]
    
    # If location filter is provided, filter the locations
    filtered_locations = locations
    if location:
        filtered_locations = []
        location_lower = location.lower()
        
        # Log location search
        logger.info(f"Searching for location: '{location_lower}'")
        
        for loc in locations:
            if (location_lower in loc["city"].lower() or 
                location_lower in loc["state"].lower() or 
                location_lower in loc["zip"] or 
                location_lower in loc["full"].lower()):
                filtered_locations.append(loc)
                logger.info(f"Matched location: {loc['full']}")
                
        if not filtered_locations:  # No matches, use all locations for more results
            logger.info(f"No specific location matches found for '{location}', using all locations")
            filtered_locations = locations
    
    # Define property types
    property_types = ["House", "Condo", "Townhouse", "Apartment", "Land"]
    
    # If property type filter is provided, filter the types
    if property_type and property_type in property_types:
        property_types = [property_type]
    
    # Define realistic street names by region
    street_data = {
        "WA": [
            "Pine Street", "Pike Street", "Broadway", "Rainier Avenue", "Mercer Street",
            "Queen Anne Avenue", "15th Avenue", "45th Street", "Greenwood Avenue", "Aurora Avenue",
            "Pacific Avenue", "Sunset Boulevard", "Canyon Road", "George Washington Way",
            "Stevens Drive", "Jadwin Avenue", "Van Giesen Street", "Columbia Center Boulevard",
            "Clearwater Avenue", "Gage Boulevard", "Court Street", "Lewis Street"
        ],
        "CA": [
            "Market Street", "Mission Street", "Valencia Street", "Divisadero Street", "Van Ness Avenue",
            "Lombard Street", "Grant Avenue", "Fillmore Street", "Castro Street", "Haight Street",
            "Folsom Street", "Howard Street", "Geary Boulevard", "Sunset Boulevard", "Wilshire Boulevard"
        ],
        "OR": [
            "Burnside Street", "Hawthorne Boulevard", "Division Street", "Alberta Street", "Mississippi Avenue",
            "Broadway", "Powell Boulevard", "Belmont Street", "Sandy Boulevard", "Stark Street"
        ],
        "TX": [
            "Congress Avenue", "6th Street", "Lamar Boulevard", "Guadalupe Street", "South 1st Street",
            "Rainey Street", "Main Street", "McKinney Avenue", "Houston Street", "Montrose Boulevard"
        ]
    }
    
    # Define common property features
    all_features = [
        "Garage", "Pool", "Fireplace", "Central AC", "Renovated Kitchen",
        "Hardwood Floors", "Deck", "Patio", "Fenced Yard", "Walk-in Closet",
        "Stainless Appliances", "Granite Countertops", "Smart Home", "Solar Panels",
        "Garden", "High Ceilings", "Open Floor Plan", "Mountain View", "Water View",
        "Near Transit", "Near Schools", "HOA", "Gated Community", "Corner Lot", "Basement"
    ]
    
    # Create sample properties
    properties = []
    
    # Sample images (use placeholder URLs)
    image_url = "/static/images/property-placeholder.svg"
    
    # Generate a larger pool of properties
    for i in range(30):  # Generate more than needed and filter later
        prop_id = f"PROP-{10000 + i}"
        
        # Select a random location
        loc_data = random.choice(filtered_locations)
        prop_location = loc_data["full"]
        state = loc_data["state"]
        city = loc_data["city"]
        zip_code = loc_data["zip"]
        
        # Select street name based on state
        street_names = street_data.get(state, street_data["WA"])  # Default to WA if state not found
        street_name = random.choice(street_names)
        
        # Generate house number
        house_number = random.randint(100, 9999)
        
        # Generate full address
        full_address = f"{house_number} {street_name}, {city}, {state} {zip_code}"
        
        # Select property type
        prop_type = random.choice(property_types)
        
        # Generate price based on location and property type
        base_price = {
            "House": random.randint(350, 1200) * 1000,
            "Condo": random.randint(250, 800) * 1000,
            "Townhouse": random.randint(300, 900) * 1000,
            "Apartment": random.randint(200, 700) * 1000,
            "Land": random.randint(150, 500) * 1000
        }[prop_type]
        
        # Adjust price based on location
        location_multiplier = {
            "WA": 1.2 if city in ["Seattle", "Bellevue", "Kirkland"] else 0.9,
            "CA": 1.5 if city in ["San Francisco", "San Jose"] else 1.2,
            "OR": 1.1,
            "TX": 1.0
        }.get(state, 1.0)
        
        price = int(base_price * location_multiplier)
        
        # Check price filter
        price_matches = True
        if min_price_value > 0 and price < min_price_value:
            price_matches = False
            # logger.debug(f"Price {price} < min {min_price_value}")
        if max_price_value > 0 and price > max_price_value:
            price_matches = False
            # logger.debug(f"Price {price} > max {max_price_value}")
        
        if not price_matches:
            continue
            
        # Check address filter
        address_matches = True
        if address:
            address_lower = address.lower()
            if address_lower not in full_address.lower():
                address_matches = False
                # logger.debug(f"Address '{address_lower}' not in '{full_address.lower()}'")
        
        if not address_matches:
            continue
        
        # Generate bedrooms based on property type
        if prop_type == "Land":
            bedrooms = 0
        elif prop_type == "Condo" or prop_type == "Apartment":
            bedrooms = random.randint(1, 3)
        else:
            bedrooms = random.randint(2, 5)
        
        # Generate bathrooms based on bedrooms
        if bedrooms == 0:
            bathrooms = 0
        else:
            bathroom_options = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5]
            max_bath_index = min(bedrooms + 1, len(bathroom_options) - 1)
            bathrooms = bathroom_options[random.randint(bedrooms - 1, max_bath_index)]
        
        # Square feet based on property type and bedrooms
        if prop_type == "Land":
            # Land in acres (converted to square feet)
            square_feet = random.randint(1, 10) * 43560  # 1 acre = 43,560 sq ft
            sq_ft_display = f"{square_feet / 43560:.2f} acres"
        else:
            base_sqft = {
                "House": 1500,
                "Condo": 800,
                "Townhouse": 1200,
                "Apartment": 700
            }.get(prop_type, 1000)
            
            # Add square footage based on bedrooms
            bedroom_sqft = {
                0: 0,
                1: 200,
                2: 400,
                3: 800,
                4: 1200,
                5: 1600
            }.get(bedrooms, 0)
            
            square_feet = base_sqft + bedroom_sqft + random.randint(-200, 400)
            sq_ft_display = f"{square_feet:,} sq ft"
        
        # Generate year built based on property type and city
        min_year = {
            "House": 1900 if city in ["Seattle", "San Francisco", "Portland"] else 1950,
            "Condo": 1970,
            "Townhouse": 1980,
            "Apartment": 1960,
            "Land": None  # Land doesn't have a build year
        }.get(prop_type, 1950)
        
        if min_year:
            year_built = random.randint(min_year, 2023)
        else:
            year_built = None
        
        # Select random features
        num_features = random.randint(3, 8)
        property_features = random.sample(all_features, num_features)
        
        # Generate detailed description based on property attributes
        if prop_type == "Land":
            description = (
                f"Beautiful {sq_ft_display} of land in {city}, {state}. "
                f"Perfect for building your dream home or investment opportunity. "
                f"Located in a desirable area with {random.choice(['mountain', 'city', 'valley', 'forest', 'water'])} views."
            )
        else:
            adjectives = ["Beautiful", "Charming", "Luxurious", "Stunning", "Elegant", "Spacious", "Modern", "Updated"]
            description = (
                f"{random.choice(adjectives)} {bedrooms} bedroom {prop_type.lower()} in {city}, {state}. "
                f"Features {bathrooms} bathrooms and {sq_ft_display} of living space. "
                f"{'Built in ' + str(year_built) + '. ' if year_built else ''}"
                f"Includes {', '.join(property_features[:3])}"
            )
        
        # Filter by requested features
        if features:
            if not any(feature in property_features for feature in features):
                continue
        
        # Calculate match score based on matching criteria
        base_match = 0.7  # Start with a base match score
        match_bonuses = []
        match_reasons = []
        
        # Location match
        if location and (location.lower() in city.lower() or location.lower() in zip_code):
            base_match += 0.1
            match_bonuses.append(0.1)
            match_reasons.append(f"This property is located in your preferred area of {city}, {state}")
        
        # Property type match
        if property_type and prop_type == property_type:
            base_match += 0.1
            match_bonuses.append(0.1)
            match_reasons.append(f"This is a {prop_type.lower()}, which matches your property type preference")
        
        # Feature matches
        feature_matches = [f for f in features if f in property_features]
        if feature_matches:
            feature_bonus = min(0.15, len(feature_matches) * 0.05)
            base_match += feature_bonus
            match_bonuses.append(feature_bonus)
            
            if len(feature_matches) == 1:
                match_reasons.append(f"Includes your desired feature: {feature_matches[0]}")
            else:
                match_reasons.append(f"Includes {len(feature_matches)} of your desired features: {', '.join(feature_matches[:3])}")
        
        # Price in range
        if min_price and max_price:
            price_match = 1 - (abs(price - ((min_price_value + max_price_value) / 2)) / (max_price_value - min_price_value + 1))
            price_bonus = price_match * 0.1
            base_match += price_bonus
            match_bonuses.append(price_bonus)
            match_reasons.append(f"The price of ${price:,} is within your budget range")
        
        # Generate final match score (capped at 0.98)
        match_score = min(0.98, base_match)
        
        # Add additional reason if we don't have many
        if len(match_reasons) < 2:
            if bedrooms > 0:
                match_reasons.append(f"Has {bedrooms} {'bedroom' if bedrooms == 1 else 'bedrooms'}, which may suit your needs")
            elif "Water View" in property_features:
                match_reasons.append("Features beautiful water views")
            elif "Mountain View" in property_features:
                match_reasons.append("Features scenic mountain views")
            elif square_feet > 3000:
                match_reasons.append(f"Offers spacious living with {sq_ft_display}")
        
        # Create property object
        property_obj = {
            "id": prop_id,
            "address": full_address,
            "location": prop_location,
            "property_type": prop_type,
            "price": price,
            "bedrooms": bedrooms,
            "bathrooms": bathrooms,
            "square_feet": square_feet,
            "year_built": year_built,
            "description": description,
            "features": property_features,
            "image_url": image_url,
            "match_score": round(match_score, 2),
            "match_reasons": match_reasons
        }
        
        properties.append(property_obj)
    
    # If no matching properties were found, return a set of default properties
    if not properties:
        logger.warning(f"No properties matched the criteria. Returning default properties.")
        
        # Create at least 5 default properties to ensure we have results
        default_properties = [
            {
                "id": "PROP-DEFAULT-1",
                "address": "123 Main Street, Seattle, WA 98101",
                "location": "Seattle, WA 98101",
                "property_type": "House",
                "price": 750000,
                "bedrooms": 3,
                "bathrooms": 2,
                "square_feet": 2200,
                "year_built": 2010,
                "description": "Beautiful 3 bedroom house in Seattle with modern amenities.",
                "features": ["Garage", "Hardwood Floors", "Renovated Kitchen"],
                "image_url": "/static/images/property-placeholder.svg",
                "match_score": 0.85,
                "match_reasons": [
                    "This property matches some of your preferences",
                    "Price is within the typical range for this area"
                ]
            },
            {
                "id": "PROP-DEFAULT-2",
                "address": "456 Pine Street, Richland, WA 99352",
                "location": "Richland, WA 99352",
                "property_type": "House",
                "price": 450000,
                "bedrooms": 4,
                "bathrooms": 2.5,
                "square_feet": 2800,
                "year_built": 2005,
                "description": "Spacious 4 bedroom family home in Richland with large backyard and updated kitchen.",
                "features": ["Garage", "Pool", "Fenced Yard"],
                "image_url": "/static/images/property-placeholder.svg",
                "match_score": 0.92,
                "match_reasons": [
                    "Located in your desired area of Richland, WA",
                    "Features a pool as requested"
                ]
            },
            {
                "id": "PROP-DEFAULT-3",
                "address": "789 Columbia Blvd, Kennewick, WA 99336",
                "location": "Kennewick, WA 99336",
                "property_type": "Condo",
                "price": 320000,
                "bedrooms": 2,
                "bathrooms": 2,
                "square_feet": 1500,
                "year_built": 2018,
                "description": "Modern 2 bedroom condo with excellent amenities and convenient location.",
                "features": ["Central AC", "Hardwood Floors", "Smart Home"],
                "image_url": "/static/images/property-placeholder.svg",
                "match_score": 0.78,
                "match_reasons": [
                    "Modern construction with smart home features",
                    "Located in the Tri-Cities area"
                ]
            },
            {
                "id": "PROP-DEFAULT-4",
                "address": "555 Canyon Road, Pasco, WA 99301",
                "location": "Pasco, WA 99301",
                "property_type": "House",
                "price": 385000,
                "bedrooms": 3,
                "bathrooms": 2,
                "square_feet": 1950,
                "year_built": 2000,
                "description": "Well-maintained 3 bedroom home with renovated kitchen and bathrooms.",
                "features": ["Garage", "Fenced Yard", "Renovated Kitchen"],
                "image_url": "/static/images/property-placeholder.svg",
                "match_score": 0.81,
                "match_reasons": [
                    "Recently renovated property",
                    "Good value for the area"
                ]
            },
            {
                "id": "PROP-DEFAULT-5",
                "address": "222 Vineyard Ave, Walla Walla, WA 99362",
                "location": "Walla Walla, WA 99362",
                "property_type": "House",
                "price": 520000,
                "bedrooms": 4,
                "bathrooms": 3,
                "square_feet": 2600,
                "year_built": 1995,
                "description": "Charming 4 bedroom home in wine country with scenic views and updated features.",
                "features": ["Deck", "Fireplace", "Mountain View"],
                "image_url": "/static/images/property-placeholder.svg",
                "match_score": 0.88,
                "match_reasons": [
                    "Located in scenic Walla Walla wine country",
                    "Features beautiful mountain views"
                ]
            }
        ]
        
        return default_properties
    
    # Sort properties by match score and return requested number
    return sorted(properties, key=lambda p: p["match_score"], reverse=True)[:limit]