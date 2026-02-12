"""
Unit tests for the SQLite export functionality.
"""
import os
import unittest
import tempfile
import pandas as pd
import sqlite3
import shutil
from datetime import datetime

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from sync_service.sqlite_export import SQLiteExporter

class TestSQLiteExporter(unittest.TestCase):
    """Test cases for the SQLite exporter."""
    
    def setUp(self):
        """Set up test fixtures."""
        # Create a temporary directory for exports
        self.test_export_dir = tempfile.mkdtemp()
        self.exporter = SQLiteExporter(self.test_export_dir)
        
        # Create sample dataframes for testing
        self.stats_df = pd.DataFrame({
            'id': [1, 2, 3],
            'use_code': ['R', 'C', 'I'],
            'acres': [1.5, 2.7, 3.2],
            'assessed_value': [150000, 270000, 320000],
            'last_update': [datetime.now(), datetime.now(), datetime.now()]
        })
        
        self.working_df = pd.DataFrame({
            'id': [1, 2, 3],
            'owner': ['John Doe', 'Jane Smith', 'Acme Corp'],
            'use_code': ['R', 'C', 'I'],
            'parcel_id': ['123-45-678', '234-56-789', '345-67-890'],
            'last_update': [datetime.now(), datetime.now(), datetime.now()]
        })
    
    def tearDown(self):
        """Tear down test fixtures."""
        # Remove the temporary directory
        shutil.rmtree(self.test_export_dir)
    
    def test_create_and_load_stats_db(self):
        """Test creating and loading a stats database."""
        db_path = self.exporter.create_and_load_stats_db(self.stats_df)
        
        # Verify the file was created
        self.assertTrue(os.path.exists(db_path))
        
        # Verify the symlink was created
        symlink_path = os.path.join(self.test_export_dir, "stats_db.sqlite")
        self.assertTrue(os.path.exists(symlink_path))
        
        # Verify the data was inserted correctly
        with sqlite3.connect(db_path) as conn:
            df = pd.read_sql("SELECT * FROM stats", conn)
            self.assertEqual(len(df), 3)
            self.assertEqual(list(df['id']), [1, 2, 3])
            self.assertEqual(list(df['use_code']), ['R', 'C', 'I'])
    
    def test_create_and_load_working_db(self):
        """Test creating and loading a working database."""
        db_path = self.exporter.create_and_load_working_db(self.working_df)
        
        # Verify the file was created
        self.assertTrue(os.path.exists(db_path))
        
        # Verify the symlink was created
        symlink_path = os.path.join(self.test_export_dir, "working_db.sqlite")
        self.assertTrue(os.path.exists(symlink_path))
        
        # Verify the data was inserted correctly
        with sqlite3.connect(db_path) as conn:
            df = pd.read_sql("SELECT * FROM working", conn)
            self.assertEqual(len(df), 3)
            self.assertEqual(list(df['id']), [1, 2, 3])
            self.assertEqual(list(df['owner']), ['John Doe', 'Jane Smith', 'Acme Corp'])
    
    def test_append_to_working_db(self):
        """Test appending data to an existing working database."""
        # First create a database
        db_path = self.exporter.create_and_load_working_db(self.working_df)
        
        # Create new data to append
        new_data = pd.DataFrame({
            'id': [4, 5],
            'owner': ['Bob Johnson', 'Widgets Inc'],
            'use_code': ['R', 'C'],
            'parcel_id': ['456-78-901', '567-89-012'],
            'last_update': [datetime.now(), datetime.now()]
        })
        
        # Append the new data
        self.exporter.append_to_working_db(new_data, db_path)
        
        # Verify the data was appended correctly
        with sqlite3.connect(db_path) as conn:
            df = pd.read_sql("SELECT * FROM working", conn)
            self.assertEqual(len(df), 5)
            self.assertEqual(list(df['id']), [1, 2, 3, 4, 5])
    
    def test_merge_with_working_db(self):
        """Test merging data with an existing working database."""
        # First create a database
        db_path = self.exporter.create_and_load_working_db(self.working_df)
        
        # Create new data to merge (with one updated record and one new record)
        now = datetime.now()
        merge_data = pd.DataFrame({
            'id': [2, 4],
            'owner': ['Jane Smith-Updated', 'New Owner'],
            'use_code': ['R', 'I'],
            'parcel_id': ['234-56-789', '456-78-901'],
            'last_update': [now, now]
        })
        
        # Merge the new data
        self.exporter.merge_with_working_db(merge_data, ['id'], db_path)
        
        # Verify the data was merged correctly
        with sqlite3.connect(db_path) as conn:
            df = pd.read_sql("SELECT * FROM working ORDER BY id", conn)
            self.assertEqual(len(df), 4)
            self.assertEqual(list(df['id']), [1, 2, 3, 4])
            # Verify the updated record
            self.assertEqual(df.loc[df['id'] == 2, 'owner'].iloc[0], 'Jane Smith-Updated')
            # Verify the new record
            self.assertEqual(df.loc[df['id'] == 4, 'owner'].iloc[0], 'New Owner')
    
    def test_merge_with_stats_db(self):
        """Test merging data with an existing stats database."""
        # First create a database
        db_path = self.exporter.create_and_load_stats_db(self.stats_df)
        
        # Create new data to merge (with one updated record and one new record)
        now = datetime.now()
        merge_data = pd.DataFrame({
            'id': [2, 4],
            'use_code': ['C-Updated', 'R'],
            'acres': [3.0, 1.2],
            'assessed_value': [300000, 120000],
            'last_update': [now, now]
        })
        
        # Merge the new data
        self.exporter.merge_with_stats_db(merge_data, ['id'], db_path)
        
        # Verify the data was merged correctly
        with sqlite3.connect(db_path) as conn:
            df = pd.read_sql("SELECT * FROM stats ORDER BY id", conn)
            self.assertEqual(len(df), 4)
            self.assertEqual(list(df['id']), [1, 2, 3, 4])
            # Verify the updated record
            self.assertEqual(df.loc[df['id'] == 2, 'use_code'].iloc[0], 'C-Updated')
            # Verify the new record
            self.assertEqual(df.loc[df['id'] == 4, 'assessed_value'].iloc[0], 120000)

if __name__ == '__main__':
    unittest.main()