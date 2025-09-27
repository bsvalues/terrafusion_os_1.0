"""
Budget Impact Visualization routes for the Levy Calculation System.

This module provides routes for the interactive budget impact visualization 
features, allowing users to analyze and understand how changes in tax rates 
and assessed values impact district budgets.
"""

from datetime import datetime
from flask import Blueprint, render_template, request, jsonify, current_app
from sqlalchemy import desc, func, and_
from models import db, TaxDistrict, TaxCode, TaxCodeHistoricalRate, Property

# Create blueprint
budget_impact_bp = Blueprint('budget_impact', __name__, url_prefix='/budget-impact')

@budget_impact_bp.route('/')
def index():
    """
    Main page for the interactive budget impact visualization.
    
    This view allows users to visualize how changes in tax rates and
    assessed values impact district budgets through various interactive
    visualizations.
    
    Returns:
        Rendered budget impact visualization template
    """
    # Get available years
    available_years = db.session.query(TaxDistrict.year).distinct().order_by(desc(TaxDistrict.year)).all()
    available_years = [year[0] for year in available_years] or [datetime.now().year]
    
    # Get selected year (default to most recent)
    year = request.args.get('year', available_years[0], type=int)
    
    # Get districts for selected year with tax codes
    districts = TaxDistrict.query.filter(TaxDistrict.year == year).options(
        db.joinedload(TaxDistrict.tax_codes)
    ).order_by(TaxDistrict.district_name).all()
    
    # Get district types for filtering
    district_types = db.session.query(TaxDistrict.district_type).distinct().order_by(TaxDistrict.district_type).all()
    district_types = [district_type[0] for district_type in district_types]
    
    return render_template(
        'budget-impact/index.html',
        districts=districts,
        district_types=district_types,
        available_years=available_years,
        year=year
    )

@budget_impact_bp.route('/api/simulation', methods=['POST'])
def api_budget_simulation():
    """
    API endpoint for simulating budget impacts based on tax rate changes.
    
    This endpoint processes simulation scenarios with modified tax rates
    and returns the calculated impact on district budgets.
    
    Returns:
        JSON response with simulation results
    """
    # Get request data
    data = request.json
    
    # Extract parameters from request
    year = data.get('year', datetime.now().year)
    scenario = data.get('scenario', {})
    district_ids = data.get('district_ids', [])
    
    # Get baseline data for comparison
    baseline_data = get_district_budget_data(district_ids, year)
    
    # Apply scenario modifications to create simulation data
    simulation_data = simulate_budget_changes(baseline_data, scenario)
    
    # Calculate impact metrics
    impact_analysis = calculate_impact_metrics(baseline_data, simulation_data)
    
    return jsonify({
        'baseline': baseline_data,
        'simulation': simulation_data,
        'impact': impact_analysis
    })

@budget_impact_bp.route('/api/districts/<int:year>')
def api_districts_by_year(year):
    """
    API endpoint to get district data for a specific year.
    
    Args:
        year: The year to get district data for
        
    Returns:
        JSON response with district data
    """
    # Get districts for the selected year
    districts = TaxDistrict.query.filter(TaxDistrict.year == year).options(
        db.joinedload(TaxDistrict.tax_codes)
    ).order_by(TaxDistrict.district_name).all()
    
    # Convert to JSON-serializable format
    districts_data = [{
        'id': d.id,
        'district_name': d.district_name,
        'district_code': d.district_code,
        'district_type': d.district_type,
        'tax_codes': [{
            'id': tc.id,
            'tax_code': tc.tax_code,
            'levy_rate': tc.effective_tax_rate or 0,
            'levy_amount': tc.total_levy_amount or 0,
            'total_assessed_value': tc.total_assessed_value or 0
        } for tc in d.tax_codes] if d.tax_codes else [],
        'year': d.year
    } for d in districts]
    
    return jsonify(districts_data)

@budget_impact_bp.route('/api/district-budget/<int:district_id>')
def api_district_budget(district_id):
    """
    API endpoint to get detailed budget data for a specific district.
    
    Args:
        district_id: The unique district identifier
        
    Returns:
        JSON response with district budget details
    """
    # Get district
    district = TaxDistrict.query.options(
        db.joinedload(TaxDistrict.tax_codes)
    ).get_or_404(district_id)
    
    # Get budget data for this district
    budget_data = get_district_budget_data([district_id], district.year)
    
    return jsonify(budget_data[0] if budget_data else {})

def get_district_budget_data(district_ids, year):
    """
    Get detailed budget data for specified districts.
    
    Args:
        district_ids: List of district IDs to get data for
        year: The year to get data for
        
    Returns:
        List of district budget data dictionaries
    """
    results = []
    
    for district_id in district_ids:
        # Get district with tax codes
        district = TaxDistrict.query.filter(
            TaxDistrict.id == district_id,
            TaxDistrict.year == year
        ).options(
            db.joinedload(TaxDistrict.tax_codes)
        ).first()
        
        if not district:
            continue
            
        # Calculate budget metrics
        total_levy_amount = sum(tc.total_levy_amount or 0 for tc in district.tax_codes)
        total_assessed_value = sum(tc.total_assessed_value or 0 for tc in district.tax_codes)
        
        # Get average levy rate
        avg_levy_rate = 0
        if total_assessed_value > 0:
            avg_levy_rate = (total_levy_amount / total_assessed_value) * 1000
        
        # Get property count
        property_count = Property.query.join(
            TaxCode, Property.tax_code == TaxCode.tax_code
        ).filter(
            TaxCode.tax_district_id == district.id,
            Property.year == district.year,
            TaxCode.year == district.year
        ).count()
        
        # Calculate average tax per property
        avg_tax_per_property = 0
        if property_count > 0:
            avg_tax_per_property = total_levy_amount / property_count
        
        # Get historical data for trends
        historical_data = []
        for tax_code in district.tax_codes:
            historical_rates = TaxCodeHistoricalRate.query.filter(
                TaxCodeHistoricalRate.tax_code_id == tax_code.id
            ).order_by(TaxCodeHistoricalRate.year).all()
            
            for rate in historical_rates:
                historical_data.append({
                    'year': rate.year,
                    'levy_rate': rate.levy_rate,
                    'levy_amount': rate.levy_amount,
                    'total_assessed_value': rate.total_assessed_value
                })
        
        # Compile district budget data
        district_data = {
            'id': district.id,
            'district_name': district.district_name,
            'district_code': district.district_code,
            'district_type': district.district_type,
            'year': district.year,
            'tax_codes': [{
                'id': tc.id,
                'tax_code': tc.tax_code,
                'levy_rate': tc.effective_tax_rate or 0,
                'levy_amount': tc.total_levy_amount or 0,
                'total_assessed_value': tc.total_assessed_value or 0
            } for tc in district.tax_codes],
            'total_levy_amount': total_levy_amount,
            'total_assessed_value': total_assessed_value,
            'avg_levy_rate': avg_levy_rate,
            'property_count': property_count,
            'avg_tax_per_property': avg_tax_per_property,
            'historical_data': historical_data
        }
        
        results.append(district_data)
    
    return results

def simulate_budget_changes(baseline_data, scenario):
    """
    Simulate budget changes based on scenario parameters.
    
    Args:
        baseline_data: List of baseline district budget data
        scenario: Dictionary with simulation parameters
        
    Returns:
        List of simulated district budget data
    """
    # Apply scenario modifications to create simulation data
    simulation_data = []
    
    # Get scenario parameters
    rate_change_percent = scenario.get('rate_change_percent', 0)
    assessed_value_change_percent = scenario.get('assessed_value_change_percent', 0)
    district_type_filters = scenario.get('district_type_filters', [])
    
    for district in baseline_data:
        # Deep copy of district data for simulation
        district_sim = district.copy()
        district_sim['tax_codes'] = [tc.copy() for tc in district['tax_codes']]
        
        # Apply filter - only modify districts of specified types if filters provided
        if district_type_filters and district['district_type'] not in district_type_filters:
            simulation_data.append(district_sim)
            continue
        
        # Apply changes to each tax code
        for tc in district_sim['tax_codes']:
            # Apply rate change
            if rate_change_percent != 0:
                tc['levy_rate'] = tc['levy_rate'] * (1 + rate_change_percent / 100)
            
            # Apply assessed value change
            if assessed_value_change_percent != 0:
                tc['total_assessed_value'] = tc['total_assessed_value'] * (1 + assessed_value_change_percent / 100)
            
            # Recalculate levy amount based on new rate and assessed value
            tc['levy_amount'] = (tc['levy_rate'] / 1000) * tc['total_assessed_value']
        
        # Recalculate district totals
        district_sim['total_levy_amount'] = sum(tc['levy_amount'] for tc in district_sim['tax_codes'])
        district_sim['total_assessed_value'] = sum(tc['total_assessed_value'] for tc in district_sim['tax_codes'])
        
        # Recalculate average levy rate
        district_sim['avg_levy_rate'] = 0
        if district_sim['total_assessed_value'] > 0:
            district_sim['avg_levy_rate'] = (district_sim['total_levy_amount'] / district_sim['total_assessed_value']) * 1000
        
        # Recalculate average tax per property
        if district_sim['property_count'] > 0:
            district_sim['avg_tax_per_property'] = district_sim['total_levy_amount'] / district_sim['property_count']
        
        simulation_data.append(district_sim)
    
    return simulation_data

def calculate_impact_metrics(baseline_data, simulation_data):
    """
    Calculate impact metrics between baseline and simulation.
    
    Args:
        baseline_data: List of baseline district budget data
        simulation_data: List of simulated district budget data
        
    Returns:
        Dictionary with impact analysis metrics
    """
    # Match districts in baseline and simulation
    impact_analysis = {}
    
    for i, baseline in enumerate(baseline_data):
        # Find matching district in simulation data
        for simulation in simulation_data:
            if simulation['id'] == baseline['id']:
                district_id = baseline['id']
                district_name = baseline['district_name']
                
                # Calculate changes
                levy_amount_change = simulation['total_levy_amount'] - baseline['total_levy_amount']
                levy_amount_percent = 0
                if baseline['total_levy_amount'] > 0:
                    levy_amount_percent = (levy_amount_change / baseline['total_levy_amount']) * 100
                
                assessed_value_change = simulation['total_assessed_value'] - baseline['total_assessed_value']
                assessed_value_percent = 0
                if baseline['total_assessed_value'] > 0:
                    assessed_value_percent = (assessed_value_change / baseline['total_assessed_value']) * 100
                
                levy_rate_change = simulation['avg_levy_rate'] - baseline['avg_levy_rate']
                levy_rate_percent = 0
                if baseline['avg_levy_rate'] > 0:
                    levy_rate_percent = (levy_rate_change / baseline['avg_levy_rate']) * 100
                
                tax_per_property_change = simulation['avg_tax_per_property'] - baseline['avg_tax_per_property']
                tax_per_property_percent = 0
                if baseline['avg_tax_per_property'] > 0:
                    tax_per_property_percent = (tax_per_property_change / baseline['avg_tax_per_property']) * 100
                
                # Store impact metrics
                impact_analysis[district_id] = {
                    'district_id': district_id,
                    'district_name': district_name,
                    'district_type': baseline['district_type'],
                    'levy_amount': {
                        'baseline': baseline['total_levy_amount'],
                        'simulation': simulation['total_levy_amount'],
                        'change': levy_amount_change,
                        'percent': levy_amount_percent
                    },
                    'assessed_value': {
                        'baseline': baseline['total_assessed_value'],
                        'simulation': simulation['total_assessed_value'],
                        'change': assessed_value_change,
                        'percent': assessed_value_percent
                    },
                    'levy_rate': {
                        'baseline': baseline['avg_levy_rate'],
                        'simulation': simulation['avg_levy_rate'],
                        'change': levy_rate_change,
                        'percent': levy_rate_percent
                    },
                    'tax_per_property': {
                        'baseline': baseline['avg_tax_per_property'],
                        'simulation': simulation['avg_tax_per_property'],
                        'change': tax_per_property_change,
                        'percent': tax_per_property_percent
                    }
                }
                
                break
    
    return impact_analysis