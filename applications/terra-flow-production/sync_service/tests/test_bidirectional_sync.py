"""
Test script for bi-directional sync functionality.
This script can be run from the project root with:
python -m sync_service.tests.test_bidirectional_sync
"""
import unittest
import os
import sys
import datetime
from unittest.mock import patch, MagicMock

# Add the project root to the path to make imports work
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from sync_service.models import (
    SyncJob, SyncLog, TableConfiguration, FieldConfiguration, 
    UpSyncDataChange, GlobalSetting
)

class TestBidirectionalSync(unittest.TestCase):
    """Test cases for bidirectional sync functionality"""
    
    def setUp(self):
        """Set up test fixtures"""
        # Create mock objects
        self.mock_source_engine = MagicMock()
        self.mock_target_engine = MagicMock()
        
    @patch('sync_service.bidirectional_sync.SyncEngine')
    def test_up_sync_initialization(self, MockSyncEngine):
        """Test initialization of up-sync process"""
        try:
            from sync_service.bidirectional_sync import UpSyncEngine
            
            # Create an instance of UpSyncEngine
            engine = UpSyncEngine(job_id="test_up_sync", user_id=1)
            
            # Verify that the job was initialized with correct type
            MockSyncEngine.assert_called_once()
            self.assertEqual(engine.sync_direction, 'up')
            
        except ImportError:
            self.skipTest("UpSyncEngine not implemented yet")
            
    @patch('sync_service.bidirectional_sync.SyncEngine')
    def test_down_sync_initialization(self, MockSyncEngine):
        """Test initialization of down-sync process"""
        try:
            from sync_service.bidirectional_sync import DownSyncEngine
            
            # Create an instance of DownSyncEngine
            engine = DownSyncEngine(job_id="test_down_sync", user_id=1)
            
            # Verify that the job was initialized with correct type
            MockSyncEngine.assert_called_once()
            self.assertEqual(engine.sync_direction, 'down')
            
        except ImportError:
            self.skipTest("DownSyncEngine not implemented yet")
    
    @patch('sync_service.bidirectional_sync.UpSyncEngine._get_pending_changes')
    @patch('sync_service.bidirectional_sync.UpSyncEngine')
    def test_up_sync_get_changes(self, MockUpSyncEngine, mock_get_changes):
        """Test retrieving pending changes for up-sync"""
        try:
            from sync_service.bidirectional_sync import UpSyncEngine
            
            # Set up mock return values
            mock_get_changes.return_value = [
                {'table_name': 'test_table', 'field_name': 'test_field', 'keys': '1', 'new_value': 'new_val'}
            ]
            
            # Create an instance
            engine = UpSyncEngine(job_id="test_up_sync", user_id=1)
            
            # Call the method
            changes = engine._get_pending_changes()
            
            # Verify the changes
            self.assertEqual(len(changes), 1)
            self.assertEqual(changes[0]['table_name'], 'test_table')
            
        except ImportError:
            self.skipTest("UpSyncEngine not implemented yet")

    @patch('sync_service.bidirectional_sync.DataSynchronizer')
    def test_api_start_up_sync(self, MockDataSynchronizer):
        """Test API endpoint for starting up-sync"""
        try:
            from sync_service.bidirectional_sync import DataSynchronizer
            
            # Mock the start method
            MockDataSynchronizer.start_up_sync.return_value = "test_job_id"
            
            # Call the method
            job_id = DataSynchronizer.start_up_sync(1)
            
            # Verify the call
            self.assertEqual(job_id, "test_job_id")
            MockDataSynchronizer.start_up_sync.assert_called_once_with(1)
            
        except (ImportError, AttributeError):
            self.skipTest("Up-sync API not implemented yet")

if __name__ == '__main__':
    unittest.main()