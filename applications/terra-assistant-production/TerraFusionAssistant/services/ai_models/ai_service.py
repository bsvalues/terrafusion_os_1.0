"""
AI Service

This module provides a unified interface to multiple AI models for various capabilities.
"""
import os
import json
import logging
from typing import Dict, List, Any, Optional, Union

from services.ai_models.openai_service import OpenAIService
from services.ai_models.anthropic_service import AnthropicService

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class AIService:
    """
    Unified service for interfacing with various AI models.
    
    This class provides:
    - Model-agnostic interfaces for various AI capabilities
    - Fallback mechanisms between different providers
    - Result caching and optimization
    """
    
    def __init__(self, openai_api_key: Optional[str] = None, anthropic_api_key: Optional[str] = None):
        """
        Initialize the AI service.
        
        Args:
            openai_api_key: Optional OpenAI API key
            anthropic_api_key: Optional Anthropic API key
        """
        # Initialize service providers
        self.openai_service = OpenAIService(api_key=openai_api_key)
        self.anthropic_service = AnthropicService(api_key=anthropic_api_key)
        
        # Track available services
        self.available_services = {}
        self.available_services["openai"] = self.openai_service.is_available()
        self.available_services["anthropic"] = self.anthropic_service.is_available()
        
        logger.info(f"AI Service initialized with available services: {self.available_services}")
    
    def get_service_status(self) -> Dict[str, bool]:
        """
        Get the status of all AI services.
        
        Returns:
            Dictionary of service statuses
        """
        return self.available_services.copy()
    
    def generate_text(self, prompt: str, provider: str = "auto",
                   model: Optional[str] = None,
                   temperature: float = 0.1,
                   max_tokens: int = 2000) -> Dict[str, Any]:
        """
        Generate text using AI models.
        
        Args:
            prompt: The prompt to generate text from
            provider: AI provider to use ("openai", "anthropic", or "auto")
            model: Optional model name (provider-specific)
            temperature: Temperature setting (0.0 to 1.0)
            max_tokens: Maximum tokens to generate
            
        Returns:
            Dictionary with the response and metadata
        """
        # Determine the provider to use
        if provider == "auto":
            if self.available_services["openai"]:
                provider = "openai"
            elif self.available_services["anthropic"]:
                provider = "anthropic"
            else:
                return {"error": "No AI services available"}
        
        # Validate the provider
        if provider not in self.available_services or not self.available_services[provider]:
            return {"error": f"AI provider '{provider}' not available"}
        
        # Call the appropriate service
        if provider == "openai":
            return self.openai_service.generate_text(
                prompt=prompt,
                model=model,
                temperature=temperature,
                max_tokens=max_tokens
            )
        elif provider == "anthropic":
            return self.anthropic_service.generate_text(
                prompt=prompt,
                model=model,
                temperature=temperature,
                max_tokens=max_tokens
            )
    
    def analyze_code(self, code: str, analysis_type: str = "review",
                  language: Optional[str] = None,
                  provider: str = "auto") -> Dict[str, Any]:
        """
        Analyze code using AI models.
        
        Args:
            code: The code to analyze
            analysis_type: Type of analysis to perform (review, security, complexity, etc.)
            language: Optional programming language
            provider: AI provider to use ("openai", "anthropic", or "auto")
            
        Returns:
            Dictionary with the analysis results
        """
        # Determine the provider to use
        if provider == "auto":
            if self.available_services["anthropic"]:  # Prefer Anthropic for code analysis
                provider = "anthropic"
            elif self.available_services["openai"]:
                provider = "openai"
            else:
                return {"error": "No AI services available"}
        
        # Validate the provider
        if provider not in self.available_services or not self.available_services[provider]:
            return {"error": f"AI provider '{provider}' not available"}
        
        # Call the appropriate service
        if provider == "openai":
            return self.openai_service.analyze_code(
                code=code,
                analysis_type=analysis_type,
                language=language
            )
        elif provider == "anthropic":
            return self.anthropic_service.analyze_code(
                code=code,
                analysis_type=analysis_type,
                language=language
            )
        
        # Return error if no provider was used
        return {"error": "Failed to analyze code with any provider"}
    
    def analyze_image(self, image_path: str, provider: str = "auto") -> Dict[str, Any]:
        """
        Analyze an image using AI models.
        
        Args:
            image_path: Path to the image file
            provider: AI provider to use ("openai", "anthropic", or "auto")
            
        Returns:
            Dictionary with the analysis results
        """
        # Determine the provider to use
        if provider == "auto":
            if self.available_services["openai"]:  # Prefer OpenAI for image analysis
                provider = "openai"
            elif self.available_services["anthropic"]:
                provider = "anthropic"
            else:
                return {"error": "No AI services available"}
        
        # Validate the provider
        if provider not in self.available_services or not self.available_services[provider]:
            return {"error": f"AI provider '{provider}' not available"}
        
        # Call the appropriate service
        if provider == "openai":
            return self.openai_service.analyze_image(image_path=image_path)
        elif provider == "anthropic":
            return self.anthropic_service.analyze_image(image_path=image_path)
    
    def multimodal_analysis(self, text: str, image_path: Optional[str] = None,
                         code: Optional[str] = None,
                         provider: str = "auto") -> Dict[str, Any]:
        """
        Perform multimodal analysis using AI models.
        
        Args:
            text: The text prompt
            image_path: Optional path to an image file
            code: Optional code snippet
            provider: AI provider to use ("openai", "anthropic", or "auto")
            
        Returns:
            Dictionary with the analysis results
        """
        # Determine the provider to use
        if provider == "auto":
            if self.available_services["openai"]:  # Prefer OpenAI for multimodal analysis
                provider = "openai"
            elif self.available_services["anthropic"]:
                provider = "anthropic"
            else:
                return {"error": "No AI services available"}
        
        # Validate the provider
        if provider not in self.available_services or not self.available_services[provider]:
            return {"error": f"AI provider '{provider}' not available"}
        
        # Call the appropriate service
        if provider == "openai":
            return self.openai_service.multimodal_analysis(
                text=text,
                image_path=image_path,
                code=code
            )
        elif provider == "anthropic":
            return self.anthropic_service.multimodal_analysis(
                text=text,
                image_path=image_path,
                code=code
            )
    
    def generate_structured_output(self, prompt: str, output_schema: Dict[str, Any],
                          provider: str = "auto", temperature: float = 0.1) -> Dict[str, Any]:
        """
        Generate structured output using AI models.
        
        Args:
            prompt: The prompt for which to generate a structured response
            output_schema: Schema defining the expected output structure
            provider: AI provider to use ("openai", "anthropic", or "auto")
            temperature: Temperature setting (0.0 to 1.0)
            
        Returns:
            Dictionary with the structured output and metadata
        """
        # Determine the provider to use
        if provider == "auto":
            if self.available_services["openai"]:  # Prefer OpenAI for structured output
                provider = "openai"
            elif self.available_services["anthropic"]:
                provider = "anthropic"
            else:
                return {"error": "No AI services available"}
        
        # Validate the provider
        if provider not in self.available_services or not self.available_services[provider]:
            return {"error": f"AI provider '{provider}' not available"}
        
        # Create a unified prompt that specifies the output format
        schema_instruction = f"""
        Analyze the information and provide a response in the following JSON format:
        {json.dumps(output_schema, indent=2)}
        
        Ensure the response is valid JSON that matches this schema exactly.
        """
        
        unified_prompt = f"{prompt}\n\n{schema_instruction}"
        
        # Generate the structured output
        result = self.generate_text(
            prompt=unified_prompt,
            provider=provider,
            temperature=temperature,
            max_tokens=2000
        )
        
        if "error" in result:
            return result
        
        # Extract and parse the JSON from the response
        try:
            # Try to find JSON in the response
            text = result.get("text", "")
            json_start = text.find("{")
            json_end = text.rfind("}")
            
            if json_start >= 0 and json_end > json_start:
                json_str = text[json_start:json_end+1]
                data = json.loads(json_str)
                
                # Return the structured data with metadata
                return {
                    "status": "success",
                    "data": data,
                    "model": result.get("model", "unknown"),
                    "provider": provider
                }
            else:
                return {
                    "error": "Could not find valid JSON in the response",
                    "raw_text": text
                }
        except json.JSONDecodeError:
            return {
                "error": "Failed to parse JSON from response",
                "raw_text": result.get("text", "")
            }
        except Exception as e:
            return {
                "error": f"Error processing structured output: {str(e)}",
                "raw_text": result.get("text", "")
            }

    def analyze_repository(self, repo_path: str, analysis_areas: Optional[List[str]] = None,
                        provider: str = "auto") -> Dict[str, Any]:
        """
        Analyze a repository using AI models.
        
        Args:
            repo_path: Path to the repository directory
            analysis_areas: Optional list of areas to analyze (code_quality, security, etc.)
            provider: AI provider to use ("openai", "anthropic", or "auto")
            
        Returns:
            Dictionary with the analysis results
        """
        # Default analysis areas
        if analysis_areas is None:
            analysis_areas = [
                "code_quality",
                "architecture",
                "security",
                "maintainability",
                "performance"
            ]
        
        # Determine the provider to use
        if provider == "auto":
            if self.available_services["anthropic"]:  # Prefer Anthropic for repository analysis
                provider = "anthropic"
            elif self.available_services["openai"]:
                provider = "openai"
            else:
                return {"error": "No AI services available"}
        
        # Validate the provider
        if provider not in self.available_services or not self.available_services[provider]:
            return {"error": f"AI provider '{provider}' not available"}
        
        # This is a placeholder for a more comprehensive repository analysis
        # In a real implementation, this would:
        # 1. Traverse the repository directory
        # 2. Extract relevant files for analysis
        # 3. Call the appropriate analysis methods for each file/area
        # 4. Aggregate and synthesize the results
        
        return {
            "provider": provider,
            "repo_path": repo_path,
            "analysis_areas": analysis_areas,
            "status": "not_implemented",
            "message": "Repository analysis not implemented yet"
        }