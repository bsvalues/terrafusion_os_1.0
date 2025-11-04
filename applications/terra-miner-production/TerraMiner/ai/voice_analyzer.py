"""
AI-powered voice command analyzer module

This module analyzes voice commands using NLP to determine
the user's intent and extract relevant parameters.
"""
import logging
import re
import os
import json
from typing import Dict, Any, List

# Import AI models
try:
    from ai.analyzer import ModelFactory
    model_factory_available = True
except ImportError:
    model_factory_available = False

# Set up logging
logger = logging.getLogger(__name__)

class VoiceCommandAnalyzer:
    """
    Analyzes voice commands using natural language processing
    to determine user intent and extract key parameters.
    """
    
    def __init__(self):
        logger.info("Initializing VoiceCommandAnalyzer")
        self.model = None
        
        # Try to initialize the model factory
        if model_factory_available:
            try:
                from ai.analyzer import ModelFactory
                model_factory = ModelFactory()
                self.model = model_factory.get_model('property-voice-analyzer')
                logger.info("Voice analyzer model initialized successfully")
            except Exception as e:
                logger.error(f"Error initializing voice analyzer model: {str(e)}")
        
        # Command patterns for regex-based matching
        self.command_patterns = {
            'search': [
                r'find (?:properties|homes|houses) in (.+)',
                r'search (?:for )?(?:properties|homes|houses) in (.+)',
                r'show (?:me )?(?:properties|homes|houses) in (.+)',
                r'properties in (.+)'
            ],
            'bedrooms': [
                r'with (\d+) bedrooms',
                r'(\d+) (?:bed|bedroom|bedrooms)'
            ],
            'bathrooms': [
                r'with (\d+(?:\.\d+)?) bathrooms',
                r'(\d+(?:\.\d+)?) (?:bath|bathroom|bathrooms)'
            ],
            'price': [
                r'under \$?(\d+(?:[,.]\d+)?)(?: ?k| ?thousand| ?million| ?m)?',
                r'less than \$?(\d+(?:[,.]\d+)?)(?: ?k| ?thousand| ?million| ?m)?',
                r'max(?:imum)? price (?:of )?\$?(\d+(?:[,.]\d+)?)(?: ?k| ?thousand| ?million| ?m)?',
                r'price under \$?(\d+(?:[,.]\d+)?)(?: ?k| ?thousand| ?million| ?m)?'
            ],
            'propertyType': [
                r'(?:type|property type|home type)(?: of| is)? (house|condo|townhouse|apartment|single family|multi family)'
            ],
            'marketTrends': [
                r'(?:show|get|what are) (?:the )?market trends (?:for|in) (.+)',
                r'market (?:data|analysis|info|information) (?:for|in) (.+)'
            ],
            'propertyDetails': [
                r'(?:show|get|tell me about) (?:property|home) (?:at|on) (.+)',
                r'details (?:for|about) (?:property|home) (?:at|on) (.+)'
            ]
        }
        
    def analyze(self, command: str) -> Dict[str, Any]:
        """
        Analyze a voice command to determine intent and extract parameters.
        
        Args:
            command (str): The voice command to analyze
            
        Returns:
            dict: Analysis result containing intent and extracted parameters
        """
        logger.info(f"Analyzing voice command: {command}")
        
        # If we have an AI model, use it
        if self.model:
            try:
                # Prepare data for the model
                data = {
                    'command': command,
                    'system_prompt': """
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
                }
                
                # Analyze with the model
                result = self.model.analyze(data)
                if result and isinstance(result, dict) and 'intent' in result:
                    # Add URL if not present and we can construct it
                    if ('url' not in result or not result['url']) and result.get('intent') == 'search':
                        result['url'] = self._construct_search_url(result.get('params', {}))
                    
                    # Ensure the success field is present
                    result['success'] = True
                    return result
            except Exception as e:
                logger.error(f"Error using AI model for voice analysis: {str(e)}")
        
        # Fall back to regex-based pattern matching
        logger.info("Using regex pattern matching for voice analysis")
        return self._analyze_with_regex(command)
    
    def _analyze_with_regex(self, command: str) -> Dict[str, Any]:
        """
        Analyze the command using regex pattern matching.
        
        Args:
            command (str): The voice command to analyze
            
        Returns:
            dict: Analysis result containing intent and extracted parameters
        """
        result: Dict[str, Any] = {
            'success': True,
            'command': command,
            'intent': 'unknown',
            'action': None,
            'params': {
                'location': None,
                'beds': None,
                'baths': None,
                'maxPrice': None,
                'propertyType': None
            },
            'url': None
        }
        
        # Determine intent based on command patterns
        intent = self._determine_intent(command)
        
        if intent:
            result['intent'] = intent['type']
            
            # Handle different intents
            if intent['type'] == 'search':
                result['action'] = 'search'
                params = self._extract_search_parameters(command)
                result['params'] = params
                result['url'] = self._construct_search_url(params)
                
            elif intent['type'] == 'marketTrends':
                result['action'] = 'redirect'
                result['params']['location'] = intent['value']
                result['url'] = f"/market/trends?location={intent['value']}"
                
            elif intent['type'] == 'propertyDetails':
                result['action'] = 'redirect'
                result['params']['address'] = intent['value']
                result['url'] = f"/property/details?address={intent['value']}"
        
        return result
    
    def _determine_intent(self, command: str) -> Dict[str, Any]:
        """
        Determine the intent of a command using regex pattern matching.
        
        Args:
            command (str): The command to analyze
            
        Returns:
            dict or None: Intent information if detected, None otherwise
        """
        command = command.lower()
        
        for intent_type, patterns in self.command_patterns.items():
            for pattern in patterns:
                match = re.search(pattern, command, re.IGNORECASE)
                if match:
                    return {
                        'type': intent_type,
                        'value': match.group(1),
                        'match': match.group(0)
                    }
        
        return None
    
    def _extract_search_parameters(self, command: str) -> Dict[str, Any]:
        """
        Extract search parameters from a property search command.
        
        Args:
            command (str): The search command
            
        Returns:
            dict: Extracted search parameters
        """
        params: Dict[str, Any] = {
            'location': None,
            'beds': None,
            'baths': None,
            'maxPrice': None,
            'propertyType': None
        }
        
        # Extract location
        for pattern in self.command_patterns['search']:
            match = re.search(pattern, command, re.IGNORECASE)
            if match:
                params['location'] = match.group(1)
                break
        
        # Extract bedrooms
        for pattern in self.command_patterns['bedrooms']:
            match = re.search(pattern, command, re.IGNORECASE)
            if match:
                params['beds'] = int(match.group(1))
                break
        
        # Extract bathrooms
        for pattern in self.command_patterns['bathrooms']:
            match = re.search(pattern, command, re.IGNORECASE)
            if match:
                params['baths'] = float(match.group(1))
                break
        
        # Extract price
        for pattern in self.command_patterns['price']:
            match = re.search(pattern, command, re.IGNORECASE)
            if match:
                price_str = match.group(1).replace(',', '')
                price = float(price_str)
                
                # Handle price multipliers (k, million, etc.)
                if 'million' in match.group(0).lower() or 'm' in match.group(0).lower():
                    price *= 1000000
                elif 'k' in match.group(0).lower() or 'thousand' in match.group(0).lower():
                    price *= 1000
                
                params['maxPrice'] = int(price)
                break
        
        # Extract property type
        for pattern in self.command_patterns['propertyType']:
            match = re.search(pattern, command, re.IGNORECASE)
            if match:
                prop_type = match.group(1).lower()
                
                # Normalize property type
                if prop_type in ['house', 'single family']:
                    params['propertyType'] = 'Single Family'
                elif prop_type in ['condo', 'apartment']:
                    params['propertyType'] = 'Condo'
                elif prop_type == 'townhouse':
                    params['propertyType'] = 'Townhouse'
                elif prop_type == 'multi family':
                    params['propertyType'] = 'Multi-Family'
                else:
                    params['propertyType'] = prop_type.title()
                
                break
        
        return params
    
    def _construct_search_url(self, params: Dict[str, Any]) -> str:
        """
        Construct a search URL from parameters.
        
        Args:
            params (dict): Search parameters
            
        Returns:
            str: The constructed URL
        """
        url_parts = []
        
        if params.get('location'):
            url_parts.append(f"location={params['location']}")
        
        if params.get('beds'):
            url_parts.append(f"min_beds={params['beds']}")
        
        if params.get('baths'):
            url_parts.append(f"min_baths={params['baths']}")
        
        if params.get('maxPrice'):
            url_parts.append(f"max_price={params['maxPrice']}")
        
        if params.get('propertyType'):
            url_parts.append(f"property_type={params['propertyType']}")
        
        return "/property/search?" + "&".join(url_parts)