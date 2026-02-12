"""
Southeastern Washington regional routes.

This module provides routes specific to Southeastern Washington counties.
"""

import logging
from flask import Blueprint, render_template, request, abort, url_for, redirect, flash
from regional.southeastern_wa import (
    get_county_info,
    get_property_types_for_area,
    get_agricultural_metrics,
    generate_comparable_properties,
    format_for_assessment_report
)

logger = logging.getLogger(__name__)

# Create blueprint
se_wa_blueprint = Blueprint('se_wa', __name__)

@se_wa_blueprint.route('/property/<property_id>/assessment', methods=['GET'])
def property_assessment(property_id):
    """
    Display the Southeastern Washington assessment view for a property.
    
    Args:
        property_id: ID of the property to show assessment for
    """
    try:
        # For demo purposes, we're using the same test property data
        # In production, this would fetch real property data
        if property_id == 'ww42':
            # This is our demo property - 4234 OLD MILTON HWY, WALLA WALLA
            property = {
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
                'nearby_schools': [
                    {'name': 'Edison Elementary School', 'type': 'Public, K-5', 'rating': 8, 'distance': 0.8},
                    {'name': 'Pioneer Middle School', 'type': 'Public, 6-8', 'rating': 7, 'distance': 1.2},
                    {'name': 'Walla Walla High School', 'type': 'Public, 9-12', 'rating': 6, 'distance': 2.1},
                    {'name': 'St. Patrick Catholic School', 'type': 'Private, K-8', 'rating': 9, 'distance': 1.5}
                ]
            }
            
            # Get county information based on the property city
            county = get_county_info('walla_walla')
            
            # Format for assessment report (additional fields)
            assessment_data = format_for_assessment_report(property)
            
            # Merge assessment data with property for display
            property.update(assessment_data)
            
            # Render the assessment template
            return render_template(
                'se_wa_assessment.html',
                property=property,
                county=county
            )
        elif property_id == 'bt75':
            # Demo property in Benton County
            property = {
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
                ]
            }
            
            # Get county information
            county = get_county_info('benton')
            
            # Format for assessment report
            assessment_data = format_for_assessment_report(property)
            
            # Merge assessment data with property for display
            property.update(assessment_data)
            
            # Render the assessment template
            return render_template(
                'se_wa_assessment.html',
                property=property,
                county=county
            )
        else:
            # For other property IDs, show error
            flash("The requested property assessment is not available. Please try a different property ID.", "warning")
            return redirect(url_for('index'))
            
    except Exception as e:
        logger.exception(f"Error in SE Washington assessment view: {str(e)}")
        abort(500)

@se_wa_blueprint.route('/se-washington', methods=['GET'])
def se_washington_overview():
    """Regional overview page for Southeastern Washington."""
    counties = {
        'benton': get_county_info('benton'),
        'franklin': get_county_info('franklin'),
        'walla_walla': get_county_info('walla_walla'),
        'columbia': get_county_info('columbia'),
        'garfield': get_county_info('garfield'),
        'asotin': get_county_info('asotin')
    }
    
    return render_template(
        'se_wa_overview.html',
        counties=counties,
        title="Southeastern Washington Overview"
    )

@se_wa_blueprint.route('/se-washington/demo', methods=['GET'])
def se_washington_demo():
    """Demo page showcasing SE Washington properties."""
    # List of demo properties
    properties = [
        {
            'id': 'ww42',
            'address': '4234 OLD MILTON HWY',
            'city': 'WALLA WALLA',
            'state': 'Washington',
            'price': 789000,
            'bedrooms': 4,
            'bathrooms': 3.5,
            'sqft': 2428,
            'image_url': 'https://photos.zillowstatic.com/fp/eb40ee9b33b4f73c4801e21e1cfef69d-cc_ft_1536.webp'
        },
        {
            'id': 'bt75',
            'address': '3821 WILLIAMS BLVD',
            'city': 'RICHLAND',
            'state': 'Washington',
            'price': 625000,
            'bedrooms': 4,
            'bathrooms': 2.5,
            'sqft': 2273,
            'image_url': 'https://photos.zillowstatic.com/fp/eb40ee9b33b4f73c4801e21e1cfef69d-cc_ft_1536.webp'
        }
    ]
    
    return render_template(
        'se_wa_demo.html',
        properties=properties,
        title="Southeastern Washington Demo"
    )