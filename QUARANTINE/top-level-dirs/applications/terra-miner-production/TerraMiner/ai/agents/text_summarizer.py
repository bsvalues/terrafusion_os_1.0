import logging
from typing import Dict, Any, Optional, Union

from ai.models.model_factory import model_factory

logger = logging.getLogger(__name__)

class TextSummarizerAgent:
    """
    Agent for summarizing property descriptions and data
    """
    
    def __init__(self, model_provider: Optional[str] = None):
        """
        Initialize the text summarizer agent
        
        Args:
            model_provider (str, optional): The model provider to use ("openai" or "anthropic")
        """
        self.model_provider = model_provider
    
    def summarize_property_description(self, description: str, max_length: int = 200) -> str:
        """
        Summarize a property description to a more concise format
        
        Args:
            description (str): The property description to summarize
            max_length (int): Target maximum length of summary
            
        Returns:
            str: Summarized description
        """
        try:
            if not description or len(description.strip()) == 0:
                return ""
            
            prompt = f"""
            Summarize the following property description in a concise, professional manner. 
            Focus on key selling points, unique features, and property condition.
            Keep the summary to approximately {max_length} characters.
            
            PROPERTY DESCRIPTION:
            {description}
            
            SUMMARY:
            """
            
            summary = model_factory.generate_completion(
                prompt=prompt,
                provider=self.model_provider,
                max_tokens=max_length
            )
            
            logger.info(f"Summarized property description from {len(description)} to {len(summary)} characters")
            return summary.strip()
            
        except Exception as e:
            logger.error(f"Error summarizing property description: {str(e)}")
            # Return a truncated version as fallback
            if description and len(description) > max_length:
                return description[:max_length] + "..."
            return description
    
    def summarize_property_details(self, property_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a summary of property details from structured data
        
        Args:
            property_data (Dict[str, Any]): The property data to summarize
            
        Returns:
            Dict[str, Any]: Dictionary with original data plus summary
        """
        try:
            # Extract relevant fields to include in the prompt
            address = property_data.get('address', 'Unknown location')
            price = property_data.get('price', 'Price not specified')
            bedrooms = property_data.get('bedrooms', 'N/A')
            bathrooms = property_data.get('bathrooms', 'N/A')
            sqft = property_data.get('square_feet', 'N/A')
            description = property_data.get('description', '')
            property_type = property_data.get('property_type', 'Property')
            
            # Create a prompt with the property details
            prompt = f"""
            Create a concise, engaging summary of the following property:
            
            Address: {address}
            Price: ${price}
            Type: {property_type}
            Bedrooms: {bedrooms}
            Bathrooms: {bathrooms}
            Square Feet: {sqft}
            
            Description: {description}
            
            Generate a professional summary that would appeal to potential buyers or investors.
            Highlight key features, value propositions, and unique selling points.
            """
            
            # Generate the summary
            summary = model_factory.generate_completion(
                prompt=prompt,
                provider=self.model_provider,
                max_tokens=300
            )
            
            # Add the summary to the property data
            result = property_data.copy()
            result['ai_summary'] = summary.strip()
            
            logger.info(f"Generated property summary for {address}")
            return result
            
        except Exception as e:
            logger.error(f"Error generating property summary: {str(e)}")
            # Return original data without summary
            return property_data
    
    def categorize_property(self, property_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Categorize a property based on its details
        
        Args:
            property_data (Dict[str, Any]): The property data to categorize
            
        Returns:
            Dict[str, Any]: Original data with added categories
        """
        try:
            # Extract relevant fields to include in the prompt
            address = property_data.get('address', 'Unknown location')
            price = property_data.get('price', 'Price not specified')
            bedrooms = property_data.get('bedrooms', 'N/A')
            bathrooms = property_data.get('bathrooms', 'N/A')
            sqft = property_data.get('square_feet', 'N/A')
            description = property_data.get('description', '')
            property_type = property_data.get('property_type', 'Property')
            
            # Create a prompt for categorization
            prompt = f"""
            Based on the following property details, identify relevant categories and tags:
            
            Address: {address}
            Price: ${price}
            Type: {property_type}
            Bedrooms: {bedrooms}
            Bathrooms: {bathrooms}
            Square Feet: {sqft}
            
            Description: {description}
            
            Analyze this property and return a JSON object with the following format:
            {{
                "property_condition": "New/Renovated/Well-maintained/Needs work/Fixer-upper",
                "primary_appeal": "Luxury/Family-friendly/Investment/First-time buyer/Vacation",
                "style": "Modern/Traditional/Mediterranean/Colonial/etc.",
                "notable_features": ["feature1", "feature2", "feature3"],
                "best_suited_for": "description of ideal buyer"
            }}
            """
            
            # Get structured response
            try:
                response = model_factory.get_client(self.model_provider).generate_structured_completion(
                    system_prompt="You are a real estate analysis expert. Provide detailed categorization based on property details. Respond only with a valid JSON object.",
                    user_prompt=prompt,
                    response_format={"type": "json_object"}
                )
                
                # Check if response is already parsed JSON
                categories = response if isinstance(response, dict) else {}
                
                # Update property data with categories
                result = property_data.copy()
                result['ai_categories'] = categories
                
                logger.info(f"Generated property categories for {address}")
                return result
                
            except Exception as parsing_error:
                logger.error(f"Error parsing categorization response: {str(parsing_error)}")
                # Try to continue with original data
                return property_data
                
        except Exception as e:
            logger.error(f"Error categorizing property: {str(e)}")
            # Return original data without categories
            return property_data