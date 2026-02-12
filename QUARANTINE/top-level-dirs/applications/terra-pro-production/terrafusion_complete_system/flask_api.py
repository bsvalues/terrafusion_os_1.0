#!/usr/bin/env python3
"""
TerraFusion Core AI Valuator - Simple Flask API
An alternative implementation to expose the valuation endpoint
"""
import os
import sys
import json
import logging
from flask import Flask, request, jsonify
from datetime import datetime

# Import the PropertyValuationModel
from backend.valuation_engine import PropertyValuationModel

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)

# Initialize the valuation model
valuation_model = PropertyValuationModel()

# Mock database for properties (same as in valuation_api.py)
PROPERTY_DB = {
    1: {
        "address": {
            "street": "123 Main St",
            "city": "Anytown",
            "state": "CA",
            "zipCode": "90210"
        },
        "propertyType": "single-family",
        "bedrooms": 3,
        "bathrooms": 2.5,
        "squareFeet": 2100,
        "yearBuilt": 1985,
        "lotSize": 0.25,
        "features": [
            {"name": "Hardwood Floors"},
            {"name": "Fireplace"}
        ],
        "condition": "Good"
    },
    2: {
        "address": {
            "street": "456 Oak Ave",
            "city": "Somewhere",
            "state": "TX",
            "zipCode": "75001"
        },
        "propertyType": "townhouse",
        "bedrooms": 2,
        "bathrooms": 1.5,
        "squareFeet": 1500,
        "yearBuilt": 2005,
        "lotSize": 0.1,
        "features": [
            {"name": "Updated Kitchen"}
        ],
        "condition": "Excellent"
    }
}

@app.route('/')
def index():
    """Root endpoint providing API information"""
    return jsonify({
        "message": "TerraFusion AI Valuator Flask API",
        "version": "1.0.0",
        "endpoints": [
            "/ai/value/<property_id>",
            "/ai/value"
        ]
    })

@app.route('/ai/value/<int:property_id>', methods=['GET'])
def value_property(property_id):
    """
    Get an AI-powered valuation for a property by its ID
    """
    logger.info(f"Received valuation request for property ID: {property_id}")
    
    # Get property details from our mock DB
    property_data = PROPERTY_DB.get(property_id)
    if not property_data:
        return jsonify({"error": f"Property with ID {property_id} not found"}), 404
    
    try:
        # Generate valuation report using our model
        valuation_report = valuation_model.generate_valuation_report(property_data)
        
        # Add timestamp
        valuation_report["timestamp"] = datetime.now().isoformat()
        
        return jsonify(valuation_report)
    except Exception as e:
        logger.error(f"Error generating valuation for property ID {property_id}: {str(e)}")
        return jsonify({"error": f"Valuation error: {str(e)}"}), 500

@app.route('/ai/value', methods=['POST'])
def value_property_by_details():
    """
    Get an AI-powered valuation based on provided property details
    """
    try:
        property_details = request.json
        if not property_details:
            return jsonify({"error": "No property details provided"}), 400
            
        logger.info(f"Received valuation request for property at {property_details.get('address', {}).get('street', 'unknown')}")
        
        # Generate valuation report using our model
        valuation_report = valuation_model.generate_valuation_report(property_details)
        
        # Add timestamp
        valuation_report["timestamp"] = datetime.now().isoformat()
        
        return jsonify(valuation_report)
    except Exception as e:
        logger.error(f"Error generating valuation by details: {str(e)}")
        return jsonify({"error": f"Valuation error: {str(e)}"}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    app.run(host='0.0.0.0', port=port, debug=True)