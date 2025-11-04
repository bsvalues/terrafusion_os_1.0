"""
Property Service

This service provides functionality for working with property data.
"""

import logging
from typing import Dict, List, Optional, Any

logger = logging.getLogger(__name__)

# Sample property data for demonstration purposes
SAMPLE_PROPERTIES = {
    # Walla Walla property
    'ww42': {
        'id': 'ww42',
        'address': '4234 OLD MILTON HWY',
        'city': 'WALLA WALLA',
        'state': 'Washington',
        'zip_code': '99362',
        'latitude': 46.0578,
        'longitude': -118.4108,
        'price': 789000,
        'price_per_sqft': 325,
        'estimated_value': 795000,
        'land_value': 236700,
        'improvement_value': 552300,
        'bedrooms': 4,
        'bathrooms': 3.5,
        'sqft': 2428,
        'property_type': 'Single Family',
        'year_built': 1992,
        'lot_size': '1.2 acres',
        'status': 'active',
        'image_url': 'https://photos.zillowstatic.com/fp/eb40ee9b33b4f73c4801e21e1cfef69d-cc_ft_1536.webp',
        'description': '''
            <p>Beautiful single-family home on a 1.2-acre lot with fantastic views of the Blue Mountains. This home features 4 bedrooms, 3.5 bathrooms, and 2,428 square feet of living space.</p>
            <p>The property includes a spacious kitchen with granite countertops, stainless steel appliances, and a large island. The primary bedroom offers a walk-in closet and an en-suite bathroom with a soaking tub.</p>
            <p>Additional features include hardwood floors throughout the main level, a finished basement, central air conditioning, and an attached two-car garage.</p>
            <p>The backyard features a covered patio, mature landscaping, and plenty of room for outdoor activities.</p>
        ''',
        'features': [
            'Hardwood floors',
            'Granite countertops',
            'Stainless steel appliances',
            'Central air conditioning',
            'Attached 2-car garage',
            'Finished basement',
            'Covered patio',
            'Mountain views',
            'Fireplace',
            'Master suite with walk-in closet'
        ],
        'tax_history': [
            {'year': 2023, 'amount': 6842, 'change': 3.2},
            {'year': 2022, 'amount': 6630, 'change': 2.5},
            {'year': 2021, 'amount': 6468, 'change': 1.8},
            {'year': 2020, 'amount': 6353, 'change': 0.8}
        ],
        'price_history': [
            {'date': '2025-03-15', 'price': 789000, 'event': 'Listed for sale'},
            {'date': '2019-07-10', 'price': 678000, 'event': 'Sold'},
            {'date': '2019-05-22', 'price': 685000, 'event': 'Listed for sale'},
            {'date': '2012-09-18', 'price': 585000, 'event': 'Sold'}
        ],
        'county': 'walla_walla'
    },
    
    # Richland property
    'bt75': {
        'id': 'bt75',
        'address': '3821 WILLIAMS BLVD',
        'city': 'RICHLAND',
        'state': 'Washington',
        'zip_code': '99354',
        'latitude': 46.2897,
        'longitude': -119.3208,
        'price': 625000,
        'price_per_sqft': 275,
        'estimated_value': 630000,
        'land_value': 187500,
        'improvement_value': 437500,
        'bedrooms': 4,
        'bathrooms': 2.5,
        'sqft': 2273,
        'property_type': 'Single Family',
        'year_built': 1988,
        'lot_size': '0.32 acres',
        'status': 'active',
        'image_url': 'https://photos.zillowstatic.com/fp/eb40ee9b33b4f73c4801e21e1cfef69d-cc_ft_1536.webp',
        'description': '''
            <p>Spacious single-family home in a desirable Richland neighborhood, close to parks and shopping.</p>
            <p>This property features 4 bedrooms, 2.5 bathrooms, and 2,273 square feet of living space.</p>
            <p>The home includes an updated kitchen, formal dining room, and a large family room with fireplace.</p>
        ''',
        'features': [
            'Updated kitchen',
            'Formal dining room',
            'Family room with fireplace',
            'Central air conditioning',
            'Attached 2-car garage',
            'Covered patio',
            'Sprinkler system',
            'Fenced backyard'
        ],
        'tax_history': [
            {'year': 2023, 'amount': 5345, 'change': 2.8},
            {'year': 2022, 'amount': 5200, 'change': 3.1},
            {'year': 2021, 'amount': 5043, 'change': 2.2},
            {'year': 2020, 'amount': 4934, 'change': 1.5}
        ],
        'price_history': [
            {'date': '2025-04-02', 'price': 625000, 'event': 'Listed for sale'},
            {'date': '2018-06-15', 'price': 532000, 'event': 'Sold'},
            {'date': '2018-05-03', 'price': 535000, 'event': 'Listed for sale'},
            {'date': '2010-11-20', 'price': 465000, 'event': 'Sold'}
        ],
        'county': 'benton'
    },
    
    # Kennewick property
    'bt42': {
        'id': 'bt42',
        'address': '106 OAKMONT CT',
        'city': 'RICHLAND',
        'state': 'Washington',
        'zip_code': '99352',
        'latitude': 46.2711,
        'longitude': -119.2810,
        'price': 450000,
        'price_per_sqft': 250,
        'estimated_value': 452000,
        'land_value': 135000,
        'improvement_value': 315000,
        'bedrooms': 3,
        'bathrooms': 2.0,
        'sqft': 1800,
        'property_type': 'Single Family',
        'year_built': 2000,
        'lot_size': '0.25 acres',
        'status': 'active',
        'image_url': 'https://photos.zillowstatic.com/fp/b63b62e7e6964d595af9298658ffa3df-cc_ft_1536.webp',
        'description': '''
            <p>Well-maintained single-family home in the desirable South Richland neighborhood.</p>
            <p>This property features 3 bedrooms, 2 bathrooms, and 1,800 square feet of living space.</p>
            <p>The home includes an open floor plan, updated kitchen, and a private backyard with patio.</p>
        ''',
        'features': [
            'Open floor plan',
            'Updated kitchen',
            'Private backyard',
            'Central air conditioning',
            'Attached 2-car garage',
            'Close to schools and parks'
        ],
        'tax_history': [
            {'year': 2023, 'amount': 4320, 'change': 2.6},
            {'year': 2022, 'amount': 4210, 'change': 2.9},
            {'year': 2021, 'amount': 4092, 'change': 2.0},
            {'year': 2020, 'amount': 4012, 'change': 1.2}
        ],
        'price_history': [
            {'date': '2025-04-15', 'price': 450000, 'event': 'Listed for sale'},
            {'date': '2017-08-22', 'price': 385000, 'event': 'Sold'},
            {'date': '2017-07-10', 'price': 390000, 'event': 'Listed for sale'},
            {'date': '2008-05-15', 'price': 325000, 'event': 'Sold'}
        ],
        'county': 'benton'
    },
    
    # Walla Walla estate property
    'ww38': {
        'id': 'ww38',
        'address': '1225 MILL CREEK RD',
        'city': 'WALLA WALLA',
        'state': 'Washington',
        'zip_code': '99362',
        'latitude': 46.0645,
        'longitude': -118.3214,
        'price': 1250000,
        'price_per_sqft': 375,
        'estimated_value': 1275000,
        'land_value': 437500,
        'improvement_value': 812500,
        'bedrooms': 5,
        'bathrooms': 4.5,
        'sqft': 3333,
        'property_type': 'Single Family',
        'year_built': 1985,
        'lot_size': '3.5 acres',
        'status': 'active',
        'image_url': 'https://photos.zillowstatic.com/fp/c4b24e57876261e954f062c863736f8e-cc_ft_1536.webp',
        'description': '''
            <p>Stunning estate home nestled on 3.5 acres in the Mill Creek area of Walla Walla.</p>
            <p>This luxury property features 5 bedrooms, 4.5 bathrooms, and 3,333 square feet of elegant living space.</p>
            <p>The home includes a gourmet kitchen, formal dining room, spacious living areas, and a primary suite with fireplace.</p>
            <p>The grounds feature mature landscaping, a private pond, outdoor entertaining areas, and mountain views.</p>
        ''',
        'features': [
            'Gourmet kitchen',
            'Primary suite with fireplace',
            'Formal dining room',
            'Private pond',
            'Mountain views',
            'Wine cellar',
            'Multiple outdoor entertaining areas',
            'Attached 3-car garage',
            'Central air conditioning',
            'Security system'
        ],
        'tax_history': [
            {'year': 2023, 'amount': 10256, 'change': 3.5},
            {'year': 2022, 'amount': 9910, 'change': 3.0},
            {'year': 2021, 'amount': 9621, 'change': 2.2},
            {'year': 2020, 'amount': 9415, 'change': 1.8}
        ],
        'price_history': [
            {'date': '2025-03-01', 'price': 1250000, 'event': 'Listed for sale'},
            {'date': '2015-11-15', 'price': 950000, 'event': 'Sold'},
            {'date': '2015-09-22', 'price': 975000, 'event': 'Listed for sale'},
            {'date': '2004-06-30', 'price': 725000, 'event': 'Sold'}
        ],
        'county': 'walla_walla'
    }
}

def get_property_by_id(property_id: str) -> Optional[Dict[str, Any]]:
    """
    Get property data by ID
    
    Args:
        property_id: ID of the property to retrieve
    
    Returns:
        Property data dictionary or None if not found
    """
    logger.info(f"Retrieving property with ID: {property_id}")
    
    # Check if it's a sample property
    if property_id in SAMPLE_PROPERTIES:
        logger.info(f"Found sample property: {property_id}")
        return SAMPLE_PROPERTIES[property_id]
    
    # In a real application, this would fetch from the database
    # For now, just return None for properties not in our sample data
    logger.warning(f"Property with ID {property_id} not found")
    return None

def search_properties(query: str) -> List[Dict[str, Any]]:
    """
    Search for properties matching a query
    
    Args:
        query: Search query (address, city, zip, etc.)
    
    Returns:
        List of matching property data dictionaries
    """
    logger.info(f"Searching for properties with query: {query}")
    
    query = query.lower()
    results = []
    
    # Search in sample properties
    for prop_id, prop_data in SAMPLE_PROPERTIES.items():
        # Check if query matches address, city, zip
        if (query in prop_data['address'].lower() or
            query in prop_data['city'].lower() or
            query in prop_data['zip_code'].lower()):
            results.append(prop_data)
    
    logger.info(f"Found {len(results)} properties matching '{query}'")
    return results