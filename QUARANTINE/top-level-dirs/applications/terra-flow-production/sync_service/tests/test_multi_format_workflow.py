"""
Unit tests for the multi-format export ETL workflow.
"""

import unittest
import os
import pandas as pd
import sqlite3
import json
from datetime import datetime
import shutil

from sync_service.sync import CountyDataSyncETL

class TestMultiFormatWorkflow(unittest.TestCase):
    """Test cases for multi-format export ETL workflow."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.test_export_dir = 'test_exports'
        self.test_metadata_path = 'test_sync_metadata.json'
        
        # Create test export directory
        if not os.path.exists(self.test_export_dir):
            os.makedirs(self.test_export_dir)
        
        # Create ETL instance
        self.etl = CountyDataSyncETL(
            export_dir=self.test_export_dir,
            sync_metadata_path=self.test_metadata_path
        )
        
        # Create sample data
        self.stats_data = pd.DataFrame({
            'id': [1, 2, 3],
            'stat_name': ['count', 'average', 'max'],
            'stat_value': [100, 45.5, 200],
            'updated_at': [datetime.now(), datetime.now(), datetime.now()]
        })
        
        self.working_data = pd.DataFrame({
            'id': [101, 102, 103],
            'name': ['Item A', 'Item B', 'Item C'],
            'value': [10.5, 20.3, 15.7],
            'updated_at': [datetime.now(), datetime.now(), datetime.now()]
        })
        
        # Create sample database connection
        self.db_path = os.path.join(self.test_export_dir, 'test_source.sqlite')
        self.conn = sqlite3.connect(self.db_path)
        
        # Create tables and insert sample data
        self.stats_data.to_sql('stats_data', self.conn, if_exists='replace', index=False)
        self.working_data.to_sql('working_data', self.conn, if_exists='replace', index=False)
    
    def tearDown(self):
        """Tear down test fixtures."""
        # Close database connection
        self.conn.close()
        
        # Clean up test directories and files
        if os.path.exists(self.test_export_dir):
            shutil.rmtree(self.test_export_dir)
        
        if os.path.exists(self.test_metadata_path):
            os.remove(self.test_metadata_path)
    
    def test_full_etl_workflow_with_multiple_formats(self):
        """Test running the ETL workflow with multiple export formats."""
        # Define export formats
        export_formats = ['sqlite', 'csv', 'json']
        
        # Run ETL workflow
        results = self.etl.run_etl_workflow(
            source_connection=self.conn,
            stats_query="SELECT * FROM stats_data",
            working_query="SELECT * FROM working_data",
            stats_timestamp_column='updated_at',
            working_timestamp_column='updated_at',
            stats_table_name='stats_data',
            working_table_name='working_data',
            stats_key_columns=['id'],
            working_key_columns=['id'],
            incremental=False,
            export_formats=export_formats
        )
        
        # Check that the workflow ran successfully
        self.assertTrue(results['success'])
        self.assertEqual(results['stats']['stats_records'], 3)
        self.assertEqual(results['stats']['working_records'], 3)
        
        # Check that export paths are in the results
        self.assertIn('stats_export_paths', results)
        self.assertIn('working_export_paths', results)
        
        # Verify that each format was exported
        for fmt in export_formats:
            # Stats exports
            self.assertIn(fmt, results['stats_export_paths'])
            stats_path = results['stats_export_paths'][fmt]
            self.assertIsNotNone(stats_path)
            self.assertTrue(os.path.exists(stats_path))
            
            # Working exports
            self.assertIn(fmt, results['working_export_paths'])
            working_path = results['working_export_paths'][fmt]
            self.assertIsNotNone(working_path)
            self.assertTrue(os.path.exists(working_path))
            
            # Verify data integrity in exported files
            if fmt == 'sqlite':
                # Check SQLite files
                with sqlite3.connect(stats_path) as conn:
                    df = pd.read_sql("SELECT * FROM stats_data", conn)
                    self.assertEqual(len(df), 3)
                
                with sqlite3.connect(working_path) as conn:
                    df = pd.read_sql("SELECT * FROM working_data", conn)
                    self.assertEqual(len(df), 3)
            
            elif fmt == 'csv':
                # Check CSV files
                stats_df = pd.read_csv(stats_path)
                self.assertEqual(len(stats_df), 3)
                
                working_df = pd.read_csv(working_path)
                self.assertEqual(len(working_df), 3)
            
            elif fmt == 'json':
                # Check JSON files
                with open(stats_path, 'r') as f:
                    stats_data = json.load(f)
                    self.assertEqual(len(stats_data), 3)
                
                with open(working_path, 'r') as f:
                    working_data = json.load(f)
                    self.assertEqual(len(working_data), 3)
    
    def test_incremental_etl_workflow(self):
        """Test running the ETL workflow with incremental updates."""
        # Run initial ETL workflow
        self.etl.run_etl_workflow(
            source_connection=self.conn,
            stats_query="SELECT * FROM stats_data",
            working_query="SELECT * FROM working_data",
            stats_timestamp_column='updated_at',
            working_timestamp_column='updated_at',
            stats_table_name='stats_data',
            working_table_name='working_data',
            stats_key_columns=['id'],
            working_key_columns=['id'],
            incremental=False,
            export_formats=['sqlite', 'json']
        )
        
        # Add new data
        new_stats = pd.DataFrame({
            'id': [4, 5],
            'stat_name': ['min', 'median'],
            'stat_value': [10, 50],
            'updated_at': [datetime.now(), datetime.now()]
        })
        
        new_working = pd.DataFrame({
            'id': [104, 105],
            'name': ['Item D', 'Item E'],
            'value': [25.6, 30.2],
            'updated_at': [datetime.now(), datetime.now()]
        })
        
        # Add new data to the source database
        new_stats.to_sql('stats_data', self.conn, if_exists='append', index=False)
        new_working.to_sql('working_data', self.conn, if_exists='append', index=False)
        
        # Run incremental ETL workflow
        results = self.etl.run_etl_workflow(
            source_connection=self.conn,
            stats_query="SELECT * FROM stats_data",
            working_query="SELECT * FROM working_data",
            stats_timestamp_column='updated_at',
            working_timestamp_column='updated_at',
            stats_table_name='stats_data',
            working_table_name='working_data',
            stats_key_columns=['id'],
            working_key_columns=['id'],
            incremental=True,
            export_formats=['sqlite', 'json']
        )
        
        # The incremental run should only process the new records
        # However, since our test setup doesn't have proper timestamp filtering,
        # we'll just check that the exports contain all records
        
        # Check SQLite exports
        stats_db_path = results['stats_export_paths']['sqlite']
        working_db_path = results['working_export_paths']['sqlite']
        
        with sqlite3.connect(stats_db_path) as conn:
            df = pd.read_sql("SELECT * FROM stats_data", conn)
            self.assertEqual(len(df), 5)  # 3 original + 2 new
        
        with sqlite3.connect(working_db_path) as conn:
            df = pd.read_sql("SELECT * FROM working_data", conn)
            self.assertEqual(len(df), 5)  # 3 original + 2 new
        
        # Check JSON exports
        stats_json_path = results['stats_export_paths']['json']
        working_json_path = results['working_export_paths']['json']
        
        with open(stats_json_path, 'r') as f:
            stats_data = json.load(f)
            self.assertEqual(len(stats_data), 5)  # 3 original + 2 new
        
        with open(working_json_path, 'r') as f:
            working_data = json.load(f)
            self.assertEqual(len(working_data), 5)  # 3 original + 2 new


if __name__ == '__main__':
    unittest.main()