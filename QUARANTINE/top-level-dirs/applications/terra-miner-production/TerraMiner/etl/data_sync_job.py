"""
Data synchronization job for TerraMiner

This module provides functionality to periodically sync property data
from multiple sources into the TerraMiner database.
"""

import os
import logging
import traceback
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Set
from sqlalchemy import func
import schedule
import time

from flask import current_app
from etl.real_estate_data_connector import RealEstateDataConnector
from models.property import Property, PropertyListing, DataSourceStatus, standardize_property_data
from db import db

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    filename='logs/etl.log'
)
logger = logging.getLogger(__name__)

# Also log to console
console = logging.StreamHandler()
console.setLevel(logging.INFO)
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
console.setFormatter(formatter)
logger.addHandler(console)

class DataSyncJob:
    """
    Job to synchronize property data from multiple sources.
    
    This job fetches property data from all configured data sources,
    standardizes it, and stores it in the database, performing
    deduplication and data enrichment.
    """
    
    def __init__(self, app=None):
        """
        Initialize the data sync job.
        
        Args:
            app: Flask application (optional)
        """
        self.app = app
        self.data_connector = None
        self.sync_locations = []
        self.last_sync_time = None
        self.enable_incremental = True  # Only sync new/updated properties
        
        # Load sync locations from configuration
        self._load_sync_locations()
        
        # Initialize the real estate data connector
        self._init_connector()
    
    def _load_sync_locations(self):
        """Load the list of locations to synchronize from configuration."""
        try:
            # Load from environment variable or config file
            sync_locations_str = os.environ.get('SYNC_LOCATIONS', '')
            if sync_locations_str:
                self.sync_locations = [loc.strip() for loc in sync_locations_str.split(',')]
            
            # If no locations are configured, use default locations
            if not self.sync_locations:
                self.sync_locations = [
                    'Seattle, WA',
                    'Bellevue, WA',
                    'Tacoma, WA',
                    'Spokane, WA',
                    'Portland, OR'
                ]
            
            logger.info(f"Loaded {len(self.sync_locations)} locations for synchronization")
        
        except Exception as e:
            logger.error(f"Error loading sync locations: {str(e)}")
            self.sync_locations = ['Seattle, WA']  # Fallback to a default location
    
    def _init_connector(self):
        """Initialize the real estate data connector."""
        try:
            self.data_connector = RealEstateDataConnector()
            logger.info("Initialized real estate data connector")
        
        except Exception as e:
            logger.error(f"Error initializing data connector: {str(e)}")
            self.data_connector = None
    
    def run(self):
        """
        Run the data synchronization job.
        
        This method performs the following steps:
        1. Synchronize property listings for each configured location
        2. Update property details for recently updated properties
        3. Synchronize market trends for each location
        4. Update data source status records
        """
        logger.info("Starting data synchronization job")
        start_time = datetime.utcnow()
        
        if self.data_connector is None:
            logger.error("Data connector not initialized, cannot run sync job")
            return
        
        # Create an application context if we have a Flask app
        context = None
        if self.app:
            context = self.app.app_context()
            context.push()
        
        try:
            # Step 1: Sync property listings for each location
            total_properties = 0
            for location in self.sync_locations:
                try:
                    logger.info(f"Syncing property listings for {location}")
                    properties_synced = self._sync_properties_for_location(location)
                    total_properties += properties_synced
                    logger.info(f"Synced {properties_synced} properties for {location}")
                
                except Exception as e:
                    logger.error(f"Error syncing properties for {location}: {str(e)}")
                    traceback.print_exc()
            
            # Step 2: Update property details for recently updated properties
            if total_properties > 0:
                try:
                    logger.info("Updating property details")
                    details_updated = self._update_property_details()
                    logger.info(f"Updated details for {details_updated} properties")
                
                except Exception as e:
                    logger.error(f"Error updating property details: {str(e)}")
                    traceback.print_exc()
            
            # Step 3: Sync market trends for each location
            try:
                logger.info("Syncing market trends")
                trends_synced = self._sync_market_trends()
                logger.info(f"Synced market trends for {trends_synced} locations")
            
            except Exception as e:
                logger.error(f"Error syncing market trends: {str(e)}")
                traceback.print_exc()
            
            # Step 4: Update data source status records
            try:
                logger.info("Updating data source status")
                self._update_data_source_status()
                logger.info("Data source status updated")
            
            except Exception as e:
                logger.error(f"Error updating data source status: {str(e)}")
                traceback.print_exc()
            
            # Update last sync time
            self.last_sync_time = datetime.utcnow()
            
            # Log completion
            duration = (datetime.utcnow() - start_time).total_seconds()
            logger.info(f"Data synchronization completed in {duration:.2f} seconds")
            logger.info(f"Synced {total_properties} properties across {len(self.sync_locations)} locations")
        
        finally:
            # Pop the application context if we pushed one
            if context:
                context.pop()
    
    def _sync_properties_for_location(self, location: str) -> int:
        """
        Synchronize properties for a specific location.
        
        Args:
            location (str): Location to synchronize (city, zip code, etc.)
        
        Returns:
            int: Number of properties synchronized
        """
        # Determine search parameters
        search_params = {
            'limit': 50  # Number of properties to fetch in one batch
        }
        
        # If incremental sync is enabled, use last sync time to filter
        if self.enable_incremental and self.last_sync_time:
            # Add parameter to filter by update time if supported by the connector
            search_params['updated_since'] = self.last_sync_time
        
        # Search for properties
        search_results = self.data_connector.search_properties(location, **search_params)
        
        # Extract listings from results
        listings = search_results.get('listings', [])
        if not listings:
            logger.warning(f"No properties found for {location}")
            return 0
        
        # Process each property
        count = 0
        for property_data in listings:
            try:
                # Check if property already exists in the database
                external_id = property_data.get('external_id')
                source = property_data.get('source')
                
                if not external_id or not source:
                    logger.warning(f"Property missing external_id or source, skipping")
                    continue
                
                # Look up the property
                with db.session.begin():
                    existing_property = Property.query.filter_by(
                        external_id=external_id,
                        source=source
                    ).first()
                    
                    if existing_property:
                        # Update existing property
                        for key, value in property_data.items():
                            if key != 'id' and value is not None:
                                setattr(existing_property, key, value)
                        
                        existing_property.updated_at = datetime.utcnow()
                        existing_property.last_checked = datetime.utcnow()
                        
                        db.session.add(existing_property)
                        logger.debug(f"Updated existing property {external_id} from {source}")
                    
                    else:
                        # Create new property
                        new_property = Property(**property_data)
                        new_property.created_at = datetime.utcnow()
                        new_property.updated_at = datetime.utcnow()
                        new_property.last_checked = datetime.utcnow()
                        
                        db.session.add(new_property)
                        logger.debug(f"Created new property {external_id} from {source}")
                    
                    # Commit the transaction
                    db.session.commit()
                    count += 1
            
            except Exception as e:
                logger.error(f"Error processing property: {str(e)}")
                continue
        
        return count
    
    def _update_property_details(self) -> int:
        """
        Update details for recently added or updated properties.
        
        This fetches full property details for properties that were
        recently added or updated in the database.
        
        Returns:
            int: Number of properties updated
        """
        # Find properties that need detail updates
        cutoff_time = datetime.utcnow() - timedelta(days=1)
        properties_to_update = Property.query.filter(
            (Property.updated_at > cutoff_time) | 
            (Property.last_checked == None)
        ).limit(100).all()
        
        if not properties_to_update:
            logger.info("No properties need detail updates")
            return 0
        
        # Update each property
        count = 0
        for prop in properties_to_update:
            try:
                # Only update if we have source and external_id
                if not prop.source or not prop.external_id:
                    continue
                
                # Fetch property details
                details = self.data_connector.get_property_details(
                    prop.external_id,
                    source=prop.source
                )
                
                if 'error' in details:
                    logger.warning(f"Error fetching details for property {prop.external_id}: {details['error']}")
                    continue
                
                # Update property with details
                with db.session.begin():
                    # Update basic fields
                    for key, value in details.items():
                        if key != 'id' and key != 'external_id' and key != 'source' and value is not None:
                            setattr(prop, key, value)
                    
                    prop.last_checked = datetime.utcnow()
                    db.session.add(prop)
                    db.session.commit()
                    count += 1
            
            except Exception as e:
                logger.error(f"Error updating property details for {prop.external_id}: {str(e)}")
                continue
        
        return count
    
    def _sync_market_trends(self) -> int:
        """
        Synchronize market trends for all configured locations.
        
        This fetches market trend data for each location and stores it
        in the database.
        
        Returns:
            int: Number of locations with synchronized trends
        """
        # TODO: Implement market trends synchronization
        # This will depend on the specific database schema for market trends
        
        return 0
    
    def _update_data_source_status(self):
        """Update status records for all data sources."""
        # Get all connectors
        for name, connector in self.data_connector.connectors.items():
            try:
                # Get health and metrics
                health = connector.get_health_status()
                metrics = connector.get_metrics()
                
                # Update the database record
                with db.session.begin():
                    status = DataSourceStatus.query.filter_by(source_name=name).first()
                    if not status:
                        status = DataSourceStatus(source_name=name)
                    
                    # Update fields
                    status.status = health['status']
                    status.last_check = datetime.utcnow()
                    status.success_rate = 100 * (1 - metrics.get('error_rate', 0))
                    status.avg_response_time = metrics.get('avg_response_time', 0)
                    status.error_count = metrics.get('errors', 0)
                    
                    # Save changes
                    db.session.add(status)
                    db.session.commit()
            
            except Exception as e:
                logger.error(f"Error updating status for {name}: {str(e)}")
                continue

def setup_sync_schedule(app):
    """
    Set up the data synchronization schedule.
    
    Args:
        app: Flask application
    """
    try:
        # Create the data sync job
        sync_job = DataSyncJob(app)
        
        # Set up the schedule
        # Run every 6 hours by default, can be configured via environment variable
        sync_interval = int(os.environ.get('SYNC_INTERVAL_HOURS', 6))
        
        # Schedule the job
        schedule.every(sync_interval).hours.do(sync_job.run)
        logger.info(f"Scheduled data sync job to run every {sync_interval} hours")
        
        # Also run the job immediately on startup if configured
        if os.environ.get('SYNC_ON_STARTUP', 'false').lower() == 'true':
            logger.info("Running initial data sync job on startup")
            sync_job.run()
        
        # Create and start the scheduler thread
        import threading
        
        def run_scheduler():
            while True:
                schedule.run_pending()
                time.sleep(60)  # Check every minute
        
        scheduler_thread = threading.Thread(target=run_scheduler, daemon=True)
        scheduler_thread.start()
        logger.info("Data sync scheduler started")
        
        return sync_job
    
    except Exception as e:
        logger.error(f"Error setting up sync schedule: {str(e)}")
        return None