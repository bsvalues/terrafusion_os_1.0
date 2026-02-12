import os
import json
import logging
import time
from typing import Dict, Any, List, Optional, Union
import openai
from openai import OpenAI
import anthropic
from anthropic import Anthropic

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('model_interface')

class ModelInterface:
    """
    Interface for AI model interactions with multiple provider support.
    
    This class handles interactions with various AI models from OpenAI
    and Anthropic, providing a unified interface for text generation,
    embeddings, and other AI capabilities.
    """
    
    def __init__(self):
        """Initialize the model interface with available providers."""
        # Initialize OpenAI client if API key is available
        self.openai_client = None
        self.openai_available = False
        if os.environ.get("OPENAI_API_KEY"):
            try:
                self.openai_client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
                self.openai_available = True
                logger.info("OpenAI client initialized successfully.")
            except Exception as e:
                logger.error(f"Error initializing OpenAI client: {str(e)}")
        
        # Initialize Anthropic client if API key is available
        self.anthropic_client = None
        self.anthropic_available = False
        if os.environ.get("ANTHROPIC_API_KEY"):
            try:
                self.anthropic_client = Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
                self.anthropic_available = True
                logger.info("Anthropic client initialized successfully.")
            except Exception as e:
                logger.error(f"Error initializing Anthropic client: {str(e)}")
    
    def check_openai_status(self) -> bool:
        """
        Check if OpenAI service is available and functioning.
        
        Returns:
            True if available and functioning, False otherwise
        """
        if not self.openai_client:
            return False
        
        try:
            # Try to list models as a simple API test
            self.openai_client.models.list()
            return True
        except Exception as e:
            logger.error(f"OpenAI service check failed: {str(e)}")
            return False
    
    def check_anthropic_status(self) -> bool:
        """
        Check if Anthropic service is available and functioning.
        
        Returns:
            True if available and functioning, False otherwise
        """
        if not self.anthropic_client:
            return False
        
        try:
            # Simple API test by sending a minimal message
            self.anthropic_client.messages.create(
                model="claude-3-haiku-20240307",
                max_tokens=10,
                messages=[{"role": "user", "content": "Hello"}]
            )
            return True
        except Exception as e:
            logger.error(f"Anthropic service check failed: {str(e)}")
            return False
    
    def get_available_providers(self) -> List[str]:
        """
        Get list of available AI providers.
        
        Returns:
            List of available provider names
        """
        providers = []
        if self.openai_available:
            providers.append("openai")
        if self.anthropic_available:
            providers.append("anthropic")
        return providers
    
    def generate_text(
        self,
        prompt: str,
        system_message: Optional[str] = None,
        provider: str = "auto",
        model: Optional[str] = None,
        max_tokens: int = 1000,
        temperature: float = 0.7,
        top_p: float = 1.0,
        frequency_penalty: float = 0.0,
        presence_penalty: float = 0.0,
        stop_sequences: Optional[List[str]] = None
    ) -> str:
        """
        Generate text using the specified AI provider.
        
        Args:
            prompt: User prompt/query
            system_message: Optional system message to guide the model
            provider: AI provider to use (openai, anthropic, or auto)
            model: Specific model name to use (if None, uses provider default)
            max_tokens: Maximum tokens in the response
            temperature: Sampling temperature (higher = more random)
            top_p: Nucleus sampling parameter
            frequency_penalty: Penalty for frequent tokens
            presence_penalty: Penalty for repeated tokens
            stop_sequences: Optional list of stop sequences
            
        Returns:
            Generated text response
            
        Raises:
            ValueError: If no suitable provider is available
        """
        # If provider is auto, select the best available provider
        if provider == "auto":
            if self.openai_available:
                provider = "openai"
            elif self.anthropic_available:
                provider = "anthropic"
            else:
                raise ValueError("No AI provider available. Please configure OpenAI or Anthropic API keys.")
        
        # Generate with specified provider
        if provider == "openai":
            return self._generate_with_openai(
                prompt=prompt,
                system_message=system_message,
                model=model,
                max_tokens=max_tokens,
                temperature=temperature,
                top_p=top_p,
                frequency_penalty=frequency_penalty,
                presence_penalty=presence_penalty,
                stop_sequences=stop_sequences
            )
        elif provider == "anthropic":
            return self._generate_with_anthropic(
                prompt=prompt,
                system_message=system_message,
                model=model,
                max_tokens=max_tokens,
                temperature=temperature,
                top_p=top_p,
                stop_sequences=stop_sequences
            )
        else:
            raise ValueError(f"Unknown provider: {provider}")
    
    def _generate_with_openai(
        self,
        prompt: str,
        system_message: Optional[str] = None,
        model: Optional[str] = None,
        max_tokens: int = 1000,
        temperature: float = 0.7,
        top_p: float = 1.0,
        frequency_penalty: float = 0.0,
        presence_penalty: float = 0.0,
        stop_sequences: Optional[List[str]] = None
    ) -> str:
        """
        Generate text using OpenAI models.
        
        Args:
            prompt: User prompt/query
            system_message: Optional system message
            model: Specific model to use
            max_tokens: Maximum tokens in response
            temperature: Sampling temperature
            top_p: Nucleus sampling parameter
            frequency_penalty: Penalty for frequent tokens
            presence_penalty: Penalty for repeated tokens
            stop_sequences: Optional list of stop sequences
            
        Returns:
            Generated text response
            
        Raises:
            ValueError: If OpenAI is not available
        """
        if not self.openai_available:
            raise ValueError("OpenAI is not available. Please configure the API key.")
        
        # Use GPT-4o by default (newest model as of May 2024)
        # the newest OpenAI model is "gpt-4o" which was released May 13, 2024.
        # do not change this unless explicitly requested by the user
        model = model or "gpt-4o"
        
        # Prepare messages
        messages = []
        if system_message:
            messages.append({"role": "system", "content": system_message})
        messages.append({"role": "user", "content": prompt})
        
        try:
            # Generate response
            response = self.openai_client.chat.completions.create(
                model=model,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
                top_p=top_p,
                frequency_penalty=frequency_penalty,
                presence_penalty=presence_penalty,
                stop=stop_sequences
            )
            
            # Extract and return content
            return response.choices[0].message.content
        
        except Exception as e:
            logger.error(f"Error generating text with OpenAI: {str(e)}")
            raise
    
    def _generate_with_anthropic(
        self,
        prompt: str,
        system_message: Optional[str] = None,
        model: Optional[str] = None,
        max_tokens: int = 1000,
        temperature: float = 0.7,
        top_p: float = 1.0,
        stop_sequences: Optional[List[str]] = None
    ) -> str:
        """
        Generate text using Anthropic Claude models.
        
        Args:
            prompt: User prompt/query
            system_message: Optional system message
            model: Specific model to use
            max_tokens: Maximum tokens in response
            temperature: Sampling temperature
            top_p: Nucleus sampling parameter
            stop_sequences: Optional list of stop sequences
            
        Returns:
            Generated text response
            
        Raises:
            ValueError: If Anthropic is not available
        """
        if not self.anthropic_available:
            raise ValueError("Anthropic is not available. Please configure the API key.")
        
        # Use Claude 3.5 Sonnet by default (newest model as of October 2024)
        # the newest Anthropic model is "claude-3-5-sonnet-20241022" which was released October 22, 2024.
        # do not change this unless explicitly requested by the user
        model = model or "claude-3-5-sonnet-20241022"
        
        # Prepare messages
        messages = [{"role": "user", "content": prompt}]
        
        try:
            # Generate response
            response = self.anthropic_client.messages.create(
                model=model,
                max_tokens=max_tokens,
                temperature=temperature,
                top_p=top_p,
                system=system_message,
                messages=messages,
                stop_sequences=stop_sequences
            )
            
            # Extract and return content
            return response.content[0].text
        
        except Exception as e:
            logger.error(f"Error generating text with Anthropic: {str(e)}")
            raise
    
    def generate_chat_response(
        self,
        messages: List[Dict[str, str]],
        system_message: Optional[str] = None,
        provider: str = "auto",
        model: Optional[str] = None,
        max_tokens: int = 1000,
        temperature: float = 0.7
    ) -> str:
        """
        Generate a response for a multi-turn chat.
        
        Args:
            messages: List of chat messages, each with 'role' and 'content'
            system_message: Optional system message
            provider: AI provider to use
            model: Specific model to use
            max_tokens: Maximum tokens in response
            temperature: Sampling temperature
            
        Returns:
            Generated chat response
            
        Raises:
            ValueError: If no suitable provider is available
        """
        # If provider is auto, select the best available provider
        if provider == "auto":
            if self.openai_available:
                provider = "openai"
            elif self.anthropic_available:
                provider = "anthropic"
            else:
                raise ValueError("No AI provider available. Please configure OpenAI or Anthropic API keys.")
        
        if provider == "openai":
            return self._chat_with_openai(
                messages=messages,
                system_message=system_message,
                model=model,
                max_tokens=max_tokens,
                temperature=temperature
            )
        elif provider == "anthropic":
            return self._chat_with_anthropic(
                messages=messages,
                system_message=system_message,
                model=model,
                max_tokens=max_tokens,
                temperature=temperature
            )
        else:
            raise ValueError(f"Unknown provider: {provider}")
    
    def _chat_with_openai(
        self,
        messages: List[Dict[str, str]],
        system_message: Optional[str] = None,
        model: Optional[str] = None,
        max_tokens: int = 1000,
        temperature: float = 0.7
    ) -> str:
        """
        Generate a chat response using OpenAI.
        
        Args:
            messages: List of chat messages
            system_message: Optional system message
            model: Specific model to use
            max_tokens: Maximum tokens in response
            temperature: Sampling temperature
            
        Returns:
            Generated chat response
        """
        if not self.openai_available:
            raise ValueError("OpenAI is not available. Please configure the API key.")
        
        # Use GPT-4o by default
        model = model or "gpt-4o"
        
        # Prepare messages
        openai_messages = []
        if system_message:
            openai_messages.append({"role": "system", "content": system_message})
        
        # Convert message format if needed
        for msg in messages:
            openai_messages.append({
                "role": msg["role"],
                "content": msg["content"]
            })
        
        try:
            # Generate response
            response = self.openai_client.chat.completions.create(
                model=model,
                messages=openai_messages,
                max_tokens=max_tokens,
                temperature=temperature
            )
            
            # Extract and return content
            return response.choices[0].message.content
        
        except Exception as e:
            logger.error(f"Error generating chat response with OpenAI: {str(e)}")
            raise
    
    def _chat_with_anthropic(
        self,
        messages: List[Dict[str, str]],
        system_message: Optional[str] = None,
        model: Optional[str] = None,
        max_tokens: int = 1000,
        temperature: float = 0.7
    ) -> str:
        """
        Generate a chat response using Anthropic Claude.
        
        Args:
            messages: List of chat messages
            system_message: Optional system message
            model: Specific model to use
            max_tokens: Maximum tokens in response
            temperature: Sampling temperature
            
        Returns:
            Generated chat response
        """
        if not self.anthropic_available:
            raise ValueError("Anthropic is not available. Please configure the API key.")
        
        # Use Claude 3.5 Sonnet by default
        model = model or "claude-3-5-sonnet-20241022"
        
        # Convert message format for Anthropic
        anthropic_messages = []
        for msg in messages:
            anthropic_messages.append({
                "role": msg["role"],
                "content": msg["content"]
            })
        
        try:
            # Generate response
            response = self.anthropic_client.messages.create(
                model=model,
                max_tokens=max_tokens,
                temperature=temperature,
                system=system_message,
                messages=anthropic_messages
            )
            
            # Extract and return content
            return response.content[0].text
        
        except Exception as e:
            logger.error(f"Error generating chat response with Anthropic: {str(e)}")
            raise
    
    def generate_embeddings(
        self,
        texts: List[str],
        provider: str = "auto",
        model: Optional[str] = None
    ) -> List[List[float]]:
        """
        Generate embeddings for the provided texts.
        
        Args:
            texts: List of texts to generate embeddings for
            provider: AI provider to use
            model: Specific embedding model to use
            
        Returns:
            List of embeddings (each embedding is a list of floats)
            
        Raises:
            ValueError: If no suitable provider is available
        """
        # If provider is auto, select the best available provider
        if provider == "auto":
            if self.openai_available:
                provider = "openai"
            else:
                raise ValueError("No suitable embedding provider available. Please configure OpenAI API key.")
        
        if provider == "openai":
            return self._get_embeddings_openai(texts=texts, model=model)
        else:
            raise ValueError(f"Unsupported embedding provider: {provider}")
    
    def _get_embeddings_openai(
        self,
        texts: List[str],
        model: Optional[str] = None
    ) -> List[List[float]]:
        """
        Generate embeddings using OpenAI models.
        
        Args:
            texts: List of texts to generate embeddings for
            model: Specific embedding model to use
            
        Returns:
            List of embeddings
            
        Raises:
            ValueError: If OpenAI is not available
        """
        if not self.openai_available:
            raise ValueError("OpenAI is not available. Please configure the API key.")
        
        # Use text-embedding-3-small by default
        model = model or "text-embedding-3-small"
        
        try:
            # Generate embeddings
            response = self.openai_client.embeddings.create(
                model=model,
                input=texts
            )
            
            # Extract and return embeddings
            return [item.embedding for item in response.data]
        
        except Exception as e:
            logger.error(f"Error generating embeddings with OpenAI: {str(e)}")
            raise
            
    def analyze_code(
        self,
        code: str,
        language: str,
        query: str,
        provider: str = "auto",
        model: Optional[str] = None,
        max_tokens: int = 2000,
        temperature: float = 0.3
    ) -> Dict[str, Any]:
        """
        Analyze code with AI for quality, architecture, performance, or security insights.
        
        Args:
            code: Source code to analyze
            language: Programming language of the code
            query: Specific analysis question or focus
            provider: AI provider to use (openai, anthropic, or auto)
            model: Specific model to use
            max_tokens: Maximum tokens in response
            temperature: Temperature for generation
            
        Returns:
            Dictionary containing analysis results
            
        Raises:
            ValueError: If no suitable provider is available
        """
        # Construct the prompt
        system_message = f"""You are an expert code analyzer specializing in {language} development.
Analyze the provided code with special attention to best practices, maintainability, and performance.
Focus your analysis on answering the provided query.
Provide a thorough analysis in a structured format with:
1. A brief summary of the code's purpose
2. Quality assessment (scale of 1-10)
3. Detailed response to the specific query
4. List of identified issues
5. Specific recommendations for improvement"""

        prompt = f"""Please analyze the following {language} code:

```{language}
{code}
```

Specific analysis query: {query}

Respond in JSON format with the following structure:
{{
    "summary": "Brief summary of what the code does",
    "quality_score": quality score from 1-10,
    "query_response": "Detailed response addressing the specific analysis query",
    "issues": ["Issue 1", "Issue 2", ...],
    "recommendations": ["Recommendation 1", "Recommendation 2", ...]
}}
"""

        # If provider is auto, select the best available provider
        if provider == "auto":
            if self.openai_available:
                provider = "openai"
            elif self.anthropic_available:
                provider = "anthropic"
            else:
                raise ValueError("No AI provider available. Please configure OpenAI or Anthropic API keys.")
        
        try:
            # Generate analysis using the selected provider
            response_text = self.generate_text(
                prompt=prompt,
                system_message=system_message,
                provider=provider,
                model=model,
                max_tokens=max_tokens,
                temperature=temperature
            )
            
            # Extract JSON from the response
            try:
                # Try to parse response as JSON directly
                analysis_result = json.loads(response_text)
            except json.JSONDecodeError:
                # If direct parsing fails, try to extract JSON from markdown
                import re
                json_match = re.search(r"```json\n(.*?)\n```", response_text, re.DOTALL)
                if json_match:
                    try:
                        analysis_result = json.loads(json_match.group(1))
                    except json.JSONDecodeError:
                        # If extraction fails, return basic response
                        analysis_result = {
                            "summary": "Could not parse analysis result",
                            "quality_score": 5,
                            "query_response": response_text,
                            "issues": ["Error parsing analysis result"],
                            "recommendations": ["Try again with more specific query"]
                        }
                else:
                    # If no JSON block found, use the text as the query response
                    analysis_result = {
                        "summary": "Analysis completed",
                        "quality_score": 5,
                        "query_response": response_text,
                        "issues": [],
                        "recommendations": []
                    }
            
            return analysis_result
            
        except Exception as e:
            logger.error(f"Error analyzing code: {str(e)}")
            return {
                "summary": "Error analyzing code",
                "quality_score": 0,
                "query_response": f"Error: {str(e)}",
                "issues": ["Analysis failed due to an error"],
                "recommendations": ["Try again with a shorter code sample or different provider"]
            }