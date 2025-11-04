"""
Supabase Agent Module

This module provides the SupabaseAgent class which handles Supabase-specific
operations, including database management, storage management, and authentication
integration for the MCP architecture.
"""

import logging
import os
import time
import json
from typing import Dict, List, Any, Optional, Union, Tuple
from datetime import datetime

from mcp.agents.base_agent import BaseAgent
from supabase_client import (
    get_supabase_client,
    release_supabase_client,
    execute_query,
    upload_file_to_storage,
    list_files_in_storage,
    download_file_from_storage,
    delete_file_from_storage
)

# Setup logging
logging.basicConfig(level=logging.INFO,
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

class SupabaseAgent(BaseAgent):
    """
    Agent for managing Supabase integration.
    
    Handles database operations, storage management, and authentication integration
    with Supabase for the GIS data management platform.
    """
    
    def __init__(self, agent_id: Optional[str] = None):
        """Initialize the Supabase agent"""
        super().__init__(agent_id)
        self.status = "initializing"
        
        # Define agent capabilities
        self.capabilities = [
            "supabase.database.query",
            "supabase.database.insert",
            "supabase.database.update",
            "supabase.database.delete",
            "supabase.storage.upload",
            "supabase.storage.download",
            "supabase.storage.list",
            "supabase.storage.delete",
            "supabase.auth.check",
            "supabase.status.check"
        ]
        
        # Bucket configurations
        self.buckets = {
            "documents": {
                "description": "Project documentation and reports",
                "public": False
            },
            "maps": {
                "description": "GIS map exports and shared maps",
                "public": True
            },
            "images": {
                "description": "Images and graphics for the application",
                "public": True
            },
            "exports": {
                "description": "Data exports and backups",
                "public": False
            }
        }
        
        # Cache for query results to reduce duplicate calls
        self.query_cache = {}
        self.cache_ttl = 60  # Cache lifetime in seconds
        
        # Check if Supabase environment is properly configured
        if self._check_supabase_config():
            self.client = get_supabase_client()
            if self.client:
                self.set_status("ready")
            else:
                self.set_status("error_connection")
        else:
            self.set_status("error_config")
    
    def process_task(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process a task assigned to this agent
        
        Args:
            task_data: Dictionary containing task parameters
                - task_type: Type of task to perform
                - parameters: Parameters for the task
                
        Returns:
            Dictionary with task results
        """
        task_type = task_data.get("task_type")
        parameters = task_data.get("parameters", {})
        
        # Check if this agent can handle the task
        if not self.can_process(task_type):
            return {
                "success": False,
                "error": f"Agent does not support task type: {task_type}",
                "supported_tasks": self.capabilities
            }
        
        try:
            # Database operations
            if task_type == "supabase.database.query":
                return self._handle_db_query(parameters)
            elif task_type == "supabase.database.insert":
                return self._handle_db_insert(parameters)
            elif task_type == "supabase.database.update":
                return self._handle_db_update(parameters)
            elif task_type == "supabase.database.delete":
                return self._handle_db_delete(parameters)
            
            # Storage operations
            elif task_type == "supabase.storage.upload":
                return self._handle_storage_upload(parameters)
            elif task_type == "supabase.storage.download":
                return self._handle_storage_download(parameters)
            elif task_type == "supabase.storage.list":
                return self._handle_storage_list(parameters)
            elif task_type == "supabase.storage.delete":
                return self._handle_storage_delete(parameters)
                
            # Authentication operations
            elif task_type == "supabase.auth.check":
                return self._handle_auth_check(parameters)
                
            # Status operations
            elif task_type == "supabase.status.check":
                return self._handle_status_check(parameters)
            
            # Unknown task type (should not happen due to can_process check)
            return {
                "success": False,
                "error": f"Unknown task type: {task_type}"
            }
        
        except Exception as e:
            self.logger.error(f"Error processing task {task_type}: {str(e)}")
            return {
                "success": False,
                "error": f"Task processing error: {str(e)}"
            }
    
    # Database Operations
    
    def _handle_db_query(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle database query task
        
        Args:
            parameters:
                - table: Table to query
                - select: Fields to select
                - filters: Optional query filters
                - order: Optional ordering
                - limit: Optional limit
                - skip_cache: Optional flag to skip cache
                
        Returns:
            Query results
        """
        table = parameters.get("table")
        select = parameters.get("select", "*")
        filters = parameters.get("filters", {})
        order = parameters.get("order")
        limit = parameters.get("limit")
        skip_cache = parameters.get("skip_cache", False)
        
        if not table:
            return {
                "success": False,
                "error": "Missing required parameter: table"
            }
        
        # Check cache first (unless skip_cache is True)
        cache_key = f"{table}:{select}:{json.dumps(filters)}:{order}:{limit}"
        if not skip_cache and cache_key in self.query_cache:
            cache_entry = self.query_cache[cache_key]
            if time.time() - cache_entry["timestamp"] < self.cache_ttl:
                self.logger.info(f"Using cached result for query: {cache_key}")
                return {
                    "success": True,
                    "data": cache_entry["data"],
                    "from_cache": True,
                    "timestamp": cache_entry["timestamp"]
                }
        
        # Execute the query
        try:
            result = execute_query(table, select, filters)
            
            if result is not None:
                # Cache the result
                self.query_cache[cache_key] = {
                    "data": result,
                    "timestamp": time.time()
                }
                
                return {
                    "success": True,
                    "data": result,
                    "count": len(result) if isinstance(result, list) else 1,
                    "from_cache": False
                }
            else:
                return {
                    "success": False,
                    "error": "Query returned no results or failed"
                }
        except Exception as e:
            self.logger.error(f"Database query error: {str(e)}")
            return {
                "success": False,
                "error": f"Database query error: {str(e)}"
            }
    
    def _handle_db_insert(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle database insert task
        
        Args:
            parameters:
                - table: Table to insert into
                - data: Data to insert (single record or list of records)
                
        Returns:
            Insert results
        """
        table = parameters.get("table")
        data = parameters.get("data", {})
        
        if not table:
            return {
                "success": False,
                "error": "Missing required parameter: table"
            }
        
        if not data:
            return {
                "success": False,
                "error": "Missing required parameter: data"
            }
        
        # Get client
        client = None
        try:
            client = get_supabase_client()
            if not client:
                return {
                    "success": False,
                    "error": "Failed to get Supabase client"
                }
            
            response = client.from_(table).insert(data).execute()
            
            if hasattr(response, 'data'):
                return {
                    "success": True,
                    "data": response.data,
                    "count": len(response.data) if isinstance(response.data, list) else 1
                }
            else:
                return {
                    "success": False,
                    "error": "Insert operation did not return expected response format"
                }
        except Exception as e:
            self.logger.error(f"Database insert error: {str(e)}")
            return {
                "success": False,
                "error": f"Database insert error: {str(e)}"
            }
        finally:
            # Release client back to the pool
            if client:
                try:
                    release_supabase_client(client)
                except Exception as release_error:
                    self.logger.error(f"Error releasing Supabase client: {str(release_error)}")
                    # Continue execution even if release fails
    
    def _handle_db_update(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle database update task
        
        Args:
            parameters:
                - table: Table to update
                - data: Update data
                - filters: Update filters
                
        Returns:
            Update results
        """
        table = parameters.get("table")
        data = parameters.get("data", {})
        filters = parameters.get("filters", {})
        
        if not table:
            return {
                "success": False,
                "error": "Missing required parameter: table"
            }
        
        if not data:
            return {
                "success": False,
                "error": "Missing required parameter: data"
            }
        
        # Get client
        client = None
        try:
            client = get_supabase_client()
            if not client:
                return {
                    "success": False,
                    "error": "Failed to get Supabase client"
                }
            
            query = client.from_(table).update(data)
            
            # Apply filters
            for field, value in filters.items():
                if isinstance(value, dict):
                    # Handle operators like eq, gt, lt, etc.
                    for op, op_value in value.items():
                        if op == "eq":
                            query = query.eq(field, op_value)
                        elif op == "neq":
                            query = query.neq(field, op_value)
                        elif op == "gt":
                            query = query.gt(field, op_value)
                        elif op == "gte":
                            query = query.gte(field, op_value)
                        elif op == "lt":
                            query = query.lt(field, op_value)
                        elif op == "lte":
                            query = query.lte(field, op_value)
                        elif op == "in":
                            query = query.in_(field, op_value)
                        elif op == "is":
                            query = query.is_(field, op_value)
                else:
                    # Simple equality filter
                    query = query.eq(field, value)
            
            response = query.execute()
            
            if hasattr(response, 'data'):
                # Clear cache entries for this table
                for key in list(self.query_cache.keys()):
                    if key.startswith(f"{table}:"):
                        del self.query_cache[key]
                
                return {
                    "success": True,
                    "data": response.data,
                    "count": len(response.data) if isinstance(response.data, list) else 1
                }
            else:
                return {
                    "success": False,
                    "error": "Update operation did not return expected response format"
                }
        except Exception as e:
            self.logger.error(f"Database update error: {str(e)}")
            return {
                "success": False,
                "error": f"Database update error: {str(e)}"
            }
        finally:
            # Release client back to the pool
            if client:
                try:
                    release_supabase_client(client)
                except Exception as release_error:
                    self.logger.error(f"Error releasing Supabase client: {str(release_error)}")
                    # Continue execution even if release fails
    
    def _handle_db_delete(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle database delete task
        
        Args:
            parameters:
                - table: Table to delete from
                - filters: Delete filters
                
        Returns:
            Delete results
        """
        table = parameters.get("table")
        filters = parameters.get("filters", {})
        
        if not table:
            return {
                "success": False,
                "error": "Missing required parameter: table"
            }
        
        if not filters:
            return {
                "success": False,
                "error": "Missing required parameter: filters (for safety)"
            }
        
        # Get client
        client = None
        try:
            client = get_supabase_client()
            if not client:
                return {
                    "success": False,
                    "error": "Failed to get Supabase client"
                }
            
            query = client.from_(table).delete()
            
            # Apply filters
            for field, value in filters.items():
                if isinstance(value, dict):
                    # Handle operators like eq, gt, lt, etc.
                    for op, op_value in value.items():
                        if op == "eq":
                            query = query.eq(field, op_value)
                        elif op == "neq":
                            query = query.neq(field, op_value)
                        elif op == "gt":
                            query = query.gt(field, op_value)
                        elif op == "gte":
                            query = query.gte(field, op_value)
                        elif op == "lt":
                            query = query.lt(field, op_value)
                        elif op == "lte":
                            query = query.lte(field, op_value)
                        elif op == "in":
                            query = query.in_(field, op_value)
                        elif op == "is":
                            query = query.is_(field, op_value)
                else:
                    # Simple equality filter
                    query = query.eq(field, value)
            
            response = query.execute()
            
            if hasattr(response, 'data'):
                # Clear cache entries for this table
                for key in list(self.query_cache.keys()):
                    if key.startswith(f"{table}:"):
                        del self.query_cache[key]
                
                return {
                    "success": True,
                    "data": response.data,
                    "count": len(response.data) if isinstance(response.data, list) else 1
                }
            else:
                return {
                    "success": False,
                    "error": "Delete operation did not return expected response format"
                }
        except Exception as e:
            self.logger.error(f"Database delete error: {str(e)}")
            return {
                "success": False,
                "error": f"Database delete error: {str(e)}"
            }
        finally:
            # Release client back to the pool
            if client:
                try:
                    release_supabase_client(client)
                except Exception as release_error:
                    self.logger.error(f"Error releasing Supabase client: {str(release_error)}")
                    # Continue execution even if release fails
    
    # Storage Operations
    
    def _handle_storage_upload(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle storage upload task
        
        Args:
            parameters:
                - bucket: Bucket to upload to
                - file_path: Path to file
                - storage_path: Path in storage
                - content_type: Optional content type
                
        Returns:
            Upload results
        """
        bucket = parameters.get("bucket")
        file_path = parameters.get("file_path")
        storage_path = parameters.get("storage_path")
        content_type = parameters.get("content_type")
        
        if not bucket:
            return {
                "success": False,
                "error": "Missing required parameter: bucket"
            }
        
        if not file_path:
            return {
                "success": False,
                "error": "Missing required parameter: file_path"
            }
        
        if not storage_path:
            # Use filename as storage path if not specified
            storage_path = os.path.basename(file_path)
        
        try:
            url = upload_file_to_storage(file_path, bucket, storage_path, content_type)
            
            if url:
                return {
                    "success": True,
                    "url": url,
                    "bucket": bucket,
                    "path": storage_path
                }
            else:
                return {
                    "success": False,
                    "error": "File upload failed"
                }
        except Exception as e:
            self.logger.error(f"Storage upload error: {str(e)}")
            return {
                "success": False,
                "error": f"Storage upload error: {str(e)}"
            }
    
    def _handle_storage_download(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle storage download task
        
        Args:
            parameters:
                - bucket: Bucket to download from
                - storage_path: Path in storage
                - destination_path: Path to save file
                
        Returns:
            Download results
        """
        bucket = parameters.get("bucket")
        storage_path = parameters.get("storage_path")
        destination_path = parameters.get("destination_path")
        
        if not bucket:
            return {
                "success": False,
                "error": "Missing required parameter: bucket"
            }
        
        if not storage_path:
            return {
                "success": False,
                "error": "Missing required parameter: storage_path"
            }
        
        if not destination_path:
            # Use current directory and filename from storage path
            destination_path = os.path.basename(storage_path)
        
        try:
            success = download_file_from_storage(bucket, storage_path, destination_path)
            
            if success:
                return {
                    "success": True,
                    "bucket": bucket,
                    "storage_path": storage_path,
                    "destination_path": destination_path
                }
            else:
                return {
                    "success": False,
                    "error": "File download failed"
                }
        except Exception as e:
            self.logger.error(f"Storage download error: {str(e)}")
            return {
                "success": False,
                "error": f"Storage download error: {str(e)}"
            }
    
    def _handle_storage_list(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle storage list task
        
        Args:
            parameters:
                - bucket: Bucket to list
                - path: Optional path prefix
                
        Returns:
            List results
        """
        bucket = parameters.get("bucket")
        path = parameters.get("path", "")
        
        if not bucket:
            return {
                "success": False,
                "error": "Missing required parameter: bucket"
            }
        
        try:
            files = list_files_in_storage(bucket, path)
            
            if files is not None:
                return {
                    "success": True,
                    "bucket": bucket,
                    "path": path,
                    "files": files,
                    "count": len(files)
                }
            else:
                return {
                    "success": False,
                    "error": "Failed to list files"
                }
        except Exception as e:
            self.logger.error(f"Storage list error: {str(e)}")
            return {
                "success": False,
                "error": f"Storage list error: {str(e)}"
            }
    
    def _handle_storage_delete(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle storage delete task
        
        Args:
            parameters:
                - bucket: Bucket to delete from
                - paths: List of paths to delete
                
        Returns:
            Delete results
        """
        bucket = parameters.get("bucket")
        paths = parameters.get("paths", [])
        
        if not bucket:
            return {
                "success": False,
                "error": "Missing required parameter: bucket"
            }
        
        if not paths:
            return {
                "success": False,
                "error": "Missing required parameter: paths"
            }
        
        # Convert to list if a single string was provided
        if isinstance(paths, str):
            paths = [paths]
        
        try:
            results = {
                "success": True,
                "bucket": bucket,
                "deleted": [],
                "failed": []
            }
            
            for path in paths:
                success = delete_file_from_storage(bucket, path)
                if success:
                    results["deleted"].append(path)
                else:
                    results["failed"].append(path)
            
            # Overall success is true only if all deletions succeeded
            results["success"] = len(results["failed"]) == 0
            
            return results
        except Exception as e:
            self.logger.error(f"Storage delete error: {str(e)}")
            return {
                "success": False,
                "error": f"Storage delete error: {str(e)}"
            }
    
    # Authentication Operations
    
    def _handle_auth_check(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle authentication check task
        
        Args:
            parameters: (unused)
                
        Returns:
            Auth status
        """
        client = None
        try:
            client = get_supabase_client()
            if not client:
                return {
                    "success": False,
                    "error": "Failed to get Supabase client"
                }
            
            # Get the auth status - just check if we can access the client's auth property
            has_auth = hasattr(client, 'auth')
            
            return {
                "success": True,
                "auth_available": has_auth,
                "status": "operational" if has_auth else "not_configured"
            }
        except Exception as e:
            self.logger.error(f"Auth check error: {str(e)}")
            return {
                "success": False,
                "error": f"Auth check error: {str(e)}"
            }
        finally:
            # Release client back to the pool
            if client:
                try:
                    release_supabase_client(client)
                except Exception as release_error:
                    self.logger.error(f"Error releasing Supabase client: {str(release_error)}")
                    # Continue execution even if release fails
    
    # Status Operations
    
    def _handle_status_check(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """
        Check Supabase service status
        
        Args:
            parameters:
                - check_buckets: Whether to check storage buckets
                - check_auth: Whether to check authentication
                - check_database: Whether to check database
                
        Returns:
            Status check results
        """
        check_buckets = parameters.get("check_buckets", True)
        check_auth = parameters.get("check_auth", True)
        check_database = parameters.get("check_database", True)
        
        client = None
        try:
            client = get_supabase_client()
            if not client:
                return {
                    "success": False,
                    "error": "Failed to get Supabase client"
                }
            
            results = {
                "success": True,
                "status": "operational",
                "checks": {}
            }
            
            # Check database if requested
            if check_database:
                try:
                    # Simple query to check database availability
                    response = client.from_('information_schema.tables').select('table_name').limit(1).execute()
                    
                    results["checks"]["database"] = {
                        "status": "operational" if hasattr(response, 'data') else "issue",
                        "error": None
                    }
                except Exception as e:
                    self.logger.warning(f"Database check failed: {str(e)}")
                    results["checks"]["database"] = {
                        "status": "issue",
                        "error": str(e)
                    }
            
            # Check storage buckets if requested
            if check_buckets:
                results["checks"]["buckets"] = {}
                
                for bucket_name in self.buckets.keys():
                    try:
                        response = client.storage.get_bucket(bucket_name)
                        results["checks"]["buckets"][bucket_name] = {
                            "status": "exists",
                            "error": None
                        }
                    except Exception as e:
                        results["checks"]["buckets"][bucket_name] = {
                            "status": "missing",
                            "error": str(e)
                        }
            
            # Check auth if requested
            if check_auth:
                try:
                    # Just check if auth is available
                    has_auth = hasattr(client, 'auth')
                    results["checks"]["auth"] = {
                        "status": "operational" if has_auth else "not_configured",
                        "error": None if has_auth else "Auth not available"
                    }
                except Exception as e:
                    results["checks"]["auth"] = {
                        "status": "issue",
                        "error": str(e)
                    }
            
            # If any check has issues, update the overall status
            for check_type, check_data in results["checks"].items():
                if isinstance(check_data, dict) and check_data.get("status") != "operational" and check_data.get("status") != "exists":
                    if check_type == "buckets":
                        # For buckets, only set issue if all buckets have issues
                        all_issue = True
                        for bucket_status in check_data.values():
                            if bucket_status.get("status") == "exists":
                                all_issue = False
                                break
                        if all_issue:
                            results["status"] = "issue"
                    else:
                        results["status"] = "issue"
            
            return results
        except Exception as e:
            self.logger.error(f"Status check error: {str(e)}")
            return {
                "success": False,
                "error": f"Status check error: {str(e)}"
            }
        finally:
            # Release client back to the pool
            if client:
                try:
                    release_supabase_client(client)
                except Exception as release_error:
                    self.logger.error(f"Error releasing Supabase client: {str(release_error)}")
                    # Continue execution even if release fails
    
    def _check_supabase_config(self) -> bool:
        """
        Check if Supabase environment variables are set
        
        Returns:
            True if configuration is complete, False otherwise
        """
        # Check for Supabase URL and key in environment variables
        supabase_url = os.environ.get("SUPABASE_URL")
        supabase_key = os.environ.get("SUPABASE_KEY") or os.environ.get("SUPABASE_SERVICE_KEY")
        
        if not supabase_url or not supabase_key:
            self.logger.warning("Supabase environment variables not set")
            return False
        
        return True
    
    # Message handling (for inter-agent communication)
    
    def handle_message(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle message from another agent
        
        Args:
            message: Dictionary containing message details
                - type: Message type (query, request, update, etc.)
                - from_agent: Agent ID of sender
                - content: Message content
                
        Returns:
            Response to the message
        """
        message_type = message.get("type")
        content = message.get("content", {})
        
        if message_type == "query":
            return self._handle_query(content)
        elif message_type == "request":
            return self._handle_request(content)
        
        return {
            "success": False,
            "error": f"Unsupported message type: {message_type}"
        }
    
    def _handle_query(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """Handle query message from another agent"""
        query_type = message.get("query_type")
        
        if query_type == "status":
            return {
                "success": True,
                "status": self.status,
                "capabilities": self.capabilities
            }
        elif query_type == "database_info":
            return self._get_database_info()
        elif query_type == "storage_info":
            return self._get_storage_info()
        
        return {
            "success": False,
            "error": f"Unsupported query type: {query_type}"
        }
    
    def _handle_request(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """Handle request message from another agent"""
        request_type = message.get("request_type")
        parameters = message.get("parameters", {})
        
        if request_type == "db_query":
            return self._handle_db_query(parameters)
        elif request_type == "storage_upload":
            return self._handle_storage_upload(parameters)
        elif request_type == "storage_list":
            return self._handle_storage_list(parameters)
        
        return {
            "success": False,
            "error": f"Unsupported request type: {request_type}"
        }
    
    def _get_database_info(self) -> Dict[str, Any]:
        """Get information about the Supabase database"""
        client = None
        try:
            client = get_supabase_client()
            if not client:
                return {
                    "success": False,
                    "error": "Failed to get Supabase client"
                }
            
            # Get information about tables
            response = client.from_('information_schema.tables').select('table_name, table_schema').execute()
            
            tables = []
            if hasattr(response, 'data'):
                for table in response.data:
                    if table['table_schema'] == 'public':
                        # For public tables, get column information
                        col_response = client.from_('information_schema.columns').select('column_name, data_type, is_nullable').eq('table_name', table['table_name']).eq('table_schema', 'public').execute()
                        
                        columns = []
                        if hasattr(col_response, 'data'):
                            columns = col_response.data
                        
                        tables.append({
                            'name': table['table_name'],
                            'schema': table['table_schema'],
                            'columns': columns
                        })
            
            return {
                "success": True,
                "tables": tables,
                "count": len(tables)
            }
        except Exception as e:
            self.logger.error(f"Error fetching database info: {str(e)}")
            return {
                "success": False,
                "error": f"Error fetching database info: {str(e)}"
            }
        finally:
            # Release client back to the pool
            if client:
                try:
                    release_supabase_client(client)
                except Exception as release_error:
                    self.logger.error(f"Error releasing Supabase client: {str(release_error)}")
                    # Continue execution even if release fails
    
    def _get_storage_info(self) -> Dict[str, Any]:
        """Get information about Supabase storage buckets"""
        client = None
        try:
            client = get_supabase_client()
            if not client:
                return {
                    "success": False,
                    "error": "Failed to get Supabase client"
                }
            
            buckets_info = {}
            
            for bucket_name, config in self.buckets.items():
                try:
                    # Try to get bucket details
                    bucket_response = client.storage.get_bucket(bucket_name)
                    
                    # List files in bucket
                    files_response = client.storage.from_(bucket_name).list()
                    
                    buckets_info[bucket_name] = {
                        "exists": True,
                        "description": config["description"],
                        "public": config["public"],
                        "files_count": len(files_response) if isinstance(files_response, list) else 0
                    }
                except Exception as e:
                    buckets_info[bucket_name] = {
                        "exists": False,
                        "description": config["description"],
                        "public": config["public"],
                        "error": str(e)
                    }
            
            return {
                "success": True,
                "buckets": buckets_info,
                "count": len(buckets_info)
            }
        except Exception as e:
            self.logger.error(f"Error fetching storage info: {str(e)}")
            return {
                "success": False,
                "error": f"Error fetching storage info: {str(e)}"
            }
        finally:
            # Release client back to the pool
            if client:
                try:
                    release_supabase_client(client)
                except Exception as release_error:
                    self.logger.error(f"Error releasing Supabase client: {str(release_error)}")
                    # Continue execution even if release fails