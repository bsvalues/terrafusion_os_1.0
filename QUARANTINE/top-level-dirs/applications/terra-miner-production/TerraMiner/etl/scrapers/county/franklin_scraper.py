"""
Franklin County Property Scraper.

This module implements a scraper for Franklin County, WA property data.
It uses the county's official web search portal and property detail pages
to provide authentic property data following IAAO and USPAP standards.
"""

import os
import logging
import json
import re
from typing import Dict, List, Any, Optional, Union
import requests
from datetime import datetime
from bs4 import BeautifulSoup

from etl.scrapers.base_scraper import BaseScraper

# Configure logging
logger = logging.getLogger(__name__)

class FranklinCountyScraper(BaseScraper):
    """Scraper for Franklin County, WA property data."""
    
    def __init__(self):
        """Initialize the Franklin County scraper."""
        super().__init__("Franklin", "WA")
        
        # Franklin County property search URLs
        self.base_url = "https://franklinwa-pexconnector.tylertech.com"
        self.search_url = f"{self.base_url}/franklin/Search/Disclaimer"
        self.post_search_url = f"{self.base_url}/franklin/Search/SearchResults"
        self.property_details_url = f"{self.base_url}/franklin/Property/View"
        
        # Rate limiting for the county website (more conservative)
        self.rate_limit_delay = 2.0
        
        # Add a standard disclaimer about data compliance
        self.disclaimer = (
            "Property data provided follows International Association of Assessing "
            "Officers (IAAO) standards and Uniform Standards of Professional "
            "Appraisal Practice (USPAP)."
        )
    
    def search_properties(self, query: str, **kwargs) -> Dict[str, Any]:
        """
        Search for properties in Franklin County using the public web interface.
        
        Args:
            query (str): Search query (address, owner name, parcel ID)
            **kwargs: Additional search parameters
                - limit (int): Maximum number of results to return (default: 10)
                - search_type (str): Type of search (address, owner, parcel) (default: auto-detect)
        
        Returns:
            Dict[str, Any]: Search results with property information
        """
        limit = kwargs.get('limit', 10)
        search_type = kwargs.get('search_type', 'auto')
        
        # Determine search type if auto
        if search_type == 'auto':
            # Check if query is likely a parcel number (numeric)
            if re.match(r'^\d+$', query.strip()):
                search_type = 'parcel'
            # Check if query looks like an address (contains digits and text)
            elif re.search(r'\d+', query) and re.search(r'[a-zA-Z]', query):
                search_type = 'address'
            # Default to owner name search
            else:
                search_type = 'owner'
        
        logger.info(f"Searching Franklin County properties by {search_type}: {query}")
        
        try:
            # Start a session
            session = self.session
            
            # First get the disclaimer page to get cookies and form values
            disclaimer_response = self._make_request(self.search_url)
            if not disclaimer_response:
                return {
                    'error': 'request_failed',
                    'message': "Failed to access Franklin County property search portal.",
                    'data_compliance': self.disclaimer
                }
            
            # Parse the disclaimer page
            soup = BeautifulSoup(disclaimer_response.text, 'html.parser')
            
            # Find the request verification token
            token_input = soup.find('input', {'name': '__RequestVerificationToken'})
            if not token_input:
                return {
                    'error': 'token_not_found',
                    'message': "Could not find verification token on Franklin County search page.",
                    'data_compliance': self.disclaimer
                }
            
            token = token_input.get('value', '')
            
            # Accept the disclaimer
            disclaimer_post_data = {
                '__RequestVerificationToken': token,
                'AcceptDisclaimer': 'True'
            }
            
            disclaimer_accept_response = self._make_request(
                url=self.search_url,
                method='POST',
                data=disclaimer_post_data
            )
            
            if not disclaimer_accept_response:
                return {
                    'error': 'disclaimer_accept_failed',
                    'message': "Failed to accept disclaimer on Franklin County property search portal.",
                    'data_compliance': self.disclaimer
                }
            
            # Now perform the search based on search type
            search_data = {
                'SearchByAddress': 'False',
                'SearchByOwner': 'False',
                'SearchByParcel': 'False',
                'SearchByAccount': 'False'
            }
            
            if search_type == 'address':
                search_data['SearchByAddress'] = 'True'
                search_data['Address'] = query
            elif search_type == 'owner':
                search_data['SearchByOwner'] = 'True'
                search_data['Owner'] = query
            elif search_type == 'parcel':
                search_data['SearchByParcel'] = 'True'
                search_data['Parcel'] = query
            
            # Add the verification token
            search_data['__RequestVerificationToken'] = token
            
            search_response = self._make_request(
                url=self.post_search_url,
                method='POST',
                data=search_data
            )
            
            if not search_response:
                return {
                    'error': 'search_failed',
                    'message': "Failed to perform property search on Franklin County portal.",
                    'data_compliance': self.disclaimer
                }
            
            # Parse the search results
            results_soup = BeautifulSoup(search_response.text, 'html.parser')
            
            # Find the property table
            property_table = results_soup.find('table', {'class': 'table'})
            if not property_table:
                return {
                    'count': 0,
                    'properties': [],
                    'query': query,
                    'source': f"Franklin County, WA Property Portal - {datetime.now().strftime('%Y-%m-%d')}",
                    'data_compliance': self.disclaimer,
                    'message': "No properties found matching your search criteria."
                }
            
            # Extract property data from table rows
            properties = []
            rows = property_table.find_all('tr')[1:]  # Skip header row
            
            for row in rows[:limit]:  # Apply the result limit
                cells = row.find_all('td')
                if len(cells) >= 4:
                    # Extract the property ID (parcel number) from the link
                    link = cells[0].find('a')
                    if link:
                        property_id = link.text.strip()
                        property_url = link.get('href', '')
                        
                        # Extract information from cells
                        property_data = {
                            'property_id': property_id,
                            'owner': cells[1].text.strip() if len(cells) > 1 else 'Unknown',
                            'address': cells[2].text.strip() if len(cells) > 2 else 'Unknown',
                            'property_type': cells[3].text.strip() if len(cells) > 3 else 'Unknown',
                            'url': f"{self.base_url}{property_url}" if property_url.startswith('/') else property_url
                        }
                        
                        # Standardize the property data
                        standardized = self.standardize_property(property_data)
                        properties.append(standardized)
            
            # Format the results
            result = {
                'count': len(properties),
                'properties': properties,
                'query': query,
                'source': f"Franklin County, WA Property Portal - {datetime.now().strftime('%Y-%m-%d')}",
                'data_compliance': self.disclaimer
            }
            
            return result
        
        except Exception as e:
            logger.error(f"Error searching Franklin County properties: {str(e)}")
            return {
                'error': 'search_error',
                'message': f"Error searching Franklin County properties: {str(e)}",
                'data_compliance': self.disclaimer
            }
    
    def get_property_details(self, property_id: str) -> Dict[str, Any]:
        """
        Get detailed information for a specific property from Franklin County.
        
        Args:
            property_id (str): Unique property identifier (parcel number)
        
        Returns:
            Dict[str, Any]: Property details
        """
        logger.info(f"Getting property details for ID: {property_id}")
        
        try:
            # First search for the property to get its detail URL
            search_results = self.search_properties(property_id, search_type='parcel', limit=1)
            
            if 'error' in search_results:
                return search_results
            
            if search_results.get('count', 0) == 0 or not search_results.get('properties'):
                return {
                    'error': 'property_not_found',
                    'message': f"Property with ID {property_id} not found in Franklin County records.",
                    'data_compliance': self.disclaimer
                }
            
            # Get the property URL from search results
            property_data = search_results['properties'][0]
            property_url = property_data.get('url')
            
            if not property_url:
                return {
                    'error': 'missing_property_url',
                    'message': f"Property detail URL not found for ID {property_id}.",
                    'data_compliance': self.disclaimer
                }
            
            # Request the property details page
            details_response = self._make_request(property_url)
            
            if not details_response:
                return {
                    'error': 'details_request_failed',
                    'message': f"Failed to get property details for ID {property_id}.",
                    'data_compliance': self.disclaimer
                }
            
            # Parse the property details page
            details_soup = BeautifulSoup(details_response.text, 'html.parser')
            
            # Extract additional details from the page
            owner_info = self._extract_section_data(details_soup, 'Owner Information')
            assessment_info = self._extract_section_data(details_soup, 'Assessment')
            valuation_info = self._extract_section_data(details_soup, 'Valuation')
            land_info = self._extract_section_data(details_soup, 'Land Information')
            building_info = self._extract_section_data(details_soup, 'Building Information')
            
            # Extract tax history if available
            tax_history = self._extract_tax_history(details_soup)
            
            # Extract sales history if available
            sales_history = self._extract_sales_history(details_soup)
            
            # Combine all information into a comprehensive property record
            detailed_property = {
                'property_id': property_id,
                'parcel_number': property_id,
                'owner': owner_info.get('Name', property_data.get('owner', 'Unknown')),
                'owner_information': owner_info,
                'assessment': assessment_info,
                'valuation': valuation_info,
                'land_information': land_info,
                'building_information': building_info,
                'tax_history': tax_history,
                'sales_history': sales_history,
                'address': {
                    'street': property_data.get('address', {}).get('street', 'Unknown'),
                    'city': property_data.get('address', {}).get('city', 'Franklin County'),
                    'state': 'WA',
                    'postal_code': property_data.get('address', {}).get('postal_code', ''),
                    'display': property_data.get('address', {}).get('display', 'Unknown')
                },
                'source': f"Franklin County, WA Property Portal - {datetime.now().strftime('%Y-%m-%d')}",
                'data_compliance': self.disclaimer
            }
            
            # Add calculated fields for compatibility with other county data
            detailed_property['assessed_value'] = assessment_info.get('Total Value', 0)
            detailed_property['market_value'] = valuation_info.get('Current Market Value', 0)
            
            # Extract year built if available
            year_built = building_info.get('Year Built', 'Unknown')
            if year_built and year_built != 'Unknown':
                detailed_property['year_built'] = year_built
            
            return {
                'property': detailed_property,
                'source': f"Franklin County, WA Property Portal - {datetime.now().strftime('%Y-%m-%d')}",
                'data_compliance': self.disclaimer
            }
        
        except Exception as e:
            logger.error(f"Error getting Franklin County property details: {str(e)}")
            return {
                'error': 'property_details_error',
                'message': f"Error retrieving property details: {str(e)}",
                'data_compliance': self.disclaimer
            }
    
    def get_property_history(self, property_id: str) -> Dict[str, Any]:
        """
        Get historical data for a property from Franklin County.
        
        Args:
            property_id (str): Unique property identifier (parcel number)
        
        Returns:
            Dict[str, Any]: Property history data
        """
        logger.info(f"Getting property history for ID: {property_id}")
        
        try:
            # Get full property details which includes history information
            property_details = self.get_property_details(property_id)
            
            if 'error' in property_details:
                return property_details
            
            # Extract history information from the property details
            property_data = property_details.get('property', {})
            
            history = {
                'property_id': property_id,
                'sales_history': property_data.get('sales_history', []),
                'tax_history': property_data.get('tax_history', []),
                'source': property_data.get('source', f"Franklin County, WA Property Portal - {datetime.now().strftime('%Y-%m-%d')}"),
                'data_compliance': self.disclaimer
            }
            
            return history
        
        except Exception as e:
            logger.error(f"Error getting Franklin County property history: {str(e)}")
            return {
                'error': 'property_history_error',
                'message': f"Error retrieving property history: {str(e)}",
                'data_compliance': self.disclaimer
            }
    
    def _extract_section_data(self, soup: BeautifulSoup, section_title: str) -> Dict[str, Any]:
        """
        Extract data from a specific section of the property details page.
        
        Args:
            soup (BeautifulSoup): Parsed HTML of the page
            section_title (str): Title of the section to extract
        
        Returns:
            Dict[str, Any]: Extracted data as key-value pairs
        """
        # Try to find the section heading
        heading = soup.find('h4', string=section_title)
        if not heading:
            return {}
        
        # Find the closest table to the heading
        section_table = heading.find_next('table')
        if not section_table:
            return {}
        
        # Extract data from the table
        data = {}
        rows = section_table.find_all('tr')
        
        for row in rows:
            cells = row.find_all(['th', 'td'])
            if len(cells) >= 2:
                key = cells[0].text.strip()
                value = cells[1].text.strip()
                
                # Clean up the value and convert to appropriate type
                if value.lower() in ['yes', 'true']:
                    value = True
                elif value.lower() in ['no', 'false']:
                    value = False
                elif re.match(r'^\d+$', value):
                    value = int(value)
                elif re.match(r'^\d+\.\d+$', value):
                    value = float(value)
                elif re.match(r'^\$[\d,]+\.\d{2}$', value):
                    # Convert currency string to number
                    value = float(value.replace('$', '').replace(',', ''))
                
                data[key] = value
        
        return data
    
    def _extract_tax_history(self, soup: BeautifulSoup) -> List[Dict[str, Any]]:
        """
        Extract tax history from the property details page.
        
        Args:
            soup (BeautifulSoup): Parsed HTML of the page
        
        Returns:
            List[Dict[str, Any]]: List of tax history records
        """
        # Try to find the tax history section
        tax_heading = soup.find('h4', string=re.compile(r'Tax History', re.IGNORECASE))
        if not tax_heading:
            return []
        
        # Find the closest table to the heading
        tax_table = tax_heading.find_next('table')
        if not tax_table:
            return []
        
        # Extract data from the table
        tax_history = []
        rows = tax_table.find_all('tr')[1:]  # Skip header row
        
        for row in rows:
            cells = row.find_all('td')
            if len(cells) >= 3:  # Typically Year, Amount, Status
                year = cells[0].text.strip()
                amount = cells[1].text.strip()
                status = cells[2].text.strip() if len(cells) > 2 else ''
                
                # Convert amount to number
                amount_value = 0
                if amount:
                    try:
                        amount_value = float(amount.replace('$', '').replace(',', ''))
                    except ValueError:
                        pass
                
                tax_history.append({
                    'year': year,
                    'amount': amount_value,
                    'status': status
                })
        
        return tax_history
    
    def _extract_sales_history(self, soup: BeautifulSoup) -> List[Dict[str, Any]]:
        """
        Extract sales history from the property details page.
        
        Args:
            soup (BeautifulSoup): Parsed HTML of the page
        
        Returns:
            List[Dict[str, Any]]: List of sales history records
        """
        # Try to find the sales history section
        sales_heading = soup.find('h4', string=re.compile(r'Sales History', re.IGNORECASE))
        if not sales_heading:
            return []
        
        # Find the closest table to the heading
        sales_table = sales_heading.find_next('table')
        if not sales_table:
            return []
        
        # Extract data from the table
        sales_history = []
        rows = sales_table.find_all('tr')[1:]  # Skip header row
        
        for row in rows:
            cells = row.find_all('td')
            if len(cells) >= 4:  # Date, Price, Type, Deed
                sale_date = cells[0].text.strip()
                price = cells[1].text.strip()
                sale_type = cells[2].text.strip() if len(cells) > 2 else ''
                deed_type = cells[3].text.strip() if len(cells) > 3 else ''
                
                # Convert price to number
                price_value = 0
                if price:
                    try:
                        price_value = float(price.replace('$', '').replace(',', ''))
                    except ValueError:
                        pass
                
                sales_history.append({
                    'sale_date': sale_date,
                    'price': price_value,
                    'sale_type': sale_type,
                    'deed_type': deed_type
                })
        
        return sales_history
    
    def standardize_property(self, raw_property: Dict[str, Any]) -> Dict[str, Any]:
        """
        Standardize Franklin County property data format.
        
        Args:
            raw_property (Dict[str, Any]): Raw property data
        
        Returns:
            Dict[str, Any]: Standardized property data
        """
        # Extract property ID
        property_id = raw_property.get('property_id', 'Unknown')
        
        # Extract address components
        address = raw_property.get('address', 'Unknown')
        if isinstance(address, str):
            parts = address.split(',')
            street_address = parts[0].strip() if parts else 'Unknown'
            city = 'Franklin County'
            state = 'WA'
            zip_code = ''
            
            # Try to extract city and zip code if available
            if len(parts) > 1:
                # Address might be in format "123 Main St, Pasco, WA 99301"
                if len(parts) >= 3:
                    city = parts[1].strip()
                    last_part = parts[2].strip()
                    if ' ' in last_part:
                        state, zip_code = last_part.split(' ', 1)
                        state = state.strip()
                        zip_code = zip_code.strip()
                    else:
                        state = last_part
        else:
            # Address is already structured as a dictionary
            street_address = address.get('street', 'Unknown')
            city = address.get('city', 'Franklin County')
            state = address.get('state', 'WA')
            zip_code = address.get('postal_code', '')
        
        # Build the standardized property object
        standardized = {
            'property_id': property_id,
            'address': {
                'street': street_address,
                'city': city,
                'state': state,
                'postal_code': zip_code,
                'display': f"{street_address}, {city}, {state} {zip_code}".strip().rstrip(', ')
            },
            'owner': raw_property.get('owner', 'Unknown'),
            'property_type': raw_property.get('property_type', 'Unknown'),
            'url': raw_property.get('url', ''),
            'data_source': f"Franklin County, WA Property Portal - {datetime.now().strftime('%Y-%m-%d')}",
            'data_compliance': self.disclaimer
        }
        
        # Add assessed and market values if available
        standardized['assessed_value'] = raw_property.get('assessed_value', 0)
        standardized['market_value'] = raw_property.get('market_value', 0)
        
        return standardized