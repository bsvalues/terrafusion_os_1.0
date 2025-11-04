import logging
import json
from typing import Dict, Any, List, Optional, Union

from ai.models.model_factory import model_factory
from ai.rag.property_retriever import PropertyRetriever

logger = logging.getLogger(__name__)

class RecommendationAgent:
    """
    Agent for recommending properties based on user preferences
    """
    
    def __init__(self, model_provider: Optional[str] = None):
        """
        Initialize the recommendation agent
        
        Args:
            model_provider (str, optional): The model provider to use ("openai" or "anthropic")
        """
        self.model_provider = model_provider
        self.retriever = PropertyRetriever()
    
    def get_recommendations(self, user_preferences: Dict[str, Any], limit: int = 5) -> Dict[str, Any]:
        """
        Get property recommendations based on user preferences
        
        Args:
            user_preferences (Dict[str, Any]): Dictionary of user preferences
                May include: price_range, locations, property_types, features, etc.
            limit (int): Maximum number of recommendations to return
            
        Returns:
            Dict[str, Any]: Recommendation results with properties and explanation
        """
        try:
            # Extract filters from preferences
            filters = {}
            
            # Price range
            if 'min_price' in user_preferences:
                filters['min_price'] = user_preferences['min_price']
            if 'max_price' in user_preferences:
                filters['max_price'] = user_preferences['max_price']
                
            # Location
            if 'location' in user_preferences:
                filters['address'] = user_preferences['location']
                
            # Property type (would need to be added to the database schema)
            if 'property_type' in user_preferences:
                filters['property_type'] = user_preferences['property_type']
            
            # Get matching properties
            properties = self.retriever.retrieve_with_filter(filters, limit * 2)  # Get more than needed for filtering
            
            if not properties:
                return {
                    "status": "no_matches",
                    "message": "No properties match your preferences",
                    "recommendations": []
                }
            
            # Create a prompt to analyze which properties best match the user's preferences
            preferences_str = "\n".join([f"- {k}: {v}" for k, v in user_preferences.items()])
            properties_str = ""
            
            for i, prop in enumerate(properties[:10]):  # Limit to 10 properties for prompt size
                price = prop.get('price', 'N/A')
                address = prop.get('address', 'Unknown')
                bedrooms = prop.get('bedrooms', 'N/A')
                bathrooms = prop.get('bathrooms', 'N/A')
                sqft = prop.get('square_feet', 'N/A')
                description = prop.get('description', '')[:200]  # Truncate description
                
                properties_str += f"""
                Property {i+1}:
                - ID: {prop.get('id', i+1)}
                - Price: ${price}
                - Address: {address}
                - Bedrooms: {bedrooms}
                - Bathrooms: {bathrooms}
                - Square Feet: {sqft}
                - Description: {description}...
                """
            
            prompt = f"""
            Based on the following user preferences:
            {preferences_str}
            
            And these available properties:
            {properties_str}
            
            Select the {limit} properties that best match the user's preferences. Rank them in order of best match.
            For each recommended property, explain why it's a good match and any potential drawbacks.
            
            Format your response as JSON with the following structure:
            {{
                "recommendations": [
                    {{
                        "property_id": 1,
                        "match_score": 95,
                        "match_reasons": ["reason1", "reason2"],
                        "drawbacks": ["drawback1", "drawback2"],
                        "comment": "Overall assessment of this property"
                    }},
                    ...
                ],
                "explanation": "Overall explanation of the recommendations"
            }}
            """
            
            # Get structured response
            try:
                response = model_factory.get_client(self.model_provider).generate_structured_completion(
                    system_prompt="You are a real estate recommendation expert. Select properties that best match user preferences. Respond only with a valid JSON object.",
                    user_prompt=prompt,
                    response_format={"type": "json_object"}
                )
                
                # Check if response is already parsed JSON
                recommendations = response if isinstance(response, dict) else {}
                
                if not recommendations or 'recommendations' not in recommendations:
                    # Fallback if JSON parsing failed
                    logger.warning("Failed to parse recommendation response as JSON")
                    return {
                        "status": "error",
                        "message": "Failed to generate structured recommendations",
                        "properties": properties[:limit]
                    }
                
                # Map recommended property IDs back to full property data
                prop_map = {str(p.get('id', i)): p for i, p in enumerate(properties)}
                
                for rec in recommendations.get('recommendations', []):
                    prop_id = str(rec.get('property_id'))
                    if prop_id in prop_map:
                        rec['property'] = prop_map[prop_id]
                
                recommendations['status'] = 'success'
                recommendations['count'] = len(recommendations.get('recommendations', []))
                
                logger.info(f"Generated {recommendations.get('count', 0)} property recommendations")
                return recommendations
                
            except Exception as parsing_error:
                logger.error(f"Error parsing recommendations response: {str(parsing_error)}")
                return {
                    "status": "error",
                    "message": f"Error generating recommendations: {str(parsing_error)}",
                    "properties": properties[:limit]
                }
                
        except Exception as e:
            logger.error(f"Error getting property recommendations: {str(e)}")
            return {
                "status": "error",
                "message": f"Error generating recommendations: {str(e)}",
                "recommendations": []
            }
    
    def parse_natural_language_preferences(self, query: str) -> Dict[str, Any]:
        """
        Parse natural language query into structured user preferences
        
        Args:
            query (str): Natural language description of preferences
                Example: "I'm looking for a 3-bedroom house in Phoenix under $500,000"
                
        Returns:
            Dict[str, Any]: Structured user preferences
        """
        try:
            prompt = f"""
            Extract structured preferences from the following user query about property search:
            
            "{query}"
            
            Extract as many details as possible, including:
            - Price range (min and max if mentioned)
            - Location preferences (city, neighborhood, etc.)
            - Property type (house, condo, etc.)
            - Number of bedrooms and bathrooms
            - Square footage requirements
            - Must-have features
            - Nice-to-have features
            - Deal-breakers
            
            Format your response as JSON with the following structure:
            {{
                "min_price": 200000,
                "max_price": 500000,
                "location": "Phoenix",
                "property_type": "house",
                "min_bedrooms": 3,
                "min_bathrooms": 2,
                "min_square_feet": 1500,
                "must_have_features": ["garage", "backyard"],
                "nice_to_have_features": ["pool", "mountain view"],
                "deal_breakers": ["needs major renovation", "high traffic area"]
            }}
            
            Only include fields that were mentioned or can be reasonably inferred.
            """
            
            # Get structured response
            try:
                response = model_factory.get_client(self.model_provider).generate_structured_completion(
                    system_prompt="You are a real estate search expert. Extract structured preferences from natural language queries. Respond only with a valid JSON object.",
                    user_prompt=prompt,
                    response_format={"type": "json_object"}
                )
                
                # Check if response is already parsed JSON
                preferences = response if isinstance(response, dict) else {}
                
                logger.info(f"Extracted {len(preferences)} preference fields from natural language query")
                return preferences
                
            except Exception as parsing_error:
                logger.error(f"Error parsing preferences from query: {str(parsing_error)}")
                
                # Attempt basic extraction as fallback
                import re
                
                preferences = {}
                
                # Extract price range
                max_price_match = re.search(r'under\s+\$?(\d[\d,]*)', query)
                if max_price_match:
                    preferences['max_price'] = float(max_price_match.group(1).replace(',', ''))
                
                # Extract bedrooms
                bedroom_match = re.search(r'(\d+)[\s-]*bed', query.lower())
                if bedroom_match:
                    preferences['min_bedrooms'] = int(bedroom_match.group(1))
                
                # Extract location
                location_match = re.search(r'in\s+([A-Za-z\s,]+)', query)
                if location_match:
                    preferences['location'] = location_match.group(1).strip()
                
                return preferences
                
        except Exception as e:
            logger.error(f"Error parsing natural language preferences: {str(e)}")
            return {}