"""
Anthropic Service

This module provides interfaces to the Anthropic Claude API for various AI capabilities.
"""
import os
import json
import logging
import base64
from typing import Dict, List, Any, Optional, Union

import anthropic
from anthropic import Anthropic

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class AnthropicService:
    """
    Service for interfacing with Anthropic Claude models.
    
    This class provides:
    - Text generation
    - Code analysis
    - Reasoning tasks
    - Multimodal understanding
    """
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize the Anthropic service.
        
        Args:
            api_key: Optional API key (if not provided, will use environment variable)
        """
        self.api_key = api_key or os.environ.get("ANTHROPIC_API_KEY")
        
        if not self.api_key:
            logger.warning("No Anthropic API key provided")
            self.client = None
        else:
            self.client = Anthropic(api_key=self.api_key)
            logger.info("Anthropic client initialized")
        
        # Default model settings
        # The newest Anthropic model is "claude-3-5-sonnet-20241022" which was released October 22, 2024.
        # Do not change this unless explicitly requested by the user.
        self.default_model = "claude-3-5-sonnet-20241022"
        self.default_temperature = 0.1
        self.default_max_tokens = 4000
    
    def is_available(self) -> bool:
        """
        Check if the Anthropic service is available.
        
        Returns:
            True if available, False otherwise
        """
        return self.client is not None
    
    def generate_text(self, prompt: str, model: Optional[str] = None,
                   temperature: Optional[float] = None,
                   max_tokens: Optional[int] = None,
                   system_prompt: Optional[str] = None) -> Dict[str, Any]:
        """
        Generate text using Anthropic Claude models.
        
        Args:
            prompt: The prompt to generate text from
            model: Optional model name (defaults to default_model)
            temperature: Optional temperature setting (defaults to default_temperature)
            max_tokens: Optional maximum tokens (defaults to default_max_tokens)
            system_prompt: Optional system prompt
            
        Returns:
            Dictionary with the response and metadata
        """
        if not self.is_available():
            return {"error": "Anthropic service not available"}
        
        try:
            # Prepare parameters
            model = model or self.default_model
            temperature = temperature if temperature is not None else self.default_temperature
            max_tokens = max_tokens or self.default_max_tokens
            
            # Prepare request
            request_params = {
                "model": model,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": temperature,
                "max_tokens": max_tokens
            }
            
            # Add system prompt if provided
            if system_prompt:
                request_params["system"] = system_prompt
            
            # Make API call
            response = self.client.messages.create(**request_params)
            
            # Extract and return the response
            response_text = response.content[0].text
            
            return {
                "text": response_text,
                "model": model,
                "usage": {
                    "input_tokens": response.usage.input_tokens,
                    "output_tokens": response.usage.output_tokens
                }
            }
        
        except Exception as e:
            logger.error(f"Error generating text with Anthropic: {e}")
            return {"error": str(e)}
    
    def generate_structured_output(self, prompt: str, output_schema: Dict[str, Any],
                                model: Optional[str] = None,
                                temperature: Optional[float] = None) -> Dict[str, Any]:
        """
        Generate structured output using Anthropic Claude models.
        
        Args:
            prompt: The prompt to generate text from
            output_schema: Schema for the expected output structure (as a dictionary)
            model: Optional model name (defaults to default_model)
            temperature: Optional temperature setting (defaults to default_temperature)
            
        Returns:
            Dictionary with the structured response and metadata
        """
        if not self.is_available():
            return {"error": "Anthropic service not available"}
        
        try:
            # Prepare parameters
            model = model or self.default_model
            temperature = temperature if temperature is not None else self.default_temperature
            
            # Create a system prompt that describes the expected output structure
            schema_description = json.dumps(output_schema, indent=2)
            system_prompt = f"You are a helpful AI assistant that provides responses in structured JSON format. Always respond with valid JSON that matches the following schema:\n{schema_description}"
            
            # Make the API call
            response = self.generate_text(
                prompt=prompt,
                model=model,
                temperature=temperature,
                system_prompt=system_prompt
            )
            
            # Parse the JSON response
            if "error" in response:
                return response
            
            try:
                # Extract JSON from the response
                # The response might contain additional text, so we'll try to find JSON delimiters
                text = response["text"]
                json_start = text.find("{")
                json_end = text.rfind("}") + 1
                
                if json_start >= 0 and json_end > json_start:
                    json_str = text[json_start:json_end]
                    structured_data = json.loads(json_str)
                    response["data"] = structured_data
                    return response
                else:
                    # Try to parse the whole response as JSON
                    structured_data = json.loads(text)
                    response["data"] = structured_data
                    return response
            
            except json.JSONDecodeError:
                logger.error("Error parsing JSON from Anthropic response")
                return {
                    "error": "Failed to parse JSON response",
                    "raw_response": response["text"]
                }
        
        except Exception as e:
            logger.error(f"Error generating structured output with Anthropic: {e}")
            return {"error": str(e)}
    
    def analyze_code(self, code: str, analysis_type: str = "review",
                  language: Optional[str] = None) -> Dict[str, Any]:
        """
        Analyze code using Anthropic Claude models.
        
        Args:
            code: The code to analyze
            analysis_type: Type of analysis to perform (review, security, complexity, etc.)
            language: Optional programming language
            
        Returns:
            Dictionary with the analysis results
        """
        if not self.is_available():
            return {"error": "Anthropic service not available"}
        
        try:
            # Create a prompt based on the analysis type
            language_str = f" {language}" if language else ""
            
            if analysis_type == "review":
                prompt = f"Please review the following{language_str} code:\n\n```\n{code}\n```\n\n" + \
                        "Provide a comprehensive code review including:\n" + \
                        "1. Overall code quality assessment\n" + \
                        "2. Potential bugs or issues\n" + \
                        "3. Performance concerns\n" + \
                        "4. Maintainability suggestions\n" + \
                        "5. Best practices recommendations\n\n" + \
                        "Respond with a JSON object with the following structure:\n" + \
                        "{\n" + \
                        '  "overall_assessment": "Brief overall assessment",\n' + \
                        '  "code_quality_score": A number from 1-10,\n' + \
                        '  "issues": [ {"line": line_number, "issue": "issue description", "severity": "high/medium/low", "suggestion": "how to fix it"}, ... ],\n' + \
                        '  "recommendations": [ "recommendation 1", "recommendation 2", ... ]\n' + \
                        "}"
            
            elif analysis_type == "security":
                prompt = f"Please perform a security analysis of the following{language_str} code:\n\n```\n{code}\n```\n\n" + \
                        "Identify all security vulnerabilities including:\n" + \
                        "1. Injection vulnerabilities\n" + \
                        "2. Authentication issues\n" + \
                        "3. Sensitive data exposure\n" + \
                        "4. Security misconfigurations\n" + \
                        "5. Input validation issues\n\n" + \
                        "Respond with a JSON object with the following structure:\n" + \
                        "{\n" + \
                        '  "security_score": A number from 1-10,\n' + \
                        '  "vulnerabilities": [ {"line": line_number, "vulnerability": "vulnerability description", "severity": "critical/high/medium/low", "mitigation": "how to fix it"}, ... ],\n' + \
                        '  "security_recommendations": [ "recommendation 1", "recommendation 2", ... ]\n' + \
                        "}"
            
            elif analysis_type == "complexity":
                prompt = f"Please analyze the complexity of the following{language_str} code:\n\n```\n{code}\n```\n\n" + \
                        "Provide a detailed complexity analysis including:\n" + \
                        "1. Cyclomatic complexity assessment\n" + \
                        "2. Cognitive complexity assessment\n" + \
                        "3. Function/method complexity\n" + \
                        "4. Code paths and branches\n" + \
                        "5. Simplification suggestions\n\n" + \
                        "Respond with a JSON object with the following structure:\n" + \
                        "{\n" + \
                        '  "overall_complexity": A number from 1-10,\n' + \
                        '  "complex_sections": [ {"lines": "line range", "description": "complexity description", "complexity_score": score, "suggestion": "how to simplify"}, ... ],\n' + \
                        '  "simplification_recommendations": [ "recommendation 1", "recommendation 2", ... ]\n' + \
                        "}"
            
            elif analysis_type == "documentation":
                prompt = f"Please generate documentation for the following{language_str} code:\n\n```\n{code}\n```\n\n" + \
                        "Generate comprehensive documentation including:\n" + \
                        "1. Overview of what the code does\n" + \
                        "2. Function/class descriptions\n" + \
                        "3. Parameter documentation\n" + \
                        "4. Return value documentation\n" + \
                        "5. Usage examples\n\n" + \
                        "Respond with a JSON object with the following structure:\n" + \
                        "{\n" + \
                        '  "overview": "overall description of the code",\n' + \
                        '  "functions": [ {"name": "function_name", "description": "what it does", "parameters": [{"name": "param1", "type": "type", "description": "desc"}], "returns": {"type": "return_type", "description": "what it returns"}, "example": "usage example"}, ... ],\n' + \
                        '  "classes": [ {"name": "class_name", "description": "what it does", "methods": [{"name": "method_name", "description": "desc", ...}]}, ... ]\n' + \
                        "}"
            
            else:
                prompt = f"Please analyze the following{language_str} code:\n\n```\n{code}\n```\n\n" + \
                        f"Provide a detailed {analysis_type} analysis in JSON format."
            
            # Set up the system prompt for structured output
            system_prompt = "You are a code analysis expert. Always respond with valid JSON that follows the requested structure."
            
            # Make the API call
            response = self.generate_text(
                prompt=prompt,
                model=self.default_model,
                temperature=0.1,  # Low temperature for more deterministic results
                system_prompt=system_prompt
            )
            
            # Parse the JSON response
            if "error" in response:
                return response
            
            try:
                # Extract JSON from the response
                text = response["text"]
                json_start = text.find("{")
                json_end = text.rfind("}") + 1
                
                if json_start >= 0 and json_end > json_start:
                    json_str = text[json_start:json_end]
                    structured_data = json.loads(json_str)
                    response["data"] = structured_data
                    return response
                else:
                    # Try to parse the whole response as JSON
                    structured_data = json.loads(text)
                    response["data"] = structured_data
                    return response
            
            except json.JSONDecodeError:
                logger.error("Error parsing JSON from Anthropic response")
                return {
                    "error": "Failed to parse JSON response",
                    "raw_response": response["text"]
                }
        
        except Exception as e:
            logger.error(f"Error analyzing code with Anthropic: {e}")
            return {"error": str(e)}
    
    def analyze_image(self, image_path: str) -> Dict[str, Any]:
        """
        Analyze an image using Anthropic Claude models.
        
        Args:
            image_path: Path to the image file
            
        Returns:
            Dictionary with the analysis results
        """
        if not self.is_available():
            return {"error": "Anthropic service not available"}
        
        try:
            # Read the image file
            with open(image_path, "rb") as image_file:
                image_data = image_file.read()
            
            # Prepare the message
            message = self.client.messages.create(
                model=self.default_model,
                max_tokens=1000,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image",
                                "source": {
                                    "type": "base64",
                                    "media_type": "image/jpeg",  # Adjust based on image type
                                    "data": base64.b64encode(image_data).decode('utf-8')
                                }
                            },
                            {
                                "type": "text",
                                "text": "Analyze this image in detail. Describe what you see, including any text, diagrams, or visual elements. If it appears to be a screenshot of code or a technical diagram, provide a detailed analysis."
                            }
                        ]
                    }
                ]
            )
            
            # Extract the response
            response_text = message.content[0].text
            
            return {
                "analysis": response_text,
                "model": self.default_model,
                "usage": {
                    "input_tokens": message.usage.input_tokens,
                    "output_tokens": message.usage.output_tokens
                }
            }
        
        except Exception as e:
            logger.error(f"Error analyzing image with Anthropic: {e}")
            return {"error": str(e)}
    
    def multimodal_analysis(self, text: str, image_path: Optional[str] = None,
                         code: Optional[str] = None) -> Dict[str, Any]:
        """
        Perform multimodal analysis using Anthropic Claude models.
        
        Args:
            text: The text prompt
            image_path: Optional path to an image file
            code: Optional code snippet
            
        Returns:
            Dictionary with the analysis results
        """
        if not self.is_available():
            return {"error": "Anthropic service not available"}
        
        try:
            # Prepare the content list
            content = []
            
            # Add image content if provided
            if image_path:
                with open(image_path, "rb") as image_file:
                    image_data = image_file.read()
                
                content.append({
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": "image/jpeg",  # Adjust based on image type
                        "data": base64.b64encode(image_data).decode('utf-8')
                    }
                })
            
            # Prepare the text prompt
            prompt_text = text
            
            # Add code content if provided
            if code:
                prompt_text += f"\n\nCode:\n```\n{code}\n```"
            
            content.append({
                "type": "text",
                "text": prompt_text
            })
            
            # Make API call
            message = self.client.messages.create(
                model=self.default_model,
                max_tokens=1500,
                messages=[
                    {
                        "role": "user",
                        "content": content
                    }
                ]
            )
            
            # Extract the response
            response_text = message.content[0].text
            
            return {
                "analysis": response_text,
                "model": self.default_model,
                "usage": {
                    "input_tokens": message.usage.input_tokens,
                    "output_tokens": message.usage.output_tokens
                }
            }
        
        except Exception as e:
            logger.error(f"Error performing multimodal analysis with Anthropic: {e}")
            return {"error": str(e)}