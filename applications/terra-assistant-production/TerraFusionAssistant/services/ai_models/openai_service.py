"""
OpenAI Service

This module provides interfaces to the OpenAI API for various AI capabilities.
"""
import os
import json
import logging
import base64
from typing import Dict, List, Any, Optional, Union

from openai import OpenAI

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class OpenAIService:
    """
    Service for interfacing with OpenAI models.
    
    This class provides:
    - Text generation
    - Code analysis
    - Image analysis
    - Multimodal understanding
    """
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize the OpenAI service.
        
        Args:
            api_key: Optional API key (if not provided, will use environment variable)
        """
        self.api_key = api_key or os.environ.get("OPENAI_API_KEY")
        
        if not self.api_key:
            logger.warning("No OpenAI API key provided")
            self.client = None
        else:
            self.client = OpenAI(api_key=self.api_key)
            logger.info("OpenAI client initialized")
        
        # Default model settings
        # The newest OpenAI model is "gpt-4o" which was released May 13, 2024.
        # do not change this unless explicitly requested by the user.
        self.default_model = "gpt-4o"
        self.default_temperature = 0.1
        self.default_max_tokens = 2000
    
    def is_available(self) -> bool:
        """
        Check if the OpenAI service is available.
        
        Returns:
            True if available, False otherwise
        """
        return self.client is not None
    
    def generate_text(self, prompt: str, model: Optional[str] = None,
                   temperature: Optional[float] = None,
                   max_tokens: Optional[int] = None,
                   json_output: bool = False) -> Dict[str, Any]:
        """
        Generate text using OpenAI models.
        
        Args:
            prompt: The prompt to generate text from
            model: Optional model name (defaults to default_model)
            temperature: Optional temperature setting (defaults to default_temperature)
            max_tokens: Optional maximum tokens (defaults to default_max_tokens)
            json_output: Whether to request JSON output format
            
        Returns:
            Dictionary with the response and metadata
        """
        if not self.is_available():
            return {"error": "OpenAI service not available"}
        
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
            
            # Add JSON output format if requested
            if json_output:
                request_params["response_format"] = {"type": "json_object"}
            
            # Make API call
            response = self.client.chat.completions.create(**request_params)
            
            # Extract and return the response
            response_text = response.choices[0].message.content
            
            return {
                "text": response_text,
                "model": model,
                "usage": {
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens
                }
            }
        
        except Exception as e:
            logger.error(f"Error generating text with OpenAI: {e}")
            return {"error": str(e)}
    
    def generate_structured_output(self, prompt: str, output_schema: Dict[str, Any],
                                model: Optional[str] = None,
                                temperature: Optional[float] = None) -> Dict[str, Any]:
        """
        Generate structured output using OpenAI models.
        
        Args:
            prompt: The prompt to generate text from
            output_schema: Schema for the expected output structure (as a dictionary)
            model: Optional model name (defaults to default_model)
            temperature: Optional temperature setting (defaults to default_temperature)
            
        Returns:
            Dictionary with the structured response and metadata
        """
        if not self.is_available():
            return {"error": "OpenAI service not available"}
        
        try:
            # Prepare parameters
            model = model or self.default_model
            temperature = temperature if temperature is not None else self.default_temperature
            
            # Create a prompt that describes the expected output structure
            schema_description = json.dumps(output_schema, indent=2)
            structured_prompt = f"{prompt}\n\nPlease provide your response as a JSON object with the following structure:\n{schema_description}"
            
            # Make the API call with JSON output format
            response = self.generate_text(
                prompt=structured_prompt,
                model=model,
                temperature=temperature,
                json_output=True
            )
            
            # Parse the JSON response
            if "error" in response:
                return response
            
            try:
                structured_data = json.loads(response["text"])
                response["data"] = structured_data
                return response
            
            except json.JSONDecodeError:
                logger.error("Error parsing JSON from OpenAI response")
                return {
                    "error": "Failed to parse JSON response",
                    "raw_response": response["text"]
                }
        
        except Exception as e:
            logger.error(f"Error generating structured output with OpenAI: {e}")
            return {"error": str(e)}
    
    def analyze_code(self, code: str, analysis_type: str = "review",
                  language: Optional[str] = None) -> Dict[str, Any]:
        """
        Analyze code using OpenAI models.
        
        Args:
            code: The code to analyze
            analysis_type: Type of analysis to perform (review, security, complexity, etc.)
            language: Optional programming language
            
        Returns:
            Dictionary with the analysis results
        """
        if not self.is_available():
            return {"error": "OpenAI service not available"}
        
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
                        "Format your response as a JSON object with the following structure:\n" + \
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
                        "Format your response as a JSON object with the following structure:\n" + \
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
                        "Format your response as a JSON object with the following structure:\n" + \
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
                        "Format your response as a JSON object with the following structure:\n" + \
                        "{\n" + \
                        '  "overview": "overall description of the code",\n' + \
                        '  "functions": [ {"name": "function_name", "description": "what it does", "parameters": [{"name": "param1", "type": "type", "description": "desc"}], "returns": {"type": "return_type", "description": "what it returns"}, "example": "usage example"}, ... ],\n' + \
                        '  "classes": [ {"name": "class_name", "description": "what it does", "methods": [{"name": "method_name", "description": "desc", ...}]}, ... ]\n' + \
                        "}"
            
            else:
                prompt = f"Please analyze the following{language_str} code:\n\n```\n{code}\n```\n\n" + \
                        f"Provide a detailed {analysis_type} analysis in JSON format."
            
            # Make the API call with JSON output format
            response = self.generate_structured_output(
                prompt=prompt,
                output_schema={},  # The schema is described in the prompt
                model=self.default_model,
                temperature=0.1  # Low temperature for more deterministic results
            )
            
            return response
        
        except Exception as e:
            logger.error(f"Error analyzing code with OpenAI: {e}")
            return {"error": str(e)}
    
    def analyze_image(self, image_path: str) -> Dict[str, Any]:
        """
        Analyze an image using OpenAI models.
        
        Args:
            image_path: Path to the image file
            
        Returns:
            Dictionary with the analysis results
        """
        if not self.is_available():
            return {"error": "OpenAI service not available"}
        
        try:
            # Read and encode the image
            with open(image_path, "rb") as image_file:
                image_data = image_file.read()
            
            base64_image = base64.b64encode(image_data).decode('utf-8')
            
            # Make API call
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": "Analyze this image in detail. Describe what you see, including any text, diagrams, or visual elements. If it appears to be a screenshot of code or a technical diagram, provide a detailed analysis."
                            },
                            {
                                "type": "image_url",
                                "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}
                            }
                        ]
                    }
                ],
                max_tokens=1000
            )
            
            # Extract and return the response
            response_text = response.choices[0].message.content
            
            return {
                "analysis": response_text,
                "model": "gpt-4o",
                "usage": {
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens
                }
            }
        
        except Exception as e:
            logger.error(f"Error analyzing image with OpenAI: {e}")
            return {"error": str(e)}
    
    def multimodal_analysis(self, text: str, image_path: Optional[str] = None,
                         code: Optional[str] = None) -> Dict[str, Any]:
        """
        Perform multimodal analysis using OpenAI models.
        
        Args:
            text: The text prompt
            image_path: Optional path to an image file
            code: Optional code snippet
            
        Returns:
            Dictionary with the analysis results
        """
        if not self.is_available():
            return {"error": "OpenAI service not available"}
        
        try:
            # Prepare messages
            messages = [
                {
                    "role": "user",
                    "content": []
                }
            ]
            
            # Add text content
            messages[0]["content"].append({
                "type": "text",
                "text": text
            })
            
            # Add image content if provided
            if image_path:
                with open(image_path, "rb") as image_file:
                    image_data = image_file.read()
                
                base64_image = base64.b64encode(image_data).decode('utf-8')
                
                messages[0]["content"].append({
                    "type": "image_url",
                    "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}
                })
            
            # Add code content if provided
            if code:
                messages[0]["content"][0]["text"] += f"\n\nCode:\n```\n{code}\n```"
            
            # Make API call
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=messages,
                max_tokens=1500
            )
            
            # Extract and return the response
            response_text = response.choices[0].message.content
            
            return {
                "analysis": response_text,
                "model": "gpt-4o",
                "usage": {
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens
                }
            }
        
        except Exception as e:
            logger.error(f"Error performing multimodal analysis with OpenAI: {e}")
            return {"error": str(e)}
    
    def generate_image(self, prompt: str, size: str = "1024x1024",
                     quality: str = "standard") -> Dict[str, Any]:
        """
        Generate an image using OpenAI DALL-E models.
        
        Args:
            prompt: The image generation prompt
            size: Image size (256x256, 512x512, or 1024x1024)
            quality: Image quality (standard or hd)
            
        Returns:
            Dictionary with the image URL and metadata
        """
        if not self.is_available():
            return {"error": "OpenAI service not available"}
        
        try:
            # Make API call
            response = self.client.images.generate(
                model="dall-e-3",
                prompt=prompt,
                size=size,
                quality=quality,
                n=1
            )
            
            # Extract and return the response
            image_url = response.data[0].url
            
            return {
                "url": image_url,
                "model": "dall-e-3",
                "prompt": prompt
            }
        
        except Exception as e:
            logger.error(f"Error generating image with OpenAI: {e}")
            return {"error": str(e)}