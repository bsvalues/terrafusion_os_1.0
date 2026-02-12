"""
Natural language processing module for voice-activated property search
using OpenAI's API for query understanding and processing.
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
    logger.info("OpenAI client initialized for voice search processing")
except Exception as e:
    logger.error(f"Failed to initialize OpenAI client: {e}")
    client = None


class VoiceSearchProcessor:
    """
    Process natural language voice queries for property search using OpenAI API.
    Converts spoken queries into structured search parameters.
    """
    
    def __init__(self):
        self.client = client
        
    def process_query(self, query: str) -> Tuple[Dict[str, Any], Optional[str]]:
        """
        Process a natural language query and extract structured search parameters.
        
        Args:
            query (str): The natural language query from voice input
            
        Returns:
            Tuple[Dict[str, Any], Optional[str]]: 
                - Dictionary of structured search parameters 
                - Error message if applicable, None otherwise
        """
        if not query:
            return {}, "Empty query received"
            
        if not self.client:
            return {}, "OpenAI service is not available"
        
        try:
            # Generate a request ID for tracking
            request_id = str(uuid.uuid4())
            logger.info(f"Processing voice query (ID: {request_id}): {query}")
            
            # Define the system prompt for property search interpretation
            system_prompt = """
            You are an AI assistant specialized in real estate search. 
            Your task is to interpret natural language queries about property searches and convert them into structured search parameters.
            
            Extract the following parameters (when mentioned):
            - location (city, neighborhood, state, zip code)
            - property_type (house, apartment, condo, townhouse, land, etc.)
            - min_price and max_price (numerical values)
            - min_bedrooms and max_bedrooms (numerical values)
            - min_bathrooms and max_bathrooms (numerical values)
            - min_square_feet and max_square_feet (numerical values)
            - features (list of amenities or features like "pool", "garage", "waterfront", etc.)
            - sort_by (criteria for sorting results like "price_low_to_high", "price_high_to_low", "newest", etc.)
            - keywords (any other relevant search terms)
            
            Respond with a JSON object containing only these parameters. If a parameter is not mentioned, do not include it in the response.
            Infer reasonable values when the query is ambiguous (e.g., "affordable homes" might mean max_price around $300,000).
            """
            
            # Call the OpenAI API to process the query
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": query}
                ],
                response_format={"type": "json_object"},
                temperature=0.2,  # Low temperature for more consistent results
            )
            
            # Extract the generated content
            content = response.choices[0].message.content
            
            # Parse the JSON response
            try:
                if content:
                    search_params = json.loads(content)
                    logger.info(f"Successfully processed query (ID: {request_id})")
                    return search_params, None
                else:
                    logger.error(f"Empty response content from OpenAI (ID: {request_id})")
                    return {}, "Failed to process the search query"
            except json.JSONDecodeError:
                logger.error(f"Failed to parse OpenAI response as JSON (ID: {request_id}): {content}")
                return {}, "Failed to parse the search query"
                
        except RateLimitError:
            logger.error(f"OpenAI rate limit exceeded for query: {query}")
            return {}, "Search service is currently busy. Please try again in a moment."
            
        except APIConnectionError:
            logger.error(f"OpenAI API connection error for query: {query}")
            return {}, "Unable to connect to the search service. Please check your internet connection."
            
        except APIError as e:
            logger.error(f"OpenAI API error for query: {query} - {str(e)}")
            return {}, "An error occurred while processing your search query."
            
        except Exception as e:
            logger.error(f"Unexpected error processing query: {query} - {str(e)}")
            return {}, "An unexpected error occurred while processing your search query."
    
    def search_properties(self, search_params: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Search for properties using the structured parameters extracted from voice query.
        This method would integrate with your property database or API.
        
        Args:
            search_params (Dict[str, Any]): Structured search parameters
            
        Returns:
            List[Dict[str, Any]]: List of matching properties
        """
        # In a real implementation, this would query your database or API
        # For now, we'll return sample data
        
        logger.info(f"Searching properties with parameters: {search_params}")
        
        try:
            # Here you would implement actual property search logic
            # For example: results = property_database.search(**search_params)
            
            # For demonstration, return sample properties
            # In a production environment, replace this with actual database queries
            sample_properties = self._get_sample_properties(search_params)
            
            return sample_properties
        except Exception as e:
            logger.error(f"Error searching properties: {str(e)}")
            return []
    
    def _get_sample_properties(self, params: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Generate sample property data based on search parameters.
        This is for demonstration only and should be replaced with real database queries.
        
        Args:
            params (Dict[str, Any]): Search parameters
            
        Returns:
            List[Dict[str, Any]]: Sample property data
        """
        # Sample data for demonstration
        from datetime import datetime
        import random
        
        # Get location info from params or default to a generic location
        location = params.get('location', 'Anytown')
        
        # Determine price range based on params or use defaults
        min_price = params.get('min_price', 200000)
        max_price = params.get('max_price', 800000)
        
        # Get property type or default to house
        property_type = params.get('property_type', 'house')
        
        # Create a list of sample properties
        properties = []
        
        # Generate between 2-5 sample properties
        num_properties = random.randint(2, 5)
        
        for i in range(num_properties):
            # Generate a random price within the specified range
            price = random.randint(min_price, max_price)
            
            # Generate random specs
            bedrooms = params.get('min_bedrooms', random.randint(2, 5))
            bathrooms = params.get('min_bathrooms', round(random.uniform(1.5, 3.5), 1))
            square_feet = params.get('min_square_feet', random.randint(1200, 3000))
            
            # Create a property ID
            property_id = f"PROP-{random.randint(10000, 99999)}"
            
            # Create a property address
            street_number = random.randint(100, 9999)
            streets = ["Maple St", "Oak Ave", "Pine Rd", "Elm Blvd", "Cedar Ln"]
            street = random.choice(streets)
            address = f"{street_number} {street}, {location}"
            
            # Set up features based on property type and random selection
            all_features = [
                "Garage", "Pool", "Fireplace", "Renovated Kitchen", "Hardwood Floors",
                "Central AC", "Deck", "Patio", "Fenced Yard", "Walk-in Closet",
                "Stainless Appliances", "Granite Countertops", "Smart Home",
                "Solar Panels", "Garden"
            ]
            
            # Select 2-5 random features
            num_features = random.randint(2, 5)
            features = random.sample(all_features, num_features)
            
            # Add property type specific features
            if property_type.lower() == 'condo':
                features.extend(["Elevator", "Gym Access", "Doorman"])
            elif property_type.lower() == 'apartment':
                features.extend(["In-unit Laundry", "Balcony"])
            elif property_type.lower() == 'house':
                features.extend(["Backyard", "Driveway"])
            
            # Generate a simple description
            descriptions = [
                f"Beautiful {property_type} in the heart of {location}.",
                f"Charming {property_type} with great amenities and location.",
                f"Spacious {property_type} perfect for families or entertaining.",
                f"Cozy {property_type} in a quiet neighborhood near shops and restaurants.",
                f"Modern {property_type} with lots of natural light and updated features."
            ]
            description = random.choice(descriptions)
            
            # Create a sample image URL (in a real app, these would be actual property images)
            image_urls = [
                "/static/images/property1.jpg",
                "/static/images/property2.jpg",
                "/static/images/property3.jpg",
                "/static/images/property4.jpg",
                "/static/images/property-placeholder.jpg"
            ]
            image_url = random.choice(image_urls)
            
            # Create the property object
            property_obj = {
                "id": property_id,
                "address": address,
                "price": price,
                "bedrooms": bedrooms,
                "bathrooms": bathrooms,
                "square_feet": square_feet,
                "property_type": property_type,
                "features": features,
                "description": description,
                "image_url": image_url,
                "year_built": random.randint(1960, 2023),
                "listed_date": datetime.now().strftime("%Y-%m-%d")
            }
            
            properties.append(property_obj)
        
        # Return the sample properties
        return properties