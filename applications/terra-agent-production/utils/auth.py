import os
import logging
from dotenv import load_dotenv

load_dotenv()

# Get logger
logger = logging.getLogger("pacs_assistant")

def get_sql_connection_string():
    """
    Get a PostgreSQL connection string using environment variables.
    Uses DATABASE_URL environment variable set up by the Replit PostgreSQL database.
    
    Returns:
        str: SQL connection string
    """
    try:
        # Get connection string from environment variable
        conn_str = os.getenv('DATABASE_URL')
        
        if not conn_str:
            # Construct connection string from individual parameters if DATABASE_URL not set
            host = os.getenv('PGHOST')
            port = os.getenv('PGPORT')
            user = os.getenv('PGUSER')
            password = os.getenv('PGPASSWORD')
            database = os.getenv('PGDATABASE')
            
            if not all([host, port, user, password, database]):
                raise ValueError("PostgreSQL connection details not found in environment variables")
            
            conn_str = f"postgresql://{user}:{password}@{host}:{port}/{database}"
        
        # Log success but don't log the actual connection string (contains password)
        logger.info("PostgreSQL connection string created successfully")
        return conn_str
        
    except Exception as e:
        logger.error(f"Cannot create connection string: {str(e)}")
        raise ValueError(f"Database authentication failed and no fallback credentials available")
