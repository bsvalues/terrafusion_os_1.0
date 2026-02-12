import os
import json
from openai import OpenAI

class OpenAIClient:
    """Client for OpenAI API interactions"""
    
    def __init__(self):
        """Initialize the OpenAI client with API key from environment variables"""
        self.api_key = os.environ.get("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY environment variable is not set")
        
        self.client = OpenAI(api_key=self.api_key)
        # the newest OpenAI model is "gpt-4o" which was released May 13, 2024.
        # do not change this unless explicitly requested by the user
        self.model = "gpt-4o"
    
    def generate_completion(self, prompt, max_tokens=500):
        """
        Generate text completion using OpenAI's chat completion API
        
        Args:
            prompt (str): The prompt for text generation
            max_tokens (int): Maximum number of tokens to generate
            
        Returns:
            str: Generated text response
        """
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=max_tokens
        )
        return response.choices[0].message.content
    
    def generate_structured_completion(self, system_prompt, user_prompt, response_format=None):
        """
        Generate structured completion with optional JSON format
        
        Args:
            system_prompt (str): System instructions
            user_prompt (str): User query
            response_format (dict, optional): Format specification for response
            
        Returns:
            dict or str: Structured response (dict if JSON format requested)
        """
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        kwargs = {
            "model": self.model,
            "messages": messages
        }
        
        if response_format:
            kwargs["response_format"] = response_format
        
        response = self.client.chat.completions.create(**kwargs)
        content = response.choices[0].message.content
        
        # If response_format is JSON, parse the response
        if response_format and response_format.get("type") == "json_object":
            try:
                return json.loads(content)
            except json.JSONDecodeError:
                # Fall back to string if parsing fails
                return content
        
        return content