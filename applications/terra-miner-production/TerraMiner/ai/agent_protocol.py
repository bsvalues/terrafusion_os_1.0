import os
import logging
import json
from typing import Dict, Any, List, Optional

from ai.models.model_factory import model_factory
from ai.agents.text_summarizer import TextSummarizerAgent
from ai.agents.market_analyzer import MarketAnalyzerAgent
from ai.agents.recommendation_agent import RecommendationAgent
from ai.agents.nl_search_agent import NaturalLanguageSearchAgent

logger = logging.getLogger(__name__)

class AgentProtocol:
    """
    Handler for the agent protocol interface to interact with AI agents
    """
    
    def __init__(self):
        """Initialize the agent protocol handler"""
        # Initialize model factory
        self.model_factory = model_factory
        
        # Initialize agents
        self.summarizer = TextSummarizerAgent()
        self.market_analyzer = MarketAnalyzerAgent()
        self.recommender = RecommendationAgent()
        self.nl_search = NaturalLanguageSearchAgent()
        
        # Define available actions
        self.actions = {
            "summarize_property": self.summarize_property,
            "analyze_market": self.analyze_market, 
            "analyze_investment": self.analyze_investment,
            "get_recommendations": self.get_recommendations,
            "search_properties": self.search_properties,
            "answer_property_question": self.answer_property_question
        }
    
    def handle_request(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle an incoming agent protocol request
        
        Args:
            request_data (Dict[str, Any]): The request data, with format:
                {
                    "action": "action_name",
                    "parameters": {
                        "param1": value1,
                        "param2": value2,
                        ...
                    }
                }
                
        Returns:
            Dict[str, Any]: Response data
        """
        try:
            # Validate request format
            if not isinstance(request_data, dict):
                return {
                    "status": "error",
                    "message": "Invalid request format"
                }
            
            action = request_data.get('action')
            parameters = request_data.get('parameters', {})
            
            if not action:
                return {
                    "status": "error",
                    "message": "Missing required field: action"
                }
            
            # Check if action exists
            if action not in self.actions:
                return {
                    "status": "error",
                    "message": f"Unknown action: {action}",
                    "available_actions": list(self.actions.keys())
                }
            
            # Execute the action
            action_handler = self.actions[action]
            response = action_handler(parameters)
            
            return response
            
        except Exception as e:
            logger.error(f"Error handling agent protocol request: {str(e)}")
            return {
                "status": "error",
                "message": f"Error processing request: {str(e)}"
            }
    
    def summarize_property(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """
        Summarize property details
        
        Args:
            parameters (Dict[str, Any]): Parameters containing property data
                
        Returns:
            Dict[str, Any]: Summary results
        """
        try:
            if 'property_data' not in parameters:
                return {
                    "status": "error",
                    "message": "Missing required parameter: property_data"
                }
            
            property_data = parameters['property_data']
            
            # Generate property summary
            result = self.summarizer.summarize_property_details(property_data)
            
            # Add categories if requested
            if parameters.get('include_categories', True):
                result = self.summarizer.categorize_property(result)
            
            return {
                "status": "success",
                "result": result
            }
            
        except Exception as e:
            logger.error(f"Error in summarize_property: {str(e)}")
            return {
                "status": "error",
                "message": f"Error summarizing property: {str(e)}"
            }
    
    def analyze_market(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze market trends
        
        Args:
            parameters (Dict[str, Any]): Parameters including location
                
        Returns:
            Dict[str, Any]: Market analysis
        """
        try:
            location = parameters.get('location')
            days_back = parameters.get('days_back', 90)
            limit = parameters.get('limit', 100)
            
            analysis = self.market_analyzer.analyze_price_trends(location, days_back, limit)
            
            return {
                "status": "success",
                "result": analysis
            }
            
        except Exception as e:
            logger.error(f"Error in analyze_market: {str(e)}")
            return {
                "status": "error",
                "message": f"Error analyzing market: {str(e)}"
            }
    
    def analyze_investment(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze property as investment
        
        Args:
            parameters (Dict[str, Any]): Parameters including property data
                
        Returns:
            Dict[str, Any]: Investment analysis
        """
        try:
            if 'property_data' not in parameters:
                return {
                    "status": "error",
                    "message": "Missing required parameter: property_data"
                }
            
            property_data = parameters['property_data']
            
            analysis = self.market_analyzer.analyze_property_investment(property_data)
            
            return {
                "status": "success",
                "result": analysis
            }
            
        except Exception as e:
            logger.error(f"Error in analyze_investment: {str(e)}")
            return {
                "status": "error",
                "message": f"Error analyzing investment: {str(e)}"
            }
    
    def get_recommendations(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """
        Get property recommendations
        
        Args:
            parameters (Dict[str, Any]): Parameters including preferences or query
                
        Returns:
            Dict[str, Any]: Recommendations
        """
        try:
            # Check if natural language query or structured preferences
            if 'query' in parameters:
                # Parse natural language query into preferences
                query = parameters['query']
                preferences = self.recommender.parse_natural_language_preferences(query)
            elif 'preferences' in parameters:
                # Use structured preferences directly
                preferences = parameters['preferences']
            else:
                return {
                    "status": "error",
                    "message": "Missing required parameter: query or preferences"
                }
            
            limit = parameters.get('limit', 5)
            
            recommendations = self.recommender.get_recommendations(preferences, limit)
            
            return {
                "status": "success",
                "preferences": preferences,
                "result": recommendations
            }
            
        except Exception as e:
            logger.error(f"Error in get_recommendations: {str(e)}")
            return {
                "status": "error",
                "message": f"Error getting recommendations: {str(e)}"
            }
    
    def search_properties(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """
        Search for properties
        
        Args:
            parameters (Dict[str, Any]): Parameters including query
                
        Returns:
            Dict[str, Any]: Search results
        """
        try:
            if 'query' not in parameters:
                return {
                    "status": "error",
                    "message": "Missing required parameter: query"
                }
            
            query = parameters['query']
            limit = parameters.get('limit', 10)
            
            results = self.nl_search.search(query, limit)
            
            return {
                "status": "success",
                "result": results
            }
            
        except Exception as e:
            logger.error(f"Error in search_properties: {str(e)}")
            return {
                "status": "error",
                "message": f"Error searching properties: {str(e)}"
            }
    
    def answer_property_question(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """
        Answer a question about a property
        
        Args:
            parameters (Dict[str, Any]): Parameters including property_id and question
                
        Returns:
            Dict[str, Any]: Answer
        """
        try:
            if 'property_id' not in parameters or 'question' not in parameters:
                return {
                    "status": "error",
                    "message": "Missing required parameters: property_id and/or question"
                }
            
            property_id = parameters['property_id']
            question = parameters['question']
            
            answer = self.nl_search.answer_property_question(property_id, question)
            
            return {
                "status": "success",
                "result": answer
            }
            
        except Exception as e:
            logger.error(f"Error in answer_property_question: {str(e)}")
            return {
                "status": "error",
                "message": f"Error answering question: {str(e)}"
            }

# Create a singleton instance
agent_protocol = AgentProtocol()