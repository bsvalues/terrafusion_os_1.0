"""
Assessment Routes - API endpoints for property assessments
Complete levy calculation and tax analysis functionality
"""

from flask import Blueprint, request, jsonify
from sqlalchemy import and_, or_, func, desc
from app.models.assessment import Assessment
from app.models.property import Property
from app.models.neighborhood import Neighborhood
from app.utils.monitoring import log_query, QueryTimer
import datetime
import logging

assessment_bp = Blueprint('assessment', __name__)
logger = logging.getLogger(__name__)

@assessment_bp.route('/property/<parcel_id>', methods=['GET'])
def get_property_assessments(parcel_id):
    """Get all assessments for a specific property"""
    try:
        with QueryTimer(f"Assessment history for {parcel_id}", "assessment_history"):
            
            # Get property
            property_obj = Property.query.filter_by(parcel_id=parcel_id).first()
            if not property_obj:
                return jsonify({'error': 'Property not found'}), 404
            
            # Get assessments with ordering
            assessments = Assessment.query.filter_by(property_id=property_obj.id)\
                .order_by(desc(Assessment.assessment_year)).all()
            
            if not assessments:
                return jsonify({'error': 'No assessment data found'}), 404
            
            # Calculate trends
            assessment_data = []
            for i, assessment in enumerate(assessments):
                assessment_dict = assessment.to_dict()
                
                # Calculate year-over-year change
                if i < len(assessments) - 1:
                    prev_assessment = assessments[i + 1]
                    value_change = assessment.total_value - prev_assessment.total_value
                    percent_change = (value_change / prev_assessment.total_value) * 100
                    
                    assessment_dict['year_over_year'] = {
                        'value_change': value_change,
                        'percent_change': round(percent_change, 2)
                    }
                
                assessment_data.append(assessment_dict)
            
            return jsonify({
                'property': property_obj.to_dict(),
                'assessments': assessment_data,
                'summary': {
                    'total_assessments': len(assessments),
                    'current_value': assessments[0].total_value,
                    'original_value': assessments[-1].total_value if len(assessments) > 1 else None,
                    'total_appreciation': assessments[0].total_value - assessments[-1].total_value if len(assessments) > 1 else None
                }
            })
            
    except Exception as e:
        logger.error(f"Error getting assessments for {parcel_id}: {str(e)}")
        return jsonify({'error': 'Failed to get assessment data'}), 500

@assessment_bp.route('/levy-calculation', methods=['POST'])
def calculate_levy():
    """Calculate levy for property assessment"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        parcel_id = data.get('parcel_id')
        assessment_year = data.get('assessment_year', datetime.datetime.now().year)
        custom_mill_rate = data.get('mill_rate')
        
        if not parcel_id:
            return jsonify({'error': 'Parcel ID is required'}), 400
        
        with QueryTimer(f"Levy calculation for {parcel_id}", "levy_calculation"):
            
            # Get property and assessment
            property_obj = Property.query.filter_by(parcel_id=parcel_id).first()
            if not property_obj:
                return jsonify({'error': 'Property not found'}), 404
            
            assessment = Assessment.query.filter_by(
                property_id=property_obj.id,
                assessment_year=assessment_year
            ).first()
            
            if not assessment:
                # Get latest assessment if specific year not found
                assessment = Assessment.query.filter_by(property_id=property_obj.id)\
                    .order_by(desc(Assessment.assessment_year)).first()
                
                if not assessment:
                    return jsonify({'error': 'No assessment data found'}), 404
            
            # Use custom mill rate or assessment's mill rate
            mill_rate = custom_mill_rate or assessment.mill_rate or 10.0  # Default mill rate
            
            # Calculate various levy components
            calculations = {
                'property_info': property_obj.to_dict(),
                'assessment_info': assessment.to_dict(),
                'levy_calculations': {
                    'assessed_value': assessment.total_value,
                    'mill_rate': mill_rate,
                    'basic_levy': (assessment.total_value / 1000) * mill_rate,
                    'land_portion': (assessment.land_value / 1000) * mill_rate,
                    'improvement_portion': (assessment.improvement_value / 1000) * mill_rate
                }
            }
            
            # Add exemption calculations if applicable
            if assessment.exemptions:
                # Parse exemptions (this would be more sophisticated in production)
                exemption_amount = 0  # Would calculate based on exemption types
                calculations['levy_calculations']['exemption_amount'] = exemption_amount
                calculations['levy_calculations']['net_levy'] = max(0, 
                    calculations['levy_calculations']['basic_levy'] - exemption_amount
                )
            else:
                calculations['levy_calculations']['net_levy'] = calculations['levy_calculations']['basic_levy']
            
            # Add neighborhood comparison
            neighborhood = Neighborhood.query.filter_by(
                code=property_obj.neighborhood_code
            ).first()
            
            if neighborhood:
                calculations['neighborhood_comparison'] = {
                    'neighborhood_info': neighborhood.to_dict(),
                    'property_vs_avg': assessment.total_value / neighborhood.average_value if neighborhood.average_value else None
                }
            
            return jsonify(calculations)
            
    except Exception as e:
        logger.error(f"Error calculating levy: {str(e)}")
        return jsonify({'error': 'Levy calculation failed'}), 500

@assessment_bp.route('/trends/<neighborhood_code>', methods=['GET'])
def get_neighborhood_trends(neighborhood_code):
    """Get assessment trends for a neighborhood"""
    try:
        with QueryTimer(f"Neighborhood trends for {neighborhood_code}", "neighborhood_trends"):
            
            # Get neighborhood info
            neighborhood = Neighborhood.query.filter_by(code=neighborhood_code).first()
            if not neighborhood:
                return jsonify({'error': 'Neighborhood not found'}), 404
            
            # Get year range
            start_year = request.args.get('start_year', type=int)
            end_year = request.args.get('end_year', type=int)
            
            if not start_year:
                start_year = datetime.datetime.now().year - 5
            if not end_year:
                end_year = datetime.datetime.now().year
            
            # Get assessment trends
            trend_query = Assessment.query.join(Property)\
                .filter(
                    and_(
                        Property.neighborhood_code == neighborhood_code,
                        Assessment.assessment_year.between(start_year, end_year)
                    )
                )\
                .with_entities(
                    Assessment.assessment_year,
                    func.avg(Assessment.total_value).label('avg_value'),
                    func.count(Assessment.id).label('property_count'),
                    func.min(Assessment.total_value).label('min_value'),
                    func.max(Assessment.total_value).label('max_value')
                )\
                .group_by(Assessment.assessment_year)\
                .order_by(Assessment.assessment_year)
            
            trends = trend_query.all()
            
            # Calculate year-over-year changes
            trend_data = []
            for i, trend in enumerate(trends):
                trend_dict = {
                    'year': trend.assessment_year,
                    'average_value': float(trend.avg_value),
                    'property_count': trend.property_count,
                    'min_value': float(trend.min_value),
                    'max_value': float(trend.max_value)
                }
                
                if i > 0:
                    prev_avg = float(trends[i-1].avg_value)
                    change = trend_dict['average_value'] - prev_avg
                    percent_change = (change / prev_avg) * 100
                    
                    trend_dict['year_over_year'] = {
                        'value_change': change,
                        'percent_change': round(percent_change, 2)
                    }
                
                trend_data.append(trend_dict)
            
            # Calculate overall statistics
            if trends:
                first_year_avg = float(trends[0].avg_value)
                last_year_avg = float(trends[-1].avg_value)
                total_appreciation = ((last_year_avg - first_year_avg) / first_year_avg) * 100
                annual_appreciation = total_appreciation / len(trends) if len(trends) > 1 else 0
            else:
                total_appreciation = 0
                annual_appreciation = 0
            
            return jsonify({
                'neighborhood': neighborhood.to_dict(),
                'trends': trend_data,
                'summary': {
                    'years_analyzed': len(trends),
                    'total_appreciation_percent': round(total_appreciation, 2),
                    'annual_appreciation_percent': round(annual_appreciation, 2),
                    'start_year': start_year,
                    'end_year': end_year
                }
            })
            
    except Exception as e:
        logger.error(f"Error getting neighborhood trends: {str(e)}")
        return jsonify({'error': 'Failed to get neighborhood trends'}), 500

@assessment_bp.route('/compare', methods=['POST'])
def compare_assessments():
    """Compare assessments across multiple properties"""
    try:
        data = request.get_json()
        
        if not data or 'parcel_ids' not in data:
            return jsonify({'error': 'Parcel IDs list required'}), 400
        
        parcel_ids = data['parcel_ids']
        assessment_year = data.get('assessment_year', datetime.datetime.now().year)
        
        if len(parcel_ids) > 10:
            return jsonify({'error': 'Maximum 10 properties can be compared'}), 400
        
        with QueryTimer(f"Assessment comparison for {len(parcel_ids)} properties", "assessment_comparison"):
            
            comparisons = []
            
            for parcel_id in parcel_ids:
                # Get property and assessment
                property_obj = Property.query.filter_by(parcel_id=parcel_id).first()
                if not property_obj:
                    comparisons.append({
                        'parcel_id': parcel_id,
                        'error': 'Property not found'
                    })
                    continue
                
                assessment = Assessment.query.filter_by(
                    property_id=property_obj.id,
                    assessment_year=assessment_year
                ).first()
                
                if not assessment:
                    # Get latest assessment
                    assessment = Assessment.query.filter_by(property_id=property_obj.id)\
                        .order_by(desc(Assessment.assessment_year)).first()
                
                if assessment:
                    comparison_data = {
                        'property': property_obj.to_dict(),
                        'assessment': assessment.to_dict(),
                        'metrics': {
                            'value_per_sqft': assessment.total_value / property_obj.total_area if property_obj.total_area else None,
                            'land_to_total_ratio': assessment.land_value / assessment.total_value if assessment.total_value else None,
                            'improvement_to_total_ratio': assessment.improvement_value / assessment.total_value if assessment.total_value else None
                        }
                    }
                else:
                    comparison_data = {
                        'parcel_id': parcel_id,
                        'error': 'No assessment data found'
                    }
                
                comparisons.append(comparison_data)
            
            # Calculate summary statistics
            valid_comparisons = [c for c in comparisons if 'error' not in c]
            
            if valid_comparisons:
                values = [c['assessment']['total_value'] for c in valid_comparisons]
                summary_stats = {
                    'total_properties': len(valid_comparisons),
                    'average_value': sum(values) / len(values),
                    'min_value': min(values),
                    'max_value': max(values),
                    'value_range': max(values) - min(values)
                }
            else:
                summary_stats = {'error': 'No valid properties found for comparison'}
            
            return jsonify({
                'comparisons': comparisons,
                'summary': summary_stats,
                'assessment_year': assessment_year
            })
            
    except Exception as e:
        logger.error(f"Error comparing assessments: {str(e)}")
        return jsonify({'error': 'Assessment comparison failed'}), 500
