"""
Tests for the Sync Engine
"""
import unittest
import datetime
from unittest.mock import patch, MagicMock

# Import the module to test
from sync_service.sync_engine import SyncEngine

class TestSyncEngine(unittest.TestCase):
    """Test cases for the Sync Engine"""

    @patch('sync_service.sync_engine.SyncJob')
    @patch('sync_service.sync_engine.db')
    @patch('sync_service.sync_engine.sa')
    def test_initialize_job(self, mock_sa, mock_db, mock_sync_job):
        """Test initialization of a sync job"""
        # Setup
        mock_query = MagicMock()
        mock_sync_job.query.return_value = mock_query
        mock_query.filter_by.return_value = mock_query
        mock_query.first.return_value = None
        
        # Create a sync engine
        engine = SyncEngine(job_id="test_job", user_id=1)
        
        # Assertions
        mock_sync_job.query.filter_by.assert_called_once_with(job_id="test_job")
        mock_db.session.add.assert_called_once()
        mock_db.session.commit.assert_called_once()
        
    @patch('sync_service.sync_engine.SyncJob')
    @patch('sync_service.sync_engine.db')
    @patch('sync_service.sync_engine.sa')
    @patch('sync_service.sync_engine.SyncLog')
    def test_log_creation(self, mock_sync_log, mock_db, mock_sa, mock_sync_job):
        """Test log creation"""
        # Setup
        mock_query = MagicMock()
        mock_sync_job.query.return_value = mock_query
        mock_query.filter_by.return_value = mock_query
        mock_query.first.return_value = None
        
        # Create a sync engine
        engine = SyncEngine(job_id="test_job", user_id=1)
        
        # Reset mock to check the next call
        mock_db.session.add.reset_mock()
        mock_db.session.commit.reset_mock()
        
        # Call log method
        engine.log("Test message", level="INFO", component="Test")
        
        # Assertions
        mock_db.session.add.assert_called_once()
        mock_db.session.commit.assert_called_once()
        mock_sync_log.assert_called_once()
        
    @patch('sync_service.sync_engine.SyncJob')
    @patch('sync_service.sync_engine.db')
    @patch('sync_service.sync_engine.sa')
    @patch('sync_service.sync_engine.TableConfiguration')
    def test_get_tables_to_sync(self, mock_table_config, mock_sa, mock_db, mock_sync_job):
        """Test retrieving tables to sync"""
        # Setup
        mock_query = MagicMock()
        mock_sync_job.query.return_value = mock_query
        mock_query.filter_by.return_value = mock_query
        mock_query.first.return_value = None
        
        mock_table_query = MagicMock()
        mock_table_config.query.return_value = mock_table_query
        mock_table_query.order_by.return_value = mock_table_query
        mock_table_query.all.return_value = ["table1", "table2"]
        
        # Create a sync engine
        engine = SyncEngine(job_id="test_job", user_id=1)
        
        # Call the method
        tables = engine._get_tables_to_sync()
        
        # Assertions
        self.assertEqual(tables, ["table1", "table2"])
        mock_table_config.query.order_by.assert_called_once()

if __name__ == '__main__':
    unittest.main()