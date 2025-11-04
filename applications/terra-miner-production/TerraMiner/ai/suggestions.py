"""
AI-powered contextual suggestions module.

This module provides AI-generated insights and suggestions based on the current
context in the TerraMiner application.
"""

import logging
import os
import json
from typing import Dict, List, Any, Optional

from openai import OpenAI

logger = logging.getLogger(__name__)

# Initialize OpenAI client
try:
    openai_api_key = os.environ.get("OPENAI_API_KEY")
    if openai_api_key:
        openai_client = OpenAI(api_key=openai_api_key)
        logger.info("OpenAI client initialized for contextual suggestions")
    else:
        openai_client = None
        logger.warning("OPENAI_API_KEY not found, AI suggestions will be limited")
except Exception as e:
    openai_client = None
    logger.error(f"Failed to initialize OpenAI client: {str(e)}")

def get_contextual_suggestions(
    context_type: str,
    context_data: Optional[Dict[str, Any]] = None
) -> List[Dict[str, str]]:
    """
    Get AI-powered contextual suggestions based on the current context.
    
    Args:
        context_type: Type of context (dashboard, property_detail, etc.)
        context_data: Optional data providing context for suggestions
        
    Returns:
        List of suggestions, each with a title and description
    """
    try:
        # Initialize with default suggestions
        suggestions = get_default_suggestions(context_type)
        
        # If we have context data and OpenAI is available, enhance with AI suggestions
        if context_data and openai_client:
            ai_suggestions = get_ai_suggestions(context_type, context_data)
            if ai_suggestions:
                suggestions.extend(ai_suggestions)
        
        # For property details, check if we should add Southeastern Washington insights
        if context_type == "property_detail" and context_data:
            try:
                from ai.southeastern_wa_insights import (
                    generate_se_wa_property_insights,
                    get_county_from_property
                )
                
                # Get property data from context
                property_data = context_data.get("property", {})
                
                # If property city is in WA, add regional insights
                if property_data.get("state") == "Washington" or property_data.get("city", "").lower() in [
                    "kennewick", "richland", "pasco", "walla walla", "west richland", 
                    "prosser", "benton city", "connell", "clarkston"
                ]:
                    # Get the county
                    county = get_county_from_property(property_data)
                    
                    # Generate regional insights
                    regional_insights = generate_se_wa_property_insights(property_data, county)
                    
                    # Add regional insights
                    suggestions.extend(regional_insights)
                    
                    logger.info(f"Added {len(regional_insights)} Southeastern Washington insights for property in {county} County")
            except ImportError:
                logger.warning("Southeastern Washington insights module not available")
            except Exception as e:
                logger.error(f"Error adding Southeastern Washington insights: {str(e)}")
        
        return suggestions
    except Exception as e:
        logger.error(f"Error getting contextual suggestions: {str(e)}")
        return [
            {
                "title": "Suggestion Service Error",
                "description": "Unable to generate insights at this time. Please try again later."
            }
        ]

def get_default_suggestions(context_type: str) -> List[Dict[str, str]]:
    """Get default suggestions based on context type."""
    
    if context_type == "dashboard":
        return [
            {
                "title": "Monitoring Overview",
                "description": "Review system performance trends over the past week to identify potential issues."
            },
            {
                "title": "Alert Configuration",
                "description": "Consider setting up email alerts for critical system metrics to stay informed."
            }
        ]
    elif context_type == "property_detail":
        return [
            {
                "title": "Property Analysis",
                "description": "Compare this property's valuation against similar properties in the same area."
            },
            {
                "title": "Market Trends",
                "description": "Check how this property's value has changed relative to the local market over time."
            }
        ]
    elif context_type == "market_trends":
        return [
            {
                "title": "Market Analysis",
                "description": "Look for areas with significant price changes that may indicate market shifts."
            },
            {
                "title": "Seasonal Patterns",
                "description": "Consider how seasonal patterns affect pricing in different neighborhoods."
            }
        ]
    elif context_type == "agent_performance":
        return [
            {
                "title": "Performance Metrics",
                "description": "Identify top-performing agents and analyze their strategies for success."
            },
            {
                "title": "Training Opportunities",
                "description": "Consider targeted training for agents with lower performance in specific areas."
            }
        ]
    else:
        return [
            {
                "title": "System Overview",
                "description": "Check the monitoring dashboard for a comprehensive overview of system performance."
            },
            {
                "title": "Feature Exploration",
                "description": "Try exploring the property comparison tool to analyze multiple properties at once."
            }
        ]

def get_ai_suggestions(
    context_type: str,
    context_data: Dict[str, Any]
) -> List[Dict[str, str]]:
    """
    Get AI-generated suggestions using OpenAI.
    
    Args:
        context_type: Type of context (dashboard, property_detail, etc.)
        context_data: Data providing context for suggestions
        
    Returns:
        List of AI-generated suggestions
    """
    if not openai_client:
        return []
    
    try:
        # Create prompt based on context
        prompt = create_suggestion_prompt(context_type, context_data)
        
        # Call OpenAI API for suggestions
        response = openai_client.chat.completions.create(
            model="gpt-4o",  # The newest OpenAI model is "gpt-4o" which was released May 13, 2024
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an AI assistant for a real estate data intelligence platform. "
                        "Generate insightful suggestions based on the provided context. "
                        "Each suggestion should have a title and a concise description. "
                        "Focus on actionable insights that would be valuable to real estate "
                        "professionals, investors, and property assessors. "
                        "Respond with a JSON array of objects, each with 'title' and 'description' fields."
                    )
                },
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            max_tokens=1000
        )
        
        # Extract suggestions from response
        result = json.loads(response.choices[0].message.content)
        if "suggestions" in result and isinstance(result["suggestions"], list):
            return result["suggestions"]
        else:
            logger.warning("Unexpected response format from OpenAI")
            return []
            
    except Exception as e:
        logger.error(f"Error getting AI suggestions: {str(e)}")
        return []

def create_suggestion_prompt(
    context_type: str,
    context_data: Dict[str, Any]
) -> str:
    """Create a prompt for OpenAI based on context."""
    
    base_prompt = (
        f"Generate 3-5 insightful suggestions for a user viewing a {context_type} "
        f"in a real estate data intelligence platform. "
        f"Each suggestion should have a brief title and a concise, actionable description. "
        f"Format your response as a JSON object with a single key 'suggestions' containing "
        f"an array of objects, each with 'title' and 'description' fields.\n\n"
        f"Context information:\n"
    )
    
    # Add context-specific information to the prompt
    if context_type == "dashboard":
        metrics = context_data.get("metrics", {})
        metrics_text = "\n".join([f"- {key}: {value}" for key, value in metrics.items()])
        base_prompt += f"Dashboard metrics:\n{metrics_text}\n\n"
        
        base_prompt += (
            "Focus on insights related to monitoring system performance, "
            "identifying potential issues, and optimizing the platform. "
            "Consider how trends in these metrics might affect decision-making."
        )
        
    elif context_type == "property_detail":
        property_data = context_data.get("property", {})
        property_text = "\n".join([f"- {key}: {value}" for key, value in property_data.items()])
        base_prompt += f"Property details:\n{property_text}\n\n"
        
        base_prompt += (
            "Focus on insights related to property valuation, market positioning, "
            "investment potential, and assessment considerations. "
            "Think about what would be valuable to real estate professionals, "
            "investors, and property assessors."
        )
        
    elif context_type == "market_trends":
        base_prompt += (
            "Focus on insights related to market dynamics, price trends, "
            "seasonal patterns, and regional variations. "
            "Consider both short-term fluctuations and long-term trends. "
            "Think about what would help users make informed decisions "
            "about market timing and location selection."
        )
        
    else:
        base_prompt += (
            "Focus on general insights that would be valuable for users "
            "of a real estate data intelligence platform. "
            "Consider both operational aspects of the platform and "
            "strategic insights about real estate data analysis."
        )
    
    return base_prompt