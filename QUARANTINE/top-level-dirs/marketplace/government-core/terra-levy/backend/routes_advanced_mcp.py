"""
Advanced Model Content Protocol (MCP) routes for the Levy Calculation System.

This module provides Flask routes for the advanced AI agent features including:
- Natural language query interface
- Multi-turn dialogue capabilities
- Multi-step analysis workflows
- Cross-dataset insights
"""

import json
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional

from flask import (
    Blueprint, render_template, request, jsonify, 
    current_app, session, redirect, url_for, flash
)
from flask_login import login_required, current_user

from utils.advanced_ai_agent import get_advanced_analysis_agent
from utils.anthropic_utils import get_claude_service, check_api_key_status
from utils.html_sanitizer import sanitize_html
from utils.mcp_core import registry

logger = logging.getLogger(__name__)
advanced_mcp_bp = Blueprint('advanced_mcp', __name__)


@advanced_mcp_bp.route('/advanced-insights')
@login_required
def advanced_insights():
    """Render the advanced AI insights page."""
    # Check API key status
    api_key_status = check_api_key_status()
    
    # Default empty insights structure
    insights = {
        'narrative': '<p>No advanced insights available yet. Please configure an API key and ensure tax data is imported.</p>',
        'data': {
            'recommendations': {},
            'avg_assessed_value': 'N/A',
            'api_status': api_key_status,
            'trends': [],
            'anomalies': [],
            'impacts': []
        },
        'statistics': [],
        'advanced_capabilities': [
            {
                'name': 'Multi-turn Dialogue',
                'description': 'Have contextual conversations with the AI about your tax data',
                'icon': 'bi bi-chat-dots'
            },
            {
                'name': 'Cross-Dataset Analysis',
                'description': 'Discover insights across different datasets',
                'icon': 'bi bi-intersect'
            },
            {
                'name': 'Natural Language Queries',
                'description': 'Ask questions about your data in plain English',
                'icon': 'bi bi-search'
            },
            {
                'name': 'Contextual Recommendations',
                'description': 'Get personalized recommendations based on your role',
                'icon': 'bi bi-lightbulb'
            }
        ]
    }
    
    try:
        # Check if we have any tax data to analyze
        from models import TaxCode
        from app import db
        
        # Get sample of tax code data
        tax_codes = db.session.query(TaxCode).limit(10).all()
        
        if tax_codes and api_key_status.get('status') == 'valid':
            # We have data and a valid API key - generate some initial insights
            claude_service = get_claude_service()
            if claude_service:
                logger.info("Generating initial advanced insights")
                
                # Convert tax codes to dictionaries
                tax_code_data = []
                for tc in tax_codes:
                    tax_code_data.append({
                        'code': getattr(tc, 'tax_code', 'Unknown'),
                        'total_assessed_value': getattr(tc, 'total_assessed_value', 0),
                        'effective_tax_rate': getattr(tc, 'effective_tax_rate', 0),
                        'total_levy_amount': getattr(tc, 'total_levy_amount', 0),
                        'district_id': getattr(tc, 'tax_district_id', None),
                    })
                
                # Get basic data for sample cards
                try:
                    # Get historical data (if available)
                    from models import TaxCodeHistoricalRate
                    historical_rates = db.session.query(TaxCodeHistoricalRate).limit(10).all()
                    
                    historical_data = []
                    if historical_rates:
                        for hr in historical_rates:
                            historical_data.append({
                                'tax_code_id': getattr(hr, 'tax_code_id', None),
                                'year': getattr(hr, 'year', None),
                                'levy_rate': getattr(hr, 'levy_rate', 0),
                                'levy_amount': getattr(hr, 'levy_amount', 0),
                                'total_assessed_value': getattr(hr, 'total_assessed_value', 0)
                            })
                    
                    # Get the agent and generate cross-dataset insights as a sample of advanced capabilities
                    advanced_agent = get_advanced_analysis_agent()
                    cross_dataset_results = advanced_agent.analyze_cross_dataset_patterns(
                        tax_codes=tax_code_data,
                        historical_rates=historical_data
                    )
                    
                    # Update insights with cross-dataset results
                    if cross_dataset_results and not isinstance(cross_dataset_results, str):
                        correlations = cross_dataset_results.get('correlations', [])
                        patterns = cross_dataset_results.get('patterns', [])
                        anomalies = cross_dataset_results.get('anomalies', [])
                        cross_insights = cross_dataset_results.get('insights', [])
                        
                        # Create narrative from insights
                        narrative = sanitize_html(
                            "<p>Advanced AI analysis of your tax data reveals cross-dataset insights:</p>"
                            "<ul>"
                        )
                        
                        # Add patterns
                        for pattern in patterns[:2]:
                            narrative += f"<li>{pattern}</li>"
                        
                        # Add correlations
                        for correlation in correlations[:2]:
                            narrative += f"<li>{correlation}</li>"
                            
                        narrative += "</ul>"
                        
                        # Generate AI-powered statistics cards
                        ai_statistics = []
                        
                        # Patterns Card
                        if patterns:
                            pattern_data = []
                            for i, pattern in enumerate(patterns[:2]):
                                pattern_data.append({'label': f'Pattern {i+1}', 'value': pattern[:50] + '...' if len(pattern) > 50 else pattern})
                            
                            ai_statistics.append({
                                'icon': 'bi bi-graph-up',
                                'title': 'Cross-Dataset Patterns',
                                'description': 'Identified patterns across multiple datasets',
                                'data': pattern_data
                            })
                        
                        # Correlations Card
                        if correlations:
                            correlation_data = []
                            for i, correlation in enumerate(correlations[:2]):
                                correlation_data.append({'label': f'Correlation {i+1}', 'value': correlation[:50] + '...' if len(correlation) > 50 else correlation})
                            
                            ai_statistics.append({
                                'icon': 'bi bi-link',
                                'title': 'Data Correlations',
                                'description': 'Relationships between different data points',
                                'data': correlation_data
                            })
                        
                        # Anomalies Card
                        if anomalies:
                            anomaly_data = []
                            for i, anomaly in enumerate(anomalies[:2]):
                                anomaly_data.append({'label': f'Anomaly {i+1}', 'value': anomaly[:50] + '...' if len(anomaly) > 50 else anomaly})
                            
                            ai_statistics.append({
                                'icon': 'bi bi-exclamation-triangle',
                                'title': 'Cross-Dataset Anomalies',
                                'description': 'Unusual patterns requiring attention',
                                'data': anomaly_data
                            })
                        
                        # Insights Card
                        if cross_insights:
                            insight_data = []
                            for i, insight in enumerate(cross_insights[:2]):
                                insight_data.append({'label': f'Insight {i+1}', 'value': insight[:50] + '...' if len(insight) > 50 else insight})
                            
                            ai_statistics.append({
                                'icon': 'bi bi-lightbulb',
                                'title': 'Strategic Insights',
                                'description': 'Key takeaways for decision-making',
                                'data': insight_data
                            })
                        
                        # Update insights with advanced analysis
                        insights = {
                            'narrative': narrative,
                            'data': {
                                'recommendations': insights['data']['recommendations'],
                                'avg_assessed_value': insights['data']['avg_assessed_value'],
                                'api_status': api_key_status,
                                'patterns': patterns,
                                'correlations': correlations,
                                'anomalies': anomalies,
                                'insights': cross_insights
                            },
                            'statistics': ai_statistics,
                            'advanced_capabilities': insights['advanced_capabilities']
                        }
                        
                except Exception as e:
                    logger.error(f"Error generating cross-dataset insights: {str(e)}")
                    # Keep default insights if there's an error
    
    except Exception as e:
        logger.error(f"Error in advanced insights route: {str(e)}")
        # Keep default insights if there's an error
    
    return render_template(
        'advanced_insights.html',
        insights=insights,
        current_timestamp=datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        active_page='advanced_insights'
    )


@advanced_mcp_bp.route('/api/advanced-mcp/query', methods=['POST'])
@login_required
def process_natural_language_query():
    """API endpoint to process a natural language query."""
    data = request.json
    if not data or 'query' not in data:
        return jsonify({"error": "Missing query parameter"}), 400
    
    query = data['query']
    context = data.get('context', {})
    
    try:
        # Get advanced analysis agent
        advanced_agent = get_advanced_analysis_agent()
        response = advanced_agent.process_natural_language_query(
            query=query,
            context=context
        )
        
        return jsonify({"response": response})
    except Exception as e:
        logger.error(f"Error processing natural language query: {str(e)}")
        return jsonify({"error": str(e)}), 500


@advanced_mcp_bp.route('/api/advanced-mcp/multi-step-analysis', methods=['POST'])
@login_required
def run_multistep_analysis():
    """API endpoint to run a multi-step analysis."""
    data = request.json
    if not data or 'district_id' not in data:
        return jsonify({"error": "Missing district_id parameter"}), 400
    
    district_id = data['district_id']
    analysis_type = data.get('analysis_type', 'comprehensive')
    years = data.get('years', 3)
    
    try:
        # Get advanced analysis agent
        advanced_agent = get_advanced_analysis_agent()
        response = advanced_agent.perform_multistep_analysis(
            tax_district_id=district_id,
            analysis_type=analysis_type,
            years=years
        )
        
        return jsonify({"response": response})
    except Exception as e:
        logger.error(f"Error running multi-step analysis: {str(e)}")
        return jsonify({"error": str(e)}), 500


@advanced_mcp_bp.route('/api/advanced-mcp/recommendations', methods=['POST'])
@login_required
def get_contextual_recommendations():
    """API endpoint to get contextual recommendations."""
    data = request.json
    if not data or 'tax_code_id' not in data:
        return jsonify({"error": "Missing tax_code_id parameter"}), 400
    
    tax_code_id = data['tax_code_id']
    user_role = data.get('user_role', 'administrator')
    focus_area = data.get('focus_area')
    
    try:
        # Get advanced analysis agent
        advanced_agent = get_advanced_analysis_agent()
        response = advanced_agent.generate_contextual_recommendations(
            tax_code_id=tax_code_id,
            user_role=user_role,
            focus_area=focus_area
        )
        
        return jsonify({"response": response})
    except Exception as e:
        logger.error(f"Error generating contextual recommendations: {str(e)}")
        return jsonify({"error": str(e)}), 500


@advanced_mcp_bp.route('/api/advanced-mcp/conversation-history', methods=['GET'])
@login_required
def get_conversation_history():
    """API endpoint to get the conversation history."""
    try:
        advanced_agent = get_advanced_analysis_agent()
        history = advanced_agent.get_conversation_history()
        return jsonify({"history": history})
    except Exception as e:
        logger.error(f"Error retrieving conversation history: {str(e)}")
        return jsonify({"error": str(e)}), 500


@advanced_mcp_bp.route('/api/advanced-mcp/conversation-history', methods=['DELETE'])
@login_required
def clear_conversation_history():
    """API endpoint to clear the conversation history."""
    try:
        advanced_agent = get_advanced_analysis_agent()
        advanced_agent.clear_conversation_history()
        return jsonify({"status": "success", "message": "Conversation history cleared"})
    except Exception as e:
        logger.error(f"Error clearing conversation history: {str(e)}")
        return jsonify({"error": str(e)}), 500


@advanced_mcp_bp.route('/api/advanced-mcp/cross-dataset', methods=['POST'])
@login_required
def analyze_cross_dataset():
    """API endpoint to perform cross-dataset analysis."""
    data = request.json
    if not data or 'tax_codes' not in data or 'historical_rates' not in data:
        return jsonify({"error": "Missing required parameters"}), 400
    
    tax_codes = data['tax_codes']
    historical_rates = data['historical_rates']
    property_records = data.get('property_records')
    
    try:
        # Get advanced analysis agent
        advanced_agent = get_advanced_analysis_agent()
        response = advanced_agent.analyze_cross_dataset_patterns(
            tax_codes=tax_codes,
            historical_rates=historical_rates,
            property_records=property_records
        )
        
        return jsonify({"response": response})
    except Exception as e:
        logger.error(f"Error analyzing cross-dataset patterns: {str(e)}")
        return jsonify({"error": str(e)}), 500