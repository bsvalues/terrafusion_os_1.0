#!/usr/bin/env python3
"""
Benton County GIS API Client Test

This script demonstrates the usage of the Benton County GIS API client.
"""

import json
import logging
from client import BentonGISClient

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    """Main function demonstrating client usage"""
    print("Benton County GIS API Client Test")
    print("=================================")
    
    # Initialize client with test API key
    client = BentonGISClient(
        base_url='http://localhost:5000/api/v1', 
        api_key='test_api_key_123'
    )
    
    # Test API status
    print("\n1. Testing API Status:")
    status = client.get_status()
    print(json.dumps(status, indent=2))
    
    # Get user data
    print("\n2. Getting user data:")
    users = client.get_data('users', limit=2)
    print(json.dumps(users, indent=2))
    
    # Get schema for users table
    print("\n3. Getting schema for users table:")
    schema = client.get_schema('users')
    print(json.dumps(schema, indent=2))
    
    # Test a filtered query
    print("\n4. Getting filtered data (username=admin):")
    filtered = client.get_data('users', filters={'username': 'admin'})
    print(json.dumps(filtered, indent=2))
    
    # Test ordering
    print("\n5. Getting ordered data (by username, descending):")
    ordered = client.get_data('users', order_by='username', order_dir='desc')
    print(json.dumps(ordered, indent=2))
    
    # Test execute_query (if permissions allow)
    print("\n6. Testing custom query execution:")
    query_result = client.execute_query(
        "SELECT username, email FROM users WHERE username = :name",
        params={"name": "admin"}
    )
    print(json.dumps(query_result, indent=2))
    
    print("\nTests completed.")

if __name__ == "__main__":
    main()