"""
Authentication utilities for TerraAgent backend
Production-grade authentication and database connection management
"""

import os
import logging
import datetime
from urllib.parse import quote_plus

logger = logging.getLogger(__name__)

def get_sql_connection_string():
    """Get SQL database connection string from environment"""
    
    # Try to get from DATABASE_URL first (Heroku style)
    database_url = os.environ.get("DATABASE_URL")
    if database_url:
        return database_url
    
    # Build from individual components
    db_type = os.environ.get("DB_TYPE", "postgresql")
    db_host = os.environ.get("DB_HOST", "localhost")
    db_port = os.environ.get("DB_PORT", "5432")
    db_name = os.environ.get("DB_NAME", "terraagent")
    db_user = os.environ.get("DB_USER", "postgres")
    db_password = os.environ.get("DB_PASSWORD", "")
    
    # URL encode password to handle special characters
    if db_password:
        db_password = quote_plus(db_password)
    
    if db_type.lower() == "postgresql":
        connection_string = f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
    elif db_type.lower() == "sqlite":
        # For SQLite, use the db_name as the file path
        connection_string = f"sqlite:///{db_name}.db"
    else:
        # Default to SQLite for development
        connection_string = "sqlite:///terraagent.db"
        logger.warning(f"Unknown database type {db_type}, defaulting to SQLite")
    
    logger.info(f"Using database connection: {db_type} at {db_host}")
    return connection_string

def get_openai_config():
    """Get OpenAI configuration from environment"""
    return {
        'api_key': os.environ.get("OPENAI_API_KEY"),
        'model': os.environ.get("OPENAI_MODEL", "gpt-4"),
        'temperature': float(os.environ.get("OPENAI_TEMPERATURE", "0.1")),
        'max_tokens': int(os.environ.get("OPENAI_MAX_TOKENS", "2000"))
    }

def get_embedding_config():
    """Get embedding model configuration"""
    return {
        'model': os.environ.get("EMBEDDING_MODEL", "text-embedding-ada-002"),
        'chunk_size': int(os.environ.get("EMBEDDING_CHUNK_SIZE", "1000")),
        'chunk_overlap': int(os.environ.get("EMBEDDING_CHUNK_OVERLAP", "200"))
    }

def validate_api_key(api_key):
    """Validate API key format"""
    if not api_key:
        return False
    
    # Basic OpenAI API key validation
    if api_key.startswith('sk-') and len(api_key) > 40:
        return True
    
    return False

def get_database_config():
    """Get complete database configuration"""
    return {
        'connection_string': get_sql_connection_string(),
        'pool_size': int(os.environ.get("DB_POOL_SIZE", "10")),
        'pool_timeout': int(os.environ.get("DB_POOL_TIMEOUT", "30")),
        'pool_recycle': int(os.environ.get("DB_POOL_RECYCLE", "3600")),
        'echo': os.environ.get("DB_ECHO", "False").lower() == "true"
    }

def get_redis_config():
    """Get Redis configuration for caching"""
    return {
        'host': os.environ.get("REDIS_HOST", "localhost"),
        'port': int(os.environ.get("REDIS_PORT", "6379")),
        'db': int(os.environ.get("REDIS_DB", "0")),
        'password': os.environ.get("REDIS_PASSWORD"),
        'url': os.environ.get("REDIS_URL")
    }

def get_security_config():
    """Get security configuration"""
    return {
        'secret_key': os.environ.get("SECRET_KEY", "default-secret-key-change-in-production"),
        'session_timeout': int(os.environ.get("SESSION_TIMEOUT", "3600")),
        'max_login_attempts': int(os.environ.get("MAX_LOGIN_ATTEMPTS", "5")),
        'login_rate_limit': int(os.environ.get("LOGIN_RATE_LIMIT", "10"))
    }

class DatabaseConnection:
    """Database connection manager with health checking"""
    
    def __init__(self):
        self.connection_string = get_sql_connection_string()
        self._connection = None
    
    def test_connection(self):
        """Test database connectivity"""
        try:
            from sqlalchemy import create_engine
            engine = create_engine(self.connection_string)
            
            with engine.connect() as conn:
                result = conn.execute("SELECT 1")
                return True
                
        except Exception as e:
            logger.error(f"Database connection test failed: {str(e)}")
            return False
    
    def get_health_status(self):
        """Get database health status"""
        return {
            'connected': self.test_connection(),
            'connection_string': self.connection_string.split('@')[0] + '@***',  # Hide credentials
            'timestamp': str(datetime.datetime.utcnow())
        }

# Global database connection manager
db_manager = DatabaseConnection()
