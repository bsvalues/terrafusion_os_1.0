"""
NARRPR ETL plugin for retrieving and storing data from NARRPR.
"""
import os
import json
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional, Tuple

from app import db
from etl.base import BaseETL
from etl.narrpr_scraper import NarrprScraper
from models import NarrprReport, NarrprProperty, NarrprMarketActivity, NarrprComparableProperty

# Configure logger
logger = logging.getLogger(__name__)

class NarrprReportETL(BaseETL):
    """ETL plugin for NARRPR reports data."""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the NARRPR Reports ETL plugin.
        
        Args:
            config (Dict[str, Any], optional): Configuration options including:
                - username: NARRPR account username/email (default: from environment)
                - password: NARRPR account password (default: from environment)
                - headless: Whether to run the browser in headless mode (default: True)
        """
        super().__init__(config)
        
        # Set default configuration values
        self.config.setdefault('username', os.environ.get('NARRPR_USERNAME'))
        self.config.setdefault('password', os.environ.get('NARRPR_PASSWORD'))
        self.config.setdefault('headless', True)
        
        # Initialize NARRPR scraper
        self.scraper = None
    
    def extract(self) -> List[Dict[str, Any]]:
        """
        Extract reports data from NARRPR website.
        
        Returns:
            List[Dict[str, Any]]: Raw reports data from NARRPR
        """
        if not self.config['username'] or not self.config['password']:
            raise ValueError("NARRPR credentials are required for NARRPR reports ETL")
        
        # Initialize the scraper
        self.scraper = NarrprScraper(
            username=self.config['username'],
            password=self.config['password'],
            headless=self.config['headless']
        )
        
        # Login to NARRPR
        login_success = self.scraper.login()
        if not login_success:
            raise ValueError("Failed to login to NARRPR")
        
        # Scrape reports data
        logger.info("Scraping NARRPR reports data")
        reports_data = self.scraper.scrape_reports()
        
        if not reports_data:
            logger.warning("No reports data found")
            return []
        
        return reports_data
    
    def transform(self, raw_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Transform raw NARRPR reports data.
        
        Args:
            raw_data (List[Dict[str, Any]]): Raw reports data from NARRPR
            
        Returns:
            List[Dict[str, Any]]: Transformed reports data
        """
        transformed_data = []
        
        for report in raw_data:
            # Extract date in correct format
            report_date = None
            try:
                if report.get('date'):
                    report_date = datetime.strptime(report['date'], "%m/%d/%Y").date()
            except (ValueError, TypeError):
                logger.warning(f"Invalid date format in report: {report.get('date')}")
            
            transformed_report = {
                "report_id": report.get("id"),
                "title": report.get("title"),
                "type": report.get("type"),
                "date": report_date,
                "link": report.get("link"),
                "status": report.get("status"),
                "raw_data": report
            }
            
            transformed_data.append(transformed_report)
        
        return transformed_data
    
    def load(self, processed_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Load transformed reports data into the database.
        
        Args:
            processed_data (List[Dict[str, Any]]): Transformed reports data
            
        Returns:
            Dict[str, Any]: Load result information
        """
        try:
            new_count = 0
            updated_count = 0
            
            for report_data in processed_data:
                # Check if report already exists
                existing_report = NarrprReport.query.filter_by(
                    report_id=report_data["report_id"]
                ).first()
                
                if existing_report:
                    # Update existing report
                    existing_report.title = report_data["title"]
                    existing_report.type = report_data["type"]
                    existing_report.date = report_data["date"]
                    existing_report.link = report_data["link"]
                    existing_report.status = report_data["status"]
                    existing_report.raw_data = report_data["raw_data"]
                    existing_report.updated_at = datetime.now()
                    updated_count += 1
                else:
                    # Create new report
                    new_report = NarrprReport(
                        report_id=report_data["report_id"],
                        title=report_data["title"],
                        type=report_data["type"],
                        date=report_data["date"],
                        link=report_data["link"],
                        status=report_data["status"],
                        raw_data=report_data["raw_data"],
                        created_at=datetime.now(),
                        updated_at=datetime.now()
                    )
                    db.session.add(new_report)
                    new_count += 1
            
            db.session.commit()
            logger.info(f"Successfully stored {new_count} new reports and updated {updated_count} existing reports")
            
            # Close the browser
            if self.scraper:
                self.scraper.close()
            
            return {
                "records_processed": len(processed_data),
                "new_reports": new_count,
                "updated_reports": updated_count
            }
            
        except Exception as e:
            db.session.rollback()
            logger.exception(f"Error storing reports data: {str(e)}")
            
            # Close the browser
            if self.scraper:
                self.scraper.close()
                
            raise

class NarrprPropertyETL(BaseETL):
    """ETL plugin for NARRPR property data."""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the NARRPR Property ETL plugin.
        
        Args:
            config (Dict[str, Any], optional): Configuration options including:
                - property_id: NARRPR Property ID
                - username: NARRPR account username/email (default: from environment)
                - password: NARRPR account password (default: from environment)
                - headless: Whether to run the browser in headless mode (default: True)
                - scrape_valuations: Whether to scrape property valuations (default: True)
                - scrape_comparables: Whether to scrape comparable properties (default: False)
        """
        super().__init__(config)
        
        # Set default configuration values
        self.config.setdefault('property_id', None)
        self.config.setdefault('username', os.environ.get('NARRPR_USERNAME'))
        self.config.setdefault('password', os.environ.get('NARRPR_PASSWORD'))
        self.config.setdefault('headless', True)
        self.config.setdefault('scrape_valuations', True)
        self.config.setdefault('scrape_comparables', False)
        
        # Initialize NARRPR scraper
        self.scraper = None
    
    def extract(self) -> Dict[str, Any]:
        """
        Extract property data from NARRPR website.
        
        Returns:
            Dict[str, Any]: Raw property data from NARRPR
        """
        if not self.config['property_id']:
            raise ValueError("Property ID is required for NARRPR property ETL")
            
        if not self.config['username'] or not self.config['password']:
            raise ValueError("NARRPR credentials are required for NARRPR property ETL")
        
        # Initialize the scraper
        self.scraper = NarrprScraper(
            username=self.config['username'],
            password=self.config['password'],
            headless=self.config['headless']
        )
        
        # Login to NARRPR
        login_success = self.scraper.login()
        if not login_success:
            raise ValueError("Failed to login to NARRPR")
        
        # Dictionary to store all scraped data
        data = {}
        
        # Scrape property details
        logger.info(f"Scraping property details for property ID: {self.config['property_id']}")
        property_data = self.scraper.scrape_property_details(self.config['property_id'])
        
        if not property_data:
            logger.warning(f"No property details found for property ID: {self.config['property_id']}")
            # Close the browser
            self.scraper.close()
            return {}
        
        data['property_details'] = property_data
        
        # Scrape property valuations if requested
        if self.config['scrape_valuations']:
            logger.info(f"Scraping property valuations for property ID: {self.config['property_id']}")
            valuation_data = self.scraper.scrape_property_valuations(self.config['property_id'])
            data['valuations'] = valuation_data or {}
        
        # Scrape comparable properties if requested
        if self.config['scrape_comparables']:
            logger.info(f"Scraping comparable properties for property ID: {self.config['property_id']}")
            comparables_data = self.scraper.scrape_comparable_properties(self.config['property_id'])
            data['comparables'] = comparables_data or []
        
        return data
    
    def transform(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Transform raw NARRPR property data.
        
        Args:
            raw_data (Dict[str, Any]): Raw property data from NARRPR
            
        Returns:
            Dict[str, Any]: Transformed property data
        """
        # Extract property details
        property_details = raw_data.get('property_details', {})
        
        # Extract address components
        address = property_details.get('address', {})
        
        # Build transformed data structure
        transformed = {
            'property_id': self.config['property_id'],
            'address': address.get('full_address'),
            'street': address.get('street'),
            'city': address.get('city'),
            'state': address.get('state'),
            'zip_code': address.get('zip_code'),
            'property_type': property_details.get('property_type'),
            'beds': property_details.get('beds'),
            'baths': property_details.get('baths'),
            'square_feet': property_details.get('square_feet'),
            'year_built': property_details.get('year_built'),
            'lot_size': property_details.get('lot_size'),
            'estimated_value': property_details.get('estimated_value'),
            'raw_data': raw_data
        }
        
        # Add valuation data if available
        if 'valuations' in raw_data and raw_data['valuations']:
            transformed['valuations'] = raw_data['valuations']
        
        # Add comparable properties if available
        if 'comparables' in raw_data and raw_data['comparables']:
            transformed['comparables'] = raw_data['comparables']
        
        return transformed
    
    def load(self, processed_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Load transformed property data into the database.
        
        Args:
            processed_data (Dict[str, Any]): Transformed property data
            
        Returns:
            Dict[str, Any]: Load result information
        """
        try:
            # Skip if no data
            if not processed_data:
                logger.warning(f"No data to load for property ID: {self.config['property_id']}")
                return {"records_processed": 0, "success": False}
            
            # Check if property already exists
            existing_property = NarrprProperty.query.filter_by(
                property_id=processed_data['property_id']
            ).first()
            
            if existing_property:
                # Update existing property
                existing_property.address = processed_data['address']
                existing_property.street = processed_data['street']
                existing_property.city = processed_data['city']
                existing_property.state = processed_data['state']
                existing_property.zip_code = processed_data['zip_code']
                existing_property.property_type = processed_data['property_type']
                existing_property.beds = processed_data['beds']
                existing_property.baths = processed_data['baths']
                existing_property.square_feet = processed_data['square_feet']
                existing_property.year_built = processed_data['year_built']
                existing_property.lot_size = processed_data['lot_size']
                existing_property.estimated_value = processed_data['estimated_value']
                existing_property.raw_data = processed_data['raw_data']
                existing_property.updated_at = datetime.now()
                is_new = False
            else:
                # Create new property
                new_property = NarrprProperty(
                    property_id=processed_data['property_id'],
                    address=processed_data['address'],
                    street=processed_data['street'],
                    city=processed_data['city'],
                    state=processed_data['state'],
                    zip_code=processed_data['zip_code'],
                    property_type=processed_data['property_type'],
                    beds=processed_data['beds'],
                    baths=processed_data['baths'],
                    square_feet=processed_data['square_feet'],
                    year_built=processed_data['year_built'],
                    lot_size=processed_data['lot_size'],
                    estimated_value=processed_data['estimated_value'],
                    raw_data=processed_data['raw_data'],
                    created_at=datetime.now(),
                    updated_at=datetime.now()
                )
                db.session.add(new_property)
                existing_property = new_property
                is_new = True
            
            db.session.commit()
            
            # Handle comparable properties if available
            comparables_count = 0
            if 'comparables' in processed_data and processed_data['comparables']:
                for comp in processed_data['comparables']:
                    # Check if comparable already exists
                    existing_comp = NarrprComparableProperty.query.filter_by(
                        comparable_id=comp.get('id'),
                        property_id=existing_property.id
                    ).first()
                    
                    if not existing_comp:
                        new_comp = NarrprComparableProperty(
                            property_id=existing_property.id,
                            comparable_id=comp.get('id'),
                            address=comp.get('address'),
                            distance=comp.get('distance'),
                            price=comp.get('price'),
                            beds=comp.get('beds'),
                            baths=comp.get('baths'),
                            square_feet=comp.get('square_feet'),
                            year_built=comp.get('year_built'),
                            sale_date=comp.get('sale_date'),
                            raw_data=comp,
                            created_at=datetime.now()
                        )
                        db.session.add(new_comp)
                        comparables_count += 1
                
                db.session.commit()
            
            logger.info(f"Successfully stored property data for property ID: {self.config['property_id']}")
            
            # Close the browser
            if self.scraper:
                self.scraper.close()
            
            return {
                "property_id": existing_property.id,
                "records_processed": 1,
                "is_new": is_new,
                "comparables_added": comparables_count,
                "address": existing_property.address
            }
            
        except Exception as e:
            db.session.rollback()
            logger.exception(f"Error storing property data: {str(e)}")
            
            # Close the browser
            if self.scraper:
                self.scraper.close()
                
            raise

class NarrprMarketActivityETL(BaseETL):
    """ETL plugin for NARRPR market activity data."""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the NARRPR Market Activity ETL plugin.
        
        Args:
            config (Dict[str, Any], optional): Configuration options including:
                - location_id: NARRPR Location ID (can be zip code or neighborhood ID)
                - location_type: Type of location (zip, neighborhood, city)
                - username: NARRPR account username/email (default: from environment)
                - password: NARRPR account password (default: from environment)
                - headless: Whether to run the browser in headless mode (default: True)
        """
        super().__init__(config)
        
        # Set default configuration values
        self.config.setdefault('location_id', None)
        self.config.setdefault('location_type', 'zip')
        self.config.setdefault('username', os.environ.get('NARRPR_USERNAME'))
        self.config.setdefault('password', os.environ.get('NARRPR_PASSWORD'))
        self.config.setdefault('headless', True)
        
        # Initialize NARRPR scraper
        self.scraper = None
    
    def extract(self) -> Dict[str, Any]:
        """
        Extract market activity data from NARRPR website.
        
        Returns:
            Dict[str, Any]: Raw market activity data from NARRPR
        """
        if not self.config['location_id']:
            raise ValueError("Location ID is required for NARRPR market activity ETL")
            
        if not self.config['username'] or not self.config['password']:
            raise ValueError("NARRPR credentials are required for NARRPR market activity ETL")
        
        # Initialize the scraper
        self.scraper = NarrprScraper(
            username=self.config['username'],
            password=self.config['password'],
            headless=self.config['headless']
        )
        
        # Login to NARRPR
        login_success = self.scraper.login()
        if not login_success:
            raise ValueError("Failed to login to NARRPR")
        
        # Scrape market activity
        logger.info(f"Scraping market activity for {self.config['location_type']} ID: {self.config['location_id']}")
        
        if self.config['location_type'] == 'zip':
            market_data = self.scraper.scrape_zip_market_activity(self.config['location_id'])
        elif self.config['location_type'] == 'neighborhood':
            market_data = self.scraper.scrape_neighborhood_market_activity(self.config['location_id'])
        else:
            raise ValueError(f"Unsupported location type: {self.config['location_type']}")
        
        if not market_data:
            logger.warning(f"No market activity found for {self.config['location_type']} ID: {self.config['location_id']}")
            # Close the browser
            self.scraper.close()
            return {}
        
        return market_data
    
    def transform(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Transform raw NARRPR market activity data.
        
        Args:
            raw_data (Dict[str, Any]): Raw market activity data from NARRPR
            
        Returns:
            Dict[str, Any]: Transformed market activity data
        """
        # Extract key metrics
        location_info = raw_data.get('location_info', {})
        market_stats = raw_data.get('market_stats', {})
        
        # Transform the data
        transformed = {
            'location_id': self.config['location_id'],
            'location_type': self.config['location_type'],
            'location_name': location_info.get('name'),
            'median_list_price': market_stats.get('median_list_price'),
            'median_sold_price': market_stats.get('median_sold_price'),
            'median_days_on_market': market_stats.get('median_days_on_market'),
            'total_properties': market_stats.get('total_properties'),
            'active_listings': market_stats.get('active_listings'),
            'sold_last_6_months': market_stats.get('sold_last_6_months'),
            'price_per_sqft': market_stats.get('price_per_sqft'),
            'raw_data': raw_data
        }
        
        return transformed
    
    def load(self, processed_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Load transformed market activity data into the database.
        
        Args:
            processed_data (Dict[str, Any]): Transformed market activity data
            
        Returns:
            Dict[str, Any]: Load result information
        """
        try:
            # Skip if no data
            if not processed_data:
                logger.warning(f"No data to load for {self.config['location_type']} ID: {self.config['location_id']}")
                return {"records_processed": 0, "success": False}
            
            # Check if market activity already exists for this location and date
            today = datetime.now().date()
            existing_activity = NarrprMarketActivity.query.filter_by(
                location_id=processed_data['location_id'],
                location_type=processed_data['location_type'],
                date=today
            ).first()
            
            if existing_activity:
                # Update existing market activity
                existing_activity.location_name = processed_data['location_name']
                existing_activity.median_list_price = processed_data['median_list_price']
                existing_activity.median_sold_price = processed_data['median_sold_price']
                existing_activity.median_days_on_market = processed_data['median_days_on_market']
                existing_activity.total_properties = processed_data['total_properties']
                existing_activity.active_listings = processed_data['active_listings']
                existing_activity.sold_last_6_months = processed_data['sold_last_6_months']
                existing_activity.price_per_sqft = processed_data['price_per_sqft']
                existing_activity.raw_data = processed_data['raw_data']
                existing_activity.updated_at = datetime.now()
                is_new = False
            else:
                # Create new market activity
                new_activity = NarrprMarketActivity(
                    location_id=processed_data['location_id'],
                    location_type=processed_data['location_type'],
                    location_name=processed_data['location_name'],
                    date=today,
                    median_list_price=processed_data['median_list_price'],
                    median_sold_price=processed_data['median_sold_price'],
                    median_days_on_market=processed_data['median_days_on_market'],
                    total_properties=processed_data['total_properties'],
                    active_listings=processed_data['active_listings'],
                    sold_last_6_months=processed_data['sold_last_6_months'],
                    price_per_sqft=processed_data['price_per_sqft'],
                    raw_data=processed_data['raw_data'],
                    created_at=datetime.now(),
                    updated_at=datetime.now()
                )
                db.session.add(new_activity)
                existing_activity = new_activity
                is_new = True
            
            db.session.commit()
            logger.info(f"Successfully stored market activity data for {self.config['location_type']} ID: {self.config['location_id']}")
            
            # Close the browser
            if self.scraper:
                self.scraper.close()
            
            return {
                "market_activity_id": existing_activity.id,
                "records_processed": 1,
                "is_new": is_new,
                "location_name": existing_activity.location_name,
                "location_type": existing_activity.location_type
            }
            
        except Exception as e:
            db.session.rollback()
            logger.exception(f"Error storing market activity data: {str(e)}")
            
            # Close the browser
            if self.scraper:
                self.scraper.close()
                
            raise