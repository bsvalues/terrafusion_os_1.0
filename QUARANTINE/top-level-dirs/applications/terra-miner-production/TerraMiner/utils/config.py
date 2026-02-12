import os
import json
import logging

logger = logging.getLogger(__name__)

def load_config(config_file=None):
    """
    Load configuration from a JSON file or create default config if not found.
    
    Args:
        config_file (str, optional): Path to the configuration file
        
    Returns:
        dict: Configuration data
    """
    if config_file is None:
        config_file = "config.json"
    
    # Default configuration
    default_config = {
        "narrpr": {
            "username": "",
            "password": "",
            "base_url": "https://www.narrpr.com",
            "headless": True,
            "timeout": 30
        },
        "scraping": {
            "wait_time": 5,
            "retry_attempts": 3,
            "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        },
        "database": {
            "host": os.getenv("PGHOST", "localhost"),
            "port": os.getenv("PGPORT", "5432"),
            "user": os.getenv("PGUSER", "postgres"),
            "password": os.getenv("PGPASSWORD", ""),
            "database": os.getenv("PGDATABASE", "real_estate")
        },
        "output": {
            "csv_directory": "output",
            "report_directory": "reports"
        }
    }
    
    try:
        # Check if config file exists
        if os.path.exists(config_file):
            with open(config_file, 'r') as f:
                config = json.load(f)
                logger.info(f"Configuration loaded from {config_file}")
                
                # Merge with default config to ensure all required fields exist
                for section in default_config:
                    if section not in config:
                        config[section] = default_config[section]
                    else:
                        for key in default_config[section]:
                            if key not in config[section]:
                                config[section][key] = default_config[section][key]
                
                return config
        else:
            # Create default config file
            with open(config_file, 'w') as f:
                json.dump(default_config, f, indent=4)
                logger.info(f"Default configuration created at {config_file}")
            return default_config
            
    except Exception as e:
        logger.error(f"Error loading configuration: {str(e)}")
        return default_config

def update_config(config_data, config_file=None):
    """
    Update the configuration file with new data.
    
    Args:
        config_data (dict): New configuration data
        config_file (str, optional): Path to the configuration file
        
    Returns:
        bool: True if successful, False otherwise
    """
    if config_file is None:
        config_file = "config.json"
    
    try:
        # Load existing config first
        existing_config = load_config(config_file)
        
        # Update with new data
        for section in config_data:
            if section in existing_config:
                existing_config[section].update(config_data[section])
            else:
                existing_config[section] = config_data[section]
        
        # Save updated config
        with open(config_file, 'w') as f:
            json.dump(existing_config, f, indent=4)
            logger.info(f"Configuration updated in {config_file}")
        
        return True
        
    except Exception as e:
        logger.error(f"Error updating configuration: {str(e)}")
        return False
