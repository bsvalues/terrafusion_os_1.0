import unittest
from unittest.mock import MagicMock, patch
import datetime
import sqlalchemy as sa

from sync_service.database_project_sync import DatabaseProjectSyncService, SyncJob, SyncLog, SyncConflict, GlobalSetting


class TestDatabaseProjectSyncService(unittest.TestCase):
    """Unit tests for the DatabaseProjectSyncService."""

    def setUp(self):
        """Set up test fixtures before each test."""
        # Mock session and connections
        self.mock_session = MagicMock()
        self.mock_source_engine = MagicMock()
        self.mock_target_engine = MagicMock()
        self.mock_source_conn = MagicMock()
        self.mock_target_conn = MagicMock()
        
        # Create a test instance
        self.sync_service = DatabaseProjectSyncService(
            source_connection_string="postgresql://test:test@localhost/source_db",
            target_connection_string="postgresql://test:test@localhost/target_db",
            user_id=1,
            conflict_strategy="source_wins",
            schema_validation=True,
            auto_migration=True,
            batch_size=100
        )
        
        # Replace the actual session with our mock
        self.sync_service.session = self.mock_session
        
        # Mock the create_engine method to return our mock engines
        self.patch_create_engine = patch('sync_service.database_project_sync.sa.create_engine')
        self.mock_create_engine = self.patch_create_engine.start()
        self.mock_create_engine.side_effect = [self.mock_source_engine, self.mock_target_engine]
        
        # Mock the connect method on the engines to return our mock connections
        self.mock_source_engine.connect.return_value.__enter__.return_value = self.mock_source_conn
        self.mock_target_engine.connect.return_value.__enter__.return_value = self.mock_target_conn

    def tearDown(self):
        """Tear down test fixtures after each test."""
        self.patch_create_engine.stop()

    def test_init(self):
        """Test constructor sets properties correctly."""
        self.assertEqual(self.sync_service.source_connection_string, "postgresql://test:test@localhost/source_db")
        self.assertEqual(self.sync_service.target_connection_string, "postgresql://test:test@localhost/target_db")
        self.assertEqual(self.sync_service.user_id, 1)
        self.assertEqual(self.sync_service.conflict_strategy, "source_wins")
        self.assertTrue(self.sync_service.schema_validation)
        self.assertTrue(self.sync_service.auto_migration)
        self.assertEqual(self.sync_service.batch_size, 100)

    @patch('sync_service.database_project_sync.uuid.uuid4')
    def test_start_sync(self, mock_uuid):
        """Test starting a sync job creates the right records."""
        # Set up mocks
        mock_uuid.return_value = "test-job-id"
        mock_now = datetime.datetime(2025, 4, 24, 0, 0, 0)
        
        with patch('sync_service.database_project_sync.datetime.datetime') as mock_datetime:
            mock_datetime.utcnow.return_value = mock_now
            
            # Execute the method
            job_id = self.sync_service.start_sync(async_mode=False)
            
            # Assert the job was created correctly
            self.mock_session.add.assert_called()
            self.mock_session.commit.assert_called()
            
            # Check job ID is returned
            self.assertEqual(job_id, "test-job-id")
            
            # Check sync_in_progress flag is set correctly
            self.assertFalse(self.sync_service.sync_in_progress)

    def test_validate_schema(self):
        """Test schema validation logic."""
        # Mock the necessary methods and objects
        self.mock_source_conn.execute.return_value = [
            ("table1", "id", "integer", "NO"),
            ("table1", "name", "character varying", "YES"),
            ("table2", "id", "integer", "NO"),
            ("table2", "description", "text", "YES")
        ]
        
        self.mock_target_conn.execute.return_value = [
            ("table1", "id", "integer", "NO"),
            ("table1", "name", "character varying", "YES"),
            # Table 2 missing
        ]
        
        # Call the method
        result = self.sync_service.validate_schema()
        
        # Assert the validation found the missing table
        self.assertFalse(result.valid)
        self.assertEqual(len(result.missing_tables), 1)
        self.assertEqual(result.missing_tables[0], "table2")

    @patch('sync_service.database_project_sync.datetime.datetime')
    def test_sync_data_no_conflicts(self, mock_datetime):
        """Test sync process with no conflicts."""
        # Set up mock time
        mock_now = datetime.datetime(2025, 4, 24, 0, 0, 0)
        mock_datetime.utcnow.return_value = mock_now
        
        # Set up mock job
        mock_job = MagicMock()
        mock_job.job_id = "test-job-id"
        self.sync_service.current_job = mock_job
        
        # Mock table configuration
        mock_table_config = MagicMock()
        mock_table_config.name = "test_table"
        
        # Mock source data
        self.mock_source_conn.execute.return_value = [
            {"id": 1, "name": "Test 1", "updated_at": mock_now},
            {"id": 2, "name": "Test 2", "updated_at": mock_now}
        ]
        
        # Mock target data
        self.mock_target_conn.execute.return_value = []
        
        # Call the method
        self.sync_service.sync_data("test_table", ["id"], mock_table_config)
        
        # Verify inserts were made to target
        self.mock_target_conn.execute.assert_called()
        
        # Verify no conflicts were created
        mock_job.error_records = 0
        
        # Verify processed_records was updated
        mock_job.processed_records = 2
        mock_job.total_records = 2

    @patch('sync_service.database_project_sync.datetime.datetime')
    def test_sync_data_with_conflicts(self, mock_datetime):
        """Test sync process with conflicts."""
        # Set up mock time
        mock_now = datetime.datetime(2025, 4, 24, 0, 0, 0)
        mock_datetime.utcnow.return_value = mock_now
        
        # Set up mock job
        mock_job = MagicMock()
        mock_job.job_id = "test-job-id"
        self.sync_service.current_job = mock_job
        
        # Mock table configuration
        mock_table_config = MagicMock()
        mock_table_config.name = "test_table"
        
        # Mock source data
        self.mock_source_conn.execute.return_value = [
            {"id": 1, "name": "Test 1 Source", "updated_at": mock_now}
        ]
        
        # Mock target data
        self.mock_target_conn.execute.return_value = [
            {"id": 1, "name": "Test 1 Target", "updated_at": mock_now - datetime.timedelta(days=1)}
        ]
        
        # Call the method
        self.sync_service.sync_data("test_table", ["id"], mock_table_config)
        
        # Verify conflict was created
        self.mock_session.add.assert_called()
        
        # Verify error_records was updated
        mock_job.error_records = 1
        
        # Verify processed_records was updated
        mock_job.processed_records = 1
        mock_job.total_records = 1

    def test_detection_algorithm(self):
        """Test conflict detection algorithm."""
        # Test exact match (no conflict)
        source_record = {"id": 1, "name": "Test", "active": True}
        target_record = {"id": 1, "name": "Test", "active": True}
        
        is_conflict, diff = self.sync_service._detect_conflict(source_record, target_record)
        self.assertFalse(is_conflict)
        self.assertEqual(diff, {})
        
        # Test different values (conflict)
        source_record = {"id": 1, "name": "Test Source", "active": True}
        target_record = {"id": 1, "name": "Test Target", "active": False}
        
        is_conflict, diff = self.sync_service._detect_conflict(source_record, target_record)
        self.assertTrue(is_conflict)
        self.assertEqual(diff, {
            "name": {"source": "Test Source", "target": "Test Target"},
            "active": {"source": True, "target": False}
        })
        
        # Test extra fields in source (no conflict, just different schemas)
        source_record = {"id": 1, "name": "Test", "active": True, "extra_field": "Extra"}
        target_record = {"id": 1, "name": "Test", "active": True}
        
        is_conflict, diff = self.sync_service._detect_conflict(source_record, target_record)
        self.assertTrue(is_conflict)  # Still a conflict because schemas differ
        self.assertEqual(diff, {"extra_field": {"source": "Extra", "target": None}})
        
        # Test null values in target (conflict)
        source_record = {"id": 1, "name": "Test", "active": True}
        target_record = {"id": 1, "name": None, "active": True}
        
        is_conflict, diff = self.sync_service._detect_conflict(source_record, target_record)
        self.assertTrue(is_conflict)
        self.assertEqual(diff, {"name": {"source": "Test", "target": None}})

    def test_resolve_conflict_source_wins(self):
        """Test conflict resolution with source wins strategy."""
        # Create a test conflict
        conflict = MagicMock()
        conflict.source_data = {"id": 1, "name": "Source Name", "active": True}
        conflict.target_data = {"id": 1, "name": "Target Name", "active": False}
        conflict.table_name = "test_table"
        conflict.record_id = "1"
        
        # Set strategy to source_wins
        self.sync_service.conflict_strategy = "source_wins"
        
        # Call the method
        resolved_data = self.sync_service._resolve_conflict(conflict)
        
        # Assert source data was used
        self.assertEqual(resolved_data, conflict.source_data)
        
        # Verify the update was executed
        self.mock_target_conn.execute.assert_called()

    def test_resolve_conflict_target_wins(self):
        """Test conflict resolution with target wins strategy."""
        # Create a test conflict
        conflict = MagicMock()
        conflict.source_data = {"id": 1, "name": "Source Name", "active": True}
        conflict.target_data = {"id": 1, "name": "Target Name", "active": False}
        conflict.table_name = "test_table"
        conflict.record_id = "1"
        
        # Set strategy to target_wins
        self.sync_service.conflict_strategy = "target_wins"
        
        # Call the method
        resolved_data = self.sync_service._resolve_conflict(conflict)
        
        # Assert target data was used
        self.assertEqual(resolved_data, conflict.target_data)
        
        # Verify no update was executed (since target already has correct data)
        self.mock_target_conn.execute.assert_not_called()

    def test_resolve_conflict_newer_wins(self):
        """Test conflict resolution with newer wins strategy."""
        # Create a test conflict with source being newer
        conflict = MagicMock()
        conflict.source_data = {
            "id": 1, 
            "name": "Source Name", 
            "active": True,
            "updated_at": datetime.datetime(2025, 4, 24)
        }
        conflict.target_data = {
            "id": 1, 
            "name": "Target Name", 
            "active": False,
            "updated_at": datetime.datetime(2025, 4, 23)
        }
        conflict.table_name = "test_table"
        conflict.record_id = "1"
        
        # Set strategy to newer_wins
        self.sync_service.conflict_strategy = "newer_wins"
        
        # Call the method
        resolved_data = self.sync_service._resolve_conflict(conflict)
        
        # Assert source data was used since it's newer
        self.assertEqual(resolved_data, conflict.source_data)
        
        # Now test with target being newer
        conflict.source_data["updated_at"] = datetime.datetime(2025, 4, 22)
        conflict.target_data["updated_at"] = datetime.datetime(2025, 4, 24)
        
        # Call the method again
        resolved_data = self.sync_service._resolve_conflict(conflict)
        
        # Assert target data was used since it's newer
        self.assertEqual(resolved_data, conflict.target_data)


if __name__ == '__main__':
    unittest.main()