"""
Configuration Loader

This module loads configuration settings from environment variables, config files,
and provides access to them throughout the application.
"""

import os
import logging
import json
from typing import Dict, Any, Optional

# Configure logging
logger = logging.getLogger(__name__)

# Default configuration
DEFAULT_CONFIG = {
    "env_mode": "development",  # development, training, production
    "database": {
        "engine": "postgresql",
        "connection_string": "postgresql://postgres:postgres@localhost:5432/postgres"
    },
    "training_db": {
        "engine": "sqlserver",
        "connection_string": "Driver={ODBC Driver 17 for SQL Server};Server=localhost;Database=training;UID=sa;PWD=password"
    },
    "production_db": {
        "engine": "postgresql",
        "connection_string": "postgresql://postgres:postgres@localhost:5432/production"
    },
    "auth": {
        "provider": "supabase",
        "bypass_auth": False
    },
    "storage": {
        "provider": "supabase",
        "bucket_name": "files"
    },
    "api": {
        "use_supabase_api": True
    },
    "sync": {
        "interval": 60,  # minutes
        "auto_sync": False,
        "batch_size": 100,
        "log_level": "INFO",
        "enable_change_tracking": True,
        "enable_rollback": True,
        "rollback_retention_days": 7,
        "tables": []  # List of tables to sync
    }
}

# Global config instance
_config = None

def load_config() -> Dict[str, Any]:
    """
    Load configuration from environment variables and config files
    
    Returns:
        Dict containing configuration settings
    """
    global _config
    
    if _config is not None:
        return _config
        
    # Start with default config
    config = DEFAULT_CONFIG.copy()
    
    # Determine environment mode (development, training, production)
    env_mode = os.environ.get("ENV_MODE", "development").lower()
    config["env_mode"] = env_mode
    logger.info(f"Environment mode: {env_mode}")
    
    # Get environment-specific suffixes
    env_suffix = "_" + env_mode.upper() if env_mode != "development" else ""
    
    # Look for environment-specific Supabase variables first, then fall back to default
    supabase_url = (
        os.environ.get(f"SUPABASE_URL{env_suffix}") or 
        os.environ.get("SUPABASE_URL")
    )
    
    supabase_key = (
        os.environ.get(f"SUPABASE_KEY{env_suffix}") or 
        os.environ.get("SUPABASE_KEY")
    )
    
    supabase_service_key = (
        os.environ.get(f"SUPABASE_SERVICE_KEY{env_suffix}") or 
        os.environ.get("SUPABASE_SERVICE_KEY", "")
    )
    
    # Environment-specific database URLs with dedicated variables for training and production
    if env_mode == "training":
        database_url = os.environ.get("DATABASE_URL_TRAINING") or os.environ.get(f"DATABASE_URL{env_suffix}") or os.environ.get("DATABASE_URL", "")
    elif env_mode == "production":
        database_url = os.environ.get("DATABASE_URL_PRODUCTION") or os.environ.get(f"DATABASE_URL{env_suffix}") or os.environ.get("DATABASE_URL", "")
    else:
        database_url = os.environ.get(f"DATABASE_URL{env_suffix}") or os.environ.get("DATABASE_URL", "")
        
    logger.info(f"Using database URL for {env_mode} environment")
    
    # Override with environment variables
    if supabase_url and supabase_key:
        config["database"]["engine"] = "postgresql"
        config["database"]["provider"] = "supabase"
        config["database"]["connection_string"] = database_url
        config["database"]["supabase_url"] = supabase_url
        config["database"]["supabase_key"] = supabase_key
        config["database"]["supabase_service_key"] = supabase_service_key
        
        # Set use_supabase flag to true
        config["use_supabase"] = True
        
        # If Supabase is configured, also use it for auth and storage
        config["auth"]["provider"] = "supabase"
        config["storage"]["provider"] = "supabase"
        
        logger.info(f"Supabase configuration detected and enabled for {env_mode} environment")
    
    # Configure training database
    if os.environ.get("TRAINING_DB_URL"):
        config["training_db"]["connection_string"] = os.environ.get("TRAINING_DB_URL")
        config["training_db"]["engine"] = os.environ.get("TRAINING_DB_ENGINE", "sqlserver")
        logger.info(f"Training database configured: {config['training_db']['engine']}")
    
    # Configure production database
    if os.environ.get("PRODUCTION_DB_URL"):
        config["production_db"]["connection_string"] = os.environ.get("PRODUCTION_DB_URL")
        config["production_db"]["engine"] = os.environ.get("PRODUCTION_DB_ENGINE", "postgresql")
        logger.info(f"Production database configured: {config['production_db']['engine']}")
    
    # Configure sync settings
    sync_interval = os.environ.get("SYNC_INTERVAL")
    if sync_interval:
        try:
            config["sync"]["interval"] = int(sync_interval)
        except ValueError:
            logger.warning(f"Invalid SYNC_INTERVAL value: {sync_interval}")
    
    if os.environ.get("SYNC_AUTO", "").lower() in ("true", "1", "yes"):
        config["sync"]["auto_sync"] = True
    
    batch_size = os.environ.get("SYNC_BATCH_SIZE")
    if batch_size:
        try:
            config["sync"]["batch_size"] = int(batch_size)
        except ValueError:
            logger.warning(f"Invalid SYNC_BATCH_SIZE value: {batch_size}")
    
    log_level = os.environ.get("SYNC_LOG_LEVEL")
    if log_level:
        config["sync"]["log_level"] = log_level.upper()
    
    if os.environ.get("SYNC_ENABLE_CHANGE_TRACKING", "").lower() in ("false", "0", "no"):
        config["sync"]["enable_change_tracking"] = False
    
    if os.environ.get("SYNC_ENABLE_ROLLBACK", "").lower() in ("false", "0", "no"):
        config["sync"]["enable_rollback"] = False
    
    rollback_days = os.environ.get("SYNC_ROLLBACK_RETENTION_DAYS")
    if rollback_days:
        try:
            config["sync"]["rollback_retention_days"] = int(rollback_days)
        except ValueError:
            logger.warning(f"Invalid SYNC_ROLLBACK_RETENTION_DAYS value: {rollback_days}")
    
    # Allow bypassing authentication for development
    if os.environ.get("BYPASS_LDAP", "").lower() == "true":
        config["auth"]["bypass_auth"] = True
        
    # Try to load config from JSON file if it exists
    config_file = os.environ.get("CONFIG_FILE", "config.json")
    if os.path.exists(config_file):
        try:
            with open(config_file, "r") as f:
                file_config = json.load(f)
                
            # Deep merge the configurations
            for section, values in file_config.items():
                if section in config:
                    if isinstance(config[section], dict) and isinstance(values, dict):
                        config[section].update(values)
                    else:
                        config[section] = values
                else:
                    config[section] = values
                    
            logger.info(f"Loaded configuration from {config_file}")
        except Exception as e:
            logger.error(f"Error loading config file {config_file}: {str(e)}")
    
    # Load sync tables configuration if specified by file path
    sync_tables_file = os.environ.get("SYNC_TABLES_FILE")
    if sync_tables_file and os.path.exists(sync_tables_file):
        try:
            with open(sync_tables_file, "r") as f:
                config["sync"]["tables"] = json.load(f)
            logger.info(f"Loaded sync tables configuration from {sync_tables_file}")
        except Exception as e:
            logger.error(f"Error loading sync tables file {sync_tables_file}: {str(e)}")
    
    _config = config
    return config

def get_config(section: Optional[str] = None, key: Optional[str] = None) -> Any:
    """
    Get configuration value(s)
    
    Args:
        section: Configuration section name (optional)
        key: Configuration key within section (optional)
        
    Returns:
        Config value, section, or entire config depending on args
    """
    config = load_config()
    
    if section is None:
        return config
        
    if section not in config:
        return None
        
    if key is None:
        return config[section]
        
    return config[section].get(key)

def get_database_config() -> Dict[str, Any]:
    """
    Get database configuration
    
    Returns:
        Dict with database configuration
    """
    return get_config("database")

def get_training_db_config() -> Dict[str, Any]:
    """
    Get training database configuration
    
    Returns:
        Dict with training database configuration
    """
    return get_config("training_db")

def get_production_db_config() -> Dict[str, Any]:
    """
    Get production database configuration
    
    Returns:
        Dict with production database configuration
    """
    return get_config("production_db")
    
def get_source_db_config() -> Dict[str, Any]:
    """
    Get source database configuration based on environment mode
    
    Returns:
        Dict with source database configuration
    """
    env_mode = get_config("env_mode")
    if env_mode == "production":
        return get_production_db_config()
    else:
        return get_training_db_config()

def get_auth_config() -> Dict[str, Any]:
    """
    Get authentication configuration
    
    Returns:
        Dict with auth configuration
    """
    return get_config("auth")

def get_storage_config() -> Dict[str, Any]:
    """
    Get file storage configuration
    
    Returns:
        Dict with storage configuration
    """
    return get_config("storage")

def get_sync_config() -> Dict[str, Any]:
    """
    Get data synchronization configuration
    
    Returns:
        Dict with sync configuration
    """
    return get_config("sync")

def is_development_mode() -> bool:
    """
    Check if application is running in development mode
    
    Returns:
        True if in development mode, False otherwise
    """
    return get_config("auth", "bypass_auth") is True or os.environ.get("BYPASS_LDAP", "").lower() == "true"

def is_supabase_enabled() -> bool:
    """
    Check if Supabase integration is enabled
    
    Returns:
        True if Supabase is configured, False otherwise
    """
    # First check for the top-level use_supabase flag
    if get_config().get("use_supabase") is True:
        return True
        
    # Fallback to checking database configuration
    db_config = get_database_config()
    if not db_config:
        return False
        
    return db_config.get("provider") == "supabase" and "supabase_url" in db_config and "supabase_key" in db_config