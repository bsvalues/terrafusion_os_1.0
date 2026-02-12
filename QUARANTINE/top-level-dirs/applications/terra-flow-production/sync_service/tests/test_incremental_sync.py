"""
Unit tests for the incremental sync functionality.
"""
import os
import unittest
import tempfile
import json
import pandas as pd
from datetime import datetime, timedelta

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from sync_service.incremental_sync import IncrementalSyncManager

class TestIncrementalSyncManager(unittest.TestCase):
    """Test cases for the incremental sync manager."""
    
    def setUp(self):
        """Set up test fixtures."""
        # Create a temporary file for sync metadata
        fd, self.test_metadata_path = tempfile.mkstemp()
        os.close(fd)
        
        # Initialize the sync manager
        self.sync_manager = IncrementalSyncManager(self.test_metadata_path)
        
        # Create sample dataframes for testing
        self.now = datetime.utcnow()
        self.one_hour_ago = self.now - timedelta(hours=1)
        self.two_hours_ago = self.now - timedelta(hours=2)
        
        # Create a dataframe with timestamps
        self.test_df = pd.DataFrame({
            'id': [1, 2, 3, 4, 5],
            'name': ['A', 'B', 'C', 'D', 'E'],
            'updated_at': [
                self.two_hours_ago,
                self.two_hours_ago,
                self.one_hour_ago,
                self.one_hour_ago,
                self.now
            ]
        })
    
    def tearDown(self):
        """Tear down test fixtures."""
        # Remove the temporary file
        os.unlink(self.test_metadata_path)
    
    def test_initialize_metadata(self):
        """Test initializing metadata."""
        # Metadata should be initialized during setUp
        
        # Verify the structure
        self.assertIn('last_sync_time', self.sync_manager.metadata)
        self.assertIn('record_counts', self.sync_manager.metadata)
        self.assertEqual(self.sync_manager.metadata['record_counts']['total_processed'], 0)
        
        # Verify the file was created
        self.assertTrue(os.path.exists(self.test_metadata_path))
        
        # Read the file to verify content
        with open(self.test_metadata_path, 'r') as f:
            metadata = json.load(f)
            self.assertIn('last_sync_time', metadata)
            self.assertIn('record_counts', metadata)
    
    def test_get_last_sync_time(self):
        """Test getting the last sync time."""
        # Initially, there should be no sync time
        self.assertIsNone(self.sync_manager.get_last_sync_time())
        
        # Set a sync time
        test_time = datetime.utcnow()
        self.sync_manager.metadata['last_sync_time'] = test_time
        self.sync_manager._save_metadata(self.sync_manager.metadata)
        
        # Get and verify the sync time
        # Note: Datetime objects are serialized to strings
        retrieved_time = self.sync_manager.get_last_sync_time()
        self.assertIsNotNone(retrieved_time)
        
        # Compare with small delta due to serialization/deserialization
        if isinstance(retrieved_time, datetime):
            delta = abs((retrieved_time - test_time).total_seconds())
            self.assertLess(delta, 1.0)
        else:
            self.fail("Retrieved time is not a datetime object")
    
    def test_update_sync_time(self):
        """Test updating the sync time."""
        # Update the sync time
        self.sync_manager.update_sync_time()
        
        # Verify it was updated
        self.assertIsNotNone(self.sync_manager.get_last_sync_time())
        
        # Update with table name
        self.sync_manager.update_sync_time('test_table')
        
        # Verify table-specific time was updated
        self.assertIsNotNone(self.sync_manager.get_last_sync_time('test_table'))
    
    def test_filter_changed_records(self):
        """Test filtering changed records."""
        # Set a sync time between our test timestamps
        self.sync_manager.metadata['last_sync_time'] = self.one_hour_ago
        self.sync_manager._save_metadata(self.sync_manager.metadata)
        
        # Filter records
        filtered_df = self.sync_manager.filter_changed_records(
            self.test_df, 'updated_at', 'test_table')
        
        # Only the most recent record should be returned
        self.assertEqual(len(filtered_df), 1)
        self.assertEqual(filtered_df.iloc[0]['id'], 5)
        
        # Test without a previous sync time
        self.sync_manager.metadata['last_sync_time'] = None
        self.sync_manager._save_metadata(self.sync_manager.metadata)
        
        filtered_df = self.sync_manager.filter_changed_records(
            self.test_df, 'updated_at', 'test_table')
        
        # All records should be returned
        self.assertEqual(len(filtered_df), 5)
    
    def test_get_changed_record_ids(self):
        """Test getting IDs of changed records."""
        # Set a sync time between our test timestamps
        self.sync_manager.metadata['last_sync_time'] = self.one_hour_ago
        self.sync_manager._save_metadata(self.sync_manager.metadata)
        
        # Get IDs of changed records
        changed_ids = self.sync_manager.get_changed_record_ids(
            self.test_df, 'updated_at', 'id', 'test_table')
        
        # Only the ID of the most recent record should be returned
        self.assertEqual(len(changed_ids), 1)
        self.assertEqual(changed_ids[0], 5)
    
    def test_update_record_counts(self):
        """Test updating record counts."""
        # Update counts
        self.sync_manager.update_record_counts(inserted=10, updated=5)
        
        # Verify global counts
        self.assertEqual(self.sync_manager.metadata['record_counts']['total_inserted'], 10)
        self.assertEqual(self.sync_manager.metadata['record_counts']['total_updated'], 5)
        self.assertEqual(self.sync_manager.metadata['record_counts']['total_processed'], 15)
        
        # Update with table name
        self.sync_manager.update_record_counts(inserted=2, updated=3, table_name='test_table')
        
        # Verify table-specific counts
        table_counts = self.sync_manager.metadata['tables_synced']['test_table']['record_counts']
        self.assertEqual(table_counts['inserted'], 2)
        self.assertEqual(table_counts['updated'], 3)
        self.assertEqual(table_counts['processed'], 5)
        
        # Verify global counts were also updated
        self.assertEqual(self.sync_manager.metadata['record_counts']['total_inserted'], 12)
        self.assertEqual(self.sync_manager.metadata['record_counts']['total_updated'], 8)
    
    def test_get_sync_statistics(self):
        """Test getting sync statistics."""
        # Set up some data
        self.sync_manager.update_sync_time()
        self.sync_manager.update_record_counts(inserted=10, updated=5)
        self.sync_manager.update_sync_time('table1')
        self.sync_manager.update_sync_time('table2')
        
        # Get statistics
        stats = self.sync_manager.get_sync_statistics()
        
        # Verify structure
        self.assertIn('last_sync_time', stats)
        self.assertIn('record_counts', stats)
        self.assertIn('total_tables_synced', stats)
        self.assertEqual(stats['total_tables_synced'], 2)
        self.assertEqual(stats['record_counts']['total_inserted'], 10)
        self.assertEqual(stats['record_counts']['total_updated'], 5)

if __name__ == '__main__':
    unittest.main()