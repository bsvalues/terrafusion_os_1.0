"""
Service-specific Supabase Client

This module provides service-specific Supabase clients that use the connection pool
to efficiently manage connections for different services in the application.
"""

import os
import logging
import inspect
from typing import Dict, Any, Optional, List, Tuple, TypeVar, Generic, cast, Callable, Union, Type

try:
    from supabase import Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False

from supabase_client import get_supabase_client, release_supabase_client

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Type variable for generic functions
T = TypeVar('T')

# Service-specific clients
_service_clients = {}

def get_service_client(service_name: str) -> Any:
    """
    Get a Supabase client for a specific service.
    
    Args:
        service_name: Name of the service (e.g., "property", "valuation", etc.)
        
    Returns:
        ServiceClient instance
    """
    if service_name not in _service_clients:
        _service_clients[service_name] = ServiceClient(service_name)
    
    return _service_clients[service_name]

def get_service_supabase_client(service_name: str) -> Optional[Any]:
    """
    Get a Supabase client for a specific service.
    
    This function is used by tools and services that need to access
    the database with service-specific permissions.
    
    Args:
        service_name: Name of the service (e.g., "property", "valuation", etc.)
        
    Returns:
        Supabase client or None if it couldn't be created
    """
    logger.info(f"Getting Supabase client for service: {service_name}")
    
    # Get environment variables
    url = os.environ.get("SUPABASE_URL")
    service_key = os.environ.get("SUPABASE_SERVICE_KEY")
    
    if not url or not service_key:
        logger.error(f"Missing required environment variables for {service_name} service client")
        return None
    
    # Get a client from the centralized client manager for this service
    try:
        # Try with service name for specific role/permissions
        client = get_supabase_client(environment=service_name)
        if client:
            # Set app name for monitoring
            try:
                client.sql(f"SET app.service_name TO '{service_name}';").execute()
            except Exception as app_err:
                logger.warning(f"Could not set app.service_name (not critical): {str(app_err)}")
            return client
        
        # Fall back to using the default client
        logger.warning(f"Centralized client for service {service_name} not available, using default client")
        return get_supabase_client()
    except Exception as e:
        logger.error(f"Error getting Supabase client for service {service_name}: {str(e)}")
        return None

def release_service_supabase_client(service_name: str, client: Any) -> None:
    """
    Release a service-specific Supabase client back to the pool.
    
    Args:
        service_name: Name of the service
        client: Supabase client to release
    """
    if client is None:
        logger.debug(f"No client to release for service: {service_name}")
        return
        
    logger.debug(f"Releasing Supabase client for service: {service_name}")
    try:
        release_supabase_client(client)
    except Exception as release_err:
        logger.error(f"Error releasing Supabase client for service {service_name}: {str(release_err)}")
        # Even if we can't release it, don't crash

class ServiceClient:
    """
    A Supabase client for a specific service.
    
    This client uses the connection pool to efficiently manage connections
    to Supabase, while providing a service-specific interface.
    """
    
    def __init__(self, service_name: str):
        """
        Initialize a new service client.
        
        Args:
            service_name: Name of the service (e.g., "property", "valuation", etc.)
        """
        self.service_name = service_name
        
        # Get environment variables
        self.url = os.environ.get("SUPABASE_URL")
        self.key = os.environ.get("SUPABASE_KEY")
        self.service_key = os.environ.get("SUPABASE_SERVICE_KEY")
        
        if not self.url or not self.key:
            logger.error(f"Missing required environment variables for {service_name} service client")
        
        # Log initialization
        logger.info(f"Initialized {service_name} service client")
    
    def _with_client(self, func: Callable) -> Callable:
        """
        Decorator to provide a Supabase client to a function.
        
        Args:
            func: Function to decorate
            
        Returns:
            Decorated function
        """
        def wrapper(*args, **kwargs):
            client = None
            try:
                # Get a client from the centralized client manager
                client = get_supabase_client(environment="development")
                
                if not client:
                    # Fall back to direct client creation using environment variables
                    if not self.url or not self.key:
                        logger.error(f"Missing required environment variables for {self.service_name} service client")
                        raise ValueError("Missing required environment variables (URL or key)")
                    
                    # Note: Using environment variables directly is a fallback only
                    client = get_supabase_client()
                    
                    if not client:
                        logger.error(f"Failed to create client for {self.service_name} service")
                        raise ConnectionError(f"Failed to create client for {self.service_name} service")
                
                # Set app name for monitoring/auditing
                try:
                    client.sql(f"SET app.service_name TO '{self.service_name}';").execute()
                except Exception as app_err:
                    logger.warning(f"Could not set app.service_name (not critical): {str(app_err)}")
                
                # Call the function with the client
                return func(client, *args, **kwargs)
            except Exception as operation_err:
                logger.error(f"Error executing operation in {self.service_name} service: {str(operation_err)}")
                raise
            finally:
                # Release the client back through the centralized client manager
                if client:
                    try:
                        release_supabase_client(client)
                    except Exception as release_err:
                        logger.error(f"Error releasing client for {self.service_name}: {str(release_err)}")
        
        return wrapper
    
    def _with_service_client(self, func: Callable) -> Callable:
        """
        Decorator to provide a Supabase service client to a function.
        
        Args:
            func: Function to decorate
            
        Returns:
            Decorated function
        """
        def wrapper(*args, **kwargs):
            client = None
            try:
                # Try to get a service-specific client first
                client = get_service_supabase_client(self.service_name)
                
                if not client:
                    # Fall back to direct client creation using environment variables
                    if not self.url or not self.service_key:
                        logger.error(f"Missing required environment variables for {self.service_name} service client (service role)")
                        raise ValueError("Missing required environment variables (URL or service key)")
                    
                    # Note: Using environment variables directly is a fallback only
                    client = get_supabase_client()
                    
                    if not client:
                        logger.error(f"Failed to create service client for {self.service_name}")
                        raise ConnectionError(f"Failed to create service client for {self.service_name}")
                
                # Set app name for monitoring/auditing
                try:
                    client.sql(f"SET app.service_name TO '{self.service_name}_service';").execute()
                except Exception as app_err:
                    logger.warning(f"Could not set app.service_name (not critical): {str(app_err)}")
                
                # Call the function with the client
                return func(client, *args, **kwargs)
            except Exception as operation_err:
                logger.error(f"Error executing service operation in {self.service_name}: {str(operation_err)}")
                raise
            finally:
                # Release the client back through the centralized client manager
                if client:
                    try:
                        release_service_supabase_client(self.service_name, client)
                    except Exception as release_err:
                        logger.error(f"Error releasing service client for {self.service_name}: {str(release_err)}")
        
        return wrapper
    
    def execute(self, func: Callable[[Client, Any], T], *args, **kwargs) -> T:
        """
        Execute a function with a Supabase client.
        
        Args:
            func: Function to execute with client as first argument
            *args: Additional arguments to pass to the function
            **kwargs: Additional keyword arguments to pass to the function
            
        Returns:
            Result of the function
        """
        decorated = self._with_client(func)
        return decorated(*args, **kwargs)
    
    def execute_with_service_role(self, func: Callable[[Client, Any], T], *args, **kwargs) -> T:
        """
        Execute a function with a Supabase service client.
        
        Args:
            func: Function to execute with client as first argument
            *args: Additional arguments to pass to the function
            **kwargs: Additional keyword arguments to pass to the function
            
        Returns:
            Result of the function
        """
        decorated = self._with_service_client(func)
        return decorated(*args, **kwargs)
    
    def select(self, table: str, query: Optional[Dict[str, Any]] = None, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Select data from a table.
        
        Args:
            table: Table name
            query: Query parameters (optional)
            limit: Maximum number of rows to return (optional)
            
        Returns:
            List of rows
        """
        def _select(client, table, query, limit):
            # Build query
            q = client.table(table).select("*")
            
            # Apply query parameters
            if query:
                for key, value in query.items():
                    q = q.eq(key, value)
            
            # Apply limit
            if limit:
                q = q.limit(limit)
            
            # Execute
            response = q.execute()
            
            return response.data
        
        return self.execute(_select, table, query, limit)
    
    def insert(self, table: str, data: Union[Dict[str, Any], List[Dict[str, Any]]]) -> Dict[str, Any]:
        """
        Insert data into a table.
        
        Args:
            table: Table name
            data: Data to insert (dict or list of dicts)
            
        Returns:
            Response data
        """
        def _insert(client, table, data):
            response = client.table(table).insert(data).execute()
            return {
                "success": len(response.data) > 0,
                "data": response.data,
                "count": len(response.data)
            }
        
        return self.execute(_insert, table, data)
    
    def update(self, table: str, data: Dict[str, Any], query: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update data in a table.
        
        Args:
            table: Table name
            data: Data to update
            query: Query parameters to identify rows to update
            
        Returns:
            Response data
        """
        def _update(client, table, data, query):
            # Build query
            q = client.table(table).update(data)
            
            # Apply query parameters
            for key, value in query.items():
                q = q.eq(key, value)
            
            # Execute
            response = q.execute()
            
            return {
                "success": len(response.data) > 0,
                "data": response.data,
                "count": len(response.data)
            }
        
        return self.execute(_update, table, data, query)
    
    def delete(self, table: str, query: Dict[str, Any]) -> Dict[str, Any]:
        """
        Delete data from a table.
        
        Args:
            table: Table name
            query: Query parameters to identify rows to delete
            
        Returns:
            Response data
        """
        def _delete(client, table, query):
            # Build query
            q = client.table(table).delete()
            
            # Apply query parameters
            for key, value in query.items():
                q = q.eq(key, value)
            
            # Execute
            response = q.execute()
            
            return {
                "success": True,
                "data": response.data,
                "count": len(response.data)
            }
        
        return self.execute(_delete, table, query)
    
    def rpc(self, function_name: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Call a remote procedure (RPC function).
        
        Args:
            function_name: Name of the function to call
            params: Parameters to pass to the function (optional)
            
        Returns:
            Response data
        """
        def _rpc(client, function_name, params):
            response = client.rpc(function_name, params or {}).execute()
            
            return {
                "success": True,
                "data": response.data
            }
        
        return self.execute(_rpc, function_name, params)
    
    def storage_list_buckets(self) -> List[Dict[str, Any]]:
        """
        List all storage buckets.
        
        Returns:
            List of buckets
        """
        def _list_buckets(client):
            return client.storage.list_buckets()
        
        return self.execute(_list_buckets)
    
    def storage_upload(self, bucket: str, path: str, file_data: bytes, content_type: str) -> Dict[str, Any]:
        """
        Upload a file to storage.
        
        Args:
            bucket: Bucket name
            path: File path in bucket
            file_data: File data
            content_type: Content type of the file
            
        Returns:
            Response data
        """
        def _upload(client, bucket, path, file_data, content_type):
            response = client.storage.from_(bucket).upload(
                path,
                file_data,
                {"content-type": content_type}
            )
            
            return {
                "success": True,
                "path": response
            }
        
        return self.execute(_upload, bucket, path, file_data, content_type)
    
    def storage_download(self, bucket: str, path: str) -> bytes:
        """
        Download a file from storage.
        
        Args:
            bucket: Bucket name
            path: File path in bucket
            
        Returns:
            File data
        """
        def _download(client, bucket, path):
            return client.storage.from_(bucket).download(path)
        
        return self.execute(_download, bucket, path)
    
    def storage_delete(self, bucket: str, paths: Union[str, List[str]]) -> Dict[str, Any]:
        """
        Delete a file or files from storage.
        
        Args:
            bucket: Bucket name
            paths: File path(s) in bucket (string or list of strings)
            
        Returns:
            Response data
        """
        def _delete(client, bucket, paths):
            if isinstance(paths, str):
                paths = [paths]
            
            response = client.storage.from_(bucket).remove(paths)
            
            return {
                "success": True,
                "paths": paths
            }
        
        return self.execute(_delete, bucket, paths)