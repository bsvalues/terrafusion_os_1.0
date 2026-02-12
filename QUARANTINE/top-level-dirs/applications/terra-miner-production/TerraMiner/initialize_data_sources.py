"""
Initialize data sources in the database.
This script will populate the data_source_status table with the required data sources.
"""
import os
import sys
from datetime import datetime

# Add the project root directory to the Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from db import db
from models.property import DataSourceStatus

def initialize_data_sources():
    """Initialize data sources in the database."""
    # Check if data sources already exist
    source_count = DataSourceStatus.query.count()
    if source_count > 0:
        print(f"Data sources already initialized. Found {source_count} sources.")
        return
    
    # Define the data sources we need
    sources = [
        {
            'source_name': 'zillow',
            'status': 'healthy',
            'is_active': True,
            'priority': 'primary',
            'success_rate': 93.0,
            'avg_response_time': 0.8,
            'error_count': 87,
            'request_count': 1254,
            'last_check': datetime.utcnow(),
            'credentials_configured': True,
            'settings_configured': True
        },
        {
            'source_name': 'realtor',
            'status': 'degraded',
            'is_active': True,
            'priority': 'secondary',
            'success_rate': 85.0,
            'avg_response_time': 1.2,
            'error_count': 148,
            'request_count': 987,
            'last_check': datetime.utcnow(),
            'credentials_configured': True,
            'settings_configured': True
        },
        {
            'source_name': 'pacmls',
            'status': 'limited',
            'is_active': True,
            'priority': 'tertiary',
            'success_rate': 78.0,
            'avg_response_time': 0.5,
            'error_count': 119,
            'request_count': 542,
            'last_check': datetime.utcnow(),
            'credentials_configured': True,
            'settings_configured': True
        },
        {
            'source_name': 'county',
            'status': 'critical',
            'is_active': False,
            'priority': 'fallback',
            'success_rate': 65.0,
            'avg_response_time': 1.7,
            'error_count': 112,
            'request_count': 321,
            'last_check': datetime.utcnow(),
            'credentials_configured': False,
            'settings_configured': True
        }
    ]
    
    # Add sources to the database
    for source_data in sources:
        source = DataSourceStatus(**source_data)
        db.session.add(source)
    
    # Commit the changes
    try:
        db.session.commit()
        print(f"Successfully initialized {len(sources)} data sources.")
    except Exception as e:
        db.session.rollback()
        print(f"Error initializing data sources: {str(e)}")

if __name__ == "__main__":
    # Import Flask app to get application context
    from main import app
    
    # Initialize the database
    with app.app_context():
        initialize_data_sources()