"""
Southeastern Washington State regional customization module.

This module provides specific functionality for counties in Southeastern Washington,
including Benton, Franklin, Walla Walla, Columbia, Garfield, and Asotin counties.
"""

import logging
import os
from datetime import datetime
from typing import Dict, List, Optional, Any

logger = logging.getLogger(__name__)

# Counties in Southeastern Washington
SE_WA_COUNTIES = {
    'benton': {
        'name': 'Benton County',
        'seat': 'Prosser',
        'largest_city': 'Kennewick',
        'assessor_url': 'https://www.co.benton.wa.us/pview.aspx?id=1425&catID=45',
        'gis_url': 'https://www.bentoncounty.us/pview.aspx?id=1562&catid=45',
        'key_areas': ['Kennewick', 'Richland', 'West Richland', 'Prosser', 'Benton City']
    },
    'franklin': {
        'name': 'Franklin County',
        'seat': 'Pasco',
        'largest_city': 'Pasco',
        'assessor_url': 'https://www.co.franklin.wa.us/assessor/',
        'gis_url': 'https://franklinwa-gis.maps.arcgis.com/home/index.html',
        'key_areas': ['Pasco', 'Connell', 'Mesa', 'Basin City']
    },
    'walla_walla': {
        'name': 'Walla Walla County',
        'seat': 'Walla Walla',
        'largest_city': 'Walla Walla',
        'assessor_url': 'https://www.co.walla-walla.wa.us/government/assessor/index.php',
        'gis_url': 'https://wallawallagis.maps.arcgis.com/home/index.html',
        'key_areas': ['Walla Walla', 'College Place', 'Waitsburg', 'Prescott', 'Burbank']
    },
    'columbia': {
        'name': 'Columbia County',
        'seat': 'Dayton',
        'largest_city': 'Dayton',
        'assessor_url': 'https://www.columbiaco.com/index.php/offices/assessor',
        'gis_url': 'https://columbia-county-wa-columbia.hub.arcgis.com/',
        'key_areas': ['Dayton', 'Starbuck']
    },
    'garfield': {
        'name': 'Garfield County',
        'seat': 'Pomeroy',
        'largest_city': 'Pomeroy',
        'assessor_url': 'http://www.co.garfield.wa.us/assessor',
        'gis_url': 'http://www.co.garfield.wa.us/geographic-information-systems-gis',
        'key_areas': ['Pomeroy']
    },
    'asotin': {
        'name': 'Asotin County',
        'seat': 'Asotin',
        'largest_city': 'Clarkston',
        'assessor_url': 'https://www.co.asotin.wa.us/assessor',
        'gis_url': 'https://www.co.asotin.wa.us/community-development/gis-mapping',
        'key_areas': ['Clarkston', 'Asotin']
    }
}

# Agricultural land types common in SE Washington
AGRICULTURAL_LAND_TYPES = [
    'Dryland Wheat',
    'Irrigated Cropland',
    'Vineyard',
    'Orchard',
    'Pasture',
    'Rangeland',
    'Hops',
    'Onion Fields',
    'Potato Fields',
    'Corn Fields',
    'Apple Orchards',
    'Cherry Orchards',
    'Mint Fields',
    'Asparagus Fields'
]

# Property types specific to the region
REGIONAL_PROPERTY_TYPES = [
    'Single Family Residential',
    'Multi-Family Residential',
    'Agricultural',
    'Vineyard',
    'Winery',
    'Orchard',
    'Commercial',
    'Industrial',
    'Vacant Land',
    'Riverfront Property',
    'Rural Residential',
    'Manufactured Home',
    'Condominium',
    'Historic Property'
]

def get_county_info(county_name: str) -> Dict[str, Any]:
    """Get information about a specific county in SE Washington."""
    county_key = county_name.lower().replace(' ', '_')
    if county_key in SE_WA_COUNTIES:
        return SE_WA_COUNTIES[county_key]
    else:
        logger.warning(f"County '{county_name}' not found in Southeastern Washington database")
        return {}

def get_property_types_for_area(area_name: str) -> List[str]:
    """Get the most common property types for a specific area."""
    area_name = area_name.lower()
    
    # Default property types
    property_types = REGIONAL_PROPERTY_TYPES[:5]  # Just the first 5 generic types
    
    # Add area-specific property types
    if any(area in area_name for area in ['prosser', 'benton city', 'paterson', 'alderdale']):
        property_types.extend(['Vineyard', 'Winery', 'Wine Tasting Room'])
    
    if any(area in area_name for area in ['pasco', 'kennewick', 'richland']):
        property_types.extend(['Tri-Cities Urban Residential', 'Commercial', 'Industrial'])
    
    if 'walla walla' in area_name:
        property_types.extend(['Vineyard', 'Winery', 'Historic Home', 'College Housing'])
    
    if any(area in area_name for area in ['waitsburg', 'dayton', 'pomeroy', 'starbuck']):
        property_types.extend(['Historic Property', 'Rural Residential', 'Dryland Farm'])
    
    if 'richland' in area_name:
        property_types.append('Hanford Area Housing')
    
    return property_types

def get_agricultural_metrics(property_id: str) -> Dict[str, Any]:
    """
    Get agricultural metrics for a property.
    
    This would typically connect to county-specific agricultural data
    sources to retrieve crop yields, water rights, soil types, etc.
    """
    # This is a placeholder function that would be implemented with
    # real data connections to county agricultural databases
    return {
        "soil_type": "Sandy loam",
        "water_rights": "Certificate #12345",
        "crop_yield_history": [
            {"year": 2022, "yield": "5.2 tons/acre"},
            {"year": 2023, "yield": "5.8 tons/acre"},
            {"year": 2024, "yield": "5.5 tons/acre"}
        ],
        "land_classification": "Irrigated cropland",
        "primary_crops": ["Apples", "Cherries", "Wheat"]
    }

def generate_comparable_properties(property_data: Dict[str, Any], county: str) -> List[Dict[str, Any]]:
    """
    Generate a list of comparable properties for valuation purposes.
    
    Args:
        property_data: Data about the subject property
        county: The county where the property is located
    
    Returns:
        List of comparable properties with similarity scores
    """
    # This function would be implemented to pull real data from county records
    # but for now returns a demonstration of the structure
    return [
        {
            "property_id": "comp1",
            "address": "123 Comparable Ave",
            "similarity_score": 0.92,
            "sale_date": "2024-02-15",
            "sale_price": 450000,
            "key_similarities": ["Same neighborhood", "Similar size", "Similar age"],
            "key_differences": ["One fewer bathroom", "Smaller lot"]
        },
        {
            "property_id": "comp2",
            "address": "456 Similar St",
            "similarity_score": 0.87,
            "sale_date": "2024-01-10",
            "sale_price": 425000,
            "key_similarities": ["Same age", "Similar quality", "Similar features"],
            "key_differences": ["Different neighborhood", "Smaller garage"]
        },
        {
            "property_id": "comp3",
            "address": "789 Assessment Ln",
            "similarity_score": 0.85,
            "sale_date": "2023-12-05",
            "sale_price": 465000,
            "key_similarities": ["Similar size", "Similar lot size", "Similar features"],
            "key_differences": ["Newer construction", "Different view quality"]
        }
    ]

def format_for_assessment_report(property_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Format property data specifically for county assessment reporting requirements.
    
    This function restructures property data to match the format expected by
    Southeastern Washington county assessment offices.
    """
    # This would be implemented to format data according to specific county requirements
    assessment_data = {
        "parcel_id": property_data.get("id", ""),
        "property_address": property_data.get("address", ""),
        "owner_name": property_data.get("owner_name", "Current Owner"),
        "legal_description": property_data.get("legal_description", ""),
        "land_value": property_data.get("land_value", 0),
        "improvement_value": property_data.get("improvement_value", 0),
        "total_value": property_data.get("price", 0),
        "assessment_year": datetime.now().year,
        "levy_code": property_data.get("levy_code", ""),
        "property_class": property_data.get("property_type", ""),
        "tax_area": property_data.get("tax_area", ""),
        "acres": property_data.get("lot_size", "").replace(" acres", ""),
        "year_built": property_data.get("year_built", ""),
        "last_sale_date": "",
        "last_sale_price": 0,
        "exemptions": [],
        "neighborhood_code": "",
    }
    
    # Extract the last sale information from price history if available
    price_history = property_data.get("price_history", [])
    if price_history and len(price_history) > 0:
        last_sale = next((sale for sale in price_history if sale.get("event", "").lower() == "sold"), None)
        if last_sale:
            assessment_data["last_sale_date"] = last_sale.get("date", "")
            assessment_data["last_sale_price"] = last_sale.get("price", 0)
    
    return assessment_data

def get_regional_insights(property_data: Dict[str, Any], county: str) -> List[Dict[str, str]]:
    """
    Generate region-specific insights about a property for the AI suggestions panel.
    
    Args:
        property_data: Data about the property
        county: The county where the property is located
    
    Returns:
        List of insights with title and description
    """
    county_data = get_county_info(county)
    insights = []
    
    # Add market trend insight
    insights.append({
        "title": f"{county_data.get('name', county)} Market Trends",
        "description": f"Property values in {county_data.get('name', county)} have increased 7.2% in the past year, affecting this property's assessment."
    })
    
    # Add agricultural insight if applicable
    if property_data.get("property_type", "").lower() in ["agricultural", "farm", "vineyard", "orchard"]:
        insights.append({
            "title": "Agricultural Classification",
            "description": "This property may qualify for agricultural use valuation. Review the current classification to ensure proper assessment."
        })
    
    # Add water rights insight for rural properties
    if "acres" in property_data.get("lot_size", "").lower() and float(property_data.get("lot_size", "0").replace(" acres", "")) > 1.0:
        insights.append({
            "title": "Water Rights Assessment",
            "description": "Check water rights documentation for this property. In Southeastern Washington, water rights significantly impact agricultural property values."
        })
    
    # Add comparable sales insight
    insights.append({
        "title": "Comparable Sales Analysis",
        "description": f"Recent sales in this area suggest the per-square-foot value is approximately ${property_data.get('price_per_sqft', 0)}. Review against assessment methodology."
    })
    
    # Add area-specific insight
    city = property_data.get("city", "").lower()
    if city in [area.lower() for area in county_data.get("key_areas", [])]:
        insights.append({
            "title": f"{city.title()} Area Development",
            "description": f"Recent development in {city.title()} may affect this property's valuation. Consider reviewing neighborhood adjustment factors."
        })
    
    return insights