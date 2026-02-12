#!/usr/bin/env python3
"""
TerraFusionBuild - Professional Building Cost Estimation System
Marshall & Swift Replacement - Benton County Implementation
Enterprise-Grade Property Valuation Platform
"""

import json
import sqlite3
import requests
from datetime import datetime, timedelta
from flask import Flask, render_template, request, jsonify, redirect, url_for, flash
from werkzeug.exceptions import RequestEntityTooLarge
import logging
import os
from typing import Dict, List, Optional

# Import our enhanced cost engine
from enhanced_cost_engine import calculate_enhanced_rcn, generate_cost_report, cost_engine

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('terrabuild.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.secret_key = 'terrafusion_build_secret_key_2025'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Configuration
DATA_HUB_URL = "http://localhost:5002"
DATABASE_FILE = "terrabuild.db"

class TerraFusionBuildApp:
    """Main application class for TerraFusionBuild"""
    
    def __init__(self):
        self.init_database()
        self.data_hub_connected = self.check_data_hub_connection()
        logger.info("TerraFusionBuild application initialized")
    
    def init_database(self):
        """Initialize SQLite database for local storage"""
        try:
            conn = sqlite3.connect(DATABASE_FILE)
            cursor = conn.cursor()
            
            # Create properties table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS properties (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    property_id TEXT UNIQUE,
                    address TEXT,
                    building_type TEXT,
                    square_footage REAL,
                    year_built INTEGER,
                    region TEXT,
                    quality TEXT,
                    condition TEXT,
                    complexity TEXT,
                    last_rcn_calculation REAL,
                    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Create cost_calculations table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS cost_calculations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    property_id TEXT,
                    calculation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    replacement_cost_new REAL,
                    cost_per_sqft REAL,
                    methodology TEXT,
                    confidence_score REAL,
                    calculation_details TEXT,
                    FOREIGN KEY (property_id) REFERENCES properties (property_id)
                )
            ''')
            
            # Create users table for audit trail
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE,
                    role TEXT,
                    last_login TIMESTAMP,
                    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            conn.commit()
            conn.close()
            logger.info("Database initialized successfully")
            
        except Exception as e:
            logger.error(f"Database initialization error: {e}")
    
    def check_data_hub_connection(self) -> bool:
        """Check connection to TerraFusionSync data hub"""
        try:
            response = requests.get(f"{DATA_HUB_URL}/health", timeout=5)
            return response.status_code == 200
        except:
            logger.warning("Data hub connection not available")
            return False
    
    def get_property_data(self, property_id: str) -> Optional[Dict]:
        """Get property data from local database or data hub"""
        try:
            # First try local database
            conn = sqlite3.connect(DATABASE_FILE)
            cursor = conn.cursor()
            cursor.execute('''
                SELECT * FROM properties WHERE property_id = ?
            ''', (property_id,))
            
            result = cursor.fetchone()
            conn.close()
            
            if result:
                columns = ['id', 'property_id', 'address', 'building_type', 
                          'square_footage', 'year_built', 'region', 'quality', 
                          'condition', 'complexity', 'last_rcn_calculation', 'last_updated']
                return dict(zip(columns, result))
            
            # Try data hub if local not found
            if self.data_hub_connected:
                response = requests.get(f"{DATA_HUB_URL}/api/v1/properties/{property_id}")
                if response.status_code == 200:
                    return response.json()
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting property data: {e}")
            return None
    
    def save_property_data(self, property_data: Dict) -> bool:
        """Save property data to local database"""
        try:
            conn = sqlite3.connect(DATABASE_FILE)
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT OR REPLACE INTO properties 
                (property_id, address, building_type, square_footage, year_built, 
                 region, quality, condition, complexity, last_rcn_calculation)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                property_data.get('property_id'),
                property_data.get('address'),
                property_data.get('building_type'),
                property_data.get('square_footage'),
                property_data.get('year_built'),
                property_data.get('region'),
                property_data.get('quality'),
                property_data.get('condition'),
                property_data.get('complexity'),
                property_data.get('last_rcn_calculation')
            ))
            
            conn.commit()
            conn.close()
            return True
            
        except Exception as e:
            logger.error(f"Error saving property data: {e}")
            return False
    
    def save_cost_calculation(self, property_id: str, calculation_result: Dict) -> bool:
        """Save cost calculation to database"""
        try:
            conn = sqlite3.connect(DATABASE_FILE)
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO cost_calculations 
                (property_id, replacement_cost_new, cost_per_sqft, methodology, 
                 confidence_score, calculation_details)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                property_id,
                calculation_result.get('replacement_cost_new'),
                calculation_result.get('cost_per_sqft'),
                calculation_result.get('methodology'),
                calculation_result.get('breakdown', {}).get('confidence_score'),
                json.dumps(calculation_result)
            ))
            
            conn.commit()
            conn.close()
            return True
            
        except Exception as e:
            logger.error(f"Error saving cost calculation: {e}")
            return False

# Initialize application
terra_build = TerraFusionBuildApp()

@app.route('/')
def index():
    """Main dashboard"""
    try:
        # Get recent calculations
        conn = sqlite3.connect(DATABASE_FILE)
        cursor = conn.cursor()
        cursor.execute('''
            SELECT p.property_id, p.address, c.replacement_cost_new, c.calculation_date
            FROM properties p
            LEFT JOIN cost_calculations c ON p.property_id = c.property_id
            ORDER BY c.calculation_date DESC
            LIMIT 10
        ''')
        recent_calculations = cursor.fetchall()
        conn.close()
        
        # Get system statistics
        stats = {
            'total_properties': len(recent_calculations),
            'data_hub_status': 'Connected' if terra_build.data_hub_connected else 'Offline',
            'cost_engine_version': cost_engine.factors.get('version', '2025.1'),
            'last_update': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
        
        return render_template('dashboard.html', 
                             recent_calculations=recent_calculations,
                             stats=stats)
    except Exception as e:
        logger.error(f"Dashboard error: {e}")
        return render_template('error.html', error=str(e))

@app.route('/property/<property_id>')
def property_detail(property_id):
    """Property detail view with cost analysis"""
    try:
        property_data = terra_build.get_property_data(property_id)
        
        if not property_data:
            flash(f'Property {property_id} not found', 'error')
            return redirect(url_for('index'))
        
        # Generate cost analysis
        cost_analysis = calculate_enhanced_rcn(property_data)
        
        # Get comparable properties
        comparables = cost_engine.get_comparable_properties(property_data)
        
        # Save calculation to database
        terra_build.save_cost_calculation(property_id, cost_analysis)
        
        return render_template('property_detail.html',
                             property=property_data,
                             cost_analysis=cost_analysis,
                             comparables=comparables)
        
    except Exception as e:
        logger.error(f"Property detail error: {e}")
        flash(f'Error loading property details: {e}', 'error')
        return redirect(url_for('index'))

@app.route('/api/v1/calculate_rcn', methods=['POST'])
def api_calculate_rcn():
    """API endpoint for RCN calculation"""
    try:
        property_data = request.json
        
        if not property_data:
            return jsonify({'error': 'No property data provided'}), 400
        
        # Validate required fields
        required_fields = ['building_type', 'square_footage', 'year_built']
        missing_fields = [field for field in required_fields if not property_data.get(field)]
        
        if missing_fields:
            return jsonify({
                'error': f'Missing required fields: {", ".join(missing_fields)}'
            }), 400
        
        # Calculate RCN
        result = calculate_enhanced_rcn(property_data)
        
        # Save to database if property_id provided
        if property_data.get('property_id'):
            terra_build.save_property_data(property_data)
            terra_build.save_cost_calculation(property_data['property_id'], result)
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"API calculation error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/v1/generate_report', methods=['POST'])
def api_generate_report():
    """API endpoint for generating comprehensive cost reports"""
    try:
        property_data = request.json
        
        if not property_data:
            return jsonify({'error': 'No property data provided'}), 400
        
        # Generate comprehensive report
        report = generate_cost_report(property_data)
        
        return jsonify(report)
        
    except Exception as e:
        logger.error(f"API report generation error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/cost_calculator')
def cost_calculator():
    """Interactive cost calculator page"""
    try:
        # Get available options from cost engine
        building_types = cost_engine.factors['factors']['buildingTypes']
        regions = cost_engine.factors['factors']['regions']
        quality_levels = cost_engine.factors['factors']['quality']
        condition_levels = cost_engine.factors['factors']['condition']
        
        return render_template('cost_calculator.html',
                             building_types=building_types,
                             regions=regions,
                             quality_levels=quality_levels,
                             condition_levels=condition_levels)
        
    except Exception as e:
        logger.error(f"Cost calculator error: {e}")
        return render_template('error.html', error=str(e))

@app.route('/reports')
def reports():
    """Reports dashboard"""
    try:
        # Get calculation history
        conn = sqlite3.connect(DATABASE_FILE)
        cursor = conn.cursor()
        cursor.execute('''
            SELECT p.property_id, p.address, p.building_type, p.square_footage,
                   c.replacement_cost_new, c.cost_per_sqft, c.confidence_score,
                   c.calculation_date
            FROM properties p
            JOIN cost_calculations c ON p.property_id = c.property_id
            ORDER BY c.calculation_date DESC
            LIMIT 50
        ''')
        
        calculations = cursor.fetchall()
        conn.close()
        
        # Calculate summary statistics
        if calculations:
            total_value = sum([calc[4] for calc in calculations if calc[4]])
            avg_cost_psf = sum([calc[5] for calc in calculations if calc[5]]) / len(calculations)
            avg_confidence = sum([calc[6] for calc in calculations if calc[6]]) / len(calculations)
        else:
            total_value = avg_cost_psf = avg_confidence = 0
        
        summary_stats = {
            'total_calculations': len(calculations),
            'total_value': round(total_value, 2),
            'average_cost_psf': round(avg_cost_psf, 2),
            'average_confidence': round(avg_confidence, 1)
        }
        
        return render_template('reports.html',
                             calculations=calculations,
                             summary_stats=summary_stats)
        
    except Exception as e:
        logger.error(f"Reports error: {e}")
        return render_template('error.html', error=str(e))

@app.route('/api/v1/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '2.0.0',
        'data_hub_connected': terra_build.data_hub_connected,
        'cost_engine_version': cost_engine.factors.get('version', '2025.1')
    })

@app.errorhandler(404)
def not_found(error):
    return render_template('error.html', error='Page not found'), 404

@app.errorhandler(500)
def internal_error(error):
    return render_template('error.html', error='Internal server error'), 500

@app.errorhandler(RequestEntityTooLarge)
def handle_file_too_large(e):
    return jsonify({'error': 'File too large'}), 413

if __name__ == '__main__':
    logger.info("Starting TerraFusionBuild application...")
    app.run(host='0.0.0.0', port=5000, debug=True) 