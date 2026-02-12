import os
import json
import anthropic
from anthropic import Anthropic

class AnthropicClient:
    """Client for Anthropic API interactions"""
    
    def __init__(self):
        """Initialize the Anthropic client with API key from environment variables"""
        self.api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable is not set")
        
        self.client = Anthropic(api_key=self.api_key)
        # the newest Anthropic model is "claude-3-5-sonnet-20241022" which was released October 22, 2024
        self.model = "claude-3-5-sonnet-20241022"
    
    def generate_completion(self, prompt, max_tokens=1000):
        """
        Generate text completion using Anthropic's API
        
        Args:
            prompt (str): The prompt for text generation
            max_tokens (int): Maximum number of tokens to generate
            
        Returns:
            str: Generated text response
        """
        response = self.client.messages.create(
            model=self.model,
            max_tokens=max_tokens,
            messages=[{"role": "user", "content": prompt}]
        )
        return response.content[0].text
    
    def generate_structured_completion(self, system_prompt, user_prompt):
        """
        Generate structured completion with system instructions
        
        Args:
            system_prompt (str): System instructions
            user_prompt (str): User query
            
        Returns:
            str: Generated response
        """
        response = self.client.messages.create(
            model=self.model,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}]
        )
        return response.content[0].text
    
    def analyze_structured_data(self, system_prompt, user_prompt, json_response=False):
        """
        Analyze data with optional JSON structured output
        
        Args:
            system_prompt (str): System instructions
            user_prompt (str): User query with data to analyze
            json_response (bool): Whether to parse response as JSON
            
        Returns:
            dict or str: Structured response (dict if JSON requested)
        """
        if json_response:
            system_prompt += "\nYour response must be valid JSON."
        
        response = self.client.messages.create(
            model=self.model,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}]
        )
        
        content = response.content[0].text
        
        # If JSON response is requested, try to parse the response
        if json_response:
            try:
                # Find JSON content (sometimes Claude wraps JSON in ```json blocks)
                json_start = content.find('```json')
                if json_start != -1:
                    json_start = content.find('{', json_start)
                    json_end = content.rfind('}') + 1
                    json_content = content[json_start:json_end]
                else:
                    json_content = content
                
                return json.loads(json_content)
            except json.JSONDecodeError:
                # Fall back to string if parsing fails
                return content
        
        return content