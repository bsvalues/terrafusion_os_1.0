#!/usr/bin/env python3
"""
TerraFusionBuild - COMPLETE Marshall & Swift Replacement Application
Real Working System - Not a Demo
"""

from flask import Flask, render_template, request, jsonify, redirect, url_for, flash, session
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3
import json
import os
from datetime import datetime, timedelta
from enhanced_cost_engine import calculate_enhanced_rcn, generate_cost_report
import logging
from functools import wraps

app = Flask(__name__)
app.secret_key = 'terrafusion-build-secret-key-2025'

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DATABASE = 'terrafusion_build.db'

def init_database():
    """Initialize the complete database schema"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'user',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP
        )
    ''')
    
    # Properties table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS properties (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            property_id TEXT UNIQUE,
            address TEXT NOT NULL,
            city TEXT,
            state TEXT DEFAULT 'WA',
            zip_code TEXT,
            building_type TEXT NOT NULL,
            square_footage INTEGER NOT NULL,
            year_built INTEGER,
            region TEXT NOT NULL,
            quality TEXT NOT NULL,
            condition_rating TEXT NOT NULL,
            complexity TEXT DEFAULT 'STANDARD',
            created_by INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (created_by) REFERENCES users (id)
        )
    ''')
    
    # Cost calculations table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS cost_calculations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            property_id INTEGER NOT NULL,
            replacement_cost_new REAL NOT NULL,
            cost_per_sqft REAL NOT NULL,
            base_cost_psf REAL NOT NULL,
            regional_factor REAL NOT NULL,
            quality_factor REAL NOT NULL,
            condition_factor REAL NOT NULL,
            age_factor REAL NOT NULL,
            confidence_score REAL NOT NULL,
            methodology TEXT NOT NULL,
            calculation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            calculated_by INTEGER,
            FOREIGN KEY (property_id) REFERENCES properties (id),
            FOREIGN KEY (calculated_by) REFERENCES users (id)
        )
    ''')
    
    # Reports table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            property_id INTEGER NOT NULL,
            report_type TEXT NOT NULL,
            report_data TEXT NOT NULL,
            generated_by INTEGER,
            generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (property_id) REFERENCES properties (id),
            FOREIGN KEY (generated_by) REFERENCES users (id)
        )
    ''')
    
    # Create default admin user
    admin_hash = generate_password_hash('admin123')
    cursor.execute('''
        INSERT OR IGNORE INTO users (username, email, password_hash, role)
        VALUES (?, ?, ?, ?)
    ''', ('admin', 'admin@terrafusion.com', admin_hash, 'admin'))
    
    conn.commit()
    conn.close()
    logger.info("Database initialized successfully")

def login_required(f):
    """Decorator to require login"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

def get_db_connection():
    """Get database connection"""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/')
def index():
    """Main dashboard"""
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    conn = get_db_connection()
    
    # Get statistics
    total_properties = conn.execute('SELECT COUNT(*) FROM properties').fetchone()[0]
    total_calculations = conn.execute('SELECT COUNT(*) FROM cost_calculations').fetchone()[0]
    
    # Get recent properties
    recent_properties = conn.execute('''
        SELECT p.*, c.replacement_cost_new, c.cost_per_sqft, c.confidence_score
        FROM properties p
        LEFT JOIN cost_calculations c ON p.id = c.property_id
        ORDER BY p.created_at DESC
        LIMIT 10
    ''').fetchall()
    
    # Get total value calculated
    total_value = conn.execute('''
        SELECT SUM(replacement_cost_new) FROM cost_calculations
    ''').fetchone()[0] or 0
    
    conn.close()
    
    return render_template('dashboard.html', 
                         total_properties=total_properties,
                         total_calculations=total_calculations,
                         total_value=total_value,
                         recent_properties=recent_properties)

@app.route('/login', methods=['GET', 'POST'])
def login():
    """User login"""
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        conn = get_db_connection()
        user = conn.execute(
            'SELECT * FROM users WHERE username = ?', (username,)
        ).fetchone()
        conn.close()
        
        if user and check_password_hash(user['password_hash'], password):
            session['user_id'] = user['id']
            session['username'] = user['username']
            session['role'] = user['role']
            
            # Update last login
            conn = get_db_connection()
            conn.execute(
                'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
                (user['id'],)
            )
            conn.commit()
            conn.close()
            
            flash('Login successful!', 'success')
            return redirect(url_for('index'))
        else:
            flash('Invalid username or password!', 'error')
    
    return render_template('login.html')

@app.route('/logout')
def logout():
    """User logout"""
    session.clear()
    flash('You have been logged out.', 'info')
    return redirect(url_for('login'))

@app.route('/property/new', methods=['GET', 'POST'])
@login_required
def new_property():
    """Add new property"""
    if request.method == 'POST':
        try:
            # Get form data
            property_data = {
                'property_id': request.form['property_id'],
                'address': request.form['address'],
                'city': request.form['city'],
                'zip_code': request.form['zip_code'],
                'building_type': request.form['building_type'],
                'square_footage': int(request.form['square_footage']),
                'year_built': int(request.form['year_built']) if request.form['year_built'] else None,
                'region': request.form['region'],
                'quality': request.form['quality'],
                'condition_rating': request.form['condition_rating'],
                'complexity': request.form.get('complexity', 'STANDARD')
            }
            
            # Insert property into database
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO properties (
                    property_id, address, city, zip_code, building_type,
                    square_footage, year_built, region, quality, condition_rating,
                    complexity, created_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                property_data['property_id'], property_data['address'],
                property_data['city'], property_data['zip_code'],
                property_data['building_type'], property_data['square_footage'],
                property_data['year_built'], property_data['region'],
                property_data['quality'], property_data['condition_rating'],
                property_data['complexity'], session['user_id']
            ))
            
            property_db_id = cursor.lastrowid
            conn.commit()
            conn.close()
            
            flash('Property added successfully!', 'success')
            return redirect(url_for('calculate_cost', property_id=property_db_id))
            
        except Exception as e:
            flash(f'Error adding property: {str(e)}', 'error')
            logger.error(f"Error adding property: {e}")
    
    return render_template('new_property.html')

@app.route('/property/<int:property_id>')
@login_required
def view_property(property_id):
    """View property details"""
    conn = get_db_connection()
    
    property_data = conn.execute('''
        SELECT p.*, u.username as created_by_name
        FROM properties p
        LEFT JOIN users u ON p.created_by = u.id
        WHERE p.id = ?
    ''', (property_id,)).fetchone()
    
    if not property_data:
        flash('Property not found!', 'error')
        return redirect(url_for('index'))
    
    # Get calculations
    calculations = conn.execute('''
        SELECT c.*, u.username as calculated_by_name
        FROM cost_calculations c
        LEFT JOIN users u ON c.calculated_by = u.id
        WHERE c.property_id = ?
        ORDER BY c.calculation_date DESC
    ''', (property_id,)).fetchall()
    
    # Get reports
    reports = conn.execute('''
        SELECT r.*, u.username as generated_by_name
        FROM reports r
        LEFT JOIN users u ON r.generated_by = u.id
        WHERE r.property_id = ?
        ORDER BY r.generated_at DESC
    ''', (property_id,)).fetchall()
    
    conn.close()
    
    return render_template('property_detail.html',
                         property=property_data,
                         calculations=calculations,
                         reports=reports)

@app.route('/calculate/<int:property_id>')
@login_required
def calculate_cost(property_id):
    """Calculate replacement cost for property"""
    conn = get_db_connection()
    
    property_data = conn.execute(
        'SELECT * FROM properties WHERE id = ?', (property_id,)
    ).fetchone()
    
    if not property_data:
        flash('Property not found!', 'error')
        return redirect(url_for('index'))
    
    try:
        # Prepare data for calculation
        calc_data = {
            'building_type': property_data['building_type'],
            'square_footage': property_data['square_footage'],
            'year_built': property_data['year_built'],
            'region': property_data['region'],
            'quality': property_data['quality'],
            'condition': property_data['condition_rating'],
            'complexity': property_data['complexity']
        }
        
        # Perform calculation
        result = calculate_enhanced_rcn(calc_data)
        
        if result['success']:
            # Store calculation in database
            conn.execute('''
                INSERT INTO cost_calculations (
                    property_id, replacement_cost_new, cost_per_sqft,
                    base_cost_psf, regional_factor, quality_factor,
                    condition_factor, age_factor, confidence_score,
                    methodology, calculated_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                property_id, result['replacement_cost_new'], result['cost_per_sqft'],
                result['breakdown']['base_cost_psf'], result['breakdown']['regional_factor'],
                result['breakdown']['quality_factor'], result['breakdown']['condition_factor'],
                result['breakdown']['age_factor'], result['breakdown']['confidence_score'],
                result['methodology'], session['user_id']
            ))
            conn.commit()
            
            flash('Cost calculation completed successfully!', 'success')
        else:
            flash(f'Calculation error: {result.get("error", "Unknown error")}', 'error')
    
    except Exception as e:
        flash(f'Error performing calculation: {str(e)}', 'error')
        logger.error(f"Calculation error: {e}")
    
    conn.close()
    return redirect(url_for('view_property', property_id=property_id))

@app.route('/report/<int:property_id>')
@login_required
def generate_report(property_id):
    """Generate comprehensive report"""
    conn = get_db_connection()
    
    property_data = conn.execute(
        'SELECT * FROM properties WHERE id = ?', (property_id,)
    ).fetchone()
    
    if not property_data:
        flash('Property not found!', 'error')
        return redirect(url_for('index'))
    
    try:
        # Prepare data for report
        report_data = {
            'building_type': property_data['building_type'],
            'square_footage': property_data['square_footage'],
            'year_built': property_data['year_built'],
            'region': property_data['region'],
            'quality': property_data['quality'],
            'condition': property_data['condition_rating'],
            'complexity': property_data['complexity']
        }
        
        # Generate report
        report = generate_cost_report(report_data)
        
        # Store report in database
        conn.execute('''
            INSERT INTO reports (property_id, report_type, report_data, generated_by)
            VALUES (?, ?, ?, ?)
        ''', (property_id, 'comprehensive', json.dumps(report), session['user_id']))
        conn.commit()
        
        flash('Report generated successfully!', 'success')
        
    except Exception as e:
        flash(f'Error generating report: {str(e)}', 'error')
        logger.error(f"Report generation error: {e}")
    
    conn.close()
    return redirect(url_for('view_property', property_id=property_id))

@app.route('/properties')
@login_required
def list_properties():
    """List all properties"""
    conn = get_db_connection()
    
    # Get search parameters
    search = request.args.get('search', '')
    building_type = request.args.get('building_type', '')
    region = request.args.get('region', '')
    
    # Build query
    query = '''
        SELECT p.*, c.replacement_cost_new, c.cost_per_sqft, c.confidence_score
        FROM properties p
        LEFT JOIN cost_calculations c ON p.id = c.property_id
        WHERE 1=1
    '''
    params = []
    
    if search:
        query += ' AND (p.address LIKE ? OR p.property_id LIKE ?)'
        params.extend([f'%{search}%', f'%{search}%'])
    
    if building_type:
        query += ' AND p.building_type = ?'
        params.append(building_type)
    
    if region:
        query += ' AND p.region = ?'
        params.append(region)
    
    query += ' ORDER BY p.created_at DESC'
    
    properties = conn.execute(query, params).fetchall()
    
    # Get filter options
    building_types = conn.execute(
        'SELECT DISTINCT building_type FROM properties ORDER BY building_type'
    ).fetchall()
    
    regions = conn.execute(
        'SELECT DISTINCT region FROM properties ORDER BY region'
    ).fetchall()
    
    conn.close()
    
    return render_template('properties.html',
                         properties=properties,
                         building_types=building_types,
                         regions=regions,
                         search=search,
                         selected_building_type=building_type,
                         selected_region=region)

@app.route('/api/calculate', methods=['POST'])
@login_required
def api_calculate():
    """API endpoint for cost calculation"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['building_type', 'square_footage', 'region', 'quality', 'condition']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Perform calculation
        result = calculate_enhanced_rcn(data)
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"API calculation error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/properties', methods=['GET'])
@login_required
def api_properties():
    """API endpoint to get properties"""
    try:
        conn = get_db_connection()
        
        properties = conn.execute('''
            SELECT p.*, c.replacement_cost_new, c.cost_per_sqft
            FROM properties p
            LEFT JOIN cost_calculations c ON p.id = c.property_id
            ORDER BY p.created_at DESC
        ''').fetchall()
        
        conn.close()
        
        # Convert to list of dicts
        result = []
        for prop in properties:
            result.append(dict(prop))
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"API properties error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/calculator')
@login_required
def calculator():
    """Quick calculator page"""
    return render_template('calculator.html')

@app.route('/reports')
@login_required
def reports_list():
    """List all reports"""
    conn = get_db_connection()
    
    reports = conn.execute('''
        SELECT r.*, p.address, p.property_id, u.username as generated_by_name
        FROM reports r
        JOIN properties p ON r.property_id = p.id
        LEFT JOIN users u ON r.generated_by = u.id
        ORDER BY r.generated_at DESC
    ''').fetchall()
    
    conn.close()
    
    return render_template('reports.html', reports=reports)

@app.route('/admin')
@login_required
def admin():
    """Admin dashboard"""
    if session.get('role') != 'admin':
        flash('Access denied. Admin privileges required.', 'error')
        return redirect(url_for('index'))
    
    conn = get_db_connection()
    
    # Get system statistics
    stats = {
        'total_users': conn.execute('SELECT COUNT(*) FROM users').fetchone()[0],
        'total_properties': conn.execute('SELECT COUNT(*) FROM properties').fetchone()[0],
        'total_calculations': conn.execute('SELECT COUNT(*) FROM cost_calculations').fetchone()[0],
        'total_reports': conn.execute('SELECT COUNT(*) FROM reports').fetchone()[0],
        'total_value': conn.execute('SELECT SUM(replacement_cost_new) FROM cost_calculations').fetchone()[0] or 0
    }
    
    # Get recent activity
    recent_users = conn.execute('''
        SELECT username, email, created_at, last_login
        FROM users
        ORDER BY created_at DESC
        LIMIT 5
    ''').fetchall()
    
    recent_calculations = conn.execute('''
        SELECT c.*, p.address, u.username
        FROM cost_calculations c
        JOIN properties p ON c.property_id = p.id
        LEFT JOIN users u ON c.calculated_by = u.id
        ORDER BY c.calculation_date DESC
        LIMIT 10
    ''').fetchall()
    
    conn.close()
    
    return render_template('admin.html',
                         stats=stats,
                         recent_users=recent_users,
                         recent_calculations=recent_calculations)

if __name__ == '__main__':
    init_database()
    logger.info("Starting TerraFusionBuild application...")
    app.run(host='0.0.0.0', port=5001, debug=True) 