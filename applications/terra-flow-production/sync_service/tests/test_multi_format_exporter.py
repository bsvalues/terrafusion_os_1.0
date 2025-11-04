"""
Unit tests for the multi-format exporter functionality.
"""
import os
import unittest
import tempfile
import shutil
import sqlite3
import json
import pandas as pd
from datetime import datetime

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from sync_service.multi_format_exporter import MultiFormatExporter

class TestMultiFormatExporter(unittest.TestCase):
    """Test cases for the multi-format exporter."""
    
    def setUp(self):
        """Set up test fixtures."""
        # Create temporary directory for exports
        self.test_dir = tempfile.mkdtemp()
        
        # Initialize the exporter
        self.exporter = MultiFormatExporter(self.test_dir)
        
        # Create sample data
        self.sample_df = pd.DataFrame({
            'id': [1, 2, 3],
            'name': ['Alice', 'Bob', 'Charlie'],
            'age': [25, 30, 35],
            'created_at': [datetime.now() for _ in range(3)]
        })
    
    def tearDown(self):
        """Tear down test fixtures."""
        # Remove the temporary directory
        shutil.rmtree(self.test_dir)
    
    def test_sqlite_export(self):
        """Test exporting data to SQLite format."""
        # Export the data
        db_path = self.exporter.export_data(self.sample_df, 'test', 'sqlite')
        
        # Verify the file was created
        self.assertTrue(os.path.exists(db_path))
        
        # Verify the data was correctly exported
        with sqlite3.connect(db_path) as conn:
            df = pd.read_sql("SELECT * FROM test", conn)
            self.assertEqual(len(df), 3)
            self.assertEqual(list(df['name']), ['Alice', 'Bob', 'Charlie'])
    
    def test_csv_export(self):
        """Test exporting data to CSV format."""
        # Export the data
        csv_path = self.exporter.export_data(self.sample_df, 'test', 'csv')
        
        # Verify the file was created
        self.assertTrue(os.path.exists(csv_path))
        
        # Verify the data was correctly exported
        df = pd.read_csv(csv_path)
        self.assertEqual(len(df), 3)
        self.assertEqual(list(df['name']), ['Alice', 'Bob', 'Charlie'])
    
    def test_json_export(self):
        """Test exporting data to JSON format."""
        # Export the data
        json_path = self.exporter.export_data(self.sample_df, 'test', 'json')
        
        # Verify the file was created
        self.assertTrue(os.path.exists(json_path))
        
        # Verify the data was correctly exported
        with open(json_path, 'r') as f:
            data = json.load(f)
            self.assertEqual(len(data), 3)
            self.assertEqual([record['name'] for record in data], ['Alice', 'Bob', 'Charlie'])
    
    def test_multi_format_export(self):
        """Test exporting data to multiple formats at once."""
        # Export the data to multiple formats
        results = self.exporter.export_data_multi_format(
            self.sample_df, 
            'test', 
            ['sqlite', 'csv', 'json']
        )
        
        # Verify the files were created
        self.assertTrue(os.path.exists(results['sqlite']))
        self.assertTrue(os.path.exists(results['csv']))
        self.assertTrue(os.path.exists(results['json']))
        
        # Verify the data was correctly exported to each format
        # SQLite
        with sqlite3.connect(results['sqlite']) as conn:
            df = pd.read_sql("SELECT * FROM test", conn)
            self.assertEqual(len(df), 3)
        
        # CSV
        df = pd.read_csv(results['csv'])
        self.assertEqual(len(df), 3)
        
        # JSON
        with open(results['json'], 'r') as f:
            data = json.load(f)
            self.assertEqual(len(data), 3)
    
    def test_merge_sqlite(self):
        """Test merging data with an existing SQLite file."""
        # First export the initial data
        initial_path = self.exporter.export_data(self.sample_df, 'test', 'sqlite')
        
        # Create new data to merge (with one updated record and one new record)
        merge_df = pd.DataFrame({
            'id': [2, 4],
            'name': ['Bob Smith', 'David'],
            'age': [31, 40],
            'created_at': [datetime.now() for _ in range(2)]
        })
        
        # Merge the data
        merged_path = self.exporter.merge_data(merge_df, 'test', 'sqlite', ['id'])
        
        # Verify the data was correctly merged
        with sqlite3.connect(merged_path) as conn:
            df = pd.read_sql("SELECT * FROM test ORDER BY id", conn)
            self.assertEqual(len(df), 4)  # Original 3 + 1 new
            
            # Verify the updated record
            self.assertEqual(df.loc[df['id'] == 2, 'name'].iloc[0], 'Bob Smith')
            self.assertEqual(df.loc[df['id'] == 2, 'age'].iloc[0], 31)
            
            # Verify the new record
            self.assertEqual(df.loc[df['id'] == 4, 'name'].iloc[0], 'David')
    
    def test_merge_csv(self):
        """Test merging data with an existing CSV file."""
        # First export the initial data
        initial_path = self.exporter.export_data(self.sample_df, 'test', 'csv')
        
        # Create new data to merge (with one updated record and one new record)
        merge_df = pd.DataFrame({
            'id': [2, 4],
            'name': ['Bob Smith', 'David'],
            'age': [31, 40],
            'created_at': [datetime.now() for _ in range(2)]
        })
        
        # Merge the data
        merged_path = self.exporter.merge_data(merge_df, 'test', 'csv', ['id'])
        
        # Verify the data was correctly merged
        df = pd.read_csv(merged_path)
        self.assertEqual(len(df), 4)  # Original 3 + 1 new
        
        # Verify the updated record
        self.assertEqual(df.loc[df['id'] == 2, 'name'].iloc[0], 'Bob Smith')
        self.assertEqual(df.loc[df['id'] == 2, 'age'].iloc[0], 31)
        
        # Verify the new record
        self.assertEqual(df.loc[df['id'] == 4, 'name'].iloc[0], 'David')
    
    def test_merge_json(self):
        """Test merging data with an existing JSON file."""
        # First export the initial data
        initial_path = self.exporter.export_data(self.sample_df, 'test', 'json')
        
        # Create new data to merge (with one updated record and one new record)
        merge_df = pd.DataFrame({
            'id': [2, 4],
            'name': ['Bob Smith', 'David'],
            'age': [31, 40],
            'created_at': [datetime.now() for _ in range(2)]
        })
        
        # Merge the data
        merged_path = self.exporter.merge_data(merge_df, 'test', 'json', ['id'])
        
        # Verify the data was correctly merged
        df = pd.read_json(merged_path, orient='records')
        self.assertEqual(len(df), 4)  # Original 3 + 1 new
        
        # Verify the updated record
        self.assertEqual(df.loc[df['id'] == 2, 'name'].iloc[0], 'Bob Smith')
        self.assertEqual(df.loc[df['id'] == 2, 'age'].iloc[0], 31)
        
        # Verify the new record
        self.assertEqual(df.loc[df['id'] == 4, 'name'].iloc[0], 'David')
        
if __name__ == '__main__':
    unittest.main()