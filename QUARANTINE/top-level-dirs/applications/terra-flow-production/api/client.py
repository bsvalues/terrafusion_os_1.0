"""
Benton County GIS API Client

This module provides a client for interacting with the Benton County GIS API.
It can be used by third-party applications to connect and interact with
the Benton County GIS system.
"""

import os
import requests
import json
import logging
from typing import Dict, Any, List, Optional, Union

# Configure logging
logger = logging.getLogger(__name__)

class BentonGISClient:
    """Client for the Benton County GIS API"""
    
    def __init__(self, base_url=None, api_key=None):
        """
        Initialize the API client
        
        Args:
            base_url: API base URL (default: environment variable BENTON_API_URL)
            api_key: API key (default: environment variable BENTON_API_KEY)
        """
        self.base_url = base_url or os.environ.get('BENTON_API_URL', 'https://api.benton-gis.example.com/api/v1')
        self.api_key = api_key or os.environ.get('BENTON_API_KEY')
        
        if not self.api_key:
            logger.warning("No API key provided. API calls will fail.")
        
        logger.info(f"Benton GIS API client initialized with base URL: {self.base_url}")
    
    def _make_request(self, method, endpoint, params=None, data=None):
        """
        Make a request to the API
        
        Args:
            method: HTTP method ('GET', 'POST', 'PUT', 'DELETE')
            endpoint: API endpoint (without base URL)
            params: Query parameters
            data: JSON data for POST/PUT requests
            
        Returns:
            Response data or error
        """
        url = f"{self.base_url}{endpoint}"
        headers = {'X-API-Key': self.api_key}
        
        if data is not None:
            headers['Content-Type'] = 'application/json'
            
        try:
            response = requests.request(
                method=method,
                url=url,
                headers=headers,
                params=params,
                json=data
            )
            
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"API request error: {str(e)}")
            
            # Try to get error message from response
            error_message = str(e)
            try:
                if hasattr(e, 'response') and e.response is not None:
                    error_json = e.response.json()
                    if 'error' in error_json:
                        error_message = error_json['error']
            except:
                pass
                
            return {'error': error_message}
    
    def get_status(self):
        """
        Get API status
        
        Returns:
            API status information
        """
        return self._make_request('GET', '/status')
    
    def get_schema(self, table_name=None):
        """
        Get database schema
        
        Args:
            table_name: Optional table name to get schema for
            
        Returns:
            Schema information
        """
        params = {}
        if table_name:
            params['table'] = table_name
            
        return self._make_request('GET', '/schema', params=params)
    
    def get_data(self, table_name, filters=None, limit=None, offset=None, 
                order_by=None, order_dir=None):
        """
        Get data from a table
        
        Args:
            table_name: Name of the table
            filters: Optional filters (dict of column:value)
            limit: Optional result limit
            offset: Optional result offset
            order_by: Optional column to order by
            order_dir: Optional order direction ('asc' or 'desc')
            
        Returns:
            Query results
        """
        params = {}
        
        if limit is not None:
            params['limit'] = limit
        if offset is not None:
            params['offset'] = offset
        if order_by:
            params['order_by'] = order_by
        if order_dir:
            params['order_dir'] = order_dir
            
        # Add filters to params
        if filters:
            params.update(filters)
            
        return self._make_request('GET', f'/data/{table_name}', params=params)
    
    def create_data(self, table_name, data):
        """
        Create a new record
        
        Args:
            table_name: Name of the table
            data: Record data
            
        Returns:
            Created record
        """
        return self._make_request('POST', f'/data/{table_name}', data=data)
    
    def update_data(self, table_name, id_value, data, id_column='id'):
        """
        Update a record
        
        Args:
            table_name: Name of the table
            id_value: ID value of the record
            data: Updated data
            id_column: ID column name (default: 'id')
            
        Returns:
            Updated record
        """
        params = {}
        if id_column != 'id':
            params['id_column'] = id_column
            
        return self._make_request('PUT', f'/data/{table_name}/{id_value}', 
                                  params=params, data=data)
    
    def delete_data(self, table_name, id_value, id_column='id'):
        """
        Delete a record
        
        Args:
            table_name: Name of the table
            id_value: ID value of the record
            id_column: ID column name (default: 'id')
            
        Returns:
            Deletion result
        """
        params = {}
        if id_column != 'id':
            params['id_column'] = id_column
            
        return self._make_request('DELETE', f'/data/{table_name}/{id_value}', 
                                  params=params)
    
    def execute_query(self, query, params=None):
        """
        Execute a custom query
        
        Args:
            query: SQL query string
            params: Query parameters
            
        Returns:
            Query results
        """
        data = {
            'query': query,
            'params': params or {}
        }
        
        return self._make_request('POST', '/query', data=data)
    
    def get_file_info(self, file_id):
        """
        Get file information
        
        Args:
            file_id: ID of the file
            
        Returns:
            File information
        """
        return self._make_request('GET', f'/files/{file_id}')
    
    def get_gis_data(self, layer_name):
        """
        Get GIS data for a layer
        
        Args:
            layer_name: Name of the GIS layer
            
        Returns:
            GIS data
        """
        return self._make_request('GET', f'/gis/{layer_name}')


# Example usage
if __name__ == '__main__':
    client = BentonGISClient(
        base_url='http://localhost:5000/api/v1',
        api_key='test_api_key_123'
    )
    
    # Get API status
    status = client.get_status()
    print("API Status:", status)
    
    # Get schema
    schema = client.get_schema()
    print("Schema:", json.dumps(schema, indent=2)[:200] + "...")
    
    # Get users
    users = client.get_data('users', limit=2)
    print("Users:", json.dumps(users, indent=2))