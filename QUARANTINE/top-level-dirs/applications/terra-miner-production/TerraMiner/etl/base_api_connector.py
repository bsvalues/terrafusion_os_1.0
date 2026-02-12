"""
Base API connector class for real estate data services.

This module defines the core interface that all specific API connectors must implement,
ensuring consistent behavior across different data sources.
"""

import os
import logging
import time
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional, Union

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class BaseApiConnector(ABC):
    """
    Abstract base class for real estate data API connectors.
    
    This class defines the required interface methods that all specific
    API connector implementations must provide, ensuring a consistent
    approach to accessing data across different sources.
    """
    
    def __init__(self, **kwargs):
        """
        Initialize the API connector with optional credentials and settings.
        
        Args:
            **kwargs: Additional connector-specific configuration options
        """
        self.name = self.__class__.__name__
        self.rate_limit_remaining = None
        self.rate_limit_reset = None
        self.last_request_time = 0
        self.min_request_interval = kwargs.get('min_request_interval', 1.0)  # Default 1 second
        self.is_authenticated = False
        self.source_priority = kwargs.get('priority', 'secondary')
        
        # Initialize connector metrics
        self.metrics = {
            'requests': 0,
            'errors': 0,
            'timeouts': 0,
            'rate_limit_hits': 0,
            'total_response_time': 0,
        }
    
    def _throttle_requests(self):
        """
        Throttle requests to avoid hitting rate limits.
        
        This method ensures that requests are not sent too frequently,
        based on the minimum request interval configured for this connector.
        """
        elapsed = time.time() - self.last_request_time
        if elapsed < self.min_request_interval:
            sleep_time = self.min_request_interval - elapsed
            logger.debug(f"Throttling {self.name} request for {sleep_time:.2f}s")
            time.sleep(sleep_time)
        
        self.last_request_time = time.time()
    
    def _update_rate_limits(self, headers: Dict):
        """
        Update rate limit information from response headers.
        
        Args:
            headers (Dict): Response headers that may contain rate limit information
        """
        # This is a default implementation that can be overridden by specific connectors
        # to handle source-specific rate limit headers
        if 'X-RateLimit-Remaining' in headers:
            self.rate_limit_remaining = int(headers['X-RateLimit-Remaining'])
        
        if 'X-RateLimit-Reset' in headers:
            self.rate_limit_reset = int(headers['X-RateLimit-Reset'])
    
    def _update_metrics(self, success: bool, response_time: float, error_type: Optional[str] = None):
        """
        Update request metrics for monitoring and diagnostics.
        
        Args:
            success (bool): Whether the request was successful
            response_time (float): Time taken for the request in seconds
            error_type (str, optional): Type of error if request failed
        """
        self.metrics['requests'] += 1
        self.metrics['total_response_time'] += response_time
        
        if not success:
            self.metrics['errors'] += 1
            
            if error_type == 'timeout':
                self.metrics['timeouts'] += 1
            elif error_type == 'rate_limit':
                self.metrics['rate_limit_hits'] += 1
    
    def get_metrics(self) -> Dict[str, Any]:
        """
        Get current metrics for this connector.
        
        Returns:
            Dict[str, Any]: Current metrics data
        """
        # Calculate derived metrics
        request_count = self.metrics['requests']
        metrics = {**self.metrics}  # Create a copy of the metrics
        
        # Add average response time if we have any requests
        if request_count > 0:
            metrics['avg_response_time'] = self.metrics['total_response_time'] / request_count
            metrics['error_rate'] = self.metrics['errors'] / request_count
        else:
            metrics['avg_response_time'] = 0
            metrics['error_rate'] = 0
        
        return metrics
    
    def reset_metrics(self):
        """Reset all metrics counters to zero."""
        for key in self.metrics:
            self.metrics[key] = 0
    
    def get_health_status(self) -> Dict[str, Any]:
        """
        Get the current health status of this data source connector.
        
        Returns:
            Dict[str, Any]: Health status information
        """
        metrics = self.get_metrics()
        request_count = metrics['requests']
        
        if request_count == 0:
            status = 'unknown'
        elif metrics['error_rate'] > 0.5:  # More than 50% error rate
            status = 'critical'
        elif metrics['error_rate'] > 0.2:  # More than 20% error rate
            status = 'degraded'
        elif self.rate_limit_remaining is not None and self.rate_limit_remaining < 10:
            status = 'limited'
        else:
            status = 'healthy'
        
        return {
            'status': status,
            'metrics': metrics,
            'rate_limit': {
                'remaining': self.rate_limit_remaining,
                'reset': self.rate_limit_reset
            },
            'is_authenticated': self.is_authenticated
        }
    
    def test_connection(self) -> Dict[str, Any]:
        """
        Test the connection to the API to verify credentials and availability.
        
        This is a common implementation that can be overridden by specific connectors
        if they need custom testing logic. The default implementation tries to make
        a simple search request to verify connectivity.
        
        Returns:
            Dict[str, Any]: Connection test results with success status and response time
        """
        start_time = time.time()
        try:
            # Try a minimal property search to test the connection
            test_location = "10001"  # Use NYC ZIP code as a test
            test_response = self.search_properties(test_location, limit=1)
            
            # Check if response contains any error indicators
            if isinstance(test_response, dict) and test_response.get('error'):
                response_time = time.time() - start_time
                return {
                    'success': False, 
                    'message': f"API Error: {test_response.get('error')}",
                    'response_time': response_time * 1000  # Convert to milliseconds
                }
            
            # Success case
            response_time = time.time() - start_time
            return {
                'success': True,
                'message': f"Successfully connected to {self.__class__.__name__} API",
                'response_time': response_time * 1000  # Convert to milliseconds
            }
            
        except Exception as e:
            response_time = time.time() - start_time
            logger.error(f"Connection test failed for {self.__class__.__name__}: {str(e)}")
            return {
                'success': False,
                'message': f"Connection error: {str(e)}",
                'response_time': response_time * 1000  # Convert to milliseconds
            }
    
    @abstractmethod
    def search_properties(self, location: str, **kwargs) -> Dict[str, Any]:
        """
        Search for properties in a specific location.
        
        Args:
            location (str): Location to search (city, zip code, address, etc.)
            **kwargs: Additional search parameters
            
        Returns:
            Dict[str, Any]: Search results
        """
        pass
    
    @abstractmethod
    def get_property_details(self, property_id: str) -> Dict[str, Any]:
        """
        Get detailed information for a specific property.
        
        Args:
            property_id (str): Property identifier
            
        Returns:
            Dict[str, Any]: Property details
        """
        pass
    
    @abstractmethod
    def get_market_trends(self, location: str, **kwargs) -> Dict[str, Any]:
        """
        Get market trends data for a specific location.
        
        Args:
            location (str): Location to analyze (city, zip code, etc.)
            **kwargs: Additional parameters
            
        Returns:
            Dict[str, Any]: Market trend data
        """
        pass
    
    @abstractmethod
    def standardize_property(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Convert provider-specific property data to a standardized format.
        
        Args:
            data (Dict[str, Any]): Original property data from the provider
            
        Returns:
            Dict[str, Any]: Standardized property data
        """
        pass
    
    def close(self):
        """
        Close the connector and clean up any resources.
        This method can be overridden by specific connectors if needed.
        """
        logger.info(f"{self.name} session closed")
        pass