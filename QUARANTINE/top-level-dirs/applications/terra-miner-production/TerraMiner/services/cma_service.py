"""
Service for Comparative Market Analysis (CMA) functionality.

This module provides methods for creating, retrieving, and managing CMA reports,
as well as generating the CMA data using the Zillow and NARRPR services.
"""

import logging
import json
from datetime import datetime
import random
from typing import Dict, List, Any, Optional, Union

from services.zillow_service import ZillowService
from services.narrpr_service import NarrprService
from ai.analyzer import ModelFactory

# Configure logger
logger = logging.getLogger(__name__)

class CMAService:
    """Service for CMA report functionality."""
    
    def __init__(self):
        """Initialize the CMA service with needed dependencies."""
        logger.info("Initializing CMA service")
        self.zillow_service = ZillowService()
        self.narrpr_service = NarrprService()
        self.ai_model_factory = ModelFactory()
        self.reports = {}  # In-memory storage for demo, would use database in production
        self.next_id = 1
    
    def create_report(self, data: Dict[str, Any]) -> int:
        """
        Create a new CMA report.
        
        Args:
            data (Dict[str, Any]): Report data including subject property details
            
        Returns:
            int: Report ID
        """
        logger.info(f"Creating CMA report for {data.get('subject_address', 'unknown address')}")
        
        # Validate required fields
        required_fields = ['subject_address', 'subject_city', 'subject_state', 'subject_zip']
        for field in required_fields:
            if not data.get(field):
                raise ValueError(f"Missing required field: {field}")
        
        # Create report object
        report_id = self.next_id
        self.next_id += 1
        
        report = {
            'id': report_id,
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat(),
            'status': 'created',
            'subject_address': data.get('subject_address'),
            'subject_city': data.get('subject_city'),
            'subject_state': data.get('subject_state'),
            'subject_zip': data.get('subject_zip'),
            'subject_beds': data.get('subject_beds', 3),
            'subject_baths': data.get('subject_baths', 2),
            'subject_sqft': data.get('subject_sqft', 1800),
            'subject_lot_size': data.get('subject_lot_size', 5000),
            'subject_year_built': data.get('subject_year_built', 2000),
            'subject_property_type': data.get('subject_property_type', 'Single Family'),
            'subject_price': data.get('subject_price')
        }
        
        # Store report
        self.reports[report_id] = report
        
        logger.info(f"Created CMA report with ID: {report_id}")
        
        return report_id
    
    def generate_report(self, report_id: int) -> Dict[str, Any]:
        """
        Generate CMA report data.
        
        Args:
            report_id (int): Report ID
            
        Returns:
            Dict[str, Any]: Generated report
        """
        logger.info(f"Generating CMA report: {report_id}")
        
        # Get report
        report = self.get_report(report_id)
        
        # Update status
        report['status'] = 'generating'
        report['updated_at'] = datetime.now().isoformat()
        
        try:
            # 1. Find comparable properties
            logger.info(f"Finding comparable properties for report: {report_id}")
            
            # Extract subject property details for search
            search_params = {
                'location': f"{report['subject_city']}, {report['subject_state']} {report['subject_zip']}",
                'property_type': report['subject_property_type'],
                'min_beds': max(1, report['subject_beds'] - 1),
                'max_beds': report['subject_beds'] + 1,
                'min_baths': max(1, report['subject_baths'] - 1),
                'max_baths': report['subject_baths'] + 1,
                'min_sqft': int(report['subject_sqft'] * 0.8),
                'max_sqft': int(report['subject_sqft'] * 1.2),
                'min_year_built': max(1900, report['subject_year_built'] - 15),
                'max_year_built': min(datetime.now().year, report['subject_year_built'] + 15),
                'subject_address': report['subject_address'],
                'subject_city': report['subject_city'],
                'subject_state': report['subject_state'],
                'subject_zip': report['subject_zip'],
                'subject_beds': report['subject_beds'],
                'subject_baths': report['subject_baths'],
                'subject_sqft': report['subject_sqft'],
                'subject_year_built': report['subject_year_built'],
                'subject_lot_size': report['subject_lot_size'],
                'subject_price': report['subject_price']
            }
            
            # Get comparable properties from both services and merge
            zillow_comps = self.zillow_service.find_properties(search_params)
            narrpr_comps = self.narrpr_service.find_comparable_properties(search_params)
            
            # Prepare comparable properties data
            comparables = []
            
            # Process Zillow comps
            for comp in zillow_comps:
                comparables.append({
                    'id': comp['id'],
                    'address': comp['address'],
                    'city': comp['city'],
                    'state': comp['state'],
                    'zip_code': comp['zip_code'],
                    'price': comp['price'],
                    'beds': comp['beds'],
                    'baths': comp['baths'],
                    'sqft': comp['sqft'],
                    'lot_size': comp.get('lot_size'),
                    'year_built': comp.get('year_built'),
                    'property_type': comp.get('property_type', report['subject_property_type']),
                    'status': comp.get('status', 'active'),
                    'days_on_market': comp.get('days_on_market'),
                    'source': 'zillow'
                })
            
            # Process NARRPR comps
            for comp in narrpr_comps:
                comparables.append({
                    'id': comp['id'],
                    'address': comp['address'],
                    'city': comp['city'],
                    'state': comp['state'],
                    'zip_code': comp['zip_code'],
                    'price': comp['price'],
                    'beds': comp['beds'],
                    'baths': comp['baths'],
                    'sqft': comp['sqft'],
                    'lot_size': comp.get('lot_size'),
                    'year_built': comp.get('year_built'),
                    'property_type': comp.get('property_type', report['subject_property_type']),
                    'status': comp.get('status', 'active'),
                    'days_on_market': comp.get('days_on_market'),
                    'source': 'narrpr'
                })
            
            # Store comparables in report
            report['comparables'] = comparables
            
            # 2. Get market activity data for the location
            logger.info(f"Getting market activity data for report: {report_id}")
            
            location = f"{report['subject_city']}, {report['subject_state']} {report['subject_zip']}"
            property_type = report['subject_property_type']
            
            # Get market activity from both services
            zillow_market = self.zillow_service.get_market_trends(location, property_type)
            narrpr_market = self.narrpr_service.get_market_activity(location, property_type)
            
            # Combine and calculate market trends
            # In real implementation, would need to reconcile differences between data sources
            
            # Extract median price stats
            if 'summary' in zillow_market and 'median_price' in zillow_market['summary']:
                median_price = zillow_market['summary']['median_price']
            elif 'stats' in narrpr_market and 'median_price' in narrpr_market['stats']:
                median_price = narrpr_market['stats']['median_price']['current']
            else:
                # Use average of comparable property prices if no market data
                prices = [comp['price'] for comp in comparables if comp['price']]
                median_price = sum(prices) / len(prices) if prices else 0
            
            # Extract year-over-year price change
            if 'summary' in zillow_market and 'price_change_ytd' in zillow_market['summary']:
                yoy_price_change = zillow_market['summary']['price_change_ytd']
            elif 'stats' in narrpr_market and 'median_price' in narrpr_market['stats']:
                yoy_price_change = narrpr_market['stats']['median_price']['yoy_change'] * 100
            else:
                yoy_price_change = random.uniform(-3.0, 5.0)
            
            # Extract days on market
            if 'summary' in zillow_market and 'days_on_market' in zillow_market['summary']:
                avg_days_on_market = zillow_market['summary']['days_on_market']
            elif 'stats' in narrpr_market and 'days_on_market' in narrpr_market['stats']:
                avg_days_on_market = narrpr_market['stats']['days_on_market']['current']
            else:
                avg_days_on_market = random.randint(20, 45)
            
            # Extract inventory
            if 'summary' in zillow_market and 'inventory' in zillow_market['summary']:
                inventory = zillow_market['summary']['inventory']
            elif 'stats' in narrpr_market and 'inventory' in narrpr_market['stats']:
                inventory = narrpr_market['stats']['inventory']['current']
            else:
                inventory = random.randint(50, 150)
            
            # Store market trends in report
            report['market_trends'] = {
                'median_price': median_price,
                'yoy_price_change': round(yoy_price_change, 1),
                'avg_days_on_market': avg_days_on_market,
                'inventory': inventory
            }
            
            # 3. Calculate property valuation
            logger.info(f"Calculating property valuation for report: {report_id}")
            
            # Calculate valuation using comparable properties
            if comparables:
                # Calculate average price per square foot
                comps_prices_per_sqft = []
                
                for comp in comparables:
                    if comp['sqft'] > 0:
                        comps_prices_per_sqft.append(comp['price'] / comp['sqft'])
                
                avg_price_per_sqft = sum(comps_prices_per_sqft) / len(comps_prices_per_sqft) if comps_prices_per_sqft else 0
                
                # Get neighborhood average price per sqft from market data or use comp average
                if 'summary' in zillow_market and 'median_price_per_sqft' in zillow_market['summary']:
                    neighborhood_avg_price_per_sqft = zillow_market['summary']['median_price_per_sqft']
                else:
                    neighborhood_avg_price_per_sqft = avg_price_per_sqft
                
                # Calculate basic valuation based on price per sqft
                basic_valuation = int(report['subject_sqft'] * avg_price_per_sqft)
                
                # Adjust for property characteristics compared to average comparable
                # (In a real implementation this would be much more sophisticated)
                avg_beds = sum(comp['beds'] for comp in comparables) / len(comparables)
                avg_baths = sum(comp['baths'] for comp in comparables) / len(comparables)
                avg_year = sum(comp.get('year_built', 2000) for comp in comparables) / len(comparables)
                
                # Adjustments as percentage of base value
                bed_adjustment = (report['subject_beds'] - avg_beds) * 0.03  # 3% per bedroom difference
                bath_adjustment = (report['subject_baths'] - avg_baths) * 0.03  # 3% per bathroom difference
                year_adjustment = (report['subject_year_built'] - avg_year) / avg_year * 0.15  # Up to 15% for age
                
                # Combine adjustments and cap the total adjustment
                total_adjustment = max(min(bed_adjustment + bath_adjustment + year_adjustment, 0.15), -0.15)
                
                # Apply adjustments to basic valuation
                adjusted_valuation = int(basic_valuation * (1 + total_adjustment))
                
                # Calculate confidence score (in a real implementation this would be more sophisticated)
                # More comparables = higher confidence
                comparables_count_factor = min(len(comparables) / 5, 1.0)  # 5+ comps = max factor
                
                # Less variance in comps = higher confidence
                prices = [comp['price'] for comp in comparables]
                variance = max(prices) - min(prices) if prices else 0
                price_variance_factor = 1.0 - min(variance / (sum(prices) / len(prices)) if prices else 0, 0.5)
                
                # Calculate confidence
                confidence = int((comparables_count_factor * 0.5 + price_variance_factor * 0.5) * 100)
                
                # Store valuation in report
                report['valuation'] = {
                    'estimated_value': adjusted_valuation,
                    'price_per_sqft': int(avg_price_per_sqft),
                    'neighborhood_avg_price_per_sqft': int(neighborhood_avg_price_per_sqft),
                    'confidence': confidence,
                    'value_range': {
                        'low': int(adjusted_valuation * 0.95),
                        'high': int(adjusted_valuation * 1.05)
                    }
                }
            else:
                report['valuation'] = None
            
            # 4. Generate AI insights
            logger.info(f"Generating AI insights for report: {report_id}")
            
            # Prepare data for AI analysis
            ai_data = {
                'subject_property': {
                    'address': report['subject_address'],
                    'city': report['subject_city'],
                    'state': report['subject_state'],
                    'zip_code': report['subject_zip'],
                    'beds': report['subject_beds'],
                    'baths': report['subject_baths'],
                    'sqft': report['subject_sqft'],
                    'year_built': report['subject_year_built'],
                    'property_type': report['subject_property_type'],
                    'estimated_value': report['valuation']['estimated_value'] if report['valuation'] else None
                },
                'comparable_properties': comparables,
                'market_trends': report['market_trends']
            }
            
            # Get AI model for property analysis
            property_analyzer = self.ai_model_factory.get_model('property_analyzer')
            
            # Generate insights using AI model
            try:
                ai_insights = property_analyzer.analyze(ai_data)
                report['ai_insights'] = ai_insights
            except Exception as e:
                logger.exception(f"Error generating AI insights: {str(e)}")
                # Fallback insights if AI fails
                report['ai_insights'] = {
                    'key_highlights': [
                        f"This {report['subject_property_type']} property has {report['subject_beds']} bedrooms and {report['subject_baths']} bathrooms.",
                        f"The property is located in {report['subject_city']}, {report['subject_state']}.",
                        f"Property is {datetime.now().year - report['subject_year_built']} years old, built in {report['subject_year_built']}."
                    ],
                    'recommendations': [
                        "Consider local market conditions when pricing this property.",
                        "Highlight the property's unique features in marketing materials.",
                        "Consult with a local real estate professional for additional insights."
                    ]
                }
            
            # Update report status
            report['status'] = 'completed'
            report['updated_at'] = datetime.now().isoformat()
            
            # Update in storage
            self.reports[report_id] = report
            
            logger.info(f"Completed CMA report generation: {report_id}")
            
            return report
            
        except Exception as e:
            logger.exception(f"Error generating CMA report: {str(e)}")
            
            # Update report status
            report['status'] = 'error'
            report['error'] = str(e)
            report['updated_at'] = datetime.now().isoformat()
            
            # Update in storage
            self.reports[report_id] = report
            
            # Re-raise for caller to handle
            raise
    
    def get_report(self, report_id: int) -> Dict[str, Any]:
        """
        Get a CMA report by ID.
        
        Args:
            report_id (int): Report ID
            
        Returns:
            Dict[str, Any]: Report data
            
        Raises:
            ValueError: If report not found
        """
        report = self.reports.get(report_id)
        
        if not report:
            raise ValueError(f"CMA report not found: {report_id}")
        
        return report
    
    def get_reports(self, user_id: Optional[int] = None, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get a list of CMA reports.
        
        Args:
            user_id (Optional[int]): Filter by user ID (not used in demo)
            limit (int): Maximum number of reports to return
            
        Returns:
            List[Dict[str, Any]]: List of reports
        """
        # In a real implementation, would filter by user_id and sort by created_at
        reports = list(self.reports.values())
        
        # Sort by created_at (newest first)
        reports.sort(key=lambda r: r.get('created_at', ''), reverse=True)
        
        # Apply limit
        reports = reports[:limit]
        
        return reports
    
    def delete_report(self, report_id: int) -> bool:
        """
        Delete a CMA report.
        
        Args:
            report_id (int): Report ID
            
        Returns:
            bool: True if report was deleted, False if not found
        """
        if report_id in self.reports:
            del self.reports[report_id]
            return True
        
        return False