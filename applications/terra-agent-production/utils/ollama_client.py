"""
Ollama Local AI Model Client
Provides local AI model hosting integration for the PACS platform.
"""

import os
import json
import logging
import requests
from typing import Dict, Any, Optional

# Get logger
logger = logging.getLogger("pacs_assistant")

class OllamaClient:
    """Client for interacting with local Ollama AI models."""
    
    def __init__(self, base_url: str = "http://localhost:11434"):
        """
        Initialize Ollama client.
        
        Args:
            base_url (str): Base URL for Ollama API
        """
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json'
        })
    
    def is_available(self) -> bool:
        """
        Check if Ollama service is available.
        
        Returns:
            bool: True if service is available
        """
        try:
            response = self.session.get(f"{self.base_url}/api/tags", timeout=5)
            return response.status_code == 200
        except Exception as e:
            logger.debug(f"Ollama service check failed: {str(e)}")
            return False
    
    def list_models(self) -> list:
        """
        List available models.
        
        Returns:
            list: List of available models
        """
        try:
            response = self.session.get(f"{self.base_url}/api/tags")
            if response.status_code == 200:
                data = response.json()
                return data.get('models', [])
            return []
        except Exception as e:
            logger.error(f"Error listing models: {str(e)}")
            return []
    
    def pull_model(self, model_name: str) -> bool:
        """
        Pull a model from Ollama registry.
        
        Args:
            model_name (str): Name of the model to pull
            
        Returns:
            bool: True if successful
        """
        try:
            response = self.session.post(
                f"{self.base_url}/api/pull",
                json={"name": model_name},
                timeout=300  # 5 minutes timeout for model download
            )
            return response.status_code == 200
        except Exception as e:
            logger.error(f"Error pulling model {model_name}: {str(e)}")
            return False
    
    def generate(self, model: str, prompt: str, system: str = "", stream: bool = False) -> str:
        """
        Generate text using Ollama model.
        
        Args:
            model (str): Model name to use
            prompt (str): Input prompt
            system (str): System message
            stream (bool): Whether to stream response
            
        Returns:
            str: Generated text
        """
        try:
            payload = {
                "model": model,
                "prompt": prompt,
                "stream": stream
            }
            
            if system and system.strip():
                payload["system"] = system
            
            response = self.session.post(
                f"{self.base_url}/api/generate",
                json=payload,
                timeout=60
            )
            
            if response.status_code == 200:
                data = response.json()
                return data.get('response', '')
            else:
                logger.error(f"Ollama generate error: {response.status_code} - {response.text}")
                return ""
                
        except Exception as e:
            logger.error(f"Error generating with Ollama: {str(e)}")
            return ""
    
    def chat(self, model: str, messages: list) -> str:
        """
        Chat with Ollama model.
        
        Args:
            model (str): Model name to use
            messages (list): List of message dictionaries
            
        Returns:
            str: Generated response
        """
        try:
            payload = {
                "model": model,
                "messages": messages,
                "stream": False
            }
            
            response = self.session.post(
                f"{self.base_url}/api/chat",
                json=payload,
                timeout=60
            )
            
            if response.status_code == 200:
                data = response.json()
                return data.get('message', {}).get('content', '')
            else:
                logger.error(f"Ollama chat error: {response.status_code} - {response.text}")
                return ""
                
        except Exception as e:
            logger.error(f"Error chatting with Ollama: {str(e)}")
            return ""

def get_ollama_client() -> Optional[OllamaClient]:
    """
    Get configured Ollama client.
    
    Returns:
        OllamaClient: Configured client or None if unavailable
    """
    try:
        client = OllamaClient()
        if client.is_available():
            logger.info("Ollama client initialized successfully")
            return client
        else:
            logger.warning("Ollama service is not available")
            return None
    except Exception as e:
        logger.error(f"Error initializing Ollama client: {str(e)}")
        return None

def ensure_model_available(client: OllamaClient, model_name: str = "llama3.2:3b") -> bool:
    """
    Ensure a specific model is available, pull it if necessary.
    
    Args:
        client (OllamaClient): Ollama client
        model_name (str): Model name to ensure
        
    Returns:
        bool: True if model is available
    """
    try:
        models = client.list_models()
        model_names = [model.get('name', '') for model in models]
        
        if model_name in model_names:
            logger.info(f"Model {model_name} is already available")
            return True
        
        logger.info(f"Pulling model {model_name}...")
        success = client.pull_model(model_name)
        
        if success:
            logger.info(f"Successfully pulled model {model_name}")
            return True
        else:
            logger.error(f"Failed to pull model {model_name}")
            return False
            
    except Exception as e:
        logger.error(f"Error ensuring model availability: {str(e)}")
        return False