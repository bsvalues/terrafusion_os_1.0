"""
SQLite Export Module for the CountyDataSync ETL Process.

This module provides functionality for exporting data from DataFrames to SQLite databases
instead of CSV files, which allows for better performance and query capabilities.
"""
import os
import logging
import pandas as pd
import sqlite3
import datetime
from typing import Dict, Any, Optional, Union, List

# Configure pandas to display all columns
pd.set_option('display.max_columns', None)

# Set up logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

class SQLiteExporter:
    """Class for handling exports to SQLite databases."""
    
    def __init__(self, export_dir: str = 'exports'):
        """Initialize the SQLite exporter.
        
        Args:
            export_dir: Directory where SQLite database files will be stored.
        """
        self.export_dir = export_dir
        self._ensure_export_dir()
        
    def _ensure_export_dir(self):
        """Ensure the export directory exists."""
        if not os.path.exists(self.export_dir):
            os.makedirs(self.export_dir)
            logger.info(f"Created export directory: {self.export_dir}")
    
    def create_and_load_stats_db(self, df_stats: pd.DataFrame) -> str:
        """Create a SQLite database file and load statistics data.
        
        Args:
            df_stats: DataFrame containing statistics data.
            
        Returns:
            Path to the created SQLite database file.
        """
        # Generate a database file path
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        db_path = os.path.join(self.export_dir, f"stats_db_{timestamp}.sqlite")
        
        logger.info(f"Creating stats database at {db_path}")
        
        # Connect to SQLite database
        with sqlite3.connect(db_path) as conn:
            # Write the DataFrame to the SQLite database
            df_stats.to_sql('stats', conn, if_exists='replace', index=False)
            
            # Create indexes for better query performance
            cursor = conn.cursor()
            # Create appropriate indexes based on the dataframe columns
            # Try to identify good index candidates like ID fields, use_code, etc.
            if 'id' in df_stats.columns:
                cursor.execute("CREATE INDEX IF NOT EXISTS idx_stats_id ON stats(id)")
            if 'use_code' in df_stats.columns:
                cursor.execute("CREATE INDEX IF NOT EXISTS idx_stats_use_code ON stats(use_code)")
            if 'parcel_id' in df_stats.columns:
                cursor.execute("CREATE INDEX IF NOT EXISTS idx_stats_parcel_id ON stats(parcel_id)")
            
            # Create a symlink to the latest database
            latest_link = os.path.join(self.export_dir, "stats_db.sqlite")
            if os.path.exists(latest_link):
                os.remove(latest_link)
            os.symlink(db_path, latest_link)
            
            logger.info(f"Successfully exported {len(df_stats)} records to stats database")
            
        return db_path
    
    def create_and_load_working_db(self, df_working: pd.DataFrame) -> str:
        """Create a SQLite database file and load working data.
        
        Args:
            df_working: DataFrame containing working data.
            
        Returns:
            Path to the created SQLite database file.
        """
        # Generate a database file path
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        db_path = os.path.join(self.export_dir, f"working_db_{timestamp}.sqlite")
        
        logger.info(f"Creating working database at {db_path}")
        
        # Connect to SQLite database
        with sqlite3.connect(db_path) as conn:
            # Write the DataFrame to the SQLite database
            df_working.to_sql('working', conn, if_exists='replace', index=False)
            
            # Create indexes for better query performance
            cursor = conn.cursor()
            # Create appropriate indexes based on the dataframe columns
            if 'id' in df_working.columns:
                cursor.execute("CREATE INDEX IF NOT EXISTS idx_working_id ON working(id)")
            if 'owner' in df_working.columns:
                cursor.execute("CREATE INDEX IF NOT EXISTS idx_working_owner ON working(owner)")
            if 'use_code' in df_working.columns:
                cursor.execute("CREATE INDEX IF NOT EXISTS idx_working_use_code ON working(use_code)")
            if 'parcel_id' in df_working.columns:
                cursor.execute("CREATE INDEX IF NOT EXISTS idx_working_parcel_id ON working(parcel_id)")
            
            # Create a symlink to the latest database
            latest_link = os.path.join(self.export_dir, "working_db.sqlite")
            if os.path.exists(latest_link):
                os.remove(latest_link)
            os.symlink(db_path, latest_link)
            
            logger.info(f"Successfully exported {len(df_working)} records to working database")
            
        return db_path
    
    def append_to_working_db(self, df_working: pd.DataFrame, db_path: Optional[str] = None) -> str:
        """Append data to an existing working database or create a new one.
        
        This method is used for incremental updates to avoid re-creating the entire database.
        
        Args:
            df_working: DataFrame containing working data to append.
            db_path: Optional path to an existing SQLite database. If not provided,
                     the latest working database will be used.
                     
        Returns:
            Path to the updated SQLite database file.
        """
        if db_path is None:
            db_path = os.path.join(self.export_dir, "working_db.sqlite")
            
        if not os.path.exists(db_path):
            # If the database doesn't exist, create a new one
            return self.create_and_load_working_db(df_working)
        
        logger.info(f"Appending {len(df_working)} records to working database at {db_path}")
        
        # Connect to SQLite database
        with sqlite3.connect(db_path) as conn:
            # Append the DataFrame to the SQLite database
            df_working.to_sql('working', conn, if_exists='append', index=False)
            logger.info(f"Successfully appended {len(df_working)} records to working database")
            
        return db_path
    
    def append_to_stats_db(self, df_stats: pd.DataFrame, db_path: Optional[str] = None) -> str:
        """Append data to an existing stats database or create a new one.
        
        This method is used for incremental updates to avoid re-creating the entire database.
        
        Args:
            df_stats: DataFrame containing stats data to append.
            db_path: Optional path to an existing SQLite database. If not provided,
                     the latest stats database will be used.
                     
        Returns:
            Path to the updated SQLite database file.
        """
        if db_path is None:
            db_path = os.path.join(self.export_dir, "stats_db.sqlite")
            
        if not os.path.exists(db_path):
            # If the database doesn't exist, create a new one
            return self.create_and_load_stats_db(df_stats)
        
        logger.info(f"Appending {len(df_stats)} records to stats database at {db_path}")
        
        # Connect to SQLite database
        with sqlite3.connect(db_path) as conn:
            # Append the DataFrame to the SQLite database
            df_stats.to_sql('stats', conn, if_exists='append', index=False)
            logger.info(f"Successfully appended {len(df_stats)} records to stats database")
            
        return db_path
    
    def merge_with_working_db(self, df_working: pd.DataFrame, key_columns: List[str], db_path: Optional[str] = None) -> str:
        """Merge (upsert) data with an existing working database based on key columns.
        
        This method is used for incremental updates where we need to update existing records
        or insert new ones based on a set of key columns.
        
        Args:
            df_working: DataFrame containing working data to merge.
            key_columns: List of column names that form the unique key.
            db_path: Optional path to an existing SQLite database. If not provided,
                     the latest working database will be used.
                     
        Returns:
            Path to the updated SQLite database file.
        """
        if db_path is None:
            db_path = os.path.join(self.export_dir, "working_db.sqlite")
            
        if not os.path.exists(db_path):
            # If the database doesn't exist, create a new one
            return self.create_and_load_working_db(df_working)
        
        logger.info(f"Merging {len(df_working)} records with working database at {db_path}")
        
        # Connect to SQLite database
        with sqlite3.connect(db_path) as conn:
            # Read existing data
            existing_df = pd.read_sql("SELECT * FROM working", conn)
            
            # Merge dataframes - this is a more complex operation
            # We'll iterate through records and insert/update as needed
            cursor = conn.cursor()
            
            for _, row in df_working.iterrows():
                # Convert any datetime objects to strings for SQLite compatibility
                row_dict = {}
                for col in df_working.columns:
                    if isinstance(row[col], (pd.Timestamp, datetime.datetime)):
                        row_dict[col] = row[col].strftime('%Y-%m-%d %H:%M:%S')
                    else:
                        row_dict[col] = row[col]
                
                # Build WHERE clause for key columns
                where_conditions = " AND ".join([f"{col} = ?" for col in key_columns])
                params = [row_dict[col] for col in key_columns]
                
                # Check if record exists
                cursor.execute(f"SELECT 1 FROM working WHERE {where_conditions}", params)
                exists = cursor.fetchone() is not None
                
                if exists:
                    # Update existing record
                    set_clause = ", ".join([f"{col} = ?" for col in df_working.columns if col not in key_columns])
                    update_params = [row_dict[col] for col in df_working.columns if col not in key_columns]
                    cursor.execute(f"UPDATE working SET {set_clause} WHERE {where_conditions}", update_params + params)
                else:
                    # Insert new record
                    cols = ", ".join(df_working.columns)
                    placeholders = ", ".join(["?" for _ in df_working.columns])
                    insert_params = [row_dict[col] for col in df_working.columns]
                    cursor.execute(f"INSERT INTO working ({cols}) VALUES ({placeholders})", insert_params)
            
            conn.commit()
            logger.info(f"Successfully merged {len(df_working)} records with working database")
            
        return db_path
    
    def merge_with_stats_db(self, df_stats: pd.DataFrame, key_columns: List[str], db_path: Optional[str] = None) -> str:
        """Merge (upsert) data with an existing stats database based on key columns.
        
        This method is used for incremental updates where we need to update existing records
        or insert new ones based on a set of key columns.
        
        Args:
            df_stats: DataFrame containing stats data to merge.
            key_columns: List of column names that form the unique key.
            db_path: Optional path to an existing SQLite database. If not provided,
                     the latest stats database will be used.
                     
        Returns:
            Path to the updated SQLite database file.
        """
        if db_path is None:
            db_path = os.path.join(self.export_dir, "stats_db.sqlite")
            
        if not os.path.exists(db_path):
            # If the database doesn't exist, create a new one
            return self.create_and_load_stats_db(df_stats)
        
        logger.info(f"Merging {len(df_stats)} records with stats database at {db_path}")
        
        # Connect to SQLite database
        with sqlite3.connect(db_path) as conn:
            # Read existing data
            existing_df = pd.read_sql("SELECT * FROM stats", conn)
            
            # Merge dataframes
            cursor = conn.cursor()
            
            for _, row in df_stats.iterrows():
                # Convert any datetime objects to strings for SQLite compatibility
                row_dict = {}
                for col in df_stats.columns:
                    if isinstance(row[col], (pd.Timestamp, datetime.datetime)):
                        row_dict[col] = row[col].strftime('%Y-%m-%d %H:%M:%S')
                    else:
                        row_dict[col] = row[col]
                
                # Build WHERE clause for key columns
                where_conditions = " AND ".join([f"{col} = ?" for col in key_columns])
                params = [row_dict[col] for col in key_columns]
                
                # Check if record exists
                cursor.execute(f"SELECT 1 FROM stats WHERE {where_conditions}", params)
                exists = cursor.fetchone() is not None
                
                if exists:
                    # Update existing record
                    set_clause = ", ".join([f"{col} = ?" for col in df_stats.columns if col not in key_columns])
                    update_params = [row_dict[col] for col in df_stats.columns if col not in key_columns]
                    cursor.execute(f"UPDATE stats SET {set_clause} WHERE {where_conditions}", update_params + params)
                else:
                    # Insert new record
                    cols = ", ".join(df_stats.columns)
                    placeholders = ", ".join(["?" for _ in df_stats.columns])
                    insert_params = [row_dict[col] for col in df_stats.columns]
                    cursor.execute(f"INSERT INTO stats ({cols}) VALUES ({placeholders})", insert_params)
            
            conn.commit()
            logger.info(f"Successfully merged {len(df_stats)} records with stats database")
            
        return db_path