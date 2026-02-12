"""
Voice command processing API endpoints
"""
import logging
import re
import json
from flask import Blueprint, request, jsonify
from werkzeug.exceptions import BadRequest

# Set up logging
logger = logging.getLogger(__name__)

# Create blueprint
voice_process_api = Blueprint('voice_process_api', __name__, url_prefix='/api/voice')

@voice_process_api.route('/process', methods=['POST'])
def process_voice_command():
    """Process a voice command and determine the appropriate action."""
    try:
        # Get command from request
        data = request.get_json()
        
        if not data or 'command' not in data:
            raise BadRequest('Missing command in request')
        
        command = data['command']
        logger.info(f"Processing voice command: {command}")
        
        # Use the voice analyzer to process the command
        try:
            from ai.voice_analyzer import VoiceCommandAnalyzer
            analyzer = VoiceCommandAnalyzer()
            result = analyzer.analyze(command)
            logger.info(f"Command analysis result: {result}")
            return jsonify(result)
        except ImportError:
            # Fallback to regex-based processing if the analyzer is not available
            logger.warning("VoiceCommandAnalyzer not available, using regex fallback")
            result = analyze_command_with_regex(command)
            return jsonify(result)
    
    except Exception as e:
        logger.exception(f"Error processing voice command: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Error processing voice command. Please try again.'
        }), 500


def analyze_command_with_regex(command):
    """
    Analyze a voice command using regex pattern matching.
    This is a fallback method if the AI-powered analyzer is not available.
    """
    result = {
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
        }
    }
    
    # Property search patterns
    search_patterns = [
        r'find (?:properties|homes|houses) in (.+)',
        r'search (?:for )?(?:properties|homes|houses) in (.+)',
        r'show (?:me )?(?:properties|homes|houses) in (.+)',
        r'properties in (.+)'
    ]
    
    for pattern in search_patterns:
        match = re.search(pattern, command, re.IGNORECASE)
        if match:
            result['intent'] = 'search'
            result['action'] = 'search'
            result['params']['location'] = match.group(1).strip()
            break
    
    # Market trends patterns
    market_patterns = [
        r'(?:show|get|what are) (?:the )?market trends (?:for|in) (.+)',
        r'market (?:data|analysis|info|information) (?:for|in) (.+)'
    ]
    
    for pattern in market_patterns:
        match = re.search(pattern, command, re.IGNORECASE)
        if match:
            result['intent'] = 'marketTrends'
            result['action'] = 'redirect'
            result['params']['location'] = match.group(1).strip()
            result['url'] = f"/market/trends?location={match.group(1).strip()}"
            break
    
    # Property details patterns
    details_patterns = [
        r'(?:show|get|tell me about) (?:property|home) (?:at|on) (.+)',
        r'details (?:for|about) (?:property|home) (?:at|on) (.+)'
    ]
    
    for pattern in details_patterns:
        match = re.search(pattern, command, re.IGNORECASE)
        if match:
            result['intent'] = 'propertyDetails'
            result['action'] = 'redirect'
            address = match.group(1).strip()
            result['params']['address'] = address
            result['url'] = f"/property/details?address={address}"
            break
    
    # If the intent is 'search', extract additional parameters
    if result['intent'] == 'search':
        # Bedrooms
        bed_match = re.search(r'(\d+) (?:bed|bedroom|bedrooms)', command, re.IGNORECASE)
        if bed_match:
            result['params']['beds'] = int(bed_match.group(1))
        
        # Bathrooms
        bath_match = re.search(r'(\d+(?:\.\d+)?) (?:bath|bathroom|bathrooms)', command, re.IGNORECASE)
        if bath_match:
            result['params']['baths'] = float(bath_match.group(1))
        
        # Price
        price_match = re.search(r'under \$?(\d+(?:[,.]\d+)?)(?: ?k| ?thousand| ?million| ?m)?', command, re.IGNORECASE)
        if price_match:
            price_str = price_match.group(1).replace(',', '')
            price = float(price_str)
            
            if 'million' in price_match.group(0).lower() or 'm' in price_match.group(0).lower():
                price *= 1000000
            elif 'k' in price_match.group(0).lower() or 'thousand' in price_match.group(0).lower():
                price *= 1000
            
            result['params']['maxPrice'] = int(price)
        
        # Property type
        type_match = re.search(r'(?:type|property type|home type)(?: of| is)? (house|condo|townhouse|apartment|single family|multi family)', command, re.IGNORECASE)
        if type_match:
            prop_type = type_match.group(1).lower()
            if prop_type == 'house' or prop_type == 'single family':
                result['params']['propertyType'] = 'Single Family'
            elif prop_type == 'condo' or prop_type == 'apartment':
                result['params']['propertyType'] = 'Condo'
            elif prop_type == 'townhouse':
                result['params']['propertyType'] = 'Townhouse'
            elif prop_type == 'multi family':
                result['params']['propertyType'] = 'Multi-Family'
            else:
                result['params']['propertyType'] = prop_type.title()
        
        # Construct URL for redirect
        if result['action'] == 'search':
            url_parts = []
            if result['params']['location']:
                url_parts.append(f"location={result['params']['location']}")
            if result['params']['beds']:
                url_parts.append(f"min_beds={result['params']['beds']}")
            if result['params']['baths']:
                url_parts.append(f"min_baths={result['params']['baths']}")
            if result['params']['maxPrice']:
                url_parts.append(f"max_price={result['params']['maxPrice']}")
            if result['params']['propertyType']:
                url_parts.append(f"property_type={result['params']['propertyType']}")
            
            result['url'] = "/property/search?" + "&".join(url_parts)
    
    return result