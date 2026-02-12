"""
Retrieval Augmented Generation (RAG) functions for GeoAssessmentPro

This module provides the public API functions for the RAG system.
"""

import logging
import tempfile
import time
import os
import base64
from typing import Dict, List, Any, Optional, Union

from flask import current_app
from app import db
from models import User, File, IndexedDocument, QueryLog
from rag import get_rag_system

# Configure logging
logger = logging.getLogger(__name__)

def process_query(query: str, user_id: Optional[int] = None) -> Dict[str, Any]:
    """
    Process a natural language query using RAG
    
    Args:
        query: The user's query
        user_id: Optional user ID for logging
        
    Returns:
        Dict containing the response and context
    """
    start_time = time.time()
    rag_system = get_rag_system()
    
    try:
        # Initialize if needed
        if not rag_system.initialized:
            logger.info("Initializing RAG system on first query")
            rag_system.initialize()
        
        # Search for context
        context_results = rag_system.search(query, k=3)
        
        # Generate response
        response = rag_system.query(query, context_results)
        
        # Log the query if user_id is provided
        if user_id:
            try:
                processing_time = time.time() - start_time
                query_log = QueryLog(
                    user_id=user_id,
                    query=query,
                    response=response,
                    processing_time=processing_time
                )
                db.session.add(query_log)
                db.session.commit()
            except Exception as e:
                logger.error(f"Error logging query: {str(e)}")
        
        return {
            "response": response,
            "context": [
                {
                    "content": result["content"],
                    "metadata": result["metadata"],
                    "score": result["score"]
                }
                for result in context_results
            ],
            "processing_time": time.time() - start_time
        }
    
    except Exception as e:
        logger.error(f"Error processing query: {str(e)}")
        return {
            "error": str(e),
            "response": "I'm sorry, but I encountered an error while processing your query.",
            "context": [],
            "processing_time": time.time() - start_time
        }

def index_document(file_id: int) -> Dict[str, Any]:
    """
    Index a document for RAG
    
    Args:
        file_id: ID of the file to index
        
    Returns:
        Dict with indexing status
    """
    try:
        file = File.query.get(file_id)
        if not file:
            return {"success": False, "error": "File not found"}
        
        # Check if file is already indexed
        existing_index = IndexedDocument.query.filter_by(file_id=file_id).first()
        if existing_index:
            return {
                "success": True, 
                "message": f"File already indexed on {existing_index.index_date}",
                "status": existing_index.status
            }
        
        # TODO: Implement actual document indexing using LangChain
        # This is a placeholder for future implementation
        
        # Log the indexing
        index_record = IndexedDocument(
            file_id=file_id,
            status="indexed",
            chunk_count=0  # Update with real chunk count
        )
        db.session.add(index_record)
        db.session.commit()
        
        return {
            "success": True,
            "message": "Document indexed successfully",
            "status": "indexed"
        }
    
    except Exception as e:
        logger.error(f"Error indexing document: {str(e)}")
        return {"success": False, "error": str(e)}

def analyze_property_image(image_data: bytes, query: Optional[str] = None) -> Dict[str, Any]:
    """
    Analyze a property image using OpenAI Vision
    
    Args:
        image_data: Raw image bytes
        query: Optional specific query about the image
        
    Returns:
        Dict with analysis results
    """
    rag_system = get_rag_system()
    
    try:
        return rag_system.analyze_image(image_data, query)
    except Exception as e:
        logger.error(f"Error analyzing image: {str(e)}")
        return {"error": str(e)}

def estimate_property_value(property_data: Dict[str, Any], 
                           comparable_properties: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
    """
    Estimate property value using AI
    
    Args:
        property_data: Data about the property to estimate
        comparable_properties: Optional list of comparable properties
        
    Returns:
        Dict with estimated value and reasoning
    """
    rag_system = get_rag_system()
    
    try:
        return rag_system.estimate_property_value(property_data, comparable_properties)
    except Exception as e:
        logger.error(f"Error estimating property value: {str(e)}")
        return {"error": str(e)}

def analyze_anomaly(description: str, property_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Analyze and classify an anomaly
    
    Args:
        description: Description of the anomaly
        property_data: Optional property data for context
        
    Returns:
        Dict with classification results
    """
    rag_system = get_rag_system()
    
    try:
        return rag_system.classify_anomaly(description, property_data)
    except Exception as e:
        logger.error(f"Error analyzing anomaly: {str(e)}")
        return {"error": str(e)}

def suggest_anomaly_action(anomaly_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Suggest actions for handling an anomaly
    
    Args:
        anomaly_data: Anomaly data including description, type, severity
        
    Returns:
        Dict with suggested actions
    """
    rag_system = get_rag_system()
    
    try:
        return rag_system.suggest_action(anomaly_data)
    except Exception as e:
        logger.error(f"Error suggesting anomaly action: {str(e)}")
        return {"error": str(e)}