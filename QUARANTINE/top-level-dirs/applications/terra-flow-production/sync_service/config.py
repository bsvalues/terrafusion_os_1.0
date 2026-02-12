"""
Configuration for the Sync Service module.
"""
import os

# Database connection strings
PROD_CLONE_DB_URI = os.environ.get('PROD_CLONE_DB_URI', None)
TRAINING_DB_URI = os.environ.get('TRAINING_DB_URI', None)

# MS SQL Server connection string for property export
# Format: 'DRIVER={ODBC Driver 17 for SQL Server};SERVER=server_name;DATABASE=pacs_oltp;UID=username;PWD=password;'
SQL_SERVER_CONNECTION_STRING = os.environ.get('SQL_SERVER_CONNECTION_STRING', None)

# Default to the main application's database for configuration
CONFIG_DB_URI = os.environ.get('DATABASE_URL')

# Sync configuration
SYNC_INTERVAL_MINUTES = int(os.environ.get('SYNC_INTERVAL_MINUTES', 30))
BATCH_SIZE = int(os.environ.get('SYNC_BATCH_SIZE', 1000))

# Error handling configuration
MAX_RETRIES = int(os.environ.get('SYNC_MAX_RETRIES', 3))
ERROR_WAIT_SECONDS = int(os.environ.get('SYNC_ERROR_WAIT_SECONDS', 60))

# API Gateway configuration
API_GATEWAY_URL = os.environ.get('API_GATEWAY_URL', 'http://localhost:5000/api')
API_KEY = os.environ.get('SYNC_API_KEY', None)

# Logging
LOG_LEVEL = os.environ.get('SYNC_LOG_LEVEL', 'INFO')
LOG_FILE = os.environ.get('SYNC_LOG_FILE', 'sync_service.log')

# Default AD groups to roles mapping for sync service
SYNC_ADMIN_ROLE = 'administrator'
SYNC_OPERATOR_ROLE = 'assessor'
SYNC_VIEWER_ROLE = 'readonly'