import os
import json
import logging
import threading
import time
from typing import Dict, Any, List, Optional, Callable, Union

from ai.models.model_factory import model_factory
from ai.agent_protocol import agent_protocol

logger = logging.getLogger(__name__)

class ModelContentProtocolServer:
    """
    Server implementation for the model content protocol
    Handles streaming content generation and agent interactions
    """
    
    def __init__(self):
        """Initialize the model content protocol server"""
        self.model_factory = model_factory
        self.agent_protocol = agent_protocol
        
        # Map request IDs to their handlers
        self.active_requests = {}
        
        # Map content IDs to their data
        self.content_store = {}
        
        # Lock for thread safety
        self.lock = threading.Lock()
    
    def start_content_generation(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Start a new content generation request
        
        Args:
            request_data (Dict[str, Any]): Request data including prompt and model
            
        Returns:
            Dict[str, Any]: Response with request ID
        """
        try:
            # Validate request
            if not isinstance(request_data, dict):
                return {
                    "status": "error",
                    "message": "Invalid request format"
                }
            
            prompt = request_data.get('prompt')
            model_provider = request_data.get('model', 'openai')
            max_tokens = request_data.get('max_tokens', 500)
            request_id = request_data.get('request_id', str(time.time()))
            
            if not prompt:
                return {
                    "status": "error",
                    "message": "Missing required field: prompt"
                }
            
            # Start content generation in background thread
            def generate_content():
                try:
                    # Generate content
                    content = model_factory.generate_completion(
                        prompt=prompt,
                        provider=model_provider,
                        max_tokens=max_tokens
                    )
                    
                    # Store result
                    with self.lock:
                        content_id = f"content_{time.time()}"
                        self.content_store[content_id] = {
                            "content": content,
                            "request_id": request_id,
                            "completed": True,
                            "timestamp": time.time()
                        }
                        
                        # Update request status
                        if request_id in self.active_requests:
                            self.active_requests[request_id]["status"] = "completed"
                            self.active_requests[request_id]["content_id"] = content_id
                    
                    logger.info(f"Content generation completed for request {request_id}")
                    
                except Exception as e:
                    logger.error(f"Error generating content for request {request_id}: {str(e)}")
                    
                    with self.lock:
                        if request_id in self.active_requests:
                            self.active_requests[request_id]["status"] = "error"
                            self.active_requests[request_id]["error"] = str(e)
            
            # Store request info
            with self.lock:
                self.active_requests[request_id] = {
                    "status": "in_progress",
                    "timestamp": time.time(),
                    "request_data": request_data
                }
            
            # Start generation thread
            thread = threading.Thread(target=generate_content)
            thread.start()
            
            return {
                "status": "accepted",
                "request_id": request_id,
                "message": "Content generation started"
            }
            
        except Exception as e:
            logger.error(f"Error starting content generation: {str(e)}")
            return {
                "status": "error",
                "message": f"Error starting content generation: {str(e)}"
            }
    
    def check_request_status(self, request_id: str) -> Dict[str, Any]:
        """
        Check the status of a content generation request
        
        Args:
            request_id (str): The ID of the request to check
            
        Returns:
            Dict[str, Any]: Status information
        """
        with self.lock:
            if request_id not in self.active_requests:
                return {
                    "status": "not_found",
                    "message": f"Request {request_id} not found"
                }
            
            request_info = self.active_requests[request_id]
            
            response = {
                "request_id": request_id,
                "status": request_info["status"],
                "timestamp": request_info["timestamp"]
            }
            
            if "error" in request_info:
                response["error"] = request_info["error"]
                
            if "content_id" in request_info:
                response["content_id"] = request_info["content_id"]
            
            return response
    
    def get_content(self, content_id: str) -> Dict[str, Any]:
        """
        Get generated content by ID
        
        Args:
            content_id (str): The ID of the content to retrieve
            
        Returns:
            Dict[str, Any]: Content data
        """
        with self.lock:
            if content_id not in self.content_store:
                return {
                    "status": "not_found",
                    "message": f"Content {content_id} not found"
                }
            
            content_info = self.content_store[content_id]
            
            return {
                "status": "success",
                "content_id": content_id,
                "content": content_info["content"],
                "timestamp": content_info["timestamp"]
            }
    
    def execute_agent_action(self, action_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute an action using the agent protocol
        
        Args:
            action_data (Dict[str, Any]): Action data with action name and parameters
            
        Returns:
            Dict[str, Any]: Result of the action
        """
        try:
            # Validate action data
            if not isinstance(action_data, dict) or 'action' not in action_data:
                return {
                    "status": "error",
                    "message": "Invalid action data. Must include 'action' field."
                }
            
            # Process the action through agent protocol
            response = self.agent_protocol.handle_request(action_data)
            
            return response
            
        except Exception as e:
            logger.error(f"Error executing agent action: {str(e)}")
            return {
                "status": "error",
                "message": f"Error executing agent action: {str(e)}"
            }
    
    def cleanup_old_requests(self, max_age_hours: int = 24):
        """
        Clean up old requests and content to prevent memory leaks
        
        Args:
            max_age_hours (int): Maximum age in hours before cleanup
        """
        try:
            current_time = time.time()
            max_age_seconds = max_age_hours * 3600
            
            with self.lock:
                # Clean up old requests
                request_ids_to_remove = []
                for request_id, request_info in self.active_requests.items():
                    if current_time - request_info["timestamp"] > max_age_seconds:
                        request_ids_to_remove.append(request_id)
                
                for request_id in request_ids_to_remove:
                    del self.active_requests[request_id]
                
                # Clean up old content
                content_ids_to_remove = []
                for content_id, content_info in self.content_store.items():
                    if current_time - content_info["timestamp"] > max_age_seconds:
                        content_ids_to_remove.append(content_id)
                
                for content_id in content_ids_to_remove:
                    del self.content_store[content_id]
                
                logger.info(f"Cleaned up {len(request_ids_to_remove)} old requests and {len(content_ids_to_remove)} old content items")
                
        except Exception as e:
            logger.error(f"Error cleaning up old requests: {str(e)}")

# Create a singleton instance
model_content_server = ModelContentProtocolServer()