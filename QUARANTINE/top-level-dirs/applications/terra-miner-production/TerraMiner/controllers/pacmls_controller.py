"""
PACMLS Integration Controller.

This module provides routes for the PACMLS integration UI.
"""

import os
import logging
import requests
from flask import Blueprint, render_template, redirect, url_for, flash, current_app, request
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Create a Flask Blueprint
pacmls_controller = Blueprint('pacmls_controller', __name__, url_prefix='/integrations')

@pacmls_controller.route('/pacmls', methods=['GET'])
def pacmls_manager():
    """
    PACMLS integration management page.
    
    This page allows users to configure and test the PACMLS integration.
    """
    # Load environment variables
    load_dotenv()
    
    # Get current configuration
    username = os.environ.get('PACMLS_USERNAME', '')
    password = os.environ.get('PACMLS_PASSWORD', '')
    priority = os.environ.get('PACMLS_PRIORITY', 'secondary')
    
    # Determine the connection status
    status = 'inactive'
    if username and password:
        try:
            # Try to get status from API
            response = requests.get(
                f"{request.host_url.rstrip('/')}/api/pacmls/status"
            )
            
            if response.status_code == 200:
                data = response.json()
                status = data.get('status', 'inactive')
            else:
                logger.error(f"Error fetching PACMLS status: {response.text}")
        except Exception as e:
            logger.error(f"Error checking PACMLS status: {e}")
    
    # Determine primary data source
    primary_source = 'zillow'  # Default
    if priority == 'primary':
        primary_source = 'pacmls'
    
    # Determine listings count (if connected)
    pacmls_listings = None
    if status == 'active':
        try:
            # Get a sample search to determine if we can get listings
            location = "Seattle, WA"  # Default location for testing
            response = requests.get(
                f"{request.host_url.rstrip('/')}/api/pacmls/search",
                params={'location': location, 'limit': 1}
            )
            
            if response.status_code == 200:
                data = response.json()
                # Just check if we can access listings, don't display actual count from sample
                if 'listings' in data and isinstance(data['listings'], list):
                    # Set a placeholder value or fetch actual total if available
                    pacmls_listings = data.get('total_listings', 'Available')
        except Exception as e:
            logger.error(f"Error checking PACMLS listings: {e}")
    
    # Dummy data for other sources
    zillow_status = 'active' if os.environ.get('RAPIDAPI_KEY') else 'inactive'
    county_status = 'active'  # Assuming county data is always available
    narrpr_status = 'warning'  # Assuming NARRPR is partially implemented
    
    # Render the template
    return render_template(
        'integrations/pacmls_manager.html',
        pacmls_username=username,
        pacmls_password='********' if password else '',  # Don't send actual password to UI
        pacmls_priority=priority,
        pacmls_status=status,
        primary_source=primary_source,
        pacmls_listings=pacmls_listings,
        pacmls_rank=1 if priority == 'primary' else 2,
        zillow_status=zillow_status,
        county_status=county_status,
        narrpr_status=narrpr_status
    )

@pacmls_controller.route('/pacmls/save-config', methods=['POST'])
def save_pacmls_config():
    """
    Save PACMLS configuration.
    
    This route handles the form submission to save PACMLS credentials.
    """
    try:
        # Forward the request to the API endpoint
        response = requests.post(
            f"{request.host_url.rstrip('/')}/api/pacmls/save-config",
            data=request.form
        )
        
        # Process the response
        data = response.json()
        
        if response.status_code == 200 and data.get('success'):
            flash('PACMLS configuration saved successfully!', 'success')
        else:
            flash(f"Error saving configuration: {data.get('message', 'Unknown error')}", 'error')
        
        return redirect(url_for('pacmls_controller.pacmls_manager'))
        
    except Exception as e:
        logger.error(f"Error saving PACMLS configuration: {e}")
        flash(f"Error: {str(e)}", 'error')
        return redirect(url_for('pacmls_controller.pacmls_manager'))