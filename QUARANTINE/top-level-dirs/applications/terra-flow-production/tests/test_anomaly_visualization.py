"""
Unit tests for the Anomaly Visualization system
"""

import unittest
import os
import sys
import json
from unittest.mock import patch, MagicMock, Mock

# Add the parent directory to the path so we can import the application modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app, db
from setup_anomaly_visualization import setup_visualization_prerequisites


class TestAnomalyVisualization(unittest.TestCase):
    """Test cases for the Anomaly Visualization system"""
    
    def setUp(self):
        """Set up test fixtures"""
        # Configure app for testing
        app.config['TESTING'] = True
        app.config['WTF_CSRF_ENABLED'] = False
        
        # Create a test client
        self.client = app.test_client()
        
        # Mock database calls
        self.db_patcher = patch('app.db.session')
        self.mock_db_session = self.db_patcher.start()
    
    def tearDown(self):
        """Tear down test fixtures"""
        # Stop the patches
        self.db_patcher.stop()
    
    def test_anomaly_map_page(self):
        """Test accessing the anomaly map visualization page"""
        # Mock the database queries used in the route
        mock_execute = self.mock_db_session.execute
        mock_execute.return_value.scalar.side_effect = [10, 20]  # Parcel count, anomaly count
        
        # Access the anomaly map page
        response = self.client.get('/visualizations/anomaly-map')
        
        # Check response
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Real-time Geospatial Anomaly Visualization', response.data)
    
    def test_api_get_anomalies(self):
        """Test the API endpoint for getting anomalies"""
        # Create mock anomaly data
        mock_anomalies = [
            {
                "id": 1,
                "anomaly_type": "outlier",
                "severity": "critical",
                "table_name": "parcels",
                "field_name": "land_value",
                "record_id": "P12345",
                "detected_at": "2025-04-18T12:00:00",
                "anomaly_score": 0.95,
                "status": "open"
            },
            {
                "id": 2,
                "anomaly_type": "missing_data",
                "severity": "high",
                "table_name": "parcels",
                "field_name": "owner_name",
                "record_id": "P67890",
                "detected_at": "2025-04-18T13:30:00",
                "anomaly_score": 0.85,
                "status": "open"
            }
        ]
        
        # Mock the database query
        mock_execute = self.mock_db_session.execute
        mock_execute.return_value.mappings.return_value.all.return_value = mock_anomalies
        
        # Call the API endpoint
        response = self.client.get('/api/anomalies')
        
        # Check response
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(len(data['anomalies']), 2)
        self.assertEqual(data['anomalies'][0]['id'], 1)
        self.assertEqual(data['anomalies'][1]['id'], 2)
    
    def test_setup_visualization(self):
        """Test setting up the visualization prerequisites"""
        # Mock the functions called by setup_visualization_prerequisites
        with patch('setup_anomaly_visualization.create_parcels_table', return_value=True) as mock_create_parcels:
            with patch('setup_anomaly_visualization.create_data_anomaly_table', return_value=True) as mock_create_anomaly:
                with patch('setup_anomaly_visualization.generate_sample_parcels') as mock_gen_parcels:
                    with patch('setup_anomaly_visualization.generate_sample_anomalies') as mock_gen_anomalies:
                        with patch('setup_anomaly_visualization.app.app_context'):
                            # Mock db.session.execute().scalar() to return counts
                            mock_execute = self.mock_db_session.execute
                            mock_execute.return_value.scalar.side_effect = [100, 200]  # Parcel count, anomaly count
                            
                            # Run the setup function
                            result = setup_visualization_prerequisites()
                            
                            # Verify that all the necessary functions were called
                            mock_create_parcels.assert_called_once()
                            mock_create_anomaly.assert_called_once()
                            mock_gen_parcels.assert_called_once()
                            mock_gen_anomalies.assert_called_once()
                            
                            # Verify the result
                            self.assertTrue(result)
    
    def test_api_get_parcel_anomalies(self):
        """Test getting anomalies for a specific parcel"""
        # Create mock anomaly data
        mock_anomalies = [
            {
                "id": 1,
                "anomaly_type": "outlier",
                "severity": "critical",
                "table_name": "parcels",
                "field_name": "land_value",
                "record_id": "P12345",
                "detected_at": "2025-04-18T12:00:00",
                "anomaly_score": 0.95,
                "status": "open"
            }
        ]
        
        # Mock the database query
        mock_execute = self.mock_db_session.execute
        mock_execute.return_value.mappings.return_value.all.return_value = mock_anomalies
        
        # Call the API endpoint
        response = self.client.get('/api/parcels/P12345/anomalies')
        
        # Check response
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(len(data['anomalies']), 1)
        self.assertEqual(data['anomalies'][0]['id'], 1)
        self.assertEqual(data['anomalies'][0]['record_id'], "P12345")
    
    def test_api_anomaly_stats(self):
        """Test getting anomaly statistics"""
        # Mock statistics data
        mock_stats = {
            "total": 100,
            "by_severity": {
                "critical": 20,
                "high": 30,
                "medium": 40,
                "low": 10
            },
            "by_type": {
                "outlier": 40,
                "missing_data": 25,
                "data_drift": 20,
                "format_error": 15
            }
        }
        
        # Mock the database query
        mock_execute = self.mock_db_session.execute
        mock_execute.return_value.scalar.side_effect = [
            100,  # Total count
            20, 30, 40, 10,  # Counts by severity
            40, 25, 20, 15   # Counts by type
        ]
        
        # Call the API endpoint
        response = self.client.get('/api/anomalies/stats')
        
        # Check response
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['total'], 100)
        self.assertEqual(data['by_severity']['critical'], 20)
        self.assertEqual(data['by_type']['outlier'], 40)


if __name__ == '__main__':
    unittest.main()