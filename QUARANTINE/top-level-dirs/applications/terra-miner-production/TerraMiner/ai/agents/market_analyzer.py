import logging
import json
from typing import Dict, Any, List, Optional, Union
import statistics

from ai.models.model_factory import model_factory
from ai.rag.property_retriever import PropertyRetriever

logger = logging.getLogger(__name__)

class MarketAnalyzerAgent:
    """
    Agent for analyzing market trends and property data
    """
    
    def __init__(self, model_provider: Optional[str] = None):
        """
        Initialize the market analyzer agent
        
        Args:
            model_provider (str, optional): The model provider to use ("openai" or "anthropic")
        """
        self.model_provider = model_provider
        self.retriever = PropertyRetriever()
    
    def analyze_price_trends(self, location: Optional[str] = None, 
                            days_back: int = 90, limit: int = 100) -> Dict[str, Any]:
        """
        Analyze price trends for properties in a given location
        
        Args:
            location (str, optional): Location to analyze (city, neighborhood, etc.)
            days_back (int): Number of days to look back for trend analysis
            limit (int): Maximum number of properties to analyze
            
        Returns:
            Dict[str, Any]: Analysis results
        """
        try:
            # Build filters based on parameters
            filters = {}
            if location:
                filters['address'] = location
                
            # TODO: Add date filtering when available in schema
            # if days_back:
            #     from datetime import datetime, timedelta
            #     start_date = (datetime.now() - timedelta(days=days_back)).strftime('%Y-%m-%d')
            #     filters['start_date'] = start_date
            
            # Retrieve property data
            properties = self.retriever.retrieve_with_filter(filters, limit)
            
            if not properties:
                return {
                    "status": "no_data",
                    "message": f"No property data found for the specified location: {location}",
                    "trends": {},
                    "analysis": "Insufficient data for analysis."
                }
            
            # Extract price data for analysis
            prices = []
            price_per_sqft = []
            property_types = {}
            locations = {}
            
            for prop in properties:
                if 'price' in prop and prop['price']:
                    try:
                        price = float(prop['price'])
                        prices.append(price)
                        
                        # Calculate price per square foot if data available
                        if 'square_feet' in prop and prop['square_feet']:
                            sqft = float(prop['square_feet'])
                            if sqft > 0:
                                price_per_sqft.append(price / sqft)
                        
                        # Count property types
                        prop_type = prop.get('property_type', 'Unknown')
                        property_types[prop_type] = property_types.get(prop_type, 0) + 1
                        
                        # Extract city/area from address
                        if 'address' in prop and prop['address']:
                            address_parts = prop['address'].split(',')
                            if len(address_parts) >= 2:
                                area = address_parts[1].strip()
                                locations[area] = locations.get(area, 0) + 1
                    except (ValueError, TypeError):
                        continue
            
            # Calculate basic statistics
            stats = {}
            if prices:
                stats["price_stats"] = {
                    "count": len(prices),
                    "min": min(prices),
                    "max": max(prices),
                    "mean": statistics.mean(prices),
                    "median": statistics.median(prices)
                }
                
            if price_per_sqft:
                stats["price_per_sqft_stats"] = {
                    "count": len(price_per_sqft),
                    "min": min(price_per_sqft),
                    "max": max(price_per_sqft),
                    "mean": statistics.mean(price_per_sqft),
                    "median": statistics.median(price_per_sqft)
                }
            
            # Use AI to analyze the trend data
            prompt = f"""
            Analyze the following real estate market data:
            
            Price Statistics:
            {json.dumps(stats.get('price_stats', {}), indent=2)}
            
            Price Per Square Foot Statistics:
            {json.dumps(stats.get('price_per_sqft_stats', {}), indent=2)}
            
            Property Types Distribution:
            {json.dumps(property_types, indent=2)}
            
            Location Distribution:
            {json.dumps(locations, indent=2)}
            
            Based on this data, provide a comprehensive market analysis focusing on:
            1. Price trends and market positioning
            2. Value assessment (price per square foot analysis)
            3. Market composition (property types)
            4. Geographical insights
            5. Investment opportunities or concerns
            
            Keep your analysis data-driven and actionable for potential buyers or investors.
            """
            
            # Generate analysis
            analysis = model_factory.generate_completion(
                prompt=prompt,
                provider=self.model_provider,
                max_tokens=800
            )
            
            result = {
                "status": "success",
                "data_points": len(properties),
                "location": location,
                "stats": stats,
                "property_types": property_types,
                "locations": locations,
                "analysis": analysis.strip()
            }
            
            logger.info(f"Generated market analysis for {location or 'all locations'}")
            return result
            
        except Exception as e:
            logger.error(f"Error analyzing price trends: {str(e)}")
            return {
                "status": "error",
                "message": f"Error analyzing market data: {str(e)}",
                "trends": {},
                "analysis": "Analysis could not be completed due to an error."
            }
    
    def analyze_property_investment(self, property_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze a property as an investment opportunity
        
        Args:
            property_data (Dict[str, Any]): Property data to analyze
            
        Returns:
            Dict[str, Any]: Investment analysis
        """
        try:
            # Extract key property details
            address = property_data.get('address', 'Unknown location')
            price = property_data.get('price', 0)
            property_type = property_data.get('property_type', 'Unknown')
            bedrooms = property_data.get('bedrooms', 'N/A')
            bathrooms = property_data.get('bathrooms', 'N/A')
            sqft = property_data.get('square_feet', 0)
            lot_size = property_data.get('lot_size', 'N/A')
            year_built = property_data.get('year_built', 'N/A')
            description = property_data.get('description', '')
            
            # Get comparable properties in the area
            location_parts = address.split(',')
            location = location_parts[1].strip() if len(location_parts) >= 2 else ""
            comparables = self.retriever.retrieve_with_filter({'address': location}, 10)
            
            # Calculate average price and price per sqft of comparables
            comparable_prices = []
            comparable_price_per_sqft = []
            
            for prop in comparables:
                if prop.get('price') and prop['price'] != price:  # Exclude the subject property
                    try:
                        comp_price = float(prop['price'])
                        comparable_prices.append(comp_price)
                        
                        if prop.get('square_feet') and float(prop['square_feet']) > 0:
                            comp_sqft = float(prop['square_feet'])
                            comparable_price_per_sqft.append(comp_price / comp_sqft)
                    except (ValueError, TypeError):
                        continue
            
            # Calculate comparable stats
            comp_stats = {}
            if comparable_prices:
                comp_stats["avg_price"] = statistics.mean(comparable_prices)
                comp_stats["median_price"] = statistics.median(comparable_prices)
                
            if comparable_price_per_sqft:
                comp_stats["avg_price_per_sqft"] = statistics.mean(comparable_price_per_sqft)
                comp_stats["median_price_per_sqft"] = statistics.median(comparable_price_per_sqft)
            
            # Calculate price per sqft for subject property
            subject_price_per_sqft = None
            if price and sqft and float(sqft) > 0:
                subject_price_per_sqft = float(price) / float(sqft)
            
            # Create a prompt for investment analysis
            prompt = f"""
            Perform a detailed investment analysis for the following property:
            
            Property Details:
            - Address: {address}
            - Price: ${price}
            - Type: {property_type}
            - Bedrooms: {bedrooms}
            - Bathrooms: {bathrooms}
            - Square Feet: {sqft}
            - Lot Size: {lot_size}
            - Year Built: {year_built}
            - Price Per Sqft: {subject_price_per_sqft}
            
            Description: {description}
            
            Market Comparables:
            - Average Price: ${comp_stats.get('avg_price', 'N/A')}
            - Median Price: ${comp_stats.get('median_price', 'N/A')}
            - Average Price Per Sqft: ${comp_stats.get('avg_price_per_sqft', 'N/A')}
            - Median Price Per Sqft: ${comp_stats.get('median_price_per_sqft', 'N/A')}
            
            Based on this information, provide a comprehensive investment analysis including:
            1. Value assessment (is the property priced competitively?)
            2. Potential ROI factors
            3. Estimated rental income potential
            4. Risk factors
            5. Investment recommendation (Buy, Consider, Avoid)
            
            Format your response as JSON with the following structure:
            {{
                "value_assessment": "Detailed analysis of the property's value",
                "price_comparison": "How the property compares to market prices",
                "roi_factors": "Factors affecting potential return on investment",
                "rental_potential": "Estimated monthly rental income range",
                "risk_factors": ["risk1", "risk2", "risk3"],
                "recommendation": "Buy/Consider/Avoid",
                "recommendation_reason": "Reasoning behind recommendation",
                "estimated_appreciation": "Annual appreciation potential percentage range"
            }}
            """
            
            # Get structured response
            try:
                response = model_factory.get_client(self.model_provider).generate_structured_completion(
                    system_prompt="You are a real estate investment analyst. Provide detailed investment analysis based on property details and market data. Respond only with a valid JSON object.",
                    user_prompt=prompt,
                    response_format={"type": "json_object"}
                )
                
                # Check if response is already parsed JSON
                analysis = response if isinstance(response, dict) else {}
                
                # Add property and comparable data to result
                result = {
                    "property": {
                        "address": address,
                        "price": price,
                        "square_feet": sqft,
                        "price_per_sqft": subject_price_per_sqft
                    },
                    "comparable_stats": comp_stats,
                    "analysis": analysis
                }
                
                logger.info(f"Generated investment analysis for property at {address}")
                return result
                
            except Exception as parsing_error:
                logger.error(f"Error parsing investment analysis response: {str(parsing_error)}")
                return {
                    "status": "error",
                    "message": f"Error generating investment analysis: {str(parsing_error)}",
                    "property": property_data
                }
                
        except Exception as e:
            logger.error(f"Error analyzing property investment: {str(e)}")
            return {
                "status": "error",
                "message": f"Error analyzing property investment: {str(e)}",
                "property": property_data
            }
    
    def compare_properties(self, property_ids: List[str]) -> Dict[str, Any]:
        """
        Compare multiple properties against each other
        
        Args:
            property_ids (List[str]): List of property IDs to compare
            
        Returns:
            Dict[str, Any]: Comparative analysis
        """
        # Implementation would retrieve property details by ID
        # and generate a comparative analysis using AI
        
        # This is a placeholder for future implementation
        return {
            "status": "not_implemented",
            "message": "Property comparison feature is not yet implemented",
            "property_ids": property_ids
        }