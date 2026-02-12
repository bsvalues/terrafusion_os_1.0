import os
import logging
import pandas as pd
from sqlalchemy import create_engine, MetaData, Table, Column, Integer, String, Float, DateTime, Text, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

# Configure logger
logger = logging.getLogger(__name__)

# Get database connection details from environment variables with fallbacks
DB_USER = os.getenv('PGUSER', 'postgres')
DB_PASSWORD = os.getenv('PGPASSWORD', 'postgres')
DB_HOST = os.getenv('PGHOST', 'localhost')
DB_PORT = os.getenv('PGPORT', '5432')
DB_NAME = os.getenv('PGDATABASE', 'real_estate')

# Create database URL
DB_URL = os.getenv('DATABASE_URL', f'postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}')

# Import the SQLAlchemy instance from app.py
import sys
import os
from flask import current_app
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
try:
    from app import db
    Base = db.Model
    metadata = db.metadata
    logger.info("Successfully imported SQLAlchemy db instance from app")
except ImportError as e:
    logger.warning(f"Could not import db from app, using local instances: {str(e)}")
    # Fall back to local instances if import fails
    Base = declarative_base()
    metadata = MetaData()

# Define tables
narrpr_reports = Table(
    'narrpr_reports', 
    metadata,
    Column('id', Integer, primary_key=True),
    Column('title', String(255)),
    Column('date', String(50)),
    Column('address', String(255)),
    Column('price', String(50)),
    Column('created_at', DateTime, default=datetime.now),
    extend_existing=True,
)

class Database:
    """
    Class to handle database operations for the ETL workflow.
    """
    
    def __init__(self, db_url=None):
        """
        Initialize the database connection.
        
        Args:
            db_url (str, optional): Database connection URL
        """
        if db_url is None:
            db_url = DB_URL
        
        try:
            self.engine = create_engine(db_url)
            metadata.create_all(self.engine)
            Session = sessionmaker(bind=self.engine)
            self.session = Session()
            logger.info("Database connection established")
        except Exception as e:
            logger.error(f"Database connection error: {str(e)}")
            raise
    
    def close(self):
        """Close the database session."""
        if hasattr(self, 'session'):
            self.session.close()
            logger.info("Database session closed")
    
    def save_data(self, data, table_name):
        """
        Save data to the specified table.
        
        Args:
            data (list): List of dictionaries containing data
            table_name (str): Name of the table to save data to
            
        Returns:
            bool: True if successful, False otherwise
        """
        if not data:
            logger.warning("No data to save to database")
            return False
        
        try:
            # Convert data to DataFrame
            df = pd.DataFrame(data)
            
            # Add timestamp
            df['created_at'] = datetime.now()
            
            # Save to database
            df.to_sql(table_name, self.engine, if_exists='append', index=False)
            
            logger.info(f"Data saved to {table_name} table")
            return True
            
        except Exception as e:
            logger.error(f"Error saving data to database: {str(e)}")
            return False
    
    def execute_query(self, query_str):
        """
        Execute a SQL query.
        
        Args:
            query_str (str): SQL query to execute
            
        Returns:
            list: Query results for SELECT queries, empty list for non-SELECT queries
        """
        try:
            # Use SQLAlchemy's text() function to properly handle raw SQL
            sql = text(query_str)
            result = self.session.execute(sql)
            self.session.commit()
            
            # Check if this is a SELECT query that returns rows
            query_type = query_str.strip().upper()[:6]
            if query_type.startswith("SELECT"):
                # Convert result to list of dictionaries
                try:
                    columns = result.keys()
                    data = [dict(zip(columns, row)) for row in result]
                    return data
                except Exception as e:
                    logger.warning(f"Could not convert query results: {str(e)}")
                    return []
            else:
                # For non-SELECT queries (INSERT, UPDATE, DELETE, CREATE)
                return []
            
        except Exception as e:
            self.session.rollback()
            logger.error(f"Query execution error: {str(e)}")
            return []

# Function to save data to database (for easier integration with other modules)
def save_to_database(data, table_name="narrpr_reports"):
    """
    Save data to the specified database table.
    
    Args:
        data (list): List of dictionaries containing data
        table_name (str): Name of the table to save data to
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        db = Database()
        result = db.save_data(data, table_name)
        db.close()
        return result
    except Exception as e:
        logger.error(f"Error in save_to_database: {str(e)}")
        return False
