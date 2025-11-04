"""
API Credential Management Controller

This module provides routes for managing API credentials for data sources in TerraMiner.
"""

import json
import logging
from datetime import datetime
from flask import Blueprint, render_template, jsonify, request, redirect, url_for, flash, current_app, session
from typing import Dict, Any, List
from middleware.auth import require_role
import os

from db import db
from models.api_credential import ApiCredential
from etl.real_estate_data_connector import RealEstateDataConnector

def send_alert(message):
    # Placeholder for future alert integration (email/Slack/etc.)
    logger.warning(f"ALERT: {message}")

def audit_log(action, source, user=None):
    log_entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "user": user or session.get('user', {}).get('username', 'anonymous'),
        "action": action,
        "source": source
    }
    log_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'logs')
    os.makedirs(log_dir, exist_ok=True)
    log_path = os.path.join(log_dir, 'credential_audit.log')
    with open(log_path, 'a') as f:
        f.write(json.dumps(log_entry) + '\n')

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Create blueprint
api_credential_bp = Blueprint('api_credentials', __name__, url_prefix='/api-credentials')

# Available credential fields for each data source
SOURCE_CREDENTIAL_CONFIG = {
    'zillow': {
        'required': ['api_key'],
        'optional': ['client_id'],
        'description': 'Zillow API provides comprehensive property listings, home values, and market trends data.',
        'instructions': 'To get a Zillow API key, you need to register at RapidAPI and subscribe to the Zillow API.'
    },
    'realtor': {
        'required': ['api_key'],
        'optional': [],
        'description': 'Realtor.com API offers property listings, details, and market information via RapidAPI.',
        'instructions': 'To get a Realtor.com API key, you need to register at RapidAPI and subscribe to the Realtor API.'
    },
    'pacmls': {
        'required': ['username', 'password'],
        'optional': ['base_url'],
        'description': 'PACMLS (Paragon Connect MLS) provides access to MLS listing data with the most up-to-date property information.',
        'instructions': 'You need valid PACMLS credentials to access this data source. Contact your MLS administrator for access.'
    },
    'county': {
        'required': ['api_key'],
        'optional': ['base_url'],
        'description': 'County property records provide official tax and assessment data directly from local government sources.',
        'instructions': 'County API access varies by location. Contact your local county assessor\'s office for API access.'
    },
    'attom': {
        'required': ['api_key'],
        'optional': [],
        'description': 'ATTOM Data Solutions provides comprehensive property data including ownership, tax assessments, and more.',
        'instructions': 'Sign up at ATTOM Data Solutions (https://www.attomdata.com/) to get API access.'
    },
    'redfin': {
        'required': [],
        'optional': ['api_key'],
        'description': 'Redfin offers property listings and market data through their API.',
        'instructions': 'Redfin does not offer an official public API. This connector uses their web interface.'
    },
    'hud': {
        'required': ['api_key'],
        'optional': [],
        'description': 'HUD (Housing & Urban Development) provides housing data including Fair Market Rents and Income Limits.',
        'instructions': 'Register at HUD User (https://www.huduser.gov/hudapi/) to get a token.'
    },
    'corelogic': {
        'required': ['api_key', 'client_id'],
        'optional': ['client_secret'],
        'description': 'CoreLogic offers property intelligence, analytics, and data-enabled solutions.',
        'instructions': 'Contact CoreLogic sales to get API access credentials.'
    },
    'auction': {
        'required': ['username', 'password'],
        'optional': [],
        'description': 'Auction.com provides access to foreclosure and bank-owned property auctions.',
        'instructions': 'Register at Auction.com to get access credentials.'
    }
}

@api_credential_bp.route('/')
def index():
    """Render the API credential management page."""
    try:
        # Get all credentials
        credentials = ApiCredential.get_all_sources()
        
        # Get real estate connector for source info
        real_estate_connector = None
        try:
            real_estate_connector = current_app._real_estate_connector
        except:
            real_estate_connector = RealEstateDataConnector()
        
        # Get available sources
        available_sources = []
        for source, config in SOURCE_CREDENTIAL_CONFIG.items():
            # Check if connector exists
            connector = real_estate_connector.connectors.get(source)
            connector_status = "active" if connector else "not_implemented"
            
            # Check if credentials exist
            cred = next((c for c in credentials if c.source_name == source), None)
            
            available_sources.append({
                'name': source,
                'description': config.get('description', ''),
                'instructions': config.get('instructions', ''),
                'required_fields': config.get('required', []),
                'optional_fields': config.get('optional', []),
                'has_credentials': cred is not None,
                'credentials_id': cred.id if cred else None,
                'is_enabled': cred.is_enabled if cred else False,
                'connector_status': connector_status
            })
        
        return render_template(
            'api_credentials/index.html',
            available_sources=available_sources,
            credentials=credentials
        )
    except Exception as e:
        logger.error(f"Error rendering API credentials page: {str(e)}")
        flash(f"Error loading API credentials: {str(e)}", "error")
        return render_template('error.html', error=str(e))

@api_credential_bp.route('/create/<source_name>', methods=['GET'])
@require_role('admin')
def create_form(source_name):
    """Show form to create API credentials for a data source."""
    if source_name not in SOURCE_CREDENTIAL_CONFIG:
        flash(f"Unknown data source: {source_name}", "error")
        return redirect(url_for('api_credentials.index'))
    
    # Get existing credentials if any
    credential = ApiCredential.get_by_source(source_name)
    
    # Get config for this source
    config = SOURCE_CREDENTIAL_CONFIG.get(source_name, {})
    
    return render_template(
        'api_credentials/form.html',
        source_name=source_name,
        credential=credential,
        config=config,
        is_edit=credential is not None
    )

@api_credential_bp.route('/save', methods=['POST'])
@require_role('admin')
def save():
    """Save API credentials for a data source."""
    source_name = request.form.get('source_name')
    
    if not source_name or source_name not in SOURCE_CREDENTIAL_CONFIG:
        logger.error("Invalid data source specified")
        if request.is_json or request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return jsonify({"success": False, "message": "Invalid data source specified"}), 400
        flash("Invalid data source specified", "error")
        return redirect(url_for('api_credentials.index'))
    
    try:
        # Check if credentials already exist
        credential = ApiCredential.get_by_source(source_name)
        if not credential:
            credential = ApiCredential(source_name=source_name)
            db.session.add(credential)
        
        # Update credential fields
        credential_fields = [
            'api_key', 'username', 'password', 'client_id', 
            'client_secret', 'base_url'
        ]
        
        for field in credential_fields:
            value = request.form.get(field)
            if value:
                setattr(credential, field, value)
        
        # Handle additional credentials (json)
        additional_creds = request.form.get('additional_credentials')
        if additional_creds:
            try:
                # Validate JSON
                json.loads(additional_creds)
                credential.additional_credentials = additional_creds
            except json.JSONDecodeError:
                logger.error("Additional credentials must be valid JSON")
                if request.is_json or request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                    return jsonify({"success": False, "message": "Additional credentials must be valid JSON"}), 400
                flash("Additional credentials must be valid JSON", "error")
                return redirect(url_for('api_credentials.create_form', source_name=source_name))
        
        # Set enabled status
        is_enabled = request.form.get('is_enabled') == 'true'
        credential.is_enabled = is_enabled
        
        db.session.commit()
        audit_log('save', source_name)
        
        # Update the data source status to indicate credentials are configured
        try:
            from models.property import DataSourceStatus
            status = DataSourceStatus.query.filter_by(source_name=source_name).first()
            if status:
                status.credentials_configured = True
                db.session.commit()
        except Exception as e:
            logger.error(f"Error updating data source status: {str(e)}")
        
        # Reset connector initialization to use new credentials
        try:
            real_estate_connector = current_app._real_estate_connector
            # Force connector reload
            real_estate_connector._load_connectors()
        except Exception as e:
            logger.error(f"Error reloading connectors: {str(e)}")
        
        flash(f"Credentials for {source_name} successfully saved", "success")
        return redirect(url_for('api_credentials.index'))
        
    except Exception as e:
        logger.error(f"Error saving credentials: {str(e)}")
        send_alert(f"Error saving credentials for {source_name}: {str(e)}")
        if request.is_json or request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return jsonify({"success": False, "message": f"Error saving credentials: {str(e)}"}), 500
        flash(f"Error saving credentials: {str(e)}", "error")
        return redirect(url_for('api_credentials.create_form', source_name=source_name))

@api_credential_bp.route('/delete/<int:credential_id>', methods=['POST'])
@require_role('admin')
def delete(credential_id):
    """Delete API credentials for a data source."""
    try:
        credential = ApiCredential.query.get(credential_id)
        if not credential:
            logger.error("Credentials not found for deletion")
            if request.is_json or request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return jsonify({"success": False, "message": "Credentials not found"}), 404
            flash("Credentials not found", "error")
            return redirect(url_for('api_credentials.index'))
        
        source_name = credential.source_name
        db.session.delete(credential)
        audit_log('delete', source_name)
        
        # Update the data source status to indicate credentials are not configured
        try:
            from models.property import DataSourceStatus
            status = DataSourceStatus.query.filter_by(source_name=source_name).first()
            if status:
                status.credentials_configured = False
                db.session.commit()
        except Exception as e:
            logger.error(f"Error updating data source status: {str(e)}")
        
        db.session.commit()
        
        # Reset connector initialization
        try:
            real_estate_connector = current_app._real_estate_connector
            # Force connector reload
            real_estate_connector._load_connectors()
        except Exception as e:
            logger.error(f"Error reloading connectors: {str(e)}")
        
        flash(f"Credentials for {source_name} deleted successfully", "success")
        
    except Exception as e:
        logger.error(f"Error deleting credentials: {str(e)}")
        send_alert(f"Error deleting credentials: {str(e)}")
        if request.is_json or request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return jsonify({"success": False, "message": f"Error deleting credentials: {str(e)}"}), 500
        flash(f"Error deleting credentials: {str(e)}", "error")
    
    return redirect(url_for('api_credentials.index'))

@api_credential_bp.route('/toggle/<int:credential_id>', methods=['POST'])
@require_role('admin')
def toggle(credential_id):
    """Toggle enabled status for API credentials."""
    try:
        credential = ApiCredential.query.get(credential_id)
        if not credential:
            logger.error("Credentials not found for toggle")
            return jsonify({"success": False, "message": "Credentials not found"}), 404
        
        # Toggle enabled status
        credential.is_enabled = not credential.is_enabled
        db.session.commit()
        audit_log('toggle', credential.source_name)
        
        # Reset connector initialization
        try:
            real_estate_connector = current_app._real_estate_connector
            # Force connector reload
            real_estate_connector._load_connectors()
        except Exception as e:
            logger.error(f"Error reloading connectors: {str(e)}")
        
        return jsonify({
            "success": True, 
            "is_enabled": credential.is_enabled,
            "message": f"{credential.source_name} {'enabled' if credential.is_enabled else 'disabled'}"
        })
        
    except Exception as e:
        logger.error(f"Error toggling credentials: {str(e)}")
        send_alert(f"Error toggling credentials: {str(e)}")
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500

@api_credential_bp.route('/test/<source_name>', methods=['POST'])
def test_connection(source_name):
    """Test the connection to a data source using stored credentials."""
    try:
        # Get real estate connector
        real_estate_connector = None
        try:
            real_estate_connector = current_app._real_estate_connector
        except:
            real_estate_connector = RealEstateDataConnector()
        
        # Get the connector for this source
        connector = real_estate_connector.connectors.get(source_name)
        if not connector:
            return jsonify({
                "success": False,
                "message": f"Data source '{source_name}' is not implemented or not available"
            })
        
        # Test the connection
        test_result = connector.test_connection()
        
        return jsonify({
            "success": test_result.get('success', False),
            "message": test_result.get('message', 'Unknown error'),
            "response_time": test_result.get('response_time', 0)
        })
        
    except Exception as e:
        logger.error(f"Error testing connection: {str(e)}")
        send_alert(f"Error testing connection for {source_name}: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error testing connection: {str(e)}"
        }), 500

def register_blueprint(app):
    """Register the API credential blueprint with the application."""
    app.register_blueprint(api_credential_bp)
    logger.info("Registered API credential management blueprint")