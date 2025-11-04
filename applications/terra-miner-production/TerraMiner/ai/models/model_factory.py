import os
import logging
from typing import Optional, Union, Dict, Any

# Import model clients
from .openai_client import OpenAIClient
from .anthropic_client import AnthropicClient

logger = logging.getLogger(__name__)

class ModelFactory:
    """Factory class to create and manage AI model clients"""
    
    def __init__(self):
        """Initialize the model factory with available models"""
        self.models = {}
        
        # Try to initialize OpenAI client if key exists
        openai_key = os.environ.get("OPENAI_API_KEY")
        if openai_key:
            try:
                self.models["openai"] = OpenAIClient()
                logger.info("OpenAI client initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize OpenAI client: {str(e)}")
        
        # Try to initialize Anthropic client if key exists
        anthropic_key = os.environ.get("ANTHROPIC_API_KEY")
        if anthropic_key:
            try:
                self.models["anthropic"] = AnthropicClient()
                logger.info("Anthropic client initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Anthropic client: {str(e)}")
        
        # Set default provider preference order
        self.provider_preference = ["openai", "anthropic"]
        
        if not self.models:
            logger.warning("No AI models were initialized. Please check API keys.")
    
    def get_client(self, provider: Optional[str] = None) -> Union[OpenAIClient, AnthropicClient]:
        """
        Get an AI client for the specified or preferred provider
        
        Args:
            provider (str, optional): The provider to use ("openai" or "anthropic")
                                     If None, will try providers in preference order
        
        Returns:
            Union[OpenAIClient, AnthropicClient]: The AI client
            
        Raises:
            ValueError: If no client is available
        """
        # If provider specified, try to get that client
        if provider and provider in self.models:
            return self.models[provider]
        
        # Otherwise, try providers in preference order
        for provider in self.provider_preference:
            if provider in self.models:
                logger.info(f"Using {provider} as AI provider")
                return self.models[provider]
        
        # If we get here, no clients are available
        raise ValueError("No AI models are available. Please check API keys.")
    
    def generate_completion(self, prompt: str, provider: Optional[str] = None, 
                           max_tokens: int = 500) -> str:
        """
        Generate a text completion using the selected model
        
        Args:
            prompt (str): The prompt for text generation
            provider (str, optional): The provider to use
            max_tokens (int): Maximum tokens to generate
            
        Returns:
            str: Generated text response
        """
        client = self.get_client(provider)
        return client.generate_completion(prompt, max_tokens)
    
    def available_providers(self) -> list:
        """
        Get list of available AI providers
        
        Returns:
            list: List of available provider names
        """
        return list(self.models.keys())
    
    def set_provider_preference(self, preference_order: list) -> None:
        """
        Set the preference order for AI providers
        
        Args:
            preference_order (list): List of provider names in preference order
        """
        # Validate all providers exist
        for provider in preference_order:
            if provider not in self.models:
                raise ValueError(f"Provider '{provider}' is not available")
        
        self.provider_preference = preference_order
        logger.info(f"AI provider preference set to: {preference_order}")

# Create a singleton instance
model_factory = ModelFactory()