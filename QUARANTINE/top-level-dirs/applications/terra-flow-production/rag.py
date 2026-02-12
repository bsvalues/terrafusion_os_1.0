"""
Retrieval Augmented Generation (RAG) module for GeoAssessmentPro

This module provides AI-powered data retrieval and generation capabilities
using OpenAI's models and semantic search with FAISS.
"""

import os
import json
import logging
import tempfile
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime

# Import OpenAI for LLM integration
from openai import OpenAI
import faiss
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings.openai import OpenAIEmbeddings

from app import db
from models import Property, Assessment, Anomaly, AnomalyType

# Configure logging
logger = logging.getLogger(__name__)

# Initialize OpenAI client
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    logger.warning("OpenAI API key not found in environment variables")
openai_client = OpenAI(api_key=OPENAI_API_KEY)

# Default embedding model
DEFAULT_EMBEDDING_MODEL = "text-embedding-3-small"

# Default chat model 
# Note: the newest OpenAI model is "gpt-4o" which was released May 13, 2024.
# do not change this unless explicitly requested by the user
DEFAULT_CHAT_MODEL = "gpt-4o"


class RAGSystem:
    """
    Retrieval Augmented Generation system for GeoAssessmentPro.
    Provides semantic search and generation capabilities.
    """
    
    def __init__(self):
        """Initialize the RAG system"""
        self.embeddings = OpenAIEmbeddings(openai_api_key=OPENAI_API_KEY, model=DEFAULT_EMBEDDING_MODEL)
        self.index = None
        self.documents = []
        self.document_lookup = {}
        self.initialized = False
        self.last_updated = None
    
    def initialize(self, force_rebuild: bool = False) -> bool:
        """
        Initialize or rebuild the vector index
        
        Args:
            force_rebuild: Force rebuild the index even if already initialized
            
        Returns:
            bool: Whether initialization was successful
        """
        if self.initialized and not force_rebuild:
            logger.info("RAG system already initialized")
            return True
        
        try:
            # Load property data
            self._load_property_data()
            
            # Load anomaly data
            self._load_anomaly_data()
            
            # Create the index
            self._create_index()
            
            self.initialized = True
            self.last_updated = datetime.now()
            logger.info(f"RAG system initialized with {len(self.documents)} documents")
            return True
        except Exception as e:
            logger.error(f"Error initializing RAG system: {str(e)}")
            return False
    
    def _load_property_data(self) -> None:
        """Load property data into documents"""
        properties = Property.query.all()
        logger.info(f"Loading {len(properties)} properties into RAG system")
        
        for prop in properties:
            # Get latest assessment
            latest_assessment = Assessment.query.filter(
                Assessment.property_id == prop.id
            ).order_by(
                Assessment.assessment_date.desc()
            ).first()
            
            # Create document for property
            doc_id = f"property-{prop.id}"
            content = f"""
            Property ID: {prop.id}
            Parcel ID: {prop.parcel_id}
            Address: {prop.address}
            Property Type: {prop.property_type}
            Owner: {prop.owner_name}
            """
            
            if latest_assessment:
                content += f"""
                Latest Assessment Value: ${latest_assessment.assessed_value:,.2f}
                Assessment Date: {latest_assessment.assessment_date.strftime('%Y-%m-%d')}
                """
            
            metadata = {
                "id": prop.id,
                "parcel_id": prop.parcel_id,
                "address": prop.address,
                "type": prop.property_type,
                "owner": prop.owner_name,
                "doc_type": "property"
            }
            
            self.documents.append(content)
            self.document_lookup[len(self.documents) - 1] = metadata
    
    def _load_anomaly_data(self) -> None:
        """Load anomaly data into documents"""
        anomalies = Anomaly.query.all()
        logger.info(f"Loading {len(anomalies)} anomalies into RAG system")
        
        for anomaly in anomalies:
            # Get anomaly type
            anomaly_type = AnomalyType.query.get(anomaly.type_id) if anomaly.type_id else None
            anomaly_type_name = anomaly_type.name if anomaly_type else "Unknown"
            
            # Get property info if applicable
            property_info = ""
            if anomaly.property_id:
                prop = Property.query.get(anomaly.property_id)
                if prop:
                    property_info = f"""
                    Property ID: {prop.id}
                    Parcel ID: {prop.parcel_id}
                    Address: {prop.address}
                    Property Type: {prop.property_type}
                    """
            
            # Create document for anomaly
            doc_id = f"anomaly-{anomaly.id}"
            content = f"""
            Anomaly ID: {anomaly.id}
            Description: {anomaly.description}
            Type: {anomaly_type_name}
            Severity: {anomaly.severity}
            Status: {anomaly.status}
            Detected: {anomaly.detected_at.strftime('%Y-%m-%d %H:%M')}
            {property_info}
            """
            
            metadata = {
                "id": anomaly.id,
                "description": anomaly.description,
                "type": anomaly_type_name,
                "severity": anomaly.severity,
                "status": anomaly.status,
                "property_id": anomaly.property_id,
                "doc_type": "anomaly"
            }
            
            self.documents.append(content)
            self.document_lookup[len(self.documents) - 1] = metadata
    
    def _create_index(self) -> None:
        """Create FAISS index from documents"""
        if not self.documents:
            logger.warning("No documents to index")
            return
        
        # Get embeddings for documents
        embeddings = self._get_embeddings(self.documents)
        
        # Create FAISS index
        dimension = embeddings.shape[1]
        self.index = faiss.IndexFlatL2(dimension)
        self.index.add(embeddings)
        
        logger.info(f"Created FAISS index with {len(self.documents)} documents and dimension {dimension}")
    
    def _get_embeddings(self, texts: List[str]) -> np.ndarray:
        """
        Get embeddings for a list of texts
        
        Args:
            texts: List of text strings to embed
            
        Returns:
            numpy.ndarray: Matrix of embeddings
        """
        embeddings = []
        batch_size = 32  # Adjust based on rate limits
        
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i+batch_size]
            batch_embeddings = self.embeddings.embed_documents(batch)
            embeddings.extend(batch_embeddings)
        
        return np.array(embeddings).astype('float32')
    
    def search(self, query: str, k: int = 5, filter_type: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Search for similar documents
        
        Args:
            query: Query string
            k: Number of results to return
            filter_type: Filter by document type (property, anomaly)
            
        Returns:
            List of search results with metadata
        """
        if not self.initialized:
            logger.warning("RAG system not initialized")
            self.initialize()
        
        # Get query embedding
        query_embedding = self.embeddings.embed_query(query)
        query_embedding = np.array([query_embedding]).astype('float32')
        
        # Search index
        distances, indices = self.index.search(query_embedding, k * 2 if filter_type else k)
        
        # Format results
        results = []
        for i, idx in enumerate(indices[0]):
            if idx < 0 or idx >= len(self.documents):
                continue
            
            metadata = self.document_lookup[idx]
            
            # Apply filter if specified
            if filter_type and metadata.get("doc_type") != filter_type:
                continue
            
            result = {
                "content": self.documents[idx],
                "metadata": metadata,
                "score": float(distances[0][i])
            }
            results.append(result)
            
            # Break if we have enough results after filtering
            if len(results) >= k:
                break
        
        return results
    
    def query(self, user_query: str, context_results: Optional[List[Dict[str, Any]]] = None) -> str:
        """
        Generate a response to a user query with context from the search
        
        Args:
            user_query: User's query
            context_results: Optional pre-fetched search results for context
            
        Returns:
            Generated response
        """
        if not self.initialized:
            logger.warning("RAG system not initialized")
            self.initialize()
        
        # Get context if not provided
        if context_results is None:
            context_results = self.search(user_query, k=3)
        
        # Prepare context text
        context = "\n\n".join([result["content"] for result in context_results])
        
        # Prepare system message with context
        system_message = f"""
        You are GeoAssessmentPro AI, a helpful assistant for the Benton County Assessor's Office. 
        Answer user questions about properties, assessments, and anomalies based on the following context:
        
        {context}
        
        If you cannot answer based on the context, say so rather than making up information.
        """
        
        try:
            # Call OpenAI API
            response = openai_client.chat.completions.create(
                model=DEFAULT_CHAT_MODEL,
                messages=[
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": user_query}
                ],
                temperature=0.3,
                max_tokens=500
            )
            
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"Error generating response: {str(e)}")
            return f"I'm sorry, but I couldn't generate a response due to an error: {str(e)}"
    
    def analyze_image(self, image_data: bytes, user_query: Optional[str] = None) -> Dict[str, Any]:
        """
        Analyze an image using the OpenAI Vision API
        
        Args:
            image_data: Image data in bytes
            user_query: Optional user query about the image
            
        Returns:
            Dictionary with analysis results
        """
        if not OPENAI_API_KEY:
            return {"error": "OpenAI API key not configured"}
        
        # Save image to a temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as temp_file:
            temp_file.write(image_data)
            temp_file_path = temp_file.name
        
        try:
            # Encode the image as base64
            import base64
            base64_image = base64.b64encode(image_data).decode('utf-8')
            
            # Default prompt if no query provided
            prompt = user_query or "Analyze this property image in detail. Describe the type of property, its condition, and any notable features or anomalies visible."
            
            # Call OpenAI API with vision capabilities
            response = openai_client.chat.completions.create(
                model=DEFAULT_CHAT_MODEL,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{base64_image}"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=800
            )
            
            # Clean up temp file
            os.unlink(temp_file_path)
            
            return {
                "analysis": response.choices[0].message.content,
                "model": response.model,
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens
            }
        
        except Exception as e:
            # Clean up temp file in case of error
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
            
            logger.error(f"Error analyzing image: {str(e)}")
            return {"error": str(e)}
    
    def classify_anomaly(self, description: str, property_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Classify an anomaly description
        
        Args:
            description: Description of the anomaly
            property_data: Optional property data for context
            
        Returns:
            Dictionary with classification results
        """
        if not OPENAI_API_KEY:
            return {"error": "OpenAI API key not configured"}
        
        # Prepare context with property data if available
        property_context = ""
        if property_data:
            property_context = f"""
            Property Information:
            ID: {property_data.get('id', 'Unknown')}
            Address: {property_data.get('address', 'Unknown')}
            Type: {property_data.get('property_type', 'Unknown')}
            Owner: {property_data.get('owner_name', 'Unknown')}
            """
        
        # Prepare system message
        system_message = f"""
        You are an expert anomaly detection system for property assessments.
        Classify the anomaly described based on the following types:
        - Spatial: Issues with property boundaries, location, or geographical features
        - Valuation: Unexpected changes in property value or assessment
        - Data: Inconsistencies or errors in property data
        - Temporal: Time-related anomalies or historical discrepancies
        - Ownership: Issues related to property ownership records
        
        Assess the severity (high, medium, low) based on potential impact.
        
        {property_context}
        
        Respond with a JSON object containing:
        1. type: The anomaly type
        2. severity: The severity level
        3. confidence: Your confidence in the classification (0-1)
        4. explanation: Brief explanation of your classification
        """
        
        try:
            # Call OpenAI API
            response = openai_client.chat.completions.create(
                model=DEFAULT_CHAT_MODEL,
                messages=[
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": description}
                ],
                response_format={"type": "json_object"},
                temperature=0.3
            )
            
            # Parse the JSON response
            result = json.loads(response.choices[0].message.content)
            
            # Add raw description to result
            result["description"] = description
            
            return result
        
        except Exception as e:
            logger.error(f"Error classifying anomaly: {str(e)}")
            return {"error": str(e)}
    
    def suggest_action(self, anomaly_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Suggest actions for handling an anomaly
        
        Args:
            anomaly_data: Anomaly data including description, type, severity
            
        Returns:
            Dictionary with suggested actions
        """
        if not OPENAI_API_KEY:
            return {"error": "OpenAI API key not configured"}
        
        # Prepare system message
        system_message = f"""
        You are an expert property assessment advisor.
        Suggest actions to address the anomaly described.
        
        Anomaly Information:
        Description: {anomaly_data.get('description', 'Unknown')}
        Type: {anomaly_data.get('type', 'Unknown')}
        Severity: {anomaly_data.get('severity', 'Unknown')}
        
        Respond with a JSON object containing:
        1. immediate_actions: List of immediate actions to take
        2. long_term_actions: List of long-term actions to consider
        3. stakeholders: List of stakeholders who should be notified or involved
        4. priority: Suggested priority level (high, medium, low)
        """
        
        try:
            # Call OpenAI API
            response = openai_client.chat.completions.create(
                model=DEFAULT_CHAT_MODEL,
                messages=[
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": "Please suggest actions for handling this anomaly."}
                ],
                response_format={"type": "json_object"},
                temperature=0.3
            )
            
            # Parse the JSON response
            result = json.loads(response.choices[0].message.content)
            
            return result
        
        except Exception as e:
            logger.error(f"Error suggesting actions: {str(e)}")
            return {"error": str(e)}
    
    def estimate_property_value(self, property_data: Dict[str, Any], 
                              comparable_properties: List[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Estimate property value based on provided data and comparables
        
        Args:
            property_data: Data about the property to estimate
            comparable_properties: List of comparable properties with known values
            
        Returns:
            Dictionary with estimated value and reasoning
        """
        if not OPENAI_API_KEY:
            return {"error": "OpenAI API key not configured"}
        
        # Prepare property data
        property_info = f"""
        Property Information:
        Address: {property_data.get('address', 'Unknown')}
        Property Type: {property_data.get('property_type', 'Unknown')}
        Size: {property_data.get('size', 'Unknown')}
        Year Built: {property_data.get('year_built', 'Unknown')}
        Features: {property_data.get('features', 'Unknown')}
        Last Assessment: {property_data.get('last_assessment', 'Unknown')}
        Last Assessment Value: {property_data.get('last_value', 'Unknown')}
        """
        
        # Prepare comparable properties
        comparables_info = ""
        if comparable_properties:
            comparables_info = "Comparable Properties:\n"
            for i, comp in enumerate(comparable_properties, 1):
                comparables_info += f"""
                Comparable {i}:
                Address: {comp.get('address', 'Unknown')}
                Property Type: {comp.get('property_type', 'Unknown')}
                Size: {comp.get('size', 'Unknown')}
                Year Built: {comp.get('year_built', 'Unknown')}
                Recent Value: {comp.get('value', 'Unknown')}
                Assessment Date: {comp.get('assessment_date', 'Unknown')}
                Distance: {comp.get('distance', 'Unknown')} miles
                
                """
        
        # Prepare system message
        system_message = f"""
        You are an expert property assessor with knowledge of the Benton County, WA real estate market.
        Estimate the current market value of the property based on the provided information.
        
        {property_info}
        
        {comparables_info}
        
        Consider factors such as:
        - Location and neighborhood characteristics
        - Property type, size, and features
        - Age and condition
        - Recent comparable sales
        - Market trends
        
        Respond with a JSON object containing:
        1. estimated_value: The estimated value in USD (numeric, no commas or currency symbols)
        2. confidence: Your confidence in the estimate (0-1)
        3. reasoning: Explanation of your valuation approach
        4. factors: List of key factors that influenced your estimate
        """
        
        try:
            # Call OpenAI API
            response = openai_client.chat.completions.create(
                model=DEFAULT_CHAT_MODEL,
                messages=[
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": "Please provide an estimated value for this property."}
                ],
                response_format={"type": "json_object"},
                temperature=0.2
            )
            
            # Parse the JSON response
            result = json.loads(response.choices[0].message.content)
            
            # Ensure estimated_value is numeric
            try:
                result["estimated_value"] = float(result["estimated_value"])
            except (ValueError, KeyError):
                # If conversion fails, keep as is
                pass
            
            return result
        
        except Exception as e:
            logger.error(f"Error estimating property value: {str(e)}")
            return {"error": str(e)}


# Singleton instance
_rag_system = None

def get_rag_system() -> RAGSystem:
    """Get the singleton RAG system instance"""
    global _rag_system
    if _rag_system is None:
        _rag_system = RAGSystem()
    return _rag_system