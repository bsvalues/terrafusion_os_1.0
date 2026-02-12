"""
OpenAI Integration Module

This module provides integration with OpenAI's APIs for text generation,
image generation, and other AI capabilities.
"""

import os
import logging
import json
from typing import Dict, Any, List, Optional, Union

# Import OpenAI client
from openai import OpenAI

# Set up logging
logger = logging.getLogger(__name__)

# Global OpenAI client
client = None

def initialize_openai():
    """Initialize the OpenAI client."""
    global client
    
    # Get API key from environment
    api_key = os.environ.get("OPENAI_API_KEY")
    
    if not api_key:
        logger.warning("OpenAI API key not found in environment variables")
        return False
    
    try:
        # Initialize the client
        client = OpenAI(api_key=api_key)
        logger.info("OpenAI client initialized successfully")
        return True
    except Exception as e:
        logger.error(f"Failed to initialize OpenAI client: {str(e)}")
        return False

def generate_text(
    prompt: str,
    model: str = "gpt-4o",  # the newest OpenAI model is "gpt-4o" which was released May 13, 2024
    max_tokens: int = 1000,
    temperature: float = 0.7,
    system_prompt: Optional[str] = None
) -> Dict[str, Any]:
    """
    Generate text using OpenAI's text completion API.
    
    Args:
        prompt (str): The user prompt to generate text from
        model (str): The OpenAI model to use (default: gpt-4o)
        max_tokens (int): Maximum tokens to generate (default: 1000)
        temperature (float): Temperature for text generation (default: 0.7)
        system_prompt (Optional[str]): Optional system prompt
        
    Returns:
        Dict[str, Any]: Response containing the generated text
    """
    if not client:
        logger.warning("OpenAI client not initialized. Cannot generate text.")
        return {"error": "OpenAI client not initialized"}
    
    try:
        messages = []
        
        # Add system prompt if provided
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        
        # Add user prompt
        messages.append({"role": "user", "content": prompt})
        
        # Create completion
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature
        )
        
        return {
            "text": response.choices[0].message.content,
            "model": model,
            "usage": {
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens,
                "total_tokens": response.usage.total_tokens
            }
        }
    except Exception as e:
        logger.error(f"Error generating text: {str(e)}")
        return {"error": str(e)}

def generate_json(
    prompt: str,
    model: str = "gpt-4o",  # the newest OpenAI model is "gpt-4o" which was released May 13, 2024
    max_tokens: int = 1000,
    temperature: float = 0.7,
    system_prompt: Optional[str] = None
) -> Dict[str, Any]:
    """
    Generate structured JSON data using OpenAI's text completion API.
    
    Args:
        prompt (str): The user prompt to generate text from
        model (str): The OpenAI model to use (default: gpt-4o)
        max_tokens (int): Maximum tokens to generate (default: 1000)
        temperature (float): Temperature for text generation (default: 0.7)
        system_prompt (Optional[str]): Optional system prompt
        
    Returns:
        Dict[str, Any]: Response containing the generated JSON data
    """
    if not client:
        logger.warning("OpenAI client not initialized. Cannot generate JSON.")
        return {"error": "OpenAI client not initialized"}
    
    try:
        messages = []
        
        # Add system prompt if provided
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        
        # Add user prompt
        messages.append({"role": "user", "content": prompt})
        
        # Create completion with JSON response format
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature,
            response_format={"type": "json_object"}
        )
        
        # Parse the JSON response
        try:
            json_data = json.loads(response.choices[0].message.content)
        except json.JSONDecodeError:
            logger.warning("Failed to parse JSON response from OpenAI")
            json_data = {"error": "Invalid JSON response"}
        
        return {
            "data": json_data,
            "model": model,
            "usage": {
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens,
                "total_tokens": response.usage.total_tokens
            }
        }
    except Exception as e:
        logger.error(f"Error generating JSON: {str(e)}")
        return {"error": str(e)}

def generate_image(
    prompt: str,
    size: str = "1024x1024",
    quality: str = "standard",
    model: str = "dall-e-3"
) -> Dict[str, Any]:
    """
    Generate an image using OpenAI's DALL-E API.
    
    Args:
        prompt (str): The text prompt to generate an image from
        size (str): Image size (default: 1024x1024)
        quality (str): Image quality (default: standard)
        model (str): The model to use (default: dall-e-3)
        
    Returns:
        Dict[str, Any]: Response containing the generated image URL
    """
    if not client:
        logger.warning("OpenAI client not initialized. Cannot generate image.")
        return {"error": "OpenAI client not initialized"}
    
    try:
        response = client.images.generate(
            model=model,
            prompt=prompt,
            size=size,
            quality=quality,
            n=1
        )
        
        return {
            "url": response.data[0].url,
            "model": model,
            "revised_prompt": getattr(response.data[0], "revised_prompt", None)
        }
    except Exception as e:
        logger.error(f"Error generating image: {str(e)}")
        return {"error": str(e)}

def analyze_property_data(property_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Analyze property data using OpenAI to generate insights.
    
    Args:
        property_data (Dict[str, Any]): Property data to analyze
        
    Returns:
        Dict[str, Any]: Analysis results
    """
    if not client:
        logger.warning("OpenAI client not initialized. Cannot analyze property data.")
        return {"error": "OpenAI client not initialized"}
    
    try:
        # Format property data for analysis
        property_json = json.dumps(property_data, indent=2)
        
        # Create prompt for analysis
        prompt = f"""Analyze the following property data and provide insights:
        
{property_json}

Please provide the following analysis:
1. Estimated market value and price trends
2. Neighborhood assessment
3. Investment potential
4. Key property features
5. Recommendations for potential buyers

Format the response as JSON with the following structure:
{{"market_value": {"estimate": string, "trend": string},
 "neighborhood": {"assessment": string, "highlights": [string]},
 "investment": {"potential": string, "risks": [string], "opportunities": [string]},
 "key_features": [string],
 "recommendations": [string]
}}"""
        
        # Generate analysis
        result = generate_json(
            prompt=prompt,
            system_prompt="You are a real estate analysis expert. Provide professional, accurate, and useful insights based on property data.",
            temperature=0.2
        )
        
        return result.get("data", {"error": "Failed to analyze property data"})
    except Exception as e:
        logger.error(f"Error analyzing property data: {str(e)}")
        return {"error": str(e)}

def generate_property_description(property_data: Dict[str, Any]) -> str:
    """
    Generate a natural language description of a property using OpenAI.
    
    Args:
        property_data (Dict[str, Any]): Property data to describe
        
    Returns:
        str: Natural language description
    """
    if not client:
        logger.warning("OpenAI client not initialized. Cannot generate property description.")
        return "Property description not available."
    
    try:
        # Format property data
        property_json = json.dumps(property_data, indent=2)
        
        # Create prompt for description
        prompt = f"""Generate a professional, appealing real estate listing description for the following property:
        
{property_json}

The description should be engaging, highlight key features, and use terminology consistent with International Association of Assessing Officers (IAAO) standards."""
        
        # Generate description
        result = generate_text(
            prompt=prompt,
            system_prompt="You are a professional real estate agent writing property descriptions. Be accurate, engaging, and highlight the property's most appealing features while following industry standards.",
            temperature=0.7
        )
        
        return result.get("text", "Property description not available.")
    except Exception as e:
        logger.error(f"Error generating property description: {str(e)}")
        return "Property description not available."