#!/usr/bin/env python3
"""
Service Integration Example

This example demonstrates how to integrate a microservice with the shared Supabase database.
It includes examples of direct database access, using the connection pool, and listening
for database changes.
"""

import os
import sys
import logging
import json
import time
import threading
from typing import Dict, Any, List, Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("service_example")

# Add parent directory to path to import shared modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Import service tools
try:
    from service_supabase_client import get_service_supabase_client, test_connection
    from supabase_connection_pool import get_connection_pool, with_connection
    SERVICE_TOOLS_AVAILABLE = True
except ImportError:
    logger.error("❌ Service tools not found. Make sure service_supabase_client.py and supabase_connection_pool.py are in the parent directory.")
    SERVICE_TOOLS_AVAILABLE = False

# Constants
SERVICE_NAME = "gis_service"  # Change to your service name
PROPERTIES_TABLE = "core.properties"
PROPERTY_GEOMETRIES_TABLE = "gis.property_geometries"
REALTIME_CHANNEL = "property_updates"

class GISService:
    """Example GIS service that connects to the shared database."""
    
    def __init__(self, service_name: str = SERVICE_NAME):
        """Initialize the service."""
        self.service_name = service_name
        self.client = None
        self.pool = None
        self.realtime_subscription = None
        self.is_running = False
        
        # Initialize the database connection
        self._initialize()
    
    def _initialize(self):
        """Initialize the database connection."""
        if not SERVICE_TOOLS_AVAILABLE:
            logger.error("Service tools not available, skipping initialization")
            return
        
        try:
            # Test the connection
            logger.info(f"Testing connection for service: {self.service_name}")
            connection_ok = test_connection(self.service_name)
            
            if not connection_ok:
                logger.error(f"Connection test failed for service: {self.service_name}")
                return
            
            # Get a client
            self.client = get_service_supabase_client(self.service_name)
            
            # Initialize connection pool
            self.pool = get_connection_pool(self.service_name, {
                'max_size': 5,
                'min_size': 1,
                'max_idle_time': 300,
                'connection_timeout': 10
            })
            
            logger.info(f"Service initialized successfully: {self.service_name}")
        except Exception as e:
            logger.error(f"Error initializing service: {str(e)}")
    
    def start(self):
        """Start the service."""
        if not self.client:
            logger.error("Cannot start service: Client not initialized")
            return
        
        self.is_running = True
        
        # Start listening for property updates
        self._start_listening()
        
        logger.info(f"Service started: {self.service_name}")
        
        # Run a sample query to verify access
        self._run_sample_query()
    
    def stop(self):
        """Stop the service."""
        self.is_running = False
        
        # Stop listening for updates
        if self.realtime_subscription:
            try:
                self.realtime_subscription.unsubscribe()
                logger.info("Stopped listening for property updates")
            except Exception as e:
                logger.error(f"Error unsubscribing from updates: {str(e)}")
        
        logger.info(f"Service stopped: {self.service_name}")
    
    def _run_sample_query(self):
        """Run a sample query to verify database access."""
        try:
            # Direct client query
            logger.info("Running sample direct query...")
            response = self.client.table(PROPERTIES_TABLE).select('count(*)').execute()
            count = response.data[0]['count'] if response.data else 0
            logger.info(f"Found {count} properties in database")
            
            # Connection pool query
            logger.info("Running sample connection pool query...")
            properties = self.get_properties_within_bounds(
                min_lat=47.0, min_lon=-123.0, 
                max_lat=48.0, max_lon=-122.0,
                limit=5
            )
            logger.info(f"Found {len(properties)} properties within bounds")
            
            # Cross-schema function query
            logger.info("Running cross-schema function query...")
            if properties:
                property_id = properties[0]['id']
                property_with_valuation = self.get_property_with_valuation(property_id)
                logger.info(f"Retrieved property with valuation: {bool(property_with_valuation)}")
        except Exception as e:
            logger.error(f"Error running sample queries: {str(e)}")
    
    def _start_listening(self):
        """Start listening for property updates."""
        if not self.client:
            logger.error("Cannot start listening: Client not initialized")
            return
        
        try:
            # Subscribe to property updates
            def handle_update(payload):
                """Handle a property update notification."""
                logger.info(f"Received property update: {payload}")
                
                # Process the update
                record_id = payload.get('record_id')
                operation = payload.get('operation')
                
                if record_id and operation:
                    logger.info(f"Processing {operation} operation for property {record_id}")
                    # In a real service, you would update caches, trigger workflows, etc.
            
            # Set up the subscription
            channel_name = f"{self.service_name}_{REALTIME_CHANNEL}"
            self.realtime_subscription = self.client.channel(channel_name).on(
                'postgres_changes',
                callback=handle_update
            ).subscribe()
            
            logger.info(f"Started listening for property updates on channel: {channel_name}")
        except Exception as e:
            logger.error(f"Error setting up realtime subscription: {str(e)}")
    
    @with_connection(SERVICE_NAME)
    def get_properties_within_bounds(self, client, min_lat, min_lon, max_lat, max_lon, limit=10):
        """
        Get properties within geographic bounds.
        
        Uses the connection pool decorator to get a database connection.
        """
        try:
            # Construct a PostGIS query to find properties within bounds
            rpc_params = {
                'min_lat': min_lat,
                'min_lon': min_lon,
                'max_lat': max_lat,
                'max_lon': max_lon,
                'limit_val': limit
            }
            
            # Execute the function
            response = client.rpc(
                'find_properties_in_bounds',
                rpc_params
            ).execute()
            
            return response.data if response.data else []
        except Exception as e:
            logger.error(f"Error getting properties within bounds: {str(e)}")
            return []
    
    def get_property_with_valuation(self, property_id):
        """
        Get a property with its valuation data.
        
        Uses the cross-schema function to get data from multiple schemas.
        """
        if not self.client:
            logger.error("Cannot get property: Client not initialized")
            return None
        
        try:
            # Call the cross-schema function
            response = self.client.rpc(
                'core.get_property_with_valuation',
                {'property_id': property_id}
            ).execute()
            
            return response.data if response.data else None
        except Exception as e:
            logger.error(f"Error getting property with valuation: {str(e)}")
            return None
    
    def add_property_geometry(self, property_id, geometry_data, geometry_type, metadata=None):
        """Add a geometry to a property."""
        if not self.client:
            logger.error("Cannot add geometry: Client not initialized")
            return False
        
        try:
            # Prepare the data
            data = {
                'property_id': property_id,
                'geometry': geometry_data,
                'geometry_type': geometry_type,
                'source': self.service_name,
                'metadata': metadata or {}
            }
            
            # Insert the geometry
            response = self.client.table(PROPERTY_GEOMETRIES_TABLE).insert(data).execute()
            
            success = response.data is not None and len(response.data) > 0
            if success:
                logger.info(f"Added geometry for property {property_id}")
            else:
                logger.error(f"Failed to add geometry for property {property_id}")
            
            return success
        except Exception as e:
            logger.error(f"Error adding property geometry: {str(e)}")
            return False
    
    def run_maintenance_tasks(self):
        """Run periodic maintenance tasks."""
        if not self.is_running:
            return
        
        logger.info("Running maintenance tasks...")
        
        try:
            # Check database connection
            if not self.client or not self.pool:
                logger.warning("Database connection not available, reinitializing...")
                self._initialize()
                return
            
            # Check pool stats
            pool_stats = self.pool._get_stats()
            logger.info(f"Connection pool stats: {pool_stats}")
            
            # Other maintenance tasks would go here
        except Exception as e:
            logger.error(f"Error in maintenance tasks: {str(e)}")
    
    def start_maintenance_thread(self):
        """Start a background thread for maintenance tasks."""
        def maintenance_worker():
            while self.is_running:
                self.run_maintenance_tasks()
                time.sleep(60)  # Run every minute
        
        thread = threading.Thread(target=maintenance_worker, daemon=True)
        thread.start()
        logger.info("Started maintenance thread")


def main():
    """Main function to run the example service."""
    logger.info("Starting GIS Service example")
    
    # Create and start the service
    service = GISService()
    service.start()
    
    # Start the maintenance thread
    service.start_maintenance_thread()
    
    try:
        # Run until interrupted
        logger.info("Service running. Press Ctrl+C to stop.")
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        logger.info("Received interrupt, stopping service...")
    finally:
        service.stop()
    
    logger.info("Service example completed")
    return 0


if __name__ == "__main__":
    sys.exit(main())