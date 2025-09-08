"""
Application configuration settings for different environments.

This module provides configuration classes for different deployment environments:
- Development: Default configuration for local development
- Testing: Configuration for automated testing
- Production: Configuration for production deployment

Usage:
    # Set the configuration based on the FLASK_ENV environment variable
    app.config.from_object(config.config_by_name[os.getenv('FLASK_ENV', 'development')])
"""

import os
import logging
from datetime import timedelta

# Base directory of the application
basedir = os.path.abspath(os.path.dirname(__file__))

class Config:
    """Base configuration with common settings."""
    SECRET_KEY = os.environ.get('SESSION_SECRET') or 'dev-secret-key'
    
    # SQLAlchemy settings
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_recycle": 300,
        "pool_pre_ping": True,
    }
    
    # Migration settings
    MIGRATION_DIR = os.path.join(basedir, 'migrations')
    
    # Default application settings
    DEBUG = False
    TESTING = False
    
    # Logging configuration
    LOG_LEVEL = logging.INFO
    LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    
    # Session configuration
    SESSION_TYPE = 'filesystem'
    SESSION_PERMANENT = True
    PERMANENT_SESSION_LIFETIME = timedelta(days=1)
    
    # MCP configuration
    ENABLE_MCP = os.environ.get('ENABLE_MCP', 'true').lower() in ('true', '1', 'yes')
    
    @staticmethod
    def init_app(app):
        """Initialize application with this configuration."""
        pass


class DevelopmentConfig(Config):
    """Development environment configuration."""
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///levy.db')
    LOG_LEVEL = logging.DEBUG
    
    @classmethod
    def init_app(cls, app):
        """Initialize application with development configuration."""
        Config.init_app(app)
        
        # Log to console in development
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(logging.Formatter(cls.LOG_FORMAT))
        app.logger.addHandler(console_handler)
        app.logger.setLevel(cls.LOG_LEVEL)


class TestingConfig(Config):
    """Testing environment configuration."""
    TESTING = True
    DEBUG = True
    
    # Use in-memory SQLite database for testing
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///:memory:')
    
    # Disable CSRF protection for testing
    WTF_CSRF_ENABLED = False


class ProductionConfig(Config):
    """Production environment configuration."""
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
    
    # More restrictive session settings for production
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    
    # Use a real secret key in production
    SECRET_KEY = os.environ.get('SESSION_SECRET')
    
    # Error logging configuration
    LOG_LEVEL = logging.ERROR
    
    @classmethod
    def init_app(cls, app):
        """Initialize application with production configuration."""
        Config.init_app(app)
        
        # Set up structured logging
        import logging
        from logging.handlers import RotatingFileHandler
        
        # Ensure log directory exists
        log_dir = os.path.join(basedir, 'logs')
        if not os.path.exists(log_dir):
            os.makedirs(log_dir)
        
        # Configure file logging
        file_handler = RotatingFileHandler(
            os.path.join(log_dir, 'app.log'),
            maxBytes=10 * 1024 * 1024,  # 10 MB
            backupCount=10
        )
        file_handler.setFormatter(logging.Formatter(cls.LOG_FORMAT))
        file_handler.setLevel(cls.LOG_LEVEL)
        
        # Add handlers to app logger
        app.logger.addHandler(file_handler)
        app.logger.setLevel(cls.LOG_LEVEL)


# Create a mapping of environment names to configuration classes
config_by_name = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    
    # Default to development config
    'default': DevelopmentConfig
}