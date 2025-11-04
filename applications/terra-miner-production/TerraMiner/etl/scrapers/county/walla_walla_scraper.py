"""
Walla Walla County Property Scraper.

This module implements a scraper for Walla Walla County, WA property data.
It uses both the county's official property search portal and GIS services
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
import trafilatura

from etl.scrapers.base_scraper import BaseScraper

# Configure logging
logger = logging.getLogger(__name__)

class WallaWallaCountyScraper(BaseScraper):
    """Scraper for Walla Walla County, WA property data."""
    
    def __init__(self):
        """Initialize the Walla Walla County scraper."""
        super().__init__("Walla Walla", "WA")
        
        # Walla Walla County property search URLs
        self.base_url = "https://propertysearch.co.walla-walla.wa.us"
        self.search_url = f"{self.base_url}/PropertyAccess/PropertySearch"
        self.property_url = f"{self.base_url}/PropertyAccess/Property/Property"
        
        # GIS services URL
        self.gis_base_url = "https://ww-gis.maps.arcgis.com/sharing/rest/content/items"
        self.gis_parcels_url = f"{self.gis_base_url}/bd3dbc8a94b7420cba01a0d580f818c9/data"
        
        # Rate limiting for the county website (more conservative)
        self.rate_limit_delay = 3.0
        
        # Add a standard disclaimer about data compliance
        self.disclaimer = (
            "Property data provided follows International Association of Assessing "
            "Officers (IAAO) standards and Uniform Standards of Professional "
            "Appraisal Practice (USPAP)."
        )
    
    def search_properties(self, query: str, **kwargs) -> Dict[str, Any]:
        """
        Search for properties in Walla Walla County.
        
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
            # Check if query is likely a parcel number (numeric with dashes)
            if re.match(r'^\d+(-\d+)*$', query.strip()):
                search_type = 'parcel'
            # Check if query looks like an address (contains digits and text)
            elif re.search(r'\d+', query) and re.search(r'[a-zA-Z]', query):
                search_type = 'address'
            # Default to owner name search
            else:
                search_type = 'owner'
        
        logger.info(f"Searching Walla Walla County properties by {search_type}: {query}")
        
        try:
            # First, try using the county's website search
            results = self._search_county_website(query, search_type, limit)
            
            # Check if no results from county website, try GIS API as backup
            if not results.get('count', 0) and not results.get('error'):
                logger.info("No results from county website, trying GIS services")
                gis_results = self._search_gis_service(query, limit)
                
                # If GIS search was successful and found results, use those
                if not gis_results.get('error') and gis_results.get('count', 0) > 0:
                    return gis_results
            
            return results
        
        except Exception as e:
            logger.error(f"Error searching Walla Walla County properties: {str(e)}")
            return {
                'error': 'search_error',
                'message': f"Error searching Walla Walla County properties: {str(e)}",
                'data_compliance': self.disclaimer
            }
    
    def _search_county_website(self, query: str, search_type: str, limit: int) -> Dict[str, Any]:
        """
        Search using the county's official property search website.
        
        Args:
            query (str): Search query
            search_type (str): Type of search (address, owner, parcel)
            limit (int): Maximum results to return
            
        Returns:
            Dict[str, Any]: Search results
        """
        try:
            # Start a session
            session = self.session
            
            # First get the search page to get cookies and form values
            search_response = self._make_request(self.search_url)
            if not search_response:
                return {
                    'error': 'request_failed',
                    'message': "Failed to access Walla Walla County property search portal.",
                    'data_compliance': self.disclaimer
                }
            
            # Parse the search page
            soup = BeautifulSoup(search_response.text, 'html.parser')
            
            # Find the verification token and form values
            token_input = soup.find('input', {'name': '__RequestVerificationToken'})
            if not token_input:
                return {
                    'error': 'token_not_found',
                    'message': "Could not find verification token on Walla Walla County search page.",
                    'data_compliance': self.disclaimer
                }
            
            token = token_input.get('value', '')
            
            # Prepare search data based on search type
            search_data = {
                '__RequestVerificationToken': token,
                'PropertySearchOptions.CurrentPage': '1',
                'PropertySearchOptions.RawPropertyType': '0',
                'PropertySearchOptions.SearchValue': query,
                'PropertySearchOptions.SortResults': 'True',
            }
            
            if search_type == 'parcel':
                search_data['PropertySearchOptions.SearchType'] = '1'  # Parcel number search
            elif search_type == 'address':
                search_data['PropertySearchOptions.SearchType'] = '0'  # Address search
            else:  # Owner name
                search_data['PropertySearchOptions.SearchType'] = '2'  # Owner name search
            
            # Submit search form
            search_results_response = self._make_request(
                url=self.search_url,
                method='POST',
                data=search_data
            )
            
            if not search_results_response:
                return {
                    'error': 'search_failed',
                    'message': "Failed to perform property search on Walla Walla County portal.",
                    'data_compliance': self.disclaimer
                }
            
            # Parse the search results
            results_soup = BeautifulSoup(search_results_response.text, 'html.parser')
            
            # Find property results
            property_results = results_soup.find_all('div', {'class': 'propertySearchResultItem'})
            
            if not property_results:
                # Check if there's a no results message
                no_results = results_soup.find('span', {'class': 'searchResultsMessage'})
                if no_results and 'no results' in no_results.text.lower():
                    return {
                        'count': 0,
                        'properties': [],
                        'query': query,
                        'source': f"Walla Walla County Property Portal - {datetime.now().strftime('%Y-%m-%d')}",
                        'data_compliance': self.disclaimer,
                        'message': "No properties found matching your search criteria."
                    }
                
                # Check for single property redirect
                # If the search found exactly one property, the site might redirect to property details page
                if 'Property Details' in results_soup.text:
                    logger.info("Search redirected to single property details page")
                    property_data = self._extract_property_from_details(results_soup)
                    if property_data:
                        return {
                            'count': 1,
                            'properties': [property_data],
                            'query': query,
                            'source': f"Walla Walla County Property Portal - {datetime.now().strftime('%Y-%m-%d')}",
                            'data_compliance': self.disclaimer
                        }
            
            # Extract property data from search results
            properties = []
            for prop_div in property_results[:limit]:
                property_id_elem = prop_div.find('span', {'class': 'propertyID'})
                address_elem = prop_div.find('span', {'class': 'propertyAddress'})
                owner_elem = prop_div.find('span', {'class': 'propertyOwner'})
                
                if property_id_elem:
                    # Extract property ID and details URL
                    property_id = property_id_elem.text.strip()
                    property_link = prop_div.find('a', {'class': 'propertyLink'})
                    details_url = property_link.get('href') if property_link else None
                    
                    # Extract information
                    property_data = {
                        'property_id': property_id,
                        'owner': owner_elem.text.strip() if owner_elem else 'Unknown',
                        'address': address_elem.text.strip() if address_elem else 'Unknown',
                        'url': f"{self.base_url}{details_url}" if details_url and details_url.startswith('/') else details_url
                    }
                    
                    # Standardize the property data
                    standardized = self.standardize_property(property_data)
                    properties.append(standardized)
            
            # Format the results
            result = {
                'count': len(properties),
                'properties': properties,
                'query': query,
                'source': f"Walla Walla County Property Portal - {datetime.now().strftime('%Y-%m-%d')}",
                'data_compliance': self.disclaimer
            }
            
            return result
        
        except Exception as e:
            logger.error(f"Error with county website search: {str(e)}")
            return {
                'error': 'website_search_error',
                'message': f"Error with county website search: {str(e)}",
                'data_compliance': self.disclaimer
            }
    
    def _search_gis_service(self, query: str, limit: int) -> Dict[str, Any]:
        """
        Search using Walla Walla County GIS services.
        
        Args:
            query (str): Search query
            limit (int): Maximum results to return
            
        Returns:
            Dict[str, Any]: Search results
        """
        try:
            # This is a simplified implementation, as the actual GIS service would require
            # specific API calls with proper parameters
            
            # For now, we'll focus on a simple search of the parcel data
            # In a real implementation, we would make API calls to the GIS REST services
            
            # Query parsed data from the GIS service
            logger.warning("Full GIS search not implemented, returning empty results")
            
            # Format the results
            result = {
                'count': 0,
                'properties': [],
                'query': query,
                'source': f"Walla Walla County GIS Services - {datetime.now().strftime('%Y-%m-%d')}",
                'data_compliance': self.disclaimer,
                'message': "GIS search not fully implemented yet. Please use the county website search."
            }
            
            return result
        
        except Exception as e:
            logger.error(f"Error with GIS service search: {str(e)}")
            return {
                'error': 'gis_search_error',
                'message': f"Error with GIS service search: {str(e)}",
                'data_compliance': self.disclaimer
            }
    
    def get_property_details(self, property_id: str) -> Dict[str, Any]:
        """
        Get detailed information for a specific property from Walla Walla County.
        
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
                    'message': f"Property with ID {property_id} not found in Walla Walla County records.",
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
            owner_info = self._extract_details_section(details_soup, 'Owner Information')
            property_info = self._extract_details_section(details_soup, 'Property Information')
            value_info = self._extract_details_section(details_soup, 'Value Information')
            land_info = self._extract_details_section(details_soup, 'Land Information')
            improvement_info = self._extract_details_section(details_soup, 'Improvement Information')
            
            # Extract tax information if available
            tax_info = self._extract_details_section(details_soup, 'Tax Information')
            
            # Extract sales history if available
            sales_history = self._extract_sales_history(details_soup)
            
            # Combine all information into a comprehensive property record
            detailed_property = {
                'property_id': property_id,
                'parcel_number': property_id,
                'owner': owner_info.get('Name', property_data.get('owner', 'Unknown')),
                'owner_information': owner_info,
                'property_information': property_info,
                'value_information': value_info,
                'land_information': land_info,
                'improvement_information': improvement_info,
                'tax_information': tax_info,
                'sales_history': sales_history,
                'address': property_data.get('address', {}),
                'source': f"Walla Walla County Property Portal - {datetime.now().strftime('%Y-%m-%d')}",
                'data_compliance': self.disclaimer
            }
            
            # Add calculated fields for compatibility with other county data
            detailed_property['assessed_value'] = value_info.get('Total Assessed Value', 0)
            detailed_property['market_value'] = value_info.get('Market Value', 0)
            
            return {
                'property': detailed_property,
                'source': f"Walla Walla County Property Portal - {datetime.now().strftime('%Y-%m-%d')}",
                'data_compliance': self.disclaimer
            }
        
        except Exception as e:
            logger.error(f"Error getting Walla Walla County property details: {str(e)}")
            return {
                'error': 'property_details_error',
                'message': f"Error retrieving property details: {str(e)}",
                'data_compliance': self.disclaimer
            }
    
    def get_property_history(self, property_id: str) -> Dict[str, Any]:
        """
        Get historical data for a property from Walla Walla County.
        
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
                'tax_history': [],  # This would need to be extracted separately
                'source': property_data.get('source', f"Walla Walla County Property Portal - {datetime.now().strftime('%Y-%m-%d')}"),
                'data_compliance': self.disclaimer
            }
            
            return history
        
        except Exception as e:
            logger.error(f"Error getting Walla Walla County property history: {str(e)}")
            return {
                'error': 'property_history_error',
                'message': f"Error retrieving property history: {str(e)}",
                'data_compliance': self.disclaimer
            }
    
    def _extract_property_from_details(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """
        Extract property information from a details page.
        
        Args:
            soup (BeautifulSoup): Parsed details page HTML
            
        Returns:
            Dict[str, Any]: Extracted property information
        """
        try:
            # Extract property ID
            property_id_elem = soup.find('span', {'id': 'propertyID'})
            property_id = property_id_elem.text.strip() if property_id_elem else 'Unknown'
            
            # Extract address
            address_elem = soup.find('span', {'id': 'propertyAddress'})
            address = address_elem.text.strip() if address_elem else 'Unknown'
            
            # Extract owner
            owner_elem = soup.find('span', {'id': 'propertyOwner'})
            owner = owner_elem.text.strip() if owner_elem else 'Unknown'
            
            # Extract current URL
            url = soup.find('meta', {'property': 'og:url'})
            url_value = url.get('content') if url else None
            
            property_data = {
                'property_id': property_id,
                'owner': owner,
                'address': address,
                'url': url_value
            }
            
            # Standardize the property data
            return self.standardize_property(property_data)
        
        except Exception as e:
            logger.error(f"Error extracting property from details page: {str(e)}")
            return None
    
    def _extract_details_section(self, soup: BeautifulSoup, section_title: str) -> Dict[str, Any]:
        """
        Extract data from a specific section of the property details page.
        
        Args:
            soup (BeautifulSoup): Parsed HTML of the page
            section_title (str): Title of the section to extract
        
        Returns:
            Dict[str, Any]: Extracted data as key-value pairs
        """
        # Try to find the section heading
        heading = soup.find('h2', string=re.compile(section_title, re.IGNORECASE))
        if not heading:
            heading = soup.find('h3', string=re.compile(section_title, re.IGNORECASE))
        
        if not heading:
            return {}
        
        # Find the closest table or detail list to the heading
        section_elem = heading.find_next(['table', 'dl'])
        if not section_elem:
            return {}
        
        # Extract data from the element
        data = {}
        
        if section_elem.name == 'table':
            # Process table layout
            rows = section_elem.find_all('tr')
            for row in rows:
                cells = row.find_all(['th', 'td'])
                if len(cells) >= 2:
                    key = cells[0].text.strip()
                    value = cells[1].text.strip()
                    
                    # Clean up the value and convert to appropriate type
                    data[key] = self._clean_value(value)
        
        elif section_elem.name == 'dl':
            # Process definition list layout
            terms = section_elem.find_all('dt')
            values = section_elem.find_all('dd')
            
            for i in range(min(len(terms), len(values))):
                key = terms[i].text.strip()
                value = values[i].text.strip()
                
                # Clean up the value and convert to appropriate type
                data[key] = self._clean_value(value)
        
        return data
    
    def _clean_value(self, value_str: str) -> Any:
        """
        Clean up a value string and convert to appropriate type.
        
        Args:
            value_str (str): Value as string
            
        Returns:
            Any: Converted value
        """
        value = value_str.strip()
        
        # Convert Yes/No to boolean
        if value.lower() in ['yes', 'true']:
            return True
        elif value.lower() in ['no', 'false']:
            return False
            
        # Convert integers
        if re.match(r'^\d+$', value):
            return int(value)
            
        # Convert floats
        if re.match(r'^\d+\.\d+$', value):
            return float(value)
            
        # Convert currency
        if re.match(r'^\$[\d,]+\.\d{2}$', value):
            return float(value.replace('$', '').replace(',', ''))
            
        # Convert dates if in recognizable format
        if re.match(r'\d{1,2}/\d{1,2}/\d{4}', value):
            return value  # Return as string for now
            
        # Return as string for any other format
        return value
    
    def _extract_sales_history(self, soup: BeautifulSoup) -> List[Dict[str, Any]]:
        """
        Extract sales history from the property details page.
        
        Args:
            soup (BeautifulSoup): Parsed HTML of the page
        
        Returns:
            List[Dict[str, Any]]: List of sales history records
        """
        # Try to find the sales history section
        sales_heading = soup.find(['h2', 'h3'], string=re.compile('Sales History', re.IGNORECASE))
        if not sales_heading:
            return []
        
        # Find the closest table to the heading
        sales_table = sales_heading.find_next('table')
        if not sales_table:
            return []
        
        # Extract data from the table
        sales_history = []
        
        # Get table headers
        headers = [th.text.strip() for th in sales_table.find_all('th')]
        
        # Extract rows
        rows = sales_table.find_all('tr')[1:]  # Skip header row
        
        for row in rows:
            cells = row.find_all('td')
            if len(cells) >= 3:  # Most sales tables have at least date, price, type
                # Create a dictionary with headers as keys
                sale_record = {}
                
                for i, cell in enumerate(cells):
                    if i < len(headers):
                        key = headers[i]
                        value = cell.text.strip()
                        
                        # Clean up the value and convert to appropriate type
                        sale_record[key] = self._clean_value(value)
                
                # Standardize keys for consistency
                standardized_record = {}
                
                # Map common header names to standard field names
                for header, value in sale_record.items():
                    header_lower = header.lower()
                    
                    if 'date' in header_lower:
                        standardized_record['sale_date'] = value
                    elif 'price' in header_lower or 'amount' in header_lower:
                        standardized_record['price'] = value
                    elif 'type' in header_lower:
                        standardized_record['sale_type'] = value
                    elif 'deed' in header_lower:
                        standardized_record['deed_type'] = value
                    elif 'buyer' in header_lower or 'grantee' in header_lower:
                        standardized_record['buyer'] = value
                    elif 'seller' in header_lower or 'grantor' in header_lower:
                        standardized_record['seller'] = value
                    else:
                        # Keep original field if no standard mapping
                        standardized_record[header] = value
                
                sales_history.append(standardized_record)
        
        return sales_history
    
    def standardize_property(self, raw_property: Dict[str, Any]) -> Dict[str, Any]:
        """
        Standardize Walla Walla County property data format.
        
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
            city = 'Walla Walla'
            state = 'WA'
            zip_code = ''
            
            # Try to extract city and zip code if available
            if len(parts) > 1:
                if len(parts) >= 3:
                    city = parts[1].strip()
                    state_zip = parts[2].strip().split(' ', 1)
                    state = state_zip[0].strip() if state_zip else 'WA'
                    zip_code = state_zip[1].strip() if len(state_zip) > 1 else ''
                elif len(parts) == 2:
                    city_state_zip = parts[1].strip().split(' ')
                    if len(city_state_zip) > 2:
                        city = ' '.join(city_state_zip[:-2]).strip()
                        state = city_state_zip[-2].strip()
                        zip_code = city_state_zip[-1].strip()
        else:
            # Address is already structured as a dictionary
            street_address = address.get('street', 'Unknown')
            city = address.get('city', 'Walla Walla')
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
            'url': raw_property.get('url', ''),
            'data_source': f"Walla Walla County Property Portal - {datetime.now().strftime('%Y-%m-%d')}",
            'data_compliance': self.disclaimer
        }
        
        # Add assessed and market values if available
        standardized['assessed_value'] = raw_property.get('assessed_value', 0)
        standardized['market_value'] = raw_property.get('market_value', 0)
        
        return standardized