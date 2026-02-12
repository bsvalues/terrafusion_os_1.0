#!/usr/bin/env python3
"""
Health Checker Script

This script is used to verify the health of a deployed GeoAssessmentPro instance.
It performs various checks to ensure the application is fully operational.
"""

import argparse
import json
import logging
import os
import sys
import time
from urllib.parse import urljoin
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('health_checker')

def parse_args():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description='Check GeoAssessmentPro health')
    parser.add_argument('--url', required=True, help='Base URL of the application')
    parser.add_argument('--timeout', type=int, default=300, help='Maximum time to wait in seconds')
    parser.add_argument('--interval', type=int, default=5, help='Check interval in seconds')
    parser.add_argument('--auth-token', help='Authentication token for protected endpoints')
    parser.add_argument('--check-db', action='store_true', help='Check database connection')
    parser.add_argument('--check-gis', action='store_true', help='Check GIS functionality')
    parser.add_argument('--verbose', '-v', action='store_true', help='Verbose output')
    return parser.parse_args()

def check_endpoint(url, auth_token=None, check_json=False):
    """Check if an endpoint is available and returns expected response"""
    headers = {}
    if auth_token:
        headers['Authorization'] = f'Bearer {auth_token}'
    
    try:
        req = Request(url, headers=headers)
        with urlopen(req, timeout=10) as response:
            status = response.status
            content = response.read()
            
            if check_json:
                try:
                    json_content = json.loads(content)
                    return status == 200 and 'status' in json_content
                except json.JSONDecodeError:
                    logger.error(f"Invalid JSON response from {url}")
                    return False
            
            return status == 200
    except HTTPError as e:
        logger.error(f"HTTP Error: {e.code} - {url}")
        return False
    except URLError as e:
        logger.error(f"URL Error: {e.reason} - {url}")
        return False
    except Exception as e:
        logger.error(f"Error checking {url}: {e}")
        return False

def check_health(base_url, auth_token=None):
    """Check application health endpoints"""
    # Basic health check
    health_url = urljoin(base_url, '/health')
    basic_health = check_endpoint(health_url, auth_token, check_json=True)
    
    if not basic_health:
        logger.error("Basic health check failed")
        return False
    
    # Check other critical endpoints
    endpoints = [
        '/',                 # Main page
        '/login',            # Login page
        '/static/css/styles.css',  # Static assets
        '/api-tester'        # API tester page
    ]
    
    for endpoint in endpoints:
        url = urljoin(base_url, endpoint)
        if not check_endpoint(url, auth_token):
            logger.error(f"Endpoint check failed: {endpoint}")
            return False
    
    logger.info("All health checks passed")
    return True

def check_database(base_url, auth_token):
    """Check database connection"""
    db_health_url = urljoin(base_url, '/health/database')
    
    if not check_endpoint(db_health_url, auth_token, check_json=True):
        logger.error("Database health check failed")
        return False
    
    logger.info("Database health check passed")
    return True

def check_gis(base_url, auth_token):
    """Check GIS functionality"""
    gis_health_url = urljoin(base_url, '/health/gis')
    
    if not check_endpoint(gis_health_url, auth_token, check_json=True):
        logger.error("GIS health check failed")
        return False
    
    logger.info("GIS health check passed")
    return True

def main():
    """Main function"""
    args = parse_args()
    
    if args.verbose:
        logger.setLevel(logging.DEBUG)
    
    base_url = args.url.rstrip('/')
    logger.info(f"Starting health checks for {base_url}")
    
    start_time = time.time()
    
    while time.time() - start_time < args.timeout:
        try:
            # Always check basic health
            if check_health(base_url, args.auth_token):
                # Additional checks if requested
                if args.check_db:
                    if not check_database(base_url, args.auth_token):
                        continue
                
                if args.check_gis:
                    if not check_gis(base_url, args.auth_token):
                        continue
                
                logger.info("All health checks passed!")
                return 0
        except Exception as e:
            logger.error(f"Error during health check: {e}")
        
        # Wait before next check
        logger.info(f"Waiting {args.interval} seconds before next check...")
        time.sleep(args.interval)
    
    # If we get here, we've timed out
    logger.error(f"Health check timed out after {args.timeout} seconds")
    return 1

if __name__ == "__main__":
    sys.exit(main())