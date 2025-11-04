"""
AI analyzer module for generating property insights.

This module uses AI models to analyze property data and generate insights for
CMA reports, property valuations, and market trend analysis.
"""

import logging
import os
from typing import Dict, List, Any
from abc import ABC, abstractmethod

# Configure logger
logger = logging.getLogger(__name__)

class BaseModel(ABC):
    """Base class for AI models."""
    
    @abstractmethod
    def analyze(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze data and generate insights.
        
        Args:
            data (Dict[str, Any]): Data to analyze
            
        Returns:
            Dict[str, Any]: Analysis results
        """
        pass

class PropertyAnalyzerModel(BaseModel):
    """Model for analyzing property data and generating insights."""
    
    def __init__(self):
        """Initialize the property analyzer model."""
        logger.info("Initializing PropertyAnalyzerModel")
        # In a real implementation, would load model here
        
    def analyze(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze property data and generate insights.
        
        Args:
            data (Dict[str, Any]): Property data
            
        Returns:
            Dict[str, Any]: Analysis results
        """
        logger.info("Analyzing property data")
        
        try:
            # Extract data
            subject_property = data.get('subject_property', {})
            comparables = data.get('comparable_properties', [])
            market_trends = data.get('market_trends', {})
            
            # In a real implementation, this would use AI/ML models to generate insights
            # For demo purposes, we'll generate some basic insights based on the data
            
            # Generate key highlights
            key_highlights = self._generate_key_highlights(subject_property, comparables, market_trends)
            
            # Generate recommendations
            recommendations = self._generate_recommendations(subject_property, comparables, market_trends)
            
            # Generate analysis
            analysis = self._generate_analysis(subject_property, comparables, market_trends)
            
            # Compile insights
            insights = {
                'key_highlights': key_highlights,
                'recommendations': recommendations,
                'analysis': analysis
            }
            
            return insights
        
        except Exception as e:
            logger.exception(f"Error analyzing property data: {str(e)}")
            raise
    
    def _generate_key_highlights(self, subject_property: Dict[str, Any], comparables: List[Dict[str, Any]], market_trends: Dict[str, Any]) -> List[str]:
        """Generate key highlights for the property."""
        highlights = []
        
        # Property type and features
        property_type = subject_property.get('property_type', 'property')
        beds = subject_property.get('beds', 0)
        baths = subject_property.get('baths', 0)
        sqft = subject_property.get('sqft', 0)
        year_built = subject_property.get('year_built', 0)
        
        highlights.append(f"This {property_type.lower()} features {beds} bedrooms and {baths} bathrooms with {sqft:,} square feet of living space.")
        
        if year_built > 0:
            age = 2025 - year_built  # Current year - year built
            if age < 5:
                highlights.append(f"Built in {year_built}, this is a newer construction with modern amenities.")
            elif age < 20:
                highlights.append(f"Built in {year_built}, this property is relatively modern and may require minimal updates.")
            elif age < 50:
                highlights.append(f"Built in {year_built}, this established property may benefit from some modernization.")
            else:
                highlights.append(f"Built in {year_built}, this classic property may have historical character but may require updates.")
        
        # Location
        city = subject_property.get('city', '')
        state = subject_property.get('state', '')
        if city and state:
            highlights.append(f"Located in {city}, {state}, a market that has shown {self._get_market_trend_description(market_trends)}.")
        
        # Price positioning
        if comparables and subject_property.get('estimated_value'):
            estimated_value = subject_property.get('estimated_value', 0)
            comp_prices = [comp.get('price', 0) for comp in comparables if comp.get('price', 0) > 0]
            
            if comp_prices:
                avg_comp_price = sum(comp_prices) / len(comp_prices)
                
                if estimated_value < avg_comp_price * 0.95:
                    highlights.append(f"The property's estimated value is below average for the area, potentially offering good value.")
                elif estimated_value > avg_comp_price * 1.05:
                    highlights.append(f"The property's estimated value is above average for the area, suggesting premium positioning.")
                else:
                    highlights.append(f"The property's estimated value is in line with comparable properties in the area.")
        
        # Market trend highlight
        if market_trends:
            avg_days = market_trends.get('avg_days_on_market', 0)
            inventory = market_trends.get('inventory', 0)
            yoy_change = market_trends.get('yoy_price_change', 0)
            
            market_description = ""
            if yoy_change > 5:
                market_description = "rapidly appreciating"
            elif yoy_change > 2:
                market_description = "steadily appreciating"
            elif yoy_change > 0:
                market_description = "slightly appreciating"
            elif yoy_change > -2:
                market_description = "stable"
            else:
                market_description = "declining"
            
            if avg_days < 30 and inventory < 100:
                highlights.append(f"The local market is a {market_description} seller's market with limited inventory and quick sales.")
            elif avg_days > 60 and inventory > 200:
                highlights.append(f"The local market is a {market_description} buyer's market with ample inventory and longer selling times.")
            else:
                highlights.append(f"The local market is {market_description} with balanced conditions between buyers and sellers.")
        
        return highlights[:5]  # Limit to 5 key highlights
    
    def _generate_recommendations(self, subject_property: Dict[str, Any], comparables: List[Dict[str, Any]], market_trends: Dict[str, Any]) -> List[str]:
        """Generate recommendations for the property."""
        recommendations = []
        
        # Pricing recommendations
        estimated_value = subject_property.get('estimated_value', 0)
        if estimated_value > 0:
            if market_trends.get('yoy_price_change', 0) > 5:
                recommendations.append("Consider pricing at the upper end of the value range to capitalize on strong market appreciation.")
            elif market_trends.get('yoy_price_change', 0) < 0:
                recommendations.append("Consider pricing conservatively within the value range to attract buyers in this declining market.")
            else:
                recommendations.append("Price the property in the middle of the value range to balance competitive positioning with return on investment.")
        
        # Marketing recommendations
        property_type = subject_property.get('property_type', '').lower()
        recommendations.append(f"Highlight the property's {property_type} features that distinguish it from comparable properties in marketing materials.")
        
        # Timing recommendations
        avg_days = market_trends.get('avg_days_on_market', 0)
        if avg_days < 30:
            recommendations.append("Be prepared for quick decision-making as properties in this area are selling rapidly.")
        elif avg_days > 60:
            recommendations.append("Consider offering incentives to attract buyers in this slower market.")
        
        # Comparable property insights
        if comparables:
            newer_comps = [comp for comp in comparables if comp.get('year_built', 0) > subject_property.get('year_built', 0)]
            if newer_comps and len(newer_comps) > len(comparables) / 2:
                recommendations.append("Consider highlighting historic character or updating key areas to compete with newer properties in the area.")
            
            larger_comps = [comp for comp in comparables if comp.get('sqft', 0) > subject_property.get('sqft', 0) * 1.1]
            if larger_comps and len(larger_comps) > len(comparables) / 2:
                recommendations.append("Emphasize efficient use of space and the property's value per square foot compared to larger properties.")
        
        # General recommendations
        recommendations.append("Consult with a local real estate professional for personalized advice specific to your property and situation.")
        
        return recommendations[:5]  # Limit to 5 recommendations
    
    def _generate_analysis(self, subject_property: Dict[str, Any], comparables: List[Dict[str, Any]], market_trends: Dict[str, Any]) -> str:
        """Generate detailed analysis for the property."""
        # In a real implementation, this would use NLP to generate a cohesive analysis
        # For demo purposes, we'll create a simple template-based analysis
        
        property_type = subject_property.get('property_type', 'property')
        city = subject_property.get('city', '')
        state = subject_property.get('state', '')
        beds = subject_property.get('beds', 0)
        baths = subject_property.get('baths', 0)
        sqft = subject_property.get('sqft', 0)
        year_built = subject_property.get('year_built', 0)
        
        market_trend = self._get_market_trend_description(market_trends)
        
        # Comparable properties analysis
        comp_analysis = ""
        if comparables:
            num_comps = len(comparables)
            active_comps = len([c for c in comparables if c.get('status') == 'active'])
            sold_comps = len([c for c in comparables if c.get('status') == 'sold'])
            pending_comps = len([c for c in comparables if c.get('status') == 'pending'])
            
            comp_prices = [c.get('price', 0) for c in comparables if c.get('price', 0) > 0]
            avg_price = sum(comp_prices) / len(comp_prices) if comp_prices else 0
            price_range = f"${min(comp_prices):,} to ${max(comp_prices):,}" if comp_prices else "unknown"
            
            comp_analysis = f"""
            <p>Based on {num_comps} comparable properties in the area, the market shows {active_comps} active listings, 
            {pending_comps} pending sales, and {sold_comps} recently sold properties. Comparable property prices range from 
            {price_range}, with an average of ${avg_price:,.0f}.</p>
            """
        
        # Market trend analysis
        market_analysis = ""
        if market_trends:
            median_price = market_trends.get('median_price', 0)
            yoy_change = market_trends.get('yoy_price_change', 0)
            avg_days = market_trends.get('avg_days_on_market', 0)
            inventory = market_trends.get('inventory', 0)
            
            market_type = ""
            if avg_days < 30 and yoy_change > 2:
                market_type = "a strong seller's market"
            elif avg_days < 45 and yoy_change > 0:
                market_type = "a moderate seller's market"
            elif avg_days > 60 and yoy_change < 0:
                market_type = "a buyer's market"
            else:
                market_type = "a balanced market"
            
            market_analysis = f"""
            <p>The {city} real estate market is currently {market_type} with a median price of ${median_price:,.0f}, 
            representing a {yoy_change:.1f}% change year-over-year. Properties typically remain on the market for {avg_days} days, 
            and there are approximately {inventory} properties available in the area.</p>
            """
        
        # Property positioning
        positioning = ""
        if subject_property.get('estimated_value', 0) > 0 and comparables:
            estimated_value = subject_property.get('estimated_value', 0)
            comp_prices = [c.get('price', 0) for c in comparables if c.get('price', 0) > 0]
            
            if comp_prices:
                avg_comp_price = sum(comp_prices) / len(comp_prices)
                
                if estimated_value < avg_comp_price * 0.95:
                    positioning = f"""
                    <p>At ${estimated_value:,.0f}, this property is positioned below the average comparable property price of 
                    ${avg_comp_price:,.0f}. This could indicate good value or may reflect differences in condition, features, or exact location.</p>
                    """
                elif estimated_value > avg_comp_price * 1.05:
                    positioning = f"""
                    <p>At ${estimated_value:,.0f}, this property is positioned above the average comparable property price of 
                    ${avg_comp_price:,.0f}. This premium positioning may be justified by superior features, condition, or location.</p>
                    """
                else:
                    positioning = f"""
                    <p>At ${estimated_value:,.0f}, this property is in line with the average comparable property price of 
                    ${avg_comp_price:,.0f}, suggesting appropriate market positioning.</p>
                    """
        
        # Combine all sections
        analysis = f"""
        <p>This {property_type.lower()} in {city}, {state} features {beds} bedrooms and {baths} bathrooms with {sqft:,} square 
        feet of living space, built in {year_built}. The property is situated in a market that has shown {market_trend}.</p>
        
        {market_analysis}
        
        {comp_analysis}
        
        {positioning}
        
        <p>When considering this property, it's important to evaluate not just the current valuation, but also the property's 
        potential given market trends and comparable properties.</p>
        """
        
        # Clean up the text by removing extra whitespace
        analysis = ' '.join(analysis.split())
        analysis = analysis.replace(' . ', '. ').replace(' , ', ', ')
        
        return analysis
    
    def _get_market_trend_description(self, market_trends: Dict[str, Any]) -> str:
        """Get a description of the market trend."""
        yoy_change = market_trends.get('yoy_price_change', 0)
        
        if yoy_change > 10:
            return "strong appreciation"
        elif yoy_change > 5:
            return "solid appreciation"
        elif yoy_change > 2:
            return "moderate growth"
        elif yoy_change > 0:
            return "slight appreciation"
        elif yoy_change > -2:
            return "stability"
        elif yoy_change > -5:
            return "slight depreciation"
        else:
            return "significant depreciation"

class MarketAnalyzerModel(BaseModel):
    """Model for analyzing market data and generating insights."""
    
    def __init__(self):
        """Initialize the market analyzer model."""
        logger.info("Initializing MarketAnalyzerModel")
        # In a real implementation, would load model here
    
    def analyze(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze market data and generate insights.
        
        Args:
            data (Dict[str, Any]): Market data
            
        Returns:
            Dict[str, Any]: Analysis results
        """
        logger.info("Analyzing market data")
        
        # In a real implementation, this would use AI/ML models to generate insights
        # For now, return a placeholder
        return {
            'market_type': 'balanced',
            'price_trend': 'stable',
            'inventory_trend': 'decreasing',
            'days_on_market_trend': 'stable',
            'forecast': 'The market is expected to remain stable over the next 3-6 months.',
            'highlights': [
                'Property values have remained relatively stable over the past year.',
                'Inventory levels are decreasing, which may lead to increased competition.',
                'Days on market have remained consistent, indicating balanced demand.'
            ],
            'recommendations': [
                'Consider pricing properties at market value to ensure timely sales.',
                'Highlight unique features to stand out in a balanced market.',
                'Be prepared for potential shifts as inventory continues to decrease.'
            ]
        }

class ValueationModel(BaseModel):
    """Model for analyzing property value."""
    
    def __init__(self):
        """Initialize the valuation model."""
        logger.info("Initializing ValueationModel")
        # In a real implementation, would load model here
    
    def analyze(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze property data and generate valuation.
        
        Args:
            data (Dict[str, Any]): Property data
            
        Returns:
            Dict[str, Any]: Valuation results
        """
        logger.info("Analyzing property for valuation")
        
        # In a real implementation, this would use ML/AI models to generate insights
        # For now, return a placeholder
        return {
            'estimated_value': 750000,
            'confidence': 85,
            'value_range': {
                'low': 720000,
                'high': 780000
            },
            'price_per_sqft': 375,
            'neighborhood_avg_price_per_sqft': 350,
            'valuation_factors': [
                {'factor': 'Location', 'impact': 'high', 'adjustment': 0.05},
                {'factor': 'Condition', 'impact': 'medium', 'adjustment': 0.02},
                {'factor': 'Size', 'impact': 'medium', 'adjustment': 0.01},
                {'factor': 'Features', 'impact': 'low', 'adjustment': 0.01}
            ]
        }

class VoiceCommandModel(BaseModel):
    """Model for analyzing voice commands and determining user intent."""
    
    def __init__(self):
        """Initialize the voice command analyzer model."""
        logger.info("Initializing VoiceCommandModel")
        
        # Initialize OpenAI client if API key is available
        self.openai_client = None
        self.anthropic_client = None
        
        if os.environ.get('OPENAI_API_KEY'):
            try:
                from openai import OpenAI
                self.openai_client = OpenAI(api_key=os.environ.get('OPENAI_API_KEY'))
                logger.info("OpenAI client initialized for voice command analysis")
            except ImportError:
                logger.warning("OpenAI package not installed")
            except Exception as e:
                logger.error(f"Error initializing OpenAI client: {str(e)}")
        
        # Initialize Anthropic client if API key is available
        if os.environ.get('ANTHROPIC_API_KEY'):
            try:
                from anthropic import Anthropic
                self.anthropic_client = Anthropic(api_key=os.environ.get('ANTHROPIC_API_KEY'))
                logger.info("Anthropic client initialized for voice command analysis")
            except ImportError:
                logger.warning("Anthropic package not installed")
            except Exception as e:
                logger.error(f"Error initializing Anthropic client: {str(e)}")
    
    def analyze(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze voice command to determine intent and parameters.
        
        Args:
            data (Dict[str, Any]): Command data including:
                - command: The voice command string
                - system_prompt: Optional system prompt for the LLM
                
        Returns:
            Dict[str, Any]: Analysis results including:
                - intent: The detected intent (search, marketTrends, etc.)
                - parameters: Extracted parameters from the command
                - action: Suggested action to take
        """
        command = data.get('command', '')
        system_prompt = data.get('system_prompt', '')
        
        logger.info(f"Analyzing voice command: {command}")
        
        # If system prompt is not provided, use a default one
        if not system_prompt:
            system_prompt = """
            You are an AI assistant that analyzes real estate voice commands.
            Extract the user's intent and all relevant parameters from their voice command.
            Respond in JSON format with these fields:
            {
                "intent": "search" | "marketTrends" | "propertyDetails" | "unknown",
                "action": "search" | "redirect" | null,
                "params": {
                    "location": string or null,
                    "beds": number or null,
                    "baths": number or null,
                    "maxPrice": number or null,
                    "propertyType": string or null
                },
                "url": string or null
            }
            """
        
        # Try to use OpenAI first if available
        if self.openai_client:
            try:
                response = self.openai_client.chat.completions.create(
                    model="gpt-4o",  # the newest OpenAI model is "gpt-4o" which was released May 13, 2024
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": f"Analyze this real estate voice command: '{command}'"}
                    ],
                    response_format={"type": "json_object"}
                )
                try:
                    import json
                    result = json.loads(response.choices[0].message.content)
                    result['success'] = True
                    return result
                except json.JSONDecodeError:
                    logger.error("Failed to parse OpenAI response as JSON")
            except Exception as e:
                logger.error(f"Error using OpenAI for voice analysis: {str(e)}")
        
        # Try to use Anthropic as a fallback
        if self.anthropic_client:
            try:
                response = self.anthropic_client.messages.create(
                    model="claude-3-opus-20240229",
                    system=system_prompt,
                    messages=[
                        {"role": "user", "content": f"Analyze this real estate voice command: '{command}'"}
                    ],
                    max_tokens=1000
                )
                try:
                    import json
                    import re
                    # Try to extract JSON from the response
                    content = response.content[0].text
                    json_match = re.search(r'({.*})', content.replace('\n', ' '))
                    if json_match:
                        result = json.loads(json_match.group(1))
                        result['success'] = True
                        return result
                except Exception as e:
                    logger.error(f"Failed to parse Anthropic response as JSON: {str(e)}")
            except Exception as e:
                logger.error(f"Error using Anthropic for voice analysis: {str(e)}")
        
        # If both methods fail, use simple regex-based parsing
        return self._analyze_with_regex(command)
    
    def _analyze_with_regex(self, command: str) -> Dict[str, Any]:
        """Fallback method to analyze commands with regex patterns."""
        import re
        
        result = {
            "intent": "unknown",
            "action": None,
            "params": {
                "location": None,
                "beds": None,
                "baths": None,
                "maxPrice": None,
                "propertyType": None
            },
            "success": True
        }
        
        # Search patterns
        search_patterns = [
            r'find (?:properties|homes|houses) in (.+)',
            r'search (?:for )?(?:properties|homes|houses) in (.+)',
            r'show (?:me )?(?:properties|homes|houses) in (.+)'
        ]
        
        for pattern in search_patterns:
            match = re.search(pattern, command, re.IGNORECASE)
            if match:
                result["intent"] = "search"
                result["action"] = "search"
                result["params"]["location"] = match.group(1)
                break
        
        # Market trends patterns
        market_patterns = [
            r'(?:show|get|what are) (?:the )?market trends (?:for|in) (.+)',
            r'market (?:data|analysis|info|information) (?:for|in) (.+)'
        ]
        
        for pattern in market_patterns:
            match = re.search(pattern, command, re.IGNORECASE)
            if match:
                result["intent"] = "marketTrends"
                result["action"] = "redirect"
                result["params"]["location"] = match.group(1)
                break
        
        # Extract additional parameters if it's a search intent
        if result["intent"] == "search":
            # Bedrooms
            bed_match = re.search(r'(\d+) (?:bed|bedroom|bedrooms)', command, re.IGNORECASE)
            if bed_match:
                result["params"]["beds"] = int(bed_match.group(1))
            
            # Bathrooms
            bath_match = re.search(r'(\d+(?:\.\d+)?) (?:bath|bathroom|bathrooms)', command, re.IGNORECASE)
            if bath_match:
                result["params"]["baths"] = float(bath_match.group(1))
            
            # Price
            price_match = re.search(r'under \$?(\d+(?:[,.]\d+)?)(?: ?k| ?thousand| ?million| ?m)?', command, re.IGNORECASE)
            if price_match:
                price_str = price_match.group(1).replace(',', '')
                price = float(price_str)
                
                if 'million' in price_match.group(0).lower() or 'm' in price_match.group(0).lower():
                    price *= 1000000
                elif 'k' in price_match.group(0).lower() or 'thousand' in price_match.group(0).lower():
                    price *= 1000
                
                result["params"]["maxPrice"] = int(price)
            
            # Property type
            type_match = re.search(r'(?:type|property type)(?: of| is)? (house|condo|townhouse|apartment)', command, re.IGNORECASE)
            if type_match:
                property_type = type_match.group(1).lower()
                if property_type == 'house':
                    result["params"]["propertyType"] = 'Single Family'
                else:
                    result["params"]["propertyType"] = property_type.capitalize()
        
        return result


class ModelFactory:
    """Factory for creating AI models."""
    
    def __init__(self):
        """Initialize the model factory."""
        logger.info("Initializing ModelFactory")
        self.models = {}
    
    def get_model(self, model_type: str) -> BaseModel:
        """
        Get an AI model instance.
        
        Args:
            model_type (str): Type of model to get
            
        Returns:
            BaseModel: Model instance
            
        Raises:
            ValueError: If model type is not supported
        """
        if model_type not in self.models:
            if model_type == 'property_analyzer':
                self.models[model_type] = PropertyAnalyzerModel()
            elif model_type == 'market_analyzer':
                self.models[model_type] = MarketAnalyzerModel()
            elif model_type == 'valuation':
                self.models[model_type] = ValueationModel()
            elif model_type == 'property-voice-analyzer':
                self.models[model_type] = VoiceCommandModel()
            else:
                raise ValueError(f"Unsupported model type: {model_type}")
        
        return self.models[model_type]