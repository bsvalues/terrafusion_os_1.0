#!/usr/bin/env python3
"""
TerraFusion Enterprise - Simple Working Version
Comprehensive Property Assessment Platform
"""

import os
import logging
import datetime
import json
from flask import Flask, render_template, jsonify, request

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.secret_key = "terrafusion-enterprise-secret"

# Sample Benton County Property Data
SAMPLE_PROPERTIES = []

def generate_benton_county_data():
    """Generate comprehensive Benton County property data"""
    global SAMPLE_PROPERTIES
    
    cities_data = {
        'Kennewick': {'base_value': 380000, 'zip_start': 99336, 'count_ratio': 0.35},
        'Pasco': {'base_value': 320000, 'zip_start': 99301, 'count_ratio': 0.25},
        'Richland': {'base_value': 450000, 'zip_start': 99352, 'count_ratio': 0.20},
        'West Richland': {'base_value': 400000, 'zip_start': 99353, 'count_ratio': 0.08},
        'Prosser': {'base_value': 280000, 'zip_start': 99350, 'count_ratio': 0.07},
        'Benton City': {'base_value': 250000, 'zip_start': 99320, 'count_ratio': 0.05}
    }
    
    property_classes = ['Residential', 'Commercial', 'Industrial', 'Agricultural', 'Mixed Use', 'Vacant']
    
    properties = []
    count = 5000
    
    for i in range(count):
        # Distribute properties among cities based on ratios
        random_val = (i * 7 + 13) % 100 / 100
        cumulative = 0
        
        for city, data in cities_data.items():
            cumulative += data['count_ratio']
            if random_val <= cumulative:
                city_name = city
                city_data = data
                break
        else:
            city_name = 'Kennewick'
            city_data = cities_data['Kennewick']
        
        base_value = city_data['base_value']
        variation = (i % 200 - 100) * 1000
        assessed_value = base_value + variation
        
        property_data = {
            'id': i + 1,
            'parcel_id': f"BC-{53000000 + i:08d}",
            'address': f"{1000 + i * 10} {['Main', 'Oak', 'Pine', 'Elm', 'Maple', 'Cedar'][i % 6]} {['St', 'Ave', 'Rd', 'Blvd'][i % 4]}",
            'city': city_name,
            'state': 'WA',
            'zip_code': str(city_data['zip_start'] + (i % 10)),
            'property_class': property_classes[i % len(property_classes)],
            'year_built': 1960 + (i % 65),
            'bedrooms': 2 + (i % 5),
            'bathrooms': 1.0 + (i % 4) * 0.5,
            'total_area': 1200 + (i % 2500),
            'assessed_value': assessed_value,
            'market_value': assessed_value * 1.12,
            'land_value': assessed_value * 0.28,
            'improvement_value': assessed_value * 0.72,
            'owner_name': f"Property Owner {i + 1}",
            'last_sale_date': f"2020-{1 + (i % 12):02d}-{1 + (i % 28):02d}",
            'last_sale_price': assessed_value * (0.95 + (i % 20) * 0.01)
        }
        
        properties.append(property_data)
    
    SAMPLE_PROPERTIES = properties
    logger.info(f"✅ Generated {len(properties)} Benton County properties")
    return properties

# AI Response Handler
def process_ai_query(query, query_type="general"):
    """Process AI queries with property data integration"""
    
    if query_type == "property_search":
        return handle_property_search(query)
    elif query_type == "assessment":
        return f"🏠 Assessment Analysis for: {query}\n\nBased on current Benton County data:\n• Market trends indicate stable growth\n• Comparable properties in the area\n• Assessment methodology follows WA state guidelines\n• Recent sales data suggests fair market value"
    elif query_type == "levy":
        return f"💰 Levy Calculation for {query}\n\nBenton County Tax Levy Analysis:\n• Base tax rate: 1.2%\n• Special assessments may apply\n• Exemptions available for seniors/veterans\n• Payment options available"
    elif query_type == "trends":
        return f"📈 Market Trends Analysis\n\nBenton County Market Overview:\n• Property values: +3.2% YoY\n• Inventory levels: Moderate\n• Days on market: Average 24 days\n• Price per sq ft: $180-250"
    elif query_type == "sync":
        return f"🔄 Data Synchronization Status\n\nSystems Integration:\n✅ PACS: Connected\n✅ ArcGIS: Active\n✅ Assessment Database: Synced\n\nAll systems operational and data current."
    elif query_type == "debate":
        return f"⚖️ Dual Perspective Analysis\n\n[ Samson ] - Positive View:\nThis approach offers excellent benefits for property assessment efficiency and accuracy. The integration provides comprehensive data access.\n\n[ Michael ] - Alternative Consideration:\nWhile beneficial, we should consider potential challenges like data accuracy verification and system dependencies."
    else:
        return f"🤖 TerraFusion Enterprise AI Response\n\nI understand you're asking about: {query}\n\nAs your comprehensive property assessment AI, I can help with:\n• Property searches and valuations\n• Assessment calculations\n• Market trend analysis\n• Data synchronization\n• Workflow automation"

def handle_property_search(query):
    """Handle property search queries"""
    if not SAMPLE_PROPERTIES:
        return "Property data is currently being loaded. Please try again in a moment."
    
    query_lower = query.lower()
    matching_properties = []
    
    for prop in SAMPLE_PROPERTIES[:10]:
        if (query_lower in prop.get('address', '').lower() or 
            query_lower in prop.get('city', '').lower() or
            query_lower in prop.get('parcel_id', '').lower()):
            matching_properties.append(prop)
    
    if matching_properties:
        result = f"Found {len(matching_properties)} properties matching '{query}':\n\n"
        for prop in matching_properties:
            result += f"📍 {prop.get('address')}, {prop.get('city')}\n"
            result += f"   💰 Assessed Value: ${prop.get('assessed_value', 0):,.2f}\n"
            result += f"   🏠 {prop.get('property_class')} | Built: {prop.get('year_built')}\n\n"
        return result
    else:
        return f"No properties found matching '{query}'. Try searching by address, city, or parcel ID."

# Routes
@app.route('/')
def dashboard():
    """Enhanced dashboard"""
    return render_template('enhanced_dashboard.html')

@app.route('/api/system_status')
def system_status():
    """System status"""
    return jsonify({
        'ai_model': True,
        'database': True,
        'arcgis_integration': True,
        'assessment_tools': True,
        'sync_management': True,
        'total_properties': len(SAMPLE_PROPERTIES),
        'version': 'TerraFusion Enterprise v2.0 (Simple)',
        'status': 'operational'
    })

@app.route('/api/query', methods=['POST'])
def handle_query():
    """Handle AI queries"""
    data = request.get_json()
    query = data.get('query', '')
    query_type = data.get('type', 'general')
    
    if not query.strip():
        return jsonify({'error': 'Query cannot be empty'}), 400
    
    response = process_ai_query(query, query_type)
    
    return jsonify({
        'query': query,
        'response': response,
        'type': query_type,
        'timestamp': datetime.datetime.utcnow().isoformat()
    })

@app.route('/api/properties')
def get_properties():
    """Get properties"""
    return jsonify({
        'total': len(SAMPLE_PROPERTIES),
        'properties': SAMPLE_PROPERTIES[:100],
        'source': 'enhanced_sample_data'
    })

@app.route('/api/sync_jobs')
def get_sync_jobs():
    """Get sync jobs"""
    sample_jobs = [
        {
            'id': 1,
            'name': 'PACS to TerraFusion',
            'source': 'PACS',
            'target': 'TerraFusion',
            'status': 'active',
            'records_processed': 5000,
            'last_run': '2025-01-19T10:00:00Z',
            'next_run': '2025-01-20T10:00:00Z'
        },
        {
            'id': 2,
            'name': 'ArcGIS Data Sync',
            'source': 'ArcGIS',
            'target': 'TerraFusion',
            'status': 'active',
            'records_processed': 5000,
            'last_run': '2025-01-19T09:30:00Z',
            'next_run': '2025-01-20T09:30:00Z'
        }
    ]
    
    return jsonify({'sync_jobs': sample_jobs})

@app.route('/api/statistics')
def get_statistics():
    """Get platform statistics"""
    if not SAMPLE_PROPERTIES:
        return jsonify({'error': 'No property data available'})
    
    cities = {}
    property_types = {}
    value_ranges = {'under_300k': 0, '300k_500k': 0, '500k_750k': 0, 'over_750k': 0}
    total_value = 0
    
    for prop in SAMPLE_PROPERTIES:
        # City distribution
        city = prop.get('city', 'Unknown')
        cities[city] = cities.get(city, 0) + 1
        
        # Property type distribution
        prop_type = prop.get('property_class', 'Unknown')
        property_types[prop_type] = property_types.get(prop_type, 0) + 1
        
        # Value range distribution
        value = prop.get('assessed_value', 0)
        total_value += value
        
        if value < 300000:
            value_ranges['under_300k'] += 1
        elif value < 500000:
            value_ranges['300k_500k'] += 1
        elif value < 750000:
            value_ranges['500k_750k'] += 1
        else:
            value_ranges['over_750k'] += 1
    
    avg_value = total_value / len(SAMPLE_PROPERTIES) if SAMPLE_PROPERTIES else 0
    
    return jsonify({
        'total_properties': len(SAMPLE_PROPERTIES),
        'total_assessed_value': total_value,
        'average_value': avg_value,
        'cities': cities,
        'property_types': property_types,
        'value_ranges': value_ranges,
        'data_source': 'enhanced_sample_data'
    })

if __name__ == "__main__":
    logger.info("🚀 TerraFusion Enterprise (Simple) starting...")
    logger.info("📊 Comprehensive Property Assessment Platform")
    logger.info("🗺️ Generating Benton County property data...")
    
    # Generate sample data
    generate_benton_county_data()
    
    logger.info("✅ System ready!")
    app.run(host='0.0.0.0', port=5003, debug=True) 