import logging
import json
import re
from typing import Dict, Any, List, Optional, Union

from ai.models.model_factory import model_factory
from ai.rag.property_retriever import PropertyRetriever

logger = logging.getLogger(__name__)

class NaturalLanguageSearchAgent:
    """
    Agent for searching properties using natural language queries
    """
    
    def __init__(self, model_provider: Optional[str] = None):
        """
        Initialize the natural language search agent
        
        Args:
            model_provider (str, optional): The model provider to use ("openai" or "anthropic")
        """
        self.model_provider = model_provider
        self.retriever = PropertyRetriever()
    
    def search(self, query: str, limit: int = 10) -> Dict[str, Any]:
        """
        Search for properties using natural language
        
        Args:
            query (str): Natural language search query
            limit (int): Maximum number of results to return
            
        Returns:
            Dict[str, Any]: Search results with properties and explanation
        """
        try:
            # First, parse the query to extract search parameters
            search_params = self._extract_search_parameters(query)
            
            if not search_params:
                logger.warning(f"Could not extract search parameters from query: {query}")
                # Fallback to direct search
                results = self.retriever.natural_language_search(query, limit)
                
                return {
                    "status": "limited_understanding",
                    "query": query,
                    "extracted_params": {},
                    "results": results,
                    "result_count": len(results)
                }
            
            # Use extracted parameters to search for properties
            filters = {}
            
            if 'location' in search_params:
                filters['address'] = search_params['location']
                
            if 'min_price' in search_params:
                filters['min_price'] = search_params['min_price']
                
            if 'max_price' in search_params:
                filters['max_price'] = search_params['max_price']
                
            if 'property_type' in search_params:
                filters['property_type'] = search_params['property_type']
                
            # Retrieve matching properties
            results = self.retriever.retrieve_with_filter(filters, limit)
            
            # Generate explanation of results
            explanation = self._generate_search_explanation(query, search_params, results)
            
            return {
                "status": "success",
                "query": query,
                "extracted_params": search_params,
                "results": results,
                "result_count": len(results),
                "explanation": explanation
            }
            
        except Exception as e:
            logger.error(f"Error in natural language search: {str(e)}")
            return {
                "status": "error",
                "message": f"Error searching properties: {str(e)}",
                "query": query,
                "results": []
            }
    
    def _extract_search_parameters(self, query: str) -> Dict[str, Any]:
        """
        Extract search parameters from natural language query
        
        Args:
            query (str): Natural language query
            
        Returns:
            Dict[str, Any]: Extracted search parameters
        """
        try:
            prompt = f"""
            Extract structured search parameters from the following real estate search query:
            
            "{query}"
            
            Extract as many details as possible, including:
            - Location (city, neighborhood, zip code, etc.)
            - Price range (minimum and maximum)
            - Property type (house, condo, apartment, etc.)
            - Number of bedrooms and bathrooms
            - Other features or amenities mentioned
            
            Format your response as JSON with the following structure:
            {{
                "location": "extracted location",
                "min_price": minimum price as number (no $ or commas),
                "max_price": maximum price as number (no $ or commas),
                "property_type": "type of property",
                "min_bedrooms": minimum number of bedrooms,
                "min_bathrooms": minimum number of bathrooms,
                "features": ["feature1", "feature2", "feature3"]
            }}
            
            Only include fields that were mentioned or can be reasonably inferred.
            """
            
            # Get structured response
            try:
                response = model_factory.get_client(self.model_provider).generate_structured_completion(
                    system_prompt="You are a real estate search expert. Extract search parameters from natural language queries. Respond only with a valid JSON object.",
                    user_prompt=prompt,
                    response_format={"type": "json_object"}
                )
                
                # Check if response is already parsed JSON
                params = response if isinstance(response, dict) else {}
                
                logger.info(f"Extracted {len(params)} search parameters from query: {query}")
                return params
                
            except Exception as parsing_error:
                logger.warning(f"Error parsing search parameters: {str(parsing_error)}")
                
                # Fallback to basic parameter extraction
                params = {}
                
                # Extract location
                location_match = re.search(r'in\s+([A-Za-z0-9\s,]+)', query)
                if location_match:
                    params['location'] = location_match.group(1).strip()
                
                # Extract max price
                max_price_match = re.search(r'(?:under|less than|below|max|maximum)\s+\$?(\d[\d,]*)', query, re.IGNORECASE)
                if max_price_match:
                    params['max_price'] = float(max_price_match.group(1).replace(',', ''))
                
                # Extract min price
                min_price_match = re.search(r'(?:over|more than|above|min|minimum)\s+\$?(\d[\d,]*)', query, re.IGNORECASE)
                if min_price_match:
                    params['min_price'] = float(min_price_match.group(1).replace(',', ''))
                
                # Extract bedrooms
                bedroom_match = re.search(r'(\d+)\s*(?:bed|bedroom|br)', query, re.IGNORECASE)
                if bedroom_match:
                    params['min_bedrooms'] = int(bedroom_match.group(1))
                
                # Extract bathrooms
                bathroom_match = re.search(r'(\d+)\s*(?:bath|bathroom|ba)', query, re.IGNORECASE)
                if bathroom_match:
                    params['min_bathrooms'] = int(bathroom_match.group(1))
                
                return params
                
        except Exception as e:
            logger.error(f"Error extracting search parameters: {str(e)}")
            return {}
    
    def _generate_search_explanation(self, query: str, params: Dict[str, Any], 
                                   results: List[Dict[str, Any]]) -> str:
        """
        Generate explanation for search results
        
        Args:
            query (str): Original search query
            params (Dict[str, Any]): Extracted search parameters
            results (List[Dict[str, Any]]): Search results
            
        Returns:
            str: Generated explanation
        """
        try:
            if not results:
                return "No properties matched your search criteria."
            
            # Format parameters for prompt
            params_text = "\n".join([f"- {k}: {v}" for k, v in params.items()])
            
            # Format results summary
            result_summary = f"Found {len(results)} properties"
            if params.get('location'):
                result_summary += f" in {params['location']}"
            if params.get('min_price') and params.get('max_price'):
                result_summary += f" priced between ${params['min_price']:,.0f} and ${params['max_price']:,.0f}"
            elif params.get('max_price'):
                result_summary += f" priced under ${params['max_price']:,.0f}"
            elif params.get('min_price'):
                result_summary += f" priced over ${params['min_price']:,.0f}"
            
            prompt = f"""
            Explain the following real estate search results in natural language:
            
            Original Query: "{query}"
            
            Extracted Search Parameters:
            {params_text}
            
            Result Summary: {result_summary}
            
            Provide a concise explanation of how these results relate to the search query.
            Mention any notable trends or patterns in the results.
            If the results don't seem to match the query well, suggest refinements.
            Keep the explanation under 150 words.
            """
            
            explanation = model_factory.generate_completion(
                prompt=prompt,
                provider=self.model_provider,
                max_tokens=250
            )
            
            return explanation.strip()
            
        except Exception as e:
            logger.error(f"Error generating search explanation: {str(e)}")
            return f"Found {len(results)} properties matching your search criteria."
    
    def answer_property_question(self, property_id: str, question: str) -> Dict[str, Any]:
        """
        Answer a question about a specific property using RAG
        
        Args:
            property_id (str): ID of the property
            question (str): Question about the property
            
        Returns:
            Dict[str, Any]: Answer with explanation
        """
        try:
            # Placeholder implementation - would retrieve property by ID in real implementation
            # For now, just use the retriever to get latest properties
            properties = self.retriever.retrieve_latest(10)
            property_data = next((p for p in properties if str(p.get('id')) == str(property_id)), None)
            
            if not property_data:
                return {
                    "status": "not_found",
                    "message": f"Property with ID {property_id} not found",
                    "question": question,
                    "answer": None
                }
            
            # Format property details for the prompt
            address = property_data.get('address', 'Unknown')
            price = property_data.get('price', 'N/A')
            bedrooms = property_data.get('bedrooms', 'N/A')
            bathrooms = property_data.get('bathrooms', 'N/A')
            sqft = property_data.get('square_feet', 'N/A')
            description = property_data.get('description', '')
            
            prompt = f"""
            Answer the following question about this property:
            
            Property Details:
            - Address: {address}
            - Price: ${price}
            - Bedrooms: {bedrooms}
            - Bathrooms: {bathrooms}
            - Square Feet: {sqft}
            - Description: {description}
            
            Question: {question}
            
            Provide a detailed, helpful answer based only on the information provided.
            If the answer cannot be determined from the information available, say so clearly.
            """
            
            answer = model_factory.generate_completion(
                prompt=prompt,
                provider=self.model_provider,
                max_tokens=350
            )
            
            return {
                "status": "success",
                "property_id": property_id,
                "question": question,
                "answer": answer.strip(),
                "property_data": property_data
            }
            
        except Exception as e:
            logger.error(f"Error answering property question: {str(e)}")
            return {
                "status": "error",
                "message": f"Error answering question: {str(e)}",
                "question": question,
                "answer": None
            }