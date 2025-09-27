"""
Analytics Routes - Advanced analytics and reporting endpoints
Comprehensive market analysis and statistical reporting
"""

from flask import Blueprint, request, jsonify
from sqlalchemy import func, and_, or_, desc
from app.models.property import Property
from app.models.assessment import Assessment
from app.models.sale import Sale
from app.models.neighborhood import Neighborhood
from app.utils.monitoring import log_query, QueryTimer
import datetime
import logging

analytics_bp = Blueprint('analytics', __name__)
logger = logging.getLogger(__name__)

@analytics_bp.route('/market-summary', methods=['GET'])
def get_market_summary():
    """Get comprehensive market summary statistics"""
    try:
        with QueryTimer("Market summary analytics", "market_summary"):
            
            # Time range parameters
            current_year = datetime.datetime.now().year
            start_year = request.args.get('start_year', current_year - 5, type=int)
            end_year = request.args.get('end_year', current_year, type=int)
            
            # Property statistics
            total_properties = Property.query.count()
            
            # Assessment value statistics
            value_stats = Assessment.query.filter(
                Assessment.assessment_year.between(start_year, end_year)
            ).with_entities(
                func.avg(Assessment.total_value).label('avg_value'),
                func.min(Assessment.total_value).label('min_value'),
                func.max(Assessment.total_value).label('max_value'),
                func.count(Assessment.id).label('assessment_count')
            ).first()
            
            # Sale statistics
            sale_stats = Sale.query.filter(
                Sale.sale_date >= datetime.datetime(start_year, 1, 1),
                Sale.validation_flag == True
            ).with_entities(
                func.avg(Sale.sale_price).label('avg_price'),
                func.min(Sale.sale_price).label('min_price'),
                func.max(Sale.sale_price).label('max_price'),
                func.count(Sale.id).label('sale_count')
            ).first()
            
            # Property class distribution
            property_classes = Property.query.with_entities(
                Property.property_class,
                func.count(Property.id).label('count')
            ).group_by(Property.property_class).all()
            
            # Neighborhood statistics
            neighborhood_count = Neighborhood.query.count()
            top_neighborhoods = Neighborhood.query.order_by(
                desc(Neighborhood.average_value)
            ).limit(10).all()
            
            summary = {
                'overview': {
                    'total_properties': total_properties,
                    'neighborhood_count': neighborhood_count,
                    'analysis_period': f"{start_year}-{end_year}"
                },
                'assessment_statistics': {
                    'average_value': float(value_stats.avg_value) if value_stats.avg_value else None,
                    'minimum_value': float(value_stats.min_value) if value_stats.min_value else None,
                    'maximum_value': float(value_stats.max_value) if value_stats.max_value else None,
                    'total_assessments': value_stats.assessment_count
                },
                'sale_statistics': {
                    'average_price': float(sale_stats.avg_price) if sale_stats.avg_price else None,
                    'minimum_price': float(sale_stats.min_price) if sale_stats.min_price else None,
                    'maximum_price': float(sale_stats.max_price) if sale_stats.max_price else None,
                    'total_sales': sale_stats.sale_count
                },
                'property_distribution': [
                    {'class': pc.property_class, 'count': pc.count}
                    for pc in property_classes
                ],
                'top_neighborhoods': [
                    {
                        'code': n.code,
                        'name': n.name,
                        'average_value': n.average_value
                    }
                    for n in top_neighborhoods
                ]
            }
            
            return jsonify(summary)
            
    except Exception as e:
        logger.error(f"Error getting market summary: {str(e)}")
        return jsonify({'error': 'Failed to get market summary'}), 500

@analytics_bp.route('/neighborhood/<neighborhood_code>/analysis', methods=['GET'])
def get_neighborhood_analysis(neighborhood_code):
    """Get detailed neighborhood analysis"""
    try:
        with QueryTimer(f"Neighborhood analysis for {neighborhood_code}", "neighborhood_analysis"):
            
            neighborhood = Neighborhood.query.filter_by(code=neighborhood_code).first()
            if not neighborhood:
                return jsonify({'error': 'Neighborhood not found'}), 404
            
            # Property statistics in neighborhood
            property_stats = Property.query.filter_by(
                neighborhood_code=neighborhood_code
            ).with_entities(
                func.count(Property.id).label('total_properties'),
                func.avg(Property.total_area).label('avg_area'),
                func.avg(Property.year_built).label('avg_year_built')
            ).first()
            
            # Value distribution
            value_distribution = Assessment.query.join(Property).filter(
                Property.neighborhood_code == neighborhood_code
            ).with_entities(
                func.min(Assessment.total_value).label('min_value'),
                func.max(Assessment.total_value).label('max_value'),
                func.avg(Assessment.total_value).label('avg_value'),
                func.percentile_cont(0.25).within_group(Assessment.total_value).label('q1'),
                func.percentile_cont(0.5).within_group(Assessment.total_value).label('median'),
                func.percentile_cont(0.75).within_group(Assessment.total_value).label('q3')
            ).first()
            
            # Recent sales activity
            recent_sales = Sale.query.join(Property).filter(
                Property.neighborhood_code == neighborhood_code,
                Sale.sale_date >= datetime.datetime.now() - datetime.timedelta(days=365),
                Sale.validation_flag == True
            ).order_by(desc(Sale.sale_date)).limit(10).all()
            
            # Year-over-year trends
            current_year = datetime.datetime.now().year
            yearly_trends = Assessment.query.join(Property).filter(
                Property.neighborhood_code == neighborhood_code,
                Assessment.assessment_year.between(current_year - 5, current_year)
            ).with_entities(
                Assessment.assessment_year,
                func.avg(Assessment.total_value).label('avg_value'),
                func.count(Assessment.id).label('property_count')
            ).group_by(Assessment.assessment_year).order_by(Assessment.assessment_year).all()
            
            # Calculate appreciation rate
            if len(yearly_trends) >= 2:
                first_year_value = yearly_trends[0].avg_value
                last_year_value = yearly_trends[-1].avg_value
                years_span = yearly_trends[-1].assessment_year - yearly_trends[0].assessment_year
                
                if first_year_value and years_span > 0:
                    annual_appreciation = (((last_year_value / first_year_value) ** (1/years_span)) - 1) * 100
                else:
                    annual_appreciation = 0
            else:
                annual_appreciation = 0
            
            analysis = {
                'neighborhood_info': neighborhood.to_dict(),
                'property_statistics': {
                    'total_properties': property_stats.total_properties,
                    'average_area': float(property_stats.avg_area) if property_stats.avg_area else None,
                    'average_year_built': int(property_stats.avg_year_built) if property_stats.avg_year_built else None
                },
                'value_distribution': {
                    'minimum': float(value_distribution.min_value) if value_distribution.min_value else None,
                    'maximum': float(value_distribution.max_value) if value_distribution.max_value else None,
                    'average': float(value_distribution.avg_value) if value_distribution.avg_value else None,
                    'quartiles': {
                        'q1': float(value_distribution.q1) if hasattr(value_distribution, 'q1') and value_distribution.q1 else None,
                        'median': float(value_distribution.median) if hasattr(value_distribution, 'median') and value_distribution.median else None,
                        'q3': float(value_distribution.q3) if hasattr(value_distribution, 'q3') and value_distribution.q3 else None
                    }
                },
                'market_trends': {
                    'annual_appreciation_rate': round(annual_appreciation, 2),
                    'yearly_data': [
                        {
                            'year': trend.assessment_year,
                            'average_value': float(trend.avg_value),
                            'property_count': trend.property_count
                        }
                        for trend in yearly_trends
                    ]
                },
                'recent_sales': [sale.to_dict() for sale in recent_sales]
            }
            
            return jsonify(analysis)
            
    except Exception as e:
        logger.error(f"Error getting neighborhood analysis: {str(e)}")
        return jsonify({'error': 'Failed to get neighborhood analysis'}), 500

@analytics_bp.route('/performance-metrics', methods=['GET'])
def get_performance_metrics():
    """Get system performance and usage metrics"""
    try:
        # Database performance
        from app.models.query_log import QueryLog
        
        # Query performance in last 24 hours
        yesterday = datetime.datetime.now() - datetime.timedelta(days=1)
        
        query_metrics = QueryLog.query.filter(
            QueryLog.timestamp >= yesterday
        ).with_entities(
            func.count(QueryLog.id).label('total_queries'),
            func.avg(QueryLog.response_time).label('avg_response_time'),
            func.max(QueryLog.response_time).label('max_response_time'),
            func.min(QueryLog.response_time).label('min_response_time')
        ).first()
        
        # Query type distribution
        query_types = QueryLog.query.filter(
            QueryLog.timestamp >= yesterday
        ).with_entities(
            QueryLog.query_type,
            func.count(QueryLog.id).label('count')
        ).group_by(QueryLog.query_type).all()
        
        # Error rate
        error_count = QueryLog.query.filter(
            QueryLog.timestamp >= yesterday,
            QueryLog.status == 'error'
        ).count()
        
        error_rate = (error_count / query_metrics.total_queries * 100) if query_metrics.total_queries > 0 else 0
        
        # Top queries
        top_queries = QueryLog.query.filter(
            QueryLog.timestamp >= yesterday,
            QueryLog.status == 'success'
        ).order_by(desc(QueryLog.response_time)).limit(5).all()
        
        metrics = {
            'query_performance': {
                'total_queries_24h': query_metrics.total_queries,
                'average_response_time': round(float(query_metrics.avg_response_time), 3) if query_metrics.avg_response_time else None,
                'max_response_time': round(float(query_metrics.max_response_time), 3) if query_metrics.max_response_time else None,
                'min_response_time': round(float(query_metrics.min_response_time), 3) if query_metrics.min_response_time else None,
                'error_rate_percent': round(error_rate, 2)
            },
            'query_distribution': [
                {'type': qt.query_type, 'count': qt.count}
                for qt in query_types
            ],
            'slowest_queries': [
                {
                    'query': q.query_text[:100] + '...' if len(q.query_text) > 100 else q.query_text,
                    'response_time': q.response_time,
                    'timestamp': q.timestamp.isoformat()
                }
                for q in top_queries
            ]
        }
        
        return jsonify(metrics)
        
    except Exception as e:
        logger.error(f"Error getting performance metrics: {str(e)}")
        return jsonify({'error': 'Failed to get performance metrics'}), 500

@analytics_bp.route('/reports/assessment-summary', methods=['GET'])
def generate_assessment_report():
    """Generate comprehensive assessment summary report"""
    try:
        # Parameters
        year = request.args.get('year', datetime.datetime.now().year, type=int)
        neighborhood_code = request.args.get('neighborhood_code')
        
        with QueryTimer(f"Assessment report for {year}", "assessment_report"):
            
            # Base query
            query = Assessment.query.filter_by(assessment_year=year)
            
            if neighborhood_code:
                query = query.join(Property).filter(
                    Property.neighborhood_code == neighborhood_code
                )
            
            # Summary statistics
            summary_stats = query.with_entities(
                func.count(Assessment.id).label('total_assessments'),
                func.sum(Assessment.total_value).label('total_value'),
                func.avg(Assessment.total_value).label('avg_value'),
                func.min(Assessment.total_value).label('min_value'),
                func.max(Assessment.total_value).label('max_value'),
                func.sum(Assessment.land_value).label('total_land_value'),
                func.sum(Assessment.improvement_value).label('total_improvement_value')
            ).first()
            
            # Value distribution by ranges
            value_ranges = [
                (0, 100000, 'Under $100K'),
                (100000, 250000, '$100K - $250K'),
                (250000, 500000, '$250K - $500K'),
                (500000, 1000000, '$500K - $1M'),
                (1000000, float('inf'), 'Over $1M')
            ]
            
            distribution = []
            for min_val, max_val, label in value_ranges:
                if max_val == float('inf'):
                    count = query.filter(Assessment.total_value >= min_val).count()
                else:
                    count = query.filter(
                        and_(
                            Assessment.total_value >= min_val,
                            Assessment.total_value < max_val
                        )
                    ).count()
                
                distribution.append({
                    'range': label,
                    'count': count,
                    'percentage': (count / summary_stats.total_assessments * 100) if summary_stats.total_assessments > 0 else 0
                })
            
            report = {
                'report_info': {
                    'year': year,
                    'neighborhood_code': neighborhood_code,
                    'generated_at': datetime.datetime.now().isoformat()
                },
                'summary_statistics': {
                    'total_assessments': summary_stats.total_assessments,
                    'total_assessed_value': float(summary_stats.total_value) if summary_stats.total_value else 0,
                    'average_value': float(summary_stats.avg_value) if summary_stats.avg_value else 0,
                    'minimum_value': float(summary_stats.min_value) if summary_stats.min_value else 0,
                    'maximum_value': float(summary_stats.max_value) if summary_stats.max_value else 0,
                    'total_land_value': float(summary_stats.total_land_value) if summary_stats.total_land_value else 0,
                    'total_improvement_value': float(summary_stats.total_improvement_value) if summary_stats.total_improvement_value else 0
                },
                'value_distribution': distribution
            }
            
            return jsonify(report)
            
    except Exception as e:
        logger.error(f"Error generating assessment report: {str(e)}")
        return jsonify({'error': 'Failed to generate assessment report'}), 500
