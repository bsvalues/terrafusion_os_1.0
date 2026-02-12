"""
AI-powered property recommendation engine using OpenAI.

This module provides intelligent property matching based on user preferences,
search history, and property characteristics.
"""

import json
import logging
import os
import uuid
from typing import Dict, Any, List, Optional, Tuple

from openai import OpenAI, APIError, RateLimitError, APIConnectionError

# Set up logging
logger = logging.getLogger(__name__)

# Initialize OpenAI client
# the newest OpenAI model is "gpt-4o" which was released May 13, 2024.
# do not change this unless explicitly requested by the user
try:
    client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
    logger.info("OpenAI client initialized for property recommendation engine")
except Exception as e:
    logger.error(f"Failed to initialize OpenAI client for property recommender: {e}")
    client = None


class PropertyRecommender:
    """
    AI-powered property recommendation engine that analyzes user preferences 
    and property details to provide personalized recommendations.
    """
    
    def __init__(self):
        """Initialize the property recommendation engine."""
        self.client = client
        
    def get_recommendations(self, 
                           user_preferences: Dict[str, Any], 
                           user_history: List[Dict[str, Any]],
                           available_properties: List[Dict[str, Any]],
                           num_recommendations: int = 5) -> Tuple[List[Dict[str, Any]], Optional[str]]:
        """
        Generate property recommendations based on user preferences and history.
        
        Args:
            user_preferences (Dict[str, Any]): User's stated preferences for properties
            user_history (List[Dict[str, Any]]): User's search and viewing history
            available_properties (List[Dict[str, Any]]): Available properties to recommend from
            num_recommendations (int): Number of recommendations to generate
            
        Returns:
            Tuple[List[Dict[str, Any]], Optional[str]]: 
                - List of recommended properties with explanation
                - Error message if applicable, None otherwise
        """
        if not self.client:
            return [], "AI recommendation service is currently unavailable"
            
        if not available_properties:
            return [], "No available properties to recommend"
            
        try:
            # Generate a request ID for tracking
            request_id = str(uuid.uuid4())
            logger.info(f"Generating property recommendations (ID: {request_id})")
            
            # Format the input data for the AI model
            formatted_preferences = self._format_preferences(user_preferences)
            formatted_history = self._format_history(user_history)
            formatted_properties = self._format_properties(available_properties)
            
            # Define the system prompt for property recommendations
            system_prompt = """
            You are an AI-powered real estate recommendation assistant. Your task is to recommend properties 
            to a user based on their preferences and search history, along with a personalized explanation
            for each recommendation.
            
            Analyze the user's preferences and history alongside the available properties. Select properties
            that best match the user's needs and interests, considering both explicit preferences and
            implicit patterns in their search history.
            
            For each recommendation, provide:
            1. The property ID
            2. A score between 0.0 and 1.0 indicating match quality (higher is better)
            3. A brief, personalized explanation of why this property is recommended
            
            Return your recommendations as a JSON array with the following structure for each item:
            {
                "property_id": "string",
                "match_score": float,
                "explanation": "string",
                "match_reasons": ["string", "string", ...]
            }
            
            Sort recommendations by match score in descending order.
            Provide diverse recommendations that cover different aspects of the user's preferences.
            """
            
            # Create the complete input message
            user_message = f"""
            ## User Preferences
            {formatted_preferences}
            
            ## User History
            {formatted_history}
            
            ## Available Properties
            {formatted_properties}
            
            Please recommend up to {num_recommendations} properties that best match this user's preferences and history.
            """
            
            # Call the OpenAI API to generate recommendations
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                response_format={"type": "json_object"},
                temperature=0.2,  # Low temperature for more consistent results
            )
            
            # Extract the generated content
            content = response.choices[0].message.content
            
            # Parse the JSON response
            try:
                if content:
                    recommendations_data = json.loads(content)
                    recommendations = recommendations_data.get('recommendations', [])
                    if not recommendations and isinstance(recommendations_data, list):
                        recommendations = recommendations_data  # Handle case where response is a direct array
                    
                    logger.info(f"Successfully generated {len(recommendations)} property recommendations (ID: {request_id})")
                    
                    # Map the recommendations back to property objects and add the AI explanations
                    property_id_map = {str(p.get('id', '')): p for p in available_properties}
                    enriched_recommendations = []
                    
                    for rec in recommendations[:num_recommendations]:
                        property_id = rec.get('property_id')
                        if property_id in property_id_map:
                            property_data = property_id_map[property_id].copy()
                            property_data['match_score'] = rec.get('match_score', 0.0)
                            property_data['explanation'] = rec.get('explanation', '')
                            property_data['match_reasons'] = rec.get('match_reasons', [])
                            enriched_recommendations.append(property_data)
                    
                    return enriched_recommendations, None
                else:
                    logger.error(f"Empty response content from OpenAI (ID: {request_id})")
                    return [], "Failed to generate property recommendations"
            except json.JSONDecodeError:
                logger.error(f"Failed to parse OpenAI response as JSON (ID: {request_id}): {content}")
                return [], "Failed to process the recommendations"
                
        except RateLimitError:
            logger.error(f"OpenAI rate limit exceeded for property recommendations")
            return [], "Recommendation service is currently busy. Please try again in a moment."
            
        except APIConnectionError:
            logger.error(f"OpenAI API connection error for property recommendations")
            return [], "Unable to connect to the recommendation service. Please check your internet connection."
            
        except APIError as e:
            logger.error(f"OpenAI API error for property recommendations - {str(e)}")
            return [], "An error occurred while processing your property recommendations."
            
        except Exception as e:
            logger.error(f"Unexpected error generating property recommendations: {str(e)}")
            return [], "An unexpected error occurred while generating property recommendations."
    
    def _format_preferences(self, preferences: Dict[str, Any]) -> str:
        """Format user preferences for the AI prompt."""
        if not preferences:
            return "No specific preferences provided."
            
        formatted = []
        
        # Map common preference keys to human-readable descriptions
        preference_map = {
            'location': 'Location',
            'property_type': 'Property Type',
            'min_price': 'Minimum Price',
            'max_price': 'Maximum Price',
            'min_bedrooms': 'Minimum Bedrooms',
            'max_bedrooms': 'Maximum Bedrooms',
            'min_bathrooms': 'Minimum Bathrooms',
            'max_bathrooms': 'Maximum Bathrooms',
            'min_square_feet': 'Minimum Square Feet',
            'max_square_feet': 'Maximum Square Feet',
            'features': 'Desired Features',
            'keywords': 'Keywords',
            'must_have': 'Must-Have Features',
            'nice_to_have': 'Nice-to-Have Features',
        }
        
        for key, value in preferences.items():
            if value is not None and value != "":
                label = preference_map.get(key, key.replace('_', ' ').title())
                
                # Format list values
                if isinstance(value, list):
                    value_str = ', '.join(str(item) for item in value)
                else:
                    value_str = str(value)
                    
                formatted.append(f"- {label}: {value_str}")
        
        if not formatted:
            return "No specific preferences provided."
            
        return '\n'.join(formatted)
    
    def _format_history(self, history: List[Dict[str, Any]]) -> str:
        """Format user history for the AI prompt."""
        if not history:
            return "No search or viewing history available."
            
        formatted = []
        
        for i, item in enumerate(history[-10:], 1):  # Use only the 10 most recent history items
            item_type = item.get('type', 'Unknown')
            details = []
            
            if 'property_id' in item:
                details.append(f"Property ID: {item['property_id']}")
                
            if 'timestamp' in item:
                details.append(f"When: {item['timestamp']}")
                
            if 'search_query' in item:
                details.append(f"Query: '{item['search_query']}'")
                
            if 'filters' in item and item['filters']:
                filter_str = ', '.join(f"{k}: {v}" for k, v in item['filters'].items())
                details.append(f"Filters: {filter_str}")
                
            formatted.append(f"{i}. {item_type.title()}: {' | '.join(details)}")
        
        return '\n'.join(formatted)
    
    def _format_properties(self, properties: List[Dict[str, Any]]) -> str:
        """Format available properties for the AI prompt."""
        if not properties:
            return "No available properties."
            
        formatted = []
        
        for i, prop in enumerate(properties, 1):
            details = [f"ID: {prop.get('id', 'Unknown')}"]
            
            if 'address' in prop:
                details.append(f"Address: {prop['address']}")
                
            if 'price' in prop:
                details.append(f"Price: ${prop['price']:,}")
                
            if 'property_type' in prop:
                details.append(f"Type: {prop['property_type']}")
                
            specs = []
            if 'bedrooms' in prop:
                specs.append(f"{prop['bedrooms']} bed")
            if 'bathrooms' in prop:
                specs.append(f"{prop['bathrooms']} bath")
            if 'square_feet' in prop:
                specs.append(f"{prop['square_feet']} sqft")
            if specs:
                details.append("Specs: " + ", ".join(specs))
                
            if 'features' in prop and prop['features']:
                if isinstance(prop['features'], list):
                    features_str = ", ".join(prop['features'][:5])
                    if len(prop['features']) > 5:
                        features_str += f" (+{len(prop['features']) - 5} more)"
                    details.append(f"Features: {features_str}")
                    
            formatted.append(f"{i}. {' | '.join(details)}")
        
        return '\n'.join(formatted)
    
    def get_property_match_score(self, user_preferences: Dict[str, Any], property_data: Dict[str, Any]) -> Tuple[float, List[str]]:
        """
        Calculate a match score between user preferences and a single property.
        
        Args:
            user_preferences (Dict[str, Any]): User's stated preferences
            property_data (Dict[str, Any]): Property to evaluate
            
        Returns:
            Tuple[float, List[str]]: Match score between 0-1 and list of matching reasons
        """
        try:
            # Format the input data for the AI model
            formatted_preferences = self._format_preferences(user_preferences)
            formatted_property = self._format_single_property(property_data)
            
            # Define the system prompt for calculating match score
            system_prompt = """
            You are an AI-powered real estate matching assistant. Your task is to calculate a match score
            between a user's preferences and a specific property, providing reasons for your score.
            
            Analyze how well the property matches the user's stated preferences. Consider both explicit
            requirements and implicit preferences.
            
            Return a JSON object with:
            1. A match_score between 0.0 and 1.0 (higher is better)
            2. A list of match_reasons explaining the score
            
            Format your response as:
            {
                "match_score": float,
                "match_reasons": ["reason1", "reason2", ...]
            }
            """
            
            # Create the user message
            user_message = f"""
            ## User Preferences
            {formatted_preferences}
            
            ## Property
            {formatted_property}
            
            Please calculate a match score and provide reasons for the match.
            """
            
            # Call the OpenAI API
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                response_format={"type": "json_object"},
                temperature=0.2,
            )
            
            # Parse the response
            content = response.choices[0].message.content
            if content:
                result = json.loads(content)
                score = float(result.get('match_score', 0.5))
                reasons = result.get('match_reasons', [])
                return score, reasons
            else:
                return 0.5, ["Unable to calculate detailed match score"]
                
        except Exception as e:
            logger.error(f"Error calculating property match score: {str(e)}")
            return 0.5, ["Default match score due to processing error"]
    
    def _format_single_property(self, property_data: Dict[str, Any]) -> str:
        """Format a single property for the AI prompt."""
        details = [f"ID: {property_data.get('id', 'Unknown')}"]
        
        if 'address' in property_data:
            details.append(f"Address: {property_data['address']}")
            
        if 'price' in property_data:
            details.append(f"Price: ${property_data['price']:,}")
            
        if 'property_type' in property_data:
            details.append(f"Type: {property_data['property_type']}")
            
        if 'bedrooms' in property_data:
            details.append(f"Bedrooms: {property_data['bedrooms']}")
            
        if 'bathrooms' in property_data:
            details.append(f"Bathrooms: {property_data['bathrooms']}")
            
        if 'square_feet' in property_data:
            details.append(f"Square Feet: {property_data['square_feet']}")
            
        if 'year_built' in property_data:
            details.append(f"Year Built: {property_data['year_built']}")
            
        if 'features' in property_data and property_data['features']:
            if isinstance(property_data['features'], list):
                features_str = ", ".join(property_data['features'])
                details.append(f"Features: {features_str}")
                
        if 'description' in property_data:
            details.append(f"\nDescription: {property_data['description']}")
            
        return '\n'.join(details)